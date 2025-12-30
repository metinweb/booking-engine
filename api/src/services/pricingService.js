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
 */

import Rate from '../modules/planning/rate.model.js'
import RoomType from '../modules/planning/roomType.model.js'
import MealPlan from '../modules/planning/mealPlan.model.js'
import Market from '../modules/planning/market.model.js'
import Season from '../modules/planning/season.model.js'
import Hotel from '../modules/hotel/hotel.model.js'
import {
	calculatePrice,
	calculateCombinationMultiplier,
	getEffectiveMultiplier,
	generateCombinationKey
} from '../utils/multiplierUtils.js'
import { BadRequestError, NotFoundError } from '../core/errors.js'
import cache, { CACHE_PREFIXES, CACHE_TTL, generateCacheKey } from './cacheService.js'

/**
 * Convert mongoose Map to plain object
 */
const mapToObject = (map) => {
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
			const rtId = typeof po.roomType === 'object' ? po.roomType._id?.toString() : po.roomType?.toString()
			return rtId === roomTypeId && po.useMinAdultsOverride
		})
		if (marketOverride && marketOverride.minAdults) {
			minAdults = marketOverride.minAdults
		}
	}

	// Check Season override (higher priority than Market)
	if (season?.pricingOverrides?.length > 0 && roomTypeId) {
		const seasonOverride = season.pricingOverrides.find(po => {
			const rtId = typeof po.roomType === 'object' ? po.roomType._id?.toString() : po.roomType?.toString()
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
			const rtId = typeof po.roomType === 'object' ? po.roomType._id?.toString() : po.roomType?.toString()
			return rtId === roomTypeId && po.usePricingTypeOverride
		})
		if (marketOverride) {
			pricingType = marketOverride.pricingType
		}
	}

	// Check Season override (higher priority than Market)
	if (season?.pricingOverrides?.length > 0 && roomTypeId) {
		const seasonOverride = season.pricingOverrides.find(po => {
			const rtId = typeof po.roomType === 'object' ? po.roomType._id?.toString() : po.roomType?.toString()
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
export function getEffectiveMultiplierTemplate(roomType, market = null, season = null, rate = null) {
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
			const rtId = typeof po.roomType === 'object' ? po.roomType._id?.toString() : po.roomType?.toString()
			return rtId === roomTypeId && po.useMultiplierOverride
		})
		if (marketOverride?.multiplierOverride) {
			result = {
				useMultipliers: true,
				adultMultipliers: mapToObject(marketOverride.multiplierOverride.adultMultipliers) || result.adultMultipliers,
				childMultipliers: mapToObject(marketOverride.multiplierOverride.childMultipliers) || result.childMultipliers,
				combinationTable: marketOverride.multiplierOverride.combinationTable || result.combinationTable,
				roundingRule: marketOverride.multiplierOverride.roundingRule || result.roundingRule
			}
		}
	}

	// Check Season override (higher priority than Market)
	if (season?.pricingOverrides?.length > 0 && roomTypeId) {
		const seasonOverride = season.pricingOverrides.find(po => {
			const rtId = typeof po.roomType === 'object' ? po.roomType._id?.toString() : po.roomType?.toString()
			return rtId === roomTypeId && po.useMultiplierOverride
		})
		if (seasonOverride?.multiplierOverride) {
			result = {
				useMultipliers: true,
				adultMultipliers: mapToObject(seasonOverride.multiplierOverride.adultMultipliers) || result.adultMultipliers,
				childMultipliers: mapToObject(seasonOverride.multiplierOverride.childMultipliers) || result.childMultipliers,
				combinationTable: seasonOverride.multiplierOverride.combinationTable || result.combinationTable,
				roundingRule: seasonOverride.multiplierOverride.roundingRule || result.roundingRule
			}
		}
	}

	// Check Rate override (highest priority)
	if (rate?.useMultiplierOverride && rate?.multiplierOverride) {
		result = {
			useMultipliers: true,
			adultMultipliers: mapToObject(rate.multiplierOverride.adultMultipliers) || result.adultMultipliers,
			childMultipliers: mapToObject(rate.multiplierOverride.childMultipliers) || result.childMultipliers,
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

/**
 * Check booking restrictions for a rate
 * @param {Object} rate - Rate document
 * @param {Object} options - { checkInDate, checkOutDate, adults, bookingDate, minAdults }
 * @returns {Object} { isBookable, restrictions: { stopSale, singleStop, belowMinAdults, minStay, maxStay, releaseDays, closedToArrival, closedToDeparture } }
 */
export function checkRestrictions(rate, options = {}) {
	const { checkInDate, checkOutDate, adults = 2, bookingDate = new Date(), requiredRooms = 1, minAdults = 1 } = options

	const restrictions = {
		stopSale: false,
		singleStop: false,
		belowMinAdults: false,
		minStay: false,
		maxStay: false,
		releaseDays: false,
		closedToArrival: false,
		closedToDeparture: false,
		noAvailability: false,
		insufficientAllotment: false
	}
	const messages = []

	// Stop sale check
	if (rate.stopSale) {
		restrictions.stopSale = true
		messages.push('Stop sale active')
	}

	// Minimum adults check (considering override hierarchy)
	if (adults < minAdults) {
		restrictions.belowMinAdults = true
		messages.push(`Minimum ${minAdults} adult(s) required`)
	}

	// Single stop check (1 adult not allowed) - legacy, kept for backwards compatibility
	if (rate.singleStop && adults === 1) {
		restrictions.singleStop = true
		messages.push('Single occupancy not available')
	}

	// Real-time allotment check
	// rate.allotment = total rooms allocated
	// rate.sold = rooms already sold
	// available = allotment - sold
	const allotment = rate.allotment ?? null
	const sold = rate.sold ?? 0

	if (allotment !== null) {
		const available = allotment - sold
		if (available < requiredRooms) {
			restrictions.insufficientAllotment = true
			if (available <= 0) {
				restrictions.noAvailability = true
				messages.push('No rooms available')
			} else {
				messages.push(`Only ${available} room(s) available, ${requiredRooms} required`)
			}
		}
	}

	// Legacy availability check (for backwards compatibility)
	if (rate.available !== undefined && rate.available <= 0) {
		restrictions.noAvailability = true
		if (!messages.includes('No rooms available')) {
			messages.push('No rooms available')
		}
	}

	// Release days check
	if (rate.releaseDays > 0 && checkInDate) {
		const checkIn = new Date(checkInDate)
		const booking = new Date(bookingDate)
		const daysDifference = Math.floor((checkIn - booking) / (1000 * 60 * 60 * 24))

		if (daysDifference < rate.releaseDays) {
			restrictions.releaseDays = true
			messages.push(`Minimum ${rate.releaseDays} days advance booking required`)
		}
	}

	// Min/Max stay check
	if (checkInDate && checkOutDate) {
		const checkIn = new Date(checkInDate)
		const checkOut = new Date(checkOutDate)
		const nights = Math.floor((checkOut - checkIn) / (1000 * 60 * 60 * 24))

		if (rate.minStay && nights < rate.minStay) {
			restrictions.minStay = true
			messages.push(`Minimum ${rate.minStay} night stay required`)
		}

		if (rate.maxStay && nights > rate.maxStay) {
			restrictions.maxStay = true
			messages.push(`Maximum ${rate.maxStay} night stay allowed`)
		}
	}

	// Closed to arrival/departure
	if (rate.closedToArrival) {
		restrictions.closedToArrival = true
		messages.push('Arrival not allowed on this date')
	}

	if (rate.closedToDeparture) {
		restrictions.closedToDeparture = true
		messages.push('Departure not allowed on this date')
	}

	const isBookable = !Object.values(restrictions).some(v => v === true)

	return {
		isBookable,
		restrictions,
		messages
	}
}

/**
 * Calculate price for a specific occupancy combination
 * @param {Object} rate - Rate document
 * @param {Object} options - { adults, children: [{ age, ageGroup }], nights }
 * @param {Object} context - { roomType, market, season, hotel }
 * @returns {Object} { totalPrice, breakdown, pricingType, ... }
 */
export function calculateOccupancyPrice(rate, options = {}, context = {}) {
	const { adults = 2, children = [], nights = 1 } = options
	const { roomType, market, season, hotel } = context

	// Get effective pricing type
	const pricingType = getEffectivePricingType(roomType, market, season, rate)

	// Get effective child age groups
	const childAgeGroups = getEffectiveChildAgeGroups(hotel, market, season)

	const result = {
		pricingType,
		adults,
		children,
		nights,
		basePrice: 0,
		adultPrice: 0,
		childPrice: 0,
		totalPerNight: 0,
		totalPrice: 0,
		breakdown: [],
		currency: rate.currency || market?.currency || 'EUR'
	}

	if (pricingType === 'unit') {
		// Unit-based pricing
		result.basePrice = rate.pricePerNight || 0

		// Calculate adult pricing
		const baseOccupancy = roomType?.occupancy?.baseOccupancy || 2

		if (adults < baseOccupancy) {
			// Single supplement (reduction)
			result.adultPrice = result.basePrice - (rate.singleSupplement || 0)
			result.breakdown.push({
				type: 'base',
				description: `Base price (${baseOccupancy} adults)`,
				amount: result.basePrice
			})
			result.breakdown.push({
				type: 'single_supplement',
				description: 'Single supplement reduction',
				amount: -(rate.singleSupplement || 0)
			})
		} else if (adults > baseOccupancy) {
			// Extra adults
			const extraAdults = adults - baseOccupancy
			const extraAdultTotal = extraAdults * (rate.extraAdult || 0)
			result.adultPrice = result.basePrice + extraAdultTotal
			result.breakdown.push({
				type: 'base',
				description: `Base price (${baseOccupancy} adults)`,
				amount: result.basePrice
			})
			if (extraAdultTotal > 0) {
				result.breakdown.push({
					type: 'extra_adult',
					description: `${extraAdults} extra adult(s) × ${rate.extraAdult}`,
					amount: extraAdultTotal
				})
			}
		} else {
			result.adultPrice = result.basePrice
			result.breakdown.push({
				type: 'base',
				description: `Base price (${adults} adults)`,
				amount: result.basePrice
			})
		}

		// Calculate child pricing
		children.forEach((child, index) => {
			const childOrder = index + 1
			let childPrice = 0

			// Try childOrderPricing first (position-based)
			if (rate.childOrderPricing && rate.childOrderPricing[index] !== undefined) {
				childPrice = rate.childOrderPricing[index]
			}
			// Then try childPricing (age-based tiers)
			else if (rate.childPricing && rate.childPricing.length > 0 && child.age !== undefined) {
				const tier = rate.childPricing.find(t => child.age >= t.minAge && child.age <= t.maxAge)
				if (tier) {
					childPrice = tier.price
				}
			}
			// Fallback to extraChild
			else {
				childPrice = rate.extraChild || 0
			}

			result.childPrice += childPrice
			if (childPrice > 0) {
				result.breakdown.push({
					type: 'child',
					description: `Child ${childOrder} (age ${child.age || 'N/A'})`,
					amount: childPrice
				})
			}
		})

		result.totalPerNight = result.adultPrice + result.childPrice
		result.totalPrice = result.totalPerNight * nights

	} else {
		// OBP (per_person) pricing
		const multiplierTemplate = getEffectiveMultiplierTemplate(roomType, market, season, rate)

		// If using direct occupancy pricing (no multipliers)
		if (!multiplierTemplate.useMultipliers) {
			// Use occupancyPricing directly
			const occupancyPrice = rate.occupancyPricing?.[adults] || 0
			result.basePrice = occupancyPrice
			result.adultPrice = occupancyPrice

			result.breakdown.push({
				type: 'occupancy',
				description: `${adults} adult(s) occupancy price`,
				amount: occupancyPrice
			})

			// Child pricing for OBP without multipliers - use childOrderPricing
			children.forEach((child, index) => {
				const childOrder = index + 1
				let childPrice = 0

				if (rate.childOrderPricing && rate.childOrderPricing[index] !== undefined) {
					childPrice = rate.childOrderPricing[index]
				} else if (rate.childPricing && rate.childPricing.length > 0 && child.age !== undefined) {
					const tier = rate.childPricing.find(t => child.age >= t.minAge && child.age <= t.maxAge)
					if (tier) {
						childPrice = tier.price
					}
				}

				result.childPrice += childPrice
				if (childPrice > 0) {
					result.breakdown.push({
						type: 'child',
						description: `Child ${childOrder} (age ${child.age || 'N/A'})`,
						amount: childPrice
					})
				}
			})

			result.totalPerNight = result.adultPrice + result.childPrice
			result.totalPrice = result.totalPerNight * nights

		} else {
			// OBP with multipliers
			// Base price is occupancyPricing[2] (double occupancy)
			const baseOccupancy = roomType?.occupancy?.baseOccupancy || 2
			const basePrice = rate.occupancyPricing?.[baseOccupancy] || rate.pricePerNight || 0
			result.basePrice = basePrice

			// Determine child age groups for children
			const childrenWithAgeGroups = children.map((child, index) => {
				let ageGroup = child.ageGroup

				// If ageGroup not provided, determine from age
				if (!ageGroup && child.age !== undefined && childAgeGroups.length > 0) {
					const group = childAgeGroups.find(ag => child.age >= ag.minAge && child.age <= ag.maxAge)
					ageGroup = group?.code || 'first'
				}

				return {
					order: index + 1,
					ageGroup: ageGroup || 'first',
					age: child.age
				}
			})

			// Generate combination key
			const combinationKey = generateCombinationKey(adults, childrenWithAgeGroups)

			// Look for combination in table
			let multiplier = 1
			let combinationFound = false

			if (multiplierTemplate.combinationTable?.length > 0) {
				const combination = multiplierTemplate.combinationTable.find(c => c.key === combinationKey)
				if (combination) {
					combinationFound = true

					// Check if combination is active
					if (!combination.isActive) {
						result.error = 'Combination not available for sale'
						result.isAvailable = false
						return result
					}

					multiplier = getEffectiveMultiplier(combination)
				}
			}

			// If not found in table, calculate from multipliers
			if (!combinationFound) {
				multiplier = calculateCombinationMultiplier(
					adults,
					childrenWithAgeGroups,
					multiplierTemplate.adultMultipliers,
					multiplierTemplate.childMultipliers
				)
			}

			// Apply rounding rule
			const roundingRule = multiplierTemplate.roundingRule || 'none'
			const calculatedPrice = calculatePrice(basePrice, multiplier, roundingRule)

			result.multiplier = multiplier
			result.combinationKey = combinationKey
			result.roundingRule = roundingRule
			result.adultPrice = calculatedPrice
			result.totalPerNight = calculatedPrice
			result.totalPrice = calculatedPrice * nights

			result.breakdown.push({
				type: 'obp_base',
				description: `Base price (${baseOccupancy} adults)`,
				amount: basePrice
			})
			result.breakdown.push({
				type: 'multiplier',
				description: `Multiplier for ${combinationKey}: ×${multiplier}`,
				amount: calculatedPrice - basePrice
			})
		}
	}

	result.isAvailable = true
	return result
}

/**
 * Get effective rate with all context loaded
 * @param {string} hotelId - Hotel ID
 * @param {string} roomTypeId - Room Type ID
 * @param {string} mealPlanId - Meal Plan ID
 * @param {string} marketId - Market ID
 * @param {Date|string} date - Date
 * @returns {Object} { rate, roomType, mealPlan, market, season, hotel, effectivePricingType, effectiveMultipliers }
 */
export async function getEffectiveRate(hotelId, roomTypeId, mealPlanId, marketId, date) {
	// Fetch all required documents in parallel
	const [rate, roomType, mealPlan, market, hotel] = await Promise.all([
		Rate.findByDate(hotelId, roomTypeId, mealPlanId, marketId, date),
		RoomType.findById(roomTypeId).lean(),
		MealPlan.findById(mealPlanId).lean(),
		Market.findById(marketId).lean(),
		Hotel.findById(hotelId).select('childAgeGroups').lean()
	])

	if (!rate) {
		throw new NotFoundError('RATE_NOT_FOUND')
	}

	// Get season for the date
	const season = await Season.findByDate(hotelId, marketId, date)

	// Calculate effective values
	const effectivePricingType = getEffectivePricingType(roomType, market, season, rate)
	const effectiveMultipliers = getEffectiveMultiplierTemplate(roomType, market, season, rate)
	const effectiveChildAgeGroups = getEffectiveChildAgeGroups(hotel, market, season)
	const effectiveRoundingRule = effectiveMultipliers.roundingRule
	const effectiveMinAdults = getEffectiveMinAdults(roomType, market, season)

	return {
		rate: rate.toObject(),
		roomType,
		mealPlan,
		market,
		season: season ? season.toObject() : null,
		hotel,
		effectivePricingType,
		effectiveMultipliers,
		effectiveChildAgeGroups,
		effectiveRoundingRule,
		effectiveMinAdults
	}
}

/**
 * Calculate price for a booking query
 * @param {Object} query - { hotelId, roomTypeId, mealPlanId, marketId, date, adults, children, nights }
 * @returns {Object} Calculated price with breakdown
 */
export async function calculateBookingPrice(query, useCache = true) {
	const {
		hotelId,
		roomTypeId,
		mealPlanId,
		marketId,
		date,
		adults = 2,
		children = [],
		nights = 1
	} = query

	// Check cache first
	if (useCache) {
		const cacheKey = generateCacheKey(CACHE_PREFIXES.PRICE_CALCULATION, {
			hotelId,
			roomTypeId,
			mealPlanId,
			marketId,
			date: date instanceof Date ? date.toISOString().split('T')[0] : date,
			adults,
			children: JSON.stringify(children),
			nights
		})

		const cached = cache.get(cacheKey)
		if (cached) {
			return { ...cached, fromCache: true }
		}
	}

	// Get effective rate with context
	const effectiveData = await getEffectiveRate(hotelId, roomTypeId, mealPlanId, marketId, date)

	// Check restrictions (including minAdults from effective hierarchy)
	const restrictionCheck = checkRestrictions(effectiveData.rate, {
		adults,
		bookingDate: new Date(),
		minAdults: effectiveData.effectiveMinAdults
	})

	if (!restrictionCheck.isBookable) {
		return {
			success: false,
			error: 'Rate not bookable',
			restrictions: restrictionCheck.restrictions,
			messages: restrictionCheck.messages
		}
	}

	// Calculate price
	const priceResult = calculateOccupancyPrice(
		effectiveData.rate,
		{ adults, children, nights },
		{
			roomType: effectiveData.roomType,
			market: effectiveData.market,
			season: effectiveData.season,
			hotel: effectiveData.hotel
		}
	)

	const result = {
		success: true,
		...priceResult,
		effectiveData: {
			pricingType: effectiveData.effectivePricingType,
			multipliers: effectiveData.effectiveMultipliers,
			childAgeGroups: effectiveData.effectiveChildAgeGroups,
			roundingRule: effectiveData.effectiveRoundingRule,
			season: effectiveData.season ? {
				_id: effectiveData.season._id,
				name: effectiveData.season.name,
				code: effectiveData.season.code
			} : null
		}
	}

	// Cache the result
	if (useCache) {
		const cacheKey = generateCacheKey(CACHE_PREFIXES.PRICE_CALCULATION, {
			hotelId,
			roomTypeId,
			mealPlanId,
			marketId,
			date: date instanceof Date ? date.toISOString().split('T')[0] : date,
			adults,
			children: JSON.stringify(children),
			nights
		})
		cache.set(cacheKey, result, CACHE_TTL.PRICE_CALCULATION)
	}

	return result
}

/**
 * Bulk calculate prices for multiple queries
 * @param {Array} queries - Array of query objects
 * @returns {Array} Array of calculated prices
 */
export async function bulkCalculatePrices(queries) {
	const results = await Promise.all(
		queries.map(query => calculateBookingPrice(query).catch(error => ({
			success: false,
			error: error.message,
			query
		})))
	)
	return results
}

/**
 * Check availability for a date range
 * @param {Object} params - { hotelId, roomTypeId, mealPlanId, marketId, startDate, endDate, adults }
 * @returns {Object} { isAvailable, unavailableDates, restrictions }
 */
export async function checkAvailability(params) {
	const { hotelId, roomTypeId, mealPlanId, marketId, startDate, endDate, adults = 2 } = params

	const rates = await Rate.findInRange(hotelId, startDate, endDate, {
		roomType: roomTypeId,
		mealPlan: mealPlanId,
		market: marketId
	})

	const unavailableDates = []
	const restrictionsByDate = {}

	for (const rate of rates) {
		const check = checkRestrictions(rate, { adults, bookingDate: new Date() })
		if (!check.isBookable) {
			const dateStr = rate.date.toISOString().split('T')[0]
			unavailableDates.push(dateStr)
			restrictionsByDate[dateStr] = check
		}
	}

	return {
		isAvailable: unavailableDates.length === 0,
		unavailableDates,
		restrictionsByDate,
		totalDaysChecked: rates.length
	}
}

// ==================== CAMPAIGN FUNCTIONS ====================

/**
 * Get applicable campaigns for a booking
 * @param {string} hotelId - Hotel ID
 * @param {Object} params - { checkInDate, checkOutDate, roomTypeId, marketId, mealPlanId, nights, bookingDate }
 * @returns {Array} Applicable campaigns sorted by priority
 */
export async function getApplicableCampaigns(hotelId, params) {
	const Campaign = (await import('../modules/planning/campaign.model.js')).default

	const {
		checkInDate,
		checkOutDate,
		roomTypeId,
		marketId,
		mealPlanId,
		nights,
		bookingDate = new Date()
	} = params

	// Use the model's findApplicable method
	const campaigns = await Campaign.findApplicable(hotelId, {
		bookingDate,
		checkInDate: new Date(checkInDate),
		checkOutDate: new Date(checkOutDate),
		roomTypeId,
		marketId,
		mealPlanId,
		nights
	})

	return campaigns
}

/**
 * Check if a specific date is eligible for a campaign
 * @param {Object} campaign - Campaign document
 * @param {Date} date - Date to check
 * @param {Date} checkInDate - Check-in date
 * @returns {boolean}
 */
function isDateEligibleForCampaign(campaign, date, checkInDate) {
	const dateObj = new Date(date)
	const stayStart = new Date(campaign.stayWindow.startDate)
	const stayEnd = new Date(campaign.stayWindow.endDate)

	// Normalize dates for comparison
	stayStart.setHours(0, 0, 0, 0)
	stayEnd.setHours(23, 59, 59, 999)
	dateObj.setHours(0, 0, 0, 0)

	// Check application type
	if (campaign.applicationType === 'checkin') {
		// If check-in is within stay window, all nights are eligible
		const checkIn = new Date(checkInDate)
		checkIn.setHours(0, 0, 0, 0)
		return checkIn >= stayStart && checkIn <= stayEnd
	}

	// Default: 'stay' - only dates within stay window are eligible
	return dateObj >= stayStart && dateObj <= stayEnd
}

/**
 * Get day of week name for a date
 * @param {Date} date
 * @returns {string} lowercase day name
 */
function getDayOfWeek(date) {
	const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
	return days[new Date(date).getDay()]
}

/**
 * Check if a date matches campaign's applicable days
 * @param {Object} campaign
 * @param {Date} date
 * @returns {boolean}
 */
function isDayApplicable(campaign, date) {
	if (!campaign.conditions?.applicableDays) return true
	const dayName = getDayOfWeek(date)
	return campaign.conditions.applicableDays[dayName] !== false
}

/**
 * Apply a single campaign to daily breakdown
 * @param {Object} campaign - Campaign document
 * @param {Array} dailyBreakdown - Array of { date, originalPrice, price, ... }
 * @param {Object} options - { checkInDate, calculationType }
 * @returns {Object} { dailyBreakdown, totalDiscount, discountText }
 */
export function applyCampaignToBreakdown(campaign, dailyBreakdown, options = {}) {
	const { checkInDate, calculationType = 'cumulative' } = options
	let totalDiscount = 0
	let eligibleNights = 0
	const discountDetails = []

	// Clone breakdown to avoid mutation
	const updatedBreakdown = dailyBreakdown.map(day => ({ ...day }))

	// Find eligible days
	const eligibleDays = updatedBreakdown.filter(day => {
		const isEligible = isDateEligibleForCampaign(campaign, day.date, checkInDate)
		const isDayOk = isDayApplicable(campaign, day.date)
		return isEligible && isDayOk && day.price > 0
	})

	eligibleNights = eligibleDays.length

	if (eligibleNights === 0) {
		return {
			dailyBreakdown: updatedBreakdown,
			totalDiscount: 0,
			discountText: '',
			eligibleNights: 0,
			applied: false
		}
	}

	// Apply discount based on type
	if (campaign.discount.type === 'percentage') {
		const discountPercent = campaign.discount.value / 100

		eligibleDays.forEach(eligibleDay => {
			const day = updatedBreakdown.find(d => d.date === eligibleDay.date)
			const basePrice = calculationType === 'cumulative' ? (day.originalPrice || day.price) : day.price
			const dayDiscount = basePrice * discountPercent

			day.price = Math.max(0, day.price - dayDiscount)
			day.discountAmount = (day.discountAmount || 0) + dayDiscount
			day.campaignApplied = true
			day.appliedCampaigns = day.appliedCampaigns || []
			day.appliedCampaigns.push({
				code: campaign.code,
				name: campaign.name,
				discount: `-${campaign.discount.value}%`,
				amount: dayDiscount
			})

			totalDiscount += dayDiscount
		})

		discountDetails.push(`-${campaign.discount.value}%`)

	} else if (campaign.discount.type === 'fixed') {
		const discountPerNight = campaign.discount.value

		eligibleDays.forEach(eligibleDay => {
			const day = updatedBreakdown.find(d => d.date === eligibleDay.date)
			const dayDiscount = Math.min(discountPerNight, day.price)

			day.price = Math.max(0, day.price - dayDiscount)
			day.discountAmount = (day.discountAmount || 0) + dayDiscount
			day.campaignApplied = true
			day.appliedCampaigns = day.appliedCampaigns || []
			day.appliedCampaigns.push({
				code: campaign.code,
				name: campaign.name,
				discount: `-${campaign.discount.value}`,
				amount: dayDiscount
			})

			totalDiscount += dayDiscount
		})

		discountDetails.push(`-${campaign.discount.value}/night`)

	} else if (campaign.discount.type === 'free_nights') {
		const { stayNights, freeNights } = campaign.discount.freeNights || {}

		if (stayNights && freeNights && eligibleNights >= stayNights) {
			// Sort eligible days by price (cheapest first for free nights)
			const sortedEligible = [...eligibleDays].sort((a, b) => a.price - b.price)
			const freeNightDays = sortedEligible.slice(0, freeNights)

			freeNightDays.forEach(eligibleDay => {
				const day = updatedBreakdown.find(d => d.date === eligibleDay.date)
				const dayDiscount = day.price

				day.price = 0
				day.discountAmount = (day.discountAmount || 0) + dayDiscount
				day.isFreeNight = true
				day.campaignApplied = true
				day.appliedCampaigns = day.appliedCampaigns || []
				day.appliedCampaigns.push({
					code: campaign.code,
					name: campaign.name,
					discount: 'FREE',
					amount: dayDiscount
				})

				totalDiscount += dayDiscount
			})

			discountDetails.push(`${stayNights}=${freeNights} Free`)
		}
	}

	// Build discount text
	let discountText = discountDetails.join(', ')
	if (eligibleNights < dailyBreakdown.length && discountText) {
		discountText += ` (${eligibleNights}/${dailyBreakdown.length} nights)`
	}

	return {
		dailyBreakdown: updatedBreakdown,
		totalDiscount,
		discountText,
		eligibleNights,
		applied: totalDiscount > 0
	}
}

/**
 * Apply multiple campaigns to a price calculation
 * Handles combinable vs non-combinable campaigns
 * @param {Array} campaigns - Array of campaign documents
 * @param {Array} dailyBreakdown - Array of { date, price, originalPrice }
 * @param {Object} options - { checkInDate }
 * @returns {Object} { dailyBreakdown, appliedCampaigns, totalDiscount, originalTotal, finalTotal }
 */
export function applyCampaigns(campaigns, dailyBreakdown, options = {}) {
	if (!campaigns || campaigns.length === 0) {
		const totalPrice = dailyBreakdown.reduce((sum, d) => sum + (d.price || 0), 0)
		return {
			dailyBreakdown,
			appliedCampaigns: [],
			totalDiscount: 0,
			originalTotal: totalPrice,
			finalTotal: totalPrice
		}
	}

	const { checkInDate } = options
	const originalTotal = dailyBreakdown.reduce((sum, d) => sum + (d.price || 0), 0)

	// Store original prices
	let currentBreakdown = dailyBreakdown.map(day => ({
		...day,
		originalPrice: day.price
	}))

	// Separate combinable and non-combinable campaigns
	const nonCombinableCampaigns = campaigns.filter(c => !c.combinable)
	const combinableCampaigns = campaigns.filter(c => c.combinable)

	let campaignsToApply = []
	let appliedCampaigns = []
	let totalDiscount = 0

	// If there are non-combinable campaigns, use the highest priority one
	if (nonCombinableCampaigns.length > 0) {
		// Sort by priority (highest first)
		nonCombinableCampaigns.sort((a, b) => (b.priority || 0) - (a.priority || 0))
		campaignsToApply = [nonCombinableCampaigns[0]]
	} else if (combinableCampaigns.length > 0) {
		// Sort by calculationOrder for sequential application
		combinableCampaigns.sort((a, b) => (a.calculationOrder || 0) - (b.calculationOrder || 0))
		campaignsToApply = combinableCampaigns
	}

	// Apply each campaign
	for (const campaign of campaignsToApply) {
		const result = applyCampaignToBreakdown(campaign, currentBreakdown, {
			checkInDate,
			calculationType: campaign.calculationType || 'cumulative'
		})

		if (result.applied) {
			currentBreakdown = result.dailyBreakdown
			totalDiscount += result.totalDiscount
			appliedCampaigns.push({
				_id: campaign._id,
				code: campaign.code,
				name: campaign.name,
				type: campaign.type,
				discountType: campaign.discount.type,
				discountValue: campaign.discount.value,
				freeNights: campaign.discount.freeNights,
				discountAmount: result.totalDiscount,
				discountText: result.discountText,
				eligibleNights: result.eligibleNights
			})
		}
	}

	const finalTotal = currentBreakdown.reduce((sum, d) => sum + (d.price || 0), 0)

	return {
		dailyBreakdown: currentBreakdown,
		appliedCampaigns,
		totalDiscount,
		originalTotal,
		finalTotal
	}
}

/**
 * Calculate complete booking price with campaigns
 * @param {Object} query - Booking query parameters
 * @returns {Object} Complete price breakdown with campaigns
 */
export async function calculatePriceWithCampaigns(query, useCache = true) {
	const {
		hotelId,
		roomTypeId,
		mealPlanId,
		marketId,
		checkInDate,
		checkOutDate,
		adults = 2,
		children = [],
		includeCampaigns = true
	} = query

	// Check cache first
	if (useCache) {
		const cacheKey = generateCacheKey(CACHE_PREFIXES.PRICE_CALCULATION, {
			type: 'withCampaigns',
			hotelId,
			roomTypeId,
			mealPlanId,
			marketId,
			checkInDate,
			checkOutDate,
			adults,
			children: JSON.stringify(children),
			includeCampaigns
		})

		const cached = cache.get(cacheKey)
		if (cached) {
			return { ...cached, fromCache: true }
		}
	}

	// Calculate number of nights
	const checkIn = new Date(checkInDate)
	const checkOut = new Date(checkOutDate)
	const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24))

	if (nights <= 0) {
		throw new BadRequestError('INVALID_DATE_RANGE')
	}

	// Get all rates for the date range
	const rates = await Rate.findInRange(hotelId, checkInDate, checkOutDate, {
		roomType: roomTypeId,
		mealPlan: mealPlanId,
		market: marketId
	})

	if (!rates || rates.length === 0) {
		throw new NotFoundError('NO_RATES_FOUND')
	}

	// Get context for first rate
	const firstRate = rates[0]
	const [roomType, mealPlan, market, hotel] = await Promise.all([
		RoomType.findById(roomTypeId).lean(),
		MealPlan.findById(mealPlanId).lean(),
		Market.findById(marketId).lean(),
		Hotel.findById(hotelId).lean()
	])

	if (!roomType) throw new NotFoundError('ROOM_TYPE_NOT_FOUND')
	if (!mealPlan) throw new NotFoundError('MEAL_PLAN_NOT_FOUND')
	if (!market) throw new NotFoundError('MARKET_NOT_FOUND')

	// Get season for minAdults calculation
	const season = await Season.findByDate(hotelId, marketId, checkInDate)

	// Get effective minAdults considering override hierarchy
	const effectiveMinAdults = getEffectiveMinAdults(roomType, market, season)

	// Check minAdults restriction upfront
	if (adults < effectiveMinAdults) {
		return {
			success: false,
			error: 'BELOW_MIN_ADULTS',
			message: `Minimum ${effectiveMinAdults} adult(s) required for this room type`,
			minAdults: effectiveMinAdults,
			requestedAdults: adults
		}
	}

	// Build daily breakdown
	const dailyBreakdown = []
	let totalBasePrice = 0
	let hasIssues = false
	const issues = []

	// Generate dates array
	const dates = []
	const currentDate = new Date(checkInDate)
	while (currentDate < checkOut) {
		dates.push(currentDate.toISOString().split('T')[0])
		currentDate.setDate(currentDate.getDate() + 1)
	}

	for (let i = 0; i < dates.length; i++) {
		const dateStr = dates[i]
		const rate = rates.find(r => {
			const rateDateStr = r.date?.toISOString?.()?.split('T')[0] || r.date?.substring?.(0, 10)
			return rateDateStr === dateStr
		})

		const isCheckIn = i === 0
		const isCheckOut = i === dates.length - 1

		if (!rate) {
			dailyBreakdown.push({
				date: dateStr,
				price: 0,
				hasRate: false,
				hasIssue: true,
				issue: 'NO_RATE'
			})
			hasIssues = true
			issues.push({ date: dateStr, type: 'no_rate', message: 'No rate defined' })
			continue
		}

		// Check restrictions (including minAdults)
		const restrictionCheck = checkRestrictions(rate, {
			checkInDate,
			checkOutDate,
			adults,
			bookingDate: new Date(),
			isCheckIn,
			isCheckOut,
			minAdults: effectiveMinAdults
		})

		// Calculate daily price
		const priceResult = calculateOccupancyPrice(rate, { adults, children, nights: 1 }, {
			roomType,
			market,
			hotel
		})

		const dayData = {
			date: dateStr,
			price: priceResult.totalPrice,
			basePrice: priceResult.basePrice,
			adultPrice: priceResult.adultPrice,
			childPrice: priceResult.childPrice,
			hasRate: true,
			hasIssue: !restrictionCheck.isBookable,
			restrictions: restrictionCheck.restrictions,
			pricingType: priceResult.pricingType
		}

		if (!restrictionCheck.isBookable) {
			hasIssues = true
			restrictionCheck.messages.forEach(msg => {
				issues.push({ date: dateStr, type: 'restriction', message: msg })
			})
		}

		dailyBreakdown.push(dayData)
		totalBasePrice += priceResult.totalPrice
	}

	// Apply campaigns if requested
	let campaignResult = {
		dailyBreakdown,
		appliedCampaigns: [],
		totalDiscount: 0,
		originalTotal: totalBasePrice,
		finalTotal: totalBasePrice
	}

	if (includeCampaigns) {
		// Get applicable campaigns
		const campaigns = await getApplicableCampaigns(hotelId, {
			checkInDate,
			checkOutDate,
			roomTypeId,
			marketId,
			mealPlanId,
			nights
		})

		if (campaigns.length > 0) {
			campaignResult = applyCampaigns(campaigns, dailyBreakdown, { checkInDate })
		}
	}

	const result = {
		success: true,
		hotelId,
		roomType: { _id: roomType._id, code: roomType.code, name: roomType.name },
		mealPlan: { _id: mealPlan._id, code: mealPlan.code, name: mealPlan.name },
		market: { _id: market._id, code: market.code, currency: market.currency },
		checkInDate,
		checkOutDate,
		nights,
		adults,
		children,
		currency: market.currency,
		dailyBreakdown: campaignResult.dailyBreakdown,
		pricing: {
			originalTotal: campaignResult.originalTotal,
			totalDiscount: campaignResult.totalDiscount,
			finalTotal: campaignResult.finalTotal,
			avgPerNight: campaignResult.finalTotal / nights
		},
		campaigns: {
			applied: campaignResult.appliedCampaigns,
			totalDiscount: campaignResult.totalDiscount
		},
		availability: {
			isAvailable: !hasIssues,
			issues
		}
	}

	// Cache the result
	if (useCache) {
		const cacheKey = generateCacheKey(CACHE_PREFIXES.PRICE_CALCULATION, {
			type: 'withCampaigns',
			hotelId,
			roomTypeId,
			mealPlanId,
			marketId,
			checkInDate,
			checkOutDate,
			adults,
			children: JSON.stringify(children),
			includeCampaigns
		})
		cache.set(cacheKey, result, CACHE_TTL.PRICE_CALCULATION)
	}

	return result
}

// ==================== ALLOTMENT MANAGEMENT ====================

/**
 * Reserve allotment for a booking (decrease available rooms)
 * Should be called when a booking is confirmed
 * @param {Object} params - { hotelId, roomTypeId, mealPlanId, marketId, dates: [date1, date2, ...], rooms = 1 }
 * @returns {Object} { success, updatedRates }
 */
export async function reserveAllotment(params) {
	const { hotelId, roomTypeId, mealPlanId, marketId, dates, rooms = 1 } = params

	if (!dates || dates.length === 0) {
		throw new BadRequestError('DATES_REQUIRED')
	}

	const updatedRates = []
	const errors = []

	for (const date of dates) {
		try {
			const rate = await Rate.findOne({
				hotel: hotelId,
				roomType: roomTypeId,
				mealPlan: mealPlanId,
				market: marketId,
				date: new Date(date)
			})

			if (!rate) {
				errors.push({ date, error: 'RATE_NOT_FOUND' })
				continue
			}

			// Check if enough allotment is available
			const available = (rate.allotment ?? 0) - (rate.sold ?? 0)
			if (available < rooms) {
				errors.push({ date, error: 'INSUFFICIENT_ALLOTMENT', available, required: rooms })
				continue
			}

			// Increment sold count
			rate.sold = (rate.sold ?? 0) + rooms
			await rate.save()

			updatedRates.push({
				date: rate.date,
				allotment: rate.allotment,
				sold: rate.sold,
				available: rate.allotment - rate.sold
			})
		} catch (error) {
			errors.push({ date, error: error.message })
		}
	}

	return {
		success: errors.length === 0,
		updatedRates,
		errors: errors.length > 0 ? errors : undefined
	}
}

/**
 * Release allotment for a cancelled booking (increase available rooms)
 * Should be called when a booking is cancelled
 * @param {Object} params - { hotelId, roomTypeId, mealPlanId, marketId, dates: [date1, date2, ...], rooms = 1 }
 * @returns {Object} { success, updatedRates }
 */
export async function releaseAllotment(params) {
	const { hotelId, roomTypeId, mealPlanId, marketId, dates, rooms = 1 } = params

	if (!dates || dates.length === 0) {
		throw new BadRequestError('DATES_REQUIRED')
	}

	const updatedRates = []
	const errors = []

	for (const date of dates) {
		try {
			const rate = await Rate.findOne({
				hotel: hotelId,
				roomType: roomTypeId,
				mealPlan: mealPlanId,
				market: marketId,
				date: new Date(date)
			})

			if (!rate) {
				errors.push({ date, error: 'RATE_NOT_FOUND' })
				continue
			}

			// Decrease sold count (minimum 0)
			rate.sold = Math.max(0, (rate.sold ?? 0) - rooms)
			await rate.save()

			updatedRates.push({
				date: rate.date,
				allotment: rate.allotment,
				sold: rate.sold,
				available: (rate.allotment ?? 0) - rate.sold
			})
		} catch (error) {
			errors.push({ date, error: error.message })
		}
	}

	return {
		success: errors.length === 0,
		updatedRates,
		errors: errors.length > 0 ? errors : undefined
	}
}

/**
 * Get allotment status for a date range
 * @param {Object} params - { hotelId, roomTypeId, mealPlanId, marketId, startDate, endDate }
 * @returns {Array} Allotment status per day
 */
export async function getAllotmentStatus(params) {
	const { hotelId, roomTypeId, mealPlanId, marketId, startDate, endDate } = params

	const rates = await Rate.findInRange(hotelId, startDate, endDate, {
		roomType: roomTypeId,
		mealPlan: mealPlanId,
		market: marketId
	})

	return rates.map(rate => ({
		date: rate.date,
		allotment: rate.allotment ?? null,
		sold: rate.sold ?? 0,
		available: rate.allotment !== null ? (rate.allotment - (rate.sold ?? 0)) : null,
		stopSale: rate.stopSale || false
	}))
}

export default {
	getEffectiveMinAdults,
	getEffectivePricingType,
	getEffectiveMultiplierTemplate,
	getEffectiveChildAgeGroups,
	getEffectiveRoundingRule,
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
	// Allotment functions
	reserveAllotment,
	releaseAllotment,
	getAllotmentStatus
}
