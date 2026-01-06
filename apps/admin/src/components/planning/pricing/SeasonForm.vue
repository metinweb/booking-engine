<template>
  <div class="flex flex-col h-full">
    <!-- Tab Navigation (Sticky) - Hidden in preview mode -->
    <div
      v-if="!showPreview"
      class="flex border-b border-gray-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 z-10 -mx-4 px-4"
    >
      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        class="px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-2"
        :class="
          activeTab === tab.id
            ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
            : 'border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 hover:border-gray-300'
        "
        @click="activeTab = tab.id"
      >
        <span class="material-icons text-lg">{{ tab.icon }}</span>
        {{ tab.label }}
        <span
          v-if="tab.id === 'pricing' && hasPricingOverrides"
          class="w-2 h-2 rounded-full bg-indigo-500"
        ></span>
      </button>
    </div>

    <!-- Tab Content - Hidden in preview mode -->
    <div v-if="!showPreview" class="space-y-6 flex-1 overflow-y-auto overflow-x-hidden mt-6">
      <!-- General Settings Tab -->
      <div v-show="activeTab === 'general'">
        <SeasonFormGeneralTab
          :form="form"
          :market="market"
          :hotel="hotel"
          :filtered-room-types="filteredRoomTypes"
          :filtered-meal-plans="filteredMealPlans"
          @add-date-range="addDateRange"
          @remove-date-range="removeDateRange"
        />
      </div>

      <!-- Pricing Overrides Tab -->
      <div v-show="activeTab === 'pricing'">
        <SeasonFormPricingTab
          :pricing-room-types="pricingRoomTypes"
          :selected-pricing-room="selectedPricingRoom"
          :pricing-overrides="pricingOverrides"
          :hotel="hotel"
          :market="market"
          @update:selected-pricing-room="selectedPricingRoom = $event"
        />
      </div>
    </div>

    <!-- Preview Mode Content -->
    <SeasonFormPreview
      v-if="showPreview"
      :form="form"
      :saving="saving"
      :has-pricing-overrides="hasPricingOverrides"
      :filtered-room-types="filteredRoomTypes"
      :filtered-meal-plans="filteredMealPlans"
      @back="showPreview = false"
      @confirm="confirmAndSave"
    />

    <!-- Actions (hide when preview is open) -->
    <div
      v-if="!showPreview"
      class="flex justify-end gap-3 pt-4 mt-6 border-t border-gray-200 dark:border-slate-700"
    >
      <button type="button" class="btn-secondary" @click="$emit('cancel')">
        {{ $t('common.cancel') }}
      </button>
      <button type="button" class="btn-primary" :disabled="saving" @click="handlePreview">
        <span class="material-icons text-sm mr-1">visibility</span>
        {{ $t('planning.seasons.reviewAndSave') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import planningService from '@/services/planningService'
import { ADMIN_LANGUAGES } from '@/constants/languages'
import SeasonFormGeneralTab from './SeasonFormGeneralTab.vue'
import SeasonFormPricingTab from './SeasonFormPricingTab.vue'
import SeasonFormPreview from './SeasonFormPreview.vue'

const props = defineProps({
  hotel: { type: Object, required: true },
  season: { type: Object, default: null },
  market: { type: Object, required: true },
  roomTypes: { type: Array, default: () => [] },
  mealPlans: { type: Array, default: () => [] },
  existingSeasons: { type: Array, default: () => [] }
})

const emit = defineEmits(['saved', 'cancel'])

const { t, locale } = useI18n()
const toast = useToast()
const saving = ref(false)
const activeTab = ref('general')
const selectedPricingRoom = ref('')
const showPreview = ref(false)

// Tab definitions
const tabs = computed(() => [
  { id: 'general', label: t('planning.seasons.generalSettings'), icon: 'settings' },
  { id: 'pricing', label: t('planning.seasons.pricingTab'), icon: 'payments' }
])

// Filter room types and meal plans based on market's active selections
const filteredRoomTypes = computed(() => {
  const marketActiveIds = (props.market?.activeRoomTypes || []).map(id =>
    typeof id === 'object' ? id._id : id
  )
  if (marketActiveIds.length === 0) {
    return props.roomTypes
  }
  return props.roomTypes.filter(rt => marketActiveIds.includes(rt._id))
})

const filteredMealPlans = computed(() => {
  const marketActiveIds = (props.market?.activeMealPlans || []).map(id =>
    typeof id === 'object' ? id._id : id
  )
  if (marketActiveIds.length === 0) {
    return props.mealPlans
  }
  return props.mealPlans.filter(mp => marketActiveIds.includes(mp._id))
})

// Room types for pricing tab - considers season's active room types
const pricingRoomTypes = computed(() => {
  // If season has specific active room types, use those
  if (form.activeRoomTypes.length > 0) {
    return filteredRoomTypes.value.filter(rt => form.activeRoomTypes.includes(rt._id))
  }
  // Otherwise inherit from market (use all filtered room types)
  return filteredRoomTypes.value
})

// Pricing overrides storage
const pricingOverrides = reactive({})

// Initialize pricing override for a room
const initializePricingOverride = roomId => {
  if (!roomId || pricingOverrides[roomId]) return
  const room = pricingRoomTypes.value.find(rt => rt._id === roomId)
  pricingOverrides[roomId] = {
    usePricingTypeOverride: false,
    pricingType: room?.pricingType || 'unit',
    useMinAdultsOverride: false,
    minAdults: room?.occupancy?.minAdults || 1,
    useMultiplierOverride: false,
    multiplierOverride: room?.multiplierTemplate
      ? JSON.parse(JSON.stringify(room.multiplierTemplate))
      : null
  }
}

// Initialize override when room selection changes
watch(selectedPricingRoom, roomId => {
  initializePricingOverride(roomId)
})

// Check if any room has overrides
const hasPricingOverrides = computed(() => {
  return Object.values(pricingOverrides).some(
    o => o.usePricingTypeOverride || o.useMinAdultsOverride || o.useMultiplierOverride
  )
})

// Valid date ranges
const validDateRanges = computed(() => {
  return form.dateRanges.filter(r => r.startDate && r.endDate)
})

// Check if two date ranges overlap
const datesOverlap = (start1, end1, start2, end2) => {
  const s1 = new Date(start1).getTime()
  const e1 = new Date(end1).getTime()
  const s2 = new Date(start2).getTime()
  const e2 = new Date(end2).getTime()
  return s1 <= e2 && s2 <= e1
}

// Check for date overlaps with existing seasons
const checkDateOverlaps = () => {
  const currentSeasonId = props.season?._id
  const existingSeasons = props.existingSeasons || []

  for (const range of validDateRanges.value) {
    for (const existingSeason of existingSeasons) {
      // Skip current season when editing
      if (existingSeason._id === currentSeasonId) continue

      // Check each date range of existing season
      for (const existingRange of existingSeason.dateRanges || []) {
        if (
          datesOverlap(
            range.startDate,
            range.endDate,
            existingRange.startDate,
            existingRange.endDate
          )
        ) {
          return {
            hasOverlap: true,
            conflictingSeason: existingSeason,
            conflictingRange: existingRange,
            newRange: range
          }
        }
      }
    }
  }

  return { hasOverlap: false }
}

const handlePreview = () => {
  const hasName = ADMIN_LANGUAGES.some(l => form.name[l]?.trim())
  if (!form.code || !hasName) {
    toast.error(t('validation.required'))
    return
  }

  if (validDateRanges.value.length === 0) {
    toast.error(t('planning.seasons.selectDateRanges'))
    return
  }

  // Check for date overlaps
  const overlapCheck = checkDateOverlaps()
  if (overlapCheck.hasOverlap) {
    const seasonCode = overlapCheck.conflictingSeason.code
    const startDate = new Date(overlapCheck.conflictingRange.startDate).toLocaleDateString('tr-TR')
    const endDate = new Date(overlapCheck.conflictingRange.endDate).toLocaleDateString('tr-TR')
    toast.error(`Tarih cakismasi! "${seasonCode}" sezonu ile cakisiyor (${startDate} - ${endDate})`)
    return
  }

  showPreview.value = true
}

const confirmAndSave = () => {
  showPreview.value = false
  handleSave()
}

// Hotel's child age groups
const hotelChildAgeGroups = computed(() => {
  return props.hotel?.childAgeGroups || []
})

// Initialize child age groups from hotel
const initChildAgeGroups = () => {
  return hotelChildAgeGroups.value.map(g => ({
    code: g.code,
    minAge: g.minAge,
    maxAge: g.maxAge
  }))
}

const createMultiLangObject = () => {
  const obj = {}
  ADMIN_LANGUAGES.forEach(lang => {
    obj[lang] = ''
  })
  return obj
}

const form = reactive({
  code: '',
  name: createMultiLangObject(),
  color: '#6366f1',
  priority: 0,
  dateRanges: [{ startDate: '', endDate: '' }],
  activeRoomTypes: [],
  activeMealPlans: [],
  childAgeSettings: {
    inheritFromMarket: true,
    childAgeGroups: [] // Will be initialized from hotel's childAgeGroups
  },
  paymentSettings: {
    inheritFromMarket: true,
    creditCard: { enabled: true },
    bankTransfer: { enabled: true, releaseDays: 3, discountRate: 0 }
  },
  childrenSettings: {
    inheritFromMarket: true,
    allowed: true
  },
  salesSettingsOverride: {
    inheritFromMarket: true,
    workingMode: 'net',
    commissionRate: 10,
    markup: { b2c: 0, b2b: 0 },
    agencyCommission: 10, // NET mode
    agencyMarginShare: 50 // COMMISSION mode
  },
  nonRefundableOverride: {
    inheritFromMarket: true,
    enabled: false,
    discount: 10
  }
})

const addDateRange = () => {
  form.dateRanges.push({ startDate: '', endDate: '' })
}

const removeDateRange = index => {
  form.dateRanges.splice(index, 1)
}

const formatDateForInput = date => {
  if (!date) return ''
  return new Date(date).toISOString().split('T')[0]
}

const handleSave = async () => {
  const hasName = ADMIN_LANGUAGES.some(l => form.name[l]?.trim())
  if (!form.code || !hasName) {
    toast.error(t('validation.required'))
    return
  }

  // Double-check for date overlaps before saving
  const overlapCheck = checkDateOverlaps()
  if (overlapCheck.hasOverlap) {
    const seasonCode = overlapCheck.conflictingSeason.code
    const startDate = new Date(overlapCheck.conflictingRange.startDate).toLocaleDateString('tr-TR')
    const endDate = new Date(overlapCheck.conflictingRange.endDate).toLocaleDateString('tr-TR')
    toast.error(`Tarih cakismasi! "${seasonCode}" sezonu ile cakisiyor (${startDate} - ${endDate})`)
    return
  }

  // Build pricing overrides array
  const pricingOverridesArray = []
  for (const [roomId, override] of Object.entries(pricingOverrides)) {
    if (
      override.usePricingTypeOverride ||
      override.useMinAdultsOverride ||
      override.useMultiplierOverride
    ) {
      pricingOverridesArray.push({
        roomType: roomId,
        usePricingTypeOverride: override.usePricingTypeOverride || false,
        pricingType: override.pricingType || 'unit',
        useMinAdultsOverride: override.useMinAdultsOverride || false,
        minAdults: override.minAdults || 1,
        useMultiplierOverride: override.useMultiplierOverride || false,
        multiplierOverride: override.multiplierOverride
      })
    }
  }

  const formData = {
    ...form,
    market: props.market._id,
    pricingOverrides: pricingOverridesArray
  }

  saving.value = true
  try {
    if (props.season) {
      await planningService.updateSeason(props.hotel._id, props.season._id, formData)
      toast.success(t('planning.pricing.seasonUpdated'))
    } else {
      await planningService.createSeason(props.hotel._id, formData)
      toast.success(t('planning.pricing.seasonCreated'))
    }
    emit('saved')
  } catch (error) {
    toast.error(error.response?.data?.message || t('common.operationFailed'))
  } finally {
    saving.value = false
  }
}

// Initialize first room when pricing tab is opened
watch(activeTab, newTab => {
  if (newTab === 'pricing' && pricingRoomTypes.value.length > 0 && !selectedPricingRoom.value) {
    selectedPricingRoom.value = pricingRoomTypes.value[0]._id
  }
})

// When active room types change, update selected room if needed
watch(
  () => form.activeRoomTypes,
  () => {
    // If currently selected room is no longer in the list, select first available
    if (
      selectedPricingRoom.value &&
      !pricingRoomTypes.value.find(rt => rt._id === selectedPricingRoom.value)
    ) {
      selectedPricingRoom.value = pricingRoomTypes.value[0]?._id || ''
    }
  },
  { deep: true }
)

// When child age override is enabled, initialize groups from hotel if empty
watch(
  () => form.childAgeSettings.inheritFromMarket,
  newVal => {
    if (!newVal && form.childAgeSettings.childAgeGroups.length === 0) {
      form.childAgeSettings.childAgeGroups = initChildAgeGroups()
    }
  }
)

// When hotel's childAgeGroups become available, initialize if needed
watch(
  hotelChildAgeGroups,
  newGroups => {
    if (newGroups.length > 0 && form.childAgeSettings.childAgeGroups.length === 0) {
      form.childAgeSettings.childAgeGroups = initChildAgeGroups()
    }
  },
  { immediate: true }
)

onMounted(() => {
  if (props.season) {
    const extractIds = arr => (arr || []).map(item => (typeof item === 'object' ? item._id : item))

    form.code = props.season.code || ''
    form.name = { ...createMultiLangObject(), ...props.season.name }
    form.color = props.season.color || '#6366f1'
    form.priority = props.season.priority || 0
    form.dateRanges = props.season.dateRanges?.length
      ? props.season.dateRanges.map(r => ({
          startDate: formatDateForInput(r.startDate),
          endDate: formatDateForInput(r.endDate)
        }))
      : [{ startDate: '', endDate: '' }]
    form.activeRoomTypes = extractIds(props.season.activeRoomTypes)
    form.activeMealPlans = extractIds(props.season.activeMealPlans)

    // Load child age settings
    const seasonGroups = props.season.childAgeSettings?.childAgeGroups || []
    form.childAgeSettings = {
      inheritFromMarket: props.season.childAgeSettings?.inheritFromMarket ?? true,
      childAgeGroups: seasonGroups.length > 0 ? seasonGroups : initChildAgeGroups()
    }
    form.paymentSettings = {
      inheritFromMarket: props.season.paymentSettings?.inheritFromMarket ?? true,
      creditCard: { enabled: props.season.paymentSettings?.creditCard?.enabled ?? true },
      bankTransfer: {
        enabled: props.season.paymentSettings?.bankTransfer?.enabled ?? true,
        releaseDays: props.season.paymentSettings?.bankTransfer?.releaseDays ?? 3,
        discountRate: props.season.paymentSettings?.bankTransfer?.discountRate ?? 0
      }
    }
    form.childrenSettings = {
      inheritFromMarket: props.season.childrenSettings?.inheritFromMarket ?? true,
      allowed: props.season.childrenSettings?.allowed ?? true
    }

    // Load sales settings override
    form.salesSettingsOverride = {
      inheritFromMarket: props.season.salesSettingsOverride?.inheritFromMarket ?? true,
      workingMode:
        props.season.salesSettingsOverride?.workingMode || props.market?.workingMode || 'net',
      commissionRate:
        props.season.salesSettingsOverride?.commissionRate ?? props.market?.commissionRate ?? 10,
      markup: {
        b2c: props.season.salesSettingsOverride?.markup?.b2c ?? props.market?.markup?.b2c ?? 0,
        b2b: props.season.salesSettingsOverride?.markup?.b2b ?? props.market?.markup?.b2b ?? 0
      },
      agencyCommission:
        props.season.salesSettingsOverride?.agencyCommission ?? props.market?.agencyCommission ?? 10,
      agencyMarginShare:
        props.season.salesSettingsOverride?.agencyMarginShare ?? props.market?.agencyMarginShare ?? 50
    }

    // Load non-refundable override
    form.nonRefundableOverride = {
      inheritFromMarket: props.season.nonRefundableOverride?.inheritFromMarket ?? true,
      enabled:
        props.season.nonRefundableOverride?.enabled ?? props.market?.nonRefundableEnabled ?? false,
      discount:
        props.season.nonRefundableOverride?.discount ?? props.market?.nonRefundableDiscount ?? 10
    }

    // Load existing pricing overrides
    if (props.season.pricingOverrides?.length) {
      props.season.pricingOverrides.forEach(override => {
        const roomId =
          typeof override.roomType === 'object' ? override.roomType._id : override.roomType
        pricingOverrides[roomId] = {
          usePricingTypeOverride: override.usePricingTypeOverride || false,
          pricingType: override.pricingType || 'unit',
          useMinAdultsOverride: override.useMinAdultsOverride || false,
          minAdults: override.minAdults || 1,
          useMultiplierOverride: override.useMultiplierOverride || false,
          multiplierOverride: override.multiplierOverride || null
        }
      })
    }
  }

  // Initialize child age groups from hotel if creating new season
  if (!props.season && form.childAgeSettings.childAgeGroups.length === 0) {
    form.childAgeSettings.childAgeGroups = initChildAgeGroups()
  }

  // Select first room if available
  if (pricingRoomTypes.value.length > 0) {
    selectedPricingRoom.value = pricingRoomTypes.value[0]._id
  }
})
</script>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
