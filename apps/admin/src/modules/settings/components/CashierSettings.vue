<template>
  <div class="space-y-6">
    <div>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Kasa Ayarlari</h3>
      <p class="text-sm text-gray-500 dark:text-slate-400">
        Vardiya, para birimi ve odeme yontemi ayarlari
      </p>
    </div>

    <!-- Active Currencies -->
    <div
      class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
    >
      <div class="flex items-center gap-2 mb-4">
        <span class="material-icons text-blue-600 dark:text-blue-400">currency_exchange</span>
        <h4 class="font-medium text-gray-900 dark:text-white">Aktif Para Birimleri</h4>
      </div>
      <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Kasada kullanilacak para birimlerini secin. En az bir para birimi secili olmalidir.
      </p>
      <div class="flex flex-wrap gap-2">
        <label
          v-for="curr in availableCurrencies"
          :key="curr.code"
          class="flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all"
          :class="
            isCurrencyActive(curr.code)
              ? 'bg-indigo-100 dark:bg-indigo-900/30 border-indigo-500 text-indigo-800 dark:text-indigo-300'
              : 'bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:border-indigo-300'
          "
        >
          <input
            type="checkbox"
            :checked="isCurrencyActive(curr.code)"
            class="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            @change="toggleCurrency(curr.code)"
          />
          <span class="text-lg">{{ curr.symbol }}</span>
          <span class="font-medium">{{ curr.code }}</span>
          <span class="text-xs text-gray-500 dark:text-gray-400">{{ curr.name }}</span>
        </label>
      </div>
      <p class="text-xs text-gray-500 dark:text-slate-400 mt-3">
        <span class="material-icons text-xs align-middle">info</span>
        Secili para birimleri vardiya acilisinda ve odeme islemlerinde kullanilabilir olacaktir.
      </p>
    </div>

    <!-- Shift Settings -->
    <div class="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
      <h4 class="font-medium text-gray-900 dark:text-white mb-4">Vardiya Ayarlari</h4>
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <p class="font-medium text-gray-900 dark:text-white">Vardiya Zorunlu</p>
            <p class="text-sm text-gray-500 dark:text-slate-400">
              Islem yapmak icin acik vardiya gerekir
            </p>
          </div>
          <label class="relative inline-flex items-center cursor-pointer">
            <input
              v-model="localSettings.requireShift"
              type="checkbox"
              class="sr-only peer"
              @change="emitChange"
            />
            <div
              class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"
            ></div>
          </label>
        </div>

        <div class="grid md:grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-slate-600">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Otomatik Vardiya Kapanma Saati
            </label>
            <input
              v-model="localSettings.autoCloseShiftTime"
              type="time"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              @change="emitChange"
            />
            <p class="text-xs text-gray-500 dark:text-slate-400 mt-1">
              Bos birakilirsa otomatik kapanmaz
            </p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Kasa Fark Toleransi
            </label>
            <div class="flex items-center gap-2">
              <input
                v-model.number="localSettings.cashDiscrepancyTolerance"
                type="number"
                min="0"
                class="w-32 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                @input="emitChange"
              />
              <span class="text-gray-500 dark:text-slate-400">TL</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Receipt Settings -->
    <div class="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
      <h4 class="font-medium text-gray-900 dark:text-white mb-4">Fis Ayarlari</h4>
      <div class="grid md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Fis Prefix
          </label>
          <input
            v-model="localSettings.receiptPrefix"
            type="text"
            placeholder="RCP"
            class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            @input="emitChange"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Son Fis No
          </label>
          <input
            v-model.number="localSettings.lastReceiptNumber"
            type="number"
            min="0"
            class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            @input="emitChange"
          />
        </div>
      </div>
    </div>

    <!-- Payment Methods -->
    <div class="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
      <div class="flex items-center justify-between mb-4">
        <h4 class="font-medium text-gray-900 dark:text-white">Odeme Yontemleri</h4>
        <button
          class="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-1"
          @click="addPaymentMethod"
        >
          <span class="material-icons text-sm">add</span>
          Yeni Yontem
        </button>
      </div>

      <div class="space-y-2">
        <div
          v-for="(method, index) in localSettings.paymentMethods"
          :key="method._id || index"
          class="bg-white dark:bg-slate-800 rounded-lg p-3 border border-gray-200 dark:border-slate-600 flex items-center gap-3"
        >
          <input
            v-model="method.code"
            type="text"
            placeholder="Kod"
            class="w-24 px-2 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            @input="emitChange"
          />
          <input
            v-model="method.name"
            type="text"
            placeholder="Yontem Adi"
            class="flex-1 px-2 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            @input="emitChange"
          />
          <label class="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
            <input
              v-model="method.isCash"
              type="checkbox"
              class="w-3 h-3 text-indigo-600 border-gray-300 rounded"
              @change="emitChange"
            />
            Nakit
          </label>
          <label class="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
            <input
              v-model="method.requireReference"
              type="checkbox"
              class="w-3 h-3 text-indigo-600 border-gray-300 rounded"
              @change="emitChange"
            />
            Referans
          </label>
          <label class="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
            <input
              v-model="method.isActive"
              type="checkbox"
              class="w-3 h-3 text-indigo-600 border-gray-300 rounded"
              @change="emitChange"
            />
            Aktif
          </label>
          <button
            class="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
            @click="removePaymentMethod(index)"
          >
            <span class="material-icons text-sm">delete</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Transaction Categories -->
    <div class="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
      <div class="flex items-center justify-between mb-4">
        <h4 class="font-medium text-gray-900 dark:text-white">Islem Kategorileri</h4>
        <button
          class="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-1"
          @click="addTransactionCategory"
        >
          <span class="material-icons text-sm">add</span>
          Yeni Kategori
        </button>
      </div>

      <div class="space-y-2">
        <div
          v-for="(cat, index) in localSettings.transactionCategories"
          :key="cat._id || index"
          class="bg-white dark:bg-slate-800 rounded-lg p-3 border border-gray-200 dark:border-slate-600 flex items-center gap-3"
        >
          <input
            v-model="cat.code"
            type="text"
            placeholder="Kod"
            class="w-24 px-2 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            @input="emitChange"
          />
          <input
            v-model="cat.name"
            type="text"
            placeholder="Kategori Adi"
            class="flex-1 px-2 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            @input="emitChange"
          />
          <select
            v-model="cat.type"
            class="w-24 px-2 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            @change="emitChange"
          >
            <option value="income">Gelir</option>
            <option value="expense">Gider</option>
          </select>
          <label class="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
            <input
              v-model="cat.isActive"
              type="checkbox"
              class="w-3 h-3 text-indigo-600 border-gray-300 rounded"
              @change="emitChange"
            />
            Aktif
          </label>
          <button
            class="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
            @click="removeTransactionCategory(index)"
          >
            <span class="material-icons text-sm">delete</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:modelValue', 'change'])

