/**
 * Hotel Image Service
 * Handles hotel image and logo operations
 */

import Hotel from './hotel.model.js'
import { NotFoundError, BadRequestError } from '#core/errors.js'
import { asyncHandler } from '#helpers'
import { getHotelFileUrl, deleteHotelFile } from '#helpers/hotelUpload.js'
import logger from '#core/logger.js'
import { getPartnerId, verifyHotelOwnership } from '#services/helpers.js'

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
