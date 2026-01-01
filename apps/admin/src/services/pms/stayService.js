import pmsApiClient from './pmsApi'

const BASE_URL = '/pms/hotels'

/**
 * Stay status enum
 */
export const STAY_STATUS = {
  PENDING: 'pending',
  CHECKED_IN: 'checked_in',
  CHECKED_OUT: 'checked_out',
  NO_SHOW: 'no_show',
  CANCELLED: 'cancelled'
}

/**
 * Payment status enum
 */
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PARTIAL: 'partial',
  PAID: 'paid',
  REFUNDED: 'refunded'
}

/**
 * Guest type enum
 */
export const GUEST_TYPE = {
  ADULT: 'adult',
  CHILD: 'child',
  INFANT: 'infant'
}

/**
 * Stay status display info
 */
export const STAY_STATUS_INFO = {
  [STAY_STATUS.PENDING]: {
    label: 'Giriş Bekliyor',
    color: 'blue',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    textColor: 'text-blue-700 dark:text-blue-400',
    icon: 'schedule'
  },
  [STAY_STATUS.CHECKED_IN]: {
    label: 'Konaklıyor',
    color: 'green',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    textColor: 'text-green-700 dark:text-green-400',
    icon: 'hotel'
  },
  [STAY_STATUS.CHECKED_OUT]: {
    label: 'Çıkış Yaptı',
    color: 'gray',
    bgColor: 'bg-gray-100 dark:bg-gray-700',
    textColor: 'text-gray-700 dark:text-gray-300',
    icon: 'logout'
  },
  [STAY_STATUS.NO_SHOW]: {
    label: 'Gelmedi',
    color: 'red',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    textColor: 'text-red-700 dark:text-red-400',
    icon: 'person_off'
  },
  [STAY_STATUS.CANCELLED]: {
    label: 'İptal',
    color: 'orange',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    textColor: 'text-orange-700 dark:text-orange-400',
    icon: 'cancel'
  }
}

/**
 * Payment status display info
 */
export const PAYMENT_STATUS_INFO = {
  [PAYMENT_STATUS.PENDING]: {
    label: 'Ödeme Bekliyor',
    color: 'amber',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    textColor: 'text-amber-700 dark:text-amber-400'
  },
  [PAYMENT_STATUS.PARTIAL]: {
    label: 'Kısmi Ödeme',
    color: 'blue',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    textColor: 'text-blue-700 dark:text-blue-400'
  },
  [PAYMENT_STATUS.PAID]: {
    label: 'Ödendi',
    color: 'green',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    textColor: 'text-green-700 dark:text-green-400'
  },
  [PAYMENT_STATUS.REFUNDED]: {
    label: 'İade Edildi',
    color: 'purple',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    textColor: 'text-purple-700 dark:text-purple-400'
  }
}

/**
 * Payment methods
 */
export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Nakit' },
  { value: 'credit_card', label: 'Kredi Kartı' },
  { value: 'debit_card', label: 'Banka Kartı' },
  { value: 'bank_transfer', label: 'Havale/EFT' },
  { value: 'online', label: 'Online Ödeme' },
  { value: 'other', label: 'Diğer' }
]

/**
 * Extra charge categories
 */
export const EXTRA_CATEGORIES = [
  { value: 'minibar', label: 'Minibar' },
  { value: 'room_service', label: 'Oda Servisi' },
  { value: 'laundry', label: 'Çamaşırhane' },
  { value: 'spa', label: 'SPA' },
  { value: 'restaurant', label: 'Restoran' },
  { value: 'phone', label: 'Telefon' },
  { value: 'damage', label: 'Hasar' },
  { value: 'other', label: 'Diğer' }
]

/**
 * Get all stays
 */
export const getStays = async (hotelId, params = {}) => {
  const response = await pmsApiClient.get(`${BASE_URL}/${hotelId}/stays`, { params })
  return response.data
}

