// Service Worker for PWA
const CACHE_NAME = 'daegu-commercial-platform-v1'
const urlsToCache = [
  '/',
  '/map',
  '/manifest.json',
  '/offline.html',
]

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache')
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
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  return self.clients.claim()
})

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

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response
        }

        // Clone the request because it's a stream
        const fetchRequest = event.request.clone()

        return fetch(fetchRequest)
          .then((response) => {
            // Check if valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response
            }

            // Clone the response because it's a stream
            const responseToCache = response.clone()

            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache).catch(() => {
                // Ignore cache errors
              })
            })

            return response
          })
          .catch(() => {
            // Network failed, return offline page if navigation request
            if (event.request.mode === 'navigate') {
              return caches.match('/offline.html').then((offlineResponse) => {
                return offlineResponse || new Response('Offline', { status: 503 })
              })
            }
            // For non-navigation requests, return a basic error response
            return new Response('Network error', { status: 503 })
          })
      })
      .catch(() => {
        // If cache match fails, try network
        return fetch(event.request).catch(() => {
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

