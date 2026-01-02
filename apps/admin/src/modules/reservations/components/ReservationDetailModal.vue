<template>
  <Modal
    v-model="show"
    :title="`Rezervasyon - ${reservation?.bookingNumber || ''}`"
    size="xl"
    @close="close"
  >
    <div v-if="reservation" class="space-y-6">
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
        <!-- Status & Source -->
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span
              class="px-3 py-1 rounded-full text-sm font-medium"
              :class="statusClasses"
            >
              {{ statusLabel }}
            </span>
            <span class="text-sm text-gray-500 dark:text-slate-400">
              {{ sourceLabel }}
            </span>
          </div>
          <span class="text-sm text-gray-500 dark:text-slate-400">
            Olusturulma: {{ formatDateTime(reservation.createdAt) }}
          </span>
        </div>

        <!-- Guest & Room Info -->
        <div class="grid grid-cols-2 gap-4">
          <div class="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
            <h4 class="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase mb-2">Misafir</h4>
            <p class="font-medium text-gray-900 dark:text-white">
              {{ reservation.leadGuest?.firstName }} {{ reservation.leadGuest?.lastName }}
            </p>
            <p class="text-sm text-gray-500 dark:text-slate-400">{{ reservation.contact?.phone }}</p>
            <p class="text-sm text-gray-500 dark:text-slate-400">{{ reservation.contact?.email }}</p>
            <p v-if="reservation.leadGuest?.nationality" class="text-sm text-gray-500 dark:text-slate-400">
              Uyruk: {{ reservation.leadGuest?.nationality }}
            </p>
          </div>
          <div class="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
            <h4 class="text-xs font-medium text-gray-500 dark:text-slate-400 uppercase mb-2">Konaklama</h4>
            <p class="font-medium text-gray-900 dark:text-white">
              {{ reservation.rooms?.[0]?.roomTypeName?.tr || reservation.rooms?.[0]?.roomTypeCode }}
            </p>
            <p class="text-sm text-gray-500 dark:text-slate-400">
              {{ reservation.rooms?.[0]?.mealPlanName?.tr || reservation.rooms?.[0]?.mealPlanCode }}
            </p>
            <p class="text-sm text-gray-500 dark:text-slate-400">
              {{ reservation.totalAdults }} yetiskin
              <span v-if="reservation.totalChildren">, {{ reservation.totalChildren }} cocuk</span>
            </p>
          </div>
        </div>

        <!-- Dates -->
        <div class="grid grid-cols-3 gap-4">
          <div class="text-center p-3 border border-gray-200 dark:border-slate-600 rounded-lg">
            <p class="text-xs text-gray-500 dark:text-slate-400">Giris</p>
            <p class="font-medium text-gray-900 dark:text-white">{{ formatDate(reservation.checkIn) }}</p>
          </div>
          <div class="text-center p-3 border border-gray-200 dark:border-slate-600 rounded-lg">
            <p class="text-xs text-gray-500 dark:text-slate-400">Cikis</p>
            <p class="font-medium text-gray-900 dark:text-white">{{ formatDate(reservation.checkOut) }}</p>
          </div>
          <div class="text-center p-3 border border-gray-200 dark:border-slate-600 rounded-lg">
            <p class="text-xs text-gray-500 dark:text-slate-400">Gece</p>
            <p class="font-medium text-gray-900 dark:text-white">{{ reservation.nights }}</p>
          </div>
        </div>

        <!-- Financial Summary -->
        <div class="border border-gray-200 dark:border-slate-600 rounded-lg p-4">
          <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Hesap Durumu</h4>
          <div class="grid grid-cols-4 gap-4 text-center">
            <div>
              <p class="text-xs text-gray-500 dark:text-slate-400">Toplam</p>
              <p class="font-bold text-gray-900 dark:text-white">{{ formatCurrency(reservation.pricing?.grandTotal) }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-500 dark:text-slate-400">Odenen</p>
              <p class="font-bold text-green-600">{{ formatCurrency(reservation.payment?.paidAmount) }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-500 dark:text-slate-400">Kalan</p>
              <p class="font-bold" :class="reservation.payment?.dueAmount > 0 ? 'text-red-600' : 'text-green-600'">
                {{ formatCurrency(reservation.payment?.dueAmount) }}
              </p>
            </div>
            <div>
              <p class="text-xs text-gray-500 dark:text-slate-400">Durum</p>
              <span
                class="px-2 py-0.5 rounded text-xs font-medium"
                :class="paymentStatusClasses"
              >
                {{ paymentStatusLabel }}
              </span>
            </div>
          </div>
        </div>

        <!-- Special Requests -->
        <div v-if="reservation.specialRequests" class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <h4 class="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase mb-2">Ozel Istekler</h4>
          <p class="text-sm text-blue-700 dark:text-blue-300">{{ reservation.specialRequests }}</p>
        </div>
      </div>

      <!-- Payments Tab -->
      <div v-if="activeTab === 'payments'" class="space-y-4">
        <!-- Add Payment Form -->
        <div class="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
          <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Odeme Ekle</h4>
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
                Odeme Ekle
              </button>
            </div>
          </div>
        </div>

        <!-- Payments List -->
        <div v-if="reservation.payment?.transactions?.length > 0" class="divide-y divide-gray-200 dark:divide-slate-700">
          <div
            v-for="(tx, index) in reservation.payment.transactions"
            :key="index"
            class="flex items-center justify-between py-3"
          >
            <div>
              <p class="text-gray-900 dark:text-white">
                {{ getPaymentMethodLabel(tx.method) || tx.type }}
              </p>
              <p class="text-xs text-gray-500 dark:text-slate-400">
                {{ formatDateTime(tx.date) }}
                <span v-if="tx.reference"> - {{ tx.reference }}</span>
              </p>
            </div>
            <span class="font-medium" :class="tx.type === 'refund' ? 'text-red-600' : 'text-green-600'">
              {{ tx.type === 'refund' ? '-' : '+' }}{{ formatCurrency(tx.amount) }}
            </span>
          </div>
        </div>
        <div v-else class="text-center py-8 text-gray-500 dark:text-slate-400">
          Henuz odeme yok
        </div>
      </div>

      <!-- Notes Tab -->
      <div v-if="activeTab === 'notes'" class="space-y-4">
        <!-- Add Note Form -->
        <div class="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
          <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Not Ekle</h4>
          <div class="flex gap-3">
            <textarea
              v-model="noteForm.content"
              rows="2"
              placeholder="Not ekleyin..."
              class="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-600 text-gray-900 dark:text-white text-sm"
            ></textarea>
            <button
              @click="addNote"
              :disabled="!noteForm.content"
              class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm self-end"
            >
              Ekle
            </button>
          </div>
        </div>

        <!-- Notes List -->
        <div v-if="reservation.notes?.length > 0" class="space-y-3">
          <div
            v-for="(note, index) in reservation.notes"
            :key="index"
            class="bg-gray-50 dark:bg-slate-700 rounded-lg p-3"
          >
            <p class="text-sm text-gray-900 dark:text-white">{{ note.content }}</p>
            <p class="text-xs text-gray-500 dark:text-slate-400 mt-1">
              {{ formatDateTime(note.createdAt) }}
            </p>
          </div>
        </div>
        <div v-else class="text-center py-8 text-gray-500 dark:text-slate-400">
          Henuz not yok
        </div>
      </div>

      <!-- History Tab -->
      <div v-if="activeTab === 'history'" class="space-y-4">
        <div v-if="reservation.modifications?.length > 0" class="space-y-3">
          <div
            v-for="(mod, index) in reservation.modifications"
            :key="index"
            class="flex items-start gap-3 py-3 border-b border-gray-100 dark:border-slate-700 last:border-0"
          >
            <div class="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
              <span class="material-icons text-sm text-gray-500">history</span>
            </div>
            <div class="flex-1">
              <p class="text-sm text-gray-900 dark:text-white">{{ mod.description }}</p>
              <p class="text-xs text-gray-500 dark:text-slate-400">{{ formatDateTime(mod.modifiedAt) }}</p>
            </div>
          </div>
        </div>
        <div v-else class="text-center py-8 text-gray-500 dark:text-slate-400">
          Degisiklik gecmisi yok
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-between w-full">
        <div class="flex items-center gap-2">
          <button
            v-if="reservation?.status === 'pending'"
            @click="confirmReservation"
            class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <span class="material-icons text-sm">check_circle</span>
            Onayla
          </button>
          <button
            v-if="reservation?.status === 'confirmed' && canCheckIn"
            @click="goToCheckIn"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <span class="material-icons text-sm">login</span>
            Check-in
          </button>
          <button
            v-if="['pending', 'confirmed'].includes(reservation?.status)"
            @click="markNoShow"
            class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg flex items-center gap-2"
          >
            <span class="material-icons text-sm">person_off</span>
            No-Show
          </button>
        </div>
        <button
          @click="close"
          class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg"
        >
          Kapat
        </button>
      </div>
    </template>
  </Modal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useToast } from 'vue-toastification'
import { useRouter } from 'vue-router'
import Modal from '@/components/common/Modal.vue'
import reservationService, {
  RESERVATION_STATUS_INFO,
  PAYMENT_STATUS_INFO,
  PAYMENT_METHODS,
  BOOKING_SOURCES
} from '@/services/pms/reservationService'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  hotelId: {
    type: String,
    default: ''
  },
  reservation: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'updated'])

