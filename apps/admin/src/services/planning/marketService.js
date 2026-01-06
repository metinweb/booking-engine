/**
 * Market Service
 * Handles market CRUD operations
 */

import apiClient from '../api'
import { apiLogger } from '@/utils/logger'

const BASE_URL = '/planning'

export const getMarkets = async hotelId => {
  try {
    const response = await apiClient.get(`${BASE_URL}/hotels/${hotelId}/markets`)
    return response.data
  } catch (error) {
    apiLogger.error('Planning Service: Get markets failed', error.response?.data || error.message)
    throw error
  }
}

export const getMarket = async (hotelId, id) => {
  try {
    const response = await apiClient.get(`${BASE_URL}/hotels/${hotelId}/markets/${id}`)
    return response.data
  } catch (error) {
    apiLogger.error('Planning Service: Get market failed', error.response?.data || error.message)
    throw error
  }
}

export const createMarket = async (hotelId, data) => {
  try {
    const response = await apiClient.post(`${BASE_URL}/hotels/${hotelId}/markets`, data)
    return response.data
  } catch (error) {
    apiLogger.error('Planning Service: Create market failed', error.response?.data || error.message)
    throw error
  }
}

export const updateMarket = async (hotelId, id, data) => {
  try {
    const response = await apiClient.put(`${BASE_URL}/hotels/${hotelId}/markets/${id}`, data)
    return response.data
  } catch (error) {
    apiLogger.error('Planning Service: Update market failed', error.response?.data || error.message)
    throw error
  }
}

export const deleteMarket = async (hotelId, id) => {
  try {
    const response = await apiClient.delete(`${BASE_URL}/hotels/${hotelId}/markets/${id}`)
    return response.data
  } catch (error) {
    apiLogger.error('Planning Service: Delete market failed', error.response?.data || error.message)
    throw error
  }
}

export const setDefaultMarket = async (hotelId, id) => {
  try {
    const response = await apiClient.patch(`${BASE_URL}/hotels/${hotelId}/markets/${id}/default`)
    return response.data
  } catch (error) {
    apiLogger.error(
      'Planning Service: Set default market failed',
      error.response?.data || error.message
    )
    throw error
  }
}

export const getAssignedCountries = async (hotelId, excludeMarketId = null) => {
  try {
    const params = excludeMarketId ? { excludeMarketId } : {}
    const response = await apiClient.get(
      `${BASE_URL}/hotels/${hotelId}/markets/assigned-countries`,
      { params }
    )
    return response.data
  } catch (error) {
    apiLogger.error(
      'Planning Service: Get assigned countries failed',
      error.response?.data || error.message
    )
    throw error
  }
}

export const deleteMarketPricingData = async (hotelId, marketId) => {
  try {
    const response = await apiClient.delete(
      `${BASE_URL}/hotels/${hotelId}/markets/${marketId}/pricing-data`
    )
    return response.data
  } catch (error) {
    apiLogger.error(
      'Planning Service: Delete market pricing data failed',
      error.response?.data || error.message
    )
    throw error
  }
}

export default {
  getMarkets,
  getMarket,
  createMarket,
  updateMarket,
  deleteMarket,
  setDefaultMarket,
  getAssignedCountries,
  deleteMarketPricingData
}
