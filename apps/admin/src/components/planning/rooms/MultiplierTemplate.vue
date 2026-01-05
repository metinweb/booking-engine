<template>
  <div class="border border-indigo-200 dark:border-indigo-800 rounded-xl overflow-hidden">
    <!-- Header -->
    <div
      class="px-4 py-3 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 border-b border-indigo-200 dark:border-indigo-800"
    >
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg bg-indigo-500 flex items-center justify-center">
            <span class="material-icons text-white">calculate</span>
          </div>
          <div>
            <h4 class="font-semibold text-gray-900 dark:text-white">Fiyat Çarpanları Şablonu</h4>
            <p class="text-xs text-gray-500 dark:text-slate-400">
              Kişi bazlı fiyatlandırma için çarpan oranlarını tanımlayın
            </p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <!-- Enable/Disable Toggle -->
          <label class="relative inline-flex items-center cursor-pointer">
            <input v-model="isEnabled" type="checkbox" class="sr-only peer" />
            <div
              class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"
            ></div>
            <span
              class="ms-2 text-sm font-medium"
              :class="
                isEnabled
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-500 dark:text-slate-400'
              "
            >
              {{ isEnabled ? 'Aktif' : 'Pasif' }}
            </span>
          </label>
        </div>
      </div>
    </div>

    <!-- Content (only when enabled) -->
    <div v-if="isEnabled" class="p-4 space-y-6">
      <!-- Two Column Layout -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Left: Adult & Child Multipliers -->
        <div class="space-y-4">
          <!-- Adult Multipliers -->
          <div class="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
            <h5 class="font-medium text-blue-800 dark:text-blue-300 mb-3 flex items-center gap-2">
              <span class="material-icons text-sm">person</span>
              Yetişkin Çarpanları
            </h5>
            <div class="space-y-2">
              <div v-for="i in adultsRange" :key="'adult-' + i" class="flex items-center gap-3">
                <span class="w-20 text-sm text-gray-600 dark:text-slate-400">
                  {{ i }} Yetişkin
                </span>
                <input
                  type="number"
                  :value="getAdultMultiplier(i)"
                  step="0.1"
                  min="0"
                  class="w-24 px-3 py-1.5 text-center border rounded-lg text-sm font-medium"
                  :class="
                    i === baseOccupancy
                      ? 'border-green-400 bg-green-50 dark:bg-green-900/30 dark:border-green-600 text-green-700 dark:text-green-300'
                      : 'border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-800 dark:text-white'
                  "
                  @input="setAdultMultiplier(i, $event)"
                  @change="recalculateCombinations"
                />
                <span
                  v-if="i === baseOccupancy"
                  class="text-xs text-green-600 dark:text-green-400 font-medium"
                  >(Baz)</span
                >
                <span v-if="previewPrice" class="text-xs text-gray-500 dark:text-slate-400">
                  → {{ calculatePreviewPrice(getAdultMultiplier(i)) }}{{ currencySymbol }}
                </span>
              </div>
            </div>
          </div>

          <!-- Child Age Groups Warning -->
          <div
            v-if="maxChildren > 0 && childAgeGroups.length === 0"
            class="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4 border border-orange-200 dark:border-orange-800"
          >
            <div class="flex items-start gap-3">
              <span class="material-icons text-orange-500 text-xl">warning</span>
              <div>
                <h5 class="font-medium text-orange-800 dark:text-orange-300 mb-1">
                  Çocuk Yaş Grupları Tanımlı Değil
                </h5>
                <p class="text-sm text-orange-700 dark:text-orange-400">
                  Çocuk çarpanları için önce otel ayarlarından çocuk yaş gruplarını (bebek, 1. çocuk
                  tipi vb.) tanımlamanız gerekiyor.
                </p>
              </div>
            </div>
          </div>

          <!-- Child Multipliers -->
          <div
            v-if="maxChildren > 0 && childAgeGroups.length > 0"
            class="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4"
          >
            <h5 class="font-medium text-amber-800 dark:text-amber-300 mb-3 flex items-center gap-2">
              <span class="material-icons text-sm">child_care</span>
              Çocuk Çarpanları
              <span class="text-xs font-normal text-amber-600 dark:text-amber-400"
                >(Yaş grubuna göre)</span
              >
            </h5>

            <!-- Age Group Headers -->
            <div
              class="flex items-center gap-3 mb-2 pb-2 border-b border-amber-200 dark:border-amber-800"
            >
              <span class="w-20 text-xs text-gray-500 dark:text-slate-400"></span>
              <template v-for="ageGroup in childAgeGroups" :key="ageGroup.code">
                <div class="w-24 text-center">
                  <span class="text-xs font-medium text-amber-700 dark:text-amber-300">
                    {{ ageGroup.name?.tr || ageGroup.code }}
                  </span>
                  <div class="text-[10px] text-amber-600 dark:text-amber-400">
                    ({{ ageGroup.minAge }}-{{ ageGroup.maxAge }} yaş)
                  </div>
                </div>
              </template>
            </div>

            <!-- Child Order Rows -->
            <div class="space-y-2">
              <div
                v-for="childOrder in maxChildren"
                :key="'child-' + childOrder"
                class="flex items-center gap-3"
              >
                <span class="w-20 text-sm text-gray-600 dark:text-slate-400">
                  {{ childOrder }}. Çocuk
                </span>
                <template v-for="ageGroup in childAgeGroups" :key="ageGroup.code">
                  <input
                    type="number"
                    :value="getChildMultiplier(childOrder, ageGroup.code)"
                    step="0.1"
                    min="0"
                    class="w-24 px-3 py-1.5 text-center border border-gray-300 dark:border-slate-600 rounded-lg text-sm font-medium bg-white dark:bg-slate-800 text-gray-800 dark:text-white"
                    @input="setChildMultiplier(childOrder, ageGroup.code, $event)"
                    @change="recalculateCombinations"
                  />
                </template>
              </div>
            </div>

            <p class="mt-3 text-xs text-amber-600 dark:text-amber-400">
              <span class="material-icons text-xs align-middle">info</span>
              0 = Ücretsiz (çarpana etki etmez)
            </p>
          </div>

          <!-- Rounding Rule -->
          <div class="bg-gray-50 dark:bg-slate-800 rounded-xl p-4">
            <h5 class="font-medium text-gray-700 dark:text-slate-300 mb-3 flex items-center gap-2">
              <span class="material-icons text-sm">tune</span>
              Yuvarlama Kuralı
            </h5>
            <select
              v-model="roundingRule"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-800 dark:text-white text-sm"
            >
              <option value="none">Yuvarlama Yok</option>
              <option value="nearest">En Yakın Tam Sayı</option>
              <option value="up">Yukarı Yuvarla</option>
              <option value="down">Aşağı Yuvarla</option>
              <option value="nearest5">5'e Yuvarla</option>
              <option value="nearest10">10'a Yuvarla</option>
            </select>
          </div>

          <!-- Preview Price Input -->
          <div class="bg-green-50 dark:bg-green-900/20 rounded-xl p-4">
            <h5 class="font-medium text-green-700 dark:text-green-300 mb-3 flex items-center gap-2">
              <span class="material-icons text-sm">preview</span>
              Önizleme (ppDbl Fiyat)
            </h5>
            <div class="flex items-center gap-3">
              <input
                v-model.number="previewPrice"
                type="number"
                min="0"
                class="w-32 px-3 py-2 border border-green-300 dark:border-green-600 rounded-lg bg-white dark:bg-slate-800 text-gray-800 dark:text-white text-sm"
                placeholder="100"
              />
              <span class="text-sm text-gray-500 dark:text-slate-400"
                >{{ currencySymbol }} (Örnek baz fiyat)</span
              >
            </div>
          </div>
        </div>

        <!-- Right: Combination Table -->
        <div
          class="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden"
        >
          <div
            class="px-4 py-3 bg-gray-50 dark:bg-slate-700 border-b border-gray-200 dark:border-slate-600"
          >
            <div class="flex items-center justify-between">
              <h5 class="font-medium text-gray-800 dark:text-white flex items-center gap-2">
                <span class="material-icons text-sm">table_chart</span>
                Kombinasyon Tablosu
              </h5>
              <button
                type="button"
                class="px-3 py-1 text-xs bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900 transition-colors flex items-center gap-1"
                @click="regenerateCombinations"
              >
                <span class="material-icons text-xs">refresh</span>
                Yeniden Hesapla
              </button>
            </div>
          </div>

          <div class="max-h-[500px] overflow-y-auto">
            <table class="w-full text-sm">
              <thead class="sticky top-0 bg-gray-100 dark:bg-slate-700">
                <tr>
                  <th
                    class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-slate-400"
                  >
                    Kombinasyon
                  </th>
                  <th
                    class="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-slate-400 w-24"
                  >
                    Çarpan
                  </th>
                  <th
                    v-if="previewPrice"
                    class="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-slate-400 w-20"
                  >
                    Fiyat
                  </th>
                  <th
                    class="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-slate-400 w-16"
                  >
                    Aktif
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 dark:divide-slate-700">
                <tr
                  v-for="combo in combinationTable"
                  :key="combo.key"
                  class="hover:bg-gray-50 dark:hover:bg-slate-700/50"
                  :class="{ 'opacity-50': !combo.isActive }"
                >
                  <td class="px-3 py-2">
                    <span class="font-medium text-gray-800 dark:text-white">
                      {{ getCombinationName(combo) }}
                    </span>
                  </td>
                  <td class="px-3 py-2 text-center">
                    <input
                      type="number"
                      :value="getEffectiveMultiplier(combo)"
                      step="0.1"
                      min="0"
                      class="w-full px-2 py-1 text-center border rounded text-xs font-medium"
                      :class="
                        combo.overrideMultiplier !== null
                          ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 dark:border-indigo-600 text-indigo-700 dark:text-indigo-300'
                          : 'border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-800 dark:text-white'
                      "
                      @change="updateMultiplier(combo, $event)"
                    />
                  </td>
                  <td v-if="previewPrice" class="px-3 py-2 text-center">
                    <span class="text-green-600 dark:text-green-400 font-medium">
                      {{ calculatePreviewPrice(getEffectiveMultiplier(combo)) }}{{ currencySymbol }}
                    </span>
                  </td>
                  <td class="px-3 py-2 text-center">
                    <button
                      type="button"
                      class="w-6 h-6 rounded flex items-center justify-center transition-colors"
                      :class="
                        combo.isActive
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                      "
                      @click="combo.isActive = !combo.isActive"
                    >
                      <span class="material-icons text-sm">
                        {{ combo.isActive ? 'check' : 'close' }}
                      </span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Legend -->
          <div
            class="px-4 py-2 bg-gray-50 dark:bg-slate-700 border-t border-gray-200 dark:border-slate-600 text-xs text-gray-500 dark:text-slate-400"
          >
            <span class="inline-flex items-center gap-1 mr-4">
              <span class="w-3 h-3 rounded bg-indigo-200 dark:bg-indigo-800"></span>
              Override edilmiş
            </span>
            <span class="inline-flex items-center gap-1">
              <span class="w-3 h-3 rounded bg-red-200 dark:bg-red-800"></span>
              Satışa kapalı
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Disabled State -->
    <div v-else class="p-8 text-center">
      <div
        class="w-16 h-16 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-4"
      >
        <span class="material-icons text-3xl text-gray-400 dark:text-slate-500">calculate</span>
      </div>
      <h5 class="font-medium text-gray-600 dark:text-slate-400 mb-2">Çarpan Sistemi Pasif</h5>
      <p class="text-sm text-gray-500 dark:text-slate-500 max-w-md mx-auto">
        OBP fiyatlandırmada çarpan sistemini kullanmak için yukarıdaki toggle'ı aktif hale getirin.
        Çarpan sistemi, baz fiyat üzerinden tüm kombinasyonlar için otomatik fiyat hesaplaması
        sağlar.
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'

