/**
 * Agency Schema - Single Source of Truth
 *
 * Validation schema for agency (B2B) data.
 * Used by both backend (Mongoose) and frontend (Vue).
 */

import { validateEmail } from '../validators/email.js'
import { validatePhone } from '../validators/phone.js'

// ==========================================
// AGENCY ENUMS
// ==========================================

export const AGENCY_TYPES = [
	'travel_agency',
	'online_agency',
	'corporate',
	'consortium'
]

export const AGENCY_STATUSES = ['pending', 'active', 'suspended', 'inactive']

export const CREDIT_STATUSES = ['ok', 'warning', 'exceeded', 'blocked']

// ==========================================
// AGENCY SCHEMA
// ==========================================

export const agencySchema = {
	partner: {
		type: 'objectId',
		required: [true, 'REQUIRED_PARTNER'],
		ref: 'Partner'
	},
	name: {
		type: 'string',
		required: [true, 'REQUIRED_NAME'],
		minLength: [2, 'MIN_LENGTH_2'],
		maxLength: [200, 'MAX_LENGTH_200'],
		trim: true
	},
	code: {
		type: 'string',
		required: [true, 'REQUIRED_CODE'],
		uppercase: true,
		trim: true,
		unique: true
	},
	type: {
		type: 'string',
		enum: {
			values: AGENCY_TYPES,
			message: 'INVALID_AGENCY_TYPE'
		},
		default: 'travel_agency'
	},
	status: {
		type: 'string',
		enum: {
			values: AGENCY_STATUSES,
			message: 'INVALID_STATUS'
		},
		default: 'pending'
	},
	logo: {
		type: 'string',
		trim: true
	},
	website: {
		type: 'string',
		trim: true
	},
	iataCode: {
		type: 'string',
		uppercase: true,
		trim: true
	}
}

// ==========================================
// AGENCY CONTACT SCHEMA
// ==========================================

export const agencyContactSchema = {
	contactPerson: {
		type: 'string',
		required: [true, 'REQUIRED_CONTACT_PERSON'],
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
		required: [true, 'REQUIRED_PHONE'],
		validate: {
			validator: validatePhone,
			message: 'INVALID_PHONE'
		}
	},
	fax: {
		type: 'string'
	}
}

// ==========================================
// AGENCY ADDRESS SCHEMA
// ==========================================

export const agencyAddressSchema = {
	street: {
		type: 'string',
		trim: true
	},
	city: {
		type: 'string',
		required: [true, 'REQUIRED_CITY'],
		trim: true
	},
	country: {
		type: 'string',
		required: [true, 'REQUIRED_COUNTRY'],
		trim: true
	},
	postalCode: {
		type: 'string',
		trim: true
	}
}

// ==========================================
// AGENCY BILLING SCHEMA
// ==========================================

export const agencyBillingSchema = {
	companyName: {
		type: 'string',
		required: [true, 'REQUIRED_COMPANY_NAME'],
		trim: true
	},
	taxNumber: {
		type: 'string',
		required: [true, 'REQUIRED_TAX_NUMBER'],
		trim: true
	},
	taxOffice: {
		type: 'string',
		trim: true
	},
	bankName: {
		type: 'string',
		trim: true
	},
	iban: {
		type: 'string',
		uppercase: true,
		trim: true
	},
	swift: {
		type: 'string',
		uppercase: true,
		trim: true
	}
}

// ==========================================
// AGENCY SETTINGS SCHEMA
// ==========================================

export const agencySettingsSchema = {
	defaultCurrency: {
		type: 'string',
		enum: {
			values: ['TRY', 'USD', 'EUR', 'GBP', 'RUB'],
			message: 'INVALID_CURRENCY'
		},
		default: 'TRY'
	},
	defaultLanguage: {
		type: 'string',
		default: 'tr'
	},
	commission: {
		type: 'object',
		properties: {
			type: {
				type: 'string',
				enum: { values: ['percentage', 'fixed'] },
				default: 'percentage'
			},
			value: {
				type: 'number',
				min: [0, 'MIN_COMMISSION_0'],
				max: [100, 'MAX_COMMISSION_100'],
				default: 0
			}
		}
	},
	creditLimit: {
		type: 'number',
		min: [0, 'MIN_CREDIT_LIMIT_0'],
		default: 0
	},
	currentCredit: {
		type: 'number',
		default: 0
	},
	creditStatus: {
		type: 'string',
		enum: {
			values: CREDIT_STATUSES,
			message: 'INVALID_CREDIT_STATUS'
		},
		default: 'ok'
	},
	paymentTerms: {
		type: 'number',
		min: [0, 'MIN_PAYMENT_TERMS_0'],
		max: [90, 'MAX_PAYMENT_TERMS_90'],
		default: 30
	},
	allowedPaymentMethods: {
		type: 'array',
		items: {
			type: 'string',
			enum: {
				values: ['cash', 'credit_card', 'bank_transfer', 'credit'],
				message: 'INVALID_PAYMENT_METHOD'
			}
		},
		default: ['credit_card', 'bank_transfer']
	}
}

// ==========================================
// AGENCY RESTRICTIONS SCHEMA
// ==========================================

export const agencyRestrictionsSchema = {
	allowedHotels: {
		type: 'array',
		items: {
			type: 'objectId',
			ref: 'Hotel'
		}
	},
	blockedHotels: {
		type: 'array',
		items: {
			type: 'objectId',
			ref: 'Hotel'
		}
	},
	allowedMarkets: {
		type: 'array',
		items: {
			type: 'objectId',
			ref: 'Market'
		}
	},
	maxBookingValue: {
		type: 'number',
		min: [0, 'MIN_VALUE_0']
	},
	maxRoomsPerBooking: {
		type: 'number',
		min: [1, 'MIN_ROOMS_1'],
		max: [50, 'MAX_ROOMS_50'],
		default: 10
	}
}

export default {
	agency: agencySchema,
	agencyContact: agencyContactSchema,
	agencyAddress: agencyAddressSchema,
	agencyBilling: agencyBillingSchema,
	agencySettings: agencySettingsSchema,
	agencyRestrictions: agencyRestrictionsSchema,
	AGENCY_TYPES,
	AGENCY_STATUSES,
	CREDIT_STATUSES
}
