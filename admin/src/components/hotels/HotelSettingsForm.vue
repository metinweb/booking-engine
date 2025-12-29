<template>
  <div class="space-y-8">
    <!-- Status & Visibility -->
    <div class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
      <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
        <span class="material-icons text-purple-500">visibility</span>
        {{ $t('hotels.basic.visibility') }}
      </h3>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Status -->
        <div>
          <label class="form-label">{{ $t('common.status.label') }}</label>
          <select v-model="form.status" class="form-input">
            <option value="draft">{{ $t('hotels.statuses.draft') }}</option>
            <option value="active">{{ $t('hotels.statuses.active') }}</option>
            <option value="inactive">{{ $t('hotels.statuses.inactive') }}</option>
          </select>
        </div>

        <!-- Featured -->
        <div class="flex items-center pt-6">
          <label class="flex items-center cursor-pointer">
            <input
              type="checkbox"
              v-model="form.featured"
              class="w-5 h-5 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 dark:focus:ring-purple-600 dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600"
            />
            <span class="ml-3 text-sm text-gray-700 dark:text-slate-300">
              {{ $t('hotels.basic.featured') }}
            </span>
          </label>
        </div>
      </div>

      <div class="flex flex-wrap gap-6 mt-6">
        <!-- B2C Visibility -->
        <label class="flex items-center cursor-pointer">
          <input
            type="checkbox"
            v-model="form.visibility.b2c"
            class="w-5 h-5 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 dark:focus:ring-purple-600 dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600"
          />
          <span class="ml-3 text-sm text-gray-700 dark:text-slate-300">
            <span class="font-medium">{{ $t('hotels.basic.b2cVisible') }}</span>
          </span>
        </label>

        <!-- B2B Visibility -->
        <label class="flex items-center cursor-pointer">
          <input
            type="checkbox"
            v-model="form.visibility.b2b"
            class="w-5 h-5 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 dark:focus:ring-purple-600 dark:ring-offset-slate-800 focus:ring-2 dark:bg-slate-700 dark:border-slate-600"
          />
          <span class="ml-3 text-sm text-gray-700 dark:text-slate-300">
            <span class="font-medium">{{ $t('hotels.basic.b2bVisible') }}</span>
          </span>
        </label>
      </div>
    </div>

    <!-- Pricing Settings -->
    <div class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
      <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-2 flex items-center gap-2">
        <span class="material-icons text-green-500">payments</span>
        {{ $t('hotels.pricing.title') }}
      </h3>
      <p class="text-sm text-gray-500 dark:text-slate-400 mb-6">{{ $t('hotels.pricing.description') }}</p>

      <!-- Pricing Model Selection -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <!-- Net Price Model -->
        <label
          class="relative flex items-start p-4 border-2 rounded-xl cursor-pointer transition-all"
          :class="form.pricingSettings.model === 'net'
            ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
            : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'"
        >
          <input
            type="radio"
            v-model="form.pricingSettings.model"
            value="net"
            class="sr-only"
          />
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-1">
              <span class="font-medium text-gray-800 dark:text-white">{{ $t('hotels.pricing.netPrice') }}</span>
              <span v-if="form.pricingSettings.model === 'net'" class="material-icons text-green-500 text-lg">check_circle</span>
            </div>
            <p class="text-sm text-gray-500 dark:text-slate-400">{{ $t('hotels.pricing.netPriceDesc') }}</p>
          </div>
        </label>

        <!-- Rack Rate Model -->
        <label
          class="relative flex items-start p-4 border-2 rounded-xl cursor-pointer transition-all"
          :class="form.pricingSettings.model === 'rack'
            ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
            : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'"
        >
          <input
            type="radio"
            v-model="form.pricingSettings.model"
            value="rack"
            class="sr-only"
          />
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-1">
              <span class="font-medium text-gray-800 dark:text-white">{{ $t('hotels.pricing.rackRate') }}</span>
              <span v-if="form.pricingSettings.model === 'rack'" class="material-icons text-green-500 text-lg">check_circle</span>
            </div>
            <p class="text-sm text-gray-500 dark:text-slate-400">{{ $t('hotels.pricing.rackRateDesc') }}</p>
          </div>
        </label>
      </div>

      <!-- Pricing Details -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Markup (for net model) -->
        <div v-if="form.pricingSettings.model === 'net'">
          <label class="form-label">{{ $t('hotels.pricing.defaultMarkup') }}</label>
          <div class="relative">
            <input
              v-model.number="form.pricingSettings.defaultMarkup"
              type="number"
              min="0"
              max="100"
              class="form-input pr-8"
            />
            <span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
          </div>
        </div>

        <!-- Commission (for rack model) -->
        <div v-if="form.pricingSettings.model === 'rack'">
          <label class="form-label">{{ $t('hotels.pricing.defaultCommission') }}</label>
          <div class="relative">
            <input
              v-model.number="form.pricingSettings.defaultCommission"
              type="number"
              min="0"
              max="100"
              class="form-input pr-8"
            />
            <span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
          </div>
        </div>

        <!-- Currency -->
        <div>
          <label class="form-label">{{ $t('hotels.pricing.currency') }}</label>
          <select v-model="form.pricingSettings.currency" class="form-input">
            <option value="EUR">EUR - Euro</option>
            <option value="USD">USD - US Dollar</option>
            <option value="TRY">TRY - Turkish Lira</option>
            <option value="GBP">GBP - British Pound</option>
          </select>
        </div>

        <!-- Tax Included -->
        <div class="flex items-center pt-6">
          <label class="flex items-center cursor-pointer">
            <input
              type="checkbox"
              v-model="form.pricingSettings.taxIncluded"
              class="w-5 h-5 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
            />
            <span class="ml-3 text-sm text-gray-700 dark:text-slate-300">
              {{ $t('hotels.pricing.taxIncluded') }}
            </span>
          </label>
        </div>

        <!-- Tax Rate -->
        <div v-if="form.pricingSettings.taxIncluded">
          <label class="form-label">{{ $t('hotels.pricing.taxRate') }}</label>
          <div class="relative">
            <input
              v-model.number="form.pricingSettings.taxRate"
              type="number"
              min="0"
              max="100"
              class="form-input pr-8"
            />
            <span class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- SEO Settings -->
    <div class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
      <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-2 flex items-center gap-2">
        <span class="material-icons text-blue-500">search</span>
        {{ $t('hotels.tabs.seo') }}
      </h3>
      <p class="text-sm text-gray-500 dark:text-slate-400 mb-6">{{ $t('hotels.seo.description') }}</p>

      <div class="space-y-4">
        <!-- SEO Title -->
        <MultiLangInput
          v-model="form.seo.title"
          :languages="SUPPORTED_LANGUAGES"
          :label="$t('hotels.seo.title')"
          :placeholder="$t('hotels.seo.titlePlaceholder')"
        />

        <!-- SEO Description -->
        <MultiLangInput
          v-model="form.seo.description"
          :languages="SUPPORTED_LANGUAGES"
          :label="$t('hotels.seo.metaDescription')"
          type="textarea"
          :rows="2"
          :placeholder="$t('hotels.seo.metaDescriptionPlaceholder')"
        />

        <!-- SEO Keywords -->
        <MultiLangInput
          v-model="form.seo.keywords"
          :languages="SUPPORTED_LANGUAGES"
          :label="$t('hotels.seo.keywords')"
          :placeholder="$t('hotels.seo.keywordsPlaceholder')"
        />
      </div>
    </div>

    <!-- Child Age Settings (always editable - partner controlled) -->
    <div class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
      <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-2 flex items-center gap-2">
        <span class="material-icons text-blue-500">child_care</span>
        {{ $t('hotels.policies.childAgeSettings') }}
      </h3>
      <p class="text-sm text-gray-500 dark:text-slate-400 mb-4">{{ $t('hotels.policies.childAgeSettingsDesc') }}</p>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <!-- Max Baby Age -->
        <div>
          <label class="form-label">{{ $t('hotels.policies.maxBabyAge') }}</label>
          <input v-model.number="form.policies.maxBabyAge" type="number" min="0" max="5" class="form-input" />
          <p class="text-xs text-gray-500 dark:text-slate-400 mt-1">{{ $t('hotels.policies.maxBabyAgeHelp') }}</p>
        </div>

        <!-- Max Child Age -->
        <div>
          <label class="form-label">{{ $t('hotels.policies.maxChildAge') }}</label>
          <input v-model.number="form.policies.maxChildAge" type="number" min="0" max="18" class="form-input" />
          <p class="text-xs text-gray-500 dark:text-slate-400 mt-1">{{ $t('hotels.policies.maxChildAgeHelp') }}</p>
        </div>
      </div>

      <!-- Child Age Groups -->
      <div class="border-t border-gray-200 dark:border-slate-700 pt-6">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h4 class="font-medium text-gray-800 dark:text-white flex items-center gap-2">
              <span class="material-icons text-sm text-indigo-500">category</span>
              Çocuk Yaş Grupları
            </h4>
            <p class="text-xs text-gray-500 dark:text-slate-400 mt-1">
              Fiyatlandırmada kullanılacak çocuk yaş grubu tanımları
            </p>
          </div>
          <button
            v-if="form.childAgeGroups.length < 3"
            type="button"
            @click="addChildAgeGroup"
            class="px-3 py-1.5 text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors flex items-center gap-1"
          >
            <span class="material-icons text-sm">add</span>
            Yaş Grubu Ekle
          </button>
        </div>

        <div class="space-y-3">
          <div
            v-for="(ageGroup, index) in form.childAgeGroups"
            :key="index"
            class="flex items-center gap-4 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg"
          >
            <!-- Age Group Name (fixed based on code) -->
            <div class="w-32 flex-shrink-0">
              <span
                class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium"
                :class="ageGroup.code === 'infant'
                  ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300'
                  : ageGroup.code === 'first'
                    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'"
              >
                <span class="material-icons text-sm">
                  {{ ageGroup.code === 'infant' ? 'baby_changing_station' : 'child_care' }}
                </span>
                {{ getAgeGroupName(ageGroup.code) }}
              </span>
            </div>

            <!-- Age Range -->
            <div class="flex items-center gap-2">
              <div class="w-16">
                <input
                  :value="ageGroup.minAge"
                  type="number"
                  min="0"
                  max="17"
                  class="form-input text-sm py-1.5 text-center"
                  :class="index === 0 ? 'bg-gray-100 dark:bg-slate-600 cursor-not-allowed' : ''"
                  :disabled="index === 0"
                  :title="index === 0 ? 'Bebek her zaman 0 yaşından başlar' : ''"
                  readonly
                />
                <span class="text-[10px] text-gray-400 block text-center">min</span>
              </div>

              <span class="text-gray-400 font-bold">—</span>

              <div class="w-16">
                <input
                  v-model.number="ageGroup.maxAge"
                  type="number"
                  :min="ageGroup.minAge"
                  max="17"
                  class="form-input text-sm py-1.5 text-center"
                  @change="onMaxAgeChange(index)"
                />
                <span class="text-[10px] text-gray-400 block text-center">max</span>
              </div>

              <span class="text-sm text-gray-500 dark:text-slate-400">yaş</span>
            </div>

            <div class="flex-1"></div>

            <!-- Delete Button -->
            <button
              v-if="form.childAgeGroups.length > 1"
              type="button"
              @click="removeChildAgeGroup(index)"
              class="p-1.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
              title="Sil"
            >
              <span class="material-icons text-sm">delete</span>
            </button>
          </div>
        </div>

        <p class="text-xs text-gray-500 dark:text-slate-400 mt-3">
          <span class="material-icons text-xs align-middle">info</span>
          En fazla 3 yaş grubu tanımlanabilir (bebek, 1. çocuk tipi, 2. çocuk tipi)
        </p>
      </div>
    </div>

    <!-- Policies Override (for linked hotels) -->
    <div v-if="isLinked" class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
      <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-2 flex items-center gap-2">
        <span class="material-icons text-orange-500">policy</span>
        {{ $t('hotels.tabs.policies') }}
      </h3>

      <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg mb-4">
        <div>
          <h4 class="font-medium text-gray-800 dark:text-white">{{ $t('hotels.policies.useBaseDefaults') }}</h4>
          <p class="text-sm text-gray-500 dark:text-slate-400">{{ $t('hotels.policies.useBaseDefaultsDesc') }}</p>
        </div>
        <label class="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            v-model="form.policies.useBaseDefaults"
            class="sr-only peer"
          />
          <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-slate-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-purple-600"></div>
        </label>
      </div>

      <!-- Show override fields if not using base defaults -->
      <div v-if="!form.policies.useBaseDefaults" class="space-y-4 pt-4 border-t border-gray-200 dark:border-slate-700">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Check-in Time -->
          <div>
            <label class="form-label">{{ $t('hotels.policies.checkIn') }}</label>
            <input v-model="form.policies.checkIn" type="time" class="form-input" />
          </div>

          <!-- Check-out Time -->
          <div>
            <label class="form-label">{{ $t('hotels.policies.checkOut') }}</label>
            <input v-model="form.policies.checkOut" type="time" class="form-input" />
          </div>
        </div>
      </div>
    </div>

    <!-- Display Order -->
    <div class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
      <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
        <span class="material-icons text-gray-500">sort</span>
        {{ $t('hotels.displayOrder') }}
      </h3>

      <div class="w-48">
        <label class="form-label">{{ $t('hotels.displayOrder') }}</label>
        <input
          v-model.number="form.displayOrder"
          type="number"
          min="0"
          class="form-input"
        />
        <p class="text-xs text-gray-500 dark:text-slate-400 mt-1">{{ $t('hotels.displayOrderHelp') }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import MultiLangInput from '@/components/common/MultiLangInput.vue'

const props = defineProps({
  hotel: {
    type: Object,
    required: true
  },
  isLinked: {
    type: Boolean,
    default: false
  }
})

// Supported languages
const SUPPORTED_LANGUAGES = ['tr', 'en', 'ru', 'el', 'de', 'es', 'it', 'fr', 'ro', 'bg', 'pt', 'da', 'zh', 'ar', 'fa', 'he', 'sq', 'uk', 'pl', 'az']

// Create empty multilingual object
const createMultiLangObject = () => {
  const obj = {}
  SUPPORTED_LANGUAGES.forEach(lang => { obj[lang] = '' })
  return obj
}

// Age group names (fixed)
const AGE_GROUP_NAMES = {
  infant: { tr: 'Bebek', en: 'Infant' },
  first: { tr: '1. Tip Çocuk', en: 'Child Type 1' },
  second: { tr: '2. Tip Çocuk', en: 'Child Type 2' }
}

const getAgeGroupName = (code) => {
  return AGE_GROUP_NAMES[code]?.tr || code
}

// Default child age groups
const getDefaultChildAgeGroups = () => [
  { code: 'infant', name: AGE_GROUP_NAMES.infant, minAge: 0, maxAge: 2, order: 0 },
  { code: 'first', name: AGE_GROUP_NAMES.first, minAge: 3, maxAge: 12, order: 1 }
]

const form = ref({
  status: 'draft',
  featured: false,
  visibility: {
    b2c: true,
    b2b: true
  },
  pricingSettings: {
    model: 'net',
    defaultMarkup: 20,
    defaultCommission: 15,
    currency: 'EUR',
    taxIncluded: true,
    taxRate: 10
  },
  seo: {
    title: createMultiLangObject(),
    description: createMultiLangObject(),
    keywords: createMultiLangObject()
  },
  policies: {
    useBaseDefaults: true,
    checkIn: '14:00',
    checkOut: '12:00',
    maxBabyAge: 2,
    maxChildAge: 12
  },
  childAgeGroups: getDefaultChildAgeGroups(),
  displayOrder: 0
})

// Add new child age group
const addChildAgeGroup = () => {
  if (form.value.childAgeGroups.length >= 3) return

  const existingCodes = form.value.childAgeGroups.map(g => g.code)
  let newCode = 'second' // Default to second since infant and first usually exist

  if (!existingCodes.includes('infant')) {
    newCode = 'infant'
  } else if (!existingCodes.includes('first')) {
    newCode = 'first'
  } else if (!existingCodes.includes('second')) {
    newCode = 'second'
  }

  // Calculate minAge based on last group's maxAge
  const lastGroup = form.value.childAgeGroups[form.value.childAgeGroups.length - 1]
  const newMinAge = lastGroup ? lastGroup.maxAge + 1 : 0

  form.value.childAgeGroups.push({
    code: newCode,
    name: AGE_GROUP_NAMES[newCode],
    minAge: newMinAge,
    maxAge: Math.min(newMinAge + 5, 17),
    order: form.value.childAgeGroups.length
  })
}

// Remove child age group
const removeChildAgeGroup = (index) => {
  if (form.value.childAgeGroups.length <= 1) return
  form.value.childAgeGroups.splice(index, 1)
  // Update order and fix minAge gaps
  form.value.childAgeGroups.forEach((g, i) => {
    g.order = i
    if (i === 0) {
      g.minAge = 0 // First group always starts at 0
    } else {
      g.minAge = form.value.childAgeGroups[i - 1].maxAge + 1
    }
  })
}

// When maxAge changes, update next group's minAge
const onMaxAgeChange = (index) => {
  const groups = form.value.childAgeGroups
  const currentGroup = groups[index]

  // Ensure maxAge is at least minAge
  if (currentGroup.maxAge < currentGroup.minAge) {
    currentGroup.maxAge = currentGroup.minAge
  }

  // Update next group's minAge if exists
  if (index < groups.length - 1) {
    groups[index + 1].minAge = currentGroup.maxAge + 1
    // Ensure next group's maxAge is valid
    if (groups[index + 1].maxAge < groups[index + 1].minAge) {
      groups[index + 1].maxAge = groups[index + 1].minAge
    }
  }
}

// Watch for hotel changes
watch(() => props.hotel, (newHotel) => {
  if (newHotel) {
    form.value = {
      status: newHotel.status || 'draft',
      featured: newHotel.featured || false,
      visibility: {
        b2c: newHotel.visibility?.b2c ?? true,
        b2b: newHotel.visibility?.b2b ?? true
      },
      pricingSettings: {
        model: newHotel.pricingSettings?.model || 'net',
        defaultMarkup: newHotel.pricingSettings?.defaultMarkup ?? 20,
        defaultCommission: newHotel.pricingSettings?.defaultCommission ?? 15,
        currency: newHotel.pricingSettings?.currency || 'EUR',
        taxIncluded: newHotel.pricingSettings?.taxIncluded ?? true,
        taxRate: newHotel.pricingSettings?.taxRate ?? 10
      },
      seo: {
        title: { ...createMultiLangObject(), ...newHotel.seo?.title },
        description: { ...createMultiLangObject(), ...newHotel.seo?.description },
        keywords: { ...createMultiLangObject(), ...newHotel.seo?.keywords }
      },
      policies: {
        useBaseDefaults: newHotel.policies?.useBaseDefaults ?? true,
        checkIn: newHotel.policies?.checkIn || '14:00',
        checkOut: newHotel.policies?.checkOut || '12:00',
        maxBabyAge: newHotel.policies?.maxBabyAge ?? 2,
        maxChildAge: newHotel.policies?.maxChildAge ?? 12
      },
      childAgeGroups: newHotel.childAgeGroups?.length > 0
        ? newHotel.childAgeGroups.map(g => ({
            code: g.code,
            name: { tr: g.name?.tr || '', en: g.name?.en || '' },
            minAge: g.minAge,
            maxAge: g.maxAge,
            order: g.order || 0
          }))
        : getDefaultChildAgeGroups(),
      displayOrder: newHotel.displayOrder || 0
    }
  }
}, { immediate: true, deep: true })

// Get form data
const getFormData = () => {
  return { ...form.value }
}

// Expose for parent
defineExpose({
  getFormData
})
</script>
