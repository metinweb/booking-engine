import mongoose from 'mongoose'

/**
 * Rate Model
 * Pricing and availability management
 * Most complex model - handles daily rates, allotment, restrictions
 */

// Child pricing tier schema
const childPricingSchema = new mongoose.Schema({
	minAge: { type: Number, required: true, min: 0, max: 17 },
	maxAge: { type: Number, required: true, min: 0, max: 17 },
	price: { type: Number, required: true, min: 0 }
}, { _id: false })

const rateSchema = new mongoose.Schema({
	// Multi-tenant
	partner: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Partner',
		required: [true, 'REQUIRED_PARTNER'],
		index: true
	},

	hotel: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Hotel',
		required: [true, 'REQUIRED_HOTEL'],
		index: true
	},

	// Rate dimensions
	roomType: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'RoomType',
		required: [true, 'REQUIRED_ROOM_TYPE'],
		index: true
	},

	mealPlan: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'MealPlan',
		required: [true, 'REQUIRED_MEAL_PLAN'],
		index: true
	},

	market: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Market',
		required: [true, 'REQUIRED_MARKET'],
		index: true
	},

	// Date range
	startDate: {
		type: Date,
		required: [true, 'REQUIRED_START_DATE'],
		index: true
	},

	endDate: {
		type: Date,
		required: [true, 'REQUIRED_END_DATE'],
		index: true
	},

	// Optional season reference
	season: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Season',
		default: null
	},

	// Pricing
	pricePerNight: {
		type: Number,
		required: [true, 'REQUIRED_PRICE'],
		min: 0
	},

	// Single person supplement (deduction/addition)
	singleSupplement: { type: Number, default: 0 },

	// Extra person pricing
	extraAdult: { type: Number, default: 0, min: 0 },
	extraChild: { type: Number, default: 0, min: 0 }, // Fallback single child price
	extraInfant: { type: Number, default: 0, min: 0 },

	// Per-child-order pricing: [1st child price, 2nd child price, ...]
	// If empty, extraChild is used for all children
	// Example: [0, 50, 75] means 1st child free, 2nd child €50, 3rd child €75
	childOrderPricing: [{
		type: Number,
		min: 0
	}],

	// Age-based child pricing tiers (alternative to order-based)
	childPricing: [childPricingSchema],

	// Currency (stored for historical reference)
	currency: {
		type: String,
		enum: ['TRY', 'USD', 'EUR', 'GBP', 'RUB', 'SAR', 'AED', 'CHF', 'JPY', 'CNY'],
		required: true
	},

	// Inventory
	allotment: { type: Number, default: 0, min: 0 }, // Available rooms
	sold: { type: Number, default: 0, min: 0 }, // Sold rooms (for tracking)

	// Stay restrictions
	minStay: { type: Number, default: 1, min: 1, max: 30 },
	maxStay: { type: Number, default: 30, min: 1, max: 365 },

	// Sales control
	stopSale: { type: Boolean, default: false },
	stopSaleReason: { type: String, trim: true },

	// Release days (advance booking requirement)
	releaseDays: { type: Number, default: 0, min: 0 },

	// Arrival/Departure restrictions
	closedToArrival: { type: Boolean, default: false },
	closedToDeparture: { type: Boolean, default: false },

	// Day of week restrictions (true = closed)
	closedDays: {
		monday: { type: Boolean, default: false },
		tuesday: { type: Boolean, default: false },
		wednesday: { type: Boolean, default: false },
		thursday: { type: Boolean, default: false },
		friday: { type: Boolean, default: false },
		saturday: { type: Boolean, default: false },
		sunday: { type: Boolean, default: false }
	},

	// Status
	status: {
		type: String,
		enum: ['active', 'inactive'],
		default: 'active'
	}

}, {
	timestamps: true,
	toJSON: { virtuals: true },
	toObject: { virtuals: true }
})

