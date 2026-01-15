import Tour from './tour.model.js'
import TourDeparture from './tourDeparture.model.js'
import TourExtra from './tourExtra.model.js'
import TourBooking from './tourBooking.model.js'
import { asyncHandler } from '#helpers'
import { NotFoundError, BadRequestError, ValidationError } from '#core/errors.js'
import { getPartnerId as getPartnerIdFromContext } from '#services/helpers.js'

/**
 * Get partner ID with fallbacks
 * Tries: user context -> JWT token -> account
 */
const getPartnerId = (req) => {
  // First try standard context helper
  let partnerId = getPartnerIdFromContext(req)

  // Fallback: Get from JWT token if user doesn't have it
  if (!partnerId && req.token?.accountType === 'partner' && req.token?.accountId) {
    partnerId = req.token.accountId
  }

  // Fallback: Get from user's populated account
  if (!partnerId && req.account?._id) {
    partnerId = req.account._id
  }

  return partnerId
}

/**
 * Require partner ID - throws if not found
 */
const requirePartnerId = (req) => {
  const partnerId = getPartnerId(req)
  if (!partnerId) {
    throw new BadRequestError('PARTNER_CONTEXT_REQUIRED')
  }
  return partnerId
}

// =====================
// TOUR CRUD
// =====================

/**
 * Get all tours for partner
 */
export const getList = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { status, tourType, search, featured, page = 1, limit = 20 } = req.query

  const filter = { partner: partnerId }

  if (status) filter.status = status
  if (tourType) filter.tourType = tourType
  if (featured === 'true') filter.featured = true

  if (search) {
    filter.$or = [
      { 'name.tr': { $regex: search, $options: 'i' } },
      { 'name.en': { $regex: search, $options: 'i' } },
      { code: { $regex: search, $options: 'i' } }
    ]
  }

  const skip = (page - 1) * limit
  const [items, total] = await Promise.all([
    Tour.find(filter)
      .populate('tags', 'name slug color')
      .sort({ displayOrder: 1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Tour.countDocuments(filter)
  ])

  res.json({
    success: true,
    data: {
      items,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  })
})

/**
 * Get single tour by ID
 */
export const getById = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { id } = req.params

  const item = await Tour.findOne({ _id: id, partner: partnerId })
    .populate('tags', 'name slug color')
    .populate('accommodations.hotel', 'name stars address')
    .populate('accommodations.mealPlan', 'code name')

  if (!item) {
    throw new NotFoundError('TOUR_NOT_FOUND')
  }

  res.json({
    success: true,
    data: item
  })
})

/**
 * Create new tour
 */
export const create = asyncHandler(async (req, res) => {
  const partnerId = requirePartnerId(req)
  const { user } = req
  const { code, name, ...rest } = req.body

  if (!code) throw new BadRequestError('CODE_REQUIRED')
  if (!name?.tr) throw new BadRequestError('NAME_REQUIRED')

  // Check code uniqueness
  const existing = await Tour.findOne({ partner: partnerId, code: code.toUpperCase() })
  if (existing) {
    throw new ValidationError('CODE_ALREADY_EXISTS')
  }

  const item = new Tour({
    partner: partnerId,
    code: code.toUpperCase(),
    name,
    ...rest,
    createdBy: user._id
  })

  await item.save()

  res.status(201).json({
    success: true,
    data: item,
    message: 'TOUR_CREATED'
  })
})

/**
 * Update tour
 */
export const update = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { user } = req
  const { id } = req.params
  const updates = req.body

  const item = await Tour.findOne({ _id: id, partner: partnerId })

  if (!item) {
    throw new NotFoundError('TOUR_NOT_FOUND')
  }

  // Check code uniqueness if being updated
  if (updates.code && updates.code.toUpperCase() !== item.code) {
    const existing = await Tour.findOne({
      partner: partnerId,
      code: updates.code.toUpperCase(),
      _id: { $ne: id }
    })
    if (existing) {
      throw new ValidationError('CODE_ALREADY_EXISTS')
    }
  }

  Object.assign(item, updates, { updatedBy: user._id })
  await item.save()

  res.json({
    success: true,
    data: item,
    message: 'TOUR_UPDATED'
  })
})

/**
 * Delete tour (soft delete - set status to archived)
 */
