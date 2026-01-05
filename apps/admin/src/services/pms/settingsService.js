import pmsApiClient from './pmsApi'

const BASE_URL = '/pms'

/**
 * PMS Settings Service
 * Otel bazlı PMS ayarlarını yönetir
 */

// ==========================================
// GET SETTINGS
// ==========================================

/**
 * Tüm ayarları getir
 */
export const getSettings = async hotelId => {
  const response = await pmsApiClient.get(`${BASE_URL}/hotels/${hotelId}/settings`)
  return response.data
}

/**
 * Desteklenen zaman dilimlerini getir
 */
export const getTimezones = async () => {
  const response = await pmsApiClient.get(`${BASE_URL}/settings/timezones`)
  return response.data
}

/**
 * Desteklenen para birimlerini getir
 */
export const getCurrencies = async () => {
  const response = await pmsApiClient.get(`${BASE_URL}/settings/currencies`)
  return response.data
}

// ==========================================
// UPDATE SETTINGS
// ==========================================

/**
 * Tüm ayarları güncelle
 */
export const updateAllSettings = async (hotelId, settings) => {
  const response = await pmsApiClient.put(`${BASE_URL}/hotels/${hotelId}/settings`, settings)
  return response.data
}

/**
 * Genel ayarları güncelle
 */
export const updateGeneralSettings = async (hotelId, general) => {
  const response = await pmsApiClient.put(`${BASE_URL}/hotels/${hotelId}/settings/general`, {
    general
  })
  return response.data
}

/**
 * Resepsiyon ayarlarını güncelle
 */
export const updateFrontDeskSettings = async (hotelId, frontDesk) => {
  const response = await pmsApiClient.put(`${BASE_URL}/hotels/${hotelId}/settings/front-desk`, {
    frontDesk
  })
  return response.data
}

/**
 * Vergi ayarlarını güncelle
 */
export const updateTaxSettings = async (hotelId, taxes) => {
  const response = await pmsApiClient.put(`${BASE_URL}/hotels/${hotelId}/settings/taxes`, { taxes })
  return response.data
}

/**
 * Fatura ayarlarını güncelle
 */
export const updateInvoicingSettings = async (hotelId, invoicing) => {
  const response = await pmsApiClient.put(`${BASE_URL}/hotels/${hotelId}/settings/invoicing`, {
    invoicing
  })
  return response.data
}

/**
 * Kat hizmetleri ayarlarını güncelle
 */
export const updateHousekeepingSettings = async (hotelId, housekeeping) => {
  const response = await pmsApiClient.put(`${BASE_URL}/hotels/${hotelId}/settings/housekeeping`, {
    housekeeping
  })
  return response.data
}

/**
 * Kasa/POS ayarlarını güncelle
 */
export const updateCashierSettings = async (hotelId, cashier) => {
  const response = await pmsApiClient.put(`${BASE_URL}/hotels/${hotelId}/settings/cashier`, {
    cashier
  })
  return response.data
}

/**
 * Bildirim ayarlarını güncelle
 */
export const updateNotificationSettings = async (hotelId, notifications) => {
  const response = await pmsApiClient.put(`${BASE_URL}/hotels/${hotelId}/settings/notifications`, {
    notifications
  })
  return response.data
}

/**
 * Rezervasyon ayarlarını güncelle
 */
export const updateReservationSettings = async (hotelId, reservations) => {
  const response = await pmsApiClient.put(`${BASE_URL}/hotels/${hotelId}/settings/reservations`, {
    reservations
  })
  return response.data
}

/**
 * Misafir ayarlarını güncelle
 */
export const updateGuestSettings = async (hotelId, guests) => {
  const response = await pmsApiClient.put(`${BASE_URL}/hotels/${hotelId}/settings/guests`, {
    guests
  })
  return response.data
}

// ==========================================
// RESET SETTINGS
// ==========================================

/**
 * Ayarları varsayılana sıfırla
 */
