/**
 * Pricing Calculation Service
 * Handles pricing calculations and effective rates
 */

import apiClient from '../api'
import { apiLogger } from '@/utils/logger'

const BASE_URL = '/planning'

/**
 * Calculate price for a specific rate with occupancy
 */
export const calculateRatePrice = async (hotelId, rateId, data) => {
  try {
    const response = await apiClient.post(
      `${BASE_URL}/hotels/${hotelId}/rates/${rateId}/calculate-price`,
      data
    )
    return response.data
  } catch (error) {
    apiLogger.error(
      'Planning Service: Calculate rate price failed',
      error.response?.data || error.message
    )
    throw error
  }
}

/**
 * Calculate price by query (without rate ID)
 */
export const calculatePriceByQuery = async (hotelId, data) => {
  try {
    const response = await apiClient.post(`${BASE_URL}/hotels/${hotelId}/pricing/calculate`, data)
    return response.data
  } catch (error) {
    apiLogger.error('Planning Service: Calculate price failed', error.response?.data || error.message)
    throw error
  }
}

/**
 * Bulk calculate prices
 */
export const bulkCalculatePrices = async (hotelId, queries) => {
  try {
    const response = await apiClient.post(`${BASE_URL}/hotels/${hotelId}/pricing/bulk-calculate`, {
      queries
    })
    return response.data
  } catch (error) {
    apiLogger.error(
      'Planning Service: Bulk calculate prices failed',
      error.response?.data || error.message
    )
    throw error
  }
}

/**
 * Check availability for a date range
 */
export const checkPricingAvailability = async (hotelId, data) => {
  try {
    const response = await apiClient.post(
      `${BASE_URL}/hotels/${hotelId}/pricing/check-availability`,
      data
    )
    return response.data
  } catch (error) {
    apiLogger.error(
      'Planning Service: Check availability failed',
      error.response?.data || error.message
    )
    throw error
  }
}

/**
 * Get effective rate with all overrides applied
 */
export const getEffectiveRate = async (hotelId, params) => {
  try {
    const response = await apiClient.get(`${BASE_URL}/hotels/${hotelId}/pricing/effective-rate`, {
      params
    })
    return response.data
  } catch (error) {
    apiLogger.error(
      'Planning Service: Get effective rate failed',
      error.response?.data || error.message
    )
    throw error
  }
}

/**
 * Get effective multipliers for a room type
 */
export const getEffectiveMultipliers = async (hotelId, params) => {
  try {
    const response = await apiClient.get(
      `${BASE_URL}/hotels/${hotelId}/pricing/effective-multipliers`,
      { params }
    )
    return response.data
  } catch (error) {
    apiLogger.error(
      'Planning Service: Get effective multipliers failed',
      error.response?.data || error.message
    )
    throw error
  }
}

/**
 * Get combination table for a room type
 */
export const getCombinationTable = async (hotelId, params) => {
  try {
    const response = await apiClient.get(
      `${BASE_URL}/hotels/${hotelId}/pricing/combination-table`,
      { params }
    )
    return response.data
  } catch (error) {
    apiLogger.error(
      'Planning Service: Get combination table failed',
      error.response?.data || error.message
    )
    throw error
  }
}

/**
 * Get effective child age groups
 */
export const getEffectiveChildAgeGroups = async (hotelId, params) => {
  try {
    const response = await apiClient.get(`${BASE_URL}/hotels/${hotelId}/pricing/child-age-groups`, {
      params
    })
    return response.data
  } catch (error) {
    apiLogger.error(
      'Planning Service: Get child age groups failed',
      error.response?.data || error.message
    )
    throw error
  }
}

/**
 * Calculate complete booking price with campaigns (server-side)
 */
export const calculatePriceWithCampaigns = async (hotelId, data) => {
  try {
    const response = await apiClient.post(
      `${BASE_URL}/hotels/${hotelId}/pricing/calculate-with-campaigns`,
      data
    )
    return response.data
  } catch (error) {
    apiLogger.error(
      'Planning Service: Calculate price with campaigns failed',
      error.response?.data || error.message
    )
    throw error
  }
}

/**
 * Get applicable campaigns for a booking query
 */
export const getApplicableCampaigns = async (hotelId, params) => {
  try {
    const response = await apiClient.get(
      `${BASE_URL}/hotels/${hotelId}/pricing/applicable-campaigns`,
      { params }
    )
    return response.data
  } catch (error) {
    apiLogger.error(
      'Planning Service: Get applicable campaigns failed',
      error.response?.data || error.message
    )
    throw error
  }
}

export default {
  calculateRatePrice,
  calculatePriceByQuery,
  bulkCalculatePrices,
  checkPricingAvailability,
  getEffectiveRate,
  getEffectiveMultipliers,
  getCombinationTable,
  getEffectiveChildAgeGroups,
  calculatePriceWithCampaigns,
  getApplicableCampaigns
}
