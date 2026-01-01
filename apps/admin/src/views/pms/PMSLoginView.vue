<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <!-- Logo & Title -->
      <div class="text-center mb-8">
        <!-- Partner Logo (if available) -->
        <div v-if="partnerInfo?.logo" class="mb-4">
          <img :src="partnerInfo.logo" alt="Logo" class="h-16 mx-auto" />
        </div>
        <!-- Default Icon -->
        <div v-else class="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/30">
          <span class="material-icons text-white text-3xl">hotel</span>
        </div>
        <h1 class="text-3xl font-bold text-white mb-2">
          {{ partnerInfo?.partnerName || 'PMS Giris' }}
        </h1>
        <p class="text-slate-400">Property Management System</p>
      </div>

      <!-- Loading Partner Info -->
      <div v-if="loadingPartner" class="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 text-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p class="text-gray-600 dark:text-slate-400">Partner bilgileri yukleniyor...</p>
      </div>

      <!-- Login Card -->
      <div v-else class="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8">
        <!-- Error Message -->
        <div v-if="error" class="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div class="flex items-center gap-2 text-red-600 dark:text-red-400">
            <span class="material-icons text-lg">error</span>
            <span class="text-sm">{{ error }}</span>
          </div>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-5">
          <!-- Partner Code (only show if not auto-detected from domain) -->
          <div v-if="!isCustomDomain">
            <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Partner Kodu
            </label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 material-icons text-gray-400 text-lg">
                business
              </span>
              <input
                v-model="form.partnerCode"
                type="text"
                required
                placeholder="Ornek: HOTEL001"
                class="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
              />
            </div>
          </div>

          <!-- Username -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Kullanici Adi
            </label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 material-icons text-gray-400 text-lg">
                person
              </span>
              <input
                v-model="form.username"
                type="text"
                required
                placeholder="Kullanici adinizi girin"
                class="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
              />
            </div>
          </div>

          <!-- Password -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
              Sifre
            </label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 material-icons text-gray-400 text-lg">
                lock
              </span>
              <input
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                required
                placeholder="Sifrenizi girin"
                class="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
              >
                <span class="material-icons text-lg">
                  {{ showPassword ? 'visibility_off' : 'visibility' }}
                </span>
              </button>
            </div>
          </div>

          <!-- Remember Me -->
          <div class="flex items-center justify-between">
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                v-model="form.rememberMe"
                type="checkbox"
                class="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span class="text-sm text-gray-600 dark:text-slate-400">Beni hatirla</span>
            </label>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            :disabled="loading"
            class="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <svg v-if="loading" class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>{{ loading ? 'Giris Yapiliyor...' : 'Giris Yap' }}</span>
          </button>
        </form>

        <!-- Back to Admin Link (only show on default domain) -->
        <div v-if="!isCustomDomain" class="mt-6 text-center">
          <RouterLink
            to="/login"
            class="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
          >
            Admin Paneline Don
          </RouterLink>
        </div>
      </div>

      <!-- Footer -->
      <p class="mt-8 text-center text-sm text-slate-500">
        &copy; {{ new Date().getFullYear() }} Property Management System
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { usePmsAuthStore } from '@/stores/pms/pmsAuth'
import pmsAuthService from '@/services/pms/pmsAuthService'

const router = useRouter()
const pmsAuthStore = usePmsAuthStore()

const loading = ref(false)
const loadingPartner = ref(false)
const error = ref('')
const showPassword = ref(false)
const partnerInfo = ref(null)
const currentDomain = ref('')

const form = reactive({
  partnerCode: '',
  username: '',
  password: '',
  rememberMe: false
})

// Check if we're on a custom domain (not localhost or default admin domain)
const isCustomDomain = computed(() => {
  const hostname = window.location.hostname
  const defaultDomains = ['localhost', '127.0.0.1', 'admin.booking-engine.com']
  return !defaultDomains.some(d => hostname.includes(d)) && partnerInfo.value !== null
})

// Detect partner from domain on mount
onMounted(async () => {
  const hostname = window.location.hostname
  const defaultDomains = ['localhost', '127.0.0.1', 'admin.booking-engine.com']

  // Only try to detect partner if not on a default domain
  if (!defaultDomains.some(d => hostname.includes(d))) {
    currentDomain.value = hostname
    loadingPartner.value = true

    try {
      const response = await pmsAuthService.getPartnerByDomain(hostname)
      if (response.success && response.data) {
        partnerInfo.value = response.data
      }
    } catch (err) {
      // Domain not found - show regular login with partner code
      console.log('No partner found for domain:', hostname)
    } finally {
      loadingPartner.value = false
    }
  }
})

const handleLogin = async () => {
  loading.value = true
  error.value = ''

  try {
    const credentials = {
      username: form.username,
      password: form.password
    }

    // Use domain-based login if we detected a partner, otherwise use partner code
    if (isCustomDomain.value && partnerInfo.value?.partnerId) {
      credentials.partnerId = partnerInfo.value.partnerId
    } else {
      credentials.partnerCode = form.partnerCode
    }

    const result = await pmsAuthStore.login(credentials)

    if (result.requiresHotelSelection) {
      // User has multiple hotels, redirect to hotel selection
      router.push({ name: 'pms-select-hotel' })
    } else {
      // Single hotel, go directly to dashboard
      router.push({ name: 'pms-dashboard' })
    }
  } catch (err) {
    console.error('Login error:', err)
    error.value = err.response?.data?.message || 'Giris basarisiz. Lutfen bilgilerinizi kontrol edin.'
  } finally {
    loading.value = false
  }
}
</script>
