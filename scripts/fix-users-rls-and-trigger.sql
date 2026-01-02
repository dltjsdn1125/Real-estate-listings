-- ============================================
-- Supabase SQL Editor에서 실행할 스크립트
-- 1. 트리거 확인 및 재생성
-- 2. RLS 정책 수정 (agent도 조회 가능하게)
-- ============================================

-- ============================================
-- STEP 1: 트리거 함수 및 트리거 재생성
-- ============================================

-- 트리거 함수 재생성 (이미 있으면 덮어씀)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    full_name,
    phone,
    role,
    tier,
    approval_status,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    'user',
    'bronze',
    'pending',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 트리거 재생성
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- STEP 2: 기존 auth.users에서 누락된 users 동기화
-- ============================================

-- auth.users에 있지만 public.users에 없는 사용자 추가
INSERT INTO public.users (id, email, full_name, phone, role, tier, approval_status, created_at, updated_at)
SELECT
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', ''),
  COALESCE(au.raw_user_meta_data->>'phone', ''),
  'user',
  'bronze',
  'pending',
  COALESCE(au.created_at, NOW()),
  NOW()
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;

-- ============================================
-- STEP 3: RLS 정책 수정 (Agent도 조회 가능하게)
-- ============================================

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
DROP POLICY IF EXISTS "Admins and agents can view all users" ON public.users;

-- 새 정책: Admin과 Agent 모두 모든 사용자 조회 가능
CREATE POLICY "Admins and agents can view all users"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role IN ('admin', 'agent')
    )
  );

-- 새 정책: Admin만 모든 사용자 수정 가능
CREATE POLICY "Admins can update all users"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- ============================================
-- STEP 4: 확인 쿼리
-- ============================================

-- 트리거 확인
SELECT
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public' OR event_object_table = 'users';

-- users 테이블 데이터 확인
SELECT id, email, full_name, role, tier, approval_status, created_at
FROM public.users
ORDER BY created_at DESC
LIMIT 10;

-- auth.users와 public.users 동기화 상태 확인
SELECT
  'auth.users' as table_name, COUNT(*) as count
FROM auth.users
UNION ALL
SELECT
  'public.users' as table_name, COUNT(*) as count
FROM public.users;
