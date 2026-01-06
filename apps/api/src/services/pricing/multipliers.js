/**
 * Multipliers Module
 * Multiplier template hierarchy and override functions
 */

/**
 * Convert mongoose Map to plain object
 */
export const mapToObject = map => {
  if (!map) return null
  if (map instanceof Map) {
    const obj = {}
    for (const [key, value] of map) {
      if (value instanceof Map) {
        obj[key] = mapToObject(value)
      } else {
        obj[key] = value
      }
    }
    return obj
  }
  // Already an object (from lean())
  if (typeof map === 'object' && map !== null && !Array.isArray(map)) {
    const obj = {}
    for (const [key, value] of Object.entries(map)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        obj[key] = mapToObject(value)
      } else {
        obj[key] = value
      }
    }
    return obj
  }
  return map
}

/**
 * Get effective minAdults considering override hierarchy
 * @param {Object} roomType - RoomType document
 * @param {Object} market - Market document (optional)
 * @param {Object} season - Season document (optional)
 * @returns {number} Minimum adults required
 */
export function getEffectiveMinAdults(roomType, market = null, season = null) {
  // Start with room type's base minAdults
  let minAdults = roomType?.occupancy?.minAdults || 1
  const roomTypeId = roomType?._id?.toString()

  // Check Market override
  if (market?.pricingOverrides?.length > 0 && roomTypeId) {
    const marketOverride = market.pricingOverrides.find(po => {
      const rtId =
        typeof po.roomType === 'object' ? po.roomType._id?.toString() : po.roomType?.toString()
      return rtId === roomTypeId && po.useMinAdultsOverride
    })
    if (marketOverride && marketOverride.minAdults) {
      minAdults = marketOverride.minAdults
    }
  }

  // Check Season override (higher priority than Market)
  if (season?.pricingOverrides?.length > 0 && roomTypeId) {
    const seasonOverride = season.pricingOverrides.find(po => {
      const rtId =
        typeof po.roomType === 'object' ? po.roomType._id?.toString() : po.roomType?.toString()
      return rtId === roomTypeId && po.useMinAdultsOverride
    })
    if (seasonOverride && seasonOverride.minAdults) {
      minAdults = seasonOverride.minAdults
    }
  }

  return minAdults
}

/**
 * Get effective pricing type considering override hierarchy
 * @param {Object} roomType - RoomType document
 * @param {Object} market - Market document (optional)
 * @param {Object} season - Season document (optional)
 * @param {Object} rate - Rate document (optional)
 * @returns {string} 'unit' or 'per_person'
 */
export function getEffectivePricingType(roomType, market = null, season = null, rate = null) {
  // Start with room type's base pricing type
  let pricingType = roomType?.pricingType || 'unit'
  const roomTypeId = roomType?._id?.toString()

  // Check Market override
  if (market?.pricingOverrides?.length > 0 && roomTypeId) {
    const marketOverride = market.pricingOverrides.find(po => {
      const rtId =
        typeof po.roomType === 'object' ? po.roomType._id?.toString() : po.roomType?.toString()
      return rtId === roomTypeId && po.usePricingTypeOverride
    })
    if (marketOverride) {
      pricingType = marketOverride.pricingType
    }
  }

  // Check Season override (higher priority than Market)
  if (season?.pricingOverrides?.length > 0 && roomTypeId) {
    const seasonOverride = season.pricingOverrides.find(po => {
      const rtId =
        typeof po.roomType === 'object' ? po.roomType._id?.toString() : po.roomType?.toString()
      return rtId === roomTypeId && po.usePricingTypeOverride
    })
    if (seasonOverride) {
      pricingType = seasonOverride.pricingType
    }
  }

  // Rate pricingType is the final stored value (already determined at save time)
  if (rate?.pricingType) {
    pricingType = rate.pricingType
  }

  return pricingType
}

/**
 * Get effective multiplier template considering override hierarchy
 * @param {Object} roomType - RoomType document
 * @param {Object} market - Market document (optional)
 * @param {Object} season - Season document (optional)
 * @param {Object} rate - Rate document (optional)
 * @returns {Object} { adultMultipliers, childMultipliers, combinationTable, roundingRule, useMultipliers }
 */
