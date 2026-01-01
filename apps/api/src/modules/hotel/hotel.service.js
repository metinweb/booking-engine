import crypto from 'crypto'
import Hotel from './hotel.model.js'
import Partner from '../partner/partner.model.js'
import City from '../location/city.model.js'
import Market from '../planning/market.model.js'
import { NotFoundError, BadRequestError, ForbiddenError } from '../../core/errors.js'
import { asyncHandler } from '../../helpers/asyncHandler.js'
import { getHotelFileUrl, deleteHotelFile } from '../../helpers/hotelUpload.js'
import { downloadHotelImages, downloadHotelLogo, downloadRoomTemplateImages } from '../../helpers/imageDownloader.js'
import { extractHotelData, extractHotelDataFromUrl } from '../../services/geminiService.js'
import { ProgressEmitter } from '../../core/socket.js'
import logger from '../../core/logger.js'
import fs from 'fs'
import path from 'path'

// Get partner ID from request (partner user or platform admin viewing as partner)
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

/**
 * Get all hotels for partner
 */
export const getHotels = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)

	if (!partnerId) {
		throw new BadRequestError('PARTNER_REQUIRED')
	}

	const { status, stars, city, search, page = 1, limit = 20 } = req.query

	// Build filter
	const filter = { partner: partnerId }

	if (status) {
		filter.status = status
	}

	if (stars) {
		filter.stars = parseInt(stars)
	}

	if (city) {
		filter['address.city'] = { $regex: city, $options: 'i' }
	}

	if (search) {
		filter.$or = [
			{ name: { $regex: search, $options: 'i' } },
			{ 'address.city': { $regex: search, $options: 'i' } }
		]
	}

	const skip = (parseInt(page) - 1) * parseInt(limit)
	const total = await Hotel.countDocuments(filter)

	const hotels = await Hotel.find(filter)
		.sort({ displayOrder: 1, createdAt: -1 })
		.skip(skip)
		.limit(parseInt(limit))
		.select('-__v')

	res.json({
		success: true,
		data: {
			items: hotels,
			pagination: {
				page: parseInt(page),
				limit: parseInt(limit),
				total,
				pages: Math.ceil(total / parseInt(limit))
			}
		}
	})
})

/**
 * Get single hotel
 * For linked hotels, returns resolved data (base + partner settings)
 */
export const getHotel = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { id } = req.params
	const { resolve = 'true' } = req.query // Whether to resolve linked hotel data

	if (!partnerId) {
		throw new BadRequestError('PARTNER_REQUIRED')
	}

	const hotel = await verifyHotelOwnership(id, partnerId)

	// For linked hotels, resolve data from base hotel if requested
	let hotelData = hotel
	if (hotel.hotelType === 'linked' && resolve === 'true') {
		hotelData = await hotel.resolveData()
	}

	res.json({
		success: true,
		data: hotelData
	})
})

/**
 * Create hotel
 * Creates a partner-type hotel (partner's own hotel)
 */
export const createHotel = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)

	if (!partnerId) {
		throw new BadRequestError('PARTNER_REQUIRED')
	}

	// Verify partner exists
	const partner = await Partner.findById(partnerId)
	if (!partner) {
		throw new NotFoundError('PARTNER_NOT_FOUND')
	}

	const hotel = await Hotel.create({
		...req.body,
		partner: partnerId,
		hotelType: 'partner', // Partner's own hotel
		hotelBase: null,
		createdBy: req.user._id
	})

	logger.info(`Hotel created: ${hotel.name} by partner ${partnerId}`)

	// Create default market for the hotel
	try {
		await Market.create({
			partner: partnerId,
			hotel: hotel._id,
			code: 'DEF',
			name: {
				tr: 'Varsayılan Pazar',
				en: 'Default Market'
			},
			currency: 'TRY',
			countries: [], // Empty = all countries
			isDefault: true,
			status: 'active',
			paymentTerms: {
				prepaymentRequired: true,
				prepaymentPercentage: 100
			},
			salesChannels: {
				b2c: true,
				b2b: true
			}
		})
		logger.info(`Default market created for hotel ${hotel._id}`)
	} catch (marketError) {
		logger.warn(`Failed to create default market for hotel ${hotel._id}: ${marketError.message}`)
	}

	res.status(201).json({
		success: true,
		message: req.t('HOTEL_CREATED'),
		data: hotel
	})
})

/**
 * Update hotel
 * For linked hotels, only partner settings can be updated (not hotel data)
 */
export const updateHotel = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { id } = req.params

	if (!partnerId) {
		throw new BadRequestError('PARTNER_REQUIRED')
	}

	const hotel = await verifyHotelOwnership(id, partnerId)

	// Fields that can be updated depend on hotel type
	let allowedFields

	if (hotel.hotelType === 'linked') {
		// Linked hotels: only partner settings can be updated
		// Hotel data (name, description, etc.) comes from base hotel
		allowedFields = [
			'status', 'visibility', 'pricingSettings', 'seo',
			'policies', // Only useBaseDefaults and overrides
			'featured', 'displayOrder'
		]
	} else {
		// Partner hotels: all fields can be updated
		allowedFields = [
			'name', 'description', 'slug', 'logo', 'stars', 'type', 'category',
			'visibility', 'address', 'location', 'contact', 'amenities', 'policies',
			'roomConfig', 'pricingSettings', 'seo', 'profile', 'tags',
			'featured', 'displayOrder'
		]
	}

	allowedFields.forEach(field => {
		if (req.body[field] !== undefined) {
			if (typeof req.body[field] === 'object' && !Array.isArray(req.body[field])) {
				// Merge objects
				hotel[field] = { ...hotel[field]?.toObject?.() || hotel[field], ...req.body[field] }
			} else {
				hotel[field] = req.body[field]
			}
		}
	})

	hotel.updatedBy = req.user._id
	await hotel.save()

	logger.info(`Hotel updated: ${hotel._id}`)

	res.json({
		success: true,
		message: req.t('HOTEL_UPDATED'),
		data: hotel
	})
})

