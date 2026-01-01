# Supabase Storage 설정 가이드

## 개요

대구 상가 매물 플랫폼에서 매물 이미지를 저장하기 위한 Supabase Storage 버킷 설정 가이드입니다.

## Storage 버킷 생성

### 1. Supabase 대시보드 접속

[Supabase Dashboard](https://supabase.com/dashboard/project/jnpxwcmshukhkxdzicwv/storage/buckets) 접속

### 2. Storage 버킷 생성

1. 좌측 메뉴에서 **Storage** 클릭
2. **New bucket** 버튼 클릭
3. 다음 정보 입력:
   - **Name**: `property-images`
   - **Public bucket**: ✅ 체크 (공개 버킷)
   - **File size limit**: 5 MB (권장)
   - **Allowed MIME types**: `image/*` (모든 이미지 타입)
4. **Create bucket** 클릭

### 3. Storage 정책 설정

버킷 생성 후 다음 RLS 정책을 추가해야 합니다:

#### 정책 1: 공개 읽기 (Public Read)

```sql
CREATE POLICY "Public read access for property images"
ON storage.objects FOR SELECT
USING (bucket_id = 'property-images');
```

#### 정책 2: 인증된 사용자 업로드 (Authenticated Upload)

```sql
CREATE POLICY "Authenticated users can upload property images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'property-images' 
  AND auth.role() = 'authenticated'
);
```

#### 정책 3: 소유자 삭제 (Owner Delete)

```sql
CREATE POLICY "Users can delete their own property images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'property-images' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

### 4. 정책 적용 방법

1. Supabase 대시보드에서 **SQL Editor** 메뉴로 이동
2. 위의 SQL 쿼리를 각각 실행
3. 또는 **Storage** > **Policies** 에서 UI로 직접 추가

## 이미지 업로드 구조

### 파일 경로 구조

```
property-images/
├── {user_id}/
│   ├── {property_id}/
│   │   ├── {timestamp}_{filename}.jpg
│   │   ├── {timestamp}_{filename}.png
│   │   └── ...
```

### 예시

```
property-images/
├── 550e8400-e29b-41d4-a716-446655440000/
│   ├── 123e4567-e89b-12d3-a456-426614174000/
│   │   ├── 1704067200000_front.jpg
│   │   ├── 1704067201000_interior.jpg
│   │   └── 1704067202000_exterior.jpg
```

## 이미지 업로드 기능

### 클라이언트 사이드 업로드

매물 등록/수정 페이지(`/admin/properties/new`)에서 이미지 업로드 기능이 구현되어 있습니다.

```typescript
// lib/supabase/storage.ts
export async function uploadPropertyImages(
  files: File[],
  propertyId: string
): Promise<{ data: string[] | null; error: Error | null }>
```

### 사용 예시

```typescript
// 이미지 파일 선택
const files = event.target.files

// 이미지 업로드
const { data: imageUrls, error } = await uploadPropertyImages(
  Array.from(files),
  propertyId
)

if (error) {
  console.error('이미지 업로드 실패:', error)
} else {
  console.log('업로드된 이미지 URLs:', imageUrls)
}
```

## 이미지 URL 형식

### Public URL

```
https://jnpxwcmshukhkxdzicwv.supabase.co/storage/v1/object/public/property-images/{user_id}/{property_id}/{filename}
```

### 예시

```
https://jnpxwcmshukhkxdzicwv.supabase.co/storage/v1/object/public/property-images/550e8400-e29b-41d4-a716-446655440000/123e4567-e89b-12d3-a456-426614174000/1704067200000_front.jpg
```

## 이미지 최적화 권장사항

### 1. 파일 크기 제한
- 최대 파일 크기: **5MB**
- 권장 파일 크기: **1-2MB**

### 2. 이미지 포맷
- 권장 포맷: **JPEG** (압축률 우수)
- 지원 포맷: JPEG, PNG, WebP, GIF

### 3. 이미지 해상도
- 권장 해상도: **1920x1080** 또는 **1280x720**
- 최소 해상도: **800x600**

### 4. 클라이언트 사이드 압축

이미지 업로드 전 클라이언트에서 압축하는 것을 권장합니다:

```typescript
// 추후 구현 예정
import imageCompression from 'browser-image-compression'

const options = {
  maxSizeMB: 2,
  maxWidthOrHeight: 1920,
  useWebWorker: true
}

const compressedFile = await imageCompression(file, options)
```

## Next.js 이미지 도메인 설정

`next.config.js`에 Supabase Storage 도메인을 추가해야 합니다:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'jnpxwcmshukhkxdzicwv.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
}

module.exports = nextConfig
```

## 문제 해결

### 업로드 실패

**증상**: 이미지 업로드 시 403 Forbidden 오류

**해결 방법**:
1. Storage 버킷이 Public으로 설정되어 있는지 확인
2. RLS 정책이 올바르게 설정되어 있는지 확인
3. 사용자가 인증되어 있는지 확인

### 이미지 로딩 실패

**증상**: 업로드된 이미지가 표시되지 않음

**해결 방법**:
1. 이미지 URL이 올바른지 확인
2. `next.config.js`에 도메인이 추가되어 있는지 확인
3. 브라우저 콘솔에서 CORS 오류 확인

### 파일 크기 초과

**증상**: 5MB 이상 파일 업로드 실패

**해결 방법**:
1. 이미지 압축 후 업로드
2. Storage 버킷 설정에서 파일 크기 제한 확인
3. 클라이언트 사이드에서 파일 크기 검증 추가

## 보안 고려사항

### 1. 파일 타입 검증
- 클라이언트와 서버 양쪽에서 파일 타입 검증
- 허용된 MIME 타입만 업로드

### 2. 파일 크기 제한
- 클라이언트 사이드에서 사전 검증
- Storage 버킷 설정에서 제한

### 3. 사용자 인증
- 인증된 사용자만 업로드 가능
- RLS 정책으로 권한 제어

### 4. 파일명 난독화
- 타임스탬프 + UUID로 파일명 생성
- 원본 파일명 노출 방지

## 모니터링

### Storage 사용량 확인

Supabase 대시보드에서 Storage 사용량을 모니터링할 수 있습니다:

1. **Settings** > **Billing** > **Usage**
2. Storage 사용량 확인
3. 무료 플랜: 1GB 제공
4. 유료 플랜: 100GB+ 제공

### 비용 최적화

1. 불필요한 이미지 정기적으로 삭제
2. 이미지 압축으로 용량 절약
3. CDN 캐싱 활용
4. WebP 포맷 사용 고려

## 참고 자료

- [Supabase Storage 공식 문서](https://supabase.com/docs/guides/storage)
- [Next.js Image 최적화](https://nextjs.org/docs/basic-features/image-optimization)
- [이미지 압축 라이브러리](https://www.npmjs.com/package/browser-image-compression)

