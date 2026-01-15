import mongoose from 'mongoose'
import auditPlugin from '#plugins/auditPlugin.js'

/**
 * Tour Model
 * Tur paketleri için ana model - uçak, otobüs, gemi, araç turları destekler
 */

// Desteklenen diller (B2C - 20 dil)
const SUPPORTED_LANGUAGES = [
  'tr', 'en', 'ru', 'el', 'de', 'es', 'it', 'fr', 'ro', 'bg',
  'pt', 'da', 'zh', 'ar', 'fa', 'he', 'sq', 'uk', 'pl', 'az'
]

// B2C çoklu dil string helper
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

// Ulaşım şeması
const transportationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['flight', 'bus', 'ferry', 'car', 'train', 'combined'],
    required: true
  },
  carrier: { type: String, trim: true }, // THY, Pegasus, vb.
  carrierLogo: { type: String }, // Logo URL
  class: {
    type: String,
    enum: ['economy', 'business', 'first', 'standard', 'comfort'],
    default: 'economy'
  },
  details: multiLangString(),
  isIncluded: { type: Boolean, default: true },
  sequence: { type: Number, default: 0 } // Kombinasyonlarda sıra
}, { _id: false })

// Konaklama şeması
const accommodationSchema = new mongoose.Schema({
  hotel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel'
  },
  hotelName: { type: String, trim: true }, // Manuel giriş için
  hotelAddress: { type: String, trim: true },
  nights: { type: Number, min: 1, default: 1 },
  mealPlan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MealPlan'
  },
  mealPlanCode: { type: String },
  mealPlanName: multiLangString(),
  roomType: { type: String, trim: true },
  starRating: { type: Number, min: 1, max: 5 },
  isMainHotel: { type: Boolean, default: false },
  checkInTime: { type: String },
  checkOutTime: { type: String },
  order: { type: Number, default: 0 }
}, { _id: true })

// Günlük program şeması
const itinerarySchema = new mongoose.Schema({
  day: { type: Number, required: true, min: 1 },
  title: multiLangString(true),
  description: multiLangString(),
  meals: [{
    type: String,
    enum: ['breakfast', 'lunch', 'dinner', 'snack']
  }],
  activities: [multiLangString()],
  accommodation: { type: String, trim: true }, // "5* Otel" veya otel adı
  highlights: [multiLangString()],
  optionalExtras: [{ type: String }], // Extra kodları
  distance: { type: String }, // "250 km"
  duration: { type: String } // "4 saat"
}, { _id: true })

// Görsel şeması
const imageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  caption: multiLangString(),
  order: { type: Number, default: 0 },
  isMain: { type: Boolean, default: false },
  category: {
    type: String,
    enum: ['general', 'hotel', 'activity', 'destination', 'transportation'],
    default: 'general'
  }
}, { _id: true })

// Ekstra şablonu şeması
const extraTemplateSchema = new mongoose.Schema({
  code: { type: String, required: true, uppercase: true },
  name: multiLangString(true),
  description: multiLangString(),
  defaultPrice: { type: Number, default: 0 },
  currency: { type: String, default: 'EUR' },
  priceType: {
    type: String,
    enum: ['per_person', 'per_group', 'per_unit'],
    default: 'per_person'
  },
  category: {
    type: String,
    enum: ['activity', 'meal', 'transfer', 'upgrade', 'visa', 'insurance', 'other'],
    default: 'activity'
  },
  isPopular: { type: Boolean, default: false },
  image: { type: String }
}, { _id: true })

// İptal kuralı şeması
const cancellationRuleSchema = new mongoose.Schema({
  daysBeforeDeparture: { type: Number, required: true },
  refundPercent: { type: Number, required: true, min: 0, max: 100 }
}, { _id: false })

// Vize gereksinimi şeması
const visaRequirementSchema = new mongoose.Schema({
  nationality: { type: String, required: true, uppercase: true }, // ISO country code
  required: { type: Boolean, default: false },
  notes: multiLangString(),
  processingDays: { type: Number },
  fee: { type: Number },
  feeCurrency: { type: String, default: 'EUR' }
}, { _id: false })