/**
 * Delete hotel
 */
export const deleteHotel = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { id } = req.params

	if (!partnerId) {
		throw new BadRequestError('PARTNER_REQUIRED')
	}

	const hotel = await verifyHotelOwnership(id, partnerId)

	// TODO: Check if hotel has active bookings before deleting

	// Delete all hotel images from disk
	if (hotel.images && hotel.images.length > 0) {
		hotel.images.forEach(image => {
			try {
				const filename = image.url.split('/').pop()
				deleteHotelFile(partnerId, hotel._id, filename)
			} catch (err) {
				logger.warn(`Failed to delete hotel image: ${err.message}`)
			}
		})
	}

	await hotel.deleteOne()

	logger.info(`Hotel deleted: ${id}`)

	res.json({
		success: true,
		message: req.t('HOTEL_DELETED')
	})
})

/**
 * Update hotel status
 */
export const updateHotelStatus = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { id } = req.params
	const { status } = req.body

	if (!partnerId) {
		throw new BadRequestError('PARTNER_REQUIRED')
	}

	if (!['draft', 'active', 'inactive'].includes(status)) {
		throw new BadRequestError('INVALID_STATUS')
	}

	const hotel = await verifyHotelOwnership(id, partnerId)

	hotel.status = status
	await hotel.save()

	const messageKey = status === 'active' ? 'HOTEL_ACTIVATED' :
	                   status === 'inactive' ? 'HOTEL_DEACTIVATED' : 'HOTEL_STATUS_UPDATED'

	res.json({
		success: true,
		message: req.t(messageKey),
		data: hotel
	})
})

/**
 * Upload hotel image
 */
export const uploadHotelImage = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { id } = req.params

	if (!partnerId) {
		throw new BadRequestError('PARTNER_REQUIRED')
	}

	if (!req.file) {
		throw new BadRequestError('FILE_REQUIRED')
	}

	const hotel = await verifyHotelOwnership(id, partnerId)

	const fileUrl = getHotelFileUrl(partnerId, id, req.file.filename)

	// Add image to hotel
	const newImage = {
		url: fileUrl,
		caption: req.body.caption ? JSON.parse(req.body.caption) : { tr: '', en: '' },
		order: hotel.images.length,
		isMain: hotel.images.length === 0 // First image is main by default
	}

	hotel.images.push(newImage)
	await hotel.save()

	logger.info(`Image uploaded for hotel ${id}`)

	res.json({
		success: true,
		message: req.t('IMAGE_UPLOADED'),
		data: {
			image: hotel.images[hotel.images.length - 1],
			hotel
		}
	})
})

/**
 * Delete hotel image
 */
export const deleteHotelImage = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { id, imageId } = req.params

	if (!partnerId) {
		throw new BadRequestError('PARTNER_REQUIRED')
	}

	const hotel = await verifyHotelOwnership(id, partnerId)

	const imageIndex = hotel.images.findIndex(img => img._id.toString() === imageId)
	if (imageIndex === -1) {
		throw new NotFoundError('IMAGE_NOT_FOUND')
	}

	const image = hotel.images[imageIndex]

	// Delete file from disk
	try {
		const filename = image.url.split('/').pop()
		deleteHotelFile(partnerId, id, filename)
	} catch (err) {
		logger.warn(`Failed to delete image file: ${err.message}`)
	}

	// Remove from array
	const wasMain = image.isMain
	hotel.images.splice(imageIndex, 1)

	// If deleted image was main, set first image as main
	if (wasMain && hotel.images.length > 0) {
		hotel.images[0].isMain = true
	}

	await hotel.save()

	res.json({
		success: true,
		message: req.t('IMAGE_DELETED'),
		data: hotel
	})
})

/**
 * Reorder hotel images
 */
export const reorderHotelImages = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { id } = req.params
	const { imageIds } = req.body // Array of image IDs in new order

	if (!partnerId) {
		throw new BadRequestError('PARTNER_REQUIRED')
	}

	if (!Array.isArray(imageIds)) {
		throw new BadRequestError('INVALID_IMAGE_IDS')
	}

	const hotel = await verifyHotelOwnership(id, partnerId)

	// Reorder images based on provided IDs
	const reorderedImages = []
	imageIds.forEach((imgId, index) => {
		const image = hotel.images.find(img => img._id.toString() === imgId)
		if (image) {
			image.order = index
			reorderedImages.push(image)
		}
	})

	// Add any images not in the list at the end
	hotel.images.forEach(img => {
		if (!imageIds.includes(img._id.toString())) {
			img.order = reorderedImages.length
			reorderedImages.push(img)
		}
	})

	hotel.images = reorderedImages
	await hotel.save()

	res.json({
		success: true,
		message: req.t('IMAGES_REORDERED'),
		data: hotel
	})
})

/**
 * Set main image
 */
export const setMainImage = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { id, imageId } = req.params

	if (!partnerId) {
		throw new BadRequestError('PARTNER_REQUIRED')
	}

	const hotel = await verifyHotelOwnership(id, partnerId)

	const imageIndex = hotel.images.findIndex(img => img._id.toString() === imageId)
	if (imageIndex === -1) {
		throw new NotFoundError('IMAGE_NOT_FOUND')
	}

	// Reset all isMain to false
	hotel.images.forEach(img => {
		img.isMain = false
	})

	// Set the selected image as main
	hotel.images[imageIndex].isMain = true

	await hotel.save()

	res.json({
		success: true,
		message: req.t('MAIN_IMAGE_SET'),
		data: hotel
	})
})

/**
 * Upload hotel logo
 */
