import mongoose from 'mongoose'
import auditPlugin from '#plugins/auditPlugin.js'

/**
 * TourDeparture Model
 * Tur hareket tarihleri ve fiyatlandırma
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

// Transfer noktası şeması
const pickupPointSchema = new mongoose.Schema({
  code: { type: String, required: true, uppercase: true },
  name: multiLangString(true),
  address: { type: String, trim: true },
  time: { type: String }, // "08:00"
  coordinates: {
    lat: { type: Number },
    lng: { type: Number }
  },
  additionalPrice: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { _id: true })

// Uçuş detayı şeması
const flightDetailSchema = new mongoose.Schema({
  direction: {
    type: String,
    enum: ['outbound', 'return'],
    required: true
  },
  carrier: { type: String, trim: true },
  carrierLogo: { type: String },
  flightNumber: { type: String, trim: true },
  departure: {
    airport: { type: String },
    airportCode: { type: String, uppercase: true },
    terminal: { type: String },
    time: { type: Date }
  },
  arrival: {
    airport: { type: String },
    airportCode: { type: String, uppercase: true },
    terminal: { type: String },
    time: { type: Date }
  },
  duration: { type: String }, // "3h 15m"
  class: {
    type: String,
    enum: ['economy', 'business', 'first'],
    default: 'economy'
  },
  baggage: {
    cabin: { type: String }, // "8 kg"
    checked: { type: String } // "23 kg"
  }
}, { _id: true })

// Ekstra fiyat override şeması
const extraPriceSchema = new mongoose.Schema({
  extraCode: { type: String, required: true, uppercase: true },
  price: { type: Number, required: true },
  currency: { type: String, default: 'EUR' }
}, { _id: false })

// Ana TourDeparture Schema
const tourDepartureSchema = new mongoose.Schema({
  // Multi-tenant
  partner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Partner',
    required: true,
    index: true
  },

  // Tur referansı
  tour: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tour',
    required: true,
    index: true
  },

  // Hareket kodu (opsiyonel)
  code: {
    type: String,
    uppercase: true,
    trim: true
  },

  // Tarih Bilgileri
  departureDate: {
    type: Date,
    required: true,
    index: true
  },
  returnDate: {
    type: Date,
    required: true
  },

  // Kapasite
  capacity: {
    total: { type: Number, required: true, min: 1 },
    available: { type: Number, required: true, min: 0 },
    reserved: { type: Number, default: 0 },
    sold: { type: Number, default: 0 },
    blocked: { type: Number, default: 0 } // Manuel bloke
  },

  // Garantili Hareket
  guaranteedDeparture: { type: Boolean, default: false },
  minParticipants: { type: Number, default: 1 },
  currentParticipants: { type: Number, default: 0 },

  // B2C Fiyatlandırma (kişi başı)
  pricing: {
    currency: { type: String, default: 'EUR' },
    adult: {
      single: { type: Number }, // Tek kişilik oda
      double: { type: Number }, // Çift kişilik oda (kişi başı)
      triple: { type: Number }, // Üç kişilik oda (kişi başı)
      quad: { type: Number } // Dört kişilik oda (kişi başı)
    },
    child: {
      withBed: { type: Number },
      withoutBed: { type: Number },
      minAge: { type: Number, default: 2 },
      maxAge: { type: Number, default: 12 }
    },
    infant: {
      price: { type: Number, default: 0 },
      maxAge: { type: Number, default: 2 }
    },
    singleSupplement: { type: Number, default: 0 }, // Tek kişi farkı
    // Ek ücretler
    taxes: { type: Number, default: 0 },
    fees: { type: Number, default: 0 }
  },

  // B2B Fiyatlandırma (acenteler için)
  b2bPricing: {
    enabled: { type: Boolean, default: true },
    workingMode: {
      type: String,
      enum: ['net', 'commission'],
      default: 'commission'
    },
    // Net fiyat modu
    netPrices: {
      adult: {
        single: { type: Number },
        double: { type: Number },
        triple: { type: Number }
      },
      child: {
        withBed: { type: Number },
        withoutBed: { type: Number }
      },
      infant: { type: Number }
    },
    // Komisyon modu
    commissionRate: { type: Number, default: 10, min: 0, max: 50 },
    agencyMarginShare: { type: Number, default: 50, min: 0, max: 100 }
  },

  // Erken rezervasyon indirimi
  earlyBird: {
    enabled: { type: Boolean, default: false },
    discountPercent: { type: Number, default: 0 },
    validUntil: { type: Date }
  },

  // Son dakika indirimi
  lastMinute: {
    enabled: { type: Boolean, default: false },
    discountPercent: { type: Number, default: 0 },
    validFrom: { type: Date }
  },

  // Ekstra Fiyatları (bu hareket için override)
  extraPrices: [extraPriceSchema],

  // Transfer Noktaları
  pickupPoints: [pickupPointSchema],

  // Uçuş Bilgileri
  flightDetails: [flightDetailSchema],

  // Otobüs Bilgileri
  busDetails: {
    company: { type: String },
    plateNumber: { type: String },
    seatCapacity: { type: Number },
    seatLayout: {
      type: String,
      enum: ['2+1', '2+2'],
      default: '2+1'
    },
    amenities: [{
      type: String,
      enum: ['wifi', 'tv', 'toilet', 'ac', 'usb', 'snack']
    }]
  },

  // Rehber Ataması
  guide: {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    name: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true },
    languages: [{ type: String }],
    notes: { type: String }
  },

  // Yardımcı Personel
  assistants: [{
    name: { type: String, trim: true },
    role: { type: String }, // "Transfer görevlisi", "Yerel rehber"
    phone: { type: String }
  }],

  // Konaklama Override (tur şablonundan farklı ise)
  accommodationOverride: [{
    originalHotelId: { type: mongoose.Schema.Types.ObjectId },
    newHotelName: { type: String },
    newHotelStars: { type: Number },
    reason: { type: String }
  }],

  // Durum
  status: {
    type: String,
    enum: ['scheduled', 'confirmed', 'cancelled', 'completed', 'sold_out', 'postponed'],
    default: 'scheduled',
    index: true
  },

  // İptal Bilgisi
  cancellation: {
    cancelledAt: { type: Date },
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason: { type: String },
    refundPolicy: { type: String }
  },

  // Görünürlük etiketleri (UI için)
  labels: [{
    type: String,
    enum: ['last_seats', 'popular', 'early_bird', 'last_minute', 'sold_out', 'guaranteed', 'special_offer']
  }],

  // Özel notlar
  notes: { type: String },
  internalNotes: { type: String },

  // Meta
  metadata: mongoose.Schema.Types.Mixed
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

// Indexes
tourDepartureSchema.index({ partner: 1, tour: 1 })
tourDepartureSchema.index({ partner: 1, departureDate: 1 })
tourDepartureSchema.index({ tour: 1, departureDate: 1 })
tourDepartureSchema.index({ tour: 1, status: 1 })
tourDepartureSchema.index({ departureDate: 1, status: 1 })
tourDepartureSchema.index({ partner: 1, status: 1, departureDate: 1 })

// Virtuals
tourDepartureSchema.virtual('isAvailable').get(function() {
  return this.status === 'scheduled' || this.status === 'confirmed'
})

tourDepartureSchema.virtual('availableSeats').get(function() {
  return Math.max(0, this.capacity.available - this.capacity.reserved)
})

tourDepartureSchema.virtual('isSoldOut').get(function() {
  return this.availableSeats === 0 || this.status === 'sold_out'
})

tourDepartureSchema.virtual('isGuaranteed').get(function() {
  return this.guaranteedDeparture || this.currentParticipants >= this.minParticipants
})

tourDepartureSchema.virtual('nights').get(function() {
  if (!this.departureDate || !this.returnDate) return 0
  const diff = this.returnDate - this.departureDate
  return Math.floor(diff / (1000 * 60 * 60 * 24))
})

tourDepartureSchema.virtual('days').get(function() {
  return this.nights + 1
})

tourDepartureSchema.virtual('cheapestPrice').get(function() {
  const prices = this.pricing?.adult || {}
  const validPrices = [prices.double, prices.triple, prices.quad].filter(p => p > 0)
  return validPrices.length > 0 ? Math.min(...validPrices) : prices.single || 0
})

tourDepartureSchema.virtual('bookings', {
  ref: 'TourBooking',
  localField: '_id',
  foreignField: 'departure'
})

// Pre-save middleware
tourDepartureSchema.pre('save', function(next) {
  // Auto-generate code if not provided
  if (!this.code && this.departureDate) {
    const date = new Date(this.departureDate)
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
    this.code = `DEP-${dateStr}`
  }

  // Auto-calculate available from total - sold - reserved - blocked
  if (this.isModified('capacity.sold') || this.isModified('capacity.reserved') || this.isModified('capacity.blocked')) {
    this.capacity.available = Math.max(0,
      this.capacity.total - this.capacity.sold - this.capacity.reserved - (this.capacity.blocked || 0)
    )
  }

  // Auto-update status if sold out
  if (this.capacity.available === 0 && this.status === 'scheduled') {
    this.status = 'sold_out'
  }

  // Auto-update labels
  this.updateLabels()

  next()
})

// Instance methods
tourDepartureSchema.methods.updateLabels = function() {
  const labels = []

  if (this.guaranteedDeparture || this.currentParticipants >= this.minParticipants) {
    labels.push('guaranteed')
  }

  if (this.availableSeats <= 5 && this.availableSeats > 0) {
    labels.push('last_seats')
  }

  if (this.availableSeats === 0) {
    labels.push('sold_out')
  }

  if (this.earlyBird?.enabled && this.earlyBird.validUntil > new Date()) {
    labels.push('early_bird')
  }

  if (this.lastMinute?.enabled && this.lastMinute.validFrom <= new Date()) {
    labels.push('last_minute')
  }

  this.labels = labels
}

tourDepartureSchema.methods.reserveSeats = async function(count) {
  if (this.availableSeats < count) {
    throw new Error('INSUFFICIENT_CAPACITY')
  }

  this.capacity.reserved += count
  this.capacity.available = Math.max(0, this.capacity.available - count)

  return this.save()
}

tourDepartureSchema.methods.confirmReservation = async function(count) {
  this.capacity.reserved = Math.max(0, this.capacity.reserved - count)
  this.capacity.sold += count
  this.currentParticipants += count

  if (this.capacity.available === 0) {
    this.status = 'sold_out'
  }

  return this.save()
}

tourDepartureSchema.methods.releaseReservation = async function(count) {
  this.capacity.reserved = Math.max(0, this.capacity.reserved - count)
  this.capacity.available += count

  if (this.status === 'sold_out' && this.capacity.available > 0) {
    this.status = 'scheduled'
  }

  return this.save()
}

tourDepartureSchema.methods.cancelBooking = async function(count) {
  this.capacity.sold = Math.max(0, this.capacity.sold - count)
  this.capacity.available += count
  this.currentParticipants = Math.max(0, this.currentParticipants - count)

  if (this.status === 'sold_out' && this.capacity.available > 0) {
    this.status = 'scheduled'
  }

  return this.save()
}

tourDepartureSchema.methods.calculatePrice = function(passengers, options = {}) {
  const { adults = 0, children = 0, infants = 0, roomType = 'double' } = passengers
  const pricing = options.isB2B && this.b2bPricing?.enabled
    ? this.b2bPricing.netPrices
    : this.pricing

  let total = 0

  // Adult pricing
  const adultPrice = pricing.adult?.[roomType] || pricing.adult?.double || 0
  total += adultPrice * adults

  // Child pricing
  const childPrice = options.withBed
    ? (pricing.child?.withBed || 0)
    : (pricing.child?.withoutBed || 0)
  total += childPrice * children

  // Infant pricing
  total += (pricing.infant?.price || pricing.infant || 0) * infants

  // Single supplement if applicable
  if (adults === 1 && roomType === 'single') {
    total += this.pricing.singleSupplement || 0
  }

  // Apply early bird discount
  if (this.earlyBird?.enabled && this.earlyBird.validUntil > new Date()) {
    total = total * (1 - this.earlyBird.discountPercent / 100)
  }

  // Apply last minute discount
  if (this.lastMinute?.enabled && this.lastMinute.validFrom <= new Date()) {
    total = total * (1 - this.lastMinute.discountPercent / 100)
  }

  return {
    subtotal: total,
    taxes: this.pricing.taxes || 0,
    fees: this.pricing.fees || 0,
    total: total + (this.pricing.taxes || 0) + (this.pricing.fees || 0),
    currency: this.pricing.currency
  }
}

// Audit trail
tourDepartureSchema.plugin(auditPlugin, {
  module: 'tour',
  subModule: 'departures',
  nameField: 'code'
})

// Static methods
tourDepartureSchema.statics.findByTour = function(tourId, options = {}) {
  const query = { tour: tourId }

  if (options.status) query.status = options.status
  if (options.fromDate) query.departureDate = { $gte: options.fromDate }
  if (options.toDate) {
    query.departureDate = query.departureDate || {}
    query.departureDate.$lte = options.toDate
  }

  return this.find(query).sort({ departureDate: 1 })
}

tourDepartureSchema.statics.findUpcoming = function(partnerId, days = 30) {
  const now = new Date()
  const future = new Date()
  future.setDate(future.getDate() + days)

  return this.find({
    partner: partnerId,
    departureDate: { $gte: now, $lte: future },
    status: { $in: ['scheduled', 'confirmed'] }
  })
    .populate('tour', 'name code tourType duration')
    .sort({ departureDate: 1 })
}

tourDepartureSchema.statics.findAvailable = function(tourId, options = {}) {
  const query = {
    tour: tourId,
    status: { $in: ['scheduled', 'confirmed'] },
    departureDate: { $gte: options.fromDate || new Date() },
    'capacity.available': { $gt: 0 }
  }

  if (options.toDate) {
    query.departureDate.$lte = options.toDate
  }

  if (options.minSeats) {
    query['capacity.available'] = { $gte: options.minSeats }
  }

  return this.find(query).sort({ departureDate: 1 })
}

tourDepartureSchema.statics.search = async function(partnerId, criteria = {}) {
  const {
    tourId,
    destination,
    fromDate,
    toDate,
    minSeats = 1,
    tourType,
    priceMin,
    priceMax,
    limit = 50
  } = criteria

  const pipeline = [
    {
      $match: {
        partner: new mongoose.Types.ObjectId(partnerId),
        status: { $in: ['scheduled', 'confirmed'] },
        departureDate: { $gte: fromDate || new Date() },
        'capacity.available': { $gte: minSeats }
      }
    },
    {
      $lookup: {
        from: 'tours',
        localField: 'tour',
        foreignField: '_id',
        as: 'tourData'
      }
    },
    { $unwind: '$tourData' },
    {
      $match: {
        'tourData.status': 'active',
        ...(tourId && { tour: new mongoose.Types.ObjectId(tourId) }),
        ...(destination && { 'tourData.destination.country': destination }),
        ...(tourType && { 'tourData.tourType': tourType }),
        ...(toDate && { departureDate: { $lte: toDate } })
      }
    }
  ]

  // Price filter
  if (priceMin || priceMax) {
    const priceMatch = {}
    if (priceMin) priceMatch.$gte = priceMin
    if (priceMax) priceMatch.$lte = priceMax
    pipeline.push({
      $match: { 'pricing.adult.double': priceMatch }
    })
  }

  pipeline.push(
    { $sort: { departureDate: 1 } },
    { $limit: limit },
    {
      $project: {
        _id: 1,
        code: 1,
        departureDate: 1,
        returnDate: 1,
        capacity: 1,
        pricing: 1,
        status: 1,
        labels: 1,
        guaranteedDeparture: 1,
        earlyBird: 1,
        lastMinute: 1,
        tour: {
          _id: '$tourData._id',
          code: '$tourData.code',
          name: '$tourData.name',
          tourType: '$tourData.tourType',
          duration: '$tourData.duration',
          destination: '$tourData.destination',
          mainImage: { $arrayElemAt: ['$tourData.images.url', 0] }
        }
      }
    }
  )

  return this.aggregate(pipeline)
}

export default mongoose.model('TourDeparture', tourDepartureSchema)
