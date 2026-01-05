<template>
  <div ref="containerRef" class="relative">
    <!-- Bell Button -->
    <button
      class="relative p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
      :title="$t('notifications.title')"
      @click="togglePanel"
    >
      <span class="material-icons text-xl">notifications</span>

      <!-- Badge -->
      <span
        v-if="unreadCount > 0"
        class="absolute -top-1 -right-1 min-w-[20px] h-5 flex items-center justify-center bg-red-500 text-white text-xs font-bold rounded-full px-1 animate-pulse"
      >
        {{ unreadCount > 99 ? '99+' : unreadCount }}
      </span>
    </button>

    <!-- Dropdown Panel (Teleport to body) -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition ease-out duration-200"
        enter-from-class="transform opacity-0 scale-95"
        enter-to-class="transform opacity-100 scale-100"
        leave-active-class="transition ease-in duration-150"
        leave-from-class="transform opacity-100 scale-100"
        leave-to-class="transform opacity-0 scale-95"
      >
        <div
          v-if="isOpen"
          :style="dropdownStyle"
          class="fixed w-96 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-200 dark:border-slate-700 z-[9999] overflow-hidden"
        >
          <!-- Header -->
          <div
            class="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50"
          >
            <h3 class="font-semibold text-gray-900 dark:text-white">
              {{ $t('notifications.title') }}
            </h3>
            <button
              v-if="unreadCount > 0"
              class="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
              @click="handleMarkAllAsRead"
            >
              {{ $t('notifications.markAllRead') }}
            </button>
          </div>

          <!-- Loading State -->
          <div v-if="isLoading" class="py-8 text-center">
            <div
              class="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"
            ></div>
          </div>

          <!-- Notification List -->
          <div v-else class="max-h-[400px] overflow-y-auto">
            <div
              v-for="notification in notifications"
              :key="notification._id"
              class="px-4 py-3 border-b border-gray-100 dark:border-slate-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
              :class="{ 'bg-blue-50 dark:bg-blue-900/20': !notification.isRead }"
              @click="handleNotificationClick(notification)"
            >
              <div class="flex gap-3">
                <!-- Icon -->
                <div
                  class="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                  :class="getIconBgClass(notification.color)"
                >
                  <span
                    class="material-icons text-lg"
                    :class="getIconTextClass(notification.color)"
                  >
                    {{ notification.icon || 'notifications' }}
                  </span>
                </div>

                <!-- Content -->
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ notification.title }}
                  </p>
                  <p class="text-sm text-gray-500 dark:text-slate-400 truncate">
                    {{ notification.message }}
                  </p>
                  <p class="text-xs text-gray-400 dark:text-slate-500 mt-1">
                    {{ formatTime(notification.createdAt) }}
                  </p>
                </div>

                <!-- Unread Indicator -->
                <div v-if="!notification.isRead" class="flex-shrink-0 self-center">
                  <span class="w-2.5 h-2.5 bg-blue-500 rounded-full block"></span>
                </div>
              </div>
            </div>

            <!-- Empty State -->
            <div
              v-if="notifications.length === 0"
              class="py-12 text-center text-gray-500 dark:text-slate-400"
            >
              <span class="material-icons text-5xl mb-3 text-gray-300 dark:text-slate-600">
                notifications_none
              </span>
              <p>{{ $t('notifications.noNotifications') }}</p>
            </div>
          </div>

          <!-- Footer -->
          <div
            v-if="notifications.length > 0"
            class="px-4 py-3 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50"
          >
            <router-link
              to="/notifications"
              class="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
              @click="closePanel"
            >
              {{ $t('notifications.viewAll') }}
            </router-link>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Overlay to close panel -->
    <Teleport to="body">
      <div v-if="isOpen" class="fixed inset-0 z-[9998]" @click="closePanel"></div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useNotificationStore } from '@/stores/notification'
import { useRouter } from 'vue-router'
import { formatDistanceToNow } from 'date-fns'
import { tr, enUS } from 'date-fns/locale'
import { useI18n } from 'vue-i18n'

const router = useRouter()
const { locale } = useI18n()
const notificationStore = useNotificationStore()
const containerRef = ref(null)

// Dropdown positioning
const dropdownStyle = ref({ top: '0px', right: '0px' })
const DROPDOWN_HEIGHT = 500

const updateDropdownPosition = () => {
  if (!containerRef.value) return

  const rect = containerRef.value.getBoundingClientRect()
  const viewportHeight = window.innerHeight
  const viewportWidth = window.innerWidth

  const spaceBelow = viewportHeight - rect.bottom
  const spaceAbove = rect.top
  const openAbove = spaceBelow < DROPDOWN_HEIGHT && spaceAbove > spaceBelow

  // Calculate right position to keep dropdown within viewport
  const rightPos = Math.max(16, viewportWidth - rect.right)

  if (openAbove) {
    dropdownStyle.value = {
      bottom: `${viewportHeight - rect.top + 8}px`,
      top: 'auto',
      right: `${rightPos}px`
    }
  } else {
    dropdownStyle.value = {
      top: `${rect.bottom + 8}px`,
      bottom: 'auto',
      right: `${rightPos}px`
    }
  }
}

// Computed from store
const notifications = computed(() => notificationStore.recentNotifications)
const unreadCount = computed(() => notificationStore.unreadCount)
const isOpen = computed(() => notificationStore.isOpen)
const isLoading = computed(() => notificationStore.isLoading)

// Watch for panel open to update position
watch(isOpen, open => {
  if (open) {
    updateDropdownPosition()
  }
})

// Methods
const togglePanel = () => {
  notificationStore.togglePanel()
}

const closePanel = () => {
  notificationStore.closePanel()
}

const handleMarkAllAsRead = async () => {
  await notificationStore.markAllAsRead()
}

const handleNotificationClick = async notification => {
  // Mark as read
  if (!notification.isRead) {
    await notificationStore.markAsRead(notification._id)
  }

  // Navigate if there's an action URL
  if (notification.actionUrl) {
    closePanel()
    router.push(notification.actionUrl)
  }
}

const formatTime = dateString => {
  if (!dateString) return ''
  try {
    const date = new Date(dateString)
    const localeObj = locale.value === 'tr' ? tr : enUS
    return formatDistanceToNow(date, { addSuffix: true, locale: localeObj })
  } catch {
    return ''
  }
}

// Icon styling helpers
const getIconBgClass = color => {
  const classes = {
    green: 'bg-green-100 dark:bg-green-900/30',
    blue: 'bg-blue-100 dark:bg-blue-900/30',
    red: 'bg-red-100 dark:bg-red-900/30',
    amber: 'bg-amber-100 dark:bg-amber-900/30',
    gray: 'bg-gray-100 dark:bg-gray-700',
    purple: 'bg-purple-100 dark:bg-purple-900/30',
    indigo: 'bg-indigo-100 dark:bg-indigo-900/30'
  }
  return classes[color] || classes.blue
}

const getIconTextClass = color => {
  const classes = {
    green: 'text-green-600 dark:text-green-400',
    blue: 'text-blue-600 dark:text-blue-400',
    red: 'text-red-600 dark:text-red-400',
    amber: 'text-amber-600 dark:text-amber-400',
    gray: 'text-gray-600 dark:text-gray-400',
    purple: 'text-purple-600 dark:text-purple-400',
    indigo: 'text-indigo-600 dark:text-indigo-400'
  }
  return classes[color] || classes.blue
}


// Keyboard escape to close
const handleEscape = event => {
  if (event.key === 'Escape' && isOpen.value) {
    closePanel()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleEscape)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscape)
})
</script>
