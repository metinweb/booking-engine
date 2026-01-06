/**
 * Currency Constants
 * Centralized currency definitions for the booking engine
 */

// Supported currency codes
export const CURRENCY_CODES = ['TRY', 'USD', 'EUR', 'GBP', 'RUB']

// Default currency
export const DEFAULT_CURRENCY = 'EUR'

// Currency symbols
export const CURRENCY_SYMBOLS = {
  TRY: '₺',
  USD: '$',
  EUR: '€',
  GBP: '£',
  RUB: '₽'
}

// Currency labels
export const CURRENCY_LABELS = {
  TRY: 'Türk Lirası',
  USD: 'US Dollar',
  EUR: 'Euro',
  GBP: 'British Pound',
  RUB: 'Russian Ruble'
}

// Currency options for select inputs
export const CURRENCY_OPTIONS = CURRENCY_CODES.map(code => ({
  value: code,
  label: `${code} (${CURRENCY_SYMBOLS[code]})`,
  symbol: CURRENCY_SYMBOLS[code]
}))

/**
 * Validate currency code
 * @param {string} code - Currency code
 * @returns {boolean} - true if valid currency
 */
export function validateCurrency(code) {
  if (!code) return false
  return CURRENCY_CODES.includes(code.toUpperCase())
}

/**
 * Get currency symbol
 * @param {string} code - Currency code
 * @returns {string} - Currency symbol or empty string
 */
export function getCurrencySymbol(code) {
  return CURRENCY_SYMBOLS[code?.toUpperCase()] || ''
}

/**
 * Format amount with currency symbol
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code
 * @param {string} locale - Locale for number formatting
 * @returns {string} - Formatted currency string
 */
export function formatCurrency(amount, currency = DEFAULT_CURRENCY, locale = 'tr-TR') {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  } catch {
    // Fallback for unsupported currencies
    const symbol = getCurrencySymbol(currency)
    return `${symbol}${amount.toFixed(2)}`
  }
}