export const uploadHotelLogo = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { id } = req.params

	if (!partnerId) {
		throw new BadRequestError('PARTNER_REQUIRED')
	}

	if (!req.file) {
		throw new BadRequestError('FILE_REQUIRED')
	}

	const hotel = await verifyHotelOwnership(id, partnerId)

	// Delete old logo if exists
	if (hotel.logo) {
		try {
			const oldFilename = hotel.logo.split('/').pop()
			deleteHotelFile(partnerId, id, oldFilename)
		} catch (err) {
			logger.warn(`Failed to delete old logo: ${err.message}`)
		}
	}

	const fileUrl = getHotelFileUrl(partnerId, id, req.file.filename)
	hotel.logo = fileUrl
	await hotel.save()

	logger.info(`Logo uploaded for hotel ${id}`)

	res.json({
		success: true,
		message: req.t('LOGO_UPLOADED'),
		data: {
			logo: fileUrl,
			hotel
		}
	})
})

/**
 * Delete hotel logo
 */
export const deleteHotelLogo = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { id } = req.params

	if (!partnerId) {
		throw new BadRequestError('PARTNER_REQUIRED')
	}

	const hotel = await verifyHotelOwnership(id, partnerId)

	if (!hotel.logo) {
		throw new NotFoundError('LOGO_NOT_FOUND')
	}

	// Delete file from disk
	try {
		const filename = hotel.logo.split('/').pop()
		deleteHotelFile(partnerId, id, filename)
	} catch (err) {
		logger.warn(`Failed to delete logo file: ${err.message}`)
	}

	hotel.logo = ''
	await hotel.save()

	res.json({
		success: true,
		message: req.t('LOGO_DELETED'),
		data: hotel
	})
})

/**
 * Get cities with hotel count (for filtering)
 */
export const getHotelCities = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)

	if (!partnerId) {
		throw new BadRequestError('PARTNER_REQUIRED')
	}

	const cities = await Hotel.aggregate([
		{ $match: { partner: partnerId } },
		{ $group: {
			_id: '$address.city',
			count: { $sum: 1 }
		}},
		{ $match: { _id: { $ne: null } } },
		{ $sort: { count: -1 } }
	])

	res.json({
		success: true,
		data: cities.map(c => ({
			city: c._id,
			count: c.count
		}))
	})
})

// ===== HotelBase Functions (SuperAdmin) =====

/**
 * Get all base hotels (SuperAdmin only)
 */
export const getBaseHotels = asyncHandler(async (req, res) => {
	const { status, stars, city, search, page = 1, limit = 20 } = req.query

	// Build filter
	const filter = { hotelType: 'base' }

	if (status) {
		filter.status = status
	}

	if (stars) {
		filter.stars = parseInt(stars)
	}

	if (city) {
		filter['location.city'] = city
	}

	if (search) {
		filter.$or = [
			{ name: { $regex: search, $options: 'i' } },
			{ 'address.city': { $regex: search, $options: 'i' } }
		]
	}

	const skip = (parseInt(page) - 1) * parseInt(limit)
	const total = await Hotel.countDocuments(filter)

	const hotels = await Hotel.find(filter)
		.populate('location.city', 'name countryCode')
		.sort({ stars: -1, name: 1 })
		.skip(skip)
		.limit(parseInt(limit))
		.select('-__v')
		.lean()

	// Get linked counts for all base hotels in one query
	const hotelIds = hotels.map((h) => h._id)
	const linkedCounts = await Hotel.aggregate([
		{
			$match: {
				hotelBase: { $in: hotelIds },
				hotelType: 'linked'
			}
		},
		{
			$group: {
				_id: '$hotelBase',
				count: { $sum: 1 }
			}
		}
	])

	// Create a map for quick lookup
	const linkedCountMap = {}
	linkedCounts.forEach((item) => {
		linkedCountMap[item._id.toString()] = item.count
	})

	// Add linkedCount to each hotel
	const hotelsWithLinkedCount = hotels.map((hotel) => ({
		...hotel,
		linkedCount: linkedCountMap[hotel._id.toString()] || 0
	}))

	res.json({
		success: true,
		data: {
			items: hotelsWithLinkedCount,
			pagination: {
				page: parseInt(page),
				limit: parseInt(limit),
				total,
				pages: Math.ceil(total / parseInt(limit))
			}
		}
	})
})

/**
 * Get single base hotel (SuperAdmin only)
 */
export const getBaseHotel = asyncHandler(async (req, res) => {
	const { id } = req.params

	const hotel = await Hotel.findOne({ _id: id, hotelType: 'base' })
		.populate('location.city', 'name countryCode')
		.populate('location.district', 'name')
		.populate('location.tourismRegions', 'name')
		.populate('tags', 'name slug')

	if (!hotel) {
		throw new NotFoundError('HOTEL_NOT_FOUND')
	}

	// Get linked hotels count
	const linkedCount = await Hotel.countDocuments({ hotelBase: id, hotelType: 'linked' })

	res.json({
		success: true,
		data: {
			...hotel.toObject(),
			_linkedCount: linkedCount
		}
	})
})

/**
 * Get linked partners for a base hotel (SuperAdmin only)
 */
export const getLinkedPartners = asyncHandler(async (req, res) => {
	const { id } = req.params

	// Verify it's a base hotel
	const baseHotel = await Hotel.findOne({ _id: id, hotelType: 'base' })
	if (!baseHotel) {
		throw new NotFoundError('BASE_HOTEL_NOT_FOUND')
	}

	// Get all linked hotels with partner info
	const linkedHotels = await Hotel.find({ hotelBase: id, hotelType: 'linked' })
		.populate('partner', 'companyName email phone logo status')
		.select('partner status createdAt')
		.lean()

	// Format response
	const partners = linkedHotels.map((h) => ({
		hotelId: h._id,
		hotelStatus: h.status,
		linkedAt: h.createdAt,
		partner: h.partner
	}))

	res.json({
		success: true,
		data: {
			baseHotel: {
				_id: baseHotel._id,
				name: baseHotel.name
			},
			partners
		}
	})
})

/**
 * Create base hotel (SuperAdmin only)
 */
