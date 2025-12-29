<template>
  <div>
    <!-- Info Box -->
    <div class="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4 mb-6 border border-indigo-200 dark:border-indigo-800">
      <div class="flex items-start gap-3">
        <span class="material-icons text-indigo-500 text-xl">info</span>
        <div>
          <h4 class="font-medium text-indigo-800 dark:text-indigo-300 mb-1">{{ $t('planning.markets.pricingOverrideInfo') }}</h4>
          <p class="text-sm text-indigo-700 dark:text-indigo-400">{{ $t('planning.markets.pricingOverrideDescription') }}</p>
        </div>
      </div>
    </div>

    <!-- No Rooms Warning -->
    <div v-if="pricingRoomTypes.length === 0" class="text-center py-12">
      <div class="w-16 h-16 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-4">
        <span class="material-icons text-3xl text-gray-400 dark:text-slate-500">hotel</span>
      </div>
      <h5 class="font-medium text-gray-600 dark:text-slate-400 mb-2">{{ $t('planning.markets.noRooms') }}</h5>
      <p class="text-sm text-gray-500 dark:text-slate-500 max-w-md mx-auto">
        {{ $t('planning.markets.noRoomsHint') }}
      </p>
    </div>

    <!-- Room Type Tabs for Pricing Overrides -->
    <div v-else>
      <!-- Room Selection Tabs -->
      <div class="flex gap-1 flex-wrap pb-2 mb-4 border-b border-gray-200 dark:border-slate-700">
        <button
          v-for="rt in pricingRoomTypes"
          :key="rt._id"
          type="button"
          @click="selectedPricingRoom = rt._id"
          class="px-4 py-2 text-sm font-medium whitespace-nowrap transition-all border-b-2 -mb-px rounded-t-lg"
          :class="selectedPricingRoom === rt._id
            ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20'
            : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 hover:border-gray-300'"
        >
          <div class="flex flex-col items-center">
            <div class="flex items-center gap-1">
              <span class="font-bold">{{ rt.code }}</span>
              <span
                v-if="hasRoomOverride(rt._id)"
                class="w-2 h-2 rounded-full bg-indigo-500"
              ></span>
            </div>
            <!-- Pricing type badge -->
            <span
              class="text-[10px] font-mono opacity-60"
              :class="rt.pricingType === 'per_person' ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500 dark:text-slate-400'"
            >
              {{ rt.pricingType === 'per_person' ? 'obp' : 'ünite' }}
            </span>
          </div>
        </button>
      </div>

      <!-- Selected Room Pricing Override -->
      <div v-if="selectedPricingRoom && currentSelectedRoom" class="space-y-4">
        <!-- Room Info -->
        <div class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
          <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-sm">
            {{ currentSelectedRoom.code }}
          </div>
          <div class="flex-1">
            <div class="font-medium text-gray-800 dark:text-white text-sm">{{ currentSelectedRoom.name?.[locale] || currentSelectedRoom.name?.tr }}</div>
            <div class="text-xs text-gray-500 dark:text-slate-400">
              {{ currentSelectedRoom.pricingType === 'per_person' ? 'Kişi Bazlı (OBP)' : 'Ünite Bazlı' }}
              <template v-if="currentSelectedRoom.useMultipliers"> + Çarpan Sistemi</template>
              | Max: {{ currentSelectedRoom.occupancy?.maxAdults || 2 }} Yetişkin, {{ currentSelectedRoom.occupancy?.maxChildren || 0 }} Çocuk
            </div>
          </div>
        </div>

        <!-- 1. Pricing Type Override -->
        <div class="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
                <span class="material-icons text-white">payments</span>
              </div>
              <div>
                <h4 class="font-semibold text-gray-900 dark:text-white">{{ $t('planning.markets.pricingTypeOverride') }}</h4>
                <p class="text-xs text-gray-500 dark:text-slate-400">{{ $t('planning.markets.pricingTypeOverrideHint') }}</p>
              </div>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                v-model="currentRoomOverride.usePricingTypeOverride"
                class="sr-only peer"
              />
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <!-- Pricing Type Selection (when override enabled) -->
          <div v-if="currentRoomOverride.usePricingTypeOverride" class="grid grid-cols-2 gap-3">
            <button
              type="button"
              @click="currentRoomOverride.pricingType = 'unit'"
              class="p-4 rounded-xl border-2 transition-all text-left"
              :class="currentRoomOverride.pricingType === 'unit'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                : 'border-gray-200 dark:border-slate-600 hover:border-gray-300'"
            >
              <div class="flex items-center gap-2 mb-1">
                <span class="material-icons text-blue-500">home</span>
                <span class="font-semibold text-gray-900 dark:text-white">{{ $t('planning.pricing.unitBased') }}</span>
              </div>
              <p class="text-xs text-gray-500 dark:text-slate-400">{{ $t('planning.pricing.unitBasedHint') }}</p>
            </button>
            <button
              type="button"
              @click="currentRoomOverride.pricingType = 'per_person'"
              class="p-4 rounded-xl border-2 transition-all text-left"
              :class="currentRoomOverride.pricingType === 'per_person'
                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30'
                : 'border-gray-200 dark:border-slate-600 hover:border-gray-300'"
            >
              <div class="flex items-center gap-2 mb-1">
                <span class="material-icons text-purple-500">person</span>
                <span class="font-semibold text-gray-900 dark:text-white">{{ $t('planning.pricing.perPerson') }}</span>
              </div>
              <p class="text-xs text-gray-500 dark:text-slate-400">{{ $t('planning.pricing.perPersonHint') }}</p>
            </button>
          </div>

          <!-- Info when disabled -->
          <div v-else class="p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg">
            <p class="text-sm text-gray-600 dark:text-slate-400 flex items-center gap-2">
              <span class="material-icons text-sm text-blue-500">info</span>
              {{ $t('planning.markets.usingRoomPricingType') }}:
              <span class="font-semibold" :class="currentSelectedRoom.pricingType === 'per_person' ? 'text-purple-600' : 'text-blue-600'">
                {{ currentSelectedRoom.pricingType === 'per_person' ? $t('planning.pricing.perPerson') : $t('planning.pricing.unitBased') }}
              </span>
            </p>
          </div>
        </div>

        <!-- 2. Multiplier Override (only for OBP with multipliers) -->
        <div
          v-if="effectivePricingType === 'per_person'"
          class="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-4 border border-indigo-200 dark:border-indigo-800"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-indigo-500 flex items-center justify-center">
                <span class="material-icons text-white">calculate</span>
              </div>
              <div>
                <h4 class="font-semibold text-gray-900 dark:text-white">{{ $t('planning.pricing.multiplierOverride') }}</h4>
                <p class="text-xs text-gray-500 dark:text-slate-400">{{ $t('planning.markets.overrideRoomMultipliers') }}</p>
              </div>
            </div>
            <label class="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                v-model="currentRoomOverride.useMultiplierOverride"
                class="sr-only peer"
              />
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
              <span class="ms-2 text-sm font-medium" :class="currentRoomOverride.useMultiplierOverride ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-slate-400'">
                {{ currentRoomOverride.useMultiplierOverride ? $t('common.active') : $t('common.inactive') }}
              </span>
            </label>
          </div>

          <!-- Info when disabled -->
          <div v-if="!currentRoomOverride.useMultiplierOverride" class="mt-3 p-3 bg-white/50 dark:bg-slate-800/50 rounded-lg">
            <p class="text-sm text-gray-600 dark:text-slate-400 flex items-center gap-2">
              <span class="material-icons text-sm text-blue-500">info</span>
              {{ $t('planning.pricing.usingRoomMultipliers') }}
            </p>
          </div>
        </div>

        <!-- Multiplier Template (when override enabled) -->
        <div v-if="currentRoomOverride.useMultiplierOverride && effectivePricingType === 'per_person'">
          <MultiplierTemplate
            v-model="currentRoomOverride.multiplierOverride"
            :occupancy="currentSelectedRoom.occupancy"
            :child-age-groups="hotel?.childAgeGroups || []"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import MultiplierTemplate from '@/components/planning/rooms/MultiplierTemplate.vue'

