import { useEffect, useState, useCallback } from 'react'

interface OfflineOrder {
  id: string
  data: any
  timestamp: number
  retries: number
}

const DB_NAME = 'kfeOffline'
const DB_VERSION = 1
const STORE_NAME = 'pendingOrders'

export function useOfflineStorage() {
  const [isOnline, setIsOnline] = useState(true)
  const [pendingOrders, setPendingOrders] = useState<OfflineOrder[]>([])
  const [db, setDb] = useState<IDBDatabase | null>(null)

  // Initialize IndexedDB
  useEffect(() => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      console.error('Error opening IndexedDB')
    }

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = database.createObjectStore(STORE_NAME, { keyPath: 'id' })
        objectStore.createIndex('timestamp', 'timestamp', { unique: false })
      }
    }

    request.onsuccess = (event) => {
      setDb((event.target as IDBOpenDBRequest).result as IDBDatabase)
      loadPendingOrders((event.target as IDBOpenDBRequest).result as IDBDatabase)
    }

    // Monitor online/offline status
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const loadPendingOrders = useCallback((database: IDBDatabase) => {
    const transaction = database.transaction([STORE_NAME], 'readonly')
    const objectStore = transaction.objectStore(STORE_NAME)
    const request = objectStore.getAll()

    request.onsuccess = () => {
      setPendingOrders(request.result)
    }
  }, [])

  const savePendingOrder = useCallback(
    (orderData: any): Promise<string> => {
      return new Promise((resolve, reject) => {
        if (!db) {
          reject(new Error('Database not initialized'))
          return
        }

        const orderId = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const order: OfflineOrder = {
          id: orderId,
          data: orderData,
          timestamp: Date.now(),
          retries: 0,
        }

        const transaction = db.transaction([STORE_NAME], 'readwrite')
        const objectStore = transaction.objectStore(STORE_NAME)
        const request = objectStore.add(order)

        request.onsuccess = () => {
          setPendingOrders((prev) => [...prev, order])
          resolve(orderId)
        }

        request.onerror = () => {
          reject(new Error('Failed to save order'))
        }
      })
    },
    [db]
  )

  const removePendingOrder = useCallback(
    (orderId: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (!db) {
          reject(new Error('Database not initialized'))
          return
        }

        const transaction = db.transaction([STORE_NAME], 'readwrite')
        const objectStore = transaction.objectStore(STORE_NAME)
        const request = objectStore.delete(orderId)

        request.onsuccess = () => {
          setPendingOrders((prev) => prev.filter((o) => o.id !== orderId))
          resolve()
        }

        request.onerror = () => {
          reject(new Error('Failed to remove order'))
        }
      })
    },
    [db]
  )

  const syncPendingOrders = useCallback(async () => {
    if (!isOnline || pendingOrders.length === 0) return

    for (const order of pendingOrders) {
      try {
        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(order.data),
        })

        if (response.ok) {
          await removePendingOrder(order.id)
        } else {
          // Increment retry count
          const updatedOrder = { ...order, retries: order.retries + 1 }

          const transaction = db?.transaction([STORE_NAME], 'readwrite')
          const objectStore = transaction?.objectStore(STORE_NAME)
          objectStore?.put(updatedOrder)
        }
      } catch (error) {
        console.error('Error syncing order:', error)
      }
    }
  }, [isOnline, pendingOrders, db, removePendingOrder])

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && pendingOrders.length > 0) {
      syncPendingOrders()
    }
  }, [isOnline, pendingOrders, syncPendingOrders])

  return {
    isOnline,
    pendingOrders,
    savePendingOrder,
    removePendingOrder,
    syncPendingOrders,
    pendingOrdersCount: pendingOrders.length,
  }
}
