<template>
  <div
    class="ui-accordion-item"
    :class="itemClasses"
  >
    <!-- Header -->
    <button
      type="button"
      class="w-full flex items-center gap-3 py-4 px-4 text-left transition-colors"
      :class="headerClasses"
      :disabled="disabled"
      @click="toggle"
    >
      <!-- Left icon -->
      <span
        v-if="accordion?.iconPosition === 'left'"
        class="material-icons text-gray-500 dark:text-slate-400 transition-transform duration-200"
        :class="{ 'rotate-180': isOpen }"
      >
        expand_more
      </span>

      <!-- Custom icon -->
      <span v-if="icon" class="material-icons text-gray-500 dark:text-slate-400">
        {{ icon }}
      </span>

      <!-- Title -->
      <span class="flex-1 font-medium text-gray-900 dark:text-white">
        <slot name="header">{{ title }}</slot>
      </span>

      <!-- Subtitle -->
      <span v-if="subtitle" class="text-sm text-gray-500 dark:text-slate-400">
        {{ subtitle }}
      </span>

      <!-- Right icon -->
      <span
        v-if="accordion?.iconPosition === 'right'"
        class="material-icons text-gray-500 dark:text-slate-400 transition-transform duration-200"
        :class="{ 'rotate-180': isOpen }"
      >
        expand_more
      </span>
    </button>

    <!-- Content -->
    <Transition
      name="accordion"
      @enter="onEnter"
      @after-enter="onAfterEnter"
      @leave="onLeave"
    >
      <div v-if="isOpen" class="overflow-hidden">
        <div class="px-4 pb-4" :class="contentClasses">
          <slot></slot>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { computed, inject, onMounted } from 'vue'

const props = defineProps({
  // Unique key for this item
  itemKey: {
    type: [String, Number],
    required: true
  },
  // Title
  title: {
    type: String,
    default: ''
  },
  // Subtitle
  subtitle: {
    type: String,
    default: ''
  },
  // Icon
  icon: {
    type: String,
    default: ''
  },
  // Disabled
  disabled: {
    type: Boolean,
    default: false
  },
  // Default open
  defaultOpen: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['toggle'])

// Inject accordion context
const accordion = inject('accordion', null)

// Check if open
const isOpen = computed(() => {
  if (accordion) {
    return accordion.isItemOpen(props.itemKey)
  }
  return false
})

// Toggle
const toggle = () => {
  if (props.disabled) return

  if (accordion) {
    accordion.toggleItem(props.itemKey)
  }
  emit('toggle', !isOpen.value)
}

// Item classes based on variant
const itemClasses = computed(() => {
  if (accordion?.variant === 'separated') {
    return 'border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden'
  }
  return ''
})

// Header classes
const headerClasses = computed(() => {
  const base = 'hover:bg-gray-50 dark:hover:bg-slate-800/50'
  const disabled = props.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
  return [base, disabled]
})

// Content classes
const contentClasses = computed(() => {
  if (accordion?.iconPosition === 'left') {
    return 'ml-9' // Offset for icon
  }
  return ''
})

// Animation handlers
const onEnter = (el) => {
  el.style.height = '0'
  el.offsetHeight // Force reflow
  el.style.height = el.scrollHeight + 'px'
}

const onAfterEnter = (el) => {
  el.style.height = 'auto'
}

const onLeave = (el) => {
  el.style.height = el.scrollHeight + 'px'
  el.offsetHeight // Force reflow
  el.style.height = '0'
}

// Default open handling
onMounted(() => {
  if (props.defaultOpen && accordion) {
    accordion.toggleItem(props.itemKey)
  }
})
</script>

<style scoped>
.accordion-enter-active,
.accordion-leave-active {
  transition: height 0.2s ease;
}

.accordion-enter-from,
.accordion-leave-to {
  height: 0 !important;
}
</style>
