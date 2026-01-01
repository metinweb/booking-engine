import apiClient from './api'

/**
 * Get Platform Dashboard (Platform Admin only)
 */
export const getPlatformDashboard = async () => {
  const response = await apiClient.get('/dashboard/platform')
  return response.data.data
}

/**
 * Get Partner Dashboard (Partner users)
 */
export const getPartnerDashboard = async () => {
  const response = await apiClient.get('/dashboard/partner')
  return response.data.data
}

/**
 * Get Agency Dashboard (Agency users)
 */
export const getAgencyDashboard = async () => {
  const response = await apiClient.get('/dashboard/agency')
  return response.data.data
}

export default {
  getPlatformDashboard,
  getPartnerDashboard,
  getAgencyDashboard
}
