<template>
  <aside
    class="bg-slate-800 flex flex-col py-4 border-r border-slate-700 h-screen overflow-y-auto overflow-x-hidden transition-all duration-300"
    :class="expanded ? 'w-56' : 'w-16'"
  >
    <!-- Logo / PMS Brand -->
    <div class="flex items-center px-3 mb-6" :class="expanded ? 'justify-between' : 'justify-center'">
      <div class="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
        <span class="material-icons text-white text-xl">hotel</span>
      </div>
      <span v-if="expanded" class="text-lg font-semibold text-white ml-3 truncate">
        PMS
      </span>
    </div>

    <!-- Hotel Info -->
    <div v-if="currentHotel || hotelStore.selectedHotel" class="px-3 mb-4">
      <div
        class="p-2 rounded-lg bg-slate-700/50"
        :class="expanded ? '' : 'flex justify-center'"
        :title="hotelName"
      >
        <div v-if="expanded" class="flex items-center">
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-white truncate">{{ hotelName }}</p>
            <p class="text-xs text-slate-400 truncate">{{ displayUserName }}</p>
          </div>
        </div>
        <span v-else class="material-icons text-slate-400 text-lg">business</span>
      </div>
    </div>

    <!-- Main Navigation -->
    <nav class="flex flex-col flex-1 px-2">
      <RouterLink
        v-for="item in menuItems"
        :key="item.name"
        :to="item.to"
        class="flex items-center rounded-lg transition-colors duration-200 cursor-pointer group relative mb-1"
        :class="[
          expanded ? 'px-3 py-2.5' : 'p-3 justify-center',
          {
            'text-white bg-indigo-600': isActive(item.to),
            'text-slate-300 hover:text-white hover:bg-slate-700': !isActive(item.to)
          }
        ]"
        :title="!expanded ? item.label : ''"
        @click="emit('navigate')"
      >
        <span class="material-icons flex-shrink-0 text-xl">{{ item.icon }}</span>

        <span v-if="expanded" class="ml-3 text-sm font-medium truncate">
          {{ item.label }}
        </span>

        <!-- Tooltip (only when collapsed) -->
        <span
          v-if="!expanded"
          class="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-50 pointer-events-none transition-opacity"
        >
          {{ item.label }}
        </span>
      </RouterLink>
    </nav>

    <!-- Bottom Section -->
    <div class="mt-auto pt-4 px-2 border-t border-slate-700">
      <!-- Toggle Expand -->
      <button
        @click="toggleExpanded"
        class="w-full flex items-center rounded-lg transition-colors duration-200 cursor-pointer text-slate-400 hover:text-white hover:bg-slate-700 mb-2"
        :class="expanded ? 'px-3 py-2.5' : 'p-3 justify-center'"
      >
        <span class="material-icons flex-shrink-0 transition-transform" :class="{ 'rotate-180': expanded }">
          chevron_right
        </span>
        <span v-if="expanded" class="ml-3 text-sm font-medium truncate">
          Daralt
        </span>
      </button>

      <!-- Back to Admin (Partner only) -->
      <RouterLink
        v-if="showBackToAdmin"
        to="/dashboard"
        class="flex items-center rounded-lg transition-colors duration-200 cursor-pointer text-slate-400 hover:text-white hover:bg-slate-700"
        :class="expanded ? 'px-3 py-2.5' : 'p-3 justify-center'"
        :title="!expanded ? 'Admin Panel' : ''"
      >
        <span class="material-icons flex-shrink-0 text-xl">arrow_back</span>
        <span v-if="expanded" class="ml-3 text-sm font-medium truncate">
          Admin Panel
        </span>
      </RouterLink>

      <!-- Logout (PMS user only) -->
      <button
        v-if="isPmsUser"
        @click="pmsAuthStore.logout()"
        class="w-full flex items-center rounded-lg transition-colors duration-200 cursor-pointer text-slate-400 hover:text-white hover:bg-slate-700"
        :class="expanded ? 'px-3 py-2.5' : 'p-3 justify-center'"
        :title="!expanded ? 'Cikis Yap' : ''"
      >
        <span class="material-icons flex-shrink-0 text-xl">logout</span>
        <span v-if="expanded" class="ml-3 text-sm font-medium truncate">
          Cikis Yap
        </span>
      </button>
    </div>
  </aside>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useHotelStore } from '@/stores/hotel'
