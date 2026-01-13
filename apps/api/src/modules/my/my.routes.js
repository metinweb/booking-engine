import express from 'express'
import * as myService from './my.service.js'
import { protect } from '#middleware/auth.js'

const router = express.Router()

// All routes require authentication (but not admin)
router.use(protect)

// Get my subscription info (for partner users)
router.get('/subscription', myService.getMySubscription)

// Get my invoices (for partner users)
router.get('/invoices', myService.getMyInvoices)

// Download invoice PDF (for partner users)
router.get('/invoices/:id/pdf', myService.downloadMyInvoicePDF)

export default router
