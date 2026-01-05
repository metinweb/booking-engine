/**
 * PMS Guest Service
 * Frontend API client for guest management
 */

import pmsApiClient from './pmsApi'

// VIP levels
export const VIP_LEVELS = {
  NONE: 'none',
  SILVER: 'silver',
  GOLD: 'gold',
  PLATINUM: 'platinum'
}

export const VIP_LEVEL_INFO = {
  none: {
    label: 'Standart',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-600',
    icon: 'person'
  },
  silver: {
    label: 'Silver',
    bgColor: 'bg-slate-200',
    textColor: 'text-slate-700',
    icon: 'star_half'
  },
  gold: {
    label: 'Gold',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-700',
    icon: 'star'
  },
  platinum: {
    label: 'Platinum',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-700',
    icon: 'workspace_premium'
  }
}

// ID types
export const ID_TYPES = [
  { value: 'tc_kimlik', label: 'TC Kimlik' },
  { value: 'passport', label: 'Pasaport' },
  { value: 'driving_license', label: 'Ehliyet' },
  { value: 'national_id', label: 'Ulusal Kimlik' },
  { value: 'other', label: 'Diger' }
]

// Title options
export const TITLE_OPTIONS = [
  { value: 'mr', label: 'Bay' },
  { value: 'mrs', label: 'Bayan' },
  { value: 'ms', label: 'Bn.' },
  { value: 'miss', label: 'Bayan' },
  { value: 'dr', label: 'Dr.' },
  { value: 'prof', label: 'Prof.' }
]

// Gender options
export const GENDER_OPTIONS = [
  { value: 'male', label: 'Erkek' },
  { value: 'female', label: 'Kadin' },
  { value: 'other', label: 'Diger' },
  { value: 'prefer_not_to_say', label: 'Belirtmek Istemiyor' }
]

// Common tags
export const COMMON_TAGS = [
  'VIP',
  'Business',
  'Tatilci',
  'Aile',
  'Cift',
  'Solo',
  'Uzun Sureli',
  'Sadik Misafir',
  'Sikayet',
  'Odul'
]

const guestService = {
  // Get all guests with filters
  async getGuests(hotelId, params = {}) {
    const response = await pmsApiClient.get(`/pms/hotels/${hotelId}/guests`, { params })
    return response.data
  },

  // Get single guest
  async getGuest(hotelId, guestId) {
    const response = await pmsApiClient.get(`/pms/hotels/${hotelId}/guests/${guestId}`)
    return response.data
  },

  // Get guest statistics
  async getStats(hotelId) {
    const response = await pmsApiClient.get(`/pms/hotels/${hotelId}/guests/stats`)
    return response.data
  },

  // Get VIP guests
  async getVipGuests(hotelId) {
    const response = await pmsApiClient.get(`/pms/hotels/${hotelId}/guests/vip`)
    return response.data
  },

  // Get blacklisted guests
  async getBlacklistedGuests(hotelId) {
    const response = await pmsApiClient.get(`/pms/hotels/${hotelId}/guests/blacklisted`)
    return response.data
  },

  // Get recent guests
  async getRecentGuests(hotelId, days = 30) {
    const response = await pmsApiClient.get(`/pms/hotels/${hotelId}/guests/recent`, {
      params: { days }
    })
    return response.data
  },

  // Create new guest
  async create(hotelId, data) {
    const response = await pmsApiClient.post(`/pms/hotels/${hotelId}/guests`, data)
    return response.data
  },

  // Update guest
  async update(hotelId, guestId, data) {
    const response = await pmsApiClient.put(`/pms/hotels/${hotelId}/guests/${guestId}`, data)
    return response.data
  },

  // Delete guest
  async delete(hotelId, guestId) {
    const response = await pmsApiClient.delete(`/pms/hotels/${hotelId}/guests/${guestId}`)
    return response.data
  },

  // Set VIP level
  async setVipLevel(hotelId, guestId, vipLevel) {
    const response = await pmsApiClient.patch(`/pms/hotels/${hotelId}/guests/${guestId}/vip`, {
      vipLevel
    })
    return response.data
  },

  // Blacklist guest
  async blacklist(hotelId, guestId, reason) {
    const response = await pmsApiClient.post(`/pms/hotels/${hotelId}/guests/${guestId}/blacklist`, {
      reason
    })
    return response.data
  },

  // Remove from blacklist
  async removeFromBlacklist(hotelId, guestId) {
    const response = await pmsApiClient.delete(`/pms/hotels/${hotelId}/guests/${guestId}/blacklist`)
    return response.data
  },

  // Add note
  async addNote(hotelId, guestId, data) {
    const response = await pmsApiClient.post(`/pms/hotels/${hotelId}/guests/${guestId}/notes`, data)
    return response.data
  },

  // Delete note
  async deleteNote(hotelId, guestId, noteId) {
    const response = await pmsApiClient.delete(
      `/pms/hotels/${hotelId}/guests/${guestId}/notes/${noteId}`
    )
    return response.data
  },

  // Update tags
  async updateTags(hotelId, guestId, tags) {
    const response = await pmsApiClient.patch(`/pms/hotels/${hotelId}/guests/${guestId}/tags`, {
      tags
    })
    return response.data
  },

  // Get stay history
  async getStayHistory(hotelId, guestId, params = {}) {
    const response = await pmsApiClient.get(`/pms/hotels/${hotelId}/guests/${guestId}/stays`, {
      params
    })
    return response.data
  },

  // Merge guests
  async merge(hotelId, primaryGuestId, secondaryGuestId) {
    const response = await pmsApiClient.post(`/pms/hotels/${hotelId}/guests/merge`, {
      primaryGuestId,
      secondaryGuestId
    })
    return response.data
  }
}

export default guestService