const router = useRouter()
const toast = useToast()
const activeTab = ref('overview')

const paymentMethods = PAYMENT_METHODS

const paymentForm = ref({
  amount: null,
  method: 'cash',
  reference: ''
})

const noteForm = ref({
  content: ''
})

const show = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const tabs = [
  { key: 'overview', label: 'Genel Bakis' },
  { key: 'payments', label: 'Odemeler' },
  { key: 'notes', label: 'Notlar' },
  { key: 'history', label: 'Gecmis' }
]

const statusLabel = computed(() => {
  return RESERVATION_STATUS_INFO[props.reservation?.status]?.label || props.reservation?.status
})

const statusClasses = computed(() => {
  const info = RESERVATION_STATUS_INFO[props.reservation?.status]
  if (!info) return 'bg-gray-100 text-gray-800'
  return `${info.bgColor} ${info.textColor} ${info.darkBgColor} ${info.darkTextColor}`
})

const paymentStatusLabel = computed(() => {
  return PAYMENT_STATUS_INFO[props.reservation?.payment?.status]?.label || props.reservation?.payment?.status
})

const paymentStatusClasses = computed(() => {
  const info = PAYMENT_STATUS_INFO[props.reservation?.payment?.status]
  if (!info) return 'bg-gray-100 text-gray-800'
  return `${info.bgColor} ${info.textColor}`
})

