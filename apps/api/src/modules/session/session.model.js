import mongoose from 'mongoose'
import crypto from 'crypto'

const sessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'REQUIRED_USER_ID'],
      index: true
    },

    // Token hash for security (we store hash, not the actual token)
    tokenHash: {
      type: String,
      required: true,
      index: true
    },

    // Device & Browser Info
    userAgent: String,
    ipAddress: String,

    deviceType: {
      type: String,
      enum: ['desktop', 'mobile', 'tablet', 'unknown'],
      default: 'unknown'
    },

    browser: String,
    os: String,

    // Approximate location from IP
    location: {
      country: String,
      city: String
    },

    // Session status
    status: {
      type: String,
      enum: ['active', 'expired', 'terminated'],
      default: 'active',
      index: true
    },

    // Activity tracking
    lastActivity: {
      type: Date,
      default: Date.now
    },

    // Session expiration
    expiresAt: {
      type: Date,
      required: true,
      index: true
    },

    // Termination info
    terminatedAt: Date,
    terminatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    terminationReason: {
      type: String,
      enum: ['logout', 'admin_action', 'password_change', 'security', 'expired']
    }
  },
  {
    timestamps: true
  }
)

// Compound indexes
sessionSchema.index({ userId: 1, status: 1 })
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }) // TTL index for auto-cleanup

// Static: Create session from token
sessionSchema.statics.createFromToken = async function (userId, token, meta = {}) {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

  // Parse user agent
  const deviceInfo = parseUserAgent(meta.userAgent)

  // Default expiration: 7 days
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  return await this.create({
    userId,
    tokenHash,
    userAgent: meta.userAgent,
    ipAddress: meta.ipAddress,
    deviceType: deviceInfo.deviceType,
    browser: deviceInfo.browser,
    os: deviceInfo.os,
    location: meta.location || {},
    expiresAt
  })
}

// Static: Find session by token
sessionSchema.statics.findByToken = async function (token) {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
  return await this.findOne({
    tokenHash,
    status: 'active',
    expiresAt: { $gt: new Date() }
  })
}

// Static: Get active sessions for user
sessionSchema.statics.getActiveSessions = async function (userId) {
  return await this.find({
    userId,
    status: 'active',
    expiresAt: { $gt: new Date() }
  }).sort({ lastActivity: -1 })
}

// Static: Terminate all sessions for user
sessionSchema.statics.terminateAllForUser = async function (userId, terminatedBy, reason = 'admin_action') {
  return await this.updateMany(
    { userId, status: 'active' },
    {
      status: 'terminated',
      terminatedAt: new Date(),
      terminatedBy,
      terminationReason: reason
    }
  )
}

// Static: Count active sessions
sessionSchema.statics.countActiveSessions = async function (userId) {
  return await this.countDocuments({
    userId,
    status: 'active',
    expiresAt: { $gt: new Date() }
  })
}

// Method: Update last activity
sessionSchema.methods.touch = async function () {
  this.lastActivity = new Date()
  return await this.save()
}

// Method: Terminate session
sessionSchema.methods.terminate = async function (terminatedBy, reason = 'logout') {
  this.status = 'terminated'
  this.terminatedAt = new Date()
  this.terminatedBy = terminatedBy
  this.terminationReason = reason
  return await this.save()
}

// Method: Check if expired
sessionSchema.methods.isExpired = function () {
  return this.expiresAt < new Date() || this.status !== 'active'
}

// Helper: Parse user agent
function parseUserAgent(userAgent) {
  if (!userAgent) {
    return { deviceType: 'unknown', browser: 'Unknown', os: 'Unknown' }
  }

  const ua = userAgent.toLowerCase()

  // Device type
  let deviceType = 'desktop'
  if (/mobile|android|iphone|ipad|ipod|blackberry|windows phone/i.test(ua)) {
    deviceType = /tablet|ipad/i.test(ua) ? 'tablet' : 'mobile'
  }

  // Browser
  let browser = 'Unknown'
  if (ua.includes('chrome') && !ua.includes('edg')) browser = 'Chrome'
  else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari'
  else if (ua.includes('firefox')) browser = 'Firefox'
  else if (ua.includes('edg')) browser = 'Edge'
  else if (ua.includes('opera') || ua.includes('opr')) browser = 'Opera'

  // OS
  let os = 'Unknown'
  if (ua.includes('windows')) os = 'Windows'
  else if (ua.includes('mac')) os = 'macOS'
  else if (ua.includes('linux')) os = 'Linux'
  else if (ua.includes('android')) os = 'Android'
  else if (ua.includes('iphone') || ua.includes('ipad')) os = 'iOS'

  return { deviceType, browser, os }
}

export default mongoose.model('Session', sessionSchema)
