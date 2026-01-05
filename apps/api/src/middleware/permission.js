import { ForbiddenError } from '../core/errors.js'

/**
 * Permission Middleware
 * Checks if user has required permission for a module/action
 */

/**
 * Require specific permission
 * @param {string} module - Module name (dashboard, planning, booking, etc.)
 * @param {string} action - Action type (view, create, edit, delete)
 */
export const requirePermission = (module, action) => {
  return (req, res, next) => {
    try {
      const user = req.user

      if (!user) {
        throw new ForbiddenError('UNAUTHORIZED')
      }

      // PMS users have different permission system
      if (req.authMode === 'pms') {
        // PMS admin has all permissions, others only have view
        if (req.pmsRole === 'pms_admin' || action === 'view') {
          return next()
        }
        throw new ForbiddenError('PERMISSION_DENIED')
      }

      // Admins have all permissions
      if (user.role === 'admin') {
        return next()
      }

      // Check user's permission using model method
      if (user.hasPermission && user.hasPermission(module, action)) {
        return next()
      }

      // Check raw permissions array (for when user object doesn't have method)
      if (user.permissions) {
        const permission = user.permissions.find(p => p.module === module)
        if (permission && permission.actions?.[action] === true) {
          return next()
        }
      }

      throw new ForbiddenError('PERMISSION_DENIED')
    } catch (error) {
      if (error.name === 'ForbiddenError') {
        return res.status(403).json({
          success: false,
          error: error.message
        })
      }
      next(error)
    }
  }
}

/**
 * Require any of the specified permissions
 * @param {Array} permissions - Array of { module, action } objects
 */
export const requireAnyPermission = permissions => {
  return (req, res, next) => {
    try {
      const user = req.user

      if (!user) {
        throw new ForbiddenError('UNAUTHORIZED')
      }

      // Admins have all permissions
      if (user.role === 'admin') {
        return next()
      }

      // Check if user has any of the required permissions
      const hasAny = permissions.some(({ module, action }) => {
        if (user.hasPermission) {
          return user.hasPermission(module, action)
        }
        const permission = user.permissions?.find(p => p.module === module)
        return permission && permission.actions?.[action] === true
      })

      if (hasAny) {
        return next()
      }

      throw new ForbiddenError('PERMISSION_DENIED')
    } catch (error) {
      if (error.name === 'ForbiddenError') {
        return res.status(403).json({
          success: false,
          error: error.message
        })
      }
      next(error)
    }
  }
}

/**
 * Require all of the specified permissions
 * @param {Array} permissions - Array of { module, action } objects
 */
export const requireAllPermissions = permissions => {
  return (req, res, next) => {
    try {
      const user = req.user

      if (!user) {
        throw new ForbiddenError('UNAUTHORIZED')
      }

      // Admins have all permissions
      if (user.role === 'admin') {
        return next()
      }

      // Check if user has all required permissions
      const hasAll = permissions.every(({ module, action }) => {
        if (user.hasPermission) {
          return user.hasPermission(module, action)
        }
        const permission = user.permissions?.find(p => p.module === module)
        return permission && permission.actions?.[action] === true
      })

      if (hasAll) {
        return next()
      }

      throw new ForbiddenError('PERMISSION_DENIED')
    } catch (error) {
      if (error.name === 'ForbiddenError') {
        return res.status(403).json({
          success: false,
          error: error.message
        })
      }
      next(error)
    }
  }
}

/**
 * Check if user is admin
 */
export const requireAdmin = (req, res, next) => {
  try {
    const user = req.user

    if (!user) {
      throw new ForbiddenError('UNAUTHORIZED')
    }

    if (user.role !== 'admin') {
      throw new ForbiddenError('ADMIN_REQUIRED')
    }

    return next()
  } catch (error) {
    if (error.name === 'ForbiddenError') {
      return res.status(403).json({
        success: false,
        error: error.message
      })
    }
    next(error)
  }
}

export default {
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,
  requireAdmin
}
