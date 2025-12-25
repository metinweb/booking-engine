import mongoose from 'mongoose'

/**
 * Hotel Model
 * Multi-tenant hotel management for booking engine
 * Supports 20 languages for multilingual content
 */

// All supported languages
const SUPPORTED_LANGUAGES = ['tr', 'en', 'ru', 'el', 'de', 'es', 'it', 'fr', 'ro', 'bg', 'pt', 'da', 'zh', 'ar', 'fa', 'he', 'sq', 'uk', 'pl', 'az']

// Multilingual text schema helper - supports all 20 languages
const multiLangString = (required = false) => {
	const schema = {}
	SUPPORTED_LANGUAGES.forEach(lang => {
		schema[lang] = { type: String, trim: true, default: '' }
	})
	return schema
}

// Cancellation rule schema for algorithmic cancellation policy
const cancellationRuleSchema = new mongoose.Schema({
	daysBeforeCheckIn: { type: Number, required: true }, // X days before check-in
	refundPercent: { type: Number, min: 0, max: 100, required: true }, // % refund
	description: multiLangString()
}, { _id: false })

const hotelSchema = new mongoose.Schema({
	// Partner (Multi-tenant)
	partner: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Partner',
		required: [true, 'REQUIRED_PARTNER'],
		index: true
	},

	// Status
	status: {
		type: String,
		enum: {
			values: ['draft', 'active', 'inactive'],
			message: 'INVALID_STATUS'
		},
		default: 'draft'
	},

	// Basic Info
	name: {
		type: String,
		required: [true, 'REQUIRED_NAME'],
		trim: true
	},
	description: multiLangString(),

	// Slug (URL friendly identifier)
	slug: {
		type: String,
		trim: true,
		lowercase: true
	},

	// Logo/Image
	logo: { type: String, trim: true },

	// Star rating (1-5)
	stars: {
		type: Number,
		min: [1, 'HOTEL_STARS_MIN'],
		max: [5, 'HOTEL_STARS_MAX'],
		default: 3
	},

	// Hotel type
	type: {
		type: String,
		enum: {
			values: ['hotel', 'apart', 'boutique', 'resort', 'hostel', 'villa', 'guesthouse', 'motel', 'pension', 'camping'],
			message: 'INVALID_HOTEL_TYPE'
		},
		default: 'hotel'
	},

	// Facility Category
	category: {
		type: String,
		enum: {
			values: ['economy', 'standard', 'superior', 'deluxe', 'luxury', 'ultra-luxury'],
			message: 'INVALID_CATEGORY'
		},
		default: 'standard'
	},

	// Visibility
	visibility: {
		b2c: { type: Boolean, default: true }, // Visible on B2C website
		b2b: { type: Boolean, default: true }  // Visible on B2B extranet
	},

	// Address
	address: {
		street: { type: String, trim: true },
		district: { type: String, trim: true },
		city: { type: String, trim: true, required: [true, 'REQUIRED_CITY'] },
		country: { type: String, trim: true, required: [true, 'REQUIRED_COUNTRY'] },
		postalCode: { type: String, trim: true },
		coordinates: {
			lat: { type: Number },
			lng: { type: Number }
		},
		// Google Maps formatted address
		formattedAddress: { type: String, trim: true },
		placeId: { type: String, trim: true } // Google Place ID
	},

	// Contact Information (Enhanced)
	contact: {
		// Primary contacts
		phone: { type: String, trim: true }, // Main facility phone
		email: {
			type: String,
			trim: true,
			lowercase: true,
			match: [/^\S+@\S+\.\S+$/, 'INVALID_EMAIL']
		},
		website: { type: String, trim: true },
		// Additional contacts
		callCenter: { type: String, trim: true }, // Call center phone
		fax: { type: String, trim: true },
		// Manager/Contact person
		authorizedPerson: { type: String, trim: true },
		authorizedEmail: {
			type: String,
			trim: true,
			lowercase: true,
			match: [/^\S+@\S+\.\S+$/, 'INVALID_EMAIL']
		},
		authorizedPhone: { type: String, trim: true },
		// Social media
		socialMedia: {
			facebook: { type: String, trim: true },
			instagram: { type: String, trim: true },
			twitter: { type: String, trim: true },
			youtube: { type: String, trim: true }
		}
	},

	// Images
	images: [{
		_id: { type: mongoose.Schema.Types.ObjectId, auto: true },
		url: { type: String, required: true },
		caption: multiLangString(),
		order: { type: Number, default: 0 },
		isMain: { type: Boolean, default: false }
	}],

	// Amenities (Hotel-level)
	amenities: [{
		type: String,
		enum: [
			// General
			'wifi', 'parking', 'freeParking', 'valetParking',
			// Facilities
			'pool', 'indoorPool', 'outdoorPool', 'spa', 'gym', 'sauna', 'hammam',
			// Dining
			'restaurant', 'bar', 'roomService', 'breakfast',
			// Services
			'reception24h', 'concierge', 'laundry', 'dryCleaning', 'airportShuttle',
			// Business
			'businessCenter', 'meetingRooms', 'conferenceHall',
			// Family
			'kidsClub', 'playground', 'babysitting',
			// Beach & Nature
			'beachAccess', 'privateBeach', 'garden', 'terrace',
			// Accessibility
			'wheelchairAccessible', 'elevator',
			// Policies
			'petFriendly', 'smokingArea', 'nonSmoking',
			// Entertainment
			'casino', 'nightclub', 'cinema', 'gameRoom',
			// Sports
			'tennis', 'golf', 'diving', 'surfing', 'skiing'
		]
	}],

	// Policies
	policies: {
		// Time settings
		checkIn: { type: String, default: '14:00' },
		checkOut: { type: String, default: '12:00' },

		// Age limits
		maxBabyAge: { type: Number, default: 2, min: 0, max: 5 },
		maxChildAge: { type: Number, default: 12, min: 0, max: 18 },

		// Policy texts (multilingual)
		childPolicy: multiLangString(),
		petPolicy: multiLangString(),
		additionalInfo: multiLangString(),

		// Algorithmic Cancellation Policy
		cancellationRules: [cancellationRuleSchema],

		// Free cancellation option
		freeCancellation: {
			enabled: { type: Boolean, default: false },
			daysBeforeCheckIn: { type: Number, default: 1 }
		}
	},

	// Room Configuration
	roomConfig: {
		totalRooms: { type: Number, default: 0, min: 0 },
		floors: { type: Number, default: 1, min: 1 },
		hasElevator: { type: Boolean, default: false }
	},

	// SEO (all multilingual)
	seo: {
		title: multiLangString(),
		description: multiLangString(),
		keywords: multiLangString()
	},

	// Display settings
	featured: { type: Boolean, default: false },
	displayOrder: { type: Number, default: 0 },

	// Stats (will be updated as bookings come in)
	stats: {
		totalBookings: { type: Number, default: 0 },
		averageRating: { type: Number, default: 0 },
		reviewCount: { type: Number, default: 0 }
	}

}, {
	timestamps: true,
	toJSON: { virtuals: true },
	toObject: { virtuals: true }
})

