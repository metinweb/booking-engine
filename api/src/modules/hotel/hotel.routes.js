import express from 'express'
import * as hotelService from './hotel.service.js'
import { protect, requireAdmin } from '../../middleware/auth.js'
import { partnerContext } from '../../middlewares/partnerContext.js'
import { hotelUpload } from '../../helpers/hotelUpload.js'

const router = express.Router()

// All routes require authentication and admin role
router.use(protect)
router.use(requireAdmin)
router.use(partnerContext)

// Hotel CRUD
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
