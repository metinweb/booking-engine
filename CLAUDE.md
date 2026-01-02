# Booking Engine Project - Claude Documentation

## ⛔ YASAKLAR (KESİNLİKLE YAPMA)

1. **Dev Server'ları Başlatma/Durdurma**:
   - ASLA `turbo dev`, `pnpm run dev`, `npm run dev` gibi komutları çalıştırma
   - ASLA arka planda çalışan process'leri durdurma (`pkill`, `kill` vb.)
   - Kullanıcı zaten kendi terminalinde `turbo dev` ile sunucuları çalıştırıyor
   - Senin müdahalen karışıklığa neden olur, sadece kod yaz/düzenle

2. **Dosya değişikliklerinde**:
   - Backend değişiklikleri: Node.js `--watch` modu otomatik yeniden başlatır
   - Frontend değişiklikleri: Vite HMR otomatik günceller
   - Manuel restart GEREKMEZ

---

## 🚨 EN ÖNEMLİ PRENSİPLER (KALİTE STANDARTLARI)

1.  **Component Tabanlı Geliştirme (Zorunlu)**:
    *   Tekerleği yeniden icat etme. UI elementleri için `apps/admin/src/components/ui` klasörünü, iş mantığı içeren elementler için `apps/admin/src/components/common` klasörünü kontrol et.
    *   PMS özellikleri için `apps/admin/src/modules/shared/components` klasörünü kontrol et.
    *   Kod tekrarından kaçın. Reusable component mantığını benimse.

2.  **Modüler Mimari (Yeni Yapı)**:
    *   Proje **Turborepo** ile Monorepo yapısına geçmiştir.
    *   Backend ve Frontend **Domain-Driven Design (DDD)** benzeri modüler yapıya sahiptir.
    *   Yeni özellik eklerken, ilgili modülün klasörü altında çalış (`modules/guests`, `modules/billing` vb.).

3.  **Çoklu Dil Desteği**:
    *   ASLA hardcode metin kullanma. `$t('key')` yapısını kullan.
    *   Yeni metinleri `locales/tr.json` ve `en.json` dosyalarına ekle.

---

## 🏗️ MONOREPO & PROJE YAPISI

Proje, `turbo` kullanılarak yönetilen bir Monorepo'dur.

```
/var/www/mini/booking-engine/
├── apps/
│   ├── admin/                  # Vue.js Frontend (Platform & PMS Admin)
│   │   ├── src/
│   │   │   ├── components/     # Generic UI Components
│   │   │   ├── modules/        # Feature Modules (Frontend)
│   │   │   │   ├── guests/     # Misafir Yönetimi
│   │   │   │   ├── reservations/# Rezervasyon Yönetimi
│   │   │   │   ├── frontdesk/  # Ön Büro & Room Plan
│   │   │   │   ├── housekeeping/# Kat Hizmetleri
│   │   │   │   ├── billing/    # Kasa & Muhasebe
│   │   │   │   ├── shared/     # Paylaşılan Componentler
│   │   │   │   └── ...
│   │   │   ├── router/         # Vue Router
│   │   │   ├── stores/         # Pinia Stores
│   │   │   └── ...
│   │   └── package.json
│   │
│   └── api/                    # Express.js Backend (API)
│       ├── src/
│       │   ├── modules/        # Feature Modules (Backend)
│       │   │   ├── pms-guest/  # Guest API
│       │   │   ├── pms-reservation/
│       │   │   ├── pms-frontdesk/
│       │   │   ├── pms-billing/
│       │   │   ├── auth/       # Authentication
│       │   │   └── ...
│       │   ├── models/         # (Legacy) Mongoose Models
│       │   └── app.js          # App Entry Point & Route Aggregation
│       └── package.json
│
├── package.json                # Root Workspaces Config
└── turbo.json                  # Turborepo Pipelines
```

---

## 🚀 GELİŞTİRME KOMUTLARI

Projeyi çalıştırmak için **kök dizinde** aşağıdaki komutları kullanın.

### ⚡ Tüm Projeyi Başlat (Frontend + Backend)
```bash
npm run dev
# veya
npx turbo run dev
```

