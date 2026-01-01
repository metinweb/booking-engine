/**
 * PMS Reservation Service
 * Frontend API client for PMS reservation management
 */

import pmsApiClient from './pmsApi'

// Reservation status constants
export const RESERVATION_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
  NO_SHOW: 'no_show'
}

// Status display info
export const RESERVATION_STATUS_INFO = {
  pending: {
    label: 'Bekliyor',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
    darkBgColor: 'dark:bg-yellow-900/30',
    darkTextColor: 'dark:text-yellow-300',
    icon: 'pending'
  },
  confirmed: {
    label: 'Onaylandi',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800',
    darkBgColor: 'dark:bg-green-900/30',
    darkTextColor: 'dark:text-green-300',
    icon: 'check_circle'
  },
  cancelled: {
    label: 'Iptal',
    bgColor: 'bg-red-100',
    textColor: 'text-red-800',
    darkBgColor: 'dark:bg-red-900/30',
    darkTextColor: 'dark:text-red-300',
    icon: 'cancel'
  },
  completed: {
    label: 'Tamamlandi',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    darkBgColor: 'dark:bg-blue-900/30',
    darkTextColor: 'dark:text-blue-300',
    icon: 'task_alt'
  },
  no_show: {
    label: 'Gelmedi',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-800',
    darkBgColor: 'dark:bg-gray-700',
    darkTextColor: 'dark:text-gray-300',
    icon: 'person_off'
  }
}

// Payment status constants
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PARTIAL: 'partial',
  PAID: 'paid',
  REFUNDED: 'refunded'
}

export const PAYMENT_STATUS_INFO = {
  pending: {
    label: 'Odeme Bekleniyor',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800'
  },
  partial: {
    label: 'Kismi Odeme',
    bgColor: 'bg-orange-100',
    textColor: 'text-orange-800'
  },
  paid: {
    label: 'Odendi',
    bgColor: 'bg-green-100',
    textColor: 'text-green-800'
  },
  refunded: {
    label: 'Iade Edildi',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-800'
  }
}

// Payment methods
export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Nakit' },
  { value: 'credit_card', label: 'Kredi Karti' },
  { value: 'bank_transfer', label: 'Havale/EFT' },
  { value: 'online', label: 'Online Odeme' },
  { value: 'agency_credit', label: 'Acenta Kredisi' }
]

// Booking sources
export const BOOKING_SOURCES = {
  b2c: { label: 'B2C Web', icon: 'public' },
  b2b: { label: 'B2B / Acenta', icon: 'business' },
  admin: { label: 'PMS', icon: 'admin_panel_settings' },
  api: { label: 'API', icon: 'api' },
  channel: { label: 'Kanal', icon: 'hub' }
}

const reservationService = {
  // Get all reservations with filters
  async getReservations(hotelId, params = {}) {
    const response = await pmsApiClient.get(`/pms/hotels/${hotelId}/reservations`, { params })
    return response.data
  },

  // Get reservations by date range (for calendar)
  async getReservationsByDateRange(hotelId, startDate, endDate) {
    const response = await pmsApiClient.get(`/pms/hotels/${hotelId}/reservations/calendar`, {
      params: { startDate, endDate }
    })
    return response.data
  },

  // Get today's arrivals
  async getTodayArrivals(hotelId) {
    const response = await pmsApiClient.get(`/pms/hotels/${hotelId}/reservations/arrivals`)
    return response.data
  },

  // Get today's departures
  async getTodayDepartures(hotelId) {
    const response = await pmsApiClient.get(`/pms/hotels/${hotelId}/reservations/departures`)
    return response.data
  },

  // Get reservation statistics
  async getStats(hotelId) {
    const response = await pmsApiClient.get(`/pms/hotels/${hotelId}/reservations/stats`)
    return response.data
  },

  // Get single reservation
  async getReservation(hotelId, reservationId) {
    const response = await pmsApiClient.get(`/pms/hotels/${hotelId}/reservations/${reservationId}`)
    return response.data
  },

  // Create new reservation
  async create(hotelId, data) {
    const response = await pmsApiClient.post(`/pms/hotels/${hotelId}/reservations`, data)
    return response.data
  },

  // Update reservation
  async update(hotelId, reservationId, data) {
    const response = await pmsApiClient.put(`/pms/hotels/${hotelId}/reservations/${reservationId}`, data)
    return response.data
  },

  // Confirm reservation
  async confirm(hotelId, reservationId) {
    const response = await pmsApiClient.post(`/pms/hotels/${hotelId}/reservations/${reservationId}/confirm`)
    return response.data
  },

  // Cancel reservation
  async cancel(hotelId, reservationId, data) {
    const response = await pmsApiClient.post(`/pms/hotels/${hotelId}/reservations/${reservationId}/cancel`, data)
    return response.data
  },

  // Mark as no-show
  async markNoShow(hotelId, reservationId) {
    const response = await pmsApiClient.post(`/pms/hotels/${hotelId}/reservations/${reservationId}/no-show`)
    return response.data
  },

  // Add note
  async addNote(hotelId, reservationId, data) {
    const response = await pmsApiClient.post(`/pms/hotels/${hotelId}/reservations/${reservationId}/notes`, data)
    return response.data
  },

  // Add payment
  async addPayment(hotelId, reservationId, data) {
    const response = await pmsApiClient.post(`/pms/hotels/${hotelId}/reservations/${reservationId}/payments`, data)
    return response.data
  }
}

export default reservationService
