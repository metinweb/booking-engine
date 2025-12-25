/**
 * Service Worker for Booking Platform PWA
 * Handles push notifications and app badge updates
 */

// Immediately take control
self.addEventListener('install', (event) => {
	self.skipWaiting()
})

self.addEventListener('activate', (event) => {
	event.waitUntil(clients.claim())
})

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
