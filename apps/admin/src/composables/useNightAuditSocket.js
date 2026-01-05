import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useSocket } from './useSocket'
import { socketLogger } from '@/utils/logger'

/**
 * Composable for receiving real-time Night Audit progress updates via WebSocket
 * @param {Ref<string>} hotelId - Reactive hotel ID
 * @param {Object} callbacks - Optional callback functions for events
 */
export function useNightAuditSocket(hotelId, callbacks = {}) {
  const { join, leave, on, off, isConnected } = useSocket()

  const auditProgress = ref({
    auditId: null,
    currentStep: 1,
    isCompleted: false,
    lastEvent: null,
    lastUpdate: null
  })

  const eventPrefix = 'night-audit:'
  let currentRoom = null

  // Event handlers
  const handlers = {
    started: data => {
      auditProgress.value = {
        auditId: data.auditId,
        currentStep: data.currentStep || 1,
        isCompleted: false,
        lastEvent: 'started',
        lastUpdate: new Date()
      }
      callbacks.onStarted?.(data)
    },
    'step-complete': data => {
      auditProgress.value.currentStep = data.currentStep
      auditProgress.value.lastEvent = 'step-complete'
      auditProgress.value.lastUpdate = new Date()
      callbacks.onStepComplete?.(data)
    },
    completed: data => {
      auditProgress.value.isCompleted = true
      auditProgress.value.lastEvent = 'completed'
      auditProgress.value.lastUpdate = new Date()
      callbacks.onCompleted?.(data)
    }
  }

  const joinRoom = hId => {
    if (!hId) return

    const room = `night-audit:${hId}`

    // Leave previous room if different
    if (currentRoom && currentRoom !== room) {
      leave(currentRoom)
      // Remove old handlers
      Object.keys(handlers).forEach(event => {
        off(`${eventPrefix}${event}`)
      })
    }

    // Join new room
    join(room)
    currentRoom = room

    // Register event handlers
    Object.entries(handlers).forEach(([event, handler]) => {
      on(`${eventPrefix}${event}`, handler)
    })

    socketLogger.debug('[NightAuditSocket] Joined room:', room)
  }

  const leaveRoom = () => {
    if (currentRoom) {
      // Remove all event handlers
      Object.keys(handlers).forEach(event => {
        off(`${eventPrefix}${event}`)
      })

      leave(currentRoom)
      socketLogger.debug('[NightAuditSocket] Left room:', currentRoom)
      currentRoom = null
    }
  }

  // Helper to get actual hotel ID value
  const getHotelIdValue = () => {
    if (!hotelId) return null
    // Handle both ref and plain value
    return typeof hotelId === 'object' && 'value' in hotelId ? hotelId.value : hotelId
  }

  // Watch for hotel ID changes
  watch(
    () => getHotelIdValue(),
    newHotelId => {
      if (newHotelId) {
        joinRoom(newHotelId)
      } else {
        leaveRoom()
      }
    },
    { immediate: true }
  )

  // Auto-join on mount if hotel ID is available
  onMounted(() => {
    const hId = getHotelIdValue()
    if (hId) {
      joinRoom(hId)
    }
  })

  // Cleanup on unmount
  onUnmounted(() => {
    leaveRoom()
  })

  return {
    auditProgress,
    isConnected,
    joinRoom,
    leaveRoom
  }
}

export default useNightAuditSocket
