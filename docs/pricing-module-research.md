# Otel Fiyatlandırma Modülü - Kapsamlı Araştırma Raporu

## 1. Fiyatlandırma Modelleri Karşılaştırması

### 1.1 Per Room (Oda Bazlı Fiyat)

| Özellik | Detay |
|---------|-------|
| **Nasıl çalışır** | Odaya tek fiyat, kişi sayısı önemli değil |
| **Kullanım alanı** | Room Only satışlarda, ABD pazarında yaygın |
| **Avantaj** | Basit yönetim, kolay anlaşılır |
| **Dezavantaj** | Tek kişi kalınca gelir kaybı |

```
Örnek: Deluxe Oda = €100/gece (1 kişi de, 2 kişi de)
```

### 1.2 Per Person (Kişi Başı Fiyat)

| Özellik | Detay |
|---------|-------|
| **Nasıl çalışır** | Her misafir için ayrı fiyat |
| **Kullanım alanı** | AI (All-Inclusive), HB/FB oteller |
| **Avantaj** | Yemek maliyetlerini doğru yansıtır |
| **Dezavantaj** | Karmaşık spreadsheet hesapları, hata riski yüksek |

```
Örnek: €80/kişi → 2 kişi = €160/gece
```

### 1.3 Occupancy-Based (Doluluk Bazlı Fiyat) ⭐ ÖNERİLEN

| Özellik | Detay |
|---------|-------|
| **Nasıl çalışır** | Kişi sayısına göre kademeli fiyat |
| **Kullanım alanı** | Expedia & Booking.com destekliyor, modern oteller |
| **Avantaj** | Esneklik, her durumu optimize eder |
| **Dezavantaj** | Karmaşıklık (4 oda × 4 rate plan = 48 fiyat!) |

```
Örnek:
- 1 kişi: €80
- 2 kişi: €100 (baz fiyat)
- 3 kişi: €130
- Çocuk (0-6): +€20
- Çocuk (7-12): +€35
```

---

## 2. Booking.com Extranet Yapısı

### 2.1 Takvim Görünümleri

Booking.com iki ana görünüm sunar:
- **List View**: Oda tiplerini satırda, tarihleri sütunda gösterir
- **Monthly View**: Aylık takvim grid'i

### 2.2 Rate Plan Tipleri

- **Standard Rate**: Temel fiyat
- **Non-Refundable**: İade edilemez (genelde %10-15 indirimli)
- **Early Booker**: Erken rezervasyon indirimi
- **Weekly/Monthly**: Uzun konaklama indirimleri
- **Mobile Rate**: Mobil özel fiyat

### 2.3 Bulk Edit Özelliği

1. Tarih aralığı seçimi
2. Hangi günler? (Hafta içi/Hafta sonu/Tümü)
3. Fiyat veya kontenjan girişi
4. Kaydet

### 2.4 Kısıtlamalar (Restrictions)

- **Min Stay**: Minimum konaklama süresi
- **Max Stay**: Maksimum konaklama süresi
- **CTA (Closed to Arrival)**: O gün giriş yapılamaz
- **CTD (Closed to Departure)**: O gün çıkış yapılamaz
- **Stop Sale**: Satışa kapalı

---

## 3. Hibrit Model Önerisi

Sistemimiz için **Occupancy-Based + Oda Bazlı** hibrit yaklaşım:

```javascript
// Rate Model Yapısı
{
  roomType: ObjectId,
  mealPlan: ObjectId,
  market: ObjectId,

  // Baz fiyat (standart doluluk için)
  pricePerNight: 100,

  // Kişi bazlı farklar
  singleSupplement: -20,    // Tek kişi: -20€ (80€)
  extraAdult: +35,          // Ekstra yetişkin
  extraChild: [
    { minAge: 0, maxAge: 5, price: 0 },     // Bebek: ücretsiz
    { minAge: 6, maxAge: 11, price: 20 },   // Çocuk: +20€
    { minAge: 12, maxAge: 17, price: 30 }   // Genç: +30€
  ],

  // Kontenjan & Kısıtlamalar
  allotment: 10,
  minStay: 2,
  maxStay: 14,
  stopSale: false,
  closedToArrival: false,
  closedToDeparture: false
}
```

---

## 4. Veritabanı Stratejisi

### 4.1 İki Aşamalı Yaklaşım

1. **Rate (Ana Kayıt)**: Sezon bazlı tanımlar, uzun dönem
2. **DailyRate (Günlük)**: Hızlı sorgulama, denormalize

