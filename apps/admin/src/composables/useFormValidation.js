import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'

/**
 * Form Validation Composable
 * Provides reactive validation for forms with support for tabs
 *
 * Usage:
 * const { errors, validate, validateField, clearErrors, hasErrors } = useFormValidation(rules)
 */
export function useFormValidation(validationRules = {}) {
  const { t: translate } = useI18n()

  // All validation errors: { fieldName: 'error message' }
  const errors = ref({})

  // Touched fields tracking
  const touched = ref({})

  /**
   * Validate a single field
   * @param {string} fieldName - The field name
   * @param {any} value - The field value
   * @param {object} formData - Full form data (for cross-field validation)
   * @returns {string|null} - Error message or null
   */
  const validateField = (fieldName, value, formData = {}) => {
    const rules = validationRules[fieldName]
    if (!rules) return null

    // Mark field as touched
    touched.value[fieldName] = true

    let error = null

    for (const rule of rules) {
      // Required check
      if (rule.required) {
        const isEmpty =
          value === undefined ||
          value === null ||
          value === '' ||
          (Array.isArray(value) && value.length === 0) ||
          (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0)

        if (isEmpty) {
          error = rule.message || translate('validation.required', { field: fieldName })
          break
        }
      }

      // Skip other validations if value is empty
      if (!value && value !== 0) continue

      // Min length
      if (rule.minLength && value && value.length < rule.minLength) {
        error = rule.message || translate('validation.minLength', { field: fieldName, min: rule.minLength })
        break
      }

      // Max length
      if (rule.maxLength && value && value.length > rule.maxLength) {
        error = rule.message || translate('validation.maxLength', { field: fieldName, max: rule.maxLength })
        break
      }

      // Email validation
      if (rule.email && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(value)) {
          error = rule.message || translate('validation.email')
          break
        }
      }

      // Phone validation
      if (rule.phone && value) {
        const phoneRegex = /^[+]?[\d\s()-]{7,20}$/
        if (!phoneRegex.test(value)) {
          error = rule.message || translate('validation.phone')
          break
        }
      }

      // URL validation
      if (rule.url && value) {
        try {
          new URL(value)
        } catch {
          error = rule.message || translate('validation.url')
          break
        }
      }

      // Min value (for numbers)
      if (rule.min !== undefined && value !== undefined && value !== '') {
        if (Number(value) < rule.min) {
          error = rule.message || translate('validation.min', { field: fieldName, min: rule.min })
          break
        }
      }

      // Max value (for numbers)
      if (rule.max !== undefined && value !== undefined && value !== '') {
        if (Number(value) > rule.max) {
          error = rule.message || translate('validation.max', { field: fieldName, max: rule.max })
          break
        }
      }

      // Pattern (regex)
      if (rule.pattern && value) {
        if (!rule.pattern.test(value)) {
          error = rule.message || translate('validation.pattern')
          break
        }
      }

      // Custom validator function
      if (rule.validator && typeof rule.validator === 'function') {
        const result = rule.validator(value, formData)
        if (result !== true) {
          error = result || rule.message || translate('validation.invalid')
          break
        }
      }
    }

    // Update errors object
    if (error) {
      errors.value[fieldName] = error
    } else {
      delete errors.value[fieldName]
    }

    return error
  }

  /**
   * Validate entire form
   * @param {object} formData - The form data object
   * @returns {boolean} - True if valid
   */
  const validate = formData => {
    errors.value = {}

    for (const fieldName of Object.keys(validationRules)) {
      // Get nested value using dot notation
      const value = getNestedValue(formData, fieldName)
      validateField(fieldName, value, formData)
    }

    return Object.keys(errors.value).length === 0
  }

  /**
   * Validate only touched fields
   * @param {object} formData - The form data object
   * @returns {boolean} - True if valid
   */
  const validateTouched = formData => {
    for (const fieldName of Object.keys(touched.value)) {
      if (touched.value[fieldName]) {
        const value = getNestedValue(formData, fieldName)
        validateField(fieldName, value, formData)
      }
    }

    return Object.keys(errors.value).length === 0
  }

  /**
   * Get nested object value using dot notation
   */
  const getNestedValue = (obj, path) => {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined
    }, obj)
  }

  /**
   * Mark field as touched
   */
  const touchField = fieldName => {
    touched.value[fieldName] = true
  }

  /**
   * Clear all errors
   */
  const clearErrors = () => {
    errors.value = {}
    touched.value = {}
  }

  /**
   * Clear specific field error
   */
  const clearFieldError = fieldName => {
    delete errors.value[fieldName]
  }

  /**
   * Set errors from external source (e.g., server validation)
   */
  const setErrors = newErrors => {
    errors.value = { ...errors.value, ...newErrors }
  }

  /**
   * Get errors for a specific tab
   * @param {Array<string>} fieldNames - Fields that belong to this tab
   * @returns {object} - { count: number, fields: string[] }
   */
  const getTabErrors = fieldNames => {
    const tabErrors = fieldNames.filter(field => errors.value[field])
    return {
      count: tabErrors.length,
      fields: tabErrors
    }
  }

  /**
   * Check if form has any errors
   */
  const hasErrors = computed(() => Object.keys(errors.value).length > 0)

  /**
   * Get first error message
   */
  const firstError = computed(() => {
    const keys = Object.keys(errors.value)
    return keys.length > 0 ? errors.value[keys[0]] : null
  })

  /**
   * Check if a specific field has error
   */
  const hasFieldError = fieldName => {
    return !!errors.value[fieldName]
  }

  /**
   * Get error message for a specific field
   */
  const getFieldError = fieldName => {
    return errors.value[fieldName] || ''
  }

  return {
    errors,
    touched,
    validate,
    validateTouched,
    validateField,
    touchField,
    clearErrors,
    clearFieldError,
    setErrors,
    getTabErrors,
    hasErrors,
    firstError,
    hasFieldError,
    getFieldError
  }
}

/**
 * Create validation rules helper
 */
export const createRules = {
  required: message => ({ required: true, message }),
  email: message => ({ email: true, message }),
  phone: message => ({ phone: true, message }),
  url: message => ({ url: true, message }),
  minLength: (min, message) => ({ minLength: min, message }),
  maxLength: (max, message) => ({ maxLength: max, message }),
  min: (min, message) => ({ min, message }),
  max: (max, message) => ({ max, message }),
  pattern: (regex, message) => ({ pattern: regex, message }),
  custom: (validator, message) => ({ validator, message })
}

export default useFormValidation
