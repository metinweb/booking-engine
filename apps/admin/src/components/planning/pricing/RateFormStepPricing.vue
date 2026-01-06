<template>
  <div class="space-y-4">
    <div class="text-center mb-4">
      <h3 class="text-lg font-bold text-gray-800 dark:text-white">
        {{ $t('planning.pricing.step2Title') }}
      </h3>
      <p class="text-sm text-gray-500 dark:text-slate-400">
        {{ $t('planning.pricing.step2Desc') }}
      </p>
    </div>

    <!-- Period Summary -->
    <div class="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-2">
          <span class="material-icons text-blue-600 text-sm">date_range</span>
          <span class="text-sm font-medium text-gray-800 dark:text-white">
            {{ formatDisplayDate(dateRange.start) }} - {{ formatDisplayDate(dateRange.end) }}
          </span>
        </div>
        <div
          class="px-2 py-0.5 bg-blue-200 dark:bg-blue-800 rounded-full text-xs font-bold text-blue-800 dark:text-blue-200"
        >
          {{ calculateNights }} {{ $t('planning.pricing.nights') }}
        </div>
        <div class="flex items-center gap-1">
          <span class="material-icons text-green-600 text-sm">payments</span>
          <span class="text-sm font-bold text-green-600">{{ currency }}</span>
        </div>
      </div>
      <button
        class="text-purple-600 hover:text-purple-800 text-sm flex items-center gap-1"
        @click="$emit('edit-period')"
      >
        <span class="material-icons text-sm">edit</span>
        {{ $t('common.edit') }}
      </button>
    </div>

    <!-- Pricing Type Info (read-only, from room type) -->
    <div
      class="rounded-xl p-4 border"
      :class="
        currentRoomUsesMultipliers
          ? 'bg-gradient-to-r from-purple-50 to-fuchsia-50 dark:from-purple-900/20 dark:to-fuchsia-900/20 border-purple-200 dark:border-purple-800'
          : currentRoomPricingType === 'per_person'
            ? 'bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-indigo-200 dark:border-indigo-800'
            : 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800'
      "
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <span
            class="material-icons"
            :class="
              currentRoomUsesMultipliers
                ? 'text-purple-600'
                : currentRoomPricingType === 'per_person'
                  ? 'text-indigo-600'
                  : 'text-green-600'
            "
            >sell</span
          >
          <div>
            <div class="font-medium text-gray-800 dark:text-white">Fiyatlandirma Tipi</div>
            <div class="text-xs text-gray-500 dark:text-slate-400">
              Oda tipi ayarlarindan alinir
            </div>
          </div>
        </div>
        <div
          class="flex items-center gap-2 px-4 py-2 rounded-lg"
          :class="
            currentRoomUsesMultipliers
              ? 'bg-purple-500 text-white'
              : currentRoomPricingType === 'per_person'
                ? 'bg-indigo-500 text-white'
                : 'bg-green-500 text-white'
          "
        >
          <span class="material-icons text-sm">{{
            currentRoomUsesMultipliers
              ? 'calculate'
              : currentRoomPricingType === 'per_person'
                ? 'groups'
                : 'hotel'
          }}</span>
          <span class="font-medium">{{
            currentRoomUsesMultipliers
              ? 'Carpanli OBP'
              : currentRoomPricingType === 'per_person'
                ? 'Kisi Bazli (OBP)'
                : 'Unite Bazli'
          }}</span>
        </div>
      </div>
      <!-- Multiplier OBP Info -->
      <div
        v-if="currentRoomUsesMultipliers"
        class="mt-3 p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-sm text-purple-700 dark:text-purple-300"
      >
        <span class="material-icons text-sm align-middle mr-1">info</span>
        Carpanli OBP modunda sadece baz fiyat girilir. Tum kombinasyon fiyatlari carpanlarla
        hesaplanir.
      </div>
      <!-- Standard OBP Info -->
      <div
        v-else-if="currentRoomPricingType === 'per_person'"
        class="mt-3 p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-sm text-indigo-700 dark:text-indigo-300"
      >
        <span class="material-icons text-sm align-middle mr-1">info</span>
        OBP modunda her yetiskin sayisi icin ayri fiyat girilir. Ekstra yetiskin ve tek kisi
        indirimi kullanilmaz.
      </div>
      <!-- Unit Info -->
      <div
        v-else
        class="mt-3 p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-sm text-green-700 dark:text-green-300"
      >
        <span class="material-icons text-sm align-middle mr-1">info</span>
        Unite bazli modda oda basi fiyat + ekstra kisi ucreti kullanilir.
      </div>
    </div>

    <!-- Room Type Tabs (Sticky) -->
    <div
      class="sticky -top-6 z-10 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 shadow-sm pt-6 pb-0"
    >
      <div class="flex gap-1 overflow-x-auto pb-px">
        <button
          v-for="rt in filteredRoomTypes"
          :key="rt._id"
          type="button"
          class="px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-all border-b-2 -mb-px"
          :class="[
            selectedRoomTab === rt._id
              ? 'border-purple-500 text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20'
              : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 hover:border-gray-300',
            rt.isBaseRoom ? 'ring-2 ring-yellow-400 ring-offset-1' : '',
            !hasExplicitBaseRoom && !hasRoomPrices(rt._id)
              ? 'ring-2 ring-red-300 dark:ring-red-700 ring-offset-1'
              : ''
          ]"
          @click="$emit('update:selectedRoomTab', rt._id)"
        >
          <div class="flex items-center gap-1.5">
            <!-- Base room star -->
            <span v-if="rt.isBaseRoom" class="material-icons text-yellow-500 text-sm">star</span>
            <!-- Calculated icon for non-base rooms -->
            <span v-else-if="hasExplicitBaseRoom" class="text-green-500 text-xs font-bold italic"
              >fx</span
            >
            <span class="font-bold">{{ rt.code }}</span>
            <!-- Price indicator (only show when NOT using base room pricing) -->
            <template v-if="!hasExplicitBaseRoom">
              <span v-if="hasRoomPrices(rt._id)" class="w-2 h-2 rounded-full bg-green-500"></span>
              <span v-else class="material-icons text-red-500 text-sm">error</span>
            </template>
          </div>
        </button>
      </div>
    </div>

    <!-- Missing Prices Warning -->
    <div
      v-if="roomsMissingPrices.length > 0"
      class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex items-start gap-3"
    >
      <span class="material-icons text-red-500">warning</span>
      <div>
        <div class="font-medium text-red-700 dark:text-red-400">
          {{ $t('planning.pricing.allRoomsPriceRequired') }}
        </div>
        <div class="text-sm text-red-600 dark:text-red-300 mt-1">
          {{ $t('planning.pricing.missingPricesFor') }}:
          <span class="font-bold">{{ roomsMissingPrices.map(r => r.code).join(', ') }}</span>
        </div>
      </div>
    </div>

    <!-- Selected Room Tab Content -->
    <div v-if="selectedRoomTab && roomRestrictions[selectedRoomTab]" class="space-y-4">
      <!-- Room Info with Allotment, MinStay, Release -->
      <RateFormRoomRestrictions
        :room-type="currentRoomType"
        :restrictions="roomRestrictions[selectedRoomTab]"
        @update:restrictions="updateRestrictions($event)"
      />

      <!-- Base Room Pricing Info (when base room is explicitly set) -->
      <div
        v-if="hasExplicitBaseRoom"
        class="p-4 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800 mb-4"
      >
        <div class="flex items-start gap-3">
          <span class="material-icons text-yellow-600 text-2xl">auto_fix_high</span>
          <div class="flex-1">
            <div class="font-medium text-yellow-800 dark:text-yellow-300 mb-1">
              {{ $t('planning.pricing.baseRoomPricingActive') }}
            </div>
            <p class="text-sm text-yellow-700 dark:text-yellow-400">
              {{ $t('planning.pricing.baseRoomPricingInfo') }}
            </p>
            <!-- Show which room is base -->
            <div class="mt-2 flex items-center gap-2 flex-wrap">
              <span class="text-xs text-yellow-600 dark:text-yellow-400"
                >{{ $t('planning.pricing.baseRoom') }}:</span
              >
              <span
                class="px-2 py-0.5 bg-yellow-200 dark:bg-yellow-800 rounded text-sm font-bold text-yellow-800 dark:text-yellow-200"
              >
                {{ baseRoom?.code }}
              </span>
              <span v-if="baseMealPlan" class="text-xs text-yellow-600 dark:text-yellow-400 ml-2"
                >{{ $t('planning.pricing.baseMealPlan') }}:</span
              >
              <span
                v-if="baseMealPlan"
                class="px-2 py-0.5 bg-yellow-200 dark:bg-yellow-800 rounded text-sm font-bold text-yellow-800 dark:text-yellow-200"
              >
                {{ baseMealPlan?.code }}
              </span>
            </div>
            <!-- Current room indicator -->
            <div
              v-if="!isCurrentRoomBase"
              class="mt-2 flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400"
            >
              <span class="material-icons text-sm">info</span>
              {{ $t('planning.pricing.viewingCalculatedRoom', { room: currentRoomType?.code }) }}
            </div>
            <!-- Allow edit calculated checkbox -->
            <label class="mt-3 flex items-center gap-2 cursor-pointer">
              <input
                :checked="allowEditCalculated"
                type="checkbox"
                class="w-4 h-4 rounded border-yellow-400 text-yellow-600 focus:ring-yellow-500"
                @change="$emit('update:allowEditCalculated', $event.target.checked)"
              />
              <span class="text-sm text-yellow-700 dark:text-yellow-400">
                {{ $t('planning.pricing.allowEditCalculated') }}
              </span>
            </label>
          </div>
        </div>
      </div>

      <!-- Meal Plan Pricing Table -->
      <RateFormPricingTable
        :room-type-id="selectedRoomTab"
        :room-type="currentRoomType"
        :meal-plans="filteredMealPlans"
        :prices="roomPrices[selectedRoomTab]"
        :pricing-type="currentRoomPricingType"
        :uses-multipliers="currentRoomUsesMultipliers"
        :combinations="currentRoomCombinations"
        :max-children="maxChildrenForCurrentRoom"
        :max-adults="maxAdultsForCurrentRoom"
        :min-adults="minAdultsForCurrentRoom"
        :adults-range="adultsRangeForCurrentRoom"
        :age-settings="ageSettings"
        :currency="currency"
        :is-base-room="isCurrentRoomBase"
        :base-room="baseRoom"
        :base-meal-plan="baseMealPlan"
        :allow-edit-calculated="allowEditCalculated"
        :is-base-cell="isBaseCell"
        :is-calculated-cell="isCalculatedCell"
        :format-combination-key="formatCombinationKey"
        @update:prices="updateRoomPrices($event)"
      />

      <!-- Quick Actions for Current Room -->
      <div class="flex items-center gap-3">
        <span class="text-sm text-gray-500 dark:text-slate-400"
          >{{ $t('planning.pricing.quickFill') }}:</span
        >
        <button
          type="button"
          class="text-sm px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 transition-colors"
          @click="$emit('copy-to-meal-plans')"
        >
          {{ $t('planning.pricing.copyToAllMealPlans') }}
        </button>
        <button
          type="button"
          class="text-sm px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 transition-colors"
          @click="$emit('copy-to-rooms')"
        >
          {{ $t('planning.pricing.copyToAllRooms') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import RateFormRoomRestrictions from './RateFormRoomRestrictions.vue'
import RateFormPricingTable from './RateFormPricingTable.vue'

const { locale } = useI18n()

const props = defineProps({
  // Period & General
  dateRange: { type: Object, required: true },
  currency: { type: String, default: 'EUR' },

  // Room & Meal Plan Data
  filteredRoomTypes: { type: Array, default: () => [] },
  filteredMealPlans: { type: Array, default: () => [] },
  selectedRoomTab: { type: String, default: '' },
  roomPrices: { type: Object, default: () => ({}) },
  roomRestrictions: { type: Object, default: () => ({}) },

  // Current Room Info
  currentRoomType: { type: Object, default: null },
  currentRoomPricingType: { type: String, default: 'unit' },
  currentRoomUsesMultipliers: { type: Boolean, default: false },
  currentRoomCombinations: { type: Array, default: () => [] },
  maxChildrenForCurrentRoom: { type: Number, default: 2 },
  maxAdultsForCurrentRoom: { type: Number, default: 4 },
  minAdultsForCurrentRoom: { type: Number, default: 1 },
  adultsRangeForCurrentRoom: { type: Array, default: () => [1, 2, 3, 4] },
  ageSettings: { type: Object, default: () => ({ childMaxAge: 12, infantMaxAge: 2, childSource: 'hotel', infantSource: 'hotel' }) },

  // Base Room Pricing
  hasExplicitBaseRoom: { type: Boolean, default: false },
  isCurrentRoomBase: { type: Boolean, default: false },
  baseRoom: { type: Object, default: null },
  baseMealPlan: { type: Object, default: null },
  allowEditCalculated: { type: Boolean, default: false },

  // Validation
  roomsMissingPrices: { type: Array, default: () => [] },

  // Functions passed as props
  hasRoomPrices: { type: Function, required: true },
  isBaseCell: { type: Function, required: true },
  isCalculatedCell: { type: Function, required: true },
  formatCombinationKey: { type: Function, required: true }
})

const emit = defineEmits([
  'edit-period',
  'update:selectedRoomTab',
  'update:roomPrices',
  'update:roomRestrictions',
  'update:allowEditCalculated',
  'copy-to-meal-plans',
  'copy-to-rooms'
])

const calculateNights = computed(() => {
  if (!props.dateRange.start || !props.dateRange.end) return 0
  const [sy, sm, sd] = props.dateRange.start.split('-').map(Number)
  const [ey, em, ed] = props.dateRange.end.split('-').map(Number)
  const start = new Date(sy, sm - 1, sd)
  const end = new Date(ey, em - 1, ed)
  const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1
  return diff > 0 ? diff : 0
})

const formatDisplayDate = dateStr => {
  if (!dateStr) return ''
  const [year, month, day] = dateStr.split('-')
  return `${day}.${month}.${year}`
}

const updateRestrictions = (newRestrictions) => {
  const updatedRestrictions = { ...props.roomRestrictions }
  updatedRestrictions[props.selectedRoomTab] = newRestrictions
  emit('update:roomRestrictions', updatedRestrictions)
}

const updateRoomPrices = (newPrices) => {
  const updatedPrices = { ...props.roomPrices }
  updatedPrices[props.selectedRoomTab] = newPrices
  emit('update:roomPrices', updatedPrices)
}
</script>