export const resetSettings = async (hotelId, section = 'all') => {
  const response = await pmsApiClient.post(`${BASE_URL}/hotels/${hotelId}/settings/reset`, {
    section
  })
  return response.data
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Fatura numarası al
 */
export const getNextInvoiceNumber = async hotelId => {
  const response = await pmsApiClient.post(`${BASE_URL}/hotels/${hotelId}/settings/invoice-number`)
  return response.data
}

/**
 * Fiş numarası al
 */
export const getNextReceiptNumber = async hotelId => {
  const response = await pmsApiClient.post(`${BASE_URL}/hotels/${hotelId}/settings/receipt-number`)
  return response.data
}

// ==========================================
// CONSTANTS
// ==========================================

export const SETTINGS_SECTIONS = {
  GENERAL: 'general',
  FRONT_DESK: 'frontDesk',
  TAXES: 'taxes',
  INVOICING: 'invoicing',
  HOUSEKEEPING: 'housekeeping',
  CASHIER: 'cashier',
  NOTIFICATIONS: 'notifications',
  RESERVATIONS: 'reservations',
  GUESTS: 'guests'
}

export const DATE_FORMATS = [
  { value: 'DD/MM/YYYY', label: '31/12/2024 (Gün/Ay/Yıl)' },
  { value: 'MM/DD/YYYY', label: '12/31/2024 (Ay/Gün/Yıl)' },
  { value: 'YYYY-MM-DD', label: '2024-12-31 (Yıl-Ay-Gün)' }
]

export const TIME_FORMATS = [
  { value: '24h', label: '24 Saat (14:00)' },
  { value: '12h', label: '12 Saat (2:00 PM)' }
]

export const PAYMENT_METHODS = [
  { code: 'cash', name: 'Nakit', isCash: true },
  { code: 'credit_card', name: 'Kredi Kartı', isCash: false },
  { code: 'debit_card', name: 'Banka Kartı', isCash: false },
  { code: 'bank_transfer', name: 'Havale/EFT', isCash: false },
  { code: 'room_charge', name: 'Oda Hesabı', isCash: false }
]

export const CLEANING_PRIORITIES = [
  { value: 'checkout_first', label: 'Önce Check-out Odaları' },
  { value: 'vip_first', label: 'Önce VIP Odalar' },
  { value: 'floor_order', label: 'Kat Sırasına Göre' }
]

export const TAX_APPLY_OPTIONS = [
  { value: 'all', label: 'Tüm İşlemler' },
  { value: 'accommodation', label: 'Sadece Konaklama' },
  { value: 'food_beverage', label: 'Sadece Yiyecek & İçecek' },
  { value: 'services', label: 'Sadece Hizmetler' }
]

export const DEFAULT_VIP_LEVELS = [
  { code: 'silver', name: 'Silver', color: '#9ca3af' },
  { code: 'gold', name: 'Gold', color: '#f59e0b' },
  { code: 'platinum', name: 'Platinum', color: '#8b5cf6' }
]

export const DEFAULT_CLEANING_STATUSES = [
  { code: 'clean', name: 'Temiz', color: '#22c55e' },
  { code: 'dirty', name: 'Kirli', color: '#ef4444' },
  { code: 'inspected', name: 'Kontrol Edildi', color: '#3b82f6' },
  { code: 'in_progress', name: 'Temizleniyor', color: '#f59e0b' },
  { code: 'out_of_order', name: 'Arızalı', color: '#6b7280' }
]

export default {
  getSettings,
  getTimezones,
  getCurrencies,
  updateAllSettings,
  updateGeneralSettings,
  updateFrontDeskSettings,
  updateTaxSettings,
  updateInvoicingSettings,
  updateHousekeepingSettings,
  updateCashierSettings,
  updateNotificationSettings,
  updateReservationSettings,
  updateGuestSettings,
  resetSettings,
  getNextInvoiceNumber,
  getNextReceiptNumber,
  SETTINGS_SECTIONS,
  DATE_FORMATS,
  TIME_FORMATS,
  PAYMENT_METHODS,
  CLEANING_PRIORITIES,
  TAX_APPLY_OPTIONS,
  DEFAULT_VIP_LEVELS,
  DEFAULT_CLEANING_STATUSES
}
