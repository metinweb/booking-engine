# UI Component Geliştirme Planı

> Bu dosya gelecekte yapılacak UI iyileştirmelerini içerir.

---

## Mevcut Component'lerde İyileştirmeler

### DataTable
- [ ] Kolon sıralama (asc/desc)
- [ ] Kolon filtreleme
- [ ] Sunucu taraflı sayfalama
- [ ] Satır seçimi (tekli/çoklu)
- [ ] Export (CSV, Excel)
- [ ] Kolon gizleme/gösterme
- [ ] Satır genişletme (expandable rows)

### Modal
- [ ] Boyut varyantları (sm, md, lg, xl, full)
- [ ] Fullscreen modu
- [ ] Nested modal desteği
- [ ] Drag to resize

### DateRangePicker
- [ ] Preset'ler (Bugün, Dün, Bu Hafta, Bu Ay, Son 7 Gün, Son 30 Gün)
- [ ] Karşılaştırma modu (önceki dönemle)

### BaseButton
- [ ] Loading state (spinner)
- [ ] Icon pozisyonu (left/right)
- [ ] Button group desteği

### Form Inputs
- [ ] Floating label desteği
- [ ] Input masking
- [ ] Validation state gösterimi

---

## Yeni Component Önerileri

### Öncelik: Yüksek
- [ ] **Select/Autocomplete** - Aranabilir dropdown, çoklu seçim
- [ ] **FileUpload** - Drag & drop, preview, progress
- [ ] **Pagination** - Standalone sayfalama component'i
- [ ] **EmptyState** - Boş veri gösterimi (icon + mesaj + aksiyon)

### Öncelik: Orta
- [ ] **Card** - Standart kart yapısı (header, body, footer)
- [ ] **Popover** - Tooltip'ten daha zengin içerik
- [ ] **Breadcrumb** - Navigasyon yolu
- [ ] **Notification/Toast** - Stack'lenebilir bildirimler

### Öncelik: Düşük
- [ ] **Command Palette** - ⌘K ile arama
- [ ] **Tree View** - Hiyerarşik veri gösterimi
- [ ] **Calendar** - Standalone takvim
- [ ] **Color Picker** - Renk seçici
- [ ] **Rich Text Editor** - Basitleştirilmiş versiyon

---

## Tasarım Prensipleri

1. **Tutarlılık** - Tüm component'ler aynı tasarım dilini kullanmalı
2. **Erişilebilirlik** - Klavye navigasyonu, ARIA etiketleri
3. **Dark Mode** - Tüm component'ler dark mode desteklemeli
4. **Responsive** - Mobil uyumlu olmalı
5. **Performans** - Lazy loading, virtual scrolling (büyük listeler için)

---

## Referans Kaynaklar

- [Headless UI](https://headlessui.com/)
- [Radix UI](https://radix-ui.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [DaisyUI](https://daisyui.com/)

---

**Son Güncelleme:** 2026-01-04
