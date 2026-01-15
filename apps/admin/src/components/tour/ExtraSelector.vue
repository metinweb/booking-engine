<template>
  <div class="space-y-4">
    <!-- Category Filter -->
    <div class="flex flex-wrap gap-2 pb-4 border-b border-gray-200 dark:border-slate-700">
      <button
        v-for="cat in categories"
        :key="cat.value"
        @click="activeCategory = cat.value"
        class="px-3 py-1.5 rounded-full text-sm transition-colors"
        :class="activeCategory === cat.value
          ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
          : 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-400 hover:bg-gray-200'"
      >
        <span class="material-icons text-sm mr-1 align-middle">{{ cat.icon }}</span>
        {{ cat.label }}
      </button>
    </div>

    <!-- No Extras -->
    <div v-if="filteredExtras.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
      <span class="material-icons text-4xl mb-2">inventory_2</span>
      <p>{{ $t('tourExtra.noExtras') }}</p>
    </div>

    <!-- Extras List -->
    <div v-else class="space-y-3">
      <div
        v-for="extra in filteredExtras"
        :key="extra._id || extra.code"
        class="flex items-start gap-4 p-4 border rounded-lg transition-colors"
        :class="isSelected(extra)
          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/10'
          : 'border-gray-200 dark:border-slate-700 hover:border-gray-300'"
      >
        <!-- Checkbox -->
        <div class="pt-1">
          <input
            type="checkbox"
            :checked="isSelected(extra)"
            @change="toggleExtra(extra)"
            class="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
          />
        </div>

        <!-- Info -->
        <div class="flex-1 min-w-0">
          <div class="flex items-start justify-between gap-4">
            <div>
              <h4 class="font-medium text-gray-900 dark:text-white">
                {{ getLocalizedName(extra.name) }}
              </h4>
              <p v-if="extra.description" class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {{ getLocalizedName(extra.description) }}
              </p>
              <div class="flex items-center gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
                <span class="px-2 py-0.5 bg-gray-100 dark:bg-slate-700 rounded">
                  {{ $t(`tourExtra.categories.${extra.category}`) }}
                </span>
                <span>{{ $t(`tourExtra.priceTypes.${extra.priceType}`) }}</span>
              </div>
            </div>

            <div class="text-right">
              <p class="text-lg font-bold text-purple-600 dark:text-purple-400">
                {{ formatCurrency(getExtraPrice(extra), currency) }}
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                {{ $t(`tourExtra.priceTypes.${extra.priceType}`) }}
              </p>
            </div>
          </div>

          <!-- Quantity & Passengers Selection (when selected) -->
          <div v-if="isSelected(extra)" class="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
            <div class="flex items-center gap-6">
              <!-- Quantity -->
              <div v-if="extra.priceType === 'per_unit' || extra.priceType === 'per_group'" class="flex items-center gap-2">
                <span class="text-sm text-gray-600 dark:text-gray-400">{{ $t('common.quantity') }}:</span>
                <div class="flex items-center">
                  <button
                    type="button"
                    @click="updateQuantity(extra, -1)"
                    class="w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-slate-700 rounded-l-lg hover:bg-gray-200"
                  >
                    <span class="material-icons text-sm">remove</span>
                  </button>
                  <input
                    type="number"
                    :value="getSelectedExtra(extra)?.quantity || 1"
                    @input="setQuantity(extra, parseInt($event.target.value) || 1)"
                    min="1"
                    class="w-12 h-8 text-center border-y border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                  />
                  <button
                    type="button"
                    @click="updateQuantity(extra, 1)"
                    class="w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-slate-700 rounded-r-lg hover:bg-gray-200"
                  >
                    <span class="material-icons text-sm">add</span>
                  </button>
                </div>
              </div>

              <!-- Passenger Selection (for per_person extras) -->
              <div v-if="extra.priceType === 'per_person' && passengers.length > 1" class="flex-1">
                <span class="text-sm text-gray-600 dark:text-gray-400 mb-2 block">
                  {{ $t('tourExtra.selectPassengers') }}:
                </span>
                <div class="flex flex-wrap gap-2">
                  <button
                    type="button"
                    @click="toggleAllPassengers(extra)"
                    class="px-2 py-1 text-xs rounded"
                    :class="areAllPassengersSelected(extra)
                      ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                      : 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-400'"
                  >
                    {{ $t('common.selectAll') }}
                  </button>
                  <button
                    v-for="(passenger, pIndex) in passengers"
                    :key="pIndex"
                    type="button"
                    @click="togglePassenger(extra, pIndex)"
                    class="px-2 py-1 text-xs rounded"
                    :class="isPassengerSelected(extra, pIndex)
                      ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                      : 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-400'"
                  >
                    {{ passenger.firstName || `${$t('tourBooking.passenger.title')} ${pIndex + 1}` }}
                  </button>
                </div>
              </div>

              <!-- Total for this extra -->
              <div class="text-right">
                <p class="text-sm text-gray-500 dark:text-gray-400">{{ $t('common.total') }}</p>
                <p class="font-bold text-purple-600 dark:text-purple-400">
                  {{ formatCurrency(calculateExtraTotal(extra), currency) }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Total -->
    <div v-if="selectedExtras.length > 0" class="pt-4 border-t border-gray-200 dark:border-slate-700">
      <div class="flex justify-between items-center">
        <span class="text-gray-600 dark:text-gray-400">
          {{ $t('tourExtra.totalExtras') }} ({{ selectedExtras.length }})
        </span>
        <span class="text-xl font-bold text-purple-600 dark:text-purple-400">
          {{ formatCurrency(totalExtrasPrice, currency) }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { formatCurrency } from '@booking-engine/utils'

const props = defineProps({
  extras: {
    type: Array,
    default: () => []
  },
  modelValue: {
    type: Array,
    default: () => []
  },
  passengers: {
    type: Array,
    default: () => []
  },
  departurePrices: {
    type: Array,
    default: () => []
  },
  currency: {
    type: String,
    default: 'TRY'
  }
})

const emit = defineEmits(['update:modelValue'])

const { t, locale } = useI18n()

const activeCategory = ref('all')

const categories = computed(() => [
  { value: 'all', label: t('common.all'), icon: 'apps' },
  { value: 'activity', label: t('tourExtra.categories.activity'), icon: 'sports' },
  { value: 'meal', label: t('tourExtra.categories.meal'), icon: 'restaurant' },
  { value: 'transfer', label: t('tourExtra.categories.transfer'), icon: 'airport_shuttle' },
  { value: 'upgrade', label: t('tourExtra.categories.upgrade'), icon: 'upgrade' },
  { value: 'visa', label: t('tourExtra.categories.visa'), icon: 'badge' },
  { value: 'insurance', label: t('tourExtra.categories.insurance'), icon: 'health_and_safety' }
])

const filteredExtras = computed(() => {
  if (activeCategory.value === 'all') return props.extras
  return props.extras.filter(e => e.category === activeCategory.value)
})

const selectedExtras = computed(() => props.modelValue || [])

const totalExtrasPrice = computed(() => {
  return selectedExtras.value.reduce((sum, sel) => {
    const extra = props.extras.find(e => (e._id || e.code) === sel.code)
    if (!extra) return sum
    return sum + calculateExtraTotal(extra)
  }, 0)
})

function getLocalizedName(obj) {
  if (!obj) return ''
  if (typeof obj === 'string') return obj
  return obj[locale.value] || obj.tr || obj.en || ''
}

function getExtraPrice(extra) {
  // Check departure-specific prices first
  const depPrice = props.departurePrices?.find(p => p.extraCode === extra.code)
  if (depPrice) return depPrice.price
  return extra.defaultPrice || 0
}

function isSelected(extra) {
  const code = extra._id || extra.code
  return selectedExtras.value.some(s => s.code === code)
}

function getSelectedExtra(extra) {
  const code = extra._id || extra.code
  return selectedExtras.value.find(s => s.code === code)
}

function toggleExtra(extra) {
  const code = extra._id || extra.code
  const newSelection = [...selectedExtras.value]
  const index = newSelection.findIndex(s => s.code === code)

  if (index >= 0) {
    newSelection.splice(index, 1)
  } else {
    const passengerIndices = extra.priceType === 'per_person'
      ? props.passengers.map((_, i) => i)
      : []

    newSelection.push({
      code,
      name: getLocalizedName(extra.name),
      quantity: 1,
      unitPrice: getExtraPrice(extra),
      passengers: passengerIndices
    })
  }

  emit('update:modelValue', newSelection)
}

function updateQuantity(extra, delta) {
  const selected = getSelectedExtra(extra)
  if (!selected) return

  const newQty = Math.max(1, (selected.quantity || 1) + delta)
  setQuantity(extra, newQty)
}

function setQuantity(extra, quantity) {
  const code = extra._id || extra.code
  const newSelection = selectedExtras.value.map(s => {
    if (s.code === code) {
      return { ...s, quantity: Math.max(1, quantity) }
    }
    return s
  })
  emit('update:modelValue', newSelection)
}

function isPassengerSelected(extra, pIndex) {
  const selected = getSelectedExtra(extra)
  return selected?.passengers?.includes(pIndex) || false
}

function areAllPassengersSelected(extra) {
  const selected = getSelectedExtra(extra)
  return selected?.passengers?.length === props.passengers.length
}

function togglePassenger(extra, pIndex) {
  const code = extra._id || extra.code
  const selected = getSelectedExtra(extra)
  if (!selected) return

  let newPassengers = [...(selected.passengers || [])]
  const idx = newPassengers.indexOf(pIndex)

  if (idx >= 0) {
    newPassengers.splice(idx, 1)
  } else {
    newPassengers.push(pIndex)
  }

  // Ensure at least one passenger is selected
  if (newPassengers.length === 0) {
    newPassengers = [pIndex]
  }

  const newSelection = selectedExtras.value.map(s => {
    if (s.code === code) {
      return { ...s, passengers: newPassengers }
    }
    return s
  })

  emit('update:modelValue', newSelection)
}

function toggleAllPassengers(extra) {
  const code = extra._id || extra.code
  const selected = getSelectedExtra(extra)
  if (!selected) return

  const allSelected = areAllPassengersSelected(extra)
  const newPassengers = allSelected ? [0] : props.passengers.map((_, i) => i)

  const newSelection = selectedExtras.value.map(s => {
    if (s.code === code) {
      return { ...s, passengers: newPassengers }
    }
    return s
  })

  emit('update:modelValue', newSelection)
}

function calculateExtraTotal(extra) {
  const selected = getSelectedExtra(extra)
  if (!selected) return 0

  const price = getExtraPrice(extra)
  const quantity = selected.quantity || 1

  if (extra.priceType === 'per_person') {
    return price * (selected.passengers?.length || 1)
  } else if (extra.priceType === 'per_group') {
    return price
  } else {
    // per_unit
    return price * quantity
  }
}
</script>