const props = defineProps({
  market: { type: Object, default: null },
  hotel: { type: Object, default: null },
  roomTypes: { type: Array, default: () => [] },
  saving: { type: Boolean, default: false }
})

const { t, locale } = useI18n()
const selectedPricingRoom = ref('')

// Room types for pricing tab - considers market's active room types
const pricingRoomTypes = computed(() => {
  const activeRoomTypes = props.market?.activeRoomTypes || []
  // If market has specific active room types, use those
  if (activeRoomTypes.length > 0) {
    const activeIds = activeRoomTypes.map(id => typeof id === 'object' ? id._id : id)
    return props.roomTypes.filter(rt => activeIds.includes(rt._id))
  }
  // Otherwise use all room types
  return props.roomTypes
})

// Current selected room
const currentSelectedRoom = computed(() => {
  return pricingRoomTypes.value.find(rt => rt._id === selectedPricingRoom.value)
})

// Pricing overrides storage
const pricingOverrides = reactive({})

// Current room override data
const currentRoomOverride = computed(() => {
  if (!selectedPricingRoom.value) {
    return {
      usePricingTypeOverride: false,
      pricingType: 'unit',
      useMultiplierOverride: false,
      multiplierOverride: null
    }
  }
  if (!pricingOverrides[selectedPricingRoom.value]) {
    // Initialize with room's settings
    const room = currentSelectedRoom.value
    pricingOverrides[selectedPricingRoom.value] = {
      usePricingTypeOverride: false,
      pricingType: room?.pricingType || 'unit',
      useMultiplierOverride: false,
      multiplierOverride: room?.multiplierTemplate ? JSON.parse(JSON.stringify(room.multiplierTemplate)) : null
    }
  }
  return pricingOverrides[selectedPricingRoom.value]
})

