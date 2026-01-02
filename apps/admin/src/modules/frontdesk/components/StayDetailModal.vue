<template>
  <Modal
    v-model="show"
    :title="`Konaklama - ${stay?.stayNumber || ''}`"
    size="xl"
    @close="close"
  >
    <div v-if="stay" class="space-y-6">
      <!-- Tabs -->
      <div class="border-b border-gray-200 dark:border-slate-700">
        <nav class="flex -mb-px">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            @click="activeTab = tab.key"
            class="px-4 py-2 text-sm font-medium border-b-2 transition-colors"
            :class="activeTab === tab.key
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-gray-500 dark:text-gray-400'"
          >
            {{ tab.label }}
          </button>
        </nav>
      </div>

      <!-- Overview Tab -->
      <div v-if="activeTab === 'overview'" class="space-y-4">
        <!-- Guest & Room Info -->
        <div class="grid grid-cols-2 gap-4">
          <div class="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
            <h4 class="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase mb-2">Misafir</h4>
            <p class="font-medium text-gray-900 dark:text-white">
              {{ stay.guests?.[0]?.firstName }} {{ stay.guests?.[0]?.lastName }}
            </p>
            <p class="text-sm text-gray-500 dark:text-slate-400">{{ stay.guests?.[0]?.phone }}</p>
            <p class="text-sm text-gray-500 dark:text-slate-400">{{ stay.guests?.[0]?.email }}</p>
          </div>
          <div class="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
            <h4 class="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase mb-2">Oda</h4>
            <p class="font-medium text-gray-900 dark:text-white">Oda {{ stay.room?.roomNumber }}</p>
            <p class="text-sm text-gray-500 dark:text-slate-400">{{ stay.roomType?.name?.tr || stay.roomType?.code }}</p>
            <p class="text-sm text-gray-500 dark:text-slate-400">Kat {{ stay.room?.floor }}</p>
          </div>
        </div>

        <!-- Dates -->
        <div class="grid grid-cols-3 gap-4">
          <div class="text-center p-3 border border-gray-200 dark:border-slate-600 rounded-lg">
            <p class="text-xs text-gray-500 dark:text-slate-400">Giris</p>
            <p class="font-medium text-gray-900 dark:text-white">{{ formatDate(stay.checkInDate) }}</p>
          </div>
          <div class="text-center p-3 border border-gray-200 dark:border-slate-600 rounded-lg">
            <p class="text-xs text-gray-500 dark:text-slate-400">Cikis</p>
            <p class="font-medium text-gray-900 dark:text-white">{{ formatDate(stay.checkOutDate) }}</p>
          </div>
          <div class="text-center p-3 border border-gray-200 dark:border-slate-600 rounded-lg">
            <p class="text-xs text-gray-500 dark:text-slate-400">Gece</p>
            <p class="font-medium text-gray-900 dark:text-white">{{ stay.nights }}</p>
          </div>
        </div>

        <!-- Financial Summary -->
        <div class="border border-gray-200 dark:border-slate-600 rounded-lg p-4">
          <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Hesap Durumu</h4>
          <div class="grid grid-cols-4 gap-4 text-center">
            <div>
              <p class="text-xs text-gray-500 dark:text-slate-400">Toplam</p>
              <p class="font-bold text-gray-900 dark:text-white">{{ formatCurrency(stay.totalAmount) }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-500 dark:text-slate-400">Odenen</p>
              <p class="font-bold text-green-600">{{ formatCurrency(stay.paidAmount) }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-500 dark:text-slate-400">Bakiye</p>
              <p class="font-bold" :class="stay.balance > 0 ? 'text-red-600' : 'text-green-600'">
                {{ formatCurrency(stay.balance) }}
              </p>
            </div>
            <div>
              <p class="text-xs text-gray-500 dark:text-slate-400">Durum</p>
              <span
                class="px-2 py-0.5 rounded text-xs font-medium"
                :class="paymentStatusInfo?.bgColor + ' ' + paymentStatusInfo?.textColor"
              >
                {{ paymentStatusInfo?.label }}
              </span>
            </div>
          </div>
        </div>

        <!-- Notes -->
        <div v-if="stay.specialRequests || stay.internalNotes">
          <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notlar</h4>
          <div v-if="stay.specialRequests" class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 mb-2">
            <p class="text-xs text-blue-600 dark:text-blue-400 mb-1">Misafir Istekleri</p>
            <p class="text-sm text-blue-700 dark:text-blue-300">{{ stay.specialRequests }}</p>
          </div>
          <div v-if="stay.internalNotes" class="bg-gray-50 dark:bg-slate-700 rounded-lg p-3">
            <p class="text-xs text-gray-500 dark:text-slate-400 mb-1">Dahili Notlar</p>
            <p class="text-sm text-gray-700 dark:text-gray-300">{{ stay.internalNotes }}</p>
          </div>
        </div>
      </div>

      <!-- Extras Tab -->
      <div v-if="activeTab === 'extras'" class="space-y-4">
        <!-- Add Extra Form -->
        <div class="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
          <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Ekstra Ekle</h4>
          <div class="grid grid-cols-4 gap-3">
            <div class="col-span-2">
              <input
                v-model="extraForm.description"
                type="text"
                placeholder="Aciklama"
                class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-600 text-gray-900 dark:text-white text-sm"
              />
            </div>
            <div>
              <input
                v-model.number="extraForm.amount"
                type="number"
                placeholder="Tutar"
                min="0"
                step="0.01"
                class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-600 text-gray-900 dark:text-white text-sm"
              />
            </div>
            <div>
              <button
                @click="addExtra"
                :disabled="!extraForm.description || !extraForm.amount"
                class="w-full px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm"
              >
                Ekle
              </button>
            </div>
          </div>
        </div>

        <!-- Extras List -->
        <div v-if="stay.extras?.length > 0" class="divide-y divide-gray-200 dark:divide-slate-700">
          <div
            v-for="(extra, index) in stay.extras"
            :key="index"
            class="flex items-center justify-between py-3"
          >
            <div>
              <p class="text-gray-900 dark:text-white">{{ extra.description }}</p>
              <p class="text-xs text-gray-500 dark:text-slate-400">
                {{ formatDateTime(extra.date) }}
                <span v-if="extra.quantity > 1"> - x{{ extra.quantity }}</span>
              </p>
            </div>
            <span class="font-medium text-gray-900 dark:text-white">
              {{ formatCurrency(extra.amount * (extra.quantity || 1)) }}
            </span>
          </div>
        </div>
        <div v-else class="text-center py-8 text-gray-500 dark:text-slate-400">
          Henuz ekstra yok
        </div>
      </div>

      <!-- Payments Tab -->
      <div v-if="activeTab === 'payments'" class="space-y-4">
        <!-- Add Payment Form -->
        <div class="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
          <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Odeme Al</h4>
          <div class="grid grid-cols-4 gap-3">
            <div>
              <input
                v-model.number="paymentForm.amount"
                type="number"
                placeholder="Tutar"
                min="0"
                step="0.01"
                class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-600 text-gray-900 dark:text-white text-sm"
              />
            </div>
            <div>
              <select
                v-model="paymentForm.method"
                class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-600 text-gray-900 dark:text-white text-sm"
              >
                <option v-for="m in paymentMethods" :key="m.value" :value="m.value">
                  {{ m.label }}
                </option>
              </select>
            </div>
            <div>
              <input
                v-model="paymentForm.reference"
                type="text"
                placeholder="Referans (opsiyonel)"
                class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-600 text-gray-900 dark:text-white text-sm"
              />
            </div>
            <div>
              <button
                @click="addPayment"
                :disabled="!paymentForm.amount"
                class="w-full px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm"
              >
                Odeme Al
              </button>
            </div>
          </div>
        </div>

        <!-- Payments List -->
        <div v-if="stay.payments?.length > 0" class="divide-y divide-gray-200 dark:divide-slate-700">
          <div
            v-for="(payment, index) in stay.payments"
            :key="index"
            class="flex items-center justify-between py-3"
          >
            <div>
              <p class="text-gray-900 dark:text-white">
                {{ paymentMethods.find(m => m.value === payment.method)?.label || payment.method }}
              </p>
              <p class="text-xs text-gray-500 dark:text-slate-400">
                {{ formatDateTime(payment.date) }}
                <span v-if="payment.reference"> - {{ payment.reference }}</span>
              </p>
            </div>
            <span class="font-medium text-green-600">
              {{ formatCurrency(payment.amount) }}
            </span>
          </div>
        </div>
        <div v-else class="text-center py-8 text-gray-500 dark:text-slate-400">
          Henuz odeme yok
        </div>
      </div>
    </div>

    <template #footer>
      <button
        @click="close"
        class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg"
      >
        Kapat
      </button>
    </template>
  </Modal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useToast } from 'vue-toastification'
import Modal from '@/components/common/Modal.vue'
import stayService, { PAYMENT_METHODS, PAYMENT_STATUS_INFO } from '@/services/pms/stayService'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  hotelId: {
    type: String,
    default: ''
  },
  stay: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'updated'])

