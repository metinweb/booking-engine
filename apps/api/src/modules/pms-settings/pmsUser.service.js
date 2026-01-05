import PmsUser from './pmsUser.model.js'
import Hotel from '../hotel/hotel.model.js'
import { BadRequestError, NotFoundError } from '../../core/errors.js'
import { asyncHandler } from '../../helpers/asyncHandler.js'

// Get all PMS users for partner
export const getAll = asyncHandler(async (req, res) => {
  const partnerId = req.pmsPartnerId || req.query.partnerId

  const query = { partner: partnerId }

  // Filter by hotel if provided
  if (req.query.hotelId) {
    query['assignedHotels.hotel'] = req.query.hotelId
  }

  // Filter by department
  if (req.query.department) {
    query.department = req.query.department
  }

  // Filter by active status
  if (req.query.isActive !== undefined) {
    query.isActive = req.query.isActive === 'true'
  }

  const users = await PmsUser.find(query)
    .populate('assignedHotels.hotel', 'name status')
    .sort({ lastName: 1, firstName: 1 })

  res.json({
    success: true,
    data: users
  })
})

// Get single PMS user
export const getOne = asyncHandler(async (req, res) => {
  const { id } = req.params

  const user = await PmsUser.findById(id).populate('assignedHotels.hotel', 'name status')

  if (!user) {
    throw new NotFoundError('USER_NOT_FOUND')
  }

  res.json({
    success: true,
    data: user
  })
})

// Create PMS user
export const create = asyncHandler(async (req, res) => {
  const {
    username,
    password,
    firstName,
    lastName,
    email,
    phone,
    department,
    position,
    assignedHotels,
    isActive = true
  } = req.body

  // Get partner ID from auth context or request
  const partnerId = req.pmsPartnerId || req.body.partnerId

  if (!partnerId) {
    throw new BadRequestError('REQUIRED_PARTNER_ID')
  }

  // Validate required fields
  if (!username || !password || !firstName || !lastName) {
    throw new BadRequestError('REQUIRED_FIELDS_MISSING')
  }

  // Check if username already exists for this partner
  const existingUser = await PmsUser.findOne({
    partner: partnerId,
    username: username.toLowerCase()
  })

  if (existingUser) {
    throw new BadRequestError('USERNAME_ALREADY_EXISTS')
  }

  // Process assigned hotels - add default permissions if not provided
  const processedHotels = []
  if (assignedHotels && assignedHotels.length > 0) {
    for (const assignment of assignedHotels) {
      // Verify hotel exists and belongs to partner
      const hotel = await Hotel.findOne({
        _id: assignment.hotel,
        partner: partnerId
      })

      if (!hotel) {
        throw new BadRequestError(`HOTEL_NOT_FOUND: ${assignment.hotel}`)
      }

      processedHotels.push({
        hotel: assignment.hotel,
        role: assignment.role || 'receptionist',
        permissions:
          assignment.permissions || PmsUser.getDefaultPermissions(assignment.role || 'receptionist')
      })
    }
  }

  // Create user
  const user = await PmsUser.create({
    partner: partnerId,
    username: username.toLowerCase(),
    password,
    firstName,
    lastName,
    email,
    phone,
    department,
    position,
    assignedHotels: processedHotels,
    isActive
  })

  // Populate for response
  await user.populate('assignedHotels.hotel', 'name status')

  res.status(201).json({
    success: true,
    message: req.t ? req.t('USER_CREATED') : 'User created successfully',
    data: user
  })
})

// Update PMS user
export const update = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { firstName, lastName, email, phone, department, position, isActive, language } = req.body

  const user = await PmsUser.findById(id)

  if (!user) {
    throw new NotFoundError('USER_NOT_FOUND')
  }

  // Update fields
  if (firstName) user.firstName = firstName
  if (lastName) user.lastName = lastName
  if (email !== undefined) user.email = email
  if (phone !== undefined) user.phone = phone
  if (department) user.department = department
  if (position !== undefined) user.position = position
  if (isActive !== undefined) user.isActive = isActive
  if (language) user.language = language

  await user.save()
  await user.populate('assignedHotels.hotel', 'name status')

  res.json({
    success: true,
    message: req.t ? req.t('USER_UPDATED') : 'User updated successfully',
    data: user
  })
})