export const remove = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { id } = req.params

  const item = await Tour.findOne({ _id: id, partner: partnerId })

  if (!item) {
    throw new NotFoundError('TOUR_NOT_FOUND')
  }

  // Check if there are active bookings
  const activeBookings = await TourBooking.countDocuments({
    tour: id,
    status: { $in: ['pending', 'confirmed'] }
  })

  if (activeBookings > 0) {
    throw new ValidationError('TOUR_HAS_ACTIVE_BOOKINGS')
  }

  // Soft delete
  item.status = 'archived'
  await item.save()

  res.json({
    success: true,
    message: 'TOUR_DELETED'
  })
})

/**
 * Duplicate tour
 */
export const duplicate = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { user } = req
  const { id } = req.params
  const { code, name } = req.body

  const source = await Tour.findOne({ _id: id, partner: partnerId })
  if (!source) {
    throw new NotFoundError('TOUR_NOT_FOUND')
  }

  // Check new code uniqueness
  const newCode = code || `${source.code}-COPY`
  const existing = await Tour.findOne({ partner: partnerId, code: newCode.toUpperCase() })
  if (existing) {
    throw new ValidationError('CODE_ALREADY_EXISTS')
  }

  const newTour = new Tour({
    ...source.toObject(),
    _id: undefined,
    code: newCode.toUpperCase(),
    name: name || {
      tr: `${source.name.tr} (Kopya)`,
      en: source.name.en ? `${source.name.en} (Copy)` : ''
    },
    slug: undefined,
    status: 'draft',
    featured: false,
    createdBy: user._id,
    createdAt: undefined,
    updatedAt: undefined
  })

  await newTour.save()

  res.status(201).json({
    success: true,
    data: newTour,
    message: 'TOUR_DUPLICATED'
  })
})

// =====================
// TOUR DEPARTURE CRUD
// =====================

/**
 * Get departures for a tour
 */
export const getDepartures = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { tourId } = req.params
  const { status, fromDate, toDate, page = 1, limit = 50 } = req.query

  const filter = { partner: partnerId, tour: tourId }

  if (status) filter.status = status
  if (fromDate) filter.departureDate = { $gte: new Date(fromDate) }
  if (toDate) {
    filter.departureDate = filter.departureDate || {}
    filter.departureDate.$lte = new Date(toDate)
  }

  const skip = (page - 1) * limit
  const [items, total] = await Promise.all([
    TourDeparture.find(filter)
      .sort({ departureDate: 1 })
      .skip(skip)
      .limit(parseInt(limit)),
    TourDeparture.countDocuments(filter)
  ])

  res.json({
    success: true,
    data: {
      items,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  })
})

/**
 * Get single departure
 */
export const getDepartureById = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { id } = req.params

  const item = await TourDeparture.findOne({ _id: id, partner: partnerId })
    .populate('tour', 'name code tourType duration')
    .populate('guide.user', 'firstName lastName email phone')

  if (!item) {
    throw new NotFoundError('DEPARTURE_NOT_FOUND')
  }

  res.json({
    success: true,
    data: item
  })
})

/**
 * Create departure
 */
export const createDeparture = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { user } = req
  const { tourId } = req.params
  const data = req.body

  // Verify tour exists
  const tour = await Tour.findOne({ _id: tourId, partner: partnerId })
  if (!tour) {
    throw new NotFoundError('TOUR_NOT_FOUND')
  }

  if (!data.departureDate || !data.returnDate) {
    throw new BadRequestError('DATES_REQUIRED')
  }

  if (!data.capacity?.total) {
    throw new BadRequestError('CAPACITY_REQUIRED')
  }

  const item = new TourDeparture({
    partner: partnerId,
    tour: tourId,
    ...data,
    capacity: {
      ...data.capacity,
      available: data.capacity.total
    },
    createdBy: user._id
  })

  await item.save()

  res.status(201).json({
    success: true,
    data: item,
    message: 'DEPARTURE_CREATED'
  })
})

/**
 * Update departure
 */
export const updateDeparture = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { user } = req
  const { id } = req.params
  const updates = req.body

  const item = await TourDeparture.findOne({ _id: id, partner: partnerId })

  if (!item) {
    throw new NotFoundError('DEPARTURE_NOT_FOUND')
  }

  Object.assign(item, updates, { updatedBy: user._id })
  await item.save()

  res.json({
    success: true,
    data: item,
    message: 'DEPARTURE_UPDATED'
  })
})

/**
 * Delete departure
 */
