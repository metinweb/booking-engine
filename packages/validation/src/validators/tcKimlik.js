/**
 * TC Kimlik Numarasi Validator - Single Source of Truth
 *
 * Turkish national ID number validation using official algorithm.
 * Used by both backend (Mongoose) and frontend (Vue).
 */

/**
 * Validate TC Kimlik number using official algorithm
 * @param {string} tc - TC Kimlik number (11 digits)
 * @returns {boolean} - true if valid or empty, false if invalid
 */
export function validateTcKimlik(tc) {
	// Empty is valid (optional field)
	if (!tc) return true

	// Must be exactly 11 digits
	if (tc.length !== 11) return false
	if (!/^\d{11}$/.test(tc)) return false

	// First digit cannot be 0
	if (tc[0] === '0') return false

	// Algorithm check
	const digits = tc.split('').map(Number)
	const sum1 = digits[0] + digits[2] + digits[4] + digits[6] + digits[8] // Odd positions (1,3,5,7,9)
	const sum2 = digits[1] + digits[3] + digits[5] + digits[7] // Even positions (2,4,6,8)

	// 10th digit = (sum1 * 7 - sum2) mod 10
	const check1 = (sum1 * 7 - sum2) % 10

	// 11th digit = (sum1 + sum2 + 10th digit) mod 10
	const check2 = (sum1 + sum2 + digits[9]) % 10

	return digits[9] === check1 && digits[10] === check2
}

/**
 * Format TC Kimlik input (only digits, max 11)
 * @param {string} value - Raw input value
 * @returns {string} - Formatted TC Kimlik number
 */
export function formatTcKimlik(value) {
	if (!value) return ''
	return value.replace(/\D/g, '').slice(0, 11)
}

/**
 * Mongoose-compatible validator object
 */
export const tcKimlikValidator = {
	validate: validateTcKimlik,
	message: 'INVALID_TC_KIMLIK'
}

export default {
	validate: validateTcKimlik,
	format: formatTcKimlik,
	message: 'INVALID_TC_KIMLIK'
}
