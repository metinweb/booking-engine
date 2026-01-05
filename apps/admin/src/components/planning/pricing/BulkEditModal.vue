<template>
  <Transition name="modal-fade">
    <div v-if="modelValue" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <!-- Backdrop (no click to close) -->
      <div class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>

      <!-- Modal Content -->
      <div
        class="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        <!-- Header -->
        <div
          class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-700 bg-gradient-to-r from-purple-500 to-indigo-600"
        >
          <div class="text-white">
            <h3 class="text-lg font-bold flex items-center gap-2">
              <span class="material-icons">edit_note</span>
              {{ $t('planning.pricing.bulkEdit') }}
            </h3>
            <p class="text-sm opacity-90 mt-0.5">
              {{ selectedCells.length }} {{ $t('planning.pricing.cellsSelected') }}
            </p>
          </div>
          <button
            class="p-2 rounded-lg hover:bg-white/20 text-white transition-colors"
            @click="close"
          >
            <span class="material-icons">close</span>
          </button>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto p-6">
          <!-- Selection Summary -->
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

          <!-- Tabs -->
          <div class="flex gap-1 mb-6 bg-gray-100 dark:bg-slate-700 rounded-xl p-1">
            <button
              v-for="tab in tabs"
              :key="tab.key"
              class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all"
              :class="
                activeTab === tab.key
                  ? 'bg-white dark:bg-slate-600 text-purple-600 dark:text-purple-400 shadow-sm'
                  : 'text-gray-600 dark:text-slate-400 hover:text-gray-800'
              "
              @click="activeTab = tab.key"
            >
              <span class="material-icons text-lg">{{ tab.icon }}</span>
              <span class="hidden sm:inline">{{ tab.label }}</span>
            </button>
          </div>

          <!-- Tab: Price -->
          <div v-show="activeTab === 'price'" class="space-y-5">
            <!-- Price Mode -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                {{ $t('planning.pricing.priceAction') }}
              </label>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  v-for="mode in priceModes"
                  :key="mode.value"
                  class="p-3 rounded-xl border-2 text-left transition-all"
                  :class="
                    form.priceMode === mode.value
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-200 dark:border-slate-600 hover:border-gray-300'
                  "
                  @click="form.priceMode = mode.value"
                >
                  <span
                    class="material-icons text-lg mb-1"
                    :class="form.priceMode === mode.value ? 'text-purple-600' : 'text-gray-400'"
                  >
                    {{ mode.icon }}
                  </span>
                  <div
                    class="text-sm font-medium"
                    :class="
                      form.priceMode === mode.value
                        ? 'text-purple-700 dark:text-purple-300'
                        : 'text-gray-700 dark:text-gray-300'
                    "
                  >
                    {{ mode.label }}
                  </div>
                </button>
              </div>
            </div>

            <!-- Room Type Tabs (when multiple rooms selected) -->
            <div
              v-if="uniqueRoomTypes.length > 1"
              class="border-b border-gray-200 dark:border-slate-700"
            >
              <div class="flex gap-1 overflow-x-auto pb-px">
                <button
                  v-for="rt in uniqueRoomTypes"
                  :key="rt._id"
                  class="flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap"
                  :class="
                    selectedRoomTab === rt._id
                      ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  "
                  @click="selectedRoomTab = rt._id"
                >
                  <span
                    class="w-8 h-6 rounded bg-gradient-to-br from-purple-500 to-indigo-600 text-white text-xs font-bold flex items-center justify-center"
                  >
                    {{ rt.code }}
                  </span>
                  <span class="hidden sm:inline">{{ getRoomTypeName(rt) }}</span>
                  <!-- Price indicator -->
                  <span
                    v-if="hasRoomPrice(rt._id)"
                    class="w-2 h-2 rounded-full bg-green-500"
                  ></span>
                </button>
              </div>
            </div>

            <!-- Price Entry Per Room + Meal Plan -->
            <div v-if="currentRoomId && roomPrices[currentRoomId]" class="space-y-4">
              <!-- Current Room Pricing Type Badge -->
              <div class="flex items-center gap-2">
                <span
                  class="px-3 py-1 rounded-full text-xs font-bold"
                  :class="
                    currentRoomUsesMultipliers
                      ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                      : currentRoomPricingType === 'per_person'
                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                        : 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                  "
                >
                  {{
                    currentRoomUsesMultipliers
                      ? 'Çarpanlı OBP'
                      : currentRoomPricingType === 'per_person'
                        ? 'Kişi Bazlı (OBP)'
                        : 'Ünite Bazlı'
                  }}
                </span>
                <span class="text-xs text-gray-500">- {{ currentRoomTypeName }}</span>
              </div>

              <!-- Meal Plan Cards -->
              <div
                v-for="mp in uniqueMealPlans"
                v-show="roomPrices[currentRoomId]?.[mp._id]"
                :key="mp._id"
                class="border border-gray-200 dark:border-slate-600 rounded-xl overflow-hidden"
              >
                <!-- Meal Plan Header -->
                <div class="bg-gray-50 dark:bg-slate-700 px-4 py-2 flex items-center gap-2">
                  <span
                    class="px-2 py-0.5 rounded text-xs font-bold"
                    :class="getMealPlanColor(mp.code)"
                  >
                    {{ mp.code }}
                  </span>
                  <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{{
                    getMealPlanName(mp)
                  }}</span>
                </div>

                <!-- Pricing Fields -->
                <div class="p-4 bg-white dark:bg-slate-800 space-y-3">
                  <!-- UNIT PRICING -->
                  <template v-if="currentRoomPricingType === 'unit'">
                    <!-- Base Price -->
                    <div class="flex items-center gap-3">
                      <label class="text-sm text-gray-600 dark:text-gray-400 w-28">{{
                        $t('planning.pricing.pricePerNight')
                      }}</label>
                      <div class="flex items-center gap-2 flex-1">
                        <input
                          v-model.number="roomPrices[currentRoomId][mp._id].pricePerNight"
                          type="number"
                          min="0"
                          step="10"
                          class="form-input w-32 text-center font-bold"
                          :class="
                            roomPrices[currentRoomId]?.[mp._id]?.pricePerNight > 0
                              ? 'border-green-300 dark:border-green-700 text-green-700 dark:text-green-400'
                              : ''
                          "
                          placeholder="0"
                        />
                        <span class="text-sm text-gray-400">{{ currency }}</span>
                      </div>
                    </div>

                    <!-- Extra Adult -->
                    <div class="flex items-center gap-3">
                      <label class="text-sm text-gray-500 dark:text-gray-400 w-28">{{
                        $t('planning.pricing.extraAdultShort')
                      }}</label>
                      <div class="flex items-center gap-2">
                        <input
                          v-model.number="roomPrices[currentRoomId][mp._id].extraAdult"
                          type="number"
                          min="0"
                          class="form-input w-24 text-center text-sm"
                          placeholder="0"
                        />
                        <span class="text-xs text-gray-400">{{ currency }}</span>
                      </div>
                    </div>

                    <!-- Single Occupancy Discount -->
                    <div class="flex items-center gap-3">
                      <label
                        class="text-sm text-gray-500 dark:text-gray-400 w-28 flex items-center gap-1"
                      >
                        <span class="material-icons text-blue-500 text-sm">person</span>
                        Tek Kişi İnd.
                      </label>
                      <div class="flex items-center gap-2">
                        <span class="text-xs text-gray-400">-</span>
                        <input
                          v-model.number="roomPrices[currentRoomId][mp._id].singleSupplement"
                          type="number"
                          min="0"
                          class="form-input w-24 text-center text-sm"
                          placeholder="0"
                        />
                        <span class="text-xs text-gray-400">{{ currency }}</span>
                      </div>
                    </div>
                  </template>

                  <!-- OBP WITH MULTIPLIERS -->
                  <template v-else-if="currentRoomUsesMultipliers">
                    <!-- Base Price Input -->
                    <div class="flex items-center gap-3">
                      <label
                        class="text-sm text-gray-600 dark:text-gray-400 w-28 flex items-center gap-1"
                      >
                        <span class="material-icons text-purple-500 text-sm">calculate</span>
                        Baz Fiyat
                      </label>
                      <div class="flex items-center gap-2 flex-1">
                        <input
                          v-model.number="roomPrices[currentRoomId][mp._id].pricePerNight"
                          type="number"
                          min="0"
                          step="10"
                          class="form-input w-32 text-center font-bold text-purple-600"
                          :class="
                            roomPrices[currentRoomId]?.[mp._id]?.pricePerNight > 0
                              ? 'border-purple-300 dark:border-purple-700'
                              : ''
                          "
                          placeholder="0"
                        />
                        <span class="text-sm text-gray-400">{{ currency }}</span>
                      </div>
                    </div>

                    <!-- Calculated Combinations (Read-only) -->
                    <div
                      class="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg max-h-[180px] overflow-y-auto"
                    >
                      <div
                        class="text-xs font-medium text-indigo-700 dark:text-indigo-300 mb-2 flex items-center gap-1 sticky top-0 bg-indigo-50 dark:bg-indigo-900/20 py-1"
                      >
                        <span class="material-icons text-sm">table_chart</span>
                        Hesaplanan Fiyatlar
                      </div>
                      <div class="grid grid-cols-2 gap-1">
                        <div
                          v-for="combo in currentRoomCombinations"
                          :key="combo.key"
                          class="flex items-center justify-between text-xs py-0.5 px-1"
                        >
                          <span class="text-indigo-600 dark:text-indigo-400 truncate">
                            {{ formatCombinationKey(combo) }}
                            <span class="text-gray-400"
                              >(×{{ combo.overrideMultiplier || combo.calculatedMultiplier }})</span
                            >
                          </span>
                          <span
                            class="font-bold ml-1"
                            :class="
                              roomPrices[currentRoomId]?.[mp._id]?.pricePerNight
                                ? 'text-green-600'
                                : 'text-gray-400'
                            "
                          >
                            {{
                              roomPrices[currentRoomId]?.[mp._id]?.pricePerNight
                                ? Math.round(
                                    roomPrices[currentRoomId][mp._id].pricePerNight *
                                      (combo.overrideMultiplier || combo.calculatedMultiplier)
                                  ).toLocaleString()
                                : '-'
                            }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </template>

                  <!-- OBP STANDARD (without multipliers) -->
                  <template v-else>
                    <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      <div
                        v-for="(price, pax) in roomPrices[currentRoomId][mp._id].occupancyPricing"
                        :key="pax"
                        class="flex items-center gap-1 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg px-2 py-1.5"
                      >
                        <span class="text-xs font-bold text-indigo-600 dark:text-indigo-400 w-6"
                          >{{ pax }}P</span
                        >
                        <input
                          v-model.number="roomPrices[currentRoomId][mp._id].occupancyPricing[pax]"
                          type="number"
                          min="0"
                          class="form-input flex-1 w-16 text-center text-sm py-1 font-bold"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </template>

                  <!-- Child Pricing (only for Unit & Standard OBP - not for Multiplier OBP) -->
                  <div
                    v-if="!currentRoomUsesMultipliers"
                    class="pt-2 border-t border-gray-100 dark:border-slate-700"
                  >
                    <div class="text-xs text-gray-500 mb-2">
                      Çocuk Fiyatları {{ childAgeLabel }}
                    </div>
                    <div class="grid grid-cols-2 gap-2">
                      <div
                        v-for="childIndex in currentRoomMaxChildren"
                        :key="childIndex"
                        class="flex items-center gap-1 bg-pink-50 dark:bg-pink-900/20 rounded-lg px-2 py-1.5"
                      >
                        <span class="text-xs text-pink-600 dark:text-pink-400 w-12"
                          >{{ childIndex }}. Çocuk</span
                        >
                        <input
                          v-model.number="
                            roomPrices[currentRoomId][mp._id].childOrderPricing[childIndex - 1]
                          "
                          type="number"
                          min="0"
                          class="form-input flex-1 w-16 text-center text-sm py-1"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>

                  <!-- Infant (only for Unit & Standard OBP) -->
                  <div v-if="!currentRoomUsesMultipliers" class="flex items-center gap-3">
                    <label class="text-sm text-gray-500 dark:text-gray-400 w-28">
                      Bebek {{ infantAgeLabel }}
                    </label>
                    <div class="flex items-center gap-2">
                      <input
                        v-model.number="roomPrices[currentRoomId][mp._id].extraInfant"
                        type="number"
                        min="0"
                        class="form-input w-24 text-center text-sm"
                        placeholder="0"
                      />
                      <span class="text-xs text-gray-400">{{ currency }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Quick Actions -->
              <div class="flex flex-wrap gap-2">
                <button
                  v-if="uniqueMealPlans.length > 1"
                  class="text-xs px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 flex items-center gap-1"
                  @click="copyFirstMealPlanToAll"
                >
                  <span class="material-icons text-sm">content_copy</span>
                  {{ $t('planning.pricing.copyToAllMealPlans') }}
                </button>
                <button
                  v-if="uniqueRoomTypes.length > 1"
                  class="text-xs px-3 py-1.5 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-100 flex items-center gap-1"
                  @click="copyCurrentRoomToAll"
                >
                  <span class="material-icons text-sm">content_copy</span>
                  {{ $t('planning.pricing.copyToAllRooms') }}
                </button>
              </div>
            </div>
          </div>

          <!-- Tab: Inventory -->
          <div v-show="activeTab === 'inventory'" class="space-y-5">
            <!-- Allotment -->
            <div class="p-5 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
              <div class="flex items-center justify-between mb-4">
                <div>
                  <label
                    class="text-sm font-medium text-gray-700 dark:text-slate-300 flex items-center gap-2"
                  >
                    <span class="material-icons text-blue-600">inventory_2</span>
                    {{ $t('planning.pricing.allotment') }}
                  </label>
                  <p class="text-xs text-gray-500 mt-1">
                    {{ $t('planning.pricing.allotmentHint') }}
                  </p>
                </div>
              </div>

              <!-- Allotment Mode Buttons -->
              <div class="flex justify-center gap-1 mb-4 bg-white dark:bg-slate-700 rounded-xl p-1">
                <button
                  v-for="mode in allotmentModes"
                  :key="mode.value"
                  class="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all"
                  :class="
                    form.allotmentMode === mode.value
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-600'
                  "
                  @click="form.allotmentMode = mode.value"
                >
                  <span class="material-icons text-lg">{{ mode.icon }}</span>
                  <span class="hidden sm:inline">{{ mode.label }}</span>
                </button>
              </div>

              <div class="flex items-center justify-center gap-4">
                <button
                  class="w-12 h-12 rounded-full bg-white dark:bg-slate-700 border-2 border-gray-300 dark:border-slate-600 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
                  @click="form.allotmentValue = Math.max(0, form.allotmentValue - 1)"
                >
                  <span class="material-icons">remove</span>
                </button>
                <input
                  v-model.number="form.allotmentValue"
                  type="number"
                  min="0"
                  class="w-24 text-center text-3xl font-bold border-2 border-blue-300 dark:border-blue-700 rounded-xl py-3 bg-white dark:bg-slate-800"
                />
                <button
                  class="w-12 h-12 rounded-full bg-white dark:bg-slate-700 border-2 border-gray-300 dark:border-slate-600 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
                  @click="form.allotmentValue++"
                >
                  <span class="material-icons">add</span>
                </button>
              </div>
            </div>

            <!-- Stay Requirements -->
            <div class="grid grid-cols-2 gap-4">
              <div class="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
                <label
                  class="text-sm font-medium text-gray-700 dark:text-slate-300 flex items-center gap-2 mb-2"
                >
                  <span class="material-icons text-purple-600 text-lg">nights_stay</span>
                  {{ $t('planning.pricing.minStay') }}
                </label>
                <div class="flex items-center gap-2">
                  <input
                    v-model.number="form.minStay"
                    type="number"
                    min="1"
                    max="30"
                    class="form-input"
                  />
                  <span class="text-sm text-gray-500">{{ $t('planning.pricing.nights') }}</span>
                </div>
              </div>
              <div class="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
                <label
                  class="text-sm font-medium text-gray-700 dark:text-slate-300 flex items-center gap-2 mb-2"
                >
                  <span class="material-icons text-orange-600 text-lg">schedule</span>
                  {{ $t('planning.pricing.releaseDays') }}
                </label>
                <div class="flex items-center gap-2">
                  <input
                    v-model.number="form.releaseDays"
                    type="number"
                    min="0"
                    class="form-input"
                  />
                  <span class="text-sm text-gray-500">{{
                    $t('planning.pricing.daysBeforeArrival')
                  }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Tab: Restrictions -->
          <div v-show="activeTab === 'restrictions'" class="space-y-4">
            <!-- Stop Sale -->
            <div
              class="p-5 rounded-xl border-2 cursor-pointer transition-all"
              :class="
                form.stopSale
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                  : 'border-gray-200 dark:border-slate-600 hover:border-gray-300'
              "
              @click="form.stopSale = !form.stopSale"
            >
              <div class="flex items-center gap-4">
                <div
                  class="w-14 h-14 rounded-full flex items-center justify-center transition-colors"
                  :class="
                    form.stopSale
                      ? 'bg-red-500 text-white'
                      : 'bg-gray-200 dark:bg-slate-600 text-gray-500'
                  "
                >
                  <span class="material-icons text-2xl">block</span>
                </div>
                <div class="flex-1">
                  <div
                    class="font-bold text-lg"
                    :class="form.stopSale ? 'text-red-600' : 'text-gray-700 dark:text-slate-300'"
                  >
                    {{ $t('planning.pricing.stopSale') }}
                  </div>
                  <div class="text-sm text-gray-500 dark:text-slate-400">
                    {{ $t('planning.pricing.stopSaleHint') }}
                  </div>
                </div>
                <div
                  class="w-12 h-7 rounded-full transition-colors"
                  :class="form.stopSale ? 'bg-red-500' : 'bg-gray-300 dark:bg-slate-600'"
                >
                  <div
                    class="w-5 h-5 mt-1 rounded-full bg-white shadow-md transition-transform"
                    :class="form.stopSale ? 'translate-x-6' : 'translate-x-1'"
                  ></div>
                </div>
              </div>
            </div>

            <!-- Single Stop -->
            <div
              class="p-5 rounded-xl border-2 cursor-pointer transition-all"
              :class="
                form.singleStop
                  ? 'border-pink-500 bg-pink-50 dark:bg-pink-900/20'
                  : 'border-gray-200 dark:border-slate-600 hover:border-gray-300'
              "
              @click="form.singleStop = !form.singleStop"
            >
              <div class="flex items-center gap-4">
                <div
                  class="w-14 h-14 rounded-full flex items-center justify-center transition-colors"
                  :class="
                    form.singleStop
                      ? 'bg-pink-500 text-white'
                      : 'bg-gray-200 dark:bg-slate-600 text-gray-500'
                  "
                >
                  <span class="material-icons text-2xl">person_off</span>
                </div>
                <div class="flex-1">
                  <div
                    class="font-bold text-lg"
                    :class="form.singleStop ? 'text-pink-600' : 'text-gray-700 dark:text-slate-300'"
                  >
                    {{ $t('planning.pricing.singleStop') }}
                  </div>
                  <div class="text-sm text-gray-500 dark:text-slate-400">
                    {{ $t('planning.pricing.singleStopHint') }}
                  </div>
                </div>
                <div
                  class="w-12 h-7 rounded-full transition-colors"
                  :class="form.singleStop ? 'bg-pink-500' : 'bg-gray-300 dark:bg-slate-600'"
                >
                  <div
                    class="w-5 h-5 mt-1 rounded-full bg-white shadow-md transition-transform"
                    :class="form.singleStop ? 'translate-x-6' : 'translate-x-1'"
                  ></div>
                </div>
              </div>
            </div>

            <!-- CTA/CTD -->
            <div class="grid grid-cols-2 gap-4">
              <div
                class="p-4 rounded-xl border-2 cursor-pointer transition-all"
                :class="
                  form.closedToArrival
                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                    : 'border-gray-200 dark:border-slate-600 hover:border-gray-300'
                "
                @click="form.closedToArrival = !form.closedToArrival"
              >
                <div class="flex items-center gap-3">
                  <div
                    class="w-10 h-10 rounded-full flex items-center justify-center"
                    :class="
                      form.closedToArrival
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-200 dark:bg-slate-600 text-gray-500'
                    "
                  >
                    <span class="material-icons">no_meeting_room</span>
                  </div>
                  <div>
                    <div
                      class="font-medium"
                      :class="
                        form.closedToArrival
                          ? 'text-orange-600'
                          : 'text-gray-700 dark:text-slate-300'
                      "
                    >
                      CTA
                    </div>
                    <div class="text-xs text-gray-500">
                      {{ $t('planning.pricing.closedToArrival') }}
                    </div>
                  </div>
                </div>
              </div>

              <div
                class="p-4 rounded-xl border-2 cursor-pointer transition-all"
                :class="
                  form.closedToDeparture
                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                    : 'border-gray-200 dark:border-slate-600 hover:border-gray-300'
                "
                @click="form.closedToDeparture = !form.closedToDeparture"
              >
                <div class="flex items-center gap-3">
                  <div
                    class="w-10 h-10 rounded-full flex items-center justify-center"
                    :class="
                      form.closedToDeparture
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-200 dark:bg-slate-600 text-gray-500'
                    "
                  >
                    <span class="material-icons">logout</span>
                  </div>
                  <div>
                    <div
                      class="font-medium"
                      :class="
                        form.closedToDeparture
                          ? 'text-orange-600'
                          : 'text-gray-700 dark:text-slate-300'
                      "
                    >
                      CTD
                    </div>
                    <div class="text-xs text-gray-500">
                      {{ $t('planning.pricing.closedToDeparture') }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Preview Panel (overlay on content) -->
        <Transition name="slide-up">
          <div
            v-if="showPreview"
            class="absolute inset-0 bg-white dark:bg-slate-800 z-10 flex flex-col"
          >
            <!-- Preview Header -->
            <div
              class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-700 bg-gradient-to-r from-emerald-500 to-teal-600"
            >
              <div class="text-white">
                <h3 class="text-lg font-bold flex items-center gap-2">
                  <span class="material-icons">preview</span>
                  {{ $t('planning.pricing.previewChanges') }}
                </h3>
                <p class="text-sm opacity-90 mt-0.5">
                  {{ $t('planning.pricing.reviewBeforeApply') }}
                </p>
              </div>
              <button
                class="p-2 rounded-lg hover:bg-white/20 text-white transition-colors"
                @click="showPreview = false"
              >
                <span class="material-icons">arrow_back</span>
              </button>
            </div>

            <!-- Preview Content -->
            <div class="flex-1 overflow-y-auto p-6">
              <!-- Impact Summary -->
              <div
                class="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800"
              >
                <div class="flex items-center gap-3 mb-3">
                  <div
                    class="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center"
                  >
                    <span class="material-icons text-2xl">info</span>
                  </div>
                  <div>
                    <div class="text-lg font-bold text-gray-800 dark:text-white">
                      {{ $t('planning.pricing.impactSummary') }}
                    </div>
                    <div class="text-sm text-gray-600 dark:text-gray-400">
                      {{ previewSummary.totalCells }}
                      {{ $t('planning.pricing.cellsWillBeUpdated') }}
                    </div>
                  </div>
                </div>

                <div class="grid grid-cols-3 gap-4 mt-4">
                  <div class="text-center p-3 bg-white dark:bg-slate-700 rounded-lg">
                    <div class="text-2xl font-bold text-purple-600">
                      {{ previewSummary.roomTypes }}
                    </div>
                    <div class="text-xs text-gray-500">{{ $t('planning.pricing.roomTypes') }}</div>
                  </div>
                  <div class="text-center p-3 bg-white dark:bg-slate-700 rounded-lg">
                    <div class="text-2xl font-bold text-orange-600">
                      {{ previewSummary.mealPlans }}
                    </div>
                    <div class="text-xs text-gray-500">{{ $t('planning.pricing.mealPlans') }}</div>
                  </div>
                  <div class="text-center p-3 bg-white dark:bg-slate-700 rounded-lg">
                    <div class="text-2xl font-bold text-blue-600">{{ previewSummary.days }}</div>
                    <div class="text-xs text-gray-500">{{ $t('planning.pricing.days') }}</div>
                  </div>
                </div>
              </div>

              <!-- Changes List -->
              <div class="space-y-4">
                <h4 class="font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <span class="material-icons text-amber-500">change_circle</span>
                  {{ $t('planning.pricing.changesWillApply') }}
                </h4>

                <!-- Price Changes -->
                <div
                  v-if="activeTab === 'price' && previewChanges.prices.length > 0"
                  class="space-y-2"
                >
                  <div
                    v-for="(change, idx) in previewChanges.prices"
                    :key="'price-' + idx"
                    class="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700"
                  >
                    <div class="flex items-center justify-between">
                      <div class="flex items-center gap-2">
                        <span
                          class="px-2 py-0.5 rounded bg-purple-500 text-white text-xs font-bold"
                          >{{ change.roomCode }}</span
                        >
                        <span
                          class="px-2 py-0.5 rounded text-xs font-medium"
                          :class="getMealPlanColor(change.mealPlanCode)"
                          >{{ change.mealPlanCode }}</span
                        >
                      </div>
                      <span class="text-xs text-gray-500">{{
                        change.pricingType === 'per_person' ? 'OBP' : 'Unit'
                      }}</span>
                    </div>
                    <div class="mt-2 text-sm text-gray-700 dark:text-gray-300">
                      <template v-if="change.pricingType === 'unit'">
                        <div v-if="change.pricePerNight !== null" class="flex items-center gap-2">
                          <span class="material-icons text-sm text-green-500">payments</span>
                          {{ $t('planning.pricing.pricePerNight') }}:
                          <strong>{{ change.pricePerNight }} {{ currency }}</strong>
                        </div>
                        <div v-if="change.extraAdult !== null" class="flex items-center gap-2">
                          <span class="material-icons text-sm text-blue-500">person_add</span>
                          {{ $t('planning.pricing.extraAdultShort') }}:
                          <strong>{{ change.extraAdult }} {{ currency }}</strong>
                        </div>
                        <div
                          v-if="change.singleSupplement !== null"
                          class="flex items-center gap-2"
                        >
                          <span class="material-icons text-sm text-indigo-500">person</span>
                          {{ $t('planning.pricing.singleSupplement') }}:
                          <strong>-{{ change.singleSupplement }} {{ currency }}</strong>
                        </div>
                      </template>
                      <template v-else>
                        <div
                          v-for="(price, pax) in change.occupancyPricing"
                          :key="pax"
                          class="inline-flex items-center gap-1 mr-3"
                        >
                          <span class="text-xs font-bold text-indigo-600">{{ pax }}P:</span>
                          <strong>{{ price }} {{ currency }}</strong>
                        </div>
                      </template>
                      <div
                        v-if="change.childPrices?.length > 0"
                        class="flex items-center gap-2 mt-1"
                      >
                        <span class="material-icons text-sm text-pink-500">child_care</span>
                        {{ $t('planning.pricing.childPrices') }}:
                        <span v-for="(cp, ci) in change.childPrices" :key="ci" class="mr-2">
                          {{ ci + 1 }}. <strong>{{ cp }} {{ currency }}</strong>
                        </span>
                      </div>
                      <div v-if="change.extraInfant !== null" class="flex items-center gap-2 mt-1">
                        <span class="material-icons text-sm text-rose-500"
                          >baby_changing_station</span
                        >
                        {{ $t('planning.pricing.infant') }}:
                        <strong>{{ change.extraInfant }} {{ currency }}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Inventory Changes -->
                <div v-if="activeTab === 'inventory'" class="space-y-2">
                  <div
                    class="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700"
                  >
                    <div v-if="form.allotmentValue > 0" class="flex items-center gap-2 mb-2">
                      <span class="material-icons text-blue-500">inventory_2</span>
                      <span class="text-sm text-gray-700 dark:text-gray-300">
                        {{ $t('planning.pricing.allotment') }}:
                        <strong>{{ allotmentModeLabel }} {{ form.allotmentValue }}</strong>
                      </span>
                    </div>
                    <div v-if="form.minStay > 1" class="flex items-center gap-2 mb-2">
                      <span class="material-icons text-purple-500">nights_stay</span>
                      <span class="text-sm text-gray-700 dark:text-gray-300">
                        {{ $t('planning.pricing.minStay') }}:
                        <strong>{{ form.minStay }} {{ $t('planning.pricing.nights') }}</strong>
                      </span>
                    </div>
                    <div v-if="form.releaseDays > 0" class="flex items-center gap-2">
                      <span class="material-icons text-orange-500">schedule</span>
                      <span class="text-sm text-gray-700 dark:text-gray-300">
                        {{ $t('planning.pricing.releaseDays') }}:
                        <strong>{{ form.releaseDays }} {{ $t('planning.pricing.days') }}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                <!-- Restriction Changes -->
                <div v-if="activeTab === 'restrictions'" class="space-y-2">
                  <div
                    class="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700"
                  >
                    <div v-if="form.stopSale" class="flex items-center gap-2 mb-2">
                      <span class="material-icons text-red-500">block</span>
                      <span class="text-sm font-medium text-red-600"
                        >{{ $t('planning.pricing.stopSale') }}: {{ $t('common.enabled') }}</span
                      >
                    </div>
                    <div v-if="form.singleStop" class="flex items-center gap-2 mb-2">
                      <span class="material-icons text-pink-500">person_off</span>
                      <span class="text-sm font-medium text-pink-600"
                        >{{ $t('planning.pricing.singleStop') }}: {{ $t('common.enabled') }}</span
                      >
                    </div>
                    <div v-if="form.closedToArrival" class="flex items-center gap-2 mb-2">
                      <span class="material-icons text-orange-500">no_meeting_room</span>
                      <span class="text-sm font-medium text-orange-600"
                        >CTA: {{ $t('common.enabled') }}</span
                      >
                    </div>
                    <div v-if="form.closedToDeparture" class="flex items-center gap-2">
                      <span class="material-icons text-orange-500">logout</span>
                      <span class="text-sm font-medium text-orange-600"
                        >CTD: {{ $t('common.enabled') }}</span
                      >
                    </div>
                    <div
                      v-if="
                        !form.stopSale &&
                        !form.singleStop &&
                        !form.closedToArrival &&
                        !form.closedToDeparture
                      "
                      class="text-sm text-gray-500"
                    >
                      {{ $t('planning.pricing.noRestrictionsSet') }}
                    </div>
                  </div>
                </div>

                <!-- No Changes Warning -->
                <div
                  v-if="!hasAnyChanges"
                  class="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-700 flex items-center gap-3"
                >
                  <span class="material-icons text-amber-500 text-2xl">warning</span>
                  <div>
                    <div class="font-medium text-amber-700 dark:text-amber-300">
                      {{ $t('planning.pricing.noChangesDetected') }}
                    </div>
                    <div class="text-sm text-amber-600 dark:text-amber-400">
                      {{ $t('planning.pricing.pleaseEnterValues') }}
                    </div>
                  </div>
                </div>
              </div>

              <!-- Date Range Preview -->
              <div class="mt-6 p-4 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
                <h4
                  class="font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-3"
                >
                  <span class="material-icons text-blue-500">date_range</span>
                  {{ $t('planning.pricing.dateRange') }}
                </h4>
                <div class="text-sm text-gray-600 dark:text-gray-400">
                  {{ dateRangeSummary }}
                </div>
              </div>
            </div>

            <!-- Preview Footer -->
            <div
              class="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50"
            >
              <button
                class="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-colors flex items-center gap-2"
                @click="showPreview = false"
              >
                <span class="material-icons text-sm">arrow_back</span>
                {{ $t('planning.pricing.backToEdit') }}
              </button>
              <button
                :disabled="saving || !hasAnyChanges"
                class="px-6 py-2.5 text-sm font-medium bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-emerald-500/25"
                @click="confirmSave"
              >
                <span v-if="saving" class="material-icons animate-spin text-sm">refresh</span>
                <span v-else class="material-icons text-sm">check_circle</span>
                {{ saving ? $t('common.saving') : $t('planning.pricing.confirmAndApply') }}
              </button>
            </div>
          </div>
        </Transition>

        <!-- Footer -->
        <div
          class="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50"
        >
          <div class="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1">
            <span class="material-icons text-sm">info</span>
            {{ $t('planning.pricing.bulkEditHint') }}
          </div>
          <div class="flex gap-3">
            <button
              class="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
              @click="close"
            >
              {{ $t('common.cancel') }}
            </button>
            <button
              :disabled="saving"
              class="px-6 py-2.5 text-sm font-medium bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-purple-500/25"
              @click="showPreviewPanel"
            >
              <span class="material-icons text-sm">preview</span>
              {{ $t('planning.pricing.previewChanges') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import { useDate } from '@/composables/useDate'
import planningService from '@/services/planningService'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  hotelId: { type: String, required: true },
  selectedCells: { type: Array, default: () => [] },
  roomTypes: { type: Array, default: () => [] },
  mealPlans: { type: Array, default: () => [] },
  rates: { type: Array, default: () => [] },
  market: { type: Object, default: null },
  childAgeGroups: { type: Array, default: () => [] }
})

const emit = defineEmits(['update:modelValue', 'saved'])

const { t, locale } = useI18n()
const toast = useToast()
const { formatDisplayDate } = useDate()

const saving = ref(false)
const activeTab = ref('price')
const showPreview = ref(false)

const tabs = computed(() => [
  { key: 'price', label: t('planning.pricing.pricePerNight'), icon: 'payments' },
  { key: 'inventory', label: t('planning.pricing.allotment'), icon: 'inventory_2' },
  { key: 'restrictions', label: t('planning.pricing.restrictions'), icon: 'block' }
])

const priceModes = computed(() => [
  { value: 'set', label: t('planning.pricing.setValue'), icon: 'edit' },
  { value: 'increase', label: t('planning.pricing.increaseBy'), icon: 'add_circle' },
  { value: 'decrease', label: t('planning.pricing.decreaseBy'), icon: 'remove_circle' },
  { value: 'percent_increase', label: t('planning.pricing.increasePercent'), icon: 'trending_up' },
  { value: 'percent_decrease', label: t('planning.pricing.decreasePercent'), icon: 'trending_down' }
])

const allotmentModes = computed(() => [
  { value: 'set', label: t('planning.pricing.setValue'), icon: 'edit' },
  { value: 'increase', label: t('planning.pricing.increaseBy'), icon: 'add_circle' },
  { value: 'decrease', label: t('planning.pricing.decreaseBy'), icon: 'remove_circle' }
])

const form = reactive({
  // Price
  priceMode: 'set',
  priceValue: 0,
  updateExtras: false,
  extraAdult: 0,
  childOrderPricing: [], // [1st child price, 2nd child price, ...]
  extraInfant: 0,
  // Inventory
  allotmentMode: 'set',
  allotmentValue: 10,
  minStay: 1,
  releaseDays: 0,
  // Restrictions
  stopSale: false,
  singleStop: false,
  closedToArrival: false,
  closedToDeparture: false
})

// Room tabs for per-room pricing
const selectedRoomTab = ref(null)
// Structure: { roomTypeId: { mealPlanId: { pricePerNight, extraAdult, extraInfant, singleSupplement, childOrderPricing: [] } } }
const roomPrices = reactive({})
const expandedMealPlans = reactive({})

const currentRoomId = computed(() => {
  if (uniqueRoomTypes.value.length <= 1) return uniqueRoomTypes.value[0]?._id
  return selectedRoomTab.value || uniqueRoomTypes.value[0]?._id
})

// Get effective pricing type considering Market overrides
const getEffectivePricingType = roomTypeId => {
  const roomType = props.roomTypes.find(rt => rt._id === roomTypeId)
  if (!roomType) return 'unit'

  const basePricingType = roomType.pricingType || 'unit'

  // Check Market override
  if (props.market?.pricingOverrides?.length > 0) {
    const override = props.market.pricingOverrides.find(po => {
      const rtId = typeof po.roomType === 'object' ? po.roomType._id : po.roomType
      return rtId === roomTypeId && po.usePricingTypeOverride
    })
    if (override) {
      return override.pricingType
    }
  }

  return basePricingType
}

// Current room's pricing type (considering Market override)
const currentRoomPricingType = computed(() => {
  const roomId = currentRoomId.value
  if (!roomId) return 'unit'
  return getEffectivePricingType(roomId)
})

// Current room type object
const currentRoomType = computed(() => {
  const roomId = currentRoomId.value
  if (!roomId) return null
  return props.roomTypes.find(r => r._id === roomId)
})

// Check if current room uses multiplier system
// Must use effective pricing type (considering market override) AND room's useMultipliers flag
const currentRoomUsesMultipliers = computed(() => {
  const rt = currentRoomType.value
  // Both conditions must be true:
  // 1. Effective pricing type is per_person (considering market override)
  // 2. Room has useMultipliers enabled
  return currentRoomPricingType.value === 'per_person' && rt?.useMultipliers === true
})

// Get active combinations for multiplier OBP
const currentRoomCombinations = computed(() => {
  const rt = currentRoomType.value
  const table = rt?.multiplierTemplate?.combinationTable || []
  return table.filter(c => c.isActive !== false)
})

// Format combination key with age ranges: "1+3 (0-2, 3-6, 3-6)"
const formatCombinationKey = combo => {
  const adults = combo.adults
  const children = combo.children || []

  if (children.length === 0) {
    return `${adults}`
  }

  // Get age ranges from childAgeGroups prop
  const ageGroups = props.childAgeGroups || []

  const getAgeRange = ageGroupCode => {
    const group = ageGroups.find(g => g.code === ageGroupCode)
    if (group) {
      return `${group.minAge}-${group.maxAge}`
    }
    // Fallback if not found
    const fallbacks = {
      infant: '0-2',
      first: '3-6',
      second: '7-11',
      third: '12-17'
    }
    return fallbacks[ageGroupCode] || ageGroupCode
  }

  const ageRanges = children.map(c => getAgeRange(c.ageGroup))
  return `${adults}+${children.length} (${ageRanges.join(', ')})`
}

// Current room name for display
const currentRoomTypeName = computed(() => {
  const roomId = currentRoomId.value
  if (!roomId) return ''
  const rt = props.roomTypes.find(r => r._id === roomId)
  return getRoomTypeName(rt)
})

const hasRoomPrice = roomTypeId => {
  const prices = roomPrices[roomTypeId]
  if (!prices) return false
  const pricingType = getEffectivePricingType(roomTypeId)
  const roomType = props.roomTypes.find(r => r._id === roomTypeId)
  // Use effective pricing type for multiplier check
  const usesMultipliers = pricingType === 'per_person' && roomType?.useMultipliers === true

  return Object.values(prices).some(p => {
    if (pricingType === 'per_person' && usesMultipliers) {
      // Multiplier OBP: Check base price
      return p?.pricePerNight > 0
    }
    if (pricingType === 'per_person') {
      // Standard OBP: Check if at least 1P and 2P prices are set
      return p?.occupancyPricing?.[1] > 0 || p?.occupancyPricing?.[2] > 0
    }
    return p?.pricePerNight > 0
  })
}

const getRoomTypeName = rt => {
  if (!rt) return ''
  return rt.name?.[locale.value] || rt.name?.en || rt.name?.tr || ''
}

const getMealPlanName = mp => {
  if (!mp) return ''
  return mp.name?.[locale.value] || mp.name?.en || mp.name?.tr || ''
}

// Get max children for current room type
const currentRoomMaxChildren = computed(() => {
  const roomId = currentRoomId.value
  if (!roomId) return 0
  const roomType = props.roomTypes.find(rt => rt._id === roomId)
  return roomType?.occupancy?.maxChildren ?? 2 // Default 2 if not set
})

const copyFirstMealPlanToAll = () => {
  const currentRoom = currentRoomId.value
  if (!currentRoom || !roomPrices[currentRoom]) return

  const mealPlans = uniqueMealPlans.value
  if (mealPlans.length < 2) return

  const firstMp = mealPlans[0]._id
  const firstData = roomPrices[currentRoom][firstMp]
  if (!firstData) return

  for (const mp of mealPlans) {
    if (mp._id !== firstMp) {
      roomPrices[currentRoom][mp._id] = {
        pricingType: firstData.pricingType || 'unit',
        pricePerNight: firstData.pricePerNight || '',
        extraAdult: firstData.extraAdult || '',
        extraInfant: firstData.extraInfant || '',
        singleSupplement: firstData.singleSupplement || '',
        childOrderPricing: [...(firstData.childOrderPricing || [])],
        occupancyPricing: { ...(firstData.occupancyPricing || {}) }
      }
    }
  }
}

const copyCurrentRoomToAll = () => {
  const currentRoom = currentRoomId.value
  if (!currentRoom || !roomPrices[currentRoom]) return

  for (const rt of uniqueRoomTypes.value) {
    if (rt._id !== currentRoom) {
      if (!roomPrices[rt._id]) {
        roomPrices[rt._id] = {}
      }
      // Get target room's effective pricing type
      const targetPricingType = getEffectivePricingType(rt._id)

      for (const mp of uniqueMealPlans.value) {
        const srcData = roomPrices[currentRoom][mp._id]
        roomPrices[rt._id][mp._id] = {
          pricingType: targetPricingType,
          pricePerNight: srcData?.pricePerNight || '',
          extraAdult: srcData?.extraAdult || '',
          extraInfant: srcData?.extraInfant || '',
          singleSupplement: srcData?.singleSupplement || '',
          childOrderPricing: [...(srcData?.childOrderPricing || [])],
          occupancyPricing: { ...(srcData?.occupancyPricing || {}) }
        }
      }
    }
  }
}

// Initialize roomPrices when modal opens
// Empty string = don't update, 0 = free, >0 = set price
const initRoomPrices = () => {
  for (const rt of uniqueRoomTypes.value) {
    if (!roomPrices[rt._id]) {
      roomPrices[rt._id] = {}
    }
    // Get room type settings with effective pricing type (considering Market override)
    const maxChildren = rt.occupancy?.maxChildren ?? 2
    const maxAdults = rt.occupancy?.maxAdults ?? 4
    const pricingType = getEffectivePricingType(rt._id)

    for (const mp of uniqueMealPlans.value) {
      if (!roomPrices[rt._id][mp._id]) {
        // Initialize occupancy pricing for OBP
        const occupancyPricing = {}
        for (let i = 1; i <= maxAdults; i++) {
          occupancyPricing[i] = ''
        }

        roomPrices[rt._id][mp._id] = {
          pricingType,
          pricePerNight: '', // Empty = don't update
          extraAdult: '',
          extraInfant: '',
          singleSupplement: '',
          childOrderPricing: Array(maxChildren).fill(''),
          occupancyPricing
        }
      }
    }
  }
  // Set default room tab
  if (uniqueRoomTypes.value.length > 0 && !selectedRoomTab.value) {
    selectedRoomTab.value = uniqueRoomTypes.value[0]._id
  }
}

const currency = computed(() => props.market?.currency || 'EUR')

// Get child age groups from market (or defaults if inheriting from hotel)
const marketChildAgeGroups = computed(() => {
  const market = props.market
  if (
    market?.childAgeSettings?.inheritFromHotel === false &&
    market?.childAgeSettings?.childAgeGroups?.length
  ) {
    return market.childAgeSettings.childAgeGroups
  }
  return []
})

// Age ranges from market's childAgeGroups (with defaults)
const childAgeRange = computed(() => {
  const groups = marketChildAgeGroups.value
  const childGroups = groups.filter(g => g.code !== 'infant')
  if (childGroups.length > 0) {
    const firstChild = childGroups[0]
    const lastChild = childGroups[childGroups.length - 1]
    return { min: firstChild.minAge, max: lastChild.maxAge }
  }
  return { min: 3, max: 12 } // Default child age
})

const infantAgeRange = computed(() => {
  const groups = marketChildAgeGroups.value
  const infant = groups.find(g => g.code === 'infant')
  if (infant) {
    return { min: infant.minAge, max: infant.maxAge }
  }
  return { min: 0, max: 2 } // Default infant age
})

const childAgeLabel = computed(
  () =>
    `(${childAgeRange.value.min}-${childAgeRange.value.max} ${t('planning.markets.yearsShort')})`
)
const infantAgeLabel = computed(
  () =>
    `(${infantAgeRange.value.min}-${infantAgeRange.value.max} ${t('planning.markets.yearsShort')})`
)

const uniqueRoomTypes = computed(() => {
  const ids = [...new Set(props.selectedCells.map(c => c.roomTypeId))]
  return props.roomTypes.filter(rt => ids.includes(rt._id))
})

const uniqueMealPlans = computed(() => {
  const ids = [...new Set(props.selectedCells.map(c => c.mealPlanId))]
  return props.mealPlans.filter(mp => ids.includes(mp._id))
})

const dateRangeSummary = computed(() => {
  if (props.selectedCells.length === 0) return ''

  const dates = props.selectedCells.map(c => c.date).sort()
  const first = dates[0]
  const last = dates[dates.length - 1]
  const dayCount = [...new Set(dates)].length

  if (first === last) {
    return formatDisplayDate(first)
  }

  return `${formatDisplayDate(first)} - ${formatDisplayDate(last)} (${dayCount} ${locale.value === 'tr' ? 'gün' : 'days'})`
})

const getMealPlanColor = code => {
  const colors = {
    RO: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
    BB: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
    HB: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
    FB: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    AI: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
    UAI: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
  }
  return colors[code] || 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
}

const close = () => {
  emit('update:modelValue', false)
}

const save = async () => {
  saving.value = true

  try {
    // Build update fields based on active tab
    const updateFields = {}

    // Restrictions tab
    if (activeTab.value === 'restrictions') {
      updateFields.stopSale = form.stopSale
      updateFields.singleStop = form.singleStop
      updateFields.closedToArrival = form.closedToArrival
      updateFields.closedToDeparture = form.closedToDeparture
    }

    // Inventory tab
    if (activeTab.value === 'inventory') {
      updateFields.allotment = calculateAllotmentValue(0) // Will be handled per-cell in backend
      updateFields.minStay = form.minStay
      updateFields.releaseDays = form.releaseDays
    }

    // Price tab - per-room + per-mealplan pricing
    if (activeTab.value === 'price') {
      // Check if we have any prices set (empty string = don't update, 0 = free, >0 = set price)
      // A value is "set" if it's not an empty string
      const isValueSet = val => val !== '' && val !== null && val !== undefined

      let hasAnyPrice = false
      const roomKeys = Object.keys(roomPrices)

      for (const rtId of roomKeys) {
        const pricingType = getEffectivePricingType(rtId)
        const mpKeys = Object.keys(roomPrices[rtId] || {})
        const roomType = props.roomTypes.find(r => r._id === rtId)
        // Use effective pricing type for multiplier check
        const usesMultipliers = pricingType === 'per_person' && roomType?.useMultipliers === true

        for (const mpId of mpKeys) {
          const priceData = roomPrices[rtId][mpId]

          // Check based on pricing type
          if (pricingType === 'per_person' && usesMultipliers) {
            // Multiplier OBP: Check base price only
            if (isValueSet(priceData?.pricePerNight)) {
              hasAnyPrice = true
              break
            }
          } else if (pricingType === 'per_person') {
            // Standard OBP: Check occupancy pricing
            const hasOccupancyPrice = Object.values(priceData?.occupancyPricing || {}).some(p =>
              isValueSet(p)
            )
            if (hasOccupancyPrice) {
              hasAnyPrice = true
              break
            }
            // Child pricing for standard OBP
            const hasExtraInfant = isValueSet(priceData?.extraInfant)
            const hasChildPricing = priceData?.childOrderPricing?.some(p => isValueSet(p))
            if (hasExtraInfant || hasChildPricing) {
              hasAnyPrice = true
              break
            }
          } else {
            // Unit: Check base price and extras
            const hasBasePrice = isValueSet(priceData?.pricePerNight)
            const hasExtraAdult = isValueSet(priceData?.extraAdult)
            const hasSingleSupplement = isValueSet(priceData?.singleSupplement)
            if (hasBasePrice || hasExtraAdult || hasSingleSupplement) {
              hasAnyPrice = true
              break
            }
            // Child pricing for unit
            const hasExtraInfant = isValueSet(priceData?.extraInfant)
            const hasChildPricing = priceData?.childOrderPricing?.some(p => isValueSet(p))
            if (hasExtraInfant || hasChildPricing) {
              hasAnyPrice = true
              break
            }
          }
        }
        if (hasAnyPrice) break
      }

      if (hasAnyPrice) {
        // Process per room type and meal plan
        const uniqueDates = [...new Set(props.selectedCells.map(c => c.date))].sort()
        let totalUpdates = 0

        for (const rtId of Object.keys(roomPrices)) {
          const pricingType = getEffectivePricingType(rtId)

          for (const mpId of Object.keys(roomPrices[rtId])) {
            const priceData = roomPrices[rtId][mpId]

            // Check if this room+meal plan has any values
            let hasValues = false
            const roomType = props.roomTypes.find(r => r._id === rtId)
            // Use effective pricing type for multiplier check
            const usesMultipliers =
              pricingType === 'per_person' && roomType?.useMultipliers === true

            if (pricingType === 'per_person' && usesMultipliers) {
              // Multiplier OBP: Check base price only
              hasValues = isValueSet(priceData?.pricePerNight)
            } else if (pricingType === 'per_person') {
              // Standard OBP: Check occupancy pricing
              hasValues = Object.values(priceData?.occupancyPricing || {}).some(p => isValueSet(p))
              hasValues =
                hasValues ||
                isValueSet(priceData?.extraInfant) ||
                priceData?.childOrderPricing?.some(p => isValueSet(p))
            } else {
              // Unit pricing
              hasValues =
                isValueSet(priceData?.pricePerNight) ||
                isValueSet(priceData?.extraAdult) ||
                isValueSet(priceData?.singleSupplement)
              hasValues =
                hasValues ||
                isValueSet(priceData?.extraInfant) ||
                priceData?.childOrderPricing?.some(p => isValueSet(p))
            }

            if (hasValues) {
              // Build cells for this room+mealplan combination
              const cells = uniqueDates.map(date => ({
                date,
                roomTypeId: rtId,
                mealPlanId: mpId
              }))

              // Build update fields based on pricing type
              const priceUpdateFields = {
                pricingType
              }

              // Use effective pricing type for multiplier check (roomType already defined above)
              // const usesMultipliers is already defined above in this scope

              if (pricingType === 'per_person' && usesMultipliers) {
                // OBP with Multipliers: pricePerNight is the base price
                // All prices calculated from multipliers at runtime
                if (isValueSet(priceData.pricePerNight)) {
                  priceUpdateFields.pricePerNight = Number(priceData.pricePerNight)
                }
                priceUpdateFields.occupancyPricing = {} // Calculated from adultMultipliers
                priceUpdateFields.childOrderPricing = [] // Calculated from childMultipliers
                priceUpdateFields.extraInfant = 0 // Calculated from infantMultiplier
                priceUpdateFields.extraAdult = 0
                priceUpdateFields.singleSupplement = 0
              } else if (pricingType === 'per_person') {
                // OBP Standard: Save occupancy pricing
                const occupancyPricing = {}
                for (const [pax, price] of Object.entries(priceData.occupancyPricing || {})) {
                  if (isValueSet(price)) {
                    occupancyPricing[pax] = Number(price)
                  }
                }
                if (Object.keys(occupancyPricing).length > 0) {
                  priceUpdateFields.occupancyPricing = occupancyPricing
                }
                // OBP doesn't use these
                priceUpdateFields.pricePerNight = 0
                priceUpdateFields.extraAdult = 0
                priceUpdateFields.singleSupplement = 0

                // Child pricing for standard OBP
                if (isValueSet(priceData.extraInfant)) {
                  priceUpdateFields.extraInfant = Number(priceData.extraInfant)
                }
                if (priceData.childOrderPricing?.some(p => isValueSet(p))) {
                  priceUpdateFields.childOrderPricing = priceData.childOrderPricing.map(p =>
                    isValueSet(p) ? Number(p) : null
                  )
                }
              } else {
                // Unit pricing
                if (isValueSet(priceData.pricePerNight)) {
                  priceUpdateFields.pricePerNight = Number(priceData.pricePerNight)
                }
                if (isValueSet(priceData.extraAdult)) {
                  priceUpdateFields.extraAdult = Number(priceData.extraAdult)
                }
                if (isValueSet(priceData.singleSupplement)) {
                  priceUpdateFields.singleSupplement = Number(priceData.singleSupplement)
                }

                // Child pricing for unit pricing
                if (isValueSet(priceData.extraInfant)) {
                  priceUpdateFields.extraInfant = Number(priceData.extraInfant)
                }
                if (priceData.childOrderPricing?.some(p => isValueSet(p))) {
                  priceUpdateFields.childOrderPricing = priceData.childOrderPricing.map(p =>
                    isValueSet(p) ? Number(p) : null
                  )
                }
              }

              try {
                const result = await planningService.bulkUpdateByDates(
                  props.hotelId,
                  cells,
                  priceUpdateFields,
                  props.market?._id
                )
                totalUpdates +=
                  (result?.data?.created || 0) +
                  (result?.data?.updated || 0) +
                  (result?.data?.split || 0)
              } catch (err) {
                console.error(
                  'API error for RT/MP:',
                  rtId.slice(-6),
                  mpId.slice(-6),
                  err.message || err
                )
                toast.error(`Error: ${err.message || 'Unknown error'}`)
              }
            }
          }
        }

        if (totalUpdates > 0) {
          toast.success(t('planning.pricing.bulkUpdateSuccess') + ` (${totalUpdates})`)
          emit('saved')
          close()
          return
        }
      }
    }

    // For restrictions and inventory tabs, use new date-based endpoint
    if (activeTab.value !== 'price') {
      const result = await planningService.bulkUpdateByDates(
        props.hotelId,
        props.selectedCells,
        updateFields,
        props.market?._id
      )
      const count =
        (result?.data?.created || 0) + (result?.data?.updated || 0) + (result?.data?.split || 0)
      toast.success(t('planning.pricing.bulkUpdateSuccess') + ` (${count})`)
      emit('saved')
      close()
      return
    }

    // Fallback - no valid updates
    toast.warning(t('planning.pricing.noChangesToApply'))
  } catch (error) {
    console.error('Bulk edit error:', error)
    toast.error(error.response?.data?.message || t('common.operationFailed'))
  } finally {
    saving.value = false
  }
}

const calculateAllotmentValue = currentValue => {
  const value = form.allotmentValue || 0

  switch (form.allotmentMode) {
    case 'set':
      return value
    case 'increase':
      return currentValue + value
    case 'decrease':
      return Math.max(0, currentValue - value)
    default:
      return value
  }
}

// Preview panel functions
const showPreviewPanel = () => {
  showPreview.value = true
}

const isValueSet = val => val !== '' && val !== null && val !== undefined

// Preview summary computed
const previewSummary = computed(() => {
  const uniqueDates = [...new Set(props.selectedCells.map(c => c.date))]
  return {
    totalCells: props.selectedCells.length,
    roomTypes: uniqueRoomTypes.value.length,
    mealPlans: uniqueMealPlans.value.length,
    days: uniqueDates.length
  }
})

// Allotment mode label
const allotmentModeLabel = computed(() => {
  const labels = {
    set: t('planning.pricing.setTo'),
    increase: t('planning.pricing.increaseBy'),
    decrease: t('planning.pricing.decreaseBy')
  }
  return labels[form.allotmentMode] || ''
})

// Preview changes computed
const previewChanges = computed(() => {
  const changes = {
    prices: [],
    inventory: null,
    restrictions: null
  }

  // Price changes
  if (activeTab.value === 'price') {
    for (const rtId of Object.keys(roomPrices)) {
      const roomType = props.roomTypes.find(rt => rt._id === rtId)
      const pricingType = getEffectivePricingType(rtId)

      for (const mpId of Object.keys(roomPrices[rtId] || {})) {
        const mealPlan = props.mealPlans.find(mp => mp._id === mpId)
        const priceData = roomPrices[rtId][mpId]

        // Check if has values
        let hasValues = false
        const change = {
          roomCode: roomType?.code || rtId.slice(-6),
          mealPlanCode: mealPlan?.code || mpId.slice(-6),
          pricingType,
          pricePerNight: null,
          extraAdult: null,
          singleSupplement: null,
          occupancyPricing: {},
          childPrices: [],
          extraInfant: null
        }

        if (pricingType === 'per_person') {
          for (const [pax, price] of Object.entries(priceData?.occupancyPricing || {})) {
            if (isValueSet(price)) {
              change.occupancyPricing[pax] = Number(price)
              hasValues = true
            }
          }
        } else {
          if (isValueSet(priceData?.pricePerNight)) {
            change.pricePerNight = Number(priceData.pricePerNight)
            hasValues = true
          }
          if (isValueSet(priceData?.extraAdult)) {
            change.extraAdult = Number(priceData.extraAdult)
            hasValues = true
          }
          if (isValueSet(priceData?.singleSupplement)) {
            change.singleSupplement = Number(priceData.singleSupplement)
            hasValues = true
          }
        }

        // Child pricing
        if (priceData?.childOrderPricing?.some(p => isValueSet(p))) {
          change.childPrices = priceData.childOrderPricing
            .filter(p => isValueSet(p))
            .map(p => Number(p))
          hasValues = true
        }

        if (isValueSet(priceData?.extraInfant)) {
          change.extraInfant = Number(priceData.extraInfant)
          hasValues = true
        }

        if (hasValues) {
          changes.prices.push(change)
        }
      }
    }
  }

  return changes
})

// Has any changes
const hasAnyChanges = computed(() => {
  if (activeTab.value === 'price') {
    return previewChanges.value.prices.length > 0
  }
  if (activeTab.value === 'inventory') {
    return form.allotmentValue > 0 || form.minStay > 1 || form.releaseDays > 0
  }
  if (activeTab.value === 'restrictions') {
    return form.stopSale || form.singleStop || form.closedToArrival || form.closedToDeparture
  }
  return false
})

// Confirm and save
const confirmSave = async () => {
  await save()
}

// Reset form when modal opens
watch(
  () => props.modelValue,
  val => {
    if (val) {
      activeTab.value = 'price'
      showPreview.value = false
      form.priceMode = 'set'
      form.priceValue = 0
      form.updateExtras = false
      form.extraAdult = 0
      form.childOrderPricing = []
      form.extraInfant = 0
      form.allotmentMode = 'set'
      form.allotmentValue = 10
      form.minStay = 1
      form.releaseDays = 0
      form.stopSale = false
      form.singleStop = false
      form.closedToArrival = false
      form.closedToDeparture = false

      // Reset room prices and expanded state
      selectedRoomTab.value = null
      for (const key of Object.keys(roomPrices)) {
        delete roomPrices[key]
      }
      for (const key of Object.keys(expandedMealPlans)) {
        delete expandedMealPlans[key]
      }

      // Initialize room prices after nextTick
      nextTick(() => {
        initRoomPrices()
      })
    }
  }
)
</script>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active .relative,
.modal-fade-leave-active .relative {
  transition: transform 0.2s ease;
}

.modal-fade-enter-from .relative,
.modal-fade-leave-to .relative {
  transform: scale(0.95);
}

/* Preview slide up transition */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.slide-up-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>
