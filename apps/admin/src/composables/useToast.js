import { ref } from 'vue'

const toasts = ref([])
let toastId = 0

// Mobile breakpoint (tailwind md)
const MOBILE_BREAKPOINT = 768

const isMobile = () => {
  return typeof window !== 'undefined' && window.innerWidth < MOBILE_BREAKPOINT
}

export const useToast = () => {
  const showToast = (message, type = 'info', duration = 3000) => {
    const id = ++toastId
    const toast = {
      id,
      message,
      type,
      show: true
    }

    // Mobilde sadece 1 toast göster - önceki toastları temizle
    if (isMobile() && toasts.value.length > 0) {
      toasts.value = []
    }

    toasts.value.push(toast)

    // Auto remove after duration
    setTimeout(() => {
      removeToast(id)
    }, duration)

    return id
  }
  
  const removeToast = (id) => {
    const index = toasts.value.findIndex(t => t.id === id)
    if (index > -1) {
      toasts.value[index].show = false
      setTimeout(() => {
        toasts.value.splice(index, 1)
      }, 300) // Wait for fade out animation
    }
  }
  
  const success = (message, duration) => showToast(message, 'success', duration)
  const error = (message, duration) => showToast(message, 'error', duration)
  const warning = (message, duration) => showToast(message, 'warning', duration)
  const info = (message, duration) => showToast(message, 'info', duration)
  
  return {
    toasts,
    showToast,
    removeToast,
    success,
    error,
    warning,
    info
  }
}
