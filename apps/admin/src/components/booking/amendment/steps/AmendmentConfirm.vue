<template>
  <div class="space-y-6">
    <div class="text-center mb-6">
      <h3 class="text-lg font-medium text-gray-900 dark:text-white">
        {{ $t('booking.amendment.confirmTitle') }}
      </h3>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
        {{ $t('booking.amendment.confirmDescription') }}
      </p>
    </div>

    <!-- Amendment Summary -->
    <div
      class="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-6 border border-indigo-200 dark:border-indigo-700"
    >
      <div class="flex items-center gap-3 mb-4">
        <div
          class="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-800 flex items-center justify-center"
        >
          <span class="material-icons text-indigo-600 dark:text-indigo-400">summarize</span>
        </div>
        <h4 class="font-medium text-indigo-700 dark:text-indigo-300">
          {{ $t('booking.amendment.summary') }}
        </h4>
      </div>

      <div class="grid grid-cols-2 gap-4 text-sm">
        <div class="text-gray-600 dark:text-gray-400">{{ $t('booking.amendment.changeType') }}</div>
        <div class="font-medium text-gray-900 dark:text-white">
          {{ $t(`booking.amendment.types.${previewData?.amendmentType || 'full'}`) }}
        </div>

        <div class="text-gray-600 dark:text-gray-400">
          {{ $t('booking.amendment.changesCount') }}
        </div>
        <div class="font-medium text-gray-900 dark:text-white">
          {{ previewData?.changes?.length || 0 }}
        </div>

        <template v-if="previewData?.priceDifference?.difference !== 0">
          <div class="text-gray-600 dark:text-gray-400">
            {{ $t('booking.amendment.priceDifference') }}
          </div>
          <div
            class="font-medium"
            :class="previewData?.priceDifference?.isIncrease ? 'text-amber-600' : 'text-green-600'"
          >
            {{ previewData?.priceDifference?.isIncrease ? '+' : ''
            }}{{
              formatCurrency(
                previewData?.priceDifference?.difference,
                previewData?.priceDifference?.currency
              )
            }}
          </div>
        </template>

        <template v-if="priceAdjustment?.waived">
          <div class="text-gray-600 dark:text-gray-400">
            {{ $t('booking.amendment.adjustedDifference') }}
          </div>
          <div class="font-medium text-green-600">
            {{ $t('booking.amendment.waived') }}
          </div>
        </template>
      </div>
    </div>

    <!-- Price Adjustment Summary (if adjusted) -->
    <div
      v-if="priceAdjustment?.waived || priceAdjustment?.adjustedAmount"
      class="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-700"
    >
      <div class="flex items-center gap-2 text-green-700 dark:text-green-300">
        <span class="material-icons text-sm">check_circle</span>
        <span class="font-medium">
          {{
            priceAdjustment?.waived
              ? $t('booking.amendment.priceWaived')
              : $t('booking.amendment.priceAdjusted')
          }}
        </span>
      </div>
      <p
        v-if="priceAdjustment?.reason"
        class="mt-2 text-sm text-green-600 dark:text-green-400 ml-6"
      >
        {{ priceAdjustment.reason }}
      </p>
    </div>

    <!-- Reason Input -->
    <div
      class="bg-white dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600"
    >
      <label class="block font-medium text-gray-900 dark:text-white mb-2">
        {{ $t('booking.amendment.reasonLabel') }} <span class="text-red-500">*</span>
      </label>
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-3">
        {{ $t('booking.amendment.reasonHint') }}
      </p>
      <textarea
        v-model="reason"
        rows="4"
        class="w-full px-4 py-3 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white focus:ring-2 focus:ring-indigo-500 resize-none"
        :class="{ 'border-red-500': showReasonError }"
        :placeholder="$t('booking.amendment.reasonPlaceholder')"
        @input="$emit('update:reason', reason)"
      ></textarea>
      <div class="flex items-center justify-between mt-2">
        <p v-if="showReasonError" class="text-sm text-red-500">
          {{ $t('booking.amendment.reasonRequired') }}
        </p>
        <p class="text-xs text-gray-400 dark:text-gray-500 ml-auto">
          {{ reason?.length || 0 }} / 10+ {{ $t('common.characters') }}
        </p>
      </div>
    </div>

    <!-- Confirmation Checkbox -->
    <div
      class="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-6 border border-amber-200 dark:border-amber-700"
    >
      <label class="flex items-start gap-3 cursor-pointer">
        <input
          v-model="confirmed"
          type="checkbox"
          class="w-5 h-5 mt-0.5 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
        />
        <div>
          <p class="font-medium text-amber-700 dark:text-amber-300">
            {{ $t('booking.amendment.confirmCheckbox') }}
          </p>
          <p class="text-sm text-amber-600 dark:text-amber-400 mt-1">
            {{ $t('booking.amendment.confirmCheckboxHint') }}
          </p>
        </div>
      </label>
    </div>

    <!-- Warning -->
    <div class="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
      <span class="material-icons text-gray-400">info</span>
      <p class="text-sm text-gray-600 dark:text-gray-400">
        {{ $t('booking.amendment.confirmNote') }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  previewData: { type: Object, default: null },
  formData: { type: Object, default: null },
  priceAdjustment: { type: Object, default: null }
})

defineEmits(['update:reason'])

const { locale } = useI18n()

// Local state
const reason = ref(props.formData?.reason || '')
const confirmed = ref(false)

// Watch for changes
watch(
  () => props.formData?.reason,
  newVal => {
    reason.value = newVal || ''
  }
)

// Computed
const showReasonError = computed(() => {
  return reason.value.length > 0 && reason.value.length < 10
})

// Methods
const formatCurrency = (amount, currency = 'TRY') => {
  if (amount === undefined || amount === null) return '-'
  return new Intl.NumberFormat(locale.value === 'tr' ? 'tr-TR' : 'en-US', {
    style: 'currency',
    currency: currency || 'TRY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount)
}
</script>
