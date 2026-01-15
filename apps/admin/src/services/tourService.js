import api from './api'

const BASE_URL = '/tour'

// =====================
// TOUR OPERATIONS
// =====================

/**
 * Get all Tours with filters and pagination
 * @param {Object} params - Query params (status, tourType, destination, search, page, limit)
 */
export async function getTours(params = {}) {
  const { data } = await api.get(BASE_URL, { params })
  return data
}

/**
 * Get tour statistics
 */
export async function getTourStats() {
  const { data } = await api.get(`${BASE_URL}/stats`)
  return data
}

/**
 * Get single Tour by ID
 */
export async function getTour(id) {
  const { data } = await api.get(`${BASE_URL}/${id}`)
  return data
}

/**
 * Create new Tour
 */
export async function createTour(payload) {
  const { data } = await api.post(BASE_URL, payload)
  return data
}

/**
 * Update Tour
 */
export async function updateTour(id, payload) {
  const { data } = await api.put(`${BASE_URL}/${id}`, payload)
  return data
}

/**
 * Delete Tour
 */
export async function deleteTour(id) {
  const { data } = await api.delete(`${BASE_URL}/${id}`)
  return data
}

/**
 * Duplicate Tour
 */
export async function duplicateTour(id) {
  const { data } = await api.post(`${BASE_URL}/${id}/duplicate`)
  return data
}

// =====================
// DEPARTURE OPERATIONS
// =====================

/**
 * Get departures for a tour
 */
export async function getDepartures(tourId, params = {}) {
  const { data } = await api.get(`${BASE_URL}/${tourId}/departures`, { params })
  return data
}

/**
 * Create departure for a tour
 */
export async function createDeparture(tourId, payload) {
  const { data } = await api.post(`${BASE_URL}/${tourId}/departures`, payload)
  return data
}

/**
 * Bulk create departures for a tour
 */
export async function bulkCreateDepartures(tourId, payload) {
  const { data } = await api.post(`${BASE_URL}/${tourId}/departures/bulk`, payload)
  return data
}

/**
 * Get single departure by ID
 */
export async function getDeparture(id) {
  const { data } = await api.get(`${BASE_URL}/departures/${id}`)
  return data
}

/**
 * Update departure
 */
export async function updateDeparture(id, payload) {
  const { data } = await api.put(`${BASE_URL}/departures/${id}`, payload)
  return data
}

/**
 * Delete departure
 */
export async function deleteDeparture(id) {
  const { data } = await api.delete(`${BASE_URL}/departures/${id}`)
  return data
}

/**
 * Search departures across all tours
 */
export async function searchDepartures(params = {}) {
  const { data } = await api.get(`${BASE_URL}/departures/search`, { params })
  return data
}

/**
 * Check departure availability
 */
export async function checkAvailability(departureId, params = {}) {
  const { data } = await api.get(`${BASE_URL}/departures/${departureId}/availability`, { params })
  return data
}

/**
 * Get upcoming departures
 */
export async function getUpcomingDepartures(params = {}) {
  const { data } = await api.get(`${BASE_URL}/departures/upcoming`, { params })
  return data
}

// =====================
// EXTRA OPERATIONS
// =====================

/**
 * Get all extras
 */
export async function getExtras(params = {}) {
  const { data } = await api.get(`${BASE_URL}/extras`, { params })
  return data
}

/**
 * Get single extra by ID
 */
export async function getExtra(id) {
  const { data } = await api.get(`${BASE_URL}/extras/${id}`)
  return data
}

/**
 * Create new extra
 */
export async function createExtra(payload) {
  const { data } = await api.post(`${BASE_URL}/extras`, payload)
  return data
}

/**
 * Update extra
 */
export async function updateExtra(id, payload) {
  const { data } = await api.put(`${BASE_URL}/extras/${id}`, payload)
  return data
}

/**
 * Delete extra
 */
export async function deleteExtra(id) {
  const { data } = await api.delete(`${BASE_URL}/extras/${id}`)
  return data
}

// =====================
// BOOKING OPERATIONS
// =====================

/**
 * Get all bookings with filters
 */
export async function getBookings(params = {}) {
  const { data } = await api.get(`${BASE_URL}/bookings`, { params })
  return data
}

/**
 * Get upcoming bookings
 */
export async function getUpcomingBookings(params = {}) {
  const { data } = await api.get(`${BASE_URL}/bookings/upcoming`, { params })
  return data
}

/**
 * Calculate booking price
 */
export async function calculatePrice(payload) {
  const { data } = await api.post(`${BASE_URL}/bookings/calculate-price`, payload)
  return data
}

/**
 * Get single booking by ID
 */
export async function getBooking(id) {
  const { data } = await api.get(`${BASE_URL}/bookings/${id}`)
  return data
}

/**
 * Create new booking
 */
export async function createBooking(payload) {
  const { data } = await api.post(`${BASE_URL}/bookings`, payload)
  return data
}

/**
 * Update booking
 */
export async function updateBooking(id, payload) {
  const { data } = await api.put(`${BASE_URL}/bookings/${id}`, payload)
  return data
}

/**
 * Update booking status
 */
export async function updateBookingStatus(id, status) {
  const { data } = await api.patch(`${BASE_URL}/bookings/${id}/status`, { status })
  return data
}

/**
 * Cancel booking
 */
export async function cancelBooking(id, payload = {}) {
  const { data } = await api.post(`${BASE_URL}/bookings/${id}/cancel`, payload)
  return data
}

/**
 * Add payment to booking
 */
export async function addBookingPayment(id, payload) {
  const { data } = await api.post(`${BASE_URL}/bookings/${id}/payments`, payload)
  return data
}

/**
 * Update visa status for a passenger
 */