const props = defineProps({
  modelValue: { type: Object, default: null },
  occupancy: {
    type: Object,
    default: () => ({
      maxAdults: 2,
      maxChildren: 2,
      totalMaxGuests: 4,
      baseOccupancy: 2
    })
  },
  childAgeGroups: {
    type: Array,
    default: () => []
  },
  currency: {
    type: String,
    default: 'EUR'
  }
})

// Currency symbol mapping
const currencySymbol = computed(() => {
  const symbols = {
    TRY: '₺',
    USD: '$',
    EUR: '€',
    GBP: '£',
    RUB: '₽',
    SAR: '﷼',
    AED: 'د.إ',
    CHF: 'CHF',
    JPY: '¥',
    CNY: '¥'
  }
  return symbols[props.currency] || props.currency
})

const emit = defineEmits(['update:modelValue'])

// Local state
const isEnabled = ref(false)
const adultMultipliers = reactive({})
const childMultipliers = reactive({})
const combinationTable = ref([])
const roundingRule = ref('none')
const previewPrice = ref(100)
const isLoadingFromSaved = ref(false) // Flag to prevent regenerating when loading saved data

// Computed
const minAdults = computed(() => props.occupancy?.minAdults || 1)
const maxAdults = computed(() => props.occupancy?.maxAdults || 2)
const maxChildren = computed(() => props.occupancy?.maxChildren || 0)
const baseOccupancy = computed(() => props.occupancy?.baseOccupancy || 2)
const totalMaxGuests = computed(() => props.occupancy?.totalMaxGuests || 4)

