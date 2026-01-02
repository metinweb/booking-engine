<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-50 pointer-events-none"
    >
      <!-- Semi-transparent overlay (no blur, no click to close) -->
      <div class="absolute inset-0 bg-black/30 pointer-events-auto"></div>

      <!-- Draggable Modal -->
      <div
        ref="modalRef"
        class="absolute bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-[95vw] max-w-6xl h-[85vh] overflow-hidden flex flex-col pointer-events-auto"
        :style="modalStyle"
      >
        <!-- Header (Drag Handle) -->
        <div
          class="px-6 py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 cursor-move select-none"
          @mousedown="startDrag"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <span class="material-icons text-white">travel_explore</span>
              </div>
              <div>
                <h2 class="text-xl font-bold text-white">{{ $t('planning.pricing.priceQuery') }}</h2>
                <p class="text-white/70 text-sm">{{ hotelName }}</p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <!-- Drag indicator -->
              <span class="material-icons text-white/50 text-sm">drag_indicator</span>
              <button
                @click="$emit('update:modelValue', false)"
                class="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              >
                <span class="material-icons">close</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Search Form -->
        <div class="px-6 py-4 bg-gray-50 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-600">
          <div class="flex flex-wrap items-end gap-4">
            <!-- Date Range -->
            <div class="flex-1 min-w-[280px]">
              <label class="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">
                <span class="material-icons text-xs align-middle">date_range</span>
                {{ $t('planning.pricing.checkIn') }} - {{ $t('planning.pricing.checkOut') }}
              </label>
              <DateRangePicker
                v-model="dateRange"
                :allow-past="false"
              />
            </div>

            <!-- Adults -->
            <div class="w-24">
              <label class="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">
                <span class="material-icons text-xs align-middle">person</span>
                {{ $t('planning.pricing.adults') }}
              </label>
              <div class="flex items-center border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 overflow-hidden">
                <button @click="query.adults = Math.max(1, query.adults - 1)" class="px-2 py-2.5 hover:bg-gray-100 dark:hover:bg-slate-700">
                  <span class="material-icons text-sm">remove</span>
                </button>
                <span class="flex-1 text-center font-bold text-gray-900 dark:text-white">{{ query.adults }}</span>
                <button @click="query.adults = Math.min(10, query.adults + 1)" class="px-2 py-2.5 hover:bg-gray-100 dark:hover:bg-slate-700">
                  <span class="material-icons text-sm">add</span>
                </button>
              </div>
            </div>

            <!-- Children -->
            <div class="w-24">
              <label class="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">
                <span class="material-icons text-xs align-middle">child_care</span>
                {{ $t('planning.pricing.children') }}
              </label>
              <div class="flex items-center border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 overflow-hidden">
                <button @click="updateChildCount(query.childrenCount - 1)" class="px-2 py-2.5 hover:bg-gray-100 dark:hover:bg-slate-700">
                  <span class="material-icons text-sm">remove</span>
                </button>
                <span class="flex-1 text-center font-bold text-gray-900 dark:text-white">{{ query.childrenCount }}</span>
                <button @click="updateChildCount(query.childrenCount + 1)" class="px-2 py-2.5 hover:bg-gray-100 dark:hover:bg-slate-700">
                  <span class="material-icons text-sm">add</span>
                </button>
              </div>
            </div>

            <!-- Child Ages -->
            <div v-if="query.childrenCount > 0" class="flex items-center gap-2">
              <div
                v-for="i in query.childrenCount"
                :key="i"
                class="w-16"
              >
                <label class="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1">{{ i }}. yaş</label>
                <input
                  type="number"
                  v-model.number="query.childAges[i - 1]"
                  min="0"
                  max="17"
                  class="w-full px-2 py-2.5 text-center border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white font-medium"
                />
              </div>
            </div>

            <!-- Search Button -->
            <button
              @click="searchAvailability"
              :disabled="!isQueryValid || loading"
              class="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-indigo-500/30"
            >
              <span v-if="loading" class="material-icons animate-spin text-sm">refresh</span>
              <span v-else class="material-icons text-sm">search</span>
              {{ $t('planning.pricing.calculate') }}
            </button>
          </div>

          <!-- Search Summary -->
          <div v-if="searched" class="mt-3 flex items-center gap-4 text-sm text-gray-600 dark:text-slate-400">
            <span class="flex items-center gap-1">
              <span class="material-icons text-sm">nights_stay</span>
              {{ nights }} {{ $t('planning.pricing.nights') }}
            </span>
            <span class="flex items-center gap-1">
              <span class="material-icons text-sm">group</span>
              {{ query.adults }} {{ $t('planning.pricing.adults') }}
              <span v-if="query.childrenCount > 0">, {{ query.childrenCount }} {{ $t('planning.pricing.children') }}</span>
            </span>
            <span class="flex items-center gap-1">
              <span class="material-icons text-sm">payments</span>
              {{ currency }}
            </span>
          </div>
        </div>

        <!-- Results -->
        <div class="flex-1 overflow-y-auto p-6">
          <!-- Loading State -->
          <div v-if="loading" class="flex flex-col items-center justify-center py-16">
            <div class="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
            <p class="text-gray-500 dark:text-slate-400">{{ $t('common.loading') }}</p>
          </div>

          <!-- No Search Yet -->
          <div v-else-if="!searched" class="flex flex-col items-center justify-center py-16 text-center">
            <div class="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 flex items-center justify-center mb-4">
              <span class="material-icons text-5xl text-indigo-500">hotel_class</span>
            </div>
            <h3 class="text-lg font-bold text-gray-800 dark:text-white mb-2">Fiyat Sorgulama</h3>
            <p class="text-gray-500 dark:text-slate-400 max-w-md">
              Giriş-çıkış tarihi ve misafir sayısını seçerek tüm oda tipleri için fiyat ve müsaitlik durumunu görüntüleyin.
            </p>
          </div>

          <!-- Results - Card Based Design -->
          <div v-else class="space-y-3">
            <!-- Room Cards -->
            <div
              v-for="roomResult in results"
              :key="roomResult.roomType._id"
              class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden"
            >
              <!-- Room Header -->
              <div class="px-4 py-3 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-b border-gray-200 dark:border-slate-700">
                <div class="flex items-center gap-3">
                  <!-- Room Image -->
                  <div class="w-16 h-12 rounded-lg overflow-hidden bg-gray-100 dark:bg-slate-700 flex-shrink-0">
                    <img
                      v-if="getRoomImage(roomResult.roomType)"
                      :src="getRoomImage(roomResult.roomType)"
                      :alt="getRoomTypeName(roomResult.roomType)"
                      class="w-full h-full object-cover"
                    />
                    <div v-else class="w-full h-full flex items-center justify-center">
                      <span class="material-icons text-gray-400 text-xl">hotel</span>
                    </div>
                  </div>
                  <div class="flex-1">
                    <div class="flex items-center gap-2 flex-wrap">
                      <span class="px-2 py-0.5 rounded-lg bg-indigo-600 text-white text-xs font-bold whitespace-nowrap">
                        {{ roomResult.roomType.code }}
                      </span>
                      <span class="font-semibold text-gray-800 dark:text-white">
                        {{ getRoomTypeName(roomResult.roomType) }}
                      </span>
                    </div>
                    <div class="text-xs text-gray-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                      <span class="material-icons text-xs">person</span>
                      <span>
                        {{ roomResult.roomType.occupancy?.minAdults > 1 ? roomResult.roomType.occupancy.minAdults + '-' : '' }}{{ roomResult.roomType.occupancy?.maxAdults || 2 }} yetişkin, {{ roomResult.roomType.occupancy?.totalMaxGuests || 4 }} kişi
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Meal Plan Prices Grid -->
              <div class="flex flex-wrap gap-2 p-3">
                <div
                  v-for="mpResult in roomResult.mealPlans"
                  :key="mpResult.mealPlan._id"
                  class="relative p-3 rounded-xl cursor-pointer transition-all hover:shadow-md min-w-[130px] max-w-[160px] flex-1"
                  :class="[
                    mpResult.capacityExceeded ? 'bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800' :
                    !mpResult.hasRates ? 'bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600' :
                    mpResult.available ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' :
                    'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
                  ]"
                  @click="toggleDetails(roomResult.roomType._id, mpResult.mealPlan._id)"
                >
                  <!-- Meal Plan Badge -->
                  <div class="text-center mb-2">
                    <span
                      class="inline-block px-2 py-0.5 rounded-lg text-xs font-bold"
                      :class="getMealPlanBadgeClass(mpResult.mealPlan.code)"
                    >
                      {{ mpResult.mealPlan.code }}
                    </span>
                  </div>

                  <!-- Capacity Exceeded -->
                  <div v-if="mpResult.capacityExceeded" class="text-center py-2">
                    <span class="material-icons text-rose-500 text-2xl">group_off</span>
                    <div class="text-xs text-rose-600 font-medium mt-1">Kapasite Aşımı</div>
                  </div>

                  <!-- No Rates -->
                  <div v-else-if="!mpResult.hasRates" class="text-center py-2">
                    <span class="text-gray-400 dark:text-slate-500 text-lg">—</span>
                    <div class="text-xs text-gray-400 mt-1">Fiyat yok</div>
                  </div>

                  <!-- Has Rates -->
                  <div v-else>
                    <!-- Campaign Discount Badge -->
                    <div v-if="mpResult.campaign" class="absolute -top-2 -right-2 z-10">
                      <span class="px-2 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] font-bold rounded-full shadow-lg">
                        {{ mpResult.discountText }}
                      </span>
                    </div>

                    <!-- 3-Tier Pricing Mini Table -->
                    <table class="w-full text-[11px]">
                      <tbody>
                        <tr class="border-b border-gray-100 dark:border-slate-600">
                          <td class="py-1 text-gray-500 dark:text-slate-400">Maliyet</td>
                          <td class="py-1 text-right font-medium text-gray-700 dark:text-gray-300">{{ formatPrice(getTierPricing(mpResult).hotelCost) }}</td>
                        </tr>
                        <tr class="border-b border-gray-100 dark:border-slate-600 bg-blue-50/50 dark:bg-blue-900/10">
                          <td class="py-1 text-blue-600 dark:text-blue-400 font-medium">B2B</td>
                          <td class="py-1 text-right font-bold text-blue-700 dark:text-blue-300">{{ formatPrice(getTierPricing(mpResult).b2bPrice) }}</td>
                        </tr>
                        <tr class="bg-green-50/50 dark:bg-green-900/10">
                          <td class="py-1 text-green-600 dark:text-green-400 font-medium">B2C</td>
                          <td class="py-1 text-right font-bold text-green-700 dark:text-green-300">{{ formatPrice(getTierPricing(mpResult).b2cPrice) }}</td>
                        </tr>
                      </tbody>
                    </table>

                    <!-- Non-Refundable Pricing -->
                    <div v-if="mpResult.nonRefundable?.enabled" class="mt-2 pt-2 border-t border-dashed border-red-200 dark:border-red-800">
                      <div class="flex items-center gap-1 mb-1">
                        <span class="material-icons text-red-500 text-[10px]">block</span>
                        <span class="text-[9px] font-bold text-red-600 dark:text-red-400">İADE EDİLMEZ -%{{ mpResult.nonRefundable.discountPercent }}</span>
                      </div>
                      <div class="flex justify-between text-[10px]">
                        <span class="text-blue-600">B2B</span>
                        <span class="font-bold text-blue-700">{{ formatPrice(mpResult.nonRefundable.pricing?.b2bPrice || 0) }}</span>
                      </div>
                      <div class="flex justify-between text-[10px]">
                        <span class="text-green-600">B2C</span>
                        <span class="font-bold text-green-700">{{ formatPrice(mpResult.nonRefundable.pricing?.b2cPrice || 0) }}</span>
                      </div>
                    </div>

                    <!-- Footer info -->
                    <div class="flex items-center justify-between mt-2 text-[10px]">
                      <span class="text-gray-400">{{ formatPrice(mpResult.avgPerNight) }}/gece</span>
                      <span
                        class="flex items-center gap-0.5"
                        :class="mpResult.available ? 'text-green-600' : 'text-amber-600'"
                      >
                        <span class="material-icons text-[10px]">{{ mpResult.available ? 'check_circle' : 'warning' }}</span>
                        {{ mpResult.available ? 'Müsait' : 'Kısıtlı' }}
                      </span>
                    </div>

                    <!-- OBP Badge -->
                    <div v-if="mpResult.isOBP" class="text-center mt-1">
                      <span class="px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 text-[9px] font-bold rounded">
                        Kişi Bazlı
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Expanded Detail Section -->
              <div v-if="getExpandedMealPlan(roomResult.roomType._id)" class="border-t border-gray-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/30 p-4">
                <!-- Detail Header -->
                <div class="flex items-center justify-between mb-3">
                  <div class="flex items-center gap-2">
                    <span class="font-bold text-gray-800 dark:text-white">
                      {{ roomResult.roomType.code }} - {{ getRoomTypeName(roomResult.roomType) }}
                    </span>
                    <span
                      class="px-2 py-0.5 rounded text-xs font-bold"
                      :class="getMealPlanBadgeClass(getExpandedMealPlanData(roomResult)?.mealPlan?.code)"
                    >
                      {{ getExpandedMealPlanData(roomResult)?.mealPlan?.code }}
                    </span>
                  </div>
                  <button @click="expandedRow = null" class="p-1 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg transition-colors">
                    <span class="material-icons text-gray-500">close</span>
                  </button>
                </div>

                <!-- Summary Pricing Table -->
                <div class="bg-white dark:bg-slate-800 rounded-lg overflow-hidden border border-gray-200 dark:border-slate-600 mb-4">
                  <table class="w-full text-sm">
                    <thead>
                      <tr class="bg-gray-50 dark:bg-slate-700 border-b border-gray-200 dark:border-slate-600">
                        <th class="px-3 py-2 text-left font-medium text-gray-600 dark:text-slate-300">{{ nights }} Gece Toplam</th>
                        <th class="px-3 py-2 text-right font-medium text-gray-500 dark:text-slate-400">Maliyet</th>
                        <th class="px-3 py-2 text-right font-medium text-blue-600 dark:text-blue-400">B2B</th>
                        <th class="px-3 py-2 text-right font-medium text-green-600 dark:text-green-400">B2C</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td class="px-3 py-2.5 text-gray-700 dark:text-gray-300">
                          <div class="flex items-center gap-2">
                            <span
                              class="material-icons text-sm"
                              :class="getExpandedMealPlanData(roomResult)?.available ? 'text-green-500' : 'text-red-500'"
                            >{{ getExpandedMealPlanData(roomResult)?.available ? 'check_circle' : 'cancel' }}</span>
                            <span>{{ getExpandedMealPlanData(roomResult)?.salesSettings?.workingMode === 'commission' ? 'Komisyonlu' : 'Net' }}</span>
                            <span v-if="getExpandedMealPlanData(roomResult)?.campaign" class="px-1.5 py-0.5 text-[10px] font-bold bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded">
                              {{ getExpandedMealPlanData(roomResult).discountText }}
                            </span>
                          </div>
                        </td>
                        <td class="px-3 py-2.5 text-right font-semibold text-gray-700 dark:text-gray-200">
                          {{ formatPrice(getTierPricing(getExpandedMealPlanData(roomResult)).hotelCost) }}
                        </td>
                        <td class="px-3 py-2.5 text-right font-bold text-blue-700 dark:text-blue-300 text-base">
                          {{ formatPrice(getTierPricing(getExpandedMealPlanData(roomResult)).b2bPrice) }}
                        </td>
                        <td class="px-3 py-2.5 text-right font-bold text-green-700 dark:text-green-300 text-base">
                          {{ formatPrice(getTierPricing(getExpandedMealPlanData(roomResult)).b2cPrice) }}
                        </td>
                      </tr>
                      <tr class="bg-gray-50/50 dark:bg-slate-700/50 text-xs text-gray-500 dark:text-slate-400">
                        <td class="px-3 py-1.5">Gecelik ortalama</td>
                        <td class="px-3 py-1.5 text-right">{{ formatPrice((getTierPricing(getExpandedMealPlanData(roomResult)).hotelCost || 0) / nights) }}</td>
                        <td class="px-3 py-1.5 text-right text-blue-600">{{ formatPrice((getTierPricing(getExpandedMealPlanData(roomResult)).b2bPrice || 0) / nights) }}</td>
                        <td class="px-3 py-1.5 text-right text-green-600">{{ formatPrice((getTierPricing(getExpandedMealPlanData(roomResult)).b2cPrice || 0) / nights) }}</td>
                      </tr>
                      <!-- Non-Refundable Row -->
                      <tr v-if="getExpandedMealPlanData(roomResult)?.nonRefundable?.enabled" class="bg-red-50 dark:bg-red-900/20 text-xs border-t-2 border-red-200 dark:border-red-800">
                        <td class="px-3 py-2">
                          <div class="flex items-center gap-1">
                            <span class="material-icons text-red-500 text-sm">block</span>
                            <span class="font-bold text-red-600 dark:text-red-400">İade Edilmez</span>
                            <span class="text-red-500 text-[10px]">(-{{ getExpandedMealPlanData(roomResult).nonRefundable.discountPercent }}%)</span>
                          </div>
                        </td>
                        <td class="px-3 py-2 text-right font-semibold text-gray-600 dark:text-gray-300">{{ formatPrice(getExpandedMealPlanData(roomResult).nonRefundable.pricing?.hotelCost || 0) }}</td>
                        <td class="px-3 py-2 text-right font-bold text-blue-700 dark:text-blue-300">{{ formatPrice(getExpandedMealPlanData(roomResult).nonRefundable.pricing?.b2bPrice || 0) }}</td>
                        <td class="px-3 py-2 text-right font-bold text-green-700 dark:text-green-300">{{ formatPrice(getExpandedMealPlanData(roomResult).nonRefundable.pricing?.b2cPrice || 0) }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <!-- Issues -->
                <div v-if="getExpandedMealPlanData(roomResult)?.issues?.length > 0" class="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
                  <div class="flex items-center gap-2 text-red-600 font-medium text-sm mb-2">
                    <span class="material-icons text-sm">warning</span>
                    Müsaitlik Sorunları
                  </div>
                  <div class="flex flex-wrap gap-1">
                    <span
                      v-for="(issue, idx) in getExpandedMealPlanData(roomResult).issues"
                      :key="idx"
                      class="px-2 py-0.5 rounded-lg text-xs font-medium"
                      :class="getIssueBadgeClass(issue.type)"
                    >
                      {{ issue.date ? formatDate(issue.date) : '' }} {{ getIssueShortLabel(issue.type) }}
                    </span>
                  </div>
                </div>

                <!-- Daily Breakdown Table with Cost/B2B/B2C -->
                <div class="bg-white dark:bg-slate-800 rounded-lg overflow-hidden border border-gray-200 dark:border-slate-600">
                  <div class="overflow-x-auto max-h-[300px] overflow-y-auto">
                    <table class="w-full text-xs">
                      <thead class="sticky top-0 z-10">
                        <tr class="bg-gray-50 dark:bg-slate-700 text-gray-600 dark:text-slate-400 border-b border-gray-200 dark:border-slate-600">
                          <th class="px-3 py-2 text-left font-medium">Tarih</th>
                          <th class="px-3 py-2 text-right font-medium text-gray-500">Maliyet</th>
                          <th class="px-3 py-2 text-right font-medium text-blue-600">B2B</th>
                          <th class="px-3 py-2 text-right font-medium text-green-600">B2C</th>
                          <th class="px-3 py-2 text-center font-medium w-14">Durum</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr
                          v-for="(day, idx) in getExpandedMealPlanData(roomResult)?.dailyBreakdown || []"
                          :key="idx"
                          class="border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50"
                          :class="day.hasIssue ? 'bg-red-50/50 dark:bg-red-900/10' : ''"
                        >
                          <td class="px-3 py-2">
                            <div class="flex items-center gap-1.5">
                              <span class="font-medium text-gray-800 dark:text-white">{{ formatDate(day.date) }}</span>
                              <span v-if="day.isFreeNight" class="px-1 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 text-[9px] font-bold rounded">FREE</span>
                              <span v-else-if="day.campaignApplied" class="px-1 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-600 text-[9px] font-bold rounded">-%</span>
                            </div>
                          </td>
                          <td class="px-3 py-2 text-right">
                            <span v-if="day.rate" class="font-medium text-gray-600 dark:text-gray-300">{{ formatPrice(day.hotelCost || 0) }}</span>
                            <span v-else class="text-red-400">-</span>
                          </td>
                          <td class="px-3 py-2 text-right">
                            <span v-if="day.rate" class="font-semibold text-blue-700 dark:text-blue-300">{{ formatPrice(day.b2bPrice || 0) }}</span>
                            <span v-else class="text-red-400">-</span>
                          </td>
                          <td class="px-3 py-2 text-right">
                            <span v-if="day.rate" class="font-semibold text-green-700 dark:text-green-300">{{ formatPrice(day.b2cPrice || 0) }}</span>
                            <span v-else class="text-red-400">-</span>
                          </td>
                          <td class="px-3 py-2 text-center">
                            <span v-if="!day.rate" class="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-slate-600 text-gray-500 rounded">YOK</span>
                            <span v-else-if="day.hasIssue" class="text-[10px] px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 font-medium rounded">
                              {{ day.rate?.stopSale ? 'STOP' : day.rate?.closedToArrival && day.isCheckIn ? 'CTA' : day.minStayIssue ? 'MIN' : '!' }}
                            </span>
                            <span v-else class="material-icons text-green-500 text-sm">check_circle</span>
                          </td>
                        </tr>
                      </tbody>
                      <tfoot class="sticky bottom-0">
                        <tr class="bg-gray-100 dark:bg-slate-700 font-bold border-t-2 border-gray-300 dark:border-slate-500">
                          <td class="px-3 py-2 text-gray-800 dark:text-white">TOPLAM</td>
                          <td class="px-3 py-2 text-right text-gray-700 dark:text-gray-200">{{ formatPrice(getTierPricing(getExpandedMealPlanData(roomResult)).hotelCost) }}</td>
                          <td class="px-3 py-2 text-right text-blue-700 dark:text-blue-300">{{ formatPrice(getTierPricing(getExpandedMealPlanData(roomResult)).b2bPrice) }}</td>
                          <td class="px-3 py-2 text-right text-green-700 dark:text-green-300">{{ formatPrice(getTierPricing(getExpandedMealPlanData(roomResult)).b2cPrice) }}</td>
                          <td class="px-3 py-2"></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            <!-- Legend - only show when there are results -->
            <div v-if="results.length > 0" class="mt-4 p-3 bg-gray-50 dark:bg-slate-800/50 rounded-xl">
              <div class="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-600 dark:text-slate-400">
                <span class="flex items-center gap-1">
                  <span class="material-icons text-green-500 text-sm">check_circle</span>
                  Müsait
                </span>
                <span class="flex items-center gap-1">
                  <span class="material-icons text-amber-500 text-sm">warning</span>
                  Kısıtlı
                </span>
                <span class="flex items-center gap-1">
                  <span class="px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded text-[10px] font-bold">OBP</span>
                  Kişi Bazlı
                </span>
                <span class="flex items-center gap-1">
                  <span class="px-1.5 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded text-[10px] font-bold">-%</span>
                  Kampanya
                </span>
              </div>
            </div>

            <!-- No Results -->
            <div v-if="results.length === 0" class="flex flex-col items-center justify-center py-16">
              <div class="w-20 h-20 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center mb-4">
                <span class="material-icons text-4xl text-gray-400 dark:text-slate-500">search_off</span>
              </div>
              <h3 class="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Sonuç Bulunamadı</h3>
              <p class="text-gray-500 dark:text-slate-400 text-center max-w-sm">
                Seçilen tarih aralığında uygun oda veya fiyat bulunamadı. Farklı tarihler deneyin.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import planningService from '@/services/planningService'
import DateRangePicker from '@/components/common/DateRangePicker.vue'

const { t, locale } = useI18n()

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  hotelId: { type: String, required: true },
  hotelName: { type: String, default: '' },
  roomTypes: { type: Array, default: () => [] },
  mealPlans: { type: Array, default: () => [] },
  markets: { type: Array, default: () => [] },
  initialMonth: { type: Object, default: null } // { year: 2025, month: 6 }
})

