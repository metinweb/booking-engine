<template>
  <Modal
    v-model="isOpen"
    title=""
    size="lg"
    :close-on-overlay="false"
  >
    <!-- Custom Header -->
    <template #header>
      <div class="flex items-center gap-4 pb-4 border-b border-gray-200 dark:border-slate-700">
        <!-- Avatar Preview -->
        <div class="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold shadow-lg">
          {{ avatarInitials }}
        </div>
        <div class="flex-1">
          <h2 class="text-xl font-bold text-gray-900 dark:text-white">Yeni Personel</h2>
          <p class="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
            <span class="inline-flex items-center gap-1">
              <span class="material-icons text-sm">business</span>
              {{ hotels[0]?.name || 'Otel' }}
            </span>
          </p>
        </div>
      </div>
    </template>

    <form @submit.prevent="handleSubmit" class="space-y-6 -mt-2">
      <!-- Section: Hesap Bilgileri -->
      <div class="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-4">
        <div class="flex items-center gap-2 mb-4">
          <div class="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
            <span class="material-icons text-indigo-600 dark:text-indigo-400 text-lg">account_circle</span>
          </div>
          <h3 class="font-semibold text-gray-900 dark:text-white">Hesap Bilgileri</h3>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Username -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Kullanici Adi <span class="text-red-500">*</span>
            </label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 material-icons text-lg" :class="errors.username ? 'text-red-400' : 'text-gray-400'">person</span>
              <input
                v-model="form.username"
                type="text"
                autocomplete="off"
                @blur="validateField('username')"
                @input="clearError('username')"
                class="w-full pl-10 pr-3 py-2.5 border rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                :class="errors.username ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : 'border-gray-300 dark:border-slate-600'"
                placeholder="ahmet.yilmaz"
              />
            </div>
            <p v-if="errors.username" class="mt-1 text-sm text-red-500 flex items-center gap-1">
              <span class="material-icons text-sm">error</span>
              {{ errors.username }}
            </p>
          </div>

          <!-- Password -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Sifre <span class="text-red-500">*</span>
            </label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 material-icons text-lg" :class="errors.password ? 'text-red-400' : 'text-gray-400'">lock</span>
              <input
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="new-password"
                @blur="validateField('password')"
                @input="clearError('password')"
                class="w-full pl-10 pr-20 py-2.5 border rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                :class="errors.password ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : 'border-gray-300 dark:border-slate-600'"
                placeholder="En az 6 karakter"
              />
              <div class="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
                  type="button"
                  @click="generatePassword"
                  class="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                  title="Sifre Olustur"
                >
                  <span class="material-icons text-lg">auto_awesome</span>
                </button>
                <button
                  type="button"
                  @click="showPassword = !showPassword"
                  class="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition-colors"
                >
                  <span class="material-icons text-lg">{{ showPassword ? 'visibility_off' : 'visibility' }}</span>
                </button>
              </div>
            </div>
            <p v-if="errors.password" class="mt-1 text-sm text-red-500 flex items-center gap-1">
              <span class="material-icons text-sm">error</span>
              {{ errors.password }}
            </p>
          </div>
        </div>
      </div>

      <!-- Section: Kisisel Bilgiler -->
      <div class="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-4">
        <div class="flex items-center gap-2 mb-4">
          <div class="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <span class="material-icons text-green-600 dark:text-green-400 text-lg">badge</span>
          </div>
          <h3 class="font-semibold text-gray-900 dark:text-white">Kisisel Bilgiler</h3>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- First Name -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Ad <span class="text-red-500">*</span>
            </label>
            <input
              v-model="form.firstName"
              type="text"
              @blur="validateField('firstName')"
              @input="clearError('firstName')"
              class="w-full px-4 py-2.5 border rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              :class="errors.firstName ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : 'border-gray-300 dark:border-slate-600'"
              placeholder="Ahmet"
            />
            <p v-if="errors.firstName" class="mt-1 text-sm text-red-500 flex items-center gap-1">
              <span class="material-icons text-sm">error</span>
              {{ errors.firstName }}
            </p>
          </div>

          <!-- Last Name -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Soyad <span class="text-red-500">*</span>
            </label>
            <input
              v-model="form.lastName"
              type="text"
              @blur="validateField('lastName')"
              @input="clearError('lastName')"
              class="w-full px-4 py-2.5 border rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              :class="errors.lastName ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : 'border-gray-300 dark:border-slate-600'"
              placeholder="Yilmaz"
            />
            <p v-if="errors.lastName" class="mt-1 text-sm text-red-500 flex items-center gap-1">
              <span class="material-icons text-sm">error</span>
              {{ errors.lastName }}
            </p>
          </div>

          <!-- Email -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">E-posta</label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 material-icons text-gray-400 text-lg">email</span>
              <input
                v-model="form.email"
                type="email"
                class="w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                placeholder="ahmet@otel.com"
              />
            </div>
          </div>

          <!-- Phone -->
          <div>
            <PhoneInput
              v-model="form.phone"
              label="Telefon"
              country="TR"
            />
          </div>
        </div>
      </div>

      <!-- Section: Gorev Bilgileri -->
      <div class="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-4">
        <div class="flex items-center gap-2 mb-4">
          <div class="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <span class="material-icons text-purple-600 dark:text-purple-400 text-lg">work</span>
          </div>
          <h3 class="font-semibold text-gray-900 dark:text-white">Gorev Bilgileri</h3>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Department -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Departman <span class="text-red-500">*</span>
            </label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 material-icons text-lg" :class="errors.department ? 'text-red-400' : 'text-gray-400'">apartment</span>
              <select
                v-model="form.department"
                @change="clearError('department')"
                class="w-full pl-10 pr-8 py-2.5 border rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all appearance-none cursor-pointer"
                :class="errors.department ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : 'border-gray-300 dark:border-slate-600'"
              >
                <option value="">Departman Secin</option>
                <option v-for="dept in departments" :key="dept.value" :value="dept.value">{{ dept.label }}</option>
              </select>
              <span class="absolute right-3 top-1/2 -translate-y-1/2 material-icons text-gray-400 pointer-events-none">expand_more</span>
            </div>
            <p v-if="errors.department" class="mt-1 text-sm text-red-500 flex items-center gap-1">
              <span class="material-icons text-sm">error</span>
              {{ errors.department }}
            </p>
          </div>

          <!-- Position -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Pozisyon</label>
            <input
              v-model="form.position"
              type="text"
              class="w-full px-4 py-2.5 border border-gray-300 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              placeholder="Gece Muduru, Resepsiyonist..."
            />
          </div>
        </div>

        <!-- Role Selection Cards -->
        <div class="mt-4">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Sistem Rolu <span class="text-red-500">*</span>
          </label>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <button
              v-for="role in roles"
              :key="role.value"
              type="button"
              @click="selectRole(role.value)"
              class="relative p-3 rounded-xl border-2 text-left transition-all"
              :class="getRoleButtonClass(role.value)"
            >
              <div class="flex items-start gap-3">
                <div
                  class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  :class="hotelAssignment.role === role.value
                    ? 'bg-indigo-100 dark:bg-indigo-900/40'
                    : 'bg-gray-100 dark:bg-slate-600'"
                >
                  <span
                    class="material-icons"
                    :class="hotelAssignment.role === role.value
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : 'text-gray-500 dark:text-gray-400'"
                  >{{ getRoleIcon(role.value) }}</span>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="font-medium text-gray-900 dark:text-white text-sm">{{ role.label }}</p>
                  <p class="text-xs text-gray-500 dark:text-slate-400 mt-0.5 line-clamp-2">{{ role.description }}</p>
                </div>
              </div>
              <!-- Check indicator -->
              <div
                v-if="hotelAssignment.role === role.value"
                class="absolute top-2 right-2 w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center"
              >
                <span class="material-icons text-white text-sm">check</span>
              </div>
            </button>
          </div>
          <p v-if="errors.role" class="mt-2 text-sm text-red-500 flex items-center gap-1">
            <span class="material-icons text-sm">error</span>
            {{ errors.role }}
          </p>
        </div>
      </div>

      <!-- Active Status Toggle -->
      <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-lg flex items-center justify-center" :class="form.isActive ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-slate-600'">
            <span class="material-icons" :class="form.isActive ? 'text-green-600 dark:text-green-400' : 'text-gray-400'">{{ form.isActive ? 'verified_user' : 'person_off' }}</span>
          </div>
          <div>
            <p class="font-medium text-gray-900 dark:text-white">Hesap Durumu</p>
            <p class="text-sm" :class="form.isActive ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-slate-400'">
              {{ form.isActive ? 'Aktif - Sisteme giris yapabilir' : 'Pasif - Giris yapamaz' }}
            </p>
          </div>
        </div>
        <button
          type="button"
          @click="form.isActive = !form.isActive"
          class="relative w-14 h-8 rounded-full transition-colors duration-200"
          :class="form.isActive ? 'bg-green-500' : 'bg-gray-300 dark:bg-slate-600'"
        >
          <span
            class="absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-all duration-200"
            :class="form.isActive ? 'left-7' : 'left-1'"
          ></span>
        </button>
      </div>

      <!-- Validation Summary -->
      <div v-if="showValidationSummary && hasErrors" class="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
        <div class="flex items-start gap-3">
          <span class="material-icons text-red-500 mt-0.5">warning</span>
          <div>
            <p class="font-medium text-red-800 dark:text-red-200">Lutfen asagidaki alanlari doldurun:</p>
            <ul class="mt-1 text-sm text-red-600 dark:text-red-300 list-disc list-inside">
              <li v-if="errors.username">Kullanici Adi</li>
              <li v-if="errors.password">Sifre</li>
              <li v-if="errors.firstName">Ad</li>
              <li v-if="errors.lastName">Soyad</li>
              <li v-if="errors.department">Departman</li>
              <li v-if="errors.role">Sistem Rolu</li>
            </ul>
          </div>
        </div>
      </div>
    </form>

    <template #footer>
      <div class="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-slate-700">
        <p class="text-xs text-gray-500 dark:text-slate-400">
          <span class="text-red-500">*</span> Zorunlu alanlar
        </p>
        <div class="flex gap-3">
          <button
            @click="handleCancel"
            type="button"
            class="px-5 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl font-medium transition-colors"
          >
            Iptal
          </button>
          <button
            @click="handleSubmit"
            :disabled="saving"
            class="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-indigo-500/25 transition-all"
          >
            <span v-if="saving" class="animate-spin material-icons text-lg">refresh</span>
            <span v-else class="material-icons text-lg">person_add</span>
            {{ saving ? 'Kaydediliyor...' : 'Personel Ekle' }}
          </button>
        </div>
      </div>
    </template>
  </Modal>