// Effective pricing type (considering override)
const effectivePricingType = computed(() => {
  if (!currentRoomOverride.value) return 'unit'
  if (currentRoomOverride.value.usePricingTypeOverride) {
    return currentRoomOverride.value.pricingType
  }
  return currentSelectedRoom.value?.pricingType || 'unit'
})

// Check if specific room has override
const hasRoomOverride = (roomId) => {
  const override = pricingOverrides[roomId]
  return override?.usePricingTypeOverride || override?.useMultiplierOverride || false
}

// Load existing pricing overrides from market
const loadOverrides = () => {
  if (props.market?.pricingOverrides?.length) {
    props.market.pricingOverrides.forEach(override => {
      const roomId = typeof override.roomType === 'object' ? override.roomType._id : override.roomType
      pricingOverrides[roomId] = {
        usePricingTypeOverride: override.usePricingTypeOverride || false,
        pricingType: override.pricingType || 'unit',
        useMultiplierOverride: override.useMultiplierOverride || false,
        multiplierOverride: override.multiplierOverride || null
      }
    })
  }
}

// Select first room when room types become available
watch(pricingRoomTypes, (newRoomTypes) => {
  if (newRoomTypes.length > 0 && !selectedPricingRoom.value) {
    selectedPricingRoom.value = newRoomTypes[0]._id
  }
}, { immediate: true })

// Reload overrides when market changes
watch(() => props.market, () => {
  loadOverrides()
}, { deep: true })

// Public method to get form data
const getFormData = () => {
  // Build pricing overrides array
  const pricingOverridesArray = []
  for (const [roomId, override] of Object.entries(pricingOverrides)) {
    if (override.usePricingTypeOverride || override.useMultiplierOverride) {
      pricingOverridesArray.push({
        roomType: roomId,
        usePricingTypeOverride: override.usePricingTypeOverride || false,
        pricingType: override.pricingType || 'unit',
        useMultiplierOverride: override.useMultiplierOverride || false,
        multiplierOverride: override.multiplierOverride
      })
    }
  }
  return { pricingOverrides: pricingOverridesArray }
}

// Expose getFormData to parent
defineExpose({ getFormData })

onMounted(() => {
  loadOverrides()
  // Select first room if available
  if (pricingRoomTypes.value.length > 0 && !selectedPricingRoom.value) {
    selectedPricingRoom.value = pricingRoomTypes.value[0]._id
  }
})
</script>
