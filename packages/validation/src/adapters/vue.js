/**
 * Vue Adapter - Frontend Validation Helpers
 *
 * Provides Vue composable helpers for form validation.
 * Uses shared validation schemas.
 */

import { validateTcKimlik, formatTcKimlik } from '../validators/tcKimlik.js'
import { validateEmail, normalizeEmail } from '../validators/email.js'
import { validatePhone, formatPhoneDigits } from '../validators/phone.js'

// Import all schemas
import * as guestSchemas from '../schemas/guest.js'
import * as bookingSchemas from '../schemas/booking.js'
import * as invoiceSchemas from '../schemas/invoice.js'
import * as paymentSchemas from '../schemas/payment.js'

// ==========================================
// SCHEMA REGISTRY
// ==========================================

/**
 * Registry of all validation schemas
 */
export const schemas = {
	// Guest schemas
	leadGuest: guestSchemas.leadGuestSchema,
	roomGuest: guestSchemas.roomGuestSchema,
	pmsGuest: guestSchemas.pmsGuestSchema,

	// Booking schemas
	booking: bookingSchemas.bookingSchema,
	bookingRoom: bookingSchemas.bookingRoomSchema,
	bookingPricing: bookingSchemas.bookingPricingSchema,
	bookingValidation: bookingSchemas.bookingValidationSchema,

	// Invoice schemas
	invoiceIndividual: invoiceSchemas.invoiceIndividualSchema,
	invoiceCorporate: invoiceSchemas.invoiceCorporateSchema,
	invoiceDetails: invoiceSchemas.invoiceDetailsSchema,

	// Payment schemas
	payment: paymentSchemas.paymentSchema,
	creditCard: paymentSchemas.creditCardSchema,
	paymentValidation: paymentSchemas.paymentValidationSchema
}

// ==========================================
// VALIDATOR FUNCTIONS
// ==========================================

/**
 * Named validators that can be referenced in schemas
 */
export const validators = {
	tcKimlik: validateTcKimlik,
	email: validateEmail,
	phone: validatePhone
}

/**
 * Format functions for input fields
 */
export const formatters = {
	tcKimlik: formatTcKimlik,
	email: normalizeEmail,
	phone: formatPhoneDigits
}

// ==========================================
// VALIDATION FUNCTIONS
// ==========================================

/**
 * Validate a single field against schema
 * @param {string} schemaName - Name of schema in registry
 * @param {string} fieldName - Field to validate
 * @param {*} value - Value to validate
 * @param {Object} data - Full form data (for dynamic validation)
 * @param {Object} rootData - Root data (for nested forms)
 * @returns {Object} - { valid: boolean, message?: string }
 */
export function validateField(schemaName, fieldName, value, data = {}, rootData = {}) {
	const schema = schemas[schemaName]
	if (!schema) return { valid: true }

	const fieldDef = schema[fieldName]
	if (!fieldDef) return { valid: true }

	// Check required
	const isRequired = typeof fieldDef.required === 'function'
		? fieldDef.required(data, rootData)
		: Array.isArray(fieldDef.required)
			? fieldDef.required[0]
			: fieldDef.required

	const isEmpty = value === undefined || value === null ||
		(typeof value === 'string' && !value.trim())

	if (isRequired && isEmpty) {
		const message = Array.isArray(fieldDef.required)
			? fieldDef.required[1]
			: fieldDef.message || 'REQUIRED'
		return { valid: false, message }
	}

	// Skip validation if empty and not required
	if (isEmpty) return { valid: true }

	// Check validator
	if (fieldDef.validate) {
		let isValid = true
		let validatorFn = null

		if (typeof fieldDef.validate === 'string' && validators[fieldDef.validate]) {
			validatorFn = validators[fieldDef.validate]
		} else if (typeof fieldDef.validate === 'object' && fieldDef.validate.validator) {
			validatorFn = fieldDef.validate.validator
		} else if (typeof fieldDef.validate === 'function') {
			validatorFn = fieldDef.validate
		}

		if (validatorFn) {
			isValid = validatorFn(value, data, rootData)
		}

		if (!isValid) {
			const message = typeof fieldDef.validate === 'object'
				? fieldDef.validate.message
				: fieldDef.message || 'VALIDATION_FAILED'
			return { valid: false, message }
		}
	}

	// Check enum
	if (fieldDef.enum) {
		const values = fieldDef.enum.values || fieldDef.enum
		if (Array.isArray(values) && !values.includes(value)) {
			return {
				valid: false,
				message: fieldDef.enum.message || 'INVALID_VALUE'
			}
		}
	}

	// Check minLength
	if (fieldDef.minLength) {
		const min = Array.isArray(fieldDef.minLength) ? fieldDef.minLength[0] : fieldDef.minLength
		if (String(value).trim().length < min) {
			const message = Array.isArray(fieldDef.minLength)
				? fieldDef.minLength[1]
				: `MIN_LENGTH_${min}`
			return { valid: false, message }
		}
	}

	// Check maxLength
	if (fieldDef.maxLength) {
		const max = Array.isArray(fieldDef.maxLength) ? fieldDef.maxLength[0] : fieldDef.maxLength
		if (String(value).length > max) {
			const message = Array.isArray(fieldDef.maxLength)
				? fieldDef.maxLength[1]
				: `MAX_LENGTH_${max}`
			return { valid: false, message }
		}
	}

	return { valid: true }
}

