/**
 * Public API Service
 * B2C/Public facing endpoints for hotel search, availability, and pricing
 * No authentication required, but rate limiting recommended
 */

import { asyncHandler } from '../../helpers/asyncHandler.js'
import Hotel from '../hotel/hotel.model.js'
import Partner from '../partner/partner.model.js'
import RoomType from '../planning/roomType.model.js'
import MealPlan from '../planning/mealPlan.model.js'
import Market from '../planning/market.model.js'
import Rate from '../planning/rate.model.js'
import Campaign from '../planning/campaign.model.js'
import Booking from '../booking/booking.model.js'
import pricingService from '../../services/pricingService.js'
import { BadRequestError, NotFoundError } from '../../core/errors.js'
import logger from '../../core/logger.js'

// ==================== DOMAIN RESOLUTION ====================

/**
 * Resolve PMS domain to hotel or partner
 * GET /public/resolve-domain?domain=pms.susesi.com
 * Returns hotel or partner info based on domain match
 */
export const resolveDomain = asyncHandler(async (req, res) => {
  const { domain } = req.query

  if (!domain) {
    throw new BadRequestError('Domain parameter is required')
  }

  const normalizedDomain = domain.toLowerCase().trim()

  // Find partner by pmsDomain
  const partner = await Partner.findByPmsDomain(normalizedDomain)

  if (partner && partner.status === 'active') {
    // Get all active hotels for this partner
    const hotels = await Hotel.find({
      partner: partner._id,
      status: 'active'
    })
      .select('_id name slug logo stars')
      .limit(50)

    return res.json({
      success: true,
      data: {
        partnerId: partner._id,
        partnerName: partner.companyName,
        code: partner.code,
        logo: partner.branding?.logo,
        hotels: hotels.map(h => ({
          id: h._id,
          name: h.name,
          slug: h.slug,
          logo: h.logo,
          stars: h.stars
        }))
      }
    })
  }

  // No match found
  throw new NotFoundError('No partner found for this domain')
})

// ==================== HOTEL LISTING ====================

/**
 * List hotels with filters
 * GET /public/hotels
 * Query: { city, country, stars, type, amenities, page, limit, sort }
 */
export const listHotels = asyncHandler(async (req, res) => {
  const {
    city,
    country,
    stars,
    type,
    amenities,
    featured,
    page = 1,
    limit = 20,
    sort = 'displayOrder'
  } = req.query

  // Build query
  const query = {
    status: 'active',
    'visibility.b2c': true
  }

  // Filters
  if (city) {
    query['address.city'] = { $regex: city, $options: 'i' }
  }
  if (country) {
    query['location.countryCode'] = country.toUpperCase()
  }
  if (stars) {
    query.stars = parseInt(stars)
  }
  if (type) {
    query.type = type
  }
  if (amenities) {
    const amenityList = amenities.split(',').map(a => a.trim())
    query.amenities = { $all: amenityList }
  }
  if (featured === 'true') {
    query.featured = true
  }

  // Build sort
  let sortOption = { displayOrder: 1, name: 1 }
  if (sort === 'name') sortOption = { name: 1 }
  if (sort === '-name') sortOption = { name: -1 }
  if (sort === 'stars') sortOption = { stars: -1, name: 1 }
  if (sort === 'rating') sortOption = { 'stats.averageRating': -1, name: 1 }

  // Pagination
  const pageNum = Math.max(1, parseInt(page))
  const limitNum = Math.min(50, Math.max(1, parseInt(limit)))
  const skip = (pageNum - 1) * limitNum

  // Execute query
  const [hotels, total] = await Promise.all([
    Hotel.find(query)
      .select(
        'name slug stars type category address.city address.country location.countryCode images amenities featured stats'
      )
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Hotel.countDocuments(query)
  ])

  res.json({
    success: true,
    data: {
      hotels: hotels.map(h => ({
        name: h.name,
        slug: h.slug,
        stars: h.stars,
        type: h.type,
        category: h.category,
        city: h.address?.city,
        country: h.address?.country,
        countryCode: h.location?.countryCode,
        image: h.images?.find(img => img.isMain)?.url || h.images?.[0]?.url,
        amenities: h.amenities?.slice(0, 10),
        featured: h.featured,
        rating: h.stats?.averageRating || 0,
        reviewCount: h.stats?.reviewCount || 0
      })),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    }
  })
})