// Adults range for iteration (minAdults to maxAdults)
const adultsRange = computed(() => {
  const range = []
  for (let i = minAdults.value; i <= maxAdults.value; i++) {
    range.push(i)
  }
  return range
})

// Initialize default adult multipliers
const initializeAdultMultipliers = () => {
  for (let i = minAdults.value; i <= maxAdults.value; i++) {
    if (adultMultipliers[i] === undefined) {
      if (i < baseOccupancy.value) {
        adultMultipliers[i] = Math.round((1 - (baseOccupancy.value - i) * 0.2) * 100) / 100
      } else if (i === baseOccupancy.value) {
        adultMultipliers[i] = 1.0
      } else {
        adultMultipliers[i] = Math.round((1 + (i - baseOccupancy.value) * 0.2) * 100) / 100
      }
    }
  }
}

// Safe getter for adult multiplier
const getAdultMultiplier = i => {
  if (adultMultipliers[i] === undefined) {
    // Initialize with default value
    if (i < baseOccupancy.value) {
      adultMultipliers[i] = Math.round((1 - (baseOccupancy.value - i) * 0.2) * 100) / 100
    } else if (i === baseOccupancy.value) {
      adultMultipliers[i] = 1.0
    } else {
      adultMultipliers[i] = Math.round((1 + (i - baseOccupancy.value) * 0.2) * 100) / 100
    }
  }
  return adultMultipliers[i]
}

