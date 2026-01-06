/**
 * Centralized Phone Formatter
 * Single source of truth for phone number formatting across the application
 */

/**
 * Normalize phone number by removing all non-digit characters
 * @param {string} phone - Phone number to normalize
 * @returns {string} Normalized phone number (digits only)
 */
export const normalizePhone = phone => {
  if (!phone) return ''
  return phone.replace(/\D/g, '')
}

/**
 * Format phone for Turkey (10 digits)
 * @param {string} phone - Phone number
 * @returns {string} Formatted phone: (5XX) XXX XX XX
 */
export const formatPhoneForTurkey = phone => {
  const digits = normalizePhone(phone)

  // Handle 10-digit Turkish mobile (5XX XXX XX XX)
  if (digits.length === 10 && digits.startsWith('5')) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)} ${digits.slice(6, 8)} ${digits.slice(8)}`
  }

  // Handle 11-digit with leading 0
  if (digits.length === 11 && digits.startsWith('0')) {
    const withoutZero = digits.slice(1)
    return `(${withoutZero.slice(0, 3)}) ${withoutZero.slice(3, 6)} ${withoutZero.slice(6, 8)} ${withoutZero.slice(8)}`
  }

  // Handle with country code +90
  if (digits.length === 12 && digits.startsWith('90')) {
    const withoutCode = digits.slice(2)
    return `+90 (${withoutCode.slice(0, 3)}) ${withoutCode.slice(3, 6)} ${withoutCode.slice(6, 8)} ${withoutCode.slice(8)}`
  }

  return phone
}

/**
 * Format phone for SMS sending (E.164 format for Turkey)
 * @param {string} phone - Phone number
 * @returns {string} E.164 format: 905XXXXXXXXX
 */
export const formatPhoneForSMS = phone => {
  const digits = normalizePhone(phone)

  // Already in correct format
  if (digits.length === 12 && digits.startsWith('90')) {
    return digits
  }

  // 10 digits - add country code
  if (digits.length === 10 && digits.startsWith('5')) {
    return `90${digits}`
  }

  // 11 digits with leading 0 - replace with country code
  if (digits.length === 11 && digits.startsWith('0')) {
    return `90${digits.slice(1)}`
  }

  // Return as-is if we can't determine format
  return digits
}

/**
 * Format phone for international display
 * @param {string} phone - Phone number
 * @param {string} countryCode - ISO 2-letter country code
 * @returns {string} Formatted international phone
 */
export const formatPhoneInternational = (phone, countryCode = 'TR') => {
  const digits = normalizePhone(phone)

  if (countryCode === 'TR') {
    return formatPhoneForTurkey(phone)
  }

  // Generic international format
  if (digits.length > 10) {
    const countryPart = digits.slice(0, digits.length - 10)
    const localPart = digits.slice(-10)
    return `+${countryPart} ${localPart.slice(0, 3)} ${localPart.slice(3, 6)} ${localPart.slice(6)}`
  }

  return phone
}

/**
 * Validate Turkish phone number
 * @param {string} phone - Phone number to validate
 * @returns {boolean} Whether the phone is valid
 */
export const isValidTurkishPhone = phone => {
  const digits = normalizePhone(phone)

  // Valid formats:
  // 5XXXXXXXXX (10 digits, mobile)
  // 05XXXXXXXXX (11 digits with leading 0)
  // 905XXXXXXXXX (12 digits with country code)
  // +905XXXXXXXXX (with plus sign, handled by normalizePhone)

  if (digits.length === 10 && digits.startsWith('5')) {
    return true
  }

  if (digits.length === 11 && digits.startsWith('05')) {
    return true
  }

  if (digits.length === 12 && digits.startsWith('905')) {
    return true
  }

  return false
}

/**
 * Validate phone number (generic)
 * @param {string} phone - Phone number to validate
 * @param {object} options - Validation options
 * @returns {boolean} Whether the phone is valid
 */
export const isValidPhone = (phone, options = {}) => {
  const { minLength = 10, maxLength = 15, countryCode = null } = options
  const digits = normalizePhone(phone)

  if (digits.length < minLength || digits.length > maxLength) {
    return false
  }

  if (countryCode === 'TR') {
    return isValidTurkishPhone(phone)
  }

  return digits.length >= minLength
}

/**
 * Extract country code from phone number
 * @param {string} phone - Phone number
 * @returns {string|null} Country code or null
 */
export const extractCountryCode = phone => {
  const digits = normalizePhone(phone)

  // Common country codes
  const codes = {
    '90': 'TR', // Turkey
    '1': 'US', // USA/Canada
    '44': 'GB', // UK
    '49': 'DE', // Germany
    '33': 'FR', // France
    '39': 'IT', // Italy
    '34': 'ES', // Spain
    '7': 'RU', // Russia
    '31': 'NL', // Netherlands
    '966': 'SA', // Saudi Arabia
    '971': 'AE' // UAE
  }

  for (const [code, country] of Object.entries(codes)) {
    if (digits.startsWith(code)) {
      return country
    }
  }

  return null
}

export default {
  normalizePhone,
  formatPhoneForTurkey,
  formatPhoneForSMS,
  formatPhoneInternational,
  isValidTurkishPhone,
  isValidPhone,
  extractCountryCode
}
