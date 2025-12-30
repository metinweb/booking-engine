/**
 * Currency Service
 * Handles currency conversion and exchange rate management
 */

import { BadRequestError } from '../core/errors.js'

// Supported currencies (same as Rate model)
export const SUPPORTED_CURRENCIES = [
	'TRY', 'USD', 'EUR', 'GBP', 'RUB', 'SAR', 'AED', 'CHF', 'JPY', 'CNY'
]

// In-memory cache for exchange rates
// In production, this should be Redis or similar
let exchangeRatesCache = {
	rates: {},
	baseCurrency: 'EUR',
	lastUpdated: null,
	ttl: 6 * 60 * 60 * 1000 // 6 hours
}

// Default fallback rates (approximate, for development)
const FALLBACK_RATES = {
	baseCurrency: 'EUR',
	rates: {
		EUR: 1,
		USD: 1.08,
		TRY: 35.5,
		GBP: 0.85,
		RUB: 100,
		SAR: 4.05,
		AED: 3.97,
		CHF: 0.95,
		JPY: 165,
		CNY: 7.85
	}
}

/**
 * Get current exchange rates
 * @returns {Object} { baseCurrency, rates, lastUpdated }
 */
export function getExchangeRates() {
	// Check if cache is valid
	if (exchangeRatesCache.lastUpdated) {
		const age = Date.now() - exchangeRatesCache.lastUpdated
		if (age < exchangeRatesCache.ttl) {
			return {
				baseCurrency: exchangeRatesCache.baseCurrency,
				rates: exchangeRatesCache.rates,
				lastUpdated: exchangeRatesCache.lastUpdated,
				source: 'cache'
			}
		}
	}

	// Return fallback rates (in production, fetch from API)
	return {
		baseCurrency: FALLBACK_RATES.baseCurrency,
		rates: FALLBACK_RATES.rates,
		lastUpdated: new Date(),
		source: 'fallback'
	}
}

/**
 * Update exchange rates (can be called by a scheduled job)
 * @param {Object} rates - { baseCurrency, rates: { EUR: 1, USD: 1.08, ... } }
 */
export function updateExchangeRates(rates) {
	if (!rates || !rates.rates) {
		throw new BadRequestError('INVALID_RATES')
	}

	exchangeRatesCache = {
		rates: rates.rates,
		baseCurrency: rates.baseCurrency || 'EUR',
		lastUpdated: Date.now(),
		ttl: exchangeRatesCache.ttl
	}

	return {
		success: true,
		baseCurrency: exchangeRatesCache.baseCurrency,
		currenciesUpdated: Object.keys(rates.rates).length,
		lastUpdated: new Date(exchangeRatesCache.lastUpdated)
	}
}

/**
 * Convert amount from one currency to another
 * @param {number} amount - Amount to convert
 * @param {string} fromCurrency - Source currency code
 * @param {string} toCurrency - Target currency code
 * @returns {Object} { amount, fromCurrency, toCurrency, convertedAmount, rate }
 */
export function convertCurrency(amount, fromCurrency, toCurrency) {
	if (!amount || amount < 0) {
		throw new BadRequestError('INVALID_AMOUNT')
	}

	fromCurrency = fromCurrency?.toUpperCase()
	toCurrency = toCurrency?.toUpperCase()

	if (!SUPPORTED_CURRENCIES.includes(fromCurrency)) {
		throw new BadRequestError(`UNSUPPORTED_CURRENCY: ${fromCurrency}`)
	}

	if (!SUPPORTED_CURRENCIES.includes(toCurrency)) {
		throw new BadRequestError(`UNSUPPORTED_CURRENCY: ${toCurrency}`)
	}

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

	const { rates, baseCurrency } = getExchangeRates()

	// Get rate from base currency
	const fromRate = rates[fromCurrency]
	const toRate = rates[toCurrency]

	if (!fromRate || !toRate) {
		throw new BadRequestError('EXCHANGE_RATE_NOT_AVAILABLE')
	}

	// Convert: amount in fromCurrency -> base currency -> toCurrency
	// If base is EUR: 100 USD = 100 / 1.08 EUR = 92.59 EUR
	// Then: 92.59 EUR * 35.5 = 3287 TRY
	const amountInBase = amount / fromRate
	const convertedAmount = amountInBase * toRate

	// Calculate direct rate
	const directRate = toRate / fromRate

	return {
		amount,
		fromCurrency,
		toCurrency,
		convertedAmount: Math.round(convertedAmount * 100) / 100, // 2 decimal places
		rate: Math.round(directRate * 10000) / 10000, // 4 decimal places
		baseCurrency
	}
}

/**
 * Convert a price object to a different currency
 * @param {Object} priceData - { total, breakdown, currency }
 * @param {string} targetCurrency - Target currency code
 * @returns {Object} Converted price data
 */
export function convertPriceData(priceData, targetCurrency) {
	const fromCurrency = priceData.currency
	targetCurrency = targetCurrency?.toUpperCase()

	if (fromCurrency === targetCurrency) {
		return priceData
	}

	const { rate } = convertCurrency(1, fromCurrency, targetCurrency)

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

	// Convert campaign discounts
	if (priceData.campaigns?.applied) {
		converted.campaigns = {
			...priceData.campaigns,
			applied: priceData.campaigns.applied.map(c => ({
				...c,
				discountAmount: Math.round(c.discountAmount * rate * 100) / 100
			})),
			totalDiscount: Math.round(priceData.campaigns.totalDiscount * rate * 100) / 100
		}
	}

	return converted
}

/**
 * Get exchange rate between two currencies
 * @param {string} fromCurrency
 * @param {string} toCurrency
 * @returns {number} Exchange rate
 */
export function getExchangeRate(fromCurrency, toCurrency) {
	const result = convertCurrency(1, fromCurrency, toCurrency)
	return result.rate
}

/**
 * Format currency amount for display
 * @param {number} amount
 * @param {string} currency
 * @param {string} locale - e.g., 'tr-TR', 'en-US'
 * @returns {string} Formatted amount
 */
export function formatCurrency(amount, currency, locale = 'en-US') {
	try {
		return new Intl.NumberFormat(locale, {
			style: 'currency',
			currency: currency,
			minimumFractionDigits: 2,
			maximumFractionDigits: 2
		}).format(amount)
	} catch (error) {
		// Fallback for unsupported currencies
		return `${amount.toFixed(2)} ${currency}`
	}
}

export default {
	SUPPORTED_CURRENCIES,
	getExchangeRates,
	updateExchangeRates,
	convertCurrency,
	convertPriceData,
	getExchangeRate,
	formatCurrency
}
