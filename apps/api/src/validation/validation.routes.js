/**
 * Validation Routes
 * Frontend'in validation schema'ya erişmesi için
 */

import { Router } from 'express'
import bookingValidation from './bookingValidation.js'

const router = Router()

/**
 * GET /api/validation/booking
 * Booking validation schema'sını döndür
 */
router.get('/booking', (req, res) => {
  res.json({
    success: true,
    data: bookingValidation.getSchemaForFrontend()
  })
})

/**
 * POST /api/validation/booking/validate
 * Booking verisini validate et (opsiyonel - debug için)
 */
router.post('/booking/validate', (req, res) => {
  const result = bookingValidation.validateBooking(req.body)
  res.json({
    success: result.valid,
    data: result
  })
})

export default router
