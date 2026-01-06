/**
 * Validation Module
 * Result validation and error handling
 */

/**
 * Custom error class for pricing-related errors
 */
export class PricingError extends Error {
  constructor(code, details = {}) {
    super(code)
    this.name = 'PricingError'
    this.code = code
    this.details = details
  }
}

/**
 * Validate pricing result to ensure all required fields are present
 * @param {Object} result - Pricing result from calculatePriceWithCampaigns
 * @param {Object} context - Additional context for error reporting
 * @throws {PricingError} If validation fails
 * @returns {Object} Validated result
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