const sourceLabel = computed(() => {
  const source = props.reservation?.source?.type
  return BOOKING_SOURCES[source]?.label || source || 'Bilinmiyor'
})

const canCheckIn = computed(() => {
  if (!props.reservation) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const checkIn = new Date(props.reservation.checkIn)
  checkIn.setHours(0, 0, 0, 0)
  return checkIn <= today
})

const getPaymentMethodLabel = (method) => {
  return PAYMENT_METHODS.find(m => m.value === method)?.label || method
}

const confirmReservation = async () => {
  try {
    const response = await reservationService.confirm(props.hotelId, props.reservation._id)
    toast.success('Rezervasyon onaylandi')
    emit('updated', response.data)
    close()
  } catch (error) {
    toast.error(error.response?.data?.message || 'Onaylama basarisiz')
  }
}

const markNoShow = async () => {
  try {
    const response = await reservationService.markNoShow(props.hotelId, props.reservation._id)
    toast.success('No-show olarak isaretlendi')
    emit('updated', response.data)
    close()
  } catch (error) {
    toast.error(error.response?.data?.message || 'Islem basarisiz')
  }
}

const addPayment = async () => {
  if (!paymentForm.value.amount) return

  try {
    const response = await reservationService.addPayment(props.hotelId, props.reservation._id, paymentForm.value)
    toast.success('Odeme eklendi')
    paymentForm.value = { amount: null, method: 'cash', reference: '' }
    // Emit with updated reservation data so parent can update local state
    emit('updated', response.data)
  } catch (error) {
    toast.error(error.response?.data?.message || 'Odeme eklenemedi')
  }
}

const addNote = async () => {
  if (!noteForm.value.content) return

  try {
    const response = await reservationService.addNote(props.hotelId, props.reservation._id, noteForm.value)
    toast.success('Not eklendi')
    noteForm.value = { content: '' }
    // Emit with updated reservation data so parent can update local state
    emit('updated', response.data)
  } catch (error) {
    toast.error(error.response?.data?.message || 'Not eklenemedi')
  }
}

const goToCheckIn = () => {
  close()
  router.push({ name: 'pms-frontdesk', query: { booking: props.reservation._id } })
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
    year: 'numeric',
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
    paymentForm.value = { amount: null, method: 'cash', reference: '' }
    noteForm.value = { content: '' }
  }
})
</script>
