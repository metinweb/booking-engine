/**
 * Exchange Rate Scheduler
 * Fetches rates from TCMB every 5 minutes between 09:00-17:00 (Turkey time)
 */

import Exchange from '../models/exchange.model.js'

// Configuration
const CHECK_INTERVAL = 5 * 60 * 1000 // 5 minutes in milliseconds
const WORKING_HOURS_START = 9 // 09:00
const WORKING_HOURS_END = 17 // 17:00
const TIMEZONE_OFFSET = 3 // Turkey is UTC+3

let schedulerInterval = null
let isRunning = false

/**
 * Get current hour in Turkey timezone
 */
function getTurkeyHour() {
  const now = new Date()
  const utcHour = now.getUTCHours()
  const turkeyHour = (utcHour + TIMEZONE_OFFSET) % 24
  return turkeyHour
}

/**
 * Check if current time is within working hours
 */
function isWithinWorkingHours() {
  const turkeyHour = getTurkeyHour()
  const day = new Date().getDay()

  // Skip weekends (Saturday = 6, Sunday = 0)
  if (day === 0 || day === 6) {
    return false
  }

  return turkeyHour >= WORKING_HOURS_START && turkeyHour < WORKING_HOURS_END
}

/**
 * Fetch exchange rates if within working hours
 */
async function fetchRatesIfNeeded() {
  if (!isWithinWorkingHours()) {
    console.log('[Exchange Scheduler] Outside working hours, skipping...')
    return null
  }

  try {
    console.log('[Exchange Scheduler] Fetching rates from TCMB...')
    const result = await Exchange.retrieve()
    console.log('[Exchange Scheduler] Rates updated successfully')
    return result
  } catch (error) {
    console.error('[Exchange Scheduler] Error fetching rates:', error.message)
    return null
  }
}

/**
 * Start the scheduler
 */
export function startExchangeScheduler() {
  if (isRunning) {
    console.log('[Exchange Scheduler] Already running')
    return
  }

  console.log('[Exchange Scheduler] Starting...')
  console.log(`[Exchange Scheduler] Will fetch rates every ${CHECK_INTERVAL / 60000} minutes`)
  console.log(`[Exchange Scheduler] Working hours: ${WORKING_HOURS_START}:00 - ${WORKING_HOURS_END}:00 (Turkey time)`)

  // Fetch immediately on start
  fetchRatesIfNeeded().then(result => {
    if (result) {
      console.log('[Exchange Scheduler] Initial fetch completed')
    }
  })

  // Set up interval
  schedulerInterval = setInterval(fetchRatesIfNeeded, CHECK_INTERVAL)
  isRunning = true

  console.log('[Exchange Scheduler] Started successfully')
}

/**
 * Stop the scheduler
 */
export function stopExchangeScheduler() {
  if (!isRunning) {
    console.log('[Exchange Scheduler] Not running')
    return
  }

  if (schedulerInterval) {
    clearInterval(schedulerInterval)
    schedulerInterval = null
  }

  isRunning = false
  console.log('[Exchange Scheduler] Stopped')
}

/**
 * Force fetch rates (bypass time check)
 */
export async function forceFetchRates() {
  console.log('[Exchange Scheduler] Force fetching rates...')
  try {
    const result = await Exchange.retrieve()
    console.log('[Exchange Scheduler] Force fetch completed')
    return result
  } catch (error) {
    console.error('[Exchange Scheduler] Force fetch error:', error.message)
    throw error
  }
}

/**
 * Get scheduler status
 */
export function getSchedulerStatus() {
  return {
    isRunning,
    checkInterval: CHECK_INTERVAL / 60000, // in minutes
    workingHours: {
      start: WORKING_HOURS_START,
      end: WORKING_HOURS_END,
      timezone: 'UTC+3 (Turkey)'
    },
    isWithinWorkingHours: isWithinWorkingHours(),
    currentTurkeyHour: getTurkeyHour()
  }
}

export default {
  start: startExchangeScheduler,
  stop: stopExchangeScheduler,
  forceFetch: forceFetchRates,
  getStatus: getSchedulerStatus
}
