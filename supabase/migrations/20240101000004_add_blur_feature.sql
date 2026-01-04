-- 매물 블러 처리 기능 추가

-- 1. properties 테이블에 is_blurred 필드 추가
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS is_blurred BOOLEAN DEFAULT FALSE;

-- 2. users 테이블에 블러 권한 설정 필드 추가
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS can_view_blurred BOOLEAN DEFAULT FALSE;

-- 3. admin_settings 테이블 생성 (블러 권한 설정용)
CREATE TABLE IF NOT EXISTS public.admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. 기본 블러 권한 설정 추가 (gold 이상 tier만 볼 수 있도록)
INSERT INTO public.admin_settings (setting_key, setting_value, description)
VALUES (
  'blur_view_min_tier',
  '{"min_tier": "gold"}'::jsonb,
  '블러 처리된 매물을 볼 수 있는 최소 tier (bronze, silver, gold, premium, platinum)'
)
ON CONFLICT (setting_key) DO NOTHING;

-- 5. 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_properties_is_blurred ON public.properties(is_blurred);
CREATE INDEX IF NOT EXISTS idx_users_can_view_blurred ON public.users(can_view_blurred);

