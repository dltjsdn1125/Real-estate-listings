import type { Metadata, Viewport } from 'next'
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
        url: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23ff6b00" rx="10"/><text x="50" y="70" font-size="60" text-anchor="middle" fill="white">🏢</text></svg>',
        type: 'image/svg+xml',
      },
    ],
    apple: [
      {
        url: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23ff6b00" rx="10"/><text x="50" y="70" font-size="60" text-anchor="middle" fill="white">🏢</text></svg>',
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
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko" className="light">
      <body className="bg-background-light dark:bg-background-dark text-[#111318] dark:text-white font-display antialiased">
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // 개발 환경에서는 Service Worker 완전 비활성화
              if ('serviceWorker' in navigator && typeof window !== 'undefined') {
                const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
                if (isDev) {
                  // 개발 환경: 모든 Service Worker 제거
                  navigator.serviceWorker.getRegistrations().then((registrations) => {
                    registrations.forEach((registration) => {
                      registration.unregister().catch(() => {});
                    });
                  });
                  // Service Worker 등록 방지
                  navigator.serviceWorker.register = function() {
                    return Promise.reject(new Error('Service Worker disabled in development'));
                  };
                }
              }
            `,
          }}
        />
      </body>
    </html>
  )
}

