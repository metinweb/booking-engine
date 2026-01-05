<template>
  <Modal v-model="show" title="Rezervasyon Iptal" size="md" @close="close">
    <div v-if="reservation" class="space-y-6">
      <!-- Reservation Summary -->
      <div class="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
        <div class="flex items-start justify-between">
          <div>
            <h4 class="font-medium text-gray-900 dark:text-white">
              {{ reservation.leadGuest?.firstName }} {{ reservation.leadGuest?.lastName }}
            </h4>
            <p class="text-sm text-gray-500 dark:text-slate-400 mt-1">
              {{ reservation.bookingNumber }}
            </p>
          </div>
          <div class="text-right">
            <p class="text-sm text-gray-600 dark:text-slate-300">
              {{ formatDate(reservation.checkIn) }} - {{ formatDate(reservation.checkOut) }}
            </p>
            <p class="text-xs text-gray-500 dark:text-slate-400">{{ reservation.nights }} gece</p>
          </div>
        </div>
      </div>

      <!-- Cancellation Form -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Iptal Nedeni *
        </label>
        <textarea
          v-model="form.reason"
          rows="3"
          placeholder="Iptal nedenini yazin..."
          class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
          required
        ></textarea>
      </div>

      <!-- Refund Amount -->
      <div v-if="reservation.payment?.paidAmount > 0">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Iade Tutari
        </label>
        <div class="flex items-center gap-4">
          <input
            v-model.number="form.refundAmount"
            type="number"
            min="0"
            :max="reservation.payment.paidAmount"
            step="0.01"
            class="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
          />
          <span class="text-sm text-gray-500 dark:text-slate-400">
            / {{ formatCurrency(reservation.payment.paidAmount) }}
          </span>
        </div>
        <p class="text-xs text-gray-500 dark:text-slate-400 mt-1">
          Odenenmis tutardan iade edilecek miktar
        </p>
      </div>

      <!-- Warning -->
      <div class="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
        <div class="flex items-start gap-3">
          <span class="material-icons text-red-600 dark:text-red-400">warning</span>
          <div>
            <p class="text-sm font-medium text-red-700 dark:text-red-300">Dikkat!</p>
            <p class="text-sm text-red-600 dark:text-red-400">
              Rezervasyon iptal edildiginde geri alinmamz. Bu islem kayit altina alinacaktir.
            </p>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <button
        class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg"
        :disabled="loading"
        @click="close"
      >
        Vazgec
      </button>
      <button
        class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
        :disabled="loading || !form.reason"
        @click="submit"
      >
        <span v-if="loading" class="animate-spin material-icons text-sm">refresh</span>
        <span v-else class="material-icons text-sm">cancel</span>
        Iptal Et
      </button>
    </template>
  </Modal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useToast } from 'vue-toastification'
import Modal from '@/components/common/Modal.vue'
import reservationService from '@/services/pms/reservationService'

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

const emit = defineEmits(['update:modelValue', 'cancelled'])

const toast = useToast()
const loading = ref(false)

const form = ref({
  reason: '',
  refundAmount: 0
})

const show = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val)
})

const submit = async () => {
  if (!form.value.reason) return

  loading.value = true
  try {
    await reservationService.cancel(props.hotelId, props.reservation._id, form.value)
    toast.success('Rezervasyon iptal edildi')
    emit('cancelled')
    close()
  } catch (error) {
    toast.error(error.response?.data?.message || 'Iptal yapilamadi')
  } finally {
    loading.value = false
  }
}

const formatDate = date => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

const formatCurrency = amount => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY'
  }).format(amount || 0)
}

const close = () => {
  show.value = false
  form.value = { reason: '', refundAmount: 0 }
}

watch(
  () => props.modelValue,
  val => {
    if (val) {
      form.value = { reason: '', refundAmount: 0 }
    }
  }
)
</script>
