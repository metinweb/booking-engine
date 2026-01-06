<template>
  <div
    class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden"
  >
    <div class="overflow-x-auto">
      <table class="w-full text-sm">
        <!-- Header: Meal Plan Codes -->
        <thead>
          <tr
            class="bg-gray-50 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-600"
          >
            <th
              class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 w-60 min-w-[240px]"
            >
              {{ currency }}
            </th>
            <th v-for="mp in mealPlans" :key="mp._id" class="px-2 py-3 text-center">
              <div
                class="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-sm font-bold"
                :class="[
                  getMealPlanBg(mp.code),
                  mp.isBaseMealPlan || (baseMealPlan && baseMealPlan._id === mp._id)
                    ? 'ring-2 ring-yellow-400'
                    : ''
                ]"
              >
                <span
                  v-if="mp.isBaseMealPlan || (baseMealPlan && baseMealPlan._id === mp._id)"
                  class="material-icons text-yellow-500 text-sm"
                  >star</span
                >
                {{ mp.code }}
                <span
                  v-if="mp.priceAdjustment && mp.priceAdjustment !== 0"
                  class="text-xs opacity-70"
                >
                  {{ mp.priceAdjustment > 0 ? '+' : '' }}{{ mp.priceAdjustment }}%
                </span>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <!-- UNIT PRICING: Base Price Row -->
          <tr
            v-if="pricingType === 'unit'"
            class="border-b border-gray-100 dark:border-slate-700 bg-green-50/50 dark:bg-green-900/10"
          >
            <td class="px-4 py-3">
              <div class="flex items-center gap-2">
                <span class="material-icons text-green-600 text-lg">hotel</span>
                <span class="font-medium text-gray-700 dark:text-slate-300">{{
                  $t('planning.pricing.basePrice')
                }}</span>
                <!-- Show base room indicator if this is the base room -->
                <span
                  v-if="isBaseRoom"
                  class="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded"
                >
                  <span class="material-icons text-xs">star</span>
                  {{ $t('planning.pricing.baseRoom') }}
                </span>
                <!-- Show adjustment if not base room -->
                <span
                  v-else-if="roomType?.priceAdjustment && roomType.priceAdjustment !== 0"
                  class="text-xs px-1.5 py-0.5 rounded"
                  :class="
                    roomType.priceAdjustment > 0
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  "
                >
                  {{ roomType.priceAdjustment > 0 ? '+' : ''
                  }}{{ roomType.priceAdjustment }}%
                </span>
              </div>
            </td>
            <td v-for="mp in mealPlans" :key="mp._id" class="px-2 py-3 text-center">
              <div class="relative">
                <input
                  v-if="prices[mp._id]"
                  :value="prices[mp._id].pricePerNight"
                  type="number"
                  min="0"
                  step="1"
                  class="w-24 text-center text-lg font-bold border-2 rounded-lg px-2 py-1.5 transition-colors"
                  :class="[
                    isBaseCell(roomTypeId, mp._id)
                      ? 'border-yellow-400 dark:border-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 ring-2 ring-yellow-400 shadow-lg'
                      : isCalculatedCell(roomTypeId, mp._id) && !allowEditCalculated
                        ? 'border-gray-300 dark:border-slate-600 bg-gray-100 dark:bg-slate-700 cursor-not-allowed text-gray-500'
                        : prices[mp._id]?.pricePerNight > 0
                          ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20'
                          : 'border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800'
                  ]"
                  :readonly="isCalculatedCell(roomTypeId, mp._id) && !allowEditCalculated"
                  placeholder="0"
                  @input="updatePrice(mp._id, 'pricePerNight', $event.target.value)"
                />
                <!-- Star icon for base cell -->
                <span
                  v-if="isBaseCell(roomTypeId, mp._id)"
                  class="absolute -top-2 -left-2 text-yellow-500"
                  :title="$t('planning.pricing.baseCell')"
                >
                  <span class="material-icons text-lg">star</span>
                </span>
                <!-- Lock icon for calculated cells -->
                <span
                  v-else-if="isCalculatedCell(roomTypeId, mp._id) && !allowEditCalculated"
                  class="absolute -top-1 -right-1 text-amber-500"
                  :title="$t('planning.pricing.autoCalculated')"
                >
                  <span class="material-icons text-sm">lock</span>
                </span>
              </div>
            </td>
          </tr>

          <!-- UNIT PRICING: Extra Adult Row -->
          <tr
            v-if="pricingType === 'unit'"
            class="border-b border-gray-100 dark:border-slate-700"
          >
            <td class="px-4 py-2">
              <div class="flex items-center gap-2">
                <span class="material-icons text-amber-500 text-sm">person_add</span>
                <span class="text-gray-600 dark:text-slate-400">{{
                  $t('planning.pricing.extraAdultShort')
                }}</span>
              </div>
            </td>
            <td v-for="mp in mealPlans" :key="mp._id" class="px-2 py-2 text-center">
              <div class="flex items-center justify-center gap-1">
                <span class="text-xs text-gray-400">+</span>
                <input
                  v-if="prices[mp._id]"
                  :value="prices[mp._id].extraAdult"
                  type="number"
                  min="0"
                  class="w-20 text-center text-sm border rounded-lg px-2 py-1"
                  :class="
                    isCalculatedCell(roomTypeId, mp._id) && !allowEditCalculated
                      ? 'border-gray-300 dark:border-slate-600 bg-gray-100 dark:bg-slate-700 cursor-not-allowed text-gray-500'
                      : 'border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800'
                  "
                  :readonly="isCalculatedCell(roomTypeId, mp._id) && !allowEditCalculated"
                  placeholder="0"
                  @input="updatePrice(mp._id, 'extraAdult', $event.target.value)"
                />
              </div>
            </td>
          </tr>

          <!-- OBP WITH MULTIPLIERS: Base Price Row -->
          <template v-if="usesMultipliers">
            <tr
              class="border-b border-gray-100 dark:border-slate-700 bg-purple-50/50 dark:bg-purple-900/10"
            >
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <span class="material-icons text-purple-600 text-lg">calculate</span>
                  <span class="font-medium text-gray-700 dark:text-slate-300">Baz Fiyat</span>
                  <span
                    class="text-xs px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded"
                    >Zorunlu</span
                  >
                </div>
              </td>
              <td v-for="mp in mealPlans" :key="mp._id" class="px-2 py-3 text-center">
                <input
                  v-if="prices[mp._id]"
                  :value="prices[mp._id].pricePerNight"
                  type="number"
                  min="0"
                  step="1"
                  class="w-24 text-center text-lg font-bold border-2 rounded-lg px-2 py-1.5 transition-colors"
                  :class="[
                    !prices[mp._id].pricePerNight
                      ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20'
                      : 'border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/20'
                  ]"
                  placeholder="0"
                  @input="updatePrice(mp._id, 'pricePerNight', $event.target.value)"
                />
              </td>
            </tr>
            <!-- Calculated Combinations (Read-only info) -->
            <tr class="border-b border-gray-100 dark:border-slate-700">
              <td colspan="100%" class="px-4 py-3">
                <div class="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                  <div
                    class="text-xs font-medium text-indigo-700 dark:text-indigo-300 mb-2 flex items-center gap-1"
                  >
                    <span class="material-icons text-sm">table_chart</span>
                    Tum Kombinasyonlar (Carpan x Baz Fiyat)
                  </div>
                  <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    <div
                      v-for="combo in combinations"
                      :key="combo.key"
                      class="flex items-center justify-between text-xs py-1 px-2 bg-white dark:bg-slate-700 rounded"
                    >
                      <span class="text-indigo-600 dark:text-indigo-400">
                        {{ formatCombinationKey(combo) }}
                        <span class="text-gray-400"
                          >(x{{ combo.overrideMultiplier || combo.calculatedMultiplier }})</span
                        >
                      </span>
                      <span
                        class="font-bold"
                        :class="
                          prices[mealPlans[0]?._id]?.pricePerNight
                            ? 'text-green-600'
                            : 'text-gray-400'
                        "
                      >
                        {{
                          prices[mealPlans[0]?._id]?.pricePerNight
                            ? Math.round(
                                prices[mealPlans[0]._id].pricePerNight *
                                  (combo.overrideMultiplier || combo.calculatedMultiplier)
                              ).toLocaleString()
                            : '-'
                        }}
                      </span>
                    </div>
                  </div>
                  <div class="mt-2 text-xs text-gray-500 dark:text-slate-400">
                    <span class="material-icons text-xs align-middle mr-1">info</span>
                    Bu fiyatlar ilk pansiyon icin gosterilmektedir. Diger pansiyonlar icin baz
                    fiyatlari ayri girin.
                  </div>
                </div>
              </td>
            </tr>
          </template>

          <!-- OBP STANDARD PRICING: Occupancy Rows (minAdults to maxAdults) - Only when NOT using multipliers -->
          <template v-else-if="pricingType === 'per_person'">
            <tr
              v-for="pax in adultsRange"
              :key="'obp-' + pax"
              class="border-b border-gray-100 dark:border-slate-700"
              :class="pax <= minAdults + 1 ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''"
            >
              <td class="px-4 py-2">
                <div class="flex items-center gap-2">
                  <span class="material-icons text-indigo-500 text-sm">{{
                    pax === 1 ? 'person' : 'group'
                  }}</span>
                  <span class="font-medium text-gray-700 dark:text-slate-300"
                    >{{ pax }} Yetiskin</span
                  >
                  <span
                    v-if="pax <= minAdults + 1"
                    class="text-xs px-1.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded"
                    >Zorunlu</span
                  >
                </div>
              </td>
              <td v-for="mp in mealPlans" :key="mp._id" class="px-2 py-2 text-center">
                <input
                  v-if="prices[mp._id]?.occupancyPricing"
                  :value="prices[mp._id].occupancyPricing[pax]"
                  type="number"
                  min="0"
                  class="w-24 text-center font-bold border-2 rounded-lg px-2 py-1.5 transition-colors"
                  :class="[
                    pax <= 2 && !prices[mp._id].occupancyPricing[pax]
                      ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20'
                      : prices[mp._id].occupancyPricing[pax] > 0
                        ? 'border-indigo-300 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-900/20'
                        : 'border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800'
                  ]"
                  placeholder="0"
                  @input="updateOccupancyPrice(mp._id, pax, $event.target.value)"
                />
              </td>
            </tr>
          </template>

          <!-- Child Order Pricing Rows - NOT shown for multiplier OBP -->
          <template v-if="!usesMultipliers">
            <tr
              v-for="childIndex in maxChildren"
              :key="'child-' + childIndex"
              class="border-b border-gray-100 dark:border-slate-700"
            >
              <td class="px-4 py-2">
                <div class="flex flex-col gap-0.5">
                  <div class="flex items-center gap-2">
                    <span class="material-icons text-pink-500 text-sm">child_care</span>
                    <span class="text-gray-600 dark:text-slate-400"
                      >{{ childIndex }}. {{ $t('planning.pricing.child') }}</span
                    >
                  </div>
                  <!-- Age source indicator - only show on first child row, on new line -->
                  <span
                    v-if="childIndex === 1"
                    class="text-xs px-1.5 py-0.5 rounded w-fit ml-6"
                    :class="{
                      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400':
                        ageSettings.childSource === 'hotel',
                      'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400':
                        ageSettings.childSource === 'market',
                      'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400':
                        ageSettings.childSource === 'season'
                    }"
                    :title="$t('planning.pricing.ageSourceTooltip.' + ageSettings.childSource)"
                  >
                    0-{{ ageSettings.childMaxAge }} {{ $t('planning.pricing.age') }}
                    <span class="opacity-70"
                      >({{ $t('planning.pricing.ageSource.' + ageSettings.childSource) }})</span
                    >
                  </span>
                </div>
              </td>
              <td v-for="mp in mealPlans" :key="mp._id" class="px-2 py-2 text-center">
                <div class="flex items-center justify-center gap-1">
                  <span class="text-xs text-gray-400">+</span>
                  <input
                    v-if="prices[mp._id]?.childOrderPricing"
                    :value="prices[mp._id].childOrderPricing[childIndex - 1]"
                    type="number"
                    min="0"
                    class="w-20 text-center text-sm border rounded-lg px-2 py-1"
                    :class="
                      isCalculatedCell(roomTypeId, mp._id) && !allowEditCalculated
                        ? 'border-gray-300 dark:border-slate-600 bg-gray-100 dark:bg-slate-700 cursor-not-allowed text-gray-500'
                        : 'border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800'
                    "
                    :readonly="isCalculatedCell(roomTypeId, mp._id) && !allowEditCalculated"
                    placeholder="0"
                    @input="updateChildPrice(mp._id, childIndex - 1, $event.target.value)"
                  />
                </div>
              </td>
            </tr>
          </template>

          <!-- Extra Infant Row - NOT shown for multiplier OBP -->
          <tr
            v-if="!usesMultipliers"
            class="border-b border-gray-100 dark:border-slate-700"
          >
            <td class="px-4 py-2">
              <div class="flex flex-col gap-0.5">
                <div class="flex items-center gap-2">
                  <span class="material-icons text-purple-500 text-sm"
                    >baby_changing_station</span
                  >
                  <span class="text-gray-600 dark:text-slate-400">{{
                    $t('planning.pricing.extraInfantShort')
                  }}</span>
                </div>
                <!-- Age source indicator on new line -->
                <span
                  class="text-xs px-1.5 py-0.5 rounded w-fit ml-6"
                  :class="{
                    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400':
                      ageSettings.infantSource === 'hotel',
                    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400':
                      ageSettings.infantSource === 'market',
                    'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400':
                      ageSettings.infantSource === 'season'
                  }"
                  :title="$t('planning.pricing.ageSourceTooltip.' + ageSettings.infantSource)"
                >
                  0-{{ ageSettings.infantMaxAge }} {{ $t('planning.pricing.age') }}
                  <span class="opacity-70"
                    >({{ $t('planning.pricing.ageSource.' + ageSettings.infantSource) }})</span
                  >
                </span>
              </div>
            </td>
            <td v-for="mp in mealPlans" :key="mp._id" class="px-2 py-2 text-center">
              <div class="flex items-center justify-center gap-1">
                <span class="text-xs text-gray-400">+</span>
                <input
                  v-if="prices[mp._id]"
                  :value="prices[mp._id].extraInfant"
                  type="number"
                  min="0"
                  class="w-20 text-center text-sm border rounded-lg px-2 py-1"
                  :class="
                    isCalculatedCell(roomTypeId, mp._id) && !allowEditCalculated
                      ? 'border-gray-300 dark:border-slate-600 bg-gray-100 dark:bg-slate-700 cursor-not-allowed text-gray-500'
                      : 'border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800'
                  "
                  :readonly="isCalculatedCell(roomTypeId, mp._id) && !allowEditCalculated"
                  placeholder="0"
                  @input="updatePrice(mp._id, 'extraInfant', $event.target.value)"
                />
              </div>
            </td>
          </tr>

          <!-- Single Occupancy Discount Row (only for unit pricing) -->
          <tr
            v-if="pricingType === 'unit'"
            class="bg-blue-50/50 dark:bg-blue-900/10"
          >
            <td class="px-4 py-2">
              <div class="flex items-center gap-2">
                <span class="material-icons text-blue-500 text-sm">person</span>
                <span class="text-gray-600 dark:text-slate-400">{{
                  $t('planning.pricing.singleOccupancy')
                }}</span>
              </div>
            </td>
            <td v-for="mp in mealPlans" :key="mp._id" class="px-2 py-2 text-center">
              <div class="flex items-center justify-center gap-1">
                <span class="text-xs text-gray-400">-</span>
                <input
                  v-if="prices[mp._id]"
                  :value="prices[mp._id].singleSupplement"
                  type="number"
                  min="0"
                  class="w-20 text-center text-sm border rounded-lg px-2 py-1"
                  :class="
                    isCalculatedCell(roomTypeId, mp._id) && !allowEditCalculated
                      ? 'border-gray-300 dark:border-slate-600 bg-gray-100 dark:bg-slate-700 cursor-not-allowed text-gray-500'
                      : 'border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800'
                  "
                  :readonly="isCalculatedCell(roomTypeId, mp._id) && !allowEditCalculated"
                  placeholder="0"
                  @input="updatePrice(mp._id, 'singleSupplement', $event.target.value)"
                />
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  roomTypeId: { type: String, required: true },
  roomType: { type: Object, default: null },
  mealPlans: { type: Array, default: () => [] },
  prices: { type: Object, default: () => ({}) },
  pricingType: { type: String, default: 'unit' },
  usesMultipliers: { type: Boolean, default: false },
  combinations: { type: Array, default: () => [] },
  maxChildren: { type: Number, default: 2 },
  maxAdults: { type: Number, default: 4 },
  minAdults: { type: Number, default: 1 },
  adultsRange: { type: Array, default: () => [1, 2, 3, 4] },
  ageSettings: { type: Object, default: () => ({ childMaxAge: 12, infantMaxAge: 2, childSource: 'hotel', infantSource: 'hotel' }) },
  currency: { type: String, default: 'EUR' },
  isBaseRoom: { type: Boolean, default: false },
  baseRoom: { type: Object, default: null },
  baseMealPlan: { type: Object, default: null },
  allowEditCalculated: { type: Boolean, default: false },
  isBaseCell: { type: Function, default: () => false },
  isCalculatedCell: { type: Function, default: () => false },
  formatCombinationKey: { type: Function, default: () => '' }
})

