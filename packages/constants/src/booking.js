/**
 * Booking Constants
 * Centralized booking status and type definitions for the booking engine
 */

// Booking status
export const BOOKING_STATUS = {
  DRAFT: 'draft',
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
  NO_SHOW: 'no_show'
}

// Booking status values as array
export const BOOKING_STATUS_VALUES = Object.values(BOOKING_STATUS)

// Booking sources
export const BOOKING_SOURCES = {
  DIRECT: 'direct',
  WEBSITE: 'website',
  PHONE: 'phone',
  EMAIL: 'email',
  WALK_IN: 'walk_in',
  OTA: 'ota',
  AGENCY: 'agency',
  CORPORATE: 'corporate',
  GDS: 'gds',
  OTHER: 'other'
}

// Booking source values as array
export const BOOKING_SOURCE_VALUES = Object.values(BOOKING_SOURCES)

// Booking types
export const BOOKING_TYPES = {
  INDIVIDUAL: 'individual',
  GROUP: 'group',
  CORPORATE: 'corporate',
  PACKAGE: 'package'
}

// Booking type values as array
export const BOOKING_TYPE_VALUES = Object.values(BOOKING_TYPES)

// Booking status labels (Turkish)
export const BOOKING_STATUS_LABELS_TR = {
  [BOOKING_STATUS.DRAFT]: 'Taslak',
  [BOOKING_STATUS.PENDING]: 'Beklemede',
  [BOOKING_STATUS.CONFIRMED]: 'Onaylı',
  [BOOKING_STATUS.CANCELLED]: 'İptal',
  [BOOKING_STATUS.COMPLETED]: 'Tamamlandı',
  [BOOKING_STATUS.NO_SHOW]: 'Gelmedi'
}

// Booking status labels (English)
export const BOOKING_STATUS_LABELS_EN = {
  [BOOKING_STATUS.DRAFT]: 'Draft',
  [BOOKING_STATUS.PENDING]: 'Pending',
  [BOOKING_STATUS.CONFIRMED]: 'Confirmed',
  [BOOKING_STATUS.CANCELLED]: 'Cancelled',
  [BOOKING_STATUS.COMPLETED]: 'Completed',
  [BOOKING_STATUS.NO_SHOW]: 'No Show'
}

// Booking source labels (Turkish)
export const BOOKING_SOURCE_LABELS_TR = {
  [BOOKING_SOURCES.DIRECT]: 'Direkt',
  [BOOKING_SOURCES.WEBSITE]: 'Web Sitesi',
  [BOOKING_SOURCES.PHONE]: 'Telefon',
  [BOOKING_SOURCES.EMAIL]: 'E-posta',
  [BOOKING_SOURCES.WALK_IN]: 'Walk-in',
  [BOOKING_SOURCES.OTA]: 'OTA',
  [BOOKING_SOURCES.AGENCY]: 'Acente',
  [BOOKING_SOURCES.CORPORATE]: 'Kurumsal',
  [BOOKING_SOURCES.GDS]: 'GDS',
  [BOOKING_SOURCES.OTHER]: 'Diğer'
}

// Booking source labels (English)
export const BOOKING_SOURCE_LABELS_EN = {
  [BOOKING_SOURCES.DIRECT]: 'Direct',
  [BOOKING_SOURCES.WEBSITE]: 'Website',
  [BOOKING_SOURCES.PHONE]: 'Phone',
  [BOOKING_SOURCES.EMAIL]: 'Email',
  [BOOKING_SOURCES.WALK_IN]: 'Walk-in',
  [BOOKING_SOURCES.OTA]: 'OTA',
  [BOOKING_SOURCES.AGENCY]: 'Agency',
  [BOOKING_SOURCES.CORPORATE]: 'Corporate',
  [BOOKING_SOURCES.GDS]: 'GDS',
  [BOOKING_SOURCES.OTHER]: 'Other'
}

// Status colors for UI
export const BOOKING_STATUS_COLORS = {
  [BOOKING_STATUS.DRAFT]: 'gray',
  [BOOKING_STATUS.PENDING]: 'yellow',
  [BOOKING_STATUS.CONFIRMED]: 'green',
  [BOOKING_STATUS.CANCELLED]: 'red',
  [BOOKING_STATUS.COMPLETED]: 'blue',
  [BOOKING_STATUS.NO_SHOW]: 'orange'
}

/**
 * Get booking status label
 * @param {string} status - Booking status key
 * @param {string} locale - Locale ('tr' or 'en')
 * @returns {string} - Localized label
 */
export function getBookingStatusLabel(status, locale = 'tr') {
  const labels = locale === 'tr' ? BOOKING_STATUS_LABELS_TR : BOOKING_STATUS_LABELS_EN
  return labels[status] || status
}

/**
 * Get booking source label
 * @param {string} source - Booking source key
 * @param {string} locale - Locale ('tr' or 'en')
 * @returns {string} - Localized label
 */
export function getBookingSourceLabel(source, locale = 'tr') {
  const labels = locale === 'tr' ? BOOKING_SOURCE_LABELS_TR : BOOKING_SOURCE_LABELS_EN
  return labels[source] || source
}

/**
 * Get status color class
 * @param {string} status - Booking status
 * @returns {string} - Color name
 */
export function getBookingStatusColor(status) {
  return BOOKING_STATUS_COLORS[status] || 'gray'
}
