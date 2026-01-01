import mongoose from 'mongoose'

/**
 * PMS Settings Model
 * Otel bazlı PMS operasyonel ayarları
 */

const pmsSettingsSchema = new mongoose.Schema({
  // İlişkiler
  partner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Partner',
    required: true,
    index: true
  },
  hotel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel',
    required: true,
    index: true
  },

  // ===== GENEL AYARLAR =====
  general: {
    // Zaman dilimi
    timezone: {
      type: String,
      default: 'Europe/Istanbul'
    },
    // Tarih formatı
    dateFormat: {
      type: String,
      enum: ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'],
      default: 'DD/MM/YYYY'
    },
    // Saat formatı
    timeFormat: {
      type: String,
      enum: ['24h', '12h'],
      default: '24h'
    },
    // Varsayılan dil
    language: {
      type: String,
      default: 'tr'
    },
    // Varsayılan para birimi (PMS için)
    currency: {
      type: String,
      enum: ['TRY', 'USD', 'EUR', 'GBP'],
      default: 'TRY'
    }
  },

  // ===== RESEPSIYON AYARLARI =====
  frontDesk: {
    // Varsayılan check-in saati
    defaultCheckInTime: {
      type: String,
      default: '14:00'
    },
    // Varsayılan check-out saati
    defaultCheckOutTime: {
      type: String,
      default: '12:00'
    },
    // Erken check-in izni
    allowEarlyCheckIn: {
      type: Boolean,
      default: true
    },
    // Geç check-out izni
    allowLateCheckOut: {
      type: Boolean,
      default: true
    },
    // Erken check-in ücreti (saatlik)
    earlyCheckInFee: {
      type: Number,
      default: 0
    },
    // Geç check-out ücreti (saatlik)
    lateCheckOutFee: {
      type: Number,
      default: 0
    },
    // Varsayılan ödeme yöntemi
    defaultPaymentMethod: {
      type: String,
      enum: ['cash', 'credit_card', 'debit_card', 'bank_transfer', 'room_charge'],
      default: 'cash'
    },
    // Walk-in misafir için depozito gerekli mi?
    requireDepositForWalkIn: {
      type: Boolean,
      default: true
    },
    // Minimum depozito yüzdesi
    minimumDepositPercent: {
      type: Number,
      min: 0,
      max: 100,
      default: 50
    },
    // Check-out'ta sıfır bakiye zorunlu mu?
    requireZeroBalanceCheckOut: {
      type: Boolean,
      default: true
    }
  },

  // ===== VERGİ AYARLARI =====
  taxes: {
    // KDV dahil fiyat mı?
    pricesIncludeTax: {
      type: Boolean,
      default: true
    },
    // Vergi türleri
    taxTypes: [{
      _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
      name: { type: String, required: true }, // KDV, Konaklama Vergisi, vb.
      code: { type: String, required: true, uppercase: true }, // KDV, KV, vb.
      rate: { type: Number, min: 0, max: 100, required: true },
      isActive: { type: Boolean, default: true },
      applyTo: {
        type: String,
        enum: ['all', 'accommodation', 'food_beverage', 'services'],
        default: 'all'
      }
    }],
    // Varsayılan konaklama vergisi
    accommodationTaxRate: {
      type: Number,
      min: 0,
      max: 100,
      default: 10
    },
    // Yiyecek içecek KDV oranı
    foodBeverageTaxRate: {
      type: Number,
      min: 0,
      max: 100,
      default: 10
    }
  },

  // ===== FATURA AYARLARI =====
  invoicing: {
    // Otomatik fatura oluştur
    autoGenerateInvoice: {
      type: Boolean,
      default: true
    },
    // Fatura numarası prefix
    invoicePrefix: {
      type: String,
      default: 'INV'
    },
    // Fatura numarası suffix (yıl bazlı)
    invoiceYearSuffix: {
      type: Boolean,
      default: true
    },
    // Son fatura numarası
    lastInvoiceNumber: {
      type: Number,
      default: 0
    },
    // Şirket bilgileri (fatura için)
    companyInfo: {
      name: { type: String },
      taxOffice: { type: String },
      taxNumber: { type: String },
      address: { type: String },
      phone: { type: String },
      email: { type: String }
    },
    // Fatura alt notu
    invoiceNotes: {
      type: String,
      default: ''
    }
  },

  // ===== KAT HİZMETLERİ AYARLARI =====
  housekeeping: {
    // Günlük temizlik saati
    dailyCleaningTime: {
      type: String,
      default: '10:00'
    },
    // Check-out sonrası otomatik kirli işaretle
    autoMarkDirtyOnCheckout: {
      type: Boolean,
      default: true
    },
    // Temizlik öncelik sırası
    cleaningPriority: {
      type: String,
      enum: ['checkout_first', 'vip_first', 'floor_order'],
      default: 'checkout_first'
    },
    // Temizlik durumları
    cleaningStatuses: [{
      _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
      code: { type: String, required: true },
      name: { type: String, required: true },
      color: { type: String, default: '#gray' },
      order: { type: Number, default: 0 }
    }],
    // Temizlik görev tipleri
    taskTypes: [{
      _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
      code: { type: String, required: true },
      name: { type: String, required: true },
      estimatedMinutes: { type: Number, default: 30 },
      isActive: { type: Boolean, default: true }
    }]
  },

  // ===== KASA/POS AYARLARI =====
  cashier: {
    // Aktif para birimleri
    activeCurrencies: {
      type: [String],
      default: ['TRY']
    },
    // Vardiya zorunlu mu?
    requireShift: {
      type: Boolean,
      default: true
    },
    // Otomatik vardiya kapanış saati
    autoCloseShiftTime: {
      type: String,
      default: ''
    },
    // Nakit sayım farkı toleransı
    cashDiscrepancyTolerance: {
      type: Number,
      default: 0
    },
    // Fiş/Makbuz prefix
    receiptPrefix: {
      type: String,
      default: 'RCP'
    },
    // Son fiş numarası
    lastReceiptNumber: {
      type: Number,
      default: 0
    },
    // Ödeme yöntemleri
    paymentMethods: [{
      _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
      code: { type: String, required: true },
      name: { type: String, required: true },
      isActive: { type: Boolean, default: true },
      isCash: { type: Boolean, default: false },
      requireReference: { type: Boolean, default: false },
      order: { type: Number, default: 0 }
    }],
    // İşlem kategorileri
    transactionCategories: [{
      _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
      code: { type: String, required: true },
      name: { type: String, required: true },
      type: { type: String, enum: ['income', 'expense'], default: 'income' },
      isActive: { type: Boolean, default: true }
    }]
  },

  // ===== BİLDİRİM AYARLARI =====
  notifications: {
    // E-posta bildirimleri
    emailNotifications: {
      enabled: { type: Boolean, default: true },
      // Rezervasyon onay maili
      sendReservationConfirmation: { type: Boolean, default: true },
      // Check-in hatırlatma
      sendCheckInReminder: { type: Boolean, default: true },
      checkInReminderDays: { type: Number, default: 1 },
      // Check-out hatırlatma
      sendCheckOutReminder: { type: Boolean, default: true },
      // Fatura maili
      sendInvoiceEmail: { type: Boolean, default: true }
    },
    // SMS bildirimleri
    smsNotifications: {
      enabled: { type: Boolean, default: false },
      sendReservationConfirmation: { type: Boolean, default: false },
      sendCheckInReminder: { type: Boolean, default: false }
    },
    // Dahili bildirimler
    internalNotifications: {
      // VIP misafir gelişi
      notifyVipArrival: { type: Boolean, default: true },
      // Yüksek bakiye uyarısı
      notifyHighBalance: { type: Boolean, default: true },
      highBalanceThreshold: { type: Number, default: 5000 },
      // No-show uyarısı
      notifyNoShow: { type: Boolean, default: true }
    }
  },

  // ===== REZERVASYON AYARLARI =====
  reservations: {
    // Minimum konaklama süresi (gece)
    minimumStay: {
      type: Number,
      min: 1,
      default: 1
    },
    // Maximum konaklama süresi (gece)
    maximumStay: {
      type: Number,
      min: 1,
      default: 30
    },
    // Kaç gün önceden rezervasyon alınabilir
    advanceBookingDays: {
      type: Number,
      min: 0,
      default: 365
    },
    // Son dakika rezervasyon (aynı gün)
    allowSameDayBooking: {
      type: Boolean,
      default: true
    },
    // Rezervasyon onay gerektir mi?
    requireConfirmation: {
      type: Boolean,
      default: false
    },
    // Otomatik iptal süresi (saat) - onay bekleyen rezervasyonlar için
    autoCancelHours: {
      type: Number,
      default: 24
    },
    // Rezervasyon kaynakları
    bookingSources: [{
      _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
      code: { type: String, required: true },
      name: { type: String, required: true },
      isActive: { type: Boolean, default: true },
      commission: { type: Number, default: 0 }
    }],
    // İptal nedenleri
    cancellationReasons: [{
      _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
      code: { type: String, required: true },
      name: { type: String, required: true },
      isActive: { type: Boolean, default: true }
    }]
  },

  // ===== MİSAFİR AYARLARI =====
  guests: {
    // TC/Pasaport zorunlu mu?
    requireIdentification: {
      type: Boolean,
      default: true
    },
    // E-posta zorunlu mu?
    requireEmail: {
      type: Boolean,
      default: false
    },
    // Telefon zorunlu mu?
    requirePhone: {
      type: Boolean,
      default: true
    },
    // Adres zorunlu mu?
    requireAddress: {
      type: Boolean,
      default: false
    },
    // VIP seviyeleri
    vipLevels: [{
      _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
      code: { type: String, required: true },
      name: { type: String, required: true },
      color: { type: String, default: '#gold' },
      benefits: { type: String },
      order: { type: Number, default: 0 }
    }],
    // Otomatik VIP ataması
    autoVipAssignment: {
      enabled: { type: Boolean, default: true },
      // X konaklamadan sonra silver
      silverAfterStays: { type: Number, default: 3 },
      // X konaklamadan sonra gold
      goldAfterStays: { type: Number, default: 5 },
      // X konaklamadan sonra platinum
      platinumAfterStays: { type: Number, default: 10 }
    }
  },

  // ===== KBS (KİMLİK BİLDİRİM SİSTEMİ) AYARLARI =====
  kbs: {
    // KBS aktif mi?
    enabled: {
      type: Boolean,
      default: false
    },
    // KBS Tipi: Polis (EGM) veya Jandarma
    type: {
      type: String,
      enum: ['egm', 'jandarma'],
      default: 'egm'
    },
    // Tesis Kodu
    facilityCode: {
      type: String,
      trim: true,
      default: ''
    },
    // Kullanıcı Adı / TC Kimlik No
    username: {
      type: String,
      trim: true,
      default: ''
    },
    // Şifre (encrypted)
    password: {
      type: String,
      default: ''
    },
    // Personel TC Kimlik No (Jandarma için)
    personnelIdNumber: {
      type: String,
      trim: true,
      default: ''
    },
    // Web Servis URL'leri
    endpoints: {
      // EGM
      egmWsdl: {
        type: String,
        default: 'https://kbs.egm.gov.tr/kbstesis/services/KbsTesisService?wsdl'
      },
      // Jandarma
      jandarmaWsdl: {
        type: String,
        default: 'https://kbs.jandarma.gov.tr/KBS_Tesis_2/services/KBS?wsdl'
      }
    },
    // Otomatik gönderim
    autoSend: {
      enabled: { type: Boolean, default: false },
      // Check-in sonrası kaç dakika bekle
      delayMinutes: { type: Number, default: 5 },
      // Gece gönderim yapılmasın mı?
      pauseAtNight: { type: Boolean, default: true },
      nightStartHour: { type: Number, default: 23 },
      nightEndHour: { type: Number, default: 7 }
    },
    // Son bağlantı durumu
    lastConnection: {
      status: { type: String, enum: ['success', 'error', 'never'], default: 'never' },
      timestamp: { type: Date },
      message: { type: String }
    },
    // IP Adresi (whitelist için gerekebilir)
    serverIp: {
      type: String,
      trim: true,
      default: ''
    }
  }

}, {
  timestamps: true
})

