# TWA 빠른 시작 가이드

## 🚀 5분 안에 TWA 앱 만들기

### 1단계: 아이콘 준비

1. 512x512 PNG 이미지 준비 (`/public/icon-source.png`)
2. 아이콘 생성:
   ```bash
   npm install sharp
   node scripts/generate-icons.js
   ```
3. 또는 온라인 도구 사용:
   - [PWA Asset Generator](https://github.com/onderceylan/pwa-asset-generator)
   - [RealFaviconGenerator](https://realfavicongenerator.net/)

### 2단계: 웹사이트 배포

웹사이트를 HTTPS로 배포해야 합니다 (필수).

```bash
# 빌드
npm run build

# 배포 (예: Vercel, Netlify 등)
npm run start
```

### 3단계: Android 앱 빌드 (Bubblewrap)

```bash
# Bubblewrap 설치
npm install -g @bubblewrap/cli

# TWA 초기화 (배포된 웹사이트 URL 사용)
bubblewrap init --manifest https://yourdomain.com/manifest.json

# 앱 빌드
bubblewrap build

# APK 생성
bubblewrap update
```

### 4단계: Asset Links 설정

1. Android 앱의 SHA256 지문 확인:
   ```bash
   keytool -list -v -keystore android/app/release.keystore -alias twa
   ```

2. `public/.well-known/assetlinks.json` 업데이트:
   ```json
   [
     {
       "relation": ["delegate_permission/common.handle_all_urls"],
       "target": {
         "namespace": "android_app",
         "package_name": "com.daegu.commercial.platform",
         "sha256_cert_fingerprints": [
           "YOUR_SHA256_FINGERPRINT_HERE"
         ]
       }
     }
   ]
   ```

3. 웹사이트 재배포

### 5단계: 테스트

```bash
# APK 설치 (Android 디바이스 연결 필요)
adb install android/app/build/outputs/apk/release/app-release.apk
```

---

## 📱 패키지 정보

- **패키지명**: `com.daegu.commercial.platform`
- **앱 이름**: 대구 상가
- **버전**: 1.0.0

---

## 🔍 문제 해결

### "Service Worker 등록 실패"
- HTTPS 사용 확인
- 브라우저 콘솔 확인

### "Asset Links 인증 실패"
- SHA256 지문 확인
- `/.well-known/assetlinks.json` 접근 확인
- Content-Type이 `application/json`인지 확인

### "앱이 웹사이트를 열지 않음"
- 패키지명 확인
- Asset Links 재확인

---

## 📚 더 알아보기

자세한 내용은 `docs/TWA_SETUP_GUIDE.md`를 참고하세요.

