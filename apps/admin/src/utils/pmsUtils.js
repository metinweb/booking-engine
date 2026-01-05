/**
 * PMS Shared Utilities
 *
 * Bu dosya PMS modülü genelinde kullanılan tüm utility fonksiyonlarını,
 * sabitleri ve enum'ları içerir. Duplicate kod önlemek için her zaman
 * bu dosyadan import edilmelidir.
 *
 * Booking Engine ile paylaşılan sabitler de burada tanımlanır.
 */

// ============================================================================
// CURRENCY & NUMBER FORMATTING
// ============================================================================

/**
 * Para birimi formatla
 * @param {number} amount - Miktar
 * @param {string} currency - Para birimi kodu (default: TRY)
 * @returns {string} Formatlanmış para birimi
 */
export const formatCurrency = (amount, currency = 'TRY') => {
  const value = Number(amount) || 0
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}

/**
 * Sayı formatla (binlik ayraç ile)
 * @param {number} value - Sayı
 * @param {number} decimals - Ondalık basamak sayısı
 * @returns {string} Formatlanmış sayı
 */
export const formatNumber = (value, decimals = 0) => {
  const num = Number(value) || 0
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(num)
}

/**
 * Yüzde formatla
 * @param {number} value - Yüzde değeri (0-100)
 * @returns {string} Formatlanmış yüzde
 */
export const formatPercent = value => {
  const num = Number(value) || 0
  return `%${num.toFixed(1)}`
}

// ============================================================================
// DATE & TIME FORMATTING
// ============================================================================

/**
 * Tarih formatla
 * @param {Date|string} date - Tarih
 * @param {string} format - Format tipi: 'short' | 'long' | 'full'
 * @returns {string} Formatlanmış tarih
 */
export const formatDate = (date, format = 'short') => {
  if (!date) return '-'

  const d = new Date(date)
  if (isNaN(d.getTime())) return '-'

  const options = {
    short: { day: '2-digit', month: '2-digit', year: 'numeric' },
    long: { day: '2-digit', month: 'long', year: 'numeric' },
    full: { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }
  }

  return d.toLocaleDateString('tr-TR', options[format] || options.short)
}

/**
 * Saat formatla
 * @param {Date|string} date - Tarih/saat
 * @returns {string} Formatlanmış saat (HH:mm)
 */
export const formatTime = date => {
  if (!date) return '-'

  const d = new Date(date)
  if (isNaN(d.getTime())) return '-'

  return d.toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Tarih ve saat formatla
 * @param {Date|string} date - Tarih/saat
 * @returns {string} Formatlanmış tarih ve saat
 */
export const formatDateTime = date => {
  if (!date) return '-'

  const d = new Date(date)
  if (isNaN(d.getTime())) return '-'

  return d.toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Relative time (örn: "5 dakika önce")
 * @param {Date|string} date - Tarih
 * @returns {string} Relative time string
 */
export const formatRelativeTime = date => {
  if (!date) return '-'

  const d = new Date(date)
  if (isNaN(d.getTime())) return '-'

  const now = new Date()
  const diff = now - d
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'Az önce'
  if (minutes < 60) return `${minutes} dakika önce`
  if (hours < 24) return `${hours} saat önce`
  if (days < 7) return `${days} gün önce`

  return formatDate(d, 'short')
}

/**
 * İki tarih arasındaki gece sayısını hesapla
 * @param {Date|string} checkIn - Giriş tarihi
 * @param {Date|string} checkOut - Çıkış tarihi
 * @returns {number} Gece sayısı
 */
export const calculateNights = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return 0

  const start = new Date(checkIn)
  const end = new Date(checkOut)

  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0

  const diffTime = end.getTime() - start.getTime()
  return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
}

/**
 * Tarih input için ISO format (YYYY-MM-DD)
 * @param {Date|string} date - Tarih
 * @returns {string} YYYY-MM-DD formatında tarih
 */
export const toDateInputValue = date => {
  if (!date) return ''
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''
  return d.toISOString().split('T')[0]
}

// ============================================================================
// PAYMENT CONSTANTS
// ============================================================================

/**
 * Ödeme durumları
 */
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PARTIAL: 'partial',
  PAID: 'paid',
  REFUNDED: 'refunded',
  CANCELLED: 'cancelled'
}

