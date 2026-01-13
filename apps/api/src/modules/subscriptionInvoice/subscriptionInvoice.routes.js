import express from 'express'
import * as invoiceService from './subscriptionInvoice.service.js'
import { protect, requireAdmin } from '#middleware/auth.js'

const router = express.Router()

// All routes require authentication and admin role
router.use(protect)
router.use(requireAdmin)

// List all invoices
router.get('/', invoiceService.getInvoices)

// Get statistics
router.get('/stats', invoiceService.getStats)

// Get single invoice
router.get('/:id', invoiceService.getInvoice)

// Download PDF
router.get('/:id/pdf', invoiceService.generatePDF)

// Update invoice status
router.patch('/:id/status', invoiceService.updateStatus)

// Get partner's invoices
router.get('/partner/:partnerId', invoiceService.getPartnerInvoices)

export default router
