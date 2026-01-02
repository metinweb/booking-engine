<template>
  <Modal
    v-model="show"
    :title="isEditMode ? 'Misafir Duzenle' : 'Yeni Misafir'"
    size="lg"
    @close="close"
  >
    <div class="space-y-6">
      <!-- Basic Info -->
      <div>
        <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-3">Kisisel Bilgiler</h4>
        <div class="grid grid-cols-3 gap-4">
          <div>
            <label class="block text-sm text-gray-500 dark:text-slate-400 mb-1">Unvan</label>
            <select
              v-model="form.title"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            >
              <option v-for="t in titleOptions" :key="t.value" :value="t.value">{{ t.label }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm text-gray-500 dark:text-slate-400 mb-1">Ad *</label>
            <input
              v-model="form.firstName"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>
          <div>
            <label class="block text-sm text-gray-500 dark:text-slate-400 mb-1">Soyad *</label>
            <input
              v-model="form.lastName"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              required
            />
          </div>
        </div>
        <div class="grid grid-cols-3 gap-4 mt-4">
          <div>
            <label class="block text-sm text-gray-500 dark:text-slate-400 mb-1">Dogum Tarihi</label>
            <input
              v-model="form.dateOfBirth"
              type="date"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label class="block text-sm text-gray-500 dark:text-slate-400 mb-1">Cinsiyet</label>
            <select
              v-model="form.gender"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            >
              <option v-for="g in genderOptions" :key="g.value" :value="g.value">{{ g.label }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm text-gray-500 dark:text-slate-400 mb-1">Uyruk</label>
            <input
              v-model="form.nationality"
              type="text"
              placeholder="TR"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 uppercase"
            />
          </div>
        </div>
      </div>

      <!-- ID Info -->
      <div>
        <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-3">Kimlik Bilgileri</h4>
        <div class="grid grid-cols-3 gap-4">
          <div>
            <label class="block text-sm text-gray-500 dark:text-slate-400 mb-1">Kimlik Tipi</label>
            <select
              v-model="form.idType"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            >
              <option v-for="t in idTypes" :key="t.value" :value="t.value">{{ t.label }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm text-gray-500 dark:text-slate-400 mb-1">Kimlik No</label>
            <input
              v-model="form.idNumber"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label class="block text-sm text-gray-500 dark:text-slate-400 mb-1">Gecerlilik Tarihi</label>
            <input
              v-model="form.idExpiry"
              type="date"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </div>

      <!-- Contact Info -->
      <div>
        <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-3">Iletisim Bilgileri</h4>
        <div class="grid grid-cols-2 gap-4">
          <PhoneInput
            v-model="form.phone"
            label="Telefon"
            country="TR"
          />
          <div>
            <label class="block text-sm text-gray-500 dark:text-slate-400 mb-1">E-posta</label>
            <input
              v-model="form.email"
              type="email"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <PhoneInput
            v-model="form.whatsapp"
            label="WhatsApp"
            country="TR"
          />
          <PhoneInput
            v-model="form.alternatePhone"
            label="Alternatif Telefon"
            country="TR"
          />
        </div>
      </div>

      <!-- Address -->
      <div>
        <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-3">Adres</h4>
        <div class="grid grid-cols-2 gap-4">
          <div class="col-span-2">
            <label class="block text-sm text-gray-500 dark:text-slate-400 mb-1">Sokak/Cadde</label>
            <input
              v-model="form.address.street"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label class="block text-sm text-gray-500 dark:text-slate-400 mb-1">Sehir</label>
            <input
              v-model="form.address.city"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label class="block text-sm text-gray-500 dark:text-slate-400 mb-1">Ulke</label>
            <input
              v-model="form.address.country"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </div>

      <!-- Company Info (Optional) -->
      <div>
        <h4 class="text-sm font-medium text-gray-900 dark:text-white mb-3">Sirket Bilgileri (Opsiyonel)</h4>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm text-gray-500 dark:text-slate-400 mb-1">Sirket Adi</label>
            <input
              v-model="form.company.name"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label class="block text-sm text-gray-500 dark:text-slate-400 mb-1">Pozisyon</label>
            <input
              v-model="form.company.position"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
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
        <span class="material-icons text-sm" v-else>{{ isEditMode ? 'save' : 'person_add' }}</span>
        {{ isEditMode ? 'Kaydet' : 'Misafir Olustur' }}
      </button>
    </template>
  </Modal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useToast } from 'vue-toastification'
import Modal from '@/components/common/Modal.vue'
import PhoneInput from '@/components/ui/form/PhoneInput.vue'
import guestService, { ID_TYPES, TITLE_OPTIONS, GENDER_OPTIONS } from '@/services/pms/guestService'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  hotelId: {
    type: String,
    default: ''
  },
  guest: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'created', 'updated'])

