/**
 * Booking Validators
 * Validation schemas for booking operations
 */

import { body, query, param } from 'express-validator'

// Search availability validation
export const searchValidation = [
  body('hotelId')
    .notEmpty()
    .withMessage('Hotel ID is required')
    .isMongoId()
    .withMessage('Invalid hotel ID'),
  body('checkIn')
    .notEmpty()
    .withMessage('Check-in date is required')
    .isISO8601()
    .withMessage('Invalid check-in date format'),
  body('checkOut')
    .notEmpty()
    .withMessage('Check-out date is required')
    .isISO8601()
    .withMessage('Invalid check-out date format'),
  body('adults')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Adults must be between 1 and 10'),
  body('children').optional().isArray().withMessage('Children must be an array of ages'),
  body('children.*')
    .optional()
    .isInt({ min: 0, max: 17 })
    .withMessage('Child age must be between 0 and 17'),
  body('countryCode')
    .optional()
    .isLength({ min: 2, max: 2 })
    .withMessage('Country code must be 2 characters'),
  body('currency')
    .optional()
    .isLength({ min: 3, max: 3 })
    .withMessage('Currency must be 3 characters')
]

// Price quote validation
export const priceQuoteValidation = [
  body('hotelId')
    .notEmpty()
    .withMessage('Hotel ID is required')
    .isMongoId()
    .withMessage('Invalid hotel ID'),
  body('roomTypeId')
    .notEmpty()
    .withMessage('Room type ID is required')
    .isMongoId()
    .withMessage('Invalid room type ID'),
  body('mealPlanId')
    .notEmpty()
    .withMessage('Meal plan ID is required')
    .isMongoId()
    .withMessage('Invalid meal plan ID'),
  body('checkIn')
    .notEmpty()
    .withMessage('Check-in date is required')
    .isISO8601()
    .withMessage('Invalid check-in date format'),
  body('checkOut')
    .notEmpty()
    .withMessage('Check-out date is required')
    .isISO8601()
    .withMessage('Invalid check-out date format'),
  body('adults')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Adults must be between 1 and 10'),
  body('children').optional().isArray().withMessage('Children must be an array of ages')
]

// Create booking validation
export const createBookingValidation = [
  body('hotelId')
    .notEmpty()
    .withMessage('Hotel ID is required')
    .isMongoId()
    .withMessage('Invalid hotel ID'),
  body('checkIn')
    .notEmpty()
    .withMessage('Check-in date is required')
    .isISO8601()
    .withMessage('Invalid check-in date format'),
  body('checkOut')
    .notEmpty()
    .withMessage('Check-out date is required')
    .isISO8601()
    .withMessage('Invalid check-out date format'),
  body('rooms')
    .notEmpty()
    .withMessage('Rooms are required')
    .isArray({ min: 1 })
    .withMessage('At least one room is required'),
  body('rooms.*.roomTypeId')
    .notEmpty()
    .withMessage('Room type ID is required')
    .isMongoId()
    .withMessage('Invalid room type ID'),
  body('rooms.*.mealPlanId')
    .notEmpty()
    .withMessage('Meal plan ID is required')
    .isMongoId()
    .withMessage('Invalid meal plan ID'),
  body('rooms.*.adults')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Adults must be between 1 and 10'),
  body('rooms.*.children').optional().isArray().withMessage('Children must be an array'),
  body('rooms.*.guests').optional().isArray().withMessage('Guests must be an array'),
  body('rooms.*.guests.*.firstName')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('First name is required'),
  body('rooms.*.guests.*.lastName')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Last name is required'),
  body('contact').notEmpty().withMessage('Contact info is required'),
  body('contact.email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format'),
  body('contact.phone')
    .notEmpty()
    .withMessage('Phone is required')
    .isLength({ min: 5, max: 20 })
    .withMessage('Invalid phone number'),
  body('billing').optional().isObject().withMessage('Billing must be an object'),
  body('specialRequests')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Special requests too long')
]

// List bookings validation
export const listBookingsValidation = [
  query('status')
    .optional()
    .isIn(['pending', 'confirmed', 'cancelled', 'completed', 'no_show'])
    .withMessage('Invalid status'),
  query('hotelId').optional().isMongoId().withMessage('Invalid hotel ID'),
  query('checkInFrom').optional().isISO8601().withMessage('Invalid date format'),
  query('checkInTo').optional().isISO8601().withMessage('Invalid date format'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('sort')
    .optional()
    .isIn(['createdAt', '-createdAt', 'checkIn', '-checkIn', 'grandTotal'])
    .withMessage('Invalid sort option')
]

// Cancel booking validation
export const cancelBookingValidation = [
  param('id').isMongoId().withMessage('Invalid booking ID'),
  body('reason').optional().isLength({ max: 500 }).withMessage('Reason too long')
]

// Update status validation
export const updateStatusValidation = [
  param('id').isMongoId().withMessage('Invalid booking ID'),
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['confirmed', 'cancelled', 'completed', 'no_show'])
    .withMessage('Invalid status')
]

// Add note validation
export const addNoteValidation = [
  param('id').isMongoId().withMessage('Invalid booking ID'),
  body('content')
    .notEmpty()
    .withMessage('Note content is required')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Note must be between 1 and 1000 characters'),
  body('isInternal').optional().isBoolean().withMessage('isInternal must be a boolean')
]
