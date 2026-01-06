/**
 * Planning Calculation Service
 * Pricing calculation endpoints for rate queries
 */

import RoomType from './roomType.model.js'
import MealPlan from './mealPlan.model.js'
import Market from './market.model.js'
import Season from './season.model.js'
import Rate from './rate.model.js'
import Hotel from '../hotel/hotel.model.js'
import { NotFoundError, BadRequestError, ForbiddenError } from '#core/errors.js'
import { asyncHandler } from '#helpers'
import { getPartnerId, verifyHotelOwnership } from '#services/helpers.js'
import pricingService from '#services/pricingService.js'

/**
 * Calculate price for a specific rate
 */
export const calculateRatePrice = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { hotelId, rateId } = req.params
  const { adults = 2, children = [], nights = 1 } = req.body

  if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
  await verifyHotelOwnership(hotelId, partnerId)

  const rate = await Rate.findById(rateId)
    .populate('roomType')
    .populate('mealPlan')
    .populate('market')

  if (!rate) throw new NotFoundError('RATE_NOT_FOUND')
  if (rate.hotel.toString() !== hotelId) throw new ForbiddenError('FORBIDDEN')

  const hotel = await Hotel.findById(hotelId).select('childAgeGroups').lean()
  const season = await Season.findByDate(hotelId, rate.market._id, rate.date)

  const restrictionCheck = pricingService.checkRestrictions(rate, {
    adults,
    bookingDate: new Date()
  })

  const priceResult = pricingService.calculateOccupancyPrice(
    rate,
    { adults, children, nights },
    {
      roomType: rate.roomType,
      market: rate.market,
      season,
      hotel
    }
  )

  res.json({
    success: true,
    data: {
      ...priceResult,
      restrictions: restrictionCheck,
      rate: {
        _id: rate._id,
        date: rate.date,
        roomType: rate.roomType?.code,
        mealPlan: rate.mealPlan?.code,
        market: rate.market?.code
      }
    }
  })
})

/**
 * Calculate price by query parameters
 */
export const calculatePriceByQuery = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { hotelId } = req.params
  const { roomTypeId, mealPlanId, marketId, date, adults = 2, children = [], nights = 1 } = req.body

  if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
  if (!roomTypeId || !mealPlanId || !marketId || !date) {
    throw new BadRequestError('MISSING_REQUIRED_FIELDS')
  }

  await verifyHotelOwnership(hotelId, partnerId)

  const result = await pricingService.calculateBookingPrice({
    hotelId,
    roomTypeId,
    mealPlanId,
    marketId,
    date,
    adults,
    children,
    nights
  })

  res.json({
    success: result.success,
    data: result
  })
})

/**
 * Bulk calculate prices for multiple queries
 */
export const bulkCalculatePrices = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { hotelId } = req.params
  const { queries } = req.body

  if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
  if (!Array.isArray(queries) || queries.length === 0) {
    throw new BadRequestError('QUERIES_REQUIRED')
  }
  if (queries.length > 100) {
    throw new BadRequestError('MAX_100_QUERIES')
  }

  await verifyHotelOwnership(hotelId, partnerId)

  const queriesWithHotel = queries.map(q => ({ ...q, hotelId }))
  const results = await pricingService.bulkCalculatePrices(queriesWithHotel)

  res.json({
    success: true,
    data: results
  })
})

/**
 * Check pricing availability for a date range
 */
export const checkPricingAvailability = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { hotelId } = req.params
  const { roomTypeId, mealPlanId, marketId, startDate, endDate, adults = 2 } = req.body

  if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
  if (!roomTypeId || !mealPlanId || !marketId || !startDate || !endDate) {
    throw new BadRequestError('MISSING_REQUIRED_FIELDS')
  }

  await verifyHotelOwnership(hotelId, partnerId)

  const result = await pricingService.checkAvailability({
    hotelId,
    roomTypeId,
    mealPlanId,
    marketId,
    startDate,
    endDate,
    adults
  })

  res.json({
    success: true,
    data: result
  })
})

