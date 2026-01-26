'use client'

import { useEffect, useState } from 'react'

export default function ServiceWorkerRegistration() {
  const [swStatus, setSwStatus] = useState<'unsupported' | 'supported' | 'registered' | 'updated'>('unsupported')

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      setSwStatus('supported')

      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registrado:', registration)

          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setSwStatus('updated')
                }
              })
            }
          })

          setSwStatus('registered')
        })
        .catch((error) => {
          console.error('Error registrando Service Worker:', error)
        })

      // Listen for controlling service worker
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload()
      })
    }
  }, [])

  // Handle service worker update
  const handleUpdate = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((registration) => {
        registration?.waiting?.postMessage({ type: 'SKIP_WAITING' })
      })
    }
  }

  // Show update notification if available
  if (swStatus === 'updated') {
    return (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-auto z-50">
        <div className="bg-amber-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3">
          <span>Nueva versión disponible</span>
          <button
            onClick={handleUpdate}
            className="bg-white text-amber-600 px-3 py-1 rounded font-medium text-sm"
          >
            Actualizar
          </button>
        </div>
      </div>
    )
  }

  return null
}