// Unique index: Her otel için tek settings
pmsSettingsSchema.index({ partner: 1, hotel: 1 }, { unique: true })

// Statics
pmsSettingsSchema.statics.findByHotel = function(hotelId) {
  return this.findOne({ hotel: hotelId })
}

pmsSettingsSchema.statics.getOrCreate = async function(partnerId, hotelId) {
  let settings = await this.findOne({ partner: partnerId, hotel: hotelId })

  if (!settings) {
    // Varsayılan ayarlarla oluştur
    settings = await this.create({
      partner: partnerId,
      hotel: hotelId,
      // Varsayılan ödeme yöntemleri
      cashier: {
        activeCurrencies: ['TRY'],
        paymentMethods: [
          { code: 'cash', name: 'Nakit', isActive: true, isCash: true, order: 0 },
          { code: 'credit_card', name: 'Kredi Kartı', isActive: true, isCash: false, order: 1 },
          { code: 'debit_card', name: 'Banka Kartı', isActive: true, isCash: false, order: 2 },
          { code: 'bank_transfer', name: 'Havale/EFT', isActive: true, isCash: false, requireReference: true, order: 3 }
        ],
        transactionCategories: [
          { code: 'accommodation', name: 'Konaklama', type: 'income' },
          { code: 'food_beverage', name: 'Yiyecek & İçecek', type: 'income' },
          { code: 'minibar', name: 'Minibar', type: 'income' },
          { code: 'spa', name: 'Spa & Wellness', type: 'income' },
          { code: 'laundry', name: 'Çamaşırhane', type: 'income' },
          { code: 'parking', name: 'Otopark', type: 'income' },
          { code: 'other', name: 'Diğer', type: 'income' },
          { code: 'refund', name: 'İade', type: 'expense' },
          { code: 'discount', name: 'İndirim', type: 'expense' }
        ]
      },
      // Varsayılan vergi türleri
      taxes: {
        taxTypes: [
          { name: 'KDV', code: 'KDV', rate: 10, isActive: true, applyTo: 'all' },
          { name: 'Konaklama Vergisi', code: 'KV', rate: 2, isActive: true, applyTo: 'accommodation' }
        ]
      },
      // Varsayılan temizlik durumları
      housekeeping: {
        cleaningStatuses: [
          { code: 'clean', name: 'Temiz', color: '#22c55e', order: 0 },
          { code: 'dirty', name: 'Kirli', color: '#ef4444', order: 1 },
          { code: 'inspected', name: 'Kontrol Edildi', color: '#3b82f6', order: 2 },
          { code: 'in_progress', name: 'Temizleniyor', color: '#f59e0b', order: 3 },
          { code: 'out_of_order', name: 'Arızalı', color: '#6b7280', order: 4 }
        ],
        taskTypes: [
          { code: 'standard', name: 'Standart Temizlik', estimatedMinutes: 30 },
          { code: 'checkout', name: 'Check-out Temizliği', estimatedMinutes: 45 },
          { code: 'deep', name: 'Derin Temizlik', estimatedMinutes: 60 },
          { code: 'turndown', name: 'Akşam Servisi', estimatedMinutes: 15 }
        ]
      },
      // Varsayılan VIP seviyeleri
      guests: {
        vipLevels: [
          { code: 'silver', name: 'Silver', color: '#9ca3af', order: 0 },
          { code: 'gold', name: 'Gold', color: '#f59e0b', order: 1 },
          { code: 'platinum', name: 'Platinum', color: '#8b5cf6', order: 2 }
        ]
      },
      // Varsayılan rezervasyon kaynakları
      reservations: {
        bookingSources: [
          { code: 'direct', name: 'Direkt', commission: 0 },
          { code: 'phone', name: 'Telefon', commission: 0 },
          { code: 'walk_in', name: 'Walk-in', commission: 0 },
          { code: 'website', name: 'Website', commission: 0 },
          { code: 'booking_com', name: 'Booking.com', commission: 15 },
          { code: 'expedia', name: 'Expedia', commission: 18 },
          { code: 'agency', name: 'Acente', commission: 10 }
        ],
        cancellationReasons: [
          { code: 'guest_request', name: 'Misafir Talebi' },
          { code: 'no_show', name: 'No-Show' },
          { code: 'overbooking', name: 'Overbooking' },
          { code: 'payment_issue', name: 'Ödeme Sorunu' },
          { code: 'force_majeure', name: 'Mücbir Sebep' },
          { code: 'other', name: 'Diğer' }
        ]
      }
    })
  }

  return settings
}

// Fatura numarası üret
pmsSettingsSchema.methods.generateInvoiceNumber = async function() {
  const year = new Date().getFullYear()
  this.invoicing.lastInvoiceNumber += 1
  await this.save()

  const number = this.invoicing.lastInvoiceNumber.toString().padStart(6, '0')
  const prefix = this.invoicing.invoicePrefix || 'INV'

  if (this.invoicing.invoiceYearSuffix) {
    return `${prefix}-${year}-${number}`
  }
  return `${prefix}-${number}`
}

// Fiş numarası üret
pmsSettingsSchema.methods.generateReceiptNumber = async function() {
  this.cashier.lastReceiptNumber += 1
  await this.save()

  const number = this.cashier.lastReceiptNumber.toString().padStart(8, '0')
  const prefix = this.cashier.receiptPrefix || 'RCP'

  return `${prefix}${number}`
}

export default mongoose.model('PmsSettings', pmsSettingsSchema)
