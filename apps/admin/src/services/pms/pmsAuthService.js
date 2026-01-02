import axios from 'axios'
import pmsApiClient from './pmsApi'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

/**
 * Get partner by PMS domain (for auto-detection on login page)
 * Uses public endpoint - no auth required
 * @param {string} domain - Domain to look up
 */
const getPartnerByDomain = async (domain) => {
  try {
    // Use public endpoint (no auth required)
    const response = await axios.get(`${API_BASE_URL}/public/resolve-domain`, {
      params: { domain }
    })
    return response.data
  } catch (error) {
    console.error('PMS Auth Service: Partner lookup failed', error.response?.data || error.message)
    throw error
  }
}

/**
 * PMS Login
 * @param {Object} credentials - { username, password, partnerId, partnerCode, domain }
 */
const login = async (credentials) => {
  try {
    const response = await pmsApiClient.post('/pms/auth/login', credentials)
    return response.data
  } catch (error) {
    console.error('PMS Auth Service: Login failed', error.response?.data || error.message)
    throw error
  }
}

/**
 * Select hotel after login (for multi-hotel users)
 * @param {Object} data - { hotelId, tempToken }
 */
const selectHotel = async (data) => {
  try {
    const response = await pmsApiClient.post('/pms/auth/select-hotel', data)
    return response.data
  } catch (error) {
    console.error('PMS Auth Service: Hotel selection failed', error.response?.data || error.message)
    throw error
  }
}

/**
 * Switch to a different hotel (when already logged in)
 * @param {Object} data - { hotelId }
 */
const switchHotel = async (data) => {
  try {
    const response = await pmsApiClient.post('/pms/auth/switch-hotel', data)
    return response.data
  } catch (error) {
    console.error('PMS Auth Service: Hotel switch failed', error.response?.data || error.message)
    throw error
  }
}

/**
 * Get current PMS user info
 */
const me = async () => {
  try {
    const response = await pmsApiClient.get('/pms/auth/me')
    return response.data
  } catch (error) {
    console.error('PMS Auth Service: Failed to fetch current user', error.response?.data || error.message)
    throw error
  }
}

/**
 * Logout
 */
const logout = async () => {
  try {
    const response = await pmsApiClient.post('/pms/auth/logout')
    return response.data
  } catch (error) {
    // Don't throw on logout errors - just log them
    console.error('PMS Auth Service: Logout failed', error.response?.data || error.message)
    return { success: true }
  }
}

/**
 * Change password
 * @param {Object} data - { currentPassword, newPassword }
 */
const changePassword = async (data) => {
  try {
    const response = await pmsApiClient.post('/pms/auth/change-password', data)
    return response.data
  } catch (error) {
    console.error('PMS Auth Service: Change password failed', error.response?.data || error.message)
    throw error
  }
}

export default {
  getPartnerByDomain,
  login,
  selectHotel,
  switchHotel,
  me,
  logout,
  changePassword
}
