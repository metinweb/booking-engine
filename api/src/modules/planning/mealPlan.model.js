import mongoose from 'mongoose'
import { HOTEL_LANGUAGES } from '../hotel/hotel.model.js'

/**
 * MealPlan Model
 * Meal plan definitions - both standard (partner-wide) and hotel-specific
 */

// Multilingual text schema helper
const multiLangString = (required = false) => {
	const schema = {}
	HOTEL_LANGUAGES.forEach(lang => {
		schema[lang] = { type: String, trim: true, default: '' }
	})
	return schema
}

const mealPlanSchema = new mongoose.Schema({
	// Multi-tenant
	partner: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Partner',
		required: [true, 'REQUIRED_PARTNER'],
		index: true
	},

	// Hotel reference - null means standard/partner-wide plan
	hotel: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Hotel',
		default: null,
		index: true
	},

	// Code - standard codes: RO, BB, HB, FB, AI, UAI
	code: {
		type: String,
		uppercase: true,
		trim: true,
		required: [true, 'REQUIRED_CODE']
	},

	// Name & Description
	name: multiLangString(true),
	description: multiLangString(),

	// Is this a standard plan (predefined by system)
	isStandard: { type: Boolean, default: false },

	// What's included
	includedMeals: {
		breakfast: { type: Boolean, default: false },
		lunch: { type: Boolean, default: false },
		dinner: { type: Boolean, default: false },
		snacks: { type: Boolean, default: false },
		drinks: { type: Boolean, default: false }, // Non-alcoholic drinks
		alcoholicDrinks: { type: Boolean, default: false },
		minibar: { type: Boolean, default: false },
		roomService: { type: Boolean, default: false }
	},

	// Status
	status: {
		type: String,
		enum: ['active', 'inactive'],
		default: 'active'
	},

	// Display order
	displayOrder: { type: Number, default: 0 }

}, {
	timestamps: true,
	toJSON: { virtuals: true },
	toObject: { virtuals: true }
})

// Indexes
mealPlanSchema.index({ partner: 1, hotel: 1 })
mealPlanSchema.index({ partner: 1, hotel: 1, code: 1 }, { unique: true })
mealPlanSchema.index({ partner: 1, isStandard: 1 })
mealPlanSchema.index({ displayOrder: 1 })

// Statics
mealPlanSchema.statics.findStandardByPartner = function(partnerId) {
	return this.find({ partner: partnerId, hotel: null, isStandard: true, status: 'active' }).sort('displayOrder')
}

mealPlanSchema.statics.findByHotel = function(partnerId, hotelId) {
	// Returns both standard plans and hotel-specific plans
	return this.find({
		partner: partnerId,
		$or: [
			{ hotel: null, isStandard: true },
			{ hotel: hotelId }
		],
		status: 'active'
	}).sort('displayOrder')
}

mealPlanSchema.statics.findCustomByHotel = function(hotelId) {
	return this.find({ hotel: hotelId, isStandard: false }).sort('displayOrder')
}

// Standard meal plans seed data
mealPlanSchema.statics.getStandardPlans = function() {
	return [
		{
			code: 'RO',
			name: {
				tr: 'Sadece Oda',
				en: 'Room Only',
				de: 'Nur Zimmer',
				ru: 'Только номер'
			},
			description: {
				tr: 'Konaklama ücretine yemek dahil değildir',
				en: 'Accommodation only, no meals included',
				de: 'Nur Unterkunft, keine Mahlzeiten inklusive',
				ru: 'Только проживание, питание не включено'
			},
			includedMeals: {},
			isStandard: true,
			displayOrder: 1
		},
		{
			code: 'BB',
			name: {
				tr: 'Oda Kahvaltı',
				en: 'Bed & Breakfast',
				de: 'Übernachtung mit Frühstück',
				ru: 'Завтрак включен'
			},
			description: {
				tr: 'Konaklama ve kahvaltı dahil',
				en: 'Accommodation with breakfast included',
				de: 'Unterkunft mit Frühstück inklusive',
				ru: 'Проживание с завтраком'
			},
			includedMeals: { breakfast: true },
			isStandard: true,
			displayOrder: 2
		},
		{
			code: 'HB',
			name: {
				tr: 'Yarım Pansiyon',
				en: 'Half Board',
				de: 'Halbpension',
				ru: 'Полупансион'
			},
			description: {
				tr: 'Kahvaltı ve akşam yemeği dahil',
				en: 'Breakfast and dinner included',
				de: 'Frühstück und Abendessen inklusive',
				ru: 'Завтрак и ужин включены'
			},
			includedMeals: { breakfast: true, dinner: true },
			isStandard: true,
			displayOrder: 3
		},
		{
			code: 'FB',
			name: {
				tr: 'Tam Pansiyon',
				en: 'Full Board',
				de: 'Vollpension',
				ru: 'Полный пансион'
			},
			description: {
				tr: 'Kahvaltı, öğle ve akşam yemeği dahil',
				en: 'Breakfast, lunch and dinner included',
				de: 'Frühstück, Mittag- und Abendessen inklusive',
				ru: 'Завтрак, обед и ужин включены'
			},
			includedMeals: { breakfast: true, lunch: true, dinner: true },
			isStandard: true,
			displayOrder: 4
		},
		{
			code: 'AI',
			name: {
				tr: 'Her Şey Dahil',
				en: 'All Inclusive',
				de: 'All Inclusive',
				ru: 'Все включено'
			},
			description: {
				tr: 'Tüm yemekler ve yerli içecekler dahil',
				en: 'All meals and local drinks included',
				de: 'Alle Mahlzeiten und lokale Getränke inklusive',
				ru: 'Все блюда и местные напитки включены'
			},
			includedMeals: { breakfast: true, lunch: true, dinner: true, snacks: true, drinks: true },
			isStandard: true,
			displayOrder: 5
		},
		{
			code: 'UAI',
			name: {
				tr: 'Ultra Her Şey Dahil',
				en: 'Ultra All Inclusive',
				de: 'Ultra All Inclusive',
				ru: 'Ультра все включено'
			},
			description: {
				tr: 'Tüm yemekler, içecekler, alkollü içecekler ve oda servisi dahil',
				en: 'All meals, drinks, alcoholic beverages and room service included',
				de: 'Alle Mahlzeiten, Getränke, alkoholische Getränke und Zimmerservice inklusive',
				ru: 'Все блюда, напитки, алкоголь и обслуживание номеров включены'
			},
			includedMeals: {
				breakfast: true, lunch: true, dinner: true,
				snacks: true, drinks: true, alcoholicDrinks: true,
				minibar: true, roomService: true
			},
			isStandard: true,
			displayOrder: 6
		}
	]
}

export default mongoose.model('MealPlan', mealPlanSchema)
