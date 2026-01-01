# ✅ 데이터베이스 설정 완료!

## 🎉 MCP Supabase로 모든 설정 완료

프로젝트: **daegu-commercial-platform** (ID: `jnpxwcmshukhkxdzicwv`)

---

## 📋 적용된 마이그레이션 (총 8개)

| # | 마이그레이션 이름 | 설명 | 상태 |
|---|------------------|------|------|
| 1 | `create_commercial_platform_schema` | 초기 스키마 생성 | ✅ |
| 2 | `setup_commercial_platform_rls` | 초기 RLS 정책 | ✅ |
| 3 | `make_created_by_nullable_for_seed_data` | created_by NULL 허용 | ✅ |
| 4 | `add_role_column_to_users` | **role 컬럼 추가** | ✅ |
| 5 | `setup_rls_policies` | Users & Properties RLS | ✅ |
| 6 | `setup_remaining_rls_policies` | 나머지 테이블 RLS | ✅ |
| 7 | `create_auth_trigger` | **Auth 트리거 (회원가입 필수!)** | ✅ |
| 8 | `storage_rls_policies` | Storage RLS | ✅ |

---

## 🗄️ 데이터베이스 구조

### 테이블 (6개) - RLS 활성화

| 테이블 | 행 수 | RLS | 설명 |
|--------|-------|-----|------|
| `users` | 0 | ✅ | 사용자 정보 (role 컬럼 포함) |
| `properties` | 5 | ✅ | 매물 정보 |
| `property_images` | 7 | ✅ | 매물 이미지 |
| `property_tags` | 11 | ✅ | 매물 태그 |
| `audit_logs` | 0 | ✅ | 감사 로그 |
| `partner_info` | 0 | ✅ | 파트너 정보 |

### 트리거 (4개)

| 트리거 이름 | 테이블 | 설명 |
|------------|--------|------|
| `on_auth_user_created` | `auth.users` | Auth 회원가입 → users 테이블 자동 추가 |
| `update_users_updated_at` | `users` | updated_at 자동 갱신 |
| `update_properties_updated_at` | `properties` | updated_at 자동 갱신 |
| `update_partner_info_updated_at` | `partner_info` | updated_at 자동 갱신 |

### Storage

