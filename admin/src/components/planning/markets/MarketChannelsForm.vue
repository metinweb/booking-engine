<template>
  <div class="space-y-8">
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

          <!-- B2C Markup -->
          <div v-if="formData.salesChannels.b2c" class="mt-4 pt-4 border-t border-green-200 dark:border-green-800">
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

          <!-- B2B Settings -->
          <div v-if="formData.salesChannels.b2b" class="mt-4 pt-4 border-t border-blue-200 dark:border-blue-800 space-y-4">
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
                {{ $t('planning.markets.agencyCommissionHint') }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Commission Summary -->
    <div class="p-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
      <h4 class="font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
        <span class="material-icons text-purple-600">calculate</span>
        {{ $t('planning.markets.pricingSummary') }}
      </h4>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div v-if="formData.salesChannels.b2c" class="flex items-center gap-4">
          <div class="w-10 h-10 rounded-lg bg-green-500 text-white flex items-center justify-center">
            <span class="material-icons text-sm">person</span>
          </div>
          <div>
            <p class="text-sm text-gray-600 dark:text-slate-400">{{ $t('planning.markets.b2cFinalPrice') }}</p>
            <p class="text-lg font-bold text-gray-800 dark:text-white">
              {{ $t('planning.markets.basePrice') }} + {{ formData.markup.b2c }}%
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
              {{ $t('planning.markets.basePrice') }} + {{ formData.markup.b2b }}% - {{ formData.agencyCommission }}%
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  market: { type: Object, required: true },
  saving: { type: Boolean, default: false }
})

const formData = ref({
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

// Sync with props
watch(() => props.market, (newVal) => {
  if (newVal) {
    formData.value = {
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

const getFormData = () => {
  return {
    salesChannels: formData.value.salesChannels,
    agencyCommission: formData.value.agencyCommission,
    markup: formData.value.markup
  }
}

defineExpose({ getFormData })
</script>