/**
 * Get hotel info for public display
 * GET /public/hotels/:hotelCode
 */
export const getHotelInfo = asyncHandler(async (req, res) => {
  const { hotelCode } = req.params

  const hotel = await Hotel.findOne({ code: hotelCode.toUpperCase(), status: 'active' })
    .select('code name description starRating amenities images location contact childAgeGroups')
    .lean()

  if (!hotel) {
    throw new NotFoundError('HOTEL_NOT_FOUND')
  }

  res.json({
    success: true,
    data: {
      code: hotel.code,
      name: hotel.name,
      description: hotel.description,
      starRating: hotel.starRating,
      amenities: hotel.amenities,
      images: hotel.images,
      location: hotel.location,
      contact: {
        phone: hotel.contact?.phone,
        email: hotel.contact?.email
      },
      childAgeGroups: hotel.childAgeGroups
    }
  })
})

/**
 * Get available room types for a hotel
 * GET /public/hotels/:hotelCode/room-types
 */
export const getRoomTypes = asyncHandler(async (req, res) => {
  const { hotelCode } = req.params

  const hotel = await Hotel.findOne({ code: hotelCode.toUpperCase(), status: 'active' }).select(
    '_id'
  )
  if (!hotel) {
    throw new NotFoundError('HOTEL_NOT_FOUND')
  }

  const roomTypes = await RoomType.find({
    hotel: hotel._id,
    status: 'active'
  })
    .select('code name description images amenities occupancy')
    .sort('displayOrder')
    .lean()

  res.json({
    success: true,
    data: roomTypes.map(rt => ({
      code: rt.code,
      name: rt.name,
      description: rt.description,
      images: rt.images,
      amenities: rt.amenities,
      occupancy: {
        baseOccupancy: rt.occupancy?.baseOccupancy || 2,
        maxAdults: rt.occupancy?.maxAdults || 2,
        maxChildren: rt.occupancy?.maxChildren || 2,
        totalMaxGuests: rt.occupancy?.totalMaxGuests || 4
      }
    }))
  })
})

/**
 * Get meal plans for a hotel
 * GET /public/hotels/:hotelCode/meal-plans
 */
export const getMealPlans = asyncHandler(async (req, res) => {
  const { hotelCode } = req.params

  const hotel = await Hotel.findOne({ code: hotelCode.toUpperCase(), status: 'active' }).select(
    '_id'
  )
  if (!hotel) {
    throw new NotFoundError('HOTEL_NOT_FOUND')
  }

  const mealPlans = await MealPlan.find({
    hotel: hotel._id,
    status: 'active'
  })
    .select('code name description')
    .sort('displayOrder')
    .lean()

  res.json({
    success: true,
    data: mealPlans
  })
})

/**
 * Search availability and prices
 * POST /public/hotels/:hotelCode/search
 * Body: { checkIn, checkOut, adults, children: [age1, age2], countryCode, currency }
 */
