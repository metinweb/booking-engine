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

// Hotel Information (generous limits)
router.get('/hotels/:hotelCode', publicService.getHotelInfo)
router.get('/hotels/:hotelCode/room-types', publicService.getRoomTypes)
router.get('/hotels/:hotelCode/meal-plans', publicService.getMealPlans)

// Search and Availability (search limiter)
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

// Price Quote (pricing limiter)
router.post('/hotels/:hotelCode/price-quote',
	pricingLimiter,
	validateBody({
		checkIn: { type: 'date', required: true },
		checkOut: { type: 'date', required: true },
		roomTypeId: { type: 'objectId', required: true },
		mealPlanId: { type: 'objectId', required: true },
		adults: { type: 'integer', min: 1, max: 10 },
		children: { type: 'array' }
	}),
	publicService.getPriceQuote
)

// Campaigns (generous limits)
router.get('/hotels/:hotelCode/campaigns', publicService.getActiveCampaigns)

export default router
