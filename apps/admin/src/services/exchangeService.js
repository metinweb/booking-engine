/**
 * Exchange Rate Service
 * Frontend service for exchange rate operations
 */

import apiClient from './api'

/**
 * Get current exchange rates
 */
export async function getExchangeRates() {
  const response = await apiClient.get('/exchange/rates')
  return response.data
}

/**
 * Get list of supported currencies
 */
export async function getSupportedCurrencies() {
  const response = await apiClient.get('/exchange/currencies')
  return response.data
}

/**
 * Convert amount between currencies
 */
export async function convertCurrency(amount, from, to) {
  const response = await apiClient.post('/exchange/convert', { amount, from, to })
  return response.data
}

/**
 * Get exchange rate between two currencies
 */
export async function getExchangeRate(from, to) {
  const response = await apiClient.get(`/exchange/rate/${from}/${to}`)
  return response.data
}

/**
 * Get exchange rate history (admin only)
 */
export async function getRateHistory(days = 7) {
  const response = await apiClient.get('/exchange/history', { params: { days } })
  return response.data
}

/**
 * Force refresh rates from TCMB (admin only)
 */
export async function refreshRates() {
  const response = await apiClient.post('/exchange/refresh')
  return response.data
}

/**
 * Set manual exchange rate (admin only)
 */
export async function setManualRate(currency, value) {
  const response = await apiClient.post('/exchange/manual-rate', { currency, value })
  return response.data
}

/**
 * Get scheduler status (admin only)
 */
export async function getSchedulerStatus() {
  const response = await apiClient.get('/exchange/scheduler-status')
  return response.data
}

// Currency symbols
export const CURRENCY_SYMBOLS = {
  TRY: '₺',
  USD: '$',
  EUR: '€',
  GBP: '£',
  CHF: 'CHF',
  JPY: '¥',
  CNY: '¥',
  AUD: 'A$',
  CAD: 'C$',
  DKK: 'kr',
  SEK: 'kr',
  NOK: 'kr',
  SAR: 'SR',
  KWD: 'KD',
  AED: 'AED',
  BGN: 'лв',
  RON: 'lei',
  RUB: '₽'
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currency) {
  return CURRENCY_SYMBOLS[currency?.toUpperCase()] || currency
}

/**
 * Format amount with currency
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
    return `${amount?.toFixed(2)} ${getCurrencySymbol(currency)}`
  }
}

export default {
  getExchangeRates,
  getSupportedCurrencies,
  convertCurrency,
  getExchangeRate,
  getRateHistory,
  refreshRates,
  setManualRate,
  getSchedulerStatus,
  getCurrencySymbol,
  formatCurrency,
  CURRENCY_SYMBOLS
}