export const removeDeparture = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { id } = req.params

  const item = await TourDeparture.findOne({ _id: id, partner: partnerId })

  if (!item) {
    throw new NotFoundError('DEPARTURE_NOT_FOUND')
  }

  // Check if there are bookings
  const bookings = await TourBooking.countDocuments({
    departure: id,
    status: { $nin: ['cancelled', 'expired'] }
  })

  if (bookings > 0) {
    throw new ValidationError('DEPARTURE_HAS_BOOKINGS')
  }

  await item.deleteOne()

  res.json({
    success: true,
    message: 'DEPARTURE_DELETED'
  })
})

/**
 * Bulk create departures
 */
export const bulkCreateDepartures = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { user } = req
  const { tourId } = req.params
  const { departures } = req.body

  // Verify tour exists
  const tour = await Tour.findOne({ _id: tourId, partner: partnerId })
  if (!tour) {
    throw new NotFoundError('TOUR_NOT_FOUND')
  }

  if (!departures?.length) {
    throw new BadRequestError('DEPARTURES_REQUIRED')
  }

  const items = await TourDeparture.insertMany(
    departures.map(dep => ({
      partner: partnerId,
      tour: tourId,
      ...dep,
      capacity: {
        ...dep.capacity,
        available: dep.capacity?.total || 0
      },
      createdBy: user._id
    }))
  )

  res.status(201).json({
    success: true,
    data: items,
    message: 'DEPARTURES_CREATED',
    count: items.length
  })
})

// =====================
// TOUR EXTRA CRUD
// =====================

/**
 * Get all extras
 */
export const getExtras = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { category, status, tourId, page = 1, limit = 50 } = req.query

  const filter = { partner: partnerId }

  if (status) filter.status = status
  if (category) filter.category = category
  if (tourId) {
    filter.$or = [
      { applyToAllTours: true },
      { applicableTours: tourId }
    ]
  }

  const skip = (page - 1) * limit
  const [items, total] = await Promise.all([
    TourExtra.find(filter)
      .sort({ category: 1, displayOrder: 1 })
      .skip(skip)
      .limit(parseInt(limit)),
    TourExtra.countDocuments(filter)
  ])

  res.json({
    success: true,
    data: {
      items,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  })
})

/**
 * Get single extra
 */
export const getExtraById = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { id } = req.params

  const item = await TourExtra.findOne({ _id: id, partner: partnerId })
    .populate('applicableTours', 'name code')

  if (!item) {
    throw new NotFoundError('EXTRA_NOT_FOUND')
  }

  res.json({
    success: true,
    data: item
  })
})

/**
 * Create extra
 */
export const createExtra = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { user } = req
  const { code, name, category, ...rest } = req.body

  if (!code) throw new BadRequestError('CODE_REQUIRED')
  if (!name?.tr) throw new BadRequestError('NAME_REQUIRED')
  if (!category) throw new BadRequestError('CATEGORY_REQUIRED')

  // Check code uniqueness
  const existing = await TourExtra.findOne({ partner: partnerId, code: code.toUpperCase() })
  if (existing) {
    throw new ValidationError('CODE_ALREADY_EXISTS')
  }

  const item = new TourExtra({
    partner: partnerId,
    code: code.toUpperCase(),
    name,
    category,
    ...rest,
    createdBy: user._id
  })

  await item.save()

  res.status(201).json({
    success: true,
    data: item,
    message: 'EXTRA_CREATED'
  })
})

/**
 * Update extra
 */
export const updateExtra = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { user } = req
  const { id } = req.params
  const updates = req.body

  const item = await TourExtra.findOne({ _id: id, partner: partnerId })

  if (!item) {
    throw new NotFoundError('EXTRA_NOT_FOUND')
  }

  Object.assign(item, updates, { updatedBy: user._id })
  await item.save()

  res.json({
    success: true,
    data: item,
    message: 'EXTRA_UPDATED'
  })
})

/**
 * Delete extra
 */
export const removeExtra = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { id } = req.params

  const item = await TourExtra.findOne({ _id: id, partner: partnerId })

  if (!item) {
    throw new NotFoundError('EXTRA_NOT_FOUND')
  }

  await item.deleteOne()

  res.json({
    success: true,
    message: 'EXTRA_DELETED'
  })
})

// =====================
// TOUR BOOKING CRUD
// =====================

/**
 * Get all bookings
 */
