<template>
  <div class="flex h-screen overflow-hidden bg-gray-100 dark:bg-slate-900">
    <!-- Mobile Backdrop -->
    <Transition
      enter-active-class="transition-opacity ease-linear duration-300"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity ease-linear duration-300"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="uiStore.isMobile && uiStore.sidebarOpen"
        class="fixed inset-0 bg-black/50 z-40"
        @click="uiStore.closeSidebar"
      ></div>
    </Transition>

    <!-- Sidebar -->
    <Transition
      enter-active-class="transition-transform ease-out duration-300"
      enter-from-class="-translate-x-full"
      enter-to-class="translate-x-0"
      leave-active-class="transition-transform ease-in duration-200"
      leave-from-class="translate-x-0"
      leave-to-class="-translate-x-full"
    >
      <Sidebar
        v-show="!uiStore.isMobile || uiStore.sidebarOpen"
        :class="[
          uiStore.isMobile ? 'fixed left-0 top-0 z-50 h-full' : ''
        ]"
        @navigate="handleNavigate"
      />
    </Transition>

    <!-- Main Content Area -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Header -->
      <Header
        :page-title="pageTitle"
        :page-description="pageDescription"
      >
        <template #actions>
          <slot name="headerActions"></slot>
        </template>
      </Header>

      <!-- Page Content -->
      <main class="flex-1 overflow-y-auto bg-gray-100 dark:bg-slate-900">
        <div class="px-4 md:px-6 py-4 md:py-8">
          <router-view v-slot="{ Component }">
            <Transition
              enter-active-class="transition ease-out duration-200"
              enter-from-class="opacity-0 transform translate-y-4"
              enter-to-class="opacity-100 transform translate-y-0"
              leave-active-class="transition ease-in duration-150"
              leave-from-class="opacity-100 transform translate-y-0"
              leave-to-class="opacity-0 transform -translate-y-4"
              mode="out-in"
            >
              <component :is="Component" />
            </Transition>
          </router-view>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import Sidebar from '@/components/Sidebar.vue'
import Header from '@/components/Header.vue'
import { useUIStore } from '@/stores/ui'

const route = useRoute()
const uiStore = useUIStore()

// Initialize UI store on mount
onMounted(() => {
  uiStore.initializeUI()
})

onUnmounted(() => {
  uiStore.cleanupUI()
})

// Close sidebar on route change (mobile only)
watch(() => route.path, () => {
  if (uiStore.isMobile) {
    uiStore.closeSidebar()
  }
})

// Handle navigation from sidebar
const handleNavigate = () => {
  if (uiStore.isMobile) {
    uiStore.closeSidebar()
  }
}

// Route metadata for page titles and descriptions
const routeMeta = {
  dashboard: {
    title: 'Dashboard',
    description: 'Overview and statistics'
  },
  partners: {
    title: 'Partners',
    description: 'Manage partner accounts'
  },
  profile: {
    title: 'Profile',
    description: 'Your account settings'
  }
}

const pageTitle = computed(() => routeMeta[route.name]?.title || 'Booking Engine')
const pageDescription = computed(() => routeMeta[route.name]?.description || '')
</script>

<style>
/* Global styles for layout consistency */
.container {
  max-width: 1280px;
}
</style>