// Safe setter for adult multiplier
const setAdultMultiplier = (i, event) => {
  const value = parseFloat(event.target.value) || 0
  adultMultipliers[i] = value
}

// Initialize default child multipliers
const initializeChildMultipliers = () => {
  for (let childOrder = 1; childOrder <= maxChildren.value; childOrder++) {
    if (!childMultipliers[childOrder]) {
      childMultipliers[childOrder] = {}
    }
    for (const ageGroup of props.childAgeGroups) {
      if (childMultipliers[childOrder][ageGroup.code] === undefined) {
        childMultipliers[childOrder][ageGroup.code] = 0
      }
    }
  }
}

// Safe getter for child multiplier
const getChildMultiplier = (childOrder, ageGroupCode) => {
  if (!childMultipliers[childOrder]) {
    childMultipliers[childOrder] = {}
  }
  if (childMultipliers[childOrder][ageGroupCode] === undefined) {
    childMultipliers[childOrder][ageGroupCode] = 0
  }
  return childMultipliers[childOrder][ageGroupCode]
}

// Safe setter for child multiplier
const setChildMultiplier = (childOrder, ageGroupCode, event) => {
  if (!childMultipliers[childOrder]) {
    childMultipliers[childOrder] = {}
  }
  const value = parseFloat(event.target.value) || 0
  childMultipliers[childOrder][ageGroupCode] = value
}

// Generate combination key
const generateCombinationKey = (adults, children = []) => {
  if (children.length === 0) {
    return adults.toString()
  }
  const childPart = children
    .sort((a, b) => a.order - b.order)
    .map(c => c.ageGroup)
    .join('_')
  return `${adults}+${children.length}_${childPart}`
}

// Get combination name for display
const getCombinationName = combo => {
  if (combo.children.length === 0) {
    if (combo.adults === 1) return 'Tek Kişilik'
    if (combo.adults === 2) return 'Çift Kişilik'
    return `${combo.adults} Yetişkin`
  }

  const childAgeRanges = combo.children
    .sort((a, b) => a.order - b.order)
    .map(c => {
      const ageGroup = props.childAgeGroups.find(ag => ag.code === c.ageGroup)
      if (ageGroup) {
        return `${ageGroup.minAge}-${ageGroup.maxAge}`
      }
      return c.ageGroup
    })

  return `${combo.adults}+${combo.children.length} (${childAgeRanges.join(', ')})`
}

