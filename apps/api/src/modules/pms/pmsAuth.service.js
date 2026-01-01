import jwt from 'jsonwebtoken'
import config from '../../config/index.js'
import PmsUser from './pmsUser.model.js'
import Hotel from '../hotel/hotel.model.js'
import Partner from '../partner/partner.model.js'
import { UnauthorizedError, BadRequestError, NotFoundError } from '../../core/errors.js'
import { asyncHandler } from '../../helpers/asyncHandler.js'

// Generate PMS JWT token
export const generatePmsToken = (user, hotelId) => {
  const payload = {
    pmsUserId: user._id,
    partnerId: user.partner,
    hotelId: hotelId,
    role: user.getRoleForHotel(hotelId),
    type: 'pms' // To distinguish from regular tokens
  }

  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: '12h' // PMS tokens valid for 12 hours (work shift)
  })
}

// Get partner by PMS domain (public endpoint for login page)
export const getPartnerByDomain = asyncHandler(async (req, res) => {
  const { domain } = req.query

  if (!domain) {
    throw new BadRequestError('DOMAIN_REQUIRED')
  }

  // Clean domain (remove protocol, www, trailing slashes)
  const cleanDomain = domain.toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '')

  // Find partner by PMS domain
  const partner = await Partner.findOne({
    'branding.pmsDomain': cleanDomain,
    status: 'active'
  }).select('_id companyName code branding.logo')

  if (!partner) {
    throw new NotFoundError('PARTNER_NOT_FOUND')
  }

  res.json({
    success: true,
    data: {
      partnerId: partner._id,
      partnerName: partner.companyName,
      partnerCode: partner.code,
      logo: partner.branding?.logo
    }
  })
})

// PMS Login
export const login = asyncHandler(async (req, res) => {
  const { username, password, partnerId, partnerCode, domain } = req.body

  // Validation
  if (!username || !password) {
    throw new BadRequestError('REQUIRED_USERNAME_PASSWORD')
  }

  if (!partnerId && !partnerCode && !domain) {
    throw new BadRequestError('REQUIRED_PARTNER_ID')
  }

  // Resolve partnerId from partnerCode or domain
  let resolvedPartnerId = partnerId

  // Try domain first (highest priority for custom domains)
  if (!resolvedPartnerId && domain) {
    const cleanDomain = domain.toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '')

    const partner = await Partner.findOne({
      'branding.pmsDomain': cleanDomain,
      status: 'active'
    })
    if (partner) {
      resolvedPartnerId = partner._id
    }
  }

  // Try partnerCode if domain didn't work
  if (!resolvedPartnerId && partnerCode) {
    // Look up partner by code (case-insensitive)
    const partner = await Partner.findOne({
      $or: [
        { code: new RegExp(`^${partnerCode}$`, 'i') },
        { slug: new RegExp(`^${partnerCode}$`, 'i') },
        { companyName: new RegExp(`^${partnerCode}$`, 'i') }
      ]
    })
    if (!partner) {
      throw new UnauthorizedError('INVALID_PARTNER_CODE')
    }
    resolvedPartnerId = partner._id
  }

  if (!resolvedPartnerId) {
    throw new UnauthorizedError('INVALID_PARTNER_CODE')
  }

  // Find user
  const user = await PmsUser.findOne({
    partner: resolvedPartnerId,
    username: username.toLowerCase(),
    isActive: true
  }).select('+password').populate('assignedHotels.hotel', 'name status')

  if (!user) {
    throw new UnauthorizedError('INVALID_CREDENTIALS')
  }

  // Check password
  const isMatch = await user.comparePassword(password)
  if (!isMatch) {
    throw new UnauthorizedError('INVALID_CREDENTIALS')
  }

  // Check if user has any assigned hotels
  if (!user.assignedHotels || user.assignedHotels.length === 0) {
    throw new UnauthorizedError('NO_HOTEL_ASSIGNED')
  }

  // Filter active hotels only
  const activeHotels = user.assignedHotels.filter(h => h.hotel && h.hotel.status === 'active')

  if (activeHotels.length === 0) {
    throw new UnauthorizedError('NO_ACTIVE_HOTEL')
  }

  // If only one hotel, auto-select it
  if (activeHotels.length === 1) {
    const hotel = activeHotels[0].hotel
    const token = generatePmsToken(user, hotel._id)

    // Update last login
    await user.updateLastLogin(hotel._id, req.ip, req.get('User-Agent'))

    return res.json({
      success: true,
      message: req.t ? req.t('LOGIN_SUCCESS') : 'Login successful',
      data: {
        user: {
          id: user._id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          email: user.email,
          department: user.department,
          position: user.position
        },
        hotel: {
          id: hotel._id,
          name: hotel.name,
          role: user.getRoleForHotel(hotel._id),
          permissions: user.getPermissionsForHotel(hotel._id)
        },
        token,
        requiresHotelSelection: false
      }
    })
  }

  // Multiple hotels - require selection
  // Generate a temporary token for hotel selection
  const tempToken = jwt.sign(
    { pmsUserId: user._id, partnerId: user.partner, type: 'pms_temp' },
    config.jwt.secret,
    { expiresIn: '5m' } // 5 minutes to select hotel
  )

  res.json({
    success: true,
    message: req.t ? req.t('SELECT_HOTEL') : 'Please select a hotel',
    data: {
      user: {
        id: user._id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName
      },
      hotels: activeHotels.map(h => ({
        id: h.hotel._id,
        name: h.hotel.name,
        role: h.role
      })),
      tempToken,
      requiresHotelSelection: true
    }
  })
})

