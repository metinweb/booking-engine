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
        <BulkEditHeader
          :selected-cells-count="selectedCells.length"
          @close="close"
        />

        <!-- Content -->
        <div class="flex-1 overflow-y-auto p-6">
          <!-- Selection Summary -->
          <BulkEditSelectionSummary
            :date-range-summary="dateRangeSummary"
            :unique-room-types="uniqueRoomTypes"
            :unique-meal-plans="uniqueMealPlans"
            :get-meal-plan-color="getMealPlanColor"
          />

          <!-- Tabs -->
          <BulkEditTabNav
            v-model="activeTab"
            :tabs="tabs"
          />

          <!-- Tab: Price -->
          <div v-show="activeTab === 'price'">
            <BulkEditPriceTab
              :price-mode="form.priceMode"
              :price-modes="priceModes"
              :unique-room-types="uniqueRoomTypes"
              :unique-meal-plans="uniqueMealPlans"
              :selected-room-tab="selectedRoomTab"
              :current-room-id="currentRoomId"
              :current-room-pricing-type="currentRoomPricingType"
              :current-room-type-name="currentRoomTypeName"
              :current-room-uses-multipliers="currentRoomUsesMultipliers"
              :current-room-combinations="currentRoomCombinations"
              :current-room-max-children="currentRoomMaxChildren"
              :room-prices="roomPrices"
              :currency="currency"
              :child-age-label="childAgeLabel"
              :infant-age-label="infantAgeLabel"
              :get-room-type-name="getRoomTypeName"
              :get-meal-plan-name="getMealPlanName"
              :get-meal-plan-color="getMealPlanColor"
              :format-combination-key="formatCombinationKey"
              :has-room-price="hasRoomPrice"
              @update:price-mode="form.priceMode = $event"
              @update:selected-room-tab="selectedRoomTab = $event"
              @update-room-price="handleUpdateRoomPrice"
              @update-occupancy-price="handleUpdateOccupancyPrice"
              @update-child-price="handleUpdateChildPrice"
              @copy-to-all-meal-plans="copyFirstMealPlanToAll"
              @copy-to-all-rooms="copyCurrentRoomToAll"
            />
          </div>

          <!-- Tab: Inventory -->
          <div v-show="activeTab === 'inventory'">
            <BulkEditInventoryTab
              :allotment-mode="form.allotmentMode"
              :allotment-modes="allotmentModes"
              :allotment-value="form.allotmentValue"
              :min-stay="form.minStay"
              :release-days="form.releaseDays"
              @update:allotment-mode="form.allotmentMode = $event"
              @update:allotment-value="form.allotmentValue = $event"
              @update:min-stay="form.minStay = $event"
              @update:release-days="form.releaseDays = $event"
            />
          </div>

          <!-- Tab: Restrictions -->
          <div v-show="activeTab === 'restrictions'">
            <BulkEditRestrictionsTab
              :stop-sale="form.stopSale"
              :single-stop="form.singleStop"
              :closed-to-arrival="form.closedToArrival"
              :closed-to-departure="form.closedToDeparture"
              @update:stop-sale="form.stopSale = $event"
              @update:single-stop="form.singleStop = $event"
              @update:closed-to-arrival="form.closedToArrival = $event"
              @update:closed-to-departure="form.closedToDeparture = $event"
            />
          </div>
        </div>

        <!-- Preview Panel (overlay on content) -->
        <BulkEditPreviewPanel
          :show="showPreview"
          :saving="saving"
          :active-tab="activeTab"
          :form="form"
          :preview-summary="previewSummary"
          :preview-changes="previewChanges"
          :has-any-changes="hasAnyChanges"
          :allotment-mode-label="allotmentModeLabel"
          :date-range-summary="dateRangeSummary"
          :currency="currency"
          :get-meal-plan-color="getMealPlanColor"
          @close="showPreview = false"
          @confirm="confirmSave"
        />

        <!-- Footer -->
        <BulkEditFooter
          :saving="saving"
          @cancel="close"
          @preview="showPreviewPanel"
        />
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { useBulkEditLogic } from './useBulkEditLogic'
import BulkEditHeader from './BulkEditHeader.vue'
import BulkEditSelectionSummary from './BulkEditSelectionSummary.vue'
import BulkEditTabNav from './BulkEditTabNav.vue'
import BulkEditPriceTab from './BulkEditPriceTab.vue'
import BulkEditInventoryTab from './BulkEditInventoryTab.vue'
import BulkEditRestrictionsTab from './BulkEditRestrictionsTab.vue'
import BulkEditPreviewPanel from './BulkEditPreviewPanel.vue'
import BulkEditFooter from './BulkEditFooter.vue'

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

// Use the composable for all business logic
const {
  // State
  saving,
  activeTab,
  showPreview,
  form,
  selectedRoomTab,
  roomPrices,

  // Computed options
  tabs,
  priceModes,
  allotmentModes,

  // Computed selections
  uniqueRoomTypes,
  uniqueMealPlans,
  currentRoomId,
  currentRoomTypeName,
  currentRoomPricingType,
  currentRoomUsesMultipliers,
  currentRoomCombinations,
  currentRoomMaxChildren,

  // Computed values
  currency,
  childAgeLabel,
  infantAgeLabel,
  dateRangeSummary,
  allotmentModeLabel,
  previewSummary,
  previewChanges,
  hasAnyChanges,

  // Helper functions
  getRoomTypeName,
  getMealPlanName,
  getMealPlanColor,
  formatCombinationKey,
  hasRoomPrice,

  // Action functions
  copyFirstMealPlanToAll,
  copyCurrentRoomToAll,
  close,
  showPreviewPanel,
  confirmSave
} = useBulkEditLogic(props, emit)

// Handle room price updates from the price tab
const handleUpdateRoomPrice = ({ roomId, mealPlanId, field, value }) => {
  if (roomPrices[roomId] && roomPrices[roomId][mealPlanId]) {
    roomPrices[roomId][mealPlanId][field] = value
  }
}

const handleUpdateOccupancyPrice = ({ roomId, mealPlanId, pax, value }) => {
  if (roomPrices[roomId] && roomPrices[roomId][mealPlanId] && roomPrices[roomId][mealPlanId].occupancyPricing) {
    roomPrices[roomId][mealPlanId].occupancyPricing[pax] = value
  }
}

const handleUpdateChildPrice = ({ roomId, mealPlanId, index, value }) => {
  if (roomPrices[roomId] && roomPrices[roomId][mealPlanId] && roomPrices[roomId][mealPlanId].childOrderPricing) {
    roomPrices[roomId][mealPlanId].childOrderPricing[index] = value
  }
}
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
</style>