export const getBookings = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { status, tourId, departureId, salesChannel, search, fromDate, toDate, page = 1, limit = 20 } = req.query

  const filter = { partner: partnerId }

  if (status) filter.status = status
  if (tourId) filter.tour = tourId
  if (departureId) filter.departure = departureId
  if (salesChannel) filter.salesChannel = salesChannel

  if (search) {
    filter.$or = [
      { bookingNumber: { $regex: search, $options: 'i' } },
      { 'contact.email': { $regex: search, $options: 'i' } },
      { 'contact.phone': { $regex: search, $options: 'i' } },
      { 'passengers.firstName': { $regex: search, $options: 'i' } },
      { 'passengers.lastName': { $regex: search, $options: 'i' } }
    ]
  }

  if (fromDate) filter.createdAt = { $gte: new Date(fromDate) }
  if (toDate) {
    filter.createdAt = filter.createdAt || {}
    filter.createdAt.$lte = new Date(toDate)
  }

  const skip = (page - 1) * limit
  const [items, total] = await Promise.all([
    TourBooking.find(filter)
      .populate('tour', 'name code tourType')
      .populate('departure', 'departureDate returnDate code')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    TourBooking.countDocuments(filter)
  ])

  res.json({
    success: true,
    data: {
      items,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  })
})

/**
 * Get single booking
 */
export const getBookingById = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { id } = req.params

  const item = await TourBooking.findOne({
    $or: [
      { _id: id, partner: partnerId },
      { bookingNumber: id.toUpperCase(), partner: partnerId }
    ]
  })
    .populate('tour', 'name code tourType duration destination images itinerary inclusions exclusions cancellationPolicy')
    .populate('departure', 'departureDate returnDate code pricing pickupPoints flightDetails guide')
    .populate('extras.extra', 'name description images')
    .populate('source.agencyId', 'name code')

  if (!item) {
    throw new NotFoundError('BOOKING_NOT_FOUND')
  }

  res.json({
    success: true,
    data: item
  })
})

/**
 * Create booking
 */
export const createBooking = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { user } = req
  const data = req.body

  if (!data.tour) throw new BadRequestError('TOUR_REQUIRED')
  if (!data.departure) throw new BadRequestError('DEPARTURE_REQUIRED')
  if (!data.contact?.email) throw new BadRequestError('EMAIL_REQUIRED')
  if (!data.contact?.phone) throw new BadRequestError('PHONE_REQUIRED')

  // Verify tour and departure
  const [tour, departure] = await Promise.all([
    Tour.findOne({ _id: data.tour, partner: partnerId }),
    TourDeparture.findOne({ _id: data.departure, partner: partnerId })
  ])

  if (!tour) throw new NotFoundError('TOUR_NOT_FOUND')
  if (!departure) throw new NotFoundError('DEPARTURE_NOT_FOUND')

  // Check availability
  const passengerCount = data.passengers?.length || 1
  if (departure.availableSeats < passengerCount) {
    throw new ValidationError('INSUFFICIENT_CAPACITY')
  }

  // Create booking
  const booking = new TourBooking({
    partner: partnerId,
    tour: data.tour,
    departure: data.departure,
    ...data,
    tourSnapshot: {
      code: tour.code,
      name: tour.name,
      tourType: tour.tourType,
      duration: tour.duration,
      destination: tour.destination,
      mainImage: tour.mainImage
    },
    departureSnapshot: {
      departureDate: departure.departureDate,
      returnDate: departure.returnDate,
      code: departure.code
    },
    source: {
      ...data.source,
      type: data.salesChannel || 'b2c'
    },
    createdBy: user._id
  })

  await booking.save()

  // Reserve seats
  await departure.reserveSeats(passengerCount)

  res.status(201).json({
    success: true,
    data: booking,
    message: 'BOOKING_CREATED'
  })
})

/**
 * Update booking
 */
export const updateBooking = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { user } = req
  const { id } = req.params
  const updates = req.body

  const booking = await TourBooking.findOne({ _id: id, partner: partnerId })

  if (!booking) {
    throw new NotFoundError('BOOKING_NOT_FOUND')
  }

  // Don't allow updates to cancelled/completed bookings
  if (['cancelled', 'completed', 'expired'].includes(booking.status)) {
    throw new ValidationError('BOOKING_CANNOT_BE_UPDATED')
  }

  Object.assign(booking, updates, { updatedBy: user._id })
  await booking.save()

  res.json({
    success: true,
    data: booking,
    message: 'BOOKING_UPDATED'
  })
})

/**
 * Update booking status
 */
