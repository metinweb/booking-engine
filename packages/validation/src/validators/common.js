/**
 * Common Validators - Single Source of Truth
 *
 * Shared validation utilities for various data types.
 * Used by both backend (Mongoose) and frontend (Vue).
 */

// ==========================================
// OBJECT ID
// ==========================================

/**
 * ObjectId regex pattern (24 hex characters)
 */
const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/

/**
 * Validate MongoDB ObjectId format
 * Works in both backend and frontend (no mongoose dependency)
 * @param {string|ObjectId} id - ObjectId to validate
 * @returns {boolean} - true if valid ObjectId format
 */
export function validateObjectId(id) {
	if (!id) return false
	// Convert to string if ObjectId
	const str = typeof id === 'object' && id.toString ? id.toString() : String(id)
	return OBJECT_ID_REGEX.test(str)
}

/**
 * Validate MongoDB ObjectId (optional field version)
 * @param {string|ObjectId} id - ObjectId to validate
 * @returns {boolean} - true if valid or empty
 */
export function validateObjectIdOptional(id) {
	if (!id) return true
	const str = typeof id === 'object' && id.toString ? id.toString() : String(id)
	return OBJECT_ID_REGEX.test(str)
}

// ==========================================
// DATE
// ==========================================

/**
 * Validate date string
 * @param {string|Date} date - Date to validate
 * @returns {boolean} - true if valid date
 */
export function validateDate(date) {
	if (!date) return false
	return !isNaN(Date.parse(date))
}

/**
 * Validate date string (optional field version)
 * @param {string|Date} date - Date to validate
 * @returns {boolean} - true if valid or empty
 */
export function validateDateOptional(date) {
	if (!date) return true
	return !isNaN(Date.parse(date))
}

/**
 * Validate date is in the future
 * @param {string|Date} date - Date to validate
 * @returns {boolean} - true if date is in the future
 */
export function validateFutureDate(date) {
	if (!date) return false
	const d = new Date(date)
	return !isNaN(d.getTime()) && d > new Date()
}

/**
 * Validate date is in the past
 * @param {string|Date} date - Date to validate
 * @returns {boolean} - true if date is in the past
 */
export function validatePastDate(date) {
	if (!date) return false
	const d = new Date(date)
	return !isNaN(d.getTime()) && d < new Date()
}

// ==========================================
// STRING
// ==========================================

/**
 * Validate minimum string length
 * @param {number} min - Minimum length
 * @returns {function} - Validator function
 */
export function minLength(min) {
	return (value) => {
		if (!value) return false
		return String(value).trim().length >= min
	}
}

/**
 * Validate maximum string length
 * @param {number} max - Maximum length
 * @returns {function} - Validator function
 */
export function maxLength(max) {
	return (value) => {
		if (!value) return true // Empty is valid for maxLength
		return String(value).trim().length <= max
	}
}

/**
 * Validate string matches pattern
 * @param {RegExp} pattern - Regex pattern
 * @returns {function} - Validator function
 */
export function matchPattern(pattern) {
	return (value) => {
		if (!value) return false
		return pattern.test(value)
	}
}

// ==========================================
// NUMBER
// ==========================================

/**
 * Validate number in range
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {function} - Validator function
 */
export function numberInRange(min, max) {
	return (value) => {
		if (value === null || value === undefined) return false
		const num = Number(value)
		return !isNaN(num) && num >= min && num <= max
	}
}

/**
 * Validate positive number
 * @param {number} value - Number to validate
 * @returns {boolean} - true if positive
 */
export function validatePositiveNumber(value) {
	if (value === null || value === undefined) return false
	const num = Number(value)
	return !isNaN(num) && num > 0
}

/**
 * Validate non-negative number
 * @param {number} value - Number to validate
 * @returns {boolean} - true if non-negative
 */
export function validateNonNegativeNumber(value) {
	if (value === null || value === undefined) return false
	const num = Number(value)
	return !isNaN(num) && num >= 0
}

// ==========================================
// ENUM
// ==========================================

/**
 * Validate value is in enum list
 * @param {Array} values - Allowed values
 * @returns {function} - Validator function
 */
export function validateEnum(values) {
	return (value) => {
		if (!value) return false
		return values.includes(value)
	}
}

/**
 * Validate value is in enum list (optional field version)
 * @param {Array} values - Allowed values
 * @returns {function} - Validator function
 */
export function validateEnumOptional(values) {
	return (value) => {
		if (!value) return true
		return values.includes(value)
	}
}

// ==========================================
// SANITIZE
// ==========================================

/**
 * Sanitize string (trim, remove extra whitespace)
 * @param {string} value - String to sanitize
 * @returns {string} - Sanitized string
 */
export function sanitizeString(value) {
	if (!value) return ''
	return String(value).trim().replace(/\s+/g, ' ')
}

/**
 * Sanitize HTML (basic XSS prevention)
 * @param {string} value - String to sanitize
 * @returns {string} - Sanitized string
 */
export function sanitizeHtml(value) {
	if (!value) return ''
	return String(value)
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#x27;')
}

// ==========================================
// CURRENCY
// ==========================================

/**
 * Valid currency codes
 */
export const CURRENCY_CODES = ['TRY', 'USD', 'EUR', 'GBP', 'RUB']

/**
 * Validate currency code
 * @param {string} code - Currency code
 * @returns {boolean} - true if valid currency
 */
export function validateCurrency(code) {
	if (!code) return false
	return CURRENCY_CODES.includes(code.toUpperCase())
}

// ==========================================
// EXPORTS
// ==========================================

export default {
	// ObjectId
	validateObjectId,
	validateObjectIdOptional,

	// Date
	validateDate,
	validateDateOptional,
	validateFutureDate,
	validatePastDate,

	// String
	minLength,
	maxLength,
	matchPattern,

	// Number
	numberInRange,
	validatePositiveNumber,
	validateNonNegativeNumber,

	// Enum
	validateEnum,
	validateEnumOptional,

	// Sanitize
	sanitizeString,
	sanitizeHtml,

	// Currency
	validateCurrency,
	CURRENCY_CODES
}
