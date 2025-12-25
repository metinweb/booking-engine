import Partner from './partner.model.js'
import User from '../user/user.model.js'
import Agency from '../agency/agency.model.js'
import { NotFoundError, ConflictError, BadRequestError } from '../../core/errors.js'
import { asyncHandler } from '../../helpers/asyncHandler.js'
import { sendWelcomeEmail } from '../../helpers/mail.js'
import crypto from 'crypto'
import logger from '../../core/logger.js'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Generate random password
const generatePassword = () => {
  return crypto.randomBytes(8).toString('hex')
}

// Create partner
export const createPartner = asyncHandler(async (req, res) => {
  const partner = await Partner.create(req.body)

  // Create admin user for partner
  const tempPassword = generatePassword()
  const adminUser = await User.create({
    accountType: 'partner',
    accountId: partner._id,
    name: req.body.companyName + ' Admin',
    email: req.body.email,
    password: tempPassword,
    role: 'admin',
    status: 'active'
  })

  // Send welcome email with credentials
  try {
    await sendWelcomeEmail({
      to: adminUser.email,
      name: adminUser.name,
      email: adminUser.email,
      password: tempPassword,
      accountType: 'Partner',
      loginUrl: partner.branding?.siteDomain
        ? `https://${partner.branding.siteDomain}/login`
        : 'https://admin.booking-engine.com/login'
    })
    logger.info(`Welcome email sent to partner admin: ${adminUser.email}`)
  } catch (error) {
    logger.error(`Failed to send welcome email: ${error.message}`)
  }

  res.status(201).json({
    success: true,
    message: req.t('PARTNER_CREATED'),
    data: {
      partner,
      adminUser: {
        email: adminUser.email,
        tempPassword // Remove this in production, only send via email
      }
    }
  })
})

// Get all partners
export const getPartners = asyncHandler(async (req, res) => {
  const { status, search, page = 1, limit = 20 } = req.query

  // Build filter
  const filter = {}
  if (status) filter.status = status
  if (search) {
    filter.$or = [
      { companyName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { 'branding.siteDomain': { $regex: search, $options: 'i' } }
    ]
  }

  // Pagination
  const skip = (page - 1) * limit
  const total = await Partner.countDocuments(filter)
  const partners = await Partner.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))

  res.json({
    success: true,
    data: {
      partners,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  })
})

// Get partner by ID
export const getPartner = asyncHandler(async (req, res) => {
  const partner = await Partner.findById(req.params.id)

  if (!partner) {
    throw new NotFoundError('PARTNER_NOT_FOUND')
  }

  res.json({
    success: true,
    data: partner
  })
})

// Update partner
export const updatePartner = asyncHandler(async (req, res) => {
  const partner = await Partner.findById(req.params.id)

  if (!partner) {
    throw new NotFoundError('PARTNER_NOT_FOUND')
  }

  // Update fields
  Object.assign(partner, req.body)
  await partner.save()

  res.json({
    success: true,
    message: req.t('PARTNER_UPDATED'),
    data: partner
  })
})

// Delete partner
export const deletePartner = asyncHandler(async (req, res) => {
  const partner = await Partner.findById(req.params.id)

  if (!partner) {
    throw new NotFoundError('PARTNER_NOT_FOUND')
  }

  // Check if partner has agencies - query database directly for accurate count
  const agenciesCount = await Agency.countDocuments({ partnerId: partner._id })
  if (agenciesCount > 0) {
    throw new ConflictError('PARTNER_HAS_AGENCIES')
  }

  // Also delete associated admin user
  await User.deleteMany({ accountType: 'partner', accountId: partner._id })

  await partner.deleteOne()

  res.json({
    success: true,
    message: req.t('PARTNER_DELETED')
  })
})

// Activate partner
export const activatePartner = asyncHandler(async (req, res) => {
  const partner = await Partner.findById(req.params.id)

  if (!partner) {
    throw new NotFoundError('PARTNER_NOT_FOUND')
  }

  await partner.activate()

  res.json({
    success: true,
    message: req.t('PARTNER_ACTIVATED'),
    data: partner
  })
})

