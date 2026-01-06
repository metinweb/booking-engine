<template>
  <div class="flex flex-col h-full">
    <!-- Preview Header -->
    <div
      class="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-slate-700 -mx-4 px-4"
    >
      <div
        class="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center"
      >
        <span class="material-icons text-white">fact_check</span>
      </div>
      <div>
        <h3 class="font-semibold text-gray-900 dark:text-white">
          {{ $t('planning.seasons.periodPreview') }}
        </h3>
        <p class="text-sm text-gray-500 dark:text-slate-400">
          {{ form.code }} - {{ form.name?.tr || form.name?.en }}
        </p>
      </div>
    </div>

    <!-- Preview Content -->
    <div class="flex-1 overflow-y-auto py-4 space-y-4">
      <!-- Summary Stats -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div
          class="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/30 dark:to-indigo-800/30 rounded-xl p-4 text-center"
        >
          <div class="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
            {{ previewSummary.totalDays }}
          </div>
          <div class="text-xs text-indigo-600/70 dark:text-indigo-400/70 font-medium">
            {{ $t('planning.seasons.totalDays') }}
          </div>
        </div>
        <div
          class="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 rounded-xl p-4 text-center"
        >
          <div class="text-3xl font-bold text-purple-600 dark:text-purple-400">
            {{ previewSummary.dateRanges }}
          </div>
          <div class="text-xs text-purple-600/70 dark:text-purple-400/70 font-medium">
            {{ $t('planning.seasons.dateRangeCount') }}
          </div>
        </div>
        <div
          class="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl p-4 text-center"
        >
          <div class="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {{ previewSummary.roomTypes }}
          </div>
          <div class="text-xs text-blue-600/70 dark:text-blue-400/70 font-medium">
            {{ $t('planning.pricing.roomTypes') }}
          </div>
        </div>
        <div
          class="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-xl p-4 text-center"
        >
          <div class="text-3xl font-bold text-green-600 dark:text-green-400">
            {{ previewSummary.mealPlans }}
          </div>
          <div class="text-xs text-green-600/70 dark:text-green-400/70 font-medium">
            {{ $t('planning.pricing.mealPlans') }}
          </div>
        </div>
      </div>

      <!-- Date Ranges Detail -->
      <div class="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4">
        <h5
          class="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3 flex items-center gap-2"
        >
          <span class="material-icons text-indigo-500">date_range</span>
          {{ $t('planning.pricing.dateRanges') }}
        </h5>
        <div class="space-y-2">
          <div
            v-for="(range, idx) in validDateRanges"
            :key="idx"
            class="flex items-center gap-3 p-2 bg-white dark:bg-slate-800 rounded-lg"
          >
            <span
              class="w-7 h-7 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-bold"
            >
              {{ idx + 1 }}
            </span>
            <div class="flex items-center gap-2 flex-1">
              <span class="font-medium text-gray-700 dark:text-slate-300">{{
                formatDisplayDate(range.startDate)
              }}</span>
              <span class="material-icons text-gray-400 text-sm">arrow_forward</span>
              <span class="font-medium text-gray-700 dark:text-slate-300">{{
                formatDisplayDate(range.endDate)
              }}</span>
            </div>
            <span
              class="text-xs px-2 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-full font-medium"
            >
              {{ calculateDays(range.startDate, range.endDate) }} {{ $t('common.days') }}
            </span>
          </div>
        </div>
      </div>

      <!-- Overrides Summary -->
      <div v-if="hasAnyOverrides" class="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4">
        <h5
          class="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3 flex items-center gap-2"
        >
          <span class="material-icons text-amber-500">tune</span>
          {{ $t('planning.seasons.activeOverrides') }}
        </h5>
        <div class="flex flex-wrap gap-2">
          <span
            v-if="!form.childAgeSettings.inheritFromMarket"
            class="px-3 py-1.5 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400 rounded-lg text-sm flex items-center gap-1.5"
          >
            <span class="material-icons text-sm">child_care</span>
            {{ $t('planning.seasons.childAgeOverride') }}
          </span>
          <span
            v-if="!form.paymentSettings.inheritFromMarket"
            class="px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg text-sm flex items-center gap-1.5"
          >
            <span class="material-icons text-sm">payments</span>
            {{ $t('planning.seasons.paymentSettings') }}
          </span>
          <span
            v-if="!form.childrenSettings.inheritFromMarket"
            class="px-3 py-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-lg text-sm flex items-center gap-1.5"
          >
            <span class="material-icons text-sm">family_restroom</span>
            {{ $t('planning.markets.childrenAllowed') }}
          </span>
          <span
            v-if="!form.salesSettingsOverride.inheritFromMarket"
            class="px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-lg text-sm flex items-center gap-1.5"
          >
            <span class="material-icons text-sm">storefront</span>
            {{ $t('planning.seasons.salesSettingsOverride') }}
          </span>
          <span
            v-if="!form.nonRefundableOverride.inheritFromMarket"
            class="px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm flex items-center gap-1.5"
          >
            <span class="material-icons text-sm">money_off</span>
            {{ $t('planning.seasons.nonRefundableOverride') }}
          </span>
          <span
            v-if="hasPricingOverrides"
            class="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg text-sm flex items-center gap-1.5"
          >
            <span class="material-icons text-sm">calculate</span>
            {{ $t('planning.seasons.pricingOverrides') }}
          </span>
        </div>
      </div>
    </div>

    <!-- Preview Actions -->
    <div
      class="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-slate-700"
    >
      <p class="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1">
        <span class="material-icons text-xs">info</span>
        {{ $t('planning.seasons.previewHint') }}
      </p>
      <div class="flex gap-3">
        <button type="button" class="btn-secondary" @click="$emit('back')">
          <span class="material-icons text-sm mr-1">arrow_back</span>
          {{ $t('common.back') }}
        </button>
        <button type="button" class="btn-primary" :disabled="saving" @click="$emit('confirm')">
          <span class="material-icons text-sm mr-1">check</span>
          {{ saving ? $t('common.loading') : $t('planning.pricing.confirmAndSave') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  form: { type: Object, required: true },
  saving: { type: Boolean, default: false },
  hasPricingOverrides: { type: Boolean, default: false },
  filteredRoomTypes: { type: Array, default: () => [] },
  filteredMealPlans: { type: Array, default: () => [] }
})

