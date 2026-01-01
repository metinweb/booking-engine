/**
 * PMS Socket Composable
 *
 * PMS-specific socket event handling.
 * useSocket composable üzerine inşa edilmiştir.
 *
 * Özellikler:
 * - Hotel-bazlı room subscription
 * - PMS event callbacks (check-in, check-out, housekeeping, etc.)
 * - Otomatik callback cleanup
 * - Debug logging
 *
 * Kullanım:
 *   // PMSLayout.vue (bir kez initialize)
 *   const { initPMSSocket, cleanupPMSSocket } = usePMSSocket()
 *   onMounted(() => initPMSSocket(hotelId))
 *   onUnmounted(() => cleanupPMSSocket())
 *
 *   // Child components (callback register)
 *   const { onCheckIn, onCheckOut } = usePMSSocket()
 *   const unsubscribe = onCheckIn((data) => { ... })
 *   onUnmounted(() => unsubscribe())
 */

import { ref, readonly, computed } from 'vue'
import { useSocket } from './useSocket'

// ============================================================================
// PMS SOCKET EVENTS
// ============================================================================

export const PMS_EVENTS = {
  ROOM_STATUS: 'pms:room:status',
  CHECK_IN: 'pms:checkin',
  CHECK_OUT: 'pms:checkout',
  HOUSEKEEPING: 'pms:housekeeping',
  RESERVATION: 'pms:reservation',
  TRANSACTION: 'pms:transaction',
  NOTIFICATION: 'pms:notification'
}

// ============================================================================
// SINGLETON STATE
// ============================================================================

const currentHotelId = ref(null)
const isInitialized = ref(false)
const eventUnsubscribers = []

// Callback registries
const callbacks = {
  roomStatus: new Set(),
  checkIn: new Set(),
  checkOut: new Set(),
  housekeeping: new Set(),
  reservation: new Set(),
  transaction: new Set(),
  notification: new Set()
}

// ============================================================================
// COMPOSABLE
// ============================================================================

