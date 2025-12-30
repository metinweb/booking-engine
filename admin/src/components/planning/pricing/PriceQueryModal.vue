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
              <div class="grid gap-2 p-3 overflow-x-auto" :style="{ gridTemplateColumns: `repeat(${mealPlans.length}, minmax(120px, 1fr))` }">
                <div
                  v-for="mpResult in roomResult.mealPlans"
                  :key="mpResult.mealPlan._id"
                  class="relative p-3 rounded-xl cursor-pointer transition-all hover:shadow-md"
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
                  <div v-else class="text-center">
                    <!-- Campaign Discount Badge -->
                    <div v-if="mpResult.campaign" class="absolute -top-2 -right-2 z-10">
                      <span class="px-2 py-0.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] font-bold rounded-full shadow-lg">
                        {{ mpResult.discountText }}
                      </span>
                    </div>

                    <!-- Original Price (if campaign) -->
                    <div v-if="mpResult.campaign" class="text-sm text-gray-400 line-through mb-0.5">
                      {{ formatPrice(mpResult.originalPrice) }} {{ currency }}
                    </div>

                    <!-- Main Price -->
                    <div
                      class="text-xl font-bold"
                      :class="mpResult.available ? (mpResult.campaign ? 'text-green-600' : 'text-gray-900 dark:text-white') : 'text-gray-400 line-through'"
                    >
                      {{ formatPrice(mpResult.totalPrice) }}
                      <span class="text-sm font-normal text-gray-500">{{ currency }}</span>
                    </div>

                    <!-- Per Night -->
                    <div class="text-xs text-gray-500 dark:text-slate-400 mt-1">
                      {{ formatPrice(mpResult.avgPerNight) }} {{ currency }} / gece
                    </div>

                    <!-- Availability Status -->
                    <div class="flex items-center justify-center gap-1 mt-2">
                      <span
                        class="material-icons text-sm"
                        :class="mpResult.available ? 'text-green-500' : 'text-amber-500'"
                      >
                        {{ mpResult.available ? 'check_circle' : 'warning' }}
                      </span>
                      <span
                        class="text-xs font-medium"
                        :class="mpResult.available ? 'text-green-600' : 'text-amber-600'"
                      >
                        {{ mpResult.available ? 'Müsait' : 'Kısıtlı' }}
                      </span>
                    </div>

                    <!-- OBP Badge -->
                    <div v-if="mpResult.isOBP" class="mt-2">
                      <span class="px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 text-[10px] font-bold rounded">
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

                <!-- Summary Cards -->
                <div class="grid grid-cols-4 gap-3 mb-4">
                  <!-- Total Price -->
                  <div class="bg-white dark:bg-slate-800 rounded-xl p-3 text-center shadow-sm">
                    <div class="text-xs text-gray-500 mb-1">Toplam</div>
                    <div v-if="getExpandedMealPlanData(roomResult)?.campaign" class="text-xs text-gray-400 line-through">
                      {{ formatPrice(getExpandedMealPlanData(roomResult)?.originalPrice || 0) }} {{ currency }}
                    </div>
                    <div class="text-lg font-bold text-green-600">
                      {{ formatPrice(getExpandedMealPlanData(roomResult)?.totalPrice || 0) }} {{ currency }}
                    </div>
                  </div>
                  <!-- Per Night -->
                  <div class="bg-white dark:bg-slate-800 rounded-xl p-3 text-center shadow-sm">
                    <div class="text-xs text-gray-500 mb-1">Gecelik</div>
                    <div class="text-lg font-bold text-blue-600">
                      {{ formatPrice(getExpandedMealPlanData(roomResult)?.avgPerNight || 0) }} {{ currency }}
                    </div>
                  </div>
                  <!-- Status -->
                  <div class="bg-white dark:bg-slate-800 rounded-xl p-3 text-center shadow-sm">
                    <div class="text-xs text-gray-500 mb-1">Durum</div>
                    <div class="flex items-center justify-center gap-1">
                      <span
                        class="material-icons"
                        :class="getExpandedMealPlanData(roomResult)?.available ? 'text-green-500' : 'text-red-500'"
                      >
                        {{ getExpandedMealPlanData(roomResult)?.available ? 'check_circle' : 'cancel' }}
                      </span>
                      <span
                        class="font-bold"
                        :class="getExpandedMealPlanData(roomResult)?.available ? 'text-green-600' : 'text-red-600'"
                      >
                        {{ getExpandedMealPlanData(roomResult)?.available ? 'Müsait' : 'Yok' }}
                      </span>
                    </div>
                  </div>
                  <!-- Campaign -->
                  <div v-if="getExpandedMealPlanData(roomResult)?.campaign" class="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3 text-center shadow-sm">
                    <div class="text-xs text-purple-600 mb-1">Kampanya</div>
                    <div class="text-lg font-bold text-purple-600">
                      {{ getExpandedMealPlanData(roomResult).discountText }}
                    </div>
                  </div>
                  <div v-else class="bg-white dark:bg-slate-800 rounded-xl p-3 text-center shadow-sm">
                    <div class="text-xs text-gray-500 mb-1">Gece</div>
                    <div class="text-lg font-bold text-gray-800 dark:text-white">{{ nights }}</div>
                  </div>
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

                <!-- Daily Breakdown Table -->
                <div class="bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-gray-200 dark:border-slate-600">
                  <div class="px-3 py-2 bg-gray-100 dark:bg-slate-700 border-b border-gray-200 dark:border-slate-600">
                    <h4 class="font-medium text-gray-800 dark:text-white text-sm flex items-center gap-2">
                      <span class="material-icons text-sm">calendar_month</span>
                      Günlük Fiyat Detayı
                    </h4>
                  </div>
                  <div class="overflow-x-auto max-h-[250px] overflow-y-auto">
                    <table class="w-full text-xs">
                      <thead class="sticky top-0 z-10">
                        <tr class="bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400">
                          <th class="px-2 py-1.5 text-left font-medium">Tarih</th>
                          <th v-if="getExpandedMealPlanData(roomResult)?.isOBP" class="px-2 py-1.5 text-center font-medium">{{ query.adults }}P</th>
                          <template v-else>
                            <th class="px-2 py-1.5 text-center font-medium">Baz</th>
                            <th v-if="hasExtraAdults" class="px-2 py-1.5 text-center font-medium">+Yt</th>
                          </template>
                          <th v-if="query.childrenCount > 0" class="px-2 py-1.5 text-center font-medium">Çc</th>
                          <th class="px-2 py-1.5 text-center font-medium">Toplam</th>
                          <th class="px-2 py-1.5 text-center font-medium w-16"></th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr
                          v-for="(day, idx) in getExpandedMealPlanData(roomResult)?.dailyBreakdown || []"
                          :key="idx"
                          class="border-b border-gray-100 dark:border-slate-700"
                          :class="day.hasIssue ? 'bg-red-50 dark:bg-red-900/10' : ''"
                        >
                          <td class="px-2 py-1.5">
                            <span class="font-medium text-gray-900 dark:text-white">{{ formatDate(day.date) }}</span>
                          </td>
                          <td v-if="getExpandedMealPlanData(roomResult)?.isOBP" class="px-2 py-1.5 text-center">
                            <span v-if="day.rate && day.obpPrice !== null" class="font-medium">{{ day.obpPrice }} {{ currency }}</span>
                            <span v-else class="text-red-500">-</span>
                          </td>
                          <template v-else>
                            <td class="px-2 py-1.5 text-center">
                              <span v-if="day.rate" class="font-medium">{{ day.basePrice }}</span>
                              <span v-else class="text-red-500">-</span>
                            </td>
                            <td v-if="hasExtraAdults" class="px-2 py-1.5 text-center text-amber-600">
                              {{ day.extraAdultPrice > 0 ? '+' + day.extraAdultPrice : '-' }}
                            </td>
                          </template>
                          <td v-if="query.childrenCount > 0" class="px-2 py-1.5 text-center">
                            <span v-if="day.childrenPrice > 0" class="text-pink-600">+{{ day.childrenPrice }}</span>
                            <span v-else-if="day.isMultiplierOBP && day.rate" class="text-purple-500 text-[10px]">Dahil</span>
                            <span v-else class="text-gray-400">-</span>
                          </td>
                          <td class="px-2 py-1.5 text-center">
                            <template v-if="day.rate">
                              <span v-if="day.campaignApplied" class="text-green-600 font-bold">{{ day.isFreeNight ? 'FREE' : Math.round(day.dailyTotal) }}</span>
                              <span v-else class="font-bold text-gray-900 dark:text-white">{{ Math.round(day.dailyTotal) }}</span>
                            </template>
                            <span v-else class="text-red-500">-</span>
                          </td>
                          <td class="px-2 py-1.5 text-center">
                            <span v-if="!day.rate" class="text-[10px] text-gray-400">Yok</span>
                            <span v-else-if="day.hasIssue" class="text-[10px] text-red-500 font-medium">
                              {{ day.rate?.stopSale ? 'STOP' : day.rate?.closedToArrival && day.isCheckIn ? 'CTA' : day.minStayIssue ? 'Min' + day.rate?.minStay : '!' }}
                            </span>
                            <span v-else class="material-icons text-green-500 text-xs">check</span>
                          </td>
                        </tr>
                      </tbody>
                      <tfoot>
                        <tr class="bg-green-50 dark:bg-green-900/20 font-bold sticky bottom-0">
                          <td class="px-2 py-1.5 text-gray-900 dark:text-white">TOPLAM</td>
                          <td v-if="getExpandedMealPlanData(roomResult)?.isOBP" class="px-2 py-1.5 text-center">
                            {{ getExpandedMealPlanData(roomResult)?.totals?.obpTotal || 0 }}
                          </td>
                          <template v-else>
                            <td class="px-2 py-1.5 text-center">{{ getExpandedMealPlanData(roomResult)?.totals?.basePrice || 0 }}</td>
                            <td v-if="hasExtraAdults" class="px-2 py-1.5 text-center text-amber-600">+{{ getExpandedMealPlanData(roomResult)?.totals?.extraAdult || 0 }}</td>
                          </template>
                          <td v-if="query.childrenCount > 0" class="px-2 py-1.5 text-center text-pink-600">
                            {{ getExpandedMealPlanData(roomResult)?.isMultiplierOBP ? 'Dahil' : '+' + (getExpandedMealPlanData(roomResult)?.totals?.children || 0) }}
                          </td>
                          <td class="px-2 py-1.5 text-center text-green-600">{{ getExpandedMealPlanData(roomResult)?.totalPrice || 0 }} {{ currency }}</td>
                          <td class="px-2 py-1.5"></td>
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
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api'
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
    const [ratesResponse, campaignsResponse] = await Promise.all([
      planningService.getRatesCalendar(props.hotelId, {
        startDate: dateRange.value.start,
        endDate: dateRange.value.end,
        market: defaultMarket.value?._id
      }),
      planningService.getCampaigns(props.hotelId, { status: 'active' })
    ])

    const rates = ratesResponse.data?.rates || []
    const allCampaigns = campaignsResponse.data || []

    const today = new Date()
    const checkInDate = new Date(dateRange.value.start)
    const checkOutDate = new Date(dateRange.value.end)

    const applicableCampaigns = allCampaigns.filter(campaign => {
      const bookingStart = new Date(campaign.bookingWindow?.startDate)
      const bookingEnd = new Date(campaign.bookingWindow?.endDate)
      if (today < bookingStart || today > bookingEnd) return false

      const stayStart = new Date(campaign.stayWindow?.startDate)
      const stayEnd = new Date(campaign.stayWindow?.endDate)
      if (checkOutDate < stayStart || checkInDate > stayEnd) return false

      if (campaign.conditions?.minNights && nights.value < campaign.conditions.minNights) return false
      if (campaign.conditions?.maxNights && nights.value > campaign.conditions.maxNights) return false

      if (campaign.conditions?.applicableMarkets?.length > 0) {
        const marketIds = campaign.conditions.applicableMarkets.map(m => m._id || m)
        if (!marketIds.includes(defaultMarket.value?._id)) return false
      }

      return true
    })

    const dates = []
    const current = new Date(dateRange.value.start)
    const end = new Date(dateRange.value.end)
    while (current < end) {
      dates.push(current.toISOString().split('T')[0])
      current.setDate(current.getDate() + 1)
    }

    for (const roomType of props.roomTypes) {
      const roomResult = {
        roomType,
        mealPlans: []
      }

      const maxAdults = roomType.occupancy?.maxAdults || 2
      const minAdults = roomType.occupancy?.minAdults || 1
      const maxChildren = roomType.occupancy?.maxChildren || 2
      const maxOccupancy = roomType.occupancy?.totalMaxGuests || (maxAdults + maxChildren)
      const baseOccupancy = roomType.occupancy?.baseOccupancy || maxAdults

      const totalPax = query.value.adults + query.value.childrenCount
      // Check both min and max adults capacity
      const belowMinAdults = query.value.adults < minAdults
      const capacityExceeded = totalPax > maxOccupancy || query.value.adults > maxAdults || belowMinAdults

      for (const mealPlan of props.mealPlans) {
        const mpResult = {
          mealPlan,
          hasRates: false,
          available: !capacityExceeded,
          totalPrice: 0,
          avgPerNight: 0,
          issues: [],
          dailyBreakdown: [],
          capacityExceeded
        }

        if (capacityExceeded) {
          if (belowMinAdults) {
            mpResult.issues.push({
              type: 'capacity',
              date: null,
              message: `Minimum ${minAdults} yetişkin gerekli`
            })
          }
          if (query.value.adults > maxAdults) {
            mpResult.issues.push({
              type: 'capacity',
              date: null,
              message: `Maksimum ${maxAdults} yetişkin kabul edilir`
            })
          }
          if (totalPax > maxOccupancy) {
            mpResult.issues.push({
              type: 'capacity',
              date: null,
              message: `Maksimum kapasite ${maxOccupancy} kişi`
            })
          }
          mpResult.hasRates = false
          mpResult.totalPrice = 0
          mpResult.avgPerNight = 0
          roomResult.mealPlans.push(mpResult)
          continue
        }

        let totalBase = 0
        let totalExtraAdult = 0
        let totalChildren = 0
        let totalSingleSupplement = 0
        let totalOBP = 0
        let hasAnyRate = false
        let isOBPRate = false
        const isMultiplierOBPRoom = roomType.pricingType === 'per_person' && roomType.useMultipliers === true

        for (let i = 0; i < dates.length; i++) {
          const dateStr = dates[i]
          const isCheckIn = i === 0
          const isCheckOut = i === dates.length - 1

          const rate = rates.find(r => {
            const rtId = r.roomType?._id || r.roomType
            const mpId = r.mealPlan?._id || r.mealPlan
            const rateDateStr = r.date?.substring?.(0, 10) || ''
            return rtId === roomType._id && mpId === mealPlan._id && rateDateStr === dateStr
          })

          const dayData = {
            date: dateStr,
            rate: rate,
            basePrice: 0,
            extraAdultPrice: 0,
            childrenPrice: 0,
            singleSupplementPrice: 0,
            obpPrice: null,
            dailyTotal: 0,
            hasIssue: false,
            isCheckIn,
            isCheckOut,
            minStayIssue: false
          }

          if (rate) {
            hasAnyRate = true

            const isOBP = rate.pricingType === 'per_person'
            const isMultiplierOBP = isOBP && roomType.useMultipliers === true
            if (isOBP) isOBPRate = true

            if (isMultiplierOBP) {
              // Multiplier OBP: use pricePerNight as base price and apply multiplier
              const basePrice = rate.pricePerNight || 0

              if (basePrice > 0) {
                // Find the appropriate multiplier from roomType's multiplierTemplate
                const multiplierTemplate = roomType.multiplierTemplate || {}
                const adultMultipliers = multiplierTemplate.adultMultipliers || {}

                // Get multiplier for the requested number of adults
                const adultMultiplier = adultMultipliers[query.value.adults] || adultMultipliers[String(query.value.adults)] || 1

                // Calculate children multipliers if any
                let childMultiplier = 0
                if (query.value.childrenCount > 0 && multiplierTemplate.childMultipliers) {
                  const childMults = multiplierTemplate.childMultipliers
                  for (let c = 0; c < query.value.childrenCount; c++) {
                    const childOrder = c + 1
                    const childAge = query.value.childAges?.[c] || 0

                    // Determine age group
                    let ageGroup = 'first'
                    const childAgeGroups = props.childAgeGroups || []
                    for (const ag of childAgeGroups) {
                      if (childAge >= ag.minAge && childAge <= ag.maxAge) {
                        ageGroup = ag.code
                        break
                      }
                    }

                    // Get child multiplier
                    const orderMults = childMults[childOrder] || childMults[String(childOrder)] || {}
                    const mult = orderMults[ageGroup] || 0
                    childMultiplier += mult
                  }
                }

                const totalMultiplier = adultMultiplier + childMultiplier
                const calculatedPrice = Math.round(basePrice * totalMultiplier)

                dayData.obpPrice = calculatedPrice
                dayData.basePrice = calculatedPrice
                dayData.multiplierInfo = { basePrice, adultMultiplier, childMultiplier, totalMultiplier }
                totalOBP += calculatedPrice
                totalBase += calculatedPrice
              } else {
                dayData.obpPrice = null
                dayData.hasIssue = true
                mpResult.available = false
                mpResult.issues.push({
                  type: 'no_rate',
                  date: dateStr,
                  message: `Baz fiyat tanımlı değil`
                })
              }

              dayData.extraAdultPrice = 0
              dayData.singleSupplementPrice = 0
              dayData.childrenPrice = 0
              dayData.isMultiplierOBP = true // Children are included in multiplier calculation

            } else if (isOBP) {
              // Standard OBP: use occupancyPricing directly
              const adultPrice = rate.occupancyPricing?.[query.value.adults]

              if (adultPrice !== undefined && adultPrice !== null) {
                dayData.obpPrice = adultPrice
                dayData.basePrice = adultPrice
                totalOBP += adultPrice
                totalBase += adultPrice
              } else {
                dayData.obpPrice = null
                dayData.hasIssue = true
                mpResult.available = false
                mpResult.issues.push({
                  type: 'no_rate',
                  date: dateStr,
                  message: `${query.value.adults} yetişkin için fiyat tanımlı değil`
                })
              }

              dayData.extraAdultPrice = 0
              dayData.singleSupplementPrice = 0
            } else {
              dayData.basePrice = rate.pricePerNight || 0
              totalBase += dayData.basePrice

              const extraAdults = Math.max(0, query.value.adults - baseOccupancy)
              if (extraAdults > 0 && rate.extraAdult) {
                dayData.extraAdultPrice = extraAdults * rate.extraAdult
                totalExtraAdult += dayData.extraAdultPrice
              }

              if (query.value.adults === 1 && rate.singleSupplement) {
                dayData.singleSupplementPrice = -Math.abs(rate.singleSupplement)
                totalSingleSupplement += dayData.singleSupplementPrice
              }
            }

            // Child pricing - skip for multiplier OBP (children are included in multiplier)
            if (query.value.childrenCount > 0 && !isMultiplierOBP) {
              let childTotal = 0
              for (let c = 0; c < query.value.childrenCount; c++) {
                if (rate.childOrderPricing && rate.childOrderPricing[c] !== undefined) {
                  childTotal += rate.childOrderPricing[c]
                } else if (rate.extraChild) {
                  childTotal += rate.extraChild
                }
              }
              dayData.childrenPrice = childTotal
              totalChildren += childTotal
            }

            // Daily total calculation
            if (isMultiplierOBP && dayData.obpPrice !== null) {
              // Multiplier OBP: obpPrice already includes everything
              dayData.dailyTotal = dayData.obpPrice
            } else if (isOBP && dayData.obpPrice !== null) {
              // Standard OBP: obpPrice + children
              dayData.dailyTotal = dayData.obpPrice + dayData.childrenPrice
            } else if (!isOBP) {
              // Unit pricing
              dayData.dailyTotal = dayData.basePrice + dayData.extraAdultPrice + dayData.childrenPrice + dayData.singleSupplementPrice
            } else {
              dayData.dailyTotal = 0
            }

            if (rate.stopSale) {
              dayData.hasIssue = true
              mpResult.available = false
              mpResult.issues.push({ type: 'stop_sale', date: dateStr, message: 'Satış kapalı' })
            }
            if (rate.singleStop && query.value.adults === 1) {
              dayData.hasIssue = true
              mpResult.available = false
              mpResult.issues.push({ type: 'single_stop', date: dateStr, message: 'Tek kişi satışı kapalı' })
            }
            if (rate.closedToArrival && isCheckIn) {
              dayData.hasIssue = true
              mpResult.available = false
              mpResult.issues.push({ type: 'cta', date: dateStr, message: 'Bu tarihte giriş yapılamaz' })
            }
            if (rate.closedToDeparture && isCheckOut) {
              dayData.hasIssue = true
              mpResult.available = false
              mpResult.issues.push({ type: 'ctd', date: dateStr, message: 'Bu tarihte çıkış yapılamaz' })
            }
            if (rate.minStay && nights.value < rate.minStay) {
              dayData.hasIssue = true
              dayData.minStayIssue = true
              mpResult.available = false
              if (!mpResult.issues.find(i => i.type === 'min_stay')) {
                mpResult.issues.push({ type: 'min_stay', date: dateStr, message: `Minimum ${rate.minStay} gece konaklama gerekli` })
              }
            }
          } else {
            dayData.hasIssue = true
            mpResult.available = false
            mpResult.issues.push({ type: 'no_rate', date: dateStr, message: 'Fiyat tanımlı değil' })
          }

          mpResult.dailyBreakdown.push(dayData)
        }

        mpResult.hasRates = hasAnyRate
        mpResult.isOBP = isOBPRate
        mpResult.isMultiplierOBP = isMultiplierOBPRoom

        let originalPrice
        if (isMultiplierOBPRoom) {
          // Multiplier OBP: totalOBP already includes children
          originalPrice = totalOBP
        } else if (isOBPRate) {
          originalPrice = totalOBP + totalChildren
        } else {
          originalPrice = totalBase + totalExtraAdult + totalChildren + totalSingleSupplement
        }

        mpResult.originalPrice = originalPrice
        mpResult.totalPrice = originalPrice
        mpResult.avgPerNight = nights.value > 0 ? mpResult.totalPrice / nights.value : 0
        mpResult.totals = {
          basePrice: totalBase,
          extraAdult: totalExtraAdult,
          children: isMultiplierOBPRoom ? 0 : totalChildren, // Children included in multiplier
          singleSupplement: totalSingleSupplement,
          obpTotal: totalOBP
        }

        const roomCampaigns = applicableCampaigns.filter(campaign => {
          if (campaign.conditions?.applicableRoomTypes?.length > 0) {
            const rtIds = campaign.conditions.applicableRoomTypes.map(rt => rt._id || rt)
            if (!rtIds.includes(roomType._id)) return false
          }
          if (campaign.conditions?.applicableMealPlans?.length > 0) {
            const mpIds = campaign.conditions.applicableMealPlans.map(mp => mp._id || mp)
            if (!mpIds.includes(mealPlan._id)) return false
          }
          return true
        })

        if (roomCampaigns.length > 0 && hasAnyRate && mpResult.originalPrice > 0) {
          const nonCombinableCampaigns = roomCampaigns.filter(c => !c.combinable)
          const combinableCampaigns = roomCampaigns.filter(c => c.combinable)

          let campaignsToApply = []

          if (nonCombinableCampaigns.length > 0) {
            campaignsToApply = [nonCombinableCampaigns[0]]
          } else if (combinableCampaigns.length > 0) {
            campaignsToApply = [...combinableCampaigns].sort((a, b) =>
              (a.calculationOrder || 0) - (b.calculationOrder || 0)
            )
          }

          if (campaignsToApply.length > 0) {
            mpResult.dailyBreakdown.forEach(day => {
              day.originalDailyTotal = day.dailyTotal
              day.appliedCampaigns = []
            })

            mpResult.campaigns = []
            mpResult.totalDiscountAmount = 0
            let currentTotalPrice = mpResult.originalPrice

            for (const campaign of campaignsToApply) {
              const applicationType = campaign.applicationType || 'stay'
              const calculationType = campaign.calculationType || 'cumulative'
              const stayStart = new Date(campaign.stayWindow?.startDate)
              const stayEnd = new Date(campaign.stayWindow?.endDate)
              stayStart.setHours(0, 0, 0, 0)
              stayEnd.setHours(23, 59, 59, 999)

              let eligibleNights = 0
              let eligibleTotal = 0
              const eligibleDayIndices = []

              if (applicationType === 'checkin') {
                const checkIn = new Date(dateRange.value.start)
                checkIn.setHours(0, 0, 0, 0)
                if (checkIn >= stayStart && checkIn <= stayEnd) {
                  mpResult.dailyBreakdown.forEach((day, idx) => {
                    if (day.rate) {
                      eligibleNights++
                      eligibleTotal += calculationType === 'cumulative' ? day.originalDailyTotal : day.dailyTotal
                      eligibleDayIndices.push(idx)
                    }
                  })
                }
              } else {
                mpResult.dailyBreakdown.forEach((day, idx) => {
                  const dayDate = new Date(day.date)
                  dayDate.setHours(0, 0, 0, 0)
                  if (dayDate >= stayStart && dayDate <= stayEnd && day.rate) {
                    eligibleNights++
                    eligibleTotal += calculationType === 'cumulative' ? day.originalDailyTotal : day.dailyTotal
                    eligibleDayIndices.push(idx)
                  }
                })
              }

              if (eligibleNights > 0) {
                let campaignDiscount = 0
                let discountText = ''

                if (campaign.discount?.type === 'percentage') {
                  const discountPercent = campaign.discount.value / 100
                  campaignDiscount = eligibleTotal * discountPercent

                  eligibleDayIndices.forEach(idx => {
                    const day = mpResult.dailyBreakdown[idx]
                    const dayBase = calculationType === 'cumulative' ? day.originalDailyTotal : day.dailyTotal
                    const dayDiscount = dayBase * discountPercent
                    day.dailyTotal = Math.max(0, day.dailyTotal - dayDiscount)
                    day.discountAmount = (day.discountAmount || 0) + dayDiscount
                    day.campaignApplied = true
                    day.appliedCampaigns.push({
                      name: campaign.name,
                      discount: `-${campaign.discount.value}%`,
                      amount: dayDiscount
                    })
                  })

                  discountText = eligibleNights < nights.value
                    ? `-${campaign.discount.value}% (${eligibleNights}/${nights.value})`
                    : `-${campaign.discount.value}%`

                } else if (campaign.discount?.type === 'fixed') {
                  const discountPerNight = campaign.discount.value
                  campaignDiscount = Math.min(discountPerNight * eligibleNights, eligibleTotal)

                  eligibleDayIndices.forEach(idx => {
                    const day = mpResult.dailyBreakdown[idx]
                    const dayDiscount = Math.min(discountPerNight, day.dailyTotal)
                    day.dailyTotal = Math.max(0, day.dailyTotal - dayDiscount)
                    day.discountAmount = (day.discountAmount || 0) + dayDiscount
                    day.campaignApplied = true
                    day.appliedCampaigns.push({
                      name: campaign.name,
                      discount: `-${campaign.discount.value}`,
                      amount: dayDiscount
                    })
                  })

                  discountText = `-${campaign.discount.value} ${currency.value}/gece`

                } else if (campaign.discount?.type === 'free_nights') {
                  const stayN = campaign.discount.freeNights?.stayNights || 0
                  const freeN = campaign.discount.freeNights?.freeNights || 0
                  if (eligibleNights >= stayN && freeN > 0) {
                    const eligibleDays = eligibleDayIndices
                      .map(idx => ({ idx, price: mpResult.dailyBreakdown[idx].dailyTotal }))
                      .sort((a, b) => a.price - b.price)

                    eligibleDays.slice(0, freeN).forEach(({ idx }) => {
                      const day = mpResult.dailyBreakdown[idx]
                      const dayDiscount = day.dailyTotal
                      campaignDiscount += dayDiscount
                      day.discountAmount = (day.discountAmount || 0) + dayDiscount
                      day.dailyTotal = 0
                      day.isFreeNight = true
                      day.campaignApplied = true
                      day.appliedCampaigns.push({
                        name: campaign.name,
                        discount: 'Ücretsiz',
                        amount: dayDiscount
                      })
                    })

                    discountText = `${stayN}=${freeN} Gece`
                  }
                }

                if (campaignDiscount > 0) {
                  mpResult.totalDiscountAmount += campaignDiscount
                  currentTotalPrice -= campaignDiscount

                  mpResult.campaigns.push({
                    ...campaign,
                    discountAmount: campaignDiscount,
                    discountText,
                    eligibleNights
                  })
                }
              }
            }

            mpResult.totalPrice = Math.max(0, currentTotalPrice)
            mpResult.discountAmount = mpResult.totalDiscountAmount

            if (mpResult.campaigns.length === 1) {
              mpResult.campaign = mpResult.campaigns[0]
              mpResult.discountText = mpResult.campaigns[0].discountText
              mpResult.campaignAppliedNights = mpResult.campaigns[0].eligibleNights
            } else if (mpResult.campaigns.length > 1) {
              mpResult.campaign = mpResult.campaigns[0]
              mpResult.discountText = mpResult.campaigns.map(c => c.discountText).join(' + ')
              mpResult.campaignAppliedNights = Math.max(...mpResult.campaigns.map(c => c.eligibleNights))
            }

            mpResult.avgPerNight = nights.value > 0 ? mpResult.totalPrice / nights.value : 0
          }
        }

        roomResult.mealPlans.push(mpResult)
      }

      results.value.push(roomResult)
    }

  } catch (error) {
    console.error('Search error:', error)
  } finally {
    loading.value = false
  }
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
