/**
 * Market Form Composable
 * Contains all state, computed properties, and methods for MarketForm
 */
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import { ADMIN_LANGUAGES } from '@/constants/languages'
import planningService from '@/services/planningService'

export function useMarketForm(props, emit) {
  const { t, locale } = useI18n()
  const toast = useToast()
  const saving = ref(false)
  const activeTab = ref('general')
  const selectedPricingRoom = ref('')

  // ===================
  // CONSTANTS
  // ===================

  const currencies = ['TRY', 'USD', 'EUR', 'GBP', 'RUB', 'SAR', 'AED', 'CHF', 'JPY', 'CNY']

  const ratePolicies = computed(() => [
    { value: 'refundable', label: t('planning.markets.refundable') },
    { value: 'non_refundable', label: t('planning.markets.nonRefundable') },
    { value: 'both', label: t('planning.markets.both') }
  ])

  const commonCountries = [
    { code: 'TR', name: 'Türkiye' },
    { code: 'DE', name: 'Germany' },
    { code: 'GB', name: 'United Kingdom' },
    { code: 'RU', name: 'Russia' },
    { code: 'NL', name: 'Netherlands' },
    { code: 'BE', name: 'Belgium' },
    { code: 'FR', name: 'France' },
    { code: 'IT', name: 'Italy' },
    { code: 'ES', name: 'Spain' },
    { code: 'AT', name: 'Austria' },
    { code: 'CH', name: 'Switzerland' },
    { code: 'PL', name: 'Poland' },
    { code: 'UA', name: 'Ukraine' },
    { code: 'SA', name: 'Saudi Arabia' },
    { code: 'AE', name: 'UAE' },
    { code: 'US', name: 'USA' }
  ]

  // Tab definitions
  const tabs = computed(() => [
    { id: 'general', label: t('planning.markets.generalSettings'), icon: 'settings' },
    { id: 'pricing', label: t('planning.markets.pricingTab'), icon: 'payments' }
  ])

  // ===================
  // HELPERS
  // ===================

  const createMultiLangObject = () => {
    const obj = {}
    ADMIN_LANGUAGES.forEach(lang => {
      obj[lang] = ''
    })
    return obj
  }

  // Get hotel's child age groups
  const hotelChildAgeGroups = computed(() => props.hotel?.childAgeGroups || [])

  // Initialize child age groups from hotel
  const initChildAgeGroups = () => {
    return hotelChildAgeGroups.value.map(g => ({
      code: g.code,
      minAge: g.minAge,
      maxAge: g.maxAge
    }))
  }

  // ===================
  // FORM STATE
  // ===================

  const form = reactive({
    code: '',
    name: createMultiLangObject(),
    currency: 'EUR',
    countries: [],
    salesChannels: { b2c: true, b2b: true },
    childAgeSettings: {
      inheritFromHotel: true,
      childAgeGroups: []
    },
    activeRoomTypes: [],
    activeMealPlans: [],
    ratePolicy: 'refundable',
    nonRefundableDiscount: 10,
    taxes: {
      vat: { enabled: false, rate: 10, included: true },
      cityTax: { enabled: false, type: 'fixed_per_night', amount: 0 },
      serviceCharge: { enabled: false, rate: 10, included: true }
    },
    cancellationPolicy: {
      useHotelPolicy: true,
      freeCancellationDays: 7,
      penaltyRules: [],
      noShowPenalty: { type: 'full', value: 100 }
    }
  })

  // Pricing overrides storage
  const pricingOverrides = reactive({})

  // ===================
  // COMPUTED
  // ===================

  // Room types for pricing tab - considers market's active room types
  const pricingRoomTypes = computed(() => {
    if (form.activeRoomTypes.length > 0) {
      return props.roomTypes.filter(rt => form.activeRoomTypes.includes(rt._id))
    }
    return props.roomTypes
  })

  // Current selected room
  const currentSelectedRoom = computed(() => {
    return pricingRoomTypes.value.find(rt => rt._id === selectedPricingRoom.value)
  })

  // Current room override data
  const currentRoomOverride = computed(() => {
    if (!selectedPricingRoom.value) {
      return {
        usePricingTypeOverride: false,
        pricingType: 'unit',
        useMinAdultsOverride: false,
        minAdults: 1,
        useMultiplierOverride: false,
        multiplierOverride: null
      }
    }
    return pricingOverrides[selectedPricingRoom.value] || {
      usePricingTypeOverride: false,
      pricingType: 'unit',
      useMinAdultsOverride: false,
      minAdults: 1,
      useMultiplierOverride: false,
      multiplierOverride: null
    }
  })

  // Effective pricing type (considering override)
  const effectivePricingType = computed(() => {
    if (!currentRoomOverride.value) return 'unit'
    if (currentRoomOverride.value.usePricingTypeOverride) {
      return currentRoomOverride.value.pricingType
    }
    return currentSelectedRoom.value?.pricingType || 'unit'
  })

  // Check if any room has overrides
  const hasPricingOverrides = computed(() => {
    return Object.values(pricingOverrides).some(
      o => o.usePricingTypeOverride || o.useMinAdultsOverride || o.useMultiplierOverride
    )
  })

  // ===================
  // METHODS
  // ===================

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

  // Check if specific room has override
  const hasRoomOverride = roomId => {
    const override = pricingOverrides[roomId]
    return (
      override?.usePricingTypeOverride ||
      override?.useMinAdultsOverride ||
      override?.useMultiplierOverride ||
      false
    )
  }

  // Adjust minAdults override value
  const adjustMinAdultsOverride = delta => {
    if (!currentRoomOverride.value) return
    const current = currentRoomOverride.value.minAdults || 1
    const maxAdults = currentSelectedRoom.value?.occupancy?.maxAdults || 10
    const newValue = current + delta
    if (newValue >= 1 && newValue <= maxAdults) {
      currentRoomOverride.value.minAdults = newValue
    }
  }

  // Add new child age group
  const addChildAgeGroup = () => {
    const groups = form.childAgeSettings.childAgeGroups
    if (groups.length >= 3) return

    const existingCodes = groups.map(g => g.code)
    let newCode = 'second'

    if (!existingCodes.includes('infant')) {
      newCode = 'infant'
    } else if (!existingCodes.includes('first')) {
      newCode = 'first'
    } else if (!existingCodes.includes('second')) {
      newCode = 'second'
    }

    const lastGroup = groups[groups.length - 1]
    const newMinAge = lastGroup ? lastGroup.maxAge + 1 : 0

    groups.push({
      code: newCode,
      minAge: newMinAge,
      maxAge: Math.min(newMinAge + 5, 17)
    })
  }

  // Remove child age group
  const removeChildAgeGroup = index => {
    const groups = form.childAgeSettings.childAgeGroups
    if (groups.length <= 1) return
    groups.splice(index, 1)
    groups.forEach((g, i) => {
      if (i === 0) {
        g.minAge = 0
      } else {
        g.minAge = groups[i - 1].maxAge + 1
      }
    })
  }

  // When maxAge changes, update next group's minAge
  const onMaxAgeChange = index => {
    const groups = form.childAgeSettings.childAgeGroups
    const currentGroup = groups[index]

    if (currentGroup.maxAge < currentGroup.minAge) {
      currentGroup.maxAge = currentGroup.minAge
    }

    if (index < groups.length - 1) {
      groups[index + 1].minAge = currentGroup.maxAge + 1
      if (groups[index + 1].maxAge < groups[index + 1].minAge) {
        groups[index + 1].maxAge = groups[index + 1].minAge
      }
    }
  }

  // Penalty rule helpers
  const addPenaltyRule = () => {
    form.cancellationPolicy.penaltyRules.push({
      daysBeforeCheckIn: 7,
      penaltyType: 'percentage',
      penaltyValue: 50
    })
  }

  const removePenaltyRule = index => {
    form.cancellationPolicy.penaltyRules.splice(index, 1)
  }

  // ===================
  // SAVE HANDLER
  // ===================

  const handleSave = async () => {
    const hasName = ADMIN_LANGUAGES.some(l => form.name[l]?.trim())
    if (!form.code || !hasName) {
      toast.error(t('validation.required'))
      return
    }

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
      pricingOverrides: pricingOverridesArray
    }

    saving.value = true
    try {
      if (props.market) {
        await planningService.updateMarket(props.hotel._id, props.market._id, formData)
        toast.success(t('planning.markets.updated'))
      } else {
        await planningService.createMarket(props.hotel._id, formData)
        toast.success(t('planning.markets.created'))
      }
      emit('saved')
    } catch (error) {
      toast.error(error.response?.data?.message || t('common.operationFailed'))
    } finally {
      saving.value = false
    }
  }

  // ===================
  // WATCHERS
  // ===================

  const setupWatchers = () => {
    // Watch for selected room changes and initialize override if needed
    watch(
      selectedPricingRoom,
      newRoomId => {
        if (newRoomId) {
          initializePricingOverride(newRoomId)
        }
      },
      { immediate: true }
    )

    // When child age override is enabled, initialize groups from hotel if empty
    watch(
      () => form.childAgeSettings.inheritFromHotel,
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
        if (
          selectedPricingRoom.value &&
          !pricingRoomTypes.value.find(rt => rt._id === selectedPricingRoom.value)
        ) {
          selectedPricingRoom.value = pricingRoomTypes.value[0]?._id || ''
        }
      },
      { deep: true }
    )
  }

  // ===================
  // INITIALIZATION
  // ===================

  const initialize = () => {
    if (props.market) {
      form.code = props.market.code || ''
      form.name = { ...createMultiLangObject(), ...props.market.name }
      form.currency = props.market.currency || 'EUR'
      form.countries = [...(props.market.countries || [])]
      form.salesChannels = { ...form.salesChannels, ...props.market.salesChannels }
      form.activeRoomTypes = [...(props.market.activeRoomTypes || [])].map(id =>
        typeof id === 'object' ? id._id : id
      )
      form.activeMealPlans = [...(props.market.activeMealPlans || [])].map(id =>
        typeof id === 'object' ? id._id : id
      )
      form.ratePolicy = props.market.ratePolicy || 'refundable'
      form.nonRefundableDiscount = props.market.nonRefundableDiscount ?? 10

      // Child age settings
      const marketGroups = props.market.childAgeSettings?.childAgeGroups || []
      form.childAgeSettings = {
        inheritFromHotel: props.market.childAgeSettings?.inheritFromHotel ?? true,
        childAgeGroups: marketGroups.length > 0 ? marketGroups : initChildAgeGroups()
      }

      // Taxes
      if (props.market.taxes) {
        form.taxes.vat = { ...form.taxes.vat, ...props.market.taxes.vat }
        form.taxes.cityTax = { ...form.taxes.cityTax, ...props.market.taxes.cityTax }
        form.taxes.serviceCharge = {
          ...form.taxes.serviceCharge,
          ...props.market.taxes.serviceCharge
        }
      }

      // Cancellation policy
      if (props.market.cancellationPolicy) {
        form.cancellationPolicy.useHotelPolicy =
          props.market.cancellationPolicy.useHotelPolicy ?? true
        form.cancellationPolicy.freeCancellationDays =
          props.market.cancellationPolicy.freeCancellationDays ?? 7
        form.cancellationPolicy.penaltyRules = [
          ...(props.market.cancellationPolicy.penaltyRules || [])
        ]
        form.cancellationPolicy.noShowPenalty = {
          ...form.cancellationPolicy.noShowPenalty,
          ...props.market.cancellationPolicy.noShowPenalty
        }
      }

      // Load existing pricing overrides
      if (props.market.pricingOverrides?.length) {
        props.market.pricingOverrides.forEach(override => {
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
    } else {
      // Initialize child age groups from hotel when creating new market
      if (form.childAgeSettings.childAgeGroups.length === 0) {
        form.childAgeSettings.childAgeGroups = initChildAgeGroups()
      }
    }

    // Select first room if available
    if (pricingRoomTypes.value.length > 0) {
      selectedPricingRoom.value = pricingRoomTypes.value[0]._id
    }
  }

  return {
    // State
    saving,
    activeTab,
    selectedPricingRoom,
    form,
    pricingOverrides,

    // Constants
    currencies,
    ratePolicies,
    commonCountries,
    tabs,
    ADMIN_LANGUAGES,

    // Computed
    hotelChildAgeGroups,
    pricingRoomTypes,
    currentSelectedRoom,
    currentRoomOverride,
    effectivePricingType,
    hasPricingOverrides,

    // Methods
    initializePricingOverride,
    hasRoomOverride,
    adjustMinAdultsOverride,
    addChildAgeGroup,
    removeChildAgeGroup,
    onMaxAgeChange,
    addPenaltyRule,
    removePenaltyRule,
    handleSave,

    // Setup
    setupWatchers,
    initialize,

    // i18n
    t,
    locale
  }
}
