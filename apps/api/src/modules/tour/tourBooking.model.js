import mongoose from 'mongoose'
import auditPlugin from '#plugins/auditPlugin.js'

/**
 * TourBooking Model
 * Tur rezervasyonları - yolcular, odalar, ekstralar, vize takibi, ödeme
 */

// Desteklenen diller (B2C - 20 dil)
const SUPPORTED_LANGUAGES = [
  'tr', 'en', 'ru', 'el', 'de', 'es', 'it', 'fr', 'ro', 'bg',
  'pt', 'da', 'zh', 'ar', 'fa', 'he', 'sq', 'uk', 'pl', 'az'
]

const multiLangString = (required = false) => {
  const schema = {}
  SUPPORTED_LANGUAGES.forEach(lang => {
    schema[lang] = {
      type: String,
      trim: true,
      default: '',
      ...(required && lang === 'tr' ? { required: true } : {})
    }
  })
  return schema
}

// Yolcu şeması
const passengerSchema = new mongoose.Schema({
  // Yolcu tipi
  type: {
    type: String,
    enum: ['adult', 'child', 'infant'],
    default: 'adult'
  },

  // Kişisel bilgiler
  title: {
    type: String,
    enum: ['mr', 'mrs', 'ms', 'miss', 'dr', 'prof'],
    default: 'mr'
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  dateOfBirth: { type: Date },
  age: { type: Number },

  // Kimlik bilgileri
  nationality: { type: String, uppercase: true }, // ISO country code
  tcNumber: { type: String, trim: true }, // TC Kimlik No
  passportNumber: { type: String, trim: true },
  passportCountry: { type: String, uppercase: true },
  passportExpiry: { type: Date },
  idCardNumber: { type: String, trim: true },

  // İletişim
  phone: { type: String, trim: true },
  email: { type: String, trim: true, lowercase: true },

  // Atamalar
  roomAssignment: { type: Number }, // Oda numarası
  seatAssignment: { type: String }, // Koltuk (otobüs: "1A", "12B")
  bedPreference: {
    type: String,
    enum: ['single', 'double', 'twin', 'no_preference'],
    default: 'no_preference'
  },

  // Özel gereksinimler
  dietaryRequirements: [{
    type: String,
    enum: ['vegetarian', 'vegan', 'halal', 'kosher', 'gluten_free', 'lactose_free', 'none']
  }],
  medicalConditions: { type: String },
  wheelchairRequired: { type: Boolean, default: false },
  specialAssistance: { type: String },

  // Lead passenger (ana yolcu / booker)
  isLead: { type: Boolean, default: false },

  // Ekstra bilgiler
  notes: { type: String }
}, { _id: true })

// Oda konfigürasyonu şeması
const roomConfigSchema = new mongoose.Schema({
  roomNumber: { type: Number, required: true },
  roomType: {
    type: String,
    enum: ['single', 'double', 'twin', 'triple', 'quad', 'family'],
    default: 'double'
  },
  passengers: [{ type: Number }], // Yolcu indexleri
  notes: { type: String }
}, { _id: false })

// Seçilen ekstra şeması
const selectedExtraSchema = new mongoose.Schema({
  extra: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TourExtra'
  },
  code: { type: String, required: true },
  name: multiLangString(),
  category: { type: String },
  quantity: { type: Number, default: 1 },
  unitPrice: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  currency: { type: String, default: 'EUR' },
  // Hangi yolculara uygulandığı
  passengers: [{ type: Number }], // Yolcu indexleri
  // Tarih (günlük ekstralar için)
  date: { type: Date },
  notes: { type: String }
}, { _id: true })

