# FireDetector Frontend - Modern UI

Bu dokümantasyon, FireDetector projesinin modern UI'a dönüştürülmüş frontend kısmını açıklar.

## 🎨 Yeni Özellikler

### UI/UX İyileştirmeleri

- **Modern Tasarım**: Tailwind CSS ile tamamen yeniden tasarlandı
- **Responsive Layout**: Tüm cihazlarda mükemmel görünüm
- **Dark Mode Ready**: Karanlık mod için hazır altyapı
- **Smooth Animations**: Geçişler ve animasyonlar
- **Material Icons**: Google Material Icons entegrasyonu

### Yeni Sayfalar

- **Dashboard**: Özet istatistikler ve gerçek zamanlı bilgiler
- **Kameralar**: Kamera yönetimi ve canlı görüntüleme
- **Alarmlar**: Alarm listesi ve yönetimi
- **Analizler**: Detaylı raporlar ve grafikler
- **Ayarlar**: Sistem ve kullanıcı ayarları

### Teknik İyileştirmeler

- **SPA Routing Fix**: F5 yenileme sorunu çözüldü
- **Auth Guards**: Route koruması aktif
- **Lazy Loading**: Performans optimizasyonu
- **Code Splitting**: Daha hızlı yükleme

## 🚀 Kurulum

### 1. Dependencies Kurulumu

```bash
cd frontend
npm install
```

### 2. Tailwind CSS Build

```bash
# Development
npm run dev

# Production build
npm run build
```

### 3. Environment Variables

`.env` dosyasını düzenleyin:

```env
VITE_API_URL=http://localhost:3020/api/v1
VITE_APP_TITLE=FireDetector
```

## 🛠️ Development

### Geliştirme Sunucusu

```bash
npm run dev
```

Tarayıcıda `http://localhost:5173` adresine gidin.

### Production Build

```bash
npm run build
npm run preview
```

## 📁 Proje Yapısı

```
frontend/
├── src/
│   ├── assets/
│   │   └── tailwind.css      # Global styles
│   ├── components/
│   │   ├── Header.vue         # Top navigation
│   │   ├── Sidebar.vue        # Side navigation
│   │   └── dashboard/         # Dashboard components
│   ├── layouts/
│   │   ├── DefaultLayout.vue  # Main app layout
│   │   └── AuthLayout.vue     # Auth pages layout
│   ├── views/
│   │   ├── DashboardView.vue  # Dashboard page
│   │   ├── CamerasView.vue    # Cameras page
│   │   ├── AlertsView.vue     # Alerts page
│   │   ├── AnalyticsView.vue  # Analytics page
│   │   └── SettingsView.vue   # Settings page
│   └── router/
│       └── index.js           # Vue Router config
├── tailwind.config.js         # Tailwind configuration
├── postcss.config.js          # PostCSS configuration
└── nginx.conf                 # Production nginx config
```

## 🎯 Önemli Değişiklikler

### 1. Bootstrap'tan Tailwind'e Geçiş

- Tüm Bootstrap class'ları Tailwind utility class'larına dönüştürüldü
- Custom component class'ları eklendi (btn-primary, card, vb.)
- Responsive grid sistemi Tailwind ile yeniden yapılandırıldı

### 2. Router Yapısı

- Nested routing with layouts
- Auth guard implementation
- Role-based access control
- 404 catch-all route

### 3. Component Architecture

- Composition API kullanımı
- Reusable components
- Props ve emit pattern
- Slot kullanımı

## 🔧 Nginx Configuration

Production'da SPA routing için nginx ayarları:

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

## 🐛 Bilinen Sorunlar ve Çözümler

### F5 404 Hatası

✅ **Çözüldü**: Vue Router history mode için nginx/apache konfigürasyonu eklendi

### Auth Persistence

✅ **Çözüldü**: Token localStorage'da saklanıyor, sayfa yenilemede kontrol ediliyor

### API CORS

✅ **Çözüldü**: Vite proxy konfigürasyonu ile development'ta CORS sorunu bypass ediliyor

## 📱 Responsive Breakpoints

```css
sm: 640px   /* Mobile landscape */
md: 768px   /* Tablet */
lg: 1024px  /* Desktop */
xl: 1280px  /* Large desktop */
2xl: 1536px /* Extra large */
```

## 🎨 Renk Paleti

```javascript
primary: purple-600 (#7c3aed)
success: green-600
danger: red-600
warning: yellow-600
info: blue-600
```

## 🔐 Authentication Flow

1. Login sayfasında credentials girişi
2. API'ye POST /auth/login
3. JWT token localStorage'a kaydediliyor
4. Axios interceptor ile tüm isteklere token ekleniyor
5. Router guard ile korumalı route'lar kontrol ediliyor

## 📊 State Management

Pinia store yapısı:

- `auth.js`: Authentication state
- `camera.js`: Camera management
- `alert.js`: Alert management
- `corporate.js`: Corporate management

## 🚀 Deployment Checklist

- [ ] Environment variables set
- [ ] API URL updated
- [ ] Build optimization
- [ ] Nginx configured
- [ ] SSL certificates
- [ ] Gzip enabled
- [ ] Cache headers set
- [ ] CSP headers configured

## 🤝 Katkıda Bulunma

1. Feature branch oluştur
2. Tailwind utility-first approach kullan
3. Component'leri reusable yap
4. Accessibility kurallarına uy
5. Responsive design test et

## 📝 Notlar

- Material Icons CDN kullanılıyor, offline kullanım için local'e alınabilir
- Tailwind purge production build'de aktif
- Vue DevTools development'ta aktif
- Hot Module Replacement (HMR) aktif
