import type { Metadata } from 'next'
import './globals.css'
import ServiceWorkerRegistration from './components/ServiceWorkerRegistration'

export const metadata: Metadata = {
  title: 'Daegu Commercial Platform',
  description: '대구 지역 상가 중개업무 효율화를 위한 지도 기반 매물 관리 플랫폼',
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/icons/icon-192x192.png',
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
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  )
}

