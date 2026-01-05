<template>
  <Modal v-model="isOpen" :title="$t('booking.priceBreakdown')" size="lg">
    <div v-if="option" class="space-y-4">
      <!-- Meal Plan Info -->
      <div class="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
        <div class="flex items-center justify-between">
          <div>
            <span class="text-sm text-gray-600 dark:text-slate-400">{{
              $t('booking.mealPlan')
            }}</span>
            <h4 class="font-semibold text-gray-900 dark:text-white">
              {{ getLocalizedName(option.mealPlan?.name) }}
              <span class="text-gray-500 text-sm">({{ option.mealPlan?.code }})</span>
            </h4>
          </div>
          <div class="text-right">
            <span class="text-sm text-gray-600 dark:text-slate-400"
              >{{ option.nights }} {{ $t('booking.nights') }}</span
            >
          </div>
        </div>
      </div>

      <!-- Daily Breakdown Table -->
      <div class="border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 dark:bg-slate-700">
            <tr>
              <th class="px-4 py-3 text-left font-medium text-gray-700 dark:text-slate-300">
                {{ $t('booking.date') }}
              </th>
              <th class="px-4 py-3 text-right font-medium text-gray-700 dark:text-slate-300">
                {{ $t('booking.basePrice') }}
              </th>
              <th class="px-4 py-3 text-right font-medium text-gray-700 dark:text-slate-300">
                {{ $t('booking.discount') }}
              </th>
              <th class="px-4 py-3 text-right font-medium text-gray-700 dark:text-slate-300">
                {{ $t('booking.finalPrice') }}
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-slate-700">
            <tr
              v-for="(day, index) in option.dailyBreakdown"
              :key="index"
              class="hover:bg-gray-50 dark:hover:bg-slate-700/50"
            >
              <td class="px-4 py-3 text-gray-900 dark:text-white">
                {{ formatDate(day.date) }}
              </td>
              <td class="px-4 py-3 text-right text-gray-600 dark:text-slate-400">
                {{ formatPrice(day.basePrice || day.originalPrice, option.pricing?.currency) }}
              </td>
              <td class="px-4 py-3 text-right">
                <span v-if="day.discountAmount > 0" class="text-green-600 dark:text-green-400">
                  -{{ formatPrice(day.discountAmount, option.pricing?.currency) }}
                </span>
                <span v-else class="text-gray-400">-</span>
              </td>
              <td class="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">
                {{ formatPrice(day.finalPrice, option.pricing?.currency) }}
              </td>
            </tr>
          </tbody>
          <tfoot class="bg-gray-50 dark:bg-slate-700 font-semibold">
            <tr>
              <td class="px-4 py-3 text-gray-900 dark:text-white">
                {{ $t('booking.total') }}
              </td>
              <td class="px-4 py-3 text-right text-gray-600 dark:text-slate-400">
                {{ formatPrice(option.pricing?.originalTotal, option.pricing?.currency) }}
              </td>
              <td class="px-4 py-3 text-right text-green-600 dark:text-green-400">
                <span v-if="option.pricing?.totalDiscount > 0">
                  -{{ formatPrice(option.pricing?.totalDiscount, option.pricing?.currency) }}
                </span>
              </td>
              <td class="px-4 py-3 text-right text-purple-600 dark:text-purple-400">
                {{ formatPrice(option.pricing?.finalTotal, option.pricing?.currency) }}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <!-- Applied Campaigns -->
      <div
        v-if="option.campaigns?.length > 0"
        class="bg-green-50 dark:bg-green-900/20 rounded-lg p-4"
      >
        <h5 class="font-medium text-green-800 dark:text-green-300 mb-2 flex items-center">
          <span class="material-icons text-sm mr-2">local_offer</span>
          {{ $t('booking.appliedCampaigns') }}
        </h5>
        <div class="space-y-2">
          <div
            v-for="campaign in option.campaigns"
            :key="campaign.code"
            class="flex items-center justify-between text-sm"
          >
            <span class="text-green-700 dark:text-green-400">
              {{ campaign.name || campaign.code }}
            </span>
            <span class="font-medium text-green-800 dark:text-green-300">
              {{ campaign.discountText }}
            </span>
          </div>
        </div>
      </div>

      <!-- Summary -->
      <div
        class="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-slate-700"
      >
        <div>
          <span class="text-sm text-gray-500 dark:text-slate-400">{{
            $t('booking.avgPerNight')
          }}</span>
          <div class="font-semibold text-gray-900 dark:text-white">
            {{ formatPrice(option.pricing?.avgPerNight, option.pricing?.currency) }}
          </div>
        </div>
        <div class="text-right">
          <span class="text-sm text-gray-500 dark:text-slate-400">{{
            $t('booking.grandTotal')
          }}</span>
          <div class="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {{ formatPrice(option.pricing?.finalTotal, option.pricing?.currency) }}
          </div>
        </div>
      </div>
    </div>
  </Modal>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Modal from '@/components/common/Modal.vue'

const { locale } = useI18n()

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  option: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue'])

const isOpen = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val)
})

// Get localized name
const getLocalizedName = name => {
  if (!name) return ''
  if (typeof name === 'object') {
    return name[locale.value] || name.en || name.tr || Object.values(name)[0] || ''
  }
  return name
}

// Format price
const formatPrice = (price, currency = 'TRY') => {
  if (!price && price !== 0) return '-'
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price)
}

// Format date
const formatDate = dateStr => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat(locale.value === 'tr' ? 'tr-TR' : 'en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  }).format(date)
}
</script>