const emit = defineEmits(['update:modelValue'])

const loading = ref(false)
const searched = ref(false)
const results = ref([])

// Draggable modal
const modalRef = ref(null)
const isDragging = ref(false)
const dragOffset = ref({ x: 0, y: 0 })
const modalPosition = ref({ x: 0, y: 0 })
const isPositioned = ref(false)

const modalStyle = computed(() => {
  if (!isPositioned.value) {
    return {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)'
    }
  }
  return {
    top: `${modalPosition.value.y}px`,
    left: `${modalPosition.value.x}px`,
    transform: 'none'
  }
})

const startDrag = (e) => {
  if (!modalRef.value) return
  isDragging.value = true

  const rect = modalRef.value.getBoundingClientRect()

  // If first drag, set initial position
  if (!isPositioned.value) {
    modalPosition.value = {
      x: rect.left,
      y: rect.top
    }
    isPositioned.value = true
  }

  dragOffset.value = {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  }

  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
}

const onDrag = (e) => {
  if (!isDragging.value) return

  const newX = e.clientX - dragOffset.value.x
  const newY = e.clientY - dragOffset.value.y

  // Keep modal within viewport
  const maxX = window.innerWidth - (modalRef.value?.offsetWidth || 0)
  const maxY = window.innerHeight - (modalRef.value?.offsetHeight || 0)

  modalPosition.value = {
    x: Math.max(0, Math.min(newX, maxX)),
    y: Math.max(0, Math.min(newY, maxY))
  }
}

