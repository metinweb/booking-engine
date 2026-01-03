/**
 * Booking Validation Schema - Single Source of Truth
 *
 * Tüm rezervasyon validasyonları bu dosyada tanımlanır.
 * Backend (Mongoose) ve Frontend (API üzerinden) bu kuralları kullanır.
 *
 * Bir alanı zorunlu/opsiyonel yapmak için sadece burayı değiştirin.
 */

// TC Kimlik Numarası Algoritma Doğrulama
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

// Email Format Doğrulama
export function validateEmail(email) {
  if (!email) return false
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

// Telefon Format Doğrulama
export function validatePhone(phone) {
  if (!phone) return false
  // En az 10 rakam içermeli
  const digits = phone.replace(/\D/g, '')
  return digits.length >= 10
}

/**
 * Validation Schema
 *
 * Her alan için:
 * - required: boolean | function(data) => boolean
 * - validate: function(value, data) => boolean
 * - message: string (hata mesajı çeviri anahtarı)
 */
export const bookingValidationSchema = {
  // ==========================================
  // LEAD GUEST (Ana Misafir)
  // ==========================================
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
      // Sadece Türk vatandaşları için göster
      showWhen: (data) => data?.nationality === 'TR'
    },
    birthDate: {
      required: false,
      validate: (v) => !v || !isNaN(Date.parse(v)),
      message: 'validation.invalidBirthDate'
    }
  },

  // ==========================================
  // ROOM GUEST (Oda Misafirleri)
  // ==========================================
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
      // Çocuklar için zorunlu
      required: (data) => data?.type === 'child' || data?.type === 'infant',
      validate: (v) => !v || !isNaN(Date.parse(v)),
      message: 'validation.birthDateRequired'
    }
  },

  // ==========================================
  // INVOICE - INDIVIDUAL (Bireysel Fatura)
  // ==========================================
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

  // ==========================================
  // INVOICE - CORPORATE (Kurumsal Fatura)
  // ==========================================
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

  // ==========================================
  // PAYMENT (Ödeme)
  // ==========================================
  payment: {
    method: {
      required: true,
      validate: (v) => ['cash', 'credit_card', 'bank_transfer', 'pay_at_hotel'].includes(v),
      message: 'validation.paymentMethodRequired'
    }
  },

  // ==========================================
  // BOOKING (Rezervasyon Genel)
  // ==========================================
  booking: {
    hotel: {
      required: true,
      validate: (v) => !!v,
      message: 'validation.hotelRequired'
    },
    checkIn: {
      required: true,
      validate: (v) => v && !isNaN(Date.parse(v)),
      message: 'validation.checkInRequired'
    },
    checkOut: {
      required: true,
      validate: (v) => v && !isNaN(Date.parse(v)),
      message: 'validation.checkOutRequired'
    },
    rooms: {
      required: true,
      validate: (v) => v && v.length > 0,
      message: 'validation.roomsRequired'
    },
    invoiceType: {
      required: true,
      validate: (v) => ['individual', 'corporate'].includes(v),
      message: 'validation.invoiceTypeRequired'
    }
  }
}

/**
 * Tek bir alanı validate et
 */
export function validateField(schema, fieldName, value, data = {}, rootData = {}) {
  const field = schema[fieldName]
  if (!field) return { valid: true }

  // Required kontrolü
  const isRequired = typeof field.required === 'function'
    ? field.required(data)
    : field.required

  if (isRequired && (!value || (typeof value === 'string' && !value.trim()))) {
    return { valid: false, message: field.message }
  }

  // Değer varsa format kontrolü
  if (value && field.validate && !field.validate(value, data)) {
    return { valid: false, message: field.message }
  }

  return { valid: true }
}

/**
 * Bir objeyi schema'ya göre validate et
 */
