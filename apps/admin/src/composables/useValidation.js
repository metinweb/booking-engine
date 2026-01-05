/**
 * Validation Composable - Uses @booking-engine/validation shared package
 *
 * This composable provides validation functionality for Vue components.
 * All validation rules come from the shared package - Single Source of Truth.
 */

import { useI18n } from 'vue-i18n'
import {
  createValidation,
  validateField,
  validateObject,
  shouldShowField,
  isFieldRequired,
  getFieldClass,
  schemas,
  validateTcKimlik,
  validateEmail,
  validatePhone,
  formatTcKimlik,
  formatEmail,
  formatPhone
} from '@booking-engine/validation/adapters/vue'

/**
 * Main validation composable
 * Wraps the shared validation with i18n support
 */
export function useValidation() {
  const { t } = useI18n()

  // Create validation instance with translation function
  const validation = createValidation(t)

  /**
   * Validate entire booking data
   * @param {Object} bookingData - Full booking data
   * @returns {Object} - { valid: boolean, errors: Array }
   */
  function validateBooking(bookingData) {
    const errors = []

    // Lead Guest
    const leadGuestResult = validation.validateObject(
      'leadGuest',
      bookingData.leadGuest,
      bookingData
    )
    if (!leadGuestResult.valid) {
      leadGuestResult.errors.forEach(e => {
        errors.push({
          ...e,
          section: 'leadGuest',
          label: t('booking.validation.leadGuest')
        })
      })
    }

    // Room Guests
    if (bookingData.roomGuests) {
      bookingData.roomGuests.forEach((room, roomIndex) => {
        room.forEach((guest, guestIndex) => {
          if (roomIndex === 0 && guestIndex === 0 && guest.type === 'adult') {
            return // Skip - lead guest is used
          }

          const guestResult = validation.validateObject('roomGuest', guest, bookingData)
          if (!guestResult.valid) {
            const guestLabel =
              guest.type === 'adult'
                ? t('booking.validation.roomGuestAdult', {
                    room: roomIndex + 1,
                    guest: guestIndex + 1
                  })
                : t('booking.validation.roomGuestChild', {
                    room: roomIndex + 1,
                    guest: guestIndex + 1
                  })

            guestResult.errors.forEach(e => {
              errors.push({
                ...e,
                section: 'roomGuest',
                roomIndex,
                guestIndex,
                label: guestLabel
              })
            })
          }
        })
      })
    }

    // Invoice
    if (bookingData.invoiceDetails?.type === 'individual') {
      const invoiceResult = validation.validateObject(
        'invoiceIndividual',
        bookingData.invoiceDetails.individual,
        bookingData
      )
      if (!invoiceResult.valid) {
        invoiceResult.errors.forEach(e => {
          errors.push({
            ...e,
            section: 'invoiceIndividual',
            label: t('booking.validation.invoice')
          })
        })
      }
    } else if (bookingData.invoiceDetails?.type === 'corporate') {
      const invoiceResult = validation.validateObject(
        'invoiceCorporate',
        bookingData.invoiceDetails.corporate,
        bookingData
      )
      if (!invoiceResult.valid) {
        invoiceResult.errors.forEach(e => {
          errors.push({
            ...e,
            section: 'invoiceCorporate',
            label: t('booking.validation.invoice')
          })
        })
      }
    } else {
      errors.push({
        field: 'type',
        section: 'invoice',
        message: t('booking.validation.invoiceType'),
        label: t('booking.validation.invoice')
      })
    }

    // Payment
    const paymentResult = validation.validateObject(
      'paymentValidation',
      bookingData.payment,
      bookingData
    )
    if (!paymentResult.valid) {
      paymentResult.errors.forEach(e => {
        errors.push({
          ...e,
          section: 'payment',
          label: t('booking.validation.payment')
        })
      })
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Format error messages for display
   * @param {Array} errors - Validation errors
   * @returns {Array} - Formatted error strings
   */
  function formatErrors(errors) {
    return errors.map(e => {
      if (e.label) {
        return `${e.label}: ${e.message}`
      }
      return e.message
    })
  }

  return {
    // Schema access
    schema: schemas,

    // Validation functions
    validate: validation.validate,
    validateField: validation.validate,
    validateObject: validation.validateObject,
    validateBooking,
    formatErrors,

    // Helper functions
    getFieldClass: validation.getClass,
    isFieldRequired: validation.isRequired,
    shouldShowField: validation.shouldShow,

    // Direct validators
    validateTcNumber: validateTcKimlik,
    validateEmail,
    validatePhone,

    // Format functions
    formatTcNumber: formatTcKimlik,
    formatEmail,
    formatPhone
  }
}

// Re-export for backward compatibility
export {
  validateTcKimlik as validateTcNumber,
  validateEmail,
  validatePhone,
  formatTcKimlik as formatTcNumber,
  validateField,
  validateObject,
  shouldShowField,
  isFieldRequired,
  getFieldClass
}

export default useValidation
