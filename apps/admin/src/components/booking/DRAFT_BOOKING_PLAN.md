# Draft Booking Sistemi - Detaylı Uygulama Planı

## Özet

Rezervasyon sürecinin F5'e dayanıklı, kalıcı ve devam edilebilir olmasını sağlayan hibrit sistem.

## Kararlar

| Konu             | Karar                                                |
| ---------------- | ---------------------------------------------------- |
| Draft süresi     | 7 gün                                                |
| Kontenjan        | Draft'ta rezerve edilmez, son aşamada kontrol edilir |
| Fatura bilgileri | Zorunlu (Bireysel/Kurumsal)                          |
| TC Kimlik        | TR vatandaşları için zorunlu                         |
| Depolama         | Hibrit (localStorage + Database)                     |

---

## Sistem Mimarisi

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         REZERVASYON AKIŞI                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────────────┐    ┌──────────────────────────────┐   │
│  │        PHASE 1               │    │         PHASE 2              │   │
│  │   Arama & Oda Seçimi         │    │   Misafir & Ödeme            │   │
│  ├──────────────────────────────┤    ├──────────────────────────────┤   │
│  │                              │    │                              │   │
│  │  • Otel/Bölge Arama          │    │  • Lead Guest Bilgileri      │   │
│  │  • Tarih Seçimi              │    │  • Oda Misafirleri           │   │
│  │  • Misafir Sayısı            │    │  • Fatura Bilgileri          │   │
│  │  • Otel Seçimi               │    │  • Ödeme Yöntemi             │   │
│  │  • Oda & Pansiyon Seçimi     │    │  • Özel İstekler             │   │
│  │  • Sepete Ekleme             │    │                              │   │
│  │                              │    │                              │   │
│  ├──────────────────────────────┤    ├──────────────────────────────┤   │
│  │  💾 localStorage             │    │  💾 Database (Draft)         │   │
│  │  URL: /bookings/new          │    │  URL: /bookings/DRF-XXXXXX   │   │
│  │  F5 → localStorage'dan yükle │    │  F5 → API'den yükle          │   │
│  │  Süre: Session + 24h         │    │  Süre: 7 gün                 │   │
│  └──────────────────────────────┘    └──────────────────────────────┘   │
│              │                                    │                      │
│              │ [DEVAM ET] butonu                  │ [TAMAMLA] butonu     │
│              ▼                                    ▼                      │
│     Draft oluştur (DB)                   Kontenjan kontrol et           │
│     bookingNumber al                     Rezervasyon tamamla            │
│     URL güncelle                         Status: confirmed              │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Database Model Güncellemeleri

### Booking Model - Yeni Alanlar

