/**
 * Booking Validation Composable - Single Source of Truth (Frontend)
 *
 * Backend ile aynı validasyon kurallarını kullanır.
 * Bir alanı zorunlu/opsiyonel yapmak için:
 * 1. Backend: /apps/api/src/validation/bookingValidation.js
 * 2. Frontend: Bu dosya (aynı değişikliği yap)
 *
 * NOT: İleride bu iki dosyayı tek bir shared package'a taşıyabiliriz.
 */

import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'

// ==========================================
// VALIDATION FUNCTIONS
// ==========================================

/**
 * TC Kimlik Numarası Doğrulama
 */
export function validateTcNumber(tc) {
  if (!tc) return true // Optional - empty is valid
  if (tc.length !== 11) return false
  if (!/^\d{11}$/.test(tc)) return false
  if (tc[0] === '0') return false

  const digits = tc.split('').map(Number)
  const sum1 = digits[0] + digits[2] + digits[4] + digits[6] + digits[8]
  const sum2 = digits[1] + digits[3] + digits[5] + digits[7]
  const check1 = (sum1 * 7 - sum2) % 10
  const check2 = (sum1 + sum2 + digits[9]) % 10

  return digits[9] === check1 && digits[10] === check2
}

/**
 * Email Format Doğrulama
 */
