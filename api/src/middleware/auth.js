import jwt from 'jsonwebtoken'
import config from '../config/index.js'
import User from '../modules/user/user.model.js'
import Partner from '../modules/partner/partner.model.js'
import Agency from '../modules/agency/agency.model.js'
import { UnauthorizedError } from '../core/errors.js'

// Protect middleware - Require authentication
export const protect = async (req, res, next) => {
  try {
    // Get token from header
    let token
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1]
    }

    if (!token) {
      throw new UnauthorizedError('UNAUTHORIZED')
    }

    // Verify token
    const decoded = jwt.verify(token, config.jwt.secret)

    // Get user
    const user = await User.findById(decoded.userId)
    if (!user || !user.isActive()) {
      throw new UnauthorizedError('UNAUTHORIZED')
    }

    // Get account (skip for platform)
    let account = null
    if (user.accountType === 'partner') {
      account = await Partner.findById(user.accountId)
      if (!account || !account.isActive()) {
        throw new UnauthorizedError('ACCOUNT_INACTIVE')
      }
    } else if (user.accountType === 'agency') {
      account = await Agency.findById(user.accountId).populate('partner')
      if (!account || !account.isActive()) {
        throw new UnauthorizedError('ACCOUNT_INACTIVE')
      }
    }

    // Attach to request
    req.user = user
    req.account = account
    req.token = decoded

    next()
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      next(new UnauthorizedError('INVALID_TOKEN'))
    } else if (error.name === 'TokenExpiredError') {
      next(new UnauthorizedError('TOKEN_EXPIRED'))
    } else {
      next(error)
    }
  }
}

// Require admin role
export const requireAdmin = (req, res, next) => {
  if (!req.user.isAdmin()) {
    throw new UnauthorizedError('FORBIDDEN')
  }
  next()
}

// Require specific account type
export const requireAccountType = (...accountTypes) => {
  return (req, res, next) => {
    if (!accountTypes.includes(req.user.accountType)) {
      throw new UnauthorizedError('FORBIDDEN')
    }
    next()
  }
}
