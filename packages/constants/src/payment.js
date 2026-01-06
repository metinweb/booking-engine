/**
 * Payment Constants
 * Centralized payment method definitions for the booking engine
 */

// Payment methods - unified from backend and frontend
export const PAYMENT_METHODS = {
  CASH: 'cash',
  CREDIT_CARD: 'credit_card',
  DEBIT_CARD: 'debit_card',
  BANK_TRANSFER: 'bank_transfer',
  ROOM_CHARGE: 'room_charge',
  CITY_LEDGER: 'city_ledger',
  VOUCHER: 'voucher',
  ONLINE: 'online',
  AGENCY: 'agency',
  OTHER: 'other'
}

// Payment method values as array
export const PAYMENT_METHOD_VALUES = Object.values(PAYMENT_METHODS)

// Payment method labels (Turkish)
export const PAYMENT_METHOD_LABELS_TR = {
  [PAYMENT_METHODS.CASH]: 'Nakit',
  [PAYMENT_METHODS.CREDIT_CARD]: 'Kredi Kartı',
  [PAYMENT_METHODS.DEBIT_CARD]: 'Banka Kartı',
  [PAYMENT_METHODS.BANK_TRANSFER]: 'Havale/EFT',
  [PAYMENT_METHODS.ROOM_CHARGE]: 'Oda Hesabına',
  [PAYMENT_METHODS.CITY_LEDGER]: 'Cari Hesap',
  [PAYMENT_METHODS.VOUCHER]: 'Voucher',
  [PAYMENT_METHODS.ONLINE]: 'Online',
  [PAYMENT_METHODS.AGENCY]: 'Acente',
  [PAYMENT_METHODS.OTHER]: 'Diğer'
}

// Payment method labels (English)
export const PAYMENT_METHOD_LABELS_EN = {
  [PAYMENT_METHODS.CASH]: 'Cash',
  [PAYMENT_METHODS.CREDIT_CARD]: 'Credit Card',
  [PAYMENT_METHODS.DEBIT_CARD]: 'Debit Card',
  [PAYMENT_METHODS.BANK_TRANSFER]: 'Bank Transfer',
  [PAYMENT_METHODS.ROOM_CHARGE]: 'Room Charge',
  [PAYMENT_METHODS.CITY_LEDGER]: 'City Ledger',
  [PAYMENT_METHODS.VOUCHER]: 'Voucher',
  [PAYMENT_METHODS.ONLINE]: 'Online',
  [PAYMENT_METHODS.AGENCY]: 'Agency',
  [PAYMENT_METHODS.OTHER]: 'Other'
}

// Payment status
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  CANCELLED: 'cancelled'
}

// Payment status values as array
export const PAYMENT_STATUS_VALUES = Object.values(PAYMENT_STATUS)

/**
 * Get payment method label
 * @param {string} method - Payment method key
 * @param {string} locale - Locale ('tr' or 'en')
 * @returns {string} - Localized label
 */
export function getPaymentMethodLabel(method, locale = 'tr') {
  const labels = locale === 'tr' ? PAYMENT_METHOD_LABELS_TR : PAYMENT_METHOD_LABELS_EN
  return labels[method] || method
}

/**
 * Get payment method options for select input
 * @param {string} locale - Locale ('tr' or 'en')
 * @returns {Array} - Array of {value, label} objects
 */
export function getPaymentMethodOptions(locale = 'tr') {
  const labels = locale === 'tr' ? PAYMENT_METHOD_LABELS_TR : PAYMENT_METHOD_LABELS_EN
  return Object.entries(PAYMENT_METHODS).map(([key, value]) => ({
    value,
    label: labels[value] || key
  }))
}
