/**
 * Gemini AI Service - Barrel Export
 *
 * This file re-exports all functions from the modular Gemini service files
 * for backward compatibility with existing imports.
 */

// Client exports
export { getAI, generateContent, languageNames, GEMINI_MODEL } from './client.js'

// Helper exports
export {
  usedCodes,
  resetUsedCodes,
  generateRoomCode,
  preprocessRoomContent,
  isJsonTruncated,
  repairTruncatedJson
} from './helpers.js'

// Translation exports
export { translateText, translateFields, batchTranslate } from './translation.js'

// Hotel extraction exports
export { extractHotelData, extractHotelDataFromUrl } from './hotelExtraction.js'

// Tour extraction exports
export { extractTourData } from './tourExtraction.js'

// Pricing parser exports
export { parsePricingCommand } from './pricingParser.js'

// Contract parser exports
export { parseHotelContract } from './contractParser.js'

// Default export for backward compatibility
export default {
  translateText: (await import('./translation.js')).translateText,
  translateFields: (await import('./translation.js')).translateFields,
  batchTranslate: (await import('./translation.js')).batchTranslate,
  parsePricingCommand: (await import('./pricingParser.js')).parsePricingCommand,
  extractHotelData: (await import('./hotelExtraction.js')).extractHotelData,
  extractHotelDataFromUrl: (await import('./hotelExtraction.js')).extractHotelDataFromUrl,
  parseHotelContract: (await import('./contractParser.js')).parseHotelContract,
  languageNames: (await import('./client.js')).languageNames
}
