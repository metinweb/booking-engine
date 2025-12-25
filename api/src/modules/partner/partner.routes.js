import express from 'express'
import * as partnerService from './partner.service.js'
import { protect, requireAdmin } from '../../middleware/auth.js'
import { partnerContext } from '../../middlewares/partnerContext.js'
import upload from '../../helpers/upload.js'

const router = express.Router()

// All routes require authentication and admin role
router.use(protect)
router.use(requireAdmin)
router.use(partnerContext)

// CRUD routes
router.post('/', partnerService.createPartner)
router.get('/', partnerService.getPartners)
router.get('/:id', partnerService.getPartner)
router.put('/:id', partnerService.updatePartner)
router.delete('/:id', partnerService.deletePartner)

// Actions
router.post('/:id/activate', partnerService.activatePartner)
router.post('/:id/deactivate', partnerService.deactivatePartner)
router.post('/:id/approve', partnerService.approvePartner)

// Document upload
router.post('/:id/upload', upload.single('document'), partnerService.uploadDocument)
router.delete('/:id/documents/:documentId', partnerService.deleteDocument)

// Serve document (authenticated)
router.get('/:id/documents/:documentId/file', partnerService.serveDocument)

export default router
