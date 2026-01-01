import mongoose from 'mongoose'

const notificationSchema = new mongoose.Schema({
  // Recipient - supports multiple user types
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true,
    refPath: 'recipientModel'
  },
  recipientModel: {
    type: String,
    required: true,
    enum: ['User', 'PMSUser', 'AgencyUser']
  },

  // Notification type
  type: {
    type: String,
    enum: [
      // PMS Events
      'pms:checkin',
      'pms:checkout',
      'pms:room_ready',
      'pms:room_dirty',
      'pms:payment_received',
      'pms:booking_created',
      'pms:booking_cancelled',
      'pms:housekeeping_started',
      'pms:housekeeping_completed',

      // Booking Events
      'booking:new',
      'booking:confirmed',
      'booking:cancelled',
      'booking:modified',
      'booking:payment',

      // System Events
      'system:announcement',
      'system:maintenance',
      'system:welcome',

      // Agency Events
      'agency:approved',
      'agency:rejected',
      'agency:booking_new',

      // Partner Events
      'partner:booking_new',
      'partner:payment_received'
    ],
    required: true,
    index: true
  },

  // Content
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  message: {
    type: String,
    required: true,
    maxlength: 500
  },

  // Related resource
  reference: {
    model: {
      type: String,
      enum: ['Stay', 'Booking', 'Room', 'Payment', 'Hotel', 'Agency', 'Partner']
    },
    id: {
      type: mongoose.Schema.Types.ObjectId
    }
  },

  // Context
  hotel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel',
    index: true
  },
  partner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Partner',
    index: true
  },

  // Read status
  isRead: {
    type: Boolean,
    default: false,
    index: true
  },
  readAt: {
    type: Date
  },

  // Visual
  icon: {
    type: String,
    default: 'notifications'
  },
  color: {
    type: String,
    enum: ['green', 'blue', 'red', 'amber', 'gray', 'purple', 'indigo'],
    default: 'blue'
  },

  // Priority
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },

  // Action URL (optional - for click navigation)
  actionUrl: {
    type: String
  },

  // Expiry (optional - auto-delete old notifications)
  expiresAt: {
    type: Date,
    index: true
  }
}, {
  timestamps: true
})

// Compound indexes for efficient queries
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 })
notificationSchema.index({ recipient: 1, createdAt: -1 })
notificationSchema.index({ hotel: 1, createdAt: -1 })
notificationSchema.index({ partner: 1, createdAt: -1 })

// TTL index for auto-expiry (optional)
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

/**
 * Get unread count for a user
 */
notificationSchema.statics.getUnreadCount = async function(userId, recipientModel = 'User') {
  return this.countDocuments({
    recipient: userId,
    recipientModel,
    isRead: false
  })
}

/**
 * Get recent notifications for a user
 */
notificationSchema.statics.getRecent = async function(userId, recipientModel = 'User', limit = 20) {
  return this.find({
    recipient: userId,
    recipientModel
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean()
}

/**
 * Get paginated notifications
 */
notificationSchema.statics.getPaginated = async function(userId, recipientModel = 'User', { page = 1, limit = 20, unreadOnly = false } = {}) {
  const query = {
    recipient: userId,
    recipientModel
  }

  if (unreadOnly) {
    query.isRead = false
  }

  const [notifications, total] = await Promise.all([
    this.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    this.countDocuments(query)
  ])

  return {
    notifications,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  }
}

/**
 * Mark specific notifications as read
 */
notificationSchema.statics.markAsRead = async function(notificationIds, userId) {
  return this.updateMany(
    {
      _id: { $in: notificationIds },
      recipient: userId
    },
    {
      isRead: true,
      readAt: new Date()
    }
  )
}

/**
 * Mark all notifications as read for a user
 */
notificationSchema.statics.markAllAsRead = async function(userId, recipientModel = 'User') {
  return this.updateMany(
    {
      recipient: userId,
      recipientModel,
      isRead: false
    },
    {
      isRead: true,
      readAt: new Date()
    }
  )
}

/**
 * Delete old read notifications (cleanup)
 */
notificationSchema.statics.cleanupOld = async function(daysToKeep = 30) {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep)

  return this.deleteMany({
    isRead: true,
    createdAt: { $lt: cutoffDate }
  })
}

const Notification = mongoose.model('Notification', notificationSchema)

export default Notification
