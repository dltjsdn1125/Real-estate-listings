// Service Worker for PWA
const CACHE_NAME = 'daegu-commercial-platform-v1'
const STATIC_CACHE_NAME = 'daegu-commercial-platform-static-v1'

// 캐시하지 않을 페이지 목록 (항상 최신 버전을 가져와야 하는 페이지)
const NO_CACHE_PATHS = ['/map', '/admin', '/properties']

// 정적 파일만 캐시 (페이지는 제외)
const urlsToCache = [
  '/',
  '/manifest.json',
  '/offline.html',
]

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Opened static cache')
        return cache.addAll(urlsToCache)
      })
      .catch((error) => {
        console.error('Cache install failed:', error)
      })
  )
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // 현재 버전과 정적 캐시가 아니면 모두 삭제
          if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE_NAME) {
            console.log('Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  return self.clients.claim()
})

// 페이지가 캐시되지 않아야 하는지 확인
function shouldNotCache(url) {
  try {
    const urlPath = new URL(url).pathname
    return NO_CACHE_PATHS.some(path => urlPath.startsWith(path))
  } catch {
    return false
  }
}

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return
  }

  // Skip chrome-extension and other protocols
  if (!event.request.url.startsWith('http')) {
    return
  }

  // Skip Next.js internal files in development
  if (event.request.url.includes('/_next/') || event.request.url.includes('/__nextjs')) {
    return
  }

  // 캐시하지 않아야 하는 페이지는 Network First (항상 최신 버전)
  if (shouldNotCache(event.request.url)) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // 네트워크 응답만 반환 (캐시하지 않음)
          return response
        })
        .catch(() => {
          // 네트워크 실패 시에만 오프라인 페이지
          if (event.request.mode === 'navigate') {
            return caches.match('/offline.html').then((offlineResponse) => {
              return offlineResponse || new Response('Offline', { status: 503 })
            })
          }
          return new Response('Network error', { status: 503 })
        })
    )
    return
  }

  // 일반 페이지는 Network First 전략 (최신 콘텐츠 우선, 실패 시 캐시)
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Check if valid response
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response
        }

        // Clone the response because it's a stream
        const responseToCache = response.clone()

        // 정적 리소스만 캐시
        if (event.request.url.includes('/manifest.json') || 
            event.request.url.includes('/offline.html')) {
          caches.open(STATIC_CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache).catch(() => {
              // Ignore cache errors
            })
          })
        }

        return response
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse
          }
          
          // Cache miss, return offline page if navigation request
          if (event.request.mode === 'navigate') {
            return caches.match('/offline.html').then((offlineResponse) => {
              return offlineResponse || new Response('Offline', { status: 503 })
            })
          }
          return new Response('Network error', { status: 503 })
        })
      })
  )
})

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-properties') {
    event.waitUntil(
      // Sync logic here
      Promise.resolve()
    )
  }
})

// Push notification
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : '새로운 알림이 있습니다.',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    tag: 'notification',
    requireInteraction: false,
  }

  event.waitUntil(
    self.registration.showNotification('대구 상가 플랫폼', options)
  )
})

// Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  event.waitUntil(
    clients.openWindow('/')
  )
})

