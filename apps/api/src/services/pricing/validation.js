/**
 * @module services/pricing/validation
 * @description Pricing result validation and error handling.
 * Ensures pricing calculations return valid and consistent results.
 */

/**
 * Pricing context for error reporting
 * @typedef {Object} PricingContext
 * @property {string} [hotelId] - Hotel ID
 * @property {string} [roomTypeId] - Room type ID
 * @property {string} [checkInDate] - Check-in date
 * @property {string} [checkOutDate] - Check-out date
 */

/**
 * Pricing result from calculation
 * @typedef {Object} PricingResult
 * @property {boolean} success - Whether calculation succeeded
 * @property {Object} [pricing] - Pricing data
 * @property {number} [pricing.originalTotal] - Original total before discounts
 * @property {number} [pricing.finalTotal] - Final total after discounts
 * @property {number} [pricing.totalDiscount] - Total discount amount
 * @property {string} [error] - Error code if failed
 * @property {string} [message] - Error message if failed
 */

/**
 * Custom error class for pricing-related errors
 * @extends Error
 * @example
 * throw new PricingError('INVALID_DATE_RANGE', { checkIn: '2024-01-15', checkOut: '2024-01-10' })
 */
export class PricingError extends Error {
  /**
   * Create a pricing error
   * @param {string} code - Error code (e.g., 'PRICING_CALCULATION_FAILED')
   * @param {Object} [details={}] - Additional error details
   */
  constructor(code, details = {}) {
    super(code)
    /** @type {string} Error class name */
    this.name = 'PricingError'
    /** @type {string} Error code */
    this.code = code
    /** @type {Object} Additional error details */
    this.details = details
  }
}

/**
 * Validate pricing result to ensure all required fields are present and consistent
 * Checks for success flag, required pricing fields, and logical consistency
 * @param {PricingResult} result - Pricing result from calculatePriceWithCampaigns
 * @param {PricingContext} [context={}] - Additional context for error reporting
 * @throws {PricingError} PRICING_CALCULATION_FAILED if result.success is false
 * @throws {PricingError} MISSING_PRICING_DATA if pricing object is missing
 * @throws {PricingError} MISSING_PRICING_FIELD_* if required field is missing
 * @returns {PricingResult} Validated result (same as input if valid)
 * @example
 * const validated = validatePricingResult(pricingResult, {
 *   hotelId: '123',
 *   checkInDate: '2024-01-15'
 * })
 */
export function validatePricingResult(result, context = {}) {
  // Check success
  if (!result.success) {
    throw new PricingError('PRICING_CALCULATION_FAILED', {
      error: result.error,
      message: result.message,
      ...context
    })
  }

  // Check required pricing fields
  const pricing = result.pricing
  if (!pricing) {
    throw new PricingError('MISSING_PRICING_DATA', { result, ...context })
  }

  const requiredFields = ['originalTotal', 'finalTotal']
  for (const field of requiredFields) {
    if (pricing[field] === undefined || pricing[field] === null) {
      throw new PricingError(`MISSING_PRICING_FIELD_${field.toUpperCase()}`, {
        field,
        pricing,
        ...context
      })
    }
  }

  // Validate logical consistency
  // finalTotal should equal originalTotal - totalDiscount
  const expectedFinal = pricing.originalTotal - (pricing.totalDiscount || 0)
  const tolerance = 0.01 // Allow 1 cent tolerance for rounding
  if (Math.abs(expectedFinal - pricing.finalTotal) > tolerance) {
    console.warn('[PricingService] Pricing inconsistency detected:', {
      originalTotal: pricing.originalTotal,
      totalDiscount: pricing.totalDiscount,
      expectedFinal,
      actualFinal: pricing.finalTotal,
      difference: Math.abs(expectedFinal - pricing.finalTotal)
    })
  }

  return result
}
