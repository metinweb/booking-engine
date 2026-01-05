<template>
  <Modal v-model="show" title="Yeni Islem" size="lg" @close="close">
    <div class="space-y-6">
      <!-- Quick Charge Buttons -->
      <div>
        <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-2">Hizli Islemler</h4>
        <div class="grid grid-cols-4 gap-2">
          <button
            v-for="item in quickChargeItems"
            :key="item.description"
            class="p-3 border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50 text-center transition-colors"
            :class="{
              'ring-2 ring-indigo-500 bg-indigo-50 dark:bg-indigo-900/20':
                form.type === item.type && form.description === item.description
            }"
            @click="selectQuickCharge(item)"
          >
            <span class="material-icons text-gray-600 dark:text-gray-400 block mb-1">{{
              item.icon
            }}</span>
            <span class="text-xs text-gray-700 dark:text-gray-300">{{ item.description }}</span>
          </button>
        </div>
      </div>

      <hr class="border-gray-200 dark:border-slate-700" />

      <!-- Transaction Type -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm text-gray-500 dark:text-slate-400 mb-1">Islem Tipi *</label>
          <select
            v-model="form.type"
            class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Secin...</option>
            <optgroup label="Gelirler">
              <option value="room_charge">Oda Ucreti</option>
              <option value="extra_charge">Ekstra Ucret</option>
              <option value="restaurant">Restoran</option>
              <option value="bar">Bar</option>
              <option value="minibar">Minibar</option>
              <option value="spa">Spa</option>
              <option value="laundry">Camasir</option>
              <option value="parking">Otopark</option>
              <option value="phone">Telefon</option>
              <option value="other_income">Diger Gelir</option>
            </optgroup>
            <optgroup label="Odemeler">
              <option value="payment">Odeme</option>
              <option value="deposit">Depozit</option>
              <option value="advance">On Odeme</option>
            </optgroup>
            <optgroup label="Giderler">
              <option value="expense">Gider</option>
              <option value="payout">Odeme Cikisi</option>
            </optgroup>
          </select>
        </div>
        <div>
          <label class="block text-sm text-gray-500 dark:text-slate-400 mb-1"
            >Odeme Yontemi *</label
          >
          <select
            v-model="form.paymentMethod"
            class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
          >
            <option value="cash">Nakit</option>
            <option value="credit_card">Kredi Karti</option>
            <option value="debit_card">Banka Karti</option>
            <option value="bank_transfer">Havale/EFT</option>
            <option value="room_charge">Oda Hesabina</option>
            <option value="city_ledger">Cari Hesap</option>
            <option value="voucher">Kupon/Voucher</option>
            <option value="online">Online</option>
            <option value="other">Diger</option>
          </select>
        </div>
      </div>

      <!-- Description -->
      <div>
        <label class="block text-sm text-gray-500 dark:text-slate-400 mb-1">Aciklama *</label>
        <input
          v-model="form.description"
          type="text"
          class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
          placeholder="Islem aciklamasi..."
        />
      </div>

      <!-- Amount -->
      <div class="grid grid-cols-4 gap-4">
        <div>
          <label class="block text-sm text-gray-500 dark:text-slate-400 mb-1">Para Birimi *</label>
          <select
            v-model="form.currency"
            class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
          >
            <option v-for="curr in availableCurrencies" :key="curr" :value="curr">
              {{ getCurrencySymbol(curr) }} {{ curr }}
            </option>
          </select>
        </div>
        <div>
          <label class="block text-sm text-gray-500 dark:text-slate-400 mb-1">Adet</label>
          <input
            v-model.number="form.quantity"
            type="number"
            min="1"
            class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label class="block text-sm text-gray-500 dark:text-slate-400 mb-1">Birim Fiyat *</label>
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">{{
              getCurrencySymbol(form.currency)
            }}</span>
            <input
              v-model.number="form.unitPrice"
              type="number"
              min="0"
              step="0.01"
              class="w-full pl-12 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              placeholder="0.00"
            />
          </div>
        </div>
        <div>
          <label class="block text-sm text-gray-500 dark:text-slate-400 mb-1">Toplam Tutar</label>
          <div class="px-4 py-2 bg-gray-100 dark:bg-slate-700 rounded-lg">
            <p class="text-lg font-bold text-gray-900 dark:text-white">
              {{ getCurrencySymbol(form.currency) }}{{ formatAmount(totalAmount) }}
            </p>
          </div>
        </div>
      </div>

      <!-- TRY Equivalent (for foreign currencies) -->
      <div
        v-if="form.currency !== 'TRY' && exchangeRates[form.currency]"
        class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3"
      >
        <div class="flex items-center justify-between">
          <span class="text-sm text-blue-700 dark:text-blue-300">
            <span class="material-icons text-sm align-middle mr-1">currency_exchange</span>
            TRY Karsiligi (Kur: {{ exchangeRates[form.currency] }})
          </span>
          <span class="font-medium text-blue-800 dark:text-blue-200">
            ₺{{ formatAmount(totalAmount * exchangeRates[form.currency]) }}
          </span>
        </div>
      </div>

      <!-- Reference & Notes -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm text-gray-500 dark:text-slate-400 mb-1">Referans No</label>
          <input
            v-model="form.reference"
            type="text"
            class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            placeholder="Fatura no, fis no vb."
          />
        </div>
        <div>
          <label class="block text-sm text-gray-500 dark:text-slate-400 mb-1">Notlar</label>
          <input
            v-model="form.notes"
            type="text"
            class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            placeholder="Ek notlar..."
          />
        </div>
      </div>
    </div>

    <template #footer>
      <button
        class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg"
        :disabled="loading"
        @click="close"
      >
        Iptal
      </button>
      <button
        class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
        :disabled="loading || !isValid"
        @click="submit"
      >
        <span v-if="loading" class="animate-spin material-icons text-sm">refresh</span>
        <span v-else class="material-icons text-sm">add_card</span>
        Islem Kaydet
      </button>
    </template>
  </Modal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useToast } from 'vue-toastification'
