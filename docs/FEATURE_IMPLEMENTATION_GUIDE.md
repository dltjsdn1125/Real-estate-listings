# 구현된 기능 가이드

## 🎯 전체 구현 기능 요약

### ✅ 1. 인증 시스템
- **로그인**: `/auth/login`
- **회원가입**: `/auth/signup`
- **승인 대기**: `/auth/pending`
- **로그아웃**: 헤더/사이드바에서 가능

### ✅ 2. 매물 탐색
- **지도 검색**: `/map`
- **필터 기능**: 지역, 유형, 가격, 면적, 주차
- **매물 상세**: `/properties/[id]`

### ✅ 3. 관리자 기능
- **매물 등록**: `/admin/properties/new`
- **사용자 관리**: `/admin/users`
- **주소 자동 변환**: 매물 등록 시 Kakao API 사용

### ✅ 4. 권한 제어
- **등급별 정보 표시**: Bronze, Silver, Gold, Platinum
- **권리금 정보**: Silver 등급 이상
- **관리자 페이지**: Admin/Agent 역할만 접근

---

## 🔗 버튼 연결 현황

### 헤더 (Header.tsx)
| 버튼/링크 | 경로 | 기능 | 권한 |
|----------|------|------|------|
| 로고 | `/` | 홈으로 이동 | 전체 |
| 매물 탐색 | `/map` | 지도 검색 | 전체 |
| 매물 등록 | `/admin/properties/new` | 매물 등록 폼 | Admin/Agent |
| 사용자 관리 | `/admin/users` | 사용자 목록/승인 | Admin |
| 로그인 | `/auth/login` | 로그인 페이지 | 비로그인 |
| 로그아웃 | - | 세션 종료 | 로그인 |

### 홈 페이지 (app/page.tsx)
| 버튼 | 경로 | 기능 |
|------|------|------|
| 지도로 매물 탐색하기 | `/map` | 매물 지도 검색 |
| 회원가입 | `/auth/signup` | 회원가입 페이지 |

### 푸터 (Footer.tsx)
| 링크 | 경로 | 기능 |
|------|------|------|
| 홈 | `/` | 메인 페이지 |
| 매물 탐색 | `/map` | 지도 검색 |
| 로그인 | `/auth/login` | 로그인 |
| 회원가입 | `/auth/signup` | 회원가입 |
| 매물 등록 | `/admin/properties/new` | 매물 등록 |
| 관리자 | `/admin/users` | 사용자 관리 |

### 관리자 사이드바 (AdminSidebar.tsx)
| 메뉴 | 경로 | 기능 |
|------|------|------|
| 매물 탐색 | `/map` | 지도 검색 |
| 매물 등록 | `/admin/properties/new` | 매물 등록 폼 |
| 사용자 관리 | `/admin/users` | 사용자 목록 |
| 홈으로 | `/` | 메인 페이지 |
| 로그아웃 | - | 세션 종료 |

### 지도 페이지 (app/map/page.tsx)
| 기능 | 설명 |
|------|------|
| 검색 필터 | 지역, 유형, 가격, 면적, 주차 필터 |
| 매물 카드 클릭 | `/properties/[id]`로 이동 |
| 지도 마커 클릭 | 매물 상세 정보 표시 |

### 매물 상세 페이지 (app/properties/[id]/page.tsx)
| 기능 | 설명 | 권한 |
|------|------|------|
| 권리금 정보 | 등급별 표시/블러 | Silver 이상 |
| 로그인 버튼 | `/auth/login`으로 이동 | 비로그인 |
| 등급 업그레이드 | `/pricing`으로 이동 | 권한 부족 시 |

### 매물 등록 페이지 (app/admin/properties/new/page.tsx)
| 버튼 | 기능 |
|------|------|
| 주소 → 좌표 자동 변환 | Kakao Geocoding API 호출 |
| 등록하기 | Supabase에 매물 저장 |

### 사용자 관리 페이지 (app/admin/users/page.tsx)
| 버튼 | 기능 |
|------|------|
| 승인 | approval_status를 'approved'로 변경 |
| 거부 | approval_status를 'rejected'로 변경 |
| 등급 변경 | tier 업데이트 |

---

## 🔐 권한 시스템

