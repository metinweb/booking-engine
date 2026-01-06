/**
 * Tiers Module
 * Tier pricing and sales settings logic
 */

/**
 * Get effective sales settings considering override hierarchy
 * Market -> Season (if not inheritFromMarket)
 * @param {Object} market - Market document
 * @param {Object} season - Season document (optional)
 * @returns {Object} { workingMode, commissionRate, markup: { b2c, b2b }, agencyCommission, agencyMarginShare }
 */
export function getEffectiveSalesSettings(market, season = null) {
  // Default values from market
  let settings = {
    workingMode: market?.workingMode || 'net',
    commissionRate: market?.commissionRate || 10,
    markup: {
      b2c: market?.markup?.b2c || 0,
      b2b: market?.markup?.b2b || 0
    },
    agencyCommission: market?.agencyCommission || 10,
    agencyMarginShare: market?.agencyMarginShare ?? 50 // Default: agency gets 50% of margin
  }

  // Check Season override (higher priority than Market)
  if (season && !season.salesSettingsOverride?.inheritFromMarket) {
    const override = season.salesSettingsOverride
    settings = {
      workingMode: override.workingMode || settings.workingMode,
      commissionRate: override.commissionRate ?? settings.commissionRate,
      markup: {
        b2c: override.markup?.b2c ?? settings.markup.b2c,
        b2b: override.markup?.b2b ?? settings.markup.b2b
      },
      agencyCommission: override.agencyCommission ?? settings.agencyCommission,
      agencyMarginShare: override.agencyMarginShare ?? settings.agencyMarginShare
    }
  }

  return settings
}

/**
 * Calculate 3-tier pricing: hotelCost, b2cPrice, b2bPrice
 *
 * Working Mode: Net
 *   hotelCost = basePrice (net price from hotel)
 *   b2cPrice  = basePrice x (1 + b2cMarkup%)
 *   b2bPrice  = basePrice x (1 + b2bMarkup%)
 *
 * Working Mode: Commission (with Margin Sharing)
 *   basePrice = gross price (what hotel enters, includes commission)
 *   hotelCost = basePrice x (1 - commissionRate%)
 *   b2cPrice  = basePrice x (1 + b2cMarkup%)
 *
 *   Margin Sharing Model:
 *   - Total margin = commissionRate% (e.g., 10%)
 *   - Agency share = totalMargin x (agencyMarginShare / 100) (e.g., 10% x 50% = 5%)
 *   - b2bPrice = basePrice x (1 - agencyShare%) (e.g., basePrice x 0.95)
 *   - Partner always keeps: totalMargin - agencyShare (e.g., 10% - 5% = 5%)
 *
 *   This ensures partner NEVER has negative margin on B2B sales!
 *
 * @param {number} basePrice - Base calculated price
 * @param {Object} salesSettings - { workingMode, commissionRate, markup, agencyCommission, agencyMarginShare }
 * @returns {Object} { hotelCost, b2cPrice, b2bPrice, basePrice, breakdown }
 */
export function calculateTierPricing(basePrice, salesSettings) {
  const { workingMode, commissionRate, markup, agencyMarginShare } = salesSettings

  let hotelCost, b2cPrice, b2bPrice
  const breakdown = {
    workingMode,
    basePrice
  }

  if (workingMode === 'commission') {
    // Commission mode: basePrice is gross (sale price including commission)
    // Commission rate is like markup: 10% means hotel adds 10% to their cost
    // So: basePrice = hotelCost * (1 + commissionRate/100)
    // Therefore: hotelCost = basePrice / (1 + commissionRate/100)
    // Real margin = commissionRate / (100 + commissionRate) * 100
    // Example: 10% commission -> hotelCost = basePrice/1.10, realMargin = 9.09%

    const commRate = commissionRate || 10
    const agencySharePercent = (agencyMarginShare ?? 50) / 100 // Share of margin for agency (e.g., 50%)

    // Calculate real margin from commission rate
    // 10% commission -> 10/110 = 9.09% real margin
    const realMarginPercent = (commRate / (100 + commRate)) * 100

    // Calculate actual agency commission from margin share
    // If real margin is 9.09% and agency gets 50% of it, agency commission = 4.545%
    const calculatedAgencyCommission = realMarginPercent * agencySharePercent

    // Hotel cost = basePrice / (1 + commission/100)
    hotelCost = basePrice / (1 + commRate / 100)
    b2cPrice = basePrice * (1 + (markup?.b2c || 0) / 100)
    // Agency gets their share of the margin as discount from basePrice
    b2bPrice = basePrice * (1 - calculatedAgencyCommission / 100)

    // Calculate amounts for breakdown
    const totalMargin = basePrice - hotelCost
    const agencyAmount = basePrice - b2bPrice
    const partnerB2BAmount = b2bPrice - hotelCost

    breakdown.commissionRate = commRate
    breakdown.realMarginPercent = Math.round(realMarginPercent * 100) / 100
    breakdown.agencyMarginShare = agencyMarginShare ?? 50
    breakdown.calculatedAgencyCommission = Math.round(calculatedAgencyCommission * 100) / 100
    breakdown.partnerCommission = Math.round(totalMargin * 100) / 100
    breakdown.b2cMarkup = markup?.b2c || 0
    breakdown.partnerB2CProfit = Math.round((b2cPrice - hotelCost) * 100) / 100
    breakdown.partnerB2BProfit = Math.round(partnerB2BAmount * 100) / 100
    breakdown.agencyProfit = Math.round(agencyAmount * 100) / 100
    // Real margin percentages (based on sale price)
    breakdown.realB2CMarginPercent = b2cPrice > 0 ? Math.round(((b2cPrice - hotelCost) / b2cPrice) * 10000) / 100 : 0
    breakdown.realB2BMarginPercent = b2bPrice > 0 ? Math.round((partnerB2BAmount / b2bPrice) * 10000) / 100 : 0
  } else {
    // Net mode: basePrice is net (what partner pays to hotel)
    hotelCost = basePrice
    b2cPrice = basePrice * (1 + (markup?.b2c || 0) / 100)
    b2bPrice = basePrice * (1 + (markup?.b2b || 0) / 100)

    breakdown.b2cMarkup = markup?.b2c || 0
    breakdown.b2bMarkup = markup?.b2b || 0
    breakdown.partnerB2CProfit = b2cPrice - hotelCost
    breakdown.partnerB2BProfit = b2bPrice - hotelCost
    // Real margin percentages
    breakdown.realB2CMarginPercent = b2cPrice > 0 ? Math.round(((b2cPrice - hotelCost) / b2cPrice) * 10000) / 100 : 0
    breakdown.realB2BMarginPercent = b2bPrice > 0 ? Math.round(((b2bPrice - hotelCost) / b2bPrice) * 10000) / 100 : 0
  }

  // Round to 2 decimal places
  hotelCost = Math.round(hotelCost * 100) / 100
  b2cPrice = Math.round(b2cPrice * 100) / 100
  b2bPrice = Math.round(b2bPrice * 100) / 100

  return {
    hotelCost,
    b2cPrice,
    b2bPrice,
    basePrice,
    breakdown
  }
}
