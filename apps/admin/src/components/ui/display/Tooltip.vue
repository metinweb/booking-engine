<template>
  <div class="ui-tooltip relative inline-block" ref="containerRef">
    <!-- Trigger element -->
    <div
      @mouseenter="showOnHover && show()"
      @mouseleave="showOnHover && hide()"
      @focus="showOnFocus && show()"
      @blur="showOnFocus && hide()"
      @click="showOnClick && toggle()"
    >
      <slot></slot>
    </div>

    <!-- Tooltip -->
    <Teleport to="body">
      <Transition :name="transitionName">
        <div
          v-if="isVisible"
          ref="tooltipRef"
          class="fixed z-[9999] pointer-events-none"
          :style="tooltipStyle"
        >
          <div
            class="relative px-2 py-1 text-sm rounded shadow-lg"
            :class="[colorClasses, sizeClasses]"
          >
            <!-- Content -->
            <slot name="content">
              {{ text }}
            </slot>

            <!-- Arrow -->
            <div
              v-if="arrow"
              class="absolute w-2 h-2 rotate-45"
              :class="[arrowClasses, arrowPositionClasses]"
            ></div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'

const props = defineProps({
  // Tooltip text
  text: {
    type: String,
    default: ''
  },
  // Position
  position: {
    type: String,
    default: 'top',
    validator: (v) => ['top', 'bottom', 'left', 'right'].includes(v)
  },
  // Color variant
  color: {
    type: String,
    default: 'dark',
    validator: (v) => ['dark', 'light', 'indigo', 'blue', 'green', 'red', 'amber'].includes(v)
  },
  // Size
  size: {
    type: String,
    default: 'md',
    validator: (v) => ['sm', 'md', 'lg'].includes(v)
  },
  // Show arrow
  arrow: {
    type: Boolean,
    default: true
  },
  // Delay before showing (ms)
  delay: {
    type: Number,
    default: 0
  },
  // Delay before hiding (ms)
  hideDelay: {
    type: Number,
    default: 0
  },
  // Triggers
  showOnHover: {
    type: Boolean,
    default: true
  },
  showOnFocus: {
    type: Boolean,
    default: false
  },
  showOnClick: {
    type: Boolean,
    default: false
  },
  // Manual control
  modelValue: {
    type: Boolean,
    default: null
  },
  // Offset from trigger
  offset: {
    type: Number,
    default: 8
  },
  // Max width
  maxWidth: {
    type: String,
    default: '200px'
  },
  // Disabled
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'show', 'hide'])

const containerRef = ref(null)
const tooltipRef = ref(null)
const isVisible = ref(false)
const tooltipPosition = ref({ top: 0, left: 0 })
let showTimeout = null
let hideTimeout = null

// Watch for manual control
watch(() => props.modelValue, (value) => {
  if (value !== null) {
    isVisible.value = value
    if (value) {
      nextTick(updatePosition)
    }
  }
})

// Show tooltip
const show = () => {
  if (props.disabled) return

  clearTimeout(hideTimeout)

  if (props.delay > 0) {
    showTimeout = setTimeout(() => {
      isVisible.value = true
      nextTick(updatePosition)
      emit('show')
      emit('update:modelValue', true)
    }, props.delay)
  } else {
    isVisible.value = true
    nextTick(updatePosition)
    emit('show')
    emit('update:modelValue', true)
  }
}

// Hide tooltip
const hide = () => {
  clearTimeout(showTimeout)

  if (props.hideDelay > 0) {
    hideTimeout = setTimeout(() => {
      isVisible.value = false
      emit('hide')
      emit('update:modelValue', false)
    }, props.hideDelay)
  } else {
    isVisible.value = false
    emit('hide')
    emit('update:modelValue', false)
  }
}

// Toggle tooltip
const toggle = () => {
  if (isVisible.value) {
    hide()
  } else {
    show()
  }
}

