<template>
  <div>
    <!-- No Room Type or Meal Plan Selected -->
    <div
      v-if="!filters.roomType || !filters.mealPlan"
      class="text-center py-16 bg-gray-50 dark:bg-slate-700/50 rounded-xl"
    >
      <div class="flex items-center justify-center gap-4 mb-4">
        <div
          class="w-16 h-16 rounded-2xl flex items-center justify-center"
          :class="
            filters.roomType
              ? 'bg-green-100 dark:bg-green-900/30'
              : 'bg-purple-100 dark:bg-purple-900/30'
          "
        >
          <span
            class="material-icons text-3xl"
            :class="
              filters.roomType
                ? 'text-green-600 dark:text-green-400'
                : 'text-purple-600 dark:text-purple-400'
            "
          >
            {{ filters.roomType ? 'check' : 'hotel' }}
          </span>
        </div>
        <span class="material-icons text-2xl text-gray-300 dark:text-slate-600">add</span>
        <div
          class="w-16 h-16 rounded-2xl flex items-center justify-center"
          :class="
            filters.mealPlan
              ? 'bg-green-100 dark:bg-green-900/30'
              : 'bg-amber-100 dark:bg-amber-900/30'
          "
        >
          <span
            class="material-icons text-3xl"
            :class="
              filters.mealPlan
                ? 'text-green-600 dark:text-green-400'
                : 'text-amber-600 dark:text-amber-400'
            "
          >
            {{ filters.mealPlan ? 'check' : 'restaurant' }}
          </span>
        </div>
      </div>
      <p class="text-gray-600 dark:text-slate-400 text-lg font-medium">
        {{ $t('planning.pricing.selectFiltersFirst') }}
      </p>
      <p class="text-sm text-gray-400 dark:text-slate-500 mt-1">
        {{ $t('planning.pricing.selectFiltersHint') }}
      </p>
    </div>

    <!-- Loading -->
    <div v-else-if="loadingPriceList" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
    </div>

    <!-- Price List Table -->
    <div
      v-else-if="periodListData.length > 0"
      class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden shadow-sm"
    >
      <!-- Selected Filters Info -->
      <div
        class="px-4 py-3 bg-gradient-to-r from-purple-50 to-amber-50 dark:from-purple-900/20 dark:to-amber-900/20 border-b border-gray-200 dark:border-slate-600 flex items-center gap-4"
      >
        <div class="flex items-center gap-2">
          <span class="material-icons text-purple-600 dark:text-purple-400">hotel</span>
          <span class="font-bold text-gray-800 dark:text-white">{{ getSelectedRoomTypeName() }}</span>
        </div>
        <span class="text-gray-300 dark:text-slate-600">+</span>
        <div class="flex items-center gap-2">
          <span class="material-icons text-amber-600 dark:text-amber-400">restaurant</span>
          <span class="font-bold text-gray-800 dark:text-white">{{ getSelectedMealPlanCode() }}</span>
        </div>
        <span class="text-gray-300 dark:text-slate-600">•</span>
        <span class="text-sm text-gray-500 dark:text-slate-400">{{ selectedMarket?.currency }}</span>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 dark:bg-slate-700">
            <tr>
              <th
                class="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-slate-300 uppercase w-[180px]"
              >
                {{ $t('planning.pricing.period') }}
              </th>
              <th
                class="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-slate-300 uppercase w-[100px]"
              >
                {{ $t('planning.pricing.pricePerNight') }}
              </th>
              <th
                class="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-slate-300 uppercase w-[80px]"
              >
                {{ $t('planning.pricing.singleSupplementShort') }}
              </th>
              <th
                class="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-slate-300 uppercase w-[80px]"
              >
                {{ $t('planning.pricing.extraAdultShort') }}
              </th>
              <th
                class="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-slate-300 uppercase w-[140px]"
              >
                {{ $t('planning.pricing.childPricesShort') }}
              </th>
              <th
                class="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-slate-300 uppercase w-[80px]"
              >
                {{ $t('planning.pricing.extraInfantShort') }}
              </th>
              <th
                class="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-slate-300 uppercase w-[60px]"
              >
                Min
              </th>
              <th
                class="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-slate-300 uppercase w-[60px]"
              >
                Rel
              </th>
              <th
                class="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-slate-300 uppercase w-[60px]"
              ></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-slate-700">
            <tr
              v-for="(period, idx) in periodListData"
              :key="idx"
              class="hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-colors"
            >
              <!-- Period -->
              <td class="px-4 py-3">
                <div class="text-sm font-semibold text-gray-800 dark:text-white">
                  {{ formatPeriodDate(period.startDate) }} -
                  {{ formatPeriodDate(period.endDate) }}
                </div>
                <div class="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                  {{ getPeriodDays(period.startDate, period.endDate) }}
                  {{ $t('planning.pricing.days') }}
                </div>
              </td>

              <!-- Price Per Night -->
              <td class="px-4 py-3 text-right">
                <span class="text-lg font-bold text-green-600 dark:text-green-400">
                  {{ period.pricePerNight?.toLocaleString() || '-' }}
                </span>
              </td>

              <!-- Single Supplement -->
              <td class="px-4 py-3 text-center">
                <span
                  v-if="period.singleSupplement"
                  class="text-purple-600 dark:text-purple-400 font-medium"
                >
                  -{{ period.singleSupplement.toLocaleString() }}
                </span>
                <span v-else class="text-gray-300 dark:text-slate-600">-</span>
              </td>

              <!-- Extra Adult -->
              <td class="px-4 py-3 text-center">
                <span
                  v-if="period.extraAdult"
                  class="text-amber-600 dark:text-amber-400 font-medium"
                >
                  +{{ period.extraAdult.toLocaleString() }}
                </span>
                <span v-else class="text-gray-300 dark:text-slate-600">-</span>
              </td>

              <!-- Child Prices -->
              <td class="px-4 py-3 text-center">
                <div
                  v-if="period.childOrderPricing?.length > 0"
                  class="flex flex-wrap gap-1 justify-center"
                >
                  <span
                    v-for="(childPrice, cIdx) in period.childOrderPricing"
                    :key="cIdx"
                    class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400"
                    :title="$t('planning.pricing.childN', { n: cIdx + 1 })"
                  >
                    {{ cIdx + 1 }}: +{{ childPrice?.toLocaleString() || 0 }}
                  </span>
                </div>
                <span
                  v-else-if="period.extraChild"
                  class="text-pink-600 dark:text-pink-400 font-medium"
                >
                  +{{ period.extraChild.toLocaleString() }}
                </span>
                <span v-else class="text-gray-300 dark:text-slate-600">-</span>
              </td>

              <!-- Extra Infant -->
              <td class="px-4 py-3 text-center">
                <span
                  v-if="period.extraInfant"
                  class="text-cyan-600 dark:text-cyan-400 font-medium"
                >
                  +{{ period.extraInfant.toLocaleString() }}
                </span>
                <span v-else class="text-gray-300 dark:text-slate-600">-</span>
              </td>

              <!-- Min Stay -->
              <td class="px-4 py-3 text-center">
                <span
                  v-if="period.minStay > 1"
                  class="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                >
                  {{ period.minStay }}
                </span>
                <span v-else class="text-gray-400 dark:text-slate-500">1</span>
              </td>

              <!-- Release Days -->
              <td class="px-4 py-3 text-center">
                <span
                  v-if="period.releaseDays > 0"
                  class="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                >
                  {{ period.releaseDays }}
                </span>
                <span v-else class="text-gray-300 dark:text-slate-600">-</span>
              </td>

              <!-- Edit Button -->
              <td class="px-4 py-3 text-center">
                <button
                  class="p-1.5 text-gray-400 hover:text-purple-600 dark:text-slate-500 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                  :title="$t('common.edit')"
                  @click="$emit('editPeriod', period)"
                >
                  <span class="material-icons text-lg">edit</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Footer -->
      <div
        class="px-4 py-3 bg-gray-50 dark:bg-slate-700/50 border-t border-gray-200 dark:border-slate-600 flex items-center justify-between text-sm text-gray-500 dark:text-slate-400"
      >
        <div class="flex items-center gap-2">
          <span class="material-icons text-lg text-purple-500">date_range</span>
          <span class="font-medium"
            >{{ periodListData.length }} {{ $t('planning.pricing.periods') }}</span
          >
        </div>
      </div>
    </div>

    <!-- No Rates -->
    <div v-else class="text-center py-16 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
      <span class="material-icons text-6xl text-gray-300 dark:text-slate-600">payments</span>
      <p class="mt-4 text-gray-500 dark:text-slate-400 text-lg">
        {{ $t('planning.pricing.noRates') }}
      </p>
      <p class="text-sm text-gray-400 dark:text-slate-500 mt-1">
        {{ $t('planning.pricing.noRatesHint') }}
      </p>
      <button class="btn-primary mt-4" @click="$emit('addRate')">
        <span class="material-icons mr-2">add</span>
        {{ $t('planning.pricing.addRate') }}
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  filters: { type: Object, required: true },
  periodListData: { type: Array, default: () => [] },
  loadingPriceList: { type: Boolean, default: false },
  selectedMarket: { type: Object, default: null },
  getSelectedRoomTypeName: { type: Function, required: true },
  getSelectedMealPlanCode: { type: Function, required: true },
  formatPeriodDate: { type: Function, required: true },
  getPeriodDays: { type: Function, required: true }
})

defineEmits(['editPeriod', 'addRate'])
</script>
