/**
 * Price Query Helpers
 * Formatting and styling utilities for price query components
 */

/**
 * Format price with Turkish locale
 */
export function formatPrice(price) {
  return Math.round(price).toLocaleString('tr-TR')
}

/**
 * Format date with Turkish locale (DD/MM)
 */
export function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })
}

/**
 * Format date as YYYY-MM-DD
 */
export function formatDateISO(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Get room type display name
 */
export function getRoomTypeName(roomType, locale = 'tr') {
  if (!roomType) return ''
  return roomType.name?.[locale] || roomType.name?.tr || roomType.name?.en || roomType.code
}

/**
 * Get room image URL
 */
export function getRoomImage(roomType, imageBaseUrl) {
  if (!roomType) return null

  // Check for images array
  if (roomType.images?.length > 0) {
    const mainImage = roomType.images.find(img => img.isMain) || roomType.images[0]
    const imageUrl = mainImage?.url || mainImage
    if (imageUrl) {
      // If URL is relative, prepend the base URL
      if (imageUrl.startsWith('/')) {
        return imageBaseUrl + imageUrl
      }
      return imageUrl
    }
  }

  // Check for single image field
  if (roomType.image) {
    if (roomType.image.startsWith('/')) {
      return imageBaseUrl + roomType.image
    }
    return roomType.image
  }

  return null
}

/**
 * Get meal plan badge CSS classes
 */
export function getMealPlanBadgeClass(code) {
  const colors = {
    RO: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
    BB: 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300',
    HB: 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300',
    FB: 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
    AI: 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300',
    UAI: 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300'
  }
  return colors[code] || 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
}

/**
 * Get issue badge CSS classes
 */
export function getIssueBadgeClass(type) {
  const classes = {
    stop_sale: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    single_stop: 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400',
    cta: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
    ctd: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
    min_stay: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    no_rate: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
    capacity: 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
  }
  return classes[type] || 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
}

/**
 * Get issue short label
 */
export function getIssueShortLabel(type) {
  const labels = {
    stop_sale: 'STOP',
    single_stop: '1P',
    cta: 'CTA',
    ctd: 'CTD',
    min_stay: 'MIN',
    no_rate: '-',
    capacity: 'KAP'
  }
  return labels[type] || '?'
}

/**
 * Get tier pricing from meal plan result
 */
export function getTierPricing(mpResult) {
  return (
    mpResult?.tierPricing || {
      hotelCost: 0,
      b2cPrice: 0,
      b2bPrice: 0
    }
  )
}

/**
 * Calculate default date range based on initial month
 */
export function calculateDefaultDates(initialMonth = null) {
  let startDate, endDate
  const today = new Date()

  if (initialMonth) {
    const year = initialMonth.year
    const month = initialMonth.month - 1 // JavaScript months are 0-indexed

    const firstOfMonth = new Date(year, month, 1)

    if (year === today.getFullYear() && month === today.getMonth()) {
      // Current month - start from tomorrow
      startDate = new Date(today)
      startDate.setDate(startDate.getDate() + 1)
    } else if (firstOfMonth > today) {
      // Future month - start from the 1st
      startDate = firstOfMonth
    } else {
      // Past month - still use 1st
      startDate = firstOfMonth
    }

    // End date: 2 nights later
    endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + 2)
  } else {
    // Fallback to tomorrow + 2 nights
    startDate = new Date(today)
    startDate.setDate(startDate.getDate() + 1)
    endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + 2)
  }

  return {
    start: formatDateISO(startDate),
    end: formatDateISO(endDate)
  }
}

/**
 * Calculate nights between two dates
 */
export function calculateNights(startDate, endDate) {
  if (!startDate || !endDate) return 0
  const start = new Date(startDate)
  const end = new Date(endDate)
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24))
}
