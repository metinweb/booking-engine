<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <!-- Profile Header -->
    <div class="bg-white dark:bg-slate-800 rounded-lg shadow overflow-hidden">
      <div class="bg-gradient-to-r from-purple-600 to-purple-800 px-6 py-8">
        <div class="flex items-center gap-4">
          <!-- Avatar -->
          <div class="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-white text-2xl font-bold">
            {{ getInitials(authStore.user?.name) }}
          </div>
          <div class="text-white">
            <h1 class="text-2xl font-bold">{{ authStore.user?.name || '-' }}</h1>
            <p class="text-purple-200">{{ authStore.user?.email }}</p>
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/20 mt-2">
              {{ getRoleName() }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Account Information -->
    <div class="bg-white dark:bg-slate-800 rounded-lg shadow">
      <div class="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
        <h2 class="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
          <span class="material-icons text-purple-600">person</span>
          {{ $t('profile.accountInfo') }}
        </h2>
      </div>
      <div class="p-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              {{ $t('profile.fullName') }}
            </label>
            <p class="text-gray-900 dark:text-white bg-gray-50 dark:bg-slate-700 px-4 py-2.5 rounded-lg">
              {{ authStore.user?.name || '-' }}
            </p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              {{ $t('profile.email') }}
            </label>
            <p class="text-gray-900 dark:text-white bg-gray-50 dark:bg-slate-700 px-4 py-2.5 rounded-lg">
              {{ authStore.user?.email || '-' }}
            </p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              {{ $t('profile.role') }}
            </label>
            <p class="text-gray-900 dark:text-white bg-gray-50 dark:bg-slate-700 px-4 py-2.5 rounded-lg">
              {{ getRoleName() }}
            </p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
              {{ $t('profile.accountType') }}
            </label>
            <p class="text-gray-900 dark:text-white bg-gray-50 dark:bg-slate-700 px-4 py-2.5 rounded-lg capitalize">
              {{ authStore.user?.accountType || '-' }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Preferences -->
    <div class="bg-white dark:bg-slate-800 rounded-lg shadow">
      <div class="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
        <h2 class="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
          <span class="material-icons text-purple-600">settings</span>
          {{ $t('profile.preferences') }}
        </h2>
      </div>
      <div class="p-6 space-y-6">
        <!-- Language -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
            {{ $t('profile.language') }}
          </label>
          <div class="flex gap-3">
            <button
              v-for="lang in languages"
              :key="lang.code"
              @click="changeLanguage(lang.code)"
              class="flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 transition-all"
              :class="currentLocale === lang.code
                ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500 text-gray-700 dark:text-slate-300'"
            >
              <span class="text-lg">{{ lang.flag }}</span>
              <span class="font-medium">{{ lang.name }}</span>
              <span class="material-icons text-sm" v-if="currentLocale === lang.code">check_circle</span>
            </button>
          </div>
        </div>

        <!-- Theme -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
            {{ $t('profile.theme') }}
          </label>
          <div class="flex gap-3">
            <button
              @click="uiStore.setDarkMode(false)"
              class="flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 transition-all"
              :class="!uiStore.darkMode
                ? 'border-purple-600 bg-purple-50 text-purple-700'
                : 'border-gray-200 hover:border-gray-300 text-gray-700'"
            >
              <span class="material-icons">light_mode</span>
              <span class="font-medium">{{ $t('common.lightMode') }}</span>
            </button>
            <button
              @click="uiStore.setDarkMode(true)"
              class="flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 transition-all"
              :class="uiStore.darkMode
                ? 'border-purple-600 bg-purple-900/20 text-purple-300'
                : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500 text-gray-700 dark:text-slate-300'"
            >
              <span class="material-icons">dark_mode</span>
              <span class="font-medium">{{ $t('common.darkMode') }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Security -->
    <div class="bg-white dark:bg-slate-800 rounded-lg shadow">
      <div class="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
        <h2 class="text-lg font-semibold text-gray-800 dark:text-white flex items-center gap-2">
          <span class="material-icons text-purple-600">security</span>
          {{ $t('profile.security') }}
        </h2>
      </div>
      <div class="p-6">
        <button
          @click="showPasswordModal = true"
          class="btn-secondary flex items-center gap-2"
        >
          <span class="material-icons">lock</span>
          {{ $t('profile.changePassword') }}
        </button>
      </div>
    </div>

    <!-- Password Change Modal -->
    <Modal
      v-model="showPasswordModal"
      :title="$t('profile.changePassword')"
      size="sm"
      @close="closePasswordModal"
    >
      <form @submit.prevent="handlePasswordChange" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
            {{ $t('profile.currentPassword') }}
          </label>
          <input
            v-model="passwordForm.currentPassword"
            type="password"
            class="form-input w-full"
            required
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
            {{ $t('profile.newPassword') }}
          </label>
          <input
            v-model="passwordForm.newPassword"
            type="password"
            class="form-input w-full"
            required
            minlength="6"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
            {{ $t('profile.confirmPassword') }}
          </label>
          <input
            v-model="passwordForm.confirmPassword"
            type="password"
            class="form-input w-full"
            required
          />
          <p v-if="passwordError" class="text-red-500 text-sm mt-1">{{ passwordError }}</p>
        </div>
      </form>

      <template #footer>
        <div class="flex justify-end gap-3">
          <button
            type="button"
            @click="closePasswordModal"
            class="btn-secondary"
          >
            {{ $t('common.cancel') }}
          </button>
          <button
            type="button"
            @click="handlePasswordChange"
            :disabled="savingPassword"
            class="btn-primary flex items-center gap-2"
          >
            <span v-if="savingPassword" class="animate-spin material-icons text-lg">refresh</span>
            {{ $t('common.save') }}
          </button>
        </div>
      </template>
    </Modal>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import { useAuthStore } from '@/stores/auth'
import { useUIStore } from '@/stores/ui'
import Modal from '@/components/common/Modal.vue'
import authService from '@/services/authService'

const { t, locale } = useI18n()
const toast = useToast()
const authStore = useAuthStore()
const uiStore = useUIStore()

// Languages
const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' }
]

const currentLocale = computed(() => locale.value)

const changeLanguage = (lang) => {
  locale.value = lang
  localStorage.setItem('language', lang)
  toast.success(t('profile.languageChanged'))
}

// Helpers
const getInitials = (name) => {
  if (!name) return 'U'
  const parts = name.split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

const getRoleName = () => {
  const role = authStore.user?.role
  const roleNames = {
    platformAdmin: t('user.roles.platformAdmin'),
    partnerAdmin: t('user.roles.partnerAdmin'),
    agencyAdmin: t('user.roles.agencyAdmin'),
    agencyUser: t('user.roles.agencyUser')
  }
  return roleNames[role] || role
}

// Password change
const showPasswordModal = ref(false)
const savingPassword = ref(false)
const passwordError = ref('')

const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const closePasswordModal = () => {
  showPasswordModal.value = false
  passwordForm.currentPassword = ''
  passwordForm.newPassword = ''
  passwordForm.confirmPassword = ''
  passwordError.value = ''
}

const handlePasswordChange = async () => {
  passwordError.value = ''

  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    passwordError.value = t('profile.passwordMismatch')
    return
  }

  if (passwordForm.newPassword.length < 6) {
    passwordError.value = t('profile.passwordTooShort')
    return
  }

  savingPassword.value = true
  try {
    await authService.changePassword(
      passwordForm.currentPassword,
      passwordForm.newPassword
    )
    toast.success(t('profile.passwordChanged'))
    closePasswordModal()
  } catch (error) {
    const message = error.response?.data?.message
    if (message === 'INVALID_PASSWORD') {
      passwordError.value = t('profile.invalidCurrentPassword')
    } else {
      toast.error(t('common.operationFailed'))
    }
  } finally {
    savingPassword.value = false
  }
}
</script>