export const searchAvailability = asyncHandler(async (req, res) => {
  const { hotelCode } = req.params
  const { checkIn, checkOut, adults = 2, children = [], countryCode, currency } = req.body

  // Validate required fields
  if (!checkIn || !checkOut) {
    throw new BadRequestError('CHECK_IN_OUT_REQUIRED')
  }

  const checkInDate = new Date(checkIn)
  const checkOutDate = new Date(checkOut)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (checkInDate < today) {
    throw new BadRequestError('CHECK_IN_MUST_BE_FUTURE')
  }

  if (checkOutDate <= checkInDate) {
    throw new BadRequestError('INVALID_DATE_RANGE')
  }

  const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24))
  if (nights > 30) {
    throw new BadRequestError('MAX_30_NIGHTS')
  }

  // Get hotel
  const hotel = await Hotel.findOne({ code: hotelCode.toUpperCase(), status: 'active' })
    .select('_id code name childAgeGroups')
    .lean()

  if (!hotel) {
    throw new NotFoundError('HOTEL_NOT_FOUND')
  }

  // Find appropriate market by country or currency
  let market = null
  if (countryCode) {
    market = await Market.findOne({
      hotel: hotel._id,
      countries: countryCode.toUpperCase(),
      status: 'active'
    }).lean()
  }

  // Fallback to default market
  if (!market) {
    market = await Market.findOne({
      hotel: hotel._id,
      isDefault: true,
      status: 'active'
    }).lean()
  }

  // Fallback to any active market with matching currency
  if (!market && currency) {
    market = await Market.findOne({
      hotel: hotel._id,
      currency: currency.toUpperCase(),
      status: 'active'
    }).lean()
  }

  // Final fallback - any active market
  if (!market) {
    market = await Market.findOne({
      hotel: hotel._id,
      status: 'active'
    }).lean()
  }

  if (!market) {
    throw new NotFoundError('NO_MARKET_AVAILABLE')
  }

  // Get active room types and meal plans
  const [roomTypes, mealPlans] = await Promise.all([
    RoomType.find({ hotel: hotel._id, status: 'active' }).sort('displayOrder').lean(),
    MealPlan.find({ hotel: hotel._id, status: 'active' }).sort('displayOrder').lean()
  ])

  const results = []

  // Process each room type
  for (const roomType of roomTypes) {
    const roomResult = {
      roomType: {
        code: roomType.code,
        name: roomType.name,
        description: roomType.description,
        images: roomType.images?.slice(0, 3), // Limit images for performance
        occupancy: roomType.occupancy
      },
      options: []
    }

    // Check capacity
    const maxAdults = roomType.occupancy?.maxAdults || 2
    const maxChildren = roomType.occupancy?.maxChildren || 2
    const maxTotal = roomType.occupancy?.totalMaxGuests || 4
    const totalPax = adults + children.length

    if (adults > maxAdults || totalPax > maxTotal) {
      roomResult.capacityExceeded = true
      roomResult.capacityMessage = `Max ${maxAdults} adults, ${maxTotal} total guests`
      results.push(roomResult)
      continue
    }

    // Process each meal plan
    for (const mealPlan of mealPlans) {
      try {
        // Use the server-side pricing service
        const priceResult = await pricingService.calculatePriceWithCampaigns({
          hotelId: hotel._id.toString(),
          roomTypeId: roomType._id.toString(),
          mealPlanId: mealPlan._id.toString(),
          marketId: market._id.toString(),
          checkInDate: checkIn,
          checkOutDate: checkOut,
          adults,
          children: children.map(age => ({ age })),
          includeCampaigns: true
        })

        if (priceResult.availability?.isAvailable) {
          roomResult.options.push({
            mealPlan: {
              code: mealPlan.code,
              name: mealPlan.name
            },
            pricing: {
              currency: market.currency,
              originalTotal: priceResult.pricing.originalTotal,
              totalDiscount: priceResult.pricing.totalDiscount,
              finalTotal: priceResult.pricing.finalTotal,
              avgPerNight: priceResult.pricing.avgPerNight
            },
            campaigns: priceResult.campaigns.applied.map(c => ({
              code: c.code,
              name: c.name,
              discountText: c.discountText
            })),
            nights
          })
        } else {
          // Include unavailable options with reason
          roomResult.options.push({
            mealPlan: {
              code: mealPlan.code,
              name: mealPlan.name
            },
            available: false,
            issues: priceResult.availability?.issues || []
          })
        }
      } catch (error) {
        // Skip this combination if pricing fails
        logger.error(`Pricing error for ${roomType.code}/${mealPlan.code}:`, error.message)
      }
    }

    // Only include room types with at least one option
    if (roomResult.options.length > 0 || roomResult.capacityExceeded) {
      results.push(roomResult)
    }
  }

  res.json({
    success: true,
    data: {
      hotel: {
        code: hotel.code,
        name: hotel.name
      },
      search: {
        checkIn,
        checkOut,
        nights,
        adults,
        children,
        market: market.code,
        currency: market.currency
      },
      results
    }
  })
})

