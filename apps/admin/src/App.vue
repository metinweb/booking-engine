<template>
  <div>
    <RouterView />
    <!-- Development: Missing translation keys panel -->
    <MissingKeysPanel v-if="isDev" />
  </div>
</template>

<script setup>
import { onMounted, watch } from 'vue'
import { useSocket } from '@/composables/useSocket'
import MissingKeysPanel from '@/components/dev/MissingKeysPanel.vue'

const isDev = import.meta.env.DEV

// Stores initialized lazily to avoid Pinia initialization issues during HMR
let authStore = null
let notificationStore = null

const getStores = async () => {
  if (!authStore) {
    const { useAuthStore } = await import('@/stores/auth')
    const { useNotificationStore } = await import('@/stores/notification')
    authStore = useAuthStore()
    notificationStore = useNotificationStore()
  }
  return { authStore, notificationStore }
}

// Initialize notifications when user is authenticated
const initNotifications = async () => {
  const { authStore, notificationStore } = await getStores()
  const { authenticate, on } = useSocket()

  if (authStore.isAuthenticated && authStore.user?._id) {
    // Determine user type
    const userType = authStore.user.role === 'pms_admin' || authStore.user.role?.startsWith('pms_')
      ? 'PMSUser'
      : 'User'

    // Authenticate socket for user-specific notifications
    authenticate(authStore.user._id, userType)

    // Listen for new notifications
    on('notification:new', (data) => {
      notificationStore.handleNewNotification(data.notification)
    })

    // Listen for notification count updates
    on('notification:count', (data) => {
      notificationStore.handleCountUpdate(data.count)
    })

    // Fetch initial unread count
    await notificationStore.init()
  }
}

onMounted(async () => {
  const { authStore, notificationStore } = await getStores()

  // Watch for auth changes
  watch(() => authStore.isAuthenticated, (isAuth) => {
    if (isAuth) {
      initNotifications()
    } else {
      // Clear notifications on logout
      notificationStore.clearNotifications()
    }
  })

  // Check if user is already authenticated on app load
  await authStore.checkAuth()

  // Initialize notifications if already authenticated
  if (authStore.isAuthenticated) {
    await initNotifications()
  }
})
</script>

<style>
/* Remove default margins and ensure full height */
html, body, #app {
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

/* Ensure smooth scrolling */
html {
  scroll-behavior: smooth;
}

/* Focus styles */
:focus {
  outline: 2px solid theme('colors.purple.500');
  outline-offset: 2px;
}

/* Custom selection color */
::selection {
  background-color: theme('colors.purple.200');
  color: theme('colors.purple.900');
}
</style>