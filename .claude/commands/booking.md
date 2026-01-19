# Booking Sistemi Rehberi

Bu komut booking (rezervasyon) sistemi hakkında bilgi sağlar.

---

## Dosya Konumları

### Backend
| Dosya | Satır | Açıklama |
|-------|-------|----------|
| `apps/api/src/modules/booking/booking.model.js` | 771 | Booking MongoDB modeli |
| `apps/api/src/modules/booking/bookingCrud.service.js` | 1289 | CRUD operasyonları |
| `apps/api/src/modules/booking/search.service.js` | - | Arama ve fiyatlandırma |
| `apps/api/src/modules/booking/drafts.service.js` | - | Draft yönetimi |
| `apps/api/src/modules/booking/amendments.service.js` | - | Değişiklik işlemleri |
| `apps/api/src/modules/booking/stats.service.js` | - | İstatistikler |
| `apps/api/src/modules/booking/hotelListing.service.js` | - | Otel listeleme |

### Frontend
| Dosya | Açıklama |
|-------|----------|
| `apps/admin/src/services/bookingService.js` | API client (278 satır) |
| `apps/admin/src/stores/booking.js` | Ana store (606 satır) |
| `apps/admin/src/stores/booking/cartActions.js` | Sepet işlemleri |
| `apps/admin/src/stores/booking/searchActions.js` | Arama işlemleri |
| `apps/admin/src/stores/booking/draftActions.js` | Draft işlemleri |

---

## Booking Model Yapısı

```javascript
{
  bookingNumber: String,        // Benzersiz rezervasyon numarası
  status: String,               // draft, pending, confirmed, cancelled, completed
  type: String,                 // hotel, tour

  // İlişkiler
  partner: ObjectId,            // Partner referansı
  agency: ObjectId,             // Acente (opsiyonel)
  hotel: ObjectId,              // Otel referansı

  // Misafir bilgileri
  leadGuest: {
    title: String,
    firstName: String,
    lastName: String,
    email: String,
    phone: String,
    nationality: String
  },
  contact: {                    // İletişim bilgileri (leadGuest'ten farklı olabilir)
    email: String,
    phone: String
  },
  guests: [{...}],              // Tüm misafirler

  // Oda bilgileri
  rooms: [{
    roomType: ObjectId,
    ratePlan: ObjectId,
    checkIn: Date,
    checkOut: Date,
    guests: [{...}],
    pricing: {...}
  }],

  // Fiyatlandırma
  pricing: {
    currency: String,
    totalAmount: Number,
    netAmount: Number,
    commission: Number,
    taxes: [{...}]
  },

  // Ödeme durumu (DİKKAT: Denormalize veri, Payment collection'dan hesaplanmalı)
  payment: {
    status: String,             // pending, partial, paid, refunded
    paidAmount: Number,         // ⚠️ Payment aggregate ile hesapla
    method: String
  }
}
```

---

## Kritik Bilgiler

### 1. Payment Data Integrity
```javascript
// ❌ YANLIŞ - Denormalize veri güvenilmez
const paidAmount = booking.payment.paidAmount

// ✅ DOĞRU - Payment collection'dan hesapla
const payments = await Payment.aggregate([
  { $match: { booking: bookingId, status: 'completed' } },
  { $group: { _id: null, total: { $sum: '$amount' } } }
])
```

### 2. Draft vs Confirmed
- Draft: Henüz tamamlanmamış rezervasyon
- `completeDraft()` fonksiyonu ile onaylanır
- Draft'ta payment alınamaz

### 3. Booking Wizard Akışı
```
Step1 (Otel Seç) → Step2 (Oda Seç) → Step3 (Misafir) → Step4 (Ödeme) → Step5 (Özet)
```

---

## API Endpoints

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/booking` | Rezervasyon listesi |
| GET | `/api/booking/:id` | Detay |
| POST | `/api/booking` | Yeni oluştur |
| PUT | `/api/booking/:id` | Güncelle |
| POST | `/api/booking/:id/complete` | Draft'ı tamamla |
| POST | `/api/booking/:id/cancel` | İptal et |

---

## İlgili Modüller
- Payment: `/payment` komutu
- Hotel: `apps/api/src/modules/hotel/`
- Tour: `apps/api/src/modules/tour/`
