-- Agent 역할도 users 테이블을 조회할 수 있도록 RLS 정책 수정

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;

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

-- 새 정책: Admin만 모든 사용자 수정 가능 (agent는 수정 권한 없음)
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

COMMENT ON POLICY "Admins and agents can view all users" ON public.users
  IS 'Admin과 Agent 역할은 모든 사용자 정보를 조회할 수 있음';
