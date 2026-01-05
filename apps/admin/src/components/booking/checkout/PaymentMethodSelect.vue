<template>
  <div
    class="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700"
  >
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
      <span class="material-icons text-purple-500 mr-2">payment</span>
      {{ $t('booking.paymentMethod') }}
    </h3>

    <!-- Payment Options -->
    <div class="space-y-3">
      <!-- Cash at Arrival -->
      <label
        v-if="isMethodAvailable('cash')"
        :class="[
          'flex items-center p-4 rounded-xl border-2 cursor-pointer transition-colors',
          selectedMethod === 'cash'
            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
            : 'border-gray-200 dark:border-slate-700 hover:border-purple-300'
        ]"
      >
        <input
          type="radio"
          name="paymentMethod"
          value="cash"
          :checked="selectedMethod === 'cash'"
          class="form-radio h-5 w-5 text-purple-600"
          @change="$emit('select', 'cash')"
        />
        <div class="ml-4 flex-1">
          <div class="flex items-center">
            <span class="material-icons text-green-500 mr-2">payments</span>
            <span class="font-medium text-gray-900 dark:text-white">
              {{ $t('booking.paymentMethods.cash') }}
            </span>
          </div>
          <p class="text-sm text-gray-500 dark:text-slate-400 mt-1">
            {{ $t('booking.paymentMethods.cashDescription') }}
          </p>
        </div>
      </label>

      <!-- Bank Transfer -->
      <label
        v-if="isMethodAvailable('bank_transfer')"
        :class="[
          'flex items-center p-4 rounded-xl border-2 cursor-pointer transition-colors',
          selectedMethod === 'bank_transfer'
            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
            : 'border-gray-200 dark:border-slate-700 hover:border-purple-300'
        ]"
      >
        <input
          type="radio"
          name="paymentMethod"
          value="bank_transfer"
          :checked="selectedMethod === 'bank_transfer'"
          class="form-radio h-5 w-5 text-purple-600"
          @change="$emit('select', 'bank_transfer')"
        />
        <div class="ml-4 flex-1">
          <div class="flex items-center">
            <span class="material-icons text-blue-500 mr-2">account_balance</span>
            <span class="font-medium text-gray-900 dark:text-white">
              {{ $t('booking.paymentMethods.bank_transfer') }}
            </span>
          </div>
          <p class="text-sm text-gray-500 dark:text-slate-400 mt-1">
            {{ $t('booking.paymentMethods.bank_transferDescription') }}
          </p>
        </div>
      </label>

      <!-- Credit Card -->
      <label
        v-if="isMethodAvailable('credit_card')"
        :class="[
          'flex items-center p-4 rounded-xl border-2 cursor-pointer transition-colors',
          selectedMethod === 'credit_card'
            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
            : 'border-gray-200 dark:border-slate-700 hover:border-purple-300'
        ]"
      >
        <input
          type="radio"
          name="paymentMethod"
          value="credit_card"
          :checked="selectedMethod === 'credit_card'"
          class="form-radio h-5 w-5 text-purple-600"
          @change="$emit('select', 'credit_card')"
        />
        <div class="ml-4 flex-1">
          <div class="flex items-center">
            <span class="material-icons text-purple-500 mr-2">credit_card</span>
            <span class="font-medium text-gray-900 dark:text-white">
              {{ $t('booking.paymentMethods.credit_card') }}
            </span>
          </div>
          <p class="text-sm text-gray-500 dark:text-slate-400 mt-1">
            {{ $t('booking.paymentMethods.credit_cardDescription') }}
          </p>
        </div>
      </label>

      <!-- No Payment Methods Available -->
      <div v-if="!hasAnyMethod" class="text-center py-6 text-gray-500 dark:text-slate-400">
        <span class="material-icons text-3xl mb-2">payment</span>
        <p>{{ $t('booking.noPaymentMethodsAvailable') }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  acceptedMethods: {
    type: Array,
    default: () => []
  },
  selectedMethod: {
    type: String,
    default: null
  }
})

defineEmits(['select'])

// Default payment methods if none configured
const defaultMethods = ['cash', 'bank_transfer', 'credit_card']

// Check if method is available
const isMethodAvailable = method => {
  // If no accepted methods configured, show all
  if (!props.acceptedMethods || props.acceptedMethods.length === 0) {
    return true
  }
  return props.acceptedMethods.includes(method)
}

// Check if any method is available
const hasAnyMethod = computed(() => {
  return defaultMethods.some(m => isMethodAvailable(m))
})
</script>