// Vize durumu şeması
const visaStatusSchema = new mongoose.Schema({
  passengerIndex: { type: Number, required: true },
  passengerName: { type: String },

  status: {
    type: String,
    enum: ['not_required', 'pending_documents', 'documents_submitted', 'appointment_scheduled', 'submitted', 'approved', 'rejected', 'expired'],
    default: 'pending_documents'
  },

  // Randevu bilgisi
  appointment: {
    date: { type: Date },
    time: { type: String },
    location: { type: String },
    reference: { type: String }
  },

  // Evraklar
  documents: [{
    type: {
      type: String,
      enum: ['passport_copy', 'photo', 'application_form', 'bank_statement', 'employment_letter', 'hotel_reservation', 'flight_ticket', 'insurance', 'other']
    },
    name: { type: String },
    url: { type: String },
    uploadedAt: { type: Date, default: Date.now },
    verified: { type: Boolean, default: false }
  }],

  // Sonuç
  result: {
    visaNumber: { type: String },
    validFrom: { type: Date },
    validUntil: { type: Date },
    entries: { type: String }, // 'single', 'multiple'
    rejectionReason: { type: String }
  },

  notes: { type: String },
  lastUpdated: { type: Date, default: Date.now },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { _id: true })

// Ödeme kayıt şeması
const paymentRecordSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['payment', 'refund', 'adjustment'],
    required: true
  },
  method: {
    type: String,
    enum: ['credit_card', 'bank_transfer', 'cash', 'agency_credit', 'online'],
    required: true
  },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'EUR' },
  date: { type: Date, default: Date.now },
  reference: { type: String },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  notes: { type: String },
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  // Gateway bilgisi
  gateway: {
    name: { type: String },
    transactionId: { type: String },
    response: mongoose.Schema.Types.Mixed
  }
}, { _id: true })

// Değişiklik geçmişi şeması
const changeLogSchema = new mongoose.Schema({
  action: {
    type: String,
    enum: ['created', 'updated', 'status_changed', 'passenger_added', 'passenger_updated', 'extra_added', 'extra_removed', 'payment_added', 'visa_updated', 'note_added', 'cancelled'],
    required: true
  },
  field: { type: String },
  oldValue: mongoose.Schema.Types.Mixed,
  newValue: mongoose.Schema.Types.Mixed,
  description: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
}, { _id: false })

