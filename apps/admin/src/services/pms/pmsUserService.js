import pmsApiClient from './pmsApi'

/**
 * Get all PMS users
 * @param {Object} params - Query params (hotelId, department, isActive)
 */
const getAll = async (params = {}) => {
  try {
    const response = await pmsApiClient.get('/pms/users', { params })
    return response.data
  } catch (error) {
    console.error('PMS User Service: Failed to fetch users', error.response?.data || error.message)
    throw error
  }
}

/**
 * Get single PMS user
 * @param {string} id - User ID
 */
const getOne = async (id) => {
  try {
    const response = await pmsApiClient.get(`/pms/users/${id}`)
    return response.data
  } catch (error) {
    console.error('PMS User Service: Failed to fetch user', error.response?.data || error.message)
    throw error
  }
}

/**
 * Create PMS user
 * @param {Object} data - User data
 */
const create = async (data) => {
  try {
    const response = await pmsApiClient.post('/pms/users', data)
    return response.data
  } catch (error) {
    console.error('PMS User Service: Failed to create user', error.response?.data || error.message)
    throw error
  }
}

/**
 * Update PMS user
 * @param {string} id - User ID
 * @param {Object} data - User data
 */
const update = async (id, data) => {
  try {
    const response = await pmsApiClient.put(`/pms/users/${id}`, data)
    return response.data
  } catch (error) {
    console.error('PMS User Service: Failed to update user', error.response?.data || error.message)
    throw error
  }
}

/**
 * Delete PMS user
 * @param {string} id - User ID
 */
const remove = async (id) => {
  try {
    const response = await pmsApiClient.delete(`/pms/users/${id}`)
    return response.data
  } catch (error) {
    console.error('PMS User Service: Failed to delete user', error.response?.data || error.message)
    throw error
  }
}

/**
 * Reset user password
 * @param {string} id - User ID
 * @param {string} newPassword - New password
 */
const resetPassword = async (id, newPassword) => {
  try {
    const response = await pmsApiClient.post(`/pms/users/${id}/reset-password`, { newPassword })
    return response.data
  } catch (error) {
    console.error('PMS User Service: Failed to reset password', error.response?.data || error.message)
    throw error
  }
}

/**
 * Assign hotel to user
 * @param {string} userId - User ID
 * @param {Object} data - { hotelId, role, permissions }
 */
const assignHotel = async (userId, data) => {
  try {
    const response = await pmsApiClient.post(`/pms/users/${userId}/assign-hotel`, data)
    return response.data
  } catch (error) {
    console.error('PMS User Service: Failed to assign hotel', error.response?.data || error.message)
    throw error
  }
}

/**
 * Remove hotel from user
 * @param {string} userId - User ID
 * @param {string} hotelId - Hotel ID
 */
const removeHotel = async (userId, hotelId) => {
  try {
    const response = await pmsApiClient.delete(`/pms/users/${userId}/hotels/${hotelId}`)
    return response.data
  } catch (error) {
    console.error('PMS User Service: Failed to remove hotel', error.response?.data || error.message)
    throw error
  }
}

/**
 * Update user permissions for hotel
 * @param {string} userId - User ID
 * @param {string} hotelId - Hotel ID
 * @param {Object} data - { role, permissions }
 */
const updatePermissions = async (userId, hotelId, data) => {
  try {
    const response = await pmsApiClient.put(`/pms/users/${userId}/hotels/${hotelId}/permissions`, data)
    return response.data
  } catch (error) {
    console.error('PMS User Service: Failed to update permissions', error.response?.data || error.message)
    throw error
  }
}

/**
 * Get users by hotel
 * @param {string} hotelId - Hotel ID
 */
const getByHotel = async (hotelId) => {
  try {
    const response = await pmsApiClient.get(`/pms/hotels/${hotelId}/users`)
    return response.data
  } catch (error) {
    console.error('PMS User Service: Failed to fetch hotel users', error.response?.data || error.message)
    throw error
  }
}

export default {
  getAll,
  getOne,
  create,
  update,
  remove,
  resetPassword,
  assignHotel,
  removeHotel,
  updatePermissions,
  getByHotel
}