// Ana Tour Schema
const tourSchema = new mongoose.Schema({
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
  slug: {
    type: String,
    lowercase: true,
    trim: true
  },
  description: multiLangString(),
  shortDescription: multiLangString(),
  highlights: [multiLangString()],

  // Tur Tipi
  tourType: {
    type: String,
    enum: ['package', 'day_trip', 'multi_day', 'cruise', 'cultural', 'adventure', 'religious', 'nature', 'city_break'],
    default: 'package'
  },

  // Varış Noktası
  destination: {
    country: { type: String, trim: true },
    city: { type: String, trim: true },
    region: { type: String, trim: true },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number }
    }
  },

  // Çıkış Noktaları
  departurePoints: [{
    city: { type: String },
    name: multiLangString(),
    isDefault: { type: Boolean, default: false }
  }],

  // Süre
  duration: {
    nights: { type: Number, min: 0, default: 0 }, // 0 = günübirlik
    days: { type: Number, min: 1, default: 1 }
  },

  // Ulaşım
  transportation: [transportationSchema],

  // Konaklama
  accommodations: [accommodationSchema],

  // Dahil Olanlar
  inclusions: [multiLangString()],
  exclusions: [multiLangString()],

  // Günlük Program
  itinerary: [itinerarySchema],

  // Görseller
  images: [imageSchema],

  // Opsiyonel Ekstralar (şablon)
  extraTemplates: [extraTemplateSchema],

  // İptal Politikası
  cancellationPolicy: {
    freeCancellation: {
      enabled: { type: Boolean, default: false },
      daysBeforeDeparture: { type: Number, default: 14 }
    },
    rules: [cancellationRuleSchema],
    nonRefundable: { type: Boolean, default: false },
    notes: multiLangString()
  },

  // Vize Gereksinimleri
  visaRequirements: [visaRequirementSchema],

  // Genel Şartlar
  termsAndConditions: multiLangString(),
  importantNotes: [multiLangString()],

  // Minimum/Maksimum Katılımcı
  participants: {
    min: { type: Number, default: 1 },
    max: { type: Number, default: 50 }
  },

  // Yaş Gereksinimleri
  ageRequirements: {
    minAge: { type: Number, default: 0 },
    maxAge: { type: Number },
    childMinAge: { type: Number, default: 2 },
    childMaxAge: { type: Number, default: 12 },
    infantMaxAge: { type: Number, default: 2 }
  },

  // Zorluk Seviyesi (macera turları için)
  difficulty: {
    type: String,
    enum: ['easy', 'moderate', 'challenging', 'difficult'],
    default: 'easy'
  },

  // Etiketler
  tags: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tag'
  }],

  // SEO
  seo: {
    title: multiLangString(),
    description: multiLangString(),
    keywords: multiLangString()
  },

  // Görünürlük
  visibility: {
    b2c: { type: Boolean, default: true },
    b2b: { type: Boolean, default: true }
  },

  // Durum
  status: {
    type: String,
    enum: ['draft', 'active', 'inactive', 'archived'],
    default: 'draft',
    index: true
  },

  // Öne Çıkan
  featured: { type: Boolean, default: false },
  featuredOrder: { type: Number, default: 0 },

  // Sıralama
  displayOrder: { type: Number, default: 0 },

  // Meta
  metadata: mongoose.Schema.Types.Mixed
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

// Indexes
tourSchema.index({ partner: 1, code: 1 }, { unique: true })
tourSchema.index({ partner: 1, status: 1 })
tourSchema.index({ partner: 1, slug: 1 })
tourSchema.index({ partner: 1, tourType: 1 })
tourSchema.index({ 'destination.country': 1 })
tourSchema.index({ 'destination.city': 1 })
tourSchema.index({ featured: 1, featuredOrder: 1 })
tourSchema.index({ displayOrder: 1 })
tourSchema.index({ tags: 1 })
tourSchema.index({ 'name.tr': 'text', 'name.en': 'text', 'description.tr': 'text' })

// Virtuals
tourSchema.virtual('departures', {
  ref: 'TourDeparture',
  localField: '_id',
  foreignField: 'tour'
})

tourSchema.virtual('mainImage').get(function() {
  const main = this.images?.find(img => img.isMain)
  return main?.url || this.images?.[0]?.url || null
})

tourSchema.virtual('mainTransportation').get(function() {
  return this.transportation?.[0] || null
})

tourSchema.virtual('mainAccommodation').get(function() {
  return this.accommodations?.find(acc => acc.isMainHotel) || this.accommodations?.[0] || null
})

// Pre-save middleware
tourSchema.pre('save', function(next) {
  // Auto-generate slug from Turkish name
  if (this.isModified('name.tr') && this.name?.tr && !this.slug) {
    this.slug = this.name.tr
      .toLowerCase()
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
  }

  // Ensure days = nights + 1 for overnight tours
  if (this.duration?.nights > 0 && !this.duration.days) {
    this.duration.days = this.duration.nights + 1
  }

  next()
})

// Audit trail
tourSchema.plugin(auditPlugin, {
  module: 'tour',
  subModule: 'tours',
  nameField: 'name.tr'
})

// Instance methods
tourSchema.methods.isActive = function() {
  return this.status === 'active'
}

tourSchema.methods.getDuration = function() {
  const { nights, days } = this.duration || {}
  if (nights === 0) return `${days || 1} Gün`
  return `${nights} Gece ${days} Gün`
}

// Static methods
tourSchema.statics.findByPartner = function(partnerId, options = {}) {
  const query = { partner: partnerId }
  if (options.status) query.status = options.status
  if (options.tourType) query.tourType = options.tourType

  return this.find(query).sort({ displayOrder: 1, createdAt: -1 })
}

tourSchema.statics.findActive = function(partnerId) {
  return this.find({ partner: partnerId, status: 'active' })
    .sort({ displayOrder: 1 })
}

tourSchema.statics.findFeatured = function(partnerId, limit = 6) {
  return this.find({ partner: partnerId, status: 'active', featured: true })
    .sort({ featuredOrder: 1 })
    .limit(limit)
}

tourSchema.statics.search = async function(partnerId, searchTerm, options = {}) {
  const query = {
    partner: partnerId,
    status: 'active',
    $text: { $search: searchTerm }
  }

  if (options.tourType) query.tourType = options.tourType
  if (options.destination) query['destination.country'] = options.destination

  return this.find(query, { score: { $meta: 'textScore' } })
    .sort({ score: { $meta: 'textScore' } })
    .limit(options.limit || 20)
}

export default mongoose.model('Tour', tourSchema)