// Ana TourBooking Schema
const tourBookingSchema = new mongoose.Schema({
  // Multi-tenant
  partner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Partner',
    required: true,
    index: true
  },

  // Rezervasyon numarası
  bookingNumber: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    index: true
  },

  // Tur ve Hareket referansları
  tour: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tour',
    required: true,
    index: true
  },
  departure: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TourDeparture',
    required: true,
    index: true
  },

  // Tur bilgileri snapshot
  tourSnapshot: {
    code: { type: String },
    name: multiLangString(),
    tourType: { type: String },
    duration: {
      nights: { type: Number },
      days: { type: Number }
    },
    destination: {
      country: { type: String },
      city: { type: String }
    },
    mainImage: { type: String }
  },

  // Hareket bilgileri snapshot
  departureSnapshot: {
    departureDate: { type: Date },
    returnDate: { type: Date },
    code: { type: String }
  },

  // Satış Kanalı
  salesChannel: {
    type: String,
    enum: ['b2c', 'b2b'],
    default: 'b2c',
    index: true
  },

  // Kaynak bilgisi
  source: {
    type: {
      type: String,
      enum: ['b2c', 'b2b', 'admin', 'api', 'phone', 'walk_in'],
      default: 'b2c'
    },
    agencyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Agency'
    },
    agencyName: { type: String },
    agencyUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AgencyUser'
    },
    agentName: { type: String },
    sessionId: { type: String },
    ipAddress: { type: String },
    userAgent: { type: String }
  },

  // Yolcular
  passengers: [passengerSchema],
  totalPassengers: {
    adults: { type: Number, default: 0 },
    children: { type: Number, default: 0 },
    infants: { type: Number, default: 0 }
  },

  // İletişim bilgisi (lead passenger'dan farklı olabilir)
  contact: {
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    alternativePhone: { type: String, trim: true },
    preferredLanguage: { type: String, default: 'tr' }
  },

  // Transfer noktası
  pickupPoint: {
    code: { type: String },
    name: multiLangString(),
    address: { type: String },
    time: { type: String },
    additionalPrice: { type: Number, default: 0 }
  },

  // Seçilen ekstralar
  extras: [selectedExtraSchema],

  // Oda konfigürasyonu
  roomConfiguration: [roomConfigSchema],
  totalRooms: {
    single: { type: Number, default: 0 },
    double: { type: Number, default: 0 },
    triple: { type: Number, default: 0 },
    other: { type: Number, default: 0 }
  },

  // Fiyatlandırma
  pricing: {
    currency: { type: String, default: 'EUR' },

    // Ana fiyatlar
    adults: {
      count: { type: Number, default: 0 },
      unitPrice: { type: Number, default: 0 },
      total: { type: Number, default: 0 }
    },
    children: {
      count: { type: Number, default: 0 },
      unitPrice: { type: Number, default: 0 },
      total: { type: Number, default: 0 }
    },
    infants: {
      count: { type: Number, default: 0 },
      unitPrice: { type: Number, default: 0 },
      total: { type: Number, default: 0 }
    },

    // Ek fiyatlar
    singleSupplement: { type: Number, default: 0 },
    pickupPointFee: { type: Number, default: 0 },
    extrasTotal: { type: Number, default: 0 },

    // Toplamlar
    subtotal: { type: Number, default: 0 },
    discount: {
      amount: { type: Number, default: 0 },
      percent: { type: Number },
      reason: { type: String },
      code: { type: String }
    },
    taxes: { type: Number, default: 0 },
    fees: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true },

    // B2B fiyatlandırma
    netPrice: { type: Number },
    commission: { type: Number },
    commissionRate: { type: Number },
    agencyMargin: { type: Number }
  },

  // Ödeme
  payment: {
    status: {
      type: String,
      enum: ['pending', 'partial', 'paid', 'refunded', 'failed'],
      default: 'pending'
    },
    method: {
      type: String,
      enum: ['credit_card', 'bank_transfer', 'cash', 'agency_credit', 'online', 'pay_later'],
      default: 'credit_card'
    },
    paidAmount: { type: Number, default: 0 },
    dueAmount: { type: Number },
    dueDate: { type: Date },
    records: [paymentRecordSchema]
  },

  // Fatura bilgileri
  invoiceDetails: {
    type: {
      type: String,
      enum: ['individual', 'corporate']
    },
    individual: {
      firstName: { type: String, trim: true },
      lastName: { type: String, trim: true },
      tcNumber: { type: String, trim: true },
      address: {
        street: { type: String },
        district: { type: String },
        city: { type: String },
        postalCode: { type: String },
        country: { type: String, default: 'TR' }
      }
    },
    corporate: {
      companyName: { type: String, trim: true },
      taxNumber: { type: String, trim: true },
      taxOffice: { type: String, trim: true },
      address: {
        street: { type: String },
        district: { type: String },
        city: { type: String },
        postalCode: { type: String },
        country: { type: String, default: 'TR' }
      }
    }
  },

  // Rezervasyon durumu
  status: {
    type: String,
    enum: ['draft', 'pending', 'confirmed', 'cancelled', 'completed', 'no_show', 'expired'],
    default: 'pending',
    index: true
  },

  // Mevcut faz (draft rezervasyonlar için)
  currentPhase: {
    type: Number,
    enum: [1, 2, 3, 4],
    default: 1
  },

  // Vize durumları
  visaStatuses: [visaStatusSchema],
  visaRequired: { type: Boolean, default: false },

  // Onay bilgisi
  confirmation: {
    confirmedAt: { type: Date },
    confirmedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    confirmationNumber: { type: String },
    confirmationSentAt: { type: Date }
  },

  // İptal bilgisi
  cancellation: {
    cancelledAt: { type: Date },
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: { type: String },
    refundAmount: { type: Number, default: 0 },
    refundStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'declined']
    },
    policy: {
      daysBeforeDeparture: { type: Number },
      refundPercent: { type: Number }
    }
  },

  // Özel istekler
  specialRequests: { type: String, trim: true },

  // Notlar
  notes: [{
    content: { type: String, required: true },
    isInternal: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
  }],

  // Değişiklik geçmişi
  changeLog: [changeLogSchema],

  // Tarihler
  expiresAt: { type: Date, index: true }, // Draft için
  lastActivityAt: { type: Date, default: Date.now },
  completedAt: { type: Date },

  // Harici referanslar
  externalReferences: {
    supplierConfirmation: { type: String },
    pmsReservationId: { type: String }
  },

  // Meta
  metadata: mongoose.Schema.Types.Mixed
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