```
Rate (Sezon bazlı)     →    Günlük Generate    →    DailyRate
┌─────────────────┐         ┌───────────┐         ┌──────────────┐
│ Yaz Sezonu      │   →     │ Job/Cron  │   →     │ 2025-06-01   │
│ 01.06-30.09     │         │ veya      │         │ 2025-06-02   │
│ €150/gece       │         │ On-demand │         │ ...          │
└─────────────────┘         └───────────┘         │ 2025-09-30   │
                                                  └──────────────┘
```

### 4.2 DailyRate Model (Denormalized)

```javascript
{
  hotel: ObjectId,
  date: Date,           // 2025-01-15 (günlük granülarite)
  roomType: ObjectId,
  mealPlan: ObjectId,
  market: ObjectId,

  price: 120,
  singleSupplement: -20,
  extraAdult: 35,
  childPricing: [...],

  allotment: 10,
  booked: 4,
  available: 6,         // Hesaplanmış alan

  stopSale: false,
  minStay: 2,
  closedToArrival: false,
  closedToDeparture: false,

  // Kaynak bilgisi
  sourceRate: ObjectId,
  sourceSeason: ObjectId
}
```

### 4.3 Compound Index (Kritik)

```javascript
db.dailyRates.createIndex({
  hotel: 1,
  date: 1,
  market: 1,
  roomType: 1,
  mealPlan: 1
})
```

---

## 5. Kontenjan (Allotment) Yönetimi

### 5.1 Pooled Inventory

Tüm kanallar aynı havuzdan çeker - overbooking riski minimize edilir.

### 5.2 Two-Way Sync

```
Rezervasyon Geldi (B2C/B2B/OTA)
         ↓
    DailyRate.booked += 1
    DailyRate.available -= 1
         ↓
    Tüm Kanallara Sync (Event)
```

---

## 6. UI/UX Best Practices

### 6.1 Takvim Grid Görünümü

```
          Ocak 2025
    Pzt  Sal  Çar  Per  Cum  Cmt  Paz
    [1]  [2]  [3]  [4]  [5]  [6]  [7]
    €100 €100 €120 €120 €150 €180 €180
    ■■■■ ■■■■ ■■■■ ■■■■ ■■■□ ■■□□ ■■□□
    10   10   10   10   8    6    6
```

Her hücrede:
1. Tarih
2. Fiyat (renk kodu ile)
3. Doluluk barı (görsel)
4. Kalan kontenjan

### 6.2 Renk Kodlama

- 🟢 Yeşil: Müsait (kontenjan var)
- 🟡 Sarı: Az kaldı (son 3 oda)
- 🔴 Kırmızı: Dolu veya Stop Sale
- ⬜ Gri: Kapalı (CTA/CTD)

### 6.3 Quick Actions

- Drag-select ile çoklu tarih seçimi
- Right-click context menu
- Keyboard shortcuts (Ctrl+C, Ctrl+V for copy/paste)

---

## 7. Kaynaklar

- [Booking.com Partner Help - Setting Up Rates](https://partner.booking.com/en-us/help/rates-availability/room-settings/setting-or-changing-room-rates)
- [Booking.com - Updating Rates and Availability](https://partner.booking.com/en-us/help/rates-availability/extranet-calendar/updating-your-rates-and-availability)
- [Hotel Pricing Models Comparison - LinkedIn](https://www.linkedin.com/pulse/different-pricing-models-hotel-industry-per-room-person-kaya-mba)
- [Hotel Spider - Occupancy Based Pricing](https://www.hotel-spider.com/en/insights/occupancy-dependent-room-pricing)
- [SiteMinder Hotel Pricing Guide](https://www.siteminder.com/r/hotel-pricing/)
- [MyLighthouse - Hotel Rate Management](https://www.mylighthouse.com/resources/blog/hotel-rate-management)
- [NetSuite Hotel Inventory Management](https://www.netsuite.com/portal/resource/articles/inventory-management/hotel-inventory-management.shtml)
- [Cloudbeds - Hotel Inventory Management](https://www.cloudbeds.com/articles/hotel-inventory-management/)

---

## 8. Sonuç

Booking.com tarzı, modern ve kullanıcı dostu bir fiyatlandırma modülü için:

1. **Aylık takvim grid** görünümü (ana görünüm)
2. **Occupancy-based pricing** desteği
3. **Bulk edit** ile toplu güncelleme
4. **Real-time kontenjan** takibi
5. **Hızlı sorgulama** için DailyRate denormalizasyonu
6. **Drag-select** ve quick actions ile kolay kullanım

---

*Son güncelleme: 2024-12-24*