// Deactivate partner
export const deactivatePartner = asyncHandler(async (req, res) => {
  const partner = await Partner.findById(req.params.id)

  if (!partner) {
    throw new NotFoundError('PARTNER_NOT_FOUND')
  }

  await partner.deactivate()

  res.json({
    success: true,
    message: req.t('PARTNER_DEACTIVATED'),
    data: partner
  })
})

// Approve partner (activate partner and user)
export const approvePartner = asyncHandler(async (req, res) => {
  const partner = await Partner.findById(req.params.id)

  if (!partner) {
    throw new NotFoundError('PARTNER_NOT_FOUND')
  }

  if (partner.status !== 'pending') {
    throw new ConflictError('PARTNER_NOT_PENDING')
  }

  // Activate partner
  await partner.activate()

  // Activate partner admin user
  await User.updateOne(
    { accountType: 'partner', accountId: partner._id, role: 'admin' },
    { status: 'active' }
  )

  // Note: Email notification will be sent via Partner model post-save hook

  res.json({
    success: true,
    message: req.t('PARTNER_APPROVED'),
    data: partner
  })
})

// Upload partner document
export const uploadDocument = asyncHandler(async (req, res) => {
  const partner = await Partner.findById(req.params.id)

  if (!partner) {
    throw new NotFoundError('PARTNER_NOT_FOUND')
  }

  if (!req.file) {
    throw new BadRequestError('NO_FILE_UPLOADED')
  }

  const { documentType } = req.body

  if (!documentType || !['license', 'certificate', 'other'].includes(documentType)) {
    throw new BadRequestError('INVALID_DOCUMENT_TYPE')
  }

  // Create document entry
  const document = {
    type: documentType,
    name: req.file.originalname,
    url: `/uploads/partners/${req.file.filename}`,
    uploadedAt: new Date()
  }

  // Add to partner documents
  partner.documents.push(document)
  await partner.save()

  res.json({
    success: true,
    message: req.t('DOCUMENT_UPLOADED'),
    data: {
      document,
      partner
    }
  })
})

// Delete partner document
export const deleteDocument = asyncHandler(async (req, res) => {
  const partner = await Partner.findById(req.params.id)

  if (!partner) {
    throw new NotFoundError('PARTNER_NOT_FOUND')
  }

  const documentId = req.params.documentId
  const documentIndex = partner.documents.findIndex(doc => doc._id.toString() === documentId)

  if (documentIndex === -1) {
    throw new NotFoundError('DOCUMENT_NOT_FOUND')
  }

  // Remove document
  partner.documents.splice(documentIndex, 1)
  await partner.save()

  res.json({
    success: true,
    message: req.t('DOCUMENT_DELETED'),
    data: partner
  })
})

// Serve partner document (authenticated)
export const serveDocument = asyncHandler(async (req, res) => {
  const partner = await Partner.findById(req.params.id)

  if (!partner) {
    throw new NotFoundError('PARTNER_NOT_FOUND')
  }

  const documentId = req.params.documentId
  const document = partner.documents.find(doc => doc._id.toString() === documentId)

  if (!document) {
    throw new NotFoundError('DOCUMENT_NOT_FOUND')
  }

  // Build file path
  const uploadsDir = path.join(__dirname, '../../../uploads')
  const filePath = path.join(uploadsDir, document.url.replace('/uploads/', ''))

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    throw new NotFoundError('FILE_NOT_FOUND')
  }

  // Get file extension to set content type
  const ext = path.extname(filePath).toLowerCase()
  const contentTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  }

  const contentType = contentTypes[ext] || 'application/octet-stream'

  // Set headers
  res.setHeader('Content-Type', contentType)
  res.setHeader('Content-Disposition', `inline; filename="${document.name}"`)

  // Stream file
  const fileStream = fs.createReadStream(filePath)
  fileStream.pipe(res)
})
