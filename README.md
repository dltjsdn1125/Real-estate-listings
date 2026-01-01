# 대구 상가 중개 플랫폼 (Daegu Commercial Platform)

대구 지역 상가 중개업무 효율화를 위한 지도 기반 매물 관리 플랫폼

## 📱 프로젝트 개요

이 프로젝트는 대구 지역의 상가 매물을 효율적으로 관리하고 탐색할 수 있는 웹 애플리케이션입니다. 카카오 지도 API를 활용한 지도 기반 검색, 사용자 권한 관리, 매물 등록/수정 기능을 제공합니다.

**GitHub**: [https://github.com/dltjsdn1125/Real-estate-listings](https://github.com/dltjsdn1125/Real-estate-listings)

## ✨ 주요 기능

### 🗺️ 지도 기반 매물 탐색
- 카카오 지도 API 통합
- GPS 기반 현재 위치 표시 (모바일 지속 추적)
- 매물 마커 및 클러스터링
- 반경 검색 기능
- 실시간 필터링 (지역, 유형, 가격, 면적)

### 👥 사용자 관리
- 역할 기반 접근 제어 (RBAC)
- 등급 시스템 (Bronze, Silver, Gold, Premium)
- 사용자 승인 시스템
- 등급별 정보 접근 제어

### 🏢 매물 관리
- 매물 등록/수정/삭제
- 다중 이미지 업로드
- 업종 가능 여부 설정
- 매물 상태 관리 (available, sold, pending, hidden)

### 📊 관리자 기능
- 사용자 관리 및 승인
- 등급 설정
- 감사 로그 조회
- 매물 관리

### 📱 PWA & TWA 지원
- Progressive Web App (PWA) 지원
- Trusted Web Activity (TWA) 지원
- 오프라인 모드
- 앱 설치 가능
- Android 네이티브 앱으로 빌드 가능

## 🛠️ 기술 스택

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **지도**: Kakao Map API v3
- **배포**: Vercel (권장)

## 🚀 시작하기

### 필수 요구사항

- Node.js 18+ 
- npm 또는 yarn
- Supabase 계정
- Kakao Developers 계정

### 설치

```bash
# 저장소 클론
git clone https://github.com/dltjsdn1125/Real-estate-listings.git
cd Real-estate-listings

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env.local
# .env.local 파일을 열어 필요한 값 설정
```

### 환경 변수 설정

`.env.local` 파일에 다음 변수들을 설정하세요:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_KAKAO_MAP_API_KEY=your_kakao_map_api_key
```

### 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 📱 TWA (Android 앱) 빌드

Android 네이티브 앱으로 빌드하는 방법은 [TWA 설정 가이드](docs/TWA_SETUP_GUIDE.md)를 참고하세요.

```bash
# Bubblewrap 설치
npm install -g @bubblewrap/cli

# TWA 초기화
bubblewrap init --manifest https://yourdomain.com/manifest.json

# 앱 빌드
bubblewrap build
```

## 📚 문서

- [PRD 구현 상태](docs/PRD_IMPLEMENTATION_STATUS.md)
- [TWA 설정 가이드](docs/TWA_SETUP_GUIDE.md)
- [TWA 빠른 시작](docs/TWA_QUICK_START.md)
- [데이터베이스 설정](docs/DATABASE_SETUP_COMPLETE.md)
- [Kakao Map 설정](docs/KAKAO_MAP_SETUP.md)
- [배포 체크리스트](docs/DEPLOYMENT_CHECKLIST.md)

## 🗂️ 프로젝트 구조

```
├── app/                    # Next.js App Router 페이지
│   ├── admin/             # 관리자 페이지
│   ├── auth/              # 인증 페이지
│   ├── map/               # 지도 페이지
│   └── properties/        # 매물 상세 페이지
├── components/            # React 컴포넌트
│   ├── admin/            # 관리자 컴포넌트
│   ├── common/           # 공통 컴포넌트
│   ├── map/              # 지도 관련 컴포넌트
│   └── property/         # 매물 관련 컴포넌트
├── lib/                   # 유틸리티 및 헬퍼
│   ├── supabase/         # Supabase 클라이언트
│   ├── hooks/            # Custom React Hooks
│   └── constants/        # 상수 정의
├── public/                # 정적 파일
│   ├── icons/            # PWA 아이콘
│   ├── manifest.json     # PWA 매니페스트
│   ├── sw.js             # Service Worker
│   └── .well-known/      # TWA 설정
├── supabase/             # Supabase 마이그레이션
│   └── migrations/       # 데이터베이스 마이그레이션
└── docs/                 # 문서
```

## 🔐 인증 및 권한

### 사용자 역할

- **admin**: 관리자 (모든 기능 접근)
- **agent**: 중개사 (매물 등록/수정 가능)
- **user**: 일반 사용자 (매물 조회만)

### 사용자 등급

- **bronze**: 기본 등급
- **silver**: 실버 등급
- **gold**: 골드 등급
- **premium**: 프리미엄 등급
- **platinum**: 플래티넘 등급

## 🧪 테스트 계정

테스트 계정 생성 및 사용 방법은 [테스트 계정 가이드](docs/TEST_ACCOUNTS_GUIDE.md)를 참고하세요.

## 📦 빌드

```bash
# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm start
```

## 🚀 배포

### Vercel 배포 (권장)

```bash
# Vercel CLI 설치
npm i -g vercel

# 배포
vercel
```

### 환경 변수 설정

배포 플랫폼에서 다음 환경 변수를 설정하세요:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_KAKAO_MAP_API_KEY`

## 📝 주요 커밋 히스토리

- `feat: TWA (Trusted Web Activity) 및 PWA 구현 완료`
- `feat: 미구현 기능 개발 완료 - 반경 검색, 감사 로그 UI, 모바일 GPS 개선`

## 🤝 기여하기

이슈를 제출하거나 Pull Request를 보내주세요.

## 📄 라이선스

이 프로젝트는 비공개 프로젝트입니다.

## 👨‍💻 개발자

- GitHub: [@dltjsdn1125](https://github.com/dltjsdn1125)

## 📞 문의

프로젝트에 대한 문의사항이 있으시면 이슈를 생성해주세요.

---

**마지막 업데이트**: 2025-01-01
