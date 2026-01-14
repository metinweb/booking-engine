/**
 * Rate Limiter Middleware
 * Protects API from abuse with configurable rate limiting
 * Supports Redis for distributed rate limiting (multi-instance deployments)
 * Falls back to in-memory storage when Redis is unavailable
 */

import { isRedisConnected, redisRateLimitStore } from '../core/redis.js'
import logger from '../core/logger.js'

/**
 * In-memory store for rate limiting (fallback)
 */
const rateLimitStore = new Map()
const failedLoginStore = new Map()

// Clean up expired entries every minute
setInterval(() => {
  const now = Date.now()
  for (const [key, data] of rateLimitStore) {
    if (now > data.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}, 60 * 1000)

// Clean up expired failed login entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, data] of failedLoginStore) {
    if (now > data.lockoutUntil && now > data.resetTime) {
      failedLoginStore.delete(key)
    }
  }
}, 5 * 60 * 1000)

/**
 * Get client identifier from request
 * @param {Object} req - Express request
 * @returns {string} Client identifier
 */
function getClientId(req) {
  const forwarded = req.headers['x-forwarded-for']
  const ip = forwarded ? forwarded.split(',')[0].trim() : req.ip
  return `${ip}:${req.originalUrl.split('?')[0]}`
}

/**
 * Create rate limiter middleware with Redis support
 * @param {Object} options - Rate limiter options
 * @returns {Function} Express middleware
 */
export function createRateLimiter(options = {}) {
  const {
    windowMs = 60 * 1000,
    maxRequests = 60,
    message = 'Too many requests, please try again later.',
    statusCode = 429,
    keyGenerator = getClientId,
    skip = () => false,
    headers = true
  } = options

  return async (req, res, next) => {
    if (skip(req)) {
      return next()
    }

    const key = keyGenerator(req)
    const now = Date.now()

    let count, resetTime, remaining

    // Try Redis first, fallback to in-memory
    if (isRedisConnected()) {
      try {
        const result = await redisRateLimitStore.increment(key, windowMs, maxRequests)
        if (result) {
          count = result.count
          resetTime = result.resetTime
          remaining = result.remaining
        } else {
          // Redis operation failed, use in-memory
          const memResult = incrementInMemory(key, windowMs, maxRequests, now)
          count = memResult.count
          resetTime = memResult.resetTime
          remaining = memResult.remaining
        }
      } catch {
        // Fallback to in-memory on any Redis error
        const memResult = incrementInMemory(key, windowMs, maxRequests, now)
        count = memResult.count
        resetTime = memResult.resetTime
        remaining = memResult.remaining
      }
    } else {
      // No Redis, use in-memory
      const memResult = incrementInMemory(key, windowMs, maxRequests, now)
      count = memResult.count
      resetTime = memResult.resetTime
      remaining = memResult.remaining
    }

    const resetSeconds = Math.ceil((resetTime - now) / 1000)

    if (headers) {
      res.set({
        'X-RateLimit-Limit': maxRequests,
        'X-RateLimit-Remaining': remaining,
        'X-RateLimit-Reset': resetSeconds,
        'X-RateLimit-Reset-Time': new Date(resetTime).toISOString()
      })
    }

    if (count > maxRequests) {
      res.set('Retry-After', resetSeconds)
      return res.status(statusCode).json({
        success: false,
        error: 'RATE_LIMIT_EXCEEDED',
        message,
        retryAfter: resetSeconds
      })
    }

    next()
  }
}

/**
 * Increment counter in memory
 */
function incrementInMemory(key, windowMs, maxRequests, now) {
  let data = rateLimitStore.get(key)
  if (!data || now > data.resetTime) {
    data = {
      count: 0,
      resetTime: now + windowMs,
      firstRequest: now
    }
  }
  data.count++
  rateLimitStore.set(key, data)

  return {
    count: data.count,
    resetTime: data.resetTime,
    remaining: Math.max(0, maxRequests - data.count)
  }
}

/**
 * Pre-configured rate limiters for different API sections
 */

// Public search API - generous limits
export const publicSearchLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 100,
  message: 'Too many search requests. Please wait a moment.'
})

// Public booking API - more restrictive
export const publicBookingLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 30,
  message: 'Too many booking requests. Please try again later.'
})