/**
 * Get effective rate for a specific combination
 */
export const getEffectiveRateEndpoint = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { hotelId } = req.params
  const { roomTypeId, mealPlanId, marketId, date } = req.query

  if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
  if (!roomTypeId || !mealPlanId || !marketId || !date) {
    throw new BadRequestError('MISSING_REQUIRED_FIELDS')
  }

  await verifyHotelOwnership(hotelId, partnerId)

  const result = await pricingService.getEffectiveRate(
    hotelId,
    roomTypeId,
    mealPlanId,
    marketId,
    date
  )

  res.json({
    success: true,
    data: result
  })
})

/**
 * Get effective multipliers for a room type
 */
export const getEffectiveMultipliers = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { hotelId } = req.params
  const { roomTypeId, marketId, date } = req.query

  if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
  if (!roomTypeId) {
    throw new BadRequestError('ROOM_TYPE_REQUIRED')
  }

  await verifyHotelOwnership(hotelId, partnerId)

  const roomType = await RoomType.findById(roomTypeId).lean()
  if (!roomType) throw new NotFoundError('ROOM_TYPE_NOT_FOUND')

  let market = null
  if (marketId) {
    market = await Market.findById(marketId).lean()
  }

  let season = null
  if (date && marketId) {
    season = await Season.findByDate(hotelId, marketId, date)
    if (season) season = season.toObject()
  }

  const effectiveMultipliers = pricingService.getEffectiveMultiplierTemplate(
    roomType,
    market,
    season
  )
  const effectivePricingType = pricingService.getEffectivePricingType(roomType, market, season)

  const hotel = await Hotel.findById(hotelId).select('childAgeGroups').lean()
  const effectiveChildAgeGroups = pricingService.getEffectiveChildAgeGroups(hotel, market, season)

  res.json({
    success: true,
    data: {
      roomType: {
        _id: roomType._id,
        code: roomType.code,
        pricingType: roomType.pricingType,
        useMultipliers: roomType.useMultipliers
      },
      market: market
        ? {
            _id: market._id,
            code: market.code
          }
        : null,
      season: season
        ? {
            _id: season._id,
            code: season.code,
            name: season.name
          }
        : null,
      effectivePricingType,
      effectiveMultipliers,
      effectiveChildAgeGroups
    }
  })
})

/**
 * Get combination table for a room type
 */
export const getCombinationTable = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { hotelId } = req.params
  const { roomTypeId, marketId, date } = req.query

  if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
  if (!roomTypeId) {
    throw new BadRequestError('ROOM_TYPE_REQUIRED')
  }

  await verifyHotelOwnership(hotelId, partnerId)

  const roomType = await RoomType.findById(roomTypeId).lean()
  if (!roomType) throw new NotFoundError('ROOM_TYPE_NOT_FOUND')

  let market = null
  if (marketId) {
    market = await Market.findById(marketId).lean()
  }

  let season = null
  if (date && marketId) {
    season = await Season.findByDate(hotelId, marketId, date)
    if (season) season = season.toObject()
  }

  const effectiveMultipliers = pricingService.getEffectiveMultiplierTemplate(
    roomType,
    market,
    season
  )

  res.json({
    success: true,
    data: {
      roomType: {
        _id: roomType._id,
        code: roomType.code,
        occupancy: roomType.occupancy
      },
      effectivePricingType: pricingService.getEffectivePricingType(roomType, market, season),
      useMultipliers: effectiveMultipliers.useMultipliers,
      combinationTable: effectiveMultipliers.combinationTable,
      adultMultipliers: effectiveMultipliers.adultMultipliers,
      childMultipliers: effectiveMultipliers.childMultipliers,
      roundingRule: effectiveMultipliers.roundingRule
    }
  })
})