```javascript
// /api/src/modules/booking/booking.model.js

const bookingSchema = new mongoose.Schema(
  {
    // Mevcut alanlar...

    // ─────────────────────────────────────────────────────────
    // YENİ: Booking Number & Status
    // ─────────────────────────────────────────────────────────
    bookingNumber: {
      type: String,
      required: true,
      unique: true,
      index: true
      // Format: DRF-2024-000001 (draft) veya BKG-2024-000001 (confirmed)
    },

    status: {
      type: String,
      enum: ['draft', 'pending', 'confirmed', 'cancelled', 'expired', 'completed'],
      default: 'draft',
      index: true
    },

    currentPhase: {
      type: Number,
      enum: [1, 2],
      default: 2 // Draft her zaman Phase 2'de oluşur
    },

    // ─────────────────────────────────────────────────────────
    // YENİ: Arama Kriterleri (Phase 1 snapshot)
    // ─────────────────────────────────────────────────────────
    searchCriteria: {
      hotelIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Hotel' }],
      tourismRegionIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'TourismRegion' }],
      dateRange: {
        start: Date,
        end: Date
      },
      adults: { type: Number, default: 2 },
      children: [{ type: Number }], // Yaşlar
      channel: { type: String, enum: ['B2B', 'B2C'], default: 'B2B' },
      countryCode: { type: String, default: 'TR' }
    },

    // ─────────────────────────────────────────────────────────
    // YENİ: Fatura Bilgileri
    // ─────────────────────────────────────────────────────────
    invoiceDetails: {
      type: {
        type: String,
        enum: ['individual', 'corporate'],
        required: true
      },
      // Bireysel fatura
      individual: {
        firstName: String,
        lastName: String,
        tcNumber: String, // TR vatandaşları için zorunlu
        address: {
          street: String,
          city: String,
          district: String,
          postalCode: String,
          country: { type: String, default: 'TR' }
        }
      },
      // Kurumsal fatura
      corporate: {
        companyName: String,
        taxNumber: String,
        taxOffice: String,
        address: {
          street: String,
          city: String,
          district: String,
          postalCode: String,
          country: { type: String, default: 'TR' }
        }
      }
    },

    // ─────────────────────────────────────────────────────────
    // YENİ: İletişim Bilgileri
    // ─────────────────────────────────────────────────────────
    contactInfo: {
      email: { type: String, required: true },
      phone: { type: String, required: true },
      alternativePhone: String
    },

    // ─────────────────────────────────────────────────────────
    // YENİ: Zaman Damgaları
    // ─────────────────────────────────────────────────────────
    expiresAt: {
      type: Date,
      index: true
      // Draft için: createdAt + 7 gün
    },

    lastActivityAt: {
      type: Date,
      default: Date.now
    },

    completedAt: Date,
    cancelledAt: Date
  },
  { timestamps: true }
)

// Indexes
bookingSchema.index({ status: 1, expiresAt: 1 }) // Expire query için
bookingSchema.index({ partner: 1, status: 1 }) // Partner drafts için
bookingSchema.index({ createdBy: 1, status: 1 }) // User drafts için
```

### Booking Number Generator

```javascript
// /api/src/modules/booking/booking.service.js

/**
 * Generate unique booking number
 * @param {string} type - 'draft' or 'booking'
 * @returns {string} - DRF-2024-000001 or BKG-2024-000001
 */
export async function generateBookingNumber(type = 'booking') {
  const prefix = type === 'draft' ? 'DRF' : 'BKG'
  const year = new Date().getFullYear()

  // Find the last booking number for this type and year
  const lastBooking = await Booking.findOne({
    bookingNumber: new RegExp(`^${prefix}-${year}-`)
  }).sort({ bookingNumber: -1 })

  let sequence = 1
  if (lastBooking) {
    const lastSequence = parseInt(lastBooking.bookingNumber.split('-')[2])
    sequence = lastSequence + 1
  }

  return `${prefix}-${year}-${String(sequence).padStart(6, '0')}`
}
```

---

## API Endpoints

### Draft Endpoints

```javascript
// /api/src/modules/booking/booking.routes.js

// Draft CRUD
router.post('/drafts', protect, createDraft) // Phase 2'ye geçerken
router.get('/drafts', protect, getMyDrafts) // Kullanıcının draftları
router.get('/drafts/:bookingNumber', protect, getDraft)
router.put('/drafts/:bookingNumber', protect, updateDraft)
router.delete('/drafts/:bookingNumber', protect, deleteDraft)

// Draft -> Booking dönüşümü
router.post('/drafts/:bookingNumber/complete', protect, completeDraft)

// Mevcut booking listesi (drafts dahil)
router.get('/', protect, getBookings) // ?status=draft,confirmed,pending
```

### Endpoint Detayları

```javascript
// POST /api/bookings/drafts
// Phase 2'ye geçerken draft oluşturur
{
  // Request Body
  searchCriteria: {
    hotelIds: ['...'],
    dateRange: { start: '2024-01-25', end: '2024-01-28' },
    adults: 2,
    children: [5, 8],
    channel: 'B2B',
    countryCode: 'TR'
  },
  hotel: 'hotelId',
  rooms: [{
    roomType: 'roomTypeId',
    mealPlan: 'mealPlanId',
    pricing: { originalTotal, finalTotal, currency, ... },
    customDiscount: { type: 'percent', value: 5, amount: 500 },
    dailyBreakdown: [...]
  }]
}

// Response
{
  success: true,
  data: {
    bookingNumber: 'DRF-2024-000001',
    status: 'draft',
    currentPhase: 2,
    expiresAt: '2024-02-01T12:00:00Z',
    ...
  }
}
```

