<template>
  <div class="pricing-tab">
    <!-- Top Bar: Market Selector & Actions -->
    <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
      <!-- Left: Title & Market -->
      <div class="flex items-center gap-4">
        <div>
          <h3 class="text-xl font-bold text-gray-800 dark:text-white">{{ $t('planning.pricing.title') }}</h3>
          <p class="text-sm text-gray-500 dark:text-slate-400">{{ $t('planning.pricing.description') }}</p>
        </div>

        <!-- Market Selector Tabs -->
        <div v-if="markets.length > 0" class="flex bg-gray-100 dark:bg-slate-700 rounded-xl p-1 ml-4">
          <button
            v-for="market in markets"
            :key="market._id"
            @click="selectedMarket = market"
            class="px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200"
            :class="selectedMarket?._id === market._id
              ? 'bg-white dark:bg-slate-600 text-purple-600 dark:text-purple-400 shadow-sm'
              : 'text-gray-600 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200'"
          >
            <div class="flex items-center gap-2">
              <span class="font-bold">{{ market.currency }}</span>
              <span class="text-xs opacity-75">{{ market.code }}</span>
            </div>
          </button>
        </div>
      </div>

      <!-- Right: Actions -->
      <div class="flex items-center gap-3">
        <!-- View Toggle -->
        <div class="flex bg-gray-100 dark:bg-slate-700 rounded-lg p-1">
          <button
            @click="viewMode = 'calendar'"
            class="px-3 py-2 rounded-md transition-colors flex items-center gap-1.5"
            :class="viewMode === 'calendar' ? 'bg-white dark:bg-slate-600 text-purple-600 shadow-sm' : 'text-gray-500'"
            :title="$t('planning.pricing.calendarView')"
          >
            <span class="material-icons text-lg">calendar_view_month</span>
            <span class="text-xs font-medium hidden sm:inline">{{ $t('planning.pricing.calendarView') }}</span>
          </button>
          <button
            @click="viewMode = 'period'"
            class="px-3 py-2 rounded-md transition-colors flex items-center gap-1.5"
            :class="viewMode === 'period' ? 'bg-white dark:bg-slate-600 text-purple-600 shadow-sm' : 'text-gray-500'"
            :title="$t('planning.pricing.periodView')"
          >
            <span class="material-icons text-lg">date_range</span>
            <span class="text-xs font-medium hidden sm:inline">{{ $t('planning.pricing.periodView') }}</span>
          </button>
        </div>

        <!-- Season Manager Button -->
        <button
          @click="showSeasonPanel = !showSeasonPanel"
          class="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
          :class="showSeasonPanel
            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
            : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400 hover:bg-gray-200'"
        >
          <span class="material-icons text-lg">wb_sunny</span>
          <span class="hidden sm:inline">{{ $t('planning.pricing.seasons') }}</span>
        </button>

        <!-- Price Query Button -->
        <button
          @click="showPriceQueryModal = true"
          class="flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
          :title="$t('planning.pricing.priceQuery') || 'Fiyat Sorgula'"
        >
          <span class="material-icons text-lg">calculate</span>
          <span class="hidden sm:inline">{{ $t('planning.pricing.priceQuery') || 'Sorgula' }}</span>
        </button>

        <!-- Contract Import Button -->
        <button
          @click="showContractImport = true"
          class="flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
          :title="$t('planning.pricing.contractImport.button')"
        >
          <span class="material-icons text-lg">description</span>
          <span class="hidden sm:inline">{{ $t('planning.pricing.contractImport.button') }}</span>
        </button>

        <!-- Add Rate Button -->
        <button @click="openBulkModal" class="btn-primary flex items-center gap-2">
          <span class="material-icons text-lg">add</span>
          <span class="hidden sm:inline">{{ $t('planning.pricing.addRate') }}</span>
        </button>
      </div>
    </div>

    <!-- AI Pricing Assistant Panel -->
    <div class="mb-6">
      <AIPricingAssistant
        :hotel-id="hotel._id"
        :current-month="currentMonth"
        :selected-cells="bulkEditCells"
        :room-types="filteredRoomTypes"
        :meal-plans="filteredMealPlans"
        @executed="handleAIExecuted"
        @clear-selection="clearCalendarSelection"
      />
    </div>

    <!-- Season Panel (Collapsible) -->
    <Transition name="slide">
      <div v-if="showSeasonPanel" class="mb-6 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl p-4 border border-amber-200 dark:border-amber-800">
        <div class="flex items-center justify-between mb-4">
          <h4 class="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
            <span class="material-icons text-amber-600">date_range</span>
            {{ $t('planning.pricing.seasonManager') }}
            <span v-if="selectedMarket" class="text-sm font-normal text-gray-500 dark:text-slate-400">
              ({{ selectedMarket.code }})
            </span>
          </h4>
          <button
            v-if="selectedMarket"
            @click="showSeasonForm = true; editingSeason = null"
            class="text-sm text-purple-600 hover:text-purple-800 flex items-center gap-1 font-medium"
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
              @click="editSeason(season)"
            >
              <div class="flex items-start justify-between">
                <div>
                  <div class="font-bold text-sm">{{ season.code }}</div>
                  <div class="text-xs opacity-90 mt-0.5">{{ getSeasonName(season) }}</div>
                </div>
                <button
                  @click.stop="confirmDeleteSeason(season)"
                  class="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/20 rounded"
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
          <div class="mt-4 bg-white dark:bg-slate-800 rounded-xl p-4 border border-amber-200 dark:border-amber-700">
            <div class="flex items-center gap-2 mb-3">
              <span class="material-icons text-amber-600 text-lg">timeline</span>
              <h5 class="font-medium text-gray-700 dark:text-gray-300">{{ $t('planning.pricing.seasonTimeline') }}</h5>
              <!-- Year Navigation -->
              <div class="ml-auto flex items-center gap-2">
                <button
                  @click="timelineYear--"
                  class="p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-700"
                >
                  <span class="material-icons text-sm">chevron_left</span>
                </button>
                <span class="text-sm font-bold text-gray-700 dark:text-gray-300 min-w-[50px] text-center">{{ timelineYear }}</span>
                <button
                  @click="timelineYear++"
                  class="p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-700"
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
                <div v-for="month in 12" :key="'grid-'+month" class="flex-1 border-r border-gray-200/50 dark:border-slate-600/50 last:border-r-0"></div>
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
                @click="editSeason(range.season)"
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
                <div class="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-red-500 rounded-full"></div>
              </div>
            </div>

            <!-- Legend -->
            <div class="mt-3 flex items-center justify-between text-xs">
              <div class="flex items-center gap-3 flex-wrap">
                <span
                  v-for="season in seasons"
                  :key="'legend-' + season._id"
                  class="flex items-center gap-1 cursor-pointer hover:opacity-80"
                  @click="editSeason(season)"
                >
                  <span class="w-3 h-3 rounded" :style="{ backgroundColor: season.color || '#6366f1' }"></span>
                  <span class="font-medium" :style="{ color: season.color || '#6366f1' }">{{ season.code }}</span>
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

    <!-- Beautiful Filters (for period view) -->
    <div v-if="viewMode === 'period'" class="mb-6">
      <div class="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800/50 dark:to-slate-700/50 rounded-2xl p-5 border border-gray-200/50 dark:border-slate-600/50">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Room Type Filter (Required) -->
          <div>
            <div class="flex items-center gap-2 mb-3">
              <div class="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <span class="material-icons text-purple-600 dark:text-purple-400 text-lg">hotel</span>
              </div>
              <span class="font-semibold text-gray-700 dark:text-slate-300">{{ $t('planning.pricing.selectRoomType') }}</span>
            </div>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="rt in filteredRoomTypes"
                :key="rt._id"
                @click="filters.roomType = rt._id"
                class="px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2"
                :class="filters.roomType === rt._id
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 scale-105'
                  : 'bg-white dark:bg-slate-700 text-gray-600 dark:text-slate-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 border border-gray-200 dark:border-slate-600'"
              >
                <span class="font-bold">{{ rt.code }}</span>
                <span class="text-xs opacity-75">{{ getRoomTypeName(rt) }}</span>
              </button>
            </div>
          </div>

          <!-- Meal Plan Filter (Required) -->
          <div>
            <div class="flex items-center gap-2 mb-3">
              <div class="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <span class="material-icons text-amber-600 dark:text-amber-400 text-lg">restaurant</span>
              </div>
              <span class="font-semibold text-gray-700 dark:text-slate-300">{{ $t('planning.pricing.selectMealPlan') }}</span>
            </div>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="mp in filteredMealPlans"
                :key="mp._id"
                @click="filters.mealPlan = mp._id"
                class="px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
                :class="filters.mealPlan === mp._id
                  ? getMealPlanActiveColor(mp.code) + ' text-white shadow-lg scale-105'
                  : 'bg-white dark:bg-slate-700 text-gray-600 dark:text-slate-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 border border-gray-200 dark:border-slate-600'"
              >
                {{ mp.code }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content Area -->
    <div class="content-area">
      <!-- Calendar View -->
      <template v-if="viewMode === 'calendar'">
        <MonthlyCalendar
          ref="calendarRef"
          :key="`calendar-${calendarKey}`"
          :hotel-id="hotel._id"
          :room-types="filteredRoomTypes"
          :meal-plans="filteredMealPlans"
          :market="selectedMarket"
          :rates="rates"
          :overrides="overrides"
          :loading="loadingRates"
          :initial-month="currentMonth"
          :current-seasons="currentMonthSeasons"
          :child-age-groups="hotel.childAgeGroups || []"
          @refresh="handleCalendarRefresh"
          @bulk-edit="openBulkEditModal"
          @selection-change="handleSelectionChange"
        />
      </template>

      <!-- Period View - Period Based Price List -->
      <template v-else-if="viewMode === 'period'">
        <!-- No Room Type or Meal Plan Selected -->
        <div v-if="!filters.roomType || !filters.mealPlan" class="text-center py-16 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
          <div class="flex items-center justify-center gap-4 mb-4">
            <div class="w-16 h-16 rounded-2xl flex items-center justify-center" :class="filters.roomType ? 'bg-green-100 dark:bg-green-900/30' : 'bg-purple-100 dark:bg-purple-900/30'">
              <span class="material-icons text-3xl" :class="filters.roomType ? 'text-green-600 dark:text-green-400' : 'text-purple-600 dark:text-purple-400'">
                {{ filters.roomType ? 'check' : 'hotel' }}
              </span>
            </div>
            <span class="material-icons text-2xl text-gray-300 dark:text-slate-600">add</span>
            <div class="w-16 h-16 rounded-2xl flex items-center justify-center" :class="filters.mealPlan ? 'bg-green-100 dark:bg-green-900/30' : 'bg-amber-100 dark:bg-amber-900/30'">
              <span class="material-icons text-3xl" :class="filters.mealPlan ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'">
                {{ filters.mealPlan ? 'check' : 'restaurant' }}
              </span>
            </div>
          </div>
          <p class="text-gray-600 dark:text-slate-400 text-lg font-medium">{{ $t('planning.pricing.selectFiltersFirst') }}</p>
          <p class="text-sm text-gray-400 dark:text-slate-500 mt-1">{{ $t('planning.pricing.selectFiltersHint') }}</p>
        </div>

        <!-- Loading -->
        <div v-else-if="loadingPriceList" class="flex justify-center py-12">
          <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
        </div>

        <!-- Price List Table -->
        <div v-else-if="periodListData.length > 0" class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden shadow-sm">
          <!-- Selected Filters Info -->
          <div class="px-4 py-3 bg-gradient-to-r from-purple-50 to-amber-50 dark:from-purple-900/20 dark:to-amber-900/20 border-b border-gray-200 dark:border-slate-600 flex items-center gap-4">
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
                  <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-slate-300 uppercase w-[180px]">
                    {{ $t('planning.pricing.period') }}
                  </th>
                  <th class="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-slate-300 uppercase w-[100px]">
                    {{ $t('planning.pricing.pricePerNight') }}
                  </th>
                  <th class="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-slate-300 uppercase w-[80px]">
                    {{ $t('planning.pricing.singleSupplementShort') }}
                  </th>
                  <th class="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-slate-300 uppercase w-[80px]">
                    {{ $t('planning.pricing.extraAdultShort') }}
                  </th>
                  <th class="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-slate-300 uppercase w-[140px]">
                    {{ $t('planning.pricing.childPricesShort') }}
                  </th>
                  <th class="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-slate-300 uppercase w-[80px]">
                    {{ $t('planning.pricing.extraInfantShort') }}
                  </th>
                  <th class="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-slate-300 uppercase w-[60px]">
                    Min
                  </th>
                  <th class="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-slate-300 uppercase w-[60px]">
                    Rel
                  </th>
                  <th class="px-4 py-3 text-center text-xs font-semibold text-gray-600 dark:text-slate-300 uppercase w-[60px]">
                  </th>
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
                      {{ formatPeriodDate(period.startDate) }} - {{ formatPeriodDate(period.endDate) }}
                    </div>
                    <div class="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                      {{ getPeriodDays(period.startDate, period.endDate) }} {{ $t('planning.pricing.days') }}
                    </div>
                  </td>

                  <!-- Price Per Night -->
                  <td class="px-4 py-3 text-right">
                    <span class="text-lg font-bold text-green-600 dark:text-green-400">
                      {{ period.pricePerNight?.toLocaleString() || '-' }}
                    </span>
                  </td>

                  <!-- Single Supplement (Tek Kişi İndirimi) -->
                  <td class="px-4 py-3 text-center">
                    <span v-if="period.singleSupplement" class="text-purple-600 dark:text-purple-400 font-medium">
                      -{{ period.singleSupplement.toLocaleString() }}
                    </span>
                    <span v-else class="text-gray-300 dark:text-slate-600">-</span>
                  </td>

                  <!-- Extra Adult -->
                  <td class="px-4 py-3 text-center">
                    <span v-if="period.extraAdult" class="text-amber-600 dark:text-amber-400 font-medium">
                      +{{ period.extraAdult.toLocaleString() }}
                    </span>
                    <span v-else class="text-gray-300 dark:text-slate-600">-</span>
                  </td>

                  <!-- Child Prices (All children from childOrderPricing) -->
                  <td class="px-4 py-3 text-center">
                    <div v-if="period.childOrderPricing?.length > 0" class="flex flex-wrap gap-1 justify-center">
                      <span
                        v-for="(childPrice, cIdx) in period.childOrderPricing"
                        :key="cIdx"
                        class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400"
                        :title="$t('planning.pricing.childN', { n: cIdx + 1 })"
                      >
                        {{ cIdx + 1 }}: +{{ childPrice?.toLocaleString() || 0 }}
                      </span>
                    </div>
                    <span v-else-if="period.extraChild" class="text-pink-600 dark:text-pink-400 font-medium">
                      +{{ period.extraChild.toLocaleString() }}
                    </span>
                    <span v-else class="text-gray-300 dark:text-slate-600">-</span>
                  </td>

                  <!-- Extra Infant -->
                  <td class="px-4 py-3 text-center">
                    <span v-if="period.extraInfant" class="text-cyan-600 dark:text-cyan-400 font-medium">
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
                      @click="openPeriodEdit(period)"
                      class="p-1.5 text-gray-400 hover:text-purple-600 dark:text-slate-500 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                      :title="$t('common.edit')"
                    >
                      <span class="material-icons text-lg">edit</span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Footer -->
          <div class="px-4 py-3 bg-gray-50 dark:bg-slate-700/50 border-t border-gray-200 dark:border-slate-600 flex items-center justify-between text-sm text-gray-500 dark:text-slate-400">
            <div class="flex items-center gap-2">
              <span class="material-icons text-lg text-purple-500">date_range</span>
              <span class="font-medium">{{ periodListData.length }} {{ $t('planning.pricing.periods') }}</span>
            </div>
          </div>
        </div>

        <!-- No Rates -->
        <div v-else class="text-center py-16 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
          <span class="material-icons text-6xl text-gray-300 dark:text-slate-600">payments</span>
          <p class="mt-4 text-gray-500 dark:text-slate-400 text-lg">{{ $t('planning.pricing.noRates') }}</p>
          <p class="text-sm text-gray-400 dark:text-slate-500 mt-1">{{ $t('planning.pricing.noRatesHint') }}</p>
          <button @click="openBulkModal" class="btn-primary mt-4">
            <span class="material-icons mr-2">add</span>
            {{ $t('planning.pricing.addRate') }}
          </button>
        </div>
      </template>
    </div>

    <!-- Season Form Modal -->
    <Modal v-model="showSeasonForm" :title="editingSeason ? $t('planning.pricing.editSeason') : $t('planning.pricing.addSeason')" size="xl" :close-on-overlay="false" content-class="!h-[70vh]">
      <SeasonForm
        :hotel="hotel"
        :season="editingSeason"
        :market="selectedMarket"
        :room-types="filteredRoomTypes"
        :meal-plans="filteredMealPlans"
        :existing-seasons="seasons"
        @saved="handleSeasonSaved"
        @cancel="showSeasonForm = false"
      />
    </Modal>

    <!-- Rate Form Modal -->
    <Modal v-model="showRateModal" :title="editingRate ? $t('planning.pricing.editRate') : $t('planning.pricing.addRate')" size="xl" :close-on-overlay="false">
      <RateForm
        :hotel="hotel"
        :rate="editingRate"
        :room-types="filteredRoomTypes"
        :meal-plans="filteredMealPlans"
        :market="selectedMarket"
        :seasons="seasons"
        :selected-cells="bulkEditCells"
        @saved="handleRateSaved"
        @cancel="showRateModal = false"
      />
    </Modal>

    <!-- Delete Confirmation Modal -->
    <Modal v-model="showDeleteModal" :title="$t('common.delete')" size="sm">
      <div class="text-center py-4">
        <span class="material-icons text-5xl text-red-500 mb-4">warning</span>
        <p class="text-gray-600 dark:text-slate-400">{{ $t('common.confirm') }}?</p>
      </div>
      <template #footer>
        <button @click="showDeleteModal = false" class="btn-secondary">{{ $t('common.no') }}</button>
        <button @click="executeDelete" class="btn-danger" :disabled="deleting">
          {{ deleting ? $t('common.loading') : $t('common.yes') }}
        </button>
      </template>
    </Modal>

    <!-- Bulk Edit Modal -->
    <BulkEditModal
      v-model="showBulkEditModal"
      :hotel-id="hotel._id"
      :selected-cells="bulkEditCells"
      :room-types="filteredRoomTypes"
      :meal-plans="filteredMealPlans"
      :rates="rates"
      :market="selectedMarket"
      :child-age-groups="hotel.childAgeGroups || []"
      @saved="handleBulkEditSaved"
    />

    <!-- Price Query Modal -->
    <PriceQueryModal
      v-model="showPriceQueryModal"
      :hotel-id="hotel._id"
      :hotel-name="hotel.name?.tr || hotel.name?.en || hotel.code"
      :room-types="filteredRoomTypes"
      :meal-plans="filteredMealPlans"
      :markets="markets"
      :initial-month="currentMonth"
    />

    <!-- Contract Import Wizard -->
    <ContractImportWizard
      :show="showContractImport"
      :hotel-id="hotel._id"
      @close="showContractImport = false"
      @imported="handleContractImported"
    />

    <!-- Period Edit Modal -->
    <Modal
      v-model="showPeriodEditModal"
      :title="$t('planning.pricing.editPeriod')"
      size="xl"
      content-class="!h-[75vh] !overflow-y-auto"
    >
      <PeriodEditForm
        v-if="editingPeriod"
        :hotel-id="hotel._id"
        :period="editingPeriod"
        :room-types="filteredRoomTypes"
        :meal-plans="filteredMealPlans"
        :market="selectedMarket"
        :child-age-groups="hotel.childAgeGroups || []"
        @saved="handlePeriodEditSaved"
        @cancel="showPeriodEditModal = false"
      />
    </Modal>

    <!-- Platform Admin: Delete All Pricing Data -->
    <div v-if="authStore.isPlatformAdmin && selectedMarket" class="mt-8 pt-4 border-t border-gray-200 dark:border-slate-700">
      <div class="flex justify-end">
        <button
          @click="showDeleteConfirm = true"
          class="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-1 opacity-60 hover:opacity-100 transition-opacity"
        >
          <span class="material-icons text-sm">delete_forever</span>
          Sezonları ve Fiyatları Sil
        </button>
      </div>
    </div>

    <!-- Delete Confirm Modal -->
    <Modal
      v-model="showDeleteConfirm"
      title="⚠️ Fiyat Verilerini Sil"
      size="sm"
    >
      <div class="text-center py-4">
        <div class="w-16 h-16 mx-auto rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
          <span class="material-icons text-3xl text-red-600 dark:text-red-400">warning</span>
        </div>
        <p class="text-gray-700 dark:text-gray-300 mb-2">
          <strong>{{ selectedMarket?.code }}</strong> pazarındaki tüm sezonlar ve fiyatlar silinecek.
        </p>
        <p class="text-sm text-red-600 dark:text-red-400 font-medium">Bu işlem geri alınamaz!</p>
      </div>
      <template #footer>
        <div class="flex justify-end gap-3">
          <button
            @click="showDeleteConfirm = false"
            class="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
          >
            İptal
          </button>
          <button
            @click="deleteAllPricingData"
            :disabled="isDeleting"
            class="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg flex items-center gap-2"
          >
            <span v-if="isDeleting" class="material-icons animate-spin text-sm">refresh</span>
            <span class="material-icons text-sm" v-else>delete_forever</span>
            Evet, Sil
          </button>
        </div>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import { useDate } from '@/composables/useDate'
import Modal from '@/components/common/Modal.vue'
import MonthlyCalendar from './MonthlyCalendar.vue'
import SeasonForm from './SeasonForm.vue'
import RateForm from './RateForm.vue'
import BulkEditModal from './BulkEditModal.vue'
import AIPricingAssistant from './AIPricingAssistant.vue'
import PriceQueryModal from './PriceQueryModal.vue'
import PeriodEditForm from './PeriodEditForm.vue'
import ContractImportWizard from './ContractImportWizard.vue'
import planningService from '@/services/planningService'
import { useAuthStore } from '@/stores/auth'

const props = defineProps({
  hotel: { type: Object, required: true },
  active: { type: Boolean, default: true }, // Whether this tab is currently active
  refreshTrigger: { type: Number, default: 0 } // Increment to force refresh
})

const { t, locale } = useI18n()
const { formatShortDate, formatDisplayDate, calculateDays } = useDate()
const toast = useToast()
const authStore = useAuthStore()

// Delete pricing data state
const showDeleteConfirm = ref(false)
const isDeleting = ref(false)

// Data
const rates = ref([])
const overrides = ref([]) // RateOverride records (daily exceptions)
const seasons = ref([])
const roomTypes = ref([])
const mealPlans = ref([])
const markets = ref([])

// Loading
const loadingRates = ref(false)
const loadingSeasons = ref(false)
const loadingPriceList = ref(false)

// Calendar refresh key - increment to force re-render
const calendarKey = ref(0)

// Price List Data (for list view)
const priceListData = ref([])

// UI State
const viewMode = ref('calendar')
const showSeasonPanel = ref(false)
const timelineYear = ref(new Date().getFullYear())
const showSeasonForm = ref(false)
const showRateModal = ref(false)
const showDeleteModal = ref(false)
const selectedMarket = ref(null)
const editingSeason = ref(null)
const editingRate = ref(null)
const deleteTarget = ref(null)
const deleteType = ref(null)
const deleting = ref(false)
const bulkEditCells = ref([])
const showBulkEditModal = ref(false)
const showPriceQueryModal = ref(false)
const showPeriodEditModal = ref(false)
const showContractImport = ref(false)
const editingPeriod = ref(null)
const calendarRef = ref(null)

// Current calendar month - load from localStorage if available
const getStoredMonth = () => {
  try {
    const stored = localStorage.getItem('planning_calendar_month')
    if (stored) {
      const parsed = JSON.parse(stored)
      if (parsed.year && parsed.month) {
        return parsed
      }
    }
  } catch (e) {
    // ignore
  }
  return {
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1
  }
}

const currentMonth = ref(getStoredMonth())

// Watch for month changes and save to localStorage
watch(currentMonth, (newVal) => {
  try {
    localStorage.setItem('planning_calendar_month', JSON.stringify(newVal))
  } catch (e) {
    // ignore
  }
}, { deep: true })

// Filters
const filters = reactive({
  roomType: '',
  mealPlan: ''
})

// Computed

// Seasons that overlap with current displayed month
const currentMonthSeasons = computed(() => {
  if (!seasons.value.length || !currentMonth.value) return []

  const year = currentMonth.value.year
  const month = currentMonth.value.month
  const monthStart = new Date(year, month - 1, 1)
  const monthEnd = new Date(year, month, 0) // Last day of month

  return seasons.value.filter(season => {
    if (!season.dateRanges?.length) return false

    return season.dateRanges.some(range => {
      const rangeStart = new Date(range.startDate)
      const rangeEnd = new Date(range.endDate)
      // Check if date range overlaps with current month
      return rangeStart <= monthEnd && rangeEnd >= monthStart
    })
  })
})

/**
 * Filtered room types based on market's and current month's seasons' active room types
 * Algorithm:
 * 1. If no market selected → return all room types
 * 2. Start with market's activeRoomTypes (empty = all)
 * 3. If current month overlaps with seasons that have activeRoomTypes → intersect with those
 */
const filteredRoomTypes = computed(() => {
  if (!selectedMarket.value) return roomTypes.value

  // Start with market's active room types
  let activeIds = selectedMarket.value.activeRoomTypes || []
  let marketFiltered = roomTypes.value

  // Filter by market's activeRoomTypes if defined
  if (activeIds.length > 0) {
    const normalizedMarketIds = activeIds.map(id => typeof id === 'object' ? id._id : id)
    marketFiltered = roomTypes.value.filter(rt => normalizedMarketIds.includes(rt._id))
  }

  // Check if current month's seasons have activeRoomTypes defined
  if (currentMonthSeasons.value.length > 0) {
    // Collect all active room types from overlapping seasons
    const seasonRoomTypeIds = new Set()
    let hasSeasonWithActiveRooms = false

    for (const season of currentMonthSeasons.value) {
      if (season.activeRoomTypes && season.activeRoomTypes.length > 0) {
        hasSeasonWithActiveRooms = true
        season.activeRoomTypes.forEach(id => {
          const normalizedId = typeof id === 'object' ? id._id : id
          seasonRoomTypeIds.add(normalizedId)
        })
      }
    }

    // If any season has active room types defined, filter by them
    if (hasSeasonWithActiveRooms) {
      return marketFiltered.filter(rt => seasonRoomTypeIds.has(rt._id))
    }
  }

  return marketFiltered
})

/**
 * Filtered meal plans based on market's and current month's seasons' active meal plans
 * Algorithm:
 * 1. If no market selected → return all meal plans (excluding inactive status)
 * 2. Start with market's activeMealPlans (empty = all)
 * 3. If current month overlaps with seasons that have activeMealPlans → intersect with those
 */
const filteredMealPlans = computed(() => {
  // First filter out inactive meal plans
  let activeMPs = mealPlans.value.filter(mp => mp.status !== 'inactive')

  if (!selectedMarket.value) return activeMPs

  // Filter by market's activeMealPlans if defined
  const marketActiveIds = selectedMarket.value.activeMealPlans || []
  let marketFiltered = activeMPs

  if (marketActiveIds.length > 0) {
    const normalizedMarketIds = marketActiveIds.map(id => typeof id === 'object' ? id._id : id)
    marketFiltered = activeMPs.filter(mp => normalizedMarketIds.includes(mp._id))
  }

  // Check if current month's seasons have activeMealPlans defined
  if (currentMonthSeasons.value.length > 0) {
    const seasonMealPlanIds = new Set()
    let hasSeasonWithActiveMealPlans = false

    for (const season of currentMonthSeasons.value) {
      if (season.activeMealPlans && season.activeMealPlans.length > 0) {
        hasSeasonWithActiveMealPlans = true
        season.activeMealPlans.forEach(id => {
          const normalizedId = typeof id === 'object' ? id._id : id
          seasonMealPlanIds.add(normalizedId)
        })
      }
    }

    // If any season has active meal plans defined, filter by them
    if (hasSeasonWithActiveMealPlans) {
      return marketFiltered.filter(mp => seasonMealPlanIds.has(mp._id))
    }
  }

  return marketFiltered
})

const filteredRates = computed(() => {
  let result = rates.value

  if (selectedMarket.value) {
    result = result.filter(r => {
      const marketId = r.market?._id || r.market
      return marketId === selectedMarket.value._id
    })
  }

  if (filters.roomType) {
    result = result.filter(r => {
      const rtId = r.roomType?._id || r.roomType
      return rtId === filters.roomType
    })
  }

  if (filters.mealPlan) {
    result = result.filter(r => {
      const mpId = r.mealPlan?._id || r.mealPlan
      return mpId === filters.mealPlan
    })
  }

  return result
})

// Price List Computed - Get meal plans that have periods with prices
const priceListMealPlans = computed(() => {
  const mpMap = {}
  priceListData.value.forEach(item => {
    // Only include meal plans that have at least one period with a price
    if (item.mealPlan && item.periods && item.periods.length > 0) {
      const hasPrice = item.periods.some(p => p.pricePerNight > 0)
      if (hasPrice) {
        mpMap[item.mealPlan._id] = item.mealPlan
      }
    }
  })
  return Object.values(mpMap)
})

// Active meal plans only (filter out inactive ones, default to active if status not set)
const activeMealPlans = computed(() => {
  return priceListMealPlans.value.filter(mp => mp.status !== 'inactive')
})

// Unified periods across all meal plans
const unifiedPeriods = computed(() => {
  const allPeriods = []
  const periodMap = {}

  priceListData.value.forEach(mpData => {
    mpData.periods.forEach(period => {
      const key = `${period.startDate}_${period.endDate}`
      if (!periodMap[key]) {
        periodMap[key] = {
          startDate: period.startDate,
          endDate: period.endDate,
          prices: {}
        }
      }
      periodMap[key].prices[mpData.mealPlan._id] = period
    })
  })

  // Sort by start date
  return Object.values(periodMap).sort((a, b) =>
    new Date(a.startDate) - new Date(b.startDate)
  )
})

// Get price for a specific period and meal plan
const getPeriodPrice = (period, mealPlanId) => {
  return period.prices[mealPlanId] || null
}

// Get first available rate for a period (for min stay, release days)
const getFirstPeriodRate = (period) => {
  const mealPlanIds = Object.keys(period.prices)
  if (mealPlanIds.length === 0) return null
  return period.prices[mealPlanIds[0]]
}

// Period List Data - Get periods for selected room type + meal plan combination
const periodListData = computed(() => {
  if (!filters.mealPlan) return []

  // Find the data for the selected meal plan
  const mpData = priceListData.value.find(item => {
    const mpId = item.mealPlan?._id || item.mealPlan
    return mpId === filters.mealPlan
  })

  if (!mpData || !mpData.periods) return []

  return mpData.periods
})


// Get selected room type name
const getSelectedRoomTypeName = () => {
  if (!filters.roomType) return ''
  const rt = roomTypes.value.find(r => r._id === filters.roomType)
  if (!rt) return ''
  return rt.name?.[locale.value] || rt.name?.tr || rt.name?.en || rt.code || ''
}

// Get selected meal plan code
const getSelectedMealPlanCode = () => {
  if (!filters.mealPlan) return ''
  const mp = mealPlans.value.find(m => m._id === filters.mealPlan)
  return mp?.code || ''
}

// Helpers
const getSeasonName = (season) => {
  return season.name?.[locale.value] || season.name?.tr || season.name?.en || season.code
}

const getRoomTypeName = (roomType) => {
  if (!roomType) return ''
  return roomType.name?.[locale.value] || roomType.name?.tr || roomType.name?.en || roomType.code || ''
}

const formatSeasonDates = (season) => {
  if (!season.dateRanges?.length) return '-'
  const range = season.dateRanges[0]
  return `${formatShortDate(range.startDate)} - ${formatShortDate(range.endDate)}`
}

// Timeline helper functions
const getMonthShortName = (month) => {
  const date = new Date(2024, month - 1, 1)
  return date.toLocaleDateString(locale.value === 'tr' ? 'tr-TR' : 'en-US', { month: 'short' })
}

const formatTodayDate = () => {
  return new Date().toLocaleDateString(locale.value === 'tr' ? 'tr-TR' : 'en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

const getSeasonTimelineRanges = (season) => {
  if (!season.dateRanges?.length) return []

  const year = timelineYear.value
  const yearStart = new Date(year, 0, 1).getTime()
  const yearEnd = new Date(year, 11, 31, 23, 59, 59).getTime()
  const yearDuration = yearEnd - yearStart

  return season.dateRanges
    .map(range => {
      const start = new Date(range.startDate).getTime()
      const end = new Date(range.endDate).getTime()

      // Skip if range doesn't overlap with selected year
      if (end < yearStart || start > yearEnd) return null

      // Clamp to year boundaries
      const clampedStart = Math.max(start, yearStart)
      const clampedEnd = Math.min(end, yearEnd)

      const left = ((clampedStart - yearStart) / yearDuration) * 100
      const width = ((clampedEnd - clampedStart) / yearDuration) * 100

      // Format label
      const startDate = new Date(range.startDate)
      const endDate = new Date(range.endDate)
      const label = `${startDate.toLocaleDateString(locale.value === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'short' })} - ${endDate.toLocaleDateString(locale.value === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' })}`

      // Short label for narrow bars
      const shortLabel = `${startDate.getDate()}/${startDate.getMonth() + 1}-${endDate.getDate()}/${endDate.getMonth() + 1}`

      return { left, width, label, shortLabel }
    })
    .filter(Boolean)
}

// Today's position on timeline (percentage)
const todayPosition = computed(() => {
  const year = timelineYear.value
  const yearStart = new Date(year, 0, 1).getTime()
  const yearEnd = new Date(year, 11, 31, 23, 59, 59).getTime()
  const yearDuration = yearEnd - yearStart
  const today = new Date().getTime()

  if (today < yearStart || today > yearEnd) return -1 // Not in current year
  return ((today - yearStart) / yearDuration) * 100
})

// All season ranges combined for single timeline view
const allSeasonRanges = computed(() => {
  const year = timelineYear.value
  const yearStart = new Date(year, 0, 1).getTime()
  const yearEnd = new Date(year, 11, 31, 23, 59, 59).getTime()
  const yearDuration = yearEnd - yearStart

  const ranges = []

  for (const season of seasons.value) {
    if (!season.dateRanges?.length) continue

    for (const range of season.dateRanges) {
      const start = new Date(range.startDate).getTime()
      const end = new Date(range.endDate).getTime()

      // Skip if range doesn't overlap with selected year
      if (end < yearStart || start > yearEnd) continue

      // Clamp to year boundaries
      const clampedStart = Math.max(start, yearStart)
      const clampedEnd = Math.min(end, yearEnd)

      const left = ((clampedStart - yearStart) / yearDuration) * 100
      const width = ((clampedEnd - clampedStart) / yearDuration) * 100

      // Format label
      const startDate = new Date(range.startDate)
      const endDate = new Date(range.endDate)
      const dateLabel = `${startDate.toLocaleDateString(locale.value === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'short' })} - ${endDate.toLocaleDateString(locale.value === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'short' })}`

      ranges.push({
        season,
        left,
        width,
        dateLabel,
        color: season.color || '#6366f1'
      })
    }
  }

  // Sort by left position
  return ranges.sort((a, b) => a.left - b.left)
})

// formatDate replaced by useDate composable's formatShortDate

const formatPrice = (price, currency) => {
  return new Intl.NumberFormat(locale.value === 'tr' ? 'tr-TR' : 'en-US', {
    style: 'currency',
    currency: currency || 'EUR'
  }).format(price)
}

const getMealPlanBadgeClass = (code) => {
  const colors = {
    'RO': 'px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs font-medium',
    'BB': 'px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded text-xs font-medium',
    'HB': 'px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded text-xs font-medium',
    'FB': 'px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs font-medium',
    'AI': 'px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded text-xs font-medium',
    'UAI': 'px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded text-xs font-medium'
  }
  return colors[code] || 'px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs font-medium'
}

const getAllotmentClass = (allotment) => {
  if (allotment === 0) return 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
  if (allotment <= 2) return 'bg-red-50 dark:bg-red-900/20 text-red-500'
  if (allotment <= 5) return 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'
  return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
}

const getMealPlanActiveColor = (code) => {
  const colors = {
    'RO': 'bg-gray-600 shadow-gray-600/30',
    'BB': 'bg-amber-500 shadow-amber-500/30',
    'HB': 'bg-orange-500 shadow-orange-500/30',
    'FB': 'bg-blue-500 shadow-blue-500/30',
    'AI': 'bg-purple-500 shadow-purple-500/30',
    'UAI': 'bg-indigo-600 shadow-indigo-600/30'
  }
  return colors[code] || 'bg-amber-500 shadow-amber-500/30'
}

const getMealPlanHeaderClass = (code) => {
  const colors = {
    'RO': 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200',
    'BB': 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300',
    'HB': 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300',
    'FB': 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
    'AI': 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300',
    'UAI': 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300'
  }
  return colors[code] || 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200'
}

// formatPeriodDate replaced by useDate composable's formatDisplayDate
const formatPeriodDate = formatDisplayDate

// getPeriodDays replaced by useDate composable's calculateDays
const getPeriodDays = calculateDays

const hasExtraPricing = (rate) => {
  if (!rate) return false
  const hasAdult = typeof rate.extraAdult === 'number' && rate.extraAdult >= 0
  const hasInfant = typeof rate.extraInfant === 'number' && rate.extraInfant >= 0
  const hasChild = rate.childOrderPricing?.some(p => typeof p === 'number' && p >= 0)
  const hasSingle = typeof rate.singleSupplement === 'number' && rate.singleSupplement > 0
  return hasAdult || hasInfant || hasChild || hasSingle
}

// API Calls
const fetchSeasons = async () => {
  if (!selectedMarket.value?._id) {
    seasons.value = []
    return
  }

  loadingSeasons.value = true
  try {
    const response = await planningService.getSeasons(props.hotel._id, selectedMarket.value._id)
    if (response.success) {
      // Sort seasons by their first date range's start date
      seasons.value = response.data.sort((a, b) => {
        const aStart = a.dateRanges?.[0]?.startDate || ''
        const bStart = b.dateRanges?.[0]?.startDate || ''
        return aStart.localeCompare(bStart)
      })
    }
  } catch (error) {
    console.error('Error fetching seasons:', error)
  } finally {
    loadingSeasons.value = false
  }
}

const fetchRates = async (params = {}) => {
  loadingRates.value = true
  try {
    const queryParams = {
      ...params
    }

    if (selectedMarket.value) {
      queryParams.market = selectedMarket.value._id
    }

    // For calendar view, fetch entire month
    if (viewMode.value === 'calendar') {
      const year = currentMonth.value.year
      const month = currentMonth.value.month

      // Format dates as YYYY-MM-DD without timezone conversion
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`
      const lastDay = new Date(year, month, 0).getDate() // Last day of month
      const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

      queryParams.startDate = startDate
      queryParams.endDate = endDate
    }

    // Use getRatesCalendar for calendar view to get both rates AND overrides
    // Use getRates for other views (only returns rates)
    const response = viewMode.value === 'calendar'
      ? await planningService.getRatesCalendar(props.hotel._id, queryParams)
      : await planningService.getRates(props.hotel._id, queryParams)

    // Handle both old format (array) and new format ({ rates, overrides })
    if (response.success) {
      if (Array.isArray(response.data)) {
        // Old format - data is an array of rates
        rates.value = response.data
        overrides.value = []
      } else if (response.data && typeof response.data === 'object') {
        // New format - data has rates and overrides
        rates.value = response.data.rates || []
        overrides.value = response.data.overrides || []
      }
      // Increment calendar key to force re-render
      calendarKey.value++
    }
  } catch (error) {
    toast.error(t('common.fetchError'))
  } finally {
    loadingRates.value = false
  }
}

const fetchPriceList = async () => {
  if (!filters.roomType || !filters.mealPlan || !selectedMarket.value) {
    priceListData.value = []
    return
  }

  loadingPriceList.value = true
  try {
    const params = {
      roomType: filters.roomType,
      mealPlan: filters.mealPlan,
      market: selectedMarket.value._id
    }

    const response = await planningService.getRatesPriceList(props.hotel._id, params)
    if (response.success) {
      priceListData.value = response.data
    }
  } catch (error) {
    console.error('Error fetching price list:', error)
    priceListData.value = []
  } finally {
    loadingPriceList.value = false
  }
}

const fetchDependencies = async () => {
  try {
    const [rtRes, mpRes, mRes] = await Promise.all([
      planningService.getRoomTypes(props.hotel._id),
      planningService.getMealPlans(props.hotel._id),
      planningService.getMarkets(props.hotel._id)
    ])

    if (rtRes.success) roomTypes.value = rtRes.data
    if (mpRes.success) mealPlans.value = mpRes.data
    if (mRes.success) {
      markets.value = mRes.data
      // Auto-select first market
      if (mRes.data.length > 0 && !selectedMarket.value) {
        selectedMarket.value = mRes.data[0]
      }
    }
  } catch (error) {
    console.error('Error fetching dependencies:', error)
  }
}

// Event Handlers
const handleCalendarRefresh = (params) => {
  if (params?.year && params?.month) {
    currentMonth.value = { year: params.year, month: params.month }
  }
  fetchRates()
}

const openBulkModal = () => {
  if (!selectedMarket.value) {
    toast.error(t('planning.pricing.selectMarket'))
    return
  }
  editingRate.value = null
  bulkEditCells.value = []
  showRateModal.value = true
}

const openBulkEditModal = (cells) => {
  bulkEditCells.value = cells
  showBulkEditModal.value = true
}

const handleBulkEditSaved = () => {
  showBulkEditModal.value = false
  bulkEditCells.value = []
  fetchRates()
}

// Period Edit
const openPeriodEdit = (period) => {
  editingPeriod.value = period
  showPeriodEditModal.value = true
}

const handlePeriodEditSaved = () => {
  showPeriodEditModal.value = false
  editingPeriod.value = null
  fetchPriceList()
}

const handleAIExecuted = () => {
  fetchRates()
  if (viewMode.value === 'period') {
    fetchPriceList()
  }
  // Clear selection after AI command execution
  bulkEditCells.value = []
  // Also clear calendar selection
  if (calendarRef.value?.clearSelection) {
    calendarRef.value.clearSelection()
  }
}

// Handle contract import completion
const handleContractImported = async (result) => {
  showContractImport.value = false

  // Refresh room types and meal plans (capacities may have been updated)
  await fetchDependencies()

  // Refresh rates
  fetchRates()
  if (viewMode.value === 'period') {
    fetchPriceList()
  }
}

// Delete all pricing data (Platform Admin only)
const deleteAllPricingData = async () => {
  if (!selectedMarket.value) return

  isDeleting.value = true
  try {
    const result = await planningService.deleteMarketPricingData(props.hotel._id, selectedMarket.value._id)
    toast.success(`${result.data.seasonsDeleted} sezon ve ${result.data.ratesDeleted} fiyat silindi`)
    showDeleteConfirm.value = false
    // Refresh data
    await Promise.all([
      fetchSeasons(),
      fetchRates(),
      viewMode.value === 'period' ? fetchPriceList() : null
    ])
  } catch (error) {
    toast.error('Silme işlemi başarısız: ' + (error.response?.data?.message || error.message))
  } finally {
    isDeleting.value = false
  }
}

// Handle calendar selection changes for AI assistant
const handleSelectionChange = (cells) => {
  bulkEditCells.value = cells
}

// Clear calendar selection (for AI assistant)
const clearCalendarSelection = () => {
  bulkEditCells.value = []
  if (calendarRef.value?.clearSelection) {
    calendarRef.value.clearSelection()
  }
}

const editSeason = (season) => {
  editingSeason.value = season
  showSeasonForm.value = true
}

const handleSeasonSaved = () => {
  showSeasonForm.value = false
  editingSeason.value = null
  fetchSeasons()
}

const confirmDeleteSeason = (season) => {
  deleteTarget.value = season
  deleteType.value = 'season'
  showDeleteModal.value = true
}

const editRate = (rate) => {
  editingRate.value = rate
  bulkEditCells.value = []
  showRateModal.value = true
}

const handleRateSaved = () => {
  showRateModal.value = false
  editingRate.value = null
  bulkEditCells.value = []
  fetchRates()
}

const confirmDeleteRate = (rate) => {
  deleteTarget.value = rate
  deleteType.value = 'rate'
  showDeleteModal.value = true
}

const executeDelete = async () => {
  deleting.value = true
  try {
    if (deleteType.value === 'season') {
      await planningService.deleteSeason(props.hotel._id, deleteTarget.value._id)
      toast.success(t('planning.pricing.seasonDeleted'))
      fetchSeasons()
    } else if (deleteType.value === 'rate') {
      await planningService.deleteRate(props.hotel._id, deleteTarget.value._id)
      toast.success(t('planning.pricing.rateDeleted'))
      fetchRates()
    }
    showDeleteModal.value = false
  } catch (error) {
    toast.error(error.response?.data?.message || t('common.deleteFailed'))
  } finally {
    deleting.value = false
  }
}

// Watchers
watch(selectedMarket, () => {
  fetchSeasons()
  fetchRates()

  // Reset filters if current selection is not in filtered list
  // Use nextTick to ensure filteredRoomTypes/filteredMealPlans are updated
  nextTick(() => {
    // Check if current room type filter is still valid
    if (filters.roomType && !filteredRoomTypes.value.find(rt => rt._id === filters.roomType)) {
      filters.roomType = filteredRoomTypes.value[0]?._id || ''
    }
    // Check if current meal plan filter is still valid
    if (filters.mealPlan && !filteredMealPlans.value.find(mp => mp._id === filters.mealPlan)) {
      filters.mealPlan = filteredMealPlans.value[0]?._id || ''
    }
  })

  if (viewMode.value === 'period') {
    fetchPriceList()
  }
})

watch(viewMode, (newMode) => {
  if (newMode === 'period') {
    // Auto-select first filtered room type if none selected
    if (!filters.roomType && filteredRoomTypes.value.length > 0) {
      filters.roomType = filteredRoomTypes.value[0]._id
    }
    // Auto-select first filtered meal plan if none selected
    if (!filters.mealPlan && filteredMealPlans.value.length > 0) {
      filters.mealPlan = filteredMealPlans.value[0]._id
    }
    fetchPriceList()
  }
})

watch(() => filters.roomType, () => {
  if (viewMode.value === 'period') {
    fetchPriceList()
  }
})

watch(() => filters.mealPlan, () => {
  if (viewMode.value === 'period') {
    fetchPriceList()
  }
})

watch(() => props.hotel?._id, (newId) => {
  if (newId) {
    fetchDependencies()
    fetchSeasons()
    fetchRates()
  }
}, { immediate: true })

// Refresh when tab becomes active (handles case when switching from other tabs)
watch(() => props.active, (isActive, wasActive) => {
  if (isActive && !wasActive) {
    // Tab just became active, refresh dependencies (room types, meal plans) that may have changed
    fetchDependencies()
    fetchRates()
    if (viewMode.value === 'period') {
      fetchPriceList()
    }
  }
})

// Handle external refresh trigger (e.g., from RoomsTab after adding a room)
watch(() => props.refreshTrigger, (newVal, oldVal) => {
  if (newVal !== oldVal && props.active) {
    fetchDependencies()
    fetchRates()
  }
})
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
