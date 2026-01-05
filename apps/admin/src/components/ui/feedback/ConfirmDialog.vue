<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="!persistent && cancel()"
        @keydown.esc="!persistent && cancel()"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>

        <!-- Dialog -->
        <div
          class="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-xl shadow-2xl transform transition-all"
          role="alertdialog"
          aria-modal="true"
          :aria-labelledby="titleId"
          :aria-describedby="messageId"
        >
          <!-- Icon -->
          <div class="flex justify-center pt-6">
            <div
              class="w-16 h-16 rounded-full flex items-center justify-center"
              :class="iconBgClass"
            >
              <span class="material-icons text-3xl" :class="iconColorClass">
                {{ dialogIcon }}
              </span>
            </div>
          </div>

          <!-- Content -->
          <div class="px-6 py-4 text-center">
            <h3 :id="titleId" class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ title }}
            </h3>
            <p :id="messageId" class="mt-2 text-sm text-gray-600 dark:text-gray-400">
              <slot>{{ message }}</slot>
            </p>
          </div>

          <!-- Actions -->
          <div class="flex gap-3 px-6 pb-6" :class="actionsClass">
            <button
              v-if="showCancel"
              ref="cancelButtonRef"
              type="button"
              class="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors text-gray-700 bg-gray-100 hover:bg-gray-200 dark:text-gray-300 dark:bg-slate-700 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              @click="cancel"
            >
              {{ cancelText }}
            </button>
            <button
              ref="confirmButtonRef"
              type="button"
              class="flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"
              :class="confirmButtonClass"
              :disabled="loading"
              @click="confirm"
            >
              <span v-if="loading" class="inline-flex items-center gap-2">
                <svg
                  class="animate-spin h-4 w-4"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    class="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    stroke-width="4"
                  />
                  <path
                    class="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                {{ loadingText || confirmText }}
              </span>
              <span v-else>{{ confirmText }}</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, ref, watch, nextTick } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: 'Emin misiniz?'
  },
  message: {
    type: String,
    default: 'Bu islemi geri alamazsiniz.'
  },
  type: {
    type: String,
    default: 'warning',
    validator: v => ['warning', 'danger', 'info', 'success'].includes(v)
  },
  icon: {
    type: String,
    default: ''
  },
  confirmText: {
    type: String,
    default: 'Onayla'
  },
  cancelText: {
    type: String,
    default: 'Vazgec'
  },
  loadingText: {
    type: String,
    default: ''
  },
  showCancel: {
    type: Boolean,
    default: true
  },
  persistent: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  },
  focusConfirm: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'confirm', 'cancel'])

// Refs
const confirmButtonRef = ref(null)
const cancelButtonRef = ref(null)

// Unique IDs
const titleId = `confirm-title-${Math.random().toString(36).substr(2, 9)}`
const messageId = `confirm-message-${Math.random().toString(36).substr(2, 9)}`

// Icon based on type
const dialogIcon = computed(() => {
  if (props.icon) return props.icon

  const icons = {
    warning: 'warning',
    danger: 'error',
    info: 'info',
    success: 'check_circle'
  }
  return icons[props.type]
})

// Icon background class
const iconBgClass = computed(() => {
  const classes = {
    warning: 'bg-amber-100 dark:bg-amber-900/30',
    danger: 'bg-red-100 dark:bg-red-900/30',
    info: 'bg-blue-100 dark:bg-blue-900/30',
    success: 'bg-green-100 dark:bg-green-900/30'
  }
  return classes[props.type]
})

// Icon color class
const iconColorClass = computed(() => {
  const classes = {
    warning: 'text-amber-500',
    danger: 'text-red-500',
    info: 'text-blue-500',
    success: 'text-green-500'
  }
  return classes[props.type]
})

// Confirm button class
const confirmButtonClass = computed(() => {
  const classes = {
    warning: 'bg-amber-500 hover:bg-amber-600 text-white focus:ring-amber-500',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
    info: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
    success: 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500'
  }
  return classes[props.type]
})

// Actions alignment
const actionsClass = computed(() => {
  return props.showCancel ? 'justify-center' : 'justify-center'
})

// Methods
const confirm = () => {
  emit('confirm')
  if (!props.loading) {
    emit('update:modelValue', false)
  }
}

const cancel = () => {
  emit('cancel')
  emit('update:modelValue', false)
}

// Focus management
watch(
  () => props.modelValue,
  async isOpen => {
    if (isOpen) {
      await nextTick()
      if (props.focusConfirm && confirmButtonRef.value) {
        confirmButtonRef.value.focus()
      } else if (cancelButtonRef.value) {
        cancelButtonRef.value.focus()
      }
    }
  }
)
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-active > div:last-child,
.modal-leave-active > div:last-child {
  transition:
    transform 0.2s ease,
    opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from > div:last-child,
.modal-leave-to > div:last-child {
  transform: scale(0.95);
  opacity: 0;
}
</style>