### 🎯 Sadece Tek Bir Uygulamayı Başlat
Eğer sadece Backend veya Frontend üzerinde çalışıyorsanız:

```bash
# Sadece API (Backend) - Port 4000 (3020 proxy)
cd apps/api
npm run dev

# Sadece Admin (Frontend) - Port 5173
cd apps/admin
npm run dev
```

**⚠️ Not:** API `npm run dev` ile başlatıldığında `node --watch` kullanır ve dosya değişikliklerinde otomatik yeniden başlar. Manuel restart gerekmez.

---

## 🎨 UI COMPONENT KÜTÜPHANESİ

Yeni bir sayfa veya özellik yaparken önce burayı kontrol et.

### 🧩 Generic UI Components (`apps/admin/src/components/ui/`)
Saf UI elemanlarıdır, iş mantığı içermezler.

| Dizin | Örnek Componentler |
|-------|-------------------|
| `buttons/` | `BaseButton`, `IconButton`, `ActionMenu` |
| `form/` | `PhoneInput`, `PasswordInput`, `Toggle`, `DateRangePicker`, `MultiLangInput` |
| `display/` | `StatusBadge`, `Avatar`, `Tooltip`, `Timeline` |
| `overlay/` | `Modal` (Çok kullanılır), `Drawer` |
| `feedback/` | `Alert`, `ConfirmDialog`, `Spinner` |
| `data/` | `DataTable` (Tüm listelerde bunu kullan) |

### 🏢 Common Components (`apps/admin/src/components/common/`)
İş mantığı içeren, domain'e özel bileşenler.

- `HotelSelector.vue`: Otel seçimi (PMS dışı)
- `PartnerSelector.vue`: Partner seçimi
- `DocumentUpload.vue`: Dosya yükleme & önizleme
- `LanguageSelector.vue`: Dil değiştirici

### 🏨 PMS Shared Components (`apps/admin/src/modules/shared/components/`)
PMS tarafında kullanılan ortak bileşenler.

- `PMSHeader.vue`: PMS üst menüsü
- `PMSSidebar.vue`: PMS sol menüsü
- `PMSNavigation.vue`: Modül içi navigasyon
- `PmsProvider.vue`: PMS context sağlayıcısı (DIKKAT: Önemli)

---

## 💡 ÖNEMLİ KONSEPTLER & BEST PRACTICES

### 1. PMS Context & Otel Bağlamı
Platform Admin bir otele ("PMS'e") giriş yaptığında, artık o otelin bir çalışanı bağlamındadır. Veriler sadece o `hotelId` için çekilmelidir.

```javascript
/* apps/admin/src/composables/usePmsContext.js */
import { usePmsContextInjection } from '@/composables/usePmsContext'

const { hotelId, isPmsUser } = usePmsContextInjection()

const fetchTasks = async () => {
  // Eğer hotelId varsa, sorgulara mutlaka ekle
  if (hotelId.value) {
    await taskService.getAll(hotelId.value)
  }
}
```

### 2. Modüler API İstekleri
Her feature (frontend) kendi servis dosyasına sahip olmalı veya modüler yapıda olmalıdır.

**YANLIŞ:** Component içinde `axios.get('/api/guests')`
**DOĞRU:** Service fonksiyonu kullanmak.

```javascript
// apps/admin/src/services/pms/guestService.js
export const getGuests = (hotelId, params) => {
    return apiClient.get(`/pms/hotels/${hotelId}/guests`, { params })
}
```

### 3. Yapay Zeka Çeviri (Gemini)
Proje yerleşik AI çeviri servisine sahiptir.
- Backend: `/api/src/services/geminiService.js`

### 4. Code Snippets (Kopyala/Yapıştır için)

**Vue View Template (Modüler):**
```vue
<template>
  <div>
    <Header>
       <template #actions>
         <BaseButton @click="openModal">Yeni Ekle</BaseButton>
       </template>
    </Header>
    
    <div class="p-6">
       <!-- İçerik -->
    </div>
    
    <MyFeatureModal v-model="showModal" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { usePmsContextInjection } from '@/composables/usePmsContext'

const { hotelId } = usePmsContextInjection()
const showModal = ref(false)
</script>
```