import Modal from '@/components/common/Modal.vue'
import cashierService, { QUICK_CHARGE_ITEMS } from '@/services/pms/cashierService'

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

const emit = defineEmits(['update:modelValue', 'created'])

const toast = useToast()
const loading = ref(false)

const quickChargeItems = QUICK_CHARGE_ITEMS

// Currency data
const availableCurrencies = ref(['TRY'])
const exchangeRates = ref({})

const currencySymbols = {
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

const getCurrencySymbol = currency => currencySymbols[currency] || currency

const formatAmount = amount => {
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount || 0)
}

const fetchCurrencies = async () => {
  if (!props.hotelId) return
  try {
    const response = await cashierService.getCurrencies(props.hotelId)
    if (response.data) {
      availableCurrencies.value = response.data.availableCurrencies || ['TRY']
      exchangeRates.value = response.data.exchangeRates || {}
    }
  } catch (error) {
    console.error('Currency fetch error:', error)
    availableCurrencies.value = ['TRY']
  }
}

const show = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val)
})

const defaultForm = () => ({
  type: '',
  description: '',
  paymentMethod: 'cash',
  currency: 'TRY',
  quantity: 1,
  unitPrice: 0,
  reference: '',
  notes: ''
})

const form = ref(defaultForm())

const totalAmount = computed(() => {
  return (form.value.quantity || 1) * (form.value.unitPrice || 0)
})

const isValid = computed(() => {
  return form.value.type && form.value.description && form.value.unitPrice > 0
})

const selectQuickCharge = item => {
  form.value.type = item.type
  form.value.description = item.description
  if (item.amount > 0) {
    form.value.unitPrice = item.amount
  }
}

const submit = async () => {
  if (!isValid.value) return

  loading.value = true
  try {
    const data = {
      ...form.value,
      amount: totalAmount.value
    }

    // Calculate TRY equivalent for foreign currencies
    if (form.value.currency !== 'TRY' && exchangeRates.value[form.value.currency]) {
      data.amountInTRY = totalAmount.value * exchangeRates.value[form.value.currency]
      data.exchangeRate = exchangeRates.value[form.value.currency]
    }

    await cashierService.createTransaction(props.hotelId, data)
    toast.success('Islem kaydedildi')
    emit('created')
    close()
  } catch (error) {
    toast.error(error.response?.data?.message || 'Islem kaydedilemedi')
  } finally {
    loading.value = false
  }
}

const close = () => {
  show.value = false
  form.value = defaultForm()
}

watch(
  () => props.modelValue,
  val => {
    if (val) {
      form.value = defaultForm()
      fetchCurrencies()
    }
  }
)

// Set default currency to first available
watch(availableCurrencies, currencies => {
  if (currencies.length > 0 && !currencies.includes(form.value.currency)) {
    form.value.currency = currencies[0]
  }
})
</script>
