/**
 * Campaign Service
 * Handles campaign CRUD operations
 */

import apiClient from '../api'
import { apiLogger } from '@/utils/logger'

const BASE_URL = '/planning'

export const getCampaigns = async (hotelId, params = {}) => {
  try {
    const response = await apiClient.get(`${BASE_URL}/hotels/${hotelId}/campaigns`, { params })
    return response.data
  } catch (error) {
    apiLogger.error('Planning Service: Get campaigns failed', error.response?.data || error.message)
    throw error
  }
}

export const getCampaign = async (hotelId, id) => {
  try {
    const response = await apiClient.get(`${BASE_URL}/hotels/${hotelId}/campaigns/${id}`)
    return response.data
  } catch (error) {
    apiLogger.error('Planning Service: Get campaign failed', error.response?.data || error.message)
    throw error
  }
}

export const createCampaign = async (hotelId, data) => {
  try {
    const response = await apiClient.post(`${BASE_URL}/hotels/${hotelId}/campaigns`, data)
    return response.data
  } catch (error) {
    apiLogger.error('Planning Service: Create campaign failed', error.response?.data || error.message)
    throw error
  }
}

export const updateCampaign = async (hotelId, id, data) => {
  try {
    const response = await apiClient.put(`${BASE_URL}/hotels/${hotelId}/campaigns/${id}`, data)
    return response.data
  } catch (error) {
    apiLogger.error('Planning Service: Update campaign failed', error.response?.data || error.message)
    throw error
  }
}

export const deleteCampaign = async (hotelId, id) => {
  try {
    const response = await apiClient.delete(`${BASE_URL}/hotels/${hotelId}/campaigns/${id}`)
    return response.data
  } catch (error) {
    apiLogger.error('Planning Service: Delete campaign failed', error.response?.data || error.message)
    throw error
  }
}

export const updateCampaignStatus = async (hotelId, id, status) => {
  try {
    const response = await apiClient.patch(`${BASE_URL}/hotels/${hotelId}/campaigns/${id}/status`, {
      status
    })
    return response.data
  } catch (error) {
    apiLogger.error(
      'Planning Service: Update campaign status failed',
      error.response?.data || error.message
    )
    throw error
  }
}

export default {
  getCampaigns,
  getCampaign,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  updateCampaignStatus
}
