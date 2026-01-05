<!--
  PMS Provider Component

  This component provides the unified PMS context to all child components.
  It should wrap the entire PMS module (used in PMSLayout.vue).

  Usage:
    <PmsProvider>
      <router-view />
    </PmsProvider>

  Child components can access the context via:
    import { inject } from 'vue'
    import { PMS_CONTEXT_KEY } from '@/composables/usePmsContext'

    const pmsContext = inject(PMS_CONTEXT_KEY)
    // or use the helper:
    import { usePmsContextInjection } from '@/composables/usePmsContext'
    const { hotelId, user, hasPermission } = usePmsContextInjection()
-->
<template>
  <div class="pms-provider-wrapper">
    <slot></slot>
  </div>
</template>

<script setup>
import { provide, onMounted, onUnmounted, watch } from 'vue'
import { usePmsContext, PMS_CONTEXT_KEY } from '@/composables/usePmsContext'
import { usePMSSocket } from '@/composables/usePMSSocket'
import { disconnectSocket, useSocket } from '@/composables/useSocket'
import { useHotelStore } from '@/stores/hotel'
import { useNotificationStore } from '@/stores/notification'

// Create the unified PMS context
const pmsContext = usePmsContext()
const hotelStore = useHotelStore()
const notificationStore = useNotificationStore()
const { authenticate, on: onSocketEvent } = useSocket()

// Provide to all child components
provide(PMS_CONTEXT_KEY, pmsContext)

// Initialize PMS Socket
const { initPMSSocket, cleanupPMSSocket, joinHotelRoom } = usePMSSocket()

/**
 * Initialize notifications for PMS user
 * This authenticates the socket for user-specific notifications
 */
const initPMSNotifications = async () => {
  const pmsToken = localStorage.getItem('pmsToken')
  const pmsUserData = localStorage.getItem('pmsUser')

  if (!pmsToken || !pmsUserData) {
    console.log('[PmsProvider] No PMS session, skipping notification init')
    return
  }

  try {
    const pmsUser = JSON.parse(pmsUserData)
    const userId = pmsUser._id || pmsUser.id

    if (!userId) {
      console.warn('[PmsProvider] PMS user has no ID, cannot init notifications')
      return
    }

    console.log('[PmsProvider] Authenticating socket for notifications:', {
      userId,
      userName: pmsUser.name
    })
    authenticate(userId, 'PMSUser')

    // Listen for new notifications
    onSocketEvent('notification:new', data => {
      console.log('[PmsProvider] Received notification:new event:', data)
      notificationStore.handleNewNotification(data.notification)
    })

    // Listen for notification count updates
    onSocketEvent('notification:count', data => {
      notificationStore.handleCountUpdate(data.count)
    })

    // Fetch initial unread count
    await notificationStore.init()
    console.log('[PmsProvider] Notifications initialized')
  } catch (e) {
    console.error('[PmsProvider] Failed to init notifications:', e)
  }
}

/**
 * Sync hotelStore with pmsContext for PMS user mode
 * This ensures views using hotelStore.hotelId work correctly
 */
const syncHotelStore = () => {
  // Check for PMS token directly (synchronous check)
  const pmsToken = localStorage.getItem('pmsToken')
  const pmsHotel = localStorage.getItem('pmsCurrentHotel')

  if (pmsToken && pmsHotel) {
    try {
      const hotel = JSON.parse(pmsHotel)
      if (hotel) {
        // Map PMS hotel format to hotelStore format
        // PMS returns {id, name, role, permissions} but hotelStore expects {_id, name}
        const mappedHotel = {
          ...hotel,
          _id: hotel._id || hotel.id // Ensure _id is set
        }
        hotelStore.setHotel(mappedHotel)
        console.log(
          '[PmsProvider] Synced hotelStore with PMS hotel:',
          mappedHotel?.name,
          'ID:',
          mappedHotel?._id
        )
      }
    } catch (e) {
      console.error('[PmsProvider] Failed to parse PMS hotel:', e)
    }
  }
}

// Sync immediately on script setup (before any rendering)
syncHotelStore()

// Initialize on mount
onMounted(async () => {
  // Initialize context (detect mode)
  await pmsContext.initialize()

  // Re-sync hotelStore in case it wasn't set
  syncHotelStore()

  // Initialize socket with current hotel
  if (pmsContext.hotelId.value) {
    initPMSSocket(pmsContext.hotelId.value)
  }

  // Initialize notifications for PMS user
  // This authenticates the socket for user-specific notification delivery
  await initPMSNotifications()

  console.log('[PmsProvider] Initialized', {
    mode: pmsContext.mode.value,
    hotelId: pmsContext.hotelId.value,
    user: pmsContext.userName.value
  })
})

// Watch for hotel changes
watch(
  () => pmsContext.hotelId.value,
  (newHotelId, oldHotelId) => {
    if (newHotelId && newHotelId !== oldHotelId) {
      console.log('[PmsProvider] Hotel changed:', oldHotelId, '->', newHotelId)
      joinHotelRoom(newHotelId)
      // Keep hotelStore in sync
      syncHotelStore()
    }
  }
)

// Watch for logout
watch(
  () => pmsContext.isAuthenticated.value,
  isAuth => {
    if (!isAuth) {
      console.log('[PmsProvider] User logged out, cleaning up socket and notifications')
      notificationStore.clearNotifications()
      cleanupPMSSocket()
      disconnectSocket()
    }
  }
)

// Cleanup on unmount
onUnmounted(() => {
  cleanupPMSSocket()
  console.log('[PmsProvider] Cleaned up')
})

// Expose context for debugging
defineExpose({
  pmsContext
})
</script>