/**
 * Get effective child age groups
 */
export const getEffectiveChildAgeGroups = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { hotelId } = req.params
  const { marketId, date } = req.query

  if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')

  await verifyHotelOwnership(hotelId, partnerId)

  const hotel = await Hotel.findById(hotelId).select('childAgeGroups').lean()

  let market = null
  if (marketId) {
    market = await Market.findById(marketId).lean()
  }

  let season = null
  if (date && marketId) {
    season = await Season.findByDate(hotelId, marketId, date)
    if (season) season = season.toObject()
  }

  const effectiveChildAgeGroups = pricingService.getEffectiveChildAgeGroups(hotel, market, season)

  let source = 'hotel'
  if (season && !season.childAgeSettings?.inheritFromMarket) {
    source = 'season'
  } else if (market && !market.childAgeSettings?.inheritFromHotel) {
    source = 'market'
  }

  res.json({
    success: true,
    data: {
      childAgeGroups: effectiveChildAgeGroups,
      source,
      hotel: {
        childAgeGroups: hotel?.childAgeGroups || []
      },
      market: market
        ? {
            _id: market._id,
            code: market.code,
            inheritFromHotel: market.childAgeSettings?.inheritFromHotel !== false,
            childAgeGroups: market.childAgeSettings?.childAgeGroups || []
          }
        : null,
      season: season
        ? {
            _id: season._id,
            code: season.code,
            inheritFromMarket: season.childAgeSettings?.inheritFromMarket !== false,
            childAgeGroups: season.childAgeSettings?.childAgeGroups || []
          }
        : null
    }
  })
})

/**
 * Calculate price with campaign discounts
 */
export const calculatePriceWithCampaigns = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { hotelId } = req.params
  const {
    roomTypeId,
    mealPlanId,
    marketId,
    checkInDate,
    checkOutDate,
    adults = 2,
    children = [],
    includeCampaigns = true
  } = req.body

  if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
  if (!roomTypeId || !mealPlanId || !marketId || !checkInDate || !checkOutDate) {
    throw new BadRequestError('MISSING_REQUIRED_FIELDS')
  }

  await verifyHotelOwnership(hotelId, partnerId)

  const result = await pricingService.calculatePriceWithCampaigns({
    hotelId,
    roomTypeId,
    mealPlanId,
    marketId,
    checkInDate,
    checkOutDate,
    adults,
    children,
    includeCampaigns
  })

  res.json({
    success: true,
    data: result
  })
})

/**
 * Get applicable campaigns for a booking query
 */
export const getApplicableCampaigns = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { hotelId } = req.params
  const { roomTypeId, marketId, mealPlanId, checkInDate, checkOutDate } = req.query

  if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
  if (!checkInDate || !checkOutDate) {
    throw new BadRequestError('DATES_REQUIRED')
  }

  await verifyHotelOwnership(hotelId, partnerId)

  const checkIn = new Date(checkInDate)
  const checkOut = new Date(checkOutDate)
  const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24))

  const campaigns = await pricingService.getApplicableCampaigns(hotelId, {
    checkInDate,
    checkOutDate,
    roomTypeId,
    marketId,
    mealPlanId,
    nights
  })

  res.json({
    success: true,
    data: {
      campaigns: campaigns.map(c => ({
        _id: c._id,
        code: c.code,
        name: c.name,
        type: c.type,
        discount: c.discount,
        conditions: c.conditions,
        combinable: c.combinable,
        priority: c.priority,
        applicationType: c.applicationType,
        calculationType: c.calculationType,
        stayWindow: c.stayWindow,
        bookingWindow: c.bookingWindow
      })),
      count: campaigns.length,
      query: {
        checkInDate,
        checkOutDate,
        nights,
        roomTypeId: roomTypeId || 'all',
        marketId: marketId || 'all',
        mealPlanId: mealPlanId || 'all'
      }
    }
  })
})
