<template>
  <div
    class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 shadow-lg"
  >
    <!-- Header -->
    <div
      class="p-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between"
    >
      <h3 class="font-semibold text-gray-900 dark:text-white flex items-center">
        <span class="material-icons text-purple-500 mr-2">shopping_cart</span>
        {{ $t('booking.cart') }}
        <span
          class="ml-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-full text-sm font-medium"
        >
          {{ cart.length }}
        </span>
      </h3>
      <button
        v-if="!isExpanded && cart.length > 0"
        class="text-sm text-purple-600 dark:text-purple-400 hover:underline"
        @click="isExpanded = true"
      >
        {{ $t('common.details') }}
      </button>
    </div>

    <!-- Cart Items (Expandable) -->
    <div
      v-if="isExpanded && cart.length > 0"
      class="divide-y divide-gray-100 dark:divide-slate-700 max-h-64 overflow-y-auto"
    >
      <div v-for="(item, index) in cart" :key="index" class="p-3 flex items-center justify-between">
        <div class="flex-1 min-w-0">
          <div class="font-medium text-gray-900 dark:text-white truncate">
            {{ getLocalizedName(item.roomType?.name) }}
          </div>
          <div class="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400">
            <span>{{ getLocalizedName(item.mealPlan?.name) }} ({{ item.mealPlan?.code }})</span>
            <!-- Rate Type Badge -->
            <span
              v-if="item.isNonRefundable"
              class="px-1.5 py-0.5 text-[10px] font-medium bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded"
            >
              İade Edilmez
            </span>
          </div>
          <div class="text-xs text-gray-400 dark:text-slate-500">
            {{ item.adults }} {{ $t('booking.adults') }}
            <span v-if="item.children?.length"
              >+ {{ item.children.length }} {{ $t('booking.children') }}</span
            >
          </div>
        </div>
        <div class="flex items-center gap-3 ml-3">
          <div class="text-right">
            <div class="font-semibold text-purple-600 dark:text-purple-400">
              {{ formatPrice(item.pricing?.finalTotal, currency) }}
            </div>
          </div>
          <button
            class="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
            @click="$emit('remove', index)"
          >
            <span class="material-icons text-xl">delete</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Compact Summary -->
    <div
      v-if="!isExpanded && cart.length > 0"
      class="px-4 py-2 text-sm text-gray-600 dark:text-slate-400"
    >
      {{ cart.length }} {{ $t('booking.rooms') }} - {{ nights }} {{ $t('booking.nights') }}
    </div>

    <!-- Total & Action -->
    <div class="p-4 bg-gray-50 dark:bg-slate-700/50 flex items-center justify-between">
      <div>
        <div class="text-sm text-gray-500 dark:text-slate-400">{{ $t('booking.total') }}</div>
        <div class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ formatPrice(total, currency) }}
        </div>
      </div>
      <button class="btn-primary px-6 py-2.5" @click="$emit('proceed')">
        {{ $t('booking.continueToCheckout') }}
        <span class="material-icons ml-2">arrow_forward</span>
      </button>
    </div>

    <!-- Collapse Button -->
    <div v-if="isExpanded" class="p-2 text-center border-t border-gray-200 dark:border-slate-700">
      <button
        class="text-sm text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300"
        @click="isExpanded = false"
      >
        <span class="material-icons text-sm align-middle">expand_less</span>
        {{ $t('common.collapse') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()

defineProps({
  cart: {
    type: Array,
    required: true
  },
  currency: {
    type: String,
    default: 'TRY'
  },
  total: {
    type: Number,
    default: 0
  },
  nights: {
    type: Number,
    default: 0
  }
})

defineEmits(['proceed', 'remove'])

const isExpanded = ref(false)

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
  if (!price) return '-'
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price)
}
</script>