// Select hotel (after login with multiple hotels)
export const selectHotel = asyncHandler(async (req, res) => {
  const { hotelId, tempToken } = req.body

  if (!hotelId || !tempToken) {
    throw new BadRequestError('REQUIRED_HOTEL_AND_TOKEN')
  }

  // Verify temp token
  let decoded
  try {
    decoded = jwt.verify(tempToken, config.jwt.secret)
    if (decoded.type !== 'pms_temp') {
      throw new UnauthorizedError('INVALID_TOKEN')
    }
  } catch (error) {
    throw new UnauthorizedError('INVALID_OR_EXPIRED_TOKEN')
  }

  // Get user
  const user = await PmsUser.findById(decoded.pmsUserId)
    .populate('assignedHotels.hotel', 'name status')

  if (!user || !user.isActive) {
    throw new UnauthorizedError('USER_NOT_FOUND')
  }

  // Check if user has access to this hotel
  if (!user.hasAccessToHotel(hotelId)) {
    throw new UnauthorizedError('NO_ACCESS_TO_HOTEL')
  }

  // Get hotel info
  const hotelAssignment = user.assignedHotels.find(h => h.hotel._id.toString() === hotelId)
  if (!hotelAssignment || hotelAssignment.hotel.status !== 'active') {
    throw new BadRequestError('HOTEL_NOT_ACTIVE')
  }

  // Generate full token
  const token = generatePmsToken(user, hotelId)

  // Update last login
  await user.updateLastLogin(hotelId, req.ip, req.get('User-Agent'))

  res.json({
    success: true,
    message: req.t ? req.t('LOGIN_SUCCESS') : 'Login successful',
    data: {
      user: {
        id: user._id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        email: user.email,
        department: user.department,
        position: user.position
      },
      hotel: {
        id: hotelAssignment.hotel._id,
        name: hotelAssignment.hotel.name,
        role: hotelAssignment.role,
        permissions: hotelAssignment.permissions
      },
      token
    }
  })
})

// Switch hotel (already logged in)
export const switchHotel = asyncHandler(async (req, res) => {
  const { hotelId } = req.body
  const user = req.pmsUser

  if (!hotelId) {
    throw new BadRequestError('REQUIRED_HOTEL_ID')
  }

  // Check access
  if (!user.hasAccessToHotel(hotelId)) {
    throw new UnauthorizedError('NO_ACCESS_TO_HOTEL')
  }

  // Get hotel info
  const hotel = await Hotel.findById(hotelId)
  if (!hotel || hotel.status !== 'active') {
    throw new BadRequestError('HOTEL_NOT_ACTIVE')
  }

  // Generate new token
  const token = generatePmsToken(user, hotelId)

  // Update last hotel
  user.lastHotel = hotelId
  await user.save()

  res.json({
    success: true,
    data: {
      hotel: {
        id: hotel._id,
        name: hotel.name,
        role: user.getRoleForHotel(hotelId),
        permissions: user.getPermissionsForHotel(hotelId)
      },
      token
    }
  })
})

// Get current PMS user
export const me = asyncHandler(async (req, res) => {
  const user = req.pmsUser
  const hotelId = req.pmsHotelId

  // Get all assigned hotels
  await user.populate('assignedHotels.hotel', 'name status')

  const currentHotelAssignment = user.assignedHotels.find(
    h => h.hotel._id.toString() === hotelId.toString()
  )

  res.json({
    success: true,
    data: {
      user: {
        id: user._id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        department: user.department,
        position: user.position,
        language: user.language,
        lastLogin: user.lastLogin
      },
      currentHotel: currentHotelAssignment ? {
        id: currentHotelAssignment.hotel._id,
        name: currentHotelAssignment.hotel.name,
        role: currentHotelAssignment.role,
        permissions: currentHotelAssignment.permissions
      } : null,
      assignedHotels: user.assignedHotels
        .filter(h => h.hotel && h.hotel.status === 'active')
        .map(h => ({
          id: h.hotel._id,
          name: h.hotel.name,
          role: h.role
        }))
    }
  })
})

// Logout
export const logout = asyncHandler(async (req, res) => {
  // Could add token blacklisting here if needed
  res.json({
    success: true,
    message: req.t ? req.t('LOGOUT_SUCCESS') : 'Logout successful'
  })
})

// Change password
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body
  const user = await PmsUser.findById(req.pmsUser._id).select('+password')

  if (!currentPassword || !newPassword) {
    throw new BadRequestError('REQUIRED_PASSWORDS')
  }

  // Verify current password
  const isMatch = await user.comparePassword(currentPassword)
  if (!isMatch) {
    throw new UnauthorizedError('INVALID_CURRENT_PASSWORD')
  }

  // Validate new password
  if (newPassword.length < 6) {
    throw new BadRequestError('PASSWORD_TOO_SHORT')
  }

  // Update password
  user.password = newPassword
  await user.save()

  res.json({
    success: true,
    message: req.t ? req.t('PASSWORD_CHANGED') : 'Password changed successfully'
  })
})
