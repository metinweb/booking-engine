/**
 * useStatusHelpers Composable
 * Provides reactive status helper functions with i18n support
 */

import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  STATUS_CLASSES,
  STATUS_DOT_CLASSES,
  STATUS_LABEL_KEYS,
  getStatusClass as getClass,
  getStatusDotClass as getDotClass,
  getCreditBarClass,
  getCreditPercentage,
  getAvailableCredit,
  getProgressBarClass,
  getBooleanStatusClass,
  getBooleanDotClass
} from '../utils/statusHelpers.js'

/**
 * Composable for status-related helper functions with i18n
 * @returns {Object} Status helper functions and constants
 */
export function useStatusHelpers() {
  const { t, locale } = useI18n()

  // Re-export class getters (no i18n needed)
  const getStatusClass = getClass
  const getStatusDotClass = getDotClass

  /**
   * Get localized status label
   * @param {string} status - Status value
   * @param {string} fallback - Fallback label
   */
  const getStatusLabel = (status, fallback = null) => {
    const key = STATUS_LABEL_KEYS[status]
    if (key) {
      return t(key)
    }
    return fallback || status
  }

  /**
   * Get booking status label
   */
  const getBookingStatusLabel = status => {
    const labels = {
      draft: t('booking.status.draft'),
      pending: t('booking.status.pending'),
      confirmed: t('booking.status.confirmed'),
      completed: t('booking.status.completed'),
      cancelled: t('booking.status.cancelled'),
      expired: t('booking.status.expired'),
      no_show: t('booking.status.noShow'),
      amended: t('booking.status.amended')
    }
    return labels[status] || status
  }

  /**
   * Get agency/common status label
   */
  const getCommonStatusLabel = status => {
    const labels = {
      active: t('common.active'),
      inactive: t('common.inactive'),
      pending: t('common.pending'),
      suspended: t('common.suspended'),
      enabled: t('common.enabled'),
      disabled: t('common.disabled')
    }
    return labels[status] || status
  }

  /**
   * Get payment status label
   */
  const getPaymentStatusLabel = status => {
    const labels = {
      paid: t('payment.status.paid'),
      unpaid: t('payment.status.unpaid'),
      partial: t('payment.status.partial'),
      refunded: t('payment.status.refunded'),
      pending: t('payment.status.pending'),
      failed: t('payment.status.failed')
    }
    return labels[status] || status
  }

  /**
   * Get hotel status label
   */
  const getHotelStatusLabel = status => {
    const labels = {
      draft: t('hotel.status.draft'),
      active: t('hotel.status.active'),
      inactive: t('hotel.status.inactive'),
      open: t('hotel.status.open'),
      closed: t('hotel.status.closed'),
      maintenance: t('hotel.status.maintenance')
    }
    return labels[status] || status
  }

  /**
   * Get credit filter label
   */
  const getCreditFilterLabel = filter => {
    const labels = {
      enabled: t('agencies.creditEnabled'),
      disabled: t('agencies.creditDisabled'),
      low: t('agencies.lowCredit')
    }
    return labels[filter] || filter
  }

  /**
   * Get priority label
   */
  const getPriorityLabel = priority => {
    const labels = {
      low: t('common.priority.low'),
      medium: t('common.priority.medium'),
      high: t('common.priority.high'),
      critical: t('common.priority.critical')
    }
    return labels[priority] || priority
  }

  /**
   * Create a computed status badge object
   * @param {Ref<string>} statusRef - Reactive status reference
   */
  const useStatusBadge = statusRef => {
    return computed(() => ({
      class: getStatusClass(statusRef.value),
      dotClass: getStatusDotClass(statusRef.value),
      label: getStatusLabel(statusRef.value)
    }))
  }

  return {
    // Class helpers (no i18n)
    getStatusClass,
    getStatusDotClass,
    getCreditBarClass,
    getCreditPercentage,
    getAvailableCredit,
    getProgressBarClass,
    getBooleanStatusClass,
    getBooleanDotClass,

    // Label helpers (with i18n)
    getStatusLabel,
    getBookingStatusLabel,
    getCommonStatusLabel,
    getPaymentStatusLabel,
    getHotelStatusLabel,
    getCreditFilterLabel,
    getPriorityLabel,

    // Computed helpers
    useStatusBadge,

    // Constants
    STATUS_CLASSES,
    STATUS_DOT_CLASSES,
    STATUS_LABEL_KEYS
  }
}

export default useStatusHelpers
