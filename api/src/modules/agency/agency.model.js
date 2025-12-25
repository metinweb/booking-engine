import mongoose from 'mongoose'

const agencySchema = new mongoose.Schema({
  // Partner Bağlantısı
  partner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Partner',
    required: [true, 'REQUIRED_PARTNER'],
    index: true
  },

  // Durum
  status: {
    type: String,
    enum: {
      values: ['active', 'inactive', 'pending'],
      message: 'INVALID_STATUS'
    },
    default: 'pending'
  },

  // Acente Bilgileri
  name: {
    type: String,
    required: [true, 'REQUIRED_AGENCY_NAME'],
    trim: true,
    minlength: [2, 'AGENCY_NAME_MIN_LENGTH'],
    maxlength: [200, 'AGENCY_NAME_MAX_LENGTH']
  },

  email: {
    type: String,
    required: [true, 'REQUIRED_EMAIL'],
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'INVALID_EMAIL']
  },

  phone: {
    type: String,
    trim: true
  },

  // Adres
  address: {
    street: String,
    city: String,
    country: String,
    postalCode: String
  },

  // Markup (Partner üzerine ek komisyon)
  markup: {
    hotel: {
      type: Number,
      default: 0,
      min: [0, 'MARKUP_MIN_ZERO'],
      max: [100, 'MARKUP_MAX_HUNDRED']
    },
    tour: {
      type: Number,
      default: 0,
      min: [0, 'MARKUP_MIN_ZERO'],
      max: [100, 'MARKUP_MAX_HUNDRED']
    },
    transfer: {
      type: Number,
      default: 0,
      min: [0, 'MARKUP_MIN_ZERO'],
      max: [100, 'MARKUP_MAX_HUNDRED']
    }
  },

  // İstatistikler
  stats: {
    totalBookings: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 }
  }

}, {
  timestamps: true
})

// Compound Index (Partner + Email unique)
// Her partner kendi içinde unique email
agencySchema.index({ partner: 1, email: 1 }, { unique: true })
agencySchema.index({ partner: 1, status: 1 })

// Methods
agencySchema.methods.isActive = function() {
  return this.status === 'active'
}

agencySchema.methods.activate = async function() {
  this.status = 'active'
  return await this.save()
}

agencySchema.methods.deactivate = async function() {
  this.status = 'inactive'
  return await this.save()
}

agencySchema.methods.getTotalMarkup = function(productType) {
  // Partner + Agency markup toplamı
  // Populate edilmiş partner gerekli
  if (!this.populated('partner')) {
    throw new Error('Partner must be populated')
  }

  const partnerMarkup = this.partner.markup[productType] || 0
  const agencyMarkup = this.markup[productType] || 0

  return partnerMarkup + agencyMarkup
}

// Statics
agencySchema.statics.findByPartner = function(partnerId) {
  return this.find({ partner: partnerId })
}

agencySchema.statics.findByPartnerAndEmail = function(partnerId, email) {
  return this.findOne({
    partner: partnerId,
    email: email.toLowerCase()
  })
}

agencySchema.statics.findActiveByPartner = function(partnerId) {
  return this.find({
    partner: partnerId,
    status: 'active'
  })
}

// Pre-save middleware
agencySchema.pre('save', function(next) {
  // Lowercase email
  if (this.email) {
    this.email = this.email.toLowerCase()
  }
  next()
})

export default mongoose.model('Agency', agencySchema)