```javascript
// PUT /api/bookings/drafts/:bookingNumber
// Draft güncelleme (auto-save)
{
  guests: {
    leadGuest: { title, firstName, lastName, email, phone, nationality },
    roomGuests: [[...], [...]]
  },
  invoiceDetails: {
    type: 'corporate',
    corporate: {
      companyName: 'ABC Turizm',
      taxNumber: '1234567890',
      taxOffice: 'Kadıköy',
      address: { ... }
    }
  },
  contactInfo: {
    email: 'info@abc.com',
    phone: '+90 532 123 4567'
  },
  payment: {
    method: 'bank_transfer'
  },
  specialRequests: 'Deniz manzaralı oda'
}
```

```javascript
// POST /api/bookings/drafts/:bookingNumber/complete
// Draft'ı tamamla ve rezervasyona dönüştür
{
  // Son kontroller yapılır:
  // 1. Kontenjan kontrolü
  // 2. Fiyat değişikliği kontrolü
  // 3. Validasyon

  // Başarılıysa:
  // - bookingNumber: DRF-xxx → BKG-xxx
  // - status: draft → confirmed (veya pending)
  // - Kontenjan rezerve edilir
  // - Onay emaili gönderilir
}

// Response (başarılı)
{
  success: true,
  data: {
    bookingNumber: 'BKG-2024-000001',
    status: 'confirmed',
    ...
  }
}

// Response (kontenjan yok)
{
  success: false,
  error: {
    code: 'ALLOTMENT_NOT_AVAILABLE',
    message: 'Seçilen tarihler için yeterli kontenjan kalmadı',
    details: {
      unavailableDates: ['2024-01-26', '2024-01-27']
    }
  }
}
```

---

## Frontend Değişiklikleri

### 1. localStorage Service

```javascript
// /admin/src/services/bookingStorageService.js

const STORAGE_KEY = 'booking_phase1'
const STORAGE_EXPIRY_HOURS = 24

export const bookingStorageService = {
  /**
   * Phase 1 verisini kaydet
   */
  savePhase1(data) {
    const payload = {
      data,
      savedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + STORAGE_EXPIRY_HOURS * 60 * 60 * 1000).toISOString()
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  },

  /**
   * Phase 1 verisini yükle
   */
  loadPhase1() {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return null

    try {
      const payload = JSON.parse(stored)

      // Expire kontrolü
      if (new Date(payload.expiresAt) < new Date()) {
        this.clearPhase1()
        return null
      }

      return payload.data
    } catch {
      return null
    }
  },

  /**
   * Phase 1 verisini temizle
   */
  clearPhase1() {
    localStorage.removeItem(STORAGE_KEY)
  },

  /**
   * Phase 1 verisi var mı?
   */
  hasPhase1() {
    return this.loadPhase1() !== null
  }
}
```

### 2. Store Güncellemeleri

