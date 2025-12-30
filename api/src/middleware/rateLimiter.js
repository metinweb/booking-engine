/**
 * Rate Limiter Middleware
 * Protects API from abuse with configurable rate limiting
 */

/**
 * In-memory store for rate limiting
 * In production, use Redis for distributed rate limiting
 */
const rateLimitStore = new Map()

// Clean up expired entries every minute
setInterval(() => {
	const now = Date.now()
	for (const [key, data] of rateLimitStore) {
		if (now > data.resetTime) {
			rateLimitStore.delete(key)
		}
	}
}, 60 * 1000)

/**
 * Get client identifier from request
 * @param {Object} req - Express request
 * @returns {string} Client identifier
 */
function getClientId(req) {
	// Check for forwarded IP (behind proxy)
	const forwarded = req.headers['x-forwarded-for']
	const ip = forwarded ? forwarded.split(',')[0].trim() : req.ip

	// Combine IP with route for more granular limiting
	return `${ip}:${req.originalUrl.split('?')[0]}`
}

/**
 * Create rate limiter middleware
 * @param {Object} options - Rate limiter options
 * @returns {Function} Express middleware
 */
export function createRateLimiter(options = {}) {
	const {
		windowMs = 60 * 1000,        // 1 minute window
		maxRequests = 60,             // 60 requests per window
		message = 'Too many requests, please try again later.',
		statusCode = 429,
		keyGenerator = getClientId,
		skip = () => false,           // Function to skip rate limiting
		headers = true                // Send rate limit headers
	} = options

	return (req, res, next) => {
		// Skip rate limiting if condition met
		if (skip(req)) {
			return next()
		}

		const key = keyGenerator(req)
		const now = Date.now()

		// Get or create rate limit data
		let data = rateLimitStore.get(key)
		if (!data || now > data.resetTime) {
			data = {
				count: 0,
				resetTime: now + windowMs,
				firstRequest: now
			}
			rateLimitStore.set(key, data)
		}

		// Increment request count
		data.count++

		// Calculate remaining requests
		const remaining = Math.max(0, maxRequests - data.count)
		const resetTime = Math.ceil((data.resetTime - now) / 1000)

		// Set rate limit headers
		if (headers) {
			res.set({
				'X-RateLimit-Limit': maxRequests,
				'X-RateLimit-Remaining': remaining,
				'X-RateLimit-Reset': resetTime,
				'X-RateLimit-Reset-Time': new Date(data.resetTime).toISOString()
			})
		}

		// Check if limit exceeded
		if (data.count > maxRequests) {
			res.set('Retry-After', resetTime)
			return res.status(statusCode).json({
				success: false,
				error: 'RATE_LIMIT_EXCEEDED',
				message,
				retryAfter: resetTime
			})
		}

		next()
	}
}

/**
 * Pre-configured rate limiters for different API sections
 */

// Public search API - generous limits for search
export const publicSearchLimiter = createRateLimiter({
	windowMs: 60 * 1000,      // 1 minute
	maxRequests: 100,         // 100 requests per minute
	message: 'Too many search requests. Please wait a moment.'
})

// Public booking API - more restrictive
export const publicBookingLimiter = createRateLimiter({
	windowMs: 60 * 1000,      // 1 minute
	maxRequests: 30,          // 30 requests per minute
	message: 'Too many booking requests. Please try again later.'
})

// Price calculation - moderate limits
export const pricingLimiter = createRateLimiter({
	windowMs: 60 * 1000,      // 1 minute
	maxRequests: 60,          // 60 requests per minute
	message: 'Too many pricing requests. Please slow down.'
})

// General API limiter
export const generalLimiter = createRateLimiter({
	windowMs: 60 * 1000,      // 1 minute
	maxRequests: 120,         // 120 requests per minute
	message: 'Too many requests. Please try again later.'
})

// Strict limiter for sensitive operations (login, password reset, etc.)
export const strictLimiter = createRateLimiter({
	windowMs: 15 * 60 * 1000, // 15 minutes
	maxRequests: 5,           // 5 requests per 15 minutes
	message: 'Too many attempts. Please try again later.'
})

// IP-based global limiter (across all endpoints)
export const globalLimiter = createRateLimiter({
	windowMs: 60 * 1000,      // 1 minute
	maxRequests: 300,         // 300 total requests per minute from same IP
	keyGenerator: (req) => {
		const forwarded = req.headers['x-forwarded-for']
		return forwarded ? forwarded.split(',')[0].trim() : req.ip
	},
	message: 'Global rate limit exceeded. Please slow down.'
})

/**
 * Get rate limiter statistics
 * @returns {Object} Statistics
 */
export function getRateLimiterStats() {
	let totalEntries = 0
	let activeEntries = 0
	const now = Date.now()

	for (const [key, data] of rateLimitStore) {
		totalEntries++
		if (now < data.resetTime) {
			activeEntries++
		}
	}

	return {
		totalEntries,
		activeEntries,
		storeSize: rateLimitStore.size
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
	globalLimiter,
	getRateLimiterStats,
	clearRateLimiterStore
}
