import axios from 'axios'
import { pmsLogger } from '@/utils/logger'

/**
 * PMS API Client
 *
 * Context-aware API client for PMS module.
 * Automatically selects the correct authentication token based on current user context:
 * - PMS User: Uses pmsToken (from PMS login)
 * - Partner/Admin User: Uses regular token (from main auth) + X-Partner-Id header
 *
 * This allows PMS features to be accessed by both PMS staff and partner admins.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

const pmsApiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

/**
 * Determine current auth context
 * @returns {{ mode: 'pms' | 'partner' | null, token: string | null }}
 */
const getAuthContext = () => {
  // Check for PMS token first (PMS user mode)
  const pmsToken = localStorage.getItem('pmsToken')
  if (pmsToken) {
    return { mode: 'pms', token: pmsToken }
  }

  // Check for regular token (Partner/Admin mode)
  const regularToken = localStorage.getItem('token')
  if (regularToken) {
    return { mode: 'partner', token: regularToken }
  }

  return { mode: null, token: null }
}

// Request interceptor - Add appropriate auth token
pmsApiClient.interceptors.request.use(
  async config => {
    const { mode, token } = getAuthContext()

    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }

    // For partner mode, add partner ID header if available
    if (mode === 'partner') {
      try {
        const { usePartnerStore } = await import('@/stores/partner')
        const partnerStore = usePartnerStore()
        if (partnerStore.hasSelectedPartner && partnerStore.selectedPartner?._id) {
          config.headers['X-Partner-Id'] = partnerStore.selectedPartner._id
        }
      } catch {
        // Partner store may not be available during initial load
      }
    }

    return config
  },
  error => {
    pmsLogger.error('[PMS API] Request interceptor error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor - Handle 401 errors based on context
pmsApiClient.interceptors.response.use(
  response => response,
  async error => {
    const { mode } = getAuthContext()

    // If 401 Unauthorized
    if (error.response?.status === 401) {
      // Skip for login endpoints
      if (
        error.config?.url?.includes('/pms/auth/login') ||
        error.config?.url?.includes('/pms/auth/select-hotel') ||
        error.config?.url?.includes('/auth/login') ||
        error.config?.url?.includes('/auth/refresh-token')
      ) {
        return Promise.reject(error)
      }

      if (mode === 'pms') {
        // PMS user - clear PMS auth and redirect to PMS login
        localStorage.removeItem('pmsToken')
        localStorage.removeItem('pmsUser')
        localStorage.removeItem('pmsCurrentHotel')
        localStorage.removeItem('pmsAssignedHotels')

        window.location.href = '/pms/login'
      } else if (mode === 'partner') {
        // Partner/Admin - try to refresh token
        try {
          const { useAuthStore } = await import('@/stores/auth')
          const authStore = useAuthStore()

          const newToken = await authStore.refreshAccessToken()
          if (newToken) {
            error.config.headers['Authorization'] = `Bearer ${newToken}`
            return pmsApiClient(error.config)
          }
        } catch (refreshError) {
          pmsLogger.error('[PMS API] Token refresh failed:', refreshError)
          // Auth store will handle redirect to login
        }
      }
    }

    return Promise.reject(error)
  }
)

/**
 * Get current auth mode for debugging
 * @returns {'pms' | 'partner' | 'none'}
 */
export const getAuthMode = () => {
  const { mode } = getAuthContext()
  return mode || 'none'
}

export default pmsApiClient