const stopDrag = () => {
  isDragging.value = false
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
}

// Clean up on unmount
onUnmounted(() => {
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
})

// Expanded row tracking (roomTypeId + mealPlanId)
const expandedRow = ref(null)

const toggleDetails = (roomTypeId, mealPlanId) => {
  const key = `${roomTypeId}-${mealPlanId}`
  if (expandedRow.value === key) {
    expandedRow.value = null
  } else {
    expandedRow.value = key
  }
}

const isExpanded = (roomTypeId, mealPlanId) => {
  return expandedRow.value === `${roomTypeId}-${mealPlanId}`
}

const getExpandedMealPlan = (roomTypeId) => {
  if (!expandedRow.value) return null
  const [rtId] = expandedRow.value.split('-')
  if (rtId !== roomTypeId) return null
  return expandedRow.value
}

const getExpandedMealPlanData = (roomResult) => {
  if (!expandedRow.value) return null
  const [rtId, mpId] = expandedRow.value.split('-')
  if (rtId !== roomResult.roomType._id) return null
  return roomResult.mealPlans.find(mp => mp.mealPlan._id === mpId)
}

// Default market (first one or with isDefault)
const defaultMarket = computed(() => {
  return props.markets.find(m => m.isDefault) || props.markets[0]
})

const currency = computed(() => defaultMarket.value?.currency || 'EUR')