/**
 * Get price quote for a specific combination
 * POST /public/hotels/:hotelCode/price-quote
 * Body: { roomTypeCode, mealPlanCode, checkIn, checkOut, adults, children: [age1, age2], countryCode }
 */
export const getPriceQuote = asyncHandler(async (req, res) => {
  const { hotelCode } = req.params
  const {
    roomTypeCode,
    mealPlanCode,
    checkIn,
    checkOut,
    adults = 2,
    children = [],
    countryCode
  } = req.body

  // Validate
  if (!roomTypeCode || !mealPlanCode || !checkIn || !checkOut) {
    throw new BadRequestError('MISSING_REQUIRED_FIELDS')
  }

  // Get hotel
  const hotel = await Hotel.findOne({ code: hotelCode.toUpperCase(), status: 'active' })
  if (!hotel) {
    throw new NotFoundError('HOTEL_NOT_FOUND')
  }

  // Get room type
  const roomType = await RoomType.findOne({
    hotel: hotel._id,
    code: roomTypeCode.toUpperCase(),
    status: 'active'
  })
  if (!roomType) {
    throw new NotFoundError('ROOM_TYPE_NOT_FOUND')
  }

  // Get meal plan
  const mealPlan = await MealPlan.findOne({
    hotel: hotel._id,
    code: mealPlanCode.toUpperCase(),
    status: 'active'
  })
  if (!mealPlan) {
    throw new NotFoundError('MEAL_PLAN_NOT_FOUND')
  }

  // Find market
  let market = null
  if (countryCode) {
    market = await Market.findOne({
      hotel: hotel._id,
      countries: countryCode.toUpperCase(),
      status: 'active'
    }).lean()
  }
  if (!market) {
    market = await Market.findOne({
      hotel: hotel._id,
      isDefault: true,
      status: 'active'
    }).lean()
  }
  if (!market) {
    throw new NotFoundError('NO_MARKET_AVAILABLE')
  }

  // Calculate price with campaigns
  const priceResult = await pricingService.calculatePriceWithCampaigns({
    hotelId: hotel._id.toString(),
    roomTypeId: roomType._id.toString(),
    mealPlanId: mealPlan._id.toString(),
    marketId: market._id.toString(),
    checkInDate: checkIn,
    checkOutDate: checkOut,
    adults,
    children: children.map(age => ({ age })),
    includeCampaigns: true
  })

  res.json({
    success: true,
    data: {
      hotel: {
        code: hotel.code,
        name: hotel.name
      },
      roomType: {
        code: roomType.code,
        name: roomType.name
      },
      mealPlan: {
        code: mealPlan.code,
        name: mealPlan.name
      },
      market: {
        code: market.code,
        currency: market.currency
      },
      booking: {
        checkIn,
        checkOut,
        nights: priceResult.nights,
        adults,
        children
      },
      pricing: priceResult.pricing,
      dailyBreakdown: priceResult.dailyBreakdown,
      campaigns: priceResult.campaigns,
      availability: priceResult.availability
    }
  })
})

/**
 * Check availability for specific dates
 * GET /public/hotels/:hotelCode/availability
 * Query: { checkIn, checkOut, roomTypeCode, mealPlanCode, countryCode }
 */
