/**
 * Multi-Room Module
 * Multi-room booking calculations
 */

import Market from '../../modules/planning/market.model.js'
import { NotFoundError } from '../../core/errors.js'
import { PricingError } from './validation.js'
import { calculatePriceWithCampaigns } from './campaigns.js'
import { validatePricingResult } from './validation.js'

/**
 * Calculate pricing for multiple rooms in a single booking
 * This is the SINGLE SOURCE OF TRUTH for booking total calculations
 *
 * @param {Object} params
 * @param {string} params.hotelId - Hotel ID
 * @param {Array} params.rooms - Array of room configurations
 * @param {string} params.rooms[].roomTypeId - Room type ID
 * @param {string} params.rooms[].mealPlanId - Meal plan ID
 * @param {number} params.rooms[].adults - Number of adults
 * @param {Array} params.rooms[].children - Array of child ages [{age: 5}, {age: 10}] or [5, 10]
 * @param {string} params.rooms[].rateType - 'refundable' or 'non_refundable'
 * @param {Object} params.rooms[].guests - Guest information (optional)
 * @param {string} params.marketId - Market ID
 * @param {string|Date} params.checkInDate - Check-in date
 * @param {string|Date} params.checkOutDate - Check-out date
 * @param {boolean} params.includeCampaigns - Include campaigns (default: true)
 * @param {boolean} params.throwOnError - Throw error on pricing failure (default: false)
 * @param {string} params.salesChannel - 'b2c' or 'b2b' (default: 'b2c')
 *
 * @returns {Object} {
 *   success: boolean,
 *   rooms: Array<RoomPricingResult>,
 *   totals: { subtotal, totalDiscount, grandTotal, currency },
 *   nights: number,
 *   errors: Array<Error> (if any room failed)
 * }
 */
