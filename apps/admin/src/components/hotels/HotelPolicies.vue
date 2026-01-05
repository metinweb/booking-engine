<template>
  <form class="space-y-6" @submit.prevent="handleSubmit">
    <!-- Override Toggle for Linked Hotels -->
    <div
      v-if="showOverrideToggle"
      class="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <span class="material-icons text-purple-600 dark:text-purple-400">tune</span>
          <div>
            <h4 class="font-medium text-purple-800 dark:text-purple-300">
              {{ $t('hotels.policies.overrideSettings') }}
            </h4>
            <p class="text-sm text-purple-600 dark:text-purple-400">
              {{
                useBaseDefaults
                  ? $t('hotels.policies.usingBaseDefaults')
                  : $t('hotels.policies.usingCustomSettings')
              }}
            </p>
          </div>
        </div>
        <label class="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            :checked="!useBaseDefaults"
            class="sr-only peer"
            @change="toggleOverride"
          />
          <div
            class="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"
          ></div>
        </label>
      </div>
    </div>

    <!-- Readonly Notice -->
    <div
      v-if="readonly"
      class="p-3 bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 rounded-lg flex items-center gap-2"
    >
      <span class="material-icons text-gray-400">info</span>
      <span class="text-sm text-gray-600 dark:text-slate-400">{{
        $t('hotels.policies.readonlyNotice')
      }}</span>
    </div>

    <!-- Top Save Button -->
    <div v-if="!readonly" class="flex justify-end">
      <button type="submit" class="btn-primary" :disabled="saving">
        <span v-if="saving" class="flex items-center">
          <svg class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            />
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          {{ $t('common.loading') }}
        </span>
        <span v-else>{{ $t('common.save') }}</span>
      </button>
    </div>

    <!-- Check-in / Check-out & Age Settings - Compact Row -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <!-- Check-in Time -->
      <div>
        <label class="form-label text-sm">{{ $t('hotels.policies.checkIn') }}</label>
        <div class="relative">
          <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <span class="material-icons text-sm">login</span>
          </span>
          <input
            v-model="form.checkIn"
            type="time"
            class="form-input pl-9 text-sm"
            :disabled="readonly"
          />
        </div>
      </div>

      <!-- Check-out Time -->
      <div>
        <label class="form-label text-sm">{{ $t('hotels.policies.checkOut') }}</label>
        <div class="relative">
          <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <span class="material-icons text-sm">logout</span>
          </span>
          <input
            v-model="form.checkOut"
            type="time"
            class="form-input pl-9 text-sm"
            :disabled="readonly"
          />
        </div>
      </div>

      <!-- Max Baby Age -->
      <div>
        <label class="form-label text-sm">{{ $t('hotels.policies.maxBabyAge') }}</label>
        <div class="relative">
          <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <span class="material-icons text-sm">child_friendly</span>
          </span>
          <select
            v-model.number="form.maxBabyAge"
            class="form-input pl-9 text-sm"
            :disabled="readonly"
          >
            <option v-for="n in 6" :key="n - 1" :value="n - 1">
              {{ n - 1 }} {{ $t('hotels.policies.years') }}
            </option>
          </select>
        </div>
      </div>

      <!-- Max Child Age -->
      <div>
        <label class="form-label text-sm">{{ $t('hotels.policies.maxChildAge') }}</label>
        <div class="relative">
          <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <span class="material-icons text-sm">face</span>
          </span>
          <select
            v-model.number="form.maxChildAge"
            class="form-input pl-9 text-sm"
            :disabled="readonly"
          >
            <option v-for="n in 18" :key="n" :value="n">
              {{ n }} {{ $t('hotels.policies.years') }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <!-- Cancellation Policy - Booking.com Style -->
    <div
      class="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden"
    >
      <!-- Header -->
      <div
        class="bg-gray-50 dark:bg-slate-700/50 px-4 py-3 border-b border-gray-200 dark:border-slate-600 flex items-center justify-between"
      >
        <div class="flex items-center gap-2">
          <span class="material-icons text-purple-600 dark:text-purple-400">event_busy</span>
          <h3 class="font-semibold text-gray-800 dark:text-white">
            {{ $t('hotels.policies.cancellation') }}
          </h3>
        </div>
        <button
          v-if="!readonly"
          type="button"
          class="flex items-center gap-1 px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          @click="addRule"
        >
          <span class="material-icons text-sm">add</span>
          {{ $t('hotels.policies.addRule') }}
        </button>
      </div>

      <!-- Free Cancellation Toggle -->
      <div
        class="px-4 py-3 border-b border-gray-200 dark:border-slate-600 flex items-center justify-between bg-green-50/50 dark:bg-green-900/10"
      >
        <div class="flex items-center gap-3">
          <span class="material-icons text-green-600 dark:text-green-400">verified</span>
          <div>
            <span class="text-sm font-medium text-gray-800 dark:text-white">{{
              $t('hotels.policies.freeCancellation')
            }}</span>
            <span
              v-if="form.freeCancellation.enabled"
              class="ml-2 text-xs text-green-600 dark:text-green-400"
            >
              ({{ form.freeCancellation.daysBeforeCheckIn }}+ {{ $t('hotels.policies.days') }})
            </span>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <input
            v-if="form.freeCancellation.enabled"
            v-model.number="form.freeCancellation.daysBeforeCheckIn"
            type="number"
            min="1"
            max="30"
            class="w-16 px-2 py-1 text-sm text-center border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700"
            :disabled="readonly"
          />
          <label
            class="relative inline-flex items-center cursor-pointer"
            :class="{ 'opacity-50 pointer-events-none': readonly }"
          >
            <input
              v-model="form.freeCancellation.enabled"
              type="checkbox"
              class="sr-only peer"
              :disabled="readonly"
            />
            <div
              class="w-9 h-5 bg-gray-200 peer-focus:ring-2 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"
            ></div>
          </label>
        </div>
      </div>

      <!-- Rules Table -->
      <div class="divide-y divide-gray-200 dark:divide-slate-600">
        <!-- Empty State -->
        <div v-if="form.cancellationRules.length === 0" class="px-4 py-8 text-center">
          <span class="material-icons text-3xl text-gray-300 dark:text-slate-600">rule</span>
          <p class="mt-2 text-sm text-gray-500 dark:text-slate-400">
            {{ $t('hotels.policies.noRules') }}
          </p>
          <p class="text-xs text-gray-400 dark:text-slate-500">
            {{ $t('hotels.policies.noRulesHelp') }}
          </p>
        </div>

        <!-- Rule Rows -->
        <div
          v-for="(rule, index) in sortedRules"
          :key="index"
          class="px-4 py-3 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors group"
        >
          <!-- Timeline Dot -->
          <div class="flex-shrink-0">
            <div
              class="w-3 h-3 rounded-full"
              :class="
                rule.refundPercent === 100
                  ? 'bg-green-500'
                  : rule.refundPercent > 0
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
              "
            ></div>
          </div>

          <!-- Days -->
          <div class="flex items-center gap-2 min-w-[140px]">
            <input
              v-model.number="rule.daysBeforeCheckIn"
              type="number"
              min="0"
              max="365"
              class="w-16 px-2 py-1.5 text-sm text-center border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700"
              :disabled="readonly"
              @change="sortRulesDebounced"
            />
            <span class="text-sm text-gray-600 dark:text-slate-400">{{
              $t('hotels.policies.daysPlus')
            }}</span>
          </div>

          <!-- Arrow -->
          <span class="material-icons text-gray-400 text-sm">arrow_forward</span>

          <!-- Refund -->
          <div class="flex items-center gap-2 min-w-[120px]">
            <input
              v-model.number="rule.refundPercent"
              type="number"
              min="0"
              max="100"
              class="w-16 px-2 py-1.5 text-sm text-center border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700"
              :disabled="readonly"
            />
            <span class="text-sm text-gray-600 dark:text-slate-400"
              >% {{ $t('hotels.policies.refund') }}</span
            >
          </div>

          <!-- Visual Badge -->
          <div class="flex-1">
            <span
              class="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full"
              :class="{
                'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400':
                  rule.refundPercent === 100,
                'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400':
                  rule.refundPercent > 0 && rule.refundPercent < 100,
                'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400':
                  rule.refundPercent === 0
              }"
            >
              {{
                rule.refundPercent === 100
                  ? $t('hotels.policies.fullRefund')
                  : rule.refundPercent === 0
                    ? $t('hotels.policies.noRefund')
                    : $t('hotels.policies.partialRefund')
              }}
            </span>
          </div>

          <!-- Delete -->
          <button
            v-if="!readonly"
            type="button"
            class="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 p-1 rounded transition-all"
            @click="removeRule(index)"
          >
            <span class="material-icons text-lg">close</span>
          </button>
        </div>
      </div>

      <!-- Quick Add Presets -->
      <div
        v-if="!readonly"
        class="px-4 py-3 bg-gray-50 dark:bg-slate-700/30 border-t border-gray-200 dark:border-slate-600"
      >
        <p class="text-xs text-gray-500 dark:text-slate-400 mb-2">
          {{ $t('hotels.policies.quickAdd') }}:
        </p>
        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            class="px-2 py-1 text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
            @click="addPreset('flexible')"
          >
            {{ $t('hotels.policies.presetFlexible') }}
          </button>
          <button
            type="button"
            class="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 rounded hover:bg-yellow-200 dark:hover:bg-yellow-900/50 transition-colors"
            @click="addPreset('moderate')"
          >
            {{ $t('hotels.policies.presetModerate') }}
          </button>
          <button
            type="button"
            class="px-2 py-1 text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
            @click="addPreset('strict')"
          >
            {{ $t('hotels.policies.presetStrict') }}
          </button>
          <button
            type="button"
            class="px-2 py-1 text-xs bg-gray-100 text-gray-700 dark:bg-slate-600 dark:text-slate-300 rounded hover:bg-gray-200 dark:hover:bg-slate-500 transition-colors"
            @click="addPreset('nonRefundable')"
          >
            {{ $t('hotels.policies.presetNonRefundable') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Policy Texts - Collapsed by default -->
    <details
      class="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden"
    >
      <summary
        class="px-4 py-3 bg-gray-50 dark:bg-slate-700/50 cursor-pointer flex items-center justify-between hover:bg-gray-100 dark:hover:bg-slate-700"
      >
        <div class="flex items-center gap-2">
          <span class="material-icons text-blue-600 dark:text-blue-400">description</span>
          <h3 class="font-semibold text-gray-800 dark:text-white">
            {{ $t('hotels.policies.policyTexts') }}
          </h3>
        </div>
        <span class="material-icons text-gray-400 transition-transform">expand_more</span>
      </summary>

      <div class="p-4 space-y-4">
        <!-- Child Policy -->
        <div>
          <MultiLangInput
            v-model="form.childPolicy"
            :languages="SUPPORTED_LANGUAGES"
            :label="$t('hotels.policies.childPolicy')"
            type="textarea"
            :rows="2"
            :readonly="readonly"
          />
        </div>

        <!-- Pet Policy -->
        <div>
          <MultiLangInput
            v-model="form.petPolicy"
            :languages="SUPPORTED_LANGUAGES"
            :label="$t('hotels.policies.petPolicy')"
            type="textarea"
            :rows="2"
            :readonly="readonly"
          />
        </div>

        <!-- Additional Info -->
        <div>
          <MultiLangInput
            v-model="form.additionalInfo"
            :languages="SUPPORTED_LANGUAGES"
            :label="$t('hotels.policies.additionalInfo')"
            type="textarea"
            :rows="2"
            :readonly="readonly"
          />
        </div>
      </div>
    </details>

    <!-- Submit Button -->
    <div v-if="!readonly" class="flex justify-end">
      <button type="submit" class="btn-primary" :disabled="saving">
        <span v-if="saving" class="flex items-center">
          <svg class="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            />
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          {{ $t('common.loading') }}
        </span>
        <span v-else>{{ $t('common.save') }}</span>
      </button>
    </div>
  </form>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import MultiLangInput from '@/components/common/MultiLangInput.vue'

useI18n()

const props = defineProps({
  hotel: {
    type: Object,
    required: true
  },
  saving: {
    type: Boolean,
    default: false
  },
  readonly: {
    type: Boolean,
    default: false
  },
  showOverrideToggle: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['save', 'toggle-override'])

// Track useBaseDefaults state
const useBaseDefaults = ref(true)

// Toggle override setting
const toggleOverride = () => {
  useBaseDefaults.value = !useBaseDefaults.value
  emit('toggle-override', useBaseDefaults.value)
}

// All supported languages (20 languages for B2B)
const SUPPORTED_LANGUAGES = [
  'tr',
  'en',
  'ru',
  'el',
  'de',
  'es',
  'it',
  'fr',
  'ro',
  'bg',
  'pt',
  'da',
  'zh',
  'ar',
  'fa',
  'he',
  'sq',
  'uk',
  'pl',
  'az'
]

// Create empty multilingual object
const createMultiLangObject = () => {
  const obj = {}
  SUPPORTED_LANGUAGES.forEach(lang => {
    obj[lang] = ''
  })
  return obj
}

const form = ref({
  checkIn: '14:00',
  checkOut: '12:00',
  maxBabyAge: 2,
  maxChildAge: 12,
  childPolicy: createMultiLangObject(),
  petPolicy: createMultiLangObject(),
  additionalInfo: createMultiLangObject(),
  cancellationRules: [],
  freeCancellation: {
    enabled: false,
    daysBeforeCheckIn: 1
  }
})

// Watch for hotel changes and update form
watch(
  () => props.hotel,
  newHotel => {
    if (newHotel?.policies) {
      form.value = {
        checkIn: newHotel.policies.checkIn || '14:00',
        checkOut: newHotel.policies.checkOut || '12:00',
        maxBabyAge: newHotel.policies.maxBabyAge ?? 2,
        maxChildAge: newHotel.policies.maxChildAge ?? 12,
        childPolicy: { ...createMultiLangObject(), ...newHotel.policies.childPolicy },
        petPolicy: { ...createMultiLangObject(), ...newHotel.policies.petPolicy },
        additionalInfo: { ...createMultiLangObject(), ...newHotel.policies.additionalInfo },
        cancellationRules: (newHotel.policies.cancellationRules || []).map(rule => ({
          daysBeforeCheckIn: rule.daysBeforeCheckIn || 0,
          refundPercent: rule.refundPercent || 0
        })),
        freeCancellation: {
          enabled: newHotel.policies.freeCancellation?.enabled || false,
          daysBeforeCheckIn: newHotel.policies.freeCancellation?.daysBeforeCheckIn || 1
        }
      }
      // Sync useBaseDefaults
      useBaseDefaults.value = newHotel.policies.useBaseDefaults ?? true
    }
  },
  { immediate: true, deep: true }
)

// Sorted rules (by days descending)
const sortedRules = computed(() => {
  return [...form.value.cancellationRules].sort((a, b) => b.daysBeforeCheckIn - a.daysBeforeCheckIn)
})

// Debounce sort
let sortTimeout = null
const sortRulesDebounced = () => {
  if (sortTimeout) clearTimeout(sortTimeout)
  sortTimeout = setTimeout(() => {
    form.value.cancellationRules.sort((a, b) => b.daysBeforeCheckIn - a.daysBeforeCheckIn)
  }, 500)
}

// Add a new rule
const addRule = () => {
  const lastDays =
    form.value.cancellationRules.length > 0
      ? Math.max(...form.value.cancellationRules.map(r => r.daysBeforeCheckIn)) + 7
      : 7

  form.value.cancellationRules.push({
    daysBeforeCheckIn: lastDays,
    refundPercent: 50
  })

  form.value.cancellationRules.sort((a, b) => b.daysBeforeCheckIn - a.daysBeforeCheckIn)
}

// Remove a rule
const removeRule = index => {
  const actualIndex = form.value.cancellationRules.findIndex(
    r =>
      r.daysBeforeCheckIn === sortedRules.value[index].daysBeforeCheckIn &&
      r.refundPercent === sortedRules.value[index].refundPercent
  )
  if (actualIndex > -1) {
    form.value.cancellationRules.splice(actualIndex, 1)
  }
}

// Preset policies
const addPreset = type => {
  switch (type) {
    case 'flexible':
      form.value.cancellationRules = [
        { daysBeforeCheckIn: 1, refundPercent: 100 },
        { daysBeforeCheckIn: 0, refundPercent: 0 }
      ]
      form.value.freeCancellation = { enabled: true, daysBeforeCheckIn: 1 }
      break
    case 'moderate':
      form.value.cancellationRules = [
        { daysBeforeCheckIn: 7, refundPercent: 100 },
        { daysBeforeCheckIn: 3, refundPercent: 50 },
        { daysBeforeCheckIn: 0, refundPercent: 0 }
      ]
      form.value.freeCancellation = { enabled: true, daysBeforeCheckIn: 7 }
      break
    case 'strict':
      form.value.cancellationRules = [
        { daysBeforeCheckIn: 14, refundPercent: 100 },
        { daysBeforeCheckIn: 7, refundPercent: 50 },
        { daysBeforeCheckIn: 3, refundPercent: 25 },
        { daysBeforeCheckIn: 0, refundPercent: 0 }
      ]
      form.value.freeCancellation = { enabled: true, daysBeforeCheckIn: 14 }
      break
    case 'nonRefundable':
      form.value.cancellationRules = [{ daysBeforeCheckIn: 0, refundPercent: 0 }]
      form.value.freeCancellation = { enabled: false, daysBeforeCheckIn: 1 }
      break
  }
}

// Validate all fields (no required fields in policies)
const validateAll = () => true

// Get current form data
const getFormData = () => {
  return { policies: form.value }
}

const handleSubmit = () => {
  emit('save', { policies: form.value })
}

// Expose methods for parent component
defineExpose({
  validateAll,
  getFormData
})
</script>

<style scoped>
details[open] summary .material-icons:last-child {
  transform: rotate(180deg);
}
</style>
