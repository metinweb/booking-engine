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
    <slot />
  </div>
</template>

<script setup>
import { provide, onMounted, onUnmounted, watch } from 'vue'
import { usePmsContext, PMS_CONTEXT_KEY, PMS_CONTEXT_MODE } from '@/composables/usePmsContext'
import { usePMSSocket } from '@/composables/usePMSSocket'
import { disconnectSocket } from '@/composables/useSocket'
import { useHotelStore } from '@/stores/hotel'

// Create the unified PMS context
const pmsContext = usePmsContext()
const hotelStore = useHotelStore()

// Provide to all child components
provide(PMS_CONTEXT_KEY, pmsContext)

// Initialize PMS Socket
const { initPMSSocket, cleanupPMSSocket, joinHotelRoom } = usePMSSocket()

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
          _id: hotel._id || hotel.id  // Ensure _id is set
        }
        hotelStore.setHotel(mappedHotel)
        console.log('[PmsProvider] Synced hotelStore with PMS hotel:', mappedHotel?.name, 'ID:', mappedHotel?._id)
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

  console.log('[PmsProvider] Initialized', {
    mode: pmsContext.mode.value,
    hotelId: pmsContext.hotelId.value,
    user: pmsContext.userName.value
  })
})

// Watch for hotel changes
watch(() => pmsContext.hotelId.value, (newHotelId, oldHotelId) => {
  if (newHotelId && newHotelId !== oldHotelId) {
    console.log('[PmsProvider] Hotel changed:', oldHotelId, '->', newHotelId)
    joinHotelRoom(newHotelId)
    // Keep hotelStore in sync
    syncHotelStore()
  }
})

// Watch for logout
watch(() => pmsContext.isAuthenticated.value, (isAuth) => {
  if (!isAuth) {
    console.log('[PmsProvider] User logged out, cleaning up socket')
    cleanupPMSSocket()
    disconnectSocket()
  }
})

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
