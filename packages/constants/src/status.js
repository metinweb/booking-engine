/**
 * Status Constants
 * Centralized status definitions for various entities
 */

// Generic entity status (Partner, Agency, User, Hotel)
export const ENTITY_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending',
  SUSPENDED: 'suspended'
}

// Entity status values as array
export const ENTITY_STATUS_VALUES = Object.values(ENTITY_STATUS)

// Room status (PMS)
export const ROOM_STATUS = {
  AVAILABLE: 'available',
  OCCUPIED: 'occupied',
  RESERVED: 'reserved',
  BLOCKED: 'blocked',
  OUT_OF_ORDER: 'out_of_order',
  OUT_OF_SERVICE: 'out_of_service'
}

// Room status values as array
export const ROOM_STATUS_VALUES = Object.values(ROOM_STATUS)

// Housekeeping status
export const HOUSEKEEPING_STATUS = {
  CLEAN: 'clean',
  DIRTY: 'dirty',
  INSPECTED: 'inspected',
  IN_PROGRESS: 'in_progress',
  DO_NOT_DISTURB: 'do_not_disturb'
}

// Housekeeping status values as array
export const HOUSEKEEPING_STATUS_VALUES = Object.values(HOUSEKEEPING_STATUS)

// Stay status (PMS guest stays)
export const STAY_STATUS = {
  RESERVED: 'reserved',
  CHECKED_IN: 'checked_in',
  CHECKED_OUT: 'checked_out',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show'
}

// Stay status values as array
export const STAY_STATUS_VALUES = Object.values(STAY_STATUS)

// Status labels (Turkish)
export const ENTITY_STATUS_LABELS_TR = {
  [ENTITY_STATUS.ACTIVE]: 'Aktif',
  [ENTITY_STATUS.INACTIVE]: 'Pasif',
  [ENTITY_STATUS.PENDING]: 'Beklemede',
  [ENTITY_STATUS.SUSPENDED]: 'Askıda'
}

// Status labels (English)
export const ENTITY_STATUS_LABELS_EN = {
  [ENTITY_STATUS.ACTIVE]: 'Active',
  [ENTITY_STATUS.INACTIVE]: 'Inactive',
  [ENTITY_STATUS.PENDING]: 'Pending',
  [ENTITY_STATUS.SUSPENDED]: 'Suspended'
}

// Room status labels (Turkish)
export const ROOM_STATUS_LABELS_TR = {
  [ROOM_STATUS.AVAILABLE]: 'Müsait',
  [ROOM_STATUS.OCCUPIED]: 'Dolu',
  [ROOM_STATUS.RESERVED]: 'Rezerveli',
  [ROOM_STATUS.BLOCKED]: 'Blokeli',
  [ROOM_STATUS.OUT_OF_ORDER]: 'Arızalı',
  [ROOM_STATUS.OUT_OF_SERVICE]: 'Servis Dışı'
}

// Room status labels (English)
export const ROOM_STATUS_LABELS_EN = {
  [ROOM_STATUS.AVAILABLE]: 'Available',
  [ROOM_STATUS.OCCUPIED]: 'Occupied',
  [ROOM_STATUS.RESERVED]: 'Reserved',
  [ROOM_STATUS.BLOCKED]: 'Blocked',
  [ROOM_STATUS.OUT_OF_ORDER]: 'Out of Order',
  [ROOM_STATUS.OUT_OF_SERVICE]: 'Out of Service'
}

// Housekeeping status labels (Turkish)
export const HOUSEKEEPING_STATUS_LABELS_TR = {
  [HOUSEKEEPING_STATUS.CLEAN]: 'Temiz',
  [HOUSEKEEPING_STATUS.DIRTY]: 'Kirli',
  [HOUSEKEEPING_STATUS.INSPECTED]: 'Kontrol Edildi',
  [HOUSEKEEPING_STATUS.IN_PROGRESS]: 'Temizleniyor',
  [HOUSEKEEPING_STATUS.DO_NOT_DISTURB]: 'Rahatsız Etmeyin'
}

