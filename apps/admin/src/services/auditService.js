import apiClient from './api'

/**
 * Get all audit logs with filtering and pagination
 */
const getAuditLogs = async (params = {}) => {
  try {
    const response = await apiClient.get('/audit-logs', { params })
    return response.data
  } catch (error) {
    console.error('Audit Service: Get audit logs failed', error.response?.data || error.message)
    throw error
  }
}

/**
 * Get single audit log by ID
 */
const getAuditLog = async (id) => {
  try {
    const response = await apiClient.get(`/audit-logs/${id}`)
    return response.data
  } catch (error) {
    console.error('Audit Service: Get audit log failed', error.response?.data || error.message)
    throw error
  }
}

/**
 * Get document history
 */
const getDocumentHistory = async (collection, documentId, params = {}) => {
  try {
    const response = await apiClient.get(`/audit-logs/history/${collection}/${documentId}`, { params })
    return response.data
  } catch (error) {
    console.error('Audit Service: Get document history failed', error.response?.data || error.message)
    throw error
  }
}

/**
 * Get user activity
 */
const getUserActivity = async (userId, params = {}) => {
  try {
    const response = await apiClient.get(`/audit-logs/user/${userId}`, { params })
    return response.data
  } catch (error) {
    console.error('Audit Service: Get user activity failed', error.response?.data || error.message)
    throw error
  }
}

/**
 * Get partner activity
 */
const getPartnerActivity = async (partnerId, params = {}) => {
  try {
    const response = await apiClient.get(`/audit-logs/partner/${partnerId}`, { params })
    return response.data
  } catch (error) {
    console.error('Audit Service: Get partner activity failed', error.response?.data || error.message)
    throw error
  }
}

/**
 * Get audit statistics
 */
const getAuditStats = async (period = 'day') => {
  try {
    const response = await apiClient.get('/audit-logs/stats', { params: { period } })
    return response.data
  } catch (error) {
    console.error('Audit Service: Get audit stats failed', error.response?.data || error.message)
    throw error
  }
}

/**
 * Get recent activity
 */
const getRecentActivity = async (limit = 10) => {
  try {
    const response = await apiClient.get('/audit-logs/recent', { params: { limit } })
    return response.data
  } catch (error) {
    console.error('Audit Service: Get recent activity failed', error.response?.data || error.message)
    throw error
  }
}

/**
 * Export audit logs
 */
const exportAuditLogs = async (params = {}) => {
  try {
    const response = await apiClient.get('/audit-logs/export', {
      params: { ...params, format: 'csv' },
      responseType: 'blob'
    })
    return response.data
  } catch (error) {
    console.error('Audit Service: Export audit logs failed', error.response?.data || error.message)
    throw error
  }
}

export default {
  getAuditLogs,
  getAuditLog,
  getDocumentHistory,
  getUserActivity,
  getPartnerActivity,
  getAuditStats,
  getRecentActivity,
  exportAuditLogs
}
