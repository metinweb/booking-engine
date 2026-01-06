/**
 * Centralized Status Helpers
 * Status badge classes and utilities used across the application
 */

// ==================== STATUS CLASS MAPPINGS ====================

/**
 * General status badge classes (background + text)
 */
export const STATUS_CLASSES = {
  // Common statuses
  active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400',
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  suspended: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',

  // Booking statuses
  draft: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  confirmed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  completed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  expired: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300',
  no_show: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  amended: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',

  // Payment statuses
  paid: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  unpaid: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  partial: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  refunded: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',

  // Hotel statuses
  open: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  closed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  maintenance: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',

  // Priority/Severity
  low: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  critical: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',

  // Boolean states
  enabled: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  disabled: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',

  // Default fallback
  default: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
}

/**
 * Status dot/indicator classes (solid colors)
 */
export const STATUS_DOT_CLASSES = {
  active: 'bg-green-500',
  inactive: 'bg-gray-500',
  pending: 'bg-yellow-500',
  suspended: 'bg-red-500',
  draft: 'bg-purple-500',
  confirmed: 'bg-green-500',
  completed: 'bg-blue-500',
  cancelled: 'bg-red-500',
  expired: 'bg-gray-500',
  no_show: 'bg-orange-500',
  amended: 'bg-indigo-500',
  paid: 'bg-green-500',
  unpaid: 'bg-red-500',
  partial: 'bg-yellow-500',
  refunded: 'bg-purple-500',
  open: 'bg-green-500',
  closed: 'bg-red-500',
  maintenance: 'bg-orange-500',
  low: 'bg-blue-500',
  medium: 'bg-yellow-500',
  high: 'bg-orange-500',
  critical: 'bg-red-500',
  enabled: 'bg-green-500',
  disabled: 'bg-gray-500',
  default: 'bg-gray-500'
}

/**
 * Status icon mappings (Heroicons names)
 */
export const STATUS_ICONS = {
  active: 'CheckCircleIcon',
  inactive: 'MinusCircleIcon',
  pending: 'ClockIcon',
  suspended: 'ExclamationCircleIcon',
  draft: 'PencilIcon',
  confirmed: 'CheckBadgeIcon',
  completed: 'CheckIcon',
  cancelled: 'XCircleIcon',
  expired: 'ClockIcon',
  no_show: 'UserMinusIcon',
  amended: 'PencilSquareIcon',
  paid: 'BanknotesIcon',
  unpaid: 'ExclamationTriangleIcon',
  partial: 'ArrowPathIcon',
  refunded: 'ArrowUturnLeftIcon'
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Get status badge class
 * @param {string} status - Status value
 * @param {string} fallback - Fallback class
 */
export const getStatusClass = (status, fallback = 'default') => {
  return STATUS_CLASSES[status] || STATUS_CLASSES[fallback]
}

/**
 * Get status dot class
 * @param {string} status - Status value
 * @param {string} fallback - Fallback class
 */
export const getStatusDotClass = (status, fallback = 'default') => {
  return STATUS_DOT_CLASSES[status] || STATUS_DOT_CLASSES[fallback]
}

/**
 * Get status icon name
 * @param {string} status - Status value
 */
export const getStatusIcon = status => {
  return STATUS_ICONS[status] || 'InformationCircleIcon'
}

/**
 * Get credit bar class based on percentage
 * @param {number} percentage - Available credit percentage (0-100)
 */
export const getCreditBarClass = percentage => {
  if (percentage < 20) return 'bg-red-500'
  if (percentage < 50) return 'bg-yellow-500'
  return 'bg-green-500'
}

/**
 * Calculate credit percentage
 * @param {object} creditLimit - Credit limit object { amount, used }
 */
export const getCreditPercentage = creditLimit => {
  if (!creditLimit?.amount) return 0
  const available = creditLimit.amount - (creditLimit.used || 0)
  return Math.round((available / creditLimit.amount) * 100)
}

/**
 * Get available credit amount
 * @param {object} creditLimit - Credit limit object { amount, used }
 */
export const getAvailableCredit = creditLimit => {
  if (!creditLimit?.amount) return 0
  return creditLimit.amount - (creditLimit.used || 0)
}

/**
 * Get progress bar color based on value
 * @param {number} value - Current value (0-100)
 * @param {object} thresholds - Threshold configuration
 */
export const getProgressBarClass = (value, thresholds = { danger: 20, warning: 50 }) => {
  if (value < thresholds.danger) return 'bg-red-500'
  if (value < thresholds.warning) return 'bg-yellow-500'
  return 'bg-green-500'
}

/**
 * Get boolean status class
 * @param {boolean} value - Boolean value
 */
export const getBooleanStatusClass = value => {
  return value ? STATUS_CLASSES.enabled : STATUS_CLASSES.disabled
}

/**
 * Get boolean dot class
 * @param {boolean} value - Boolean value
 */
export const getBooleanDotClass = value => {
  return value ? STATUS_DOT_CLASSES.enabled : STATUS_DOT_CLASSES.disabled
}

// ==================== LABEL KEYS (for i18n) ====================

/**
 * Status label translation keys
 * Usage: t(STATUS_LABEL_KEYS[status])
 */
export const STATUS_LABEL_KEYS = {
  // Common
  active: 'common.active',
  inactive: 'common.inactive',
  pending: 'common.pending',
  suspended: 'common.suspended',

  // Booking
  draft: 'booking.status.draft',
  confirmed: 'booking.status.confirmed',
  completed: 'booking.status.completed',
  cancelled: 'booking.status.cancelled',
  expired: 'booking.status.expired',
  no_show: 'booking.status.noShow',
  amended: 'booking.status.amended',

  // Payment
  paid: 'payment.status.paid',
  unpaid: 'payment.status.unpaid',
  partial: 'payment.status.partial',
  refunded: 'payment.status.refunded',

  // Hotel
  open: 'hotel.status.open',
  closed: 'hotel.status.closed',
  maintenance: 'hotel.status.maintenance',

  // Boolean
  enabled: 'common.enabled',
  disabled: 'common.disabled'
}

/**
 * Get status label key for i18n
 * @param {string} status - Status value
 * @param {string} fallback - Fallback key
 */
export const getStatusLabelKey = (status, fallback = 'common.unknown') => {
  return STATUS_LABEL_KEYS[status] || fallback
}
