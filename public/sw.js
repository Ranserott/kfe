const CACHE_NAME = 'brewflow-v1'
const urlsToCache = [
  '/',
  '/manifest.json',
  '/favicon.ico',
]

// Install event - cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache)
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
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  self.clients.claim()
})

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Cache hit - return response
      if (response) {
        return response
      }

      // Clone the request
      const fetchRequest = event.request.clone()

      return fetch(fetchRequest).then((response) => {
        // Check if valid response
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response
        }

        // Clone the response
        const responseToCache = response.clone()

        caches.open(CACHE_NAME).then((cache) => {
          // Don't cache API requests
          if (!event.request.url.includes('/api/')) {
            cache.put(event.request, responseToCache)
          }
        })

        return response
      }).catch(() => {
        // Network request failed, try to return cached offline page
        return caches.match('/offline')
      })
    })
  )
})

// Background sync for orders
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-orders') {
    event.waitUntil(syncOrders())
  }
})

async function syncOrders() {
  // Get pending orders from IndexedDB
  const pendingOrders = await getPendingOrders()

  for (const order of pendingOrders) {
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order.data),
      })

      if (response.ok) {
        await removePendingOrder(order.id)
      }
    } catch (error) {
      console.error('Error syncing order:', error)
    }
  }
}

// IndexedDB helpers
async function getPendingOrders() {
  // Implementation would use IndexedDB to store pending orders
  return []
}

async function removePendingOrder(id) {
  // Implementation would remove from IndexedDB
}

// Push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Nueva actualización',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
    },
  }

  event.waitUntil(
    self.registration.showNotification('BrewFlow', options)
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    clients.openWindow('/')
  )
})