// Price calculation - moderate limits
export const pricingLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 60,
  message: 'Too many pricing requests. Please slow down.'
})

// General API limiter
export const generalLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 120,
  message: 'Too many requests. Please try again later.'
})

// Strict limiter for sensitive operations (unauthenticated only)
export const strictLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 5,
  message: 'Too many attempts. Please try again later.',
  skip: req => !!req.user // Skip if user is authenticated
})

// Authenticated user limiter - generous limits per user
export const authenticatedLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 300,
  message: 'Too many requests. Please slow down.',
  keyGenerator: req => {
    // Use user ID if authenticated, otherwise use IP
    if (req.user?._id) {
      return `user:${req.user._id}`
    }
    const forwarded = req.headers['x-forwarded-for']
    return forwarded ? forwarded.split(',')[0].trim() : req.ip
  }
})

// Token refresh limiter - separate higher limit for token refresh
export const tokenRefreshLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 30,
  message: 'Too many token refresh attempts.',
  keyGenerator: req => {
    const forwarded = req.headers['x-forwarded-for']
    const ip = forwarded ? forwarded.split(',')[0].trim() : req.ip
    return `refresh:${ip}`
  }
})

// Login-specific rate limiter
export const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 5,
  message: 'Too many login attempts. Please try again in 15 minutes.',
  keyGenerator: req => {
    const forwarded = req.headers['x-forwarded-for']
    const ip = forwarded ? forwarded.split(',')[0].trim() : req.ip
    const email = req.body?.email?.toLowerCase() || 'unknown'
    return `login:${ip}:${email}`
  }
})

// IP-based global limiter
export const globalLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 300,
  keyGenerator: req => {
    const forwarded = req.headers['x-forwarded-for']
    return forwarded ? forwarded.split(',')[0].trim() : req.ip
  },
  message: 'Global rate limit exceeded. Please slow down.'
})

/**
 * Failed Login Tracking (with Redis support)
 * Progressive lockout system:
 * - 5 attempts  → 1 min lockout
 * - 8 attempts  → 5 min lockout
 * - 12 attempts → 10 min lockout
 * - 20 attempts → permanent block (requires admin intervention)
 */
const ATTEMPT_WINDOW = 24 * 60 * 60 * 1000 // 24 hours for tracking attempts

// Progressive lockout thresholds
const LOCKOUT_THRESHOLDS = [
  { attempts: 5, duration: 1 * 60 * 1000 },      // 5 attempts → 1 min
  { attempts: 8, duration: 5 * 60 * 1000 },      // 8 attempts → 5 min
  { attempts: 12, duration: 10 * 60 * 1000 },    // 12 attempts → 10 min
  { attempts: 20, duration: -1 }                  // 20 attempts → permanent block
]

/**
 * Get lockout duration based on attempt count
 */
function getLockoutDuration(attempts) {
  // Find the highest threshold that matches
  for (let i = LOCKOUT_THRESHOLDS.length - 1; i >= 0; i--) {
    if (attempts >= LOCKOUT_THRESHOLDS[i].attempts) {
      return LOCKOUT_THRESHOLDS[i].duration
    }
  }
  return 0
}

/**
 * Get next lockout threshold
 */
function getNextThreshold(attempts) {
  for (const threshold of LOCKOUT_THRESHOLDS) {
    if (attempts < threshold.attempts) {
      return threshold.attempts
    }
  }
  return null
}

/**
 * Record a failed login attempt
 */
export async function recordFailedLogin(email) {
  const key = `failed:${email.toLowerCase()}`
  const now = Date.now()

  // Try Redis first
  if (isRedisConnected()) {
    try {
      const result = await recordFailedLoginRedis(key, now)
      if (result) return result
    } catch (error) {
      logger.warn('Redis failed login tracking error, using memory:', error.message)
    }
  }

  // Fallback to in-memory
  return recordFailedLoginMemory(key, now)
}