/**
 * Ödeme durumu bilgileri (UI için)
 */
export const PAYMENT_STATUS_INFO = {
  [PAYMENT_STATUS.PENDING]: {
    label: 'Ödeme Bekleniyor',
    color: 'red',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    textColor: 'text-red-600 dark:text-red-400',
    icon: 'pending'
  },
  [PAYMENT_STATUS.PARTIAL]: {
    label: 'Kısmi Ödeme',
    color: 'amber',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    textColor: 'text-amber-600 dark:text-amber-400',
    icon: 'hourglass_empty'
  },
  [PAYMENT_STATUS.PAID]: {
    label: 'Ödendi',
    color: 'green',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    textColor: 'text-green-600 dark:text-green-400',
    icon: 'check_circle'
  },
  [PAYMENT_STATUS.REFUNDED]: {
    label: 'İade Edildi',
    color: 'purple',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    textColor: 'text-purple-600 dark:text-purple-400',
    icon: 'undo'
  },
  [PAYMENT_STATUS.CANCELLED]: {
    label: 'İptal',
    color: 'gray',
    bgColor: 'bg-gray-100 dark:bg-gray-900/30',
    textColor: 'text-gray-600 dark:text-gray-400',
    icon: 'cancel'
  }
}

/**
 * Ödeme yöntemleri
 */
export const PAYMENT_METHODS = {
  CASH: 'cash',
  CREDIT_CARD: 'credit_card',
  DEBIT_CARD: 'debit_card',
  BANK_TRANSFER: 'bank_transfer',
  ONLINE: 'online',
  AGENCY: 'agency',
  OTHER: 'other'
}

/**
 * Ödeme yöntemi bilgileri (UI için)
 */
export const PAYMENT_METHOD_INFO = {
  [PAYMENT_METHODS.CASH]: {
    label: 'Nakit',
    icon: 'payments',
    color: 'green'
  },
  [PAYMENT_METHODS.CREDIT_CARD]: {
    label: 'Kredi Kartı',
    icon: 'credit_card',
    color: 'blue'
  },
  [PAYMENT_METHODS.DEBIT_CARD]: {
    label: 'Banka Kartı',
    icon: 'credit_card',
    color: 'indigo'
  },
  [PAYMENT_METHODS.BANK_TRANSFER]: {
    label: 'Havale/EFT',
    icon: 'account_balance',
    color: 'purple'
  },
  [PAYMENT_METHODS.ONLINE]: {
    label: 'Online Ödeme',
    icon: 'language',
    color: 'cyan'
  },
  [PAYMENT_METHODS.AGENCY]: {
    label: 'Acente',
    icon: 'business',
    color: 'orange'
  },
  [PAYMENT_METHODS.OTHER]: {
    label: 'Diğer',
    icon: 'more_horiz',
    color: 'gray'
  }
}

// ============================================================================
// STAY/RESERVATION CONSTANTS
// ============================================================================

/**
 * Konaklama durumları
 */
export const STAY_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CHECKED_IN: 'checked_in',
  CHECKED_OUT: 'checked_out',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show'
}

/**
 * Konaklama durumu bilgileri (UI için)
 */
export const STAY_STATUS_INFO = {
  [STAY_STATUS.PENDING]: {
    label: 'Beklemede',
    color: 'amber',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    textColor: 'text-amber-600 dark:text-amber-400',
    icon: 'schedule'
  },
  [STAY_STATUS.CONFIRMED]: {
    label: 'Onaylı',
    color: 'blue',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    textColor: 'text-blue-600 dark:text-blue-400',
    icon: 'verified'
  },
  [STAY_STATUS.CHECKED_IN]: {
    label: 'Giriş Yapıldı',
    color: 'green',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    textColor: 'text-green-600 dark:text-green-400',
    icon: 'login'
  },
  [STAY_STATUS.CHECKED_OUT]: {
    label: 'Çıkış Yapıldı',
    color: 'gray',
    bgColor: 'bg-gray-100 dark:bg-gray-900/30',
    textColor: 'text-gray-600 dark:text-gray-400',
    icon: 'logout'
  },
  [STAY_STATUS.CANCELLED]: {
    label: 'İptal',
    color: 'red',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    textColor: 'text-red-600 dark:text-red-400',
    icon: 'cancel'
  },
  [STAY_STATUS.NO_SHOW]: {
    label: 'Gelmedi',
    color: 'orange',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    textColor: 'text-orange-600 dark:text-orange-400',
    icon: 'person_off'
  }
}