export async function updateVisaStatus(bookingId, passengerIndex, payload) {
  const { data } = await api.post(`${BASE_URL}/bookings/${bookingId}/visa/${passengerIndex}`, payload)
  return data
}

/**
 * Add note to booking
 */
export async function addBookingNote(id, payload) {
  const { data } = await api.post(`${BASE_URL}/bookings/${id}/notes`, payload)
  return data
}

// =====================
// HELPER FUNCTIONS
// =====================

/**
 * Get tour types for dropdown
 */
export function getTourTypes() {
  return [
    { value: 'package', label: 'tour.tourTypes.package' },
    { value: 'day_trip', label: 'tour.tourTypes.day_trip' },
    { value: 'multi_day', label: 'tour.tourTypes.multi_day' },
    { value: 'cruise', label: 'tour.tourTypes.cruise' },
    { value: 'cultural', label: 'tour.tourTypes.cultural' },
    { value: 'adventure', label: 'tour.tourTypes.adventure' },
    { value: 'religious', label: 'tour.tourTypes.religious' },
    { value: 'nature', label: 'tour.tourTypes.nature' },
    { value: 'city_break', label: 'tour.tourTypes.city_break' }
  ]
}

/**
 * Get transportation types for dropdown
 */
export function getTransportationTypes() {
  return [
    { value: 'flight', label: 'tour.transportTypes.flight' },
    { value: 'bus', label: 'tour.transportTypes.bus' },
    { value: 'ferry', label: 'tour.transportTypes.ferry' },
    { value: 'car', label: 'tour.transportTypes.car' },
    { value: 'train', label: 'tour.transportTypes.train' },
    { value: 'combined', label: 'tour.transportTypes.combined' }
  ]
}

/**
 * Get meal plan types for dropdown
 */
export function getMealPlans() {
  return [
    { value: 'room_only', label: 'tour.mealPlans.room_only' },
    { value: 'bed_breakfast', label: 'tour.mealPlans.bed_breakfast' },
    { value: 'half_board', label: 'tour.mealPlans.half_board' },
    { value: 'full_board', label: 'tour.mealPlans.full_board' },
    { value: 'all_inclusive', label: 'tour.mealPlans.all_inclusive' },
    { value: 'ultra_all_inclusive', label: 'tour.mealPlans.ultra_all_inclusive' }
  ]
}

/**
 * Get extra categories for dropdown
 */
export function getExtraCategories() {
  return [
    { value: 'activity', label: 'tour.extraCategories.activity' },
    { value: 'meal', label: 'tour.extraCategories.meal' },
    { value: 'transfer', label: 'tour.extraCategories.transfer' },
    { value: 'upgrade', label: 'tour.extraCategories.upgrade' },
    { value: 'visa', label: 'tour.extraCategories.visa' },
    { value: 'insurance', label: 'tour.extraCategories.insurance' },
    { value: 'equipment', label: 'tour.extraCategories.equipment' },
    { value: 'other', label: 'tour.extraCategories.other' }
  ]
}

/**
 * Get booking statuses for dropdown
 */
export function getBookingStatuses() {
  return [
    { value: 'draft', label: 'tour.bookingStatuses.draft' },
    { value: 'pending', label: 'tour.bookingStatuses.pending' },
    { value: 'confirmed', label: 'tour.bookingStatuses.confirmed' },
    { value: 'cancelled', label: 'tour.bookingStatuses.cancelled' },
    { value: 'completed', label: 'tour.bookingStatuses.completed' },
    { value: 'no_show', label: 'tour.bookingStatuses.no_show' }
  ]
}

/**
 * Get departure statuses for dropdown
 */
export function getDepartureStatuses() {
  return [
    { value: 'scheduled', label: 'tour.departureStatuses.scheduled' },
    { value: 'confirmed', label: 'tour.departureStatuses.confirmed' },
    { value: 'cancelled', label: 'tour.departureStatuses.cancelled' },
    { value: 'completed', label: 'tour.departureStatuses.completed' },
    { value: 'sold_out', label: 'tour.departureStatuses.sold_out' }
  ]
}

/**
 * Get visa statuses for dropdown
 */
export function getVisaStatuses() {
  return [
    { value: 'not_required', label: 'tour.visaStatuses.not_required' },
    { value: 'pending_documents', label: 'tour.visaStatuses.pending_documents' },
    { value: 'documents_received', label: 'tour.visaStatuses.documents_received' },
    { value: 'submitted', label: 'tour.visaStatuses.submitted' },
    { value: 'appointment_scheduled', label: 'tour.visaStatuses.appointment_scheduled' },
    { value: 'approved', label: 'tour.visaStatuses.approved' },
    { value: 'rejected', label: 'tour.visaStatuses.rejected' }
  ]
}

export default {
  // Tours
  getTours,
  getTourStats,
  getTour,
  createTour,
  updateTour,
  deleteTour,
  duplicateTour,
  // Departures
  getDepartures,
  createDeparture,
  bulkCreateDepartures,
  getDeparture,
  updateDeparture,
  deleteDeparture,
  searchDepartures,
  checkAvailability,
  getUpcomingDepartures,
  // Extras
  getExtras,
  getExtra,
  createExtra,
  updateExtra,
  deleteExtra,
  // Bookings
  getBookings,
  getUpcomingBookings,
  calculatePrice,
  getBooking,
  createBooking,
  updateBooking,
  updateBookingStatus,
  cancelBooking,
  addBookingPayment,
  updateVisaStatus,
  addBookingNote,
  // Helpers
  getTourTypes,
  getTransportationTypes,
  getMealPlans,
  getExtraCategories,
  getBookingStatuses,
  getDepartureStatuses,
  getVisaStatuses
}
