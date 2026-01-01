/**
 * Service Worker for Booking Platform PWA
 * Handles push notifications, caching, and offline support
 */

const CACHE_VERSION = 'v1'
const STATIC_CACHE = `pms-static-${CACHE_VERSION}`
const API_CACHE = `pms-api-${CACHE_VERSION}`

// Static assets to cache
const STATIC_ASSETS = [
	'/',
	'/index.html',
	'/manifest.json',
	'/web-app-manifest-192x192.png',
	'/web-app-manifest-512x512.png',
	'/favicon.ico'
]

// API routes that can be cached (GET only)
const CACHEABLE_API_ROUTES = [
	'/api/pms/hotels/',
	'/api/planning/room-types'
]

// Install - cache static assets
self.addEventListener('install', (event) => {
	event.waitUntil(
		caches.open(STATIC_CACHE)
			.then((cache) => cache.addAll(STATIC_ASSETS))
			.then(() => self.skipWaiting())
	)
})

// Activate - clean old caches
self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches.keys()
			.then((cacheNames) => {
				return Promise.all(
					cacheNames
						.filter((name) => name.startsWith('pms-') && name !== STATIC_CACHE && name !== API_CACHE)
						.map((name) => caches.delete(name))
				)
			})
			.then(() => clients.claim())
	)
})

// Fetch - serve from cache or network
self.addEventListener('fetch', (event) => {
	const { request } = event
	const url = new URL(request.url)

	// Skip non-GET requests
	if (request.method !== 'GET') return

	// Skip non-http(s) requests
	if (!url.protocol.startsWith('http')) return

	// Handle API requests
	if (url.pathname.startsWith('/api/')) {
		event.respondWith(handleApiRequest(request))
		return
	}

	// Handle static assets
	event.respondWith(handleStaticRequest(request))
})

// Handle API requests - Network first, fallback to cache
async function handleApiRequest(request) {
	const url = new URL(request.url)
	const isCacheable = CACHEABLE_API_ROUTES.some(route => url.pathname.includes(route))

	try {
		const response = await fetch(request)
		if (response.ok && isCacheable) {
			const cache = await caches.open(API_CACHE)
			cache.put(request, response.clone())
		}
		return response
	} catch (error) {
		if (isCacheable) {
			const cached = await caches.match(request)
			if (cached) return cached
		}
		return new Response(
			JSON.stringify({ success: false, error: 'Cevrimdisi', offline: true }),
			{ status: 503, headers: { 'Content-Type': 'application/json' } }
		)
	}
}

// Handle static requests - Cache first, update in background
async function handleStaticRequest(request) {
	const cached = await caches.match(request)
	if (cached) {
		// Update cache in background
		fetch(request).then((response) => {
			if (response.ok) {
				caches.open(STATIC_CACHE).then((cache) => cache.put(request, response))
			}
		}).catch(() => {})
		return cached
	}

	try {
		const response = await fetch(request)
		if (response.ok) {
			const cache = await caches.open(STATIC_CACHE)
			cache.put(request, response.clone())
		}
		return response
	} catch (error) {
		if (request.mode === 'navigate') {
			const offlinePage = await caches.match('/index.html')
			if (offlinePage) return offlinePage
		}
		throw error
	}
}

// Background sync for offline operations
self.addEventListener('sync', (event) => {
	if (event.tag.startsWith('pms-sync-')) {
		event.waitUntil(syncOfflineData(event.tag))
	}
})

// Sync offline data from IndexedDB
async function syncOfflineData(tag) {
	try {
		const db = await openDB()
		const tx = db.transaction('pendingOperations', 'readonly')
		const store = tx.objectStore('pendingOperations')
		const operations = await getAllFromStore(store)

		for (const op of operations) {
			try {
				const response = await fetch(op.url, {
					method: op.method,
					headers: op.headers,
					body: op.body
				})
				if (response.ok) {
					const deleteTx = db.transaction('pendingOperations', 'readwrite')
					await deleteTx.objectStore('pendingOperations').delete(op.id)
				}
			} catch (err) {
				console.error('[SW] Sync failed for:', op.id)
			}
		}
	} catch (err) {
		console.error('[SW] Background sync error:', err)
	}
}