// Delete PMS user
export const remove = asyncHandler(async (req, res) => {
  const { id } = req.params

  const user = await PmsUser.findById(id)

  if (!user) {
    throw new NotFoundError('USER_NOT_FOUND')
  }

  await user.deleteOne()

  res.json({
    success: true,
    message: req.t ? req.t('USER_DELETED') : 'User deleted successfully'
  })
})

// Reset password (admin function)
export const resetPassword = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { newPassword } = req.body

  if (!newPassword || newPassword.length < 6) {
    throw new BadRequestError('INVALID_PASSWORD')
  }

  const user = await PmsUser.findById(id)

  if (!user) {
    throw new NotFoundError('USER_NOT_FOUND')
  }

  user.password = newPassword
  await user.save()

  res.json({
    success: true,
    message: req.t ? req.t('PASSWORD_RESET') : 'Password reset successfully'
  })
})

// Assign hotel to user
export const assignHotel = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { hotelId, role, permissions } = req.body

  if (!hotelId) {
    throw new BadRequestError('REQUIRED_HOTEL_ID')
  }

  const user = await PmsUser.findById(id)

  if (!user) {
    throw new NotFoundError('USER_NOT_FOUND')
  }

  // Verify hotel belongs to same partner
  const hotel = await Hotel.findOne({
    _id: hotelId,
    partner: user.partner
  })

  if (!hotel) {
    throw new NotFoundError('HOTEL_NOT_FOUND')
  }

  // Check if already assigned
  const existingIndex = user.assignedHotels.findIndex(h => h.hotel.toString() === hotelId)

  const assignmentRole = role || 'receptionist'
  const assignmentPermissions = permissions || PmsUser.getDefaultPermissions(assignmentRole)

  if (existingIndex >= 0) {
    // Update existing assignment
    user.assignedHotels[existingIndex].role = assignmentRole
    user.assignedHotels[existingIndex].permissions = assignmentPermissions
  } else {
    // Add new assignment
    user.assignedHotels.push({
      hotel: hotelId,
      role: assignmentRole,
      permissions: assignmentPermissions
    })
  }

  await user.save()
  await user.populate('assignedHotels.hotel', 'name status')

  res.json({
    success: true,
    message: req.t ? req.t('HOTEL_ASSIGNED') : 'Hotel assigned successfully',
    data: user
  })
})

// Remove hotel from user
export const removeHotel = asyncHandler(async (req, res) => {
  const { id, hotelId } = req.params

  const user = await PmsUser.findById(id)

  if (!user) {
    throw new NotFoundError('USER_NOT_FOUND')
  }

  const hotelIndex = user.assignedHotels.findIndex(h => h.hotel.toString() === hotelId)

  if (hotelIndex === -1) {
    throw new NotFoundError('HOTEL_NOT_ASSIGNED')
  }

  user.assignedHotels.splice(hotelIndex, 1)
  await user.save()
  await user.populate('assignedHotels.hotel', 'name status')

  res.json({
    success: true,
    message: req.t ? req.t('HOTEL_REMOVED') : 'Hotel removed successfully',
    data: user
  })
})

// Update user permissions for a specific hotel
export const updatePermissions = asyncHandler(async (req, res) => {
  const { id, hotelId } = req.params
  const { permissions, role } = req.body

  const user = await PmsUser.findById(id)

  if (!user) {
    throw new NotFoundError('USER_NOT_FOUND')
  }

  const hotelAssignment = user.assignedHotels.find(h => h.hotel.toString() === hotelId)

  if (!hotelAssignment) {
    throw new NotFoundError('HOTEL_NOT_ASSIGNED')
  }

  if (role) {
    hotelAssignment.role = role
    // If only role is provided, set default permissions for that role
    if (!permissions) {
      hotelAssignment.permissions = PmsUser.getDefaultPermissions(role)
    }
  }

  if (permissions) {
    hotelAssignment.permissions = permissions
  }

  await user.save()
  await user.populate('assignedHotels.hotel', 'name status')

  res.json({
    success: true,
    message: req.t ? req.t('PERMISSIONS_UPDATED') : 'Permissions updated successfully',
    data: user
  })
})

// Get users by hotel
export const getByHotel = asyncHandler(async (req, res) => {
  const { hotelId } = req.params

  const users = await PmsUser.find({
    'assignedHotels.hotel': hotelId,
    isActive: true
  }).select('-loginHistory')

  res.json({
    success: true,
    data: users
  })
})