```javascript
// /admin/src/stores/booking.js - Yeni Actions

// localStorage'a kaydet (Phase 1)
saveToLocalStorage() {
  bookingStorageService.savePhase1({
    search: this.search,
    searchResults: {
      hotels: this.searchResults.hotels,
      selectedHotelId: this.searchResults.selectedHotelId,
      selectedHotelRooms: this.searchResults.selectedHotelRooms
    },
    cart: this.cart
  })
},

// localStorage'dan yükle (Phase 1)
loadFromLocalStorage() {
  const data = bookingStorageService.loadPhase1()
  if (data) {
    this.search = data.search
    this.searchResults = data.searchResults
    this.cart = data.cart
    return true
  }
  return false
},

// Draft oluştur (Phase 2'ye geçiş)
async createDraft() {
  try {
    this.loading.booking = true

    const response = await apiClient.post('/bookings/drafts', {
      searchCriteria: this.search,
      hotel: this.searchResults.selectedHotelId,
      rooms: this.cart.map(item => ({
        roomType: item.roomType._id,
        mealPlan: item.mealPlan._id,
        pricing: item.pricing,
        customDiscount: item.customDiscount,
        dailyBreakdown: item.dailyBreakdown
      }))
    })

    this.draftBookingNumber = response.data.data.bookingNumber
    this.draftData = response.data.data

    // localStorage'ı temizle (artık DB'de)
    bookingStorageService.clearPhase1()

    return response.data.data
  } catch (error) {
    this.error = error.response?.data?.message || 'Draft oluşturulamadı'
    throw error
  } finally {
    this.loading.booking = false
  }
},

// Draft güncelle (auto-save)
async updateDraft() {
  if (!this.draftBookingNumber) return

  try {
    await apiClient.put(`/bookings/drafts/${this.draftBookingNumber}`, {
      guests: this.guests,
      invoiceDetails: this.invoiceDetails,
      contactInfo: this.contactInfo,
      payment: this.payment,
      specialRequests: this.specialRequests
    })

    this.lastSavedAt = new Date()
  } catch (error) {
    console.error('Draft kaydetme hatası:', error)
  }
},

// Draft'tan yükle
async loadDraft(bookingNumber) {
  try {
    this.loading.booking = true

    const response = await apiClient.get(`/bookings/drafts/${bookingNumber}`)
    const draft = response.data.data

    // State'i doldur
    this.draftBookingNumber = draft.bookingNumber
    this.draftData = draft
    this.currentPhase = draft.currentPhase
    this.search = draft.searchCriteria
    this.cart = draft.rooms
    this.guests = draft.guests || { leadGuest: {}, roomGuests: [] }
    this.invoiceDetails = draft.invoiceDetails || {}
    this.contactInfo = draft.contactInfo || {}
    this.payment = draft.payment || {}
    this.specialRequests = draft.specialRequests || ''

    // Otel ve oda bilgilerini yükle
    if (draft.hotel) {
      await this.selectHotel(draft.hotel._id || draft.hotel)
    }

    return draft
  } catch (error) {
    this.error = error.response?.data?.message || 'Draft yüklenemedi'
    throw error
  } finally {
    this.loading.booking = false
  }
},

// Draft'ı tamamla
async completeDraft() {
  if (!this.draftBookingNumber) {
    throw new Error('Draft bulunamadı')
  }

  try {
    this.loading.booking = true

    const response = await apiClient.post(
      `/bookings/drafts/${this.draftBookingNumber}/complete`
    )

    this.bookingResult = response.data.data
    return response.data.data
  } catch (error) {
    // Kontenjan hatası özel handling
    if (error.response?.data?.error?.code === 'ALLOTMENT_NOT_AVAILABLE') {
      this.allotmentError = error.response.data.error.details
    }
    this.error = error.response?.data?.message || 'Rezervasyon tamamlanamadı'
    throw error
  } finally {
    this.loading.booking = false
  }
}
```

### 3. Router Güncellemeleri

```javascript
// /admin/src/router/index.js

{
  path: '/bookings/new',
  name: 'NewBooking',
  component: () => import('@/views/booking/BookingView.vue'),
  meta: { requiresAuth: true }
},
{
  path: '/bookings/:bookingNumber',
  name: 'BookingDetail',
  component: () => import('@/views/booking/BookingView.vue'),
  meta: { requiresAuth: true },
  props: true
}
```

### 4. BookingView Güncellemesi

