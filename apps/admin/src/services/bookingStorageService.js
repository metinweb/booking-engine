/**
 * Booking Storage Service
 * Manages localStorage for Phase 1 booking data
 * Data is stored temporarily until user proceeds to Phase 2 (where it's saved to DB)
 */

const STORAGE_KEY = 'booking_phase1_data'
const STORAGE_EXPIRY_HOURS = 24

/**
 * Save Phase 1 data to localStorage
 * @param {Object} data - Search criteria, cart, selected hotel
 */
export function savePhase1Data(data) {
	try {
		const payload = {
			data,
			savedAt: new Date().toISOString(),
			expiresAt: new Date(Date.now() + STORAGE_EXPIRY_HOURS * 60 * 60 * 1000).toISOString()
		}
		localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
		console.log('💾 Phase 1 data saved to localStorage')
		return true
	} catch (error) {
		console.error('Failed to save Phase 1 data:', error)
		return false
	}
}

/**
 * Load Phase 1 data from localStorage
 * @returns {Object|null} - Phase 1 data or null if expired/not found
 */
export function loadPhase1Data() {
	try {
		const stored = localStorage.getItem(STORAGE_KEY)
		if (!stored) {
			return null
		}

		const payload = JSON.parse(stored)

		// Check expiration
		if (new Date(payload.expiresAt) < new Date()) {
			console.log('⏰ Phase 1 data expired, clearing...')
			clearPhase1Data()
			return null
		}

		console.log('📦 Phase 1 data loaded from localStorage')
		return payload.data
	} catch (error) {
		console.error('Failed to load Phase 1 data:', error)
		return null
	}
}

/**
 * Clear Phase 1 data from localStorage
 */
export function clearPhase1Data() {
	try {
		localStorage.removeItem(STORAGE_KEY)
		console.log('🗑️ Phase 1 data cleared from localStorage')
		return true
	} catch (error) {
		console.error('Failed to clear Phase 1 data:', error)
		return false
	}
}

/**
 * Check if Phase 1 data exists and is valid
 * @returns {boolean}
 */
export function hasPhase1Data() {
	return loadPhase1Data() !== null
}

/**
 * Get storage metadata (for debugging)
 * @returns {Object|null}
 */
export function getStorageInfo() {
	try {
		const stored = localStorage.getItem(STORAGE_KEY)
		if (!stored) return null

		const payload = JSON.parse(stored)
		return {
			savedAt: payload.savedAt,
			expiresAt: payload.expiresAt,
			isExpired: new Date(payload.expiresAt) < new Date(),
			hasSearchCriteria: !!payload.data?.search,
			hasCart: payload.data?.cart?.length > 0,
			cartItemCount: payload.data?.cart?.length || 0
		}
	} catch {
		return null
	}
}

/**
 * Update only the cart in localStorage (without full save)
 * @param {Array} cart - Cart items
 */
export function updateCart(cart) {
	const data = loadPhase1Data()
	if (data) {
		data.cart = cart
		savePhase1Data(data)
	}
}

/**
 * Update only search criteria in localStorage
 * @param {Object} search - Search criteria
 */
export function updateSearchCriteria(search) {
	const data = loadPhase1Data() || {}
	data.search = search
	savePhase1Data(data)
}

export default {
	savePhase1Data,
	loadPhase1Data,
	clearPhase1Data,
	hasPhase1Data,
	getStorageInfo,
	updateCart,
	updateSearchCriteria
}
