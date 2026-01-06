/**
 * Restrictions Module
 * Availability and restriction checking for rates
 */

/**
 * Check booking restrictions for a rate
 * @param {Object} rate - Rate document
 * @param {Object} options - { checkInDate, checkOutDate, adults, bookingDate, minAdults }
 * @returns {Object} { isBookable, restrictions: { stopSale, singleStop, belowMinAdults, minStay, maxStay, releaseDays, closedToArrival, closedToDeparture } }
 */
export function checkRestrictions(rate, options = {}) {
  const {
    checkInDate,
    checkOutDate,
    adults = 2,
    bookingDate = new Date(),
    requiredRooms = 1,
    minAdults = 1
  } = options

  const restrictions = {
    stopSale: false,
    singleStop: false,
    belowMinAdults: false,
    minStay: false,
    maxStay: false,
    releaseDays: false,
    closedToArrival: false,
    closedToDeparture: false,
    noAvailability: false,
    insufficientAllotment: false
  }
  const messages = []

  // Stop sale check
  if (rate.stopSale) {
    restrictions.stopSale = true
    messages.push('Stop sale active')
  }

  // Minimum adults check (considering override hierarchy)
  if (adults < minAdults) {
    restrictions.belowMinAdults = true
    messages.push(`Minimum ${minAdults} adult(s) required`)
  }

  // Single stop check (1 adult not allowed) - legacy, kept for backwards compatibility
  if (rate.singleStop && adults === 1) {
    restrictions.singleStop = true
    messages.push('Single occupancy not available')
  }

  // Real-time allotment check
  // rate.allotment = total rooms allocated
  // rate.sold = rooms already sold
  // available = allotment - sold
  const allotment = rate.allotment ?? null
  const sold = rate.sold ?? 0

  if (allotment !== null) {
    const available = allotment - sold
    if (available < requiredRooms) {
      restrictions.insufficientAllotment = true
      if (available <= 0) {
        restrictions.noAvailability = true
        messages.push('No rooms available')
      } else {
        messages.push(`Only ${available} room(s) available, ${requiredRooms} required`)
      }
    }
  }

  // Legacy availability check (for backwards compatibility)
  if (rate.available !== undefined && rate.available <= 0) {
    restrictions.noAvailability = true
    if (!messages.includes('No rooms available')) {
      messages.push('No rooms available')
    }
  }

  // Release days check
  if (rate.releaseDays > 0 && checkInDate) {
    const checkIn = new Date(checkInDate)
    const booking = new Date(bookingDate)
    const daysDifference = Math.floor((checkIn - booking) / (1000 * 60 * 60 * 24))

    if (daysDifference < rate.releaseDays) {
      restrictions.releaseDays = true
      messages.push(`Minimum ${rate.releaseDays} days advance booking required`)
    }
  }

  // Min/Max stay check
  if (checkInDate && checkOutDate) {
    const checkIn = new Date(checkInDate)
    const checkOut = new Date(checkOutDate)
    const nights = Math.floor((checkOut - checkIn) / (1000 * 60 * 60 * 24))

    if (rate.minStay && nights < rate.minStay) {
      restrictions.minStay = true
      messages.push(`Minimum ${rate.minStay} night stay required`)
    }

    if (rate.maxStay && nights > rate.maxStay) {
      restrictions.maxStay = true
      messages.push(`Maximum ${rate.maxStay} night stay allowed`)
    }
  }

  // Closed to arrival/departure
  if (rate.closedToArrival) {
    restrictions.closedToArrival = true
    messages.push('Arrival not allowed on this date')
  }

  if (rate.closedToDeparture) {
    restrictions.closedToDeparture = true
    messages.push('Departure not allowed on this date')
  }

  const isBookable = !Object.values(restrictions).some(v => v === true)

  return {
    isBookable,
    restrictions,
    messages
  }
}
