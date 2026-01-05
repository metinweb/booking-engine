/**
 * Input Validation Middleware
 * Provides request validation utilities for API endpoints
 */

import { BadRequestError } from '../core/errors.js'

/**
 * Validate ObjectId format
 * @param {string} id - ID to validate
 * @returns {boolean}
 */
export function isValidObjectId(id) {
  if (!id) return false
  return /^[0-9a-fA-F]{24}$/.test(id.toString())
}

/**
 * Validate date string format (YYYY-MM-DD)
 * @param {string} dateStr - Date string to validate
 * @returns {boolean}
 */
export function isValidDateString(dateStr) {
  if (!dateStr) return false
  const regex = /^\d{4}-\d{2}-\d{2}$/
  if (!regex.test(dateStr)) return false

  const date = new Date(dateStr)
  return date instanceof Date && !isNaN(date)
}

/**
 * Validate date is not in the past
 * @param {string} dateStr - Date string to validate
 * @returns {boolean}
 */
export function isNotPastDate(dateStr) {
  if (!isValidDateString(dateStr)) return false
  const date = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date >= today
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean}
 */
export function isValidEmail(email) {
  if (!email) return false
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
}

/**
 * Validate phone number format
 * @param {string} phone - Phone number to validate
 * @returns {boolean}
 */
export function isValidPhone(phone) {
  if (!phone) return false
  // Allow + and digits, minimum 8 characters
  const regex = /^\+?[0-9]{8,15}$/
  return regex.test(phone.replace(/[\s-]/g, ''))
}

/**
 * Validate currency code
 */
export const VALID_CURRENCIES = [
  'TRY',
  'USD',
  'EUR',
  'GBP',
  'RUB',
  'SAR',
  'AED',
  'CHF',
  'JPY',
  'CNY'
]

export function isValidCurrency(currency) {
  return VALID_CURRENCIES.includes(currency?.toUpperCase())
}

/**
 * Sanitize string input
 * @param {string} str - String to sanitize
 * @param {number} maxLength - Maximum allowed length
 * @returns {string}
 */
export function sanitizeString(str, maxLength = 255) {
  if (!str) return ''
  return String(str).trim().slice(0, maxLength)
}

/**
 * Parse and validate integer
 * @param {any} value - Value to parse
 * @param {Object} options - { min, max, defaultValue }
 * @returns {number|null}
 */
export function parseInteger(value, options = {}) {
  const { min = null, max = null, defaultValue = null } = options

  if (value === undefined || value === null || value === '') {
    return defaultValue
  }

  const parsed = parseInt(value, 10)
  if (isNaN(parsed)) {
    return defaultValue
  }

  if (min !== null && parsed < min) return min
  if (max !== null && parsed > max) return max

  return parsed
}

/**
 * Parse and validate positive number
 * @param {any} value - Value to parse
 * @param {number} defaultValue - Default value if invalid
 * @returns {number}
 */
export function parsePositiveNumber(value, defaultValue = 0) {
  if (value === undefined || value === null || value === '') {
    return defaultValue
  }

  const parsed = parseFloat(value)
  if (isNaN(parsed) || parsed < 0) {
    return defaultValue
  }

  return parsed
}

/**
 * Validation schema types
 */
const SCHEMA_TYPES = {
  string: value => typeof value === 'string',
  number: value => typeof value === 'number' && !isNaN(value),
  integer: value => Number.isInteger(value),
  boolean: value => typeof value === 'boolean',
  array: value => Array.isArray(value),
  object: value => typeof value === 'object' && value !== null && !Array.isArray(value),
  date: value => isValidDateString(value),
  objectId: value => isValidObjectId(value),
  email: value => isValidEmail(value),
  phone: value => isValidPhone(value),
  currency: value => isValidCurrency(value)
}

/**
 * Validate request body against schema
 * @param {Object} schema - Validation schema
 * @returns {Function} Express middleware
 */
