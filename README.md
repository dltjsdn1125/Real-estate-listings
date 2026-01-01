# 대구 상가 매물 플랫폼

대구 지역 상가 중개업무 효율화를 위한 지도 기반 매물 관리 플랫폼입니다.

## 기술 스택

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Storage, Auth)
- **Map**: Kakao Map API
- **Icons**: Material Symbols

## 시작하기

### 1. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 변수를 설정하세요:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Kakao Map API
NEXT_PUBLIC_KAKAO_MAP_API_KEY=your_kakao_map_api_key
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 주요 기능

### ✅ 구현 완료

- ✅ 지도 기반 매물 탐색 (Kakao Map API)
- ✅ GPS 위치 추적 (고정확도)
- ✅ 고해상도 지도
- ✅ 매물 마커 표시
- ✅ 매물 상세 정보 조회
- ✅ 매물 등록/수정
- ✅ 사용자 관리
- ✅ 이미지 업로드 (Supabase Storage)

### 🚧 진행 중

- [ ] 인증 시스템
- [ ] 찜하기 기능
- [ ] 검색 필터 고도화

## 문서

- [PRD 문서](./docs/commercial-map-platform-PRD.md)
- [Kakao Map 설정 가이드](./docs/KAKAO_MAP_SETUP.md)
- [샘플 데이터 생성 가이드](./docs/SEED_DATA_GUIDE.md)
- [Storage 설정 가이드](./docs/STORAGE_SETUP_GUIDE.md)

## 스크립트

### 개발

```bash
npm run dev      # 개발 서버 실행
npm run build    # 프로덕션 빌드
npm run start    # 프로덕션 서버 실행
npm run lint     # 린트 체크
```

### 데이터

```bash
npm run seed     # 샘플 데이터 생성
```

## 프로젝트 구조

```
.
├── app/                    # Next.js App Router
│   ├── map/               # 지도 기반 매물 탐색
│   ├── properties/        # 매물 상세 페이지
│   └── admin/             # 관리자 페이지
├── components/            # React 컴포넌트
│   ├── map/              # 지도 관련 컴포넌트
│   ├── property/         # 매물 관련 컴포넌트
│   └── admin/            # 관리자 컴포넌트
├── lib/                   # 유틸리티 함수
│   └── supabase/         # Supabase 클라이언트 및 함수
└── scripts/              # 스크립트 파일
    └── seed-sample-data.ts  # 샘플 데이터 생성
```

## 라이선스

프로젝트 내부 사용