// Indexes
tourBookingSchema.index({ partner: 1, bookingNumber: 1 })
tourBookingSchema.index({ partner: 1, status: 1 })
tourBookingSchema.index({ partner: 1, tour: 1 })
tourBookingSchema.index({ partner: 1, departure: 1 })
tourBookingSchema.index({ 'contact.email': 1 })
tourBookingSchema.index({ 'source.agencyId': 1 })
tourBookingSchema.index({ 'departureSnapshot.departureDate': 1 })
tourBookingSchema.index({ createdAt: -1 })
tourBookingSchema.index({ status: 1, expiresAt: 1 }) // Draft expire job için

// Virtuals
tourBookingSchema.virtual('totalPassengerCount').get(function() {
  return this.passengers?.length || 0
})

tourBookingSchema.virtual('leadPassenger').get(function() {
  return this.passengers?.find(p => p.isLead) || this.passengers?.[0]
})

tourBookingSchema.virtual('isPaid').get(function() {
  return this.payment?.status === 'paid'
})

tourBookingSchema.virtual('isConfirmed').get(function() {
  return this.status === 'confirmed'
})

tourBookingSchema.virtual('canCancel').get(function() {
  return ['pending', 'confirmed'].includes(this.status)
})

tourBookingSchema.virtual('daysUntilDeparture').get(function() {
  if (!this.departureSnapshot?.departureDate) return null
  const now = new Date()
  const departure = new Date(this.departureSnapshot.departureDate)
  const diff = departure - now
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
})

// Pre-save middleware
tourBookingSchema.pre('save', async function(next) {
  // Generate booking number for new bookings
  if (this.isNew && !this.bookingNumber) {
    this.bookingNumber = await this.constructor.generateBookingNumber(this.partner, this.status === 'draft' ? 'draft' : 'tour')
  }

  // Calculate total passengers
  if (this.isModified('passengers')) {
    this.totalPassengers = {
      adults: this.passengers.filter(p => p.type === 'adult').length,
      children: this.passengers.filter(p => p.type === 'child').length,
      infants: this.passengers.filter(p => p.type === 'infant').length
    }
  }

  // Calculate payment due amount
  if (this.pricing && this.payment) {
    this.payment.dueAmount = this.pricing.grandTotal - (this.payment.paidAmount || 0)
  }

  // Set expiresAt for drafts (48 hours)
  if (this.isNew && this.status === 'draft' && !this.expiresAt) {
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 48)
    this.expiresAt = expiresAt
  }

  // Update lastActivityAt
  if (this.isModified() && !this.isNew) {
    this.lastActivityAt = new Date()
  }

  // Set confirmedAt
  if (this.isModified('status') && this.status === 'confirmed' && !this.confirmation?.confirmedAt) {
    this.confirmation = this.confirmation || {}
    this.confirmation.confirmedAt = new Date()
    this.expiresAt = undefined
  }

  // Set completedAt
  if (this.isModified('status') && this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date()
  }

  next()
})

// Audit trail
tourBookingSchema.plugin(auditPlugin, {
  module: 'tour',
  subModule: 'bookings',
  nameField: 'bookingNumber'
})