/**
 * Rezervasyon kaynakları
 */
export const BOOKING_SOURCE = {
  DIRECT: 'direct',
  WEBSITE: 'website',
  PHONE: 'phone',
  WALKIN: 'walkin',
  BOOKING_COM: 'booking_com',
  EXPEDIA: 'expedia',
  AIRBNB: 'airbnb',
  AGENCY: 'agency',
  OTHER: 'other'
}

/**
 * Rezervasyon kaynağı bilgileri (UI için)
 */
export const BOOKING_SOURCE_INFO = {
  [BOOKING_SOURCE.DIRECT]: { label: 'Doğrudan', icon: 'storefront' },
  [BOOKING_SOURCE.WEBSITE]: { label: 'Web Sitesi', icon: 'language' },
  [BOOKING_SOURCE.PHONE]: { label: 'Telefon', icon: 'phone' },
  [BOOKING_SOURCE.WALKIN]: { label: 'Walk-in', icon: 'directions_walk' },
  [BOOKING_SOURCE.BOOKING_COM]: { label: 'Booking.com', icon: 'travel_explore' },
  [BOOKING_SOURCE.EXPEDIA]: { label: 'Expedia', icon: 'travel_explore' },
  [BOOKING_SOURCE.AIRBNB]: { label: 'Airbnb', icon: 'home' },
  [BOOKING_SOURCE.AGENCY]: { label: 'Acente', icon: 'business' },
  [BOOKING_SOURCE.OTHER]: { label: 'Diğer', icon: 'more_horiz' }
}

// ============================================================================
// ROOM CONSTANTS
// ============================================================================

/**
 * Oda durumları
 */
export const ROOM_STATUS = {
  VACANT_CLEAN: 'vacant_clean',
  VACANT_DIRTY: 'vacant_dirty',
  OCCUPIED: 'occupied',
  CHECKOUT: 'checkout',
  MAINTENANCE: 'maintenance',
  OUT_OF_ORDER: 'out_of_order',
  INSPECTED: 'inspected'
}

/**
 * Oda durumu bilgileri (UI için)
 */
export const ROOM_STATUS_INFO = {
  [ROOM_STATUS.VACANT_CLEAN]: {
    label: 'Boş - Temiz',
    icon: 'check_circle',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    textColor: 'text-green-600 dark:text-green-400',
    borderColor: 'border-green-300 dark:border-green-700'
  },
  [ROOM_STATUS.VACANT_DIRTY]: {
    label: 'Boş - Kirli',
    icon: 'cleaning_services',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    textColor: 'text-amber-600 dark:text-amber-400',
    borderColor: 'border-amber-300 dark:border-amber-700'
  },
  [ROOM_STATUS.OCCUPIED]: {
    label: 'Dolu',
    icon: 'person',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    textColor: 'text-blue-600 dark:text-blue-400',
    borderColor: 'border-blue-300 dark:border-blue-700'
  },
  [ROOM_STATUS.CHECKOUT]: {
    label: 'Çıkış',
    icon: 'logout',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    textColor: 'text-orange-600 dark:text-orange-400',
    borderColor: 'border-orange-300 dark:border-orange-700'
  },
  [ROOM_STATUS.MAINTENANCE]: {
    label: 'Bakımda',
    icon: 'build',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    textColor: 'text-purple-600 dark:text-purple-400',
    borderColor: 'border-purple-300 dark:border-purple-700'
  },
  [ROOM_STATUS.OUT_OF_ORDER]: {
    label: 'Kullanım Dışı',
    icon: 'block',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    textColor: 'text-red-600 dark:text-red-400',
    borderColor: 'border-red-300 dark:border-red-700'
  },
  [ROOM_STATUS.INSPECTED]: {
    label: 'Denetlendi',
    icon: 'verified',
    bgColor: 'bg-teal-100 dark:bg-teal-900/30',
    textColor: 'text-teal-600 dark:text-teal-400',
    borderColor: 'border-teal-300 dark:border-teal-700'
  }
}

