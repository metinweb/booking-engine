<template>
  <div class="space-y-4">
    <!-- Code -->
    <div class="mb-4">
      <label class="form-label"
        >{{ $t('planning.markets.code') }} <span class="text-red-500">*</span></label
      >
      <input v-model="form.code" type="text" class="form-input uppercase" maxlength="10" />
    </div>

    <!-- Name (Multilingual) -->
    <div class="mb-4">
      <MultiLangInput
        v-model="form.name"
        :languages="ADMIN_LANGUAGES"
        :label="$t('planning.markets.name') + ' *'"
      />
    </div>

    <!-- Currency -->
    <div class="mb-4">
      <label class="form-label"
        >{{ $t('planning.markets.currency') }} <span class="text-red-500">*</span></label
      >
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
              v-model="form.countries"
              type="checkbox"
              :value="country.code"
              class="rounded border-gray-300 text-indigo-600"
            />
            <span>{{ country.name }}</span>
          </label>
        </div>
      </div>
    </div>

    <!-- Child Age Settings -->
    <ChildAgeSettings
      v-model:inherit-from-hotel="form.childAgeSettings.inheritFromHotel"
      v-model:child-age-groups="form.childAgeSettings.childAgeGroups"
      :hotel-child-age-groups="hotelChildAgeGroups"
      @add-group="$emit('addChildAgeGroup')"
      @remove-group="$emit('removeChildAgeGroup', $event)"
      @max-age-change="$emit('maxAgeChange', $event)"
    />

    <!-- Sales Channels -->
    <div class="mb-4">
      <label class="form-label">{{ $t('planning.markets.salesChannels') }}</label>
      <div class="flex gap-4">
        <label class="flex items-center gap-2 cursor-pointer">
          <input
            v-model="form.salesChannels.b2c"
            type="checkbox"
            class="rounded border-gray-300 text-indigo-600"
          />
          <span class="text-sm">B2C</span>
        </label>
        <label class="flex items-center gap-2 cursor-pointer">
          <input
            v-model="form.salesChannels.b2b"
            type="checkbox"
            class="rounded border-gray-300 text-indigo-600"
          />
          <span class="text-sm">B2B</span>
        </label>
      </div>
    </div>

    <!-- Active Products -->
    <ActiveProducts
      v-model:active-room-types="form.activeRoomTypes"
      v-model:active-meal-plans="form.activeMealPlans"
      :room-types="roomTypes"
      :meal-plans="mealPlans"
      :locale="locale"
    />

    <!-- Rate Policy -->
    <RatePolicySection
      v-model:rate-policy="form.ratePolicy"
      v-model:non-refundable-discount="form.nonRefundableDiscount"
      :rate-policies="ratePolicies"
    />

    <!-- Taxes Section -->
    <TaxesSection v-model="form.taxes" :currency="form.currency" />

    <!-- Cancellation Policy -->
    <CancellationPolicySection
      v-model="form.cancellationPolicy"
      @add-penalty="$emit('addPenaltyRule')"
      @remove-penalty="$emit('removePenaltyRule', $event)"
    />
  </div>
</template>

<script setup>
import MultiLangInput from '@/components/common/MultiLangInput.vue'
import ChildAgeSettings from './sections/ChildAgeSettings.vue'
import ActiveProducts from './sections/ActiveProducts.vue'
import RatePolicySection from './sections/RatePolicySection.vue'
import TaxesSection from './sections/TaxesSection.vue'
import CancellationPolicySection from './sections/CancellationPolicySection.vue'

defineProps({
  form: { type: Object, required: true },
  ADMIN_LANGUAGES: { type: Array, required: true },
  currencies: { type: Array, required: true },
  commonCountries: { type: Array, required: true },
  hotelChildAgeGroups: { type: Array, default: () => [] },
  roomTypes: { type: Array, default: () => [] },
  mealPlans: { type: Array, default: () => [] },
  ratePolicies: { type: Array, required: true },
  locale: { type: String, required: true }
})

defineEmits([
  'addChildAgeGroup',
  'removeChildAgeGroup',
  'maxAgeChange',
  'addPenaltyRule',
  'removePenaltyRule'
])
</script>