const isEditMode = computed(() => !!props.guest)

const toast = useToast()
const loading = ref(false)

const titleOptions = TITLE_OPTIONS
const genderOptions = GENDER_OPTIONS
const idTypes = ID_TYPES

const show = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const defaultForm = () => ({
  title: 'mr',
  firstName: '',
  lastName: '',
  gender: 'prefer_not_to_say',
  dateOfBirth: '',
  nationality: 'TR',
  idType: 'tc_kimlik',
  idNumber: '',
  idExpiry: '',
  phone: '',
  email: '',
  whatsapp: '',
  alternatePhone: '',
  address: {
    street: '',
    city: '',
    state: '',
    postalCode: '',
    country: ''
  },
  company: {
    name: '',
    position: '',
    taxNumber: ''
  }
})

const form = ref(defaultForm())

const isValid = computed(() => {
  return form.value.firstName && form.value.lastName
})

const submit = async () => {
  if (!isValid.value) return

  loading.value = true
  try {
    if (isEditMode.value) {
      await guestService.update(props.hotelId, props.guest._id, form.value)
      toast.success('Misafir guncellendi')
      emit('updated')
    } else {
      await guestService.create(props.hotelId, form.value)
      toast.success('Misafir olusturuldu')
      emit('created')
    }
    close()
  } catch (error) {
    toast.error(error.response?.data?.message || (isEditMode.value ? 'Misafir guncellenemedi' : 'Misafir olusturulamadi'))
  } finally {
    loading.value = false
  }
}

const close = () => {
  show.value = false
  form.value = defaultForm()
}

// Helper to format date for input
const formatDateForInput = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return d.toISOString().split('T')[0]
}

watch(() => props.modelValue, (val) => {
  if (val) {
    if (props.guest) {
      // Edit mode - populate form with guest data
      form.value = {
        title: props.guest.title || 'mr',
        firstName: props.guest.firstName || '',
        lastName: props.guest.lastName || '',
        gender: props.guest.gender || 'prefer_not_to_say',
        dateOfBirth: formatDateForInput(props.guest.dateOfBirth),
        nationality: props.guest.nationality || 'TR',
        idType: props.guest.idType || 'tc_kimlik',
        idNumber: props.guest.idNumber || '',
        idExpiry: formatDateForInput(props.guest.idExpiry),
        phone: props.guest.phone || '',
        email: props.guest.email || '',
        whatsapp: props.guest.whatsapp || '',
        alternatePhone: props.guest.alternatePhone || '',
        address: {
          street: props.guest.address?.street || '',
          city: props.guest.address?.city || '',
          state: props.guest.address?.state || '',
          postalCode: props.guest.address?.postalCode || '',
          country: props.guest.address?.country || ''
        },
        company: {
          name: props.guest.company?.name || '',
          position: props.guest.company?.position || '',
          taxNumber: props.guest.company?.taxNumber || ''
        }
      }
    } else {
      form.value = defaultForm()
    }
  }
})
</script>
