import { ref, onMounted, onUnmounted } from 'vue'
import { io } from 'socket.io-client'

// Singleton socket instance
let socket = null
const isConnected = ref(false)
const connectionError = ref(null)

/**
 * Get or create the socket connection
 */
const getSocket = () => {
  if (!socket) {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000'

    socket = io(baseUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    })

    socket.on('connect', () => {
      isConnected.value = true
      connectionError.value = null
      console.log('[Socket] Connected:', socket.id)
    })

    socket.on('disconnect', (reason) => {
      isConnected.value = false
      console.log('[Socket] Disconnected:', reason)
    })

    socket.on('connect_error', (error) => {
      connectionError.value = error.message
      console.error('[Socket] Connection error:', error.message)
    })
  }

  return socket
}

/**
 * Socket composable for Vue components
 */
export function useSocket() {
  const sock = getSocket()

  return {
    socket: sock,
    isConnected,
    connectionError,

    /**
     * Join a room to receive events for a specific operation
     * @param {string} room - Room name (usually operation ID)
     */
    join(room) {
      if (sock && room) {
        sock.emit('join', room)
        console.log('[Socket] Joined room:', room)
      }
    },

    /**
     * Leave a room
     * @param {string} room - Room name
     */
    leave(room) {
      if (sock && room) {
        sock.emit('leave', room)
        console.log('[Socket] Left room:', room)
      }
    },

    /**
     * Listen for an event
     * @param {string} event - Event name
     * @param {function} callback - Event handler
     */
    on(event, callback) {
      if (sock) {
        sock.on(event, callback)
      }
    },

    /**
     * Remove event listener
     * @param {string} event - Event name
     * @param {function} callback - Event handler (optional, removes all if not provided)
     */
    off(event, callback) {
      if (sock) {
        if (callback) {
          sock.off(event, callback)
        } else {
          sock.removeAllListeners(event)
        }
      }
    }
  }
}

/**
 * Hook for tracking extraction progress
 * @param {string} operationId - The operation ID to track
 * @param {object} callbacks - Callback functions for progress events
 */
export function useExtractionProgress(operationId, callbacks = {}) {
  const { socket, join, leave, on, off } = useSocket()

  const progress = ref({
    steps: [],
    currentStep: null,
    currentStepIndex: -1,
    isComplete: false,
    isFailed: false,
    error: null,
    result: null
  })

  const eventPrefix = 'hotel-extract:'

  const handlers = {
    init: (data) => {
      progress.value.steps = data.steps || []
      callbacks.onInit?.(data)
    },
    'step:start': (data) => {
      progress.value.currentStep = data.stepId
      progress.value.currentStepIndex = data.stepIndex
      if (progress.value.steps[data.stepIndex]) {
        progress.value.steps[data.stepIndex].status = 'in_progress'
        progress.value.steps[data.stepIndex].data = data.data
      }
      callbacks.onStepStart?.(data)
    },
    'step:update': (data) => {
      if (progress.value.steps[data.stepIndex]) {
        progress.value.steps[data.stepIndex].data = {
          ...progress.value.steps[data.stepIndex].data,
          ...data.data
        }
      }
      callbacks.onStepUpdate?.(data)
    },
    'step:complete': (data) => {
      if (progress.value.steps[data.stepIndex]) {
        progress.value.steps[data.stepIndex].status = 'completed'
        progress.value.steps[data.stepIndex].duration = data.duration
        progress.value.steps[data.stepIndex].data = {
          ...progress.value.steps[data.stepIndex].data,
          ...data.data
        }
      }
      callbacks.onStepComplete?.(data)
    },
    'step:fail': (data) => {
      if (progress.value.steps[data.stepIndex]) {
        progress.value.steps[data.stepIndex].status = 'failed'
        progress.value.steps[data.stepIndex].error = data.error
      }
      callbacks.onStepFail?.(data)
    },
    complete: (data) => {
      progress.value.isComplete = true
      progress.value.result = data.result
      callbacks.onComplete?.(data)
    },
    fail: (data) => {
      progress.value.isFailed = true
      progress.value.error = data.error
      callbacks.onFail?.(data)
    }
  }

  const startListening = () => {
    if (!operationId) return

    // Join the room for this operation
    join(operationId)

    // Register all event handlers
    Object.entries(handlers).forEach(([event, handler]) => {
      on(`${eventPrefix}${event}`, handler)
    })
  }

  const stopListening = () => {
    if (!operationId) return

    // Remove all event handlers
    Object.keys(handlers).forEach(event => {
      off(`${eventPrefix}${event}`)
    })

    // Leave the room
    leave(operationId)
  }

  // Auto-start listening when operationId is provided
  onMounted(() => {
    if (operationId) {
      startListening()
    }
  })

  // Cleanup on unmount
  onUnmounted(() => {
    stopListening()
  })

  return {
    progress,
    startListening,
    stopListening
  }
}

export default useSocket