export function validateObject(schema, data, rootData = {}) {
  const errors = []

  for (const [fieldName, fieldSchema] of Object.entries(schema)) {
    const value = data?.[fieldName]
    const result = validateField(schema, fieldName, value, data, rootData)

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
 * Tüm booking verisini validate et
 */
export function validateBooking(bookingData) {
  const errors = []

  // Lead Guest
  const leadGuestResult = validateObject(
    bookingValidationSchema.leadGuest,
    bookingData.leadGuest,
    bookingData
  )
  if (!leadGuestResult.valid) {
    leadGuestResult.errors.forEach(e => {
      errors.push({ ...e, section: 'leadGuest' })
    })
  }

  // Room Guests
  if (bookingData.roomGuests) {
    bookingData.roomGuests.forEach((room, roomIndex) => {
      room.forEach((guest, guestIndex) => {
        // İlk odanın ilk yetişkini lead guest olarak kullanılıyor olabilir
        if (roomIndex === 0 && guestIndex === 0 && guest.type === 'adult') {
          return // Skip - lead guest kullanılacak
        }

        const guestResult = validateObject(
          bookingValidationSchema.roomGuest,
          guest,
          bookingData
        )
        if (!guestResult.valid) {
          guestResult.errors.forEach(e => {
            errors.push({
              ...e,
              section: 'roomGuest',
              roomIndex,
              guestIndex
            })
          })
        }
      })
    })
  }

  // Invoice
  if (bookingData.invoiceDetails?.type === 'individual') {
    const invoiceResult = validateObject(
      bookingValidationSchema.invoiceIndividual,
      bookingData.invoiceDetails.individual,
      bookingData
    )
    if (!invoiceResult.valid) {
      invoiceResult.errors.forEach(e => {
        errors.push({ ...e, section: 'invoiceIndividual' })
      })
    }
  } else if (bookingData.invoiceDetails?.type === 'corporate') {
    const invoiceResult = validateObject(
      bookingValidationSchema.invoiceCorporate,
      bookingData.invoiceDetails.corporate,
      bookingData
    )
    if (!invoiceResult.valid) {
      invoiceResult.errors.forEach(e => {
        errors.push({ ...e, section: 'invoiceCorporate' })
      })
    }
  }

  // Payment
  const paymentResult = validateObject(
    bookingValidationSchema.payment,
    bookingData.payment,
    bookingData
  )
  if (!paymentResult.valid) {
    paymentResult.errors.forEach(e => {
      errors.push({ ...e, section: 'payment' })
    })
  }

  // Booking general
  const bookingResult = validateObject(
    bookingValidationSchema.booking,
    {
      hotel: bookingData.hotel,
      checkIn: bookingData.checkIn,
      checkOut: bookingData.checkOut,
      rooms: bookingData.rooms,
      invoiceType: bookingData.invoiceDetails?.type
    },
    bookingData
  )
  if (!bookingResult.valid) {
    bookingResult.errors.forEach(e => {
      errors.push({ ...e, section: 'booking' })
    })
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * Schema'yı frontend için JSON olarak döndür
 * (fonksiyonlar hariç)
 */
export function getSchemaForFrontend() {
  const simplifySchema = (schema) => {
    const result = {}
    for (const [field, config] of Object.entries(schema)) {
      result[field] = {
        required: typeof config.required === 'function' ? 'dynamic' : config.required,
        message: config.message,
        hasShowWhen: !!config.showWhen
      }
    }
    return result
  }

  return {
    leadGuest: simplifySchema(bookingValidationSchema.leadGuest),
    roomGuest: simplifySchema(bookingValidationSchema.roomGuest),
    invoiceIndividual: simplifySchema(bookingValidationSchema.invoiceIndividual),
    invoiceCorporate: simplifySchema(bookingValidationSchema.invoiceCorporate),
    payment: simplifySchema(bookingValidationSchema.payment),
    booking: simplifySchema(bookingValidationSchema.booking)
  }
}

export default {
  schema: bookingValidationSchema,
  validateField,
  validateObject,
  validateBooking,
  validateTcNumber,
  validateEmail,
  validatePhone,
  getSchemaForFrontend
}
