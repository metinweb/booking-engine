/**
 * Permission Check Composable
 * Provides utilities for checking user permissions across the app
 */

import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

export function usePermissions() {
  const authStore = useAuthStore()
  const toast = useToast()
  const { t } = useI18n()
  const router = useRouter()

  // Check if user is platform admin or has admin role
  const isAdmin = computed(() => {
    return authStore.user?.accountType === 'platform' || authStore.user?.role === 'admin'
  })

  // Get user's permissions array
  const permissions = computed(() => {
    return authStore.user?.permissions || []
  })

  /**
   * Check if user has a specific action permission for a module
   * @param {string} module - Module name (e.g., 'hotels', 'bookings')
   * @param {string} action - Action name (e.g., 'view', 'create', 'update', 'delete')
   * @returns {boolean}
   */
  function hasPermission(module, action = 'view') {
    // Admins have all permissions
    if (isAdmin.value) {
      return true
    }

    // Find the module permission
    const modulePermission = permissions.value.find(p => p.module === module)
    if (!modulePermission) {
      return false
    }

    // Check the specific action
    return modulePermission.actions?.[action] === true
  }

  /**
   * Check if user can view a module
   */
  function canView(module) {
    return hasPermission(module, 'view')
  }

  /**
   * Check if user can create in a module
   */
  function canCreate(module) {
    return hasPermission(module, 'create')
  }

  /**
   * Check if user can update in a module
   */
  function canUpdate(module) {
    return hasPermission(module, 'update')
  }

  /**
   * Check if user can delete in a module
   */
  function canDelete(module) {
    return hasPermission(module, 'delete')
  }

  /**
   * Navigate to a route if user has permission, otherwise show toast
   * @param {string} module - Module name for permission check
   * @param {string} action - Action to check (default: 'view')
   * @param {string|object} route - Route to navigate to
   * @returns {boolean} - Whether navigation was allowed
   */
  function navigateWithPermission(module, action, route) {
    if (hasPermission(module, action)) {
      router.push(route)
      return true
    } else {
      toast.error(t('common.permissionDenied'))
      return false
    }
  }

  /**
   * Execute an action if user has permission, otherwise show toast
   * @param {string} module - Module name for permission check
   * @param {string} action - Action to check
   * @param {Function} callback - Function to execute if permitted
   * @returns {boolean} - Whether action was allowed
   */
  function executeWithPermission(module, action, callback) {
    if (hasPermission(module, action)) {
      callback()
      return true
    } else {
      toast.error(t('common.permissionDenied'))
      return false
    }
  }

  return {
    isAdmin,
    permissions,
    hasPermission,
    canView,
    canCreate,
    canUpdate,
    canDelete,
    navigateWithPermission,
    executeWithPermission
  }
}
