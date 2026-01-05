/**
 * Phone Validator - Single Source of Truth
 *
 * Phone number validation.
 * Used by both backend (Mongoose) and frontend (Vue).
 */

/**
 * Minimum digits required for valid phone number
 */
const MIN_DIGITS = 10

/**
 * Validate phone number (at least 10 digits)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - true if valid, false otherwise
 */
export function validatePhone(phone) {
	if (!phone) return false
	const digits = phone.replace(/\D/g, '')
	return digits.length >= MIN_DIGITS
}

/**
 * Validate phone number (optional field version)
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - true if valid or empty
 */
export function validatePhoneOptional(phone) {
	if (!phone) return true
	const digits = phone.replace(/\D/g, '')
	return digits.length >= MIN_DIGITS
}

/**
 * Format phone number (only digits)
 * @param {string} phone - Raw phone input
 * @returns {string} - Digits only
 */
export function formatPhoneDigits(phone) {
	if (!phone) return ''
	return phone.replace(/\D/g, '')
}

/**
 * Format phone number with country code (Turkey default)
 * @param {string} phone - Raw phone input
 * @param {string} countryCode - Country dial code (default: +90)
 * @returns {string} - Formatted phone with country code
 */
export function formatPhoneWithCountry(phone, countryCode = '+90') {
	if (!phone) return ''
	const digits = phone.replace(/\D/g, '')

	// If already starts with country code digits, don't add again
	if (digits.startsWith(countryCode.replace('+', ''))) {
		return '+' + digits
	}

	// Remove leading 0 for local numbers
	const localNumber = digits.startsWith('0') ? digits.slice(1) : digits

	return countryCode + localNumber
}

/**
 * Mongoose-compatible validator object
 */
export const phoneValidator = {
	validate: validatePhone,
	message: 'INVALID_PHONE'
}

export default {
	validate: validatePhone,
	validateOptional: validatePhoneOptional,
	formatDigits: formatPhoneDigits,
	formatWithCountry: formatPhoneWithCountry,
	message: 'INVALID_PHONE',
	minDigits: MIN_DIGITS
}
