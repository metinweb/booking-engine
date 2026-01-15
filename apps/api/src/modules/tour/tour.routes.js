// Tour Module Routes
import express from 'express'
import * as tourService from './tour.service.js'
import { protect, requirePartnerOrAdmin } from '#middleware/auth.js'

const router = express.Router()

// All routes require authentication and partner context
router.use(protect)
router.use(requirePartnerOrAdmin)

// =====================
// TOUR ROUTES - List & Stats (before :id routes)
// =====================
router.get('/', tourService.getList)
router.get('/stats', tourService.getStats)

// =====================
// DEPARTURE ROUTES (MUST be before /:id to avoid matching)
// =====================

// Search & List (no params)
router.get('/departures/search', tourService.searchDepartures)
router.get('/departures/upcoming', tourService.getUpcomingDepartures)

// Single departure operations
router.get('/departures/:id', tourService.getDepartureById)
router.get('/departures/:id/availability', tourService.checkAvailability)
router.put('/departures/:id', tourService.updateDeparture)
router.delete('/departures/:id', tourService.removeDeparture)

// =====================
// EXTRA ROUTES (MUST be before /:id to avoid matching)
// =====================
router.get('/extras', tourService.getExtras)
router.get('/extras/:id', tourService.getExtraById)
router.post('/extras', tourService.createExtra)
router.put('/extras/:id', tourService.updateExtra)
router.delete('/extras/:id', tourService.removeExtra)

// =====================
// BOOKING ROUTES (MUST be before /:id to avoid matching)
// =====================

// List & Search
router.get('/bookings', tourService.getBookings)
router.get('/bookings/upcoming', tourService.getUpcomingBookings)

// Price calculation
router.post('/bookings/calculate-price', tourService.calculatePrice)

// CRUD
router.get('/bookings/:id', tourService.getBookingById)
router.post('/bookings', tourService.createBooking)
router.put('/bookings/:id', tourService.updateBooking)

// Status management
router.patch('/bookings/:id/status', tourService.updateBookingStatus)
router.post('/bookings/:id/cancel', tourService.cancelBooking)

// Payments
router.post('/bookings/:id/payments', tourService.addBookingPayment)

// Visa
router.post('/bookings/:id/visa/:passengerIndex', tourService.updateVisaStatus)

// Notes
router.post('/bookings/:id/notes', tourService.addBookingNote)

// =====================
// TOUR CRUD (with :id params - MUST be after all static routes)
// =====================
router.get('/:id', tourService.getById)
router.post('/', tourService.create)
router.put('/:id', tourService.update)
router.delete('/:id', tourService.remove)
router.post('/:id/duplicate', tourService.duplicate)

// Tour departures (with :tourId param)
router.get('/:tourId/departures', tourService.getDepartures)
router.post('/:tourId/departures', tourService.createDeparture)
router.post('/:tourId/departures/bulk', tourService.bulkCreateDepartures)

export default router
