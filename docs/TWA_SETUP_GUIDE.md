# TWA (Trusted Web Activity) 설정 가이드

## 📱 개요

TWA(Trusted Web Activity)를 통해 Progressive Web App(PWA)을 Android 네이티브 앱처럼 실행할 수 있습니다.

---

## ✅ 완료된 작업

### 1. PWA Manifest (`/public/manifest.json`)
- ✅ 앱 이름, 아이콘, 테마 색상 설정
- ✅ 단축키, 스크린샷, 카테고리 설정
- ✅ 공유 대상(share_target) 설정

### 2. Service Worker (`/public/sw.js`)
- ✅ 오프라인 캐싱
- ✅ 백그라운드 동기화
- ✅ 푸시 알림 지원

### 3. Layout 설정 (`/app/layout.tsx`)
- ✅ Manifest 링크 추가
- ✅ Apple Touch Icon 설정
- ✅ 테마 색상 설정
- ✅ Service Worker 등록 스크립트

### 4. TWA 설정 파일
- ✅ `.well-known/assetlinks.json` 생성 (인증 필요)

---

## 🚀 다음 단계

### 1. 아이콘 생성

다음 크기의 아이콘을 생성하여 `/public/icons/` 폴더에 저장하세요:

```
/icons/
  ├── icon-72x72.png
  ├── icon-96x96.png
  ├── icon-128x128.png
  ├── icon-144x144.png
  ├── icon-152x152.png
  ├── icon-192x192.png
  ├── icon-384x384.png
  └── icon-512x512.png
```

**아이콘 생성 도구:**
- [PWA Asset Generator](https://github.com/onderceylan/pwa-asset-generator)
- [RealFaviconGenerator](https://realfavicongenerator.net/)
- [Favicon.io](https://favicon.io/)

### 2. Android 앱 빌드

#### 방법 1: Bubblewrap (권장)

```bash
# Bubblewrap 설치
npm install -g @bubblewrap/cli

# TWA 초기화
bubblewrap init --manifest https://yourdomain.com/manifest.json

# 앱 빌드
bubblewrap build

# APK/AAB 생성
bubblewrap update
```

#### 방법 2: Android Studio

1. [Android Studio](https://developer.android.com/studio) 설치
2. "Trusted Web Activity" 템플릿으로 새 프로젝트 생성
3. `assetlinks.json` 설정
4. 빌드 및 배포

### 3. Asset Links 설정

`.well-known/assetlinks.json` 파일을 업데이트하세요:

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.daegu.commercial.platform",
      "sha256_cert_fingerprints": [
        "SHA256_FINGERPRINT_FROM_KEYSTORE"
      ]
    }
  }
]
```

**SHA256 지문 확인:**
```bash
keytool -list -v -keystore your-keystore.jks -alias your-alias
```

### 4. 배포

1. 웹사이트를 HTTPS로 배포 (필수)
2. `.well-known/assetlinks.json`이 접근 가능한지 확인:
   ```
   https://yourdomain.com/.well-known/assetlinks.json
   ```
3. Android 앱을 Google Play Store에 등록

---

## 📋 체크리스트

### PWA 설정
- [x] manifest.json 생성
- [x] Service Worker 구현
- [x] 아이콘 설정 (아이콘 파일 필요)
- [x] 오프라인 페이지 생성
- [x] 테마 색상 설정

### TWA 설정
- [x] assetlinks.json 생성 (인증 정보 필요)
- [ ] Android 앱 빌드
- [ ] SHA256 지문 확인
- [ ] Google Play Console 설정

### 배포
- [ ] HTTPS 배포
- [ ] assetlinks.json 접근 가능 확인
- [ ] Android 앱 배포

---

## 🔧 개발 서버에서 테스트

### Service Worker 테스트

1. 개발 서버 실행:
   ```bash
   npm run dev
   ```

2. Chrome DevTools → Application → Service Workers에서 등록 확인

3. Application → Manifest에서 manifest.json 확인

4. Network 탭에서 오프라인 모드 테스트

### TWA 테스트 (로컬)

```bash
# Android Debug Bridge 설치 필요
adb install app-release.apk
```

---

## 📱 Android 앱 설정

### package.json에 스크립트 추가 (선택사항)

```json
{
  "scripts": {
    "twa:init": "bubblewrap init --manifest https://yourdomain.com/manifest.json",
    "twa:update": "bubblewrap update",
    "twa:build": "bubblewrap build"
  }
}
```

### Android 앱 패키지명

- 패키지명: `com.daegu.commercial.platform`
- 앱 이름: `대구 상가`
- 버전: `1.0.0`

---

## 🔐 보안 고려사항

1. **HTTPS 필수**: TWA는 HTTPS에서만 작동합니다.
2. **Asset Links 인증**: 올바른 SHA256 지문이 필요합니다.
3. **도메인 검증**: 앱과 웹사이트 도메인이 일치해야 합니다.

---

## 📚 참고 자료

- [TWA 공식 문서](https://developer.chrome.com/docs/android/trusted-web-activity/)
- [PWA 문서](https://web.dev/progressive-web-apps/)
- [Bubblewrap GitHub](https://github.com/GoogleChromeLabs/bubblewrap)
- [Asset Links 생성기](https://developers.google.com/digital-asset-links/tools/generator)

---

## 🐛 문제 해결

### Service Worker가 등록되지 않는 경우

1. HTTPS 사용 확인
2. 브라우저 콘솔에서 에러 확인
3. `sw.js` 파일 경로 확인

### Asset Links 인증 실패

1. SHA256 지문 확인
2. `assetlinks.json` 경로 확인 (`/.well-known/assetlinks.json`)
3. Content-Type 확인 (`application/json`)

### Android 앱이 웹사이트를 열지 않는 경우

1. 패키지명 확인
2. Asset Links 설정 확인
3. 웹사이트 도메인 확인