/**
 * Validate an entire object against schema
 * @param {string} schemaName - Name of schema
 * @param {Object} data - Data to validate
 * @param {Object} rootData - Root data for nested forms
 * @returns {Object} - { valid: boolean, errors: Array }
 */
export function validateObject(schemaName, data, rootData = {}) {
	const schema = schemas[schemaName]
	if (!schema) return { valid: true, errors: [] }

	const errors = []

	for (const fieldName of Object.keys(schema)) {
		const value = data?.[fieldName]
		const result = validateField(schemaName, fieldName, value, data, rootData)

		if (!result.valid) {
			errors.push({
				field: fieldName,
				message: result.message
			})
		}
	}

	return {
		valid: errors.length === 0,
		errors
	}
}

/**
 * Check if field should be shown (for conditional fields)
 * @param {string} schemaName - Name of schema
 * @param {string} fieldName - Field to check
 * @param {Object} data - Current form data
 * @param {Object} rootData - Root form data
 * @returns {boolean} - true if field should be shown
 */
export function shouldShowField(schemaName, fieldName, data = {}, rootData = {}) {
	const schema = schemas[schemaName]
	if (!schema) return true

	const fieldDef = schema[fieldName]
	if (!fieldDef) return true

	if (fieldDef.showWhen) {
		return fieldDef.showWhen(data, rootData)
	}

	return true
}

/**
 * Check if field is required
 * @param {string} schemaName - Name of schema
 * @param {string} fieldName - Field to check
 * @param {Object} data - Current form data
 * @returns {boolean} - true if field is required
 */
export function isFieldRequired(schemaName, fieldName, data = {}) {
	const schema = schemas[schemaName]
	if (!schema) return false

	const fieldDef = schema[fieldName]
	if (!fieldDef) return false

	if (typeof fieldDef.required === 'function') {
		return fieldDef.required(data)
	}

	return Array.isArray(fieldDef.required)
		? fieldDef.required[0]
		: !!fieldDef.required
}

/**
 * Get CSS class for field based on validation state
 * @param {string} schemaName - Name of schema
 * @param {string} fieldName - Field name
 * @param {*} value - Field value
 * @param {Object} data - Form data
 * @param {boolean} showValidation - Whether to show validation state
 * @returns {string} - CSS class string
 */
export function getFieldClass(schemaName, fieldName, value, data = {}, showValidation = false) {
	if (!showValidation) return ''

	const result = validateField(schemaName, fieldName, value, data)

	if (!result.valid) {
		return 'border-red-500 bg-red-50 dark:bg-red-900/10 focus:border-red-500 focus:ring-red-500'
	}

	// Show green if value exists and is valid
	const hasValue = value !== undefined && value !== null &&
		(typeof value !== 'string' || value.trim())

	if (hasValue) {
		return 'border-green-500 bg-green-50 dark:bg-green-900/10'
	}

	return ''
}

// ==========================================
// COMPOSABLE FACTORY
// ==========================================

/**
 * Create a validation composable for Vue components
 * Usage: const { validate, getClass, isRequired, format } = useValidation()
 *
 * @param {Function} t - Translation function (from useI18n)
 * @returns {Object} - Validation helpers
 */
export function createValidation(t) {
	const translate = t || ((key) => key)

	return {
		// Schema access
		schemas,

		// Validation
		validate: (schemaName, fieldName, value, data, rootData) => {
			const result = validateField(schemaName, fieldName, value, data, rootData)
			if (!result.valid && result.message) {
				result.message = translate(result.message)
			}
			return result
		},

		validateObject: (schemaName, data, rootData) => {
			const result = validateObject(schemaName, data, rootData)
			result.errors = result.errors.map(e => ({
				...e,
				message: translate(e.message)
			}))
			return result
		},

		// Field helpers
		shouldShow: shouldShowField,
		isRequired: isFieldRequired,
		getClass: getFieldClass,

		// Direct validators
		validateTcKimlik,
		validateEmail,
		validatePhone,

		// Formatters
		formatTcKimlik,
		formatEmail: normalizeEmail,
		formatPhone: formatPhoneDigits
	}
}

// ==========================================
// EXPORTS
// ==========================================

export {
	validateTcKimlik,
	validateEmail,
	validatePhone,
	formatTcKimlik,
	normalizeEmail as formatEmail,
	formatPhoneDigits as formatPhone
}

export default {
	schemas,
	validators,
	formatters,
	validateField,
	validateObject,
	shouldShowField,
	isFieldRequired,
	getFieldClass,
	createValidation
}
