<template>
  <Modal
    v-model="show"
    title="Check-out"
    size="lg"
    @close="close"
  >
    <div v-if="stay" class="space-y-6">
      <!-- Stay Summary -->
      <div class="bg-gray-50 dark:bg-slate-700 rounded-lg p-4">
        <div class="flex items-start justify-between">
          <div>
            <h4 class="font-medium text-gray-900 dark:text-white">
              {{ stay.guests?.[0]?.firstName }} {{ stay.guests?.[0]?.lastName }}
            </h4>
            <p class="text-sm text-gray-500 dark:text-slate-400 mt-1">
              Oda {{ stay.room?.roomNumber }} - {{ stay.stayNumber }}
            </p>
          </div>
          <div class="text-right">
            <p class="text-sm text-gray-600 dark:text-slate-300">
              {{ formatDate(stay.checkInDate) }} - {{ formatDate(stay.checkOutDate) }}
            </p>
            <p class="text-xs text-gray-500 dark:text-slate-400">{{ stay.nights }} gece</p>
          </div>
        </div>
      </div>

      <!-- Financial Summary -->
      <div class="border border-gray-200 dark:border-slate-600 rounded-lg overflow-hidden">
        <div class="bg-gray-50 dark:bg-slate-700 px-4 py-2">
          <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300">Hesap Ozeti</h4>
        </div>
        <div class="p-4 space-y-2">
          <div class="flex justify-between text-sm">
            <span class="text-gray-600 dark:text-slate-400">Oda Ucreti</span>
            <span class="text-gray-900 dark:text-white">{{ formatCurrency(stay.roomRate) }}</span>
          </div>
          <div v-if="extrasTotal > 0" class="flex justify-between text-sm">
            <span class="text-gray-600 dark:text-slate-400">Ekstralar</span>
            <span class="text-gray-900 dark:text-white">{{ formatCurrency(extrasTotal) }}</span>
          </div>
          <div class="border-t border-gray-200 dark:border-slate-600 pt-2 flex justify-between">
            <span class="font-medium text-gray-900 dark:text-white">Toplam</span>
            <span class="font-medium text-gray-900 dark:text-white">{{ formatCurrency(stay.totalAmount) }}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span class="text-gray-600 dark:text-slate-400">Odenen</span>
            <span class="text-green-600">{{ formatCurrency(stay.paidAmount) }}</span>
          </div>
          <div class="border-t border-gray-200 dark:border-slate-600 pt-2 flex justify-between">
            <span class="font-medium" :class="stay.balance > 0 ? 'text-red-600' : 'text-green-600'">
              {{ stay.balance > 0 ? 'Kalan Borc' : 'Fazla Odeme' }}
            </span>
            <span class="font-bold text-lg" :class="stay.balance > 0 ? 'text-red-600' : 'text-green-600'">
              {{ formatCurrency(Math.abs(stay.balance)) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Extras List -->
      <div v-if="stay.extras?.length > 0">
        <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Ekstralar</h4>
        <div class="space-y-1">
          <div
            v-for="(extra, index) in stay.extras"
            :key="index"
            class="flex justify-between text-sm py-1 border-b border-gray-100 dark:border-slate-700 last:border-0"
          >
            <span class="text-gray-600 dark:text-slate-400">
              {{ extra.description }}
              <span v-if="extra.quantity > 1" class="text-xs">(x{{ extra.quantity }})</span>
            </span>
            <span class="text-gray-900 dark:text-white">{{ formatCurrency(extra.amount * extra.quantity) }}</span>
          </div>
        </div>
      </div>

      <!-- Balance Settlement -->
      <div v-if="stay.balance > 0" class="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4">
        <label class="flex items-center gap-2">
          <input
            type="checkbox"
            v-model="settleBalance"
            class="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
          />
          <span class="text-sm text-amber-700 dark:text-amber-300">
            Kalan borcu tahsil et ({{ formatCurrency(stay.balance) }})
          </span>
        </label>

        <div v-if="settleBalance" class="mt-3 flex flex-wrap gap-2">
          <label
            v-for="method in paymentMethods"
            :key="method.value"
            class="flex items-center gap-2 px-3 py-1.5 border rounded-lg cursor-pointer"
            :class="paymentMethod === method.value
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
              : 'border-gray-200 dark:border-slate-600'"
          >
            <input
              type="radio"
              :value="method.value"
              v-model="paymentMethod"
              class="hidden"
            />
            <span class="text-sm text-gray-700 dark:text-gray-300">{{ method.label }}</span>
          </label>
        </div>
      </div>

      <!-- Confirmation -->
      <div class="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
        <p class="text-sm text-red-700 dark:text-red-300">
          <span class="material-icons text-sm align-middle mr-1">warning</span>
          Check-out isleminden sonra oda temizlik icin isaretlenecek ve misafir kaydi kapatilacaktir.
        </p>
      </div>
    </div>

    <template #footer>
      <button
        @click="close"
        class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg"
        :disabled="loading"
      >
        Iptal
      </button>
      <button
        @click="submit"
        class="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center gap-2"
        :disabled="loading"
      >
        <span v-if="loading" class="animate-spin material-icons text-sm">refresh</span>
        <span class="material-icons text-sm" v-else>logout</span>
        Check-out Yap
      </button>
    </template>
  </Modal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useToast } from 'vue-toastification'
import Modal from '@/components/common/Modal.vue'
import stayService, { PAYMENT_METHODS } from '@/services/pms/stayService'

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

const emit = defineEmits(['update:modelValue', 'completed'])

const toast = useToast()
const loading = ref(false)
const settleBalance = ref(false)
const paymentMethod = ref('cash')

const paymentMethods = PAYMENT_METHODS

const show = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const extrasTotal = computed(() => {
  if (!props.stay?.extras) return 0
  return props.stay.extras.reduce((sum, e) => sum + (e.amount * e.quantity), 0)
})

const submit = async () => {
  loading.value = true
  try {
    await stayService.checkOut(props.hotelId, props.stay._id, {
      settleBalance: settleBalance.value,
      paymentMethod: paymentMethod.value
    })

    toast.success('Check-out basarili')
    emit('completed')
    close()
  } catch (error) {
    toast.error(error.response?.data?.message || 'Check-out yapilamadi')
  } finally {
    loading.value = false
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

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY'
  }).format(amount || 0)
}

const close = () => {
  show.value = false
  settleBalance.value = false
  paymentMethod.value = 'cash'
}

watch(() => props.modelValue, (val) => {
  if (val) {
    settleBalance.value = false
    paymentMethod.value = 'cash'
  }
})
</script>