const emit = defineEmits(['update:prices'])

const getMealPlanBg = code => {
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

const updatePrice = (mealPlanId, field, value) => {
  const newPrices = { ...props.prices }
  if (!newPrices[mealPlanId]) return
  newPrices[mealPlanId] = {
    ...newPrices[mealPlanId],
    [field]: Number(value) || 0
  }
  emit('update:prices', newPrices)
}

const updateOccupancyPrice = (mealPlanId, pax, value) => {
  const newPrices = { ...props.prices }
  if (!newPrices[mealPlanId]?.occupancyPricing) return
  newPrices[mealPlanId] = {
    ...newPrices[mealPlanId],
    occupancyPricing: {
      ...newPrices[mealPlanId].occupancyPricing,
      [pax]: Number(value) || 0
    }
  }
  emit('update:prices', newPrices)
}

const updateChildPrice = (mealPlanId, index, value) => {
  const newPrices = { ...props.prices }
  if (!newPrices[mealPlanId]?.childOrderPricing) return
  const newChildPricing = [...newPrices[mealPlanId].childOrderPricing]
  newChildPricing[index] = Number(value) || 0
  newPrices[mealPlanId] = {
    ...newPrices[mealPlanId],
    childOrderPricing: newChildPricing
  }
  emit('update:prices', newPrices)
}
</script>