| 버킷 이름 | 공개 | 파일 크기 제한 | 허용 타입 |
|----------|------|--------------|----------|
| `property-images` | ✅ | 5MB | image/* |

---

## 🔐 RLS 정책 요약

### Users 테이블
- ✅ 사용자는 자신의 프로필만 조회/수정
- ✅ 관리자는 모든 사용자 조회/수정

### Properties 테이블
- ✅ 모든 사용자는 공개 매물 조회
- ✅ Agent/Admin은 매물 등록/수정/삭제
- ✅ Agent는 자신의 매물만 관리

### Property Images & Tags
- ✅ 모든 사용자는 공개 매물의 이미지/태그 조회
- ✅ Agent/Admin은 이미지/태그 추가/삭제

### Audit Logs
- ✅ Admin만 감사 로그 조회
- ✅ 시스템 자동 기록

### Partner Info
- ✅ 사용자는 자신의 파트너 정보만 관리
- ✅ Admin은 모든 파트너 정보 관리

### Storage
- ✅ 모든 사용자는 이미지 조회
- ✅ Agent/Admin은 이미지 업로드
- ✅ Agent는 자신의 이미지만 삭제/수정

---

## 👤 관리자 계정 생성 방법

### 옵션 1: 회원가입 후 SQL로 승격 (권장)

1. **앱에서 회원가입**: http://localhost:3001/auth/signup
2. **SQL로 관리자 승격**:
   ```sql
   UPDATE public.users
   SET 
     role = 'admin',
     tier = 'platinum',
     approval_status = 'approved',
     full_name = '관리자'
   WHERE email = 'your-email@example.com';
   ```

### 옵션 2: Supabase Dashboard에서 직접 생성

1. **Authentication** → **Users** → **Add user**
2. 이메일/비밀번호 입력 후 생성
3. User ID 복사
4. **SQL Editor**에서 실행:
   ```sql
   UPDATE public.users
   SET 
     role = 'admin',
     tier = 'platinum',
     approval_status = 'approved',
     full_name = '관리자'
   WHERE id = 'user-id-here';
   ```

---

## 🧪 테스트 체크리스트

### ✅ 회원가입 테스트
```bash
# 1. 브라우저에서 접속
http://localhost:3001/auth/signup

# 2. 정보 입력 후 가입
- 이메일: test@example.com
- 비밀번호: Test123!@#
- 이름: 테스트 사용자
- 전화번호: 010-1234-5678

# 3. 승인 대기 페이지로 이동 확인
http://localhost:3001/auth/pending

# 4. Supabase에서 users 테이블 확인
- role: 'user'
- tier: 'bronze'
- approval_status: 'pending'
```

### ✅ 관리자 승인 테스트
```sql
-- SQL Editor에서 실행
UPDATE public.users
SET approval_status = 'approved'
WHERE email = 'test@example.com';
```

### ✅ 로그인 테스트
```bash
# 1. 로그인 페이지 접속
http://localhost:3001/auth/login

# 2. 승인된 계정으로 로그인
# 3. 헤더에 사용자 정보 표시 확인
```

### ✅ 권한 제어 테스트
```bash
# Bronze 계정으로 매물 상세 페이지 접속
http://localhost:3001/properties/[id]

# 예상 결과:
- 권리금: 블러 처리 ❌
- 중개사 정보: 블러 처리 ❌

# Silver 이상 계정으로 접속
# 예상 결과:
- 권리금: 표시 ✅
- 중개사 정보: 표시 ✅
```

### ✅ 매물 등록 테스트
```bash
# Admin/Agent 계정으로 로그인 후
http://localhost:3001/admin/properties/new

# 테스트 항목:
- 이미지 업로드 ✅
- 주소 → 좌표 자동 변환 ✅
- 매물 정보 입력 ✅
- 등록 완료 ✅
```

---

## 🔍 데이터베이스 검증 쿼리

```sql
-- 1. 모든 테이블 확인
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. RLS 활성화 확인
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 3. 트리거 확인
SELECT 
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public' OR event_object_schema = 'auth'
ORDER BY trigger_name;

-- 4. RLS 정책 확인
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 5. Storage 버킷 확인
SELECT id, name, public, file_size_limit, allowed_mime_types
FROM storage.buckets;

-- 6. Storage 정책 확인
SELECT 
  schemaname,
  tablename,
  policyname
FROM pg_policies
WHERE schemaname = 'storage'
ORDER BY policyname;

-- 7. 사용자 목록 확인
SELECT 
  id,
  email,
  role,
  tier,
  approval_status,
  created_at
FROM public.users
ORDER BY created_at DESC;

-- 8. 매물 목록 확인
SELECT 
  id,
  title,
  property_type,
  district,
  status,
  is_public,
  is_premium,
  created_by,
  created_at
FROM public.properties
ORDER BY created_at DESC;
```

---

## 🚨 문제 해결

### 회원가입 400 에러
**증상**: 회원가입 시 400 에러 발생

**원인**: Auth 트리거가 작동하지 않음

**해결**:
```sql
-- 트리거 확인
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- 트리거 재생성
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id, email, full_name, phone, role, tier, approval_status,
    created_at, updated_at
  ) VALUES (
    NEW.id, NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    'user', 'bronze', 'pending', NOW(), NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

### RLS 정책 오류
**증상**: 데이터 조회/수정 시 권한 오류

**원인**: RLS 정책이 올바르게 설정되지 않음

**해결**:
```sql
-- RLS 활성화 확인
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- 특정 테이블 RLS 재활성화
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
```

### 이미지 업로드 실패
**증상**: 이미지 업로드 시 403 에러

**원인**: Storage RLS 정책 또는 사용자 승인 상태 문제

**해결**:
1. 사용자 승인 상태 확인:
   ```sql
   SELECT email, role, approval_status 
   FROM public.users 
   WHERE id = auth.uid();
   ```

2. Storage 정책 확인:
   ```sql
   SELECT * FROM pg_policies 
   WHERE schemaname = 'storage';
   ```

---

## 🎯 배포 전 최종 체크리스트

- [ ] 모든 테이블 생성 완료
- [ ] RLS 정책 활성화 및 테스트
- [ ] Auth 트리거 작동 확인
- [ ] Storage 버킷 및 정책 설정
- [ ] 관리자 계정 생성
- [ ] 회원가입 테스트 성공
- [ ] 로그인 테스트 성공
- [ ] 권한 제어 테스트 성공
- [ ] 매물 등록 테스트 성공
- [ ] 이미지 업로드 테스트 성공

**모든 항목이 체크되면 배포 준비 완료!** 🚀

---

## 📚 관련 문서

- `docs/SUPABASE_SETUP_COMPLETE.md` - 상세 설정 가이드
- `docs/SUPABASE_AUTH_SETUP.md` - 인증 설정 가이드
- `docs/STORAGE_SETUP_GUIDE.md` - 스토리지 설정 가이드
- `docs/DEPLOYMENT_CHECKLIST.md` - 배포 체크리스트
- `README.md` - 프로젝트 개요 및 시작 가이드

---

**🎊 축하합니다! 모든 데이터베이스 설정이 완료되었습니다!**

이제 앱을 테스트하고 배포할 준비가 되었습니다. 문제가 발생하면 위의 문제 해결 섹션을 참고하세요.

