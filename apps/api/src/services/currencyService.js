/**
 * Currency Service
 * Handles currency conversion and exchange rate management
 * Uses Exchange model for TCMB rates
 */

import { BadRequestError } from '../core/errors.js'
import Exchange from '../models/exchange.model.js'

// Supported currencies
export const SUPPORTED_CURRENCIES = [
  'TRY', 'USD', 'EUR', 'GBP', 'CHF', 'JPY', 'CNY',
  'AUD', 'CAD', 'DKK', 'SEK', 'NOK', 'SAR', 'KWD',
  'AED', 'BGN', 'RON', 'RUB'
]

// Default fallback rates (used only if DB has no rates)
const FALLBACK_RATES = {
  baseCurrency: 'TRY',
  rates: {
    TRY: 1,
    USD: 35.5,
    EUR: 38.5,
    GBP: 44.5,
    CHF: 40.0,
    JPY: 0.23,
    CNY: 4.9,
    AUD: 22.5,
    CAD: 25.5,
    DKK: 5.15,
    SEK: 3.35,
    NOK: 3.25,
    SAR: 9.45,
    KWD: 115.5,
    AED: 9.65,
    BGN: 19.7,
    RON: 7.7,
    RUB: 0.36
  }
}

// In-memory cache to reduce DB calls
let ratesCache = {
  data: null,
  lastFetch: null,
  ttl: 60 * 1000 // 1 minute cache
}

/**
 * Get current exchange rates
 * @returns {Object} { baseCurrency, rates, lastUpdated, source }
 */
export async function getExchangeRates() {
  try {
    // Check cache first
    if (ratesCache.data && ratesCache.lastFetch) {
      const age = Date.now() - ratesCache.lastFetch
      if (age < ratesCache.ttl) {
        return ratesCache.data
      }
    }

    // Fetch from database
    const exchange = await Exchange.getRates()

    if (exchange && exchange.rates) {
      // Convert array to object
      const ratesObject = exchange.rates.reduce((acc, rate) => {
        acc[rate.code.toUpperCase()] = rate.value
        return acc
      }, {})

      const result = {
        baseCurrency: exchange.baseCurrency || 'TRY',
        rates: ratesObject,
        lastUpdated: exchange.createdAt,
        source: exchange.source || 'tcmb',
        bulletin: exchange.bulletin
      }

      // Update cache
      ratesCache.data = result
      ratesCache.lastFetch = Date.now()

      return result
    }

    // Fallback if no rates in DB
    return {
      baseCurrency: FALLBACK_RATES.baseCurrency,
      rates: FALLBACK_RATES.rates,
      lastUpdated: new Date(),
      source: 'fallback'
    }
  } catch (error) {
    console.error('getExchangeRates error:', error.message)

    // Return fallback on error
    return {
      baseCurrency: FALLBACK_RATES.baseCurrency,
      rates: FALLBACK_RATES.rates,
      lastUpdated: new Date(),
      source: 'fallback'
    }
  }
}

/**
 * Get exchange rates (sync version for compatibility)
 * Uses cached data if available
 */
export function getExchangeRatesSync() {
  if (ratesCache.data) {
    return ratesCache.data
  }

  // Return fallback if no cache
  return {
    baseCurrency: FALLBACK_RATES.baseCurrency,
    rates: FALLBACK_RATES.rates,
    lastUpdated: new Date(),
    source: 'fallback'
  }
}

/**
 * Force refresh exchange rates from TCMB
 */
export async function refreshExchangeRates() {
  try {
    const result = await Exchange.retrieve()

    // Clear cache to force refetch
    ratesCache.data = null
    ratesCache.lastFetch = null

    return {
      success: true,
      bulletin: result.bulletin,
      ratesCount: result.rates?.length,
      source: result.source
    }
  } catch (error) {
    throw new BadRequestError(`Failed to refresh rates: ${error.message}`)
  }
}

/**
 * Set manual exchange rate
 */
export async function setManualRate(currencyCode, value) {
  try {
    await Exchange.setManualRate(currencyCode, value)

    // Clear cache
    ratesCache.data = null
    ratesCache.lastFetch = null

    return { success: true, currency: currencyCode, value }
  } catch (error) {
    throw new BadRequestError(`Failed to set rate: ${error.message}`)
  }
}

/**
 * Convert amount from one currency to another
 * @param {number} amount - Amount to convert
 * @param {string} fromCurrency - Source currency code
 * @param {string} toCurrency - Target currency code
 * @returns {Object} { amount, fromCurrency, toCurrency, convertedAmount, rate }
 */
