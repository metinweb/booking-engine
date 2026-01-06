/**
 * Pricing Service - Barrel Export
 * Comprehensive pricing calculation service with full override hierarchy support
 *
 * Override Hierarchy (from lowest to highest priority):
 * 1. RoomType (base)
 * 2. Market.pricingOverrides[roomType]
 * 3. Season.pricingOverrides[roomType]
 * 4. Rate (daily)
 *
 * This module re-exports all pricing functionality for backward compatibility
 */

// Validation Module
export { PricingError, validatePricingResult } from './validation.js'

// Multipliers Module - Override hierarchy functions
export {
  mapToObject,
  getEffectiveMinAdults,
  getEffectivePricingType,
  getEffectiveMultiplierTemplate,
  getEffectiveChildAgeGroups,
  getEffectiveRoundingRule
} from './multipliers.js'

// Tiers Module - Sales settings functions
export { getEffectiveSalesSettings, calculateTierPricing } from './tiers.js'

// Restrictions Module
export { checkRestrictions } from './restrictions.js'

// Core Module - Base pricing functions
export {
  calculateOccupancyPrice,
  getEffectiveRate,
  calculateBookingPrice,
  bulkCalculatePrices,
  checkAvailability
} from './core.js'

// Campaigns Module
export {
  getApplicableCampaigns,
  applyCampaignToBreakdown,
  applyCampaigns,
  calculatePriceWithCampaigns
} from './campaigns.js'

// Multi-Room Module
export { calculateMultiRoomBookingPrice } from './multiRoom.js'

// Allotment Module
export { reserveAllotment, releaseAllotment, getAllotmentStatus } from './allotment.js'

// Default export for backward compatibility
import { PricingError, validatePricingResult } from './validation.js'
import {
  getEffectiveMinAdults,
  getEffectivePricingType,
  getEffectiveMultiplierTemplate,
  getEffectiveChildAgeGroups,
  getEffectiveRoundingRule
} from './multipliers.js'
import { getEffectiveSalesSettings, calculateTierPricing } from './tiers.js'
import { checkRestrictions } from './restrictions.js'
import {
  calculateOccupancyPrice,
  getEffectiveRate,
  calculateBookingPrice,
  bulkCalculatePrices,
  checkAvailability
} from './core.js'
import {
  getApplicableCampaigns,
  applyCampaignToBreakdown,
  applyCampaigns,
  calculatePriceWithCampaigns
} from './campaigns.js'
import { calculateMultiRoomBookingPrice } from './multiRoom.js'
import { reserveAllotment, releaseAllotment, getAllotmentStatus } from './allotment.js'

export default {
  // Error class
  PricingError,
  // Validation
  validatePricingResult,
  // Override hierarchy functions
  getEffectiveMinAdults,
  getEffectivePricingType,
  getEffectiveMultiplierTemplate,
  getEffectiveChildAgeGroups,
  getEffectiveRoundingRule,
  // Sales settings functions
  getEffectiveSalesSettings,
  calculateTierPricing,
  // Core functions
  checkRestrictions,
  calculateOccupancyPrice,
  getEffectiveRate,
  calculateBookingPrice,
  bulkCalculatePrices,
  checkAvailability,
  // Campaign functions
  getApplicableCampaigns,
  applyCampaignToBreakdown,
  applyCampaigns,
  calculatePriceWithCampaigns,
  // Multi-room booking pricing (SINGLE SOURCE OF TRUTH)
  calculateMultiRoomBookingPrice,
  // Allotment functions
  reserveAllotment,
  releaseAllotment,
  getAllotmentStatus
}
