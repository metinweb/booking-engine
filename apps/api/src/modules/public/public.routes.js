/**
 * Public API Routes
 * No authentication required - for B2C booking engine
 *
 * All routes are rate limited to prevent abuse
 */

import express from 'express'
import * as publicService from './public.service.js'
import {
	globalLimiter,
	publicSearchLimiter,
	publicBookingLimiter,
	pricingLimiter
} from '../../middleware/rateLimiter.js'
import { validateBody, validateQuery } from '../../middleware/validation.js'

const router = express.Router()

// Apply global rate limiter to all public routes
router.use(globalLimiter)

// ==================== HOTEL ENDPOINTS ====================

/**
 * @route GET /public/hotels
 * @desc List hotels with filters
 * @query {string} city - Filter by city
 * @query {string} country - Filter by country code
 * @query {number} stars - Filter by star rating
 * @query {string} type - Filter by hotel type (hotel, resort, boutique, etc.)
 * @query {string} amenities - Comma-separated amenities filter
 * @query {number} page - Page number (default: 1)
 * @query {number} limit - Items per page (default: 20, max: 50)
 * @query {string} sort - Sort by: price, rating, name (default: displayOrder)
 */
router.get('/hotels', publicService.listHotels)

/**
 * @route GET /public/hotels/:hotelCode
 * @desc Get hotel information
 */
router.get('/hotels/:hotelCode', publicService.getHotelInfo)

/**
 * @route GET /public/hotels/:hotelCode/room-types
 * @desc Get hotel room types
 */
router.get('/hotels/:hotelCode/room-types', publicService.getRoomTypes)

/**
 * @route GET /public/hotels/:hotelCode/meal-plans
 * @desc Get hotel meal plans
 */
router.get('/hotels/:hotelCode/meal-plans', publicService.getMealPlans)

// ==================== SEARCH & AVAILABILITY ====================

/**
 * @route POST /public/hotels/:hotelCode/search
 * @desc Search availability and prices for a hotel
 * @body {date} checkIn - Check-in date (YYYY-MM-DD)
 * @body {date} checkOut - Check-out date (YYYY-MM-DD)
 * @body {number} adults - Number of adults (1-10)
 * @body {array} children - Array of child ages
 * @body {string} countryCode - Guest country code for market detection
 * @body {string} currency - Preferred currency
 */
router.post('/hotels/:hotelCode/search',
	publicSearchLimiter,
	validateBody({
		checkIn: { type: 'date', required: true },
		checkOut: { type: 'date', required: true },
		adults: { type: 'integer', min: 1, max: 10 },
		children: { type: 'array' }
	}),
	publicService.searchAvailability
)

/**
 * @route GET /public/hotels/:hotelCode/availability
 * @desc Check availability for date range
 */
router.get('/hotels/:hotelCode/availability',
	publicSearchLimiter,
	validateQuery({
		startDate: { type: 'string', required: true },
		endDate: { type: 'string', required: true },
		roomTypeId: { type: 'string' },
		marketId: { type: 'string' }
	}),
	publicService.checkAvailability
)

// ==================== PRICING ====================

/**
 * @route POST /public/hotels/:hotelCode/price-quote
 * @desc Get detailed price quote
 */
router.post('/hotels/:hotelCode/price-quote',
	pricingLimiter,
	validateBody({
		checkIn: { type: 'date', required: true },
		checkOut: { type: 'date', required: true },
		roomTypeCode: { type: 'string', required: true },
		mealPlanCode: { type: 'string', required: true },
		adults: { type: 'integer', min: 1, max: 10 },
		children: { type: 'array' }
	}),
	publicService.getPriceQuote
)

/**
 * @route GET /public/hotels/:hotelCode/campaigns
 * @desc Get active campaigns
 */
router.get('/hotels/:hotelCode/campaigns', publicService.getActiveCampaigns)

// ==================== BOOKING ====================

/**
 * @route POST /public/bookings
 * @desc Create a new booking
 */
router.post('/bookings',
	publicBookingLimiter,
	validateBody({
		hotelCode: { type: 'string', required: true },
		checkIn: { type: 'date', required: true },
		checkOut: { type: 'date', required: true },
		rooms: { type: 'array', required: true },
		contact: { type: 'object', required: true }
	}),
	publicService.createBooking
)

/**
 * @route GET /public/bookings/:bookingNumber
 * @desc Get booking by reference number
 */
router.get('/bookings/:bookingNumber',
	validateQuery({
		email: { type: 'string', required: true }
	}),
	publicService.getBooking
)

/**
 * @route POST /public/bookings/:bookingNumber/cancel
 * @desc Request booking cancellation
 */
router.post('/bookings/:bookingNumber/cancel',
	publicBookingLimiter,
	validateBody({
		email: { type: 'string', required: true },
		reason: { type: 'string' }
	}),
	publicService.cancelBooking
)

export default router
