/**
 * Mongoose Adapter - Schema Converter
 *
 * Converts shared validation schemas to Mongoose schema format.
 * Single Source of Truth for Mongoose validation.
 */

import { validateTcKimlik } from '../validators/tcKimlik.js'
import { validateEmail, validateEmailOptional } from '../validators/email.js'
import { validatePhone, validatePhoneOptional } from '../validators/phone.js'
import {
	validateObjectId,
	validateDate,
	validateDateOptional
} from '../validators/common.js'

// ==========================================
// VALIDATOR REGISTRY
// ==========================================

/**
 * Map of validator names to functions
 */
export const validators = {
	tcKimlik: {
		validate: validateTcKimlik,
		message: 'INVALID_TC_KIMLIK'
	},
	email: {
		validate: validateEmail,
		message: 'INVALID_EMAIL'
	},
	emailOptional: {
		validate: validateEmailOptional,
		message: 'INVALID_EMAIL'
	},
	phone: {
		validate: validatePhone,
		message: 'INVALID_PHONE'
	},
	phoneOptional: {
		validate: validatePhoneOptional,
		message: 'INVALID_PHONE'
	},
	objectId: {
		validate: validateObjectId,
		message: 'INVALID_OBJECT_ID'
	},
	date: {
		validate: validateDate,
		message: 'INVALID_DATE'
	},
	dateOptional: {
		validate: validateDateOptional,
		message: 'INVALID_DATE'
	}
}

// ==========================================
// TYPE MAPPING
// ==========================================

/**
 * Map schema types to Mongoose types
 */
const typeMap = {
	string: String,
	number: Number,
	boolean: Boolean,
	date: Date,
	object: Object,
	array: Array,
	objectId: 'ObjectId', // Special handling
	mixed: 'Mixed'
}

// ==========================================
// SCHEMA CONVERTER
// ==========================================

/**
 * Convert a single field definition to Mongoose format
 * @param {Object} def - Field definition
 * @param {Object} mongoose - Mongoose instance (for ObjectId)
 * @returns {Object} - Mongoose field definition
 */
function convertField(def, mongoose) {
	// Handle simple type string
	if (typeof def === 'string') {
		return { type: typeMap[def] || String }
	}

	const field = {}

	// Type
	if (def.type === 'objectId' && mongoose) {
		field.type = mongoose.Schema.Types.ObjectId
	} else if (def.type === 'mixed' && mongoose) {
		field.type = mongoose.Schema.Types.Mixed
	} else {
		field.type = typeMap[def.type] || String
	}

	// Required
	if (def.required !== undefined) {
		if (Array.isArray(def.required)) {
			field.required = def.required
		} else if (typeof def.required === 'function') {
			// Dynamic required - convert to Mongoose format
			field.required = function() {
				return def.required(this)
			}
		} else if (def.required) {
			field.required = [true, def.message || 'REQUIRED']
		}
	}

	// Enum
	if (def.enum) {
		if (def.enum.values) {
			field.enum = def.enum
		} else if (Array.isArray(def.enum)) {
			field.enum = { values: def.enum, message: def.message || 'INVALID_VALUE' }
		}
	}

	// String modifiers
	if (def.trim) field.trim = true
	if (def.lowercase) field.lowercase = true
	if (def.uppercase) field.uppercase = true

	// Length constraints
	if (def.minLength) {
		field.minlength = Array.isArray(def.minLength) ? def.minLength : [def.minLength, 'MIN_LENGTH']
	}
	if (def.maxLength) {
		field.maxlength = Array.isArray(def.maxLength) ? def.maxLength : [def.maxLength, 'MAX_LENGTH']
	}

	// Number constraints
	if (def.min !== undefined) {
		field.min = Array.isArray(def.min) ? def.min : [def.min, 'MIN_VALUE']
	}
	if (def.max !== undefined) {
		field.max = Array.isArray(def.max) ? def.max : [def.max, 'MAX_VALUE']
	}

	// Default
	if (def.default !== undefined) {
		field.default = def.default
	}

	// Ref (for ObjectId)
	if (def.ref) {
		field.ref = def.ref
	}

	// RefPath (for dynamic references)
	if (def.refPath) {
		field.refPath = def.refPath
	}

	// Unique
	if (def.unique) {
		field.unique = def.unique
	}

	// Select (for hiding fields)
	if (def.select === false) {
		field.select = false
	}

	// Index
	if (def.index) {
		field.index = def.index
	}

	// Custom validator
	if (def.validate) {
		if (typeof def.validate === 'string' && validators[def.validate]) {
			// Named validator from registry
			field.validate = {
				validator: validators[def.validate].validate,
				message: def.message || validators[def.validate].message
			}
		} else if (typeof def.validate === 'object' && def.validate.validator) {
			// Validator object with custom function
			field.validate = {
				validator: def.validate.validator,
				message: def.validate.message || def.message || 'VALIDATION_FAILED'
			}
		} else if (typeof def.validate === 'function') {
			// Direct function
			field.validate = {
				validator: def.validate,
				message: def.message || 'VALIDATION_FAILED'
			}
		}
	}

	return field
}

