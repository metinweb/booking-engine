<template>
  <Modal
    v-model="show"
    size="lg"
    :title="$t('payment.card.title')"
    :closeable="!isProcessing && !showingIframe"
    @close="handleClose"
  >
    <CreditCardPaymentForm
      ref="paymentFormRef"
      :booking-id="bookingId"
      :payment-id="paymentId"
      :amount="amount"
      :currency="currency"
      :customer-name="customerName"
      :customer-email="customerEmail"
      :customer-phone="customerPhone"
      :show-submit-button="false"
      mode="modal"
      @success="handleSuccess"
      @error="handleError"
      @cancel="handleCancel"
      @processing="handleProcessing"
    />

    <template v-if="!showingIframe" #footer>
      <div class="flex justify-between items-center">
        <!-- Secure Payment Badge -->
        <div class="flex items-center gap-2 text-gray-500 dark:text-slate-400 text-sm">
          <span class="material-icons text-green-500">lock</span>
          <span>{{ $t('payment.card.securePayment') }}</span>
        </div>
        <div class="flex gap-3">
          <button class="btn-secondary px-4 py-2" @click="handleClose">
            {{ $t('common.cancel') }}
          </button>
          <button
            class="btn-primary px-6 py-2"
            :disabled="!isFormValid || isProcessing"
            @click="submitPayment"
          >
            <span v-if="isProcessing" class="flex items-center">
              <span class="material-icons text-sm animate-spin mr-2">refresh</span>
              {{ $t('payment.card.processing') }}
            </span>
            <span v-else class="flex items-center">
              <span class="material-icons mr-2">payment</span>
              {{ $t('payment.card.pay') }} {{ formatPrice(amount, currency) }}
            </span>
          </button>
        </div>
      </div>
    </template>
  </Modal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import Modal from '@/components/common/Modal.vue'
import CreditCardPaymentForm from './CreditCardPaymentForm.vue'

const props = defineProps({
  modelValue: Boolean,
  bookingId: String,
  paymentId: String,
  amount: Number,
  currency: {
    type: String,
    default: 'TRY'
  },
  customerName: String,
  customerEmail: String,
  customerPhone: String
})

const emit = defineEmits(['update:modelValue', 'close', 'success', 'error'])

const { locale } = useI18n()

const paymentFormRef = ref(null)
const isProcessing = ref(false)
const showingIframe = ref(false)

const show = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val)
})

const isFormValid = computed(() => {
  return paymentFormRef.value?.isValid ?? false
})

const formatPrice = (amount, currency = 'TRY') => {
  if (!amount && amount !== 0) return '-'
  return new Intl.NumberFormat(locale.value === 'tr' ? 'tr-TR' : 'en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount)
}

const submitPayment = () => {
  if (paymentFormRef.value) {
    // Trigger form submission by calling processPayment directly since we already have bookingId/paymentId
    paymentFormRef.value.processPayment(props.bookingId, props.paymentId)
  }
}

const handleProcessing = (value) => {
  isProcessing.value = value
  // Check if iframe is showing (3D Secure)
  if (value) {
    // We'll detect iframe showing by watching the form
    setTimeout(() => {
      showingIframe.value = paymentFormRef.value?.$el?.querySelector('iframe') !== null
    }, 100)
  } else {
    showingIframe.value = false
  }
}

const handleSuccess = (data) => {
  show.value = false
  emit('success', data)
}

const handleError = (error) => {
  emit('error', error)
}

const handleCancel = () => {
  showingIframe.value = false
  isProcessing.value = false
}

const handleClose = () => {
  if (isProcessing.value || showingIframe.value) return
  emit('close')
}

// Reset form when modal opens
watch(() => props.modelValue, (newVal) => {
  if (newVal && paymentFormRef.value) {
    paymentFormRef.value.resetForm()
    isProcessing.value = false
    showingIframe.value = false
  }
})
</script>