---

## 🛠️ TEKNOLOJİ STACK

**Frontend (`apps/admin`):**
- Vue 3 (Composition API, Script Setup)
- Tailwind CSS
- Pinia (State Management)
- Vue Router
- Vue I18n
- Vite

**Backend (`apps/api`):**
- Node.js & Express
- MongoDB & Mongoose
- Socket.io (Real-time events)
- JWT Auth

---

## 🔴 KRİTİK HATALAR VE GÜVENLİK AÇIKLARI

### 1. GÜVENLİK SORUNLARI (YÜKSEK ÖNCELİK)

#### 🚨 Hardcoded Default Admin Credentials
**Dosya:** `apps/api/src/core/bootstrap.js:50-51`

```javascript
// BU ÇOK TEHLİKELİ - Production'da admin123 şifresi kullanılıyor!
email: 'admin@platform.com',
password: 'admin123',
```

**Çözüm:** Bootstrap'de admin oluşturulduktan sonra şifre değiştirme zorunlu yapılmalı veya environment variable'dan alınmalı.

#### 🚨 JWT Secret Placeholder
**Dosya:** `apps/api/.env`

```env
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

**Çözüm:** Production için güçlü, rastgele bir secret kullanılmalı. Mevcut `.env` dosyasında placeholder var.

#### ⚠️ Config Dosyası Sadece Belirli .env Yüklüyor
**Dosya:** `apps/api/src/config/index.js:4-8`

```javascript
const envFile = process.env.NODE_ENV === 'production'
  ? '.env.production'
  : '.env.development'

