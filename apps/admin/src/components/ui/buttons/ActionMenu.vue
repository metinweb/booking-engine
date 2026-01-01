<template>
  <div class="relative" ref="containerRef">
    <!-- Trigger Button -->
    <button
      type="button"
      :class="triggerClasses"
      :disabled="disabled"
      @click="toggle"
    >
      <slot name="trigger">
        <span class="material-icons">{{ triggerIcon }}</span>
      </slot>
    </button>

    <!-- Dropdown Menu -->
    <Teleport to="body">
      <Transition name="dropdown">
        <div
          v-if="isOpen"
          ref="menuRef"
          :style="menuStyle"
          class="fixed z-50 min-w-[180px] py-1 bg-white dark:bg-slate-800 rounded-lg shadow-lg
                 border border-gray-200 dark:border-slate-700"
          @click.stop
        >
          <template v-for="(item, index) in items" :key="item.key || index">
            <!-- Divider -->
            <div
              v-if="item.divider"
              class="my-1 border-t border-gray-200 dark:border-slate-700"
            ></div>

            <!-- Header -->
            <div
              v-else-if="item.header"
              class="px-3 py-1.5 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider"
            >
              {{ item.header }}
            </div>

            <!-- Menu Item -->
            <button
              v-else
              type="button"
              class="w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors text-left"
              :class="[
                item.disabled
                  ? 'opacity-50 cursor-not-allowed'
                  : item.danger
                    ? 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
              ]"
              :disabled="item.disabled"
              @click="handleItemClick(item)"
            >
              <span v-if="item.icon" class="material-icons text-lg">{{ item.icon }}</span>
              <span class="flex-1">{{ item.label }}</span>
              <span v-if="item.shortcut" class="text-xs text-gray-400">{{ item.shortcut }}</span>
            </button>
          </template>

          <!-- Slot for custom content -->
          <slot></slot>
        </div>
      </Transition>
    </Teleport>

    <!-- Backdrop -->
    <div
      v-if="isOpen"
      class="fixed inset-0 z-40"
      @click="close"
    ></div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'

const props = defineProps({
  items: {
    type: Array,
    default: () => []
    // { key, label, icon, danger, disabled, divider, header, shortcut }
  },
  triggerIcon: {
    type: String,
    default: 'more_vert'
  },
  placement: {
    type: String,
    default: 'bottom-end',
    validator: (v) => ['bottom-start', 'bottom-end', 'top-start', 'top-end'].includes(v)
  },
  disabled: {
    type: Boolean,
    default: false
  },
  size: {
    type: String,
    default: 'md',
    validator: (v) => ['sm', 'md', 'lg'].includes(v)
  }
})

const emit = defineEmits(['select', 'open', 'close'])

// Refs
const containerRef = ref(null)
const menuRef = ref(null)
const isOpen = ref(false)

// Menu position
const menuPosition = ref({ top: 0, left: 0 })

// Trigger classes
const triggerClasses = computed(() => {
  const sizes = {
    sm: 'p-1',
    md: 'p-1.5',
    lg: 'p-2'
  }

  return [
    'inline-flex items-center justify-center rounded-lg transition-colors',
    'text-gray-500 hover:text-gray-700 hover:bg-gray-100',
    'dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-slate-700',
    'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    sizes[props.size]
  ]
})

// Menu style
const menuStyle = computed(() => ({
  top: `${menuPosition.value.top}px`,
  left: `${menuPosition.value.left}px`
}))

// Calculate menu position
const calculatePosition = async () => {
  await nextTick()

  if (!containerRef.value || !menuRef.value) return

  const triggerRect = containerRef.value.getBoundingClientRect()
  const menuRect = menuRef.value.getBoundingClientRect()
  const padding = 8

  let top = 0
  let left = 0

  // Vertical positioning
  if (props.placement.startsWith('bottom')) {
    top = triggerRect.bottom + padding
    // Check if overflows bottom
    if (top + menuRect.height > window.innerHeight - padding) {
      top = triggerRect.top - menuRect.height - padding
    }
  } else {
    top = triggerRect.top - menuRect.height - padding
    // Check if overflows top
    if (top < padding) {
      top = triggerRect.bottom + padding
    }
  }

  // Horizontal positioning
  if (props.placement.endsWith('end')) {
    left = triggerRect.right - menuRect.width
    // Check if overflows left
    if (left < padding) {
      left = triggerRect.left
    }
  } else {
    left = triggerRect.left
    // Check if overflows right
    if (left + menuRect.width > window.innerWidth - padding) {
      left = triggerRect.right - menuRect.width
    }
  }

  menuPosition.value = { top, left }
}

// Toggle menu
const toggle = () => {
  if (isOpen.value) {
    close()
  } else {
    open()
  }
}

// Open menu
const open = async () => {
  isOpen.value = true
  emit('open')
  await calculatePosition()
}

// Close menu
const close = () => {
  isOpen.value = false
  emit('close')
}

// Handle item click
const handleItemClick = (item) => {
  if (item.disabled) return

  emit('select', item)
  if (item.action) {
    item.action()
  }
  close()
}

// Handle escape key
const handleKeydown = (e) => {
  if (e.key === 'Escape' && isOpen.value) {
    close()
  }
}

// Handle window resize
const handleResize = () => {
  if (isOpen.value) {
    calculatePosition()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('resize', handleResize)
})

// Expose
defineExpose({ open, close, toggle })
</script>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
