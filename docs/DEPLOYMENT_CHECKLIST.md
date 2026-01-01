# 배포 전 체크리스트

## ✅ Supabase 설정

### 1. Database Trigger 설정 (필수)
Supabase Dashboard → SQL Editor에서 실행:

```sql
-- Auth 사용자 생성 시 자동으로 users 테이블에 추가
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

### 2. Storage 버킷 생성
- 버킷 이름: `property-images`
- Public 설정: ✅

### 3. RLS 정책 확인
- `users` 테이블: ✅
- `properties` 테이블: ✅
- `property_images` 테이블: ✅
- `property_tags` 테이블: ✅

---

## 🔑 환경 변수 설정

### `.env.local` 파일
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_KAKAO_MAP_API_KEY=your_kakao_map_api_key
```

---

## 🧪 테스트 시나리오

### 1. 회원가입 테스트
- [ ] 회원가입 페이지 접속
- [ ] 정보 입력 후 가입
- [ ] 승인 대기 페이지로 이동 확인
- [ ] Supabase Dashboard에서 users 테이블 확인

### 2. 로그인 테스트
- [ ] 승인 전 로그인 시도 → 승인 대기 페이지
- [ ] 관리자 승인 후 로그인 → 성공

### 3. 매물 탐색 테스트
- [ ] 지도 로드 확인
- [ ] GPS 위치 추적 확인
- [ ] 필터 작동 확인
- [ ] 매물 카드 클릭 → 상세 페이지

### 4. 권한 테어스트
- [ ] 비로그인: 권리금 블러 처리
- [ ] Bronze: 권리금 블러 처리
- [ ] Silver 이상: 권리금 표시

### 5. 관리자 기능 테스트
- [ ] 매물 등록
- [ ] 주소 → 좌표 자동 변환
- [ ] 이미지 업로드
- [ ] 사용자 승인/거부

---

## 🚀 배포 (Vercel)

### 1. GitHub 연결
```bash
git add .
git commit -m "feat: 완전한 인증 시스템 및 권한 제어 구현"
git push origin main
```

### 2. Vercel 설정
- 환경 변수 추가:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_KAKAO_MAP_API_KEY`

### 3. Kakao Developers 설정
- Web 플랫폼 추가: `your-domain.vercel.app`

### 4. Supabase 설정
- Authentication → URL Configuration
  - Site URL: `https://your-domain.vercel.app`
  - Redirect URLs: `https://your-domain.vercel.app/**`

---

## 📋 배포 후 확인사항

- [ ] 회원가입 작동
- [ ] 로그인 작동
- [ ] 지도 표시
- [ ] GPS 위치 추적
- [ ] 이미지 업로드
- [ ] 필터 작동
- [ ] 권한 제어

---

## 🔧 문제 해결

### 회원가입 실패
1. Supabase Dashboard → SQL Editor
2. 트리거 확인:
```sql
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';
```

### 지도 표시 안됨
1. Kakao Developers → 앱 설정 → 플랫폼
2. Web 플랫폼에 배포 URL 추가

### 이미지 업로드 실패
1. Supabase Dashboard → Storage
2. `property-images` 버킷 확인
3. RLS 정책 확인

