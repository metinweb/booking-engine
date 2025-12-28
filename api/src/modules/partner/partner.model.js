import mongoose from 'mongoose'
import auditPlugin from '../../plugins/auditPlugin.js'

const partnerSchema = new mongoose.Schema({
  // Durum
  status: {
    type: String,
    enum: {
      values: ['active', 'inactive', 'pending'],
      message: 'INVALID_STATUS'
    },
    default: 'pending'
  },

  // Şirket Bilgileri
  companyName: {
    type: String,
    required: [true, 'REQUIRED_COMPANY_NAME'],
    trim: true,
    minlength: [2, 'COMPANY_NAME_MIN_LENGTH'],
    maxlength: [200, 'COMPANY_NAME_MAX_LENGTH']
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

  // Vergi Bilgileri
  taxOffice: {
    type: String,
    trim: true
  },

  taxNumber: {
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

  // Belgeler
  documents: [{
    type: {
      type: String,
      enum: ['license', 'certificate', 'other'],
      required: true
    },
    name: String,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Branding
  branding: {
    logo: String,
    favicon: String,

    // B2C Site Domain (Müşterilerin rezervasyon yaptığı site)
    siteDomain: {
      type: String,
      lowercase: true,
      trim: true
    },

    // B2B Extranet Domain (Acentelerin giriş yaptığı platform)
    extranetDomain: {
      type: String,
      lowercase: true,
      trim: true
    }
  },

  // Para Birimi
  currency: {
    type: String,
    default: 'TRY',
    uppercase: true,
    enum: {
      values: ['TRY', 'USD', 'EUR', 'GBP'],
      message: 'INVALID_CURRENCY'
    }
  },

  // Markup/Komisyon (Yüzde)
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
    totalAgencies: { type: Number, default: 0 },
    totalBookings: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 }
  }

}, {
  timestamps: true
})

// Indexes
partnerSchema.index({ status: 1 })
partnerSchema.index({ email: 1 }, { unique: true })
partnerSchema.index({ 'branding.siteDomain': 1 }, { unique: true, sparse: true })
partnerSchema.index({ 'branding.extranetDomain': 1 }, { unique: true, sparse: true })

// Virtual - Partner'ın acenteleri
partnerSchema.virtual('agencies', {
  ref: 'Agency',
  localField: '_id',
  foreignField: 'partner'
})

// Methods
partnerSchema.methods.isActive = function() {
  return this.status === 'active'
}

partnerSchema.methods.activate = async function() {
  this.status = 'active'
  return await this.save()
}

partnerSchema.methods.deactivate = async function() {
  this.status = 'inactive'
  return await this.save()
}

// Statics
partnerSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() })
}

partnerSchema.statics.findBySiteDomain = function(domain) {
  return this.findOne({ 'branding.siteDomain': domain.toLowerCase() })
}

partnerSchema.statics.findByExtranetDomain = function(domain) {
  return this.findOne({ 'branding.extranetDomain': domain.toLowerCase() })
}

partnerSchema.statics.findActive = function() {
  return this.find({ status: 'active' })
}

// Pre-save middleware
partnerSchema.pre('save', function(next) {
  // Track previous status for post-save hook
  if (this.isModified('status')) {
    this._previousStatus = this.constructor.findOne({ _id: this._id }).then(doc => doc?.status)
  }

  // Lowercase email and domains
  if (this.email) {
    this.email = this.email.toLowerCase()
  }
  if (this.branding?.siteDomain) {
    this.branding.siteDomain = this.branding.siteDomain.toLowerCase()
  }
  if (this.branding?.extranetDomain) {
    this.branding.extranetDomain = this.branding.extranetDomain.toLowerCase()
  }
  next()
})

// Post-save middleware - Send email when partner is activated
partnerSchema.post('save', async function(doc) {
  // Check if status changed to active (from any other status, typically pending)
  if (doc.status === 'active' && doc._previousStatus) {
    const previousStatus = await doc._previousStatus
    if (previousStatus && previousStatus !== 'active') {
      try {
        // Get partner admin user
        const User = mongoose.model('User')
        const adminUser = await User.findOne({
          accountType: 'partner',
          accountId: doc._id,
          role: 'admin'
        })

        if (adminUser) {
          // Import mail helper
          const { sendWelcomeEmail } = await import('../../helpers/mail.js')
          const logger = await import('../../core/logger.js')

          // Send activation email
          await sendWelcomeEmail({
            to: adminUser.email,
            name: adminUser.name,
            email: adminUser.email,
            password: '(Please use your registration password)', // Don't send password again
            accountType: 'Partner',
            loginUrl: doc.branding?.siteDomain
              ? `https://${doc.branding.siteDomain}/login`
              : 'https://admin.booking-engine.com/login'
          })

          logger.default.info(`Partner approval email sent to: ${adminUser.email}`)
        }
      } catch (error) {
        // Import logger
        const logger = await import('../../core/logger.js')
        logger.default.error(`Failed to send partner approval email: ${error.message}`)
      }
    }
  }
})

// Audit plugin for tracking changes
partnerSchema.plugin(auditPlugin, {
  module: 'partner',
  nameField: 'companyName'
})

export default mongoose.model('Partner', partnerSchema)
