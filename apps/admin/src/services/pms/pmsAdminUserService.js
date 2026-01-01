import apiClient from '../api'

/**
 * PMS Admin User Service
 * Uses regular apiClient for partner/platform admins to manage PMS users
 * (Does NOT require PMS token - uses regular auth token)
 */

/**
 * Get all PMS users for the current partner
 * @param {Object} params - Query params (partnerId, hotelId, department, isActive)
 */
const getAll = async (params = {}) => {
  const response = await apiClient.get('/pms/admin/users', { params })
  return response.data
}

/**
 * Get single PMS user
 * @param {string} id - User ID
 */
const getOne = async (id) => {
  const response = await apiClient.get(`/pms/admin/users/${id}`)
  return response.data
}

/**
 * Create PMS user
 * @param {Object} data - User data
 */
const create = async (data) => {
  const response = await apiClient.post('/pms/admin/users', data)
  return response.data
}

/**
 * Update PMS user
 * @param {string} id - User ID
 * @param {Object} data - User data
 */
const update = async (id, data) => {
  const response = await apiClient.put(`/pms/admin/users/${id}`, data)
  return response.data
}

/**
 * Delete PMS user
 * @param {string} id - User ID
 */
const remove = async (id) => {
  const response = await apiClient.delete(`/pms/admin/users/${id}`)
  return response.data
}

/**
 * Reset user password
 * @param {string} id - User ID
 * @param {string} newPassword - New password
 */
const resetPassword = async (id, newPassword) => {
  const response = await apiClient.post(`/pms/admin/users/${id}/reset-password`, { newPassword })
  return response.data
}

/**
 * Assign hotel to user
 * @param {string} userId - User ID
 * @param {Object} data - { hotelId, role, permissions }
 */
const assignHotel = async (userId, data) => {
  const response = await apiClient.post(`/pms/admin/users/${userId}/assign-hotel`, data)
  return response.data
}

/**
 * Remove hotel from user
 * @param {string} userId - User ID
 * @param {string} hotelId - Hotel ID
 */
const removeHotel = async (userId, hotelId) => {
  const response = await apiClient.delete(`/pms/admin/users/${userId}/hotels/${hotelId}`)
  return response.data
}

/**
 * Update user permissions for hotel
 * @param {string} userId - User ID
 * @param {string} hotelId - Hotel ID
 * @param {Object} data - { role, permissions }
 */
const updatePermissions = async (userId, hotelId, data) => {
  const response = await apiClient.put(`/pms/admin/users/${userId}/hotels/${hotelId}/permissions`, data)
  return response.data
}

/**
 * Get available roles
 */
const getRoles = () => {
  return [
    { value: 'pms_admin', label: 'PMS Admin', description: 'Tum yetkilere sahip' },
    { value: 'front_desk_manager', label: 'On Bufe Muduru', description: 'On bufe ve rezervasyon yonetimi' },
    { value: 'receptionist', label: 'Resepsiyonist', description: 'Check-in/out ve misafir islemleri' },
    { value: 'night_auditor', label: 'Gece Denetcisi', description: 'Gece islemleri ve raporlar' },
    { value: 'housekeeping_supervisor', label: 'Kat Hizmetleri Muduru', description: 'Temizlik ekibi yonetimi' },
    { value: 'housekeeper', label: 'Kat Gorevlisi', description: 'Oda temizlik islemleri' },
    { value: 'revenue_manager', label: 'Gelir Yoneticisi', description: 'Fiyatlandirma ve raporlar' },
    { value: 'guest_relations', label: 'Misafir Iliskileri', description: 'Misafir memnuniyeti' }
  ]
}

/**
 * Get available departments
 */
const getDepartments = () => {
  return [
    { value: 'front_office', label: 'On Bufe' },
    { value: 'housekeeping', label: 'Kat Hizmetleri' },
    { value: 'management', label: 'Yonetim' },
    { value: 'accounting', label: 'Muhasebe' },
    { value: 'reservation', label: 'Rezervasyon' },
    { value: 'guest_relations', label: 'Misafir Iliskileri' }
  ]
}

/**
 * Get default permissions for a role
 */
const getDefaultPermissions = (role) => {
  const permissionsByRole = {
    pms_admin: ['*'],
    front_desk_manager: [
      'dashboard.view',
      'reservations.view', 'reservations.create', 'reservations.edit', 'reservations.cancel',
      'frontdesk.checkin', 'frontdesk.checkout', 'frontdesk.walkin', 'frontdesk.roomMove',
      'housekeeping.view', 'housekeeping.assign',
      'guests.view', 'guests.edit',
      'billing.view', 'billing.addCharge', 'billing.payment', 'billing.invoice', 'billing.discount',
      'reports.operational', 'reports.financial'
    ],
    receptionist: [
      'dashboard.view',
      'reservations.view', 'reservations.create', 'reservations.edit',
      'frontdesk.checkin', 'frontdesk.checkout', 'frontdesk.walkin',
      'guests.view', 'guests.edit',
      'billing.view', 'billing.addCharge', 'billing.payment'
    ],
    night_auditor: [
      'dashboard.view',
      'reservations.view',
      'frontdesk.checkin', 'frontdesk.checkout',
      'billing.view', 'billing.addCharge', 'billing.payment', 'billing.invoice',
      'reports.operational', 'reports.financial', 'reports.export'
    ],
    housekeeping_supervisor: [
      'dashboard.view',
      'housekeeping.view', 'housekeeping.assign', 'housekeeping.updateStatus', 'housekeeping.maintenance',
      'reports.operational'
    ],
    housekeeper: [
      'housekeeping.view', 'housekeeping.updateStatus'
    ],
    revenue_manager: [
      'dashboard.view',
      'reservations.view',
      'reports.operational', 'reports.financial', 'reports.export'
    ],
    guest_relations: [
      'dashboard.view',
      'reservations.view',
      'guests.view', 'guests.edit',
      'billing.view'
    ]
  }

  return permissionsByRole[role] || []
}

export default {
  getAll,
  getOne,
  create,
  update,
  remove,
  resetPassword,
  assignHotel,
  removeHotel,
  updatePermissions,
  getRoles,
  getDepartments,
  getDefaultPermissions
}
