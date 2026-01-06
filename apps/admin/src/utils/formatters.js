/**
 * Centralized Formatters
 * Common formatting functions used across the application
 */

// ==================== CURRENCY ====================

/**
 * Format currency with locale support
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default: TRY)
 * @param {string} locale - Locale string (tr or en)
 * @param {object} options - Additional Intl.NumberFormat options
 */
export const formatCurrency = (amount, currency = 'TRY', locale = 'tr', options = {}) => {
  if (amount === null || amount === undefined) return '-'
  const localeString = locale === 'tr' ? 'tr-TR' : 'en-US'
  return new Intl.NumberFormat(localeString, {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    ...options
  }).format(amount)
}

/**
 * Format price (alias for formatCurrency with null check)
 */
export const formatPrice = (amount, currency = 'TRY', locale = 'tr') => {
  if (!amount && amount !== 0) return '-'
  return formatCurrency(amount, currency, locale)
}

/**
 * Format number with locale
 */
export const formatNumber = (value, locale = 'tr', options = {}) => {
  if (value === null || value === undefined) return '-'
  const localeString = locale === 'tr' ? 'tr-TR' : 'en-US'
  return new Intl.NumberFormat(localeString, options).format(value)
}

/**
 * Format percentage
 */
export const formatPercentage = (value, decimals = 0) => {
  if (value === null || value === undefined) return '-'
  return `%${value.toFixed(decimals)}`
}

// ==================== DATE/TIME ====================

/**
 * Format date with relative time for recent dates
 */
export const formatDate = date => {
  if (!date) return '-'

  const d = new Date(date)
  const now = new Date()
  const diffInSeconds = Math.floor((now - d) / 1000)

  // Less than 1 minute
  if (diffInSeconds < 60) {
    return 'Az önce'
  }

  // Less than 1 hour
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes} dakika önce`
  }

  // Less than 24 hours
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours} saat önce`
  }

  // Less than 7 days
  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days} gün önce`
  }

  // Default: show full date
  return d.toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

export const formatDateTime = date => {
  if (!date) return '-'

  const d = new Date(date)
  return d.toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export const formatTime = date => {
  if (!date) return '-'

  const d = new Date(date)
  return d.toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

export const formatDuration = seconds => {
  if (!seconds) return '0s'

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  const parts = []
  if (hours > 0) parts.push(`${hours}s`)
  if (minutes > 0) parts.push(`${minutes}d`)
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`)

  return parts.join(' ')
}

/**
 * Format standard date (without relative time)
 */
export const formatStandardDate = (date, locale = 'tr') => {
  if (!date) return '-'
  const d = new Date(date)
  if (isNaN(d.getTime())) return '-'
  const localeString = locale === 'tr' ? 'tr-TR' : 'en-US'
  return d.toLocaleDateString(localeString, {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

/**
 * Format date range
 */
export const formatDateRange = (startDate, endDate, locale = 'tr') => {
  const localeString = locale === 'tr' ? 'tr-TR' : 'en-US'
  const start = new Date(startDate).toLocaleDateString(localeString, { day: '2-digit', month: 'short' })
  const end = new Date(endDate).toLocaleDateString(localeString, { day: '2-digit', month: 'short', year: 'numeric' })
  return `${start} - ${end}`
}

/**
 * Format days until target date
 */
export const formatDaysUntil = (date, labels = {}) => {
  if (!date) return '-'
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const target = new Date(date)
  target.setHours(0, 0, 0, 0)
  const days = Math.ceil((target - now) / (1000 * 60 * 60 * 24))

  if (days < 0) return labels.expired || 'Süresi doldu'
  if (days === 0) return labels.today || 'Bugün'
  if (days === 1) return labels.tomorrow || 'Yarın'
  return `${days} ${labels.days || 'gün'}`
}

/**
 * Calculate nights count
 */
export const formatNights = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return 0
  const start = new Date(checkIn)
  const end = new Date(checkOut)
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24))
}

// ==================== TEXT ====================

/**
 * Get initials from name
 */
export const getInitials = (name, maxChars = 2) => {
  if (!name) return '?'
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, maxChars)
}

/**
 * Truncate text with ellipsis
 */
export const truncate = (text, maxLength = 50) => {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

/**
 * Format booking number
 */
export const formatBookingNumber = bookingNumber => {
  if (!bookingNumber) return '-'
  if (bookingNumber.length > 2 && !bookingNumber.includes('-')) {
    return `${bookingNumber.slice(0, 2)}-${bookingNumber.slice(2)}`
  }
  return bookingNumber
}

// ==================== PHONE ====================

/**
 * Format phone number
 */
export const formatPhone = (phone, countryCode = 'TR') => {
  if (!phone) return '-'
  const digits = phone.replace(/\D/g, '')

  if (countryCode === 'TR' && digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)} ${digits.slice(6, 8)} ${digits.slice(8)}`
  }

  if (digits.length > 10) {
    return `+${digits.slice(0, digits.length - 10)} ${digits.slice(-10, -7)} ${digits.slice(-7, -4)} ${digits.slice(-4)}`
  }

  return phone
}

// ==================== COUNTRY ====================

/**
 * Convert ISO country code to flag emoji
 */
export const getCountryFlag = countryCode => {
  if (!countryCode || countryCode.length !== 2) return ''
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0))
  return String.fromCodePoint(...codePoints)
}

// ==================== FILE ====================

/**
 * Format file size
 */
export const formatFileSize = bytes => {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0
  while (bytes >= 1024 && i < units.length - 1) {
    bytes /= 1024
    i++
  }
  return `${bytes.toFixed(i > 0 ? 1 : 0)} ${units[i]}`
}