```javascript
// /admin/src/views/booking/BookingView.vue

<script setup>
import { onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBookingStore } from '@/stores/booking'

const route = useRoute()
const router = useRouter()
const bookingStore = useBookingStore()

onMounted(async () => {
  const { bookingNumber } = route.params

  if (bookingNumber) {
    // URL'de booking number var - draft veya booking yükle
    if (bookingNumber.startsWith('DRF-')) {
      await bookingStore.loadDraft(bookingNumber)
    } else {
      // Onaylı rezervasyon - sadece görüntüleme
      await bookingStore.loadBooking(bookingNumber)
    }
  } else {
    // Yeni rezervasyon - localStorage kontrol et
    const hasLocalData = bookingStore.loadFromLocalStorage()
    if (hasLocalData) {
      // Kaldığı yerden devam
      console.log('📦 localStorage verisi yüklendi')
    }
  }
})

// Phase 2'ye geçiş
const handleProceedToCheckout = async () => {
  // Draft oluştur ve URL'i güncelle
  const draft = await bookingStore.createDraft()
  router.replace(`/bookings/${draft.bookingNumber}`)
  bookingStore.currentPhase = 2
}

// Sepet değişikliklerini localStorage'a kaydet
watch(
  () => [bookingStore.search, bookingStore.cart],
  () => {
    if (bookingStore.currentPhase === 1 && !bookingStore.draftBookingNumber) {
      bookingStore.saveToLocalStorage()
    }
  },
  { deep: true }
)

// Phase 2 değişikliklerini auto-save
watch(
  () => [bookingStore.guests, bookingStore.invoiceDetails, bookingStore.payment],
  debounce(() => {
    if (bookingStore.currentPhase === 2 && bookingStore.draftBookingNumber) {
      bookingStore.updateDraft()
    }
  }, 1000),
  { deep: true }
)
</script>
```

### 5. Yeni Component: InvoiceDetailsForm

```vue
<!-- /admin/src/components/booking/checkout/InvoiceDetailsForm.vue -->

<template>
  <div
    class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden"
  >
    <!-- Header -->
    <div class="px-5 py-4 border-b border-gray-200 dark:border-slate-700">
      <h3 class="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        <span class="material-icons text-purple-500">receipt_long</span>
        {{ $t('booking.invoiceDetails') }}
      </h3>
    </div>

    <div class="p-5 space-y-4">
      <!-- Fatura Tipi Toggle -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
          {{ $t('booking.invoiceType') }}
        </label>
        <div class="flex rounded-lg bg-gray-100 dark:bg-slate-700 p-1">
          <button
            @click="invoiceType = 'individual'"
            :class="[
              'flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors',
              invoiceType === 'individual'
                ? 'bg-white dark:bg-slate-600 text-purple-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            ]"
          >
            <span class="material-icons text-sm mr-1">person</span>
            {{ $t('booking.individualInvoice') }}
          </button>
          <button
            @click="invoiceType = 'corporate'"
            :class="[
              'flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors',
              invoiceType === 'corporate'
                ? 'bg-white dark:bg-slate-600 text-purple-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            ]"
          >
            <span class="material-icons text-sm mr-1">business</span>
            {{ $t('booking.corporateInvoice') }}
          </button>
        </div>
      </div>

      <!-- Bireysel Fatura Formu -->
      <div v-if="invoiceType === 'individual'" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              {{ $t('booking.firstName') }} *
            </label>
            <input v-model="individual.firstName" type="text" class="form-input w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              {{ $t('booking.lastName') }} *
            </label>
            <input v-model="individual.lastName" type="text" class="form-input w-full" />
          </div>
        </div>

        <!-- TC Kimlik (TR vatandaşları için) -->
        <div v-if="isTurkishCitizen">
          <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
            {{ $t('booking.tcNumber') }} *
          </label>
          <input
            v-model="individual.tcNumber"
            type="text"
            maxlength="11"
            class="form-input w-full"
            :placeholder="$t('booking.tcNumberPlaceholder')"
          />
          <p class="mt-1 text-xs text-gray-500">{{ $t('booking.tcNumberHint') }}</p>
        </div>

        <!-- Adres -->
        <AddressForm v-model="individual.address" />
      </div>

      <!-- Kurumsal Fatura Formu -->
      <div v-else class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
            {{ $t('booking.companyName') }} *
          </label>
          <input v-model="corporate.companyName" type="text" class="form-input w-full" />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              {{ $t('booking.taxNumber') }} *
            </label>
            <input v-model="corporate.taxNumber" type="text" class="form-input w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              {{ $t('booking.taxOffice') }} *
            </label>
            <input v-model="corporate.taxOffice" type="text" class="form-input w-full" />
          </div>
        </div>

        <!-- Adres -->
        <AddressForm v-model="corporate.address" />
      </div>
    </div>
  </div>
</template>
```