/**
 * Get single stay
 */
export const getStay = async (hotelId, stayId) => {
  const response = await pmsApiClient.get(`${BASE_URL}/${hotelId}/stays/${stayId}`)
  return response.data
}

/**
 * Get front desk statistics
 */
export const getFrontDeskStats = async (hotelId) => {
  const response = await pmsApiClient.get(`${BASE_URL}/${hotelId}/stays/stats`)
  return response.data
}

/**
 * Get today's activity
 */
export const getTodayActivity = async (hotelId) => {
  const response = await pmsApiClient.get(`${BASE_URL}/${hotelId}/stays/today`)
  return response.data
}

/**
 * Get active stays
 */
export const getActiveStays = async (hotelId) => {
  const response = await pmsApiClient.get(`${BASE_URL}/${hotelId}/stays/active`)
  return response.data
}

/**
 * Get available rooms for check-in
 */
export const getAvailableRooms = async (hotelId, params = {}) => {
  const response = await pmsApiClient.get(`${BASE_URL}/${hotelId}/stays/available-rooms`, { params })
  return response.data
}

/**
 * Walk-in check-in
 */
export const walkInCheckIn = async (hotelId, data) => {
  const response = await pmsApiClient.post(`${BASE_URL}/${hotelId}/stays/walk-in`, data)
  return response.data
}

/**
 * Check-in from booking
 */
export const checkInFromBooking = async (hotelId, data) => {
  const response = await pmsApiClient.post(`${BASE_URL}/${hotelId}/stays/check-in`, data)
  return response.data
}

/**
 * Check-in from pending stay (auto-created from booking confirmation or PMS reservation)
 */
export const checkInFromStay = async (hotelId, stayId, data) => {
  const response = await pmsApiClient.patch(`${BASE_URL}/${hotelId}/stays/${stayId}/check-in`, data)
  return response.data
}

/**
 * Check-out
 */
export const checkOut = async (hotelId, stayId, data = {}) => {
  const response = await pmsApiClient.post(`${BASE_URL}/${hotelId}/stays/${stayId}/check-out`, data)
  return response.data
}

/**
 * Add extra charge
 */
export const addExtra = async (hotelId, stayId, data) => {
  const response = await pmsApiClient.post(`${BASE_URL}/${hotelId}/stays/${stayId}/extras`, data)
  return response.data
}

/**
 * Add payment
 */
export const addPayment = async (hotelId, stayId, data) => {
  const response = await pmsApiClient.post(`${BASE_URL}/${hotelId}/stays/${stayId}/payments`, data)
  return response.data
}

/**
 * Change room
 */
export const changeRoom = async (hotelId, stayId, data) => {
  const response = await pmsApiClient.post(`${BASE_URL}/${hotelId}/stays/${stayId}/change-room`, data)
  return response.data
}

/**
 * Extend stay
 */
export const extendStay = async (hotelId, stayId, data) => {
  const response = await pmsApiClient.post(`${BASE_URL}/${hotelId}/stays/${stayId}/extend`, data)
  return response.data
}

/**
 * Update notes
 */
export const updateNotes = async (hotelId, stayId, data) => {
  const response = await pmsApiClient.patch(`${BASE_URL}/${hotelId}/stays/${stayId}/notes`, data)
  return response.data
}

export default {
  getStays,
  getStay,
  getFrontDeskStats,
  getTodayActivity,
  getActiveStays,
  getAvailableRooms,
  walkInCheckIn,
  checkInFromBooking,
  checkInFromStay,
  checkOut,
  addExtra,
  addPayment,
  changeRoom,
  extendStay,
  updateNotes,
  STAY_STATUS,
  PAYMENT_STATUS,
  GUEST_TYPE,
  STAY_STATUS_INFO,
  PAYMENT_STATUS_INFO,
  PAYMENT_METHODS,
  EXTRA_CATEGORIES
}