/**
 * Housekeeping durumları
 */
export const HOUSEKEEPING_STATUS = {
  CLEAN: 'clean',
  DIRTY: 'dirty',
  CLEANING: 'cleaning',
  INSPECTED: 'inspected',
  OUT_OF_SERVICE: 'out_of_service'
}

/**
 * Housekeeping durumu bilgileri (UI için)
 */
export const HOUSEKEEPING_STATUS_INFO = {
  [HOUSEKEEPING_STATUS.CLEAN]: {
    label: 'Temiz',
    icon: 'check_circle',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    textColor: 'text-green-600 dark:text-green-400'
  },
  [HOUSEKEEPING_STATUS.DIRTY]: {
    label: 'Kirli',
    icon: 'cleaning_services',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    textColor: 'text-amber-600 dark:text-amber-400'
  },
  [HOUSEKEEPING_STATUS.CLEANING]: {
    label: 'Temizleniyor',
    icon: 'sync',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    textColor: 'text-blue-600 dark:text-blue-400'
  },
  [HOUSEKEEPING_STATUS.INSPECTED]: {
    label: 'Denetlendi',
    icon: 'verified',
    bgColor: 'bg-teal-100 dark:bg-teal-900/30',
    textColor: 'text-teal-600 dark:text-teal-400'
  },
  [HOUSEKEEPING_STATUS.OUT_OF_SERVICE]: {
    label: 'Servis Dışı',
    icon: 'block',
    bgColor: 'bg-gray-100 dark:bg-gray-900/30',
    textColor: 'text-gray-600 dark:text-gray-400'
  }
}

/**
 * Housekeeping öncelikleri
 */
export const HOUSEKEEPING_PRIORITY = {
  LOW: 'low',
  NORMAL: 'normal',
  HIGH: 'high',
  URGENT: 'urgent'
}

/**
 * Housekeeping öncelik bilgileri (UI için)
 */
export const HOUSEKEEPING_PRIORITY_INFO = {
  [HOUSEKEEPING_PRIORITY.LOW]: {
    label: 'Düşük',
    color: 'gray',
    textColor: 'text-gray-600 dark:text-gray-400'
  },
  [HOUSEKEEPING_PRIORITY.NORMAL]: {
    label: 'Normal',
    color: 'blue',
    textColor: 'text-blue-600 dark:text-blue-400'
  },
  [HOUSEKEEPING_PRIORITY.HIGH]: {
    label: 'Yüksek',
    color: 'amber',
    textColor: 'text-amber-600 dark:text-amber-400'
  },
  [HOUSEKEEPING_PRIORITY.URGENT]: {
    label: 'Acil',
    color: 'red',
    textColor: 'text-red-600 dark:text-red-400'
  }
}

// ============================================================================
// GUEST CONSTANTS
// ============================================================================

/**
 * Kimlik türleri
 */
export const ID_TYPES = {
  TC_KIMLIK: 'tc_kimlik',
  PASSPORT: 'passport',
  DRIVING_LICENSE: 'driving_license',
  NATIONAL_ID: 'national_id',
  OTHER: 'other'
}

/**
 * Kimlik türü bilgileri (UI için)
 */
export const ID_TYPE_INFO = {
  [ID_TYPES.TC_KIMLIK]: { label: 'TC Kimlik', icon: 'badge' },
  [ID_TYPES.PASSPORT]: { label: 'Pasaport', icon: 'flight' },
  [ID_TYPES.DRIVING_LICENSE]: { label: 'Ehliyet', icon: 'directions_car' },
  [ID_TYPES.NATIONAL_ID]: { label: 'Ulusal Kimlik', icon: 'credit_card' },
  [ID_TYPES.OTHER]: { label: 'Diğer', icon: 'description' }
}

/**
 * Unvan seçenekleri
 */
