<template>
  <Teleport to="body">
    <div
      v-if="visible"
      ref="popoverRef"
      class="fixed z-50 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-700 p-4 min-w-[280px] max-h-[calc(100vh-16px)] overflow-y-auto"
      :style="position"
    >
      <div class="flex items-center justify-between mb-3">
        <h4 class="font-semibold text-gray-800 dark:text-white text-sm">
          {{ $t('planning.pricing.quickEdit') }}
          <span class="text-purple-600 dark:text-purple-400">({{ cellLabel }})</span>
        </h4>
        <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600">
          <span class="material-icons text-sm">close</span>
        </button>
      </div>

      <div class="space-y-3">
        <!-- Pricing Type Badge -->
        <div class="flex items-center gap-2 text-xs">
          <span
            class="px-2 py-0.5 rounded-full font-medium"
            :class="usesMultipliers
              ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
              : form.pricingType === 'per_person'
                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                : 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'"
          >
            {{ usesMultipliers ? 'Çarpanlı OBP' : form.pricingType === 'per_person' ? 'Kişi Bazlı (OBP)' : 'Ünite Bazlı' }}
          </span>
        </div>

        <!-- UNIT PRICING: Price Per Night -->
        <div v-if="form.pricingType === 'unit'">
          <label class="text-xs text-gray-500 dark:text-slate-400">{{ $t('planning.pricing.pricePerNight') }} ({{ currency }})</label>
          <input
            v-model.number="form.pricePerNight"
            type="number"
            min="0"
            step="1"
            class="form-input mt-1 text-lg font-bold text-green-600"
            @keyup.enter="$emit('save')"
          />
        </div>

        <!-- OBP WITH MULTIPLIERS: Base Price + Combination Table -->
        <div v-else-if="usesMultipliers" class="space-y-3">
          <!-- Base Price Input -->
          <div>
            <label class="text-xs text-gray-500 dark:text-slate-400 flex items-center gap-1">
              <span class="material-icons text-sm text-purple-500">calculate</span>
              Baz Fiyat ({{ currency }})
            </label>
            <input
              v-model.number="form.pricePerNight"
              type="number"
              min="0"
              step="1"
              class="form-input mt-1 text-lg font-bold text-purple-600"
              placeholder="Baz fiyat girin"
              @keyup.enter="$emit('save')"
            />
          </div>

          <!-- Combination Table Prices (Read-only) -->
          <div class="px-3 pb-3 pt-0 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg space-y-1 max-h-[200px] overflow-y-auto">
            <div class="text-xs font-medium text-indigo-700 dark:text-indigo-300 mb-2 flex items-center gap-1 sticky top-0 bg-indigo-50 dark:bg-indigo-900/20 py-1">
              <span class="material-icons text-sm">table_chart</span>
              Tüm Kombinasyonlar (Çarpan × Baz)
            </div>
            <div
              v-for="combo in activeCombinations"
              :key="combo.key"
              class="flex items-center justify-between text-xs py-0.5"
            >
              <span class="text-indigo-600 dark:text-indigo-400">
                {{ formatCombinationKey(combo) }}
                <span class="text-gray-400">(×{{ combo.overrideMultiplier || combo.calculatedMultiplier }})</span>
              </span>
              <span class="font-bold" :class="form.pricePerNight ? 'text-green-600' : 'text-gray-400'">
                {{ form.pricePerNight ? Math.round(form.pricePerNight * (combo.overrideMultiplier || combo.calculatedMultiplier)).toLocaleString() : '-' }} {{ currency }}
              </span>
            </div>
          </div>
        </div>

        <!-- OBP WITHOUT MULTIPLIERS: Direct Occupancy Prices -->
        <div v-else class="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg space-y-2">
          <div class="text-xs font-medium text-indigo-700 dark:text-indigo-300 mb-2 flex items-center gap-1">
            <span class="material-icons text-sm">groups</span>
            Kişi Bazlı Fiyatlar ({{ currency }})
          </div>
          <div
            v-for="(price, pax) in form.occupancyPricing"
            :key="pax"
            class="flex items-center gap-2"
          >
            <span class="w-12 text-xs font-medium text-indigo-600 dark:text-indigo-400">{{ pax }}P</span>
            <input
              v-model.number="form.occupancyPricing[pax]"
              type="number"
              min="0"
              class="form-input flex-1 text-sm py-1 font-bold"
              :class="pax <= 2 ? 'text-green-600' : 'text-gray-600'"
              placeholder="0"
              @keyup.enter="$emit('save')"
            />
          </div>
        </div>

        <!-- Extra Person Pricing (for Unit pricing) -->
        <div v-if="form.pricingType === 'unit'" class="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg space-y-2">
          <div class="text-xs font-medium text-gray-600 dark:text-slate-300 mb-2">{{ $t('planning.pricing.extraPrices') }}</div>

          <!-- Extra Adult -->
          <div class="flex items-center gap-2">
            <span class="material-icons text-amber-500 text-sm">person_add</span>
            <span class="text-xs text-gray-500 dark:text-gray-400 w-20">{{ $t('planning.pricing.extraAdultShort') }}</span>
            <input
              v-model.number="form.extraAdult"
              type="number"
              min="0"
              class="form-input flex-1 text-sm py-1"
              placeholder="0"
            />
          </div>

          <!-- Single Occupancy Discount -->
          <div class="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-slate-600 mt-2">
            <span class="material-icons text-blue-500 text-sm">person</span>
            <span class="text-xs text-gray-500 dark:text-gray-400 w-20">{{ $t('planning.pricing.singleOccupancy') }}</span>
            <div class="flex items-center gap-1">
              <span class="text-xs text-gray-400">-</span>
              <input
                v-model.number="form.singleSupplement"
                type="number"
                min="0"
                class="form-input flex-1 text-sm py-1"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        <!-- Child Pricing - Unit & Standard OBP (Editable inputs) -->
        <div v-if="!usesMultipliers" class="p-3 bg-pink-50 dark:bg-pink-900/20 rounded-lg space-y-2">
          <div class="text-xs font-medium text-pink-700 dark:text-pink-300 mb-2">Çocuk Fiyatları</div>

          <!-- Child Order Pricing -->
          <div
            v-for="(price, index) in form.childOrderPricing"
            :key="index"
            class="flex items-center gap-2"
          >
            <span class="material-icons text-pink-500 text-sm">child_care</span>
            <span class="text-xs text-gray-500 dark:text-gray-400 w-20">{{ index + 1 }}. {{ $t('planning.pricing.child') }}</span>
            <input
              v-model.number="form.childOrderPricing[index]"
              type="number"
              min="0"
              class="form-input flex-1 text-sm py-1"
              placeholder="0"
            />
          </div>

          <!-- Extra Infant -->
          <div class="flex items-center gap-2">
            <span class="material-icons text-purple-500 text-sm">baby_changing_station</span>
            <span class="text-xs text-gray-500 dark:text-gray-400 w-20">{{ $t('planning.pricing.extraInfantShort') }}</span>
            <input
              v-model.number="form.extraInfant"
              type="number"
              min="0"
              class="form-input flex-1 text-sm py-1"
              placeholder="0"
            />
          </div>
        </div>

        <!-- Allotment -->
        <div>
          <label class="text-xs text-gray-500 dark:text-slate-400">{{ $t('planning.pricing.allotment') }}</label>
          <input
            v-model.number="form.allotment"
            type="number"
            min="0"
            class="form-input mt-1"
          />
        </div>

        <!-- Quick toggles -->
        <div class="flex flex-wrap gap-2">
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" v-model="form.stopSale" class="rounded border-gray-300 text-red-600" />
            <span class="text-xs text-red-600">Stop Sale</span>
          </label>
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" v-model="form.singleStop" class="rounded border-gray-300 text-pink-600" />
            <span class="text-xs text-pink-600">1P Stop</span>
          </label>
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" v-model="form.closedToArrival" class="rounded border-gray-300 text-orange-600" />
            <span class="text-xs">CTA</span>
          </label>
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" v-model="form.closedToDeparture" class="rounded border-gray-300 text-orange-600" />
            <span class="text-xs">CTD</span>
          </label>
        </div>
      </div>

      <div class="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 dark:border-slate-700">
        <!-- Copy to next days -->
        <div class="flex items-center gap-1">
          <span class="text-xs text-gray-500 dark:text-slate-400">→</span>
          <input
            v-model.number="copyDays"
            type="number"
            min="1"
            max="31"
            class="w-12 text-center text-xs font-bold border border-gray-300 dark:border-slate-600 rounded py-1 bg-white dark:bg-slate-800"
          />
          <button
            @click="$emit('copy-to-days', copyDays)"
            class="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 transition-colors whitespace-nowrap"
          >
            {{ $t('planning.pricing.copyToNextDays') }}
          </button>
        </div>

        <!-- Cancel / Save -->
        <div class="flex gap-2">
          <button @click="$emit('close')" class="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800">
            {{ $t('common.cancel') }}
          </button>
          <button
            @click="$emit('save')"
            class="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            :disabled="saving"
          >
            {{ saving ? '...' : $t('common.save') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  cellLabel: {
    type: String,
    default: ''
  },
  form: {
    type: Object,
    required: true
  },
  currency: {
    type: String,
    default: 'EUR'
  },
  position: {
    type: Object,
    default: () => ({ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' })
  },
  saving: {
    type: Boolean,
    default: false
  },
  roomType: {
    type: Object,
    default: null
  },
  childAgeGroups: {
    type: Array,
    default: () => []
  }
})

// Check if this room uses multiplier system
const usesMultipliers = computed(() => {
  return props.roomType?.pricingType === 'per_person' && props.roomType?.useMultipliers === true
})

// Get active combinations from combination table
const activeCombinations = computed(() => {
  const table = props.roomType?.multiplierTemplate?.combinationTable || []
  return table.filter(c => c.isActive !== false)
})

// Format combination key with age ranges: "1+3 (0-2, 3-6, 3-6)"
const formatCombinationKey = (combo) => {
  const adults = combo.adults
  const children = combo.children || []

  if (children.length === 0) {
    return `${adults}`
  }

  // Get age ranges from childAgeGroups prop
  const ageGroups = props.childAgeGroups || []

  const getAgeRange = (ageGroupCode) => {
    const group = ageGroups.find(g => g.code === ageGroupCode)
    if (group) {
      return `${group.minAge}-${group.maxAge}`
    }
    // Fallback if not found
    const fallbacks = {
      'infant': '0-2',
      'first': '3-6',
      'second': '7-11',
      'third': '12-17'
    }
    return fallbacks[ageGroupCode] || ageGroupCode
  }

  const ageRanges = children.map(c => getAgeRange(c.ageGroup))
  return `${adults}+${children.length} (${ageRanges.join(', ')})`
}

defineEmits(['close', 'save', 'copy-to-days'])

const popoverRef = ref(null)
const copyDays = ref(7)

defineExpose({
  popoverRef
})
</script>