// Calculate combination multiplier
const calculateCombinationMultiplier = (adults, children) => {
  let mult = adultMultipliers[adults] || 1

  for (const child of children) {
    const orderMults = childMultipliers[child.order]
    if (orderMults) {
      mult += orderMults[child.ageGroup] || 0
    }
  }

  return Math.round(mult * 100) / 100
}

// Generate child combinations (combinations with repetition, sorted by age)
// For 2 children with age groups [infant, first]:
// - (infant, infant), (infant, first), (first, first) = 3 combinations
// Order doesn't matter because children are always sorted by age when querying
const generateChildCombinations = (count, ageGroupCodes, startIdx = 0, currentChildren = []) => {
  if (currentChildren.length === count) {
    // Assign order numbers (1, 2, 3...) to children
    return [currentChildren.map((ageGroup, idx) => ({ order: idx + 1, ageGroup }))]
  }

  const combinations = []
  // Start from startIdx to avoid duplicates (only pick same or later age groups)
  for (let i = startIdx; i < ageGroupCodes.length; i++) {
    const newChildren = [...currentChildren, ageGroupCodes[i]]
    const subCombinations = generateChildCombinations(count, ageGroupCodes, i, newChildren)
    combinations.push(...subCombinations)
  }

  return combinations
}

// Generate all combinations
const generateCombinations = () => {
  const ageGroupCodes = props.childAgeGroups.map(ag => ag.code)
  const combinations = []

  // Start from minAdults instead of 1
  for (let adults = minAdults.value; adults <= maxAdults.value; adults++) {
    // Adults only
    combinations.push({
      key: generateCombinationKey(adults, []),
      adults,
      children: [],
      calculatedMultiplier: calculateCombinationMultiplier(adults, []),
      overrideMultiplier: null,
      isActive: true
    })

    // Adults + children (only if age groups are defined)
    if (ageGroupCodes.length > 0) {
      const remainingCapacity = totalMaxGuests.value - adults
      const maxChildrenForAdult = Math.min(maxChildren.value, remainingCapacity)

      for (let childCount = 1; childCount <= maxChildrenForAdult; childCount++) {
        const childCombinations = generateChildCombinations(childCount, ageGroupCodes)

        for (const children of childCombinations) {
          combinations.push({
            key: generateCombinationKey(adults, children),
            adults,
            children: [...children],
            calculatedMultiplier: calculateCombinationMultiplier(adults, children),
            overrideMultiplier: null,
            isActive: true
          })
        }
      }
    }
  }

  combinationTable.value = combinations
}

// Recalculate combinations (preserve overrides)
const recalculateCombinations = () => {
  combinationTable.value = combinationTable.value.map(combo => ({
    ...combo,
    calculatedMultiplier: calculateCombinationMultiplier(combo.adults, combo.children)
  }))
  emitUpdate()
}

// Regenerate combinations (reset overrides)
const regenerateCombinations = () => {
  generateCombinations()
  emitUpdate()
}

// Get effective multiplier
const getEffectiveMultiplier = combo => {
  if (combo.overrideMultiplier !== null && combo.overrideMultiplier !== undefined) {
    return combo.overrideMultiplier
  }
  return combo.calculatedMultiplier
}

// Update multiplier - only set override if value differs from calculated
const updateMultiplier = (combo, event) => {
  const value = event.target.value
  if (value === '' || value === null) {
    combo.overrideMultiplier = null
  } else {
    const newValue = parseFloat(value)
    // Only set as override if different from calculated
    if (Math.abs(newValue - combo.calculatedMultiplier) < 0.001) {
      combo.overrideMultiplier = null
    } else {
      combo.overrideMultiplier = newValue
    }
  }
  emitUpdate()
}

// Calculate preview price
const calculatePreviewPrice = multiplier => {
  if (!previewPrice.value) return '-'
  let price = previewPrice.value * multiplier

  switch (roundingRule.value) {
    case 'nearest':
      return Math.round(price)
    case 'up':
      return Math.ceil(price)
    case 'down':
      return Math.floor(price)
    case 'nearest5':
      return Math.round(price / 5) * 5
    case 'nearest10':
      return Math.round(price / 10) * 10
    default:
      return price.toFixed(2)
  }
}