export const TITLE_OPTIONS = [
  { value: 'mr', label: 'Bay' },
  { value: 'mrs', label: 'Bayan' },
  { value: 'ms', label: 'Bn.' },
  { value: 'dr', label: 'Dr.' },
  { value: 'prof', label: 'Prof.' }
]

/**
 * Cinsiyet seçenekleri
 */
export const GENDER_OPTIONS = [
  { value: 'male', label: 'Erkek' },
  { value: 'female', label: 'Kadın' },
  { value: 'other', label: 'Diğer' },
  { value: 'prefer_not_to_say', label: 'Belirtmek İstemiyorum' }
]

// ============================================================================
// KBS (Kimlik Bildirim Sistemi) CONSTANTS
// ============================================================================

/**
 * KBS durumları
 */
export const KBS_STATUS = {
  PENDING: 'pending',
  SENT: 'sent',
  FAILED: 'failed',
  NOT_REQUIRED: 'not_required'
}

/**
 * KBS durumu bilgileri (UI için)
 */
export const KBS_STATUS_INFO = {
  [KBS_STATUS.PENDING]: {
    label: 'Bekliyor',
    icon: 'schedule',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    textColor: 'text-amber-600 dark:text-amber-400'
  },
  [KBS_STATUS.SENT]: {
    label: 'Gönderildi',
    icon: 'check_circle',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    textColor: 'text-green-600 dark:text-green-400'
  },
  [KBS_STATUS.FAILED]: {
    label: 'Başarısız',
    icon: 'error',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    textColor: 'text-red-600 dark:text-red-400'
  },
  [KBS_STATUS.NOT_REQUIRED]: {
    label: 'Gerekli Değil',
    icon: 'remove_circle',
    bgColor: 'bg-gray-100 dark:bg-gray-900/30',
    textColor: 'text-gray-600 dark:text-gray-400'
  }
}

// ============================================================================
// TRANSACTION CONSTANTS
// ============================================================================

/**
 * İşlem türleri
 */
export const TRANSACTION_TYPES = {
  ROOM_CHARGE: 'room_charge',
  EXTRA_CHARGE: 'extra_charge',
  PAYMENT: 'payment',
  REFUND: 'refund',
  DEPOSIT: 'deposit',
  ADJUSTMENT: 'adjustment',
  TAX: 'tax',
  DISCOUNT: 'discount'
}

/**
 * İşlem türü bilgileri (UI için)
 */
