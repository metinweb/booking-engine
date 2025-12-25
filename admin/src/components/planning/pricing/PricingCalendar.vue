<template>
  <div class="pricing-calendar">
    <!-- Loading State -->
    <div v-if="loading" class="py-12 text-center">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
      <p class="mt-4 text-gray-600 dark:text-slate-400">{{ $t('common.loading') }}</p>
    </div>

    <!-- Empty State -->
    <div v-else-if="!matrix.rows.length" class="py-12 text-center bg-gray-50 dark:bg-slate-700/50 rounded-lg">
      <span class="material-icons text-5xl text-gray-300 dark:text-slate-600">calendar_today</span>
      <p class="mt-3 text-gray-500 dark:text-slate-400">{{ $t('planning.pricing.noRates') }}</p>
      <p class="text-sm text-gray-400 dark:text-slate-500 mt-1">{{ $t('planning.pricing.noRatesHint') }}</p>
    </div>

    <!-- Calendar Grid -->
    <div v-else class="overflow-auto border border-gray-200 dark:border-slate-600 rounded-lg">
      <table class="w-full min-w-[800px] divide-y divide-gray-200 dark:divide-slate-600">
        <!-- Header: Room Types -->
        <thead>
          <tr class="bg-gray-50 dark:bg-slate-700">
            <th
              class="sticky left-0 z-20 bg-gray-50 dark:bg-slate-700 px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider w-32"
              rowspan="2"
            >
              {{ $t('planning.pricing.date') }}
            </th>
            <th
              v-for="roomType in matrix.roomTypes"
              :key="roomType._id"
              :colspan="matrix.mealPlans.length"
              class="px-3 py-2 text-center text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider border-l border-gray-200 dark:border-slate-600"
            >
              {{ getRoomTypeName(roomType) }}
              <span
                v-if="roomType.status === 'inactive'"
                class="ml-1 px-1.5 py-0.5 text-[10px] font-medium rounded bg-gray-200 dark:bg-slate-600 text-gray-500 dark:text-slate-400 normal-case"
              >
                {{ $t('common.status.inactive') }}
              </span>
            </th>
          </tr>
          <!-- Sub-header: Meal Plans -->
          <tr class="bg-gray-50 dark:bg-slate-700 border-t border-gray-200 dark:border-slate-600">
            <template v-for="roomType in matrix.roomTypes" :key="`mp-${roomType._id}`">
              <th
                v-for="mealPlan in matrix.mealPlans"
                :key="`${roomType._id}-${mealPlan._id}`"
                class="px-2 py-2 text-center text-xs font-medium text-gray-600 dark:text-slate-400 border-l border-gray-200 dark:border-slate-600"
              >
                <span class="px-2 py-1 rounded bg-gray-100 dark:bg-slate-600 text-gray-700 dark:text-slate-300">
                  {{ mealPlan.code }}
                </span>
              </th>
            </template>
          </tr>
        </thead>

        <!-- Body: Date Rows -->
        <tbody class="bg-white dark:bg-slate-800 divide-y divide-gray-100 dark:divide-slate-700">
          <tr
            v-for="row in matrix.rows"
            :key="row.dateKey"
            class="hover:bg-gray-50 dark:hover:bg-slate-700/50"
            :class="{ 'bg-amber-50 dark:bg-amber-900/10': row.isWeekend }"
          >
            <!-- Date Cell -->
            <td class="sticky left-0 z-10 bg-white dark:bg-slate-800 px-4 py-2 text-sm border-r border-gray-100 dark:border-slate-700 align-middle"
                :class="{ 'bg-amber-50 dark:bg-amber-900/10': row.isWeekend }">
              <div class="font-medium text-gray-800 dark:text-white">{{ row.dateFormatted }}</div>
              <div class="text-xs text-gray-500 dark:text-slate-500">{{ row.weekday }}</div>
              <div v-if="row.season" class="mt-1">
                <span
                  class="inline-block px-1.5 py-0.5 text-xs rounded"
                  :style="{ backgroundColor: row.season.color + '20', color: row.season.color }"
                >
                  {{ getSeasonName(row.season) }}
                </span>
              </div>
            </td>

            <!-- Rate Cells -->
            <template v-for="roomType in matrix.roomTypes" :key="`row-${row.dateKey}-${roomType._id}`">
              <td
                v-for="mealPlan in matrix.mealPlans"
                :key="`${row.dateKey}-${roomType._id}-${mealPlan._id}`"
                class="px-2 py-2 text-center align-middle border-l border-gray-100 dark:border-slate-700 cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/20"
                @click="handleCellClick(row.date, roomType, mealPlan)"
              >
                <PriceCell
                  :cell="getCell(row.dateKey, roomType._id, mealPlan._id)"
                  :mode="displayMode"
                  :currency="currency"
                />
              </td>
            </template>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Legend -->
    <div class="mt-4 flex flex-wrap items-center gap-4 text-xs text-gray-600 dark:text-slate-400">
      <div class="flex items-center gap-2">
        <span class="w-4 h-4 rounded bg-green-500"></span>
        <span>{{ $t('planning.pricing.available') }}</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="w-4 h-4 rounded bg-red-500"></span>
        <span>{{ $t('planning.pricing.stopSale') }}</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="w-4 h-4 rounded bg-amber-500"></span>
        <span>{{ $t('planning.pricing.lowAllotment') }}</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="w-4 h-4 rounded bg-gray-300 dark:bg-slate-600"></span>
        <span>{{ $t('planning.pricing.noRate') }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, h } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  matrix: {
    type: Object,
    default: () => ({
      rows: [],
      roomTypes: [],
      mealPlans: [],
      cells: {}
    })
  },
  displayMode: {
    type: String,
    default: 'price', // price, allotment, stopSale
    validator: (v) => ['price', 'allotment', 'stopSale'].includes(v)
  },
  currency: {
    type: String,
    default: 'EUR'
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['cell-click'])