export const createBaseHotel = asyncHandler(async (req, res) => {
	// Extract external image URLs before creating hotel
	const { externalImages, externalLogo, roomTemplates, ...hotelData } = req.body

	// Process room templates - extract external images for later processing
	const roomTemplatesWithExternalImages = []
	const processedRoomTemplates = (roomTemplates || []).map(rt => {
		if (rt.externalImages?.length) {
			roomTemplatesWithExternalImages.push({
				code: rt.code,
				externalImages: rt.externalImages
			})
		}
		// Remove externalImages from the template data before saving
		const { externalImages: _, ...templateData } = rt
		return {
			...templateData,
			images: [] // Start with empty, will populate after download
		}
	})

	// Resolve hierarchical location from address data
	if (hotelData.address?.city && !hotelData.location?.city) {
		try {
			// Find city by name (case-insensitive, partial match)
			const cityName = hotelData.address.city.trim()
			const city = await City.findOne({
				$or: [
					{ name: { $regex: new RegExp(`^${cityName}$`, 'i') } },
					{ name: { $regex: new RegExp(cityName, 'i') } }
				]
			})

			if (city) {
				hotelData.location = hotelData.location || {}
				hotelData.location.city = city._id
				hotelData.location.countryCode = city.countryCode
				logger.info(`Resolved location: ${cityName} -> City ID ${city._id} (${city.countryCode})`)
			} else {
				logger.warn(`Could not find city in database: ${cityName}`)
			}
		} catch (err) {
			logger.error(`Error resolving location: ${err.message}`)
		}
	}

	const hotel = await Hotel.create({
		...hotelData,
		roomTemplates: processedRoomTemplates,
		hotelType: 'base',
		status: 'active', // Base hotels are active by default for partner selection
		partner: null,
		hotelBase: null,
		createdBy: req.user._id
	})

	logger.info(`Base hotel created: ${hotel.name} by SuperAdmin ${req.user._id}`)

	let needsSave = false

	// Download external images (wait for completion so they appear immediately)
	if (externalImages?.length || externalLogo) {
		try {
			// Download logo
			if (externalLogo) {
				const logoPath = await downloadHotelLogo(externalLogo, hotel._id)
				if (logoPath) {
					hotel.logo = logoPath
					needsSave = true
				}
			}

			// Download gallery images
			if (externalImages?.length) {
				const downloadedImages = await downloadHotelImages(externalImages, hotel._id)
				if (downloadedImages.length) {
					hotel.images = downloadedImages
					needsSave = true
				}
			}

			logger.info(`Hotel images saved: logo=${!!hotel.logo}, gallery=${hotel.images?.length || 0}`)
		} catch (error) {
			logger.error(`Error downloading hotel images for ${hotel._id}: ${error.message}`)
		}
	}

	// Download room template images
	if (roomTemplatesWithExternalImages.length) {
		try {
			for (const rtData of roomTemplatesWithExternalImages) {
				const downloadedImages = await downloadRoomTemplateImages(
					rtData.externalImages,
					hotel._id.toString(),
					rtData.code
				)

				if (downloadedImages.length) {
					// Find the template in hotel.roomTemplates and update its images
					const templateIndex = hotel.roomTemplates.findIndex(t => t.code === rtData.code)
					if (templateIndex !== -1) {
						hotel.roomTemplates[templateIndex].images = downloadedImages
						needsSave = true
					}
				}
			}

			logger.info(`Room template images processed for hotel ${hotel._id}`)
		} catch (error) {
			logger.error(`Error downloading room template images for hotel ${hotel._id}: ${error.message}`)
		}
	}

	// Save if we downloaded any images
	if (needsSave) {
		await hotel.save()
		logger.info(`Hotel ${hotel._id} saved with all images`)
	}

	res.status(201).json({
		success: true,
		message: req.t('HOTEL_CREATED'),
		data: hotel
	})
})

/**
 * Update base hotel (SuperAdmin only)
 */
export const updateBaseHotel = asyncHandler(async (req, res) => {
	const { id } = req.params

	const hotel = await Hotel.findOne({ _id: id, hotelType: 'base' })
	if (!hotel) {
		throw new NotFoundError('HOTEL_NOT_FOUND')
	}

	// All hotel data fields can be updated
	const allowedFields = [
		'name', 'description', 'slug', 'logo', 'stars', 'type', 'category',
		'status', 'address', 'location', 'contact', 'amenities', 'policies',
		'roomConfig', 'profile', 'tags'
	]

	allowedFields.forEach(field => {
		if (req.body[field] !== undefined) {
			// Don't overwrite logo/images with empty values if they already exist
			if (field === 'logo' && !req.body[field] && hotel.logo) {
				return // Keep existing logo
			}
			// Special handling for location to properly set tourismRegions array
			if (field === 'location') {
				hotel.location = {
					countryCode: req.body.location.countryCode || hotel.location?.countryCode,
					city: req.body.location.city || hotel.location?.city,
					tourismRegions: req.body.location.tourismRegions || hotel.location?.tourismRegions || []
				}
				logger.info(`Location updated: ${JSON.stringify(hotel.location)}`)
			} else if (typeof req.body[field] === 'object' && !Array.isArray(req.body[field])) {
				hotel[field] = { ...hotel[field]?.toObject?.() || hotel[field], ...req.body[field] }
			} else {
				hotel[field] = req.body[field]
			}
		}
	})

	// Don't overwrite images with empty array if they already exist
	if (req.body.images !== undefined && Array.isArray(req.body.images) && req.body.images.length === 0 && hotel.images?.length) {
		// Keep existing images
	} else if (req.body.images !== undefined) {
		hotel.images = req.body.images
	}

	hotel.updatedBy = req.user._id
	await hotel.save()

	logger.info(`Base hotel updated: ${hotel._id}`)

	res.json({
		success: true,
		message: req.t('HOTEL_UPDATED'),
		data: hotel
	})
})

/**
 * Delete base hotel (SuperAdmin only)
 * Cannot delete if there are linked hotels
 */