// Housekeeping status labels (English)
export const HOUSEKEEPING_STATUS_LABELS_EN = {
  [HOUSEKEEPING_STATUS.CLEAN]: 'Clean',
  [HOUSEKEEPING_STATUS.DIRTY]: 'Dirty',
  [HOUSEKEEPING_STATUS.INSPECTED]: 'Inspected',
  [HOUSEKEEPING_STATUS.IN_PROGRESS]: 'In Progress',
  [HOUSEKEEPING_STATUS.DO_NOT_DISTURB]: 'Do Not Disturb'
}

// Stay status labels (Turkish)
export const STAY_STATUS_LABELS_TR = {
  [STAY_STATUS.RESERVED]: 'Rezerve',
  [STAY_STATUS.CHECKED_IN]: 'Giriş Yaptı',
  [STAY_STATUS.CHECKED_OUT]: 'Çıkış Yaptı',
  [STAY_STATUS.CANCELLED]: 'İptal',
  [STAY_STATUS.NO_SHOW]: 'Gelmedi'
}

// Stay status labels (English)
export const STAY_STATUS_LABELS_EN = {
  [STAY_STATUS.RESERVED]: 'Reserved',
  [STAY_STATUS.CHECKED_IN]: 'Checked In',
  [STAY_STATUS.CHECKED_OUT]: 'Checked Out',
  [STAY_STATUS.CANCELLED]: 'Cancelled',
  [STAY_STATUS.NO_SHOW]: 'No Show'
}

// Status colors for UI
export const STATUS_COLORS = {
  [ENTITY_STATUS.ACTIVE]: 'green',
  [ENTITY_STATUS.INACTIVE]: 'gray',
  [ENTITY_STATUS.PENDING]: 'yellow',
  [ENTITY_STATUS.SUSPENDED]: 'red'
}

export const ROOM_STATUS_COLORS = {
  [ROOM_STATUS.AVAILABLE]: 'green',
  [ROOM_STATUS.OCCUPIED]: 'red',
  [ROOM_STATUS.RESERVED]: 'blue',
  [ROOM_STATUS.BLOCKED]: 'yellow',
  [ROOM_STATUS.OUT_OF_ORDER]: 'orange',
  [ROOM_STATUS.OUT_OF_SERVICE]: 'gray'
}

export const HOUSEKEEPING_STATUS_COLORS = {
  [HOUSEKEEPING_STATUS.CLEAN]: 'green',
  [HOUSEKEEPING_STATUS.DIRTY]: 'red',
  [HOUSEKEEPING_STATUS.INSPECTED]: 'blue',
  [HOUSEKEEPING_STATUS.IN_PROGRESS]: 'yellow',
  [HOUSEKEEPING_STATUS.DO_NOT_DISTURB]: 'purple'
}

/**
 * Get entity status label
 * @param {string} status - Status key
 * @param {string} locale - Locale ('tr' or 'en')
 * @returns {string} - Localized label
 */
export function getEntityStatusLabel(status, locale = 'tr') {
  const labels = locale === 'tr' ? ENTITY_STATUS_LABELS_TR : ENTITY_STATUS_LABELS_EN
  return labels[status] || status
}

/**
 * Get room status label
 * @param {string} status - Status key
 * @param {string} locale - Locale ('tr' or 'en')
 * @returns {string} - Localized label
 */
export function getRoomStatusLabel(status, locale = 'tr') {
  const labels = locale === 'tr' ? ROOM_STATUS_LABELS_TR : ROOM_STATUS_LABELS_EN
  return labels[status] || status
}

/**
 * Get housekeeping status label
 * @param {string} status - Status key
 * @param {string} locale - Locale ('tr' or 'en')
 * @returns {string} - Localized label
 */
export function getHousekeepingStatusLabel(status, locale = 'tr') {
  const labels = locale === 'tr' ? HOUSEKEEPING_STATUS_LABELS_TR : HOUSEKEEPING_STATUS_LABELS_EN
  return labels[status] || status
}

/**
 * Get stay status label
 * @param {string} status - Status key
 * @param {string} locale - Locale ('tr' or 'en')
 * @returns {string} - Localized label
 */
export function getStayStatusLabel(status, locale = 'tr') {
  const labels = locale === 'tr' ? STAY_STATUS_LABELS_TR : STAY_STATUS_LABELS_EN
  return labels[status] || status
}