export function validateBody(schema) {
  return (req, res, next) => {
    const errors = []

    for (const [field, rules] of Object.entries(schema)) {
      const value = req.body[field]

      // Required check
      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push({
          field,
          message: rules.message || `${field} is required`
        })
        continue
      }

      // Skip validation if field is optional and not provided
      if (value === undefined || value === null) {
        continue
      }

      // Type check
      if (rules.type && SCHEMA_TYPES[rules.type]) {
        if (!SCHEMA_TYPES[rules.type](value)) {
          errors.push({
            field,
            message: `${field} must be of type ${rules.type}`
          })
          continue
        }
      }

      // Min/Max for numbers
      if (typeof value === 'number') {
        if (rules.min !== undefined && value < rules.min) {
          errors.push({
            field,
            message: `${field} must be at least ${rules.min}`
          })
        }
        if (rules.max !== undefined && value > rules.max) {
          errors.push({
            field,
            message: `${field} must be at most ${rules.max}`
          })
        }
      }

      // Min/Max length for strings
      if (typeof value === 'string') {
        if (rules.minLength !== undefined && value.length < rules.minLength) {
          errors.push({
            field,
            message: `${field} must be at least ${rules.minLength} characters`
          })
        }
        if (rules.maxLength !== undefined && value.length > rules.maxLength) {
          errors.push({
            field,
            message: `${field} must be at most ${rules.maxLength} characters`
          })
        }
      }

      // Enum validation
      if (rules.enum && !rules.enum.includes(value)) {
        errors.push({
          field,
          message: `${field} must be one of: ${rules.enum.join(', ')}`
        })
      }

      // Custom validator
      if (rules.validate && typeof rules.validate === 'function') {
        const result = rules.validate(value, req.body)
        if (result !== true) {
          errors.push({
            field,
            message: result || `${field} validation failed`
          })
        }
      }
    }

    if (errors.length > 0) {
      return next(new BadRequestError('VALIDATION_ERROR', { errors }))
    }

    next()
  }
}

/**
 * Validate query parameters
 * @param {Object} schema - Validation schema
 * @returns {Function} Express middleware
 */
export function validateQuery(schema) {
  return (req, res, next) => {
    const errors = []

    for (const [param, rules] of Object.entries(schema)) {
      let value = req.query[param]

      // Required check
      if (rules.required && (value === undefined || value === null || value === '')) {
        errors.push({
          param,
          message: rules.message || `Query parameter ${param} is required`
        })
        continue
      }

      // Skip validation if param is optional and not provided
      if (value === undefined || value === null) {
        continue
      }

      // Type coercion for query params (they come as strings)
      if (rules.type === 'number' || rules.type === 'integer') {
        value = parseFloat(value)
        req.query[param] = value
        if (isNaN(value)) {
          errors.push({
            param,
            message: `${param} must be a valid number`
          })
          continue
        }
      } else if (rules.type === 'boolean') {
        value = value === 'true' || value === '1'
        req.query[param] = value
      }

      // Enum validation
      if (rules.enum && !rules.enum.includes(value)) {
        errors.push({
          param,
          message: `${param} must be one of: ${rules.enum.join(', ')}`
        })
      }
    }

    if (errors.length > 0) {
      return next(new BadRequestError('VALIDATION_ERROR', { errors }))
    }

    next()
  }
}

/**
 * Validate route parameters
 * @param {Object} schema - Validation schema
 * @returns {Function} Express middleware
 */
export function validateParams(schema) {
  return (req, res, next) => {
    const errors = []

    for (const [param, rules] of Object.entries(schema)) {
      const value = req.params[param]

      // ObjectId check
      if (rules.type === 'objectId' && !isValidObjectId(value)) {
        errors.push({
          param,
          message: `Invalid ${param} format`
        })
      }
    }

    if (errors.length > 0) {
      return next(new BadRequestError('VALIDATION_ERROR', { errors }))
    }

    next()
  }
}

/**
 * Common validation schemas for reuse
 */
export const commonSchemas = {
  // Booking/Price calculation
  priceQuery: {
    hotelId: { type: 'objectId', required: true },
    roomTypeId: { type: 'objectId', required: true },
    mealPlanId: { type: 'objectId', required: true },
    marketId: { type: 'objectId', required: true },
    checkInDate: { type: 'date', required: true },
    checkOutDate: { type: 'date', required: true },
    adults: { type: 'integer', min: 1, max: 10 },
    children: { type: 'array' }
  },

  // Date range
  dateRange: {
    startDate: { type: 'date', required: true },
    endDate: { type: 'date', required: true }
  },

  // Pagination
  pagination: {
    page: { type: 'integer', min: 1 },
    limit: { type: 'integer', min: 1, max: 100 }
  }
}

export default {
  isValidObjectId,
  isValidDateString,
  isNotPastDate,
  isValidEmail,
  isValidPhone,
  isValidCurrency,
  sanitizeString,
  parseInteger,
  parsePositiveNumber,
  validateBody,
  validateQuery,
  validateParams,
  commonSchemas,
  VALID_CURRENCIES
}