---

## Cron Job: Draft Expire

```javascript
// /api/src/jobs/expireDrafts.js

import cron from 'node-cron'
import Booking from '../modules/booking/booking.model.js'

// Her gece 03:00'te çalış
cron.schedule('0 3 * * *', async () => {
  console.log('🧹 Expired drafts temizleniyor...')

  const result = await Booking.updateMany(
    {
      status: 'draft',
      expiresAt: { $lt: new Date() }
    },
    {
      $set: { status: 'expired' }
    }
  )

  console.log(`✅ ${result.modifiedCount} draft expire edildi`)
})
```

---

## Rezervasyonlar Listesi Güncellemesi

```vue
<!-- Booking listesinde draft gösterimi -->

<template>
  <tr :class="{ 'bg-yellow-50 dark:bg-yellow-900/10': booking.status === 'draft' }">
    <td>
      <span :class="statusBadgeClass">
        {{ booking.bookingNumber }}
      </span>
    </td>
    <td>{{ booking.hotel?.name }}</td>
    <td>{{ formatDateRange(booking.checkIn, booking.checkOut) }}</td>
    <td>{{ formatPrice(booking.grandTotal) }}</td>
    <td>
      <StatusBadge :status="booking.status" />
    </td>
    <td>
      <!-- Draft için "Devam Et" butonu -->
      <router-link
        v-if="booking.status === 'draft'"
        :to="`/bookings/${booking.bookingNumber}`"
        class="btn-primary btn-sm"
      >
        <span class="material-icons text-sm mr-1">play_arrow</span>
        {{ $t('booking.continue') }}
      </router-link>

      <!-- Diğer durumlar için "Görüntüle" -->
      <router-link v-else :to="`/bookings/${booking.bookingNumber}`" class="btn-secondary btn-sm">
        {{ $t('common.view') }}
      </router-link>
    </td>
  </tr>
</template>
```

---

## Uygulama Adımları

### Adım 1: Backend Model & Service

- [ ] Booking model güncelle (yeni alanlar)
- [ ] generateBookingNumber fonksiyonu
- [ ] Draft CRUD servisleri
- [ ] completeDraft servisi (kontenjan kontrol dahil)

### Adım 2: Backend Routes & Validation

- [ ] Draft routes ekle
- [ ] Validation middleware
- [ ] Error handling (kontenjan yok, vs.)

### Adım 3: Frontend Storage Service

- [ ] bookingStorageService oluştur
- [ ] localStorage helpers

### Adım 4: Store Güncellemeleri

- [ ] Draft actions ekle
- [ ] localStorage entegrasyonu
- [ ] Auto-save mekanizması

### Adım 5: Router & View

- [ ] Route yapısı güncelle
- [ ] BookingView draft/resume logic

### Adım 6: Yeni Componentler

- [ ] InvoiceDetailsForm.vue
- [ ] AddressForm.vue
- [ ] DraftSavedIndicator.vue

### Adım 7: Booking Listesi

- [ ] Draft filtresi ekle
- [ ] "Devam Et" butonu
- [ ] Status badge'leri

### Adım 8: Cron Job

- [ ] Draft expire job
- [ ] Test

### Adım 9: i18n

- [ ] Yeni çeviri key'leri

### Adım 10: Test & Polish

- [ ] F5 testleri
- [ ] Kontenjan kontrol testi
- [ ] Edge case'ler

---

## Notlar

1. **B2C Uyumluluğu**: Bu sistem B2C'de de kullanılabilir. Tek fark:
   - B2C'de draft süresi daha kısa olabilir (24h?)
   - B2C'de fatura bilgileri opsiyonel olabilir

2. **Performans**: localStorage sınırı ~5MB. Çok fazla oda seçilirse sorun olabilir.
   Çözüm: Sadece ID'leri sakla, detayları API'den al.

3. **Güvenlik**: Draft'lara sadece oluşturan kullanıcı erişebilmeli.

4. **UX**: "Kaydedildi" göstergesi önemli - kullanıcı güvende hissetmeli.
