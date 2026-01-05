<template>
  <Modal v-model="isOpen" title="Sifre Sifirla" size="sm" :close-on-overlay="false">
    <div class="space-y-4">
      <!-- User Info -->
      <div class="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
        <p class="text-sm text-gray-500 dark:text-slate-400">Kullanici</p>
        <p class="font-medium text-gray-900 dark:text-white">
          {{ user?.firstName }} {{ user?.lastName }}
        </p>
        <p class="text-sm text-gray-500 dark:text-slate-400">@{{ user?.username }}</p>
      </div>

      <!-- New Password -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Yeni Sifre <span class="text-red-500">*</span>
        </label>
        <div class="relative">
          <input
            v-model="newPassword"
            :type="showPassword ? 'text' : 'password'"
            required
            minlength="6"
            autocomplete="new-password"
            class="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            placeholder="En az 6 karakter"
          />
          <button
            type="button"
            class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            @click="showPassword = !showPassword"
          >
            <span class="material-icons text-lg">{{
              showPassword ? 'visibility_off' : 'visibility'
            }}</span>
          </button>
        </div>
      </div>

      <!-- Confirm Password -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Sifre Tekrar <span class="text-red-500">*</span>
        </label>
        <input
          v-model="confirmPassword"
          :type="showPassword ? 'text' : 'password'"
          required
          minlength="6"
          autocomplete="new-password"
          class="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          placeholder="Sifrenizi tekrar girin"
        />
      </div>

      <!-- Password Mismatch Warning -->
      <p
        v-if="confirmPassword && newPassword !== confirmPassword"
        class="text-sm text-red-500 flex items-center gap-1"
      >
        <span class="material-icons text-lg">warning</span>
        Sifreler eslesmiyor
      </p>

      <!-- Generate Random Password -->
      <button
        type="button"
        class="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center gap-1"
        @click="generatePassword"
      >
        <span class="material-icons text-lg">casino</span>
        Rastgele sifre olustur
      </button>
    </div>

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
          :disabled="
            saving || !newPassword || newPassword !== confirmPassword || newPassword.length < 6
          "
          class="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
          @click="resetPassword"
        >
          <span v-if="saving" class="animate-spin material-icons text-lg">refresh</span>
          {{ saving ? 'Sifirlaniyor...' : 'Sifreyi Sifirla' }}
        </button>
      </div>
    </template>
  </Modal>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useToast } from 'vue-toastification'
import Modal from '@/components/common/Modal.vue'
import pmsAdminUserService from '@/services/pms/pmsAdminUserService'

const props = defineProps({
  modelValue: Boolean,
  user: Object
})

const emit = defineEmits(['update:modelValue', 'reset'])

const toast = useToast()

const isOpen = computed({
  get: () => props.modelValue,
  set: val => emit('update:modelValue', val)
})

const saving = ref(false)
const showPassword = ref(false)
const newPassword = ref('')
const confirmPassword = ref('')

// Reset form when modal opens
watch(
  () => props.modelValue,
  val => {
    if (val) {
      newPassword.value = ''
      confirmPassword.value = ''
      showPassword.value = false
    }
  }
)

const generatePassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let password = ''
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  newPassword.value = password
  confirmPassword.value = password
  showPassword.value = true
}

const resetPassword = async () => {
  if (!newPassword.value || newPassword.value.length < 6) {
    toast.error('Sifre en az 6 karakter olmali')
    return
  }

  if (newPassword.value !== confirmPassword.value) {
    toast.error('Sifreler eslesmiyor')
    return
  }

  saving.value = true
  try {
    await pmsAdminUserService.resetPassword(props.user._id, newPassword.value)
    toast.success('Sifre sifirlandi')
    emit('reset')
  } catch (error) {
    console.error('Failed to reset password:', error)
    toast.error('Sifre sifirlanamadi')
  } finally {
    saving.value = false
  }
}
</script>
