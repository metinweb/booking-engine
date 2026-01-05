import mongoose from 'mongoose'

const pushSubscriptionSchema = new mongoose.Schema(
  {
    // User who owns this subscription
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },

    // Partner (for multi-tenant isolation)
    partner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Partner',
      index: true
    },

    // Web Push subscription object
    subscription: {
      endpoint: {
        type: String,
        required: true
      },
      expirationTime: {
        type: Number,
        default: null
      },
      keys: {
        p256dh: {
          type: String,
          required: true
        },
        auth: {
          type: String,
          required: true
        }
      }
    },

    // Device/browser info
    userAgent: {
      type: String
    },

    deviceType: {
      type: String,
      enum: ['desktop', 'mobile', 'tablet', 'unknown'],
      default: 'unknown'
    },

    browser: {
      type: String
    },

    // Subscription status
    isActive: {
      type: Boolean,
      default: true
    },

    // Last successful push
    lastPushAt: {
      type: Date
    },

    // Push failure count (for cleanup)
    failureCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true,
    collection: 'push_subscriptions'
  }
)

// Compound unique index: user + endpoint
pushSubscriptionSchema.index({ user: 1, 'subscription.endpoint': 1 }, { unique: true })

// Index for cleanup queries
pushSubscriptionSchema.index({ isActive: 1, failureCount: 1 })

// Static method to find active subscriptions for a user
pushSubscriptionSchema.statics.findActiveByUser = function (userId) {
  return this.find({ user: userId, isActive: true })
}

// Static method to find all subscriptions for a partner
pushSubscriptionSchema.statics.findByPartner = function (partnerId) {
  return this.find({ partner: partnerId, isActive: true })
}

// Instance method to mark as failed
pushSubscriptionSchema.methods.markFailed = async function () {
  this.failureCount += 1

  // Deactivate after 3 consecutive failures
  if (this.failureCount >= 3) {
    this.isActive = false
  }

  return this.save()
}

// Instance method to mark as success
pushSubscriptionSchema.methods.markSuccess = async function () {
  this.failureCount = 0
  this.lastPushAt = new Date()
  return this.save()
}

// Static method to clean up old/inactive subscriptions
pushSubscriptionSchema.statics.cleanup = async function () {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  return this.deleteMany({
    $or: [
      { isActive: false },
      { lastPushAt: { $lt: thirtyDaysAgo } },
      { failureCount: { $gte: 5 } }
    ]
  })
}

// Parse user agent for device info
pushSubscriptionSchema.pre('save', function (next) {
  if (this.isModified('userAgent') && this.userAgent) {
    const ua = this.userAgent.toLowerCase()

    // Detect device type
    if (/mobile|android|iphone|ipad|ipod/i.test(ua)) {
      if (/tablet|ipad/i.test(ua)) {
        this.deviceType = 'tablet'
      } else {
        this.deviceType = 'mobile'
      }
    } else {
      this.deviceType = 'desktop'
    }

    // Detect browser
    if (/chrome/i.test(ua) && !/edg/i.test(ua)) {
      this.browser = 'Chrome'
    } else if (/firefox/i.test(ua)) {
      this.browser = 'Firefox'
    } else if (/safari/i.test(ua) && !/chrome/i.test(ua)) {
      this.browser = 'Safari'
    } else if (/edg/i.test(ua)) {
      this.browser = 'Edge'
    } else if (/opera|opr/i.test(ua)) {
      this.browser = 'Opera'
    } else {
      this.browser = 'Other'
    }
  }

  next()
})

export default mongoose.model('PushSubscription', pushSubscriptionSchema)