export const updateBookingStatus = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { user } = req
  const { id } = req.params
  const { status, reason } = req.body

  const booking = await TourBooking.findOne({ _id: id, partner: partnerId })

  if (!booking) {
    throw new NotFoundError('BOOKING_NOT_FOUND')
  }

  const oldStatus = booking.status

  if (status === 'confirmed') {
    await booking.confirm(user._id)

    // Confirm reservation
    const departure = await TourDeparture.findById(booking.departure)
    if (departure) {
      const passengerCount = booking.passengers.length
      await departure.confirmReservation(passengerCount)
    }
  } else if (status === 'cancelled') {
    await booking.cancel(reason, user._id)

    // Release seats
    const departure = await TourDeparture.findById(booking.departure)
    if (departure) {
      const passengerCount = booking.passengers.length
      if (oldStatus === 'pending') {
        await departure.releaseReservation(passengerCount)
      } else if (oldStatus === 'confirmed') {
        await departure.cancelBooking(passengerCount)
      }
    }
  } else {
    booking.status = status
    booking.addChangeLog('status_changed', 'status', oldStatus, status, `Durum değiştirildi: ${oldStatus} → ${status}`, user._id)
    await booking.save()
  }

  res.json({
    success: true,
    data: booking,
    message: 'BOOKING_STATUS_UPDATED'
  })
})

/**
 * Cancel booking
 */
export const cancelBooking = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { user } = req
  const { id } = req.params
  const { reason } = req.body

  const booking = await TourBooking.findOne({ _id: id, partner: partnerId })

  if (!booking) {
    throw new NotFoundError('BOOKING_NOT_FOUND')
  }

  const oldStatus = booking.status
  await booking.cancel(reason || 'User requested cancellation', user._id)

  // Release/cancel seats
  const departure = await TourDeparture.findById(booking.departure)
  if (departure) {
    const passengerCount = booking.passengers.length
    if (oldStatus === 'pending') {
      await departure.releaseReservation(passengerCount)
    } else if (oldStatus === 'confirmed') {
      await departure.cancelBooking(passengerCount)
    }
  }

  res.json({
    success: true,
    data: booking,
    message: 'BOOKING_CANCELLED'
  })
})

/**
 * Add payment to booking
 */
export const addBookingPayment = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { user } = req
  const { id } = req.params
  const paymentData = req.body

  const booking = await TourBooking.findOne({ _id: id, partner: partnerId })

  if (!booking) {
    throw new NotFoundError('BOOKING_NOT_FOUND')
  }

  await booking.addPayment(paymentData, user._id)

  res.json({
    success: true,
    data: booking,
    message: 'PAYMENT_ADDED'
  })
})

/**
 * Update visa status
 */
export const updateVisaStatus = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { user } = req
  const { id, passengerIndex } = req.params
  const statusData = req.body

  const booking = await TourBooking.findOne({ _id: id, partner: partnerId })

  if (!booking) {
    throw new NotFoundError('BOOKING_NOT_FOUND')
  }

  await booking.updateVisaStatus(parseInt(passengerIndex), statusData, user._id)

  res.json({
    success: true,
    data: booking,
    message: 'VISA_STATUS_UPDATED'
  })
})

/**
 * Add note to booking
 */
export const addBookingNote = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { user } = req
  const { id } = req.params
  const { content, isInternal = true } = req.body

  const booking = await TourBooking.findOne({ _id: id, partner: partnerId })

  if (!booking) {
    throw new NotFoundError('BOOKING_NOT_FOUND')
  }

  await booking.addNote(content, isInternal, user._id)

  res.json({
    success: true,
    data: booking,
    message: 'NOTE_ADDED'
  })
})

// =====================
// SEARCH & AVAILABILITY
// =====================

/**
 * Search available departures
 */
export const searchDepartures = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const {
    destination,
    tourType,
    fromDate,
    toDate,
    minSeats = 1,
    priceMin,
    priceMax,
    limit = 50
  } = req.query

  const results = await TourDeparture.search(partnerId, {
    destination,
    tourType,
    fromDate: fromDate ? new Date(fromDate) : new Date(),
    toDate: toDate ? new Date(toDate) : undefined,
    minSeats: parseInt(minSeats),
    priceMin: priceMin ? parseFloat(priceMin) : undefined,
    priceMax: priceMax ? parseFloat(priceMax) : undefined,
    limit: parseInt(limit)
  })

  res.json({
    success: true,
    data: results
  })
})

/**
 * Check departure availability
 */
export const checkAvailability = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { id } = req.params
  const { passengers = 1 } = req.query

  const departure = await TourDeparture.findOne({ _id: id, partner: partnerId })
    .populate('tour', 'name code')

  if (!departure) {
    throw new NotFoundError('DEPARTURE_NOT_FOUND')
  }

  const isAvailable = departure.availableSeats >= parseInt(passengers)

  res.json({
    success: true,
    data: {
      isAvailable,
      availableSeats: departure.availableSeats,
      totalCapacity: departure.capacity.total,
      status: departure.status,
      labels: departure.labels,
      pricing: departure.pricing,
      tour: departure.tour
    }
  })
})

