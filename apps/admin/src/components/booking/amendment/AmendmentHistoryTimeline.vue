<template>
  <div class="space-y-4">
    <div v-if="loading" class="flex items-center justify-center py-8">
      <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
      <span class="ml-2 text-gray-600 dark:text-gray-400">{{ $t('common.loading') }}</span>
    </div>

    <div v-else-if="!amendments || amendments.length === 0" class="text-center py-8">
      <span class="material-icons text-4xl text-gray-300 dark:text-gray-600">history</span>
      <p class="mt-2 text-gray-500 dark:text-gray-400">{{ $t('booking.amendment.noHistory') }}</p>
    </div>

    <div v-else class="relative">
      <!-- Timeline line -->
      <div class="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-600"></div>

      <!-- Timeline items -->
      <div
        v-for="(amendment, index) in amendments"
        :key="amendment.snapshotId"
        class="relative pl-10 pb-6 last:pb-0"
      >
        <!-- Timeline dot -->
        <div
          class="absolute left-2 top-0 w-5 h-5 rounded-full flex items-center justify-center"
          :class="getTypeColor(amendment.type)"
        >
          <span class="material-icons text-xs text-white">{{ getTypeIcon(amendment.type) }}</span>
        </div>

        <!-- Content card -->
        <div
          class="bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 p-4"
        >
          <!-- Header -->
          <div class="flex items-start justify-between mb-3">
            <div>
              <span
                class="px-2 py-0.5 text-xs font-medium rounded-full"
                :class="getTypeBadgeColor(amendment.type)"
              >
                {{ $t(`booking.amendment.types.${amendment.type}`) }}
              </span>
              <p class="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                {{ amendment.reason }}
              </p>
            </div>
            <div class="text-right text-xs text-gray-500 dark:text-gray-400">
              <p>{{ formatDate(amendment.takenAt) }}</p>
              <p>{{ amendment.takenBy }}</p>
            </div>
          </div>

          <!-- Changes list -->
          <div v-if="amendment.changes?.length > 0" class="space-y-2 mb-3">
            <div
              v-for="(change, cIndex) in amendment.changes.slice(
                0,
                expandedItems.includes(index) ? undefined : 3
              )"
              :key="cIndex"
              class="flex items-center gap-2 text-sm"
            >
              <span class="material-icons text-gray-400 text-xs">arrow_right</span>
              <span class="text-gray-600 dark:text-gray-400">{{
                change.fieldLabel || change.field
              }}</span>
            </div>
            <button
              v-if="amendment.changes.length > 3"
              class="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
              @click="toggleExpand(index)"
            >
              {{
                expandedItems.includes(index)
                  ? $t('common.showLess')
                  : `+${amendment.changes.length - 3} ${$t('common.more')}`
              }}
            </button>
          </div>

          <!-- Price difference -->
          <div
            v-if="amendment.priceDifference?.difference !== 0"
            class="flex items-center justify-between pt-3 border-t dark:border-gray-600"
          >
            <span class="text-sm text-gray-500 dark:text-gray-400">{{
              $t('booking.amendment.priceDifference')
            }}</span>
            <div class="text-right">
              <span
                class="font-medium"
                :class="
                  amendment.priceDifference.difference > 0 ? 'text-amber-600' : 'text-green-600'
                "
              >
                {{ amendment.priceDifference.difference > 0 ? '+' : ''
                }}{{
                  formatCurrency(
                    amendment.priceDifference.difference,
                    amendment.priceDifference.currency
                  )
                }}
              </span>
              <p v-if="amendment.priceDifference.waived" class="text-xs text-green-600">
                ({{ $t('booking.amendment.waived') }})
              </p>
            </div>
          </div>

          <!-- Previous state toggle -->
          <button
            class="mt-3 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1"
            @click="togglePreviousState(index)"
          >
            <span class="material-icons text-xs">{{
              showPreviousState.includes(index) ? 'expand_less' : 'expand_more'
            }}</span>
            {{ $t('booking.amendment.viewPreviousState') }}
          </button>

          <!-- Previous state details -->
          <div
            v-if="showPreviousState.includes(index)"
            class="mt-3 pt-3 border-t dark:border-gray-600 text-xs space-y-1"
          >
            <div class="flex justify-between">
              <span class="text-gray-500 dark:text-gray-400">{{ $t('booking.dates') }}</span>
              <span class="text-gray-700 dark:text-gray-300">
                {{ formatDate(amendment.previousState?.checkIn) }} -
                {{ formatDate(amendment.previousState?.checkOut) }} ({{
                  amendment.previousState?.nights
                }}
                {{ $t('booking.nightsUnit') }})
              </span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500 dark:text-gray-400">{{ $t('booking.rooms') }}</span>
              <span class="text-gray-700 dark:text-gray-300">{{
                amendment.previousState?.totalRooms
              }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500 dark:text-gray-400">{{ $t('booking.grandTotal') }}</span>
              <span class="text-gray-700 dark:text-gray-300">
                {{
                  formatCurrency(
                    amendment.previousState?.pricing?.grandTotal,
                    amendment.previousState?.pricing?.currency
                  )
                }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

defineProps({
  amendments: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false }
})

const { locale } = useI18n()

// State
const expandedItems = ref([])
const showPreviousState = ref([])

// Methods
const toggleExpand = index => {
  const idx = expandedItems.value.indexOf(index)
  if (idx === -1) {
    expandedItems.value.push(index)
  } else {
    expandedItems.value.splice(idx, 1)
  }
}

const togglePreviousState = index => {
  const idx = showPreviousState.value.indexOf(index)
  if (idx === -1) {
    showPreviousState.value.push(index)
  } else {
    showPreviousState.value.splice(idx, 1)
  }
}

const getTypeColor = type => {
  const colors = {
    dates: 'bg-blue-500',
    rooms: 'bg-purple-500',
    guests: 'bg-amber-500',
    pricing: 'bg-green-500',
    full: 'bg-indigo-500'
  }
  return colors[type] || colors.full
}

const getTypeIcon = type => {
  const icons = {
    dates: 'calendar_today',
    rooms: 'bed',
    guests: 'person',
    pricing: 'payments',
    full: 'edit'
  }
  return icons[type] || icons.full
}

const getTypeBadgeColor = type => {
  const colors = {
    dates: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    rooms: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    guests: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
    pricing: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    full: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300'
  }
  return colors[type] || colors.full
}

const formatDate = date => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString(locale.value === 'tr' ? 'tr-TR' : 'en-US', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

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
