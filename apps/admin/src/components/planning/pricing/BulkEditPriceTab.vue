<template>
  <div class="space-y-5">
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
            priceMode === mode.value
              ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
              : 'border-gray-200 dark:border-slate-600 hover:border-gray-300'
          "
          @click="$emit('update:priceMode', mode.value)"
        >
          <span
            class="material-icons text-lg mb-1"
            :class="priceMode === mode.value ? 'text-purple-600' : 'text-gray-400'"
          >
            {{ mode.icon }}
          </span>
          <div
            class="text-sm font-medium"
            :class="
              priceMode === mode.value
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
          @click="$emit('update:selectedRoomTab', rt._id)"
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
              ? pricingTypeLabels.multiplier
              : currentRoomPricingType === 'per_person'
                ? pricingTypeLabels.perPerson
                : pricingTypeLabels.unit
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
                  :value="roomPrices[currentRoomId][mp._id].pricePerNight"
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
                  @input="updateRoomPrice(currentRoomId, mp._id, 'pricePerNight', $event.target.value)"
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
                  :value="roomPrices[currentRoomId][mp._id].extraAdult"
                  type="number"
                  min="0"
                  class="form-input w-24 text-center text-sm"
                  placeholder="0"
                  @input="updateRoomPrice(currentRoomId, mp._id, 'extraAdult', $event.target.value)"
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
                {{ singleOccupancyLabel }}
              </label>
              <div class="flex items-center gap-2">
                <span class="text-xs text-gray-400">-</span>
                <input
                  :value="roomPrices[currentRoomId][mp._id].singleSupplement"
                  type="number"
                  min="0"
                  class="form-input w-24 text-center text-sm"
                  placeholder="0"
                  @input="updateRoomPrice(currentRoomId, mp._id, 'singleSupplement', $event.target.value)"
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
                {{ basePriceLabel }}
              </label>
              <div class="flex items-center gap-2 flex-1">
                <input
                  :value="roomPrices[currentRoomId][mp._id].pricePerNight"
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
                  @input="updateRoomPrice(currentRoomId, mp._id, 'pricePerNight', $event.target.value)"
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
                {{ calculatedPricesLabel }}
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
                      >(x{{ combo.overrideMultiplier || combo.calculatedMultiplier }})</span
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
                  :value="roomPrices[currentRoomId][mp._id].occupancyPricing[pax]"
                  type="number"
                  min="0"
                  class="form-input flex-1 w-16 text-center text-sm py-1 font-bold"
                  placeholder="0"
                  @input="updateOccupancyPrice(currentRoomId, mp._id, pax, $event.target.value)"
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
              {{ childPricesLabel }} {{ childAgeLabel }}
            </div>
            <div class="grid grid-cols-2 gap-2">
              <div
                v-for="childIndex in currentRoomMaxChildren"
                :key="childIndex"
                class="flex items-center gap-1 bg-pink-50 dark:bg-pink-900/20 rounded-lg px-2 py-1.5"
              >
                <span class="text-xs text-pink-600 dark:text-pink-400 w-12"
                  >{{ childIndex }}. {{ childLabel }}</span
                >
                <input
                  :value="roomPrices[currentRoomId][mp._id].childOrderPricing[childIndex - 1]"
                  type="number"
                  min="0"
                  class="form-input flex-1 w-16 text-center text-sm py-1"
                  placeholder="0"
                  @input="updateChildPrice(currentRoomId, mp._id, childIndex - 1, $event.target.value)"
                />
              </div>
            </div>
          </div>

          <!-- Infant (only for Unit & Standard OBP) -->
          <div v-if="!currentRoomUsesMultipliers" class="flex items-center gap-3">
            <label class="text-sm text-gray-500 dark:text-gray-400 w-28">
              {{ infantLabel }} {{ infantAgeLabel }}
            </label>
            <div class="flex items-center gap-2">
              <input
                :value="roomPrices[currentRoomId][mp._id].extraInfant"
                type="number"
                min="0"
                class="form-input w-24 text-center text-sm"
                placeholder="0"
                @input="updateRoomPrice(currentRoomId, mp._id, 'extraInfant', $event.target.value)"
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
          @click="$emit('copyToAllMealPlans')"
        >
          <span class="material-icons text-sm">content_copy</span>
          {{ $t('planning.pricing.copyToAllMealPlans') }}
        </button>
        <button
          v-if="uniqueRoomTypes.length > 1"
          class="text-xs px-3 py-1.5 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg hover:bg-purple-100 flex items-center gap-1"
          @click="$emit('copyToAllRooms')"
        >
          <span class="material-icons text-sm">content_copy</span>
          {{ $t('planning.pricing.copyToAllRooms') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  priceMode: {
    type: String,
    required: true
  },
  priceModes: {
    type: Array,
    required: true
  },
  uniqueRoomTypes: {
    type: Array,
    required: true
  },
  uniqueMealPlans: {
    type: Array,
    required: true
  },
  selectedRoomTab: {
    type: String,
    default: null
  },
  currentRoomId: {
    type: String,
    default: null
  },
  currentRoomPricingType: {
    type: String,
    default: 'unit'
  },
  currentRoomTypeName: {
    type: String,
    default: ''
  },
  currentRoomUsesMultipliers: {
    type: Boolean,
    default: false
  },
  currentRoomCombinations: {
    type: Array,
    default: () => []
  },
  currentRoomMaxChildren: {
    type: Number,
    default: 2
  },
  roomPrices: {
    type: Object,
    required: true
  },
  currency: {
    type: String,
    default: 'EUR'
  },
  childAgeLabel: {
    type: String,
    default: ''
  },
  infantAgeLabel: {
    type: String,
    default: ''
  },
  getRoomTypeName: {
    type: Function,
    required: true
  },
  getMealPlanName: {
    type: Function,
    required: true
  },
  getMealPlanColor: {
    type: Function,
    required: true
  },
  formatCombinationKey: {
    type: Function,
    required: true
  },
  hasRoomPrice: {
    type: Function,
    required: true
  }
})

const emit = defineEmits([
  'update:priceMode',
  'update:selectedRoomTab',
  'updateRoomPrice',
  'updateOccupancyPrice',
  'updateChildPrice',
  'copyToAllMealPlans',
  'copyToAllRooms'
])

// Static labels (Turkish as in original)
const pricingTypeLabels = {
  multiplier: 'Carpanli OBP',
  perPerson: 'Kisi Bazli (OBP)',
  unit: 'Unite Bazli'
}

const singleOccupancyLabel = 'Tek Kisi Ind.'
const basePriceLabel = 'Baz Fiyat'
const calculatedPricesLabel = 'Hesaplanan Fiyatlar'
const childPricesLabel = 'Cocuk Fiyatlari'
const childLabel = 'Cocuk'
const infantLabel = 'Bebek'

// Helper methods
const updateRoomPrice = (roomId, mealPlanId, field, value) => {
  emit('updateRoomPrice', { roomId, mealPlanId, field, value: value === '' ? '' : Number(value) })
}

const updateOccupancyPrice = (roomId, mealPlanId, pax, value) => {
  emit('updateOccupancyPrice', { roomId, mealPlanId, pax, value: value === '' ? '' : Number(value) })
}

const updateChildPrice = (roomId, mealPlanId, index, value) => {
  emit('updateChildPrice', { roomId, mealPlanId, index, value: value === '' ? '' : Number(value) })
}
</script>
