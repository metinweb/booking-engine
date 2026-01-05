import { ref, onMounted } from 'vue'

/**
 * Accessibility Composable
 * Provides utilities for screen reader announcements, focus management, and a11y helpers
 */

// Create a live region for announcements
let liveRegion = null

const createLiveRegion = () => {
  if (typeof document === 'undefined' || liveRegion) return

  liveRegion = document.createElement('div')
  liveRegion.setAttribute('aria-live', 'polite')
  liveRegion.setAttribute('aria-atomic', 'true')
  liveRegion.setAttribute('role', 'status')
  liveRegion.className = 'sr-only'
  liveRegion.style.cssText = `
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  `
  document.body.appendChild(liveRegion)
}

export function useAccessibility() {
  // Focus management
  const previousFocus = ref(null)

  onMounted(() => {
    createLiveRegion()
  })

  /**
   * Announce message to screen readers
   * @param {string} message - Message to announce
   * @param {string} priority - 'polite' or 'assertive'
   */
  const announce = (message, priority = 'polite') => {
    if (!liveRegion) createLiveRegion()

    // Set the priority
    liveRegion.setAttribute('aria-live', priority)

    // Clear and set new message (to ensure it's announced)
    liveRegion.textContent = ''
    setTimeout(() => {
      liveRegion.textContent = message
    }, 100)
  }

  /**
   * Announce assertive message (interrupts other announcements)
   */
  const announceAssertive = message => {
    announce(message, 'assertive')
  }

  /**
   * Save current focus to restore later
   */
  const saveFocus = () => {
    previousFocus.value = document.activeElement
  }

  /**
   * Restore focus to previously saved element
   */
  const restoreFocus = () => {
    if (previousFocus.value && previousFocus.value.focus) {
      previousFocus.value.focus()
      previousFocus.value = null
    }
  }

  /**
   * Focus first focusable element in container
   * @param {HTMLElement} container - Container to search in
   */
  const focusFirst = container => {
    if (!container) return

    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])'
    ].join(', ')

    const focusable = container.querySelectorAll(focusableSelectors)
    if (focusable.length > 0) {
      focusable[0].focus()
    }
  }

  /**
   * Focus last focusable element in container
   * @param {HTMLElement} container - Container to search in
   */
  const focusLast = container => {
    if (!container) return

    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])'
    ].join(', ')

    const focusable = container.querySelectorAll(focusableSelectors)
    if (focusable.length > 0) {
      focusable[focusable.length - 1].focus()
    }
  }

  /**
   * Create trap focus within container
   * @param {HTMLElement} container - Container to trap focus in
   * @returns {Function} Cleanup function
   */
  const trapFocus = container => {
    if (!container) return () => {}

    const handleTab = event => {
      if (event.key !== 'Tab') return

      const focusableSelectors = [
        'button:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        'a[href]',
        '[tabindex]:not([tabindex="-1"])'
      ].join(', ')

      const focusable = container.querySelectorAll(focusableSelectors)
      if (focusable.length === 0) return

      const firstElement = focusable[0]
      const lastElement = focusable[focusable.length - 1]

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault()
          lastElement.focus()
        }
      } else {
        if (document.activeElement === lastElement) {
          event.preventDefault()
          firstElement.focus()
        }
      }
    }

    container.addEventListener('keydown', handleTab)

    return () => {
      container.removeEventListener('keydown', handleTab)
    }
  }

  /**
   * Check if user prefers reduced motion
   */
  const prefersReducedMotion = () => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }

  /**
   * Check if user prefers dark mode
   */
  const prefersDarkMode = () => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  }

  /**
   * Generate unique ID for accessibility associations
   */
  const generateId = (prefix = 'a11y') => {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Get ARIA attributes for loading state
   */
  const getLoadingAttrs = (isLoading, loadingText = 'Yukleniyor') => {
    return {
      'aria-busy': isLoading,
      'aria-label': isLoading ? loadingText : undefined
    }
  }

  /**
   * Get ARIA attributes for expandable content
   */
  const getExpandableAttrs = (isExpanded, controlsId) => {
    return {
      'aria-expanded': isExpanded,
      'aria-controls': controlsId
    }
  }

  /**
   * Screen reader only text (visually hidden)
   */
  const srOnlyClass =
    'sr-only absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0'

  return {
    // Announcements
    announce,
    announceAssertive,

    // Focus management
    saveFocus,
    restoreFocus,
    focusFirst,
    focusLast,
    trapFocus,
    previousFocus,

    // Preferences
    prefersReducedMotion,
    prefersDarkMode,

    // Helpers
    generateId,
    getLoadingAttrs,
    getExpandableAttrs,
    srOnlyClass
  }
}

export default useAccessibility
