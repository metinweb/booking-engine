# Booking Engine UI Framework

Bu framework, Booking Engine ve PMS projelerinde tutarlı, yeniden kullanılabilir UI bileşenleri sağlar.

## Dizin Yapısı

```
/admin/src/components/ui/
├── README.md                    # Bu dosya
├── index.js                     # Tüm bileşenlerin export'u
│
├── form/                        # Form bileşenleri
│   ├── BaseInput.vue           # Temel input wrapper
│   ├── PhoneInput.vue          # Mask'lı telefon girişi
│   ├── PasswordInput.vue       # Şifre + generator
│   ├── NumberInput.vue         # Sayı girişi (min/max/step)
│   ├── CurrencyInput.vue       # Para birimi girişi
│   ├── TextareaInput.vue       # Gelişmiş textarea
│   ├── SearchInput.vue         # Debounced arama
│   ├── DateInput.vue           # Tarih girişi
│   └── index.js
│
├── select/                      # Seçici bileşenleri
│   ├── BaseSelect.vue          # Temel select
│   ├── MultiSelect.vue         # Çoklu seçim
│   ├── HotelSelect.vue         # Otel seçici
│   ├── PartnerSelect.vue       # Partner seçici
│   ├── RoomSelect.vue          # Oda seçici
│   ├── RoomTypeSelect.vue      # Oda tipi seçici
│   ├── UserSelect.vue          # Kullanıcı seçici
│   ├── GuestSelect.vue         # Misafir seçici
│   ├── CountrySelect.vue       # Ülke seçici
│   ├── CurrencySelect.vue      # Para birimi seçici
│   └── index.js
│
├── data/                        # Veri görüntüleme
│   ├── DataTable.vue           # Gelişmiş tablo
│   ├── DataCard.vue            # Mobil kart görünümü
│   ├── DataGrid.vue            # Grid görünümü
│   ├── Pagination.vue          # Sayfalama
│   ├── FilterBar.vue           # Filtre çubuğu
│   ├── SortHeader.vue          # Sıralanabilir başlık
│   ├── StatusBadge.vue         # Durum badge'i
│   ├── EmptyState.vue          # Boş durum
│   └── index.js
│
├── feedback/                    # Geri bildirim
│   ├── Alert.vue               # Uyarı kutusu
│   ├── Toast.vue               # Toast mesajı
│   ├── LoadingSpinner.vue      # Yükleniyor
│   ├── SkeletonLoader.vue      # Skeleton
│   ├── ProgressBar.vue         # İlerleme çubuğu
│   ├── ConfirmDialog.vue       # Onay dialogu
│   └── index.js
│
├── layout/                      # Layout bileşenleri
│   ├── Card.vue                # Kart container
│   ├── Section.vue             # Bölüm container
│   ├── Tabs.vue                # Tab navigasyonu
│   ├── Accordion.vue           # Akordiyon
│   ├── Divider.vue             # Ayırıcı
│   └── index.js
│
└── composables/                 # Yardımcı fonksiyonlar
    ├── useFormValidation.js    # Form validasyonu
    ├── usePagination.js        # Sayfalama
    ├── useDebounce.js          # Debounce
    ├── useFilters.js           # Filtreleme
    ├── useSort.js              # Sıralama
    ├── useSelection.js         # Çoklu seçim
    └── index.js
```

---

## Temel Prensipler

### 1. Tutarlılık
- Tüm bileşenler aynı prop pattern'i kullanır
- Renk şeması Tailwind CSS ile uyumlu
- Dark mode her bileşende desteklenir

### 2. Erişilebilirlik (a11y)
- ARIA attributeleri zorunlu
- Keyboard navigation desteği
- Focus management

### 3. i18n Uyumlu
- Tüm metinler `$t()` ile
- RTL desteği hazır

### 4. Responsive
- Mobile-first yaklaşım
- Breakpoint'lere göre farklı görünüm

---

## Bileşen API Standartları

