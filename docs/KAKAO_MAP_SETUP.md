# Kakao Map API 설정 가이드

## 개요

대구 상가 매물 플랫폼에서 실제 Kakao Map API를 사용하여 고해상도 지도와 GPS 위치 추적 기능을 구현했습니다.

## 필수 설정

### 1. Kakao Developers 앱 키 발급

1. [Kakao Developers](https://developers.kakao.com/) 접속
2. 내 애플리케이션 > 애플리케이션 추가하기
3. 앱 이름 입력 후 저장
4. 앱 키 > JavaScript 키 복사

### 2. 환경 변수 설정

`.env.local` 파일에 다음을 추가하세요:

```env
NEXT_PUBLIC_KAKAO_MAP_API_KEY=your_javascript_key_here
```

### 3. 플랫폼 설정 (Kakao Developers)

1. 내 애플리케이션 > 앱 설정 > 플랫폼
2. Web 플랫폼 등록
3. 사이트 도메인 추가:
   - `http://localhost:3000` (개발용)
   - `http://localhost:3001` (개발용)
   - 실제 도메인 (운영용)

## 구현된 기능

### 1. 실제 Kakao Map 렌더링

- ✅ Kakao Map API v3 연동
- ✅ 고해상도 지도 (level 3, 낮을수록 확대)
- ✅ 지도 타입 선택 가능 (도로/위성/하이브리드)

### 2. GPS 위치 추적

- ✅ 고정확도 GPS 활성화 (`enableHighAccuracy: true`)
- ✅ 실시간 위치 추적
- ✅ 내 위치 마커 표시
- ✅ 내 위치로 이동 버튼

### 3. 매물 마커 표시

- ✅ 실제 좌표 기반 마커 표시
- ✅ 프리미엄/일반 매물 구분 마커
- ✅ 마커 클릭 시 상세 페이지 이동
- ✅ 마커 호버 시 인포윈도우 표시

### 4. 지도 컨트롤

- ✅ 확대/축소 버튼
- ✅ 내 위치로 이동 버튼
- ✅ 지도 범위 자동 조정 (모든 매물 표시)

## 기술 스택

- **Kakao Map API v3**: 공식 JavaScript SDK
- **Next.js Script Component**: 최적화된 스크립트 로딩
- **Geolocation API**: 브라우저 GPS 위치 추적

## 사용 방법

### 컴포넌트 사용

```tsx
import KakaoMap from '@/components/map/KakaoMap'

<KakaoMap
  properties={[
    {
      id: '1',
      title: '매물 제목',
      lat: 35.8714,
      lng: 128.6014,
      type: 'standard',
      deposit: '5000만',
      rent: '350만',
    },
  ]}
  onMarkerClick={(id) => console.log('Marker clicked:', id)}
  level={3} // 지도 확대 레벨 (1-14)
/>
```

## GPS 위치 권한

사용자가 위치 정보 접근을 허용해야 GPS 기능이 작동합니다.

### 브라우저 설정

- **Chrome/Edge**: 주소창의 자물쇠 아이콘 > 사이트 설정 > 위치
- **Safari**: 환경설정 > 개인정보 보호 > 위치 서비스
- **Firefox**: 주소창의 자물쇠 아이콘 > 연결 정보 > 권한

## 지도 해상도 설정

지도 레벨은 1-14 사이의 값으로 설정할 수 있습니다:

- **1-3**: 대도시 전체 보기 (대구 전체)
- **4-7**: 구/동 단위
- **8-10**: 상세 지도 (건물 단위)
- **11-14**: 최고 해상도 (실내 지도 수준)

현재 기본값은 **3**입니다. 더 높은 해상도를 원하면 `level` prop을 낮춰주세요.

## 문제 해결

### 지도가 표시되지 않음

1. Kakao Developers에서 JavaScript 키가 올바른지 확인
2. 환경 변수가 설정되었는지 확인
3. 브라우저 콘솔에서 API 키 오류 확인
4. 플랫폼 도메인이 등록되었는지 확인

### GPS 위치를 가져올 수 없음

1. 브라우저 위치 권한 허용 확인
2. HTTPS 환경에서만 GPS가 작동할 수 있음 (localhost는 예외)
3. 브라우저 콘솔에서 권한 오류 확인

### 마커가 표시되지 않음

1. properties 배열에 `lat`, `lng` 값이 있는지 확인
2. 좌표 값이 유효한 범위인지 확인 (위도: -90~90, 경도: -180~180)

## 참고 자료

- [Kakao Map API 공식 문서](https://apis.map.kakao.com/)
- [Kakao Map API 가이드](https://apis.map.kakao.com/web/guide/)
- [Geolocation API 문서](https://developer.mozilla.org/ko/docs/Web/API/Geolocation_API)

