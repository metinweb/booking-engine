<template>
  <div
    class="mb-6 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl border border-purple-200 dark:border-purple-800"
  >
    <div class="flex items-start justify-between">
      <div>
        <div class="text-sm font-medium text-purple-700 dark:text-purple-300 mb-2">
          {{ $t('planning.pricing.selectedRange') }}
        </div>
        <div class="text-lg font-bold text-gray-800 dark:text-white">
          {{ dateRangeSummary }}
        </div>
      </div>
      <div class="text-right">
        <div class="text-xs text-gray-500 dark:text-slate-400 mb-1">
          {{ $t('planning.pricing.roomType') }}
        </div>
        <div class="flex flex-wrap gap-1 justify-end">
          <span
            v-for="rt in uniqueRoomTypes"
            :key="rt._id"
            class="px-2 py-0.5 bg-white dark:bg-slate-700 rounded text-xs font-medium text-gray-700 dark:text-gray-300 shadow-sm"
          >
            {{ rt.code }}
          </span>
        </div>
      </div>
    </div>
    <div class="flex flex-wrap gap-1 mt-3">
      <span
        v-for="mp in uniqueMealPlans"
        :key="mp._id"
        class="px-2 py-0.5 rounded text-xs font-medium"
        :class="getMealPlanColor(mp.code)"
      >
        {{ mp.code }}
      </span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  dateRangeSummary: {
    type: String,
    required: true
  },
  uniqueRoomTypes: {
    type: Array,
    required: true
  },
  uniqueMealPlans: {
    type: Array,
    required: true
  },
  getMealPlanColor: {
    type: Function,
    required: true
  }
})
</script>