// Static methods
tourBookingSchema.statics.generateBookingNumber = async function(partnerId, type = 'tour') {
  const prefix = type === 'draft' ? 'TDR' : 'TUR'
  const year = new Date().getFullYear()

  const lastBooking = await this.findOne({
    bookingNumber: new RegExp(`^${prefix}-${year}-`)
  }).sort({ bookingNumber: -1 })

  let sequence = 1
  if (lastBooking) {
    const parts = lastBooking.bookingNumber.split('-')
    if (parts.length === 3) {
      const lastSequence = parseInt(parts[2])
      if (!isNaN(lastSequence)) {
        sequence = lastSequence + 1
      }
    }
  }

  return `${prefix}-${year}-${String(sequence).padStart(6, '0')}`
}

tourBookingSchema.statics.findByPartner = function(partnerId, options = {}) {
  const query = { partner: partnerId }

  if (options.status) query.status = options.status
  if (options.tour) query.tour = options.tour
  if (options.departure) query.departure = options.departure
  if (options.salesChannel) query.salesChannel = options.salesChannel

  return this.find(query).sort({ createdAt: -1 })
}

tourBookingSchema.statics.findByBookingNumber = function(bookingNumber) {
  return this.findOne({ bookingNumber: bookingNumber.toUpperCase() })
}

tourBookingSchema.statics.findByDeparture = function(departureId) {
  return this.find({
    departure: departureId,
    status: { $nin: ['cancelled', 'expired'] }
  }).sort({ createdAt: -1 })
}

tourBookingSchema.statics.findUpcoming = function(partnerId, days = 30) {
  const now = new Date()
  const future = new Date()
  future.setDate(future.getDate() + days)

  return this.find({
    partner: partnerId,
    'departureSnapshot.departureDate': { $gte: now, $lte: future },
    status: { $in: ['pending', 'confirmed'] }
  })
    .populate('tour', 'name code')
    .sort({ 'departureSnapshot.departureDate': 1 })
}

tourBookingSchema.statics.getStats = async function(partnerId, filters = {}) {
  const match = { partner: new mongoose.Types.ObjectId(partnerId) }

  if (filters.fromDate) {
    match.createdAt = { $gte: filters.fromDate }
  }
  if (filters.toDate) {
    match.createdAt = match.createdAt || {}
    match.createdAt.$lte = filters.toDate
  }

  const pipeline = [
    { $match: match },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalRevenue: { $sum: '$pricing.grandTotal' },
        totalPassengers: { $sum: { $add: ['$totalPassengers.adults', '$totalPassengers.children', '$totalPassengers.infants'] } }
      }
    }
  ]

  return this.aggregate(pipeline)
}

// Instance methods
tourBookingSchema.methods.addPassenger = function(passengerData) {
  this.passengers.push(passengerData)
  this.addChangeLog('passenger_added', null, null, passengerData, `Yolcu eklendi: ${passengerData.firstName} ${passengerData.lastName}`)
  return this.save()
}

tourBookingSchema.methods.updatePassenger = function(passengerId, updates) {
  const passenger = this.passengers.id(passengerId)
  if (!passenger) throw new Error('Passenger not found')

  const oldValue = passenger.toObject()
  Object.assign(passenger, updates)

  this.addChangeLog('passenger_updated', null, oldValue, updates, `Yolcu güncellendi: ${passenger.firstName} ${passenger.lastName}`)
  return this.save()
}

tourBookingSchema.methods.addExtra = function(extraData) {
  this.extras.push(extraData)

  // Recalculate extras total
  this.pricing.extrasTotal = this.extras.reduce((sum, e) => sum + e.totalPrice, 0)
  this.pricing.grandTotal = this.pricing.subtotal - (this.pricing.discount?.amount || 0) + this.pricing.extrasTotal + this.pricing.taxes + this.pricing.fees

  this.addChangeLog('extra_added', null, null, extraData, `Ekstra eklendi: ${extraData.code}`)
  return this.save()
}