### Props Adlandırma
```javascript
// ✓ DOĞRU
modelValue      // v-model için
disabled        // Boolean props
required        // Boolean props
placeholder     // String props
options         // Array props
size            // 'sm' | 'md' | 'lg'
variant         // 'primary' | 'secondary' | 'danger' | 'success'

// ✗ YANLIŞ
value           // modelValue kullan
isDisabled      // disabled kullan
inputPlaceholder // placeholder kullan
```

### Events Adlandırma
```javascript
// ✓ DOĞRU
'update:modelValue'  // v-model için
'change'             // Değer değiştiğinde
'focus'              // Focus olduğunda
'blur'               // Blur olduğunda
'search'             // Arama yapıldığında
'select'             // Seçim yapıldığında
'clear'              // Temizlendiğinde

// ✗ YANLIŞ
'onUpdate'           // on prefix kullanma
'valueChanged'       // camelCase kullanma
```

### Slots Adlandırma
```javascript
// ✓ DOĞRU
#default             // Ana içerik
#prefix              // Sol taraf
#suffix              // Sağ taraf
#label               // Etiket
#error               // Hata mesajı
#empty               // Boş durum
#loading             // Yükleniyor durumu
#header              // Başlık
#footer              // Alt bilgi
#cell-{key}          // Tablo hücresi
#action              // Aksiyon butonları
```

---

## Renk Sistemi

### Semantic Colors
| İsim | Kullanım | Light | Dark |
|------|----------|-------|------|
| `primary` | Ana aksiyonlar | indigo-600 | indigo-400 |
| `secondary` | İkincil aksiyonlar | gray-600 | gray-400 |
| `success` | Başarı durumu | green-600 | green-400 |
| `warning` | Uyarı durumu | amber-600 | amber-400 |
| `danger` | Tehlike/hata | red-600 | red-400 |
| `info` | Bilgi | blue-600 | blue-400 |

### Status Colors
| Durum | Renk | Örnek Kullanım |
|-------|------|----------------|
| `active` | green | Aktif kullanıcı |
| `inactive` | gray | Pasif kayıt |
| `pending` | amber | Bekleyen onay |
| `cancelled` | red | İptal edilmiş |
| `completed` | emerald | Tamamlanmış |
| `draft` | slate | Taslak |

---

## Boyut Sistemi

### Size Props
```javascript
size: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
```

### Spacing Scale
| Size | Padding | Height | Font |
|------|---------|--------|------|
| xs | px-2 py-1 | h-7 | text-xs |
| sm | px-3 py-1.5 | h-8 | text-sm |
| md | px-4 py-2 | h-10 | text-base |
| lg | px-5 py-2.5 | h-12 | text-lg |
| xl | px-6 py-3 | h-14 | text-xl |

---

## Form Bileşenleri

### BaseInput
Tüm input bileşenlerinin temel wrapper'ı.

```vue
<BaseInput
  v-model="value"
  label="Etiket"
  placeholder="Placeholder"
  :required="true"
  :disabled="false"
  :error="errorMessage"
  help="Yardım metni"
  size="md"
>
  <template #prefix>
    <span class="material-icons">mail</span>
  </template>
  <template #suffix>
    <button>Temizle</button>
  </template>
</BaseInput>
```

### PhoneInput
Mask'lı telefon girişi.

```vue
<PhoneInput
  v-model="phone"
  label="Telefon"
  country="TR"
  :showCountryCode="true"
  format="+90 (5XX) XXX XX XX"
/>
```

**Özellikler:**
- Otomatik mask (sadece sayı girişi)
- Ülke kodu seçimi
- Format önizleme
- Kopyala/yapıştır desteği
- E.164 format çıktısı

### PasswordInput
Şifre girişi ve generator.

```vue
<PasswordInput
  v-model="password"
  label="Şifre"
  :showGenerator="true"
  :showStrength="true"
  :minLength="8"
  :requireUppercase="true"
  :requireNumber="true"
  :requireSpecial="false"
/>
```

**Özellikler:**
- Göster/gizle toggle
- Şifre oluşturucu butonu
- Güç göstergesi (weak/medium/strong)
- Gereksinimler listesi
- Kopyala butonu

### CurrencyInput
Para birimi girişi.

