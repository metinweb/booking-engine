import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useToast } from 'vue-toastification'
import notificationService from '@/services/notificationService'
import { storeLogger } from '@/utils/logger'

export const useNotificationStore = defineStore('notification', () => {
  // State
  const notifications = ref([])
  const unreadCount = ref(0)
  const isLoading = ref(false)
  const isOpen = ref(false)
  const pagination = ref({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  })

  // Getters
  const hasUnread = computed(() => unreadCount.value > 0)
  const recentNotifications = computed(() => notifications.value.slice(0, 10))

  // Actions

  /**
   * Fetch notifications from API
   */
  async function fetchNotifications(params = {}) {
    isLoading.value = true
    try {
      const response = await notificationService.getNotifications({
        page: params.page || 1,
        limit: params.limit || 20,
        unreadOnly: params.unreadOnly || false
      })

      if (response.success) {
        notifications.value = response.data
        pagination.value = response.pagination
      }
    } catch (error) {
      storeLogger.error('Failed to fetch notifications:', error)
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Fetch unread count from API
   */
  async function fetchUnreadCount() {
    try {
      const response = await notificationService.getUnreadCount()
      if (response.success) {
        unreadCount.value = response.data.count
      }
    } catch (error) {
      storeLogger.error('Failed to fetch unread count:', error)
    }
  }

  /**
   * Mark a single notification as read
   */
  async function markAsRead(notificationId) {
    try {
      await notificationService.markAsRead(notificationId)

      // Update local state
      const notification = notifications.value.find(n => n._id === notificationId)
      if (notification && !notification.isRead) {
        notification.isRead = true
        notification.readAt = new Date().toISOString()
        unreadCount.value = Math.max(0, unreadCount.value - 1)
      }
    } catch (error) {
      storeLogger.error('Failed to mark notification as read:', error)
    }
  }

  /**
   * Mark all notifications as read
   */
  async function markAllAsRead() {
    try {
      await notificationService.markAllAsRead()

      // Update local state
      notifications.value.forEach(n => {
        n.isRead = true
        n.readAt = new Date().toISOString()
      })
      unreadCount.value = 0
    } catch (error) {
      storeLogger.error('Failed to mark all as read:', error)
    }
  }

  /**
   * Delete a notification
   */
  async function deleteNotification(notificationId) {
    try {
      await notificationService.deleteNotification(notificationId)

      // Remove from local state
      const index = notifications.value.findIndex(n => n._id === notificationId)
      if (index !== -1) {
        const notification = notifications.value[index]
        if (!notification.isRead) {
          unreadCount.value = Math.max(0, unreadCount.value - 1)
        }
        notifications.value.splice(index, 1)
      }
    } catch (error) {
      storeLogger.error('Failed to delete notification:', error)
    }
  }

  /**
   * Handle new notification from socket
   */
  function handleNewNotification(notification) {
    // Add to beginning of list
    notifications.value.unshift(notification)

    // Increment unread count
    unreadCount.value++

    // Show toast notification
    showNotificationToast(notification)
  }

  /**
   * Handle notification count update from socket
   */
  function handleCountUpdate(count) {
    unreadCount.value = count
  }

  /**
   * Show toast notification
   */
  function showNotificationToast(notification) {
    // Get toast instance when needed (not at store definition time)
    const toast = useToast()
    const toastOptions = {
      timeout: 5000,
      closeOnClick: true,
      pauseOnHover: true
    }

    // Determine toast type based on notification color
    const colorToType = {
      green: 'success',
      red: 'error',
      amber: 'warning',
      blue: 'info',
      gray: 'info',
      purple: 'info',
      indigo: 'info'
    }

    const toastType = colorToType[notification.color] || 'info'

    // Show toast with icon and message
    const message = `${notification.title}\n${notification.message}`

    switch (toastType) {
      case 'success':
        toast.success(message, toastOptions)
        break
      case 'error':
        toast.error(message, toastOptions)
        break
      case 'warning':
        toast.warning(message, toastOptions)
        break
      default:
        toast.info(message, toastOptions)
    }
  }

  /**
   * Toggle notification panel
   */
  function togglePanel() {
    isOpen.value = !isOpen.value

    // Fetch notifications when opening
    if (isOpen.value && notifications.value.length === 0) {
      fetchNotifications()
    }
  }

  /**
   * Close notification panel
   */
  function closePanel() {
    isOpen.value = false
  }

  /**
   * Clear all notifications (local only)
   */
  function clearNotifications() {
    notifications.value = []
    pagination.value = {
      page: 1,
      limit: 20,
      total: 0,
      pages: 0
    }
  }

  /**
   * Initialize store - call on app startup
   */
  async function init() {
    await fetchUnreadCount()
  }

  return {
    // State
    notifications,
    unreadCount,
    isLoading,
    isOpen,
    pagination,

    // Getters
    hasUnread,
    recentNotifications,

    // Actions
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    handleNewNotification,
    handleCountUpdate,
    showNotificationToast,
    togglePanel,
    closePanel,
    clearNotifications,
    init
  }
})