export async function calculateMultiRoomBookingPrice(params) {
  const {
    hotelId,
    rooms,
    marketId,
    checkInDate,
    checkOutDate,
    includeCampaigns = true,
    throwOnError = false,
    salesChannel = 'b2c' // 'b2c' or 'b2b'
  } = params

  if (!rooms || rooms.length === 0) {
    throw new PricingError('NO_ROOMS_PROVIDED', { params })
  }

  // Calculate nights
  const checkIn = new Date(checkInDate)
  const checkOut = new Date(checkOutDate)
  const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24))

  if (nights <= 0) {
    throw new PricingError('INVALID_DATE_RANGE', { checkInDate, checkOutDate, nights })
  }

  // Get market for currency
  const market = await Market.findById(marketId).lean()
  if (!market) {
    throw new NotFoundError('MARKET_NOT_FOUND')
  }

  const currency = market.currency || 'TRY'
  const roomResults = []
  const errors = []

  // Process each room in PARALLEL for maximum performance
  const roomPromises = rooms.map(async (room, i) => {
    // Normalize children format
    const normalizedChildren = (room.children || []).map(child => {
      if (typeof child === 'object' && child !== null) {
        return { age: child.age }
      }
      return { age: child }
    })

    try {
      // Calculate price for this room
      const priceResult = await calculatePriceWithCampaigns({
        hotelId,
        roomTypeId: room.roomTypeId,
        mealPlanId: room.mealPlanId,
        marketId,
        checkInDate,
        checkOutDate,
        adults: room.adults || 2,
        children: normalizedChildren,
        includeCampaigns
      })

      // Validate the result
      try {
        validatePricingResult(priceResult, { roomIndex: i, room })
      } catch (validationError) {
        if (throwOnError) throw validationError
        return {
          success: false,
          roomIndex: i,
          error: {
            roomIndex: i,
            error: validationError.code,
            message: validationError.message,
            details: validationError.details
          }
        }
      }

      // Check availability
      let availabilityError = null
      if (!priceResult.availability?.isAvailable) {
        availabilityError = {
          roomIndex: i,
          error: 'ROOM_NOT_AVAILABLE',
          issues: priceResult.availability?.issues || []
        }
        if (throwOnError) {
          throw new PricingError('ROOM_NOT_AVAILABLE', {
            roomIndex: i,
            issues: priceResult.availability?.issues
          })
        }
      }

      // Determine final price based on sales channel
      // B2C: Use b2cPrice (with B2C markup)
      // B2B: Use b2bPrice (with agency commission)
      // hotelCost is NEVER shown to customers - it's internal cost only
      let finalPrice = salesChannel === 'b2b'
        ? priceResult.pricing.b2bPrice
        : priceResult.pricing.b2cPrice
      let appliedNonRefundable = false
      let nonRefundableDiscount = 0

      if (room.rateType === 'non_refundable' && priceResult.nonRefundable?.enabled) {
        finalPrice = salesChannel === 'b2b'
          ? priceResult.nonRefundable.pricing.b2bPrice
          : priceResult.nonRefundable.pricing.b2cPrice
        appliedNonRefundable = true
        nonRefundableDiscount = priceResult.nonRefundable.discountPercent
      }

      // Build room result
      return {
        success: true,
        roomIndex: i,
        availabilityError,
        result: {
          roomIndex: i,
          roomTypeId: room.roomTypeId,
          roomTypeName: priceResult.roomType?.name,
          roomTypeCode: priceResult.roomType?.code,
          mealPlanId: room.mealPlanId,
          mealPlanName: priceResult.mealPlan?.name,
          mealPlanCode: priceResult.mealPlan?.code,
          guests: room.guests,
          rateType: room.rateType || 'refundable',
          occupancy: priceResult.occupancy,
          pricing: {
            currency,
            originalTotal: priceResult.pricing.originalTotal,
            campaignDiscount: priceResult.pricing.totalDiscount,
            finalTotal: finalPrice,
            avgPerNight: finalPrice / nights,
            // 3-tier pricing
            hotelCost: appliedNonRefundable
              ? priceResult.nonRefundable.pricing.hotelCost
              : priceResult.pricing.hotelCost,
            b2cPrice: appliedNonRefundable
              ? priceResult.nonRefundable.pricing.b2cPrice
              : priceResult.pricing.b2cPrice,
            b2bPrice: appliedNonRefundable
              ? priceResult.nonRefundable.pricing.b2bPrice
              : priceResult.pricing.b2bPrice
          },
          dailyBreakdown: priceResult.dailyBreakdown,
          campaigns: priceResult.campaigns?.applied || [],
          nonRefundable: appliedNonRefundable
            ? {
                applied: true,
                discountPercent: nonRefundableDiscount,
                savings: priceResult.pricing.finalTotal - finalPrice
              }
            : { applied: false },
          available: priceResult.availability?.isAvailable ?? true
        },
        originalTotal: priceResult.pricing.originalTotal,
        finalPrice
      }
    } catch (error) {
      if (throwOnError) throw error
      return {
        success: false,
        roomIndex: i,
        error: {
          roomIndex: i,
          error: error.code || error.message,
          message: error.message
        }
      }
    }
  })

  // Wait for all room calculations to complete in parallel
  const roomCalculations = await Promise.all(roomPromises)

  // Aggregate results
  let subtotal = 0
  let grandTotal = 0

  for (const calc of roomCalculations) {
    if (calc.success) {
      roomResults.push(calc.result)
      subtotal += calc.originalTotal
      grandTotal += calc.finalPrice
      if (calc.availabilityError) {
        errors.push(calc.availabilityError)
      }
    } else {
      errors.push(calc.error)
    }
  }

  // Sort results by roomIndex to maintain order
  roomResults.sort((a, b) => a.roomIndex - b.roomIndex)

  // Calculate total discount
  const totalDiscount = subtotal - grandTotal

  return {
    success: errors.length === 0,
    hotelId,
    marketId,
    checkInDate,
    checkOutDate,
    nights,
    rooms: roomResults,
    totals: {
      currency,
      subtotal,           // Original total (before campaigns/discounts)
      totalDiscount,      // Total discount amount
      grandTotal          // Final total (after all discounts)
    },
    errors: errors.length > 0 ? errors : undefined
  }
}
