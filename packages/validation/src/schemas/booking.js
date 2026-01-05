/**
 * Booking Schema - Single Source of Truth
 *
 * Validation schema for booking data.
 * Used by both backend (Mongoose) and frontend (Vue).
 */

import { validateObjectId, validateDate } from '../validators/common.js'

// ==========================================
// BOOKING STATUS ENUM
// ==========================================

export const BOOKING_STATUSES = [
	'pending',
	'confirmed',
	'cancelled',
	'completed',
	'no_show',
	'amended'
]

export const BOOKING_SOURCES = [
	'direct',
	'agency',
	'ota',
	'walk_in',
	'phone',
	'api'
]

export const BOOKING_TYPES = [
	'booking',      // Normal reservation
	'option',       // Tentative booking
	'group',        // Group booking
	'corporate'     // Corporate booking
]

// ==========================================
// BOOKING SCHEMA
// ==========================================

export const bookingSchema = {
	bookingNumber: {
		type: 'string',
		required: [true, 'REQUIRED_BOOKING_NUMBER'],
		unique: true
	},
	hotel: {
		type: 'objectId',
		required: [true, 'REQUIRED_HOTEL'],
		ref: 'Hotel'
	},
	partner: {
		type: 'objectId',
		ref: 'Partner'
	},
	agency: {
		type: 'objectId',
		ref: 'Agency'
	},
	status: {
		type: 'string',
		required: [true, 'REQUIRED_STATUS'],
		enum: {
			values: BOOKING_STATUSES,
			message: 'INVALID_BOOKING_STATUS'
		},
		default: 'pending'
	},
	type: {
		type: 'string',
		enum: {
			values: BOOKING_TYPES,
			message: 'INVALID_BOOKING_TYPE'
		},
		default: 'booking'
	},
	source: {
		type: 'string',
		enum: {
			values: BOOKING_SOURCES,
			message: 'INVALID_BOOKING_SOURCE'
		},
		default: 'direct'
	},
	checkIn: {
		type: 'date',
		required: [true, 'REQUIRED_CHECK_IN']
	},
	checkOut: {
		type: 'date',
		required: [true, 'REQUIRED_CHECK_OUT']
	},
	nights: {
		type: 'number',
		required: [true, 'REQUIRED_NIGHTS'],
		min: [1, 'MIN_NIGHTS_1']
	},
	rooms: {
		type: 'array',
		required: [true, 'REQUIRED_ROOMS'],
		minLength: [1, 'MIN_ROOMS_1']
	},
	totalGuests: {
		type: 'object',
		properties: {
			adults: {
				type: 'number',
				min: [1, 'MIN_ADULTS_1'],
				default: 1
			},
			children: {
				type: 'number',
				min: [0, 'MIN_CHILDREN_0'],
				default: 0
			},
			infants: {
				type: 'number',
				min: [0, 'MIN_INFANTS_0'],
				default: 0
			}
		}
	},
	specialRequests: {
		type: 'string',
		maxLength: [2000, 'MAX_LENGTH_2000']
	},
	internalNotes: {
		type: 'string',
		maxLength: [2000, 'MAX_LENGTH_2000']
	}
}

// ==========================================
// BOOKING ROOM SCHEMA
// ==========================================

export const bookingRoomSchema = {
	roomType: {
		type: 'objectId',
		required: [true, 'REQUIRED_ROOM_TYPE'],
		ref: 'RoomType'
	},
	mealPlan: {
		type: 'objectId',
		ref: 'MealPlan'
	},
	mealPlanCode: {
		type: 'string'
	},
	adults: {
		type: 'number',
		required: [true, 'REQUIRED_ADULTS'],
		min: [1, 'MIN_ADULTS_1']
	},
	children: {
		type: 'number',
		min: [0, 'MIN_CHILDREN_0'],
		default: 0
	},
	childAges: {
		type: 'array',
		items: {
			type: 'number',
			min: [0, 'MIN_AGE_0'],
			max: [17, 'MAX_CHILD_AGE_17']
		}
	},
	infants: {
		type: 'number',
		min: [0, 'MIN_INFANTS_0'],
		default: 0
	}
}

// ==========================================
// BOOKING PRICING SCHEMA
// ==========================================

export const bookingPricingSchema = {
	currency: {
		type: 'string',
		required: [true, 'REQUIRED_CURRENCY'],
		enum: {
			values: ['TRY', 'USD', 'EUR', 'GBP', 'RUB'],
			message: 'INVALID_CURRENCY'
		}
	},
	subtotal: {
		type: 'number',
		required: [true, 'REQUIRED_SUBTOTAL'],
		min: [0, 'MIN_AMOUNT_0']
	},
	discount: {
		type: 'number',
		min: [0, 'MIN_AMOUNT_0'],
		default: 0
	},
	taxes: {
		type: 'number',
		min: [0, 'MIN_AMOUNT_0'],
		default: 0
	},
	total: {
		type: 'number',
		required: [true, 'REQUIRED_TOTAL'],
		min: [0, 'MIN_AMOUNT_0']
	},
	paid: {
		type: 'number',
		min: [0, 'MIN_AMOUNT_0'],
		default: 0
	},
	balance: {
		type: 'number',
		default: 0
	}
}

// ==========================================
// BOOKING VALIDATION (Combined)
// ==========================================

export const bookingValidationSchema = {
	hotel: {
		required: true,
		validate: validateObjectId,
		message: 'REQUIRED_HOTEL'
	},
	checkIn: {
		required: true,
		validate: validateDate,
		message: 'REQUIRED_CHECK_IN'
	},
	checkOut: {
		required: true,
		validate: validateDate,
		message: 'REQUIRED_CHECK_OUT'
	},
	rooms: {
		required: true,
		validate: (v) => v && v.length > 0,
		message: 'REQUIRED_ROOMS'
	},
	invoiceType: {
		required: true,
		validate: (v) => ['individual', 'corporate'].includes(v),
		message: 'REQUIRED_INVOICE_TYPE'
	}
}

export default {
	booking: bookingSchema,
	bookingRoom: bookingRoomSchema,
	bookingPricing: bookingPricingSchema,
	bookingValidation: bookingValidationSchema,
	BOOKING_STATUSES,
	BOOKING_SOURCES,
	BOOKING_TYPES
}