// Sales settings from market for 3-tier pricing calculation
const salesSettings = computed(() => ({
  workingMode: defaultMarket.value?.workingMode || 'net',
  commissionRate: defaultMarket.value?.commissionRate || 10,
  markup: {
    b2c: defaultMarket.value?.markup?.b2c || 0,
    b2b: defaultMarket.value?.markup?.b2b || 0
  },
  agencyCommission: defaultMarket.value?.agencyCommission || 10
}))

// Get 3-tier pricing from meal plan result (calculated by API)
const getTierPricing = (mpResult) => {
  // Return API-calculated tier pricing
  return mpResult.tierPricing || {
    hotelCost: 0,
    b2cPrice: 0,
    b2bPrice: 0
  }
}

// Date range for DateRangePicker
const dateRange = ref({ start: '', end: '' })

// Query state
const query = ref({
  adults: 2,
  childrenCount: 0,
  childAges: []
})

// Set default dates based on initialMonth or current date
const setDefaultDates = () => {
  const formatDate = (date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  let startDate, endDate

  if (props.initialMonth) {
    // Use the calendar's current month
    const year = props.initialMonth.year
    const month = props.initialMonth.month - 1 // JavaScript months are 0-indexed

    // Start from the 1st of the month (or today if current month and past the 1st)
    const today = new Date()
    const firstOfMonth = new Date(year, month, 1)

    if (year === today.getFullYear() && month === today.getMonth()) {
      // Current month - start from tomorrow
      startDate = new Date(today)
      startDate.setDate(startDate.getDate() + 1)
    } else if (firstOfMonth > today) {
      // Future month - start from the 1st
      startDate = firstOfMonth
    } else {
      // Past month - still use 1st (user may want to check historical)
      startDate = firstOfMonth
    }

    // End date: 2 nights later
    endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + 2)
  } else {
    // Fallback to tomorrow + 2 nights
    const today = new Date()
    startDate = new Date(today)
    startDate.setDate(startDate.getDate() + 1)
    endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + 2)
  }

  dateRange.value = {
    start: formatDate(startDate),
    end: formatDate(endDate)
  }
}