async function recordFailedLoginRedis(key, now) {
  const data = await redisRateLimitStore.get(key)
  let attempts = 1
  let lockoutUntil = 0
  let resetTime = now + ATTEMPT_WINDOW
  let isBlocked = false

  if (data) {
    // Check if permanently blocked
    if (data.isBlocked) {
      return {
        isLocked: true,
        isBlocked: true,
        remainingAttempts: 0,
        lockoutMinutes: -1,
        totalAttempts: data.attempts,
        message: 'ACCOUNT_BLOCKED'
      }
    }

    // Check if currently locked out
    if (now < data.lockoutUntil) {
      return {
        isLocked: true,
        isBlocked: false,
        remainingAttempts: 0,
        lockoutMinutes: Math.ceil((data.lockoutUntil - now) / 60000),
        totalAttempts: data.attempts
      }
    }

    // Continue counting attempts within window
    if (now <= data.resetTime) {
      attempts = data.attempts + 1
      resetTime = data.resetTime
    }
  }

  // Calculate lockout based on progressive thresholds
  const lockoutDuration = getLockoutDuration(attempts)
  if (lockoutDuration === -1) {
    // Permanent block
    isBlocked = true
    lockoutUntil = 0
    logger.warn(`Account blocked due to excessive failed login attempts: ${key}`)
  } else if (lockoutDuration > 0) {
    lockoutUntil = now + lockoutDuration
  }

  await redisRateLimitStore.set(
    key,
    { attempts, resetTime, lockoutUntil, isBlocked, firstAttempt: data?.firstAttempt || now },
    ATTEMPT_WINDOW
  )

  if (isBlocked) {
    return {
      isLocked: true,
      isBlocked: true,
      remainingAttempts: 0,
      lockoutMinutes: -1,
      totalAttempts: attempts,
      message: 'ACCOUNT_BLOCKED'
    }
  }

  if (lockoutUntil > 0) {
    return {
      isLocked: true,
      isBlocked: false,
      remainingAttempts: 0,
      lockoutMinutes: Math.ceil(lockoutDuration / 60000),
      totalAttempts: attempts
    }
  }

  const nextThreshold = getNextThreshold(attempts)
  return {
    isLocked: false,
    isBlocked: false,
    remainingAttempts: nextThreshold ? nextThreshold - attempts : 0,
    lockoutMinutes: 0,
    totalAttempts: attempts,
    nextLockoutAt: nextThreshold
  }
}

function recordFailedLoginMemory(key, now) {
  let data = failedLoginStore.get(key)

  if (data) {
    // Check if permanently blocked
    if (data.isBlocked) {
      return {
        isLocked: true,
        isBlocked: true,
        remainingAttempts: 0,
        lockoutMinutes: -1,
        totalAttempts: data.attempts,
        message: 'ACCOUNT_BLOCKED'
      }
    }

    // Check if currently locked out
    if (now < data.lockoutUntil) {
      return {
        isLocked: true,
        isBlocked: false,
        remainingAttempts: 0,
        lockoutMinutes: Math.ceil((data.lockoutUntil - now) / 60000),
        totalAttempts: data.attempts
      }
    }
  }

  if (!data || now > data.resetTime) {
    data = {
      attempts: 0,
      resetTime: now + ATTEMPT_WINDOW,
      lockoutUntil: 0,
      isBlocked: false,
      firstAttempt: now
    }
  }

  data.attempts++

  // Calculate lockout based on progressive thresholds
  const lockoutDuration = getLockoutDuration(data.attempts)
  if (lockoutDuration === -1) {
    // Permanent block
    data.isBlocked = true
    data.lockoutUntil = 0
    failedLoginStore.set(key, data)
    logger.warn(`Account blocked due to excessive failed login attempts: ${key}`)
    return {
      isLocked: true,
      isBlocked: true,
      remainingAttempts: 0,
      lockoutMinutes: -1,
      totalAttempts: data.attempts,
      message: 'ACCOUNT_BLOCKED'
    }
  }

  if (lockoutDuration > 0) {
    data.lockoutUntil = now + lockoutDuration
    failedLoginStore.set(key, data)
    return {
      isLocked: true,
      isBlocked: false,
      remainingAttempts: 0,
      lockoutMinutes: Math.ceil(lockoutDuration / 60000),
      totalAttempts: data.attempts
    }
  }

  failedLoginStore.set(key, data)
  const nextThreshold = getNextThreshold(data.attempts)
  return {
    isLocked: false,
    isBlocked: false,
    remainingAttempts: nextThreshold ? nextThreshold - data.attempts : 0,
    lockoutMinutes: 0,
    totalAttempts: data.attempts,
    nextLockoutAt: nextThreshold
  }
}