function openDB() {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open('pms-offline', 1)
		request.onerror = () => reject(request.error)
		request.onsuccess = () => resolve(request.result)
		request.onupgradeneeded = (e) => {
			const db = e.target.result
			if (!db.objectStoreNames.contains('pendingOperations')) {
				db.createObjectStore('pendingOperations', { keyPath: 'id', autoIncrement: true })
			}
		}
	})
}

function getAllFromStore(store) {
	return new Promise((resolve, reject) => {
		const request = store.getAll()
		request.onerror = () => reject(request.error)
		request.onsuccess = () => resolve(request.result)
	})
}

// Handle push notifications
self.addEventListener('push', (event) => {
	if (!event.data) return

	let data
	try {
		data = event.data.json()
	} catch {
		data = {
			title: 'Booking Platform',
			body: event.data.text()
		}
	}

	// Handle silent push (badge update only)
	if (data.silent) {
		event.waitUntil(updateBadge(data.data?.unreadCount || 0))
		return
	}

	// Update app badge with unread count
	if (data.data?.unreadCount !== undefined) {
		updateBadge(data.data.unreadCount)
	}

	// Show notification
	const options = {
		body: data.body || '',
		icon: data.icon || '/web-app-manifest-192x192.png',
		badge: data.badge || '/favicon-96x96.png',
		vibrate: data.vibrate || [100],
		tag: data.data?.type || 'default',
		renotify: true,
		requireInteraction: data.data?.type === 'fire', // Fire alerts stay until dismissed
		data: data.data || {},
		actions: [
			{ action: 'open', title: 'Ac' },
			{ action: 'close', title: 'Kapat' }
		]
	}

	event.waitUntil(self.registration.showNotification(data.title || 'Booking Platform', options))
})

// Handle notification click
self.addEventListener('notificationclick', (event) => {
	event.notification.close()

	if (event.action === 'close') {
		return
	}

	// Open app or focus existing window
	event.waitUntil(
		clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
			// Check if app is already open
			for (const client of clientList) {
				if (client.url.includes(self.location.origin) && 'focus' in client) {
					// Send message to app about clicked notification
					client.postMessage({
						type: 'NOTIFICATION_CLICKED',
						data: event.notification.data
					})
					return client.focus()
				}
			}

			// Open new window if app is not open
			if (clients.openWindow) {
				let url = '/'

				// Navigate to specific page based on notification type
				const notificationData = event.notification.data
				if (notificationData?.type === 'fire' || notificationData?.type === 'human' || notificationData?.type === 'theft') {
					// Pass notification data as query params to open the correct modal
					const params = new URLSearchParams()
					if (notificationData.cameraId) params.set('cameraId', notificationData.cameraId)
					if (notificationData.timestamp) params.set('timestamp', notificationData.timestamp)
					if (notificationData.type) params.set('type', notificationData.type)
					url = '/notifications' + (params.toString() ? '?' + params.toString() : '')
				}

				return clients.openWindow(url)
			}
		})
	)
})

// Handle notification close
self.addEventListener('notificationclose', (event) => {
	// Optional: Track notification dismissals
	console.log('[SW] Notification closed:', event.notification.tag)
})

// Update app badge
async function updateBadge(count) {
	if ('setAppBadge' in navigator) {
		try {
			if (count > 0) {
				await navigator.setAppBadge(count)
			} else {
				await navigator.clearAppBadge()
			}
		} catch (err) {
			console.error('[SW] Badge update failed:', err)
		}
	}
}

// Handle messages from app
self.addEventListener('message', (event) => {
	if (event.data?.type === 'UPDATE_BADGE') {
		updateBadge(event.data.count || 0)
	}

	if (event.data?.type === 'SKIP_WAITING') {
		self.skipWaiting()
	}
})