// Computed
const isQueryValid = computed(() => {
  return dateRange.value.start &&
    dateRange.value.end &&
    dateRange.value.start < dateRange.value.end &&
    query.value.adults > 0
})

const nights = computed(() => {
  if (!dateRange.value.start || !dateRange.value.end) return 0
  const start = new Date(dateRange.value.start)
  const end = new Date(dateRange.value.end)
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24))
})

const hasExtraAdults = computed(() => {
  return query.value.adults > 2
})

const hasSingleSupplement = computed(() => {
  return query.value.adults === 1
})

// Methods
const updateChildCount = (count) => {
  const newCount = Math.max(0, Math.min(6, count))
  query.value.childrenCount = newCount

  while (query.value.childAges.length < newCount) {
    query.value.childAges.push(5)
  }
  query.value.childAges = query.value.childAges.slice(0, newCount)
}

const getRoomTypeName = (roomType) => {
  if (!roomType) return ''
  return roomType.name?.[locale.value] || roomType.name?.tr || roomType.name?.en || roomType.code
}

const getMealPlanName = (mealPlan) => {
  if (!mealPlan) return ''
  return mealPlan.name?.[locale.value] || mealPlan.name?.tr || mealPlan.name?.en || mealPlan.code
}

const getCampaignName = (campaign) => {
  if (!campaign) return ''
  return campaign.name?.[locale.value] || campaign.name?.tr || campaign.name?.en || campaign.code
}