export async function convertCurrency(amount, fromCurrency, toCurrency) {
  if (!amount || amount < 0) {
    throw new BadRequestError('INVALID_AMOUNT')
  }

  fromCurrency = fromCurrency?.toUpperCase()
  toCurrency = toCurrency?.toUpperCase()

  // Same currency, no conversion needed
  if (fromCurrency === toCurrency) {
    return {
      amount,
      fromCurrency,
      toCurrency,
      convertedAmount: amount,
      rate: 1
    }
  }

  const { rates, baseCurrency } = await getExchangeRates()

  // Get rates (TCMB rates are TRY-based: 1 USD = X TRY)
  const fromRate = rates[fromCurrency]
  const toRate = rates[toCurrency]

  if (!fromRate || !toRate) {
    throw new BadRequestError(`EXCHANGE_RATE_NOT_AVAILABLE: ${fromCurrency} or ${toCurrency}`)
  }

  // Convert via TRY (base currency)
  // If rates are TRY-based: 1 USD = 35.5 TRY
  // To convert 100 USD to EUR:
  // 100 USD * 35.5 = 3550 TRY
  // 3550 TRY / 38.5 = 92.2 EUR
  const amountInTRY = amount * fromRate
  const convertedAmount = amountInTRY / toRate

  // Calculate direct rate
  const directRate = fromRate / toRate

  return {
    amount,
    fromCurrency,
    toCurrency,
    convertedAmount: Math.round(convertedAmount * 100) / 100,
    rate: Math.round(directRate * 10000) / 10000,
    baseCurrency
  }
}

/**
 * Convert amount (sync version using cached rates)
 */
export function convertCurrencySync(amount, fromCurrency, toCurrency) {
  if (!amount || amount < 0) return 0

  fromCurrency = fromCurrency?.toUpperCase()
  toCurrency = toCurrency?.toUpperCase()

  if (fromCurrency === toCurrency) return amount

  const { rates } = getExchangeRatesSync()

  const fromRate = rates[fromCurrency] || 1
  const toRate = rates[toCurrency] || 1

  const amountInTRY = amount * fromRate
  const convertedAmount = amountInTRY / toRate

  return Math.round(convertedAmount * 100) / 100
}

/**
 * Get exchange rate between two currencies
 */
export async function getExchangeRate(fromCurrency, toCurrency) {
  const result = await convertCurrency(1, fromCurrency, toCurrency)
  return result.rate
}

/**
 * Convert a price object to a different currency
 */
export async function convertPriceData(priceData, targetCurrency) {
  const fromCurrency = priceData.currency
  targetCurrency = targetCurrency?.toUpperCase()

  if (fromCurrency === targetCurrency) {
    return priceData
  }

  const { rate } = await convertCurrency(1, fromCurrency, targetCurrency)

  const converted = {
    ...priceData,
    originalCurrency: fromCurrency,
    currency: targetCurrency,
    conversionRate: rate
  }

  // Convert main totals
  if (priceData.pricing) {
    converted.pricing = {
      ...priceData.pricing,
      originalTotal: Math.round(priceData.pricing.originalTotal * rate * 100) / 100,
      totalDiscount: Math.round(priceData.pricing.totalDiscount * rate * 100) / 100,
      finalTotal: Math.round(priceData.pricing.finalTotal * rate * 100) / 100,
      avgPerNight: Math.round(priceData.pricing.avgPerNight * rate * 100) / 100
    }
  }

  // Convert daily breakdown
  if (priceData.dailyBreakdown) {
    converted.dailyBreakdown = priceData.dailyBreakdown.map(day => ({
      ...day,
      price: Math.round((day.price || 0) * rate * 100) / 100,
      basePrice: day.basePrice ? Math.round(day.basePrice * rate * 100) / 100 : undefined,
      originalPrice: day.originalPrice ? Math.round(day.originalPrice * rate * 100) / 100 : undefined,
      discountAmount: day.discountAmount ? Math.round(day.discountAmount * rate * 100) / 100 : undefined
    }))
  }

  return converted
}

/**
 * Format currency amount for display
 */
export function formatCurrency(amount, currency, locale = 'tr-TR') {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  } catch (error) {
    return `${amount.toFixed(2)} ${currency}`
  }
}

/**
 * Get rate history
 */
export async function getRateHistory(days = 7) {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const history = await Exchange.find({
    createdAt: { $gte: startDate }
  })
    .sort({ createdAt: -1 })
    .limit(days * 5) // Multiple updates per day possible
    .lean()

  return history.map(h => ({
    date: h.createdAt,
    bulletin: h.bulletin,
    source: h.source,
    rates: h.rates?.reduce((acc, r) => {
      acc[r.code] = r.value
      return acc
    }, {})
  }))
}

export default {
  SUPPORTED_CURRENCIES,
  getExchangeRates,
  getExchangeRatesSync,
  refreshExchangeRates,
  setManualRate,
  convertCurrency,
  convertCurrencySync,
  convertPriceData,
  getExchangeRate,
  formatCurrency,
  getRateHistory
}
