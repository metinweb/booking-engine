/**
 * Room Template Service
 * SuperAdmin operations for base hotel room templates
 */

import fs from 'fs'
import path from 'path'
import Hotel from './hotel.model.js'
import { NotFoundError, BadRequestError } from '#core/errors.js'
import { asyncHandler } from '#helpers'
import logger from '#core/logger.js'

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
  const allowedFields = [
    'name',
    'description',
    'amenities',
    'size',
    'bedConfiguration',
    'occupancy',
    'order'
  ]
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
        const imagePath = path.join(
          process.cwd(),
          'uploads',
          'hotels',
          'base',
          id.toString(),
          'rooms',
          code.toUpperCase(),
          filename
        )
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
    const imagePath = path.join(
      process.cwd(),
      'uploads',
      'hotels',
      'base',
      id.toString(),
      'rooms',
      code.toUpperCase(),
      filename
    )
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
