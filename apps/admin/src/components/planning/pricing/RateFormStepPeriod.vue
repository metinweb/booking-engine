<template>
  <div class="space-y-5">
    <div class="text-center mb-6">
      <h3 class="text-lg font-bold text-gray-800 dark:text-white">
        {{ $t('planning.pricing.step1Title') }}
      </h3>
      <p class="text-sm text-gray-500 dark:text-slate-400">
        {{ $t('planning.pricing.step1Desc') }}
      </p>
    </div>

    <!-- Selected Market Info -->
    <div
      class="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800"
    >
      <span class="material-icons text-green-600">payments</span>
      <div>
        <div class="text-xs text-gray-500 dark:text-slate-400">
          {{ $t('planning.pricing.market') }}
        </div>
        <div class="font-semibold text-gray-800 dark:text-white">
          {{ market?.code }} <span class="text-green-600">({{ currency }})</span>
        </div>
      </div>
    </div>

    <!-- No meal plans warning -->
    <div
      v-if="mealPlans.length === 0"
      class="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl"
    >
      <div class="flex items-start gap-3">
        <span class="material-icons text-red-500">error</span>
        <div>
          <div class="font-medium text-red-700 dark:text-red-400">
            {{ $t('planning.pricing.noMealPlansWarning') }}
          </div>
          <p class="text-sm text-red-600 dark:text-red-300 mt-1">
            {{ $t('planning.pricing.noMealPlansHint') }}
          </p>
        </div>
      </div>
    </div>

    <!-- No seasons warning -->
    <div
      v-else-if="seasons.length === 0"
      class="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl"
    >
      <div class="flex items-start gap-3">
        <span class="material-icons text-amber-500">warning</span>
        <div>
          <div class="font-medium text-amber-700 dark:text-amber-400">
            {{ $t('planning.pricing.noSeasonsWarning') }}
          </div>
          <p class="text-sm text-amber-600 dark:text-amber-300 mt-1">
            {{ $t('planning.pricing.noSeasonsHint') }}
          </p>
        </div>
      </div>
    </div>

    <!-- Date Range with Season Info -->
    <div v-else>
      <label class="form-label flex items-center gap-2 mb-3">
        <span class="material-icons text-blue-600">date_range</span>
        {{ $t('planning.pricing.period') }} <span class="text-red-500">*</span>
      </label>

      <!-- Available Seasons Legend -->
      <div class="mb-3 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
        <div class="text-xs text-gray-500 dark:text-slate-400 mb-2">
          {{ $t('planning.pricing.availableSeasons') }}:
        </div>
        <div class="flex flex-wrap gap-2">
          <div
            v-for="s in seasons"
            :key="s._id"
            class="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs"
            :class="
              detectedSeason?._id === s._id
                ? 'bg-purple-100 dark:bg-purple-900/30 ring-2 ring-purple-500'
                : 'bg-white dark:bg-slate-600'
            "
          >
            <div class="w-2.5 h-2.5 rounded-full" :style="{ backgroundColor: s.color }"></div>
            <span class="font-medium">{{ s.code }}</span>
            <span class="text-gray-400 dark:text-slate-400">{{ formatSeasonDates(s) }}</span>
          </div>
        </div>
      </div>

      <DateRangePickerInline
        v-model="internalDateRange"
        :allow-past="true"
        :min-date="allSeasonsMinDate"
        :max-date="allSeasonsMaxDate"
        :disabled-dates="disabledDates"
      />

      <!-- Detected Season Info -->
      <div
        v-if="detectedSeason"
        class="mt-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800"
      >
        <div class="flex items-center gap-2 text-sm text-purple-700 dark:text-purple-300">
          <div
            class="w-3 h-3 rounded-full"
            :style="{ backgroundColor: detectedSeason.color }"
          ></div>
          <span class="font-medium">{{ detectedSeason.code }}</span>
          <span class="text-purple-500">{{ $t('planning.pricing.seasonAutoDetected') }}</span>
        </div>
      </div>

      <!-- No season for selected dates -->
      <div
        v-else-if="internalDateRange.start && internalDateRange.end && !detectedSeason"
        class="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800"
      >
        <div class="flex items-start gap-2">
          <span class="material-icons text-red-500 text-sm">error</span>
          <div class="text-sm text-red-700 dark:text-red-300">
            {{ $t('planning.pricing.noSeasonForDates') }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import DateRangePickerInline from '@/components/common/DateRangePickerInline.vue'

const props = defineProps({
  market: { type: Object, default: null },
  mealPlans: { type: Array, default: () => [] },
  seasons: { type: Array, default: () => [] },
  dateRange: { type: Object, required: true },
  detectedSeason: { type: Object, default: null },
  allSeasonsMinDate: { type: Date, default: null },
  allSeasonsMaxDate: { type: Date, default: null },
  disabledDates: { type: [Array, Object], default: null },
  currency: { type: String, default: 'EUR' }
})

const emit = defineEmits(['update:dateRange'])

// Two-way binding for dateRange
const internalDateRange = computed({
  get: () => props.dateRange,
  set: val => emit('update:dateRange', val)
})

// Format season dates for display in legend
const formatSeasonDates = season => {
  if (!season?.dateRanges?.length) return ''
  const range = season.dateRanges[0]
  const start = new Date(range.startDate)
  const end = new Date(range.endDate)
  return `${start.getDate()}.${start.getMonth() + 1} - ${end.getDate()}.${end.getMonth() + 1}`
}
</script>
