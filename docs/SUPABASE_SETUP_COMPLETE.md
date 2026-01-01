# Supabase 완전 설정 가이드 (MCP 기반)

## 📋 전체 마이그레이션 순서

모든 데이터베이스 설정을 Supabase Dashboard의 SQL Editor에서 순차적으로 실행하세요.

---

## 1️⃣ 초기 스키마 생성

**파일**: `supabase/migrations/20240101000001_initial_schema.sql`

### 실행 방법:
1. Supabase Dashboard → SQL Editor
2. New Query 클릭
3. 파일 내용 복사 후 붙여넣기
4. RUN 클릭

### 생성되는 테이블:
- ✅ `users` - 사용자 정보
- ✅ `properties` - 매물 정보
- ✅ `property_images` - 매물 이미지
- ✅ `property_tags` - 매물 태그
- ✅ `audit_logs` - 감사 로그
- ✅ `partner_info` - 파트너 정보

---

## 2️⃣ RLS 정책 설정

**파일**: `supabase/migrations/20240101000002_rls_policies.sql`

### 실행 방법:
1. Supabase Dashboard → SQL Editor
2. New Query 클릭
3. 파일 내용 복사 후 붙여넣기
4. RUN 클릭

### 설정되는 정책:
- ✅ **users**: 자신의 프로필 조회/수정, 관리자는 모든 사용자 관리
- ✅ **properties**: 공개 매물 조회, Agent/Admin 등록/수정/삭제
- ✅ **property_images**: 공개 이미지 조회, Agent/Admin 업로드/삭제
- ✅ **property_tags**: 공개 태그 조회, Agent/Admin 추가/삭제
- ✅ **audit_logs**: Admin만 조회, 시스템 자동 기록
- ✅ **partner_info**: 자신의 정보만 조회/수정, Admin은 모든 정보 관리

---

## 3️⃣ Auth 트리거 설정 (필수!)

**파일**: `supabase/migrations/20240101000003_create_auth_trigger.sql`

### 실행 방법:
1. Supabase Dashboard → SQL Editor
2. New Query 클릭
3. 파일 내용 복사 후 붙여넣기
4. RUN 클릭

### 기능:
- ✅ Auth에 사용자 생성 시 자동으로 `users` 테이블에 추가
- ✅ 기본값: `role='user'`, `tier='bronze'`, `approval_status='pending'`
- ✅ 회원가입 시 RLS 정책 우회하여 자동 INSERT

**이 트리거가 없으면 회원가입이 실패합니다!**

---

## 4️⃣ Storage 설정

### A. 버킷 생성 (수동)
1. Supabase Dashboard → Storage
2. "New bucket" 클릭
3. 버킷 설정:
   - Name: `property-images`
   - Public: ✅ 체크
4. Create bucket 클릭

### B. Storage RLS 정책 설정

**파일**: `supabase/migrations/20240101000004_storage_setup.sql`

1. Supabase Dashboard → SQL Editor
2. New Query 클릭
3. 파일 내용 복사 후 붙여넣기
4. RUN 클릭

### 설정되는 정책:
- ✅ 모든 사용자: 이미지 조회 가능
- ✅ Agent/Admin: 이미지 업로드 가능
- ✅ Agent: 자신의 이미지만 삭제/수정
- ✅ Admin: 모든 이미지 삭제/수정

---

## 5️⃣ 환경 변수 설정

### `.env.local` 파일 생성

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용 추가:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_KAKAO_MAP_API_KEY=your-kakao-map-api-key
```

### Supabase 정보 확인:
1. Supabase Dashboard → Settings → API
2. **Project URL** 복사 → `NEXT_PUBLIC_SUPABASE_URL`
3. **anon/public key** 복사 → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 6️⃣ 관리자 계정 생성

### 방법 1: Supabase Dashboard에서 생성

1. **Authentication** → **Users** → **Add user**
2. 이메일/비밀번호 입력
3. 생성 후 User ID 복사

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

### 방법 2: 회원가입 후 SQL로 승격

1. 앱에서 회원가입
2. SQL Editor에서 실행:
```sql
UPDATE public.users
SET 
  role = 'admin',
  tier = 'platinum',
  approval_status = 'approved'
WHERE email = 'your-email@example.com';
```

---

## 🧪 테스트 체크리스트

### ✅ 데이터베이스 테스트
```sql
-- 1. 테이블 생성 확인
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- 2. RLS 활성화 확인
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- 3. 트리거 확인
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public';

-- 4. Storage 버킷 확인
SELECT * FROM storage.buckets;
```

### ✅ 기능 테스트
1. **회원가입**: http://localhost:3001/auth/signup
   - 정보 입력 후 가입
   - 승인 대기 페이지로 이동 확인
   - Supabase → Table Editor → users 테이블 확인

2. **관리자 승인**:
   ```sql
   UPDATE public.users
   SET approval_status = 'approved'
   WHERE email = 'test@example.com';
   ```

3. **로그인**: http://localhost:3001/auth/login
   - 승인된 계정으로 로그인
   - 헤더에 사용자 정보 표시 확인

4. **매물 등록**: http://localhost:3001/admin/properties/new
   - 이미지 업로드 확인
   - 주소 → 좌표 자동 변환 확인

5. **권한 제어**:
   - Bronze 계정: 권리금 블러 처리
   - Silver 이상: 권리금 표시

---

## 🚨 문제 해결

### 회원가입 400 에러
**원인**: Auth 트리거가 설정되지 않음

**해결**:
```sql
-- 트리거 확인
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- 없으면 20240101000003_create_auth_trigger.sql 실행
```

### users 테이블에 데이터 없음
**원인**: 트리거가 작동하지 않음

**해결**:
1. 트리거 재생성
2. 기존 Auth 사용자 수동 추가:
```sql
INSERT INTO public.users (id, email, role, tier, approval_status)
SELECT id, email, 'user', 'bronze', 'pending'
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.users);
```

### 이미지 업로드 실패
**원인**: Storage 버킷 또는 RLS 정책 미설정

**해결**:
1. Storage → property-images 버킷 확인
2. 20240101000004_storage_setup.sql 재실행

### 권한 오류
**원인**: RLS 정책 미설정

**해결**:
1. 20240101000002_rls_policies.sql 재실행
2. RLS 활성화 확인:
```sql
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
```

---

## 📚 마이그레이션 파일 목록

| 순서 | 파일명 | 설명 | 필수 |
|------|--------|------|------|
| 1 | `20240101000001_initial_schema.sql` | 테이블 생성 | ✅ |
| 2 | `20240101000002_rls_policies.sql` | RLS 정책 설정 | ✅ |
| 3 | `20240101000003_create_auth_trigger.sql` | Auth 트리거 | ✅ |
| 4 | `20240101000004_storage_setup.sql` | Storage 정책 | ✅ |

---

## 🎯 완료 후 확인사항

- [ ] 모든 테이블 생성 완료
- [ ] RLS 정책 활성화
- [ ] Auth 트리거 작동
- [ ] Storage 버킷 생성
- [ ] 환경 변수 설정
- [ ] 관리자 계정 생성
- [ ] 회원가입 테스트 성공
- [ ] 로그인 테스트 성공
- [ ] 매물 등록 테스트 성공
- [ ] 권한 제어 테스트 성공

**모든 항목이 체크되면 배포 준비 완료!** 🚀