export const checkAvailability = asyncHandler(async (req, res) => {
  const { hotelCode } = req.params
  const { checkIn, checkOut, roomTypeCode, mealPlanCode, countryCode } = req.query

  if (!checkIn || !checkOut) {
    throw new BadRequestError('DATES_REQUIRED')
  }

  // Get hotel
  const hotel = await Hotel.findOne({ code: hotelCode.toUpperCase(), status: 'active' })
  if (!hotel) {
    throw new NotFoundError('HOTEL_NOT_FOUND')
  }

  // Build filter
  const filter = { hotel: hotel._id, status: 'active' }

  // Get room types to check
  let roomTypes
  if (roomTypeCode) {
    const roomType = await RoomType.findOne({
      hotel: hotel._id,
      code: roomTypeCode.toUpperCase(),
      status: 'active'
    })
    if (!roomType) throw new NotFoundError('ROOM_TYPE_NOT_FOUND')
    roomTypes = [roomType]
  } else {
    roomTypes = await RoomType.find({ hotel: hotel._id, status: 'active' })
  }

  // Get meal plans
  let mealPlans
  if (mealPlanCode) {
    const mealPlan = await MealPlan.findOne({
      hotel: hotel._id,
      code: mealPlanCode.toUpperCase(),
      status: 'active'
    })
    if (!mealPlan) throw new NotFoundError('MEAL_PLAN_NOT_FOUND')
    mealPlans = [mealPlan]
  } else {
    mealPlans = await MealPlan.find({ hotel: hotel._id, status: 'active' })
  }

  // Find market
  let market = null
  if (countryCode) {
    market = await Market.findOne({
      hotel: hotel._id,
      countries: countryCode.toUpperCase(),
      status: 'active'
    }).lean()
  }
  if (!market) {
    market = await Market.findOne({
      hotel: hotel._id,
      isDefault: true,
      status: 'active'
    }).lean()
  }

  if (!market) {
    throw new NotFoundError('NO_MARKET_AVAILABLE')
  }

  // Check availability for each combination
  const availability = []

  for (const roomType of roomTypes) {
    for (const mealPlan of mealPlans) {
      const result = await pricingService.checkAvailability({
        hotelId: hotel._id.toString(),
        roomTypeId: roomType._id.toString(),
        mealPlanId: mealPlan._id.toString(),
        marketId: market._id.toString(),
        startDate: checkIn,
        endDate: checkOut,
        adults: 2
      })

      availability.push({
        roomType: roomType.code,
        mealPlan: mealPlan.code,
        isAvailable: result.isAvailable,
        unavailableDates: result.unavailableDates,
        totalDaysChecked: result.totalDaysChecked
      })
    }
  }

  res.json({
    success: true,
    data: {
      hotel: hotel.code,
      checkIn,
      checkOut,
      market: market.code,
      availability
    }
  })
})

/**
 * Get active campaigns for a hotel
 * GET /public/hotels/:hotelCode/campaigns
 * Query: { checkIn, checkOut }
 */
export const getActiveCampaigns = asyncHandler(async (req, res) => {
  const { hotelCode } = req.params
  const { checkIn, checkOut } = req.query

  const hotel = await Hotel.findOne({ code: hotelCode.toUpperCase(), status: 'active' })
  if (!hotel) {
    throw new NotFoundError('HOTEL_NOT_FOUND')
  }

  const now = new Date()
  const query = {
    hotel: hotel._id,
    status: 'active',
    'bookingWindow.startDate': { $lte: now },
    'bookingWindow.endDate': { $gte: now }
  }

  // Filter by stay window if dates provided
  if (checkIn && checkOut) {
    query['stayWindow.startDate'] = { $lte: new Date(checkOut) }
    query['stayWindow.endDate'] = { $gte: new Date(checkIn) }
  }

  const campaigns = await Campaign.find(query)
    .select('code name description type discount conditions stayWindow visibility')
    .sort({ priority: -1 })
    .lean()

  // Filter by visibility (B2C only)
  const publicCampaigns = campaigns.filter(c => c.visibility?.b2c !== false)

  res.json({
    success: true,
    data: publicCampaigns.map(c => ({
      code: c.code,
      name: c.name,
      description: c.description,
      type: c.type,
      discount: {
        type: c.discount.type,
        value: c.discount.value,
        freeNights: c.discount.freeNights
      },
      conditions: {
        minNights: c.conditions?.minNights,
        maxNights: c.conditions?.maxNights
      },
      stayWindow: c.stayWindow
    }))
  })
})

// ==================== BOOKING ENDPOINTS ====================

/**
 * Create a new booking
 * POST /public/bookings
 * Body: { hotelCode, checkIn, checkOut, rooms: [{ roomTypeCode, mealPlanCode, adults, children, guests }], contact, billing, specialRequests }
 */
