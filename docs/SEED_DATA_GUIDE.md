# 샘플 데이터 생성 가이드

## 개요

이 문서는 대구 상가 매물 플랫폼의 초기 샘플 데이터를 생성하는 방법을 설명합니다.

## 사전 준비

1. Supabase 프로젝트가 생성되어 있어야 합니다.
2. `.env.local` 파일에 Supabase 환경 변수가 설정되어 있어야 합니다.

```env
NEXT_PUBLIC_SUPABASE_URL=https://jnpxwcmshukhkxdzicwv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 샘플 데이터 생성

다음 명령어를 실행하여 샘플 데이터를 생성합니다:

```bash
npm run seed
```

## 생성되는 데이터

### 1. 사용자 (Users)
- **관리자 계정 1개**
  - 이메일: `admin@daegu-commercial.com`
  - 이름: 김중개
  - 회사: 대구중앙공인중개사무소
  - 등급: admin
  - 상태: active

### 2. 태그 (Tags)
- 역세권 (location)
- 코너 (location)
- 신축 (building)
- 주차가능 (facility)
- 테라스 (facility)
- 엘리베이터 (facility)

### 3. 매물 (Properties)

#### 매물 1: 동성로 코너 상가
- 유형: 상가 (store)
- 거래: 월세
- 위치: 중구 동성로
- 보증금: 5,000만원
- 월세: 350만원
- 면적: 40평 (전용 30평)
- 태그: 역세권, 코너, 주차가능

#### 매물 2: 수성구 프리미엄 오피스
- 유형: 사무실 (office)
- 거래: 월세
- 위치: 수성구 범어동
- 보증금: 1억원
- 월세: 500만원
- 면적: 50평 (전용 40평)
- 프리미엄: ✓
- 태그: 역세권, 주차가능, 엘리베이터

#### 매물 3: 경북대 근처 소형 카페
- 유형: 상가 (store)
- 거래: 월세
- 위치: 북구 산격동
- 보증금: 2,000만원
- 월세: 120만원
- 면적: 20평 (전용 15평)
- 태그: 역세권

#### 매물 4: 반월당역 대형 상가 건물
- 유형: 건물 (building)
- 거래: 매매
- 위치: 중구 대봉동
- 매매가: 30억원
- 면적: 200평 (전용 180평)
- 프리미엄: ✓
- 태그: 역세권, 주차가능, 엘리베이터

#### 매물 5: 서문시장 근처 음식점
- 유형: 상가 (store)
- 거래: 연세
- 위치: 중구 대신동
- 보증금: 3,000만원
- 연세: 3,600만원
- 면적: 35평 (전용 28평)
- 태그: 역세권

### 4. 이미지 (Property Images)
- 각 매물당 1~2개의 샘플 이미지 (Unsplash 이미지 사용)
- 총 7개의 이미지

## 데이터 확인

샘플 데이터 생성 후 다음 페이지에서 확인할 수 있습니다:

- **지도 기반 매물 탐색**: http://localhost:3000/map
- **매물 상세 정보**: http://localhost:3000/properties/[id]
- **관리자 페이지**: http://localhost:3000/admin/properties/new

## 주의사항

1. **중복 실행**: 스크립트를 여러 번 실행하면 데이터가 중복 생성될 수 있습니다. (사용자는 email로 중복 체크)
2. **이미지**: 샘플 이미지는 Unsplash의 외부 URL을 사용합니다. 실제 운영 시에는 Supabase Storage에 업로드해야 합니다.
3. **인증**: 샘플 사용자는 `users` 테이블에만 생성되며, Supabase Auth에는 등록되지 않습니다. 실제 로그인 기능 구현 시 별도 처리가 필요합니다.

## 데이터 초기화

샘플 데이터를 삭제하고 다시 시작하려면 Supabase 대시보드에서 다음 테이블의 데이터를 삭제하세요:

1. `property_images`
2. `property_tags`
3. `properties`
4. `tags`
5. `users`

또는 SQL 쿼리로 한번에 삭제:

```sql
TRUNCATE TABLE property_images CASCADE;
TRUNCATE TABLE property_tags CASCADE;
TRUNCATE TABLE properties CASCADE;
TRUNCATE TABLE tags CASCADE;
TRUNCATE TABLE users CASCADE;
```

## 문제 해결

### 권한 오류
- Supabase RLS 정책이 활성화되어 있는지 확인하세요.
- Service Key를 사용하거나 RLS를 일시적으로 비활성화할 수 있습니다.

### 연결 오류
- `.env.local` 파일의 환경 변수가 올바른지 확인하세요.
- Supabase 프로젝트가 활성 상태인지 확인하세요.

### 이미지 로딩 오류
- Unsplash 이미지 URL이 차단되지 않았는지 확인하세요.
- `next.config.js`에 이미지 도메인이 추가되어 있는지 확인하세요.