tourBookingSchema.methods.removeExtra = function(extraId) {
  const extra = this.extras.id(extraId)
  if (!extra) throw new Error('Extra not found')

  const extraData = extra.toObject()
  extra.deleteOne()

  // Recalculate extras total
  this.pricing.extrasTotal = this.extras.reduce((sum, e) => sum + e.totalPrice, 0)
  this.pricing.grandTotal = this.pricing.subtotal - (this.pricing.discount?.amount || 0) + this.pricing.extrasTotal + this.pricing.taxes + this.pricing.fees

  this.addChangeLog('extra_removed', null, extraData, null, `Ekstra kaldırıldı: ${extraData.code}`)
  return this.save()
}

tourBookingSchema.methods.addPayment = function(paymentData, userId) {
  this.payment.records.push({
    ...paymentData,
    processedBy: userId
  })

  // Update paid amount
  const completedPayments = this.payment.records.filter(r => r.type === 'payment' && r.status === 'completed')
  this.payment.paidAmount = completedPayments.reduce((sum, p) => sum + p.amount, 0)
  this.payment.dueAmount = this.pricing.grandTotal - this.payment.paidAmount

  // Update payment status
  if (this.payment.paidAmount >= this.pricing.grandTotal) {
    this.payment.status = 'paid'
  } else if (this.payment.paidAmount > 0) {
    this.payment.status = 'partial'
  }

  this.addChangeLog('payment_added', null, null, paymentData, `Ödeme eklendi: ${paymentData.amount} ${paymentData.currency}`)
  return this.save()
}

tourBookingSchema.methods.updateVisaStatus = function(passengerIndex, statusData, userId) {
  let visaStatus = this.visaStatuses.find(v => v.passengerIndex === passengerIndex)

  if (!visaStatus) {
    const passenger = this.passengers[passengerIndex]
    this.visaStatuses.push({
      passengerIndex,
      passengerName: `${passenger?.firstName} ${passenger?.lastName}`,
      ...statusData,
      lastUpdated: new Date(),
      updatedBy: userId
    })
  } else {
    Object.assign(visaStatus, statusData, {
      lastUpdated: new Date(),
      updatedBy: userId
    })
  }

  this.addChangeLog('visa_updated', null, null, statusData, `Vize durumu güncellendi: Yolcu ${passengerIndex + 1}`)
  return this.save()
}

tourBookingSchema.methods.addNote = function(content, isInternal, userId) {
  this.notes.push({
    content,
    isInternal,
    createdBy: userId
  })

  this.addChangeLog('note_added', null, null, { content, isInternal }, 'Not eklendi')
  return this.save()
}

tourBookingSchema.methods.addChangeLog = function(action, field, oldValue, newValue, description, userId) {
  this.changeLog.push({
    action,
    field,
    oldValue,
    newValue,
    description,
    createdBy: userId
  })
}

tourBookingSchema.methods.cancel = function(reason, userId) {
  if (!this.canCancel) {
    throw new Error('Booking cannot be cancelled')
  }

  const oldStatus = this.status
  this.status = 'cancelled'
  this.cancellation = {
    cancelledAt: new Date(),
    cancelledBy: userId,
    reason
  }

  this.addChangeLog('cancelled', 'status', oldStatus, 'cancelled', `Rezervasyon iptal edildi: ${reason}`, userId)
  return this.save()
}

tourBookingSchema.methods.confirm = function(userId) {
  if (this.status !== 'pending') {
    throw new Error('Only pending bookings can be confirmed')
  }

  const oldStatus = this.status
  this.status = 'confirmed'
  this.confirmation = {
    confirmedAt: new Date(),
    confirmedBy: userId
  }

  this.addChangeLog('status_changed', 'status', oldStatus, 'confirmed', 'Rezervasyon onaylandı', userId)
  return this.save()
}

export default mongoose.model('TourBooking', tourBookingSchema)
