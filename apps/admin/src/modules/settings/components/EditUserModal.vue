<template>
  <Modal v-model="isOpen" title="Kullaniciyi Duzenle" size="lg" :close-on-overlay="false">
    <form class="space-y-4" @submit.prevent="handleSubmit">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <!-- First Name -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Ad <span class="text-red-500">*</span>
          </label>
          <input
            v-model="form.firstName"
            type="text"
            required
            class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <!-- Last Name -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Soyad <span class="text-red-500">*</span>
          </label>
          <input
            v-model="form.lastName"
            type="text"
            required
            class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <!-- Email -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >E-posta</label
          >
          <input
            v-model="form.email"
            type="email"
            class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <!-- Phone -->
        <div>
          <PhoneInput v-model="form.phone" label="Telefon" country="TR" />
        </div>

        <!-- Department -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >Departman</label
          >
          <select
            v-model="form.department"
            class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          >
            <option v-for="dept in departments" :key="dept.value" :value="dept.value">
              {{ dept.label }}
            </option>
          </select>
        </div>

        <!-- Position -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >Pozisyon</label
          >
          <input
            v-model="form.position"
            type="text"
            class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <!-- Language -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Dil</label>
          <select
            v-model="form.language"
            class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          >
            <option value="tr">Turkce</option>
            <option value="en">English</option>
            <option value="de">Deutsch</option>
            <option value="ru">Русский</option>
            <option value="ar">العربية</option>
          </select>
        </div>

        <!-- Active Status -->
        <div class="flex items-center gap-2 pt-6">
          <input
            id="editIsActive"
            v-model="form.isActive"
            type="checkbox"
            class="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
          />
          <label for="editIsActive" class="text-sm text-gray-700 dark:text-gray-300"
            >Aktif kullanici</label
          >
        </div>
      </div>

      <!-- Assigned Hotels Info -->
      <div
        v-if="user?.assignedHotels?.length > 0"
        class="border-t border-gray-200 dark:border-slate-700 pt-4 mt-4"
      >
        <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Atanan Oteller</h4>
        <div class="space-y-2">
          <div
            v-for="(assignment, i) in user.assignedHotels"
            :key="i"
            class="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg"
          >
            <div>
              <p class="font-medium text-gray-900 dark:text-white">
                {{ assignment.hotel?.name || 'Otel' }}
              </p>
              <p class="text-sm text-gray-500 dark:text-slate-400">
                {{ getRoleLabel(assignment.role) }}
              </p>
            </div>
            <button
              type="button"
              class="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
              @click="removeHotel(assignment.hotel?._id || assignment.hotel)"
            >
              <span class="material-icons text-lg">close</span>
            </button>
          </div>
        </div>
        <p class="text-xs text-gray-500 dark:text-slate-400 mt-2">
          Otel atamalarini degistirmek icin "Otel Ata" butonunu kullanin.
        </p>
      </div>
    </form>

    <template #footer>
      <div class="flex justify-end gap-3">
        <button
          type="button"
          class="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg"
          @click="isOpen = false"
        >
          Iptal
        </button>
        <button
          :disabled="saving"
          class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
          @click="handleSubmit"
        >
          <span v-if="saving" class="animate-spin material-icons text-lg">refresh</span>
          {{ saving ? 'Kaydediliyor...' : 'Kaydet' }}
        </button>
      </div>
    </template>
  </Modal>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useToast } from 'vue-toastification'
import Modal from '@/components/common/Modal.vue'
import PhoneInput from '@/components/ui/form/PhoneInput.vue'
import pmsAdminUserService from '@/services/pms/pmsAdminUserService'

const props = defineProps({
  modelValue: Boolean,
  user: Object,
  departments: Array
})

const emit = defineEmits(['update:modelValue', 'updated'])

const toast = useToast()
const roles = pmsAdminUserService.getRoles()

const isOpen = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val)
})

const saving = ref(false)

const form = ref({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  department: '',
  position: '',
  language: 'tr',
  isActive: true
})

// Load user data when modal opens
watch(
  () => props.modelValue,
  val => {
    if (val && props.user) {
      form.value = {
        firstName: props.user.firstName || '',
        lastName: props.user.lastName || '',
        email: props.user.email || '',
        phone: props.user.phone || '',
        department: props.user.department || 'front_office',
        position: props.user.position || '',
        language: props.user.language || 'tr',
        isActive: props.user.isActive ?? true
      }
    }
  }
)

const getRoleLabel = role => {
  return roles.find(r => r.value === role)?.label || role
}

const removeHotel = async hotelId => {
  if (!hotelId || !props.user?._id) return

  try {
    await pmsAdminUserService.removeHotel(props.user._id, hotelId)
    toast.success('Otel kaldirildi')
    emit('updated')
  } catch (error) {
    console.error('Failed to remove hotel:', error)
    toast.error('Otel kaldirilamadi')
  }
}

const handleSubmit = async () => {
  if (!form.value.firstName || !form.value.lastName) {
    toast.error('Lutfen zorunlu alanlari doldurun')
    return
  }

  saving.value = true
  try {
    await pmsAdminUserService.update(props.user._id, form.value)
    toast.success('Kullanici guncellendi')
    emit('updated')
  } catch (error) {
    console.error('Failed to update user:', error)
    toast.error('Kullanici guncellenemedi')
  } finally {
    saving.value = false
  }
}
</script>