/**
 * Check if an email is currently locked out
 */
export async function checkLoginLockout(email) {
  const key = `failed:${email.toLowerCase()}`
  const now = Date.now()

  // Try Redis first
  if (isRedisConnected()) {
    try {
      const data = await redisRateLimitStore.get(key)
      if (data) {
        // Check if permanently blocked
        if (data.isBlocked) {
          return {
            isLocked: true,
            isBlocked: true,
            lockoutMinutes: -1,
            message: 'ACCOUNT_BLOCKED'
          }
        }
        // Check if temporarily locked
        if (now < data.lockoutUntil) {
          return {
            isLocked: true,
            isBlocked: false,
            lockoutMinutes: Math.ceil((data.lockoutUntil - now) / 60000)
          }
        }
      }
      return { isLocked: false, isBlocked: false, lockoutMinutes: 0 }
    } catch {
      // Fallback to memory
    }
  }

  const data = failedLoginStore.get(key)
  if (data) {
    // Check if permanently blocked
    if (data.isBlocked) {
      return {
        isLocked: true,
        isBlocked: true,
        lockoutMinutes: -1,
        message: 'ACCOUNT_BLOCKED'
      }
    }
    // Check if temporarily locked
    if (now < data.lockoutUntil) {
      return {
        isLocked: true,
        isBlocked: false,
        lockoutMinutes: Math.ceil((data.lockoutUntil - now) / 60000)
      }
    }
  }
  return { isLocked: false, isBlocked: false, lockoutMinutes: 0 }
}

/**
 * Unblock a blocked account (admin function)
 */
export async function unblockAccount(email) {
  const key = `failed:${email.toLowerCase()}`

  // Clear from Redis
  if (isRedisConnected()) {
    try {
      await redisRateLimitStore.delete(key)
    } catch {
      // Ignore Redis errors
    }
  }

  // Clear from memory
  failedLoginStore.delete(key)
  logger.info(`Account unblocked: ${email}`)
  return { success: true, message: 'Account unblocked' }
}

/**
 * Clear failed login attempts after successful login
 */
export async function clearFailedLogins(email) {
  const key = `failed:${email.toLowerCase()}`

  // Clear from Redis
  if (isRedisConnected()) {
    try {
      await redisRateLimitStore.delete(key)
    } catch {
      // Ignore Redis errors
    }
  }

  // Always clear from memory too
  failedLoginStore.delete(key)
}

/**
 * Get failed login statistics
 */
export function getFailedLoginStats() {
  let totalEntries = 0
  let lockedAccounts = 0
  const now = Date.now()

  for (const [_key, data] of failedLoginStore) {
    totalEntries++
    if (now < data.lockoutUntil) {
      lockedAccounts++
    }
  }

  return {
    totalEntries,
    lockedAccounts,
    storeSize: failedLoginStore.size,
    usingRedis: isRedisConnected()
  }
}

/**
 * Get rate limiter statistics
 */
export async function getRateLimiterStats() {
  const memoryStats = {
    totalEntries: 0,
    activeEntries: 0
  }
  const now = Date.now()

  for (const [_key, data] of rateLimitStore) {
    memoryStats.totalEntries++
    if (now < data.resetTime) {
      memoryStats.activeEntries++
    }
  }

  let redisStats = { connected: false }
  if (isRedisConnected()) {
    try {
      redisStats = await redisRateLimitStore.getStats()
    } catch {
      redisStats = { connected: false, error: 'Failed to get stats' }
    }
  }

  return {
    memory: {
      ...memoryStats,
      storeSize: rateLimitStore.size
    },
    redis: redisStats
  }
}

/**
 * Clear rate limiter store
 */
export function clearRateLimiterStore() {
  rateLimitStore.clear()
}

export default {
  createRateLimiter,
  publicSearchLimiter,
  publicBookingLimiter,
  pricingLimiter,
  generalLimiter,
  strictLimiter,
  authenticatedLimiter,
  tokenRefreshLimiter,
  loginLimiter,
  globalLimiter,
  getRateLimiterStats,
  clearRateLimiterStore,
  recordFailedLogin,
  checkLoginLockout,
  clearFailedLogins,
  unblockAccount,
  getFailedLoginStats
}
