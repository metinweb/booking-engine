import mongoose from 'mongoose'
import auditPlugin from '#plugins/auditPlugin.js'

/**
 * TourExtra Model
 * Opsiyonel ekstralar - aktiviteler, yemekler, transferler, vize hizmetleri
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

// Görsel şeması
const imageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  caption: multiLangString(),
  isMain: { type: Boolean, default: false }
}, { _id: false })

// Ana TourExtra Schema
const tourExtraSchema = new mongoose.Schema({
  // Multi-tenant
  partner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Partner',
    required: true,
    index: true
  },

  // Temel Bilgiler
  code: {
    type: String,
    required: true,
    uppercase: true,
    trim: true,
    maxlength: 20
  },
  name: multiLangString(true),
  description: multiLangString(),
  shortDescription: multiLangString(),

  // Kategori
  category: {
    type: String,
    enum: ['activity', 'meal', 'transfer', 'upgrade', 'visa', 'insurance', 'equipment', 'other'],
    required: true,
    index: true
  },

  // Alt kategori (opsiyonel)
  subCategory: { type: String, trim: true },

  // Fiyatlandırma
  priceType: {
    type: String,
    enum: ['per_person', 'per_group', 'per_unit', 'per_night'],
    default: 'per_person'
  },
  defaultPrice: {
    type: Number,
    default: 0,
    min: 0
  },
  currency: {
    type: String,
    default: 'EUR'
  },

  // B2B Fiyatlandırma
  b2bPrice: {
    type: Number,
    min: 0
  },

  // Süre (aktiviteler için)
  duration: {
    value: { type: Number },
    unit: {
      type: String,
      enum: ['minutes', 'hours', 'days'],
      default: 'hours'
    }
  },

  // Uygulanabilir Turlar
  applicableTours: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tour'
  }],

  // Tüm turlara uygulanabilir mi?
  applyToAllTours: { type: Boolean, default: false },

  // Minimum/Maksimum kişi sayısı
  participants: {
    min: { type: Number, default: 1 },
    max: { type: Number }
  },

  // Yaş kısıtlaması
  ageRestriction: {
    minAge: { type: Number },
    maxAge: { type: Number }
  },

  // Dahil olanlar
  inclusions: [multiLangString()],

  // Hariç olanlar
  exclusions: [multiLangString()],

  // Önemli notlar
  importantNotes: [multiLangString()],

  // Görseller
  images: [imageSchema],

  // Video URL
  videoUrl: { type: String },

  // Lokasyon bilgisi (aktiviteler için)
  location: {
    name: { type: String },
    address: { type: String },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number }
    }
  },

  // Tedarikçi bilgisi
  supplier: {
    name: { type: String },
    contact: { type: String },
    notes: { type: String }
  },

  // Popüler/Öne çıkan
  isPopular: { type: Boolean, default: false },
  isFeatured: { type: Boolean, default: false },
  displayOrder: { type: Number, default: 0 },

  // Stok/Kapasite (grup turları için)
  hasCapacity: { type: Boolean, default: false },
  defaultCapacity: { type: Number },

  // İptal politikası
  cancellationPolicy: {
    refundable: { type: Boolean, default: true },
    refundDaysBeforeDeparture: { type: Number, default: 2 },
    refundPercent: { type: Number, default: 100 }
  },

  // Rezervasyon gereksinimleri
  requiresAdvanceBooking: { type: Boolean, default: false },
  advanceBookingDays: { type: Number, default: 1 },

  // Sezonluk fiyatlandırma
  seasonalPricing: [{
    name: { type: String },
    startDate: { type: Date },
    endDate: { type: Date },
    price: { type: Number },
    b2bPrice: { type: Number }
  }],

  // Durum
  status: {
    type: String,
    enum: ['active', 'inactive', 'archived'],
    default: 'active',
    index: true
  },

  // Meta
  metadata: mongoose.Schema.Types.Mixed
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

// Indexes
tourExtraSchema.index({ partner: 1, code: 1 }, { unique: true })
tourExtraSchema.index({ partner: 1, status: 1 })
tourExtraSchema.index({ partner: 1, category: 1 })
tourExtraSchema.index({ applicableTours: 1 })
tourExtraSchema.index({ isPopular: 1, displayOrder: 1 })
tourExtraSchema.index({ 'name.tr': 'text', 'name.en': 'text', 'description.tr': 'text' })

// Virtuals
tourExtraSchema.virtual('mainImage').get(function() {
  const main = this.images?.find(img => img.isMain)
  return main?.url || this.images?.[0]?.url || null
})

tourExtraSchema.virtual('formattedDuration').get(function() {
  if (!this.duration?.value) return null

  const { value, unit } = this.duration
  const labels = {
    minutes: value === 1 ? 'dakika' : 'dakika',
    hours: value === 1 ? 'saat' : 'saat',
    days: value === 1 ? 'gün' : 'gün'
  }

  return `${value} ${labels[unit]}`
})

// Instance methods
tourExtraSchema.methods.getPriceForDate = function(date, isB2B = false) {
  // Check seasonal pricing first
  if (this.seasonalPricing?.length > 0 && date) {
    const checkDate = new Date(date)
    const seasonal = this.seasonalPricing.find(sp =>
      checkDate >= sp.startDate && checkDate <= sp.endDate
    )

    if (seasonal) {
      return isB2B && seasonal.b2bPrice ? seasonal.b2bPrice : seasonal.price
    }
  }

  // Return default price
  return isB2B && this.b2bPrice ? this.b2bPrice : this.defaultPrice
}

tourExtraSchema.methods.isAvailableForTour = function(tourId) {
  if (this.applyToAllTours) return true
  if (!this.applicableTours?.length) return true

  return this.applicableTours.some(id =>
    id.toString() === tourId.toString()
  )
}

// Audit trail
tourExtraSchema.plugin(auditPlugin, {
  module: 'tour',
  subModule: 'extras',
  nameField: 'name.tr'
})

// Static methods
tourExtraSchema.statics.findByPartner = function(partnerId, options = {}) {
  const query = { partner: partnerId }

  if (options.status) query.status = options.status
  if (options.category) query.category = options.category

  return this.find(query).sort({ displayOrder: 1, createdAt: -1 })
}

tourExtraSchema.statics.findActive = function(partnerId) {
  return this.find({ partner: partnerId, status: 'active' })
    .sort({ displayOrder: 1 })
}

tourExtraSchema.statics.findForTour = function(partnerId, tourId) {
  return this.find({
    partner: partnerId,
    status: 'active',
    $or: [
      { applyToAllTours: true },
      { applicableTours: tourId },
      { applicableTours: { $size: 0 } }
    ]
  }).sort({ category: 1, displayOrder: 1 })
}

tourExtraSchema.statics.findByCategory = function(partnerId, category) {
  return this.find({
    partner: partnerId,
    status: 'active',
    category
  }).sort({ displayOrder: 1 })
}

tourExtraSchema.statics.findPopular = function(partnerId, limit = 6) {
  return this.find({
    partner: partnerId,
    status: 'active',
    isPopular: true
  })
    .sort({ displayOrder: 1 })
    .limit(limit)
}

export default mongoose.model('TourExtra', tourExtraSchema)