</template>

<script setup>
import { ref, watch, computed, reactive } from 'vue'
import { useToast } from 'vue-toastification'
import Modal from '@/components/common/Modal.vue'
import PhoneInput from '@/components/ui/form/PhoneInput.vue'
import pmsAdminUserService from '@/services/pms/pmsAdminUserService'

const props = defineProps({
  modelValue: Boolean,
  hotels: Array,
  roles: Array,
  departments: Array,
  partnerId: String
})

const emit = defineEmits(['update:modelValue', 'created'])

const toast = useToast()

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

// Get hotels array safely
const hotels = computed(() => props.hotels || [])

// Avatar initials
const avatarInitials = computed(() => {
  const first = form.value.firstName?.[0] || ''
  const last = form.value.lastName?.[0] || ''
  return (first + last).toUpperCase() || 'YK'
})

const saving = ref(false)
const showPassword = ref(false)
const showValidationSummary = ref(false)

// Form data
const form = ref({
  username: '',
  password: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  department: 'front_office',
  position: '',
  isActive: true
})

const hotelAssignment = ref({
  hotel: '',
  role: 'receptionist'
})

// Validation errors
const errors = reactive({
  username: '',
  password: '',
  firstName: '',
  lastName: '',
  department: '',
  role: ''
})

const hasErrors = computed(() => {
  return Object.values(errors).some(e => e)
})

