<template>
  <header class="bg-white dark:bg-slate-800 shadow-sm border-b border-gray-200 dark:border-slate-700">
    <div class="px-4 md:px-6 py-3 flex justify-between items-center">
      <!-- Left side: Hamburger + Hotel Name -->
      <div class="flex items-center gap-3">
        <!-- Hamburger Menu (Mobile Only) -->
        <button
          v-if="uiStore.isMobile"
          @click="uiStore.toggleSidebar"
          class="p-2 text-gray-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path v-if="!uiStore.sidebarOpen" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
            <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <!-- Hotel Info -->
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
            <span class="material-icons text-indigo-600 dark:text-indigo-400">hotel</span>
          </div>
          <div>
            <h1 class="text-lg font-semibold text-gray-800 dark:text-white">
              {{ hotelName }}
            </h1>
            <p class="text-xs text-gray-500 dark:text-slate-400">
              Property Management System
            </p>
          </div>
        </div>
      </div>

      <!-- Right side: Date, User -->
      <div class="flex items-center gap-4">
        <!-- Current Date/Time -->
        <div class="hidden md:block text-right">
          <p class="text-sm font-medium text-gray-800 dark:text-white">{{ currentDate }}</p>
          <p class="text-xs text-gray-500 dark:text-slate-400">{{ currentTime }}</p>
        </div>

        <!-- User Menu -->
        <div class="relative" ref="userMenuRef">
          <button
            @click="showUserMenu = !showUserMenu"
            class="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
          >
            <div class="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
              {{ getInitials(fullName) }}
            </div>
            <div class="hidden md:block text-left">
              <p class="text-sm font-medium text-gray-800 dark:text-white">{{ fullName }}</p>
              <p class="text-xs text-gray-500 dark:text-slate-400">Partner Admin</p>
            </div>
            <svg class="w-4 h-4 text-gray-400 hidden md:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <!-- Dropdown Menu -->
          <Transition
            enter-active-class="transition ease-out duration-100"
            enter-from-class="transform opacity-0 scale-95"
            enter-to-class="transform opacity-100 scale-100"
            leave-active-class="transition ease-in duration-75"
            leave-from-class="transform opacity-100 scale-100"
            leave-to-class="transform opacity-0 scale-95"
          >
            <div
              v-if="showUserMenu"
              class="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 py-1 z-50"
            >
              <!-- User Info -->
              <div class="px-4 py-3 border-b border-gray-200 dark:border-slate-700">
                <p class="text-sm font-medium text-gray-800 dark:text-white">{{ fullName }}</p>
                <p class="text-xs text-gray-500 dark:text-slate-400">{{ authStore.user?.email }}</p>
              </div>

              <!-- Menu Items -->
              <div class="py-1">
                <!-- Dark Mode Toggle -->
                <button
                  @click="uiStore.toggleDarkMode"
                  class="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-3"
                >
                  <span class="material-icons text-lg">{{ uiStore.darkMode ? 'light_mode' : 'dark_mode' }}</span>
                  {{ uiStore.darkMode ? 'Acik Tema' : 'Koyu Tema' }}
                </button>

                <!-- Profile -->
                <RouterLink
                  to="/profile"
                  @click="showUserMenu = false"
                  class="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-3"
                >
                  <span class="material-icons text-lg">person</span>
                  Profil
                </RouterLink>
              </div>

              <!-- Back to Admin -->
              <div class="py-1 border-t border-gray-200 dark:border-slate-700">
                <RouterLink
                  to="/dashboard"
                  @click="showUserMenu = false"
                  class="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 flex items-center gap-3"
                >
                  <span class="material-icons text-lg">arrow_back</span>
                  Admin Panel
                </RouterLink>
              </div>
            </div>
          </Transition>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useUIStore } from '@/stores/ui'
import { useAuthStore } from '@/stores/auth'
import { useHotelStore } from '@/stores/hotel'

const uiStore = useUIStore()
const authStore = useAuthStore()
const hotelStore = useHotelStore()

const showUserMenu = ref(false)
const userMenuRef = ref(null)

// Current date/time
const currentDate = ref('')
const currentTime = ref('')
let timeInterval = null

const updateDateTime = () => {
  const now = new Date()
  currentDate.value = now.toLocaleDateString('tr-TR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  currentTime.value = now.toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(() => {
  updateDateTime()
  timeInterval = setInterval(updateDateTime, 60000)
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  if (timeInterval) clearInterval(timeInterval)
  document.removeEventListener('click', handleClickOutside)
})

const handleClickOutside = (event) => {
  if (userMenuRef.value && !userMenuRef.value.contains(event.target)) {
    showUserMenu.value = false
  }
}

const hotelName = computed(() => {
  const hotel = hotelStore.selectedHotel
  if (!hotel) return 'PMS'
  return hotel.name?.tr || hotel.name?.en || hotel.name || 'Isimsiz Otel'
})

const fullName = computed(() => {
  const user = authStore.user
  if (!user) return 'User'
  return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name || user.email
})

const getInitials = (name) => {
  if (!name) return 'U'
  const parts = name.split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}
</script>
