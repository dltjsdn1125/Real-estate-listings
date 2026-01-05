'use client'

import { useEffect } from 'react'

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator && typeof window !== 'undefined') {
      navigator.serviceWorker
        .register('/sw.js', {
          // Service Worker가 업데이트되면 즉시 활성화
          updateViaCache: 'none'
        })
        .then((registration) => {
          console.log('Service Worker registered:', registration)
          
          // Service Worker 업데이트 감지
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (!newWorker) return

            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // 새 Service Worker가 설치되었고, 현재 활성화된 Service Worker가 있음
                // 사용자에게 새로고침 제안 또는 자동 새로고침
                console.log('새 버전의 Service Worker가 설치되었습니다. 새로고침합니다.')
                
                // 페이지 새로고침
                window.location.reload()
              }
            })
          })

          // 주기적으로 업데이트 확인 (5분마다)
          setInterval(() => {
            registration.update()
          }, 5 * 60 * 1000)
          
          // 페이지 포커스 시 업데이트 확인
          const handleFocus = () => {
            registration.update()
          }
          window.addEventListener('focus', handleFocus)
          
          return () => {
            window.removeEventListener('focus', handleFocus)
          }
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error)
        })
    }
  }, [])

  return null
}