export const deleteBaseHotel = asyncHandler(async (req, res) => {
	const { id } = req.params

	const hotel = await Hotel.findOne({ _id: id, hotelType: 'base' })
	if (!hotel) {
		throw new NotFoundError('HOTEL_NOT_FOUND')
	}

	// Check for linked hotels
	const linkedCount = await Hotel.countDocuments({ hotelBase: id, hotelType: 'linked' })
	if (linkedCount > 0) {
		throw new BadRequestError('CANNOT_DELETE_BASE_WITH_LINKED_HOTELS')
	}

	// Delete images from disk (base hotels don't have partner folder)
	// TODO: Implement base hotel image storage

	await hotel.deleteOne()

	logger.info(`Base hotel deleted: ${id}`)

	res.json({
		success: true,
		message: req.t('HOTEL_DELETED')
	})
})

// ===== Partner-HotelBase Link Functions =====

/**
 * Get available base hotels for partner to link
 */
export const getAvailableBases = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { city, stars, search, page = 1, limit = 20 } = req.query

	if (!partnerId) {
		throw new BadRequestError('PARTNER_REQUIRED')
	}

	// Get base hotels that partner hasn't already linked
	const linkedBaseIds = await Hotel.find({
		partner: partnerId,
		hotelType: 'linked'
	}).distinct('hotelBase')

	// Build filter
	const filter = {
		hotelType: 'base',
		status: 'active',
		_id: { $nin: linkedBaseIds }
	}

	if (city) {
		filter['location.city'] = city
	}

	if (stars) {
		filter.stars = parseInt(stars)
	}

	if (search) {
		filter.$or = [
			{ name: { $regex: search, $options: 'i' } },
			{ 'address.city': { $regex: search, $options: 'i' } }
		]
	}

	const skip = (parseInt(page) - 1) * parseInt(limit)
	const total = await Hotel.countDocuments(filter)

	const hotels = await Hotel.find(filter)
		.populate('location.city', 'name countryCode')
		.sort({ stars: -1, name: 1 })
		.skip(skip)
		.limit(parseInt(limit))
		.select('name stars type category address location images logo')

	res.json({
		success: true,
		data: {
			items: hotels,
			pagination: {
				page: parseInt(page),
				limit: parseInt(limit),
				total,
				pages: Math.ceil(total / parseInt(limit))
			}
		}
	})
})

/**
 * Link partner to a base hotel (create linked hotel)
 */
export const linkToBase = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { baseId } = req.params

	if (!partnerId) {
		throw new BadRequestError('PARTNER_REQUIRED')
	}

	// Verify base hotel exists
	const baseHotel = await Hotel.findOne({ _id: baseId, hotelType: 'base', status: 'active' })
	if (!baseHotel) {
		throw new NotFoundError('BASE_HOTEL_NOT_FOUND')
	}

	// Check if partner already linked this base
	const alreadyLinked = await Hotel.isBaseAlreadyLinked(partnerId, baseId)
	if (alreadyLinked) {
		throw new BadRequestError('BASE_ALREADY_LINKED')
	}

	// Create linked hotel with partner settings
	const linkedHotel = await Hotel.create({
		hotelType: 'linked',
		partner: partnerId,
		hotelBase: baseId,
		// Copy required fields from base hotel
		name: baseHotel.name,
		slug: baseHotel.slug,
		stars: baseHotel.stars,
		address: baseHotel.address,
		location: baseHotel.location,
		// Partner settings (defaults)
		status: 'draft',
		visibility: { b2c: true, b2b: true },
		pricingSettings: {
			model: 'net',
			defaultMarkup: 20,
			defaultCommission: 15,
			currency: 'EUR',
			taxIncluded: true,
			taxRate: 10
		},
		policies: {
			useBaseDefaults: true
		},
		seo: { title: {}, description: {}, keywords: {} },
		featured: false,
		displayOrder: 0,
		createdBy: req.user._id
	})

	logger.info(`Partner ${partnerId} linked to base hotel ${baseId}`)

	// Create default market for the linked hotel
	try {
		await Market.create({
			partner: partnerId,
			hotel: linkedHotel._id,
			code: 'DEF',
			name: {
				tr: 'Varsayılan Pazar',
				en: 'Default Market'
			},
			currency: 'TRY',
			countries: [], // Empty = all countries
			isDefault: true,
			status: 'active',
			paymentTerms: {
				prepaymentRequired: true,
				prepaymentPercentage: 100
			},
			salesChannels: {
				b2c: true,
				b2b: true
			}
		})
		logger.info(`Default market created for linked hotel ${linkedHotel._id}`)
	} catch (marketError) {
		logger.warn(`Failed to create default market for linked hotel ${linkedHotel._id}: ${marketError.message}`)
	}

	// Return resolved data
	const resolvedData = await linkedHotel.resolveData()

	res.status(201).json({
		success: true,
		message: req.t('HOTEL_LINKED'),
		data: resolvedData
	})
})

/**
 * Unlink from base (convert linked hotel to partner hotel)
 * Copies base hotel data to partner hotel
 */
export const unlinkFromBase = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { id } = req.params

	if (!partnerId) {
		throw new BadRequestError('PARTNER_REQUIRED')
	}

	const hotel = await verifyHotelOwnership(id, partnerId)

	if (hotel.hotelType !== 'linked') {
		throw new BadRequestError('HOTEL_NOT_LINKED')
	}

	// Get base hotel data
	const baseHotel = await Hotel.findById(hotel.hotelBase)
	if (!baseHotel) {
		throw new NotFoundError('BASE_HOTEL_NOT_FOUND')
	}

	// Copy base hotel data to this hotel
	hotel.name = baseHotel.name
	hotel.description = baseHotel.description
	hotel.logo = baseHotel.logo
	hotel.stars = baseHotel.stars
	hotel.type = baseHotel.type
	hotel.category = baseHotel.category
	hotel.address = baseHotel.address
	hotel.location = baseHotel.location
	hotel.contact = baseHotel.contact
	hotel.images = baseHotel.images
	hotel.amenities = baseHotel.amenities
	hotel.roomConfig = baseHotel.roomConfig
	hotel.profile = baseHotel.profile
	hotel.tags = baseHotel.tags

	// Copy policies if using base defaults
	if (hotel.policies.useBaseDefaults) {
		hotel.policies = {
			...baseHotel.policies,
			useBaseDefaults: false
		}
	}

	// Convert to partner hotel
	hotel.hotelType = 'partner'
	hotel.hotelBase = null
	hotel.updatedBy = req.user._id

	await hotel.save()

	logger.info(`Hotel ${id} unlinked from base, converted to partner hotel`)

	res.json({
		success: true,
		message: req.t('HOTEL_UNLINKED'),
		data: hotel
	})
})