defineEmits(['back', 'confirm'])

const { t, locale } = useI18n()

// Valid date ranges
const validDateRanges = computed(() => {
  return props.form.dateRanges.filter(r => r.startDate && r.endDate)
})

// Calculate days between two dates
const calculateDays = (startDate, endDate) => {
  if (!startDate || !endDate) return 0
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffTime = Math.abs(end - start)
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
}

// Preview summary stats
const previewSummary = computed(() => {
  const totalDays = validDateRanges.value.reduce((sum, range) => {
    return sum + calculateDays(range.startDate, range.endDate)
  }, 0)

  const roomTypesCount =
    props.form.activeRoomTypes.length > 0 ? props.form.activeRoomTypes.length : props.filteredRoomTypes.length

  const mealPlansCount =
    props.form.activeMealPlans.length > 0 ? props.form.activeMealPlans.length : props.filteredMealPlans.length

  return {
    totalDays,
    dateRanges: validDateRanges.value.length,
    roomTypes: roomTypesCount,
    mealPlans: mealPlansCount
  }
})

// Check if any overrides are active
const hasAnyOverrides = computed(() => {
  return (
    !props.form.childAgeSettings.inheritFromMarket ||
    !props.form.paymentSettings.inheritFromMarket ||
    !props.form.childrenSettings.inheritFromMarket ||
    !props.form.salesSettingsOverride.inheritFromMarket ||
    !props.form.nonRefundableOverride.inheritFromMarket ||
    props.hasPricingOverrides
  )
})

// Format date for display
const formatDisplayDate = dateStr => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString(locale.value === 'tr' ? 'tr-TR' : 'en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}
</script>
