# 문제 해결 가이드

## Next.js 정적 파일 404 오류

### 증상
```
GET http://localhost:3000/_next/static/css/app/layout.css net::ERR_ABORTED 404
GET http://localhost:3000/_next/static/chunks/main-app.js net::ERR_ABORTED 404
```

### 해결 방법

#### 1. 개발 서버 완전 재시작

```bash
# 1. 모든 Node.js 프로세스 종료
# Windows PowerShell:
Get-Process -Name node | Stop-Process -Force

# 2. .next 폴더 삭제
Remove-Item -Recurse -Force .next

# 3. 개발 서버 재시작
npm run dev
```

#### 2. 포트 확인

다른 프로세스가 3000 포트를 사용 중일 수 있습니다:

```bash
# Windows에서 포트 확인
netstat -ano | findstr :3000

# 포트를 사용하는 프로세스 종료
taskkill /PID <PID> /F
```

#### 3. 브라우저 캐시 정리

- Chrome/Edge: `Ctrl + Shift + Delete` → 캐시된 이미지 및 파일 삭제
- 또는 시크릿 모드로 테스트

#### 4. node_modules 재설치 (최후의 수단)

```bash
rm -rf node_modules
rm -rf .next
npm install
npm run dev
```

---

## Webpack 모듈 로딩 오류

### 증상
```
TypeError: Cannot read properties of undefined (reading 'call')
```

### 해결 방법

1. `.next` 폴더 삭제
2. npm 캐시 정리: `npm cache clean --force`
3. 개발 서버 재시작

---

## Service Worker 등록

Service Worker가 정상적으로 등록되면:
```
Service Worker registered: ServiceWorkerRegistration {...}
```

이 메시지가 보이면 Service Worker는 정상 작동 중입니다.

---

## 일반적인 해결 순서

1. **개발 서버 중지** (Ctrl + C)
2. **모든 Node.js 프로세스 종료**
3. **.next 폴더 삭제**
4. **개발 서버 재시작**: `npm run dev`
5. **브라우저 하드 리프레시**: `Ctrl + Shift + R`

---

## 추가 도움말

문제가 계속되면:
- Next.js 버전 확인: `npm list next`
- Node.js 버전 확인: `node --version` (18+ 권장)
- 포트 변경: `npm run dev -- -p 3001`

