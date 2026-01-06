import express from 'express'
import * as auditService from './audit.service.js'
import { protect, requirePlatformAdmin } from '#middleware/auth.js'

const router = express.Router()

// All audit routes require authentication and platform admin role
router.use(protect)
router.use(requirePlatformAdmin)

// List all audit logs with filtering and pagination
router.get('/', auditService.getAuditLogs)

// Get audit statistics
router.get('/stats', auditService.getAuditStats)

// Get recent activity (for dashboard widget)
router.get('/recent', auditService.getRecentActivity)

// Export audit logs
router.get('/export', auditService.exportAuditLogs)

// Get document history
router.get('/history/:collection/:documentId', auditService.getDocumentHistory)

// Get user activity
router.get('/user/:userId', auditService.getUserActivity)

// Get partner activity
router.get('/partner/:partnerId', auditService.getPartnerActivity)

// Get single audit log
router.get('/:id', auditService.getAuditLog)

export default router