const { locale } = useI18n()

const getRoomTypeName = (roomType) => {
  return roomType.name?.[locale.value] || roomType.name?.tr || roomType.name?.en || roomType.code
}

const getSeasonName = (season) => {
  return season.name?.[locale.value] || season.name?.tr || season.name?.en || season.code
}

const getCell = (dateKey, roomTypeId, mealPlanId) => {
  const key = `${dateKey}-${roomTypeId}-${mealPlanId}`
  return props.matrix.cells?.[key] || null
}

const handleCellClick = (date, roomType, mealPlan) => {
  emit('cell-click', { date, roomType, mealPlan })
}

// PriceCell Component (inline)
const PriceCell = {
  props: {
    cell: { type: Object, default: null },
    mode: { type: String, default: 'price' },
    currency: { type: String, default: 'EUR' }
  },
  setup(props) {
    const getContent = () => {
      if (!props.cell) {
        return { text: '-', class: 'text-gray-300 dark:text-slate-600' }
      }

      if (props.cell.stopSale) {
        return {
          icon: 'block',
          class: 'text-red-500',
          bg: 'bg-red-100 dark:bg-red-900/30'
        }
      }

      switch (props.mode) {
        case 'allotment':
          const allotment = props.cell.allotment ?? 0
          return {
            text: allotment.toString(),
            class: allotment < 3 ? 'text-amber-600 font-semibold' : 'text-gray-700 dark:text-slate-300'
          }

        case 'stopSale':
          return {
            icon: props.cell.stopSale ? 'block' : 'check_circle',
            class: props.cell.stopSale ? 'text-red-500' : 'text-green-500'
          }

        case 'price':
        default:
          const price = props.cell.pricePerNight
          if (!price && price !== 0) {
            return { text: '-', class: 'text-gray-300 dark:text-slate-600' }
          }
          return {
            text: `${price}`,
            subtext: props.currency,
            class: 'text-purple-600 dark:text-purple-400 font-semibold'
          }
      }
    }

    return () => {
      const content = getContent()

      if (content.icon) {
        return h('div', {
          class: ['flex items-center justify-center rounded p-1', content.bg || '']
        }, [
          h('span', { class: ['material-icons text-sm', content.class] }, content.icon)
        ])
      }

      return h('div', { class: 'flex flex-col items-center justify-center' }, [
        h('span', { class: ['text-sm', content.class] }, content.text),
        content.subtext ? h('span', { class: 'text-xs text-gray-400 dark:text-slate-500' }, content.subtext) : null
      ])
    }
  }
}
</script>

<style scoped>
.pricing-calendar table {
  border-collapse: separate;
  border-spacing: 0;
}

.pricing-calendar th,
.pricing-calendar td {
  white-space: nowrap;
}
</style>
