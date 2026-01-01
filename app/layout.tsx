import type { Metadata } from 'next'
import './globals.css'
import Script from 'next/script'

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
  themeColor: '#ff6b00',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '대구 상가',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
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
        <Script id="service-worker-registration" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                  .then((registration) => {
                    console.log('Service Worker registered:', registration);
                  })
                  .catch((error) => {
                    console.error('Service Worker registration failed:', error);
                  });
              });
            }
          `}
        </Script>
      </body>
    </html>
  )
}