dotenv.config({ path: envFile })
```

**Sorun:** Mevcut `.env` dosyası yüklenmiyor! Sadece `.env.development` veya `.env.production` yükleniyor.

**Çözüm:** Fallback olarak `.env` dosyasını da yüklemeli:
```javascript
dotenv.config({ path: envFile })
dotenv.config() // fallback to .env
```

#### ⚠️ Auth Routes'ta Rate Limiting Yok
**Dosya:** `apps/api/src/modules/auth/auth.routes.js`

Login ve register endpoint'lerinde `strictLimiter` kullanılmıyor. Brute-force saldırılara açık.

**Çözüm:**
```javascript
router.post('/login', strictLimiter, authService.login)
router.post('/register', strictLimiter, authService.register)
```

#### ⚠️ Password Minimum Length Çok Kısa
**Dosya:** `apps/api/src/modules/user/user.model.js:45`

```javascript
minlength: [6, 'PASSWORD_MIN_LENGTH']
```

**Çözüm:** Minimum 8 karakter, büyük/küçük harf + rakam zorunluluğu eklenebilir.

#### ⚠️ In-Memory Rate Limiting
**Dosya:** `apps/api/src/middleware/rateLimiter.js`

Rate limiting in-memory Map kullanıyor. Multi-instance deployment'ta çalışmaz.

**Çözüm:** Production'da Redis kullanılmalı (dosyada zaten yorum olarak not edilmiş).

### 2. KONFİGÜRASYON SORUNLARI

#### ⚠️ CORS ve CSP'de Localhost
**Dosya:** `apps/api/src/app.js:25-26`

```javascript
"img-src": ["'self'", "data:", "http://localhost:4000", "http://localhost:5174"]
```

**Çözüm:** Production build'de bu değerler environment-based olmalı.

#### ⚠️ Body Parser Limit Çok Yüksek
**Dosya:** `apps/api/src/app.js:37-38`

```javascript
app.use(express.json({ limit: '50mb' }))
```

50MB çok yüksek, DoS saldırılarına açık olabilir. Gerçekten gerekli mi kontrol edilmeli.

### 3. KOD KALİTESİ SORUNLARI

#### ⚠️ Kullanılmayan Parametre
**Dosya:** `apps/api/src/modules/booking/booking.model.js:534`

```javascript
bookingSchema.statics.generateBookingNumber = async function(partnerId, type = 'booking') {
  // partnerId kullanılmıyor!
```

#### ⚠️ Test Suite Boş
**Dosya:** `apps/api/package.json`

```json
"test": "echo \"Error: no test specified\" && exit 1"
```

Hiç test yazılmamış. Unit ve integration testler eklenmeli.

---

## 📊 PROJE İSTATİSTİKLERİ

| Metrik | Değer |
|--------|-------|
| **Backend Modüller** | 20 adet |
| **Frontend Modüller** | 11 adet |
| **Mongoose Modeller** | 31 adet |
| **API Endpoint Grupları** | 20+ |
| **Vue Componentler** | 40+ |
| **Desteklenen Diller** | 20 |
| **Toplam Proje Boyutu** | ~347MB (node_modules dahil) |

---

## 🗄️ VERİTABANI MODELLERİ (MONGOOSE)

### Ana Modeller

| Model | Dosya | Açıklama |
|-------|-------|----------|
| `User` | `user/user.model.js` | Platform, Partner, Agency kullanıcıları |
| `Partner` | `partner/partner.model.js` | Otel zincirleri, tur operatörleri |
| `Agency` | `agency/agency.model.js` | Seyahat acenteleri (B2B) |
| `Hotel` | `hotel/hotel.model.js` | Multi-tenant otel yönetimi |
| `Booking` | `booking/booking.model.js` | Rezervasyon + amendment history |
| `Guest` | `pms-guest/guest.model.js` | Misafir profilleri + konaklama geçmişi |

### PMS Modelleri

| Model | Dosya | Açıklama |
|-------|-------|----------|
| `Stay` | `pms-frontdesk/stay.model.js` | Check-in/out kayıtları |
| `Room` | `pms-housekeeping/room.model.js` | Fiziksel oda envanteri |
| `CashRegister` | `pms-billing/cashRegister.model.js` | Kasa yönetimi |
| `Transaction` | `pms-billing/transaction.model.js` | Finansal işlemler |
| `NightAudit` | `pms-billing/nightAudit.model.js` | Gece auditi |
| `PMSSettings` | `pms-settings/pmsSettings.model.js` | Otel konfigürasyonu |
| `PMSUser` | `pms-settings/pmsUser.model.js` | Otel personeli |

### Fiyatlandırma Modelleri

| Model | Dosya | Açıklama |
|-------|-------|----------|
| `RoomType` | `planning/roomType.model.js` | Oda kategorileri |
| `Season` | `planning/season.model.js` | Fiyat sezonları |
| `Rate` | `planning/rate.model.js` | Günlük fiyatlar |
| `RateOverride` | `planning/rateOverride.model.js` | Fiyat override'ları |
| `MealPlan` | `planning/mealPlan.model.js` | Pansiyon tipleri |
| `Market` | `planning/market.model.js` | Kaynak pazarlar |
| `Campaign` | `planning/campaign.model.js` | Kampanyalar |

---

## 🌐 API ENDPOİNTLERİ

### Auth (`/api/auth`)
```
POST /login          # Giriş
POST /register       # Kayıt
POST /refresh-token  # Token yenileme
POST /logout         # Çıkış (Protected)
GET  /me             # Mevcut kullanıcı (Protected)
PUT  /change-password # Şifre değiştirme (Protected)
```

### PMS Guest (`/api/pms/hotels/:hotelId/guests`)
```
GET    /                    # Misafir listesi
POST   /                    # Yeni misafir
GET    /:guestId            # Misafir detayı
PUT    /:guestId            # Misafir güncelle
DELETE /:guestId            # Misafir sil
GET    /stats               # İstatistikler
GET    /vip                 # VIP misafirler
GET    /blacklisted         # Kara liste
PATCH  /:guestId/vip        # VIP seviyesi ayarla
POST   /:guestId/blacklist  # Kara listeye ekle
POST   /:guestId/notes      # Not ekle
POST   /merge               # Misafirleri birleştir
```

### Booking (`/api/bookings`)
```
GET    /              # Rezervasyon listesi
POST   /              # Yeni rezervasyon
GET    /:id           # Rezervasyon detayı
PUT    /:id           # Rezervasyon güncelle
DELETE /:id           # Rezervasyon iptal
POST   /search        # Müsaitlik ara
POST   /price-quote   # Fiyat hesapla
```

---

## 🔧 SERVİSLER VE HELPER'LAR

### Core Servisler
| Servis | Dosya | Açıklama |
|--------|-------|----------|
| Logger | `core/logger.js` | Winston tabanlı loglama |
| Socket | `core/socket.js` | Socket.IO yönetimi |
| Errors | `core/errors.js` | Custom error sınıfları |
| Bootstrap | `core/bootstrap.js` | Uygulama başlatma |

### İş Servisleri
| Servis | Dosya | Açıklama |
|--------|-------|----------|
| PricingService | `services/pricingService.js` | Dinamik fiyatlama (1759 satır) |
| GeminiService | `services/geminiService.js` | AI çeviri |
| NotificationService | `services/notificationService.js` | Email/SMS/Push |
| SMSService | `services/smsService.js` | SMS provider factory |
| CacheService | `services/cacheService.js` | In-memory caching |
| ExchangeScheduler | `services/exchangeScheduler.js` | Döviz kurları |

### Helper'lar
| Helper | Dosya | Açıklama |
|--------|-------|----------|
| Encryption | `helpers/encryption.js` | AES-256-GCM şifreleme |
| Mail | `helpers/mail.js` | AWS SES email |
| TwoFactor | `helpers/twoFactor.js` | 2FA TOTP |
| Upload | `helpers/*.js` | Dosya yükleme |

---

## 📁 ÖNEMLİ DOSYA KONUMLARI

```
apps/api/
├── src/
│   ├── app.js                    # Express app entry
│   ├── server.js                 # HTTP server
│   ├── config/index.js           # Environment config
│   ├── core/                     # Core utilities
│   ├── middleware/               # Express middleware
│   ├── modules/                  # Feature modules (routes, services, models)
│   ├── services/                 # Shared services
│   ├── helpers/                  # Utility functions
│   └── plugins/                  # Mongoose plugins

apps/admin/
├── src/
│   ├── main.js                   # Vue app entry
│   ├── App.vue                   # Root component
│   ├── router/index.js           # Vue Router config
│   ├── stores/                   # Pinia stores
│   ├── services/                 # API service layer
│   ├── composables/              # Vue composition API hooks
│   ├── modules/                  # Feature modules (PMS)
│   ├── components/               # Shared components
│   ├── views/                    # Top-level views
│   └── locales/                  # i18n translations
```

---

## ⚙️ ENVIRONMENT VARIABLES

### Backend (Required)
```env
NODE_ENV=development|production
PORT=4000
MONGODB_URI=mongodb://localhost:27017/booking-engine
JWT_SECRET=<güçlü-rastgele-secret>
JWT_ACCESS_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d
CORS_ORIGIN=http://localhost:5173
```

### Backend (Optional)
```env
# AWS SES (Email)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_SES_REGION=eu-west-1
AWS_SES_FROM_EMAIL=

# AI Translation
GEMINI_API_KEY=

# Encryption
ENCRYPTION_KEY=<64-hex-karakter>
```

---

## 🔒 GÜVENLİK MİMARİSİ

### Authentication Flow
1. User login → JWT access token (15m) + refresh token (7d)
2. Access token header: `Authorization: Bearer <token>`
3. Token expire → Refresh token ile yenile
4. 2FA desteklenir (TOTP)

### Authorization Levels
| Level | Middleware | Açıklama |
|-------|------------|----------|
| Public | - | Kimlik gerektirmez |
| Protected | `protect` | Giriş yapmış kullanıcı |
| Admin | `requireAdmin` | Admin rolü |
| Platform Admin | `requirePlatformAdmin` | SuperAdmin |
| Partner/Admin | `requirePartnerOrAdmin` | Partner veya SuperAdmin |

### Multi-Tenant Data Isolation
- Partner-based filtering
- Hotel-based scoping (PMS)
- User role verification
- Context middleware

---

**Son Güncelleme:** 2026-01-02
**Yazar:** Antigravity (Google Deepmind)
**Proje Analizi:** Claude Opus 4.5
**Not:** Bu dosya proje mimarisinin tek gerçek kaynağıdır (SSOT). Projede değişiklik yaptıkça burayı güncelle.