// API base URL for images
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://api.minires.com/api'
const imageBaseUrl = apiBaseUrl.replace('/api', '')

const getRoomImage = (roomType) => {
  if (!roomType) return null
  // Check for images array
  if (roomType.images?.length > 0) {
    const mainImage = roomType.images.find(img => img.isMain) || roomType.images[0]
    const imageUrl = mainImage?.url || mainImage
    if (imageUrl) {
      // If URL is relative, prepend the base URL
      if (imageUrl.startsWith('/')) {
        return imageBaseUrl + imageUrl
      }
      return imageUrl
    }
  }
  // Check for single image field
  if (roomType.image) {
    if (roomType.image.startsWith('/')) {
      return imageBaseUrl + roomType.image
    }
    return roomType.image
  }
  return null
}

const formatPrice = (price) => {
  return Math.round(price).toLocaleString('tr-TR')
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })
}

const getDayName = (dateStr) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('tr-TR', { weekday: 'short' })
}

const getMealPlanBadgeClass = (code) => {
  const colors = {
    'RO': 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
    'BB': 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300',
    'HB': 'bg-orange-100 dark:bg-orange-900/50 text-orange-700 dark:text-orange-300',
    'FB': 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300',
    'AI': 'bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300',
    'UAI': 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300'
  }
  return colors[code] || 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
}