export function getEffectiveMultiplierTemplate(
  roomType,
  market = null,
  season = null,
  rate = null
) {
  const roomTypeId = roomType?._id?.toString()

  // Default: no multipliers
  let result = {
    useMultipliers: false,
    adultMultipliers: {},
    childMultipliers: {},
    combinationTable: [],
    roundingRule: 'none'
  }

  // Start with RoomType's multiplier template
  if (roomType?.useMultipliers && roomType?.multiplierTemplate) {
    result = {
      useMultipliers: true,
      adultMultipliers: mapToObject(roomType.multiplierTemplate.adultMultipliers) || {},
      childMultipliers: mapToObject(roomType.multiplierTemplate.childMultipliers) || {},
      combinationTable: roomType.multiplierTemplate.combinationTable || [],
      roundingRule: roomType.multiplierTemplate.roundingRule || 'none'
    }
  }

  // Check Market override
  if (market?.pricingOverrides?.length > 0 && roomTypeId) {
    const marketOverride = market.pricingOverrides.find(po => {
      const rtId =
        typeof po.roomType === 'object' ? po.roomType._id?.toString() : po.roomType?.toString()
      return rtId === roomTypeId && po.useMultiplierOverride
    })
    if (marketOverride?.multiplierOverride) {
      result = {
        useMultipliers: true,
        adultMultipliers:
          mapToObject(marketOverride.multiplierOverride.adultMultipliers) ||
          result.adultMultipliers,
        childMultipliers:
          mapToObject(marketOverride.multiplierOverride.childMultipliers) ||
          result.childMultipliers,
        combinationTable:
          marketOverride.multiplierOverride.combinationTable || result.combinationTable,
        roundingRule: marketOverride.multiplierOverride.roundingRule || result.roundingRule
      }
    }
  }

  // Check Season override (higher priority than Market)
  if (season?.pricingOverrides?.length > 0 && roomTypeId) {
    const seasonOverride = season.pricingOverrides.find(po => {
      const rtId =
        typeof po.roomType === 'object' ? po.roomType._id?.toString() : po.roomType?.toString()
      return rtId === roomTypeId && po.useMultiplierOverride
    })
    if (seasonOverride?.multiplierOverride) {
      result = {
        useMultipliers: true,
        adultMultipliers:
          mapToObject(seasonOverride.multiplierOverride.adultMultipliers) ||
          result.adultMultipliers,
        childMultipliers:
          mapToObject(seasonOverride.multiplierOverride.childMultipliers) ||
          result.childMultipliers,
        combinationTable:
          seasonOverride.multiplierOverride.combinationTable || result.combinationTable,
        roundingRule: seasonOverride.multiplierOverride.roundingRule || result.roundingRule
      }
    }
  }

  // Check Rate override (highest priority)
  if (rate?.useMultiplierOverride && rate?.multiplierOverride) {
    result = {
      useMultipliers: true,
      adultMultipliers:
        mapToObject(rate.multiplierOverride.adultMultipliers) || result.adultMultipliers,
      childMultipliers:
        mapToObject(rate.multiplierOverride.childMultipliers) || result.childMultipliers,
      combinationTable: rate.multiplierOverride.combinationTable || result.combinationTable,
      roundingRule: rate.multiplierOverride.roundingRule || result.roundingRule
    }
  }

  return result
}

/**
 * Get effective child age groups considering inheritance hierarchy
 * @param {Object} hotel - Hotel document
 * @param {Object} market - Market document (optional)
 * @param {Object} season - Season document (optional)
 * @returns {Array} Child age groups array
 */
export function getEffectiveChildAgeGroups(hotel, market = null, season = null) {
  // Default: hotel's child age groups
  let childAgeGroups = hotel?.childAgeGroups || []

  // Check Market override
  if (market && !market.childAgeSettings?.inheritFromHotel) {
    if (market.childAgeSettings?.childAgeGroups?.length > 0) {
      childAgeGroups = market.childAgeSettings.childAgeGroups
    }
  }

  // Check Season override (higher priority than Market)
  if (season && !season.childAgeSettings?.inheritFromMarket) {
    if (season.childAgeSettings?.childAgeGroups?.length > 0) {
      childAgeGroups = season.childAgeSettings.childAgeGroups
    }
  }

  return childAgeGroups
}

/**
 * Get effective rounding rule
 * @param {Object} roomType - RoomType document
 * @param {Object} market - Market document (optional)
 * @param {Object} season - Season document (optional)
 * @param {Object} rate - Rate document (optional)
 * @returns {string} Rounding rule
 */
export function getEffectiveRoundingRule(roomType, market = null, season = null, rate = null) {
  const template = getEffectiveMultiplierTemplate(roomType, market, season, rate)
  return template.roundingRule || 'none'
}
