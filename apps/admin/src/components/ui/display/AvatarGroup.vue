<template>
  <div class="ui-avatar-group flex -space-x-2">
    <!-- Avatars -->
    <Avatar
      v-for="(avatar, index) in visibleAvatars"
      :key="index"
      :src="avatar.src"
      :name="avatar.name"
      :initials="avatar.initials"
      :alt="avatar.alt || avatar.name"
      :size="size"
      :color="avatar.color || getColor(index)"
      bordered
      class="ring-2 ring-white dark:ring-slate-800"
    />

    <!-- Overflow count -->
    <span
      v-if="overflowCount > 0"
      class="relative inline-flex items-center justify-center font-medium
             bg-gray-200 dark:bg-slate-600 text-gray-600 dark:text-gray-300
             ring-2 ring-white dark:ring-slate-800"
      :class="[sizeClasses, 'rounded-full']"
    >
      <span :class="textSizeClasses">+{{ overflowCount }}</span>
    </span>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import Avatar from './Avatar.vue'

const props = defineProps({
  avatars: {
    type: Array,
    required: true
    // Each avatar: { src?, name?, initials?, alt?, color? }
  },
  max: {
    type: Number,
    default: 4
  },
  size: {
    type: String,
    default: 'md',
    validator: (v) => ['xs', 'sm', 'md', 'lg', 'xl'].includes(v)
  }
})

// Visible avatars
const visibleAvatars = computed(() => {
  return props.avatars.slice(0, props.max)
})

// Overflow count
const overflowCount = computed(() => {
  return Math.max(0, props.avatars.length - props.max)
})

// Size classes for overflow indicator
const sizeClasses = computed(() => {
  const sizes = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  }
  return sizes[props.size]
})

const textSizeClasses = computed(() => {
  const sizes = {
    xs: 'text-xs',
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg'
  }
  return sizes[props.size]
})

// Get color based on index
const getColor = (index) => {
  const colors = ['indigo', 'blue', 'green', 'amber', 'purple', 'pink', 'red']
  return colors[index % colors.length]
}
</script>
