<template>
  <div class="space-y-8">
    <!-- Working Mode Section (Net/Commission) -->
    <div class="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800">
      <div class="flex items-center gap-2 mb-3">
        <span class="material-icons text-indigo-500">settings</span>
        <label class="text-sm font-medium text-gray-700 dark:text-slate-300">{{ $t('planning.markets.workingMode') }}</label>
      </div>
      <p class="text-xs text-gray-500 dark:text-slate-400 mb-4">{{ $t('planning.markets.workingModeDesc') }}</p>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <!-- Net Option -->
        <label
          class="relative flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all"
          :class="formData.workingMode === 'net'
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
            : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500 bg-white dark:bg-slate-800'"
        >
          <input type="radio" v-model="formData.workingMode" value="net" class="sr-only" />
          <div class="w-10 h-10 rounded-lg flex items-center justify-center"
               :class="formData.workingMode === 'net' ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-slate-600 text-gray-500'">
            <span class="material-icons">monetization_on</span>
          </div>
          <div class="flex-1">
            <p class="font-semibold text-gray-800 dark:text-white">{{ $t('planning.markets.workingModes.net') }}</p>
            <p class="text-xs text-gray-500 dark:text-slate-400">{{ $t('planning.markets.workingModes.netDesc') }}</p>
          </div>
          <span v-if="formData.workingMode === 'net'" class="material-icons text-blue-500">check_circle</span>
        </label>

        <!-- Commission Option -->
        <label
          class="relative flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all"
          :class="formData.workingMode === 'commission'
            ? 'border-green-500 bg-green-50 dark:bg-green-900/30'
            : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500 bg-white dark:bg-slate-800'"
        >
          <input type="radio" v-model="formData.workingMode" value="commission" class="sr-only" />
          <div class="w-10 h-10 rounded-lg flex items-center justify-center"
               :class="formData.workingMode === 'commission' ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-slate-600 text-gray-500'">
            <span class="material-icons">percent</span>
          </div>
          <div class="flex-1">
            <p class="font-semibold text-gray-800 dark:text-white">{{ $t('planning.markets.workingModes.commission') }}</p>
            <p class="text-xs text-gray-500 dark:text-slate-400">{{ $t('planning.markets.workingModes.commissionDesc') }}</p>
          </div>
          <span v-if="formData.workingMode === 'commission'" class="material-icons text-green-500">check_circle</span>
        </label>
      </div>

      <!-- Commission Rate (only when commission mode is selected) -->
      <div v-if="formData.workingMode === 'commission'" class="mt-4 p-4 bg-green-100 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-800">
        <div class="flex items-center gap-2 mb-3">
          <span class="material-icons text-green-600 text-sm">percent</span>
          <label class="text-sm font-medium text-gray-700 dark:text-slate-300">{{ $t('planning.markets.commissionRate') }}</label>
        </div>
        <div class="flex items-center gap-3">
          <input
            v-model.number="formData.commissionRate"
            type="number"
            min="0"
            max="100"
            step="0.5"
            class="form-input w-24 text-center"
          />
          <span class="text-gray-500 font-medium">%</span>
          <span class="text-xs text-gray-500 dark:text-slate-400">{{ $t('planning.markets.commissionRateHint') }}</span>
        </div>
      </div>
    </div>

    <!-- Sales Channels Section -->
    <div>
      <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
        <span class="material-icons text-purple-600">storefront</span>
        {{ $t('planning.markets.salesChannels') }}
      </h3>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- B2C Channel -->
        <div
          class="p-6 rounded-xl border-2 transition-all cursor-pointer"
          :class="formData.salesChannels.b2c
            ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
            : 'border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800'"
          @click="formData.salesChannels.b2c = !formData.salesChannels.b2c"
        >
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-3">
              <div
                class="w-12 h-12 rounded-xl flex items-center justify-center"
                :class="formData.salesChannels.b2c ? 'bg-green-500 text-white' : 'bg-gray-200 dark:bg-slate-600 text-gray-500 dark:text-slate-400'"
              >
                <span class="material-icons">person</span>
              </div>
              <div>
                <h4 class="font-semibold text-gray-800 dark:text-white">B2C</h4>
                <p class="text-sm text-gray-500 dark:text-slate-400">{{ $t('planning.markets.b2cDescription') }}</p>
              </div>
            </div>
            <div class="relative">
              <input
                type="checkbox"
                v-model="formData.salesChannels.b2c"
                class="sr-only"
              />
              <div
                class="w-11 h-6 rounded-full transition-colors"
                :class="formData.salesChannels.b2c ? 'bg-green-500' : 'bg-gray-300 dark:bg-slate-600'"
              >
                <div
                  class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
                  :class="{ 'translate-x-5': formData.salesChannels.b2c }"
                ></div>
              </div>
            </div>
          </div>

          <!-- B2C Settings based on working mode -->
          <div v-if="formData.salesChannels.b2c" class="mt-4 pt-4 border-t border-green-200 dark:border-green-800">
            <!-- NET Mode: B2C Markup -->
            <template v-if="workingMode === 'net'">
              <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                {{ $t('planning.markets.b2cMarkup') }}
              </label>
              <div class="flex items-center gap-2">
                <input
                  v-model.number="formData.markup.b2c"
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  class="form-input w-24"
                  @click.stop
                />
                <span class="text-gray-500 dark:text-slate-400">%</span>
              </div>
              <p class="text-xs text-gray-500 dark:text-slate-500 mt-1">
                {{ $t('planning.markets.b2cMarkupHint') }}
              </p>
            </template>

            <!-- COMMISSION Mode: Markup + Total Earning -->
            <template v-else>
              <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                {{ $t('planning.markets.b2cExtraMarkup') }}
                <span class="text-xs text-gray-400 font-normal ml-1">({{ $t('common.optional') }})</span>
              </label>
              <div class="flex items-center gap-2">
                <input
                  v-model.number="formData.markup.b2c"
                  type="number"
                  min="0"
                  max="50"
                  step="0.5"
                  class="form-input w-24"
                  @click.stop
                />
                <span class="text-gray-500 dark:text-slate-400">%</span>
              </div>
              <p class="text-xs text-gray-500 dark:text-slate-500 mt-1">
                {{ $t('planning.markets.b2cExtraMarkupHint') }}
              </p>
              <!-- Partner Total Earning -->
              <div class="mt-3 p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <div class="flex items-center justify-between">
                  <span class="text-sm text-green-700 dark:text-green-300">{{ $t('planning.markets.partnerEarns') }}:</span>
                  <span class="text-lg font-bold text-green-700 dark:text-green-300">
                    %{{ calculateTotalB2CCommission }}
                  </span>
                </div>
              </div>
            </template>
          </div>
        </div>

        <!-- B2B Channel -->
        <div
          class="p-6 rounded-xl border-2 transition-all cursor-pointer"
          :class="formData.salesChannels.b2b
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800'"
          @click="formData.salesChannels.b2b = !formData.salesChannels.b2b"
        >
          <div class="flex items-start justify-between">
            <div class="flex items-center gap-3">
              <div
                class="w-12 h-12 rounded-xl flex items-center justify-center"
                :class="formData.salesChannels.b2b ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-slate-600 text-gray-500 dark:text-slate-400'"
              >
                <span class="material-icons">business</span>
              </div>
              <div>
                <h4 class="font-semibold text-gray-800 dark:text-white">B2B</h4>
                <p class="text-sm text-gray-500 dark:text-slate-400">{{ $t('planning.markets.b2bDescription') }}</p>
              </div>
            </div>
            <div class="relative">
              <input
                type="checkbox"
                v-model="formData.salesChannels.b2b"
                class="sr-only"
              />
              <div
                class="w-11 h-6 rounded-full transition-colors"
                :class="formData.salesChannels.b2b ? 'bg-blue-500' : 'bg-gray-300 dark:bg-slate-600'"
              >
                <div
                  class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
                  :class="{ 'translate-x-5': formData.salesChannels.b2b }"
                ></div>
              </div>
            </div>
          </div>

          <!-- B2B Settings based on working mode -->
          <div v-if="formData.salesChannels.b2b" class="mt-4 pt-4 border-t border-blue-200 dark:border-blue-800 space-y-4">
            <!-- NET Mode: B2B Markup + Agency Commission -->
            <template v-if="workingMode === 'net'">
              <!-- B2B Markup -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  {{ $t('planning.markets.b2bMarkup') }}
                </label>
                <div class="flex items-center gap-2">
                  <input
                    v-model.number="formData.markup.b2b"
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    class="form-input w-24"
                    @click.stop
                  />
                  <span class="text-gray-500 dark:text-slate-400">%</span>
                </div>
                <p class="text-xs text-gray-500 dark:text-slate-500 mt-1">
                  {{ $t('planning.markets.b2bMarkupHintNet') }}
                </p>
              </div>

              <!-- Agency Commission -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  {{ $t('planning.markets.agencyCommission') }}
                </label>
                <div class="flex items-center gap-2">
                  <input
                    v-model.number="formData.agencyCommission"
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    class="form-input w-24"
                    @click.stop
                  />
                  <span class="text-gray-500 dark:text-slate-400">%</span>
                </div>
                <p class="text-xs text-gray-500 dark:text-slate-500 mt-1">
                  {{ $t('planning.markets.agencyCommissionHintNet') }}
                </p>
              </div>
            </template>

            <!-- COMMISSION Mode: Agency Commission (shared from our commission) -->
            <template v-else>
              <div class="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <p class="text-sm text-blue-700 dark:text-blue-300">
                  {{ $t('planning.markets.commissionModeB2BInfo', { rate: hotelCommissionRate }) }}
                </p>
              </div>

              <!-- Agency Commission (from our hotel commission) -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  {{ $t('planning.markets.agencyCommissionShare') }}
                </label>
                <div class="flex items-center gap-2">
                  <input
                    v-model.number="formData.agencyCommission"
                    type="number"
                    min="0"
                    :max="hotelCommissionRate"
                    step="0.5"
                    class="form-input w-24"
                    @click.stop
                  />
                  <span class="text-gray-500 dark:text-slate-400">%</span>
                </div>
                <p class="text-xs text-gray-500 dark:text-slate-500 mt-1">
                  {{ $t('planning.markets.agencyCommissionHintCommission', {
                    agency: formData.agencyCommission,
                    platform: Math.max(0, hotelCommissionRate - formData.agencyCommission).toFixed(1)
                  }) }}
                </p>
              </div>

              <!-- Visual breakdown -->
              <div class="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
                <p class="text-xs font-medium text-gray-600 dark:text-slate-400 mb-2">{{ $t('planning.markets.commissionBreakdown') }}</p>
                <div class="flex items-center gap-2">
                  <div class="flex-1 h-4 bg-gray-200 dark:bg-slate-600 rounded-full overflow-hidden flex">
                    <div
                      class="h-full bg-blue-500 transition-all"
                      :style="{ width: (formData.agencyCommission / hotelCommissionRate * 100) + '%' }"
                    ></div>
                    <div
                      class="h-full bg-purple-500 transition-all"
                      :style="{ width: ((hotelCommissionRate - formData.agencyCommission) / hotelCommissionRate * 100) + '%' }"
                    ></div>
                  </div>
                </div>
                <div class="flex justify-between text-xs mt-1">
                  <span class="text-blue-600 dark:text-blue-400">{{ $t('planning.markets.agency') }}: %{{ formData.agencyCommission }}</span>
                  <span class="text-purple-600 dark:text-purple-400">{{ $t('planning.markets.platform') }}: %{{ Math.max(0, hotelCommissionRate - formData.agencyCommission).toFixed(1) }}</span>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- Pricing Summary -->
    <div class="p-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
      <h4 class="font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
        <span class="material-icons text-purple-600">calculate</span>
        {{ $t('planning.markets.pricingSummary') }}
      </h4>

      <!-- NET Mode Summary -->
      <template v-if="workingMode === 'net'">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div v-if="formData.salesChannels.b2c" class="flex items-center gap-4">
            <div class="w-10 h-10 rounded-lg bg-green-500 text-white flex items-center justify-center">
              <span class="material-icons text-sm">person</span>
            </div>
            <div>
              <p class="text-sm text-gray-600 dark:text-slate-400">{{ $t('planning.markets.b2cFinalPrice') }}</p>
              <p class="text-lg font-bold text-gray-800 dark:text-white">
                {{ $t('planning.markets.netPrice') }} + {{ formData.markup.b2c }}%
              </p>
            </div>
          </div>
          <div v-if="formData.salesChannels.b2b" class="flex items-center gap-4">
            <div class="w-10 h-10 rounded-lg bg-blue-500 text-white flex items-center justify-center">
              <span class="material-icons text-sm">business</span>
            </div>
            <div>
              <p class="text-sm text-gray-600 dark:text-slate-400">{{ $t('planning.markets.b2bFinalPrice') }}</p>
              <p class="text-lg font-bold text-gray-800 dark:text-white">
                {{ $t('planning.markets.netPrice') }} + {{ formData.markup.b2b }}%
              </p>
              <p class="text-xs text-gray-500 dark:text-slate-500">
                {{ $t('planning.markets.agencyEarns') }}: {{ formData.agencyCommission }}%
              </p>
            </div>
          </div>
        </div>
      </template>

      <!-- COMMISSION Mode Summary -->
      <template v-else>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div v-if="formData.salesChannels.b2c" class="flex items-center gap-4">
            <div class="w-10 h-10 rounded-lg bg-green-500 text-white flex items-center justify-center">
              <span class="material-icons text-sm">person</span>
            </div>
            <div>
              <p class="text-sm text-gray-600 dark:text-slate-400">{{ $t('planning.markets.b2cFinalPrice') }}</p>
              <p class="text-lg font-bold text-gray-800 dark:text-white">
                {{ $t('planning.markets.retailPrice') }}
                <span v-if="formData.markup.b2c > 0"> + {{ formData.markup.b2c }}%</span>
              </p>
              <p class="text-xs text-green-600 dark:text-green-400">
                {{ $t('planning.markets.partnerEarns') }}: %{{ calculateTotalB2CCommission }}
              </p>
            </div>
          </div>
          <div v-if="formData.salesChannels.b2b" class="flex items-center gap-4">
            <div class="w-10 h-10 rounded-lg bg-blue-500 text-white flex items-center justify-center">
              <span class="material-icons text-sm">business</span>
            </div>
            <div>
              <p class="text-sm text-gray-600 dark:text-slate-400">{{ $t('planning.markets.b2bFinalPrice') }}</p>
              <p class="text-lg font-bold text-gray-800 dark:text-white">
                {{ $t('planning.markets.retailPrice') }}
              </p>
              <p class="text-xs text-gray-500 dark:text-slate-500">
                {{ $t('planning.markets.agencyEarns') }}: {{ formData.agencyCommission }}% ·
                {{ $t('planning.markets.partnerEarns') }}: {{ Math.max(0, hotelCommissionRate - formData.agencyCommission).toFixed(1) }}%
              </p>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'

