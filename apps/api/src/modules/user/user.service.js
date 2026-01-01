import User from './user.model.js'
import Partner from '../partner/partner.model.js'
import Agency from '../agency/agency.model.js'
import { NotFoundError, ForbiddenError, BadRequestError } from '../../core/errors.js'
import { asyncHandler } from '../../helpers/asyncHandler.js'
import { generate2FASecret, generateQRCode, verify2FAToken } from '../../helpers/twoFactor.js'
import { send2FASetupEmail } from '../../helpers/mail.js'
import logger from '../../core/logger.js'

// Create user
export const createUser = asyncHandler(async (req, res) => {
  const { accountType, accountId } = req.body

  // Verify permissions
  if (req.user.accountType === 'partner') {
    // Partner can only create users for their own account
    if (accountType !== 'partner' || accountId !== req.user.accountId.toString()) {
      throw new ForbiddenError('FORBIDDEN')
    }
  } else if (req.user.accountType === 'agency') {
    // Agency can only create users for their own account
    if (accountType !== 'agency' || accountId !== req.user.accountId.toString()) {
      throw new ForbiddenError('FORBIDDEN')
    }
  }
  // Platform admin can create users for anyone

  // Verify account exists
  if (accountType === 'partner') {
    const partner = await Partner.findById(accountId)
    if (!partner) throw new NotFoundError('PARTNER_NOT_FOUND')
  } else if (accountType === 'agency') {
    const agency = await Agency.findById(accountId)
    if (!agency) throw new NotFoundError('AGENCY_NOT_FOUND')
  }

  const user = await User.create(req.body)

  // Remove password from response
  const userObj = user.toObject()
  delete userObj.password

  res.status(201).json({
    success: true,
    message: req.t('USER_CREATED'),
    data: userObj
  })
})

// Get all users
export const getUsers = asyncHandler(async (req, res) => {
  const { accountType, accountId, status, search, role, page = 1, limit = 20 } = req.query

  // Build filter based on user permissions
  const filter = {}

  if (req.user.accountType === 'partner') {
    // Partner can only see their own users
    filter.accountType = 'partner'
    filter.accountId = req.user.accountId
  } else if (req.user.accountType === 'agency') {
    // Agency can only see their own users
    filter.accountType = 'agency'
    filter.accountId = req.user.accountId
  } else {
    // Platform admin can filter by accountType and accountId
    if (accountType) filter.accountType = accountType
    if (accountId) filter.accountId = accountId
  }

  // Additional filters
  if (status) filter.status = status
  if (role) filter.role = role
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ]
  }

  // Pagination
  const skip = (page - 1) * limit
  const total = await User.countDocuments(filter)
  const users = await User.find(filter)
    .populate('accountId')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))

  res.json({
    success: true,
    data: {
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  })
})

// Get user by ID
export const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).populate('accountId')

  if (!user) {
    throw new NotFoundError('USER_NOT_FOUND')
  }

  // Check permissions
  if (req.user.accountType === 'partner' || req.user.accountType === 'agency') {
    if (user.accountId._id.toString() !== req.user.accountId.toString()) {
      throw new ForbiddenError('FORBIDDEN')
    }
  }

  res.json({
    success: true,
    data: user
  })
})

// Update user
export const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)

  if (!user) {
    throw new NotFoundError('USER_NOT_FOUND')
  }

  // Check permissions
  if (req.user.accountType === 'partner' || req.user.accountType === 'agency') {
    if (user.accountId.toString() !== req.user.accountId.toString()) {
      throw new ForbiddenError('FORBIDDEN')
    }
  }

  // Prevent changing accountType and accountId
  if (req.body.accountType || req.body.accountId) {
    throw new BadRequestError('CANNOT_CHANGE_ACCOUNT')
  }

  // Prevent changing password through this endpoint
  if (req.body.password) {
    delete req.body.password
  }

  // Update fields
  Object.assign(user, req.body)
  await user.save()

  const userObj = user.toObject()
  delete userObj.password

  res.json({
    success: true,
    message: req.t('USER_UPDATED'),
    data: userObj
  })
})

