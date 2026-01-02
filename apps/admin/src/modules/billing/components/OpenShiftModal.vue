<template>
  <Modal
    v-model="show"
    :title="$t('pms.cashier.openShift')"
    size="lg"
    @close="close"
  >
    <div class="space-y-4">
      <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div class="flex items-center gap-2">
          <span class="material-icons text-blue-600 dark:text-blue-400">info</span>
          <p class="text-sm text-blue-800 dark:text-blue-200">
            {{ $t('pms.cashier.openShiftInfo') }}
          </p>
        </div>
      </div>

      <!-- Multi-Currency Toggle -->
      <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
        <div class="flex items-center gap-2">
          <span class="material-icons text-indigo-600 dark:text-indigo-400">currency_exchange</span>
          <div>
            <p class="font-medium text-gray-900 dark:text-white">{{ $t('pms.currency.multiCurrency') }}</p>
            <p class="text-xs text-gray-500 dark:text-slate-400">{{ $t('pms.currency.multiCurrencyHint') }}</p>
          </div>
        </div>
        <label class="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" v-model="useMultiCurrency" class="sr-only peer">
          <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-500 peer-checked:bg-indigo-600"></div>
        </label>
      </div>

      <!-- Single Currency Mode -->
      <div v-if="!useMultiCurrency">
        <label class="block text-sm text-gray-500 dark:text-slate-400 mb-1">
          {{ $t('pms.cashier.openingCash') }} *
        </label>
        <div class="relative">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">₺</span>
          <input
            v-model.number="form.openingCash"
            type="number"
            min="0"
            step="0.01"
            class="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            placeholder="0.00"
          />
        </div>
        <p class="text-xs text-gray-400 mt-1">{{ $t('pms.cashier.openingCashHint') }}</p>
      </div>

      <!-- Multi-Currency Mode -->
      <div v-else>
        <MultiCurrencyOpeningForm
          v-model:currencies="form.activeCurrencies"
          v-model:balances="form.openingBalances"
          :availableCurrencies="availableCurrencies"
          :exchangeRates="exchangeRates"
        />
      </div>

      <div>
        <label class="block text-sm text-gray-500 dark:text-slate-400 mb-1">
          {{ $t('pms.cashier.registerId') }}
        </label>
        <input
          v-model="form.registerId"
          type="text"
          class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
          placeholder="MAIN"
        />
      </div>

      <div>
        <label class="block text-sm text-gray-500 dark:text-slate-400 mb-1">
          {{ $t('pms.cashier.notes') }}
        </label>
        <textarea
          v-model="form.notes"
          rows="2"
          class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
          :placeholder="$t('pms.cashier.shiftNotesPlaceholder')"
        ></textarea>
      </div>
    </div>

    <template #footer>
      <button
        @click="close"
        class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg"
        :disabled="loading"
      >
        {{ $t('common.cancel') }}
      </button>
      <button
        @click="submit"
        class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
        :disabled="loading"
      >
        <span v-if="loading" class="animate-spin material-icons text-sm">refresh</span>
        <span class="material-icons text-sm" v-else>login</span>
        {{ $t('pms.cashier.openShift') }}
      </button>
    </template>
  </Modal>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import { useI18n } from 'vue-i18n'
import Modal from '@/components/common/Modal.vue'
import MultiCurrencyOpeningForm from './MultiCurrencyOpeningForm.vue'
import cashierService from '@/services/pms/cashierService'

const { t } = useI18n()

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  hotelId: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'opened'])

const toast = useToast()
const loading = ref(false)
const useMultiCurrency = ref(false)

// Currency data
const availableCurrencies = ref(['TRY', 'USD', 'EUR', 'GBP'])
const exchangeRates = ref({})

const show = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const defaultForm = () => ({
  openingCash: 0,
  registerId: 'MAIN',
  notes: '',
  activeCurrencies: ['TRY'],
  openingBalances: [{ currency: 'TRY', cash: 0, card: 0, other: 0 }]
})

const form = ref(defaultForm())

const fetchCurrencies = async () => {
  if (!props.hotelId) return
  try {
    const response = await cashierService.getCurrencies(props.hotelId)
    if (response.data) {
      availableCurrencies.value = response.data.availableCurrencies || ['TRY', 'USD', 'EUR', 'GBP']
      exchangeRates.value = response.data.exchangeRates || {}
    }
  } catch (error) {
    console.error('Currency fetch error:', error)
  }
}

const submit = async () => {
  loading.value = true
  try {
    const submitData = {
      registerId: form.value.registerId,
      notes: form.value.notes
    }

    if (useMultiCurrency.value) {
      submitData.activeCurrencies = form.value.activeCurrencies
      submitData.openingBalances = form.value.openingBalances
    } else {
      // Single currency mode - convert to multi-currency format for backend compatibility
      submitData.openingCash = form.value.openingCash
      submitData.activeCurrencies = ['TRY']
      submitData.openingBalances = [{
        currency: 'TRY',
        cash: form.value.openingCash,
        card: 0,
        other: 0
      }]
    }

    await cashierService.openShift(props.hotelId, submitData)
    toast.success(t('pms.cashier.shiftOpened'))
    emit('opened')
    close()
  } catch (error) {
    toast.error(error.response?.data?.message || t('pms.cashier.shiftOpenError'))
  } finally {
    loading.value = false
  }
}

const close = () => {
  show.value = false
  form.value = defaultForm()
  useMultiCurrency.value = false
}

watch(() => props.modelValue, (val) => {
  if (val) {
    form.value = defaultForm()
    fetchCurrencies()
  }
})

onMounted(() => {
  if (props.hotelId) {
    fetchCurrencies()
  }
})
</script>