const getIssueClass = (type) => {
  const classes = {
    'stop_sale': 'text-red-600 dark:text-red-400',
    'single_stop': 'text-pink-600 dark:text-pink-400',
    'cta': 'text-orange-600 dark:text-orange-400',
    'ctd': 'text-orange-600 dark:text-orange-400',
    'min_stay': 'text-purple-600 dark:text-purple-400',
    'no_rate': 'text-gray-600 dark:text-gray-400',
    'capacity': 'text-rose-600 dark:text-rose-400'
  }
  return classes[type] || 'text-gray-600 dark:text-gray-400'
}

const getIssueIcon = (type) => {
  const icons = {
    'stop_sale': 'block',
    'single_stop': 'person_off',
    'cta': 'no_meeting_room',
    'ctd': 'logout',
    'min_stay': 'nights_stay',
    'no_rate': 'money_off',
    'capacity': 'group_off'
  }
  return icons[type] || 'error'
}

const getUniqueIssueTypes = (issues) => {
  const types = new Set()
  issues.forEach(issue => types.add(issue.type))
  return Array.from(types)
}

const getIssueBadgeClass = (type) => {
  const classes = {
    'stop_sale': 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    'single_stop': 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400',
    'cta': 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
    'ctd': 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
    'min_stay': 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    'no_rate': 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400',
    'capacity': 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
  }
  return classes[type] || 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
}

const getIssueShortLabel = (type) => {
  const labels = {
    'stop_sale': 'STOP',
    'single_stop': '1P',
    'cta': 'CTA',
    'ctd': 'CTD',
    'min_stay': 'MIN',
    'no_rate': '-',
    'capacity': 'KAP'
  }
  return labels[type] || '?'
}

const searchAvailability = async () => {
  if (!isQueryValid.value) return

  loading.value = true
  searched.value = true
  results.value = []
  expandedRow.value = null

  try {
    // Build list of all room type + meal plan combinations to query
    const queries = []
    for (const roomType of props.roomTypes) {
      for (const mealPlan of props.mealPlans) {
        queries.push({
          roomTypeId: roomType._id,
          mealPlanId: mealPlan._id,
          roomType,
          mealPlan
        })
      }
    }

    // Prepare children data for API
    const childrenData = query.value.childAges.slice(0, query.value.childrenCount).map((age, index) => ({
      age,
      order: index + 1
    }))

    // Call API for each combination in parallel
    const apiPromises = queries.map(q =>
      planningService.calculatePriceWithCampaigns(props.hotelId, {
        roomTypeId: q.roomTypeId,
        mealPlanId: q.mealPlanId,
        marketId: defaultMarket.value?._id,
        checkInDate: dateRange.value.start,
        checkOutDate: dateRange.value.end,
        adults: query.value.adults,
        children: childrenData,
        includeCampaigns: true
      }).then(response => {
        const result = response.data?.data || response.data || response
        console.log('API Response for', q.roomTypeId, q.mealPlanId, ':', result)
        console.log('Daily breakdown sample:', result?.dailyBreakdown?.[0])
        return { ...q, result }
      }).catch(error => ({
        ...q,
        error: error.response?.data?.message || error.message
      }))
    )

    const apiResults = await Promise.all(apiPromises)

    // Group results by room type
    const roomTypeMap = new Map()
    for (const roomType of props.roomTypes) {
      roomTypeMap.set(roomType._id, {
        roomType,
        mealPlans: []
      })
    }

    // Process API results
    for (const apiResult of apiResults) {
      const roomResult = roomTypeMap.get(apiResult.roomTypeId)
      if (!roomResult) continue

      // Transform API result to UI format
      const mpResult = transformApiResultToMpResult(apiResult)
      roomResult.mealPlans.push(mpResult)
    }

    // Convert map to results array
    results.value = Array.from(roomTypeMap.values())

  } catch (error) {
    console.error('Search error:', error)
  } finally {
    loading.value = false
  }
}

/**
 * Transform API result to meal plan result format for UI
 */
