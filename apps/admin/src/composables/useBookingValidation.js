/**
 * Booking Validation Composable - Backward Compatibility Wrapper
 *
 * This file re-exports from the new @booking-engine/validation shared package.
 * All validation rules are now managed in the shared package.
 *
 * @deprecated Use useValidation from '@/composables/useValidation' instead.
 * This file is kept for backward compatibility.
 */

// Re-export everything from the new validation composable
export {
  useValidation as useBookingValidation,
  validateTcNumber,
  validateEmail,
  validatePhone,
  formatTcNumber,
  validateField,
  validateObject,
  shouldShowField,
  isFieldRequired,
  getFieldClass
} from './useValidation.js'

// Default export for backward compatibility
export { default } from './useValidation.js'
