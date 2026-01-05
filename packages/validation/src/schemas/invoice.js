/**
 * Invoice Schemas - Single Source of Truth
 *
 * Validation schemas for invoice data.
 * Used by both backend (Mongoose) and frontend (Vue).
 */

import { validateTcKimlik } from '../validators/tcKimlik.js'

// ==========================================
// INVOICE TYPE ENUM
// ==========================================

export const INVOICE_TYPES = ['individual', 'corporate']

// ==========================================
// INDIVIDUAL INVOICE SCHEMA
// ==========================================

export const invoiceIndividualSchema = {
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
	tcNumber: {
		type: 'string',
		required: false, // TC is OPTIONAL
		validate: {
			validator: validateTcKimlik,
			message: 'INVALID_TC_KIMLIK'
		},
		// Show only for Turkish citizens
		showWhen: (data, rootData) => rootData?.leadGuest?.nationality === 'TR'
	},
	address: {
		type: 'object',
		properties: {
			street: {
				type: 'string',
				trim: true
			},
			district: {
				type: 'string',
				trim: true
			},
			city: {
				type: 'string',
				trim: true
			},
			postalCode: {
				type: 'string',
				trim: true
			},
			country: {
				type: 'string',
				default: 'TR'
			}
		}
	}
}

// ==========================================
// CORPORATE INVOICE SCHEMA
// ==========================================

export const invoiceCorporateSchema = {
	companyName: {
		type: 'string',
		required: [true, 'REQUIRED_COMPANY_NAME'],
		minLength: [2, 'MIN_LENGTH_2'],
		trim: true
	},
	taxNumber: {
		type: 'string',
		required: [true, 'REQUIRED_TAX_NUMBER'],
		minLength: [10, 'MIN_LENGTH_10'],
		trim: true
	},
	taxOffice: {
		type: 'string',
		required: [true, 'REQUIRED_TAX_OFFICE'],
		minLength: [2, 'MIN_LENGTH_2'],
		trim: true
	},
	address: {
		type: 'object',
		properties: {
			street: {
				type: 'string',
				trim: true
			},
			district: {
				type: 'string',
				trim: true
			},
			city: {
				type: 'string',
				trim: true
			},
			postalCode: {
				type: 'string',
				trim: true
			},
			country: {
				type: 'string',
				default: 'TR'
			}
		}
	}
}

// ==========================================
// INVOICE DETAILS SCHEMA (Combined)
// ==========================================

export const invoiceDetailsSchema = {
	type: {
		type: 'string',
		required: [true, 'REQUIRED_INVOICE_TYPE'],
		enum: {
			values: INVOICE_TYPES,
			message: 'INVALID_INVOICE_TYPE'
		}
	},
	individual: {
		type: 'object',
		schema: invoiceIndividualSchema,
		// Only required when type is 'individual'
		required: (data) => data?.type === 'individual'
	},
	corporate: {
		type: 'object',
		schema: invoiceCorporateSchema,
		// Only required when type is 'corporate'
		required: (data) => data?.type === 'corporate'
	}
}

// ==========================================
// FRONTEND VALIDATION SCHEMAS
// ==========================================

export const invoiceIndividualValidation = {
	firstName: {
		required: true,
		validate: (v) => v && v.trim().length >= 2,
		message: 'REQUIRED_FIRST_NAME'
	},
	lastName: {
		required: true,
		validate: (v) => v && v.trim().length >= 2,
		message: 'REQUIRED_LAST_NAME'
	},
	tcNumber: {
		required: false,
		validate: validateTcKimlik,
		message: 'INVALID_TC_KIMLIK',
		showWhen: (data, rootData) => rootData?.leadGuest?.nationality === 'TR'
	}
}

export const invoiceCorporateValidation = {
	companyName: {
		required: true,
		validate: (v) => v && v.trim().length >= 2,
		message: 'REQUIRED_COMPANY_NAME'
	},
	taxNumber: {
		required: true,
		validate: (v) => v && v.trim().length >= 10,
		message: 'REQUIRED_TAX_NUMBER'
	},
	taxOffice: {
		required: true,
		validate: (v) => v && v.trim().length >= 2,
		message: 'REQUIRED_TAX_OFFICE'
	}
}

export default {
	invoiceIndividual: invoiceIndividualSchema,
	invoiceCorporate: invoiceCorporateSchema,
	invoiceDetails: invoiceDetailsSchema,
	invoiceIndividualValidation,
	invoiceCorporateValidation,
	INVOICE_TYPES
}
