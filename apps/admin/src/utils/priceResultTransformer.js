/**
 * Price Result Transformer
 * Transforms API pricing results to UI-friendly format
 */

/**
 * Map error message to issue type
 */
function getIssueTypeFromMessage(message) {
  if (message?.includes('Stop sale') || message?.includes('Satış kapalı')) return 'stop_sale'
  if (message?.includes('Single') || message?.includes('Tek kişi')) return 'single_stop'
  if (message?.includes('Arrival') || message?.includes('giriş')) return 'cta'
  if (message?.includes('Departure') || message?.includes('çıkış')) return 'ctd'
  if (message?.includes('Minimum') || message?.includes('minimum')) return 'min_stay'
  if (message?.includes('No rate') || message?.includes('tanımlı değil')) return 'no_rate'
  return 'restriction'
}

/**
 * Transform API result to meal plan result format for UI
 */
export function transformApiResultToMpResult(apiResult) {
  const { mealPlan, result, error } = apiResult

  // Handle API error
  if (error) {
    return {
      mealPlan,
      hasRates: false,
      available: false,
      totalPrice: 0,
      avgPerNight: 0,
      issues: [{ type: 'api_error', date: null, message: error }],
      dailyBreakdown: [],
      capacityExceeded: error === 'BELOW_MIN_ADULTS' || error.includes('Minimum'),
      tierPricing: { hotelCost: 0, b2cPrice: 0, b2bPrice: 0 }
    }
  }

  // Handle capacity exceeded (from API)
  if (!result.success && result.error === 'BELOW_MIN_ADULTS') {
    return {
      mealPlan,
      hasRates: false,
      available: false,
      totalPrice: 0,
      avgPerNight: 0,
      issues: [
        {
          type: 'capacity',
          date: null,
          message: result.message || `Minimum ${result.minAdults} yetişkin gerekli`
        }
      ],
      dailyBreakdown: [],
      capacityExceeded: true,
      tierPricing: { hotelCost: 0, b2cPrice: 0, b2bPrice: 0 }
    }
  }

  // Handle no rates found
  if (!result.success || !result.dailyBreakdown) {
    return {
      mealPlan,
      hasRates: false,
      available: false,
      totalPrice: 0,
      avgPerNight: 0,
      issues: [{ type: 'no_rate', date: null, message: result.error || 'Fiyat bulunamadı' }],
      dailyBreakdown: [],
      capacityExceeded: false,
      tierPricing: { hotelCost: 0, b2cPrice: 0, b2bPrice: 0 }
    }
  }

  // Transform daily breakdown
  const dailyBreakdown = result.dailyBreakdown.map((day, idx) => ({
    date: day.date,
    rate: day.hasRate ? day : null,
    basePrice: day.basePrice || day.price || 0,
    extraAdultPrice: day.adultPrice - (day.basePrice || 0) > 0 ? day.adultPrice - day.basePrice : 0,
    childrenPrice: day.childPrice || 0,
    singleSupplementPrice: 0,
    obpPrice: day.pricingType === 'per_person' ? day.price : null,
    dailyTotal: day.price || 0,
    hasIssue: day.hasIssue || false,
    isCheckIn: idx === 0,
    isCheckOut: idx === result.dailyBreakdown.length - 1,
    minStayIssue: day.restrictions?.minStay || false,
    // 3-tier pricing from API
    hotelCost: day.hotelCost || 0,
    b2cPrice: day.b2cPrice || 0,
    b2bPrice: day.b2bPrice || 0,
    // Campaign info
    campaignApplied: day.campaignApplied || false,
    discountAmount: day.discountAmount || 0,
    isFreeNight: day.isFreeNight || false,
    appliedCampaigns: day.appliedCampaigns || []
  }))

  // Build issues array from availability
  const issues = []
  if (result.availability?.issues) {
    for (const issue of result.availability.issues) {
      issues.push({
        type: issue.type === 'restriction' ? getIssueTypeFromMessage(issue.message) : issue.type,
        date: issue.date,
        message: issue.message
      })
    }
  }

  // Get campaign info
  const appliedCampaigns = result.campaigns?.applied || []
  const campaign = appliedCampaigns.length > 0 ? appliedCampaigns[0] : null
  const discountText = appliedCampaigns.map(c => c.discountText).join(' + ')

  // Determine pricing type from daily breakdown
  const isOBP = result.dailyBreakdown.some(d => d.pricingType === 'per_person')
  const isMultiplierOBP = isOBP && result.dailyBreakdown.some(d => d.multiplier !== undefined)

  return {
    mealPlan,
    hasRates: result.dailyBreakdown.some(d => d.hasRate),
    available: result.availability?.isAvailable ?? true,
    // Prices from API
    originalPrice: result.pricing?.originalTotal || 0,
    totalPrice: result.pricing?.finalTotal || 0,
    avgPerNight: result.pricing?.avgPerNight || 0,
    // 3-tier pricing from API (aggregated totals)
    tierPricing: {
      hotelCost: result.pricing?.hotelCost || 0,
      b2cPrice: result.pricing?.b2cPrice || 0,
      b2bPrice: result.pricing?.b2bPrice || 0
    },
    // Per night tier pricing
    tierPricingPerNight: result.pricing?.perNight || {
      hotelCost: 0,
      b2cPrice: 0,
      b2bPrice: 0
    },
    // Sales settings info
    salesSettings: result.salesSettings || {},
    // Issues and availability
    issues,
    dailyBreakdown,
    capacityExceeded: false,
    // Pricing type
    isOBP,
    isMultiplierOBP,
    // Totals (for backward compatibility with UI)
    totals: {
      basePrice: result.pricing?.originalTotal || 0,
      extraAdult: 0,
      children: 0,
      singleSupplement: 0,
      obpTotal: isOBP ? result.pricing?.originalTotal || 0 : 0
    },
    // Campaign info
    campaign,
    campaigns: appliedCampaigns,
    discountText,
    discountAmount: result.campaigns?.totalDiscount || 0,
    totalDiscountAmount: result.campaigns?.totalDiscount || 0,
    // Non-refundable pricing
    nonRefundable: result.nonRefundable || { enabled: false }
  }
}

/**
 * Group API results by room type
 */
export function groupResultsByRoomType(apiResults, roomTypes) {
  const roomTypeMap = new Map()

  // Initialize room type map
  for (const roomType of roomTypes) {
    roomTypeMap.set(roomType._id, {
      roomType,
      mealPlans: []
    })
  }

  // Process API results
  for (const apiResult of apiResults) {
    const roomResult = roomTypeMap.get(apiResult.roomTypeId)
    if (!roomResult) continue

    // Transform API result to UI format
    const mpResult = transformApiResultToMpResult(apiResult)
    roomResult.mealPlans.push(mpResult)
  }

  // Convert map to array
  return Array.from(roomTypeMap.values())
}