### 등급별 권한
| 등급 | 권한 |
|------|------|
| Guest | 기본 정보, 사진 조회 |
| Bronze | + 중개자 정보 |
| Silver | + 권리금, 상권 데이터 |
| Gold | + 프리미엄 매물 |
| Platinum | + 데이터 추출, API |

### 역할별 권한
| 역할 | 권한 |
|------|------|
| User | 매물 조회 |
| Agent | + 매물 등록/수정 |
| Admin | + 사용자 관리, 매물 삭제 |

---

## 🚀 사용 흐름

### 일반 사용자
1. `/` 홈 페이지 접속
2. "회원가입" 버튼 클릭 → `/auth/signup`
3. 회원가입 완료 → `/auth/pending` (승인 대기)
4. 관리자 승인 후 → 로그인 가능
5. `/map`에서 매물 탐색
6. 매물 클릭 → `/properties/[id]` 상세 정보

### 관리자/중개사
1. `/auth/login` 로그인
2. 헤더에서 "매물 등록" 클릭 → `/admin/properties/new`
3. 주소 입력 후 "주소 → 좌표 자동 변환" 클릭
4. 매물 정보 입력 후 등록
5. "사용자 관리" 클릭 → `/admin/users`
6. 대기 중인 사용자 승인/거부

---

## 📱 모바일 대응

### 헤더 (Header.tsx)
- 768px 이하: 햄버거 메뉴
- 모바일 메뉴 패널: 전체 네비게이션 표시
- 사용자 정보 표시

### 지도 페이지 (app/map/page.tsx)
- 데스크톱: 좌측 사이드바 + 우측 지도
- 모바일: 지도 전체 화면 + 슬라이드 사이드바

### 관리자 사이드바 (AdminSidebar.tsx)
- 1024px 이하: 오버레이 사이드바
- 모바일: 전체 화면 사이드바

---

## 🔧 환경 변수

필수 환경 변수 (`.env.local`):
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_KAKAO_MAP_API_KEY=your_kakao_map_api_key
```

---

## 📝 테스트 계정

### 관리자 계정 생성 (Supabase SQL Editor)
```sql
-- 1. Auth에 사용자 생성 (Supabase Dashboard에서)
-- 2. users 테이블에 추가
INSERT INTO public.users (id, email, full_name, role, tier, approval_status)
VALUES (
  'auth_user_id',
  'admin@example.com',
  '관리자',
  'admin',
  'platinum',
  'approved'
);
```

---

## 🎨 UI 컴포넌트

### 공통 컴포넌트
- `Header`: 전역 헤더 (인증 상태 표시)
- `Footer`: 전역 푸터
- `Breadcrumbs`: 경로 표시

### 지도 컴포넌트
- `KakaoMap`: Kakao Map API 통합
- `PropertyCard`: 매물 카드
- `PropertySearchSidebar`: 검색 필터

### 관리자 컴포넌트
- `AdminHeader`: 관리자 헤더
- `AdminSidebar`: 관리자 사이드바
- `UserTable`: 사용자 목록 테이블
- `UserStats`: 사용자 통계

### 매물 컴포넌트
- `PropertyImageGallery`: 이미지 갤러리
- `PropertySummary`: 매물 요약
- `KeyMoneySection`: 권리금 정보 (권한 제어)
- `PropertyLocationMap`: 위치 지도
- `PropertySidebar`: 매물 사이드바

---

## 🔄 상태 관리

### useAuth Hook
```typescript
const { user, isAuthenticated, loading, signOut } = useAuth()
```

- `user`: 현재 사용자 정보
- `isAuthenticated`: 로그인 여부
- `loading`: 로딩 상태
- `signOut`: 로그아웃 함수

### 권한 체크
```typescript
import { hasPermission } from '@/lib/auth/permissions'

const canViewKeyMoney = hasPermission(user, 'VIEW_KEY_MONEY')
```

---

## 📚 추가 개발 가능 기능

### 우선순위 높음
- [ ] 소셜 로그인 (Google, Kakao)
- [ ] 찜하기/북마크
- [ ] 문의하기/메시지

### 우선순위 중간
- [ ] 대시보드/통계
- [ ] 클러스터링
- [ ] 알림 시스템

### 우선순위 낮음
- [ ] 무한 스크롤
- [ ] SEO 최적화
- [ ] PWA 지원

