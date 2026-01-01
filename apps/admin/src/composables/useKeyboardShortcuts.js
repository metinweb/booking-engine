import { ref, onMounted, onUnmounted, watch } from 'vue'

/**
 * Keyboard Shortcuts Composable
 * Provides global and context-aware keyboard shortcuts for PMS
 *
 * Usage:
 * const { registerShortcut, unregisterShortcut } = useKeyboardShortcuts()
 * registerShortcut('ctrl+s', handleSave)
 */

// Global shortcut registry
const globalShortcuts = new Map()
const isEnabled = ref(true)

// Parse shortcut string to key combo
const parseShortcut = (shortcut) => {
  const parts = shortcut.toLowerCase().split('+')
  return {
    ctrl: parts.includes('ctrl') || parts.includes('control'),
    alt: parts.includes('alt'),
    shift: parts.includes('shift'),
    meta: parts.includes('meta') || parts.includes('cmd'),
    key: parts.filter(p => !['ctrl', 'control', 'alt', 'shift', 'meta', 'cmd'].includes(p))[0]
  }
}

// Check if event matches shortcut
const matchesShortcut = (event, combo) => {
  const keyMatch = event.key.toLowerCase() === combo.key ||
    event.code.toLowerCase() === combo.key ||
    event.code.toLowerCase() === `key${combo.key}`

  return (
    keyMatch &&
    event.ctrlKey === combo.ctrl &&
    event.altKey === combo.alt &&
    event.shiftKey === combo.shift &&
    event.metaKey === combo.meta
  )
}

// Check if user is typing in an input
const isTyping = (event) => {
  const target = event.target
  const tagName = target.tagName.toLowerCase()
  const isContentEditable = target.isContentEditable

  // Allow shortcuts even in inputs for specific keys
  const allowedInInputs = ['escape', 'f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8', 'f9', 'f10', 'f11', 'f12']
  const key = event.key.toLowerCase()

  if (allowedInInputs.includes(key)) {
    return false
  }

  // Allow Ctrl+S in inputs
  if (event.ctrlKey && key === 's') {
    return false
  }

  return tagName === 'input' || tagName === 'textarea' || tagName === 'select' || isContentEditable
}

// Global keyboard event handler
const handleKeyDown = (event) => {
  if (!isEnabled.value) return
  if (isTyping(event)) return

  for (const [shortcut, handler] of globalShortcuts) {
    const combo = parseShortcut(shortcut)
    if (matchesShortcut(event, combo)) {
      event.preventDefault()
      event.stopPropagation()
      handler(event)
      return
    }
  }
}

// Initialize global listener
let isInitialized = false
const initializeGlobalListener = () => {
  if (isInitialized) return
  document.addEventListener('keydown', handleKeyDown, true)
  isInitialized = true
}

const cleanupGlobalListener = () => {
  if (!isInitialized) return
  if (globalShortcuts.size === 0) {
    document.removeEventListener('keydown', handleKeyDown, true)
    isInitialized = false
  }
}

/**
 * Main composable
 */
export function useKeyboardShortcuts(options = {}) {
  const localShortcuts = new Map()

  // Register a shortcut
  const registerShortcut = (shortcut, handler, description = '') => {
    const normalizedShortcut = shortcut.toLowerCase()
    globalShortcuts.set(normalizedShortcut, handler)
    localShortcuts.set(normalizedShortcut, { handler, description })
    initializeGlobalListener()
  }

  // Unregister a shortcut
  const unregisterShortcut = (shortcut) => {
    const normalizedShortcut = shortcut.toLowerCase()
    globalShortcuts.delete(normalizedShortcut)
    localShortcuts.delete(normalizedShortcut)
    cleanupGlobalListener()
  }

  // Enable/disable shortcuts
  const enableShortcuts = () => {
    isEnabled.value = true
  }

  const disableShortcuts = () => {
    isEnabled.value = false
  }

  // Get all registered shortcuts with descriptions
  const getRegisteredShortcuts = () => {
    return Array.from(localShortcuts.entries()).map(([key, value]) => ({
      shortcut: key,
      description: value.description
    }))
  }

  // Cleanup on unmount
  onUnmounted(() => {
    for (const shortcut of localShortcuts.keys()) {
      globalShortcuts.delete(shortcut)
    }
    localShortcuts.clear()
    cleanupGlobalListener()
  })

  return {
    registerShortcut,
    unregisterShortcut,
    enableShortcuts,
    disableShortcuts,
    getRegisteredShortcuts,
    isEnabled
  }
}

/**
 * PMS-specific shortcuts composable
 */
export function usePMSShortcuts(options = {}) {
  const {
    onNewWalkIn,
    onNewReservation,
    onSearch,
    onSave,
    onCancel
  } = options

  const { registerShortcut, unregisterShortcut } = useKeyboardShortcuts()

  onMounted(() => {
    // F2 - New Walk-in
    if (onNewWalkIn) {
      registerShortcut('f2', onNewWalkIn, 'Yeni Walk-in')
    }

    // F3 - New Reservation
    if (onNewReservation) {
      registerShortcut('f3', onNewReservation, 'Yeni Rezervasyon')
    }

    // F4 or Ctrl+F - Search
    if (onSearch) {
      registerShortcut('f4', onSearch, 'Arama')
      registerShortcut('ctrl+f', onSearch, 'Arama')
    }

    // Ctrl+S - Save
    if (onSave) {
      registerShortcut('ctrl+s', onSave, 'Kaydet')
    }

    // Escape - Cancel/Close
    if (onCancel) {
      registerShortcut('escape', onCancel, 'Iptal/Kapat')
    }
  })

  return {
    registerShortcut,
    unregisterShortcut
  }
}

/**
 * Format shortcut for display
 */
export const formatShortcut = (shortcut) => {
  return shortcut
    .split('+')
    .map(key => {
      switch (key.toLowerCase()) {
        case 'ctrl':
        case 'control':
          return 'Ctrl'
        case 'alt':
          return 'Alt'
        case 'shift':
          return 'Shift'
        case 'meta':
        case 'cmd':
          return '⌘'
        case 'escape':
          return 'Esc'
        default:
          return key.toUpperCase()
      }
    })
    .join(' + ')
}

export default useKeyboardShortcuts