// Compound indexes for efficient queries
rateSchema.index({ partner: 1, hotel: 1, startDate: 1, endDate: 1 })
rateSchema.index({ hotel: 1, roomType: 1, mealPlan: 1, market: 1, startDate: 1, endDate: 1 }, { unique: true })
rateSchema.index({ hotel: 1, startDate: 1, endDate: 1, status: 1 })
rateSchema.index({ hotel: 1, roomType: 1, startDate: 1 })
rateSchema.index({ hotel: 1, market: 1, startDate: 1 })
rateSchema.index({ hotel: 1, stopSale: 1 })

// Ensure endDate >= startDate
rateSchema.pre('save', function(next) {
	if (this.endDate < this.startDate) {
		const temp = this.startDate
		this.startDate = this.endDate
		this.endDate = temp
	}

	// Validate child pricing tiers don't overlap
	if (this.childPricing && this.childPricing.length > 1) {
		this.childPricing.sort((a, b) => a.minAge - b.minAge)
		for (let i = 1; i < this.childPricing.length; i++) {
			if (this.childPricing[i].minAge <= this.childPricing[i-1].maxAge) {
				return next(new Error('CHILD_PRICING_OVERLAP'))
			}
		}
	}

	next()
})

// Virtual: available rooms
rateSchema.virtual('available').get(function() {
	return Math.max(0, this.allotment - this.sold)
})

// Virtual: is bookable
rateSchema.virtual('isBookable').get(function() {
	return this.status === 'active' &&
		!this.stopSale &&
		this.available > 0
})

// Statics
rateSchema.statics.findByHotel = function(hotelId, filters = {}) {
	const query = { hotel: hotelId }

	if (filters.roomType) query.roomType = filters.roomType
	if (filters.mealPlan) query.mealPlan = filters.mealPlan
	if (filters.market) query.market = filters.market
	if (filters.startDate && filters.endDate) {
		query.startDate = { $lte: new Date(filters.endDate) }
		query.endDate = { $gte: new Date(filters.startDate) }
	}
	if (filters.status) query.status = filters.status

	return this.find(query).sort('startDate')
}

// Find rate for a specific date
rateSchema.statics.findByDate = function(hotelId, roomTypeId, mealPlanId, marketId, date) {
	const queryDate = new Date(date)
	return this.findOne({
		hotel: hotelId,
		roomType: roomTypeId,
		mealPlan: mealPlanId,
		market: marketId,
		startDate: { $lte: queryDate },
		endDate: { $gte: queryDate },
		status: 'active'
	})
}

// Get calendar view data
rateSchema.statics.getCalendarView = async function(hotelId, startDate, endDate, filters = {}) {
	const query = {
		hotel: hotelId,
		startDate: { $lte: new Date(endDate) },
		endDate: { $gte: new Date(startDate) },
		status: 'active'
	}

	if (filters.roomType) query.roomType = filters.roomType
	if (filters.mealPlan) query.mealPlan = filters.mealPlan
	if (filters.market) query.market = filters.market

	return this.find(query)
		.populate('roomType', 'name code')
		.populate('mealPlan', 'name code')
		.populate('market', 'name code currency')
		.populate('season', 'name code color')
		.sort('startDate')
}

// Bulk update rates
rateSchema.statics.bulkUpdateRates = async function(hotelId, updates, filters) {
	const query = { hotel: hotelId }

	if (filters.roomType) query.roomType = filters.roomType
	if (filters.mealPlan) query.mealPlan = filters.mealPlan
	if (filters.market) query.market = filters.market
	if (filters.startDate && filters.endDate) {
		query.startDate = { $lte: new Date(filters.endDate) }
		query.endDate = { $gte: new Date(filters.startDate) }
	}

	return this.updateMany(query, { $set: updates })
}

// Toggle stop sale
rateSchema.statics.toggleStopSale = async function(hotelId, rateIds, stopSale, reason = '') {
	return this.updateMany(
		{ hotel: hotelId, _id: { $in: rateIds } },
		{ $set: { stopSale, stopSaleReason: stopSale ? reason : '' } }
	)
}

// Update allotment
rateSchema.statics.updateAllotment = async function(hotelId, rateIds, allotment) {
	return this.updateMany(
		{ hotel: hotelId, _id: { $in: rateIds } },
		{ $set: { allotment } }
	)
}

export default mongoose.model('Rate', rateSchema)
