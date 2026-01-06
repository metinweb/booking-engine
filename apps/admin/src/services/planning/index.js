/**
 * Planning Service - Barrel Export
 * Re-exports all planning domain services for backward compatibility
 */

import apiClient from '../api'
import { apiLogger } from '@/utils/logger'

// Import all domain services
import roomTypeService from './roomTypeService'
import mealPlanService from './mealPlanService'
import marketService from './marketService'
import seasonService from './seasonService'
import rateService from './rateService'
import campaignService from './campaignService'
import aiService from './aiService'
import contractService from './contractService'
import pricingCalculationService from './pricingCalculationService'

// Export individual services
export { default as roomTypeService } from './roomTypeService'
export { default as mealPlanService } from './mealPlanService'
export { default as marketService } from './marketService'
export { default as seasonService } from './seasonService'
export { default as rateService } from './rateService'
export { default as campaignService } from './campaignService'
export { default as aiService } from './aiService'
export { default as contractService } from './contractService'
export { default as pricingCalculationService } from './pricingCalculationService'

// Export all functions from each service
export * from './roomTypeService'
export * from './mealPlanService'
export * from './marketService'
export * from './seasonService'
export * from './rateService'
export * from './campaignService'
export * from './aiService'
export * from './contractService'
export * from './pricingCalculationService'

// ==================== HOTEL ====================

const getHotel = async hotelId => {
  try {
    const response = await apiClient.get(`/hotels/${hotelId}`)
    return response.data
  } catch (error) {
    apiLogger.error('Planning Service: Get hotel failed', error.response?.data || error.message)
    throw error
  }
}

// Combined default export for backward compatibility
export default {
  // Hotel
  getHotel,

  // Room Types
  ...roomTypeService,

  // Meal Plans
  ...mealPlanService,

  // Markets
  ...marketService,

  // Seasons
  ...seasonService,

  // Rates
  ...rateService,

  // Campaigns
  ...campaignService,

  // AI Pricing Assistant
  ...aiService,

  // Contract Import
  ...contractService,

  // Pricing Calculations
  ...pricingCalculationService
}