/**
 * Promote partner hotel to base hotel (SuperAdmin only)
 * Creates a new base hotel from partner hotel data
 */
export const promoteToBase = asyncHandler(async (req, res) => {
	const { id } = req.params

	const hotel = await Hotel.findById(id)
	if (!hotel) {
		throw new NotFoundError('HOTEL_NOT_FOUND')
	}

	if (hotel.hotelType !== 'partner') {
		throw new BadRequestError('ONLY_PARTNER_HOTELS_CAN_BE_PROMOTED')
	}

	// Create base hotel with same data
	const baseHotel = await Hotel.create({
		hotelType: 'base',
		partner: null,
		hotelBase: null,
		// Copy all hotel data
		name: hotel.name,
		description: hotel.description,
		slug: hotel.slug ? `${hotel.slug}-base` : null, // Avoid slug conflict
		logo: hotel.logo,
		stars: hotel.stars,
		type: hotel.type,
		category: hotel.category,
		status: 'active',
		address: hotel.address,
		location: hotel.location,
		contact: hotel.contact,
		images: hotel.images,
		amenities: hotel.amenities,
		policies: hotel.policies,
		roomConfig: hotel.roomConfig,
		profile: hotel.profile,
		tags: hotel.tags,
		createdBy: req.user._id
	})

	// Convert original hotel to linked
	hotel.hotelType = 'linked'
	hotel.hotelBase = baseHotel._id
	hotel.policies.useBaseDefaults = true
	hotel.updatedBy = req.user._id
	await hotel.save()

	logger.info(`Partner hotel ${id} promoted to base hotel ${baseHotel._id}`)

	res.json({
		success: true,
		message: req.t('HOTEL_PROMOTED'),
		data: {
			baseHotel,
			linkedHotel: hotel
		}
	})
})

// ===== AI Hotel Data Extraction (SuperAdmin only) =====

// Store for ongoing extractions (in production, use Redis)
const ongoingExtractions = new Map()

/**
 * Start AI extraction with real-time progress
 * Returns an operation ID for socket progress tracking
 */
export const startAiExtraction = asyncHandler(async (req, res) => {
	const { url, contentType } = req.body

	if (contentType !== 'url' || !url) {
		throw new BadRequestError('URL_REQUIRED')
	}

	// Generate unique operation ID
	const operationId = crypto.randomUUID()

	// Create progress emitter
	const progress = new ProgressEmitter(operationId, 'hotel-extract')

	// Store the operation
	ongoingExtractions.set(operationId, {
		status: 'pending',
		url,
		startTime: Date.now(),
		progress
	})

	// Return operation ID immediately so client can join socket room
	res.json({
		success: true,
		operationId,
		message: 'Extraction started. Join socket room to receive progress updates.'
	})

	// Start extraction in background (don't await)
	extractHotelDataFromUrl(url, { progress })
		.then(result => {
			// Store result
			ongoingExtractions.set(operationId, {
				status: 'completed',
				url,
				result,
				completedAt: Date.now()
			})

			// Clean up after 5 minutes
			setTimeout(() => {
				ongoingExtractions.delete(operationId)
			}, 5 * 60 * 1000)
		})
		.catch(error => {
			logger.error(`AI extraction failed for ${operationId}: ${error.message}`)
			progress.fail(error.message)

			ongoingExtractions.set(operationId, {
				status: 'failed',
				url,
				error: error.message,
				completedAt: Date.now()
			})

			// Clean up after 5 minutes
			setTimeout(() => {
				ongoingExtractions.delete(operationId)
			}, 5 * 60 * 1000)
		})
})

/**
 * Get extraction result by operation ID
 */
export const getExtractionResult = asyncHandler(async (req, res) => {
	const { operationId } = req.params

	const extraction = ongoingExtractions.get(operationId)
	if (!extraction) {
		throw new NotFoundError('EXTRACTION_NOT_FOUND')
	}

	res.json({
		success: true,
		status: extraction.status,
		data: extraction.result?.data || null,
		error: extraction.error || null
	})
})

/**
 * Extract hotel data from text, URL, or file content using AI
 * Synchronous version (waits for completion)
 * Returns structured hotel data for preview before creating
 */
export const aiExtractHotelData = asyncHandler(async (req, res) => {
	const { content, contentType, url, withProgress } = req.body

	// URL extraction - use Gemini's direct URL fetching
	if (contentType === 'url' && url) {
		logger.info(`AI extracting hotel data from URL: ${url}`)

		let progress = null

		// If client wants progress updates, create a progress emitter
		if (withProgress) {
			const operationId = crypto.randomUUID()
			progress = new ProgressEmitter(operationId, 'hotel-extract')

			// Return operation ID first for socket connection
			// Note: This changes the response flow - client must handle both patterns
		}

		const result = await extractHotelDataFromUrl(url, { progress })

		if (!result.success) {
			throw new BadRequestError(result.error || 'AI_EXTRACTION_FAILED')
		}

		return res.json({
			success: true,
			data: result.data,
			sourceUrl: url,
			crawledPages: result.crawledPages || []
		})
	}

	// Text or PDF content extraction
	if (!content || content.trim() === '') {
		throw new BadRequestError('CONTENT_REQUIRED')
	}

	logger.info(`AI extracting hotel data from ${contentType || 'text'} content`)
	const result = await extractHotelData(content, contentType || 'text')

	if (!result.success) {
		throw new BadRequestError(result.error || 'AI_EXTRACTION_FAILED')
	}

	res.json({
		success: true,
		data: result.data
	})
})