const transformApiResultToMpResult = (apiResult) => {
  const { mealPlan, result, error } = apiResult

  // Handle API error
  if (error) {
    return {
      mealPlan,
      hasRates: false,
      available: false,
      totalPrice: 0,
      avgPerNight: 0,
      issues: [{ type: 'api_error', date: null, message: error }],
      dailyBreakdown: [],
      capacityExceeded: error === 'BELOW_MIN_ADULTS' || error.includes('Minimum'),
      tierPricing: { hotelCost: 0, b2cPrice: 0, b2bPrice: 0 }
    }
  }

  // Handle capacity exceeded (from API)
  if (!result.success && result.error === 'BELOW_MIN_ADULTS') {
    return {
      mealPlan,
      hasRates: false,
      available: false,
      totalPrice: 0,
      avgPerNight: 0,
      issues: [{
        type: 'capacity',
        date: null,
        message: result.message || `Minimum ${result.minAdults} yetişkin gerekli`
      }],
      dailyBreakdown: [],
      capacityExceeded: true,
      tierPricing: { hotelCost: 0, b2cPrice: 0, b2bPrice: 0 }
    }
  }

  // Handle no rates found
  if (!result.success || !result.dailyBreakdown) {
    return {
      mealPlan,
      hasRates: false,
      available: false,
      totalPrice: 0,
      avgPerNight: 0,
      issues: [{ type: 'no_rate', date: null, message: result.error || 'Fiyat bulunamadı' }],
      dailyBreakdown: [],
      capacityExceeded: false,
      tierPricing: { hotelCost: 0, b2cPrice: 0, b2bPrice: 0 }
    }
  }

  // Transform daily breakdown
  const dailyBreakdown = result.dailyBreakdown.map((day, idx) => ({
    date: day.date,
    rate: day.hasRate ? day : null,
    basePrice: day.basePrice || day.price || 0,
    extraAdultPrice: day.adultPrice - (day.basePrice || 0) > 0 ? day.adultPrice - day.basePrice : 0,
    childrenPrice: day.childPrice || 0,
    singleSupplementPrice: 0,
    obpPrice: day.pricingType === 'per_person' ? day.price : null,
    dailyTotal: day.price || 0,
    hasIssue: day.hasIssue || false,
    isCheckIn: idx === 0,
    isCheckOut: idx === result.dailyBreakdown.length - 1,
    minStayIssue: day.restrictions?.minStay || false,
    // 3-tier pricing from API
    hotelCost: day.hotelCost || 0,
    b2cPrice: day.b2cPrice || 0,
    b2bPrice: day.b2bPrice || 0,
    // Campaign info
    campaignApplied: day.campaignApplied || false,
    discountAmount: day.discountAmount || 0,
    isFreeNight: day.isFreeNight || false,
    appliedCampaigns: day.appliedCampaigns || []
  }))

  // Build issues array from availability
  const issues = []
  if (result.availability?.issues) {
    for (const issue of result.availability.issues) {
      issues.push({
        type: issue.type === 'restriction' ? getIssueTypeFromMessage(issue.message) : issue.type,
        date: issue.date,
        message: issue.message
      })
    }
  }

  // Get campaign info
  const appliedCampaigns = result.campaigns?.applied || []
  const campaign = appliedCampaigns.length > 0 ? appliedCampaigns[0] : null
  const discountText = appliedCampaigns.map(c => c.discountText).join(' + ')

  // Determine pricing type from daily breakdown
  const isOBP = result.dailyBreakdown.some(d => d.pricingType === 'per_person')
  const isMultiplierOBP = isOBP && result.dailyBreakdown.some(d => d.multiplier !== undefined)

  return {
    mealPlan,
    hasRates: result.dailyBreakdown.some(d => d.hasRate),
    available: result.availability?.isAvailable ?? true,
    // Prices from API
    originalPrice: result.pricing?.originalTotal || 0,
    totalPrice: result.pricing?.finalTotal || 0,
    avgPerNight: result.pricing?.avgPerNight || 0,
    // 3-tier pricing from API (aggregated totals)
    tierPricing: {
      hotelCost: result.pricing?.hotelCost || 0,
      b2cPrice: result.pricing?.b2cPrice || 0,
      b2bPrice: result.pricing?.b2bPrice || 0
    },
    // Per night tier pricing
    tierPricingPerNight: result.pricing?.perNight || {
      hotelCost: 0,
      b2cPrice: 0,
      b2bPrice: 0
    },
    // Sales settings info
    salesSettings: result.salesSettings || {},
    // Issues and availability
    issues,
    dailyBreakdown,
    capacityExceeded: false,
    // Pricing type
    isOBP,
    isMultiplierOBP,
    // Totals (for backward compatibility with UI)
    totals: {
      basePrice: result.pricing?.originalTotal || 0,
      extraAdult: 0,
      children: 0,
      singleSupplement: 0,
      obpTotal: isOBP ? result.pricing?.originalTotal || 0 : 0
    },
    // Campaign info
    campaign,
    campaigns: appliedCampaigns,
    discountText,
    discountAmount: result.campaigns?.totalDiscount || 0,
    totalDiscountAmount: result.campaigns?.totalDiscount || 0,
    // Non-refundable pricing
    nonRefundable: result.nonRefundable || { enabled: false }
  }
}

/**
 * Map error message to issue type
 */
const getIssueTypeFromMessage = (message) => {
  if (message?.includes('Stop sale') || message?.includes('Satış kapalı')) return 'stop_sale'
  if (message?.includes('Single') || message?.includes('Tek kişi')) return 'single_stop'
  if (message?.includes('Arrival') || message?.includes('giriş')) return 'cta'
  if (message?.includes('Departure') || message?.includes('çıkış')) return 'ctd'
  if (message?.includes('Minimum') || message?.includes('minimum')) return 'min_stay'
  if (message?.includes('No rate') || message?.includes('tanımlı değil')) return 'no_rate'
  return 'restriction'
}

// Reset on modal open
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    setDefaultDates()
    searched.value = false
    results.value = []
    expandedRow.value = null
    // Reset position
    isPositioned.value = false
  }
})

// Initial setup
setDefaultDates()
</script>
