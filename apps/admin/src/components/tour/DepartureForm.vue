<template>
  <div class="space-y-6">
    <!-- Basic Info -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Departure Date -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {{ $t('departure.fields.departureDate') }} *
        </label>
        <input
          type="date"
          v-model="form.departureDate"
          required
          class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
        />
      </div>

      <!-- Return Date -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {{ $t('departure.fields.returnDate') }} *
        </label>
        <input
          type="date"
          v-model="form.returnDate"
          required
          class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
        />
      </div>

      <!-- Status -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {{ $t('common.status') }}
        </label>
        <select
          v-model="form.status"
          class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
        >
          <option value="scheduled">{{ $t('departure.statuses.scheduled') }}</option>
          <option value="confirmed">{{ $t('departure.statuses.confirmed') }}</option>
          <option value="cancelled">{{ $t('departure.statuses.cancelled') }}</option>
          <option value="completed">{{ $t('departure.statuses.completed') }}</option>
          <option value="sold_out">{{ $t('departure.statuses.sold_out') }}</option>
        </select>
      </div>

      <!-- Guaranteed -->
      <div class="flex items-center h-full pt-6">
        <label class="flex items-center cursor-pointer">
          <input
            type="checkbox"
            v-model="form.guaranteedDeparture"
            class="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
          />
          <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">
            {{ $t('departure.fields.guaranteedDeparture') }}
          </span>
        </label>
      </div>
    </div>

    <!-- Capacity -->
    <div class="border-t border-gray-200 dark:border-slate-700 pt-6">
      <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-4">
        {{ $t('departure.sections.capacity') }}
      </h4>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">
            {{ $t('departure.fields.totalCapacity') }} *
          </label>
          <input
            type="number"
            v-model.number="form.capacity.total"
            min="1"
            required
            class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">
            {{ $t('departure.fields.minParticipants') }}
          </label>
          <input
            type="number"
            v-model.number="form.minParticipants"
            min="1"
            class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">
            {{ $t('departure.fields.reserved') }}
          </label>
          <input
            type="number"
            v-model.number="form.capacity.reserved"
            min="0"
            :disabled="isEdit"
            class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white disabled:opacity-50"
          />
        </div>
        <div>
          <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">
            {{ $t('departure.fields.sold') }}
          </label>
          <input
            type="number"
            v-model.number="form.capacity.sold"
            min="0"
            :disabled="isEdit"
            class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white disabled:opacity-50"
          />
        </div>
      </div>
    </div>

    <!-- B2C Pricing -->
    <div class="border-t border-gray-200 dark:border-slate-700 pt-6">
      <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-4">
        {{ $t('departure.sections.pricing') }}
      </h4>

      <!-- Currency -->
      <div class="mb-4">
        <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">
          {{ $t('common.currency') }}
        </label>
        <select
          v-model="form.pricing.currency"
          class="w-32 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
        >
          <option value="TRY">TRY</option>
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
          <option value="GBP">GBP</option>
        </select>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Adult Prices -->
        <div class="space-y-3">
          <h5 class="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
            {{ $t('departure.pricing.adult') }}
          </h5>
          <div>
            <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              {{ $t('departure.pricing.single') }}
            </label>
            <input
              type="number"
              v-model.number="form.pricing.adult.single"
              min="0"
              step="0.01"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              {{ $t('departure.pricing.double') }} *
            </label>
            <input
              type="number"
              v-model.number="form.pricing.adult.double"
              min="0"
              step="0.01"
              required
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              {{ $t('departure.pricing.triple') }}
            </label>
            <input
              type="number"
              v-model.number="form.pricing.adult.triple"
              min="0"
              step="0.01"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        <!-- Child Prices -->
        <div class="space-y-3">
          <h5 class="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
            {{ $t('departure.pricing.child') }}
          </h5>
          <div>
            <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              {{ $t('departure.pricing.withBed') }}
            </label>
            <input
              type="number"
              v-model.number="form.pricing.child.withBed"
              min="0"
              step="0.01"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              {{ $t('departure.pricing.withoutBed') }}
            </label>
            <input
              type="number"
              v-model.number="form.pricing.child.withoutBed"
              min="0"
              step="0.01"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
            />
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                {{ $t('departure.pricing.minAge') }}
              </label>
              <input
                type="number"
                v-model.number="form.pricing.child.minAge"
                min="0"
                max="18"
                class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                {{ $t('departure.pricing.maxAge') }}
              </label>
              <input
                type="number"
                v-model.number="form.pricing.child.maxAge"
                min="0"
                max="18"
                class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        <!-- Infant Prices -->
        <div class="space-y-3">
          <h5 class="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
            {{ $t('departure.pricing.infant') }}
          </h5>
          <div>
            <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              {{ $t('departure.pricing.price') }}
            </label>
            <input
              type="number"
              v-model.number="form.pricing.infant.price"
              min="0"
              step="0.01"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              {{ $t('departure.pricing.maxAge') }}
            </label>
            <input
              type="number"
              v-model.number="form.pricing.infant.maxAge"
              min="0"
              max="5"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">
              {{ $t('departure.pricing.singleSupplement') }}
            </label>
            <input
              type="number"
              v-model.number="form.pricing.singleSupplement"
              min="0"
              step="0.01"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- B2B Pricing -->
    <div class="border-t border-gray-200 dark:border-slate-700 pt-6">
      <div class="flex items-center justify-between mb-4">
        <h4 class="text-sm font-medium text-gray-900 dark:text-white">
          {{ $t('departure.sections.b2bPricing') }}
        </h4>
        <label class="flex items-center cursor-pointer">
          <input
            type="checkbox"
            v-model="showB2B"
            class="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
          />
          <span class="ml-2 text-sm text-gray-600 dark:text-gray-400">
            {{ $t('departure.fields.enableB2B') }}
          </span>
        </label>
      </div>

      <div v-if="showB2B" class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">
            {{ $t('departure.pricing.commissionMode') }}
          </label>
          <select
            v-model="form.b2bPricing.commissionMode"
            class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
          >
            <option value="percentage">{{ $t('departure.pricing.percentage') }}</option>
            <option value="net">{{ $t('departure.pricing.netMode') }}</option>
          </select>
        </div>
        <div>
          <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">
            {{ $t('departure.pricing.commissionRate') }} (%)
          </label>
          <input
            type="number"
            v-model.number="form.b2bPricing.commissionRate"
            min="0"
            max="100"
            step="0.1"
            class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label class="block text-xs text-gray-500 dark:text-gray-400 mb-1">
            {{ $t('departure.pricing.agencyMargin') }} (%)
          </label>
          <input
            type="number"
            v-model.number="form.b2bPricing.agencyMargin"
            min="0"
            max="100"
            step="0.1"
            class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
          />
        </div>
      </div>
    </div>

    <!-- Pickup Points -->
    <div class="border-t border-gray-200 dark:border-slate-700 pt-6">
      <div class="flex items-center justify-between mb-4">
        <h4 class="text-sm font-medium text-gray-900 dark:text-white">
          {{ $t('departure.sections.pickupPoints') }}
        </h4>
        <button
          type="button"
          @click="addPickupPoint"
          class="text-sm text-purple-600 hover:text-purple-700"
        >
          + {{ $t('common.add') }}
        </button>
      </div>

      <div v-if="form.pickupPoints.length === 0" class="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
        {{ $t('departure.noPickupPoints') }}
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="(point, index) in form.pickupPoints"
          :key="index"
          class="flex items-start gap-3 p-3 bg-gray-50 dark:bg-slate-900 rounded-lg"
        >
          <div class="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3">
            <input
              v-model="point.name"
              :placeholder="$t('departure.pickupPoint.name')"
              class="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm"
            />
            <input
              v-model="point.address"
              :placeholder="$t('departure.pickupPoint.address')"
              class="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm"
            />
            <input
              type="time"
              v-model="point.time"
              class="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm"
            />
            <input
              type="number"
              v-model.number="point.additionalPrice"
              :placeholder="$t('departure.pickupPoint.additionalPrice')"
              min="0"
              step="0.01"
              class="px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm"
            />
          </div>
          <button
            type="button"
            @click="removePickupPoint(index)"
            class="text-gray-400 hover:text-red-500"
          >
            <span class="material-icons text-sm">close</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Labels -->
    <div class="border-t border-gray-200 dark:border-slate-700 pt-6">
      <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-4">
        {{ $t('departure.sections.labels') }}
      </h4>
      <div class="flex flex-wrap gap-2">
        <label
          v-for="label in availableLabels"
          :key="label"
          class="flex items-center px-3 py-2 border rounded-lg cursor-pointer"
          :class="form.labels.includes(label)
            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
            : 'border-gray-300 dark:border-slate-600 hover:border-gray-400'"
        >
          <input
            type="checkbox"
            :value="label"
            v-model="form.labels"
            class="hidden"
          />
          <span class="text-sm" :class="form.labels.includes(label) ? 'text-purple-700 dark:text-purple-400' : 'text-gray-700 dark:text-gray-300'">
            {{ $t(`departure.labels.${label}`) }}
          </span>
        </label>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: Object,
    default: null
  },
  isEdit: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue'])