// ===== Room Template Functions (SuperAdmin - Base Hotels Only) =====

/**
 * Get all room templates for a base hotel
 */
export const getRoomTemplates = asyncHandler(async (req, res) => {
	const { id } = req.params

	const hotel = await Hotel.findOne({ _id: id, hotelType: 'base' })
	if (!hotel) {
		throw new NotFoundError('BASE_HOTEL_NOT_FOUND')
	}

	res.json({
		success: true,
		data: hotel.roomTemplates || []
	})
})

/**
 * Create a new room template
 */
export const createRoomTemplate = asyncHandler(async (req, res) => {
	const { id } = req.params
	const templateData = req.body

	const hotel = await Hotel.findOne({ _id: id, hotelType: 'base' })
	if (!hotel) {
		throw new NotFoundError('BASE_HOTEL_NOT_FOUND')
	}

	// Validate required fields
	if (!templateData.code) {
		throw new BadRequestError('ROOM_TEMPLATE_CODE_REQUIRED')
	}

	// Check for duplicate code
	const existingTemplate = hotel.roomTemplates?.find(
		rt => rt.code.toUpperCase() === templateData.code.toUpperCase()
	)
	if (existingTemplate) {
		throw new BadRequestError('ROOM_TEMPLATE_CODE_EXISTS')
	}

	// Set default order if not provided
	if (templateData.order === undefined) {
		templateData.order = hotel.roomTemplates?.length || 0
	}

	// Initialize roomTemplates if not exists
	if (!hotel.roomTemplates) {
		hotel.roomTemplates = []
	}

	hotel.roomTemplates.push(templateData)
	hotel.updatedBy = req.user._id
	await hotel.save()

	const newTemplate = hotel.roomTemplates[hotel.roomTemplates.length - 1]

	logger.info(`Room template created: ${templateData.code} for hotel ${id}`)

	res.status(201).json({
		success: true,
		message: req.t('ROOM_TEMPLATE_CREATED'),
		data: newTemplate
	})
})

/**
 * Update a room template
 */
export const updateRoomTemplate = asyncHandler(async (req, res) => {
	const { id, code } = req.params
	const updateData = req.body

	const hotel = await Hotel.findOne({ _id: id, hotelType: 'base' })
	if (!hotel) {
		throw new NotFoundError('BASE_HOTEL_NOT_FOUND')
	}

	const templateIndex = hotel.roomTemplates?.findIndex(
		rt => rt.code.toUpperCase() === code.toUpperCase()
	)
	if (templateIndex === -1) {
		throw new NotFoundError('ROOM_TEMPLATE_NOT_FOUND')
	}

	// Update allowed fields (code cannot be changed)
	const allowedFields = ['name', 'description', 'amenities', 'size', 'bedConfiguration', 'occupancy', 'order']
	allowedFields.forEach(field => {
		if (updateData[field] !== undefined) {
			hotel.roomTemplates[templateIndex][field] = updateData[field]
		}
	})

	hotel.updatedBy = req.user._id
	await hotel.save()

	logger.info(`Room template updated: ${code} for hotel ${id}`)

	res.json({
		success: true,
		message: req.t('ROOM_TEMPLATE_UPDATED'),
		data: hotel.roomTemplates[templateIndex]
	})
})

/**
 * Delete a room template
 */
export const deleteRoomTemplate = asyncHandler(async (req, res) => {
	const { id, code } = req.params

	const hotel = await Hotel.findOne({ _id: id, hotelType: 'base' })
	if (!hotel) {
		throw new NotFoundError('BASE_HOTEL_NOT_FOUND')
	}

	const templateIndex = hotel.roomTemplates?.findIndex(
		rt => rt.code.toUpperCase() === code.toUpperCase()
	)
	if (templateIndex === -1) {
		throw new NotFoundError('ROOM_TEMPLATE_NOT_FOUND')
	}

	const template = hotel.roomTemplates[templateIndex]

	// Delete template images from disk
	if (template.images?.length) {
		template.images.forEach(image => {
			try {
				const filename = image.url.split('/').pop()
				// Base hotels store images differently - delete from base hotel folder
				const imagePath = path.join(process.cwd(), 'uploads', 'hotels', 'base', id.toString(), 'rooms', code.toUpperCase(), filename)
				if (fs.existsSync(imagePath)) {
					fs.unlinkSync(imagePath)
				}
			} catch (err) {
				logger.warn(`Failed to delete room template image: ${err.message}`)
			}
		})
	}

	// Remove from array
	hotel.roomTemplates.splice(templateIndex, 1)
	hotel.updatedBy = req.user._id
	await hotel.save()

	logger.info(`Room template deleted: ${code} from hotel ${id}`)

	res.json({
		success: true,
		message: req.t('ROOM_TEMPLATE_DELETED')
	})
})

/**
 * Upload room template image
 */
export const uploadRoomTemplateImage = asyncHandler(async (req, res) => {
	const { id, code } = req.params

	if (!req.file) {
		throw new BadRequestError('FILE_REQUIRED')
	}

	const hotel = await Hotel.findOne({ _id: id, hotelType: 'base' })
	if (!hotel) {
		throw new NotFoundError('BASE_HOTEL_NOT_FOUND')
	}

	const templateIndex = hotel.roomTemplates?.findIndex(
		rt => rt.code.toUpperCase() === code.toUpperCase()
	)
	if (templateIndex === -1) {
		throw new NotFoundError('ROOM_TEMPLATE_NOT_FOUND')
	}

	const template = hotel.roomTemplates[templateIndex]

	// Initialize images array if not exists
	if (!template.images) {
		template.images = []
	}

	// Build file URL
	const fileUrl = `/uploads/hotels/base/${id}/rooms/${code.toUpperCase()}/${req.file.filename}`

	const newImage = {
		url: fileUrl,
		caption: req.body.caption ? JSON.parse(req.body.caption) : {},
		order: template.images.length,
		isMain: template.images.length === 0
	}

	template.images.push(newImage)
	hotel.updatedBy = req.user._id
	await hotel.save()

	logger.info(`Image uploaded for room template ${code} in hotel ${id}`)

	res.json({
		success: true,
		message: req.t('IMAGE_UPLOADED'),
		data: {
			image: template.images[template.images.length - 1],
			template
		}
	})
})

