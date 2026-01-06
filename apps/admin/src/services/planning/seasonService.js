/**
 * Season Service
 * Handles season CRUD operations
 */

import apiClient from '../api'
import { apiLogger } from '@/utils/logger'

const BASE_URL = '/planning'

export const getSeasons = async (hotelId, marketId) => {
  try {
    const response = await apiClient.get(`${BASE_URL}/hotels/${hotelId}/seasons`, {
      params: { market: marketId }
    })
    return response.data
  } catch (error) {
    apiLogger.error('Planning Service: Get seasons failed', error.response?.data || error.message)
    throw error
  }
}

export const getSeason = async (hotelId, id) => {
  try {
    const response = await apiClient.get(`${BASE_URL}/hotels/${hotelId}/seasons/${id}`)
    return response.data
  } catch (error) {
    apiLogger.error('Planning Service: Get season failed', error.response?.data || error.message)
    throw error
  }
}

export const createSeason = async (hotelId, data) => {
  try {
    const response = await apiClient.post(`${BASE_URL}/hotels/${hotelId}/seasons`, data)
    return response.data
  } catch (error) {
    apiLogger.error('Planning Service: Create season failed', error.response?.data || error.message)
    throw error
  }
}

export const updateSeason = async (hotelId, id, data) => {
  try {
    const response = await apiClient.put(`${BASE_URL}/hotels/${hotelId}/seasons/${id}`, data)
    return response.data
  } catch (error) {
    apiLogger.error('Planning Service: Update season failed', error.response?.data || error.message)
    throw error
  }
}

export const deleteSeason = async (hotelId, id) => {
  try {
    const response = await apiClient.delete(`${BASE_URL}/hotels/${hotelId}/seasons/${id}`)
    return response.data
  } catch (error) {
    apiLogger.error('Planning Service: Delete season failed', error.response?.data || error.message)
    throw error
  }
}

export default {
  getSeasons,
  getSeason,
  createSeason,
  updateSeason,
  deleteSeason
}
