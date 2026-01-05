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

// Strict limiter for sensitive operations
export const strictLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 5,
  message: 'Too many attempts. Please try again later.'
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
 */
const MAX_FAILED_ATTEMPTS = 5
const LOCKOUT_DURATION = 30 * 60 * 1000 // 30 minutes
const ATTEMPT_WINDOW = 60 * 60 * 1000 // 1 hour

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

  if (data) {
    if (now < data.lockoutUntil) {
      return {
        isLocked: true,
        remainingAttempts: 0,
        lockoutMinutes: Math.ceil((data.lockoutUntil - now) / 60000),
        totalAttempts: data.attempts
      }
    }
    if (now <= data.resetTime) {
      attempts = data.attempts + 1
      resetTime = data.resetTime
    }
  }

  if (attempts >= MAX_FAILED_ATTEMPTS) {
    lockoutUntil = now + LOCKOUT_DURATION
  }

  await redisRateLimitStore.set(
    key,
    { attempts, resetTime, lockoutUntil, firstAttempt: data?.firstAttempt || now },
    ATTEMPT_WINDOW
  )

  if (attempts >= MAX_FAILED_ATTEMPTS) {
    return {
      isLocked: true,
      remainingAttempts: 0,
      lockoutMinutes: 30,
      totalAttempts: attempts
    }
  }

  return {
    isLocked: false,
    remainingAttempts: MAX_FAILED_ATTEMPTS - attempts,
    lockoutMinutes: 0,
    totalAttempts: attempts
  }
}

function recordFailedLoginMemory(key, now) {
  let data = failedLoginStore.get(key)

  if (data && now < data.lockoutUntil) {
    return {
      isLocked: true,
      remainingAttempts: 0,
      lockoutMinutes: Math.ceil((data.lockoutUntil - now) / 60000),
      totalAttempts: data.attempts
    }
  }

  if (!data || now > data.resetTime) {
    data = {
      attempts: 0,
      resetTime: now + ATTEMPT_WINDOW,
      lockoutUntil: 0,
      firstAttempt: now
    }
  }

  data.attempts++

  if (data.attempts >= MAX_FAILED_ATTEMPTS) {
    data.lockoutUntil = now + LOCKOUT_DURATION
    failedLoginStore.set(key, data)
    return {
      isLocked: true,
      remainingAttempts: 0,
      lockoutMinutes: 30,
      totalAttempts: data.attempts
    }
  }

  failedLoginStore.set(key, data)
  return {
    isLocked: false,
    remainingAttempts: MAX_FAILED_ATTEMPTS - data.attempts,
    lockoutMinutes: 0,
    totalAttempts: data.attempts
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
      if (data && now < data.lockoutUntil) {
        return {
          isLocked: true,
          lockoutMinutes: Math.ceil((data.lockoutUntil - now) / 60000)
        }
      }
      return { isLocked: false, lockoutMinutes: 0 }
    } catch {
      // Fallback to memory
    }
  }

  const data = failedLoginStore.get(key)
  if (data && now < data.lockoutUntil) {
    return {
      isLocked: true,
      lockoutMinutes: Math.ceil((data.lockoutUntil - now) / 60000)
    }
  }
  return { isLocked: false, lockoutMinutes: 0 }
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
  loginLimiter,
  globalLimiter,
  getRateLimiterStats,
  clearRateLimiterStore,
  recordFailedLogin,
  checkLoginLockout,
  clearFailedLogins,
  getFailedLoginStats
}
