/**
 * User Schema - Single Source of Truth
 *
 * Validation schema for user data.
 * Used by both backend (Mongoose) and frontend (Vue).
 */

import { validateEmail } from '../validators/email.js'
import { validatePhone } from '../validators/phone.js'

// ==========================================
// USER ENUMS
// ==========================================

export const ACCOUNT_TYPES = ['platform', 'partner', 'agency']
export const USER_ROLES = ['admin', 'user']
export const USER_STATUSES = ['active', 'inactive']
export const USER_LANGUAGES = ['tr', 'en', 'de', 'ru', 'ar']

// ==========================================
// USER SCHEMA
// ==========================================

export const userSchema = {
	accountType: {
		type: 'string',
		required: [true, 'REQUIRED_ACCOUNT_TYPE'],
		enum: {
			values: ACCOUNT_TYPES,
			message: 'INVALID_ACCOUNT_TYPE'
		}
	},
	accountId: {
		type: 'objectId',
		required: [true, 'REQUIRED_ACCOUNT_ID'],
		refPath: 'accountType'
	},
	name: {
		type: 'string',
		required: [true, 'REQUIRED_NAME'],
		minLength: [2, 'NAME_MIN_LENGTH'],
		maxLength: [100, 'NAME_MAX_LENGTH'],
		trim: true
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
		validate: {
			validator: (v) => !v || validatePhone(v),
			message: 'INVALID_PHONE'
		}
	},
	password: {
		type: 'string',
		required: [true, 'REQUIRED_PASSWORD'],
		minLength: [6, 'PASSWORD_MIN_LENGTH'],
		select: false // Don't include in queries by default
	},
	twoFactorEnabled: {
		type: 'boolean',
		default: false
	},
	twoFactorSecret: {
		type: 'string',
		select: false
	},
	forcePasswordChange: {
		type: 'boolean',
		default: false
	},
	role: {
		type: 'string',
		enum: {
			values: USER_ROLES,
			message: 'INVALID_ROLE'
		},
		default: 'user'
	},
	status: {
		type: 'string',
		enum: {
			values: USER_STATUSES,
			message: 'INVALID_STATUS'
		},
		default: 'active'
	},
	isOnline: {
		type: 'boolean',
		default: false
	},
	lastLogin: {
		type: 'date'
	},
	language: {
		type: 'string',
		enum: {
			values: USER_LANGUAGES,
			message: 'INVALID_LANGUAGE'
		},
		default: 'tr'
	}
}

// ==========================================
// NOTIFICATION PREFERENCES SCHEMA
// ==========================================

export const notificationPreferencesSchema = {
	email: {
		type: 'object',
		properties: {
			bookingConfirmation: { type: 'boolean', default: true },
			bookingCancellation: { type: 'boolean', default: true },
			bookingReminder: { type: 'boolean', default: true },
			paymentReminder: { type: 'boolean', default: true },
			promotions: { type: 'boolean', default: false },
			systemUpdates: { type: 'boolean', default: true }
		}
	},
	sms: {
		type: 'object',
		properties: {
			bookingConfirmation: { type: 'boolean', default: true },
			bookingCancellation: { type: 'boolean', default: true },
			bookingReminder: { type: 'boolean', default: false },
			paymentReminder: { type: 'boolean', default: false }
		}
	},
	push: {
		type: 'object',
		properties: {
			bookingConfirmation: { type: 'boolean', default: true },
			bookingCancellation: { type: 'boolean', default: true },
			bookingReminder: { type: 'boolean', default: true },
			paymentReminder: { type: 'boolean', default: true },
			systemUpdates: { type: 'boolean', default: true }
		}
	}
}

// ==========================================
// AUTHENTICATION SCHEMAS
// ==========================================

export const loginSchema = {
	email: {
		type: 'string',
		required: [true, 'REQUIRED_EMAIL'],
		validate: {
			validator: validateEmail,
			message: 'INVALID_EMAIL'
		}
	},
	password: {
		type: 'string',
		required: [true, 'REQUIRED_PASSWORD']
	}
}

export const registerSchema = {
	name: {
		type: 'string',
		required: [true, 'REQUIRED_NAME'],
		minLength: [2, 'NAME_MIN_LENGTH']
	},
	email: {
		type: 'string',
		required: [true, 'REQUIRED_EMAIL'],
		validate: {
			validator: validateEmail,
			message: 'INVALID_EMAIL'
		}
	},
	password: {
		type: 'string',
		required: [true, 'REQUIRED_PASSWORD'],
		minLength: [6, 'PASSWORD_MIN_LENGTH']
	},
	phone: {
		type: 'string',
		validate: {
			validator: (v) => !v || validatePhone(v),
			message: 'INVALID_PHONE'
		}
	}
}

export const changePasswordSchema = {
	currentPassword: {
		type: 'string',
		required: [true, 'REQUIRED_CURRENT_PASSWORD']
	},
	newPassword: {
		type: 'string',
		required: [true, 'REQUIRED_NEW_PASSWORD'],
		minLength: [6, 'PASSWORD_MIN_LENGTH']
	},
	confirmPassword: {
		type: 'string',
		required: [true, 'REQUIRED_CONFIRM_PASSWORD'],
		validate: {
			validator: (v, data) => v === data?.newPassword,
			message: 'PASSWORDS_NOT_MATCH'
		}
	}
}

export default {
	user: userSchema,
	notificationPreferences: notificationPreferencesSchema,
	login: loginSchema,
	register: registerSchema,
	changePassword: changePasswordSchema,
	ACCOUNT_TYPES,
	USER_ROLES,
	USER_STATUSES,
	USER_LANGUAGES
}