// Indexes
hotelSchema.index({ partner: 1, status: 1 })
hotelSchema.index({ partner: 1, 'address.city': 1 })
hotelSchema.index({ partner: 1, slug: 1 }, { unique: true, sparse: true })
// Not using 2dsphere index - current lat/lng format is not GeoJSON
// hotelSchema.index({ 'address.coordinates': '2dsphere' })
hotelSchema.index({ stars: 1 })
hotelSchema.index({ featured: 1 })
hotelSchema.index({ category: 1 })
hotelSchema.index({ 'visibility.b2c': 1 })
hotelSchema.index({ 'visibility.b2b': 1 })

// Virtual - Room types
hotelSchema.virtual('roomTypes', {
	ref: 'RoomType',
	localField: '_id',
	foreignField: 'hotel'
})

// Methods
hotelSchema.methods.isActive = function() {
	return this.status === 'active'
}

hotelSchema.methods.activate = async function() {
	this.status = 'active'
	return await this.save()
}

hotelSchema.methods.deactivate = async function() {
	this.status = 'inactive'
	return await this.save()
}

hotelSchema.methods.getMainImage = function() {
	const mainImage = this.images.find(img => img.isMain)
	return mainImage || this.images[0] || null
}

// Calculate cancellation refund based on rules
hotelSchema.methods.calculateRefund = function(daysBeforeCheckIn) {
	const rules = this.policies.cancellationRules || []

	// Sort rules by days (descending) to find the applicable rule
	const sortedRules = [...rules].sort((a, b) => b.daysBeforeCheckIn - a.daysBeforeCheckIn)

	for (const rule of sortedRules) {
		if (daysBeforeCheckIn >= rule.daysBeforeCheckIn) {
			return rule.refundPercent
		}
	}

	// No refund if no rule matches
	return 0
}

