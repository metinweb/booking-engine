import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

/**
 * Date formatting and utility composable
 * Centralizes date operations to avoid DRY violations across components
 */
export function useDate() {
  const { locale } = useI18n()

  // Get locale string for date formatting
  const dateLocale = computed(() => locale.value === 'tr' ? 'tr-TR' : 'en-US')

  /**
   * Format date to display string (e.g., "25 Ara 2025" or "Dec 25, 2025")
   */
  const formatDisplayDate = (dateStr, options = {}) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return '-'

    const defaultOptions = {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      ...options
    }
    return date.toLocaleDateString(dateLocale.value, defaultOptions)
  }

  /**
   * Format date to short display (e.g., "25.12.25" or "12/25/25")
   */
  const formatShortDate = (dateStr) => {
    if (!dateStr) return '-'
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) return '-'

    return date.toLocaleDateString(dateLocale.value, {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    })
  }

  /**
   * Format date to ISO format (YYYY-MM-DD)
   */
  const formatISODate = (date) => {
    if (!date) return ''
    const d = date instanceof Date ? date : new Date(date)
    if (isNaN(d.getTime())) return ''

    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  /**
   * Format date from ISO to Turkish format (DD.MM.YYYY)
   */
  const formatTurkishDate = (dateStr) => {
    if (!dateStr) return ''
    const [year, month, day] = dateStr.split('-')
    return `${day}.${month}.${year}`
  }

  /**
   * Calculate days between two dates (inclusive)
   */
  const calculateDays = (startDate, endDate) => {
    if (!startDate || !endDate) return 0
    const start = new Date(startDate)
    const end = new Date(endDate)
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0

    const diffTime = Math.abs(end - start)
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
  }

  /**
   * Get month name
   */
  const getMonthName = (monthIndex, short = false) => {
    const date = new Date(2000, monthIndex, 1)
    return date.toLocaleDateString(dateLocale.value, {
      month: short ? 'short' : 'long'
    })
  }

  /**
   * Get day name
   */
  const getDayName = (dayIndex, short = false) => {
    // dayIndex: 0 = Sunday, 1 = Monday, etc.
    const date = new Date(2000, 0, 2 + dayIndex) // Jan 2, 2000 is Sunday
    return date.toLocaleDateString(dateLocale.value, {
      weekday: short ? 'short' : 'long'
    })
  }

  /**
   * Check if date is today
   */
  const isToday = (dateStr) => {
    if (!dateStr) return false
    const date = new Date(dateStr)
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  /**
   * Check if date is in the past
   */
  const isPast = (dateStr) => {
    if (!dateStr) return false
    const date = new Date(dateStr)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date < today
  }

  /**
   * Check if date is in the future
   */
  const isFuture = (dateStr) => {
    if (!dateStr) return false
    const date = new Date(dateStr)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date > today
  }

  /**
   * Add days to a date
   */
  const addDays = (dateStr, days) => {
    if (!dateStr) return null
    const date = new Date(dateStr)
    date.setDate(date.getDate() + days)
    return date
  }

  /**
   * Get days in month
   */
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate()
  }

  /**
   * Parse date string to Date object
   */
  const parseDate = (dateStr) => {
    if (!dateStr) return null
    const date = new Date(dateStr)
    return isNaN(date.getTime()) ? null : date
  }

  return {
    dateLocale,
    formatDisplayDate,
    formatShortDate,
    formatISODate,
    formatTurkishDate,
    calculateDays,
    getMonthName,
    getDayName,
    isToday,
    isPast,
    isFuture,
    addDays,
    getDaysInMonth,
    parseDate
  }
}