const showB2B = ref(false)

const availableLabels = ['last_seats', 'popular', 'early_bird', 'sold_out', 'new']

const defaultForm = {
  departureDate: '',
  returnDate: '',
  status: 'scheduled',
  guaranteedDeparture: false,
  minParticipants: 10,
  capacity: {
    total: 40,
    available: 40,
    reserved: 0,
    sold: 0
  },
  pricing: {
    currency: 'TRY',
    adult: { single: 0, double: 0, triple: 0 },
    child: { withBed: 0, withoutBed: 0, minAge: 2, maxAge: 12 },
    infant: { price: 0, maxAge: 2 },
    singleSupplement: 0
  },
  b2bPricing: {
    commissionMode: 'percentage',
    commissionRate: 10,
    agencyMargin: 5
  },
  pickupPoints: [],
  labels: []
}

const form = reactive({ ...defaultForm })

// Initialize form from modelValue
watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      Object.assign(form, {
        ...defaultForm,
        ...val,
        capacity: { ...defaultForm.capacity, ...val.capacity },
        pricing: {
          ...defaultForm.pricing,
          ...val.pricing,
          adult: { ...defaultForm.pricing.adult, ...val.pricing?.adult },
          child: { ...defaultForm.pricing.child, ...val.pricing?.child },
          infant: { ...defaultForm.pricing.infant, ...val.pricing?.infant }
        },
        b2bPricing: { ...defaultForm.b2bPricing, ...val.b2bPricing },
        pickupPoints: val.pickupPoints || [],
        labels: val.labels || []
      })
      showB2B.value = !!val.b2bPricing?.commissionRate
    }
  },
  { immediate: true, deep: true }
)

// Emit changes
watch(
  form,
  (val) => {
    emit('update:modelValue', { ...val })
  },
  { deep: true }
)

function addPickupPoint() {
  form.pickupPoints.push({
    code: `PP${form.pickupPoints.length + 1}`,
    name: '',
    address: '',
    time: '08:00',
    additionalPrice: 0
  })
}

function removePickupPoint(index) {
  form.pickupPoints.splice(index, 1)
}
</script>
