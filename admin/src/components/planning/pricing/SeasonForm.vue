<template>
  <div class="flex flex-col h-full">
    <!-- Tab Navigation (Sticky) - Hidden in preview mode -->
    <div v-if="!showPreview" class="flex border-b border-gray-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 z-10 -mx-4 px-4">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        @click="activeTab = tab.id"
        class="px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-2"
        :class="activeTab === tab.id
          ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
          : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 hover:border-gray-300'"
      >
        <span class="material-icons text-lg">{{ tab.icon }}</span>
        {{ tab.label }}
        <span
          v-if="tab.id === 'pricing' && hasPricingOverrides"
          class="w-2 h-2 rounded-full bg-indigo-500"
        ></span>
      </button>
    </div>

    <!-- Tab Content - Hidden in preview mode -->
    <div v-if="!showPreview" class="space-y-6 flex-1 overflow-y-auto overflow-x-hidden mt-6">
      <!-- General Settings Tab -->
      <div v-show="activeTab === 'general'">
        <!-- Code -->
        <div class="mb-4">
          <label class="form-label">{{ $t('planning.pricing.seasonCode') }} <span class="text-red-500">*</span></label>
          <input v-model="form.code" type="text" class="form-input uppercase" maxlength="10" />
        </div>

        <!-- Name (Multilingual) -->
        <div class="mb-4">
          <MultiLangInput
            v-model="form.name"
            :languages="SUPPORTED_LANGUAGES"
            :label="$t('planning.pricing.seasonName') + ' *'"
          />
        </div>

        <!-- Color & Priority -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label class="form-label">{{ $t('planning.pricing.color') }}</label>
            <div class="flex items-center gap-3">
              <input v-model="form.color" type="color" class="w-12 h-10 rounded border border-gray-300 cursor-pointer" />
              <input v-model="form.color" type="text" class="form-input flex-1" placeholder="#6366f1" />
            </div>
          </div>
          <div>
            <label class="form-label">{{ $t('planning.pricing.priority') }}</label>
            <input v-model.number="form.priority" type="number" min="0" max="100" class="form-input" />
            <p class="text-xs text-gray-500 mt-1">{{ $t('planning.pricing.priorityHint') }}</p>
          </div>
        </div>

        <!-- Date Ranges -->
        <div class="mb-4">
          <label class="form-label">{{ $t('planning.pricing.dateRanges') }}</label>
          <div class="space-y-3">
            <div
              v-for="(range, index) in form.dateRanges"
              :key="index"
              class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg"
            >
              <div class="flex-1 grid grid-cols-2 gap-3">
                <div>
                  <label class="text-xs text-gray-500 dark:text-slate-400 mb-1 block">{{ $t('planning.pricing.startDate') }}</label>
                  <DatePicker
                    v-model="range.startDate"
                    allow-past
                    :max-date="range.endDate || null"
                    :placeholder="$t('planning.pricing.startDate')"
                  />
                </div>
                <div>
                  <label class="text-xs text-gray-500 dark:text-slate-400 mb-1 block">{{ $t('planning.pricing.endDate') }}</label>
                  <DatePicker
                    v-model="range.endDate"
                    allow-past
                    :min-date="range.startDate || null"
                    :placeholder="$t('planning.pricing.endDate')"
                  />
                </div>
              </div>
              <button
                v-if="form.dateRanges.length > 1"
                @click="removeDateRange(index)"
                type="button"
                class="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded self-end mb-1"
              >
                <span class="material-icons">close</span>
              </button>
            </div>
            <button
              @click="addDateRange"
              type="button"
              class="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <span class="material-icons text-sm">add</span>
              {{ $t('planning.pricing.addDateRange') }}
            </button>
          </div>
        </div>

        <!-- Product Override Section -->
        <div v-if="filteredRoomTypes.length || filteredMealPlans.length" class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 space-y-4 mb-4">
          <div class="flex items-center gap-2">
            <span class="material-icons text-blue-500">inventory_2</span>
            <label class="text-sm font-medium text-gray-700 dark:text-slate-300">{{ $t('planning.seasons.productOverride') }}</label>
          </div>
          <p class="text-xs text-gray-500 dark:text-slate-400">
            {{ $t('planning.seasons.productOverrideHint') }}
          </p>

          <!-- Active Room Types Override -->
          <div v-if="filteredRoomTypes.length" class="p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-600">
            <div class="flex items-center gap-2 mb-3">
              <span class="material-icons text-blue-500 text-sm">hotel</span>
              <label class="text-sm font-medium text-gray-700 dark:text-slate-300">{{ $t('planning.seasons.activeRoomTypes') }}</label>
            </div>
            <div class="flex flex-wrap gap-2">
              <label
                v-for="rt in filteredRoomTypes"
                :key="rt._id"
                class="flex items-center gap-2 px-3 py-1.5 rounded-full border cursor-pointer transition-all text-sm"
                :class="form.activeRoomTypes.includes(rt._id)
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'border-gray-200 dark:border-slate-600 hover:border-gray-300'"
              >
                <input
                  type="checkbox"
                  :value="rt._id"
                  v-model="form.activeRoomTypes"
                  class="sr-only"
                />
                <span class="font-medium">{{ rt.code }}</span>
                <span class="text-xs text-gray-500 dark:text-slate-400">{{ rt.name?.[locale] || rt.name?.tr }}</span>
              </label>
            </div>
            <p class="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1">
              <span class="material-icons text-xs">info</span>
              {{ $t('planning.seasons.emptyInheritsMarket') }}
            </p>
          </div>

          <!-- Active Meal Plans Override -->
          <div v-if="filteredMealPlans.length" class="p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-600">
            <div class="flex items-center gap-2 mb-3">
              <span class="material-icons text-green-500 text-sm">restaurant</span>
              <label class="text-sm font-medium text-gray-700 dark:text-slate-300">{{ $t('planning.seasons.activeMealPlans') }}</label>
            </div>
            <div class="flex flex-wrap gap-2">
              <label
                v-for="mp in filteredMealPlans"
                :key="mp._id"
                class="flex items-center gap-2 px-3 py-1.5 rounded-full border cursor-pointer transition-all text-sm"
                :class="form.activeMealPlans.includes(mp._id)
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                  : 'border-gray-200 dark:border-slate-600 hover:border-gray-300'"
              >
                <input
                  type="checkbox"
                  :value="mp._id"
                  v-model="form.activeMealPlans"
                  class="sr-only"
                />
                <span class="font-medium">{{ mp.code }}</span>
                <span class="text-xs text-gray-500 dark:text-slate-400">{{ mp.name?.[locale] || mp.name?.tr }}</span>
              </label>
            </div>
            <p class="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1">
              <span class="material-icons text-xs">info</span>
              {{ $t('planning.seasons.emptyInheritsMarket') }}
            </p>
          </div>
        </div>

        <!-- Child Age Override Section -->
        <div class="p-4 bg-pink-50 dark:bg-pink-900/20 rounded-lg border border-pink-200 dark:border-pink-800 space-y-4 mb-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="material-icons text-pink-500">child_care</span>
              <label class="text-sm font-medium text-gray-700 dark:text-slate-300">{{ $t('planning.seasons.childAgeOverride') }}</label>
            </div>
            <div class="flex items-center gap-3">
              <span class="text-xs text-gray-500 dark:text-slate-400">{{ $t('planning.seasons.inheritFromMarket') }}</span>
              <button
                type="button"
                @click="form.childAgeSettings.inheritFromMarket = !form.childAgeSettings.inheritFromMarket"
                class="relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none"
                :class="form.childAgeSettings.inheritFromMarket ? 'bg-pink-500' : 'bg-gray-300 dark:bg-slate-600'"
              >
                <span
                  class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-300"
                  :class="form.childAgeSettings.inheritFromMarket ? 'translate-x-6' : 'translate-x-0'"
                ></span>
              </button>
            </div>
          </div>

          <div v-if="form.childAgeSettings.inheritFromMarket" class="p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg border border-gray-200 dark:border-slate-600">
            <p class="text-xs text-gray-500 dark:text-slate-400 mb-2 flex items-center gap-1">
              <span class="material-icons text-xs">link</span>
              {{ $t('planning.seasons.usingMarketSettings') }}
            </p>
            <div class="flex flex-wrap gap-3">
              <div
                v-for="group in hotelChildAgeGroups"
                :key="group.code"
                class="px-3 py-1.5 bg-white dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600 text-sm"
              >
                <span class="font-medium text-gray-700 dark:text-slate-300">{{ getChildGroupName(group) }}</span>
                <span class="text-gray-500 dark:text-slate-400 ml-2">{{ group.minAge }}-{{ group.maxAge }} {{ $t('planning.markets.years') }}</span>
              </div>
              <span v-if="hotelChildAgeGroups.length === 0" class="text-amber-600 text-sm">
                {{ $t('planning.seasons.noChildAgeGroups') }}
              </span>
            </div>
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="(group, index) in form.childAgeSettings.childAgeGroups"
              :key="group.code"
              class="p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-600"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="material-icons text-sm" :class="getChildGroupIconClass(group.code)">
                    {{ getChildGroupIcon(group.code) }}
                  </span>
                  <label class="text-sm font-medium text-gray-700 dark:text-slate-300">
                    {{ getChildGroupLabel(group.code) }}
                  </label>
                </div>
                <div class="flex items-center gap-2">
                  <input
                    v-model.number="group.minAge"
                    type="number"
                    min="0"
                    max="17"
                    class="form-input w-16 text-center text-sm"
                    :placeholder="getHotelGroupAge(group.code, 'min')"
                  />
                  <span class="text-gray-500">-</span>
                  <input
                    v-model.number="group.maxAge"
                    type="number"
                    min="0"
                    max="17"
                    class="form-input w-16 text-center text-sm"
                    :placeholder="getHotelGroupAge(group.code, 'max')"
                  />
                  <span class="text-xs text-gray-500">{{ $t('planning.markets.years') }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Payment Settings Override Section -->
        <div class="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800 space-y-4 mb-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="material-icons text-emerald-500">payments</span>
              <label class="text-sm font-medium text-gray-700 dark:text-slate-300">{{ $t('planning.seasons.paymentSettings') }}</label>
            </div>
            <div class="flex items-center gap-3">
              <span class="text-xs text-gray-500 dark:text-slate-400">{{ $t('planning.seasons.inheritFromMarket') }}</span>
              <button
                type="button"
                @click="form.paymentSettings.inheritFromMarket = !form.paymentSettings.inheritFromMarket"
                class="relative w-12 h-6 rounded-full transition-colors duration-300"
                :class="form.paymentSettings.inheritFromMarket ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-slate-600'"
              >
                <span class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-300"
                  :class="form.paymentSettings.inheritFromMarket ? 'translate-x-6' : 'translate-x-0'"></span>
              </button>
            </div>
          </div>

          <div v-if="form.paymentSettings.inheritFromMarket" class="p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg border border-gray-200 dark:border-slate-600">
            <p class="text-xs text-gray-500 dark:text-slate-400 mb-2 flex items-center gap-1">
              <span class="material-icons text-xs">link</span>
              {{ $t('planning.seasons.usingMarketSettings') }}
            </p>
            <div class="flex flex-wrap gap-3 text-sm text-gray-600 dark:text-slate-400">
              <span class="flex items-center gap-1">
                <span class="material-icons text-sm" :class="market.paymentMethods?.creditCard?.enabled !== false ? 'text-green-500' : 'text-red-500'">
                  {{ market.paymentMethods?.creditCard?.enabled !== false ? 'check_circle' : 'cancel' }}
                </span>
                {{ $t('planning.markets.creditCard') }}
              </span>
              <span class="flex items-center gap-1">
                <span class="material-icons text-sm" :class="market.paymentMethods?.bankTransfer?.enabled !== false ? 'text-green-500' : 'text-red-500'">
                  {{ market.paymentMethods?.bankTransfer?.enabled !== false ? 'check_circle' : 'cancel' }}
                </span>
                {{ $t('planning.markets.bankTransfer') }}
              </span>
            </div>
          </div>

          <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-600">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="material-icons text-blue-500 text-sm">credit_card</span>
                  <label class="text-sm font-medium text-gray-700 dark:text-slate-300">{{ $t('planning.markets.creditCard') }}</label>
                </div>
                <button
                  type="button"
                  @click="form.paymentSettings.creditCard.enabled = !form.paymentSettings.creditCard.enabled"
                  class="relative w-10 h-5 rounded-full transition-colors duration-300"
                  :class="form.paymentSettings.creditCard.enabled ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-slate-600'"
                >
                  <span class="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transform transition-transform duration-300"
                    :class="form.paymentSettings.creditCard.enabled ? 'translate-x-5' : 'translate-x-0'"></span>
                </button>
              </div>
            </div>
            <div class="p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-600">
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-2">
                  <span class="material-icons text-orange-500 text-sm">account_balance</span>
                  <label class="text-sm font-medium text-gray-700 dark:text-slate-300">{{ $t('planning.markets.bankTransfer') }}</label>
                </div>
                <button
                  type="button"
                  @click="form.paymentSettings.bankTransfer.enabled = !form.paymentSettings.bankTransfer.enabled"
                  class="relative w-10 h-5 rounded-full transition-colors duration-300"
                  :class="form.paymentSettings.bankTransfer.enabled ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-slate-600'"
                >
                  <span class="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transform transition-transform duration-300"
                    :class="form.paymentSettings.bankTransfer.enabled ? 'translate-x-5' : 'translate-x-0'"></span>
                </button>
              </div>
              <div v-if="form.paymentSettings.bankTransfer.enabled" class="space-y-2 pt-2 border-t border-gray-100 dark:border-slate-700">
                <div class="flex items-center gap-2">
                  <label class="text-xs text-gray-500 dark:text-slate-400 w-24">{{ $t('planning.markets.releaseDays') }}</label>
                  <input v-model.number="form.paymentSettings.bankTransfer.releaseDays" type="number" min="0" max="60" class="form-input w-16 text-center text-sm py-1" />
                  <span class="text-xs text-gray-400">{{ $t('common.days') }}</span>
                </div>
                <div class="flex items-center gap-2">
                  <label class="text-xs text-gray-500 dark:text-slate-400 w-24">{{ $t('planning.markets.discountRate') }}</label>
                  <input v-model.number="form.paymentSettings.bankTransfer.discountRate" type="number" min="0" max="50" class="form-input w-16 text-center text-sm py-1" />
                  <span class="text-xs text-gray-400">%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Children Allowed Override Section -->
        <div class="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="material-icons text-amber-500">family_restroom</span>
              <div>
                <label class="text-sm font-medium text-gray-700 dark:text-slate-300">{{ $t('planning.markets.childrenAllowed') }}</label>
                <p class="text-xs text-gray-500 dark:text-slate-400">{{ $t('planning.seasons.childrenAllowedHint') }}</p>
              </div>
            </div>
            <div class="flex items-center gap-3">
              <span class="text-xs text-gray-500 dark:text-slate-400">{{ $t('planning.seasons.inheritFromMarket') }}</span>
              <button
                type="button"
                @click="form.childrenSettings.inheritFromMarket = !form.childrenSettings.inheritFromMarket"
                class="relative w-12 h-6 rounded-full transition-colors duration-300"
                :class="form.childrenSettings.inheritFromMarket ? 'bg-amber-500' : 'bg-gray-300 dark:bg-slate-600'"
              >
                <span class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-300"
                  :class="form.childrenSettings.inheritFromMarket ? 'translate-x-6' : 'translate-x-0'"></span>
              </button>
            </div>
          </div>

          <div v-if="form.childrenSettings.inheritFromMarket" class="mt-3 p-2 bg-white/50 dark:bg-slate-800/50 rounded border border-gray-200 dark:border-slate-600">
            <span class="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1">
              <span class="material-icons text-xs">link</span>
              {{ $t('planning.seasons.usingMarketSettings') }}:
              <span class="font-medium" :class="market.childrenAllowed !== false ? 'text-green-600' : 'text-red-600'">
                {{ market.childrenAllowed !== false ? $t('common.yes') : $t('common.no') }}
              </span>
            </span>
          </div>

          <div v-else class="mt-3 flex items-center gap-3">
            <span class="text-sm text-gray-600 dark:text-slate-400">{{ $t('planning.seasons.allowChildren') }}:</span>
            <button
              type="button"
              @click="form.childrenSettings.allowed = !form.childrenSettings.allowed"
              class="relative w-12 h-6 rounded-full transition-colors duration-300"
              :class="form.childrenSettings.allowed ? 'bg-green-500' : 'bg-red-500'"
            >
              <span class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-300"
                :class="form.childrenSettings.allowed ? 'translate-x-6' : 'translate-x-0'"></span>
            </button>
            <span class="text-sm font-medium" :class="form.childrenSettings.allowed ? 'text-green-600' : 'text-red-600'">
              {{ form.childrenSettings.allowed ? $t('common.yes') : $t('common.no') }}
            </span>
          </div>
        </div>
      </div>

      <!-- Pricing Overrides Tab -->
      <div v-show="activeTab === 'pricing'">
        <!-- Info Box -->
        <div class="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4 mb-6 border border-indigo-200 dark:border-indigo-800">
          <div class="flex items-start gap-3">
            <span class="material-icons text-indigo-500 text-xl">info</span>
            <div>
              <h4 class="font-medium text-indigo-800 dark:text-indigo-300 mb-1">{{ $t('planning.seasons.pricingOverrideInfo') }}</h4>
              <p class="text-sm text-indigo-700 dark:text-indigo-400">{{ $t('planning.seasons.pricingOverrideDescription') }}</p>
            </div>
          </div>
        </div>

        <!-- No Rooms Warning -->
        <div v-if="pricingRoomTypes.length === 0" class="text-center py-12">
          <div class="w-16 h-16 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-4">
            <span class="material-icons text-3xl text-gray-400 dark:text-slate-500">hotel</span>
          </div>
          <h5 class="font-medium text-gray-600 dark:text-slate-400 mb-2">{{ $t('planning.seasons.noRooms') }}</h5>
          <p class="text-sm text-gray-500 dark:text-slate-500 max-w-md mx-auto">
            {{ $t('planning.seasons.noRoomsHint') }}
          </p>
        </div>

        <!-- Room Type Tabs for Pricing Overrides -->
        <div v-else>
          <!-- Room Selection Tabs (Sticky below main tabs) -->
          <div class="flex gap-1 flex-wrap pb-2 mb-4 border-b border-gray-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 z-[5] -mx-4 px-4">
            <button
              v-for="rt in pricingRoomTypes"
              :key="rt._id"
              type="button"
              @click="selectedPricingRoom = rt._id"
              class="px-4 py-2 text-sm font-medium whitespace-nowrap transition-all border-b-2 -mb-px rounded-t-lg"
              :class="selectedPricingRoom === rt._id
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20'
                : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 hover:border-gray-300'"
            >
              <div class="flex flex-col items-center">
                <div class="flex items-center gap-1">
                  <span class="font-bold">{{ rt.code }}</span>
                  <span
                    v-if="hasRoomOverride(rt._id)"
                    class="w-2 h-2 rounded-full bg-indigo-500"
                  ></span>
                </div>
                <!-- Pricing type badge -->
                <span
                  class="text-[10px] font-mono opacity-60"
                  :class="rt.pricingType === 'per_person' ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500 dark:text-slate-400'"
                >
                  {{ rt.pricingType === 'per_person' ? 'obp' : 'ünite' }}
                </span>
              </div>
            </button>
          </div>

          <!-- Selected Room Pricing Override -->
          <div v-if="selectedPricingRoom && currentSelectedRoom" class="space-y-4">
            <!-- Room Info -->
            <div class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
              <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm">
                {{ currentSelectedRoom.code }}
              </div>
              <div class="flex-1">
                <div class="font-medium text-gray-800 dark:text-white text-sm">{{ currentSelectedRoom.name?.[locale] || currentSelectedRoom.name?.tr }}</div>
                <div class="text-xs text-gray-500 dark:text-slate-400">
                  {{ currentSelectedRoom.pricingType === 'per_person' ? 'Kişi Bazlı (OBP)' : 'Ünite Bazlı' }}
                  <template v-if="currentSelectedRoom.useMultipliers"> + Çarpan Sistemi</template>
                  | Max: {{ currentSelectedRoom.occupancy?.maxAdults || 2 }} Yetişkin, {{ currentSelectedRoom.occupancy?.maxChildren || 0 }} Çocuk
                </div>
              </div>
            </div>

            <!-- 1. Pricing Type Override -->
            <div class="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
              <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
                    <span class="material-icons text-white">payments</span>
                  </div>
                  <div>
                    <h4 class="font-semibold text-gray-900 dark:text-white">{{ $t('planning.seasons.pricingTypeOverride') }}</h4>
                    <p class="text-xs text-gray-500 dark:text-slate-400">{{ $t('planning.seasons.pricingTypeOverrideHint') }}</p>
                  </div>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    v-model="currentRoomOverride.usePricingTypeOverride"
                    class="sr-only peer"
                  />
                  <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <!-- Pricing Type Selection (when override enabled) -->
              <div v-if="currentRoomOverride.usePricingTypeOverride" class="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  @click="currentRoomOverride.pricingType = 'unit'"
                  class="p-4 rounded-xl border-2 transition-all text-left"
                  :class="currentRoomOverride.pricingType === 'unit'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                    : 'border-gray-200 dark:border-slate-600 hover:border-gray-300'"
                >
                  <div class="flex items-center gap-2 mb-1">
                    <span class="material-icons text-blue-500">home</span>
                    <span class="font-semibold text-gray-900 dark:text-white">{{ $t('planning.pricing.unitBased') }}</span>
                  </div>
                  <p class="text-xs text-gray-500 dark:text-slate-400">{{ $t('planning.pricing.unitBasedHint') }}</p>
                </button>
                <button
                  type="button"
                  @click="currentRoomOverride.pricingType = 'per_person'"
                  class="p-4 rounded-xl border-2 transition-all text-left"
                  :class="currentRoomOverride.pricingType === 'per_person'
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30'
                    : 'border-gray-200 dark:border-slate-600 hover:border-gray-300'"
                >
                  <div class="flex items-center gap-2 mb-1">
                    <span class="material-icons text-purple-500">person</span>
                    <span class="font-semibold text-gray-900 dark:text-white">{{ $t('planning.pricing.perPerson') }}</span>
                  </div>
                  <p class="text-xs text-gray-500 dark:text-slate-400">{{ $t('planning.pricing.perPersonHint') }}</p>
                </button>
              </div>

              <!-- Info when disabled -->
              <div v-else class="p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                <p class="text-sm text-gray-600 dark:text-slate-400 flex items-center gap-2">
                  <span class="material-icons text-sm text-blue-500">info</span>
                  {{ $t('planning.seasons.usingRoomPricingType') }}:
                  <span class="font-semibold" :class="currentSelectedRoom.pricingType === 'per_person' ? 'text-purple-600' : 'text-blue-600'">
                    {{ currentSelectedRoom.pricingType === 'per_person' ? $t('planning.pricing.perPerson') : $t('planning.pricing.unitBased') }}
                  </span>
                </p>
              </div>
            </div>

            <!-- 2. Min Adults Override -->
            <div class="bg-gradient-to-r from-cyan-50 to-teal-50 dark:from-cyan-900/20 dark:to-teal-900/20 rounded-xl p-4 border border-cyan-200 dark:border-cyan-800">
              <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-lg bg-cyan-500 flex items-center justify-center">
                    <span class="material-icons text-white">person_outline</span>
                  </div>
                  <div>
                    <h4 class="font-semibold text-gray-900 dark:text-white">Min. Yetişkin Override</h4>
                    <p class="text-xs text-gray-500 dark:text-slate-400">Bu sezonda minimum yetişkin sayısını değiştir</p>
                  </div>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    v-model="currentRoomOverride.useMinAdultsOverride"
                    class="sr-only peer"
                  />
                  <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-300 dark:peer-focus:ring-cyan-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-cyan-600"></div>
                </label>
              </div>

              <!-- MinAdults Input (when override enabled) -->
              <div v-if="currentRoomOverride.useMinAdultsOverride" class="flex items-center gap-4 p-3 bg-white dark:bg-slate-800 rounded-lg">
                <label class="text-sm text-gray-600 dark:text-slate-400">Minimum Yetişkin:</label>
                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    @click="adjustMinAdultsOverride(-1)"
                    :disabled="(currentRoomOverride.minAdults || 1) <= 1"
                    class="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                    :class="(currentRoomOverride.minAdults || 1) <= 1
                      ? 'text-gray-300 dark:text-slate-600 cursor-not-allowed'
                      : 'text-cyan-600 dark:text-cyan-400 hover:bg-cyan-100 dark:hover:bg-cyan-900/30'"
                  >
                    <span class="material-icons">remove</span>
                  </button>
                  <span class="w-10 text-center text-xl font-bold text-gray-800 dark:text-white">{{ currentRoomOverride.minAdults || 1 }}</span>
                  <button
                    type="button"
                    @click="adjustMinAdultsOverride(1)"
                    :disabled="(currentRoomOverride.minAdults || 1) >= (currentSelectedRoom?.occupancy?.maxAdults || 10)"
                    class="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                    :class="(currentRoomOverride.minAdults || 1) >= (currentSelectedRoom?.occupancy?.maxAdults || 10)
                      ? 'text-gray-300 dark:text-slate-600 cursor-not-allowed'
                      : 'text-cyan-600 dark:text-cyan-400 hover:bg-cyan-100 dark:hover:bg-cyan-900/30'"
                  >
                    <span class="material-icons">add</span>
                  </button>
                </div>
                <span class="text-xs text-gray-500 dark:text-slate-400">(Oda max: {{ currentSelectedRoom?.occupancy?.maxAdults || 2 }})</span>
              </div>

              <!-- Info when disabled -->
              <div v-else class="p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                <p class="text-sm text-gray-600 dark:text-slate-400 flex items-center gap-2">
                  <span class="material-icons text-sm text-cyan-500">info</span>
                  Oda/Market ayarı kullanılıyor: <span class="font-semibold">{{ currentSelectedRoom?.occupancy?.minAdults || 1 }} yetişkin</span>
                </p>
              </div>
            </div>

            <!-- 3. Multiplier Override (only for OBP with multipliers) -->
            <div
              v-if="effectivePricingType === 'per_person' && (currentSelectedRoom.useMultipliers || currentRoomOverride.usePricingTypeOverride)"
              class="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-4 border border-indigo-200 dark:border-indigo-800"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-lg bg-indigo-500 flex items-center justify-center">
                    <span class="material-icons text-white">calculate</span>
                  </div>
                  <div>
                    <h4 class="font-semibold text-gray-900 dark:text-white">{{ $t('planning.pricing.multiplierOverride') }}</h4>
                    <p class="text-xs text-gray-500 dark:text-slate-400">{{ $t('planning.seasons.overrideRoomMultipliers') }}</p>
                  </div>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    v-model="currentRoomOverride.useMultiplierOverride"
                    class="sr-only peer"
                  />
                  <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                  <span class="ms-2 text-sm font-medium" :class="currentRoomOverride.useMultiplierOverride ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-slate-400'">
                    {{ currentRoomOverride.useMultiplierOverride ? $t('common.active') : $t('common.inactive') }}
                  </span>
                </label>
              </div>

              <!-- Info when disabled -->
              <div v-if="!currentRoomOverride.useMultiplierOverride" class="mt-3 p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg">
                <p class="text-sm text-gray-600 dark:text-slate-400 flex items-center gap-2">
                  <span class="material-icons text-sm text-blue-500">info</span>
                  {{ $t('planning.pricing.usingRoomMultipliers') }}
                </p>
              </div>
            </div>

            <!-- Multiplier Template (when override enabled) -->
            <div v-if="currentRoomOverride.useMultiplierOverride && effectivePricingType === 'per_person'">
              <MultiplierTemplate
                v-model="currentRoomOverride.multiplierOverride"
                :occupancy="currentSelectedRoom.occupancy"
                :child-age-groups="hotel.childAgeGroups || []"
                :currency="market.currency"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Preview Mode Content -->
    <div v-if="showPreview" class="flex flex-col h-full">
      <!-- Preview Header -->
      <div class="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-slate-700 -mx-4 px-4">
        <div class="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
          <span class="material-icons text-white">fact_check</span>
        </div>
        <div>
          <h3 class="font-semibold text-gray-900 dark:text-white">{{ $t('planning.seasons.periodPreview') }}</h3>
          <p class="text-sm text-gray-500 dark:text-slate-400">{{ form.code }} - {{ form.name?.tr || form.name?.en }}</p>
        </div>
      </div>

      <!-- Preview Content -->
      <div class="flex-1 overflow-y-auto py-4 space-y-4">
        <!-- Summary Stats -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div class="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/30 dark:to-indigo-800/30 rounded-xl p-4 text-center">
            <div class="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{{ previewSummary.totalDays }}</div>
            <div class="text-xs text-indigo-600/70 dark:text-indigo-400/70 font-medium">{{ $t('planning.seasons.totalDays') }}</div>
          </div>
          <div class="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 rounded-xl p-4 text-center">
            <div class="text-3xl font-bold text-purple-600 dark:text-purple-400">{{ previewSummary.dateRanges }}</div>
            <div class="text-xs text-purple-600/70 dark:text-purple-400/70 font-medium">{{ $t('planning.seasons.dateRangeCount') }}</div>
          </div>
          <div class="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 rounded-xl p-4 text-center">
            <div class="text-3xl font-bold text-blue-600 dark:text-blue-400">{{ previewSummary.roomTypes }}</div>
            <div class="text-xs text-blue-600/70 dark:text-blue-400/70 font-medium">{{ $t('planning.pricing.roomTypes') }}</div>
          </div>
          <div class="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 rounded-xl p-4 text-center">
            <div class="text-3xl font-bold text-green-600 dark:text-green-400">{{ previewSummary.mealPlans }}</div>
            <div class="text-xs text-green-600/70 dark:text-green-400/70 font-medium">{{ $t('planning.pricing.mealPlans') }}</div>
          </div>
        </div>

        <!-- Date Ranges Detail -->
        <div class="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4">
          <h5 class="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3 flex items-center gap-2">
            <span class="material-icons text-indigo-500">date_range</span>
            {{ $t('planning.pricing.dateRanges') }}
          </h5>
          <div class="space-y-2">
            <div
              v-for="(range, idx) in validDateRanges"
              :key="idx"
              class="flex items-center gap-3 p-2 bg-white dark:bg-slate-800 rounded-lg"
            >
              <span class="w-7 h-7 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs font-bold">
                {{ idx + 1 }}
              </span>
              <div class="flex items-center gap-2 flex-1">
                <span class="font-medium text-gray-700 dark:text-slate-300">{{ formatDisplayDate(range.startDate) }}</span>
                <span class="material-icons text-gray-400 text-sm">arrow_forward</span>
                <span class="font-medium text-gray-700 dark:text-slate-300">{{ formatDisplayDate(range.endDate) }}</span>
              </div>
              <span class="text-xs px-2 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-full font-medium">
                {{ calculateDays(range.startDate, range.endDate) }} {{ $t('common.days') }}
              </span>
            </div>
          </div>
        </div>

        <!-- Overrides Summary -->
        <div v-if="hasAnyOverrides" class="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4">
          <h5 class="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3 flex items-center gap-2">
            <span class="material-icons text-amber-500">tune</span>
            {{ $t('planning.seasons.activeOverrides') }}
          </h5>
          <div class="flex flex-wrap gap-2">
            <span v-if="!form.childAgeSettings.inheritFromMarket" class="px-3 py-1.5 bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400 rounded-lg text-sm flex items-center gap-1.5">
              <span class="material-icons text-sm">child_care</span>
              {{ $t('planning.seasons.childAgeOverride') }}
            </span>
            <span v-if="!form.paymentSettings.inheritFromMarket" class="px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg text-sm flex items-center gap-1.5">
              <span class="material-icons text-sm">payments</span>
              {{ $t('planning.seasons.paymentSettings') }}
            </span>
            <span v-if="!form.childrenSettings.inheritFromMarket" class="px-3 py-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-lg text-sm flex items-center gap-1.5">
              <span class="material-icons text-sm">family_restroom</span>
              {{ $t('planning.markets.childrenAllowed') }}
            </span>
            <span v-if="hasPricingOverrides" class="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg text-sm flex items-center gap-1.5">
              <span class="material-icons text-sm">calculate</span>
              {{ $t('planning.seasons.pricingOverrides') }}
            </span>
          </div>
        </div>
      </div>

      <!-- Preview Actions -->
      <div class="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-slate-700">
        <p class="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1">
          <span class="material-icons text-xs">info</span>
          {{ $t('planning.seasons.previewHint') }}
        </p>
        <div class="flex gap-3">
          <button @click="showPreview = false" type="button" class="btn-secondary">
            <span class="material-icons text-sm mr-1">arrow_back</span>
            {{ $t('common.back') }}
          </button>
          <button @click="confirmAndSave" type="button" class="btn-primary" :disabled="saving">
            <span class="material-icons text-sm mr-1">check</span>
            {{ saving ? $t('common.loading') : $t('planning.pricing.confirmAndSave') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Actions (hide when preview is open) -->
    <div v-if="!showPreview" class="flex justify-end gap-3 pt-4 mt-6 border-t border-gray-200 dark:border-slate-700">
      <button type="button" @click="$emit('cancel')" class="btn-secondary">{{ $t('common.cancel') }}</button>
      <button type="button" @click="handlePreview" class="btn-primary" :disabled="saving">
        <span class="material-icons text-sm mr-1">visibility</span>
        {{ $t('planning.seasons.reviewAndSave') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import planningService from '@/services/planningService'
import DatePicker from '@/components/common/DatePicker.vue'
import MultiLangInput from '@/components/common/MultiLangInput.vue'
import MultiplierTemplate from '@/components/planning/rooms/MultiplierTemplate.vue'

const props = defineProps({
  hotel: { type: Object, required: true },
  season: { type: Object, default: null },
  market: { type: Object, required: true },
  roomTypes: { type: Array, default: () => [] },
  mealPlans: { type: Array, default: () => [] },
  existingSeasons: { type: Array, default: () => [] }
})

const emit = defineEmits(['saved', 'cancel'])

const { t, locale } = useI18n()
const toast = useToast()
const saving = ref(false)
const activeTab = ref('general')
const selectedPricingRoom = ref('')
const showPreview = ref(false)

// Tab definitions
const tabs = computed(() => [
  { id: 'general', label: t('planning.seasons.generalSettings'), icon: 'settings' },
  { id: 'pricing', label: t('planning.seasons.pricingTab'), icon: 'payments' }
])

// Filter room types and meal plans based on market's active selections
const filteredRoomTypes = computed(() => {
  const marketActiveIds = (props.market?.activeRoomTypes || []).map(id => typeof id === 'object' ? id._id : id)
  if (marketActiveIds.length === 0) {
    return props.roomTypes
  }
  return props.roomTypes.filter(rt => marketActiveIds.includes(rt._id))
})

const filteredMealPlans = computed(() => {
  const marketActiveIds = (props.market?.activeMealPlans || []).map(id => typeof id === 'object' ? id._id : id)
  if (marketActiveIds.length === 0) {
    return props.mealPlans
  }
  return props.mealPlans.filter(mp => marketActiveIds.includes(mp._id))
})

// Room types for pricing tab - considers season's active room types
const pricingRoomTypes = computed(() => {
  // If season has specific active room types, use those
  if (form.activeRoomTypes.length > 0) {
    return filteredRoomTypes.value.filter(rt => form.activeRoomTypes.includes(rt._id))
  }
  // Otherwise inherit from market (use all filtered room types)
  return filteredRoomTypes.value
})

// Current selected room
const currentSelectedRoom = computed(() => {
  return pricingRoomTypes.value.find(rt => rt._id === selectedPricingRoom.value)
})

// Pricing overrides storage
const pricingOverrides = reactive({})

// Current room override data
const currentRoomOverride = computed(() => {
  if (!selectedPricingRoom.value) {
    return {
      usePricingTypeOverride: false,
      pricingType: 'unit',
      useMinAdultsOverride: false,
      minAdults: 1,
      useMultiplierOverride: false,
      multiplierOverride: null
    }
  }
  if (!pricingOverrides[selectedPricingRoom.value]) {
    // Initialize with room's settings
    const room = currentSelectedRoom.value
    pricingOverrides[selectedPricingRoom.value] = {
      usePricingTypeOverride: false,
      pricingType: room?.pricingType || 'unit',
      useMinAdultsOverride: false,
      minAdults: room?.occupancy?.minAdults || 1,
      useMultiplierOverride: false,
      multiplierOverride: room?.multiplierTemplate ? JSON.parse(JSON.stringify(room.multiplierTemplate)) : null
    }
  }
  return pricingOverrides[selectedPricingRoom.value]
})

// Adjust minAdults override value
const adjustMinAdultsOverride = (delta) => {
  if (!currentRoomOverride.value) return
  const current = currentRoomOverride.value.minAdults || 1
  const maxAdults = currentSelectedRoom.value?.occupancy?.maxAdults || 10
  const newValue = current + delta
  if (newValue >= 1 && newValue <= maxAdults) {
    currentRoomOverride.value.minAdults = newValue
  }
}

// Effective pricing type (considering override)
const effectivePricingType = computed(() => {
  if (!currentRoomOverride.value) return 'unit'
  if (currentRoomOverride.value.usePricingTypeOverride) {
    return currentRoomOverride.value.pricingType
  }
  return currentSelectedRoom.value?.pricingType || 'unit'
})

// Check if any room has overrides
const hasPricingOverrides = computed(() => {
  return Object.values(pricingOverrides).some(o =>
    o.usePricingTypeOverride || o.useMinAdultsOverride || o.useMultiplierOverride
  )
})

// Check if specific room has override
const hasRoomOverride = (roomId) => {
  const override = pricingOverrides[roomId]
  return override?.usePricingTypeOverride || override?.useMinAdultsOverride || override?.useMultiplierOverride || false
}

// Period Edit Preview
const validDateRanges = computed(() => {
  return form.dateRanges.filter(r => r.startDate && r.endDate)
})

const calculateDays = (startDate, endDate) => {
  if (!startDate || !endDate) return 0
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffTime = Math.abs(end - start)
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
}

const previewSummary = computed(() => {
  const totalDays = validDateRanges.value.reduce((sum, range) => {
    return sum + calculateDays(range.startDate, range.endDate)
  }, 0)

  const roomTypesCount = form.activeRoomTypes.length > 0
    ? form.activeRoomTypes.length
    : filteredRoomTypes.value.length

  const mealPlansCount = form.activeMealPlans.length > 0
    ? form.activeMealPlans.length
    : filteredMealPlans.value.length

  return {
    totalDays,
    dateRanges: validDateRanges.value.length,
    roomTypes: roomTypesCount,
    mealPlans: mealPlansCount
  }
})

const hasAnyOverrides = computed(() => {
  return !form.childAgeSettings.inheritFromMarket ||
         !form.paymentSettings.inheritFromMarket ||
         !form.childrenSettings.inheritFromMarket ||
         hasPricingOverrides.value
})

const formatDisplayDate = (dateStr) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString(locale.value === 'tr' ? 'tr-TR' : 'en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

// Check if two date ranges overlap
const datesOverlap = (start1, end1, start2, end2) => {
  const s1 = new Date(start1).getTime()
  const e1 = new Date(end1).getTime()
  const s2 = new Date(start2).getTime()
  const e2 = new Date(end2).getTime()
  return s1 <= e2 && s2 <= e1
}

// Check for date overlaps with existing seasons
const checkDateOverlaps = () => {
  const currentSeasonId = props.season?._id
  const existingSeasons = props.existingSeasons || []

  for (const range of validDateRanges.value) {
    for (const existingSeason of existingSeasons) {
      // Skip current season when editing
      if (existingSeason._id === currentSeasonId) continue

      // Check each date range of existing season
      for (const existingRange of (existingSeason.dateRanges || [])) {
        if (datesOverlap(range.startDate, range.endDate, existingRange.startDate, existingRange.endDate)) {
          return {
            hasOverlap: true,
            conflictingSeason: existingSeason,
            conflictingRange: existingRange,
            newRange: range
          }
        }
      }
    }
  }

  return { hasOverlap: false }
}

const handlePreview = () => {
  const hasName = SUPPORTED_LANGUAGES.some(l => form.name[l]?.trim())
  if (!form.code || !hasName) {
    toast.error(t('validation.required'))
    return
  }

  if (validDateRanges.value.length === 0) {
    toast.error(t('planning.seasons.selectDateRanges'))
    return
  }

  // Check for date overlaps
  const overlapCheck = checkDateOverlaps()
  if (overlapCheck.hasOverlap) {
    const seasonCode = overlapCheck.conflictingSeason.code
    const startDate = new Date(overlapCheck.conflictingRange.startDate).toLocaleDateString('tr-TR')
    const endDate = new Date(overlapCheck.conflictingRange.endDate).toLocaleDateString('tr-TR')
    toast.error(`Tarih çakışması! "${seasonCode}" sezonu ile çakışıyor (${startDate} - ${endDate})`)
    return
  }

  showPreview.value = true
}

const confirmAndSave = () => {
  showPreview.value = false
  handleSave()
}

// Hotel's child age groups
const hotelChildAgeGroups = computed(() => {
  return props.hotel?.childAgeGroups || []
})

// Helper functions for child age groups
const getChildGroupName = (group) => {
  return group.name?.[locale.value] || group.name?.tr || group.name?.en || group.code
}

const getChildGroupLabel = (code) => {
  const labels = {
    infant: t('planning.childGroups.infant'),
    first: t('planning.childGroups.first'),
    second: t('planning.childGroups.second')
  }
  return labels[code] || code
}

const getChildGroupIcon = (code) => {
  const icons = { infant: 'baby_changing_station', first: 'child_care', second: 'escalator_warning' }
  return icons[code] || 'child_care'
}

const getChildGroupIconClass = (code) => {
  const classes = { infant: 'text-purple-500', first: 'text-pink-500', second: 'text-orange-500' }
  return classes[code] || 'text-pink-500'
}

const getHotelGroupAge = (code, type) => {
  const group = hotelChildAgeGroups.value.find(g => g.code === code)
  if (!group) return ''
  return type === 'min' ? group.minAge : group.maxAge
}

// Initialize child age groups from hotel
const initChildAgeGroups = () => {
  return hotelChildAgeGroups.value.map(g => ({
    code: g.code,
    minAge: g.minAge,
    maxAge: g.maxAge
  }))
}

const SUPPORTED_LANGUAGES = ['tr', 'en', 'ru', 'el', 'de', 'es', 'it', 'fr', 'ro', 'bg', 'pt', 'da', 'zh', 'ar', 'fa', 'he', 'sq', 'uk', 'pl', 'az']
const createMultiLangObject = () => {
  const obj = {}
  SUPPORTED_LANGUAGES.forEach(lang => { obj[lang] = '' })
  return obj
}

const form = reactive({
  code: '',
  name: createMultiLangObject(),
  color: '#6366f1',
  priority: 0,
  dateRanges: [{ startDate: '', endDate: '' }],
  activeRoomTypes: [],
  activeMealPlans: [],
  childAgeSettings: {
    inheritFromMarket: true,
    childAgeGroups: [] // Will be initialized from hotel's childAgeGroups
  },
  paymentSettings: {
    inheritFromMarket: true,
    creditCard: { enabled: true },
    bankTransfer: { enabled: true, releaseDays: 3, discountRate: 0 }
  },
  childrenSettings: {
    inheritFromMarket: true,
    allowed: true
  }
})

const addDateRange = () => {
  form.dateRanges.push({ startDate: '', endDate: '' })
}

const removeDateRange = (index) => {
  form.dateRanges.splice(index, 1)
}

const formatDateForInput = (date) => {
  if (!date) return ''
  return new Date(date).toISOString().split('T')[0]
}

const handleSave = async () => {
  const hasName = SUPPORTED_LANGUAGES.some(l => form.name[l]?.trim())
  if (!form.code || !hasName) {
    toast.error(t('validation.required'))
    return
  }

  // Double-check for date overlaps before saving
  const overlapCheck = checkDateOverlaps()
  if (overlapCheck.hasOverlap) {
    const seasonCode = overlapCheck.conflictingSeason.code
    const startDate = new Date(overlapCheck.conflictingRange.startDate).toLocaleDateString('tr-TR')
    const endDate = new Date(overlapCheck.conflictingRange.endDate).toLocaleDateString('tr-TR')
    toast.error(`Tarih çakışması! "${seasonCode}" sezonu ile çakışıyor (${startDate} - ${endDate})`)
    return
  }

  // Build pricing overrides array
  const pricingOverridesArray = []
  for (const [roomId, override] of Object.entries(pricingOverrides)) {
    if (override.usePricingTypeOverride || override.useMinAdultsOverride || override.useMultiplierOverride) {
      pricingOverridesArray.push({
        roomType: roomId,
        usePricingTypeOverride: override.usePricingTypeOverride || false,
        pricingType: override.pricingType || 'unit',
        useMinAdultsOverride: override.useMinAdultsOverride || false,
        minAdults: override.minAdults || 1,
        useMultiplierOverride: override.useMultiplierOverride || false,
        multiplierOverride: override.multiplierOverride
      })
    }
  }

  const formData = {
    ...form,
    market: props.market._id,
    pricingOverrides: pricingOverridesArray
  }

  saving.value = true
  try {
    if (props.season) {
      await planningService.updateSeason(props.hotel._id, props.season._id, formData)
      toast.success(t('planning.pricing.seasonUpdated'))
    } else {
      await planningService.createSeason(props.hotel._id, formData)
      toast.success(t('planning.pricing.seasonCreated'))
    }
    emit('saved')
  } catch (error) {
    toast.error(error.response?.data?.message || t('common.operationFailed'))
  } finally {
    saving.value = false
  }
}

// Initialize first room when pricing tab is opened
watch(activeTab, (newTab) => {
  if (newTab === 'pricing' && pricingRoomTypes.value.length > 0 && !selectedPricingRoom.value) {
    selectedPricingRoom.value = pricingRoomTypes.value[0]._id
  }
})

// When active room types change, update selected room if needed
watch(() => form.activeRoomTypes, () => {
  // If currently selected room is no longer in the list, select first available
  if (selectedPricingRoom.value && !pricingRoomTypes.value.find(rt => rt._id === selectedPricingRoom.value)) {
    selectedPricingRoom.value = pricingRoomTypes.value[0]?._id || ''
  }
}, { deep: true })

// When child age override is enabled, initialize groups from hotel if empty
watch(() => form.childAgeSettings.inheritFromMarket, (newVal) => {
  if (!newVal && form.childAgeSettings.childAgeGroups.length === 0) {
    form.childAgeSettings.childAgeGroups = initChildAgeGroups()
  }
})

// When hotel's childAgeGroups become available, initialize if needed
watch(hotelChildAgeGroups, (newGroups) => {
  if (newGroups.length > 0 && form.childAgeSettings.childAgeGroups.length === 0) {
    form.childAgeSettings.childAgeGroups = initChildAgeGroups()
  }
}, { immediate: true })

onMounted(() => {
  if (props.season) {
    const extractIds = (arr) => (arr || []).map(item => typeof item === 'object' ? item._id : item)

    form.code = props.season.code || ''
    form.name = { ...createMultiLangObject(), ...props.season.name }
    form.color = props.season.color || '#6366f1'
    form.priority = props.season.priority || 0
    form.dateRanges = props.season.dateRanges?.length
      ? props.season.dateRanges.map(r => ({
          startDate: formatDateForInput(r.startDate),
          endDate: formatDateForInput(r.endDate)
        }))
      : [{ startDate: '', endDate: '' }]
    form.activeRoomTypes = extractIds(props.season.activeRoomTypes)
    form.activeMealPlans = extractIds(props.season.activeMealPlans)

    // Load child age settings
    const seasonGroups = props.season.childAgeSettings?.childAgeGroups || []
    form.childAgeSettings = {
      inheritFromMarket: props.season.childAgeSettings?.inheritFromMarket ?? true,
      childAgeGroups: seasonGroups.length > 0 ? seasonGroups : initChildAgeGroups()
    }
    form.paymentSettings = {
      inheritFromMarket: props.season.paymentSettings?.inheritFromMarket ?? true,
      creditCard: { enabled: props.season.paymentSettings?.creditCard?.enabled ?? true },
      bankTransfer: {
        enabled: props.season.paymentSettings?.bankTransfer?.enabled ?? true,
        releaseDays: props.season.paymentSettings?.bankTransfer?.releaseDays ?? 3,
        discountRate: props.season.paymentSettings?.bankTransfer?.discountRate ?? 0
      }
    }
    form.childrenSettings = {
      inheritFromMarket: props.season.childrenSettings?.inheritFromMarket ?? true,
      allowed: props.season.childrenSettings?.allowed ?? true
    }

    // Load existing pricing overrides
    if (props.season.pricingOverrides?.length) {
      props.season.pricingOverrides.forEach(override => {
        const roomId = typeof override.roomType === 'object' ? override.roomType._id : override.roomType
        pricingOverrides[roomId] = {
          usePricingTypeOverride: override.usePricingTypeOverride || false,
          pricingType: override.pricingType || 'unit',
          useMinAdultsOverride: override.useMinAdultsOverride || false,
          minAdults: override.minAdults || 1,
          useMultiplierOverride: override.useMultiplierOverride || false,
          multiplierOverride: override.multiplierOverride || null
        }
      })
    }
  }

  // Initialize child age groups from hotel if creating new season
  if (!props.season && form.childAgeSettings.childAgeGroups.length === 0) {
    form.childAgeSettings.childAgeGroups = initChildAgeGroups()
  }

  // Select first room if available
  if (pricingRoomTypes.value.length > 0) {
    selectedPricingRoom.value = pricingRoomTypes.value[0]._id
  }
})
</script>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
