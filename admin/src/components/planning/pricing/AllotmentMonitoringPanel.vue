<template>
  <div
    v-if="stats.totalCells > 0"
    class="mb-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800"
  >
    <div class="flex items-center justify-between mb-3">
      <div class="flex items-center gap-2">
        <span class="material-icons text-blue-600">monitoring</span>
        <h5 class="font-medium text-gray-700 dark:text-gray-300">{{ $t('planning.pricing.allotmentMonitoring') }}</h5>
      </div>
      <button
        @click="$emit('toggle-details')"
        class="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
      >
        {{ showDetails ? $t('common.hide') : $t('common.showDetails') }}
        <span class="material-icons text-sm">{{ showDetails ? 'expand_less' : 'expand_more' }}</span>
      </button>
    </div>

    <!-- Summary Stats -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <!-- Critical (0) -->
      <div
        class="p-3 rounded-lg cursor-pointer transition-all hover:scale-105"
        :class="stats.critical > 0 ? 'bg-red-100 dark:bg-red-900/30' : 'bg-gray-100 dark:bg-slate-700'"
        @click="$emit('highlight-level', 'critical')"
      >
        <div class="flex items-center gap-2">
          <div
            class="w-8 h-8 rounded-full flex items-center justify-center"
            :class="stats.critical > 0 ? 'bg-red-500 text-white' : 'bg-gray-300 dark:bg-slate-600 text-gray-500'"
          >
            <span class="material-icons text-lg">error</span>
          </div>
          <div>
            <div class="text-lg font-bold" :class="stats.critical > 0 ? 'text-red-600' : 'text-gray-500'">
              {{ stats.critical }}
            </div>
            <div class="text-xs text-gray-500">{{ $t('planning.pricing.noStock') }}</div>
          </div>
        </div>
      </div>

      <!-- Low (1-3) -->
      <div
        class="p-3 rounded-lg cursor-pointer transition-all hover:scale-105"
        :class="stats.low > 0 ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-gray-100 dark:bg-slate-700'"
        @click="$emit('highlight-level', 'low')"
      >
        <div class="flex items-center gap-2">
          <div
            class="w-8 h-8 rounded-full flex items-center justify-center"
            :class="stats.low > 0 ? 'bg-amber-500 text-white' : 'bg-gray-300 dark:bg-slate-600 text-gray-500'"
          >
            <span class="material-icons text-lg">warning</span>
          </div>
          <div>
            <div class="text-lg font-bold" :class="stats.low > 0 ? 'text-amber-600' : 'text-gray-500'">
              {{ stats.low }}
            </div>
            <div class="text-xs text-gray-500">{{ $t('planning.pricing.lowStock') }} (1-3)</div>
          </div>
        </div>
      </div>

      <!-- Normal (4+) -->
      <div class="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center">
            <span class="material-icons text-lg">check_circle</span>
          </div>
          <div>
            <div class="text-lg font-bold text-green-600">{{ stats.normal }}</div>
            <div class="text-xs text-gray-500">{{ $t('planning.pricing.normalStock') }} (4+)</div>
          </div>
        </div>
      </div>

      <!-- Stop Sale -->
      <div
        class="p-3 rounded-lg cursor-pointer transition-all hover:scale-105"
        :class="stats.stopSale > 0 ? 'bg-purple-100 dark:bg-purple-900/30' : 'bg-gray-100 dark:bg-slate-700'"
        @click="$emit('highlight-level', 'stopSale')"
      >
        <div class="flex items-center gap-2">
          <div
            class="w-8 h-8 rounded-full flex items-center justify-center"
            :class="stats.stopSale > 0 ? 'bg-purple-500 text-white' : 'bg-gray-300 dark:bg-slate-600 text-gray-500'"
          >
            <span class="material-icons text-lg">block</span>
          </div>
          <div>
            <div class="text-lg font-bold" :class="stats.stopSale > 0 ? 'text-purple-600' : 'text-gray-500'">
              {{ stats.stopSale }}
            </div>
            <div class="text-xs text-gray-500">Stop Sale</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Detailed Breakdown -->
    <Transition name="slide-down">
      <div v-if="showDetails" class="mt-4 space-y-2">
        <div class="text-xs font-medium text-gray-500 mb-2">{{ $t('planning.pricing.detailedBreakdown') }}</div>

        <!-- No issues message -->
        <div v-if="details.length === 0" class="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
          <span class="material-icons text-green-500 text-lg align-middle mr-1">check_circle</span>
          <span class="text-sm text-green-700 dark:text-green-300">Tüm odalar normal stokta</span>
        </div>

        <!-- Details list -->
        <div
          v-for="detail in details"
          :key="detail.key"
          class="flex items-center justify-between p-2 bg-white dark:bg-slate-800 rounded-lg text-sm"
        >
          <div class="flex items-center gap-2">
            <span class="font-bold text-purple-600">{{ detail.roomCode }}</span>
            <span :class="getMealPlanBadgeClass(detail.mealPlanCode)">{{ detail.mealPlanCode }}</span>
          </div>
          <div class="flex items-center gap-3">
            <span v-if="detail.critical > 0" class="text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded-full">
              {{ detail.critical }} {{ $t('planning.pricing.noStock') }}
            </span>
            <span v-if="detail.low > 0" class="text-xs px-2 py-0.5 bg-amber-100 text-amber-600 rounded-full">
              {{ detail.low }} {{ $t('planning.pricing.lowStock') }}
            </span>
            <span v-if="detail.stopSale > 0" class="text-xs px-2 py-0.5 bg-purple-100 text-purple-600 rounded-full">
              {{ detail.stopSale }} Stop
            </span>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
defineProps({
  stats: {
    type: Object,
    required: true,
    default: () => ({ critical: 0, low: 0, normal: 0, stopSale: 0, totalCells: 0 })
  },
  details: {
    type: Array,
    default: () => []
  },
  showDetails: {
    type: Boolean,
    default: false
  }
})

defineEmits(['toggle-details', 'highlight-level'])

const getMealPlanBadgeClass = (code) => {
  const codeUpper = code?.toUpperCase() || ''
  const classes = {
    'RO': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    'BB': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
    'HB': 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
    'FB': 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    'AI': 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    'UAI': 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
  }
  return `px-2 py-0.5 rounded text-xs font-medium ${classes[codeUpper] || classes['RO']}`
}
</script>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  max-height: 0;
  overflow: hidden;
}

.slide-down-enter-to,
.slide-down-leave-from {
  max-height: 500px;
}
</style>
