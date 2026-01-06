/**
 * Paximum OTA Integration Service
 *
 * Handles communication with Paximum API for hotel search and booking
 * Reference: https://service.paximum.com/v2
 *
 * NOTE: This file re-exports from the modular paximum/ directory for backward compatibility.
 * For new code, consider importing directly from './paximum/index.js' or specific modules.
 */

// Re-export everything from the modular structure
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
  cancelReservation,

  // Service object
  paximumService
} from './paximum/index.js'

// Default export for backward compatibility
export { default } from './paximum/index.js'