export const createBooking = asyncHandler(async (req, res) => {
  const { hotelCode, checkIn, checkOut, rooms, contact, billing, specialRequests, countryCode } =
    req.body

  // Validate hotel
  const hotel = await Hotel.findOne({ slug: hotelCode.toLowerCase(), status: 'active' })
    .select('_id partner name slug pricingSettings')
    .lean()

  if (!hotel) {
    throw new NotFoundError('HOTEL_NOT_FOUND')
  }

  // Validate dates
  const checkInDate = new Date(checkIn)
  const checkOutDate = new Date(checkOut)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (checkInDate < today) {
    throw new BadRequestError('CHECK_IN_MUST_BE_FUTURE')
  }

  if (checkOutDate <= checkInDate) {
    throw new BadRequestError('INVALID_DATE_RANGE')
  }

  const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24))
  if (nights > 30) {
    throw new BadRequestError('MAX_30_NIGHTS')
  }

  // Validate contact
  if (!contact?.email || !contact?.phone) {
    throw new BadRequestError('CONTACT_INFO_REQUIRED')
  }

  // Find market
  let market = null
  if (countryCode) {
    market = await Market.findOne({
      hotel: hotel._id,
      countries: countryCode.toUpperCase(),
      status: 'active'
    }).lean()
  }
  if (!market) {
    market = await Market.findOne({
      hotel: hotel._id,
      isDefault: true,
      status: 'active'
    }).lean()
  }
  if (!market) {
    throw new NotFoundError('NO_MARKET_AVAILABLE')
  }

  // Process rooms and calculate prices
  const processedRooms = []
  let totalAdults = 0
  let totalChildren = 0
  const totalInfants = 0
  let subtotal = 0
  let totalDiscount = 0

  for (const room of rooms) {
    // Get room type
    const roomType = await RoomType.findOne({
      hotel: hotel._id,
      code: room.roomTypeCode.toUpperCase(),
      status: 'active'
    }).lean()

    if (!roomType) {
      throw new NotFoundError(`ROOM_TYPE_NOT_FOUND: ${room.roomTypeCode}`)
    }

    // Get meal plan
    const mealPlan = await MealPlan.findOne({
      hotel: hotel._id,
      code: room.mealPlanCode.toUpperCase(),
      status: 'active'
    }).lean()

    if (!mealPlan) {
      throw new NotFoundError(`MEAL_PLAN_NOT_FOUND: ${room.mealPlanCode}`)
    }

    const adults = room.adults || 2
    const children = room.children || []

    // Calculate price
    const priceResult = await pricingService.calculatePriceWithCampaigns({
      hotelId: hotel._id.toString(),
      roomTypeId: roomType._id.toString(),
      mealPlanId: mealPlan._id.toString(),
      marketId: market._id.toString(),
      checkInDate: checkIn,
      checkOutDate: checkOut,
      adults,
      children: children.map(age => ({ age })),
      includeCampaigns: true
    })

    if (!priceResult.availability?.isAvailable) {
      throw new BadRequestError(`ROOM_NOT_AVAILABLE: ${room.roomTypeCode}`)
    }

    // Build room booking
    const roomBooking = {
      roomType: roomType._id,
      roomTypeCode: roomType.code,
      roomTypeName: roomType.name,
      mealPlan: mealPlan._id,
      mealPlanCode: mealPlan.code,
      mealPlanName: mealPlan.name,
      guests: room.guests || [],
      pricing: {
        currency: market.currency,
        originalTotal: priceResult.pricing.originalTotal,
        discount: priceResult.pricing.totalDiscount,
        finalTotal: priceResult.pricing.finalTotal,
        avgPerNight: priceResult.pricing.avgPerNight
      },
      dailyBreakdown: priceResult.dailyBreakdown,
      campaigns: priceResult.campaigns.applied,
      specialRequests: room.specialRequests
    }

    processedRooms.push(roomBooking)

    // Update totals
    totalAdults += adults
    totalChildren += children.length
    subtotal += priceResult.pricing.originalTotal
    totalDiscount += priceResult.pricing.totalDiscount
  }

  // Calculate final pricing
  const grandTotal = subtotal - totalDiscount
  const taxRate = hotel.pricingSettings?.taxRate || 0
  const tax = hotel.pricingSettings?.taxIncluded ? 0 : (grandTotal * taxRate) / 100

  // Generate booking number
  const bookingNumber = await Booking.generateBookingNumber(hotel.partner)

  // Create booking
  const booking = new Booking({
    bookingNumber,
    partner: hotel.partner,
    hotel: hotel._id,
    hotelCode: hotel.slug,
    hotelName: hotel.name,
    market: market._id,
    marketCode: market.code,
    checkIn: checkInDate,
    checkOut: checkOutDate,
    nights,
    rooms: processedRooms,
    totalRooms: processedRooms.length,
    totalAdults,
    totalChildren,
    totalInfants,
    leadGuest: rooms[0]?.guests?.find(g => g.isLead) ||
      rooms[0]?.guests?.[0] || {
        firstName: contact.firstName || 'Guest',
        lastName: contact.lastName || '',
        isLead: true
      },
    contact: {
      email: contact.email,
      phone: contact.phone,
      countryCode: countryCode || contact.countryCode
    },
    billing,
    pricing: {
      currency: market.currency,
      subtotal,
      totalDiscount,
      tax,
      taxRate,
      grandTotal: grandTotal + tax
    },
    payment: {
      status: 'pending',
      dueAmount: grandTotal + tax
    },
    status: 'pending',
    source: {
      type: 'b2c',
      sessionId: req.headers['x-session-id'],
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    },
    specialRequests
  })

  await booking.save()

  // Reserve allotment for all rooms/dates
  for (const room of processedRooms) {
    const dates = room.dailyBreakdown.map(d => d.date)
    await pricingService.reserveAllotment({
      hotelId: hotel._id.toString(),
      roomTypeId: room.roomType.toString(),
      mealPlanId: room.mealPlan.toString(),
      marketId: market._id.toString(),
      dates,
      rooms: 1
    })
  }

  res.status(201).json({
    success: true,
    data: {
      bookingNumber: booking.bookingNumber,
      status: booking.status,
      hotel: {
        name: hotel.name,
        slug: hotel.slug
      },
      checkIn: booking.formattedCheckIn,
      checkOut: booking.formattedCheckOut,
      nights: booking.nights,
      rooms: booking.totalRooms,
      guests: {
        adults: booking.totalAdults,
        children: booking.totalChildren
      },
      pricing: booking.pricing,
      contact: {
        email: booking.contact.email
      }
    }
  })
})