// Update position
const updatePosition = () => {
  if (!containerRef.value || !tooltipRef.value) return

  const triggerRect = containerRef.value.getBoundingClientRect()
  const tooltipRect = tooltipRef.value.getBoundingClientRect()
  const offset = props.offset

  let top = 0
  let left = 0

  switch (props.position) {
    case 'top':
      top = triggerRect.top - tooltipRect.height - offset
      left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2
      break
    case 'bottom':
      top = triggerRect.bottom + offset
      left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2
      break
    case 'left':
      top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2
      left = triggerRect.left - tooltipRect.width - offset
      break
    case 'right':
      top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2
      left = triggerRect.right + offset
      break
  }

  // Viewport boundary checks
  const padding = 8
  if (left < padding) left = padding
  if (left + tooltipRect.width > window.innerWidth - padding) {
    left = window.innerWidth - tooltipRect.width - padding
  }
  if (top < padding) top = padding
  if (top + tooltipRect.height > window.innerHeight - padding) {
    top = window.innerHeight - tooltipRect.height - padding
  }

  tooltipPosition.value = { top, left }
}

// Tooltip style
const tooltipStyle = computed(() => ({
  top: `${tooltipPosition.value.top}px`,
  left: `${tooltipPosition.value.left}px`,
  maxWidth: props.maxWidth
}))

// Transition name
const transitionName = computed(() => {
  return `tooltip-${props.position}`
})

// Color classes
const colorClasses = computed(() => {
  const colors = {
    dark: 'bg-gray-900 dark:bg-slate-700 text-white',
    light: 'bg-white dark:bg-slate-200 text-gray-900 border border-gray-200',
    indigo: 'bg-indigo-600 text-white',
    blue: 'bg-blue-600 text-white',
    green: 'bg-green-600 text-white',
    red: 'bg-red-600 text-white',
    amber: 'bg-amber-500 text-white'
  }
  return colors[props.color]
})

// Size classes
const sizeClasses = computed(() => {
  const sizes = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5'
  }
  return sizes[props.size]
})

// Arrow classes
const arrowClasses = computed(() => {
  const colors = {
    dark: 'bg-gray-900 dark:bg-slate-700',
    light: 'bg-white dark:bg-slate-200 border-l border-b border-gray-200',
    indigo: 'bg-indigo-600',
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    red: 'bg-red-600',
    amber: 'bg-amber-500'
  }
  return colors[props.color]
})

// Arrow position classes
const arrowPositionClasses = computed(() => {
  const positions = {
    top: 'bottom-[-4px] left-1/2 -translate-x-1/2',
    bottom: 'top-[-4px] left-1/2 -translate-x-1/2',
    left: 'right-[-4px] top-1/2 -translate-y-1/2',
    right: 'left-[-4px] top-1/2 -translate-y-1/2'
  }
  return positions[props.position]
})

// Handle resize and scroll
const handleReposition = () => {
  if (isVisible.value) {
    updatePosition()
  }
}

onMounted(() => {
  window.addEventListener('resize', handleReposition)
  window.addEventListener('scroll', handleReposition, true)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleReposition)
  window.removeEventListener('scroll', handleReposition, true)
  clearTimeout(showTimeout)
  clearTimeout(hideTimeout)
})

// Expose methods
defineExpose({ show, hide, toggle })
</script>

<style scoped>
/* Top */
.tooltip-top-enter-active,
.tooltip-top-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.tooltip-top-enter-from,
.tooltip-top-leave-to {
  opacity: 0;
  transform: translateY(4px);
}

/* Bottom */
.tooltip-bottom-enter-active,
.tooltip-bottom-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.tooltip-bottom-enter-from,
.tooltip-bottom-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* Left */
.tooltip-left-enter-active,
.tooltip-left-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.tooltip-left-enter-from,
.tooltip-left-leave-to {
  opacity: 0;
  transform: translateX(4px);
}

/* Right */
.tooltip-right-enter-active,
.tooltip-right-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.tooltip-right-enter-from,
.tooltip-right-leave-to {
  opacity: 0;
  transform: translateX(-4px);
}
</style>