const props = defineProps({
  market: { type: Object, required: true },
  saving: { type: Boolean, default: false }
})

const emit = defineEmits(['update:workingMode', 'update:commissionRate'])

const formData = ref({
  workingMode: 'net',
  commissionRate: 10,
  salesChannels: {
    b2c: true,
    b2b: true
  },
  agencyCommission: 10,
  markup: {
    b2c: 0,
    b2b: 0
  }
})

// Computed for template usage
const workingMode = computed(() => formData.value.workingMode)
const hotelCommissionRate = computed(() => formData.value.commissionRate)

// Calculate total B2C commission for Partner (cumulative: commission + markup)
// Formula: (1 + commission/100) * (1 + markup/100) - 1
const calculateTotalB2CCommission = computed(() => {
  const commission = formData.value.commissionRate / 100
  const markup = formData.value.markup.b2c / 100
  const total = ((1 + commission) * (1 + markup) - 1) * 100
  return total.toFixed(1)
})

// Sync with props
watch(() => props.market, (newVal) => {
  if (newVal) {
    formData.value = {
      workingMode: newVal.workingMode || 'net',
      commissionRate: newVal.commissionRate ?? 10,
      salesChannels: {
        b2c: newVal.salesChannels?.b2c ?? true,
        b2b: newVal.salesChannels?.b2b ?? true
      },
      agencyCommission: newVal.agencyCommission ?? 10,
      markup: {
        b2c: newVal.markup?.b2c ?? 0,
        b2b: newVal.markup?.b2b ?? 0
      }
    }
  }
}, { immediate: true, deep: true })

// Emit working mode changes to parent
watch(() => formData.value.workingMode, (newVal) => {
  emit('update:workingMode', newVal)
}, { immediate: true })

watch(() => formData.value.commissionRate, (newVal) => {
  emit('update:commissionRate', newVal)
}, { immediate: true })

// Ensure agency commission doesn't exceed hotel commission in commission mode
watch([() => formData.value.commissionRate, () => formData.value.workingMode], ([rate, mode]) => {
  if (mode === 'commission' && formData.value.agencyCommission > rate) {
    formData.value.agencyCommission = rate
  }
})

const getFormData = () => {
  return {
    workingMode: formData.value.workingMode,
    commissionRate: formData.value.workingMode === 'commission' ? formData.value.commissionRate : null,
    salesChannels: formData.value.salesChannels,
    agencyCommission: formData.value.agencyCommission,
    markup: formData.value.markup
  }
}

defineExpose({ getFormData })
</script>
