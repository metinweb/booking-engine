import apiClient from './api'

/**
 * Get partner SMS settings
 * @param {string} partnerId - Partner ID
 * @returns {Promise<Object>} SMS settings
 */
export const getSMSSettings = async (partnerId) => {
  const response = await apiClient.get(`/partners/${partnerId}/sms-settings`)
  return response.data.data
}

/**
 * Update partner SMS settings
 * @param {string} partnerId - Partner ID
 * @param {Object} settings - SMS settings
 * @returns {Promise<Object>} Updated settings
 */
export const updateSMSSettings = async (partnerId, settings) => {
  const response = await apiClient.put(`/partners/${partnerId}/sms-settings`, settings)
  return response.data
}

/**
 * Test SMS configuration
 * @param {string} partnerId - Partner ID
 * @param {string} phone - Test phone number
 * @returns {Promise<Object>} Test result
 */
export const testSMS = async (partnerId, phone) => {
  const response = await apiClient.post(`/partners/${partnerId}/sms-settings/test`, { phone })
  return response.data
}

/**
 * Get SMS balance
 * @param {string} partnerId - Partner ID
 * @returns {Promise<Object>} Balance info
 */
export const getSMSBalance = async (partnerId) => {
  const response = await apiClient.get(`/partners/${partnerId}/sms-settings/balance`)
  return response.data.data
}

/**
 * Get available SMS providers
 * @returns {Promise<Array>} List of providers with their fields
 */
export const getSMSProviders = async () => {
  const response = await apiClient.get('/partners/sms-providers')
  return response.data.data
}

export default {
  getSMSSettings,
  updateSMSSettings,
  testSMS,
  getSMSBalance,
  getSMSProviders
}
