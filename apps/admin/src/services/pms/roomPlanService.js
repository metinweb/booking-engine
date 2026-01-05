/**
 * PMS Room Plan Service
 * Timeline view for room occupancy management
 */

import pmsApiClient from './pmsApi'

// ==========================================
// CONSTANTS
// ==========================================

export const STAY_STATUS = {
  CHECKED_IN: 'checked_in',
  CHECKED_OUT: 'checked_out',
  NO_SHOW: 'no_show',
  CANCELLED: 'cancelled'
}

export const STAY_STATUS_INFO = {
  checked_in: { label: 'Aktif', color: 'green', bgClass: 'bg-green-500' },
  checked_out: { label: 'Cikti', color: 'gray', bgClass: 'bg-gray-400' },
  no_show: { label: 'Gelmedi', color: 'red', bgClass: 'bg-red-400' },
  cancelled: { label: 'Iptal', color: 'gray', bgClass: 'bg-gray-300' }
}

export const RESERVATION_STATUS_INFO = {
  confirmed: { label: 'Onaylandi', color: 'blue', bgClass: 'bg-blue-400' },
  pending: { label: 'Bekliyor', color: 'amber', bgClass: 'bg-amber-400' }
}

// Zoom levels for timeline
export const ZOOM_LEVELS = {
  DAY: { name: 'day', label: 'Gun', daysVisible: 14, cellWidth: 80 },
  WEEK: { name: 'week', label: 'Hafta', daysVisible: 28, cellWidth: 40 },
  MONTH: { name: 'month', label: 'Ay', daysVisible: 42, cellWidth: 25 }
}

// ==========================================
// API FUNCTIONS
// ==========================================

/**
 * Get rooms with occupancy for timeline view
 * @param {string} hotelId - Hotel ID
 * @param {object} params - Query params (start, end dates)
 */
export const getRoomsWithOccupancy = async (hotelId, params = {}) => {
  const response = await pmsApiClient.get(`/pms/hotels/${hotelId}/room-plan`, { params })
  return response.data
}

/**
 * Change stay dates (horizontal drag)
 * @param {string} hotelId - Hotel ID
 * @param {string} stayId - Stay ID
 * @param {object} data - { newCheckIn, newCheckOut, reason }
 */
export const changeStayDates = async (hotelId, stayId, data) => {
  const response = await pmsApiClient.put(
    `/pms/hotels/${hotelId}/room-plan/stays/${stayId}/dates`,
    data
  )
  return response.data
}

/**
 * Move stay to different room (vertical drag)
 * @param {string} hotelId - Hotel ID
 * @param {string} stayId - Stay ID
 * @param {object} data - { newRoomId, newCheckIn?, newCheckOut?, reason }
 */
export const moveStayToRoom = async (hotelId, stayId, data) => {
  const response = await pmsApiClient.put(
    `/pms/hotels/${hotelId}/room-plan/stays/${stayId}/room`,
    data
  )
  return response.data
}

/**
 * Check room availability
 * @param {string} hotelId - Hotel ID
 * @param {string} roomId - Room ID
 * @param {object} params - { checkIn, checkOut, excludeStayId? }
 */
export const checkRoomAvailability = async (hotelId, roomId, params) => {
  const response = await pmsApiClient.get(
    `/pms/hotels/${hotelId}/room-plan/rooms/${roomId}/availability`,
    { params }
  )
  return response.data
}

// ==========================================
// TIMELINE CALCULATION UTILITIES
// ==========================================

/**
 * Calculate pixel position from date
 * @param {Date|string} date - Target date
 * @param {Date} startDate - Timeline start date
 * @param {number} cellWidth - Width per day in pixels
 */
export const dateToPixel = (date, startDate, cellWidth) => {
  const d = new Date(date)
  const start = new Date(startDate)
  start.setHours(0, 0, 0, 0)
  const diffDays = Math.floor((d - start) / (1000 * 60 * 60 * 24))
  return diffDays * cellWidth
}

/**
 * Calculate date from pixel position
 * @param {number} pixel - Pixel position
 * @param {Date} startDate - Timeline start date
 * @param {number} cellWidth - Width per day in pixels
 */
