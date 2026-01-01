import apiClient from './api'

/**
 * Get partner email settings
 * @param {string} partnerId - Partner ID
 */
export const getEmailSettings = async (partnerId) => {
  const response = await apiClient.get(`/partners/${partnerId}/email-settings`)
  return response.data.data
}

/**
 * Update partner email settings
 * @param {string} partnerId - Partner ID
 * @param {Object} settings - Email settings
 */
export const updateEmailSettings = async (partnerId, settings) => {
  const response = await apiClient.put(`/partners/${partnerId}/email-settings`, settings)
  return response.data.data
}

/**
 * Verify domain for SES
 * @param {string} partnerId - Partner ID
 * @param {string} domain - Domain to verify
 */
export const verifyDomain = async (partnerId, domain) => {
  const response = await apiClient.post(`/partners/${partnerId}/email-settings/verify-domain`, { domain })
  return response.data.data
}

/**
 * Get domain verification status
 * @param {string} partnerId - Partner ID
 */
export const getDomainStatus = async (partnerId) => {
  const response = await apiClient.get(`/partners/${partnerId}/email-settings/domain-status`)
  return response.data.data
}

/**
 * Send test email
 * @param {string} partnerId - Partner ID
 * @param {string} email - Email address to send test to
 */
export const testEmail = async (partnerId, email) => {
  const response = await apiClient.post(`/partners/${partnerId}/email-settings/test`, { email })
  return response.data
}

export default {
  getEmailSettings,
  updateEmailSettings,
  verifyDomain,
  getDomainStatus,
  testEmail
}
