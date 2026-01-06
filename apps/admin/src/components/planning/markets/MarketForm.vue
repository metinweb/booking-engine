<template>
  <div class="flex flex-col h-full">
    <!-- Tab Navigation (Sticky) -->
    <div
      class="flex border-b border-gray-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 z-10 -mx-4 px-4"
    >
      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        class="px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-2"
        :class="
          activeTab === tab.id
            ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
            : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 hover:border-gray-300'
        "
        @click="activeTab = tab.id"
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
        <MarketGeneralTab
          :form="form"
          :ADMIN_LANGUAGES="ADMIN_LANGUAGES"
          :currencies="currencies"
          :common-countries="commonCountries"
          :hotel-child-age-groups="hotelChildAgeGroups"
          :room-types="roomTypes"
          :meal-plans="mealPlans"
          :rate-policies="ratePolicies"
          :locale="locale"
          @add-child-age-group="addChildAgeGroup"
          @remove-child-age-group="removeChildAgeGroup"
          @max-age-change="onMaxAgeChange"
          @add-penalty-rule="addPenaltyRule"
          @remove-penalty-rule="removePenaltyRule"
        />
      </div>

      <!-- Pricing Overrides Tab -->
      <div v-show="activeTab === 'pricing'">
        <MarketPricingTab
          :pricing-room-types="pricingRoomTypes"
          :selected-pricing-room="selectedPricingRoom"
          :current-selected-room="currentSelectedRoom"
          :current-room-override="currentRoomOverride"
          :effective-pricing-type="effectivePricingType"
          :hotel="hotel"
          :currency="form.currency"
          :locale="locale"
          :has-room-override="hasRoomOverride"
          @update:selected-pricing-room="selectedPricingRoom = $event"
          @adjust-min-adults="adjustMinAdultsOverride"
          @update-room-override="handleRoomOverrideUpdate"
        />
      </div>
    </div>

    <!-- Actions -->
    <div class="flex justify-end gap-3 pt-4 mt-6 border-t border-gray-200 dark:border-slate-700">
      <button type="button" class="btn-secondary" @click="$emit('cancel')">
        {{ $t('common.cancel') }}
      </button>
      <button type="button" class="btn-primary" :disabled="saving" @click="handleSave">
        {{ saving ? $t('common.loading') : $t('common.save') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { MarketGeneralTab, MarketPricingTab, useMarketForm } from './market-form'

const props = defineProps({
  hotel: { type: Object, required: true },
  market: { type: Object, default: null },
  roomTypes: { type: Array, default: () => [] },
  mealPlans: { type: Array, default: () => [] }
})

const emit = defineEmits(['saved', 'cancel'])

// Use the composable for all logic
const {
  // State
  saving,
  activeTab,
  selectedPricingRoom,
  form,
  pricingOverrides,

  // Constants
  currencies,
  ratePolicies,
  commonCountries,
  tabs,
  ADMIN_LANGUAGES,

  // Computed
  hotelChildAgeGroups,
  pricingRoomTypes,
  currentSelectedRoom,
  currentRoomOverride,
  effectivePricingType,
  hasPricingOverrides,

  // Methods
  hasRoomOverride,
  adjustMinAdultsOverride,
  addChildAgeGroup,
  removeChildAgeGroup,
  onMaxAgeChange,
  addPenaltyRule,
  removePenaltyRule,
  handleSave,

  // Setup
  setupWatchers,
  initialize,

  // i18n
  locale
} = useMarketForm(props, emit)

// Handle room override updates from child components
const handleRoomOverrideUpdate = ({ field, value }) => {
  if (selectedPricingRoom.value && pricingOverrides[selectedPricingRoom.value]) {
    pricingOverrides[selectedPricingRoom.value][field] = value
  }
}

// Setup watchers
setupWatchers()

// Initialize on mount
onMounted(() => {
  initialize()
})
</script>