/**
 * Convert entire schema to Mongoose format
 * @param {Object} schema - Shared schema definition
 * @param {Object} mongoose - Mongoose instance (required for ObjectId)
 * @returns {Object} - Mongoose schema definition
 */
export function toMongooseSchema(schema, mongoose) {
	const result = {}

	for (const [fieldName, fieldDef] of Object.entries(schema)) {
		// Skip frontend-only fields
		if (fieldDef.frontendOnly) continue
		if (fieldDef.showWhen) {
			// Don't include showWhen in Mongoose schema
			const { showWhen, ...rest } = fieldDef
			result[fieldName] = convertField(rest, mongoose)
		} else {
			result[fieldName] = convertField(fieldDef, mongoose)
		}
	}

	return result
}

/**
 * Create Mongoose schema from shared schema
 * @param {Object} schema - Shared schema definition
 * @param {Object} mongoose - Mongoose instance
 * @param {Object} options - Mongoose schema options
 * @returns {mongoose.Schema} - Mongoose Schema instance
 */
export function createMongooseSchema(schema, mongoose, options = {}) {
	const converted = toMongooseSchema(schema, mongoose)
	return new mongoose.Schema(converted, options)
}

// ==========================================
// VALIDATION PLUGIN
// ==========================================

/**
 * Mongoose plugin for consistent validation error formatting
 */
export function validationPlugin(schema) {
	// Transform validation errors to consistent format
	schema.post('validate', function(error, doc, next) {
		if (error && error.name === 'ValidationError') {
			const errors = []
			for (const [field, err] of Object.entries(error.errors)) {
				errors.push({
					field,
					message: err.message,
					value: err.value
				})
			}
			error.formattedErrors = errors
		}
		next()
	})
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Validate data against schema before saving
 * @param {Object} data - Data to validate
 * @param {Object} schema - Shared schema definition
 * @returns {Object} - { valid: boolean, errors: Array }
 */
export function validateData(data, schema) {
	const errors = []

	for (const [fieldName, fieldDef] of Object.entries(schema)) {
		const value = data[fieldName]

		// Check required
		const isRequired = typeof fieldDef.required === 'function'
			? fieldDef.required(data)
			: Array.isArray(fieldDef.required)
				? fieldDef.required[0]
				: fieldDef.required

		if (isRequired && (value === undefined || value === null || value === '')) {
			errors.push({
				field: fieldName,
				message: Array.isArray(fieldDef.required) ? fieldDef.required[1] : fieldDef.message || 'REQUIRED'
			})
			continue
		}

		// Skip validation if no value and not required
		if (!value) continue

		// Check validator
		if (fieldDef.validate) {
			let isValid = true
			let validator = null

			if (typeof fieldDef.validate === 'string' && validators[fieldDef.validate]) {
				validator = validators[fieldDef.validate].validate
			} else if (typeof fieldDef.validate === 'object' && fieldDef.validate.validator) {
				validator = fieldDef.validate.validator
			} else if (typeof fieldDef.validate === 'function') {
				validator = fieldDef.validate
			}

			if (validator) {
				isValid = validator(value, data)
			}

			if (!isValid) {
				errors.push({
					field: fieldName,
					message: fieldDef.message || (fieldDef.validate?.message) || 'VALIDATION_FAILED'
				})
			}
		}

		// Check enum
		if (fieldDef.enum) {
			const values = fieldDef.enum.values || fieldDef.enum
			if (!values.includes(value)) {
				errors.push({
					field: fieldName,
					message: fieldDef.enum.message || 'INVALID_VALUE'
				})
			}
		}
	}

	return {
		valid: errors.length === 0,
		errors
	}
}

export default {
	toMongooseSchema,
	createMongooseSchema,
	validationPlugin,
	validateData,
	validators
}
