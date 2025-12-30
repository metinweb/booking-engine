<template>
  <div class="flex flex-col h-full">
    <!-- Tab Navigation (Sticky) -->
    <div class="flex border-b border-gray-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 z-10 -mx-4 px-4">
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

    <!-- Tab Content -->
    <div class="space-y-6 flex-1 overflow-y-auto overflow-x-hidden mt-6">
      <!-- General Settings Tab -->
      <div v-show="activeTab === 'general'">
        <!-- Code -->
        <div class="mb-4">
          <label class="form-label">{{ $t('planning.markets.code') }} <span class="text-red-500">*</span></label>
          <input v-model="form.code" type="text" class="form-input uppercase" maxlength="10" />
        </div>

        <!-- Name (Multilingual) -->
        <div class="mb-4">
          <MultiLangInput
            v-model="form.name"
            :languages="SUPPORTED_LANGUAGES"
            :label="$t('planning.markets.name') + ' *'"
          />
        </div>

        <!-- Currency -->
        <div class="mb-4">
          <label class="form-label">{{ $t('planning.markets.currency') }} <span class="text-red-500">*</span></label>
          <select v-model="form.currency" class="form-select">
            <option v-for="curr in currencies" :key="curr" :value="curr">{{ curr }}</option>
          </select>
        </div>

        <!-- Countries -->
        <div class="mb-4">
          <label class="form-label">{{ $t('planning.markets.countriesLabel') }}</label>
          <div class="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg max-h-48 overflow-y-auto">
            <div class="grid grid-cols-3 md:grid-cols-4 gap-2">
              <label
                v-for="country in commonCountries"
                :key="country.code"
                class="flex items-center gap-2 text-sm cursor-pointer"
              >
                <input
                  type="checkbox"
                  :value="country.code"
                  v-model="form.countries"
                  class="rounded border-gray-300 text-indigo-600"
                />
                <span>{{ country.name }}</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Child Age Settings -->
        <div class="p-4 bg-pink-50 dark:bg-pink-900/20 rounded-lg border border-pink-200 dark:border-pink-800 mb-4">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <span class="material-icons text-pink-500">child_care</span>
              <label class="form-label mb-0">{{ $t('planning.markets.ageSettings') }}</label>
            </div>
            <!-- Inherit from hotel toggle -->
            <div class="flex items-center gap-2">
              <span class="text-xs text-gray-500 dark:text-slate-400">{{ $t('planning.markets.inheritFromHotel') }}</span>
              <button
                type="button"
                @click="form.childAgeSettings.inheritFromHotel = !form.childAgeSettings.inheritFromHotel"
                class="relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none"
                :class="form.childAgeSettings.inheritFromHotel ? 'bg-pink-500' : 'bg-gray-300 dark:bg-slate-600'"
              >
                <span
                  class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-300"
                  :class="form.childAgeSettings.inheritFromHotel ? 'translate-x-6' : 'translate-x-0'"
                ></span>
              </button>
            </div>
          </div>

          <p class="text-xs text-gray-500 dark:text-slate-400 mb-4">
            {{ $t('planning.markets.ageSettingsHint') }}
          </p>

          <!-- Using hotel settings info -->
          <div v-if="form.childAgeSettings.inheritFromHotel" class="p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg border border-gray-200 dark:border-slate-600">
            <p class="text-xs text-gray-500 dark:text-slate-400 mb-2 flex items-center gap-1">
              <span class="material-icons text-xs">link</span>
              {{ $t('planning.markets.usingHotelSettings') }}
            </p>
            <div v-if="hotelChildAgeGroups.length" class="space-y-2">
              <div
                v-for="group in hotelChildAgeGroups"
                :key="group.code"
                class="flex items-center gap-4 p-2 bg-gray-50 dark:bg-slate-700/50 rounded-lg"
              >
                <span
                  class="inline-flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-medium w-28"
                  :class="group.code === 'infant'
                    ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300'
                    : group.code === 'first'
                      ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                      : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'"
                >
                  <span class="material-icons text-sm">
                    {{ group.code === 'infant' ? 'baby_changing_station' : 'child_care' }}
                  </span>
                  {{ $t(`planning.childGroups.${group.code}`) }}
                </span>
                <span class="text-sm text-gray-600 dark:text-slate-300">
                  {{ group.minAge }} — {{ group.maxAge }} {{ $t('planning.markets.years') }}
                </span>
              </div>
            </div>
            <p v-else class="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
              <span class="material-icons text-xs">warning</span>
              {{ $t('planning.markets.noChildGroups') }}
            </p>
          </div>

          <!-- Override child age groups (like hotel form) -->
          <div v-else>
            <!-- Header with Add Button -->
            <div class="flex items-center justify-between mb-3">
              <p class="text-xs text-gray-500 dark:text-slate-400">
                {{ $t('planning.markets.customAgeGroups') }}
              </p>
              <button
                v-if="form.childAgeSettings.childAgeGroups.length < 3"
                type="button"
                @click="addChildAgeGroup"
                class="px-3 py-1.5 text-xs bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 rounded-lg hover:bg-pink-200 dark:hover:bg-pink-900/50 transition-colors flex items-center gap-1"
              >
                <span class="material-icons text-sm">add</span>
                {{ $t('planning.markets.addAgeGroup') }}
              </button>
            </div>

            <div class="space-y-3">
              <div
                v-for="(group, index) in form.childAgeSettings.childAgeGroups"
                :key="group.code"
                class="flex items-center gap-4 p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-600"
              >
                <!-- Age Group Badge -->
                <div class="w-28 flex-shrink-0">
                  <span
                    class="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium"
                    :class="group.code === 'infant'
                      ? 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-300'
                      : group.code === 'first'
                        ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                        : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'"
                  >
                    <span class="material-icons text-sm">
                      {{ group.code === 'infant' ? 'baby_changing_station' : 'child_care' }}
                    </span>
                    {{ $t(`planning.childGroups.${group.code}`) }}
                  </span>
                </div>

                <!-- Age Range Inputs -->
                <div class="flex items-center gap-2">
                  <div class="w-16">
                    <input
                      :value="group.minAge"
                      type="number"
                      min="0"
                      max="17"
                      class="form-input text-sm py-1.5 text-center bg-gray-100 dark:bg-slate-600 cursor-not-allowed"
                      disabled
                      readonly
                    />
                    <span class="text-[10px] text-gray-400 block text-center">min</span>
                  </div>

                  <span class="text-gray-400 font-bold">—</span>

                  <div class="w-16">
                    <input
                      v-model.number="group.maxAge"
                      type="number"
                      :min="group.minAge"
                      max="17"
                      class="form-input text-sm py-1.5 text-center"
                      @change="onMaxAgeChange(index)"
                    />
                    <span class="text-[10px] text-gray-400 block text-center">max</span>
                  </div>

                  <span class="text-sm text-gray-500">{{ $t('planning.markets.years') }}</span>
                </div>

                <div class="flex-1"></div>

                <!-- Delete Button -->
                <button
                  v-if="form.childAgeSettings.childAgeGroups.length > 1"
                  type="button"
                  @click="removeChildAgeGroup(index)"
                  class="p-1.5 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                  :title="$t('common.delete')"
                >
                  <span class="material-icons text-sm">delete</span>
                </button>
              </div>
            </div>

            <p v-if="!form.childAgeSettings.childAgeGroups.length" class="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-3">
              <span class="material-icons text-xs">warning</span>
              {{ $t('planning.markets.noChildGroups') }}
            </p>

            <p class="text-xs text-gray-500 dark:text-slate-400 mt-3 flex items-center gap-1">
              <span class="material-icons text-xs">info</span>
              {{ $t('planning.markets.maxAgeGroupsHint') }}
            </p>
          </div>
        </div>

        <!-- Sales Channels (Visibility) -->
        <div class="mb-4">
          <label class="form-label">{{ $t('planning.markets.salesChannels') }}</label>
          <div class="flex gap-4">
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" v-model="form.salesChannels.b2c" class="rounded border-gray-300 text-indigo-600" />
              <span class="text-sm">B2C</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" v-model="form.salesChannels.b2b" class="rounded border-gray-300 text-indigo-600" />
              <span class="text-sm">B2B</span>
            </label>
          </div>
        </div>

        <!-- Active Products -->
        <div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 space-y-4 mb-4">
          <div class="flex items-center gap-2 mb-1">
            <span class="material-icons text-blue-500">inventory_2</span>
            <label class="form-label mb-0">{{ $t('planning.markets.activeProducts') }}</label>
          </div>
          <p class="text-xs text-gray-500 dark:text-slate-400">
            {{ $t('planning.markets.activeProductsHint') }}
          </p>

          <!-- Active Room Types -->
          <div v-if="roomTypes.length" class="p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-600">
            <div class="flex items-center gap-2 mb-3">
              <span class="material-icons text-blue-500 text-sm">hotel</span>
              <label class="text-sm font-medium text-gray-700 dark:text-slate-300">{{ $t('planning.markets.activeRoomTypes') }}</label>
            </div>
            <div class="flex flex-wrap gap-2">
              <label
                v-for="rt in roomTypes"
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
                <span>{{ rt.code }}</span>
                <span class="text-xs text-gray-500 dark:text-slate-400">{{ rt.name?.[locale] || rt.name?.tr }}</span>
              </label>
            </div>
            <p class="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1">
              <span class="material-icons text-xs">info</span>
              {{ $t('planning.markets.emptyMeansAll') }}
            </p>
          </div>

          <!-- Active Meal Plans -->
          <div v-if="mealPlans.length" class="p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-600">
            <div class="flex items-center gap-2 mb-3">
              <span class="material-icons text-green-500 text-sm">restaurant</span>
              <label class="text-sm font-medium text-gray-700 dark:text-slate-300">{{ $t('planning.markets.activeMealPlans') }}</label>
            </div>
            <div class="flex flex-wrap gap-2">
              <label
                v-for="mp in mealPlans"
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
                <span>{{ mp.code }}</span>
                <span class="text-xs text-gray-500 dark:text-slate-400">{{ mp.name?.[locale] || mp.name?.tr }}</span>
              </label>
            </div>
            <p class="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1">
              <span class="material-icons text-xs">info</span>
              {{ $t('planning.markets.emptyMeansAll') }}
            </p>
          </div>
        </div>

        <!-- Rate Policy -->
        <div class="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg space-y-4 mb-4">
          <label class="form-label">{{ $t('planning.markets.ratePolicy') }}</label>
          <div class="flex flex-wrap gap-3">
            <label
              v-for="policy in ratePolicies"
              :key="policy.value"
              class="flex items-center gap-2 px-4 py-2 rounded-lg border-2 cursor-pointer transition-all"
              :class="form.ratePolicy === policy.value
                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                : 'border-gray-200 dark:border-slate-600 hover:border-gray-300'"
            >
              <input type="radio" v-model="form.ratePolicy" :value="policy.value" class="sr-only" />
              <span class="text-sm font-medium">{{ policy.label }}</span>
            </label>
          </div>

          <!-- Non-Refundable Discount -->
          <div v-if="form.ratePolicy !== 'refundable'" class="flex items-center gap-3 pt-3 border-t border-gray-200 dark:border-slate-600">
            <label class="text-sm text-gray-600 dark:text-slate-400">{{ $t('planning.markets.nonRefundableDiscount') }}</label>
            <div class="flex items-center gap-2">
              <input
                v-model.number="form.nonRefundableDiscount"
                type="number"
                min="0"
                max="50"
                class="form-input w-20 text-center"
              />
              <span class="text-sm text-gray-500">%</span>
            </div>
          </div>
        </div>

        <!-- Taxes Section -->
        <div class="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg space-y-4 mb-4">
          <label class="form-label">{{ $t('planning.markets.taxes') }}</label>

          <!-- VAT -->
          <div class="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-600">
            <div class="flex items-center gap-3">
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" v-model="form.taxes.vat.enabled" class="rounded border-gray-300 text-indigo-600" />
                <span class="font-medium text-sm">{{ $t('planning.markets.vat') }}</span>
              </label>
            </div>
            <div v-if="form.taxes.vat.enabled" class="flex items-center gap-3">
              <div class="flex items-center gap-2">
                <input v-model.number="form.taxes.vat.rate" type="number" min="0" max="100" class="form-input w-16 text-center text-sm" />
                <span class="text-sm text-gray-500">%</span>
              </div>
              <label class="flex items-center gap-1 text-sm cursor-pointer">
                <input type="checkbox" v-model="form.taxes.vat.included" class="rounded border-gray-300 text-indigo-600" />
                <span class="text-gray-600 dark:text-slate-400">{{ $t('planning.markets.includedInPrice') }}</span>
              </label>
            </div>
          </div>

          <!-- City Tax -->
          <div class="p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-600 space-y-3">
            <div class="flex items-center gap-3">
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" v-model="form.taxes.cityTax.enabled" class="rounded border-gray-300 text-indigo-600" />
                <span class="font-medium text-sm">{{ $t('planning.markets.cityTax') }}</span>
              </label>
            </div>
            <div v-if="form.taxes.cityTax.enabled" class="grid grid-cols-2 gap-3">
              <div>
                <label class="text-xs text-gray-500 dark:text-slate-400">{{ $t('planning.markets.taxType') }}</label>
                <select v-model="form.taxes.cityTax.type" class="form-select text-sm">
                  <option value="percentage">{{ $t('planning.markets.percentage') }}</option>
                  <option value="fixed_per_night">{{ $t('planning.markets.fixedPerNight') }}</option>
                  <option value="fixed_per_person">{{ $t('planning.markets.fixedPerPerson') }}</option>
                  <option value="fixed_per_person_night">{{ $t('planning.markets.fixedPerPersonNight') }}</option>
                </select>
              </div>
              <div>
                <label class="text-xs text-gray-500 dark:text-slate-400">{{ $t('planning.markets.amount') }}</label>
                <div class="flex items-center gap-2">
                  <input v-model.number="form.taxes.cityTax.amount" type="number" min="0" class="form-input text-sm" />
                  <span class="text-sm text-gray-500">{{ form.taxes.cityTax.type === 'percentage' ? '%' : form.currency }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Service Charge -->
          <div class="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-600">
            <div class="flex items-center gap-3">
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" v-model="form.taxes.serviceCharge.enabled" class="rounded border-gray-300 text-indigo-600" />
                <span class="font-medium text-sm">{{ $t('planning.markets.serviceCharge') }}</span>
              </label>
            </div>
            <div v-if="form.taxes.serviceCharge.enabled" class="flex items-center gap-3">
              <div class="flex items-center gap-2">
                <input v-model.number="form.taxes.serviceCharge.rate" type="number" min="0" max="100" class="form-input w-16 text-center text-sm" />
                <span class="text-sm text-gray-500">%</span>
              </div>
              <label class="flex items-center gap-1 text-sm cursor-pointer">
                <input type="checkbox" v-model="form.taxes.serviceCharge.included" class="rounded border-gray-300 text-indigo-600" />
                <span class="text-gray-600 dark:text-slate-400">{{ $t('planning.markets.includedInPrice') }}</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Cancellation Policy -->
        <div class="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg space-y-4">
          <label class="form-label">{{ $t('planning.markets.cancellationPolicy') }}</label>

          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" v-model="form.cancellationPolicy.useHotelPolicy" class="rounded border-gray-300 text-indigo-600" />
            <span class="text-sm">{{ $t('planning.markets.useHotelPolicy') }}</span>
          </label>

          <div v-if="!form.cancellationPolicy.useHotelPolicy" class="space-y-4 pt-3 border-t border-gray-200 dark:border-slate-600">
            <!-- Free Cancellation Days -->
            <div class="flex items-center gap-3">
              <label class="text-sm text-gray-600 dark:text-slate-400">{{ $t('planning.markets.freeCancellationDays') }}</label>
              <div class="flex items-center gap-2">
                <input
                  v-model.number="form.cancellationPolicy.freeCancellationDays"
                  type="number"
                  min="0"
                  class="form-input w-20 text-center"
                />
                <span class="text-sm text-gray-500">{{ $t('planning.markets.daysBeforeCheckin') }}</span>
              </div>
            </div>

            <!-- Penalty Rules -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <label class="text-sm font-medium text-gray-700 dark:text-slate-300">{{ $t('planning.markets.penaltyRules') }}</label>
                <button type="button" @click="addPenaltyRule" class="text-sm text-purple-600 hover:text-purple-800">
                  + {{ $t('common.add') }}
                </button>
              </div>
              <div v-for="(rule, index) in form.cancellationPolicy.penaltyRules" :key="index" class="flex items-center gap-3 mb-2">
                <div class="flex items-center gap-2 flex-1">
                  <input v-model.number="rule.daysBeforeCheckIn" type="number" min="0" class="form-input w-16 text-center text-sm" />
                  <span class="text-xs text-gray-500">{{ $t('planning.markets.daysBeforeCheckin') }}</span>
                </div>
                <select v-model="rule.penaltyType" class="form-select w-32 text-sm">
                  <option value="percentage">{{ $t('planning.markets.percentage') }}</option>
                  <option value="nights">{{ $t('planning.markets.nights') }}</option>
                </select>
                <div class="flex items-center gap-1">
                  <input v-model.number="rule.penaltyValue" type="number" min="0" class="form-input w-16 text-center text-sm" />
                  <span class="text-xs text-gray-500">{{ rule.penaltyType === 'percentage' ? '%' : $t('planning.markets.nights') }}</span>
                </div>
                <button type="button" @click="removePenaltyRule(index)" class="text-red-500 hover:text-red-700">
                  <span class="material-icons text-sm">close</span>
                </button>
              </div>
            </div>

            <!-- No Show Penalty -->
            <div class="flex items-center gap-3">
              <label class="text-sm text-gray-600 dark:text-slate-400">{{ $t('planning.markets.noShowPenalty') }}</label>
              <select v-model="form.cancellationPolicy.noShowPenalty.type" class="form-select w-32 text-sm">
                <option value="full">{{ $t('planning.markets.fullAmount') }}</option>
                <option value="percentage">{{ $t('planning.markets.percentage') }}</option>
                <option value="nights">{{ $t('planning.markets.nights') }}</option>
              </select>
              <input
                v-if="form.cancellationPolicy.noShowPenalty.type !== 'full'"
                v-model.number="form.cancellationPolicy.noShowPenalty.value"
                type="number"
                min="0"
                class="form-input w-16 text-center text-sm"
              />
            </div>
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
              <h4 class="font-medium text-indigo-800 dark:text-indigo-300 mb-1">{{ $t('planning.markets.pricingOverrideInfo') }}</h4>
              <p class="text-sm text-indigo-700 dark:text-indigo-400">{{ $t('planning.markets.pricingOverrideDescription') }}</p>
            </div>
          </div>
        </div>

        <!-- No Rooms Warning -->
        <div v-if="pricingRoomTypes.length === 0" class="text-center py-12">
          <div class="w-16 h-16 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-4">
            <span class="material-icons text-3xl text-gray-400 dark:text-slate-500">hotel</span>
          </div>
          <h5 class="font-medium text-gray-600 dark:text-slate-400 mb-2">{{ $t('planning.markets.noRooms') }}</h5>
          <p class="text-sm text-gray-500 dark:text-slate-500 max-w-md mx-auto">
            {{ $t('planning.markets.noRoomsHint') }}
          </p>
        </div>

        <!-- Room Type Tabs for Pricing Overrides -->
        <div v-else>
          <!-- Room Selection Tabs -->
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
                    <h4 class="font-semibold text-gray-900 dark:text-white">{{ $t('planning.markets.pricingTypeOverride') }}</h4>
                    <p class="text-xs text-gray-500 dark:text-slate-400">{{ $t('planning.markets.pricingTypeOverrideHint') }}</p>
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
                  {{ $t('planning.markets.usingRoomPricingType') }}:
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
                    <p class="text-xs text-gray-500 dark:text-slate-400">Bu markette minimum yetişkin sayısını değiştir</p>
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
                  Oda ayarı kullanılıyor: <span class="font-semibold">{{ currentSelectedRoom?.occupancy?.minAdults || 1 }} yetişkin</span>
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
                    <p class="text-xs text-gray-500 dark:text-slate-400">{{ $t('planning.markets.overrideRoomMultipliers') }}</p>
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
                :currency="form.currency"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex justify-end gap-3 pt-4 mt-6 border-t border-gray-200 dark:border-slate-700">
      <button type="button" @click="$emit('cancel')" class="btn-secondary">{{ $t('common.cancel') }}</button>
      <button type="button" @click="handleSave" class="btn-primary" :disabled="saving">
        {{ saving ? $t('common.loading') : $t('common.save') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import planningService from '@/services/planningService'
import MultiLangInput from '@/components/common/MultiLangInput.vue'
import MultiplierTemplate from '@/components/planning/rooms/MultiplierTemplate.vue'

const props = defineProps({
  hotel: { type: Object, required: true },
  market: { type: Object, default: null },
  roomTypes: { type: Array, default: () => [] },
  mealPlans: { type: Array, default: () => [] }
})

const emit = defineEmits(['saved', 'cancel'])

const { t, locale } = useI18n()
const toast = useToast()
const saving = ref(false)
const activeTab = ref('general')
const selectedPricingRoom = ref('')

// Tab definitions
const tabs = computed(() => [
  { id: 'general', label: t('planning.markets.generalSettings'), icon: 'settings' },
  { id: 'pricing', label: t('planning.markets.pricingTab'), icon: 'payments' }
])

const currencies = ['TRY', 'USD', 'EUR', 'GBP', 'RUB', 'SAR', 'AED', 'CHF', 'JPY', 'CNY']

const ratePolicies = computed(() => [
  { value: 'refundable', label: t('planning.markets.refundable') },
  { value: 'non_refundable', label: t('planning.markets.nonRefundable') },
  { value: 'both', label: t('planning.markets.both') }
])

const commonCountries = [
  { code: 'TR', name: 'Türkiye' },
  { code: 'DE', name: 'Germany' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'RU', name: 'Russia' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'BE', name: 'Belgium' },
  { code: 'FR', name: 'France' },
  { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' },
  { code: 'AT', name: 'Austria' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'PL', name: 'Poland' },
  { code: 'UA', name: 'Ukraine' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'AE', name: 'UAE' },
  { code: 'US', name: 'USA' }
]

const SUPPORTED_LANGUAGES = ['tr', 'en', 'ru', 'el', 'de', 'es', 'it', 'fr', 'ro', 'bg', 'pt', 'da', 'zh', 'ar', 'fa', 'he', 'sq', 'uk', 'pl', 'az']
const createMultiLangObject = () => {
  const obj = {}
  SUPPORTED_LANGUAGES.forEach(lang => { obj[lang] = '' })
  return obj
}

// Get hotel's child age groups
const hotelChildAgeGroups = computed(() => props.hotel?.childAgeGroups || [])

// Initialize child age groups from hotel
const initChildAgeGroups = () => {
  return hotelChildAgeGroups.value.map(g => ({
    code: g.code,
    minAge: g.minAge,
    maxAge: g.maxAge
  }))
}

// Room types for pricing tab - considers market's active room types
const pricingRoomTypes = computed(() => {
  // If market has specific active room types, use those
  if (form.activeRoomTypes.length > 0) {
    return props.roomTypes.filter(rt => form.activeRoomTypes.includes(rt._id))
  }
  // Otherwise use all room types
  return props.roomTypes
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

const form = reactive({
  code: '',
  name: createMultiLangObject(),
  currency: 'EUR',
  countries: [],
  salesChannels: { b2c: true, b2b: true },
  childAgeSettings: {
    inheritFromHotel: true,
    childAgeGroups: [] // Will be initialized from hotel's childAgeGroups
  },
  activeRoomTypes: [],
  activeMealPlans: [],
  ratePolicy: 'refundable',
  nonRefundableDiscount: 10,
  taxes: {
    vat: { enabled: false, rate: 10, included: true },
    cityTax: { enabled: false, type: 'fixed_per_night', amount: 0 },
    serviceCharge: { enabled: false, rate: 10, included: true }
  },
  cancellationPolicy: {
    useHotelPolicy: true,
    freeCancellationDays: 7,
    penaltyRules: [],
    noShowPenalty: { type: 'full', value: 100 }
  }
})

// When child age override is enabled, initialize groups from hotel if empty
watch(() => form.childAgeSettings.inheritFromHotel, (newVal) => {
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

// Add new child age group
const addChildAgeGroup = () => {
  const groups = form.childAgeSettings.childAgeGroups
  if (groups.length >= 3) return

  const existingCodes = groups.map(g => g.code)
  let newCode = 'second'

  if (!existingCodes.includes('infant')) {
    newCode = 'infant'
  } else if (!existingCodes.includes('first')) {
    newCode = 'first'
  } else if (!existingCodes.includes('second')) {
    newCode = 'second'
  }

  const lastGroup = groups[groups.length - 1]
  const newMinAge = lastGroup ? lastGroup.maxAge + 1 : 0

  groups.push({
    code: newCode,
    minAge: newMinAge,
    maxAge: Math.min(newMinAge + 5, 17)
  })
}

// Remove child age group
const removeChildAgeGroup = (index) => {
  const groups = form.childAgeSettings.childAgeGroups
  if (groups.length <= 1) return
  groups.splice(index, 1)
  groups.forEach((g, i) => {
    if (i === 0) {
      g.minAge = 0
    } else {
      g.minAge = groups[i - 1].maxAge + 1
    }
  })
}

// When maxAge changes, update next group's minAge
const onMaxAgeChange = (index) => {
  const groups = form.childAgeSettings.childAgeGroups
  const currentGroup = groups[index]

  if (currentGroup.maxAge < currentGroup.minAge) {
    currentGroup.maxAge = currentGroup.minAge
  }

  if (index < groups.length - 1) {
    groups[index + 1].minAge = currentGroup.maxAge + 1
    if (groups[index + 1].maxAge < groups[index + 1].minAge) {
      groups[index + 1].maxAge = groups[index + 1].minAge
    }
  }
}

// Penalty rule helpers
const addPenaltyRule = () => {
  form.cancellationPolicy.penaltyRules.push({
    daysBeforeCheckIn: 7,
    penaltyType: 'percentage',
    penaltyValue: 50
  })
}

const removePenaltyRule = (index) => {
  form.cancellationPolicy.penaltyRules.splice(index, 1)
}

const handleSave = async () => {
  // Check if at least one language has a name
  const hasName = SUPPORTED_LANGUAGES.some(l => form.name[l]?.trim())
  if (!form.code || !hasName) {
    toast.error(t('validation.required'))
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
    pricingOverrides: pricingOverridesArray
  }

  saving.value = true
  try {
    if (props.market) {
      await planningService.updateMarket(props.hotel._id, props.market._id, formData)
      toast.success(t('planning.markets.updated'))
    } else {
      await planningService.createMarket(props.hotel._id, formData)
      toast.success(t('planning.markets.created'))
    }
    emit('saved')
  } catch (error) {
    toast.error(error.response?.data?.message || t('common.operationFailed'))
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  if (props.market) {
    form.code = props.market.code || ''
    form.name = { ...createMultiLangObject(), ...props.market.name }
    form.currency = props.market.currency || 'EUR'
    form.countries = [...(props.market.countries || [])]
    form.salesChannels = { ...form.salesChannels, ...props.market.salesChannels }
    form.activeRoomTypes = [...(props.market.activeRoomTypes || [])].map(id => typeof id === 'object' ? id._id : id)
    form.activeMealPlans = [...(props.market.activeMealPlans || [])].map(id => typeof id === 'object' ? id._id : id)
    form.ratePolicy = props.market.ratePolicy || 'refundable'
    form.nonRefundableDiscount = props.market.nonRefundableDiscount ?? 10

    // Child age settings
    const marketGroups = props.market.childAgeSettings?.childAgeGroups || []
    form.childAgeSettings = {
      inheritFromHotel: props.market.childAgeSettings?.inheritFromHotel ?? true,
      childAgeGroups: marketGroups.length > 0 ? marketGroups : initChildAgeGroups()
    }

    // Taxes
    if (props.market.taxes) {
      form.taxes.vat = { ...form.taxes.vat, ...props.market.taxes.vat }
      form.taxes.cityTax = { ...form.taxes.cityTax, ...props.market.taxes.cityTax }
      form.taxes.serviceCharge = { ...form.taxes.serviceCharge, ...props.market.taxes.serviceCharge }
    }

    // Cancellation policy
    if (props.market.cancellationPolicy) {
      form.cancellationPolicy.useHotelPolicy = props.market.cancellationPolicy.useHotelPolicy ?? true
      form.cancellationPolicy.freeCancellationDays = props.market.cancellationPolicy.freeCancellationDays ?? 7
      form.cancellationPolicy.penaltyRules = [...(props.market.cancellationPolicy.penaltyRules || [])]
      form.cancellationPolicy.noShowPenalty = { ...form.cancellationPolicy.noShowPenalty, ...props.market.cancellationPolicy.noShowPenalty }
    }

    // Load existing pricing overrides
    if (props.market.pricingOverrides?.length) {
      props.market.pricingOverrides.forEach(override => {
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
  } else {
    // Initialize child age groups from hotel when creating new market
    if (form.childAgeSettings.childAgeGroups.length === 0) {
      form.childAgeSettings.childAgeGroups = initChildAgeGroups()
    }
  }

  // Select first room if available
  if (pricingRoomTypes.value.length > 0) {
    selectedPricingRoom.value = pricingRoomTypes.value[0]._id
  }
})
</script>