// Available currencies for selection
const availableCurrencies = [
  { code: 'TRY', symbol: '₺', name: 'Türk Lirası' },
  { code: 'USD', symbol: '$', name: 'ABD Doları' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'İngiliz Sterlini' },
  { code: 'CHF', symbol: 'CHF', name: 'İsviçre Frangı' },
  { code: 'SAR', symbol: 'SR', name: 'Suudi Riyali' },
  { code: 'AED', symbol: 'AED', name: 'BAE Dirhemi' },
  { code: 'RUB', symbol: '₽', name: 'Rus Rublesi' },
  { code: 'JPY', symbol: '¥', name: 'Japon Yeni' },
  { code: 'CNY', symbol: '¥', name: 'Çin Yuanı' }
]

const localSettings = ref({
  requireShift: true,
  autoCloseShiftTime: '',
  cashDiscrepancyTolerance: 0,
  receiptPrefix: 'RCP',
  lastReceiptNumber: 0,
  activeCurrencies: ['TRY'],
  paymentMethods: [],
  transactionCategories: [],
  ...props.modelValue
})

// Currency methods
const isCurrencyActive = code => {
  return localSettings.value.activeCurrencies?.includes(code) || false
}

const toggleCurrency = code => {
  if (!localSettings.value.activeCurrencies) {
    localSettings.value.activeCurrencies = ['TRY']
  }

  const index = localSettings.value.activeCurrencies.indexOf(code)
  if (index > -1) {
    // Don't allow removing the last currency
    if (localSettings.value.activeCurrencies.length > 1) {
      localSettings.value.activeCurrencies.splice(index, 1)
    }
  } else {
    localSettings.value.activeCurrencies.push(code)
  }
  emitChange()
}

watch(
  () => props.modelValue,
  newVal => {
    localSettings.value = { ...localSettings.value, ...newVal }
  },
  { deep: true }
)

const emitChange = () => {
  emit('update:modelValue', localSettings.value)
  emit('change')
}

const addPaymentMethod = () => {
  if (!localSettings.value.paymentMethods) {
    localSettings.value.paymentMethods = []
  }
  localSettings.value.paymentMethods.push({
    code: '',
    name: '',
    isActive: true,
    isCash: false,
    requireReference: false,
    order: localSettings.value.paymentMethods.length
  })
  emitChange()
}

const removePaymentMethod = index => {
  localSettings.value.paymentMethods.splice(index, 1)
  emitChange()
}

const addTransactionCategory = () => {
  if (!localSettings.value.transactionCategories) {
    localSettings.value.transactionCategories = []
  }
  localSettings.value.transactionCategories.push({
    code: '',
    name: '',
    type: 'income',
    isActive: true
  })
  emitChange()
}

const removeTransactionCategory = index => {
  localSettings.value.transactionCategories.splice(index, 1)
  emitChange()
}
</script>
