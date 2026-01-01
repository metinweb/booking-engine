import axios from 'axios'
// Import auth store to get token
// Import dynamically ONLY inside the interceptor to avoid circular dependencies during app initialization
// import { useAuthStore } from '@/stores/auth';

// Define the base URL for the backend API
// Make sure this matches where your backend is running
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

const apiClient = axios.create({
	baseURL: API_BASE_URL,
	headers: {
		'Content-Type': 'application/json'
	}
})

// Add a request interceptor to include the auth token and partner header in requests
apiClient.interceptors.request.use(
	async config => {
		// Dynamically import stores inside interceptor
		const {useAuthStore} = await import('@/stores/auth')
		const {usePartnerStore} = await import('@/stores/partner')
		const authStore = useAuthStore()
		const partnerStore = usePartnerStore()

		const token = authStore.token // Get token from Pinia store

		if (token) {
			config.headers['Authorization'] = `Bearer ${token}`
		}

		// Add selected partner ID to header if platform admin has selected a partner
		if (partnerStore.hasSelectedPartner && partnerStore.selectedPartner?._id) {
			config.headers['X-Partner-Id'] = partnerStore.selectedPartner._id
		}

		return config
	},
	error => {
		console.error('Interceptor Error:', error)
		return Promise.reject(error)
	}
)

// Response interceptor to handle 401 errors and auto-refresh token
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // If error is 401 and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      // Check if this is a PMS user session
      const pmsToken = localStorage.getItem('pmsToken')
      if (pmsToken) {
        // Clear PMS auth data
        localStorage.removeItem('pmsToken')
        localStorage.removeItem('pmsUser')
        localStorage.removeItem('pmsCurrentHotel')
        localStorage.removeItem('pmsAssignedHotels')

        // Redirect to PMS login
        window.location.href = '/pms/login'
        return Promise.reject(error)
      }

      try {
        // Dynamically import store inside interceptor
        const { useAuthStore } = await import('@/stores/auth')
        const authStore = useAuthStore()

        // Skip refresh for login and refresh-token endpoints
        if (originalRequest.url?.includes('/auth/login') ||
            originalRequest.url?.includes('/auth/refresh-token')) {
          return Promise.reject(error)
        }

        // Try to refresh the token
        const newToken = await authStore.refreshAccessToken()

        if (newToken) {
          // Update the authorization header and retry the original request
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`
          return apiClient(originalRequest)
        }
      } catch (refreshError) {
        console.error('Token refresh failed in interceptor:', refreshError)
        // Logout will be handled by refreshAccessToken
      }
    }

    return Promise.reject(error)
  }
)

export default apiClient
