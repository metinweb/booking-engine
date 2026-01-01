import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import hotelService from '@/services/hotelService'

/**
 * PMS Store - Manages PMS context for partners
 * Partners use their regular auth, this store just tracks the selected hotel for PMS operations
 */
export const usePmsStore = defineStore('pms', () => {
  // State
  const currentHotel = ref(null)
  const hotels = ref([])
  const loading = ref(false)

  // Computed
  const hasHotel = computed(() => !!currentHotel.value)
  const currentHotelId = computed(() => currentHotel.value?._id || currentHotel.value?.id)
  const hasMultipleHotels = computed(() => hotels.value.length > 1)

  // Initialize from localStorage
  const init = () => {
    const savedHotelId = localStorage.getItem('pmsCurrentHotelId')
    if (savedHotelId && hotels.value.length > 0) {
      const hotel = hotels.value.find(h => (h._id || h.id) === savedHotelId)
      if (hotel) {
        currentHotel.value = hotel
      }
    }
  }

  // Load partner's hotels
  const loadHotels = async () => {
    loading.value = true
    try {
      const response = await hotelService.getAll()
      hotels.value = response.data || []

      // If only one hotel, auto-select it
      if (hotels.value.length === 1) {
        selectHotel(hotels.value[0])
      } else {
        // Try to restore from localStorage
        init()
      }

      return hotels.value
    } catch (error) {
      console.error('Failed to load hotels for PMS:', error)
      hotels.value = []
      throw error
    } finally {
      loading.value = false
    }
  }

  // Select a hotel for PMS context
  const selectHotel = (hotel) => {
    currentHotel.value = hotel
    const hotelId = hotel?._id || hotel?.id
    if (hotelId) {
      localStorage.setItem('pmsCurrentHotelId', hotelId)
    }
  }

  // Clear hotel selection
  const clearHotel = () => {
    currentHotel.value = null
    localStorage.removeItem('pmsCurrentHotelId')
  }

  // Switch to another hotel
  const switchHotel = (hotelId) => {
    const hotel = hotels.value.find(h => (h._id || h.id) === hotelId)
    if (hotel) {
      selectHotel(hotel)
      return true
    }
    return false
  }

  // Partner has all permissions (superadmin of their hotels)
  const hasPermission = (permission) => {
    // Partner always has all permissions for their own hotels
    return true
  }

  const hasAnyPermission = (permissions) => {
    return true
  }

  // Reset store
  const reset = () => {
    currentHotel.value = null
    hotels.value = []
    localStorage.removeItem('pmsCurrentHotelId')
  }

  return {
    // State
    currentHotel,
    hotels,
    loading,

    // Computed
    hasHotel,
    currentHotelId,
    hasMultipleHotels,

    // Actions
    init,
    loadHotels,
    selectHotel,
    clearHotel,
    switchHotel,
    hasPermission,
    hasAnyPermission,
    reset
  }
})
