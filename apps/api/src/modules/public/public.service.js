/**
 * Public API Service
 * B2C/Public facing endpoints for hotel search, availability, and pricing
 * No authentication required, but rate limiting recommended
 *
 * This is a barrel file that re-exports all public service modules
 */

// Domain resolution
export { resolveDomain } from './publicDomain.service.js'

// Hotel listing and info
export { listHotels, getHotelInfo, getRoomTypes, getMealPlans } from './publicHotel.service.js'

// Availability and pricing
export {
  searchAvailability,
  getPriceQuote,
  checkAvailability,
  getActiveCampaigns
} from './publicAvailability.service.js'

// Booking operations
export { createBooking, getBooking, cancelBooking } from './publicBooking.service.js'
