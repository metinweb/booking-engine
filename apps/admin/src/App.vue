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
// NOTE: PMS users are handled by PmsProvider.vue, this is only for regular users
const initNotifications = async () => {
  const { authStore, notificationStore } = await getStores()
  const { authenticate, on } = useSocket()

  // Skip if PMS user - PmsProvider handles PMS user notifications
  const pmsToken = localStorage.getItem('pmsToken')
  if (pmsToken) {
    console.log('[App] PMS user detected, skipping - PmsProvider handles notifications')
    return
  }

  // Only handle regular users (Partner/Admin)
  if (!authStore.isAuthenticated || !authStore.user?._id) {
    return
  }

  const userId = authStore.user._id
  console.log('[App] Authenticating socket for notifications:', { userId, userType: 'User' })
  authenticate(userId, 'User')

  // Listen for new notifications
  on('notification:new', data => {
    console.log('[App] Received notification:new event:', data)
    notificationStore.handleNewNotification(data.notification)
  })

  // Listen for notification count updates
  on('notification:count', data => {
    notificationStore.handleCountUpdate(data.count)
  })

  // Fetch initial unread count
  await notificationStore.init()
}

onMounted(async () => {
  const { authStore, notificationStore } = await getStores()

  // Watch for auth changes (regular users only, PMS handled by PmsProvider)
  watch(
    () => authStore.isAuthenticated,
    isAuth => {
      if (isAuth) {
        initNotifications()
      } else {
        // Clear notifications on logout (only if no PMS session)
        if (!localStorage.getItem('pmsToken')) {
          notificationStore.clearNotifications()
        }
      }
    }
  )

  // Check if user is already authenticated on app load
  await authStore.checkAuth()

  // Initialize notifications for regular users only
  // PMS users are handled by PmsProvider
  if (authStore.isAuthenticated) {
    await initNotifications()
  }
})
</script>

<style>
/* Remove default margins and ensure full height */
html,
body,
#app {
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
