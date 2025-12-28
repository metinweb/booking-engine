import express from 'express'
import * as hotelService from './hotel.service.js'
import { protect, requireAdmin, requirePlatformAdmin } from '../../middleware/auth.js'
import { partnerContext } from '../../middlewares/partnerContext.js'
import { hotelUpload, roomTemplateUpload } from '../../helpers/hotelUpload.js'

const router = express.Router()

// All routes require authentication and admin role
router.use(protect)
router.use(requireAdmin)

// ===== HotelBase Routes (SuperAdmin only) =====
// These routes must come BEFORE partnerContext and general routes
router.get('/base', requirePlatformAdmin, hotelService.getBaseHotels)
router.get('/base/:id', requirePlatformAdmin, hotelService.getBaseHotel)
router.post('/base', requirePlatformAdmin, hotelService.createBaseHotel)
router.put('/base/:id', requirePlatformAdmin, hotelService.updateBaseHotel)
router.delete('/base/:id', requirePlatformAdmin, hotelService.deleteBaseHotel)
router.get('/base/:id/linked-partners', requirePlatformAdmin, hotelService.getLinkedPartners)

// ===== Room Template Routes (SuperAdmin only) =====
router.get('/base/:id/room-templates', requirePlatformAdmin, hotelService.getRoomTemplates)
router.post('/base/:id/room-templates', requirePlatformAdmin, hotelService.createRoomTemplate)
router.put('/base/:id/room-templates/:code', requirePlatformAdmin, hotelService.updateRoomTemplate)
router.delete('/base/:id/room-templates/:code', requirePlatformAdmin, hotelService.deleteRoomTemplate)

// Room Template Image Management (SuperAdmin only)
router.post('/base/:id/room-templates/:code/images', requirePlatformAdmin, roomTemplateUpload.single('image'), hotelService.uploadRoomTemplateImage)
router.delete('/base/:id/room-templates/:code/images/:imageId', requirePlatformAdmin, hotelService.deleteRoomTemplateImage)
router.patch('/base/:id/room-templates/:code/images/:imageId/main', requirePlatformAdmin, hotelService.setRoomTemplateMainImage)
router.patch('/base/:id/room-templates/:code/images/reorder', requirePlatformAdmin, hotelService.reorderRoomTemplateImages)

// AI Hotel Data Extraction (SuperAdmin only)
router.post('/ai-extract', requirePlatformAdmin, hotelService.aiExtractHotelData)
// Start async extraction with progress (returns operation ID for socket tracking)
router.post('/ai-extract/start', requirePlatformAdmin, hotelService.startAiExtraction)
// Get extraction result by operation ID
router.get('/ai-extract/:operationId', requirePlatformAdmin, hotelService.getExtractionResult)

// Promote partner hotel to base (SuperAdmin only)
router.post('/:id/promote', requirePlatformAdmin, hotelService.promoteToBase)

// Apply partner context for remaining routes
router.use(partnerContext)

// ===== Partner HotelBase Link Routes =====
// Get available base hotels for partner to select
router.get('/available-bases', hotelService.getAvailableBases)
// Link partner to a base hotel (create linked hotel)
router.post('/link/:baseId', hotelService.linkToBase)
// Unlink from base hotel (convert to partner hotel)
router.post('/:id/unlink', hotelService.unlinkFromBase)
// Get importable room templates from linked base hotel
router.get('/:id/importable-rooms', hotelService.getImportableRooms)

// ===== Partner Hotel CRUD =====
router.get('/', hotelService.getHotels)
router.get('/cities', hotelService.getHotelCities)
router.get('/:id', hotelService.getHotel)
router.post('/', hotelService.createHotel)
router.put('/:id', hotelService.updateHotel)
router.delete('/:id', hotelService.deleteHotel)

// Status management
router.patch('/:id/status', hotelService.updateHotelStatus)

// Image management
router.post('/:id/images', hotelUpload.single('image'), hotelService.uploadHotelImage)
router.delete('/:id/images/:imageId', hotelService.deleteHotelImage)
router.patch('/:id/images/reorder', hotelService.reorderHotelImages)
router.patch('/:id/images/:imageId/main', hotelService.setMainImage)

// Logo management
router.post('/:id/logo', hotelUpload.single('logo'), hotelService.uploadHotelLogo)
router.delete('/:id/logo', hotelService.deleteHotelLogo)

export default router