const toast = useToast()
const activeTab = ref('overview')

const paymentMethods = PAYMENT_METHODS

const extraForm = ref({
  description: '',
  amount: null,
  category: 'other'
})

const paymentForm = ref({
  amount: null,
  method: 'cash',
  reference: ''
})

const show = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const tabs = [
  { key: 'overview', label: 'Genel Bakis' },
  { key: 'extras', label: 'Ekstralar' },
  { key: 'payments', label: 'Odemeler' }
]

const paymentStatusInfo = computed(() => {
  if (!props.stay?.paymentStatus) return null
  return PAYMENT_STATUS_INFO[props.stay.paymentStatus]
})

const addExtra = async () => {
  if (!extraForm.value.description || !extraForm.value.amount) return

  try {
    await stayService.addExtra(props.hotelId, props.stay._id, extraForm.value)
    toast.success('Ekstra eklendi')
    extraForm.value = { description: '', amount: null, category: 'other' }
    emit('updated')
  } catch (error) {
    toast.error(error.response?.data?.message || 'Ekstra eklenemedi')
  }
}

const addPayment = async () => {
  if (!paymentForm.value.amount) return

  try {
    await stayService.addPayment(props.hotelId, props.stay._id, paymentForm.value)
    toast.success('Odeme alindi')
    paymentForm.value = { amount: null, method: 'cash', reference: '' }
    emit('updated')
  } catch (error) {
    toast.error(error.response?.data?.message || 'Odeme alinamadi')
  }
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

const formatDateTime = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY'
  }).format(amount || 0)
}

const close = () => {
  show.value = false
  activeTab.value = 'overview'
}

watch(() => props.modelValue, (val) => {
  if (val) {
    activeTab.value = 'overview'
    extraForm.value = { description: '', amount: null, category: 'other' }
    paymentForm.value = { amount: null, method: 'cash', reference: '' }
  }
})
</script>
