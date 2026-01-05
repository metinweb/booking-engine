import { ref, computed, onMounted } from 'vue'

/**
 * Responsive Composable
 * Provides reactive breakpoint detection and device capabilities
 */

// Shared state for all instances
const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1024)
const windowHeight = ref(typeof window !== 'undefined' ? window.innerHeight : 768)

// Update on resize
let resizeHandler = null
let isInitialized = false

const initializeListener = () => {
  if (isInitialized || typeof window === 'undefined') return

  resizeHandler = () => {
    windowWidth.value = window.innerWidth
    windowHeight.value = window.innerHeight
  }

  window.addEventListener('resize', resizeHandler, { passive: true })
  isInitialized = true
}

export function useResponsive() {
  // Initialize on first use
  onMounted(() => {
    initializeListener()
  })

  // Breakpoints (Tailwind defaults)
  const isMobile = computed(() => windowWidth.value < 640) // < sm
  const isTablet = computed(() => windowWidth.value >= 640 && windowWidth.value < 1024) // sm-lg
  const isDesktop = computed(() => windowWidth.value >= 1024) // lg+
  const isLargeDesktop = computed(() => windowWidth.value >= 1280) // xl+

  // Combined checks
  const isMobileOrTablet = computed(() => windowWidth.value < 1024)
  const isTabletOrDesktop = computed(() => windowWidth.value >= 640)

  // Touch detection
  const isTouch = computed(() => {
    if (typeof window === 'undefined') return false
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0
  })

  // Orientation
  const isLandscape = computed(() => windowWidth.value > windowHeight.value)
  const isPortrait = computed(() => windowHeight.value >= windowWidth.value)

  // Current breakpoint name
  const currentBreakpoint = computed(() => {
    if (windowWidth.value < 640) return 'xs'
    if (windowWidth.value < 768) return 'sm'
    if (windowWidth.value < 1024) return 'md'
    if (windowWidth.value < 1280) return 'lg'
    if (windowWidth.value < 1536) return 'xl'
    return '2xl'
  })

  // Device type
  const deviceType = computed(() => {
    if (isMobile.value) return 'mobile'
    if (isTablet.value) return 'tablet'
    return 'desktop'
  })

  // Columns for grid layouts
  const gridColumns = computed(() => {
    if (isMobile.value) return 1
    if (isTablet.value) return 2
    if (windowWidth.value < 1280) return 3
    return 4
  })

  // PMS-specific: Rooms per row
  const roomsPerRow = computed(() => {
    if (isMobile.value) return 3
    if (isTablet.value) return 5
    if (windowWidth.value < 1280) return 8
    return 10
  })

  // Container max-width helper
  const containerClass = computed(() => {
    return {
      'max-w-sm': isMobile.value,
      'max-w-3xl': isTablet.value,
      'max-w-6xl': isDesktop.value && !isLargeDesktop.value,
      'max-w-7xl': isLargeDesktop.value
    }
  })

  return {
    // Dimensions
    windowWidth,
    windowHeight,

    // Breakpoints
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop,
    isMobileOrTablet,
    isTabletOrDesktop,
    currentBreakpoint,

    // Device
    isTouch,
    deviceType,

    // Orientation
    isLandscape,
    isPortrait,

    // Layout helpers
    gridColumns,
    roomsPerRow,
    containerClass
  }
}

export default useResponsive
