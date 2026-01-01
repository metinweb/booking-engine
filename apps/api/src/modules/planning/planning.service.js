import mongoose from 'mongoose'
import RoomType from './roomType.model.js'
import MealPlan from './mealPlan.model.js'
import Market from './market.model.js'
import Season from './season.model.js'
import Rate from './rate.model.js'
// RateOverride removed - now using daily Rate model directly
import Campaign from './campaign.model.js'
import Hotel from '../hotel/hotel.model.js'
import AuditLog from '../audit/audit.model.js'
import { NotFoundError, BadRequestError, ForbiddenError } from '../../core/errors.js'
import { asyncHandler } from '../../helpers/asyncHandler.js'
import logger from '../../core/logger.js'
import { getRoomTypeFileUrl, deleteRoomTypeFile } from '../../helpers/roomTypeUpload.js'
import { parsePricingCommand, parseHotelContract } from '../../services/geminiService.js'

// Helper: Get actor from request for audit logging
const getAuditActor = (req) => {
	if (!req.user) return { role: 'system' }
	return {
		userId: req.user._id,
		partnerId: req.user.accountType === 'partner' ? req.user.accountId : req.partnerId,
		email: req.user.email,
		name: `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim(),
		role: req.user.role,
		ip: req.ip,
		userAgent: req.get('User-Agent')
	}
}

// Get partner ID from request
const getPartnerId = (req) => {
	if (req.user.accountType === 'partner') {
		return req.user.accountId
	}
	if (req.partnerId) {
		return req.partnerId
	}
	return null
}

// Verify hotel belongs to partner
const verifyHotelOwnership = async (hotelId, partnerId) => {
	const hotel = await Hotel.findById(hotelId)
	if (!hotel) {
		throw new NotFoundError('HOTEL_NOT_FOUND')
	}
	if (hotel.partner.toString() !== partnerId.toString()) {
		throw new ForbiddenError('FORBIDDEN')
	}
	return hotel
}

// ==================== ROOM TYPES ====================

export const getRoomTypes = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId } = req.params

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	await verifyHotelOwnership(hotelId, partnerId)

	const { status, includeDeleted } = req.query
	const filter = { partner: partnerId, hotel: hotelId }

	if (status) {
		filter.status = status
	} else if (includeDeleted !== 'true') {
		// By default, exclude deleted room types
		filter.status = { $ne: 'deleted' }
	}

	const roomTypes = await RoomType.find(filter).sort('displayOrder')

	res.json({ success: true, data: roomTypes })
})

export const getRoomType = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId, id } = req.params

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	await verifyHotelOwnership(hotelId, partnerId)

	const roomType = await RoomType.findOne({ _id: id, hotel: hotelId, partner: partnerId })
	if (!roomType) throw new NotFoundError('ROOM_TYPE_NOT_FOUND')

	res.json({ success: true, data: roomType })
})

export const createRoomType = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId } = req.params

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	await verifyHotelOwnership(hotelId, partnerId)

	const roomType = await RoomType.create({
		...req.body,
		partner: partnerId,
		hotel: hotelId
	})

	logger.info(`RoomType created: ${roomType.code} for hotel ${hotelId}`)

	res.status(201).json({
		success: true,
		message: req.t('ROOM_TYPE_CREATED'),
		data: roomType
	})
})

export const updateRoomType = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId, id } = req.params

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	await verifyHotelOwnership(hotelId, partnerId)

	const roomType = await RoomType.findOneAndUpdate(
		{ _id: id, hotel: hotelId, partner: partnerId },
		req.body,
		{ new: true, runValidators: true }
	)

	if (!roomType) throw new NotFoundError('ROOM_TYPE_NOT_FOUND')

	res.json({
		success: true,
		message: req.t('ROOM_TYPE_UPDATED'),
		data: roomType
	})
})

export const deleteRoomType = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId, id } = req.params

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	await verifyHotelOwnership(hotelId, partnerId)

	// Check if room type has rates
	const rateCount = await Rate.countDocuments({ roomType: id })
	if (rateCount > 0) {
		throw new BadRequestError('ROOM_TYPE_HAS_RATES')
	}

	const roomType = await RoomType.findOneAndDelete({ _id: id, hotel: hotelId, partner: partnerId })
	if (!roomType) throw new NotFoundError('ROOM_TYPE_NOT_FOUND')

	res.json({
		success: true,
		message: req.t('ROOM_TYPE_DELETED')
	})
})

export const updateRoomTypeStatus = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId, id } = req.params
	const { status } = req.body

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	if (!['draft', 'active', 'inactive'].includes(status)) throw new BadRequestError('INVALID_STATUS')

	await verifyHotelOwnership(hotelId, partnerId)

	const roomType = await RoomType.findOneAndUpdate(
		{ _id: id, hotel: hotelId, partner: partnerId },
		{ status },
		{ new: true }
	)

	if (!roomType) throw new NotFoundError('ROOM_TYPE_NOT_FOUND')

	res.json({
		success: true,
		message: req.t('STATUS_UPDATED'),
		data: roomType
	})
})

export const reorderRoomTypes = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId } = req.params
	const { ids } = req.body

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	if (!Array.isArray(ids)) throw new BadRequestError('INVALID_IDS')

	await verifyHotelOwnership(hotelId, partnerId)

	// Update order for each room type
	await Promise.all(ids.map((id, index) =>
		RoomType.updateOne(
			{ _id: id, hotel: hotelId, partner: partnerId },
			{ displayOrder: index }
		)
	))

	res.json({
		success: true,
		message: req.t('ORDER_UPDATED')
	})
})

// Set base room for relative pricing
export const setBaseRoom = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId, id } = req.params

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	await verifyHotelOwnership(hotelId, partnerId)

	// Clear isBaseRoom from all room types in this hotel
	await RoomType.updateMany(
		{ hotel: hotelId, partner: partnerId },
		{ isBaseRoom: false }
	)

	// Set selected room as base
	const roomType = await RoomType.findOneAndUpdate(
		{ _id: id, hotel: hotelId, partner: partnerId },
		{ isBaseRoom: true, priceAdjustment: 0 },
		{ new: true }
	)

	if (!roomType) {
		throw new NotFoundError('ROOM_TYPE_NOT_FOUND')
	}

	logger.info(`Base room set: ${roomType.code} for hotel ${hotelId}`)

	res.json({
		success: true,
		message: req.t('BASE_ROOM_SET'),
		data: roomType
	})
})

// Update room type price adjustment
export const updateRoomTypePriceAdjustment = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId, id } = req.params
	const { adjustment } = req.body

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	if (adjustment === undefined) throw new BadRequestError('ADJUSTMENT_REQUIRED')

	await verifyHotelOwnership(hotelId, partnerId)

	const roomType = await RoomType.findOneAndUpdate(
		{ _id: id, hotel: hotelId, partner: partnerId },
		{ priceAdjustment: adjustment },
		{ new: true, runValidators: true }
	)

	if (!roomType) throw new NotFoundError('ROOM_TYPE_NOT_FOUND')

	res.json({
		success: true,
		message: req.t('PRICE_ADJUSTMENT_UPDATED'),
		data: roomType
	})
})

// Import room types from base hotel templates
export const importRoomTypesFromBase = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId } = req.params
	const { templateCodes } = req.body

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	if (!Array.isArray(templateCodes) || templateCodes.length === 0) {
		throw new BadRequestError('TEMPLATE_CODES_REQUIRED')
	}

	// Verify hotel ownership
	const hotel = await verifyHotelOwnership(hotelId, partnerId)

	// Check if hotel is linked to a base hotel
	if (!hotel.hotelBase) {
		throw new BadRequestError('HOTEL_NOT_LINKED_TO_BASE')
	}

	// Get base hotel with room templates
	const baseHotel = await Hotel.findById(hotel.hotelBase).select('roomTemplates')
	if (!baseHotel) {
		throw new NotFoundError('BASE_HOTEL_NOT_FOUND')
	}

	if (!baseHotel.roomTemplates || baseHotel.roomTemplates.length === 0) {
		throw new BadRequestError('NO_TEMPLATES_AVAILABLE')
	}

	// Get existing room types for this hotel to avoid duplicates
	const existingRoomTypes = await RoomType.find({
		hotel: hotelId,
		partner: partnerId
	}).select('code')
	const existingCodes = existingRoomTypes.map(rt => rt.code)

	// Filter templates to import
	const templatesToImport = baseHotel.roomTemplates.filter(template =>
		templateCodes.includes(template.code) && !existingCodes.includes(template.code)
	)

	if (templatesToImport.length === 0) {
		return res.json({
			success: true,
			message: 'NO_NEW_TEMPLATES_TO_IMPORT',
			data: { imported: 0 }
		})
	}

	// Get current max display order
	const maxOrderResult = await RoomType.findOne({
		hotel: hotelId,
		partner: partnerId
	}).sort({ displayOrder: -1 }).select('displayOrder')
	let nextOrder = (maxOrderResult?.displayOrder || 0) + 1

	// Create room types from templates
	const createdRoomTypes = []
	for (const template of templatesToImport) {
		const roomTypeData = {
			hotel: hotelId,
			partner: partnerId,
			code: template.code,
			name: template.name || {},
			description: template.description || {},
			occupancy: template.occupancy || { maxAdults: 2, maxChildren: 2, maxInfants: 1, totalMaxGuests: 4 },
			amenities: template.amenities || [],
			size: template.size || null,
			bedConfiguration: template.bedConfiguration || [],
			// Copy images if available (they will reference base hotel images for now)
			images: (template.images || []).map(img => ({
				url: img.url,
				caption: img.caption || {},
				order: img.order || 0,
				isMain: img.isMain || false
			})),
			status: 'draft',
			displayOrder: nextOrder++
		}

		const roomType = await RoomType.create(roomTypeData)
		createdRoomTypes.push(roomType)
	}

	logger.info(`Imported ${createdRoomTypes.length} room types from base hotel ${hotel.hotelBase} to partner hotel ${hotelId}`)

	res.json({
		success: true,
		message: req.t ? req.t('ROOM_TYPES_IMPORTED') : 'Room types imported successfully',
		data: {
			imported: createdRoomTypes.length,
			roomTypes: createdRoomTypes
		}
	})
})

// ==================== ROOM TYPE IMAGES ====================

export const uploadRoomTypeImage = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId, roomTypeId } = req.params

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	if (!req.file) throw new BadRequestError('FILE_REQUIRED')

	await verifyHotelOwnership(hotelId, partnerId)

	const roomType = await RoomType.findOne({
		_id: roomTypeId,
		hotel: hotelId,
		partner: partnerId
	})

	if (!roomType) throw new NotFoundError('ROOM_TYPE_NOT_FOUND')

	const fileUrl = getRoomTypeFileUrl(partnerId, hotelId, roomTypeId, req.file.filename)

	// Parse caption with error handling
	let caption = {}
	if (req.body.caption) {
		try {
			caption = JSON.parse(req.body.caption)
		} catch (e) {
			throw new BadRequestError('INVALID_CAPTION_FORMAT')
		}
	}

	// Add image to room type
	const newImage = {
		url: fileUrl,
		caption,
		order: roomType.images.length,
		isMain: roomType.images.length === 0 // First image is main by default
	}

	roomType.images.push(newImage)
	await roomType.save()

	logger.info(`Image uploaded for room type ${roomTypeId}`)

	res.json({
		success: true,
		message: req.t('IMAGE_UPLOADED'),
		data: roomType.images[roomType.images.length - 1]
	})
})

export const deleteRoomTypeImage = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId, roomTypeId, imageId } = req.params

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')

	await verifyHotelOwnership(hotelId, partnerId)

	const roomType = await RoomType.findOne({
		_id: roomTypeId,
		hotel: hotelId,
		partner: partnerId
	})

	if (!roomType) throw new NotFoundError('ROOM_TYPE_NOT_FOUND')

	const imageIndex = roomType.images.findIndex(img => img._id.toString() === imageId)
	if (imageIndex === -1) throw new NotFoundError('IMAGE_NOT_FOUND')

	const image = roomType.images[imageIndex]

	// Delete file from disk
	try {
		const filename = image.url.split('/').pop()
		deleteRoomTypeFile(partnerId, hotelId, roomTypeId, filename)
	} catch (err) {
		logger.warn(`Failed to delete room type image file: ${err.message}`)
	}

	// Remove from array
	const wasMain = image.isMain
	roomType.images.splice(imageIndex, 1)

	// If deleted image was main, set first image as main
	if (wasMain && roomType.images.length > 0) {
		roomType.images[0].isMain = true
	}

	await roomType.save()

	logger.info(`Image deleted from room type ${roomTypeId}`)

	res.json({
		success: true,
		message: req.t('IMAGE_DELETED')
	})
})

export const reorderRoomTypeImages = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId, roomTypeId } = req.params
	const { imageIds } = req.body

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	if (!Array.isArray(imageIds)) throw new BadRequestError('INVALID_IMAGE_IDS')

	await verifyHotelOwnership(hotelId, partnerId)

	const roomType = await RoomType.findOne({
		_id: roomTypeId,
		hotel: hotelId,
		partner: partnerId
	})

	if (!roomType) throw new NotFoundError('ROOM_TYPE_NOT_FOUND')

	// Reorder images based on imageIds array
	const newOrder = []
	for (let i = 0; i < imageIds.length; i++) {
		const img = roomType.images.find(img => img._id.toString() === imageIds[i])
		if (img) {
			img.order = i
			newOrder.push(img)
		}
	}

	roomType.images = newOrder
	await roomType.save()

	res.json({
		success: true,
		message: req.t('ORDER_UPDATED'),
		data: roomType.images
	})
})

export const setRoomTypeMainImage = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId, roomTypeId, imageId } = req.params

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')

	await verifyHotelOwnership(hotelId, partnerId)

	const roomType = await RoomType.findOne({
		_id: roomTypeId,
		hotel: hotelId,
		partner: partnerId
	})

	if (!roomType) throw new NotFoundError('ROOM_TYPE_NOT_FOUND')

	const image = roomType.images.find(img => img._id.toString() === imageId)
	if (!image) throw new NotFoundError('IMAGE_NOT_FOUND')

	// Reset all isMain flags and set the selected one
	roomType.images.forEach(img => {
		img.isMain = img._id.toString() === imageId
	})

	await roomType.save()

	res.json({
		success: true,
		message: req.t('MAIN_IMAGE_SET'),
		data: roomType.images
	})
})

// ==================== MEAL PLANS ====================

export const getStandardMealPlans = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')

	const mealPlans = await MealPlan.findStandardByPartner(partnerId)

	res.json({ success: true, data: mealPlans })
})

export const getMealPlans = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId } = req.params

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	await verifyHotelOwnership(hotelId, partnerId)

	const { includeDeleted } = req.query
	const filter = { partner: partnerId, hotel: hotelId }

	// By default, exclude deleted meal plans
	if (includeDeleted !== 'true') {
		filter.status = { $ne: 'deleted' }
	}

	const mealPlans = await MealPlan.find(filter).sort('displayOrder')

	res.json({ success: true, data: mealPlans })
})

export const createMealPlan = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId } = req.params

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	await verifyHotelOwnership(hotelId, partnerId)

	const mealPlan = await MealPlan.create({
		...req.body,
		partner: partnerId,
		hotel: hotelId,
		isStandard: false
	})

	logger.info(`MealPlan created: ${mealPlan.code} for hotel ${hotelId}`)

	res.status(201).json({
		success: true,
		message: req.t('MEAL_PLAN_CREATED'),
		data: mealPlan
	})
})

export const updateMealPlan = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId, id } = req.params

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	await verifyHotelOwnership(hotelId, partnerId)

	// Don't allow updating standard plans
	const existing = await MealPlan.findById(id)
	if (existing?.isStandard) throw new BadRequestError('CANNOT_UPDATE_STANDARD_PLAN')

	const mealPlan = await MealPlan.findOneAndUpdate(
		{ _id: id, hotel: hotelId, partner: partnerId },
		req.body,
		{ new: true, runValidators: true }
	)

	if (!mealPlan) throw new NotFoundError('MEAL_PLAN_NOT_FOUND')

	res.json({
		success: true,
		message: req.t('MEAL_PLAN_UPDATED'),
		data: mealPlan
	})
})

export const deleteMealPlan = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId, id } = req.params
	const { deleteRates } = req.query // ?deleteRates=true to also delete rates

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	await verifyHotelOwnership(hotelId, partnerId)

	// Check if meal plan has rates
	const rateCount = await Rate.countDocuments({ mealPlan: id })

	if (rateCount > 0) {
		if (deleteRates === 'true') {
			// Delete all rates for this meal plan
			const deleteResult = await Rate.deleteMany({ mealPlan: id, hotel: hotelId, partner: partnerId })
			logger.info(`Deleted ${deleteResult.deletedCount} rates for meal plan ${id}`)
		} else {
			throw new BadRequestError('MEAL_PLAN_HAS_RATES')
		}
	}

	// Only delete hotel-specific plans (hotel must match)
	const mealPlan = await MealPlan.findOneAndDelete({ _id: id, hotel: hotelId, partner: partnerId })
	if (!mealPlan) throw new NotFoundError('MEAL_PLAN_NOT_FOUND')

	res.json({
		success: true,
		message: req.t('MEAL_PLAN_DELETED'),
		data: { deletedRates: rateCount }
	})
})

// Set base meal plan for relative pricing
export const setBaseMealPlan = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId, id } = req.params

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	await verifyHotelOwnership(hotelId, partnerId)

	// Clear isBaseMealPlan from all meal plans in this hotel
	await MealPlan.updateMany(
		{ hotel: hotelId, partner: partnerId },
		{ isBaseMealPlan: false }
	)

	// Set selected meal plan as base
	const mealPlan = await MealPlan.findOneAndUpdate(
		{ _id: id, hotel: hotelId, partner: partnerId },
		{ isBaseMealPlan: true, priceAdjustment: 0 },
		{ new: true }
	)

	if (!mealPlan) throw new NotFoundError('MEAL_PLAN_NOT_FOUND')

	logger.info(`Base meal plan set: ${mealPlan.code} for hotel ${hotelId}`)

	res.json({
		success: true,
		message: req.t('BASE_MEAL_PLAN_SET'),
		data: mealPlan
	})
})

// Update meal plan price adjustment
export const updateMealPlanPriceAdjustment = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId, id } = req.params
	const { adjustment } = req.body

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	if (adjustment === undefined) throw new BadRequestError('ADJUSTMENT_REQUIRED')

	await verifyHotelOwnership(hotelId, partnerId)

	const mealPlan = await MealPlan.findOneAndUpdate(
		{ _id: id, hotel: hotelId, partner: partnerId },
		{ priceAdjustment: adjustment },
		{ new: true, runValidators: true }
	)

	if (!mealPlan) throw new NotFoundError('MEAL_PLAN_NOT_FOUND')

	res.json({
		success: true,
		message: req.t('PRICE_ADJUSTMENT_UPDATED'),
		data: mealPlan
	})
})

// Initialize standard meal plans for a partner (legacy - not used anymore)
export const initStandardMealPlans = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')

	const standardPlans = MealPlan.getStandardPlans()
	const created = []

	for (const plan of standardPlans) {
		const existing = await MealPlan.findOne({
			partner: partnerId,
			hotel: null,
			code: plan.code,
			isStandard: true
		})

		if (!existing) {
			const newPlan = await MealPlan.create({
				...plan,
				partner: partnerId,
				hotel: null
			})
			created.push(newPlan)
		}
	}

	res.json({
		success: true,
		message: req.t('STANDARD_PLANS_INITIALIZED'),
		data: { created: created.length }
	})
})

// Add selected standard meal plans to a hotel (creates hotel-specific copies)
export const addStandardMealPlansToHotel = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId } = req.params
	const { codes } = req.body // Array of standard plan codes to add: ['RO', 'BB', 'HB', etc.]

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	if (!Array.isArray(codes) || codes.length === 0) throw new BadRequestError('CODES_REQUIRED')

	await verifyHotelOwnership(hotelId, partnerId)

	const standardPlans = MealPlan.getStandardPlans()
	const created = []
	const skipped = []

	for (const code of codes) {
		// Find the standard plan template
		const template = standardPlans.find(p => p.code === code.toUpperCase())
		if (!template) {
			skipped.push({ code, reason: 'NOT_FOUND' })
			continue
		}

		// Check if this hotel already has a meal plan with this code
		const existing = await MealPlan.findOne({
			partner: partnerId,
			hotel: hotelId,
			code: code.toUpperCase()
		})

		if (existing) {
			skipped.push({ code, reason: 'ALREADY_EXISTS' })
			continue
		}

		// Create hotel-specific copy of the standard plan
		const newPlan = await MealPlan.create({
			...template,
			partner: partnerId,
			hotel: hotelId,
			isStandard: false // This is a copy, not the original standard
		})
		created.push(newPlan)
	}

	logger.info(`Added ${created.length} standard meal plans to hotel ${hotelId}`)

	res.status(201).json({
		success: true,
		message: req.t('MEAL_PLANS_ADDED'),
		data: {
			created: created.length,
			skipped: skipped.length,
			plans: created
		}
	})
})

// ==================== MARKETS ====================

export const getMarkets = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId } = req.params

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	await verifyHotelOwnership(hotelId, partnerId)

	const markets = await Market.findByHotel(hotelId)

	res.json({ success: true, data: markets })
})

export const getMarket = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId, id } = req.params

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	await verifyHotelOwnership(hotelId, partnerId)

	const market = await Market.findOne({ _id: id, hotel: hotelId, partner: partnerId })
	if (!market) throw new NotFoundError('MARKET_NOT_FOUND')

	res.json({ success: true, data: market })
})

export const createMarket = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId } = req.params

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	await verifyHotelOwnership(hotelId, partnerId)

	const market = await Market.create({
		...req.body,
		partner: partnerId,
		hotel: hotelId
	})

	logger.info(`Market created: ${market.code} for hotel ${hotelId}`)

	res.status(201).json({
		success: true,
		message: req.t('MARKET_CREATED'),
		data: market
	})
})

export const updateMarket = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId, id } = req.params

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	await verifyHotelOwnership(hotelId, partnerId)

	const market = await Market.findOneAndUpdate(
		{ _id: id, hotel: hotelId, partner: partnerId },
		req.body,
		{ new: true, runValidators: true }
	)

	if (!market) throw new NotFoundError('MARKET_NOT_FOUND')

	res.json({
		success: true,
		message: req.t('MARKET_UPDATED'),
		data: market
	})
})

export const deleteMarket = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId, id } = req.params

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	await verifyHotelOwnership(hotelId, partnerId)

	// Check if market has rates
	const rateCount = await Rate.countDocuments({ market: id })
	if (rateCount > 0) throw new BadRequestError('MARKET_HAS_RATES')

	const market = await Market.findOneAndDelete({ _id: id, hotel: hotelId, partner: partnerId })
	if (!market) throw new NotFoundError('MARKET_NOT_FOUND')

	res.json({
		success: true,
		message: req.t('MARKET_DELETED')
	})
})

export const setDefaultMarket = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId, id } = req.params

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	await verifyHotelOwnership(hotelId, partnerId)

	const market = await Market.findOneAndUpdate(
		{ _id: id, hotel: hotelId, partner: partnerId },
		{ isDefault: true },
		{ new: true }
	)

	if (!market) throw new NotFoundError('MARKET_NOT_FOUND')

	res.json({
		success: true,
		message: req.t('DEFAULT_MARKET_SET'),
		data: market
	})
})

// Get countries already assigned to markets (excluding given market)
export const getAssignedCountries = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId } = req.params
	const { excludeMarketId } = req.query

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	await verifyHotelOwnership(hotelId, partnerId)

	// Find all markets for this hotel
	const query = { hotel: hotelId, partner: partnerId }
	if (excludeMarketId) {
		query._id = { $ne: excludeMarketId }
	}

	const markets = await Market.find(query).select('countries code name')

	// Collect all assigned countries with their market info
	const assignedCountries = {}
	markets.forEach(market => {
		market.countries.forEach(country => {
			assignedCountries[country] = {
				marketId: market._id,
				marketCode: market.code,
				marketName: market.name
			}
		})
	})

	res.json({ success: true, data: assignedCountries })
})

// ==================== SEASONS ====================

export const getSeasons = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId } = req.params
	const { market: marketId } = req.query

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	await verifyHotelOwnership(hotelId, partnerId)

	// Market is now required for seasons
	if (!marketId) {
		throw new BadRequestError('MARKET_REQUIRED')
	}

	// Verify market belongs to this hotel
	const market = await Market.findOne({ _id: marketId, hotel: hotelId, partner: partnerId })
	if (!market) {
		throw new NotFoundError('MARKET_NOT_FOUND')
	}

	const seasons = await Season.findByMarket(hotelId, marketId)

	res.json({ success: true, data: seasons })
})

export const getSeason = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId, id } = req.params

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	await verifyHotelOwnership(hotelId, partnerId)

	const season = await Season.findOne({ _id: id, hotel: hotelId, partner: partnerId })
	if (!season) throw new NotFoundError('SEASON_NOT_FOUND')

	res.json({ success: true, data: season })
})

export const createSeason = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId } = req.params
	const { market: marketId } = req.body

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	await verifyHotelOwnership(hotelId, partnerId)

	// Market is required for seasons
	if (!marketId) {
		throw new BadRequestError('MARKET_REQUIRED')
	}

	// Verify market belongs to this hotel
	const market = await Market.findOne({ _id: marketId, hotel: hotelId, partner: partnerId })
	if (!market) {
		throw new NotFoundError('MARKET_NOT_FOUND')
	}

	const season = await Season.create({
		...req.body,
		partner: partnerId,
		hotel: hotelId,
		market: marketId
	})

	logger.info(`Season created: ${season.code} for hotel ${hotelId}, market ${market.code}`)

	res.status(201).json({
		success: true,
		message: req.t('SEASON_CREATED'),
		data: season
	})
})

export const updateSeason = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId, id } = req.params

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	await verifyHotelOwnership(hotelId, partnerId)

	const season = await Season.findOneAndUpdate(
		{ _id: id, hotel: hotelId, partner: partnerId },
		req.body,
		{ new: true, runValidators: true }
	)

	if (!season) throw new NotFoundError('SEASON_NOT_FOUND')

	res.json({
		success: true,
		message: req.t('SEASON_UPDATED'),
		data: season
	})
})

export const deleteSeason = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId, id } = req.params

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	await verifyHotelOwnership(hotelId, partnerId)

	// Check if season has rates
	const rateCount = await Rate.countDocuments({ season: id })
	if (rateCount > 0) throw new BadRequestError('SEASON_HAS_RATES')

	const season = await Season.findOneAndDelete({ _id: id, hotel: hotelId, partner: partnerId })
	if (!season) throw new NotFoundError('SEASON_NOT_FOUND')

	res.json({
		success: true,
		message: req.t('SEASON_DELETED')
	})
})

// ==================== RATES ====================

export const getRates = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId } = req.params

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	await verifyHotelOwnership(hotelId, partnerId)

	const { roomType, mealPlan, market, startDate, endDate, status, page = 1, limit = 500 } = req.query
	const filters = { roomType, mealPlan, market, startDate, endDate, status }

	// Pagination
	const pageNum = Math.max(1, parseInt(page) || 1)
	const limitNum = Math.min(1000, Math.max(1, parseInt(limit) || 500))
	const skip = (pageNum - 1) * limitNum

	const [rates, total] = await Promise.all([
		Rate.findByHotel(hotelId, filters)
			.populate('roomType', 'name code')
			.populate('mealPlan', 'name code')
			.populate('market', 'name code currency')
			.populate('season', 'name code color')
			.skip(skip)
			.limit(limitNum)
			.lean(),
		Rate.countDocuments({ hotel: hotelId, ...filters })
	])

	res.json({
		success: true,
		data: rates,
		pagination: {
			page: pageNum,
			limit: limitNum,
			total,
			pages: Math.ceil(total / limitNum)
		}
	})
})

export const getRatesCalendar = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId } = req.params

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	await verifyHotelOwnership(hotelId, partnerId)

	const { startDate, endDate, roomType, mealPlan, market } = req.query

	if (!startDate || !endDate) {
		throw new BadRequestError('DATE_RANGE_REQUIRED')
	}

	// Fetch daily rates directly (no more separate overrides table)
	const rates = await Rate.findInRange(hotelId, startDate, endDate, {
		roomType, mealPlan, market
	})

	res.json({
		success: true,
		data: {
			rates,
			overrides: [] // Empty for backward compatibility - no longer used
		}
	})
})

/**
 * Get price list with periods
 * Groups consecutive days with same values into periods for display
 */
export const getRatesPriceList = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId } = req.params

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	await verifyHotelOwnership(hotelId, partnerId)

	const { roomType, market, mealPlan } = req.query

	// Room type and market are required
	if (!roomType) throw new BadRequestError('ROOM_TYPE_REQUIRED')
	if (!market) throw new BadRequestError('MARKET_REQUIRED')

	// Use getPeriodsView to get dynamically grouped periods
	const periods = await Rate.getPeriodsView(hotelId, {
		roomType,
		market,
		mealPlan
	})

	// Group by meal plan for the response format
	const mealPlanGroups = {}
	periods.forEach(period => {
		if (!period.mealPlan) return
		const mpId = period.mealPlan._id.toString()
		if (!mealPlanGroups[mpId]) {
			mealPlanGroups[mpId] = {
				mealPlan: period.mealPlan,
				periods: []
			}
		}
		mealPlanGroups[mpId].periods.push({
			_id: period._id,
			startDate: period.startDate,
			endDate: period.endDate,
			pricePerNight: period.pricePerNight,
			currency: period.currency,
			minStay: period.minStay,
			maxStay: period.maxStay,
			releaseDays: period.releaseDays,
			allotment: period.allotment,
			stopSale: period.stopSale,
			singleStop: period.singleStop,
			closedToArrival: period.closedToArrival,
			closedToDeparture: period.closedToDeparture,
			extraAdult: period.extraAdult,
			extraChild: period.extraChild,
			extraInfant: period.extraInfant,
			singleSupplement: period.singleSupplement,
			childOrderPricing: period.childOrderPricing
		})
	})

	res.json({ success: true, data: Object.values(mealPlanGroups) })
})

export const getRate = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId, id } = req.params

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	await verifyHotelOwnership(hotelId, partnerId)

	const rate = await Rate.findOne({ _id: id, hotel: hotelId, partner: partnerId })
		.populate('roomType', 'name code')
		.populate('mealPlan', 'name code')
		.populate('market', 'name code currency')
		.populate('season', 'name code color')

	if (!rate) throw new NotFoundError('RATE_NOT_FOUND')

	res.json({ success: true, data: rate })
})

export const createRate = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId } = req.params

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	await verifyHotelOwnership(hotelId, partnerId)

	const { startDate, endDate, ...rateData } = req.body

	// Daily rate model: if startDate/endDate provided, create rate for each day
	if (startDate && endDate) {
		const baseData = {
			...rateData,
			partner: partnerId,
			hotel: hotelId
		}

		const result = await Rate.createForDateRange(baseData, startDate, endDate)

		logger.info(`${result.upsertedCount || 0} daily rates created for hotel ${hotelId}`)

		// Audit log for bulk rate creation
		await AuditLog.log({
			actor: getAuditActor(req),
			module: 'planning',
			subModule: 'rate',
			action: 'create',
			target: {
				collection: 'rates',
				documentName: `${startDate} - ${endDate}`
			},
			changes: {
				after: {
					dateRange: { startDate, endDate },
					roomType: rateData.roomType,
					mealPlan: rateData.mealPlan,
					market: rateData.market,
					pricePerNight: rateData.pricePerNight
				}
			},
			metadata: {
				batchId: `rate-create-${Date.now()}`,
				notes: `Bulk rate creation: ${result.upsertedCount || 0} created, ${result.modifiedCount || 0} modified`
			},
			request: { method: req.method, path: req.originalUrl },
			status: 'success'
		})

		res.status(201).json({
			success: true,
			message: req.t('RATE_CREATED'),
			data: { created: result.upsertedCount || 0, modified: result.modifiedCount || 0 }
		})
	} else if (req.body.date) {
		// Single date rate
		const rate = await Rate.create({
			...req.body,
			partner: partnerId,
			hotel: hotelId
		})

		logger.info(`Rate created for hotel ${hotelId}`)

		res.status(201).json({
			success: true,
			message: req.t('RATE_CREATED'),
			data: rate
		})
	} else {
		throw new BadRequestError('REQUIRED_DATE_OR_RANGE')
	}
})

export const updateRate = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId, id } = req.params

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	await verifyHotelOwnership(hotelId, partnerId)

	const rate = await Rate.findOneAndUpdate(
		{ _id: id, hotel: hotelId, partner: partnerId },
		req.body,
		{ new: true, runValidators: true }
	)

	if (!rate) throw new NotFoundError('RATE_NOT_FOUND')

	res.json({
		success: true,
		message: req.t('RATE_UPDATED'),
		data: rate
	})
})

export const deleteRate = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId, id } = req.params

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	await verifyHotelOwnership(hotelId, partnerId)

	const rate = await Rate.findOneAndDelete({ _id: id, hotel: hotelId, partner: partnerId })
	if (!rate) throw new NotFoundError('RATE_NOT_FOUND')

	res.json({
		success: true,
		message: req.t('RATE_DELETED')
	})
})

// Bulk create rates
export const bulkCreateRates = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId } = req.params
	const { rates } = req.body

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	if (!Array.isArray(rates) || rates.length === 0) throw new BadRequestError('RATES_REQUIRED')
	if (rates.length > 1000) throw new BadRequestError('MAX_1000_RATES_PER_REQUEST')

	await verifyHotelOwnership(hotelId, partnerId)

	const ratesToCreate = rates.map(rate => ({
		...rate,
		partner: partnerId,
		hotel: hotelId
	}))

	const created = await Rate.insertMany(ratesToCreate, { ordered: false })

	logger.info(`Bulk created ${created.length} rates for hotel ${hotelId}`)

	// Audit log for bulk rate creation
	await AuditLog.log({
		actor: getAuditActor(req),
		module: 'planning',
		subModule: 'rate',
		action: 'create',
		target: {
			collection: 'rates',
			documentName: `Bulk create: ${created.length} rates`
		},
		changes: {
			after: {
				count: created.length,
				sample: rates.slice(0, 5) // Sample of first 5 rates
			}
		},
		metadata: {
			batchId: `rate-bulk-create-${Date.now()}`,
			notes: `Bulk created ${created.length} rates`
		},
		request: { method: req.method, path: req.originalUrl },
		status: 'success'
	})

	res.status(201).json({
		success: true,
		message: req.t('RATES_CREATED'),
		data: { count: created.length }
	})
})

// Bulk update rates
export const bulkUpdateRates = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId } = req.params
	const { updates, filters } = req.body

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	await verifyHotelOwnership(hotelId, partnerId)

	const result = await Rate.bulkUpdateRates(hotelId, updates, filters)

	logger.info(`Bulk updated rates for hotel ${hotelId}`)

	res.json({
		success: true,
		message: req.t('RATES_UPDATED'),
		data: { modified: result.modifiedCount }
	})
})

// Quick update single rate (multiple fields at once)
export const quickUpdateSingleRate = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId, id } = req.params
	const updateData = req.body

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	await verifyHotelOwnership(hotelId, partnerId)

	// Only allow specific fields for quick update
	const allowedFields = ['pricePerNight', 'allotment', 'minStay', 'maxStay', 'stopSale', 'closedToArrival', 'closedToDeparture', 'extraAdult', 'extraChild', 'extraInfant', 'childOrderPricing', 'releaseDays']
	const sanitizedUpdate = {}

	for (const field of allowedFields) {
		if (updateData[field] !== undefined) {
			sanitizedUpdate[field] = updateData[field]
		}
	}

	if (Object.keys(sanitizedUpdate).length === 0) {
		throw new BadRequestError('NO_VALID_FIELDS')
	}

	const rate = await Rate.findOneAndUpdate(
		{ _id: id, hotel: hotelId, partner: partnerId },
		{ $set: sanitizedUpdate },
		{ new: true, runValidators: true }
	)

	if (!rate) throw new NotFoundError('RATE_NOT_FOUND')

	logger.info(`Quick updated rate ${id} for hotel ${hotelId}`)

	res.json({
		success: true,
		message: req.t('RATE_UPDATED'),
		data: rate
	})
})

// Quick update (single field)
export const quickUpdateRates = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId } = req.params
	const { rateIds, field, value } = req.body

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	if (!Array.isArray(rateIds) || !field) throw new BadRequestError('INVALID_PARAMS')
	if (rateIds.length > 1000) throw new BadRequestError('MAX_1000_RATES_PER_REQUEST')

	await verifyHotelOwnership(hotelId, partnerId)

	const allowedFields = ['pricePerNight', 'allotment', 'minStay', 'maxStay', 'stopSale', 'closedToArrival', 'closedToDeparture', 'extraAdult', 'extraChild', 'extraInfant', 'childOrderPricing', 'releaseDays']
	if (!allowedFields.includes(field)) throw new BadRequestError('INVALID_FIELD')

	const result = await Rate.updateMany(
		{ _id: { $in: rateIds }, hotel: hotelId, partner: partnerId },
		{ $set: { [field]: value } }
	)

	res.json({
		success: true,
		message: req.t('RATES_UPDATED'),
		data: { modified: result.modifiedCount }
	})
})

// Toggle stop sale
export const toggleStopSale = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId } = req.params
	const { rateIds, stopSale, reason } = req.body

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	if (!Array.isArray(rateIds)) throw new BadRequestError('INVALID_RATE_IDS')

	await verifyHotelOwnership(hotelId, partnerId)

	const result = await Rate.toggleStopSale(hotelId, rateIds, stopSale, reason)

	res.json({
		success: true,
		message: stopSale ? req.t('STOP_SALE_ENABLED') : req.t('STOP_SALE_DISABLED'),
		data: { modified: result.modifiedCount }
	})
})

// Update allotment
export const updateAllotment = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId } = req.params
	const { rateIds, allotment } = req.body

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	if (!Array.isArray(rateIds) || allotment === undefined) throw new BadRequestError('INVALID_PARAMS')

	await verifyHotelOwnership(hotelId, partnerId)

	const result = await Rate.updateAllotment(hotelId, rateIds, allotment)

	res.json({
		success: true,
		message: req.t('ALLOTMENT_UPDATED'),
		data: { modified: result.modifiedCount }
	})
})

// Bulk update by specific dates (daily rate model - simple upsert)
export const bulkUpdateByDates = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId } = req.params
	const { cells, updateFields, marketId } = req.body

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	if (!Array.isArray(cells) || cells.length === 0) throw new BadRequestError('CELLS_REQUIRED')
	if (!updateFields || Object.keys(updateFields).length === 0) throw new BadRequestError('UPDATE_FIELDS_REQUIRED')

	await verifyHotelOwnership(hotelId, partnerId)

	// Get market currency for new rate creation
	let currency = 'EUR' // Default
	if (marketId) {
		const market = await Market.findById(marketId)
		if (market) {
			currency = market.currency || 'EUR'
		}
	}

	// Allowed fields for update
	const allowedFields = ['pricePerNight', 'allotment', 'minStay', 'maxStay', 'stopSale', 'singleStop', 'closedToArrival', 'closedToDeparture', 'extraAdult', 'extraChild', 'extraInfant', 'childOrderPricing', 'releaseDays', 'singleSupplement']
	const sanitizedUpdate = {}
	for (const field of allowedFields) {
		if (updateFields[field] !== undefined) {
			sanitizedUpdate[field] = updateFields[field]
		}
	}

	// Build bulk upsert operations for daily rates
	const ratesToUpsert = []
	for (const cell of cells) {
		// Parse date string and create UTC date at midnight
		const [year, month, day] = cell.date.split('-').map(Number)
		const targetDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0))

		ratesToUpsert.push({
			partner: partnerId,
			hotel: hotelId,
			roomType: cell.roomTypeId,
			mealPlan: cell.mealPlanId,
			market: marketId,
			date: targetDate,
			currency: currency,
			pricePerNight: sanitizedUpdate.pricePerNight ?? 0,
			allotment: sanitizedUpdate.allotment ?? 10,
			minStay: sanitizedUpdate.minStay ?? 1,
			maxStay: sanitizedUpdate.maxStay ?? 30,
			status: 'active',
			source: 'bulk',
			...sanitizedUpdate
		})
	}

	// Execute bulk upsert
	const bulkResult = await Rate.bulkUpsert(ratesToUpsert)

	logger.info(`Bulk update: ${bulkResult.upsertedCount} created, ${bulkResult.modifiedCount} updated`)

	// Audit log for bulk rate update
	await AuditLog.log({
		actor: getAuditActor(req),
		module: 'planning',
		subModule: 'rate',
		action: 'update',
		target: {
			collection: 'rates',
			documentName: `${cells.length} cells updated`
		},
		changes: {
			after: {
				cells: cells.slice(0, 10), // Limit to first 10 for readability
				updateFields: sanitizedUpdate,
				marketId
			}
		},
		metadata: {
			batchId: `rate-bulk-${Date.now()}`,
			notes: `Bulk update: ${bulkResult.upsertedCount || 0} created, ${bulkResult.modifiedCount || 0} modified`
		},
		request: { method: req.method, path: req.originalUrl },
		status: 'success'
	})

	res.json({
		success: true,
		message: req.t('RATES_UPDATED'),
		data: {
			created: bulkResult.upsertedCount || 0,
			updated: bulkResult.modifiedCount || 0,
			total: ratesToUpsert.length
		}
	})
})

// ==================== CAMPAIGNS ====================

export const getCampaigns = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId } = req.params

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	await verifyHotelOwnership(hotelId, partnerId)

	const { status, type } = req.query
	const filter = { partner: partnerId, hotel: hotelId }
	if (status) filter.status = status
	if (type) filter.type = type

	const campaigns = await Campaign.find(filter)
		.populate('conditions.applicableRoomTypes', 'name code')
		.populate('conditions.applicableMarkets', 'name code')
		.populate('conditions.applicableMealPlans', 'name code')
		.sort('displayOrder')

	res.json({ success: true, data: campaigns })
})

export const getCampaign = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId, id } = req.params

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	await verifyHotelOwnership(hotelId, partnerId)

	const campaign = await Campaign.findOne({ _id: id, hotel: hotelId, partner: partnerId })
		.populate('conditions.applicableRoomTypes', 'name code')
		.populate('conditions.applicableMarkets', 'name code')
		.populate('conditions.applicableMealPlans', 'name code')

	if (!campaign) throw new NotFoundError('CAMPAIGN_NOT_FOUND')

	res.json({ success: true, data: campaign })
})

export const createCampaign = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId } = req.params

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	await verifyHotelOwnership(hotelId, partnerId)

	const campaign = await Campaign.create({
		...req.body,
		partner: partnerId,
		hotel: hotelId
	})

	logger.info(`Campaign created: ${campaign.code} for hotel ${hotelId}`)

	res.status(201).json({
		success: true,
		message: req.t('CAMPAIGN_CREATED'),
		data: campaign
	})
})

export const updateCampaign = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId, id } = req.params

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	await verifyHotelOwnership(hotelId, partnerId)

	const campaign = await Campaign.findOneAndUpdate(
		{ _id: id, hotel: hotelId, partner: partnerId },
		req.body,
		{ new: true, runValidators: true }
	)

	if (!campaign) throw new NotFoundError('CAMPAIGN_NOT_FOUND')

	res.json({
		success: true,
		message: req.t('CAMPAIGN_UPDATED'),
		data: campaign
	})
})

export const deleteCampaign = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId, id } = req.params

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	await verifyHotelOwnership(hotelId, partnerId)

	const campaign = await Campaign.findOneAndDelete({ _id: id, hotel: hotelId, partner: partnerId })
	if (!campaign) throw new NotFoundError('CAMPAIGN_NOT_FOUND')

	res.json({
		success: true,
		message: req.t('CAMPAIGN_DELETED')
	})
})

export const updateCampaignStatus = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId, id } = req.params
	const { status } = req.body

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	if (!['draft', 'active', 'inactive', 'expired'].includes(status)) throw new BadRequestError('INVALID_STATUS')

	await verifyHotelOwnership(hotelId, partnerId)

	const campaign = await Campaign.findOneAndUpdate(
		{ _id: id, hotel: hotelId, partner: partnerId },
		{ status },
		{ new: true }
	)

	if (!campaign) throw new NotFoundError('CAMPAIGN_NOT_FOUND')

	res.json({
		success: true,
		message: req.t('STATUS_UPDATED'),
		data: campaign
	})
})

// ==================== AI PRICING ASSISTANT ====================

/**
 * Parse natural language pricing command with AI
 */
export const parseAIPricingCommand = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId } = req.params
	const { command, currentMonth, selectionContext } = req.body

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	if (!command) throw new BadRequestError('COMMAND_REQUIRED')

	await verifyHotelOwnership(hotelId, partnerId)

	// Get context data for AI
	logger.info(`AI Query params - hotelId: ${hotelId}, partnerId: ${partnerId}`)
	logger.info(`AI currentMonth received: ${JSON.stringify(currentMonth)}`)
	if (selectionContext) {
		logger.info(`AI selectionContext received: ${JSON.stringify(selectionContext)}`)
	}

	const [roomTypes, mealPlans, markets, seasons] = await Promise.all([
		RoomType.find({ hotel: hotelId, partner: partnerId }).select('code name status').lean(),
		MealPlan.find({ $or: [{ hotel: hotelId }, { hotel: null, isStandard: true }], partner: partnerId, status: 'active' }).select('code name').lean(),
		Market.find({ hotel: hotelId, partner: partnerId, status: 'active' }).select('code name currency').lean(),
		Season.find({ hotel: hotelId, partner: partnerId, status: 'active' }).select('code name dateRanges').lean()
	])

	logger.info(`AI Query results - roomTypes: ${roomTypes.length}, mealPlans: ${mealPlans.length}, markets: ${markets.length}, seasons: ${seasons.length}`)
	if (seasons.length > 0) {
		logger.info(`AI Seasons data: ${JSON.stringify(seasons)}`)
	}

	const context = {
		roomTypes: roomTypes.map(rt => ({
			code: rt.code,
			name: rt.name?.tr || rt.name?.en || rt.code,
			status: rt.status
		})),
		mealPlans: mealPlans.map(mp => ({ code: mp.code, name: mp.name?.tr || mp.name?.en || mp.code })),
		markets: markets.map(m => ({ code: m.code, currency: m.currency })),
		seasons: seasons.map(s => ({
			code: s.code,
			name: s.name?.tr || s.name?.en || s.code,
			dateRanges: s.dateRanges
		})),
		currentMonth: currentMonth || null,
		selectionContext: selectionContext || null
	}

	const result = await parsePricingCommand(command, context)

	// If successful, estimate affected rates count
	if (result.success && result.dateRange) {
		const filter = {
			hotel: hotelId,
			partner: partnerId,
			date: {
				$gte: new Date(result.dateRange.startDate),
				$lte: new Date(result.dateRange.endDate)
			}
		}

		// Apply room type filter
		if (result.filters?.roomTypes !== 'all' && Array.isArray(result.filters?.roomTypes)) {
			const rtIds = await RoomType.find({
				hotel: hotelId,
				code: { $in: result.filters.roomTypes }
			}).select('_id')
			filter.roomType = { $in: rtIds.map(r => r._id) }
		}

		// Apply meal plan filter
		if (result.filters?.mealPlans !== 'all' && Array.isArray(result.filters?.mealPlans)) {
			const mpIds = await MealPlan.find({
				$or: [{ hotel: hotelId }, { hotel: null, isStandard: true }],
				code: { $in: result.filters.mealPlans }
			}).select('_id')
			filter.mealPlan = { $in: mpIds.map(m => m._id) }
		}

		// Apply market filter
		if (result.filters?.markets !== 'all' && Array.isArray(result.filters?.markets)) {
			const mIds = await Market.find({
				hotel: hotelId,
				code: { $in: result.filters.markets }
			}).select('_id')
			filter.market = { $in: mIds.map(m => m._id) }
		}

		result.affectedCount = await Rate.countDocuments(filter)
	}

	res.json({ success: true, data: result })
})

/**
 * Execute parsed AI pricing command
 */
export const executeAIPricingCommand = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId } = req.params
	const { parsedCommand } = req.body

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	if (!parsedCommand || !parsedCommand.success) throw new BadRequestError('VALID_COMMAND_REQUIRED')

	await verifyHotelOwnership(hotelId, partnerId)

	const { dateRange, rateIds, selectedCells } = parsedCommand

	// If rateIds are provided (from selected cells), use direct ID-based update
	const useDirectIds = Array.isArray(rateIds) && rateIds.length > 0

	logger.info(`AI Execute: useDirectIds=${useDirectIds}, rateIds=${rateIds?.length || 0}, selectedCells=${selectedCells?.length || 0}`)

	// Support both old format (single action) and new format (actions array)
	const actions = parsedCommand.actions || [{
		action: parsedCommand.action,
		filters: parsedCommand.filters,
		value: parsedCommand.value,
		valueType: parsedCommand.valueType,
		reason: parsedCommand.reason,
		childIndex: parsedCommand.childIndex
	}]

	// Helper to check if a date falls on specified days of week
	const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
	const matchesDayOfWeek = (date, daysOfWeek) => {
		if (!daysOfWeek || daysOfWeek === 'all') return true
		if (!Array.isArray(daysOfWeek)) return true
		// Normalize numeric values to strings
		const normalizedDays = daysOfWeek.map(d => typeof d === 'number' ? dayNames[d] : d)
		const dayName = dayNames[new Date(date).getDay()]
		return normalizedDays.includes(dayName)
	}

	// Helper to get all dates matching daysOfWeek filter
	const getMatchingDates = (startDate, endDate, daysOfWeek) => {
		const dates = []
		const start = new Date(startDate)
		const end = new Date(endDate)
		start.setUTCHours(0, 0, 0, 0)
		end.setUTCHours(0, 0, 0, 0)

		for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
			if (matchesDayOfWeek(d, daysOfWeek)) {
				dates.push(new Date(d))
			}
		}
		return dates
	}

	// Check if daysOfWeek filter is active
	const hasDayFilter = (daysOfWeek) => {
		return daysOfWeek && daysOfWeek !== 'all' && Array.isArray(daysOfWeek)
	}

	// Normalize daysOfWeek: convert numeric values to string names
	const numToDay = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
	const normalizeDaysOfWeek = (daysOfWeek) => {
		if (!Array.isArray(daysOfWeek)) return daysOfWeek
		return daysOfWeek.map(d => typeof d === 'number' ? numToDay[d] : d)
	}

	let totalAffected = 0

	// Execute each action
	for (const act of actions) {
		const { action, filters, value, valueType, reason, childIndex } = act

		// Build filter for rates (using single 'date' field, not startDate/endDate!)
		const rateFilter = {
			hotel: hotelId,
			partner: partnerId
		}

		// Apply room type filter
		if (filters?.roomTypes !== 'all' && Array.isArray(filters?.roomTypes)) {
			const rtIds = await RoomType.find({
				hotel: hotelId,
				code: { $in: filters.roomTypes }
			}).select('_id')
			rateFilter.roomType = { $in: rtIds.map(r => r._id) }
		}

		// Apply meal plan filter
		if (filters?.mealPlans !== 'all' && Array.isArray(filters?.mealPlans)) {
			const mpIds = await MealPlan.find({
				$or: [{ hotel: hotelId }, { hotel: null, isStandard: true }],
				code: { $in: filters.mealPlans }
			}).select('_id')
			rateFilter.mealPlan = { $in: mpIds.map(m => m._id) }
		}

		// Apply market filter
		if (filters?.markets !== 'all' && Array.isArray(filters?.markets)) {
			const mIds = await Market.find({
				hotel: hotelId,
				code: { $in: filters.markets }
			}).select('_id')
			rateFilter.market = { $in: mIds.map(m => m._id) }
		}

		let updateResult
		let updateData = {}

		// Helper function to build date filter for Rate queries
		const buildDateFilter = (startDate, endDate, daysOfWeek) => {
			if (hasDayFilter(daysOfWeek)) {
				const matchingDates = getMatchingDates(startDate, endDate, daysOfWeek)
				return { $in: matchingDates }
			}
			return {
				$gte: new Date(startDate),
				$lte: new Date(endDate)
			}
		}

		switch (action) {
			case 'stop_sale':
			case 'open_sale': {
				const isStopSale = action === 'stop_sale'

				// Use direct IDs if available
				if (useDirectIds) {
					updateResult = await Rate.updateMany(
						{ _id: { $in: rateIds }, hotel: hotelId, partner: partnerId },
						{
							$set: {
								stopSale: isStopSale,
								stopSaleReason: isStopSale ? (reason || '') : '',
								source: 'ai',
								aiCommand: action
							}
						}
					)
				} else {
					rateFilter.date = buildDateFilter(dateRange.startDate, dateRange.endDate, filters?.daysOfWeek)
					updateResult = await Rate.updateMany(rateFilter, {
						$set: {
							stopSale: isStopSale,
							stopSaleReason: isStopSale ? (reason || '') : '',
							source: 'ai',
							aiCommand: action
						}
					})
				}
				logger.info(`${action}: updated ${updateResult.modifiedCount} rates (directIds=${useDirectIds})`)
				break
			}

			case 'single_stop':
			case 'open_single': {
				const isSingleStop = action === 'single_stop'

				if (useDirectIds) {
					updateResult = await Rate.updateMany(
						{ _id: { $in: rateIds }, hotel: hotelId, partner: partnerId },
						{
							$set: {
								singleStop: isSingleStop,
								source: 'ai',
								aiCommand: action
							}
						}
					)
				} else {
					rateFilter.date = buildDateFilter(dateRange.startDate, dateRange.endDate, filters?.daysOfWeek)
					updateResult = await Rate.updateMany(rateFilter, {
						$set: {
							singleStop: isSingleStop,
							source: 'ai',
							aiCommand: action
						}
					})
				}
				logger.info(`${action}: updated ${updateResult.modifiedCount} rates (directIds=${useDirectIds})`)
				break
			}

			case 'update_allotment':
				updateData = { allotment: value }
				break

			case 'update_min_stay':
				updateData = { minStay: value }
				break

			case 'update_max_stay':
				updateData = { maxStay: value }
				break

			case 'close_to_arrival':
			case 'close_to_departure': {
				const fieldName = action === 'close_to_arrival' ? 'closedToArrival' : 'closedToDeparture'
				const fieldValue = value === true || value === 'true'

				if (useDirectIds) {
					updateResult = await Rate.updateMany(
						{ _id: { $in: rateIds }, hotel: hotelId, partner: partnerId },
						{
							$set: {
								[fieldName]: fieldValue,
								source: 'ai',
								aiCommand: action
							}
						}
					)
				} else {
					rateFilter.date = buildDateFilter(dateRange.startDate, dateRange.endDate, filters?.daysOfWeek)
					updateResult = await Rate.updateMany(rateFilter, {
						$set: {
							[fieldName]: fieldValue,
							source: 'ai',
							aiCommand: action
						}
					})
				}
				logger.info(`${action}: updated ${updateResult.modifiedCount} rates (directIds=${useDirectIds})`)
				break
			}

			case 'set_price': {
				// Create or update daily rates
				// Get all combinations of roomType × mealPlan × market
				const roomTypeFilter = filters?.roomTypes !== 'all' && Array.isArray(filters?.roomTypes)
					? { hotel: hotelId, code: { $in: filters.roomTypes } }
					: { hotel: hotelId }
				const roomTypesForPrice = await RoomType.find(roomTypeFilter).select('_id code').lean()

				const mealPlanFilter = filters?.mealPlans !== 'all' && Array.isArray(filters?.mealPlans)
					? { $or: [{ hotel: hotelId }, { hotel: null, isStandard: true }], code: { $in: filters.mealPlans } }
					: { $or: [{ hotel: hotelId }, { hotel: null, isStandard: true }], status: 'active' }
				const mealPlansForPrice = await MealPlan.find(mealPlanFilter).select('_id code').lean()

				const marketFilter = filters?.markets !== 'all' && Array.isArray(filters?.markets)
					? { hotel: hotelId, code: { $in: filters.markets } }
					: { hotel: hotelId, status: 'active' }
				const marketsForPrice = await Market.find(marketFilter).select('_id code currency').lean()

				// Get all dates to process
				const datesToProcess = getMatchingDates(dateRange.startDate, dateRange.endDate, filters?.daysOfWeek)
				logger.info(`set_price: ${datesToProcess.length} dates to process`)

				// Build bulk upsert records
				const ratesToUpsert = []
				for (const date of datesToProcess) {
					for (const rt of roomTypesForPrice) {
						for (const mp of mealPlansForPrice) {
							for (const market of marketsForPrice) {
								ratesToUpsert.push({
									partner: partnerId,
									hotel: hotelId,
									roomType: rt._id,
									mealPlan: mp._id,
									market: market._id,
									date: date,
									pricePerNight: value,
									currency: market.currency || 'EUR',
									allotment: 10,
									minStay: 1,
									maxStay: 30,
									status: 'active',
									source: 'ai',
									aiCommand: action
								})
							}
						}
					}
				}

				if (ratesToUpsert.length > 0) {
					const bulkResult = await Rate.bulkUpsert(ratesToUpsert)
					updateResult = { modifiedCount: bulkResult.modifiedCount + bulkResult.upsertedCount }
					logger.info(`set_price: upserted ${ratesToUpsert.length} rates`)
				} else {
					updateResult = { modifiedCount: 0 }
				}
				break
			}

			case 'update_price': {
				// Update existing rates with new price (absolute or percentage)
				rateFilter.date = buildDateFilter(dateRange.startDate, dateRange.endDate, filters?.daysOfWeek)

				if (valueType === 'percentage') {
					// Percentage update - need to calculate new price for each rate
					const rates = await Rate.find(rateFilter)
					let updated = 0
					for (const rate of rates) {
						const newPrice = Math.round(rate.pricePerNight * (1 + value / 100))
						await Rate.findByIdAndUpdate(rate._id, {
							pricePerNight: newPrice,
							source: 'ai',
							aiCommand: 'update_price'
						})
						updated++
					}
					updateResult = { modifiedCount: updated }
					logger.info(`update_price (percentage): updated ${updated} rates`)
				} else {
					// Absolute value - bulk update
					updateResult = await Rate.updateMany(rateFilter, {
						$set: {
							pricePerNight: value,
							source: 'ai',
							aiCommand: 'update_price'
						}
					})
					logger.info(`update_price (absolute): updated ${updateResult.modifiedCount} rates`)
				}
				break
			}

			case 'set_supplement': {
				// Set meal plan supplement - calculate actual price based on RO (base) price
				// Find the meal plan codes to apply supplement
				const supplementMealPlanCodes = filters?.mealPlans !== 'all' && Array.isArray(filters?.mealPlans)
					? filters.mealPlans
					: []

				if (supplementMealPlanCodes.length === 0) {
					logger.warn('set_supplement: No meal plan codes specified')
					break
				}

				// Get meal plan IDs
				const supplementMealPlans = await MealPlan.find({
					$or: [{ hotel: hotelId }, { hotel: null, isStandard: true }],
					code: { $in: supplementMealPlanCodes }
				}).select('_id code').lean()

				// Get RO (Room Only) meal plan as base
				const roMealPlan = await MealPlan.findOne({
					$or: [{ hotel: hotelId }, { hotel: null, isStandard: true }],
					code: 'RO'
				}).select('_id').lean()

				if (!roMealPlan) {
					logger.warn('set_supplement: RO meal plan not found')
					break
				}

				let supplementUpdated = 0

				// Get room type filter
				const rtFilter = filters?.roomTypes !== 'all' && Array.isArray(filters?.roomTypes)
					? { hotel: hotelId, code: { $in: filters.roomTypes } }
					: { hotel: hotelId }
				const roomTypesForSupplement = await RoomType.find(rtFilter).select('_id').lean()

				// Get market filter
				const mktFilter = filters?.markets !== 'all' && Array.isArray(filters?.markets)
					? { hotel: hotelId, code: { $in: filters.markets } }
					: { hotel: hotelId, status: 'active' }
				const marketsForSupplement = await Market.find(mktFilter).select('_id').lean()

				// For each room type and market, find RO rate and apply supplement to target meal plans
				for (const rt of roomTypesForSupplement) {
					for (const market of marketsForSupplement) {
						// Find the RO (base) rate
						const roRate = await Rate.findOne({
							hotel: hotelId,
							partner: partnerId,
							roomType: rt._id,
							mealPlan: roMealPlan._id,
							market: market._id,
							startDate: { $lte: new Date(dateRange.endDate) },
							endDate: { $gte: new Date(dateRange.startDate) }
						})

						if (!roRate) continue

						const basePrice = roRate.pricePerNight

						// Apply supplement to each target meal plan
						for (const mp of supplementMealPlans) {
							let newPrice
							if (valueType === 'percentage') {
								newPrice = Math.round(basePrice * (1 + value / 100))
							} else {
								newPrice = basePrice + value
							}

							// Find and update the rate for this meal plan
							const targetRate = await Rate.findOne({
								hotel: hotelId,
								partner: partnerId,
								roomType: rt._id,
								mealPlan: mp._id,
								market: market._id,
								startDate: { $lte: new Date(dateRange.endDate) },
								endDate: { $gte: new Date(dateRange.startDate) }
							})

							if (targetRate) {
								await Rate.findByIdAndUpdate(targetRate._id, { pricePerNight: newPrice })
								supplementUpdated++
							}
						}
					}
				}

				updateResult = { modifiedCount: supplementUpdated }
				logger.info(`set_supplement: updated ${supplementUpdated} rates with ${valueType === 'percentage' ? value + '%' : value + ' TL'} supplement`)
				break
			}

			case 'update_single_supplement':
				// Update single room supplement
				if (valueType === 'percentage') {
					const rates = await Rate.find(rateFilter)
					let updated = 0
					for (const rate of rates) {
						const currentSupplement = rate.singleSupplement || 0
						const newSupplement = Math.round(currentSupplement * (1 + value / 100))
						await Rate.findByIdAndUpdate(rate._id, { singleSupplement: newSupplement })
						updated++
					}
					updateResult = { modifiedCount: updated }
				} else {
					// Set absolute value
					updateData = { singleSupplement: value }
				}
				break

			case 'update_extra_adult':
				if (valueType === 'percentage') {
					const rates = await Rate.find(rateFilter)
					let updated = 0
					for (const rate of rates) {
						if (!matchesDayOfWeek(rate.date, filters?.daysOfWeek)) continue
						const current = rate.extraAdult || 0
						const newValue = Math.round(current * (1 + value / 100))
						await Rate.findByIdAndUpdate(rate._id, { extraAdult: newValue })
						updated++
					}
					updateResult = { modifiedCount: updated }
				} else {
					updateData = { extraAdult: value }
				}
				break

			case 'update_extra_child':
				if (valueType === 'percentage') {
					const rates = await Rate.find(rateFilter)
					let updated = 0
					for (const rate of rates) {
						if (!matchesDayOfWeek(rate.date, filters?.daysOfWeek)) continue
						const current = rate.extraChild || 0
						const newValue = Math.round(current * (1 + value / 100))
						await Rate.findByIdAndUpdate(rate._id, { extraChild: newValue })
						updated++
					}
					updateResult = { modifiedCount: updated }
				} else {
					updateData = { extraChild: value }
				}
				break

			case 'update_extra_infant':
				if (valueType === 'percentage') {
					const rates = await Rate.find(rateFilter)
					let updated = 0
					for (const rate of rates) {
						if (!matchesDayOfWeek(rate.date, filters?.daysOfWeek)) continue
						const current = rate.extraInfant || 0
						const newValue = Math.round(current * (1 + value / 100))
						await Rate.findByIdAndUpdate(rate._id, { extraInfant: newValue })
						updated++
					}
					updateResult = { modifiedCount: updated }
				} else {
					updateData = { extraInfant: value }
				}
				break

			case 'update_child_free': {
				// Make Nth child free by setting their price to 0
				const rates = await Rate.find(rateFilter)
				let updated = 0
				for (const rate of rates) {
					if (!matchesDayOfWeek(rate.date, filters?.daysOfWeek)) continue
					const childPricing = rate.childPricing || []
					const idx = (childIndex || 1) - 1
					if (childPricing[idx]) {
						childPricing[idx].price = 0
					}
					await Rate.findByIdAndUpdate(rate._id, { childPricing })
					updated++
				}
				updateResult = { modifiedCount: updated }
				break
			}

			default:
				logger.warn(`Unknown AI action: ${action}`)
				continue // Skip unknown actions instead of throwing
		}

		// If we have updateData, do bulk update
		if (Object.keys(updateData).length > 0) {
			// Use direct IDs if available
			if (useDirectIds) {
				updateResult = await Rate.updateMany(
					{ _id: { $in: rateIds }, hotel: hotelId, partner: partnerId },
					{ $set: { ...updateData, source: 'ai', aiCommand: action } }
				)
				logger.info(`updateData with directIds: updated ${updateResult.modifiedCount} rates`)
			} else {
				// Always add date filter if not already set
				if (!rateFilter.date) {
					rateFilter.date = buildDateFilter(dateRange.startDate, dateRange.endDate, filters?.daysOfWeek)
				}

				if (filters?.daysOfWeek && filters.daysOfWeek !== 'all' && Array.isArray(filters.daysOfWeek)) {
					// Need to filter by day of week - iterate through rates
					const rates = await Rate.find(rateFilter)
					let updated = 0
					for (const rate of rates) {
						if (matchesDayOfWeek(rate.date, filters.daysOfWeek)) {
							await Rate.findByIdAndUpdate(rate._id, { $set: updateData })
							updated++
						}
					}
					updateResult = { modifiedCount: updated }
				} else {
					updateResult = await Rate.updateMany(rateFilter, { $set: updateData })
				}
			}
		}

		const affected = updateResult?.modifiedCount || 0
		totalAffected += affected
		logger.info(`AI action executed for hotel ${hotelId}: ${action}, affected: ${affected}`)
	}

	// Audit log for AI pricing command
	await AuditLog.log({
		actor: getAuditActor(req),
		module: 'planning',
		subModule: 'rate',
		action: 'update',
		target: {
			collection: 'rates',
			documentName: `AI Command: ${parsedCommand.actions?.[0]?.action || parsedCommand.action || 'unknown'}`
		},
		changes: {
			after: {
				dateRange: dateRange,
				actions: actions.map(a => ({ action: a.action, value: a.value, valueType: a.valueType })),
				rateIds: rateIds?.slice(0, 10), // Limit for readability
				totalAffected
			}
		},
		metadata: {
			batchId: `ai-pricing-${Date.now()}`,
			notes: `AI pricing command: ${actions.length} actions, ${totalAffected} rates affected`
		},
		request: { method: req.method, path: req.originalUrl },
		status: 'success'
	})

	res.json({
		success: true,
		message: req.t('AI_COMMAND_EXECUTED'),
		data: {
			actionsExecuted: actions.length,
			affected: totalAffected
		}
	})
})

// ==================== CONTRACT IMPORT ====================

/**
 * Parse hotel contract document using Gemini AI
 * Accepts file as base64 in request body
 */
export const parseContract = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId } = req.params
	const { fileContent, mimeType, fileName } = req.body

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	if (!fileContent) throw new BadRequestError('FILE_CONTENT_REQUIRED')
	if (!mimeType) throw new BadRequestError('MIME_TYPE_REQUIRED')

	await verifyHotelOwnership(hotelId, partnerId)

	// Get existing room types and meal plans for matching
	const [roomTypes, mealPlans, markets] = await Promise.all([
		RoomType.find({ hotel: hotelId, partner: partnerId, status: { $ne: 'deleted' } }).select('code name').lean(),
		MealPlan.find({
			$or: [{ hotel: hotelId }, { hotel: null, isStandard: true }],
			partner: partnerId,
			status: 'active'
		}).select('code name').lean(),
		Market.find({ hotel: hotelId, partner: partnerId, status: 'active' }).select('code currency').lean()
	])

	// Get default currency from first market or use EUR
	const currency = markets[0]?.currency || 'EUR'

	logger.info(`Parsing contract for hotel ${hotelId} - file: ${fileName}, mimeType: ${mimeType}`)
	logger.info(`Context - rooms: ${roomTypes.length}, mealPlans: ${mealPlans.length}, currency: ${currency}`)

	// Call Gemini to parse the contract
	const result = await parseHotelContract(fileContent, mimeType, {
		roomTypes,
		mealPlans,
		currency
	})

	if (!result.success) {
		throw new BadRequestError(result.error || 'CONTRACT_PARSE_FAILED')
	}

	// Normalize AI response - ensure all fields are properly set
	// Room types normalization
	if (result.data.roomTypes) {
		const existingCodes = roomTypes.map(rt => rt.code.toUpperCase())
		result.data.roomTypes = result.data.roomTypes.map(room => {
			// Check if matchedCode is valid (exists in our system)
			const matchedCodeUpper = room.matchedCode?.toUpperCase()
			const isValidMatch = matchedCodeUpper && existingCodes.includes(matchedCodeUpper)

			// Generate suggested code if missing
			let suggestedCode = room.suggestedCode
			if (!suggestedCode && room.contractName) {
				// Generate 3-letter code from contract name
				const words = room.contractName.replace(/[^a-zA-Z\s]/g, '').split(/\s+/).filter(w => w.length > 0)
				if (words.length >= 3) {
					suggestedCode = words.slice(0, 3).map(w => w[0].toUpperCase()).join('')
				} else if (words.length === 2) {
					suggestedCode = (words[0][0] + words[1].slice(0, 2)).toUpperCase()
				} else if (words.length === 1) {
					suggestedCode = words[0].slice(0, 3).toUpperCase()
				}
			}

			return {
				...room,
				matchedCode: isValidMatch ? room.matchedCode : null,
				isNewRoom: !isValidMatch,
				suggestedCode: suggestedCode || room.contractCode || 'NEW',
				confidence: room.confidence || (isValidMatch ? 80 : 50)
			}
		})
	}

	// Meal plans normalization
	if (result.data.mealPlans) {
		const existingMPCodes = mealPlans.map(mp => mp.code.toUpperCase())
		result.data.mealPlans = result.data.mealPlans.map(mp => {
			const matchedCodeUpper = mp.matchedCode?.toUpperCase()
			const isValidMatch = matchedCodeUpper && existingMPCodes.includes(matchedCodeUpper)

			// Standard meal plan codes
			const standardCodes = { AI: 'AI', UAI: 'UAI', FB: 'FB', HB: 'HB', BB: 'BB', RO: 'RO' }
			let suggestedCode = mp.suggestedCode || mp.contractCode
			if (!suggestedCode) {
				const nameUpper = mp.contractName?.toUpperCase() || ''
				if (nameUpper.includes('ULTRA') || nameUpper.includes('UAI')) suggestedCode = 'UAI'
				else if (nameUpper.includes('ALL INCLUSIVE') || nameUpper.includes('HER ŞEY DAHİL')) suggestedCode = 'AI'
				else if (nameUpper.includes('FULL BOARD') || nameUpper.includes('TAM PANSİYON')) suggestedCode = 'FB'
				else if (nameUpper.includes('HALF BOARD') || nameUpper.includes('YARIM PANSİYON')) suggestedCode = 'HB'
				else if (nameUpper.includes('BREAKFAST') || nameUpper.includes('KAHVALTI')) suggestedCode = 'BB'
				else if (nameUpper.includes('ROOM ONLY') || nameUpper.includes('SADECE ODA')) suggestedCode = 'RO'
				else suggestedCode = 'AI' // Default
			}

			return {
				...mp,
				matchedCode: isValidMatch ? mp.matchedCode : null,
				isNewMealPlan: !isValidMatch,
				suggestedCode,
				confidence: mp.confidence || (isValidMatch ? 80 : 50)
			}
		})
	}

	// Add existing data to response for frontend matching
	result.data.existingRoomTypes = roomTypes
	result.data.existingMealPlans = mealPlans

	logger.info(`Contract parsed - periods: ${result.data.periods?.length || 0}, rooms: ${result.data.roomTypes?.length || 0}, prices: ${result.data.pricing?.length || 0}`)

	res.json({
		success: true,
		data: result.data
	})
})

/**
 * Import pricing from parsed contract data
 * Creates or updates rates based on the contract data
 */
export const importContractPricing = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId } = req.params
	const { contractData, mappings, options = {} } = req.body

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	if (!contractData) throw new BadRequestError('CONTRACT_DATA_REQUIRED')

	await verifyHotelOwnership(hotelId, partnerId)

	const { periods, pricing, roomTypes: contractRoomTypes = [], mealPlans: contractMealPlans = [] } = contractData
	const {
		roomMappings = {},
		mealPlanMappings = {},
		periodMappings = {}
	} = mappings || {}

	const {
		overwriteExisting = false,
		defaultAllotment = 10,
		defaultMinStay = 1,
		createMissingRooms = true,
		createMissingMealPlans = true,
		updateRoomCapacity = true
	} = options

	// Get existing room types, meal plans and markets
	let [roomTypes, mealPlans, markets] = await Promise.all([
		RoomType.find({ hotel: hotelId, partner: partnerId, status: { $ne: 'deleted' } }),
		MealPlan.find({
			$or: [{ hotel: hotelId }, { hotel: null, isStandard: true }],
			partner: partnerId,
			status: 'active'
		}),
		Market.find({ hotel: hotelId, partner: partnerId, status: 'active' }).lean()
	])

	let roomsCreated = 0
	let roomsUpdated = 0
	let mealPlansCreated = 0

	// Process contract room types - create missing or update capacity
	logger.info(`Processing ${contractRoomTypes.length} contract room types for capacity update`)
	logger.info(`Room mappings received: ${JSON.stringify(roomMappings)}`)

	for (const contractRoom of contractRoomTypes) {
		logger.info(`Processing room: contractName="${contractRoom.contractName}", matchedCode="${contractRoom.matchedCode}", capacity=${JSON.stringify(contractRoom.capacity)}`)

		const mappedCode = roomMappings[contractRoom.contractName] || contractRoom.matchedCode || contractRoom.suggestedCode
		logger.info(`Mapped code for "${contractRoom.contractName}": ${mappedCode}`)

		if (!mappedCode) {
			logger.warn(`No mapped code found for room: ${contractRoom.contractName}`)
			continue
		}

		const existingRoom = roomTypes.find(rt => rt.code === mappedCode)
		logger.info(`Existing room found: ${existingRoom ? existingRoom.code : 'NOT FOUND'}`)

		if (existingRoom) {
			// Update capacity if option is enabled and contract has capacity data
			logger.info(`updateRoomCapacity=${updateRoomCapacity}, hasCapacity=${!!contractRoom.capacity}`)
			if (updateRoomCapacity && contractRoom.capacity) {
				const cap = contractRoom.capacity

				logger.info(`Contract capacity data: ${JSON.stringify(cap)}`)

				// Get existing occupancy data (fields are inside occupancy object in RoomType model)
				const existingOccupancy = existingRoom.occupancy || {}
				logger.info(`Existing room occupancy: maxAdults=${existingOccupancy.maxAdults}, baseOccupancy=${existingOccupancy.baseOccupancy}, maxChildren=${existingOccupancy.maxChildren}, maxInfants=${existingOccupancy.maxInfants}, totalMaxGuests=${existingOccupancy.totalMaxGuests}`)

				// Map contract capacity fields to RoomType occupancy fields:
				// cap.standardOccupancy → occupancy.baseOccupancy (fiyata dahil kişi sayısı)
				// cap.maxAdults → occupancy.maxAdults (odaya sığan max yetişkin)
				// cap.maxChildren → occupancy.maxChildren
				// cap.maxInfants → occupancy.maxInfants
				// cap.maxOccupancy → occupancy.totalMaxGuests (max total guests)
				const newMaxAdults = cap.maxAdults || existingOccupancy.maxAdults || 2
				const newBaseOccupancy = cap.standardOccupancy || cap.maxAdults || existingOccupancy.baseOccupancy || 2
				const newMaxChildren = cap.maxChildren !== undefined ? cap.maxChildren : (existingOccupancy.maxChildren || 2)
				const newMaxInfants = cap.maxInfants !== undefined ? cap.maxInfants : (existingOccupancy.maxInfants || 1)
				const newTotalMaxGuests = cap.maxOccupancy || existingOccupancy.totalMaxGuests || 4

				logger.info(`New occupancy values: maxAdults=${newMaxAdults}, baseOccupancy=${newBaseOccupancy}, maxChildren=${newMaxChildren}, maxInfants=${newMaxInfants}, totalMaxGuests=${newTotalMaxGuests}`)

				const needsUpdate =
					newMaxAdults !== existingOccupancy.maxAdults ||
					newBaseOccupancy !== existingOccupancy.baseOccupancy ||
					newMaxChildren !== existingOccupancy.maxChildren ||
					newMaxInfants !== existingOccupancy.maxInfants ||
					newTotalMaxGuests !== existingOccupancy.totalMaxGuests

				logger.info(`Needs update: ${needsUpdate}`)

				if (needsUpdate) {
					// Update fields inside the occupancy object using dot notation
					const updateResult = await RoomType.findByIdAndUpdate(existingRoom._id, {
						'occupancy.maxAdults': newMaxAdults,
						'occupancy.baseOccupancy': newBaseOccupancy,
						'occupancy.maxChildren': newMaxChildren,
						'occupancy.maxInfants': newMaxInfants,
						'occupancy.totalMaxGuests': newTotalMaxGuests
					}, { new: true })
					roomsUpdated++
					logger.info(`Updated room capacity: ${mappedCode} → maxAdults:${newMaxAdults}, baseOccupancy:${newBaseOccupancy}, children:${newMaxChildren}, infants:${newMaxInfants}, totalMax:${newTotalMaxGuests}`)
					logger.info(`Update result occupancy: ${JSON.stringify(updateResult?.occupancy)}`)
				} else {
					logger.info(`Room capacity unchanged: ${mappedCode}`)
				}
			} else {
				logger.info(`Skipping capacity update: updateRoomCapacity=${updateRoomCapacity}, hasCapacity=${!!contractRoom.capacity}`)
			}
		} else if (createMissingRooms && contractRoom.isNewRoom) {
			// Create new room type with occupancy object structure
			const cap = contractRoom.capacity || {}
			const newRoom = await RoomType.create({
				hotel: hotelId,
				partner: partnerId,
				code: mappedCode,
				name: { tr: contractRoom.contractName, en: contractRoom.contractName },
				description: { tr: '', en: '' },
				occupancy: {
					maxAdults: cap.maxAdults || 2,
					baseOccupancy: cap.standardOccupancy || cap.maxAdults || 2,
					maxChildren: cap.maxChildren || 2,
					maxInfants: cap.maxInfants || 1,
					totalMaxGuests: cap.maxOccupancy || 4
				},
				status: 'active',
				displayOrder: roomTypes.length
			})
			roomTypes.push(newRoom)
			roomsCreated++
			logger.info(`Created new room type: ${mappedCode} - ${contractRoom.contractName}`)
		}
	}

	// Process contract meal plans - create missing
	for (const contractMP of contractMealPlans) {
		const mappedCode = mealPlanMappings[contractMP.contractName] || contractMP.matchedCode || contractMP.suggestedCode
		if (!mappedCode) continue

		const existingMP = mealPlans.find(mp => mp.code === mappedCode)

		if (!existingMP && createMissingMealPlans && contractMP.isNewMealPlan) {
			const newMP = await MealPlan.create({
				hotel: hotelId,
				partner: partnerId,
				code: mappedCode,
				name: { tr: contractMP.contractName, en: contractMP.contractName },
				description: { tr: '', en: '' },
				status: 'active'
			})
			mealPlans.push(newMP)
			mealPlansCreated++
			logger.info(`Created new meal plan: ${mappedCode} - ${contractMP.contractName}`)
		}
	}

	// Refresh room types and meal plans as lean objects for lookup
	roomTypes = await RoomType.find({ hotel: hotelId, partner: partnerId, status: { $ne: 'deleted' } }).lean()
	mealPlans = await MealPlan.find({
		$or: [{ hotel: hotelId }, { hotel: null, isStandard: true }],
		partner: partnerId,
		status: 'active'
	}).lean()

	logger.info(`Room/MealPlan processing - rooms created: ${roomsCreated}, updated: ${roomsUpdated}, meal plans created: ${mealPlansCreated}`)

	// Create lookup maps
	const roomTypeMap = {}
	roomTypes.forEach(rt => { roomTypeMap[rt.code] = rt })

	const mealPlanMap = {}
	mealPlans.forEach(mp => { mealPlanMap[mp.code] = mp })

	// Calculate season date range from all periods (min start, max end)
	let seasonStartDate = null
	let seasonEndDate = null
	for (const period of periods) {
		const start = new Date(period.startDate)
		const end = new Date(period.endDate)
		if (!seasonStartDate || start < seasonStartDate) seasonStartDate = start
		if (!seasonEndDate || end > seasonEndDate) seasonEndDate = end
	}

	// Generate season name from contract info or date range
	const year = seasonStartDate ? seasonStartDate.getFullYear() : new Date().getFullYear()
	const contractName = contractData.contractInfo?.hotelName || 'Kontrat'
	const seasonName = `${year} Sezonu`
	const seasonCode = `S${year}`

	// Create ONE season per market (not per period!)
	let seasonsCreated = 0
	const createdSeasons = []

	for (const market of markets) {
		const fullSeasonCode = `${seasonCode}-${market.code}`.toUpperCase()

		// Check if season already exists
		const existingSeason = await Season.findOne({
			hotel: hotelId,
			partner: partnerId,
			market: market._id,
			code: fullSeasonCode
		})

		if (!existingSeason) {
			const newSeason = await Season.create({
				hotel: hotelId,
				partner: partnerId,
				market: market._id,
				code: fullSeasonCode,
				name: { tr: seasonName, en: `${year} Season` },
				color: '#6366f1',
				dateRanges: [{
					startDate: seasonStartDate,
					endDate: seasonEndDate
				}],
				priority: 0,
				displayOrder: 0,
				status: 'active'
			})
			createdSeasons.push(newSeason)
			seasonsCreated++
			logger.info(`Created season: ${fullSeasonCode} (${seasonStartDate?.toISOString().split('T')[0]} - ${seasonEndDate?.toISOString().split('T')[0]})`)
		}
	}

	logger.info(`Created ${seasonsCreated} season(s) for ${periods.length} periods`)

	// Get dates and minStay for each period
	const periodDates = {}
	const periodMinStay = {}
	for (const period of periods) {
		const mappedCode = periodMappings[period.code] || period.code
		const startDate = new Date(period.startDate)
		const endDate = new Date(period.endDate)
		const dates = []

		const current = new Date(startDate)
		while (current <= endDate) {
			dates.push(current.toISOString().split('T')[0])
			current.setDate(current.getDate() + 1)
		}

		periodDates[period.code] = dates
		periodMinStay[period.code] = period.minStay || null // null means not set yet
	}

	// Parse minStay from warnings if not in periods
	// Warnings may contain text like: "01.04 - 08.04 ve 07.10 - 31.10 arası minimum 3 gece konaklama"
	// or "Diğer tarih aralıkları için minimum 4 gece"
	const warnings = contractData.warnings || []
	let defaultMinStayFromWarnings = null

	for (const warning of warnings) {
		if (typeof warning !== 'string') continue

		// Check for "diğer tarih" pattern (default minStay for other periods)
		const defaultMatch = warning.match(/diğer\s+tarih[^\d]*(\d+)\s*gece/i)
		if (defaultMatch) {
			defaultMinStayFromWarnings = parseInt(defaultMatch[1], 10)
			logger.info(`Found default minStay from warnings: ${defaultMinStayFromWarnings}`)
		}

		// Check for specific date ranges: "01.04 - 08.04 ve 07.10 - 31.10 arası minimum 3 gece"
		const minStayMatch = warning.match(/minimum\s+(\d+)\s*gece/i)
		if (!minStayMatch) continue

		const minStayValue = parseInt(minStayMatch[1], 10)

		// Extract date ranges (DD.MM or DD.MM.YYYY format)
		const dateRangePattern = /(\d{1,2})\.(\d{1,2})(?:\.(\d{4}))?\s*[-–]\s*(\d{1,2})\.(\d{1,2})(?:\.(\d{4}))?/g
		let dateMatch

		while ((dateMatch = dateRangePattern.exec(warning)) !== null) {
			const startDay = parseInt(dateMatch[1], 10)
			const startMonth = parseInt(dateMatch[2], 10)
			const startYear = dateMatch[3] ? parseInt(dateMatch[3], 10) : year
			const endDay = parseInt(dateMatch[4], 10)
			const endMonth = parseInt(dateMatch[5], 10)
			const endYear = dateMatch[6] ? parseInt(dateMatch[6], 10) : year

			const rangeStart = new Date(startYear, startMonth - 1, startDay)
			const rangeEnd = new Date(endYear, endMonth - 1, endDay)

			// Find which period this date range matches
			for (const period of periods) {
				const periodStart = new Date(period.startDate)
				const periodEnd = new Date(period.endDate)

				// Check if ranges overlap or are close
				const overlaps =
					(rangeStart <= periodEnd && rangeEnd >= periodStart) ||
					(Math.abs(rangeStart - periodStart) < 3 * 24 * 60 * 60 * 1000) // Within 3 days

				if (overlaps && !periodMinStay[period.code]) {
					periodMinStay[period.code] = minStayValue
					logger.info(`Set minStay ${minStayValue} for period ${period.code} from warnings (${period.startDate} - ${period.endDate})`)
				}
			}
		}
	}

	// Apply default minStay to periods that still don't have one
	for (const period of periods) {
		if (!periodMinStay[period.code]) {
			periodMinStay[period.code] = defaultMinStayFromWarnings || defaultMinStay
		}
	}

	let createdCount = 0
	let updatedCount = 0
	let skippedCount = 0
	const bulkOps = []

	// Process each pricing entry
	for (const priceEntry of pricing) {
		const {
			periodCode, roomCode, mealPlanCode,
			pricePerNight, singleSupplement, extraAdult, extraChild, extraInfant,
			pricingType, occupancyPricing, // OBP support
			minStay, allotment
		} = priceEntry

		// Get minStay from pricing entry, or from period, or default
		const effectiveMinStay = minStay || periodMinStay[periodCode] || defaultMinStay

		// Get mapped codes
		const mappedRoomCode = roomMappings[roomCode] || roomCode
		const mappedMealPlanCode = mealPlanMappings[mealPlanCode] || mealPlanCode

		// Find room type and meal plan
		const roomType = roomTypeMap[mappedRoomCode]
		const mealPlan = mealPlanMap[mappedMealPlanCode]

		if (!roomType) {
			logger.warn(`Room type not found: ${mappedRoomCode} (original: ${roomCode})`)
			skippedCount++
			continue
		}

		if (!mealPlan) {
			logger.warn(`Meal plan not found: ${mappedMealPlanCode} (original: ${mealPlanCode})`)
			skippedCount++
			continue
		}

		// Get dates for this period
		const dates = periodDates[periodCode]
		if (!dates || dates.length === 0) {
			logger.warn(`No dates for period: ${periodCode}`)
			skippedCount++
			continue
		}

		// Prepare bulk operations for each date and market
		for (const market of markets) {
			for (const dateStr of dates) {
				const rateData = {
					pricingType: pricingType || 'unit',
					currency: market.currency || 'EUR',
					allotment: allotment || defaultAllotment,
					minStay: effectiveMinStay,
					source: 'contract',
					status: 'active'
				}

				// Handle pricing based on type
				if (pricingType === 'per_person' && occupancyPricing) {
					// OBP pricing - store occupancy-based prices
					rateData.occupancyPricing = {}
					for (const [pax, price] of Object.entries(occupancyPricing)) {
						if (price !== undefined && price !== null) {
							rateData.occupancyPricing[pax] = price
						}
					}
					// Set pricePerNight to 0 for OBP (not used)
					rateData.pricePerNight = 0
				} else {
					// Unit pricing (default)
					rateData.pricePerNight = pricePerNight || 0
					rateData.singleSupplement = singleSupplement || 0
					rateData.extraAdult = extraAdult || 0
					rateData.extraInfant = extraInfant || 0
				}

				// Handle child pricing array (works for both pricing types)
				if (Array.isArray(extraChild)) {
					rateData.childOrderPricing = extraChild
				}

				const filter = {
					hotel: hotelId,
					partner: partnerId,
					roomType: roomType._id,
					mealPlan: mealPlan._id,
					market: market._id,
					date: dateStr
				}

				if (overwriteExisting) {
					// Upsert: create or update
					bulkOps.push({
						updateOne: {
							filter,
							update: { $set: { ...filter, ...rateData } },
							upsert: true
						}
					})
				} else {
					// Only insert if not exists
					bulkOps.push({
						updateOne: {
							filter,
							update: { $setOnInsert: { ...filter, ...rateData } },
							upsert: true
						}
					})
				}
			}
		}
	}

	// Execute bulk operations in batches
	const BATCH_SIZE = 500
	for (let i = 0; i < bulkOps.length; i += BATCH_SIZE) {
		const batch = bulkOps.slice(i, i + BATCH_SIZE)
		if (batch.length > 0) {
			const result = await Rate.bulkWrite(batch, { ordered: false })
			createdCount += result.upsertedCount || 0
			updatedCount += result.modifiedCount || 0
		}
	}

	// Calculate skipped (non-upsert mode)
	if (!overwriteExisting) {
		skippedCount = bulkOps.length - createdCount
	}

	logger.info(`Contract import - bulkOps: ${bulkOps.length}, created: ${createdCount}, updated: ${updatedCount}, skipped: ${skippedCount}`)

	// Audit log
	await AuditLog.log({
		actor: getAuditActor(req),
		module: 'planning',
		subModule: 'rate',
		action: 'import',
		target: {
			collection: 'rates',
			documentName: `Contract Import: ${contractData.contractInfo?.hotelName || 'Unknown'}`
		},
		changes: {
			after: {
				periods: periods?.length || 0,
				pricing: pricing?.length || 0,
				created: createdCount,
				updated: updatedCount,
				skipped: skippedCount
			}
		},
		metadata: {
			batchId: `contract-import-${Date.now()}`,
			notes: `Contract import: ${createdCount} created, ${updatedCount} updated, ${skippedCount} skipped`
		},
		request: { method: req.method, path: req.originalUrl },
		status: 'success'
	})

	// Create EB (Early Booking) campaigns
	let campaignsCreated = 0
	const createdCampaigns = []
	const earlyBookingDiscounts = contractData.earlyBookingDiscounts || []

	for (const eb of earlyBookingDiscounts) {
		if (!eb.discountPercentage || eb.discountPercentage <= 0) continue

		// Handle different field formats from AI
		// Format 1: salePeriod/stayPeriod objects
		// Format 2: bookingUntil/paymentUntil strings
		let saleStart, saleEnd, stayStart, stayEnd

		if (eb.salePeriod?.startDate) {
			// Format 1
			saleStart = new Date(eb.salePeriod.startDate)
			saleEnd = new Date(eb.salePeriod.endDate)
		} else if (eb.bookingUntil) {
			// Format 2 - bookingUntil is the sale end date
			saleStart = new Date() // Today
			saleEnd = new Date(eb.bookingUntil)
		} else {
			saleStart = new Date()
			saleEnd = seasonEndDate
		}

		if (eb.stayPeriod?.startDate) {
			// Format 1
			stayStart = new Date(eb.stayPeriod.startDate)
			stayEnd = new Date(eb.stayPeriod.endDate)
		} else {
			// Format 2 - Stay period is entire season
			stayStart = seasonStartDate
			stayEnd = seasonEndDate
		}

		const ebCode = `EB${eb.discountPercentage}-${year}`.toUpperCase()
		const ebName = eb.name || `Erken Rezervasyon %${eb.discountPercentage}`

		try {
			// Check if campaign already exists
			const existingCampaign = await Campaign.findOne({
				hotel: hotelId,
				partner: partnerId,
				code: ebCode
			})

			if (!existingCampaign) {
				const newCampaign = await Campaign.create({
					hotel: hotelId,
					partner: partnerId,
					code: ebCode,
					name: { tr: ebName, en: `Early Bird ${eb.discountPercentage}%` },
					description: { tr: `Kontrat EB indirimi: %${eb.discountPercentage}`, en: `Contract EB discount: ${eb.discountPercentage}%` },
					type: 'early_bird',
					bookingWindow: {
						startDate: saleStart,
						endDate: saleEnd
					},
					stayWindow: {
						startDate: stayStart,
						endDate: stayEnd
					},
					discount: {
						type: 'percentage',
						value: eb.discountPercentage
					},
					conditions: {
						minNights: 1
					},
					combinable: eb.isCumulative || false,
					applicationType: 'stay',
					calculationType: 'cumulative',
					priority: eb.discountPercentage, // Higher discount = higher priority
					status: 'active'
				})
				createdCampaigns.push({
					code: ebCode,
					name: ebName,
					discount: eb.discountPercentage,
					salePeriod: { startDate: saleStart, endDate: saleEnd },
					stayPeriod: { startDate: stayStart, endDate: stayEnd }
				})
				campaignsCreated++
				logger.info(`Created EB campaign: ${ebCode} - ${eb.discountPercentage}%`)
			} else {
				logger.info(`EB campaign already exists: ${ebCode}`)
			}
		} catch (err) {
			logger.warn(`Failed to create EB campaign ${ebCode}: ${err.message}`)
		}
	}

	logger.info(`Contract import completed - rooms: ${roomsCreated}/${roomsUpdated}, mealPlans: ${mealPlansCreated}, seasons: ${seasonsCreated}, rates: ${createdCount}/${updatedCount}/${skippedCount}, campaigns: ${campaignsCreated}`)

	res.json({
		success: true,
		message: req.t('CONTRACT_IMPORTED'),
		data: {
			roomsCreated,
			roomsUpdated,
			mealPlansCreated,
			seasonsCreated,
			campaignsCreated,
			campaigns: createdCampaigns,
			ratesCreated: createdCount,
			ratesUpdated: updatedCount,
			ratesSkipped: skippedCount,
			totalOperations: bulkOps.length
		}
	})
})

/**
 * Delete all pricing data (seasons and rates) for a specific market
 * PLATFORM ADMIN ONLY - Hard delete
 */
export const deleteMarketPricingData = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId, marketId } = req.params

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')

	await verifyHotelOwnership(hotelId, partnerId)

	// Verify market exists
	const market = await Market.findOne({ _id: marketId, hotel: hotelId, partner: partnerId })
	if (!market) throw new NotFoundError('MARKET_NOT_FOUND')

	// Delete all rates for this market
	const ratesDeleted = await Rate.deleteMany({
		hotel: hotelId,
		partner: partnerId,
		market: marketId
	})

	// Delete all seasons for this market
	const seasonsDeleted = await Season.deleteMany({
		hotel: hotelId,
		partner: partnerId,
		market: marketId
	})

	// Audit log
	await AuditLog.log({
		actor: getAuditActor(req),
		module: 'planning',
		subModule: 'pricing',
		action: 'delete',
		target: {
			collection: 'rates,seasons',
			documentId: marketId,
			documentName: `Market: ${market.name?.tr || market.code}`
		},
		changes: {
			before: {
				rates: ratesDeleted.deletedCount,
				seasons: seasonsDeleted.deletedCount
			},
			after: null
		},
		metadata: {
			notes: `Platform admin deleted all pricing data for market ${market.code}`
		},
		request: { method: req.method, path: req.originalUrl },
		status: 'success'
	})

	logger.info(`Platform admin deleted pricing data - hotel: ${hotelId}, market: ${marketId}, rates: ${ratesDeleted.deletedCount}, seasons: ${seasonsDeleted.deletedCount}`)

	res.json({
		success: true,
		message: req.t('PRICING_DATA_DELETED'),
		data: {
			ratesDeleted: ratesDeleted.deletedCount,
			seasonsDeleted: seasonsDeleted.deletedCount
		}
	})
})

// ==================== PRICING CALCULATION ENDPOINTS ====================
import pricingService from '../../services/pricingService.js'
import cache from '../../services/cacheService.js'

/**
 * Calculate price for a specific rate and occupancy
 * POST /planning/hotels/:hotelId/rates/:rateId/calculate-price
 * Body: { adults, children: [{ age, ageGroup }], nights }
 */
export const calculateRatePrice = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId, rateId } = req.params
	const { adults = 2, children = [], nights = 1 } = req.body

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	await verifyHotelOwnership(hotelId, partnerId)

	// Get rate with all relations
	const rate = await Rate.findById(rateId)
		.populate('roomType')
		.populate('mealPlan')
		.populate('market')

	if (!rate) throw new NotFoundError('RATE_NOT_FOUND')
	if (rate.hotel.toString() !== hotelId) throw new ForbiddenError('FORBIDDEN')

	// Get hotel for child age groups
	const hotel = await Hotel.findById(hotelId).select('childAgeGroups').lean()

	// Get season for the rate's date
	const season = await Season.findByDate(hotelId, rate.market._id, rate.date)

	// Check restrictions
	const restrictionCheck = pricingService.checkRestrictions(rate, {
		adults,
		bookingDate: new Date()
	})

	// Calculate price
	const priceResult = pricingService.calculateOccupancyPrice(
		rate,
		{ adults, children, nights },
		{
			roomType: rate.roomType,
			market: rate.market,
			season,
			hotel
		}
	)

	res.json({
		success: true,
		data: {
			...priceResult,
			restrictions: restrictionCheck,
			rate: {
				_id: rate._id,
				date: rate.date,
				roomType: rate.roomType?.code,
				mealPlan: rate.mealPlan?.code,
				market: rate.market?.code
			}
		}
	})
})

/**
 * Calculate price by query (without rate ID)
 * POST /planning/hotels/:hotelId/pricing/calculate
 * Body: { roomTypeId, mealPlanId, marketId, date, adults, children, nights }
 */
export const calculatePriceByQuery = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId } = req.params
	const { roomTypeId, mealPlanId, marketId, date, adults = 2, children = [], nights = 1 } = req.body

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	if (!roomTypeId || !mealPlanId || !marketId || !date) {
		throw new BadRequestError('MISSING_REQUIRED_FIELDS')
	}

	await verifyHotelOwnership(hotelId, partnerId)

	const result = await pricingService.calculateBookingPrice({
		hotelId,
		roomTypeId,
		mealPlanId,
		marketId,
		date,
		adults,
		children,
		nights
	})

	res.json({
		success: result.success,
		data: result
	})
})

/**
 * Bulk calculate prices
 * POST /planning/hotels/:hotelId/pricing/bulk-calculate
 * Body: { queries: [{ roomTypeId, mealPlanId, marketId, date, adults, children, nights }, ...] }
 */
export const bulkCalculatePrices = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId } = req.params
	const { queries } = req.body

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	if (!Array.isArray(queries) || queries.length === 0) {
		throw new BadRequestError('QUERIES_REQUIRED')
	}
	if (queries.length > 100) {
		throw new BadRequestError('MAX_100_QUERIES')
	}

	await verifyHotelOwnership(hotelId, partnerId)

	// Add hotelId to all queries
	const queriesWithHotel = queries.map(q => ({ ...q, hotelId }))

	const results = await pricingService.bulkCalculatePrices(queriesWithHotel)

	res.json({
		success: true,
		data: results
	})
})

/**
 * Check availability for a date range
 * POST /planning/hotels/:hotelId/pricing/check-availability
 * Body: { roomTypeId, mealPlanId, marketId, startDate, endDate, adults }
 */
export const checkPricingAvailability = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId } = req.params
	const { roomTypeId, mealPlanId, marketId, startDate, endDate, adults = 2 } = req.body

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	if (!roomTypeId || !mealPlanId || !marketId || !startDate || !endDate) {
		throw new BadRequestError('MISSING_REQUIRED_FIELDS')
	}

	await verifyHotelOwnership(hotelId, partnerId)

	const result = await pricingService.checkAvailability({
		hotelId,
		roomTypeId,
		mealPlanId,
		marketId,
		startDate,
		endDate,
		adults
	})

	res.json({
		success: true,
		data: result
	})
})

/**
 * Get effective rate with all overrides applied
 * GET /planning/hotels/:hotelId/pricing/effective-rate
 * Query: { roomTypeId, mealPlanId, marketId, date }
 */
export const getEffectiveRateEndpoint = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId } = req.params
	const { roomTypeId, mealPlanId, marketId, date } = req.query

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	if (!roomTypeId || !mealPlanId || !marketId || !date) {
		throw new BadRequestError('MISSING_REQUIRED_FIELDS')
	}

	await verifyHotelOwnership(hotelId, partnerId)

	const result = await pricingService.getEffectiveRate(hotelId, roomTypeId, mealPlanId, marketId, date)

	res.json({
		success: true,
		data: result
	})
})

/**
 * Get effective multipliers for a room type (considering all overrides)
 * GET /planning/hotels/:hotelId/pricing/effective-multipliers
 * Query: { roomTypeId, marketId, date }
 */
export const getEffectiveMultipliers = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId } = req.params
	const { roomTypeId, marketId, date } = req.query

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	if (!roomTypeId) {
		throw new BadRequestError('ROOM_TYPE_REQUIRED')
	}

	await verifyHotelOwnership(hotelId, partnerId)

	// Get room type
	const roomType = await RoomType.findById(roomTypeId).lean()
	if (!roomType) throw new NotFoundError('ROOM_TYPE_NOT_FOUND')

	// Get market if provided
	let market = null
	if (marketId) {
		market = await Market.findById(marketId).lean()
	}

	// Get season for date if provided
	let season = null
	if (date && marketId) {
		season = await Season.findByDate(hotelId, marketId, date)
		if (season) season = season.toObject()
	}

	// Get effective multipliers
	const effectiveMultipliers = pricingService.getEffectiveMultiplierTemplate(roomType, market, season)
	const effectivePricingType = pricingService.getEffectivePricingType(roomType, market, season)

	// Get hotel for child age groups
	const hotel = await Hotel.findById(hotelId).select('childAgeGroups').lean()
	const effectiveChildAgeGroups = pricingService.getEffectiveChildAgeGroups(hotel, market, season)

	res.json({
		success: true,
		data: {
			roomType: {
				_id: roomType._id,
				code: roomType.code,
				pricingType: roomType.pricingType,
				useMultipliers: roomType.useMultipliers
			},
			market: market ? {
				_id: market._id,
				code: market.code
			} : null,
			season: season ? {
				_id: season._id,
				code: season.code,
				name: season.name
			} : null,
			effectivePricingType,
			effectiveMultipliers,
			effectiveChildAgeGroups
		}
	})
})

/**
 * Get combination table for a room type (with effective overrides)
 * GET /planning/hotels/:hotelId/pricing/combination-table
 * Query: { roomTypeId, marketId, date }
 */
export const getCombinationTable = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId } = req.params
	const { roomTypeId, marketId, date } = req.query

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	if (!roomTypeId) {
		throw new BadRequestError('ROOM_TYPE_REQUIRED')
	}

	await verifyHotelOwnership(hotelId, partnerId)

	// Get room type
	const roomType = await RoomType.findById(roomTypeId).lean()
	if (!roomType) throw new NotFoundError('ROOM_TYPE_NOT_FOUND')

	// Get market if provided
	let market = null
	if (marketId) {
		market = await Market.findById(marketId).lean()
	}

	// Get season for date if provided
	let season = null
	if (date && marketId) {
		season = await Season.findByDate(hotelId, marketId, date)
		if (season) season = season.toObject()
	}

	// Get effective multipliers (includes combination table)
	const effectiveMultipliers = pricingService.getEffectiveMultiplierTemplate(roomType, market, season)

	res.json({
		success: true,
		data: {
			roomType: {
				_id: roomType._id,
				code: roomType.code,
				occupancy: roomType.occupancy
			},
			effectivePricingType: pricingService.getEffectivePricingType(roomType, market, season),
			useMultipliers: effectiveMultipliers.useMultipliers,
			combinationTable: effectiveMultipliers.combinationTable,
			adultMultipliers: effectiveMultipliers.adultMultipliers,
			childMultipliers: effectiveMultipliers.childMultipliers,
			roundingRule: effectiveMultipliers.roundingRule
		}
	})
})

/**
 * Get effective child age groups (considering inheritance)
 * GET /planning/hotels/:hotelId/pricing/child-age-groups
 * Query: { marketId, date }
 */
export const getEffectiveChildAgeGroups = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId } = req.params
	const { marketId, date } = req.query

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')

	await verifyHotelOwnership(hotelId, partnerId)

	// Get hotel
	const hotel = await Hotel.findById(hotelId).select('childAgeGroups').lean()

	// Get market if provided
	let market = null
	if (marketId) {
		market = await Market.findById(marketId).lean()
	}

	// Get season for date if provided
	let season = null
	if (date && marketId) {
		season = await Season.findByDate(hotelId, marketId, date)
		if (season) season = season.toObject()
	}

	// Get effective child age groups
	const effectiveChildAgeGroups = pricingService.getEffectiveChildAgeGroups(hotel, market, season)

	// Determine source
	let source = 'hotel'
	if (season && !season.childAgeSettings?.inheritFromMarket) {
		source = 'season'
	} else if (market && !market.childAgeSettings?.inheritFromHotel) {
		source = 'market'
	}

	res.json({
		success: true,
		data: {
			childAgeGroups: effectiveChildAgeGroups,
			source,
			hotel: {
				childAgeGroups: hotel?.childAgeGroups || []
			},
			market: market ? {
				_id: market._id,
				code: market.code,
				inheritFromHotel: market.childAgeSettings?.inheritFromHotel !== false,
				childAgeGroups: market.childAgeSettings?.childAgeGroups || []
			} : null,
			season: season ? {
				_id: season._id,
				code: season.code,
				inheritFromMarket: season.childAgeSettings?.inheritFromMarket !== false,
				childAgeGroups: season.childAgeSettings?.childAgeGroups || []
			} : null
		}
	})
})

/**
 * Calculate complete booking price with campaigns (server-side)
 * POST /planning/hotels/:hotelId/pricing/calculate-with-campaigns
 * Body: { roomTypeId, mealPlanId, marketId, checkInDate, checkOutDate, adults, children, includeCampaigns }
 */
export const calculatePriceWithCampaigns = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId } = req.params
	const {
		roomTypeId,
		mealPlanId,
		marketId,
		checkInDate,
		checkOutDate,
		adults = 2,
		children = [],
		includeCampaigns = true
	} = req.body

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	if (!roomTypeId || !mealPlanId || !marketId || !checkInDate || !checkOutDate) {
		throw new BadRequestError('MISSING_REQUIRED_FIELDS')
	}

	await verifyHotelOwnership(hotelId, partnerId)

	const result = await pricingService.calculatePriceWithCampaigns({
		hotelId,
		roomTypeId,
		mealPlanId,
		marketId,
		checkInDate,
		checkOutDate,
		adults,
		children,
		includeCampaigns
	})

	res.json({
		success: true,
		data: result
	})
})

/**
 * Get applicable campaigns for a booking query
 * GET /planning/hotels/:hotelId/pricing/applicable-campaigns
 * Query: { roomTypeId, marketId, mealPlanId, checkInDate, checkOutDate }
 */
export const getApplicableCampaigns = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { hotelId } = req.params
	const { roomTypeId, marketId, mealPlanId, checkInDate, checkOutDate } = req.query

	if (!partnerId) throw new BadRequestError('PARTNER_REQUIRED')
	if (!checkInDate || !checkOutDate) {
		throw new BadRequestError('DATES_REQUIRED')
	}

	await verifyHotelOwnership(hotelId, partnerId)

	// Calculate nights
	const checkIn = new Date(checkInDate)
	const checkOut = new Date(checkOutDate)
	const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24))

	const campaigns = await pricingService.getApplicableCampaigns(hotelId, {
		checkInDate,
		checkOutDate,
		roomTypeId,
		marketId,
		mealPlanId,
		nights
	})

	res.json({
		success: true,
		data: {
			campaigns: campaigns.map(c => ({
				_id: c._id,
				code: c.code,
				name: c.name,
				type: c.type,
				discount: c.discount,
				conditions: c.conditions,
				combinable: c.combinable,
				priority: c.priority,
				applicationType: c.applicationType,
				calculationType: c.calculationType,
				stayWindow: c.stayWindow,
				bookingWindow: c.bookingWindow
			})),
			count: campaigns.length,
			query: {
				checkInDate,
				checkOutDate,
				nights,
				roomTypeId: roomTypeId || 'all',
				marketId: marketId || 'all',
				mealPlanId: mealPlanId || 'all'
			}
		}
	})
})

// ==================== CACHE MANAGEMENT ====================

/**
 * Get cache statistics
 * GET /planning/cache/stats
 * Platform Admin only
 */
export const getCacheStats = asyncHandler(async (req, res) => {
	const stats = cache.getStats()

	res.json({
		success: true,
		data: stats
	})
})

/**
 * Clear entire cache
 * POST /planning/cache/clear
 * Platform Admin only
 */
export const clearCache = asyncHandler(async (req, res) => {
	const { pattern } = req.body

	let clearedCount = 0
	if (pattern) {
		clearedCount = cache.deleteByPattern(pattern)
	} else {
		cache.clear()
		clearedCount = -1 // Indicates full clear
	}

	// Log the action
	logger.info(`Cache cleared by ${req.user.email}`, { pattern, clearedCount })

	res.json({
		success: true,
		message: pattern ? `Cleared ${clearedCount} cache entries matching pattern: ${pattern}` : 'Entire cache cleared',
		clearedCount
	})
})

/**
 * Invalidate cache for a specific entity
 * POST /planning/cache/invalidate/:entityType/:entityId
 * Platform Admin only
 */
export const invalidateCache = asyncHandler(async (req, res) => {
	const { entityType, entityId } = req.params

	cache.invalidateEntity(entityType, entityId)

	// Log the action
	logger.info(`Cache invalidated for ${entityType}:${entityId} by ${req.user.email}`)

	res.json({
		success: true,
		message: `Cache invalidated for ${entityType}:${entityId}`
	})
})
