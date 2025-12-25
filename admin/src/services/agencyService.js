import apiClient from './api'

const getAgencies = async (params = {}) => {
  try {
    const response = await apiClient.get('/agencies', { params })
    return response.data
  } catch (error) {
    console.error('Agency Service: Failed to fetch agencies', error.response?.data || error.message)
    throw error
  }
}

const getAgency = async (id) => {
  try {
    const response = await apiClient.get(`/agencies/${id}`)
    return response.data
  } catch (error) {
    console.error('Agency Service: Failed to fetch agency', error.response?.data || error.message)
    throw error
  }
}

const createAgency = async (data) => {
  try {
    const response = await apiClient.post('/agencies', data)
    return response.data
  } catch (error) {
    console.error('Agency Service: Failed to create agency', error.response?.data || error.message)
    throw error
  }
}

const updateAgency = async (id, data) => {
  try {
    const response = await apiClient.put(`/agencies/${id}`, data)
    return response.data
  } catch (error) {
    console.error('Agency Service: Failed to update agency', error.response?.data || error.message)
    throw error
  }
}

const deleteAgency = async (id) => {
  try {
    const response = await apiClient.delete(`/agencies/${id}`)
    return response.data
  } catch (error) {
    console.error('Agency Service: Failed to delete agency', error.response?.data || error.message)
    throw error
  }
}

const approveAgency = async (id) => {
  try {
    const response = await apiClient.post(`/agencies/${id}/approve`)
    return response.data
  } catch (error) {
    console.error('Agency Service: Failed to approve agency', error.response?.data || error.message)
    throw error
  }
}

const activateAgency = async (id) => {
  try {
    const response = await apiClient.post(`/agencies/${id}/activate`)
    return response.data
  } catch (error) {
    console.error('Agency Service: Failed to activate agency', error.response?.data || error.message)
    throw error
  }
}

const deactivateAgency = async (id) => {
  try {
    const response = await apiClient.post(`/agencies/${id}/deactivate`)
    return response.data
  } catch (error) {
    console.error('Agency Service: Failed to deactivate agency', error.response?.data || error.message)
    throw error
  }
}

// Agency Users
const getAgencyUsers = async (agencyId, params = {}) => {
  try {
    const response = await apiClient.get(`/agencies/${agencyId}/users`, { params })
    return response.data
  } catch (error) {
    console.error('Agency Service: Failed to fetch agency users', error.response?.data || error.message)
    throw error
  }
}

const createAgencyUser = async (agencyId, data) => {
  try {
    const response = await apiClient.post(`/agencies/${agencyId}/users`, data)
    return response.data
  } catch (error) {
    console.error('Agency Service: Failed to create agency user', error.response?.data || error.message)
    throw error
  }
}

const updateAgencyUser = async (agencyId, userId, data) => {
  try {
    const response = await apiClient.put(`/agencies/${agencyId}/users/${userId}`, data)
    return response.data
  } catch (error) {
    console.error('Agency Service: Failed to update agency user', error.response?.data || error.message)
    throw error
  }
}

const deleteAgencyUser = async (agencyId, userId) => {
  try {
    const response = await apiClient.delete(`/agencies/${agencyId}/users/${userId}`)
    return response.data
  } catch (error) {
    console.error('Agency Service: Failed to delete agency user', error.response?.data || error.message)
    throw error
  }
}

export default {
  getAgencies,
  getAgency,
  createAgency,
  updateAgency,
  deleteAgency,
  approveAgency,
  activateAgency,
  deactivateAgency,
  getAgencyUsers,
  createAgencyUser,
  updateAgencyUser,
  deleteAgencyUser
}
