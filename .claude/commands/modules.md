# Backend Modül Listesi

Bu komut tüm backend modüllerini ve sorumluluklarını listeler.

---

## Modül Haritası

### Core Business Modüller

| Modül | Konum | Açıklama | Boyut |
|-------|-------|----------|-------|
| **booking** | `modules/booking/` | Rezervasyon yönetimi | 6 servis, 4 route |
| **hotel** | `modules/hotel/` | Otel yönetimi | 1271 satır model |
| **tour** | `modules/tour/` | Tur yönetimi | 1220 satır servis |
| **partner** | `modules/partner/` | Partner yönetimi | 1541 satır servis |
| **agency** | `modules/agency/` | Acente yönetimi | 613 satır |
| **planning** | `modules/planning/` | Fiyatlandırma | 8 servis |

### Payment & Finance

| Modül | Konum | Açıklama |
|-------|-------|----------|
| **payment** | `modules/booking/payment.*` | Ödeme işlemleri |
| **paymentLink** | `modules/paymentLink/` | Ödeme linki |
| **subscriptionInvoice** | `modules/subscriptionInvoice/` | Abonelik faturaları |
| **exchange** | `modules/exchange/` | Döviz kurları |

### User & Auth

| Modül | Konum | Açıklama |
|-------|-------|----------|
| **auth** | `modules/auth/` | Kimlik doğrulama |
| **user** | `modules/user/` | Kullanıcı yönetimi |
| **session** | `modules/session/` | Oturum yönetimi |
| **my** | `modules/my/` | Profil işlemleri |

### Communication

| Modül | Konum | Açıklama |
|-------|-------|----------|
| **notification** | `modules/notification/` | Bildirim yönetimi |
| **notification-log** | `modules/notification-log/` | Bildirim logları |
| **email-log** | `modules/email-log/` | Email logları |
| **push** | `modules/push/` | Push notification |

### Content & Settings

| Modül | Konum | Açıklama |
|-------|-------|----------|
| **siteSettings** | `modules/siteSettings/` | Site ayarları |
| **platform-settings** | `modules/platform-settings/` | Platform ayarları |
| **translation** | `modules/translation/` | Çeviri yönetimi |
| **tag** | `modules/tag/` | Etiket yönetimi |
| **location** | `modules/location/` | Konum yönetimi |

### Integration & External

| Modül | Konum | Açıklama |
|-------|-------|----------|
| **paximum** | `modules/paximum/` | Paximum entegrasyonu |
| **public** | `modules/public/` | Public API'ler |
| **shortUrl** | `modules/shortUrl/` | Kısa URL servisi |

### Admin & Monitoring

| Modül | Konum | Açıklama |
|-------|-------|----------|
| **dashboard** | `modules/dashboard/` | Dashboard verileri |
| **audit** | `modules/audit/` | Audit log |
| **issue** | `modules/issue/` | Issue tracking |
| **debug** | `modules/debug/` | Debug endpoint'leri |

---

## Servis Katmanı Yapısı

### Standart Modül Yapısı
```
modules/example/
├── example.model.js      # Mongoose model
├── example.service.js    # Business logic + route handlers
├── example.routes.js     # Express routes
└── index.js              # Re-exports
```

### Booking Modülü (Refactored)
```
modules/booking/
├── booking.model.js
├── booking.service.js          # Re-export only
├── booking.routes.js
├── bookingCrud.service.js      # CRUD operasyonları
├── search.service.js           # Arama
├── drafts.service.js           # Draft yönetimi
├── amendments.service.js       # Değişiklikler
├── stats.service.js            # İstatistikler
├── hotelListing.service.js     # Otel listeleme
├── helpers.js                  # Yardımcı fonksiyonlar
├── payment.model.js
├── payment.service.js
├── payment.routes.js
├── paymentAnalytics.service.js
├── paymentAnalytics.routes.js
├── paymentWebhook.routes.js
└── index.js
```

---

## Route Yükleme

Routes otomatik yüklenir: `src/loaders/routes.js`

```javascript
// Custom path mapping
const ROUTE_CONFIG = {
  'booking': '/booking',
  'hotel': '/hotels',
  'partner': '/partners',
  // ... diğerleri
}
```

**Endpoint pattern:** `/api/{module-name}`

---

## Yeni Modül Oluşturma

```bash
# Temel modül
pnpm create-module room-inventory

# Store ile birlikte
pnpm create-module room-inventory --with-store

# Model olmadan
pnpm create-module room-inventory --no-model
```

---

## Path Aliases

```javascript
import { asyncHandler } from '#helpers'
import { NotFoundError } from '#core/errors.js'
import config from '#config'
import Booking from '#modules/booking/booking.model.js'
```

| Alias | Yol |
|-------|-----|
| `#config` | `./src/config/index.js` |
| `#core/*` | `./src/core/*` |
| `#helpers` | `./src/helpers/index.js` |
| `#middleware/*` | `./src/middleware/*` |
| `#modules/*` | `./src/modules/*` |
| `#services/*` | `./src/services/*` |

---

## Büyük Dosyalar (Refactor Adayları)

| Dosya | Satır | Not |
|-------|-------|-----|
| partner.service.js | 1541 | Split önerisi |
| bookingCrud.service.js | 1289 | Route handlers ayrılmalı |
| hotel.model.js | 1271 | Nested schema'lar |
| tour.service.js | 1220 | Split önerisi |
| payment.service.js | 1202 | Domain'lere ayır |
| hotel.routes.js | 1089 | Controller'lara böl |
