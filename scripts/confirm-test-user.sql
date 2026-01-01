-- 테스트 사용자의 이메일 확인 처리
-- Supabase MCP를 통해 실행하거나 Supabase 대시보드 SQL Editor에서 실행

-- 특정 사용자의 이메일 확인 처리
UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE email = 'user1@test.com';

-- 확인
SELECT id, email, email_confirmed_at, created_at
FROM auth.users
WHERE email = 'user1@test.com';