```vue
<CurrencyInput
  v-model="amount"
  currency="TRY"
  :min="0"
  :max="1000000"
  :decimals="2"
  :showCurrency="true"
/>
```

---

## Select Bileşenleri

### BaseSelect
Temel dropdown.

```vue
<BaseSelect
  v-model="selected"
  :options="options"
  label="Seçim"
  placeholder="Seçiniz"
  :searchable="true"
  :clearable="true"
  optionLabel="name"
  optionValue="id"
/>
```

### HotelSelect
Otel seçici.

```vue
<HotelSelect
  v-model="hotelId"
  :partnerId="partnerId"
  :showImage="true"
  :showStars="true"
  :showStatus="true"
  :multiple="false"
/>
```

### RoomSelect
Oda seçici.

```vue
<RoomSelect
  v-model="roomId"
  :hotelId="hotelId"
  :showType="true"
  :showStatus="true"
  :showFloor="true"
  :availableOnly="true"
  :checkIn="checkInDate"
  :checkOut="checkOutDate"
/>
```

---

## Data Bileşenleri

### DataTable (Gelişmiş)
Tam özellikli tablo.

```vue
<DataTable
  :columns="columns"
  :data="items"
  :loading="loading"
  :pagination="pagination"
  :sortable="true"
  :selectable="true"
  :responsive="true"
  mobileView="card"
  @sort="handleSort"
  @select="handleSelect"
  @page-change="handlePageChange"
>
  <template #filters>
    <FilterBar :filters="filters" @change="handleFilter" />
  </template>

  <template #cell-status="{ row }">
    <StatusBadge :status="row.status" />
  </template>

  <template #action="{ row }">
    <ActionMenu :items="actions" @click="handleAction($event, row)" />
  </template>

  <template #empty>
    <EmptyState icon="inbox" message="Kayıt bulunamadı" />
  </template>
</DataTable>
```

**Columns Yapısı:**
```javascript
const columns = [
  {
    key: 'name',
    label: 'İsim',
    sortable: true,
    width: '200px',
    sticky: true,  // Sabit kolon
    hideOnMobile: false
  },
  {
    key: 'status',
    label: 'Durum',
    sortable: false,
    align: 'center',
    renderAs: 'badge'  // Otomatik badge render
  },
  {
    key: 'createdAt',
    label: 'Tarih',
    sortable: true,
    format: 'date',  // Otomatik tarih format
    hideOnMobile: true
  }
]
```

### Pagination
Sayfalama bileşeni.

```vue
<Pagination
  v-model:page="page"
  v-model:perPage="perPage"
  :total="total"
  :perPageOptions="[10, 25, 50, 100]"
  :showTotal="true"
  :showPerPage="true"
  :showJumper="true"
/>
```

### FilterBar
Filtre çubuğu.

```vue
<FilterBar
  v-model="filters"
  :schema="filterSchema"
  :loading="loading"
  @search="handleSearch"
  @reset="handleReset"
/>
```

**Filter Schema:**
```javascript
const filterSchema = [
  { key: 'search', type: 'search', placeholder: 'Ara...', debounce: 300 },
  { key: 'status', type: 'select', options: statusOptions, placeholder: 'Durum' },
  { key: 'dateRange', type: 'daterange', placeholder: 'Tarih Aralığı' },
  { key: 'hotelId', type: 'hotel', label: 'Otel' }
]
```

---

## Composables

### usePagination
```javascript
import { usePagination } from '@/components/ui/composables'

const {
  page,
  perPage,
  total,
  totalPages,
  from,
  to,
  nextPage,
  prevPage,
  goToPage,
  setTotal,
  reset
} = usePagination({ perPage: 10 })
```

### useDebounce
```javascript
import { useDebounce } from '@/components/ui/composables'

const debouncedSearch = useDebounce((value) => {
  fetchData(value)
}, 300)
```

### useFilters
```javascript
import { useFilters } from '@/components/ui/composables'

const {
  filters,
  setFilter,
  clearFilter,
  clearAll,
  hasActiveFilters,
  activeFilterCount,
  toQueryParams
} = useFilters({
  search: '',
  status: 'all',
  dateRange: null
})
```

