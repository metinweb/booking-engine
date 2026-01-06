/**
 * Pricing Service
 * Comprehensive pricing calculation service with full override hierarchy support
 *
 * Override Hierarchy (from lowest to highest priority):
 * 1. RoomType (base)
 * 2. Market.pricingOverrides[roomType]
 * 3. Season.pricingOverrides[roomType]
 * 4. Rate (daily)
 *
 * This service uses multiplierUtils.js for actual calculations
 *
 * NOTE: This file re-exports from the modular pricing directory for backward compatibility.
 * For new imports, prefer importing directly from './pricing/index.js' or specific modules.
 */

// Re-export everything from the modular pricing directory
export {
  // Error class
  PricingError,
  // Validation
  validatePricingResult,
  // Override hierarchy functions
  mapToObject,
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
} from './pricing/index.js'

// Default export for backward compatibility
export { default } from './pricing/index.js'