// Delete user
export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)

  if (!user) {
    throw new NotFoundError('USER_NOT_FOUND')
  }

  // Check permissions
  if (req.user.accountType === 'partner' || req.user.accountType === 'agency') {
    if (user.accountId.toString() !== req.user.accountId.toString()) {
      throw new ForbiddenError('FORBIDDEN')
    }
  }

  // Cannot delete yourself
  if (user._id.toString() === req.user._id.toString()) {
    throw new BadRequestError('CANNOT_DELETE_YOURSELF')
  }

  await user.deleteOne()

  res.json({
    success: true,
    message: req.t('USER_DELETED')
  })
})

// Change password
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body
  const userId = req.params.id

  const user = await User.findById(userId).select('+password')

  if (!user) {
    throw new NotFoundError('USER_NOT_FOUND')
  }

  // Check permissions - can only change own password or if admin
  if (req.user.role !== 'admin' && user._id.toString() !== req.user._id.toString()) {
    throw new ForbiddenError('FORBIDDEN')
  }

  // If changing someone else's password (admin), don't require current password
  if (user._id.toString() !== req.user._id.toString()) {
    user.password = newPassword
  } else {
    // Changing own password, verify current password
    const isMatch = await user.comparePassword(currentPassword)
    if (!isMatch) {
      throw new BadRequestError('CURRENT_PASSWORD_INCORRECT')
    }
    user.password = newPassword
  }

  await user.save()

  res.json({
    success: true,
    message: req.t('PASSWORD_CHANGED')
  })
})

// Enable 2FA
export const enable2FA = asyncHandler(async (req, res) => {
  const userId = req.user._id

  const user = await User.findById(userId).select('+twoFactorSecret')

  if (!user) {
    throw new NotFoundError('USER_NOT_FOUND')
  }

  if (user.twoFactorEnabled) {
    throw new BadRequestError('2FA_ALREADY_ENABLED')
  }

  // Generate 2FA secret
  const { secret, otpauthUrl } = generate2FASecret(user.email)

  // Generate QR code
  const qrCodeDataUrl = await generateQRCode(otpauthUrl)

  // Save secret (not enabled yet, will be enabled after verification)
  user.twoFactorSecret = secret
  await user.save()

  // Send email with QR code
  try {
    await send2FASetupEmail({
      to: user.email,
      name: user.name,
      qrCodeUrl: qrCodeDataUrl,
      secretCode: secret
    })
  } catch (error) {
    // Email sending failed, but continue with setup
    logger.error('Failed to send 2FA setup email:', error)
  }

  res.json({
    success: true,
    data: {
      secret: secret,
      qrCode: qrCodeDataUrl,
      otpauthUrl: otpauthUrl
    }
  })
})

// Verify and confirm 2FA
export const verify2FA = asyncHandler(async (req, res) => {
  const { token } = req.body
  const userId = req.user._id

  if (!token) {
    throw new BadRequestError('REQUIRED_2FA_TOKEN')
  }

  const user = await User.findById(userId).select('+twoFactorSecret')

  if (!user || !user.twoFactorSecret) {
    throw new BadRequestError('2FA_NOT_ENABLED')
  }

  // Verify token
  const isValid = verify2FAToken(token, user.twoFactorSecret)

  if (!isValid) {
    throw new BadRequestError('INVALID_2FA_TOKEN')
  }

  // Enable 2FA
  user.twoFactorEnabled = true
  await user.save()

  res.json({
    success: true,
    message: req.t('2FA_ENABLED')
  })
})

// Disable 2FA
export const disable2FA = asyncHandler(async (req, res) => {
  const { token } = req.body
  const userId = req.user._id

  if (!token) {
    throw new BadRequestError('REQUIRED_2FA_TOKEN')
  }

  const user = await User.findById(userId).select('+twoFactorSecret')

  if (!user) {
    throw new NotFoundError('USER_NOT_FOUND')
  }

  if (!user.twoFactorEnabled) {
    throw new BadRequestError('2FA_NOT_ENABLED')
  }

  // Verify token before disabling
  const isValid = verify2FAToken(token, user.twoFactorSecret)

  if (!isValid) {
    throw new BadRequestError('INVALID_2FA_TOKEN')
  }

  // Disable 2FA
  user.twoFactorEnabled = false
  user.twoFactorSecret = undefined
  await user.save()

  res.json({
    success: true,
    message: req.t('2FA_DISABLED')
  })
})
