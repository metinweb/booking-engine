<template>
  <div class="period-edit-form">
    <!-- Period Info Header -->
    <div class="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl p-4 mb-6 border border-purple-200 dark:border-purple-800">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2">
            <span class="material-icons text-purple-600 dark:text-purple-400">date_range</span>
            <span class="font-bold text-gray-800 dark:text-white">
              {{ formatDisplayDate(period.startDate) }} - {{ formatDisplayDate(period.endDate) }}
            </span>
          </div>
          <div class="px-3 py-1 bg-purple-200 dark:bg-purple-800 rounded-full text-sm font-bold text-purple-800 dark:text-purple-200">
            {{ calculateNights }} {{ $t('planning.pricing.nights') }}
          </div>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-2xl font-bold text-green-600">{{ period.pricePerNight?.toLocaleString() }}</span>
          <span class="text-gray-500 dark:text-slate-400">{{ currency }}</span>
        </div>
      </div>
    </div>

    <!-- Room Types Grid -->
    <div class="space-y-3">
      <h4 class="text-sm font-medium text-gray-700 dark:text-slate-300 flex items-center gap-2">
        <span class="material-icons text-purple-600 text-lg">hotel</span>
        {{ $t('planning.pricing.roomInventory') }}
      </h4>

      <div class="grid gap-3">
        <template v-for="rt in roomTypes" :key="rt._id">
        <div
          v-if="roomData[rt._id]"
          class="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4"
        >
          <div class="flex items-center justify-between">
            <!-- Room Info -->
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                {{ rt.code }}
              </div>
              <div>
                <div class="font-medium text-gray-800 dark:text-white text-sm">{{ getRoomTypeName(rt) }}</div>
                <div class="text-xs text-gray-500 dark:text-slate-400">
                  {{ rt.occupancy?.maxAdults || 2 }}+{{ rt.occupancy?.maxChildren || 2 }}
                </div>
              </div>
            </div>

            <!-- Inputs -->
            <div class="flex items-center gap-4">
              <!-- Allotment -->
              <div class="flex items-center gap-2">
                <div class="flex flex-col items-center">
                  <span class="text-[10px] text-gray-400 dark:text-slate-500 uppercase">{{ $t('planning.pricing.allotment') }}</span>
                  <div class="flex items-center gap-1">
                    <button
                      type="button"
                      @click="roomData[rt._id].allotment = Math.max(0, roomData[rt._id].allotment - 1)"
                      class="w-6 h-6 rounded bg-gray-200 dark:bg-slate-600 flex items-center justify-center hover:bg-gray-300 dark:hover:bg-slate-500 transition-colors"
                    >
                      <span class="material-icons text-sm">remove</span>
                    </button>
                    <input
                      v-model.number="roomData[rt._id].allotment"
                      type="number"
                      min="0"
                      class="w-12 text-center text-sm font-bold border-2 border-blue-300 dark:border-blue-700 rounded-lg py-1 bg-white dark:bg-slate-800"
                    />
                    <button
                      type="button"
                      @click="roomData[rt._id].allotment++"
                      class="w-6 h-6 rounded bg-gray-200 dark:bg-slate-600 flex items-center justify-center hover:bg-gray-300 dark:hover:bg-slate-500 transition-colors"
                    >
                      <span class="material-icons text-sm">add</span>
                    </button>
                  </div>
                </div>
              </div>

              <!-- MinStay -->
              <div class="flex flex-col items-center">
                <span class="text-[10px] text-gray-400 dark:text-slate-500 uppercase">Min</span>
                <div class="flex items-center gap-1">
                  <input
                    v-model.number="roomData[rt._id].minStay"
                    type="number"
                    min="1"
                    max="30"
                    class="w-12 text-center text-sm font-bold border-2 border-purple-300 dark:border-purple-700 rounded-lg py-1 bg-white dark:bg-slate-800"
                  />
                  <span class="text-xs text-gray-400">{{ $t('planning.pricing.nightsShort') }}</span>
                </div>
              </div>

              <!-- Release Days -->
              <div class="flex flex-col items-center">
                <span class="text-[10px] text-gray-400 dark:text-slate-500 uppercase">Release</span>
                <div class="flex items-center gap-1">
                  <input
                    v-model.number="roomData[rt._id].releaseDays"
                    type="number"
                    min="0"
                    class="w-12 text-center text-sm font-bold border-2 border-amber-300 dark:border-amber-700 rounded-lg py-1 bg-white dark:bg-slate-800"
                  />
                  <span class="text-xs text-gray-400">{{ $t('planning.pricing.daysShort') }}</span>
                </div>
              </div>

              <!-- Quick Restrictions -->
              <div class="flex items-center gap-1 ml-2">
                <button
                  type="button"
                  @click="roomData[rt._id].stopSale = !roomData[rt._id].stopSale"
                  class="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                  :class="roomData[rt._id].stopSale
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-200 dark:bg-slate-600 text-gray-400 hover:bg-gray-300'"
                  :title="$t('planning.pricing.stopSale')"
                >
                  <span class="material-icons text-sm">block</span>
                </button>
                <button
                  type="button"
                  @click="roomData[rt._id].closedToArrival = !roomData[rt._id].closedToArrival"
                  class="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                  :class="roomData[rt._id].closedToArrival
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-200 dark:bg-slate-600 text-gray-400 hover:bg-gray-300'"
                  title="CTA"
                >
                  <span class="text-xs font-bold">CTA</span>
                </button>
                <button
                  type="button"
                  @click="roomData[rt._id].closedToDeparture = !roomData[rt._id].closedToDeparture"
                  class="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                  :class="roomData[rt._id].closedToDeparture
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-200 dark:bg-slate-600 text-gray-400 hover:bg-gray-300'"
                  title="CTD"
                >
                  <span class="text-xs font-bold">CTD</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        </template>
      </div>
    </div>

    <!-- Copy to All Rooms -->
    <div class="mt-4 flex justify-end">
      <button
        type="button"
        @click="copyFirstToAll"
        class="text-sm px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 transition-colors flex items-center gap-1"
      >
        <span class="material-icons text-sm">content_copy</span>
        {{ $t('planning.pricing.copyToAllRooms') }}
      </button>
    </div>

    <!-- Footer Buttons -->
    <div class="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-gray-200 dark:border-slate-700">
      <button
        type="button"
        @click="$emit('cancel')"
        class="btn-secondary"
      >
        {{ $t('common.cancel') }}
      </button>
      <button
        type="button"
        @click="handleSave"
        class="btn-primary flex items-center gap-2"
        :disabled="saving"
      >
        <span v-if="saving" class="material-icons animate-spin text-sm">refresh</span>
        <span class="material-icons" v-else>check</span>
        {{ saving ? $t('common.saving') : $t('common.save') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import planningService from '@/services/planningService'

const props = defineProps({
  hotelId: { type: String, required: true },
  period: { type: Object, required: true },
  roomTypes: { type: Array, default: () => [] },
  mealPlans: { type: Array, default: () => [] },
  market: { type: Object, default: null },
  existingRates: { type: Array, default: () => [] }
})

const emit = defineEmits(['saved', 'cancel'])

const { t, locale } = useI18n()
const toast = useToast()

const saving = ref(false)

// Room data: { roomTypeId: { allotment, minStay, releaseDays, stopSale, closedToArrival, closedToDeparture } }
const roomData = reactive({})

const currency = computed(() => props.market?.currency || 'EUR')

const calculateNights = computed(() => {
  if (!props.period?.startDate || !props.period?.endDate) return 0
  const start = new Date(props.period.startDate)
  const end = new Date(props.period.endDate)
  const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1
  return diff > 0 ? diff : 0
})

// Methods
const getRoomTypeName = (roomType) => {
  if (!roomType) return ''
  return roomType.name?.[locale.value] || roomType.name?.tr || roomType.name?.en || ''
}

const formatDisplayDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString(locale.value === 'tr' ? 'tr-TR' : 'en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

// Initialize room data from period and existing rates
const initializeRoomData = () => {
  props.roomTypes.forEach(rt => {
    // Try to find existing rate for this room
    const existingRate = props.existingRates.find(r => {
      const rRoomId = r.roomType?._id || r.roomType
      return rRoomId === rt._id
    })

    roomData[rt._id] = {
      allotment: existingRate?.allotment ?? props.period.allotment ?? 10,
      minStay: existingRate?.minStay ?? props.period.minStay ?? 1,
      releaseDays: existingRate?.releaseDays ?? props.period.releaseDays ?? 0,
      stopSale: existingRate?.stopSale ?? props.period.stopSale ?? false,
      closedToArrival: existingRate?.closedToArrival ?? props.period.closedToArrival ?? false,
      closedToDeparture: existingRate?.closedToDeparture ?? props.period.closedToDeparture ?? false
    }
  })
}

// Copy first room's data to all rooms
const copyFirstToAll = () => {
  if (props.roomTypes.length < 2) return

  const firstRoom = props.roomTypes[0]
  const sourceData = roomData[firstRoom._id]

  props.roomTypes.forEach(rt => {
    if (rt._id !== firstRoom._id) {
      roomData[rt._id] = { ...sourceData }
    }
  })

  toast.success(t('planning.pricing.copiedToRooms'))
}

const handleSave = async () => {
  saving.value = true
  try {
    // Build bulk update data for each room
    const updates = []

    props.roomTypes.forEach(rt => {
      const data = roomData[rt._id]
      if (!data) return

      // For each meal plan, update the rate
      props.mealPlans.forEach(mp => {
        updates.push({
          roomType: rt._id,
          mealPlan: mp._id,
          market: props.market._id,
          startDate: props.period.startDate,
          endDate: props.period.endDate,
          allotment: data.allotment ?? 10,
          minStay: data.minStay || 1,
          releaseDays: data.releaseDays || 0,
          stopSale: data.stopSale || false,
          closedToArrival: data.closedToArrival || false,
          closedToDeparture: data.closedToDeparture || false
        })
      })
    })

    // Use bulk update endpoint
    await planningService.bulkUpdateRates(props.hotelId, { updates })

    toast.success(t('planning.pricing.ratesUpdated'))
    emit('saved')
  } catch (error) {
    console.error('Error saving period:', error)
    toast.error(error.response?.data?.message || t('common.operationFailed'))
  } finally {
    saving.value = false
  }
}

// Watch for prop changes
watch([() => props.roomTypes, () => props.period], () => {
  initializeRoomData()
}, { immediate: true, deep: true })

onMounted(() => {
  initializeRoomData()
})
</script>