### useSelection
```javascript
import { useSelection } from '@/components/ui/composables'

const {
  selected,
  isSelected,
  toggleSelect,
  selectAll,
  clearSelection,
  selectedCount,
  isAllSelected,
  isIndeterminate
} = useSelection()
```

---

## Responsive Davranış

### Breakpoints
| Ad | Min Width | Kullanım |
|----|-----------|----------|
| sm | 640px | Küçük telefon |
| md | 768px | Tablet |
| lg | 1024px | Küçük laptop |
| xl | 1280px | Desktop |
| 2xl | 1536px | Geniş ekran |

### Mobile Table → Card
```vue
<!-- Desktop: Tablo görünümü -->
<table class="hidden md:table">...</table>

<!-- Mobile: Kart görünümü -->
<div class="md:hidden space-y-3">
  <DataCard
    v-for="item in items"
    :key="item.id"
    :data="item"
    :fields="mobileFields"
  />
</div>
```

---

## Validasyon

### Dahili Kurallar
```javascript
const rules = {
  required: true,           // Zorunlu alan
  email: true,              // Email formatı
  phone: true,              // Telefon formatı
  url: true,                // URL formatı
  minLength: 6,             // Min karakter
  maxLength: 100,           // Max karakter
  min: 0,                   // Min değer (sayı)
  max: 1000,                // Max değer (sayı)
  pattern: /^[A-Z]+$/,      // Regex
  tcKimlik: true,           // TC Kimlik doğrulama
  iban: true,               // IBAN doğrulama
  custom: (val) => true     // Özel fonksiyon
}
```

### Form Validasyonu
```javascript
import { useFormValidation } from '@/components/ui/composables'

const { errors, validate, validateField, clearErrors } = useFormValidation({
  email: [{ required: true }, { email: true }],
  phone: [{ required: true }, { phone: true }],
  password: [{ required: true }, { minLength: 8 }]
})
```

---

## Kurulum ve Kullanım

### Global Kayıt
```javascript
// main.js
import { UIPlugin } from '@/components/ui'
app.use(UIPlugin)
```

### Tek Bileşen Import
```javascript
import { PhoneInput, DataTable } from '@/components/ui'
```

---

## Örnekler

### Kullanıcı Formu
```vue
<template>
  <form @submit.prevent="handleSubmit">
    <BaseInput v-model="form.name" label="Ad Soyad" :rules="{ required: true }" />
    <BaseInput v-model="form.email" label="E-posta" type="email" :rules="{ required: true, email: true }" />
    <PhoneInput v-model="form.phone" label="Telefon" :rules="{ required: true }" />
    <PasswordInput v-model="form.password" label="Şifre" :showGenerator="true" />
    <HotelSelect v-model="form.hotelId" label="Otel" :rules="{ required: true }" />

    <button type="submit" :disabled="loading">Kaydet</button>
  </form>
</template>
```

### Veri Tablosu
```vue
<template>
  <DataTable
    :columns="columns"
    :data="users"
    :loading="loading"
    :pagination="pagination"
    responsive
    @page-change="fetchUsers"
  >
    <template #filters>
      <FilterBar v-model="filters" :schema="filterSchema" />
    </template>
  </DataTable>
</template>
```

---

## Yol Haritası

### v1.0 (Mevcut)
- [x] Temel form bileşenleri
- [x] Modal, DatePicker, MultiLangInput
- [x] DataTable (basit)

### v1.1 (Planlanan)
- [ ] PhoneInput with mask
- [ ] PasswordInput with generator
- [ ] Gelişmiş DataTable
- [ ] Pagination component
- [ ] FilterBar component

### v1.2 (Gelecek)
- [ ] RoomSelect, RoomTypeSelect
- [ ] Virtual scrolling
- [ ] Drag & drop support
- [ ] Export (CSV, Excel)

---

## Katkıda Bulunma

1. Yeni bileşen eklerken bu dökümanı güncelleyin
2. Props ve events için TypeScript-like JSDoc kullanın
3. Her bileşen için en az bir örnek ekleyin
4. Dark mode ve responsive testleri yapın