/**
 * Get booking by reference number
 * GET /public/bookings/:bookingNumber
 * Query: { email }
 */
export const getBooking = asyncHandler(async (req, res) => {
  const { bookingNumber } = req.params
  const { email } = req.query

  if (!email) {
    throw new BadRequestError('EMAIL_REQUIRED')
  }

  const booking = await Booking.findByBookingNumber(bookingNumber)
    .populate('hotel', 'name slug address images')
    .populate('rooms.roomType', 'name code images')
    .populate('rooms.mealPlan', 'name code')

  if (!booking) {
    throw new NotFoundError('BOOKING_NOT_FOUND')
  }

  // Verify email matches
  if (booking.contact.email.toLowerCase() !== email.toLowerCase()) {
    throw new NotFoundError('BOOKING_NOT_FOUND')
  }

  res.json({
    success: true,
    data: {
      bookingNumber: booking.bookingNumber,
      status: booking.status,
      hotel: {
        name: booking.hotel?.name || booking.hotelName,
        slug: booking.hotel?.slug || booking.hotelCode,
        address: booking.hotel?.address,
        image: booking.hotel?.images?.find(img => img.isMain)?.url
      },
      checkIn: booking.formattedCheckIn,
      checkOut: booking.formattedCheckOut,
      nights: booking.nights,
      rooms: booking.rooms.map(r => ({
        roomType: {
          name: r.roomTypeName || r.roomType?.name,
          code: r.roomTypeCode
        },
        mealPlan: {
          name: r.mealPlanName || r.mealPlan?.name,
          code: r.mealPlanCode
        },
        guests: r.guests,
        pricing: r.pricing
      })),
      guests: {
        adults: booking.totalAdults,
        children: booking.totalChildren,
        lead: booking.leadGuest
      },
      contact: booking.contact,
      pricing: booking.pricing,
      payment: {
        status: booking.payment.status,
        paidAmount: booking.payment.paidAmount,
        dueAmount: booking.payment.dueAmount
      },
      specialRequests: booking.specialRequests,
      createdAt: booking.createdAt,
      confirmedAt: booking.confirmedAt,
      cancellation:
        booking.status === 'cancelled'
          ? {
              cancelledAt: booking.cancellation?.cancelledAt,
              reason: booking.cancellation?.reason,
              refundAmount: booking.cancellation?.refundAmount
            }
          : undefined
    }
  })
})

