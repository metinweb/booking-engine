<template>
  <Modal
    v-model="show"
    title="Yeni Rezervasyon"
    size="xl"
    @close="close"
  >
    <div class="space-y-6">
      <!-- Room Type & Meal Plan -->
      <div>
        <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-3">Oda Bilgileri</h4>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm text-gray-500 dark:text-slate-400 mb-1">Oda Tipi *</label>
            <select
              v-model="form.roomTypeId"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              required
            >
              <option value="">Secin</option>
              <option v-for="rt in roomTypes" :key="rt._id" :value="rt._id">
                {{ rt.name?.tr || rt.code }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm text-gray-500 dark:text-slate-400 mb-1">Pansiyon *</label>
            <select
              v-model="form.mealPlanId"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              required
            >
              <option value="">Secin</option>
              <option v-for="mp in mealPlans" :key="mp._id" :value="mp._id">
                {{ mp.name?.tr || mp.code }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- Dates -->
      <div>
        <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-3">Tarihler</h4>
        <div class="grid grid-cols-3 gap-4">
          <div>
            <label class="block text-sm text-gray-500 dark:text-slate-400 mb-1">Giris *</label>
            <input
              v-model="form.checkIn"
              type="date"
              :min="today"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>
          <div>
            <label class="block text-sm text-gray-500 dark:text-slate-400 mb-1">Cikis *</label>
            <input
              v-model="form.checkOut"
              type="date"
              :min="form.checkIn || today"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>
          <div>
            <label class="block text-sm text-gray-500 dark:text-slate-400 mb-1">Gece</label>
            <input
              :value="nights"
              type="text"
              class="w-full px-3 py-2 border border-gray-200 dark:border-slate-600 rounded-lg bg-gray-100 dark:bg-slate-600 text-gray-900 dark:text-white"
              disabled
            />
          </div>
        </div>
      </div>

      <!-- Guest Info -->
      <div>
        <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-3">Misafir Bilgileri</h4>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm text-gray-500 dark:text-slate-400 mb-1">Ad *</label>
            <input
              v-model="form.leadGuest.firstName"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>
          <div>
            <label class="block text-sm text-gray-500 dark:text-slate-400 mb-1">Soyad *</label>
            <input
              v-model="form.leadGuest.lastName"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>
          <div>
            <label class="block text-sm text-gray-500 dark:text-slate-400 mb-1">E-posta *</label>
            <input
              v-model="form.contact.email"
              type="email"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>
          <div>
            <PhoneInput
              v-model="form.contact.phone"
              label="Telefon *"
              country="TR"
              :required="true"
            />
          </div>
          <div>
            <label class="block text-sm text-gray-500 dark:text-slate-400 mb-1">Kimlik/Pasaport No</label>
            <input
              v-model="form.leadGuest.idNumber"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label class="block text-sm text-gray-500 dark:text-slate-400 mb-1">Uyruk</label>
            <input
              v-model="form.leadGuest.nationality"
              type="text"
              placeholder="TR"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 uppercase"
            />
          </div>
        </div>
      </div>

      <!-- Occupancy -->
      <div>
        <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-3">Kisi Sayisi</h4>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm text-gray-500 dark:text-slate-400 mb-1">Yetiskin *</label>
            <input
              v-model.number="form.adults"
              type="number"
              min="1"
              max="10"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>
          <div>
            <label class="block text-sm text-gray-500 dark:text-slate-400 mb-1">Cocuk</label>
            <input
              v-model.number="form.children"
              type="number"
              min="0"
              max="10"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </div>

      <!-- Pricing -->
      <div>
        <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-3">Ucretlendirme</h4>
        <div class="grid grid-cols-3 gap-4">
          <div>
            <label class="block text-sm text-gray-500 dark:text-slate-400 mb-1">Toplam Tutar *</label>
            <input
              v-model.number="form.pricing.total"
              type="number"
              min="0"
              step="0.01"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>
          <div>
            <label class="block text-sm text-gray-500 dark:text-slate-400 mb-1">Pesinat</label>
            <input
              v-model.number="form.paymentAmount"
              type="number"
              min="0"
              step="0.01"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label class="block text-sm text-gray-500 dark:text-slate-400 mb-1">Odeme Yontemi</label>
            <select
              v-model="form.paymentMethod"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            >
              <option v-for="method in paymentMethods" :key="method.value" :value="method.value">
                {{ method.label }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- Special Requests -->
      <div>
        <label class="block text-sm text-gray-500 dark:text-slate-400 mb-1">Ozel Istekler</label>
        <textarea
          v-model="form.specialRequests"
          rows="2"
          class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
          placeholder="Varsa ozel istekleri yazin..."
        ></textarea>
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
        class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
        :disabled="loading || !isValid"
      >
        <span v-if="loading" class="animate-spin material-icons text-sm">refresh</span>
        <span class="material-icons text-sm" v-else>add</span>
        Rezervasyon Olustur
      </button>
    </template>
  </Modal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useToast } from 'vue-toastification'
import Modal from '@/components/common/Modal.vue'
import PhoneInput from '@/components/ui/form/PhoneInput.vue'
import reservationService, { PAYMENT_METHODS } from '@/services/pms/reservationService'
import * as pmsRoomService from '@/services/pms/roomService'

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
const roomTypes = ref([])
const mealPlans = ref([])

const paymentMethods = PAYMENT_METHODS

const today = new Date().toISOString().split('T')[0]

const show = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const defaultForm = () => ({
  roomTypeId: '',
  mealPlanId: '',
  checkIn: today,
  checkOut: new Date(Date.now() + 86400000).toISOString().split('T')[0],
  leadGuest: {
    firstName: '',
    lastName: '',
    idNumber: '',
    nationality: 'TR'
  },
  contact: {
    email: '',
    phone: ''
  },
  adults: 2,
  children: 0,
  pricing: {
    total: 0,
    currency: 'TRY'
  },
  paymentAmount: 0,
  paymentMethod: 'cash',
  specialRequests: ''
})

const form = ref(defaultForm())

const nights = computed(() => {
  if (!form.value.checkIn || !form.value.checkOut) return 0
  const checkIn = new Date(form.value.checkIn)
  const checkOut = new Date(form.value.checkOut)
  return Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24))
})

const isValid = computed(() => {
  return form.value.roomTypeId &&
         form.value.mealPlanId &&
         form.value.checkIn &&
         form.value.checkOut &&
         nights.value > 0 &&
         form.value.leadGuest.firstName &&
         form.value.leadGuest.lastName &&
         form.value.contact.email &&
         form.value.contact.phone &&
         form.value.pricing.total > 0
})

const fetchData = async () => {
  if (!props.hotelId) return

  try {
    const [roomTypesRes, mealPlansRes] = await Promise.all([
      pmsRoomService.getRoomTypes(props.hotelId),
      pmsRoomService.getMealPlans(props.hotelId)
    ])

    roomTypes.value = roomTypesRes.data || []
    mealPlans.value = mealPlansRes.data || []
  } catch (error) {
    console.error('Failed to fetch data:', error)
  }
}

const submit = async () => {
  if (!isValid.value) return

  loading.value = true
  try {
    await reservationService.create(props.hotelId, form.value)
    toast.success('Rezervasyon olusturuldu')
    emit('created')
    close()
  } catch (error) {
    toast.error(error.response?.data?.message || 'Rezervasyon olusturulamadi')
  } finally {
    loading.value = false
  }
}

const close = () => {
  show.value = false
  form.value = defaultForm()
}

watch(() => props.modelValue, (val) => {
  if (val) {
    form.value = defaultForm()
    fetchData()
  }
})
</script>
