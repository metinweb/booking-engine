import { ref, computed, onMounted, onUnmounted } from 'vue'
import { socketLogger } from '@/utils/logger'

/**
 * Offline Sync Composable
 * Handles offline detection, data queuing, and background sync
 */

// Shared state
const isOnline = ref(navigator.onLine)
const pendingOperations = ref([])
const isSyncing = ref(false)

// Database name and store
const DB_NAME = 'pms-offline'
const STORE_NAME = 'pendingOperations'

// Open IndexedDB
const openDatabase = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = event => {
      const db = event.target.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true })
      }
    }
  })
}

// Load pending operations from IndexedDB
const loadPendingOperations = async () => {
  try {
    const db = await openDatabase()
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)

    return new Promise((resolve, reject) => {
      const request = store.getAll()
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        pendingOperations.value = request.result || []
        resolve(request.result)
      }
    })
  } catch (error) {
    socketLogger.error('[OfflineSync] Failed to load pending operations:', error)
    return []
  }
}

// Save operation to IndexedDB
const saveOperation = async operation => {
  try {
    const db = await openDatabase()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)

    return new Promise((resolve, reject) => {
      const request = store.add({
        ...operation,
        createdAt: Date.now()
      })
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        loadPendingOperations() // Refresh list
        resolve(request.result)
      }
    })
  } catch (error) {
    socketLogger.error('[OfflineSync] Failed to save operation:', error)
    throw error
  }
}

// Remove operation from IndexedDB
const removeOperation = async id => {
  try {
    const db = await openDatabase()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)

    return new Promise((resolve, reject) => {
      const request = store.delete(id)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        loadPendingOperations() // Refresh list
        resolve()
      }
    })
  } catch (error) {
    socketLogger.error('[OfflineSync] Failed to remove operation:', error)
    throw error
  }
}

// Sync all pending operations
const syncPendingOperations = async () => {
  if (isSyncing.value || !isOnline.value || pendingOperations.value.length === 0) {
    return
  }

  isSyncing.value = true
  socketLogger.debug('[OfflineSync] Syncing', pendingOperations.value.length, 'operations')

  for (const operation of pendingOperations.value) {
    try {
      const response = await fetch(operation.url, {
        method: operation.method,
        headers: operation.headers,
        body: operation.body
      })

      if (response.ok) {
        await removeOperation(operation.id)
        socketLogger.debug('[OfflineSync] Synced:', operation.id)
      } else {
        socketLogger.error('[OfflineSync] Failed to sync:', operation.id, response.status)
      }
    } catch (error) {
      socketLogger.error('[OfflineSync] Sync error:', operation.id, error)
    }
  }

  isSyncing.value = false
}

export function useOfflineSync() {
  // Pending count
  const pendingCount = computed(() => pendingOperations.value.length)
  const hasPendingOperations = computed(() => pendingOperations.value.length > 0)

  // Queue an operation for offline sync
  const queueOperation = async (url, method, body, headers = {}) => {
    const operation = {
      url,
      method,
      body: body ? JSON.stringify(body) : null,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    }

    // If online, try to execute immediately
    if (isOnline.value) {
      try {
        const response = await fetch(url, {
          method,
          headers: operation.headers,
          body: operation.body
        })

        if (response.ok) {
          return await response.json()
        }
      } catch {
        socketLogger.debug('[OfflineSync] Network error, queueing operation')
      }
    }

    // Queue for later sync
    await saveOperation(operation)

    // Request background sync if available
    if ('serviceWorker' in navigator && 'sync' in window.SyncManager) {
      const registration = await navigator.serviceWorker.ready
      await registration.sync.register(`pms-sync-${Date.now()}`)
    }

    return { queued: true, offline: true }
  }

  // Force sync now
  const forceSync = async () => {
    if (!isOnline.value) {
      socketLogger.debug('[OfflineSync] Cannot sync while offline')
      return false
    }

    await syncPendingOperations()
    return true
  }

  // Clear all pending operations
  const clearPendingOperations = async () => {
    try {
      const db = await openDatabase()
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      await store.clear()
      pendingOperations.value = []
    } catch (error) {
      socketLogger.error('[OfflineSync] Failed to clear operations:', error)
    }
  }

  // Online/offline event handlers
  const handleOnline = () => {
    isOnline.value = true
    socketLogger.debug('[OfflineSync] Back online')
    syncPendingOperations()
  }

  const handleOffline = () => {
    isOnline.value = false
    socketLogger.debug('[OfflineSync] Gone offline')
  }

  // Setup listeners
  onMounted(() => {
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    loadPendingOperations()

    // Sync on mount if online
    if (isOnline.value) {
      syncPendingOperations()
    }
  })

  onUnmounted(() => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  })

  return {
    // State
    isOnline,
    isSyncing,
    pendingOperations,
    pendingCount,
    hasPendingOperations,

    // Methods
    queueOperation,
    forceSync,
    clearPendingOperations,
    loadPendingOperations
  }
}

/**
 * Offline-aware fetch wrapper
 * Use this instead of regular fetch for operations that should work offline
 */
export async function offlineFetch(url, options = {}) {
  const { method = 'GET', body, headers = {} } = options

  // GET requests - try network, fallback to cache
  if (method === 'GET') {
    try {
      const response = await fetch(url, options)
      return response
    } catch {
      // Return offline indicator
      return new Response(JSON.stringify({ success: false, offline: true, error: 'Cevrimdisi' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  }

  // Other methods - queue if offline
  if (!navigator.onLine) {
    await saveOperation({
      url,
      method,
      body: body ? JSON.stringify(body) : null,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    })

    return new Response(JSON.stringify({ success: true, queued: true, offline: true }), {
      status: 202,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  // Online - execute normally
  return fetch(url, options)
}

export default useOfflineSync
