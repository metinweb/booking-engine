<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 flex items-center justify-center p-4">
    <div class="w-full max-w-2xl">
      <!-- Header -->
      <div class="text-center mb-8">
        <div class="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/30">
          <span class="material-icons text-white text-3xl">hotel</span>
        </div>
        <h1 class="text-3xl font-bold text-white mb-2">Otel Secin</h1>
        <p class="text-slate-400">
          Hosgeldiniz, <span class="text-indigo-400">{{ pmsAuthStore.fullName }}</span>
        </p>
        <p class="text-slate-500 text-sm mt-1">Calisacaginiz oteli secin</p>
      </div>

      <!-- Hotel Selection Card -->
      <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6">
        <!-- Error Message -->
        <div v-if="error" class="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div class="flex items-center gap-2 text-red-600 dark:text-red-400">
            <span class="material-icons text-lg">error</span>
            <span class="text-sm">{{ error }}</span>
          </div>
        </div>

        <!-- Hotels Grid -->
        <div class="grid gap-4 sm:grid-cols-2">
          <button
            v-for="hotel in pmsAuthStore.assignedHotels"
            :key="hotel.id"
            @click="selectHotel(hotel.id)"
            :disabled="loading === hotel.id"
            class="relative p-5 rounded-xl border-2 transition-all duration-200 text-left group"
            :class="[
              loading === hotel.id
                ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/30'
                : 'border-gray-200 dark:border-slate-600 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'
            ]"
          >
            <!-- Loading Overlay -->
            <div
              v-if="loading === hotel.id"
              class="absolute inset-0 bg-white/50 dark:bg-slate-800/50 rounded-xl flex items-center justify-center"
            >
              <svg class="animate-spin h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>

            <!-- Hotel Icon -->
            <div class="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-800/50 transition-colors">
              <span class="material-icons text-indigo-600 dark:text-indigo-400 text-xl">business</span>
            </div>

            <!-- Hotel Info -->
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-1">
              {{ hotel.name }}
            </h3>
            <p class="text-sm text-gray-500 dark:text-slate-400">
              {{ getRoleLabel(hotel.role) }}
            </p>

            <!-- Arrow Icon -->
            <span class="absolute right-4 top-1/2 -translate-y-1/2 material-icons text-gray-300 dark:text-slate-600 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors">
              arrow_forward
            </span>
          </button>
        </div>

        <!-- No Hotels -->
        <div v-if="!pmsAuthStore.assignedHotels?.length" class="text-center py-8">
          <span class="material-icons text-4xl text-gray-300 dark:text-slate-600 mb-3">hotel</span>
          <p class="text-gray-500 dark:text-slate-400">Atanmis otel bulunamadi</p>
        </div>
      </div>

      <!-- Logout Link -->
      <div class="mt-6 text-center">
        <button
          @click="handleLogout"
          class="text-sm text-slate-400 hover:text-slate-300 transition-colors inline-flex items-center gap-1"
        >
          <span class="material-icons text-base">logout</span>
          <span>Cikis Yap</span>
        </button>
      </div>

      <!-- Footer -->
      <p class="mt-8 text-center text-sm text-slate-500">
        &copy; {{ new Date().getFullYear() }} Property Management System
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePmsAuthStore } from '@/stores/pms/pmsAuth'

const router = useRouter()
const pmsAuthStore = usePmsAuthStore()

const loading = ref(null)
const error = ref('')

onMounted(() => {
  // If user doesn't need hotel selection, redirect
  if (!pmsAuthStore.requiresHotelSelection && pmsAuthStore.currentHotel) {
    router.push({ name: 'pms-dashboard' })
  }

  // If no assigned hotels, redirect to login
  if (!pmsAuthStore.assignedHotels?.length) {
    router.push({ name: 'pms-login' })
  }
})

const getRoleLabel = (role) => {
  const labels = {
    pms_admin: 'PMS Admin',
    front_desk_manager: 'Front Desk Manager',
    receptionist: 'Resepsiyonist',
    night_auditor: 'Gece Denetcisi',
    housekeeping_supervisor: 'HK Supervisor',
    housekeeper: 'Housekeeper',
    revenue_manager: 'Revenue Manager',
    guest_relations: 'Guest Relations'
  }
  return labels[role] || role
}

const selectHotel = async (hotelId) => {
  loading.value = hotelId
  error.value = ''

  try {
    await pmsAuthStore.selectHotel(hotelId)
    router.push({ name: 'pms-dashboard' })
  } catch (err) {
    console.error('Hotel selection error:', err)
    error.value = err.response?.data?.message || 'Otel secilemedi. Lutfen tekrar deneyin.'
  } finally {
    loading.value = null
  }
}

const handleLogout = () => {
  pmsAuthStore.logout()
  router.push({ name: 'pms-login' })
}
</script>
