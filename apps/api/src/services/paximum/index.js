/**
 * Paximum OTA Integration Service
 *
 * Handles communication with Paximum API for hotel search and booking
 * Reference: https://service.paximum.com/v2
 *
 * This is the main entry point that re-exports all Paximum functionality
 * organized into logical modules.
 */

// Auth module exports
import {
  getToken,
  getEndpoint,
  makeRequest,
  isEnabled,
  getDefaultMarkup
} from './auth.js'

// Product module exports
import {
  applyMarkup,
  searchLocations,
  searchHotels,
  getHotelDetails,
  getOffers,
  getOfferDetails
} from './product.js'

// Booking module exports
import {
  beginTransaction,
  addServices,
  setReservationInfo,
  commitTransaction,
  getReservationDetail,
  getReservationList,
  getCancellationPenalty,
  cancelReservation
} from './booking.js'

// Named exports for individual function imports
export {
  // Auth
  getToken,
  getEndpoint,
  makeRequest,
  isEnabled,
  getDefaultMarkup,

  // Product
  applyMarkup,
  searchLocations,
  searchHotels,
  getHotelDetails,
  getOffers,
  getOfferDetails,

  // Booking
  beginTransaction,
  addServices,
  setReservationInfo,
  commitTransaction,
  getReservationDetail,
  getReservationList,
  getCancellationPenalty,
  cancelReservation
}

// Default export as service object for backward compatibility
export const paximumService = {
  // Auth
  getToken,
  isEnabled,
  getDefaultMarkup,

  // Search
  searchLocations,
  searchHotels,
  getHotelDetails,
  getOffers,
  getOfferDetails,

  // Booking
  beginTransaction,
  addServices,
  setReservationInfo,
  commitTransaction,

  // Reservation Management
  getReservationDetail,
  getReservationList,
  getCancellationPenalty,
  cancelReservation
}

export default paximumService
