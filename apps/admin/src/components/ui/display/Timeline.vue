<template>
  <div class="ui-timeline" :class="containerClasses">
    <div
      v-for="(item, index) in items"
      :key="index"
      class="relative flex gap-4"
      :class="itemClasses"
    >
      <!-- Line -->
      <div
        v-if="index < items.length - 1"
        class="absolute left-4 top-8 w-0.5 h-full -translate-x-1/2"
        :class="lineClasses"
      ></div>

      <!-- Dot/Icon -->
      <div class="relative z-10 flex-shrink-0">
        <div
          v-if="item.icon"
          class="flex items-center justify-center rounded-full"
          :class="[iconContainerClasses, getItemColorClasses(item)]"
        >
          <span class="material-icons" :class="iconSizeClasses">{{ item.icon }}</span>
        </div>
        <div
          v-else
          class="rounded-full"
          :class="[dotClasses, getItemColorClasses(item)]"
        ></div>
      </div>

      <!-- Content -->
      <div class="flex-1 pb-8">
        <!-- Header -->
        <div class="flex items-start justify-between gap-4">
          <div>
            <h4 class="font-medium text-gray-900 dark:text-white">
              {{ item.title }}
            </h4>
            <p v-if="item.subtitle" class="text-sm text-gray-500 dark:text-slate-400">
              {{ item.subtitle }}
            </p>
          </div>
          <time
            v-if="item.time"
            class="flex-shrink-0 text-sm text-gray-500 dark:text-slate-400"
          >
            {{ item.time }}
          </time>
        </div>

        <!-- Description -->
        <p
          v-if="item.description"
          class="mt-2 text-sm text-gray-600 dark:text-gray-300"
        >
          {{ item.description }}
        </p>

        <!-- Custom content slot -->
        <div v-if="$slots[`item-${index}`]" class="mt-2">
          <slot :name="`item-${index}`" :item="item"></slot>
        </div>

        <!-- Tags -->
        <div v-if="item.tags && item.tags.length" class="flex flex-wrap gap-1 mt-2">
          <span
            v-for="tag in item.tags"
            :key="tag"
            class="px-2 py-0.5 text-xs font-medium rounded-full
                   bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300"
          >
            {{ tag }}
          </span>
        </div>

        <!-- Actions -->
        <div v-if="item.actions && item.actions.length" class="flex gap-2 mt-3">
          <button
            v-for="action in item.actions"
            :key="action.label"
            type="button"
            class="text-sm font-medium transition-colors"
            :class="getActionClasses(action)"
            @click="handleAction(action, item, index)"
          >
            <span v-if="action.icon" class="material-icons text-sm align-middle mr-1">
              {{ action.icon }}
            </span>
            {{ action.label }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  items: {
    type: Array,
    required: true
    // Each item: { title, subtitle?, description?, time?, icon?, color?, tags?, actions? }
    // Action: { label, icon?, variant?, handler? }
  },
  // Size
  size: {
    type: String,
    default: 'md',
    validator: (v) => ['sm', 'md', 'lg'].includes(v)
  },
  // Default color
  color: {
    type: String,
    default: 'indigo',
    validator: (v) => ['indigo', 'blue', 'green', 'red', 'amber', 'purple', 'gray'].includes(v)
  },
  // Variant
  variant: {
    type: String,
    default: 'default',
    validator: (v) => ['default', 'alternate', 'compact'].includes(v)
  }
})

const emit = defineEmits(['action'])

// Container classes
const containerClasses = computed(() => {
  if (props.variant === 'compact') {
    return 'space-y-0'
  }
  return ''
})

// Item classes
const itemClasses = computed(() => {
  return ''
})

// Line classes
const lineClasses = computed(() => {
  return 'bg-gray-200 dark:bg-slate-700'
})

// Dot classes
const dotClasses = computed(() => {
  const sizes = {
    sm: 'w-2 h-2 mt-2',
    md: 'w-3 h-3 mt-1.5',
    lg: 'w-4 h-4 mt-1'
  }
  return sizes[props.size]
})

// Icon container classes
const iconContainerClasses = computed(() => {
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10'
  }
  return sizes[props.size]
})

// Icon size classes
const iconSizeClasses = computed(() => {
  const sizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }
  return sizes[props.size]
})

// Get item color classes
const getItemColorClasses = (item) => {
  const itemColor = item.color || props.color

  const colors = {
    indigo: 'bg-indigo-600 text-white',
    blue: 'bg-blue-600 text-white',
    green: 'bg-green-600 text-white',
    red: 'bg-red-600 text-white',
    amber: 'bg-amber-500 text-white',
    purple: 'bg-purple-600 text-white',
    gray: 'bg-gray-400 dark:bg-slate-500 text-white'
  }
  return colors[itemColor]
}

// Get action classes
const getActionClasses = (action) => {
  const variant = action.variant || 'link'

  const variants = {
    link: 'text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300',
    button: 'px-3 py-1 rounded bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600',
    danger: 'text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300'
  }
  return variants[variant]
}

// Handle action
const handleAction = (action, item, index) => {
  if (action.handler) {
    action.handler(item, index)
  }
  emit('action', { action, item, index })
}
</script>