export const pixelToDate = (pixel, startDate, cellWidth) => {
  const days = Math.floor(pixel / cellWidth)
  const date = new Date(startDate)
  date.setDate(date.getDate() + days)
  return date
}

/**
 * Calculate bar width for a stay
 * @param {Date|string} checkIn - Check-in date
 * @param {Date|string} checkOut - Check-out date
 * @param {number} cellWidth - Width per day in pixels
 */
export const getBarWidth = (checkIn, checkOut, cellWidth) => {
  const inDate = new Date(checkIn)
  const outDate = new Date(checkOut)
  const nights = Math.ceil((outDate - inDate) / (1000 * 60 * 60 * 24))
  return Math.max(nights * cellWidth - 4, cellWidth - 4) // -4 for padding
}

/**
 * Calculate bar position (left offset)
 * @param {Date|string} checkIn - Check-in date
 * @param {Date} startDate - Timeline start date
 * @param {number} cellWidth - Width per day in pixels
 */
export const getBarPosition = (checkIn, startDate, cellWidth) => {
  return dateToPixel(checkIn, startDate, cellWidth) + 2 // +2 for padding
}

/**
 * Generate date array for timeline header
 * @param {Date} startDate - Start date
 * @param {number} daysCount - Number of days to generate
 */
export const generateDateArray = (startDate, daysCount) => {
  const dates = []
  const current = new Date(startDate)

  for (let i = 0; i < daysCount; i++) {
    dates.push({
      date: new Date(current),
      dayOfWeek: current.getDay(),
      dayOfMonth: current.getDate(),
      month: current.getMonth(),
      year: current.getFullYear(),
      isToday: isToday(current),
      isWeekend: current.getDay() === 0 || current.getDay() === 6
    })
    current.setDate(current.getDate() + 1)
  }

  return dates
}

/**
 * Check if date is today
 * @param {Date} date - Date to check
 */
export const isToday = date => {
  const today = new Date()
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  )
}

/**
 * Format date for display
 * @param {Date|string} date - Date to format
 * @param {string} format - 'short', 'long', 'day'
 */
export const formatDate = (date, format = 'short') => {
  const d = new Date(date)

  if (format === 'day') {
    return d.getDate().toString()
  }

  if (format === 'short') {
    return d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })
  }

  return d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })
}

/**
 * Get day name
 * @param {number} dayOfWeek - Day index (0-6)
 */
export const getDayName = dayOfWeek => {
  const days = ['Paz', 'Pzt', 'Sal', 'Car', 'Per', 'Cum', 'Cmt']
  return days[dayOfWeek]
}

/**
 * Get month name
 * @param {number} month - Month index (0-11)
 */
export const getMonthName = month => {
  const months = [
    'Ocak',
    'Subat',
    'Mart',
    'Nisan',
    'Mayis',
    'Haziran',
    'Temmuz',
    'Agustos',
    'Eylul',
    'Ekim',
    'Kasim',
    'Aralik'
  ]
  return months[month]
}

/**
 * Get status color class for stay/reservation bar
 * @param {object} item - Stay or reservation object
 */
export const getBarColorClass = item => {
  if (item.isVip) {
    return 'bg-amber-500 dark:bg-amber-600'
  }

  if (item.type === 'reservation') {
    return RESERVATION_STATUS_INFO[item.status]?.bgClass || 'bg-blue-400'
  }

  if (item.paymentStatus === 'pending') {
    return 'bg-red-400 dark:bg-red-500'
  }

  return STAY_STATUS_INFO[item.status]?.bgClass || 'bg-green-500'
}

export default {
  // Constants
  STAY_STATUS,
  STAY_STATUS_INFO,
  RESERVATION_STATUS_INFO,
  ZOOM_LEVELS,

  // API
  getRoomsWithOccupancy,
  changeStayDates,
  moveStayToRoom,
  checkRoomAvailability,

  // Calculations
  dateToPixel,
  pixelToDate,
  getBarWidth,
  getBarPosition,
  generateDateArray,
  isToday,
  formatDate,
  getDayName,
  getMonthName,
  getBarColorClass
}