/**
 * Delete room template image
 */
export const deleteRoomTemplateImage = asyncHandler(async (req, res) => {
	const { id, code, imageId } = req.params

	const hotel = await Hotel.findOne({ _id: id, hotelType: 'base' })
	if (!hotel) {
		throw new NotFoundError('BASE_HOTEL_NOT_FOUND')
	}

	const templateIndex = hotel.roomTemplates?.findIndex(
		rt => rt.code.toUpperCase() === code.toUpperCase()
	)
	if (templateIndex === -1) {
		throw new NotFoundError('ROOM_TEMPLATE_NOT_FOUND')
	}

	const template = hotel.roomTemplates[templateIndex]

	const imageIndex = template.images?.findIndex(img => img._id.toString() === imageId)
	if (imageIndex === -1) {
		throw new NotFoundError('IMAGE_NOT_FOUND')
	}

	const image = template.images[imageIndex]

	// Delete file from disk
	try {
		const filename = image.url.split('/').pop()
		const imagePath = path.join(process.cwd(), 'uploads', 'hotels', 'base', id.toString(), 'rooms', code.toUpperCase(), filename)
		if (fs.existsSync(imagePath)) {
			fs.unlinkSync(imagePath)
		}
	} catch (err) {
		logger.warn(`Failed to delete room template image file: ${err.message}`)
	}

	// Remove from array
	const wasMain = image.isMain
	template.images.splice(imageIndex, 1)

	// If deleted image was main, set first as main
	if (wasMain && template.images.length > 0) {
		template.images[0].isMain = true
	}

	hotel.updatedBy = req.user._id
	await hotel.save()

	res.json({
		success: true,
		message: req.t('IMAGE_DELETED'),
		data: template
	})
})

/**
 * Set room template main image
 */
export const setRoomTemplateMainImage = asyncHandler(async (req, res) => {
	const { id, code, imageId } = req.params

	const hotel = await Hotel.findOne({ _id: id, hotelType: 'base' })
	if (!hotel) {
		throw new NotFoundError('BASE_HOTEL_NOT_FOUND')
	}

	const templateIndex = hotel.roomTemplates?.findIndex(
		rt => rt.code.toUpperCase() === code.toUpperCase()
	)
	if (templateIndex === -1) {
		throw new NotFoundError('ROOM_TEMPLATE_NOT_FOUND')
	}

	const template = hotel.roomTemplates[templateIndex]

	const imageIndex = template.images?.findIndex(img => img._id.toString() === imageId)
	if (imageIndex === -1) {
		throw new NotFoundError('IMAGE_NOT_FOUND')
	}

	// Reset all isMain to false
	template.images.forEach(img => {
		img.isMain = false
	})

	// Set selected as main
	template.images[imageIndex].isMain = true

	hotel.updatedBy = req.user._id
	await hotel.save()

	res.json({
		success: true,
		message: req.t('MAIN_IMAGE_SET'),
		data: template
	})
})

/**
 * Reorder room template images
 */
export const reorderRoomTemplateImages = asyncHandler(async (req, res) => {
	const { id, code } = req.params
	const { imageIds } = req.body

	if (!Array.isArray(imageIds)) {
		throw new BadRequestError('INVALID_IMAGE_IDS')
	}

	const hotel = await Hotel.findOne({ _id: id, hotelType: 'base' })
	if (!hotel) {
		throw new NotFoundError('BASE_HOTEL_NOT_FOUND')
	}

	const templateIndex = hotel.roomTemplates?.findIndex(
		rt => rt.code.toUpperCase() === code.toUpperCase()
	)
	if (templateIndex === -1) {
		throw new NotFoundError('ROOM_TEMPLATE_NOT_FOUND')
	}

	const template = hotel.roomTemplates[templateIndex]

	// Reorder images
	const reorderedImages = []
	imageIds.forEach((imgId, index) => {
		const image = template.images.find(img => img._id.toString() === imgId)
		if (image) {
			image.order = index
			reorderedImages.push(image)
		}
	})

	// Add any images not in the list at the end
	template.images.forEach(img => {
		if (!imageIds.includes(img._id.toString())) {
			img.order = reorderedImages.length
			reorderedImages.push(img)
		}
	})

	template.images = reorderedImages
	hotel.updatedBy = req.user._id
	await hotel.save()

	res.json({
		success: true,
		message: req.t('IMAGES_REORDERED'),
		data: template
	})
})

// ===== Partner Import Functions =====

/**
 * Get importable room templates from linked base hotel
 * For partners to import room templates as RoomTypes
 */
export const getImportableRooms = asyncHandler(async (req, res) => {
	const partnerId = getPartnerId(req)
	const { id } = req.params // Partner's hotel ID

	if (!partnerId) {
		throw new BadRequestError('PARTNER_REQUIRED')
	}

	const hotel = await verifyHotelOwnership(id, partnerId)

	// Must be a linked hotel
	if (hotel.hotelType !== 'linked' || !hotel.hotelBase) {
		throw new BadRequestError('HOTEL_NOT_LINKED')
	}

	// Get base hotel with room templates
	const baseHotel = await Hotel.findById(hotel.hotelBase).select('name roomTemplates')
	if (!baseHotel) {
		throw new NotFoundError('BASE_HOTEL_NOT_FOUND')
	}

	res.json({
		success: true,
		data: {
			baseHotel: {
				_id: baseHotel._id,
				name: baseHotel.name
			},
			roomTemplates: baseHotel.roomTemplates || []
		}
	})
})
