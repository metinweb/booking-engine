# PMS Tam Refactoring Planı

## Hedef
Tüm PMS modülünü yeniden yapılandırarak:
- State duplication'ı ortadan kaldır
- API client tutarlılığı sağla
- Socket lifecycle'ı düzelt
- Prop drilling'i ortadan kaldır
- Backend'i modülerleştir
- Transaction pattern ekle

---

## PHASE 1: Unified PMS Context (Frontend Core)

### 1.1 Yeni Composable: usePmsContext.js
**Dosya:** `/admin/src/composables/usePmsContext.js`

Tek bir context tüm PMS state'ini yönetecek:
- currentHotel
- currentUser (PMS user)
- permissions
- isAuthenticated
- Socket connection state

### 1.2 Yeni API Client: pmsApiClient.js (Güncelleme)
**Dosya:** `/admin/src/services/pms/pmsApi.js`

Tüm PMS service'leri bu client'ı kullanacak.

### 1.3 Store Consolidation
**Silinecekler:**
- `/admin/src/stores/pms/pmsStore.js` (hotel.js ile birleşecek)

**Güncellenecekler:**
- `/admin/src/stores/pms/pmsAuth.js` - Sadece PMS auth için
- `/admin/src/stores/hotel.js` - Unified hotel state

---

## PHASE 2: Service Layer Refactoring

### 2.1 Utility Module
**Yeni Dosya:** `/admin/src/utils/pmsUtils.js`
- formatCurrency()
- formatDate()
- formatTime()
- PAYMENT_STATUS (tek kaynak)
- PAYMENT_METHODS (tek kaynak)

### 2.2 Tüm Service'leri Güncelle
12 service dosyası güncellenecek:
- apiClient → pmsApiClient (veya context-aware client)
- Duplicate utility fonksiyonları kaldır
- Tutarlı error handling ekle

---

## PHASE 3: Socket Refactoring

### 3.1 Socket Lifecycle Management
**Dosya:** `/admin/src/composables/useSocket.js`
- Logout'ta socket.disconnect()
- Reconnect strategy
- Connection state management

### 3.2 PMS Socket Improvements
**Dosya:** `/admin/src/composables/usePMSSocket.js`
- Callback cleanup guarantee
- Room subscription tracking
- Debug logging

---

## PHASE 4: Backend Modularization

### 4.1 Route Splitting
**Mevcut:** `pms.routes.js` (566 satır)

**Yeni yapı:**
```
/api/src/modules/pms/routes/
├── index.js (ana router)
├── auth.routes.js
├── user.routes.js
├── room.routes.js
├── stay.routes.js
├── reservation.routes.js
├── guest.routes.js
├── cashier.routes.js
├── reports.routes.js
└── settings.routes.js
```

### 4.2 Transaction Pattern
**Dosya:** `/api/src/modules/pms/stay.service.js`
- walkInCheckIn → transaction ile wrap
- checkOut → transaction ile wrap

---

## PHASE 5: Component Updates

### 5.1 Provider Component
**Yeni:** `/admin/src/components/pms/PmsProvider.vue`
- usePmsContext provide eder
- Tüm child component'ler inject ile alır

### 5.2 Layout Update
**Dosya:** `/admin/src/layouts/PMSLayout.vue`
- PmsProvider'ı wrap et
- Socket initialization burada

### 5.3 Component Updates
- hotelId prop → inject('pmsContext')
- Duplicate formatCurrency → import from utils

---

## PHASE 6: Deep Testing

### 6.1 Test Scenarios
1. **Auth Flow**
   - PMS Login
   - PMS Logout
   - Token refresh
   - Session persistence

2. **Hotel Selection**
   - Hotel switch
   - Socket room change
   - State sync

3. **Real-time Events**
   - Check-in notification
   - Check-out notification
   - Housekeeping status change
   - Multi-user scenario

4. **CRUD Operations**
   - Room create/update/delete
   - Stay create/update/delete
   - Guest create/update/delete
   - Reservation create/update/delete

5. **Edge Cases**
   - Network disconnect
   - Concurrent updates
   - Page refresh
   - Browser back/forward

---

## Dosya Listesi

### Yeni Dosyalar
1. `/admin/src/composables/usePmsContext.js`
2. `/admin/src/utils/pmsUtils.js`
3. `/admin/src/components/pms/PmsProvider.vue`
4. `/api/src/modules/pms/routes/index.js`
5. `/api/src/modules/pms/routes/auth.routes.js`
6. `/api/src/modules/pms/routes/user.routes.js`
7. `/api/src/modules/pms/routes/room.routes.js`
8. `/api/src/modules/pms/routes/stay.routes.js`
9. `/api/src/modules/pms/routes/reservation.routes.js`
10. `/api/src/modules/pms/routes/guest.routes.js`
11. `/api/src/modules/pms/routes/cashier.routes.js`
12. `/api/src/modules/pms/routes/reports.routes.js`
13. `/api/src/modules/pms/routes/settings.routes.js`

### Güncellenecek Dosyalar
1. `/admin/src/stores/hotel.js`
2. `/admin/src/stores/pms/pmsAuth.js`
3. `/admin/src/composables/useSocket.js`
4. `/admin/src/composables/usePMSSocket.js`
5. `/admin/src/services/pms/pmsApi.js`
6. `/admin/src/services/pms/roomService.js`
7. `/admin/src/services/pms/stayService.js`
8. `/admin/src/services/pms/reservationService.js`
9. `/admin/src/services/pms/guestService.js`
10. `/admin/src/services/pms/cashierService.js`
11. `/admin/src/services/pms/reportsService.js`
12. `/admin/src/services/pms/settingsService.js`
13. `/admin/src/services/pms/nightAuditService.js`
14. `/admin/src/services/pms/roomPlanService.js`
15. `/admin/src/services/pms/kbsService.js`
16. `/admin/src/layouts/PMSLayout.vue`
17. `/admin/src/views/pms/*.vue` (tüm view'lar)
18. `/admin/src/components/pms/**/*.vue` (tüm component'ler)
19. `/api/src/modules/pms/stay.service.js`
20. `/api/src/modules/pms/pms.routes.js` (deprecated, yeni routes'a yönlendir)

### Silinecek Dosyalar
1. `/admin/src/stores/pms/pmsStore.js` (hotel.js ile birleşti)

---

## Öncelik Sırası

1. **pmsUtils.js** - Utility'ler (dependency yok)
2. **usePmsContext.js** - Core context
3. **useSocket.js** - Socket lifecycle fix
4. **usePMSSocket.js** - PMS socket improvements
5. **pmsApi.js** - API client update
6. **Tüm services** - Client migration
7. **PmsProvider.vue** - Provider component
8. **PMSLayout.vue** - Layout integration
9. **Backend routes** - Route splitting
10. **stay.service.js** - Transaction pattern
11. **Tüm views/components** - Context injection
12. **Testing** - Full test suite
