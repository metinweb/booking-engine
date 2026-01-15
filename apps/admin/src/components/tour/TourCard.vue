<template>
  <div
    class="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
    @click="$emit('click', tour)"
  >
    <!-- Image -->
    <div class="relative h-40 bg-gray-200 dark:bg-slate-700">
      <img
        v-if="tour.images?.[0]?.url"
        :src="tour.images[0].url"
        :alt="getLocalizedName(tour.name)"
        class="w-full h-full object-cover"
      />
      <div v-else class="w-full h-full flex items-center justify-center">
        <span class="material-icons text-4xl text-gray-400">tour</span>
      </div>

      <!-- Status Badge -->
      <div class="absolute top-2 left-2">
        <span
          class="px-2 py-1 text-xs font-medium rounded"
          :class="statusColors[tour.status] || 'bg-gray-100 text-gray-800'"
        >
          {{ $t(`tour.statuses.${tour.status}`) }}
        </span>
      </div>

      <!-- Featured Badge -->
      <div v-if="tour.featured" class="absolute top-2 right-2">
        <span class="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded flex items-center">
          <span class="material-icons text-sm mr-1">star</span>
          {{ $t('tour.fields.featured') }}
        </span>
      </div>

      <!-- Duration -->
      <div class="absolute bottom-2 right-2">
        <span class="px-2 py-1 text-xs font-medium bg-black/60 text-white rounded">
          {{ tour.duration?.nights }} {{ $t('tour.fields.nights') }} / {{ tour.duration?.days }} {{ $t('tour.fields.days') }}
        </span>
      </div>
    </div>

    <!-- Content -->
    <div class="p-4">
      <!-- Tour Type & Code -->
      <div class="flex items-center justify-between mb-2">
        <span class="text-xs text-purple-600 dark:text-purple-400 font-medium">
          {{ $t(`tour.tourTypes.${tour.tourType}`) }}
        </span>
        <span class="text-xs text-gray-500 dark:text-gray-400 font-mono">
          {{ tour.code }}
        </span>
      </div>

      <!-- Name -->
      <h3 class="font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
        {{ getLocalizedName(tour.name) }}
      </h3>

      <!-- Destination -->
      <div class="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-3">
        <span class="material-icons text-sm mr-1">place</span>
        <span>{{ tour.destination?.city || tour.destination?.country || '-' }}</span>
      </div>

      <!-- Transportation Icons -->
      <div class="flex items-center gap-2 mb-3">
        <span
          v-for="transport in tour.transportation?.slice(0, 3)"
          :key="transport.type"
          class="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center"
          :title="$t(`tour.transportTypes.${transport.type}`)"
        >
          <span class="material-icons text-sm text-gray-600 dark:text-gray-400">
            {{ getTransportIcon(transport.type) }}
          </span>
        </span>
      </div>

      <!-- Price -->
      <div class="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-slate-700">
        <div>
          <p class="text-xs text-gray-500 dark:text-gray-400">{{ $t('wizard.pricePerPerson') }}</p>
          <p class="text-lg font-bold text-purple-600 dark:text-purple-400">
            {{ formatCurrency(getLowestPrice(), tour.currency || 'TRY') }}
          </p>
        </div>
        <button
          v-if="showActions"
          @click.stop="$emit('action', 'view', tour)"
          class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400 hover:text-purple-600"
        >
          <span class="material-icons">arrow_forward</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { formatCurrency } from '@booking-engine/utils'

const props = defineProps({
  tour: {
    type: Object,
    required: true
  },
  showActions: {
    type: Boolean,
    default: true
  }
})

defineEmits(['click', 'action'])

const { t, locale } = useI18n()

const statusColors = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  draft: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  archived: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
}

function getLocalizedName(obj) {
  if (!obj) return ''
  if (typeof obj === 'string') return obj
  return obj[locale.value] || obj.tr || obj.en || ''
}

function getTransportIcon(type) {
  const icons = {
    flight: 'flight',
    bus: 'directions_bus',
    ferry: 'directions_boat',
    car: 'directions_car',
    train: 'train',
    combined: 'commute'
  }
  return icons[type] || 'commute'
}

function getLowestPrice() {
  // Return lowest departure price or base price
  if (props.tour.departures?.length > 0) {
    const prices = props.tour.departures
      .filter(d => d.pricing?.adult?.double)
      .map(d => d.pricing.adult.double)
    if (prices.length > 0) {
      return Math.min(...prices)
    }
  }
  return props.tour.basePrice || 0
}
</script>
