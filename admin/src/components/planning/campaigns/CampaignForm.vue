<template>
  <div class="space-y-6">
    <!-- Status & Combinable Row -->
    <div class="flex flex-col sm:flex-row gap-4">
      <!-- Status Toggle -->
      <div class="flex-1 flex items-center justify-between p-4 rounded-xl border transition-all"
           :class="form.status === 'active'
             ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
             : 'bg-gray-50 dark:bg-slate-700/50 border-gray-200 dark:border-slate-600'">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full flex items-center justify-center"
               :class="form.status === 'active' ? 'bg-green-500' : 'bg-gray-400'">
            <span class="material-icons text-white text-lg">
              {{ form.status === 'active' ? 'check' : 'pause' }}
            </span>
          </div>
          <div>
            <p class="font-medium text-sm" :class="form.status === 'active' ? 'text-green-700 dark:text-green-400' : 'text-gray-600 dark:text-slate-400'">
              {{ form.status === 'active' ? $t('planning.campaigns.statusActive') : $t('planning.campaigns.statusInactive') }}
            </p>
          </div>
        </div>
        <button type="button" @click="toggleStatus"
                class="relative w-12 h-6 rounded-full transition-colors"
                :class="form.status === 'active' ? 'bg-green-500' : 'bg-gray-300 dark:bg-slate-600'">
          <span class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
                :class="form.status === 'active' ? 'translate-x-6' : ''"></span>
        </button>
      </div>

      <!-- Combinable Toggle -->
      <div class="flex-1 flex items-center justify-between p-4 rounded-xl border transition-all"
           :class="form.combinable
             ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800'
             : 'bg-gray-50 dark:bg-slate-700/50 border-gray-200 dark:border-slate-600'">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-full flex items-center justify-center"
               :class="form.combinable ? 'bg-purple-500' : 'bg-gray-400'">
            <span class="material-icons text-white text-lg">link</span>
          </div>
          <div>
            <p class="font-medium text-sm" :class="form.combinable ? 'text-purple-700 dark:text-purple-400' : 'text-gray-600 dark:text-slate-400'">
              {{ $t('planning.campaigns.combinable') }}
            </p>
          </div>
        </div>
        <button type="button" @click="form.combinable = !form.combinable"
                class="relative w-12 h-6 rounded-full transition-colors"
                :class="form.combinable ? 'bg-purple-500' : 'bg-gray-300 dark:bg-slate-600'">
          <span class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
                :class="form.combinable ? 'translate-x-6' : ''"></span>
        </button>
      </div>
    </div>

    <!-- Campaign Name -->
    <div>
      <label class="form-label">{{ $t('planning.campaigns.name') }} <span class="text-red-500">*</span></label>
      <input v-model="form.name[currentLang]" type="text" class="form-input" :placeholder="$t('planning.campaigns.name')" />
    </div>

    <!-- Discount Section -->
    <div class="p-5 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl border border-amber-200 dark:border-amber-800">
      <div class="flex items-center gap-3 mb-4">
        <div class="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
          <span class="material-icons text-white">discount</span>
        </div>
        <div>
          <h4 class="font-semibold text-gray-800 dark:text-white">{{ $t('planning.campaigns.discount') }}</h4>
          <p class="text-xs text-gray-500 dark:text-slate-400">{{ $t('planning.campaigns.discountTypeHint') }}</p>
        </div>
      </div>

      <!-- Discount Type Toggle -->
      <div class="flex gap-3 mb-4">
        <button type="button" @click="form.freeNightsEnabled = false"
                class="flex-1 p-4 rounded-xl border-2 transition-all text-center"
                :class="!form.freeNightsEnabled
                  ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/25'
                  : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600 hover:border-amber-400'">
          <span class="material-icons text-2xl mb-1" :class="!form.freeNightsEnabled ? 'text-white' : 'text-amber-500'">percent</span>
          <div class="font-bold text-sm" :class="!form.freeNightsEnabled ? 'text-white' : 'text-gray-800 dark:text-white'">{{ $t('planning.campaigns.discountTypes.percentage') }}</div>
        </button>
        <button type="button" @click="form.freeNightsEnabled = true"
                class="flex-1 p-4 rounded-xl border-2 transition-all text-center"
                :class="form.freeNightsEnabled
                  ? 'bg-indigo-500 border-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                  : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600 hover:border-indigo-400'">
          <span class="material-icons text-2xl mb-1" :class="form.freeNightsEnabled ? 'text-white' : 'text-indigo-500'">card_giftcard</span>
          <div class="font-bold text-sm" :class="form.freeNightsEnabled ? 'text-white' : 'text-gray-800 dark:text-white'">{{ $t('planning.campaigns.freeNightsFeature') }}</div>
        </button>
      </div>

      <!-- Percentage Discount Input -->
      <div v-if="!form.freeNightsEnabled" class="flex items-center justify-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-xl">
        <div class="flex items-center bg-amber-50 dark:bg-amber-900/30 rounded-xl border-2 border-amber-200 dark:border-amber-700 overflow-hidden">
          <span class="px-4 py-3 bg-amber-500 text-white font-bold text-xl">%</span>
          <input v-model.number="form.discount.value" type="number" min="0" max="100"
                 class="w-24 px-4 py-3 border-0 focus:ring-0 text-2xl font-bold text-center bg-transparent text-amber-700 dark:text-amber-400" />
        </div>
        <span class="text-sm text-gray-600 dark:text-slate-400">{{ $t('planning.campaigns.discountHint') }}</span>
      </div>

      <!-- Free Nights Input -->
      <div v-else class="flex items-center justify-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-xl">
        <div class="flex items-center gap-3">
          <div class="text-center">
            <input v-model.number="form.discount.freeNights.stayNights" type="number" min="2"
                   class="w-20 px-3 py-3 rounded-xl border-2 border-indigo-200 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/30 text-center text-2xl font-bold text-indigo-700 dark:text-indigo-400" />
            <p class="text-xs text-gray-500 mt-1">{{ $t('planning.campaigns.stayNights') }}</p>
          </div>
          <span class="text-3xl font-bold text-indigo-500">=</span>
          <div class="text-center">
            <input v-model.number="form.discount.freeNights.freeNights" type="number" min="1"
                   class="w-20 px-3 py-3 rounded-xl border-2 border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/30 text-center text-2xl font-bold text-green-700 dark:text-green-400" />
            <p class="text-xs text-gray-500 mt-1">{{ $t('planning.campaigns.freeNights') }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Markets Selection -->
    <div class="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl border border-blue-200 dark:border-blue-800">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <span class="material-icons text-white">public</span>
          </div>
          <div>
            <h4 class="font-semibold text-gray-800 dark:text-white">{{ $t('planning.campaigns.applicableMarkets') }}</h4>
            <p class="text-xs text-gray-500 dark:text-slate-400">{{ form.conditions.applicableMarkets.length }} / {{ markets.length }} {{ $t('common.selected') }}</p>
          </div>
        </div>
        <button type="button" @click="toggleAllMarkets"
                class="px-3 py-1.5 text-xs font-medium rounded-lg transition-all"
                :class="form.conditions.applicableMarkets.length === markets.length
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 border border-blue-300 dark:border-blue-700 hover:bg-blue-50'">
          {{ form.conditions.applicableMarkets.length === markets.length ? $t('planning.campaigns.deselectAll') : $t('planning.campaigns.selectAll') }}
        </button>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        <button v-for="market in markets" :key="market._id" type="button"
                @click="toggleMarket(market._id)"
                class="relative p-3 rounded-xl border-2 transition-all duration-200 text-left group hover:shadow-md"
                :class="form.conditions.applicableMarkets.includes(market._id)
                  ? 'bg-blue-500 border-blue-500 text-white shadow-lg shadow-blue-500/25'
                  : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600 hover:border-blue-400'">
          <!-- Checkmark -->
          <div v-if="form.conditions.applicableMarkets.includes(market._id)"
               class="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow">
            <span class="material-icons text-blue-500 text-sm">check</span>
          </div>
          <div class="font-bold text-sm" :class="form.conditions.applicableMarkets.includes(market._id) ? 'text-white' : 'text-gray-800 dark:text-white'">
            {{ market.code }}
          </div>
          <div class="text-xs mt-0.5" :class="form.conditions.applicableMarkets.includes(market._id) ? 'text-blue-100' : 'text-gray-500 dark:text-slate-400'">
            {{ market.currency }}
          </div>
        </button>
      </div>
    </div>

    <!-- Meal Plans Selection -->
    <div class="p-5 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl border border-emerald-200 dark:border-emerald-800">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <span class="material-icons text-white">restaurant</span>
          </div>
          <div>
            <h4 class="font-semibold text-gray-800 dark:text-white">{{ $t('planning.campaigns.applicableMealPlans') }}</h4>
            <p class="text-xs text-gray-500 dark:text-slate-400">{{ form.conditions.applicableMealPlans.length }} / {{ mealPlans.length }} {{ $t('common.selected') }}</p>
          </div>
        </div>
        <button type="button" @click="toggleAllMealPlans"
                class="px-3 py-1.5 text-xs font-medium rounded-lg transition-all"
                :class="form.conditions.applicableMealPlans.length === mealPlans.length
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-50'">
          {{ form.conditions.applicableMealPlans.length === mealPlans.length ? $t('planning.campaigns.deselectAll') : $t('planning.campaigns.selectAll') }}
        </button>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <button v-for="mp in mealPlans" :key="mp._id" type="button"
                @click="toggleMealPlan(mp._id)"
                class="relative p-3 rounded-xl border-2 transition-all duration-200 text-center group hover:shadow-md"
                :class="form.conditions.applicableMealPlans.includes(mp._id)
                  ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                  : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600 hover:border-emerald-400'">
          <!-- Checkmark -->
          <div v-if="form.conditions.applicableMealPlans.includes(mp._id)"
               class="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow">
            <span class="material-icons text-emerald-500 text-sm">check</span>
          </div>
          <div class="font-bold text-lg" :class="form.conditions.applicableMealPlans.includes(mp._id) ? 'text-white' : 'text-gray-800 dark:text-white'">
            {{ mp.code }}
          </div>
          <div class="text-xs mt-0.5 truncate" :class="form.conditions.applicableMealPlans.includes(mp._id) ? 'text-emerald-100' : 'text-gray-500 dark:text-slate-400'">
            {{ getMealPlanLabel(mp) }}
          </div>
        </button>
      </div>
    </div>

    <!-- Room Types Selection -->
    <div class="p-5 bg-gradient-to-br from-purple-50 to-fuchsia-50 dark:from-purple-900/20 dark:to-fuchsia-900/20 rounded-2xl border border-purple-200 dark:border-purple-800">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-purple-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
            <span class="material-icons text-white">bed</span>
          </div>
          <div>
            <h4 class="font-semibold text-gray-800 dark:text-white">{{ $t('planning.campaigns.applicableRoomTypes') }}</h4>
            <p class="text-xs text-gray-500 dark:text-slate-400">{{ form.conditions.applicableRoomTypes.length }} / {{ roomTypes.length }} {{ $t('common.selected') }}</p>
          </div>
        </div>
        <button type="button" @click="toggleAllRoomTypes"
                class="px-3 py-1.5 text-xs font-medium rounded-lg transition-all"
                :class="form.conditions.applicableRoomTypes.length === roomTypes.length
                  ? 'bg-purple-600 text-white'
                  : 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 border border-purple-300 dark:border-purple-700 hover:bg-purple-50'">
          {{ form.conditions.applicableRoomTypes.length === roomTypes.length ? $t('planning.campaigns.deselectAll') : $t('planning.campaigns.selectAll') }}
        </button>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        <button v-for="rt in roomTypes" :key="rt._id" type="button"
                @click="toggleRoomType(rt._id)"
                class="relative p-4 rounded-xl border-2 transition-all duration-200 text-left group hover:shadow-md"
                :class="form.conditions.applicableRoomTypes.includes(rt._id)
                  ? 'bg-purple-500 border-purple-500 text-white shadow-lg shadow-purple-500/25'
                  : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600 hover:border-purple-400'">
          <!-- Checkmark -->
          <div v-if="form.conditions.applicableRoomTypes.includes(rt._id)"
               class="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow">
            <span class="material-icons text-purple-500 text-sm">check</span>
          </div>
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center"
                 :class="form.conditions.applicableRoomTypes.includes(rt._id) ? 'bg-purple-400' : 'bg-purple-100 dark:bg-purple-900/30'">
              <span class="material-icons text-sm" :class="form.conditions.applicableRoomTypes.includes(rt._id) ? 'text-white' : 'text-purple-600 dark:text-purple-400'">king_bed</span>
            </div>
            <div>
              <div class="font-bold text-sm" :class="form.conditions.applicableRoomTypes.includes(rt._id) ? 'text-white' : 'text-gray-800 dark:text-white'">
                {{ rt.code }}
              </div>
              <div class="text-xs" :class="form.conditions.applicableRoomTypes.includes(rt._id) ? 'text-purple-100' : 'text-gray-500 dark:text-slate-400'">
                {{ getRoomTypeLabel(rt) }}
              </div>
            </div>
          </div>
        </button>
      </div>
    </div>

    <!-- Minimum Stay -->
    <div class="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
      <label class="form-label flex items-center gap-2">
        <span class="material-icons text-sm">hotel</span>
        {{ $t('planning.campaigns.minNights') }}
      </label>
      <div class="flex items-center gap-3">
        <input v-model.number="form.conditions.minNights" type="number" min="1"
               class="w-20 px-3 py-2 rounded-lg border border-gray-300 dark:border-slate-600 text-center font-bold" />
        <span class="text-sm text-gray-600 dark:text-slate-400">{{ $t('planning.campaigns.minNightsHint') }}</span>
      </div>
    </div>

    <!-- Stay Window -->
    <div class="p-4 bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 rounded-xl border border-teal-200 dark:border-teal-800">
      <label class="form-label text-teal-800 dark:text-teal-400 flex items-center gap-2 mb-1">
        <span class="material-icons">date_range</span>
        {{ $t('planning.campaigns.stayWindow') }}
      </label>
      <p class="text-xs text-teal-600 dark:text-teal-500 mb-4">{{ $t('planning.campaigns.stayWindowHint') }}</p>

      <DateRangePicker v-model="stayDateRange" :allow-past="true" />

      <!-- Day Checkboxes -->
      <div class="mt-4 flex flex-wrap gap-2">
        <button v-for="(day, key) in weekdays" :key="key" type="button"
                @click="toggleStayDay(key)"
                class="px-3 py-1.5 text-xs rounded-lg border-2 font-medium transition-all"
                :class="form.stayDays.includes(key)
                  ? 'bg-teal-500 border-teal-500 text-white'
                  : 'bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:border-teal-400'">
          {{ $t(`planning.campaigns.weekdays.${key}`) }}
        </button>
      </div>
    </div>

    <!-- Booking Window -->
    <div class="p-4 bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 rounded-xl border border-rose-200 dark:border-rose-800">
      <label class="form-label text-rose-800 dark:text-rose-400 flex items-center gap-2 mb-1">
        <span class="material-icons">event_available</span>
        {{ $t('planning.campaigns.bookingWindow') }}
      </label>
      <p class="text-xs text-rose-600 dark:text-rose-500 mb-4">{{ $t('planning.campaigns.bookingWindowHint') }}</p>

      <DateRangePicker v-model="bookingDateRange" :allow-past="true" />

      <!-- Day Checkboxes -->
      <div class="mt-4 flex flex-wrap gap-2">
        <button v-for="(day, key) in weekdays" :key="key" type="button"
                @click="toggleBookingDay(key)"
                class="px-3 py-1.5 text-xs rounded-lg border-2 font-medium transition-all"
                :class="form.bookingDays.includes(key)
                  ? 'bg-rose-500 border-rose-500 text-white'
                  : 'bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:border-rose-400'">
          {{ $t(`planning.campaigns.weekdays.${key}`) }}
        </button>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-slate-700">
      <button type="button" @click="$emit('cancel')" class="btn-secondary">{{ $t('common.cancel') }}</button>
      <button type="button" @click="handleSave" class="btn-primary" :disabled="saving">
        {{ saving ? $t('common.loading') : $t('common.save') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import DateRangePicker from '@/components/common/DateRangePicker.vue'
import planningService from '@/services/planningService'

const props = defineProps({
  hotel: { type: Object, required: true },
  campaign: { type: Object, default: null },
  roomTypes: { type: Array, default: () => [] },
  mealPlans: { type: Array, default: () => [] },
  markets: { type: Array, default: () => [] }
})

const emit = defineEmits(['saved', 'cancel'])

const { t, locale } = useI18n()
const toast = useToast()
const currentLang = computed(() => locale.value)
const saving = ref(false)

const weekdays = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat', sun: 'Sun' }

const SUPPORTED_LANGUAGES = ['tr', 'en', 'ru', 'el', 'de', 'es', 'it', 'fr', 'ro', 'bg', 'pt', 'da', 'zh', 'ar', 'fa', 'he', 'sq', 'uk', 'pl', 'az']
const createMultiLangObject = () => {
  const obj = {}
  SUPPORTED_LANGUAGES.forEach(lang => { obj[lang] = '' })
  return obj
}

const form = reactive({
  code: '',
  name: createMultiLangObject(),
  status: 'active',
  combinable: false,
  freeNightsEnabled: false,
  discount: {
    type: 'percentage',
    value: 10,
    freeNights: { stayNights: 7, freeNights: 1 }
  },
  conditions: {
    minNights: 1,
    applicableMarkets: [],
    applicableMealPlans: [],
    applicableRoomTypes: []
  },
  stayDays: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
  bookingDays: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
})

// Date range models
const stayDateRange = ref({ start: null, end: null })
const bookingDateRange = ref({ start: null, end: null })

// Helper functions
const getMealPlanLabel = (mp) => mp.name?.[locale.value] || mp.name?.tr || mp.name?.en || mp.code
const getRoomTypeLabel = (rt) => rt.name?.[locale.value] || rt.name?.tr || rt.name?.en || rt.code

// Toggle functions for card selection
const toggleMarket = (id) => {
  const idx = form.conditions.applicableMarkets.indexOf(id)
  if (idx > -1) {
    form.conditions.applicableMarkets.splice(idx, 1)
  } else {
    form.conditions.applicableMarkets.push(id)
  }
}
const toggleAllMarkets = () => {
  if (form.conditions.applicableMarkets.length === props.markets.length) {
    form.conditions.applicableMarkets = []
  } else {
    form.conditions.applicableMarkets = props.markets.map(m => m._id)
  }
}

const toggleMealPlan = (id) => {
  const idx = form.conditions.applicableMealPlans.indexOf(id)
  if (idx > -1) {
    form.conditions.applicableMealPlans.splice(idx, 1)
  } else {
    form.conditions.applicableMealPlans.push(id)
  }
}
const toggleAllMealPlans = () => {
  if (form.conditions.applicableMealPlans.length === props.mealPlans.length) {
    form.conditions.applicableMealPlans = []
  } else {
    form.conditions.applicableMealPlans = props.mealPlans.map(mp => mp._id)
  }
}

const toggleRoomType = (id) => {
  const idx = form.conditions.applicableRoomTypes.indexOf(id)
  if (idx > -1) {
    form.conditions.applicableRoomTypes.splice(idx, 1)
  } else {
    form.conditions.applicableRoomTypes.push(id)
  }
}
const toggleAllRoomTypes = () => {
  if (form.conditions.applicableRoomTypes.length === props.roomTypes.length) {
    form.conditions.applicableRoomTypes = []
  } else {
    form.conditions.applicableRoomTypes = props.roomTypes.map(rt => rt._id)
  }
}

// Day toggles
const toggleStayDay = (day) => {
  const idx = form.stayDays.indexOf(day)
  if (idx > -1) form.stayDays.splice(idx, 1)
  else form.stayDays.push(day)
}
const toggleBookingDay = (day) => {
  const idx = form.bookingDays.indexOf(day)
  if (idx > -1) form.bookingDays.splice(idx, 1)
  else form.bookingDays.push(day)
}

const toggleStatus = () => {
  form.status = form.status === 'active' ? 'inactive' : 'active'
}

const handleSave = async () => {
  if (!form.name[currentLang.value]) {
    toast.error(t('validation.required'))
    return
  }
  if (!form.conditions.applicableMarkets.length) {
    toast.error(t('validation.required'))
    return
  }

  saving.value = true
  try {
    const data = {
      ...form,
      code: form.name[currentLang.value].substring(0, 10).toUpperCase().replace(/\s+/g, '_'),
      bookingWindow: {
        startDate: bookingDateRange.value.start,
        endDate: bookingDateRange.value.end
      },
      stayWindow: {
        startDate: stayDateRange.value.start,
        endDate: stayDateRange.value.end
      }
    }

    // If free nights not enabled, use percentage discount
    if (!form.freeNightsEnabled) {
      data.discount.type = 'percentage'
    } else {
      data.discount.type = 'free_nights'
    }

    if (props.campaign) {
      await planningService.updateCampaign(props.hotel._id, props.campaign._id, data)
      toast.success(t('planning.campaigns.updated'))
    } else {
      await planningService.createCampaign(props.hotel._id, data)
      toast.success(t('planning.campaigns.created'))
    }
    emit('saved')
  } catch (error) {
    toast.error(error.response?.data?.message || t('common.operationFailed'))
  } finally {
    saving.value = false
  }
}

const formatDateForInput = (date) => {
  if (!date) return null
  return new Date(date).toISOString().split('T')[0]
}

onMounted(() => {
  if (props.campaign) {
    form.code = props.campaign.code || ''
    form.name = { ...createMultiLangObject(), ...props.campaign.name }
    form.status = props.campaign.status || 'active'
    form.combinable = props.campaign.combinable || false
    form.freeNightsEnabled = props.campaign.discount?.type === 'free_nights'
    form.discount = { ...form.discount, ...props.campaign.discount }
    form.conditions = { ...form.conditions, ...props.campaign.conditions }
    form.stayDays = props.campaign.stayDays || ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
    form.bookingDays = props.campaign.bookingDays || ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']

    stayDateRange.value = {
      start: formatDateForInput(props.campaign.stayWindow?.startDate),
      end: formatDateForInput(props.campaign.stayWindow?.endDate)
    }
    bookingDateRange.value = {
      start: formatDateForInput(props.campaign.bookingWindow?.startDate),
      end: formatDateForInput(props.campaign.bookingWindow?.endDate)
    }
  }
})
</script>
