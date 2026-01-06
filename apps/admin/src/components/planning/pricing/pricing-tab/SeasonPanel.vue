<template>
  <Transition name="slide">
    <div
      v-if="showSeasonPanel"
      class="mb-6 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800"
    >
      <div class="flex items-center justify-between mb-4">
        <h4 class="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
          <span class="material-icons text-amber-600">date_range</span>
          {{ $t('planning.pricing.seasonManager') }}
          <span
            v-if="selectedMarket"
            class="text-sm font-normal text-gray-500 dark:text-slate-400"
          >
            ({{ selectedMarket.code }})
          </span>
        </h4>
        <button
          v-if="selectedMarket"
          class="text-sm text-purple-600 hover:text-purple-800 flex items-center gap-1 font-medium"
          @click="$emit('addSeason')"
        >
          <span class="material-icons text-sm">add_circle</span>
          {{ $t('planning.pricing.addSeason') }}
        </button>
      </div>

      <div v-if="loadingSeasons" class="flex justify-center py-6">
        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
      </div>

      <div v-else-if="seasons.length > 0" class="space-y-4">
        <!-- Season Cards -->
        <div class="flex flex-wrap gap-3">
          <div
            v-for="season in seasons"
            :key="season._id"
            class="group relative rounded-xl p-3 min-w-[140px] text-white shadow-lg cursor-pointer hover:scale-105 transition-transform"
            :style="{ backgroundColor: season.color || '#6366f1' }"
            @click="$emit('editSeason', season)"
          >
            <div class="flex items-start justify-between">
              <div>
                <div class="font-bold text-sm">{{ season.code }}</div>
                <div class="text-xs opacity-90 mt-0.5">{{ getSeasonName(season) }}</div>
              </div>
              <button
                class="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/20 rounded"
                @click.stop="$emit('deleteSeason', season)"
              >
                <span class="material-icons text-sm">close</span>
              </button>
            </div>
            <div class="text-xs mt-2 opacity-75 flex items-center gap-1">
              <span class="material-icons text-xs">event</span>
              {{ formatSeasonDates(season) }}
            </div>
          </div>
        </div>

        <!-- Season Timeline Visualization -->
        <div
          class="mt-4 bg-white dark:bg-slate-800 rounded-xl p-4 border border-amber-200 dark:border-amber-700"
        >
          <div class="flex items-center gap-2 mb-3">
            <span class="material-icons text-amber-600 text-lg">timeline</span>
            <h5 class="font-medium text-gray-700 dark:text-gray-300">
              {{ $t('planning.pricing.seasonTimeline') }}
            </h5>
            <!-- Year Navigation -->
            <div class="ml-auto flex items-center gap-2">
              <button
                class="p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-700"
                @click="$emit('update:timelineYear', timelineYear - 1)"
              >
                <span class="material-icons text-sm">chevron_left</span>
              </button>
              <span
                class="text-sm font-bold text-gray-700 dark:text-gray-300 min-w-[50px] text-center"
                >{{ timelineYear }}</span
              >
              <button
                class="p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-700"
                @click="$emit('update:timelineYear', timelineYear + 1)"
              >
                <span class="material-icons text-sm">chevron_right</span>
              </button>
            </div>
          </div>

          <!-- Month Headers -->
          <div class="flex mb-1">
            <div class="flex-1 flex">
              <div
                v-for="month in 12"
                :key="month"
                class="flex-1 text-center text-[10px] font-medium text-gray-500 dark:text-gray-400 border-r border-gray-200 dark:border-slate-600 last:border-r-0"
              >
                {{ getMonthShortName(month) }}
              </div>
            </div>
          </div>

          <!-- Single Timeline with all seasons -->
          <div class="relative h-10 bg-gray-100 dark:bg-slate-700 rounded-lg overflow-hidden">
            <!-- Month grid lines -->
            <div class="absolute inset-0 flex">
              <div
                v-for="month in 12"
                :key="'grid-' + month"
                class="flex-1 border-r border-gray-200/50 dark:border-slate-600/50 last:border-r-0"
              ></div>
            </div>

            <!-- Season bars -->
            <div
              v-for="(range, idx) in allSeasonRanges"
              :key="idx"
              class="absolute h-full cursor-pointer hover:brightness-110 transition-all flex items-center justify-center overflow-hidden"
              :style="{
                left: range.left + '%',
                width: range.width + '%',
                backgroundColor: range.color
              }"
              :title="`${range.season.code}: ${range.dateLabel}`"
              @click="$emit('editSeason', range.season)"
            >
              <!-- Season name on bar -->
              <span class="text-white font-bold text-xs px-1 truncate drop-shadow-sm">
                {{ range.season.code }}
              </span>
            </div>

            <!-- Today marker -->
            <div
              v-if="todayPosition >= 0 && todayPosition <= 100"
              class="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
              :style="{ left: todayPosition + '%' }"
            >
              <div
                class="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-red-500 rounded-full"
              ></div>
            </div>
          </div>

          <!-- Legend -->
          <div class="mt-3 flex items-center justify-between text-xs">
            <div class="flex items-center gap-3 flex-wrap">
              <span
                v-for="season in seasons"
                :key="'legend-' + season._id"
                class="flex items-center gap-1 cursor-pointer hover:opacity-80"
                @click="$emit('editSeason', season)"
              >
                <span
                  class="w-3 h-3 rounded"
                  :style="{ backgroundColor: season.color || '#6366f1' }"
                ></span>
                <span class="font-medium" :style="{ color: season.color || '#6366f1' }">{{
                  season.code
                }}</span>
                <span class="text-gray-400">{{ getSeasonName(season) }}</span>
              </span>
            </div>
            <div class="flex items-center gap-2 text-gray-500">
              <span class="w-2 h-2 bg-red-500 rounded-full"></span>
              <span>{{ $t('planning.pricing.today') }}</span>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="!selectedMarket" class="text-center py-6 text-gray-500 dark:text-slate-400">
        <span class="material-icons text-4xl opacity-30">public</span>
        <p class="mt-2 text-sm">{{ $t('planning.pricing.selectMarketFirst') }}</p>
      </div>

      <div v-else class="text-center py-6 text-gray-500 dark:text-slate-400">
        <span class="material-icons text-4xl opacity-30">event_busy</span>
        <p class="mt-2 text-sm">{{ $t('planning.pricing.noSeasons') }}</p>
      </div>
    </div>
  </Transition>
</template>

<script setup>
defineProps({
  showSeasonPanel: { type: Boolean, default: false },
  selectedMarket: { type: Object, default: null },
  seasons: { type: Array, default: () => [] },
  loadingSeasons: { type: Boolean, default: false },
  timelineYear: { type: Number, default: () => new Date().getFullYear() },
  allSeasonRanges: { type: Array, default: () => [] },
  todayPosition: { type: Number, default: -1 },
  getSeasonName: { type: Function, required: true },
  formatSeasonDates: { type: Function, required: true },
  getMonthShortName: { type: Function, required: true }
})

defineEmits(['addSeason', 'editSeason', 'deleteSeason', 'update:timelineYear'])
</script>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
