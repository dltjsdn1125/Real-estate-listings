import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import './globals.css'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#ff6b00',
}

export const metadata: Metadata = {
  title: 'Daegu Commercial Platform',
  description: '대구 지역 상가 중개업무 효율화를 위한 지도 기반 매물 관리 플랫폼',
  icons: {
    icon: [
      {
        url: '/favicon.svg',
        type: 'image/svg+xml',
      },
      {
        url: '/favicon.svg',
        type: 'image/svg+xml',
        sizes: 'any',
      },
    ],
    shortcut: [
      {
        url: '/favicon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: [
      {
        url: '/favicon.svg',
        type: 'image/svg+xml',
      },
    ],
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '대구 상가',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'application-name': '대구 상가',
    'screen-orientation': 'portrait', // 모바일 화면 방향 고정 (세로)
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const kakaoMapApiKey = process.env.NEXT_PUBLIC_KAKAO_MAP_API_KEY || ''

  return (
    <html lang="ko" className="light">
      <head>
        <link rel="preconnect" href="https://dapi.kakao.com" crossOrigin="anonymous" />
        {/* 모바일 화면 방향 고정 (세로) */}
        <meta name="screen-orientation" content="portrait" />
        {/* 캐시 방지 메타 태그 */}
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
      </head>
      <body className="bg-background-light dark:bg-background-dark text-[#111318] dark:text-white font-display antialiased">
        {children}
        {/* Kakao Maps SDK - beforeInteractive로 빠르게 로드 */}
        {kakaoMapApiKey && (
          <Script
            id="kakao-maps-sdk"
            src={`https://dapi.kakao.com/v2/maps/sdk.js?appkey=${kakaoMapApiKey}&libraries=services&autoload=false`}
            strategy="beforeInteractive"
          />
        )}
        <Script
          id="service-worker-cleanup"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator && typeof window !== 'undefined') {
                // 개발 및 프로덕션 환경 모두에서 Service Worker 완전히 비활성화
                navigator.serviceWorker.getRegistrations().then((registrations) => {
                  registrations.forEach((registration) => {
                    registration.unregister().catch(() => {});
                  });
                });
                // 모든 캐시 삭제
                if ('caches' in window) {
                  caches.keys().then((cacheNames) => {
                    cacheNames.forEach((cacheName) => {
                      caches.delete(cacheName).catch(() => {});
                    });
                  });
                }
              }
            `,
          }}
        />
      </body>
    </html>
  )
}