// Validation functions
const validateField = (field) => {
  switch (field) {
    case 'username':
      if (!form.value.username?.trim()) {
        errors.username = 'Kullanici adi gerekli'
      } else if (form.value.username.length < 3) {
        errors.username = 'En az 3 karakter olmali'
      } else {
        errors.username = ''
      }
      break
    case 'password':
      if (!form.value.password) {
        errors.password = 'Sifre gerekli'
      } else if (form.value.password.length < 6) {
        errors.password = 'En az 6 karakter olmali'
      } else {
        errors.password = ''
      }
      break
    case 'firstName':
      if (!form.value.firstName?.trim()) {
        errors.firstName = 'Ad gerekli'
      } else {
        errors.firstName = ''
      }
      break
    case 'lastName':
      if (!form.value.lastName?.trim()) {
        errors.lastName = 'Soyad gerekli'
      } else {
        errors.lastName = ''
      }
      break
    case 'department':
      if (!form.value.department) {
        errors.department = 'Departman secin'
      } else {
        errors.department = ''
      }
      break
    case 'role':
      if (!hotelAssignment.value.role) {
        errors.role = 'Rol secin'
      } else {
        errors.role = ''
      }
      break
  }
}

const validateAll = () => {
  validateField('username')
  validateField('password')
  validateField('firstName')
  validateField('lastName')
  validateField('department')
  validateField('role')
  return !hasErrors.value
}