// Statics
hotelSchema.statics.findByPartner = function(partnerId) {
	return this.find({ partner: partnerId })
}

hotelSchema.statics.findActiveByPartner = function(partnerId) {
	return this.find({ partner: partnerId, status: 'active' })
}

hotelSchema.statics.findBySlug = function(partnerId, slug) {
	return this.findOne({ partner: partnerId, slug: slug })
}

hotelSchema.statics.findByCity = function(partnerId, city) {
	return this.find({
		partner: partnerId,
		status: 'active',
		'address.city': { $regex: city, $options: 'i' }
	})
}

hotelSchema.statics.findB2C = function(partnerId) {
	return this.find({
		partner: partnerId,
		status: 'active',
		'visibility.b2c': true
	})
}

hotelSchema.statics.findB2B = function(partnerId) {
	return this.find({
		partner: partnerId,
		status: 'active',
		'visibility.b2b': true
	})
}

// Helper to generate slug from text
const generateSlug = (text) => {
	if (!text) return ''

	// Turkish character replacements
	const turkishMap = {
		'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u',
		'Ç': 'c', 'Ğ': 'g', 'İ': 'i', 'Ö': 'o', 'Ş': 's', 'Ü': 'u'
	}

	let slug = text.toLowerCase()

	// Replace Turkish characters
	for (const [from, to] of Object.entries(turkishMap)) {
		slug = slug.replace(new RegExp(from, 'g'), to)
	}

	return slug
		.replace(/[^a-z0-9\s-]/g, '')
		.replace(/\s+/g, '-')
		.replace(/-+/g, '-')
		.trim()
}

// Pre-save middleware
hotelSchema.pre('save', function(next) {
	// Clean up null coordinates to prevent any issues
	if (this.address && this.address.coordinates) {
		if (this.address.coordinates.lat === null || this.address.coordinates.lat === undefined ||
		    this.address.coordinates.lng === null || this.address.coordinates.lng === undefined) {
			// Remove invalid coordinates
			this.address.coordinates = undefined
		}
	}

	// Auto-generate slug from Turkish name if not set
	if (!this.slug && this.name.tr) {
		this.slug = generateSlug(this.name.tr)
	}

	// Ensure only one main image
	const mainImages = this.images.filter(img => img.isMain)
	if (mainImages.length > 1) {
		// Keep only the first main image
		let foundFirst = false
		this.images.forEach(img => {
			if (img.isMain) {
				if (foundFirst) {
					img.isMain = false
				} else {
					foundFirst = true
				}
			}
		})
	} else if (mainImages.length === 0 && this.images.length > 0) {
		// Set first image as main if none selected
		this.images[0].isMain = true
	}

	// Sort cancellation rules by daysBeforeCheckIn descending
	if (this.policies.cancellationRules && this.policies.cancellationRules.length > 0) {
		this.policies.cancellationRules.sort((a, b) => b.daysBeforeCheckIn - a.daysBeforeCheckIn)
	}

	next()
})

// Export supported languages for use in other modules
export const HOTEL_LANGUAGES = SUPPORTED_LANGUAGES

export default mongoose.model('Hotel', hotelSchema)
