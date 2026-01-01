# Supabase Auth 설정 가이드

## 문제 해결: 회원가입 실패

회원가입이 실패하는 이유는 다음과 같습니다:

1. **Auth 테이블과 users 테이블 연동 문제**
   - `auth.users`에는 생성되지만 `public.users`에는 추가되지 않음
   - RLS 정책으로 인해 클라이언트에서 직접 INSERT 불가능

2. **해결 방법: Database Trigger 사용**
   - Auth 사용자 생성 시 자동으로 users 테이블에 추가

---

## 🔧 설정 방법

### 1. Supabase Dashboard에서 SQL 실행

Supabase Dashboard → SQL Editor → New Query에서 다음 SQL을 실행:

```sql
-- Auth 사용자 생성 시 자동으로 users 테이블에 추가하는 트리거

-- 1. 트리거 함수 생성
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
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. 트리거 생성
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

### 2. 회원가입 코드 수정

회원가입 시 `users` 테이블에 직접 INSERT하지 않고, Auth에만 사용자를 생성합니다.

**수정 전:**
```typescript
// 1. Auth 사용자 생성
const { data: authData } = await supabase.auth.signUp(...)

// 2. users 테이블에 추가 (❌ 이 부분이 실패함)
const { error: userError } = await supabase.from('users').insert(...)
```

**수정 후:**
```typescript
// Auth 사용자 생성만 하면 트리거가 자동으로 users 테이블에 추가
const { data: authData, error: authError } = await supabase.auth.signUp({
  email: formData.email,
  password: formData.password,
  options: {
    data: {
      full_name: formData.fullName,
      phone: formData.phone,
    },
  },
})
```

---

## 📝 RLS 정책 설정

### users 테이블 RLS 정책

1. **사용자는 자신의 프로필만 조회 가능**
```sql
CREATE POLICY "Users can view own profile"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);
```

2. **사용자는 자신의 프로필만 수정 가능** (role, tier, approval_status 제외)
```sql
CREATE POLICY "Users can update own profile"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM public.users WHERE id = auth.uid())
    AND tier = (SELECT tier FROM public.users WHERE id = auth.uid())
    AND approval_status = (SELECT approval_status FROM public.users WHERE id = auth.uid())
  );
```

3. **관리자는 모든 사용자 조회 가능**
```sql
CREATE POLICY "Admins can view all users"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );
```

4. **관리자는 모든 사용자 수정 가능**
```sql
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
  );
```

---

## 🧪 테스트

### 1. 회원가입 테스트
```typescript
// 회원가입
const { data, error } = await supabase.auth.signUp({
  email: 'test@example.com',
  password: 'password123',
  options: {
    data: {
      full_name: '홍길동',
      phone: '010-1234-5678',
    },
  },
})

// 트리거가 자동으로 users 테이블에 추가함
// approval_status: 'pending'
// tier: 'bronze'
// role: 'user'
```

### 2. users 테이블 확인
```sql
SELECT * FROM public.users WHERE email = 'test@example.com';
```

### 3. 관리자 승인
```sql
UPDATE public.users
SET approval_status = 'approved'
WHERE email = 'test@example.com';
```

---

## 🔑 환경 변수

`.env.local` 파일:
```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

---

## 🚨 문제 해결

### 회원가입 시 400 에러
- **원인**: RLS 정책으로 인해 클라이언트에서 users 테이블에 직접 INSERT 불가
- **해결**: 트리거 사용하여 Auth 생성 시 자동으로 users 테이블에 추가

### users 테이블에 데이터가 없음
- **원인**: 트리거가 설정되지 않음
- **해결**: 위의 SQL을 Supabase Dashboard에서 실행

### 로그인 후 user 정보가 null
- **원인**: approval_status가 'pending'이거나 users 테이블에 데이터가 없음
- **해결**: 관리자 페이지에서 승인 후 재로그인

---

## 📚 참고 자료

- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Supabase Triggers](https://supabase.com/docs/guides/database/postgres/triggers)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

