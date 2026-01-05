/**
 * Guest Schemas - Single Source of Truth
 *
 * Validation schemas for lead guest and room guests.
 * Used by both backend (Mongoose) and frontend (Vue).
 */

import { validateTcKimlik } from '../validators/tcKimlik.js'
import { validateEmail } from '../validators/email.js'
import { validatePhone } from '../validators/phone.js'

// ==========================================
// TITLE ENUM
// ==========================================

export const GUEST_TITLES = ['mr', 'mrs', 'ms', 'miss', 'dr']
export const GUEST_TYPES = ['adult', 'child', 'infant']

// ==========================================
// LEAD GUEST SCHEMA
// ==========================================

export const leadGuestSchema = {
	title: {
		type: 'string',
		required: [true, 'REQUIRED_TITLE'],
		enum: {
			values: GUEST_TITLES,
			message: 'INVALID_TITLE'
		}
	},
	firstName: {
		type: 'string',
		required: [true, 'REQUIRED_FIRST_NAME'],
		minLength: [2, 'MIN_LENGTH_2'],
		trim: true
	},
	lastName: {
		type: 'string',
		required: [true, 'REQUIRED_LAST_NAME'],
		minLength: [2, 'MIN_LENGTH_2'],
		trim: true
	},
	nationality: {
		type: 'string',
		required: [true, 'REQUIRED_NATIONALITY'],
		minLength: [2, 'COUNTRY_CODE_LENGTH'],
		maxLength: [2, 'COUNTRY_CODE_LENGTH'],
		uppercase: true
	},
	email: {
		type: 'string',
		required: [true, 'REQUIRED_EMAIL'],
		validate: {
			validator: validateEmail,
			message: 'INVALID_EMAIL'
		},
		lowercase: true,
		trim: true
	},
	phone: {
		type: 'string',
		required: [true, 'REQUIRED_PHONE'],
		validate: {
			validator: validatePhone,
			message: 'INVALID_PHONE'
		}
	},
	tcNumber: {
		type: 'string',
		required: false, // TC is OPTIONAL
		validate: {
			validator: validateTcKimlik,
			message: 'INVALID_TC_KIMLIK'
		},
		showWhen: (data) => data?.nationality === 'TR'
	},
	birthDate: {
		type: 'date',
		required: false
	}
}

// ==========================================
// ROOM GUEST SCHEMA
// ==========================================

export const roomGuestSchema = {
	type: {
		type: 'string',
		required: [true, 'REQUIRED_GUEST_TYPE'],
		enum: {
			values: GUEST_TYPES,
			message: 'INVALID_GUEST_TYPE'
		}
	},
	title: {
		type: 'string',
		required: [true, 'REQUIRED_TITLE'],
		enum: {
			values: GUEST_TITLES,
			message: 'INVALID_TITLE'
		}
	},
	firstName: {
		type: 'string',
		required: [true, 'REQUIRED_FIRST_NAME'],
		minLength: [2, 'MIN_LENGTH_2'],
		trim: true
	},
	lastName: {
		type: 'string',
		required: [true, 'REQUIRED_LAST_NAME'],
		minLength: [2, 'MIN_LENGTH_2'],
		trim: true
	},
	nationality: {
		type: 'string',
		required: [true, 'REQUIRED_NATIONALITY'],
		minLength: [2, 'COUNTRY_CODE_LENGTH'],
		maxLength: [2, 'COUNTRY_CODE_LENGTH'],
		uppercase: true
	},
	tcNumber: {
		type: 'string',
		required: false, // TC is OPTIONAL
		validate: {
			validator: validateTcKimlik,
			message: 'INVALID_TC_KIMLIK'
		},
		showWhen: (data) => data?.nationality === 'TR'
	},
	birthDate: {
		type: 'date',
		// Required for children and infants
		required: (data) => data?.type === 'child' || data?.type === 'infant',
		message: 'REQUIRED_BIRTH_DATE'
	},
	age: {
		type: 'number',
		required: false,
		min: [0, 'MIN_AGE_0'],
		max: [120, 'MAX_AGE_120']
	}
}

// ==========================================
// PMS GUEST SCHEMA (Full Guest Profile)
// ==========================================

export const pmsGuestSchema = {
	title: {
		type: 'string',
		enum: {
			values: GUEST_TITLES,
			message: 'INVALID_TITLE'
		}
	},
	firstName: {
		type: 'string',
		required: [true, 'REQUIRED_FIRST_NAME'],
		minLength: [2, 'MIN_LENGTH_2'],
		trim: true
	},
	lastName: {
		type: 'string',
		required: [true, 'REQUIRED_LAST_NAME'],
		minLength: [2, 'MIN_LENGTH_2'],
		trim: true
	},
	email: {
		type: 'string',
		validate: {
			validator: (v) => !v || validateEmail(v),
			message: 'INVALID_EMAIL'
		},
		lowercase: true,
		trim: true
	},
	phone: {
		type: 'string',
		validate: {
			validator: (v) => !v || validatePhone(v),
			message: 'INVALID_PHONE'
		}
	},
	nationality: {
		type: 'string',
		uppercase: true
	},
	tcNumber: {
		type: 'string',
		validate: {
			validator: validateTcKimlik,
			message: 'INVALID_TC_KIMLIK'
		}
	},
	passportNumber: {
		type: 'string',
		trim: true
	},
	birthDate: {
		type: 'date'
	},
	gender: {
		type: 'string',
		enum: {
			values: ['male', 'female', 'other'],
			message: 'INVALID_GENDER'
		}
	},
	vipLevel: {
		type: 'number',
		min: [0, 'MIN_VIP_0'],
		max: [5, 'MAX_VIP_5'],
		default: 0
	},
	isBlacklisted: {
		type: 'boolean',
		default: false
	},
	notes: {
		type: 'string',
		maxLength: [2000, 'MAX_LENGTH_2000']
	},
	preferences: {
		type: 'object',
		default: {}
	}
}

export default {
	leadGuest: leadGuestSchema,
	roomGuest: roomGuestSchema,
	pmsGuest: pmsGuestSchema,
	GUEST_TITLES,
	GUEST_TYPES
}