/**
 * Request booking cancellation
 * POST /public/bookings/:bookingNumber/cancel
 * Body: { email, reason }
 */
export const cancelBooking = asyncHandler(async (req, res) => {
  const { bookingNumber } = req.params
  const { email, reason } = req.body

  if (!email) {
    throw new BadRequestError('EMAIL_REQUIRED')
  }

  const booking = await Booking.findByBookingNumber(bookingNumber).populate('hotel', 'policies')

  if (!booking) {
    throw new NotFoundError('BOOKING_NOT_FOUND')
  }

  // Verify email matches
  if (booking.contact.email.toLowerCase() !== email.toLowerCase()) {
    throw new NotFoundError('BOOKING_NOT_FOUND')
  }

  // Check if cancellation is allowed
  const canCancelResult = booking.canCancel()
  if (!canCancelResult.allowed) {
    throw new BadRequestError(canCancelResult.reason || 'CANCELLATION_NOT_ALLOWED')
  }

  // Calculate refund based on cancellation policy
  const checkIn = new Date(booking.checkIn)
  const now = new Date()
  const daysBeforeCheckIn = Math.floor((checkIn - now) / (1000 * 60 * 60 * 24))

  let refundPercent = 0
  if (
    booking.hotel?.policies?.freeCancellation?.enabled &&
    daysBeforeCheckIn >= (booking.hotel.policies.freeCancellation.daysBeforeCheckIn || 1)
  ) {
    refundPercent = 100
  } else if (booking.hotel?.policies?.cancellationRules?.length > 0) {
    refundPercent = booking.hotel.calculateRefund?.(daysBeforeCheckIn) || 0
  }

  const refundAmount = (booking.payment.paidAmount || 0) * (refundPercent / 100)

  // Update booking
  booking.status = 'cancelled'
  booking.cancellation = {
    cancelledAt: new Date(),
    reason,
    refundAmount,
    refundStatus: refundAmount > 0 ? 'pending' : undefined,
    policy: {
      daysBeforeCheckIn,
      refundPercent
    }
  }

  // Add modification record
  booking.modifications.push({
    type: 'status',
    description: 'Booking cancelled by guest',
    previousValue: 'pending',
    newValue: 'cancelled'
  })

  await booking.save()

  // Release allotment
  for (const room of booking.rooms) {
    const dates = room.dailyBreakdown.map(d => d.date)
    await pricingService.releaseAllotment({
      hotelId: booking.hotel._id?.toString() || booking.hotel.toString(),
      roomTypeId: room.roomType.toString(),
      mealPlanId: room.mealPlan.toString(),
      marketId: booking.market.toString(),
      dates,
      rooms: 1
    })
  }

  res.json({
    success: true,
    data: {
      bookingNumber: booking.bookingNumber,
      status: booking.status,
      cancellation: {
        cancelledAt: booking.cancellation.cancelledAt,
        reason: booking.cancellation.reason,
        refundPercent,
        refundAmount,
        refundStatus: booking.cancellation.refundStatus
      }
    }
  })
})