export const TRANSACTION_TYPE_INFO = {
  [TRANSACTION_TYPES.ROOM_CHARGE]: {
    label: 'Oda Ücreti',
    icon: 'hotel',
    isCredit: false
  },
  [TRANSACTION_TYPES.EXTRA_CHARGE]: {
    label: 'Ekstra Hizmet',
    icon: 'room_service',
    isCredit: false
  },
  [TRANSACTION_TYPES.PAYMENT]: {
    label: 'Ödeme',
    icon: 'payments',
    isCredit: true
  },
  [TRANSACTION_TYPES.REFUND]: {
    label: 'İade',
    icon: 'undo',
    isCredit: false
  },
  [TRANSACTION_TYPES.DEPOSIT]: {
    label: 'Depozito',
    icon: 'account_balance_wallet',
    isCredit: true
  },
  [TRANSACTION_TYPES.ADJUSTMENT]: {
    label: 'Düzeltme',
    icon: 'tune',
    isCredit: null // Both possible
  },
  [TRANSACTION_TYPES.TAX]: {
    label: 'Vergi',
    icon: 'receipt',
    isCredit: false
  },
  [TRANSACTION_TYPES.DISCOUNT]: {
    label: 'İndirim',
    icon: 'local_offer',
    isCredit: true
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Misafir adını formatla
 * @param {Object} guest - Misafir objesi
 * @returns {string} Formatlanmış isim
 */
export const formatGuestName = guest => {
  if (!guest) return 'Misafir'
  if (typeof guest === 'string') return guest

  const parts = []
  if (guest.title) {
    const titleInfo = TITLE_OPTIONS.find(t => t.value === guest.title)
    if (titleInfo) parts.push(titleInfo.label)
  }
  if (guest.firstName) parts.push(guest.firstName)
  if (guest.lastName) parts.push(guest.lastName)

  return parts.length > 0 ? parts.join(' ') : 'Misafir'
}

/**
 * Oda numarası formatla
 * @param {Object} room - Oda objesi
 * @returns {string} Formatlanmış oda bilgisi
 */
export const formatRoomInfo = room => {
  if (!room) return '-'

  const parts = [`Oda ${room.roomNumber}`]
  if (room.floor) parts.push(`${room.floor}. Kat`)
  if (room.roomType?.name?.tr) parts.push(room.roomType.name.tr)
  else if (room.roomType?.code) parts.push(room.roomType.code)

  return parts.join(' - ')
}

/**
 * Bakiye durumunu belirle
 * @param {number} balance - Bakiye tutarı
 * @returns {Object} Durum bilgisi
 */
export const getBalanceStatus = balance => {
  const amount = Number(balance) || 0

  if (amount > 0) {
    return {
      status: 'due',
      label: 'Borç',
      color: 'red',
      textColor: 'text-red-600 dark:text-red-400'
    }
  } else if (amount < 0) {
    return {
      status: 'credit',
      label: 'Alacak',
      color: 'blue',
      textColor: 'text-blue-600 dark:text-blue-400'
    }
  }

  return {
    status: 'zero',
    label: 'Sıfır',
    color: 'green',
    textColor: 'text-green-600 dark:text-green-400'
  }
}

/**
 * TC Kimlik numarası doğrula (basit)
 * @param {string} tcNo - TC Kimlik numarası
 * @returns {boolean} Geçerli mi?
 */
export const validateTCKimlik = tcNo => {
  if (!tcNo || typeof tcNo !== 'string') return false

  // 11 haneli olmalı
  if (tcNo.length !== 11) return false

  // Sadece rakam içermeli
  if (!/^\d+$/.test(tcNo)) return false

  // 0 ile başlamamalı
  if (tcNo[0] === '0') return false

  // Algoritma kontrolü
  const digits = tcNo.split('').map(Number)
  const sum1 = digits[0] + digits[2] + digits[4] + digits[6] + digits[8]
  const sum2 = digits[1] + digits[3] + digits[5] + digits[7]

  const check1 = (sum1 * 7 - sum2) % 10
  const check2 = (sum1 + sum2 + digits[9]) % 10

  return digits[9] === check1 && digits[10] === check2
}

/**
 * Telefon numarası formatla
 * @param {string} phone - Telefon numarası
 * @returns {string} Formatlanmış telefon
 */
export const formatPhone = phone => {
  if (!phone) return '-'

  // Sadece rakamları al
  const digits = phone.replace(/\D/g, '')

  // Türkiye formatı
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)} ${digits.slice(6, 8)} ${digits.slice(8)}`
  }

  if (digits.length === 11 && digits[0] === '0') {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)} ${digits.slice(7, 9)} ${digits.slice(9)}`
  }

  return phone
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
  // Formatting
  formatCurrency,
  formatNumber,
  formatPercent,
  formatDate,
  formatTime,
  formatDateTime,
  formatRelativeTime,
  calculateNights,
  toDateInputValue,
  formatGuestName,
  formatRoomInfo,
  formatPhone,

  // Validators
  validateTCKimlik,
  getBalanceStatus,

  // Payment
  PAYMENT_STATUS,
  PAYMENT_STATUS_INFO,
  PAYMENT_METHODS,
  PAYMENT_METHOD_INFO,

  // Stay/Reservation
  STAY_STATUS,
  STAY_STATUS_INFO,
  BOOKING_SOURCE,
  BOOKING_SOURCE_INFO,

  // Room
  ROOM_STATUS,
  ROOM_STATUS_INFO,
  HOUSEKEEPING_STATUS,
  HOUSEKEEPING_STATUS_INFO,
  HOUSEKEEPING_PRIORITY,
  HOUSEKEEPING_PRIORITY_INFO,

  // Guest
  ID_TYPES,
  ID_TYPE_INFO,
  TITLE_OPTIONS,
  GENDER_OPTIONS,

  // KBS
  KBS_STATUS,
  KBS_STATUS_INFO,

  // Transaction
  TRANSACTION_TYPES,
  TRANSACTION_TYPE_INFO
}
