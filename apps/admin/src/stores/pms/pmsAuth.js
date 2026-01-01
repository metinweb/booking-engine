import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import pmsAuthService from '@/services/pms/pmsAuthService'
import router from '@/router'

export const usePmsAuthStore = defineStore('pmsAuth', () => {
  // State
  const user = ref(JSON.parse(localStorage.getItem('pmsUser')) || null)
  const token = ref(localStorage.getItem('pmsToken') || null)
  const currentHotel = ref(JSON.parse(localStorage.getItem('pmsCurrentHotel')) || null)
  const assignedHotels = ref(JSON.parse(localStorage.getItem('pmsAssignedHotels')) || [])
  const requiresHotelSelection = ref(false)
  const tempToken = ref(null)

  // Getters
  const isAuthenticated = computed(() => !!token.value && !!user.value && !!currentHotel.value)
  const isPmsLoggedIn = computed(() => !!token.value && !!user.value)
  const hasMultipleHotels = computed(() => assignedHotels.value.length > 1)
  const currentRole = computed(() => currentHotel.value?.role || null)
  const currentPermissions = computed(() => currentHotel.value?.permissions || [])
  const fullName = computed(() => user.value ? `${user.value.firstName} ${user.value.lastName}` : '')

  // Check if user has specific permission
  function hasPermission(permission) {
    if (currentRole.value === 'pms_admin') return true
    return currentPermissions.value.includes(permission)
  }

  // Check if user has any of the specified permissions
  function hasAnyPermission(permissions) {
    if (currentRole.value === 'pms_admin') return true
    return permissions.some(p => currentPermissions.value.includes(p))
  }

  // Login action
  async function login(credentials) {
    try {
      const response = await pmsAuthService.login(credentials)

      if (response.success && response.data) {
        // Store user info
        user.value = response.data.user
        localStorage.setItem('pmsUser', JSON.stringify(response.data.user))

        // Check if hotel selection is required
        if (response.data.requiresHotelSelection) {
          requiresHotelSelection.value = true
          tempToken.value = response.data.tempToken
          assignedHotels.value = response.data.hotels
          localStorage.setItem('pmsAssignedHotels', JSON.stringify(response.data.hotels))
          return { requiresHotelSelection: true, hotels: response.data.hotels }
        }

        // Single hotel - directly authenticated
        token.value = response.data.token
        currentHotel.value = response.data.hotel
        assignedHotels.value = [response.data.hotel]

        localStorage.setItem('pmsToken', response.data.token)
        localStorage.setItem('pmsCurrentHotel', JSON.stringify(response.data.hotel))
        localStorage.setItem('pmsAssignedHotels', JSON.stringify([response.data.hotel]))

        requiresHotelSelection.value = false
        tempToken.value = null

        return { success: true }
      } else {
        throw new Error(response.message || 'Login failed')
      }
    } catch (error) {
      console.error('PMS Login failed:', error)
      throw error
    }
  }

  // Select hotel (when user has multiple hotels)
  async function selectHotel(hotelId) {
    try {
      if (!tempToken.value) {
        throw new Error('No pending hotel selection')
      }

      const response = await pmsAuthService.selectHotel({
        hotelId,
        tempToken: tempToken.value
      })

      if (response.success && response.data) {
        token.value = response.data.token
        currentHotel.value = response.data.hotel
        user.value = response.data.user

        localStorage.setItem('pmsToken', response.data.token)
        localStorage.setItem('pmsCurrentHotel', JSON.stringify(response.data.hotel))
        localStorage.setItem('pmsUser', JSON.stringify(response.data.user))

        requiresHotelSelection.value = false
        tempToken.value = null

        return { success: true }
      } else {
        throw new Error(response.message || 'Hotel selection failed')
      }
    } catch (error) {
      console.error('Hotel selection failed:', error)
      throw error
    }
  }

  // Switch hotel (when already logged in)
  async function switchHotel(hotelId) {
    try {
      const response = await pmsAuthService.switchHotel({ hotelId })

      if (response.success && response.data) {
        token.value = response.data.token
        currentHotel.value = response.data.hotel

        localStorage.setItem('pmsToken', response.data.token)
        localStorage.setItem('pmsCurrentHotel', JSON.stringify(response.data.hotel))

        return { success: true }
      } else {
        throw new Error(response.message || 'Hotel switch failed')
      }
    } catch (error) {
      console.error('Hotel switch failed:', error)
      throw error
    }
  }

  // Get current user info
  async function fetchMe() {
    try {
      const response = await pmsAuthService.me()

      if (response.success && response.data) {
        user.value = response.data.user
        currentHotel.value = response.data.currentHotel
        assignedHotels.value = response.data.assignedHotels

        localStorage.setItem('pmsUser', JSON.stringify(response.data.user))
        localStorage.setItem('pmsCurrentHotel', JSON.stringify(response.data.currentHotel))
        localStorage.setItem('pmsAssignedHotels', JSON.stringify(response.data.assignedHotels))

        return response.data
      } else {
        throw new Error('Failed to fetch user info')
      }
    } catch (error) {
      console.error('Fetch me failed:', error)
      logout()
      throw error
    }
  }

  // Logout
  function logout() {
    // Call API logout (fire and forget)
    if (token.value) {
      pmsAuthService.logout().catch(() => {})
    }

    // Clear state
    token.value = null
    user.value = null
    currentHotel.value = null
    assignedHotels.value = []
    requiresHotelSelection.value = false
    tempToken.value = null

    // Clear localStorage
    localStorage.removeItem('pmsToken')
    localStorage.removeItem('pmsUser')
    localStorage.removeItem('pmsCurrentHotel')
    localStorage.removeItem('pmsAssignedHotels')

    // Redirect to PMS login
    router.push({ name: 'pms-login' })
  }

  // Change password
  async function changePassword(currentPassword, newPassword) {
    try {
      const response = await pmsAuthService.changePassword({
        currentPassword,
        newPassword
      })

      if (response.success) {
        return { success: true }
      } else {
        throw new Error(response.message || 'Password change failed')
      }
    } catch (error) {
      console.error('Password change failed:', error)
      throw error
    }
  }

  // Check if token is valid
  async function checkAuth() {
    if (!token.value) return false

    try {
      await fetchMe()
      return true
    } catch (error) {
      return false
    }
  }

  return {
    // State
    user,
    token,
    currentHotel,
    assignedHotels,
    requiresHotelSelection,
    tempToken,
    // Getters
    isAuthenticated,
    isPmsLoggedIn,
    hasMultipleHotels,
    currentRole,
    currentPermissions,
    fullName,
    // Actions
    hasPermission,
    hasAnyPermission,
    login,
    selectHotel,
    switchHotel,
    fetchMe,
    logout,
    changePassword,
    checkAuth
  }
})