import { usePmsAuthStore } from '@/stores/pms/pmsAuth'
import { usePmsContextInjection } from '@/composables/usePmsContext'

const route = useRoute()
const authStore = useAuthStore()
const hotelStore = useHotelStore()
const pmsAuthStore = usePmsAuthStore()
const { isPmsUser, currentHotel } = usePmsContextInjection()

const emit = defineEmits(['navigate'])

const expanded = ref(true)

const toggleExpanded = () => {
  expanded.value = !expanded.value
}

const isActive = (path) => {
  return route.path === path || route.path.startsWith(path + '/')
}

const hotelName = computed(() => {
  const hotel = currentHotel.value || hotelStore.selectedHotel
  if (!hotel) return 'PMS'
  return hotel.name?.tr || hotel.name?.en || hotel.name || 'Isimsiz Otel'
})

// Permission check helper - Partner users have full access
const hasAccess = (permissions) => {
  if (!isPmsUser.value) return true // Partner has full access
  return pmsAuthStore.hasAnyPermission(permissions)
}

// All menu items with permission requirements
const allMenuItems = [
  { name: 'dashboard', to: '/pms/dashboard', icon: 'dashboard', label: 'Dashboard', permissions: [] },
  { name: 'reservations', to: '/pms/reservations', icon: 'event_note', label: 'Rezervasyonlar', permissions: ['reservations.view'] },
  { name: 'front-desk', to: '/pms/front-desk', icon: 'meeting_room', label: 'Front Desk', permissions: ['frontdesk.checkin', 'frontdesk.checkout', 'frontdesk.walkin'] },
  { name: 'housekeeping', to: '/pms/housekeeping', icon: 'cleaning_services', label: 'Housekeeping', permissions: ['housekeeping.view'] },
  { name: 'guests', to: '/pms/guests', icon: 'people', label: 'Misafirler', permissions: ['guests.view'] },
  { name: 'billing', to: '/pms/billing', icon: 'receipt_long', label: 'Faturalandirma', permissions: ['billing.view', 'billing.invoice'] },
  { name: 'cashier', to: '/pms/cashier', icon: 'point_of_sale', label: 'Kasa', permissions: ['billing.view', 'billing.payment'] },
  { name: 'room-plan', to: '/pms/room-plan', icon: 'calendar_view_month', label: 'Oda Plani', permissions: ['reservations.view', 'frontdesk.roomMove'] },
  { name: 'kbs', to: '/pms/kbs', icon: 'badge', label: 'KBS Bildirimi', permissions: ['guests.view'] },
  { name: 'night-audit', to: '/pms/night-audit', icon: 'nightlight', label: 'Gece Audit', permissions: ['reports.operational', 'reports.financial'] },
  { name: 'reports', to: '/pms/reports', icon: 'assessment', label: 'Raporlar', permissions: ['reports.operational', 'reports.financial'] },
  { name: 'settings', to: '/pms/settings', icon: 'settings', label: 'Ayarlar', partnerOnly: true }
]

// Filter menu items based on user's permissions
const menuItems = computed(() => {
  return allMenuItems.filter(item => {
    // Settings is partner-only
    if (item.partnerOnly) {
      return !isPmsUser.value
    }
    // Check permissions
    return hasAccess(item.permissions || [])
  })
})

// Show back to admin button only for Partner users
const showBackToAdmin = computed(() => !isPmsUser.value)

// Show user name (PMS user or partner user)
const displayUserName = computed(() => {
  if (isPmsUser.value) {
    return pmsAuthStore.fullName
  }
  return `${authStore.user?.firstName || ''} ${authStore.user?.lastName || ''}`.trim()
})
</script>

<style scoped>
aside::-webkit-scrollbar {
  width: 4px;
}

aside::-webkit-scrollbar-track {
  background: transparent;
}

aside::-webkit-scrollbar-thumb {
  background: #475569;
  border-radius: 2px;
}
</style>