// Emit update to parent
const emitUpdate = () => {
  if (!isEnabled.value) {
    emit('update:modelValue', null)
    return
  }

  emit('update:modelValue', {
    adultMultipliers: { ...adultMultipliers },
    childMultipliers: JSON.parse(JSON.stringify(childMultipliers)),
    combinationTable: combinationTable.value.map(c => ({ ...c, children: [...c.children] })),
    roundingRule: roundingRule.value
  })
}

// Watch for enable toggle
watch(isEnabled, newVal => {
  if (newVal && combinationTable.value.length === 0) {
    initializeAdultMultipliers()
    initializeChildMultipliers()
    generateCombinations()
  }
  emitUpdate()
})

// Watch for occupancy changes
watch(
  () => props.occupancy,
  (newVal, oldVal) => {
    // Don't regenerate if loading from saved data or if it's the initial load
    if (isLoadingFromSaved.value) return
    if (!isEnabled.value) return

    // Only regenerate if minAdults, maxAdults or baseOccupancy actually changed
    // (not just a new object reference)
    const minChanged = newVal?.minAdults !== oldVal?.minAdults
    const maxChanged = newVal?.maxAdults !== oldVal?.maxAdults
    const baseChanged = newVal?.baseOccupancy !== oldVal?.baseOccupancy
    const maxChildrenChanged = newVal?.maxChildren !== oldVal?.maxChildren
    const totalChanged = newVal?.totalMaxGuests !== oldVal?.totalMaxGuests

    if (minChanged || maxChanged || baseChanged || maxChildrenChanged || totalChanged) {
      initializeAdultMultipliers()
      initializeChildMultipliers()
      generateCombinations()
    }
  },
  { deep: true }
)

// Watch for childAgeGroups changes
watch(
  () => props.childAgeGroups,
  (newVal, oldVal) => {
    // Don't regenerate if loading from saved data
    if (isLoadingFromSaved.value) return
    if (!isEnabled.value) return

    // Only regenerate if the actual age groups changed (not just reference)
    const newCodes = (newVal || []).map(g => g.code).join(',')
    const oldCodes = (oldVal || []).map(g => g.code).join(',')

    if (newCodes !== oldCodes) {
      initializeChildMultipliers()
      generateCombinations()
    }
  },
  { deep: true }
)

// Watch for model value changes (from parent)
watch(
  () => props.modelValue,
  newVal => {
    if (newVal) {
      // Set flag to prevent regenerating combinations
      isLoadingFromSaved.value = true
      isEnabled.value = true

      // Load adult multipliers - convert string keys to numbers
      if (newVal.adultMultipliers) {
        Object.keys(newVal.adultMultipliers).forEach(key => {
          const numKey = parseInt(key, 10)
          adultMultipliers[numKey] = newVal.adultMultipliers[key]
        })
      }

      // Load child multipliers - convert string keys to numbers
      if (newVal.childMultipliers) {
        Object.keys(newVal.childMultipliers).forEach(order => {
          const numOrder = parseInt(order, 10)
          if (!childMultipliers[numOrder]) childMultipliers[numOrder] = {}
          Object.assign(childMultipliers[numOrder], newVal.childMultipliers[order])
        })
      }

      // Load combination table
      if (newVal.combinationTable && newVal.combinationTable.length > 0) {
        combinationTable.value = newVal.combinationTable.map(c => ({
          ...c,
          children: [...(c.children || [])]
        }))
      }

      // Load rounding rule
      if (newVal.roundingRule) {
        roundingRule.value = newVal.roundingRule
      }

      // Clear flag after next tick to allow future changes
      setTimeout(() => {
        isLoadingFromSaved.value = false
      }, 100)
    }
  },
  { immediate: true, deep: true }
)

// Initialize on mount
onMounted(() => {
  initializeAdultMultipliers()
  initializeChildMultipliers()
  if (props.modelValue || isEnabled.value) {
    if (combinationTable.value.length === 0) {
      generateCombinations()
    }
  }
})

// Expose for parent
defineExpose({
  isEnabled,
  getData: () =>
    isEnabled.value
      ? {
          adultMultipliers: { ...adultMultipliers },
          childMultipliers: JSON.parse(JSON.stringify(childMultipliers)),
          combinationTable: combinationTable.value,
          roundingRule: roundingRule.value
        }
      : null
})
</script>
