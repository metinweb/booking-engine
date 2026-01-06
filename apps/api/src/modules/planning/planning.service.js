/**
 * Planning Service
 * Main entry point for planning module services
 *
 * This module has been split into specialized service files:
 * - planningAi.service.js - AI pricing command parsing and execution
 * - planningContract.service.js - Contract parsing and import
 * - planningCalculation.service.js - Pricing calculation endpoints
 * - planningCache.service.js - Cache management
 *
 * CRUD operations are in separate files:
 * - roomTypes.service.js - Room type operations
 * - mealPlans.service.js - Meal plan operations
 * - markets.service.js - Market operations
 * - seasons.service.js - Season operations
 * - rates.service.js - Rate operations
 * - campaigns.service.js - Campaign operations
 */

// Re-export from Room Types service
export * from './roomTypes.service.js'

// Re-export from Meal Plans service
export * from './mealPlans.service.js'

// Re-export from Markets service
export * from './markets.service.js'

// Re-export from Seasons service
export * from './seasons.service.js'

// Re-export from Rates service
export * from './rates.service.js'

// Re-export from Campaigns service
export * from './campaigns.service.js'

// Re-export from AI service
export {
  parseAIPricingCommand,
  executeAIPricingCommand
} from './planningAi.service.js'

// Re-export from Contract service
export {
  parseContract,
  importContractPricing,
  deleteMarketPricingData
} from './planningContract.service.js'

// Re-export from Calculation service
export {
  calculateRatePrice,
  calculatePriceByQuery,
  bulkCalculatePrices,
  checkPricingAvailability,
  getEffectiveRateEndpoint,
  getEffectiveMultipliers,
  getCombinationTable,
  getEffectiveChildAgeGroups,
  calculatePriceWithCampaigns,
  getApplicableCampaigns
} from './planningCalculation.service.js'

// Re-export from Cache service
export {
  getCacheStats,
  clearCache,
  invalidateCache
} from './planningCache.service.js'