export function validateEmail(email) {
  if (!email) return false
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

/**
 * Telefon Format Doğrulama
 */
export function validatePhone(phone) {
  if (!phone) return false
  const digits = phone.replace(/\D/g, '')
  return digits.length >= 10
}

/**
 * TC Numarası Formatla (sadece rakamlar, max 11)
 */
export function formatTcNumber(value) {
  if (!value) return ''
  return value.replace(/\D/g, '').slice(0, 11)
}

// ==========================================
// VALIDATION SCHEMA
// ==========================================

export const bookingValidationSchema = {
  // Lead Guest
  leadGuest: {
    title: {
      required: true,
      validate: (v) => ['mr', 'mrs'].includes(v),
      message: 'validation.titleRequired'
    },
    firstName: {
      required: true,
      validate: (v) => v && v.trim().length >= 2,
      message: 'validation.firstNameRequired'
    },
    lastName: {
      required: true,
      validate: (v) => v && v.trim().length >= 2,
      message: 'validation.lastNameRequired'
    },
    nationality: {
      required: true,
      validate: (v) => v && v.trim().length === 2,
      message: 'validation.nationalityRequired'
    },
    email: {
      required: true,
      validate: validateEmail,
      message: 'validation.emailRequired'
    },
    phone: {
      required: true,
      validate: validatePhone,
      message: 'validation.phoneRequired'
    },
    tcNumber: {
      required: false, // <<< TC ZORUNLU DEĞİL
      validate: validateTcNumber,
      message: 'validation.invalidTcNumber',
      showWhen: (data) => data?.nationality === 'TR'
    },
    birthDate: {
      required: false,
      validate: (v) => !v || !isNaN(Date.parse(v)),
      message: 'validation.invalidBirthDate'
    }
  },

  // Room Guest
  roomGuest: {
    title: {
      required: true,
      validate: (v) => ['mr', 'mrs'].includes(v),
      message: 'validation.titleRequired'
    },
    firstName: {
      required: true,
      validate: (v) => v && v.trim().length >= 2,
      message: 'validation.firstNameRequired'
    },
    lastName: {
      required: true,
      validate: (v) => v && v.trim().length >= 2,
      message: 'validation.lastNameRequired'
    },
    nationality: {
      required: true,
      validate: (v) => v && v.trim().length === 2,
      message: 'validation.nationalityRequired'
    },
    tcNumber: {
      required: false, // <<< TC ZORUNLU DEĞİL
      validate: validateTcNumber,
      message: 'validation.invalidTcNumber',
      showWhen: (data) => data?.nationality === 'TR'
    },
    birthDate: {
      required: (data) => data?.type === 'child' || data?.type === 'infant',
      validate: (v) => !v || !isNaN(Date.parse(v)),
      message: 'validation.birthDateRequired'
    }
  },

  // Invoice Individual
  invoiceIndividual: {
    firstName: {
      required: true,
      validate: (v) => v && v.trim().length >= 2,
      message: 'validation.firstNameRequired'
    },
    lastName: {
      required: true,
      validate: (v) => v && v.trim().length >= 2,
      message: 'validation.lastNameRequired'
    },
    tcNumber: {
      required: false, // <<< TC ZORUNLU DEĞİL
      validate: validateTcNumber,
      message: 'validation.invalidTcNumber',
      showWhen: (data, rootData) => rootData?.leadGuest?.nationality === 'TR'
    }
  },

  // Invoice Corporate
  invoiceCorporate: {
    companyName: {
      required: true,
      validate: (v) => v && v.trim().length >= 2,
      message: 'validation.companyNameRequired'
    },
    taxNumber: {
      required: true,
      validate: (v) => v && v.trim().length >= 10,
      message: 'validation.taxNumberRequired'
    },
    taxOffice: {
      required: true,
      validate: (v) => v && v.trim().length >= 2,
      message: 'validation.taxOfficeRequired'
    }
  },

  // Payment
  payment: {
    method: {
      required: true,
      validate: (v) => ['cash', 'credit_card', 'bank_transfer', 'pay_at_hotel'].includes(v),
      message: 'validation.paymentMethodRequired'
    }
  }
}

// ==========================================
// COMPOSABLE
// ==========================================

export function useBookingValidation() {
  const { t } = useI18n()

  /**
   * Tek bir alanı validate et
   */
  function validateField(schemaName, fieldName, value, data = {}, rootData = {}) {
    const schema = bookingValidationSchema[schemaName]
    if (!schema) return { valid: true }

    const field = schema[fieldName]
    if (!field) return { valid: true }

    // Required kontrolü
    const isRequired = typeof field.required === 'function'
      ? field.required(data)
      : field.required

    if (isRequired && (!value || (typeof value === 'string' && !value.trim()))) {
      return { valid: false, message: t(field.message) }
    }

    // Değer varsa format kontrolü
    if (value && field.validate && !field.validate(value, data)) {
      return { valid: false, message: t(field.message) }
    }

    return { valid: true }
  }

  /**
   * Bir objeyi validate et
   */
  function validateObject(schemaName, data, rootData = {}) {
    const schema = bookingValidationSchema[schemaName]
    if (!schema) return { valid: true, errors: [] }

    const errors = []

    for (const [fieldName, fieldSchema] of Object.entries(schema)) {
      const value = data?.[fieldName]
      const result = validateField(schemaName, fieldName, value, data, rootData)

      if (!result.valid) {
        errors.push({
          field: fieldName,
          message: result.message
        })
      }
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Alan için CSS class döndür (valid/invalid)
   */
  function getFieldClass(schemaName, fieldName, value, data = {}, showValidation = false) {
    if (!showValidation) return ''

    const result = validateField(schemaName, fieldName, value, data)

    if (!result.valid) {
      return 'border-red-500 bg-red-50 dark:bg-red-900/10 focus:border-red-500 focus:ring-red-500'
    }

    // Değer varsa yeşil göster
    if (value && (typeof value !== 'string' || value.trim())) {
      return 'border-green-500 bg-green-50 dark:bg-green-900/10'
    }

    return ''
  }

  /**
   * Alan zorunlu mu?
   */
  function isFieldRequired(schemaName, fieldName, data = {}) {
    const schema = bookingValidationSchema[schemaName]
    if (!schema) return false

    const field = schema[fieldName]
    if (!field) return false

    return typeof field.required === 'function'
      ? field.required(data)
      : field.required
  }

  /**
   * Alan gösterilmeli mi? (örn: TC sadece Türk vatandaşları için)
   */
  function shouldShowField(schemaName, fieldName, data = {}, rootData = {}) {
    const schema = bookingValidationSchema[schemaName]
    if (!schema) return true

    const field = schema[fieldName]
    if (!field) return true

    if (field.showWhen) {
      return field.showWhen(data, rootData)
    }

    return true
  }

  /**
   * Tüm booking verisini validate et
   */
  function validateBooking(bookingData) {
    const errors = []

    // Lead Guest
    const leadGuestResult = validateObject('leadGuest', bookingData.leadGuest, bookingData)
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
            return // Skip - lead guest kullanılacak
          }

          const guestResult = validateObject('roomGuest', guest, bookingData)
          if (!guestResult.valid) {
            const guestLabel = guest.type === 'adult'
              ? t('booking.validation.roomGuestAdult', { room: roomIndex + 1, guest: guestIndex + 1 })
              : t('booking.validation.roomGuestChild', { room: roomIndex + 1, guest: guestIndex + 1 })

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
      const invoiceResult = validateObject('invoiceIndividual', bookingData.invoiceDetails.individual, bookingData)
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
      const invoiceResult = validateObject('invoiceCorporate', bookingData.invoiceDetails.corporate, bookingData)
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
    const paymentResult = validateObject('payment', bookingData.payment, bookingData)
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
   * Hata mesajlarını kullanıcı dostu formata çevir
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
    // Schema
    schema: bookingValidationSchema,

    // Validation functions
    validateField,
    validateObject,
    validateBooking,
    formatErrors,

    // Helper functions
    getFieldClass,
    isFieldRequired,
    shouldShowField,

    // Format functions
    validateTcNumber,
    validateEmail,
    validatePhone,
    formatTcNumber
  }
}

export default useBookingValidation
