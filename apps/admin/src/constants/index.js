/**
 * Centralized Constants
 * Application-wide constants and configuration values
 */

// ==================== CURRENCIES ====================

export const CURRENCIES = ['TRY', 'USD', 'EUR', 'GBP', 'RUB', 'SAR', 'AED']

export const DEFAULT_CURRENCY = 'TRY'

export const CURRENCY_SYMBOLS = {
  TRY: '₺',
  USD: '$',
  EUR: '€',
  GBP: '£',
  RUB: '₽',
  SAR: '﷼',
  AED: 'د.إ'
}

// ==================== PAGINATION ====================

export const DEFAULT_PAGE_SIZE = 20
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]
export const MAX_PAGE_SIZE = 1000

// ==================== TIMING ====================

export const DEFAULT_DEBOUNCE_MS = 300
export const SEARCH_DEBOUNCE_MS = 300
export const AUTO_SAVE_DEBOUNCE_MS = 1000
export const TOAST_DURATION_MS = 3000
export const TOAST_ERROR_DURATION_MS = 5000

// ==================== VALIDATION ====================

export const MIN_PASSWORD_LENGTH = 8
export const MAX_PASSWORD_LENGTH = 128
export const MAX_FILE_SIZE_MB = 10
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
export const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'image/jpeg', 'image/png']

// ==================== BOOKING ====================

export const BOOKING_STATUSES = ['draft', 'pending', 'confirmed', 'completed', 'cancelled', 'no_show', 'amended']

export const BOOKING_SOURCES = ['admin', 'website', 'agency', 'api', 'phone', 'walkin']

export const DEFAULT_CHECK_IN_TIME = '14:00'
export const DEFAULT_CHECK_OUT_TIME = '12:00'

// ==================== PAYMENT ====================

export const PAYMENT_METHODS = ['creditCard', 'bankTransfer', 'cash', 'virtual', 'agency_credit']

export const PAYMENT_STATUSES = ['pending', 'paid', 'partial', 'refunded', 'failed']

export const DEFAULT_INSTALLMENTS = 12

// ==================== COMMISSION ====================

export const DEFAULT_COMMISSION_RATES = {
  hotel: 10,
  tour: 10,
  transfer: 10
}

export const MAX_COMMISSION_RATE = 50
export const MIN_COMMISSION_RATE = 0

// ==================== CREDIT ====================

export const CREDIT_LOW_THRESHOLD = 0.2 // 20%
export const CREDIT_WARNING_THRESHOLD = 0.5 // 50%

// ==================== USER ROLES ====================

export const USER_ROLES = {
  PLATFORM_ADMIN: 'platformAdmin',
  PLATFORM_USER: 'platformUser',
  PARTNER_ADMIN: 'partnerAdmin',
  PARTNER_USER: 'partnerUser',
  AGENCY_ADMIN: 'agencyAdmin',
  AGENCY_USER: 'agencyUser'
}

export const ACCOUNT_TYPES = {
  PLATFORM: 'platform',
  PARTNER: 'partner',
  AGENCY: 'agency'
}

// ==================== HOTEL ====================

export const HOTEL_TYPES = {
  BASE: 'base',
  PARTNER: 'partner',
  LINKED: 'linked'
}

export const HOTEL_STATUSES = ['draft', 'active', 'inactive']

export const STAR_RATINGS = [1, 2, 3, 4, 5]

// ==================== ROOM ====================

export const MAX_ADULTS = 10
export const MAX_CHILDREN = 6
export const MAX_INFANTS = 2
export const MAX_ROOMS_PER_BOOKING = 10

export const CHILD_AGE_RANGES = [
  { min: 0, max: 2, label: 'infant' },
  { min: 2, max: 6, label: 'child' },
  { min: 6, max: 12, label: 'child' }
]

// ==================== PRICING ====================

export const PRICING_TYPES = {
  UNIT: 'unit',
  OBP: 'obp' // Occupancy Based Pricing
}

export const RATE_TYPES = ['standard', 'non_refundable', 'early_bird', 'last_minute', 'package']

export const MEAL_PLAN_CODES = ['RO', 'BB', 'HB', 'FB', 'AI', 'UAI']

// ==================== DATE/TIME ====================

export const DATE_FORMAT = 'YYYY-MM-DD'
export const DATE_TIME_FORMAT = 'YYYY-MM-DD HH:mm'
export const DISPLAY_DATE_FORMAT = 'DD MMM YYYY'
export const DISPLAY_DATE_TIME_FORMAT = 'DD MMM YYYY HH:mm'

export const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

// ==================== LANGUAGES ====================

export const SUPPORTED_LANGUAGES = ['tr', 'en', 'de', 'ru', 'ar', 'fr', 'es', 'it', 'nl', 'pl']

export const DEFAULT_LANGUAGE = 'tr'

// ==================== API ====================

export const API_TIMEOUT_MS = 30000
export const UPLOAD_TIMEOUT_MS = 120000
export const MAX_RETRY_ATTEMPTS = 3

// ==================== UI ====================

export const SIDEBAR_WIDTH = 256
export const SIDEBAR_COLLAPSED_WIDTH = 64
export const HEADER_HEIGHT = 64
export const MODAL_SIZES = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-full'
}

// ==================== TABLE ====================

export const TABLE_DENSITY = {
  compact: 'py-1',
  normal: 'py-2',
  comfortable: 'py-3'
}

export const SORT_DIRECTIONS = ['asc', 'desc']

// ==================== FILTERS ====================

export const DATE_RANGE_PRESETS = [
  { key: 'today', days: 0 },
  { key: 'yesterday', days: -1 },
  { key: 'last7days', days: -7 },
  { key: 'last30days', days: -30 },
  { key: 'last90days', days: -90 },
  { key: 'thisMonth', days: 'thisMonth' },
  { key: 'lastMonth', days: 'lastMonth' },
  { key: 'thisYear', days: 'thisYear' }
]

// ==================== EXPORT ====================

export const EXPORT_FORMATS = ['csv', 'xlsx', 'pdf']

export const MAX_EXPORT_ROWS = 10000

// ==================== FEATURE FLAGS ====================

export const FEATURES = {
  DARK_MODE: true,
  MULTI_LANGUAGE: true,
  NOTIFICATIONS: true,
  CHAT: false,
  AI_ASSISTANT: true
}
