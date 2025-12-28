import mongoose from 'mongoose'
import { HOTEL_LANGUAGES } from '../hotel/hotel.model.js'

/**
 * RoomType Model
 * Room type definitions for hotels with Booking.com style occupancy
 */

// Multilingual text schema helper
const multiLangString = (required = false) => {
	const schema = {}
	HOTEL_LANGUAGES.forEach(lang => {
		schema[lang] = { type: String, trim: true, default: '' }
	})
	return schema
}

// Bed configuration schema
const bedConfigSchema = new mongoose.Schema({
	type: {
		type: String,
		enum: ['single', 'double', 'queen', 'king', 'twin', 'sofa', 'bunk', 'extra'],
		required: true
	},
	count: { type: Number, default: 1, min: 1, max: 10 }
}, { _id: false })

// Image schema
const imageSchema = new mongoose.Schema({
	_id: { type: mongoose.Schema.Types.ObjectId, auto: true },
	url: { type: String, required: true },
	caption: multiLangString(),
	order: { type: Number, default: 0 },
	isMain: { type: Boolean, default: false }
}, { _id: true })

const roomTypeSchema = new mongoose.Schema({
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

	// Basic Info
	name: multiLangString(true),

	code: {
		type: String,
		uppercase: true,
		trim: true,
		required: [true, 'REQUIRED_CODE']
	},

	description: multiLangString(),

	// Images
	images: [imageSchema],

	// Booking.com style occupancy
	occupancy: {
		maxAdults: { type: Number, min: 1, max: 10, default: 2 },
		maxChildren: { type: Number, min: 0, max: 6, default: 2 },
		maxInfants: { type: Number, min: 0, max: 2, default: 1 },
		totalMaxGuests: { type: Number, min: 1, max: 12, default: 4 },
		baseOccupancy: { type: Number, min: 1, max: 10, default: 2 } // Standard pricing occupancy
	},

	// Room physical properties
	size: { type: Number, min: 0 }, // Square meters
	bedConfiguration: [bedConfigSchema],

	// Room amenities
	amenities: [{
		type: String,
		enum: [
			// Climate
			'airConditioning', 'heating', 'fan',
			// Entertainment
			'tv', 'satelliteTV', 'cableTV', 'radio',
			// Connectivity
			'wifi', 'telephone', 'usbPorts',
			// Mini Bar & Kitchen
			'minibar', 'refrigerator', 'kettle', 'coffeeMachine', 'kitchenette',
			// Bathroom
			'privateBathroom', 'sharedBathroom', 'bathtub', 'shower', 'hairdryer', 'toiletries', 'bathrobes', 'slippers',
			// View
			'seaView', 'poolView', 'gardenView', 'cityView', 'mountainView', 'landmarkView',
			// Outdoor
			'balcony', 'terrace', 'privatePool', 'jacuzzi',
			// Comfort
			'safe', 'desk', 'sofa', 'wardrobe', 'ironingEquipment',
			// Services
			'roomService', 'dailyHousekeeping', 'laundryService',
			// Accessibility
			'wheelchairAccessible', 'connectedRooms',
			// Special
			'smokingAllowed', 'nonSmoking', 'petFriendly'
		]
	}],

	// Status
	status: {
		type: String,
		enum: ['draft', 'active', 'inactive', 'deleted'],
		default: 'draft'
	},

	// Display order
	displayOrder: { type: Number, default: 0 },

	// Base room pricing
	isBaseRoom: {
		type: Boolean,
		default: false
	},

	// Price adjustment relative to base room (%)
	priceAdjustment: {
		type: Number,
		default: 0,
		min: -100,
		max: 500
	}

}, {
	timestamps: true,
	toJSON: { virtuals: true },
	toObject: { virtuals: true }
})

// Indexes
roomTypeSchema.index({ partner: 1, hotel: 1 })
roomTypeSchema.index({ partner: 1, hotel: 1, code: 1 }, { unique: true })
roomTypeSchema.index({ partner: 1, hotel: 1, status: 1 })
roomTypeSchema.index({ displayOrder: 1 })

// Validate total max guests
roomTypeSchema.pre('save', async function(next) {
	// Ensure totalMaxGuests >= baseOccupancy
	if (this.occupancy.totalMaxGuests < this.occupancy.baseOccupancy) {
		this.occupancy.totalMaxGuests = this.occupancy.baseOccupancy
	}

	// Ensure totalMaxGuests >= maxAdults
	if (this.occupancy.totalMaxGuests < this.occupancy.maxAdults) {
		this.occupancy.totalMaxGuests = this.occupancy.maxAdults
	}

	// Ensure only one main image
	const mainImages = this.images.filter(img => img.isMain)
	if (mainImages.length > 1) {
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
		this.images[0].isMain = true
	}

	// Base room logic: if this room is set as base, clear isBaseRoom from others
	if (this.isBaseRoom && this.isModified('isBaseRoom')) {
		await this.constructor.updateMany(
			{ hotel: this.hotel, _id: { $ne: this._id } },
			{ isBaseRoom: false }
		)
		// Base room always has 0 adjustment
		this.priceAdjustment = 0
	}

	next()
})

// Statics
roomTypeSchema.statics.findByHotel = function(hotelId) {
	return this.find({ hotel: hotelId }).sort('displayOrder')
}

roomTypeSchema.statics.findActiveByHotel = function(hotelId) {
	return this.find({ hotel: hotelId, status: 'active' }).sort('displayOrder')
}

export default mongoose.model('RoomType', roomTypeSchema)
