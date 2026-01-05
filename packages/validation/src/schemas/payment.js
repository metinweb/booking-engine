/**
 * Payment Schema - Single Source of Truth
 *
 * Validation schema for payment data.
 * Used by both backend (Mongoose) and frontend (Vue).
 */

// ==========================================
// PAYMENT ENUMS
// ==========================================

export const PAYMENT_METHODS = [
	'cash',
	'credit_card',
	'debit_card',
	'bank_transfer',
	'pay_at_hotel',
	'online_payment'
]

export const PAYMENT_STATUSES = [
	'pending',
	'authorized',
	'captured',
	'completed',
	'failed',
	'refunded',
	'partially_refunded',
	'cancelled'
]

export const CURRENCIES = ['TRY', 'USD', 'EUR', 'GBP', 'RUB']

// ==========================================
// PAYMENT SCHEMA
// ==========================================

export const paymentSchema = {
	method: {
		type: 'string',
		required: [true, 'REQUIRED_PAYMENT_METHOD'],
		enum: {
			values: PAYMENT_METHODS,
			message: 'INVALID_PAYMENT_METHOD'
		}
	},
	status: {
		type: 'string',
		enum: {
			values: PAYMENT_STATUSES,
			message: 'INVALID_PAYMENT_STATUS'
		},
		default: 'pending'
	},
	amount: {
		type: 'number',
		required: [true, 'REQUIRED_AMOUNT'],
		min: [0, 'MIN_AMOUNT_0']
	},
	currency: {
		type: 'string',
		required: [true, 'REQUIRED_CURRENCY'],
		enum: {
			values: CURRENCIES,
			message: 'INVALID_CURRENCY'
		}
	},
	transactionId: {
		type: 'string',
		trim: true
	},
	gateway: {
		type: 'string',
		trim: true
	},
	gatewayResponse: {
		type: 'object'
	},
	paidAt: {
		type: 'date'
	},
	notes: {
		type: 'string',
		maxLength: [500, 'MAX_LENGTH_500']
	}
}

// ==========================================
// CREDIT CARD SCHEMA
// ==========================================

export const creditCardSchema = {
	cardholderName: {
		type: 'string',
		required: [true, 'REQUIRED_CARDHOLDER_NAME'],
		trim: true
	},
	cardNumber: {
		type: 'string',
		required: [true, 'REQUIRED_CARD_NUMBER'],
		minLength: [13, 'MIN_LENGTH_13'],
		maxLength: [19, 'MAX_LENGTH_19']
	},
	expiryMonth: {
		type: 'number',
		required: [true, 'REQUIRED_EXPIRY_MONTH'],
		min: [1, 'MIN_MONTH_1'],
		max: [12, 'MAX_MONTH_12']
	},
	expiryYear: {
		type: 'number',
		required: [true, 'REQUIRED_EXPIRY_YEAR'],
		min: [2024, 'MIN_YEAR']
	},
	cvv: {
		type: 'string',
		required: [true, 'REQUIRED_CVV'],
		minLength: [3, 'MIN_LENGTH_3'],
		maxLength: [4, 'MAX_LENGTH_4']
	},
	installments: {
		type: 'number',
		min: [1, 'MIN_INSTALLMENTS_1'],
		default: 1
	}
}

// ==========================================
// BANK TRANSFER SCHEMA
// ==========================================

export const bankTransferSchema = {
	bankName: {
		type: 'string',
		required: [true, 'REQUIRED_BANK_NAME'],
		trim: true
	},
	accountName: {
		type: 'string',
		required: [true, 'REQUIRED_ACCOUNT_NAME'],
		trim: true
	},
	iban: {
		type: 'string',
		required: [true, 'REQUIRED_IBAN'],
		minLength: [15, 'MIN_LENGTH_15'],
		maxLength: [34, 'MAX_LENGTH_34'],
		uppercase: true
	},
	swift: {
		type: 'string',
		uppercase: true
	},
	referenceNumber: {
		type: 'string',
		trim: true
	}
}

// ==========================================
// REFUND SCHEMA
// ==========================================

export const refundSchema = {
	originalPayment: {
		type: 'objectId',
		required: [true, 'REQUIRED_ORIGINAL_PAYMENT'],
		ref: 'Payment'
	},
	amount: {
		type: 'number',
		required: [true, 'REQUIRED_AMOUNT'],
		min: [0.01, 'MIN_AMOUNT']
	},
	reason: {
		type: 'string',
		required: [true, 'REQUIRED_REASON'],
		maxLength: [500, 'MAX_LENGTH_500']
	},
	status: {
		type: 'string',
		enum: {
			values: ['pending', 'processing', 'completed', 'failed'],
			message: 'INVALID_REFUND_STATUS'
		},
		default: 'pending'
	},
	processedAt: {
		type: 'date'
	}
}

// ==========================================
// FRONTEND VALIDATION SCHEMA
// ==========================================

export const paymentValidationSchema = {
	method: {
		required: true,
		validate: (v) => PAYMENT_METHODS.includes(v),
		message: 'REQUIRED_PAYMENT_METHOD'
	}
}

export default {
	payment: paymentSchema,
	creditCard: creditCardSchema,
	bankTransfer: bankTransferSchema,
	refund: refundSchema,
	paymentValidation: paymentValidationSchema,
	PAYMENT_METHODS,
	PAYMENT_STATUSES,
	CURRENCIES
}