/**
 * Calculate booking price
 */
export const calculatePrice = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { departureId, adults = 0, children = 0, infants = 0, roomType = 'double', extras = [], isB2B = false } = req.body

  const departure = await TourDeparture.findOne({ _id: departureId, partner: partnerId })

  if (!departure) {
    throw new NotFoundError('DEPARTURE_NOT_FOUND')
  }

  // Calculate base price
  const basePrice = departure.calculatePrice(
    { adults: parseInt(adults), children: parseInt(children), infants: parseInt(infants), roomType },
    { isB2B, withBed: true }
  )

  // Calculate extras
  let extrasTotal = 0
  if (extras.length > 0) {
    const extraDocs = await TourExtra.find({
      partner: partnerId,
      code: { $in: extras.map(e => e.code) }
    })

    for (const extra of extras) {
      const extraDoc = extraDocs.find(e => e.code === extra.code)
      if (extraDoc) {
        const price = extraDoc.getPriceForDate(departure.departureDate, isB2B)
        const quantity = extra.quantity || 1
        const passengerCount = extra.passengers?.length || (parseInt(adults) + parseInt(children))

        if (extraDoc.priceType === 'per_person') {
          extrasTotal += price * passengerCount * quantity
        } else {
          extrasTotal += price * quantity
        }
      }
    }
  }

  res.json({
    success: true,
    data: {
      breakdown: {
        adults: { count: parseInt(adults), unitPrice: departure.pricing.adult?.[roomType] || 0 },
        children: { count: parseInt(children), unitPrice: departure.pricing.child?.withBed || 0 },
        infants: { count: parseInt(infants), unitPrice: departure.pricing.infant?.price || 0 }
      },
      baseTotal: basePrice.subtotal,
      extrasTotal,
      taxes: basePrice.taxes,
      fees: basePrice.fees,
      grandTotal: basePrice.total + extrasTotal,
      currency: departure.pricing.currency
    }
  })
})

// =====================
// STATS & REPORTS
// =====================

/**
 * Get tour statistics
 */
export const getStats = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { fromDate, toDate } = req.query

  const filters = {}
  if (fromDate) filters.fromDate = new Date(fromDate)
  if (toDate) filters.toDate = new Date(toDate)

  const [tourStats, bookingStats, departureStats] = await Promise.all([
    Tour.aggregate([
      { $match: { partner: partnerId } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),
    TourBooking.getStats(partnerId, filters),
    TourDeparture.aggregate([
      { $match: { partner: partnerId, departureDate: { $gte: new Date() } } },
      { $group: { _id: '$status', count: { $sum: 1 }, totalCapacity: { $sum: '$capacity.total' }, soldSeats: { $sum: '$capacity.sold' } } }
    ])
  ])

  res.json({
    success: true,
    data: {
      tours: tourStats,
      bookings: bookingStats,
      departures: departureStats
    }
  })
})

/**
 * Get upcoming departures
 */
export const getUpcomingDepartures = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { days = 30 } = req.query

  const departures = await TourDeparture.findUpcoming(partnerId, parseInt(days))

  res.json({
    success: true,
    data: departures
  })
})

/**
 * Get upcoming bookings
 */
export const getUpcomingBookings = asyncHandler(async (req, res) => {
  const partnerId = getPartnerId(req)
  const { days = 30 } = req.query

  const bookings = await TourBooking.findUpcoming(partnerId, parseInt(days))

  res.json({
    success: true,
    data: bookings
  })
})

export default {
  // Tours
  getList,
  getById,
  create,
  update,
  remove,
  duplicate,
  // Departures
  getDepartures,
  getDepartureById,
  createDeparture,
  updateDeparture,
  removeDeparture,
  bulkCreateDepartures,
  // Extras
  getExtras,
  getExtraById,
  createExtra,
  updateExtra,
  removeExtra,
  // Bookings
  getBookings,
  getBookingById,
  createBooking,
  updateBooking,
  updateBookingStatus,
  cancelBooking,
  addBookingPayment,
  updateVisaStatus,
  addBookingNote,
  // Search & Availability
  searchDepartures,
  checkAvailability,
  calculatePrice,
  // Stats
  getStats,
  getUpcomingDepartures,
  getUpcomingBookings
}
