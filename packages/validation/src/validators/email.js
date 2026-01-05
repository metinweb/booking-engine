/**
 * Email Validator - Single Source of Truth
 *
 * Email format validation.
 * Used by both backend (Mongoose) and frontend (Vue).
 */

/**
 * Email validation regex pattern
 * Matches: user@domain.tld
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Validate email format
 * @param {string} email - Email address to validate
 * @returns {boolean} - true if valid format, false otherwise
 */
export function validateEmail(email) {
	if (!email) return false
	return EMAIL_REGEX.test(email)
}

/**
 * Validate email format (optional field version)
 * @param {string} email - Email address to validate
 * @returns {boolean} - true if valid or empty
 */
export function validateEmailOptional(email) {
	if (!email) return true
	return EMAIL_REGEX.test(email)
}

/**
 * Normalize email (lowercase, trim)
 * @param {string} email - Email address to normalize
 * @returns {string} - Normalized email
 */
export function normalizeEmail(email) {
	if (!email) return ''
	return email.trim().toLowerCase()
}

/**
 * Mongoose-compatible validator object
 */
export const emailValidator = {
	validate: validateEmail,
	message: 'INVALID_EMAIL'
}

export default {
	validate: validateEmail,
	validateOptional: validateEmailOptional,
	normalize: normalizeEmail,
	message: 'INVALID_EMAIL',
	regex: EMAIL_REGEX
}