export function usePMSSocket() {
  const { join, leave, on, off, isConnected, connectionError, debug: socketDebug } = useSocket()

  // ============================================================================
  // ROOM MANAGEMENT
  // ============================================================================

  /**
   * Generate room name for hotel
   */
  const getRoomName = (hotelId) => `pms:${hotelId}`

  /**
   * Join hotel room
   */
  const joinHotelRoom = (hotelId) => {
    if (!hotelId) {
      console.warn('[PMS Socket] Cannot join: no hotelId')
      return
    }

    // Leave previous room if different
    if (currentHotelId.value && currentHotelId.value !== hotelId) {
      leave(getRoomName(currentHotelId.value))
      console.log('[PMS Socket] Left previous room:', getRoomName(currentHotelId.value))
    }

    // Join new room
    if (currentHotelId.value !== hotelId) {
      join(getRoomName(hotelId))
      currentHotelId.value = hotelId
      console.log('[PMS Socket] Joined room:', getRoomName(hotelId))
    }
  }

  /**
   * Leave hotel room
   */
  const leaveHotelRoom = () => {
    if (currentHotelId.value) {
      leave(getRoomName(currentHotelId.value))
      console.log('[PMS Socket] Left room:', getRoomName(currentHotelId.value))
      currentHotelId.value = null
    }
  }

  // ============================================================================
  // EVENT LISTENERS SETUP
  // ============================================================================

  /**
   * Setup PMS event listeners
   */
  const setupEventListeners = () => {
    // Room status changes
    eventUnsubscribers.push(
      on(PMS_EVENTS.ROOM_STATUS, (data) => {
        console.log('[PMS Socket] Room status:', data)
        callbacks.roomStatus.forEach(cb => {
          try {
            cb(data)
          } catch (e) {
            console.error('[PMS Socket] Callback error (roomStatus):', e)
          }
        })
      })
    )

    // Check-in events
    eventUnsubscribers.push(
      on(PMS_EVENTS.CHECK_IN, (data) => {
        console.log('[PMS Socket] Check-in:', data)
        callbacks.checkIn.forEach(cb => {
          try {
            cb(data)
          } catch (e) {
            console.error('[PMS Socket] Callback error (checkIn):', e)
          }
        })
      })
    )

    // Check-out events
    eventUnsubscribers.push(
      on(PMS_EVENTS.CHECK_OUT, (data) => {
        console.log('[PMS Socket] Check-out:', data)
        callbacks.checkOut.forEach(cb => {
          try {
            cb(data)
          } catch (e) {
            console.error('[PMS Socket] Callback error (checkOut):', e)
          }
        })
      })
    )

    // Housekeeping events
    eventUnsubscribers.push(
      on(PMS_EVENTS.HOUSEKEEPING, (data) => {
        console.log('[PMS Socket] Housekeeping:', data)
        callbacks.housekeeping.forEach(cb => {
          try {
            cb(data)
          } catch (e) {
            console.error('[PMS Socket] Callback error (housekeeping):', e)
          }
        })
      })
    )

    // Reservation events
    eventUnsubscribers.push(
      on(PMS_EVENTS.RESERVATION, (data) => {
        console.log('[PMS Socket] Reservation:', data)
        callbacks.reservation.forEach(cb => {
          try {
            cb(data)
          } catch (e) {
            console.error('[PMS Socket] Callback error (reservation):', e)
          }
        })
      })
    )

    // Transaction events
    eventUnsubscribers.push(
      on(PMS_EVENTS.TRANSACTION, (data) => {
        console.log('[PMS Socket] Transaction:', data)
        callbacks.transaction.forEach(cb => {
          try {
            cb(data)
          } catch (e) {
            console.error('[PMS Socket] Callback error (transaction):', e)
          }
        })
      })
    )

    // Notification events
    eventUnsubscribers.push(
      on(PMS_EVENTS.NOTIFICATION, (data) => {
        console.log('[PMS Socket] Notification:', data)
        callbacks.notification.forEach(cb => {
          try {
            cb(data)
          } catch (e) {
            console.error('[PMS Socket] Callback error (notification):', e)
          }
        })
      })
    )
  }

  /**
   * Cleanup event listeners
   */
  const cleanupEventListeners = () => {
    eventUnsubscribers.forEach(unsub => {
      if (typeof unsub === 'function') {
        unsub()
      }
    })
    eventUnsubscribers.length = 0
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  /**
   * Initialize PMS Socket (call once from PMSLayout)
   */
  const initPMSSocket = (hotelId) => {
    if (isInitialized.value) {
      // Already initialized - just update room if needed
      const id = hotelId?.value || hotelId
      if (id && currentHotelId.value !== id) {
        joinHotelRoom(id)
      }
      return
    }

    console.log('[PMS Socket] Initializing...')
    setupEventListeners()
    isInitialized.value = true

    const id = hotelId?.value || hotelId
    if (id) {
      joinHotelRoom(id)
    }

    console.log('[PMS Socket] Initialized')
  }

  /**
   * Cleanup PMS Socket (call from PMSLayout unmount)
   */
  const cleanupPMSSocket = () => {
    if (!isInitialized.value) return

    console.log('[PMS Socket] Cleaning up...')

    leaveHotelRoom()
    cleanupEventListeners()

    // Clear all callbacks
    Object.values(callbacks).forEach(set => set.clear())

    isInitialized.value = false
    console.log('[PMS Socket] Cleaned up')
  }

  // ============================================================================
  // CALLBACK REGISTRATION
  // ============================================================================

  /**
   * Create callback registrar
   * @param {Set} callbackSet - Callback set to add/remove from
   * @returns {Function} Registrar function
   */
  const createCallbackRegistrar = (callbackSet) => {
    return (callback) => {
      if (typeof callback !== 'function') {
        console.warn('[PMS Socket] Callback must be a function')
        return () => {}
      }

      callbackSet.add(callback)

      // Return unsubscribe function
      return () => {
        callbackSet.delete(callback)
      }
    }
  }

  // Callback registrars
  const onRoomStatusChange = createCallbackRegistrar(callbacks.roomStatus)
  const onCheckIn = createCallbackRegistrar(callbacks.checkIn)
  const onCheckOut = createCallbackRegistrar(callbacks.checkOut)
  const onHousekeeping = createCallbackRegistrar(callbacks.housekeeping)
  const onReservation = createCallbackRegistrar(callbacks.reservation)
  const onTransaction = createCallbackRegistrar(callbacks.transaction)
  const onNotification = createCallbackRegistrar(callbacks.notification)

  // ============================================================================
  // DEBUG
  // ============================================================================

  const debug = () => {
    console.group('[PMS Socket Debug]')
    console.log('Initialized:', isInitialized.value)
    console.log('Current Hotel ID:', currentHotelId.value)
    console.log('Connected:', isConnected.value)
    console.log('Callback counts:', {
      roomStatus: callbacks.roomStatus.size,
      checkIn: callbacks.checkIn.size,
      checkOut: callbacks.checkOut.size,
      housekeeping: callbacks.housekeeping.size,
      reservation: callbacks.reservation.size,
      transaction: callbacks.transaction.size,
      notification: callbacks.notification.size
    })
    console.groupEnd()

    // Also show base socket debug
    socketDebug()
  }

  // ============================================================================
  // RETURN
  // ============================================================================

  return {
    // State
    isConnected,
    connectionError,
    currentRoom: readonly(currentHotelId),
    isInitialized: readonly(isInitialized),

    // Lifecycle (PMSLayout only)
    initPMSSocket,
    cleanupPMSSocket,
    joinHotelRoom,
    leaveHotelRoom,

    // Event callbacks (any component)
    onRoomStatusChange,
    onCheckIn,
    onCheckOut,
    onHousekeeping,
    onReservation,
    onTransaction,
    onNotification,

    // Debug
    debug
  }
}

export default usePMSSocket