const clearError = (field) => {
  errors[field] = ''
  showValidationSummary.value = false
}

const clearAllErrors = () => {
  Object.keys(errors).forEach(key => {
    errors[key] = ''
  })
  showValidationSummary.value = false
}

// Role selection
const selectRole = (roleValue) => {
  hotelAssignment.value.role = roleValue
  clearError('role')
}

const getRoleButtonClass = (roleValue) => {
  if (errors.role && !hotelAssignment.value.role) {
    return 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/10 hover:border-red-400'
  }
  if (hotelAssignment.value.role === roleValue) {
    return 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
  }
  return 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500 bg-white dark:bg-slate-700'
}

// Role icons
const getRoleIcon = (role) => {
  const icons = {
    pms_admin: 'admin_panel_settings',
    manager: 'supervisor_account',
    receptionist: 'support_agent',
    housekeeping: 'cleaning_services',
    accounting: 'calculate',
    readonly: 'visibility'
  }
  return icons[role] || 'person'
}

// Generate random password
const generatePassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let password = ''
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  form.value.password = password
  showPassword.value = true
  clearError('password')
  toast.info('Sifre olusturuldu - not almayi unutmayin!')
}

// Reset form when modal opens
watch(() => props.modelValue, (val) => {
  if (val) {
    form.value = {
      username: '',
      password: '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      department: 'front_office',
      position: '',
      isActive: true
    }
    const defaultHotel = props.hotels?.length === 1 ? props.hotels[0]._id : ''
    hotelAssignment.value = { hotel: defaultHotel, role: 'receptionist' }
    showPassword.value = false
    clearAllErrors()
  }
})

const handleCancel = () => {
  clearAllErrors()
  isOpen.value = false
}

const handleSubmit = async () => {
  // Validate all fields
  const isValid = validateAll()

  if (!isValid) {
    showValidationSummary.value = true
    toast.error('Lutfen zorunlu alanlari doldurun')

    // Scroll to first error
    const firstError = document.querySelector('.border-red-500')
    if (firstError) {
      firstError.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
    return
  }

  // Get partnerId
  let partnerId = props.partnerId || null

  // Fallback: try to get from selected hotel
  if (!partnerId && hotelAssignment.value.hotel) {
    const selectedHotel = props.hotels.find(h => h._id === hotelAssignment.value.hotel)
    partnerId = selectedHotel?.partner || selectedHotel?.partnerId
  }

  // Fallback: try to get from first available hotel
  if (!partnerId && props.hotels?.length > 0) {
    partnerId = props.hotels[0]?.partner || props.hotels[0]?.partnerId
  }

  if (!partnerId) {
    toast.error('Partner bilgisi bulunamadi')
    return
  }

  saving.value = true
  try {
    const data = {
      ...form.value,
      partnerId
    }

    // Add hotel assignment
    if (hotelAssignment.value.hotel) {
      data.assignedHotels = [{
        hotel: hotelAssignment.value.hotel,
        role: hotelAssignment.value.role
      }]
    }

    await pmsAdminUserService.create(data)
    toast.success(`${form.value.firstName} ${form.value.lastName} basariyla eklendi!`)
    emit('created')
  } catch (error) {
    console.error('Failed to create user:', error)
    const message = error.response?.data?.message || 'Kullanici olusturulamadi'
    toast.error(message)
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
