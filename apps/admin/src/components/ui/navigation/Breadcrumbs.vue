<template>
  <nav class="ui-breadcrumbs" aria-label="Breadcrumb">
    <ol class="flex items-center" :class="[sizeClasses, wrapClasses]">
      <!-- Home icon (optional) -->
      <li v-if="showHome" class="flex items-center">
        <router-link
          v-if="homeRoute"
          :to="homeRoute"
          class="text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 transition-colors"
        >
          <span class="material-icons" :class="iconSizeClasses">home</span>
        </router-link>
        <span v-else class="text-gray-500 dark:text-slate-400">
          <span class="material-icons" :class="iconSizeClasses">home</span>
        </span>
      </li>

      <!-- Breadcrumb items -->
      <li v-for="(item, index) in items" :key="index" class="flex items-center">
        <!-- Separator -->
        <span
          class="mx-2 text-gray-400 dark:text-slate-500 select-none"
          :class="separatorSizeClasses"
        >
          <span v-if="separator === 'slash'">/</span>
          <span v-else-if="separator === 'arrow'" class="material-icons" :class="iconSizeClasses"
            >chevron_right</span
          >
          <span v-else-if="separator === 'dot'">•</span>
          <span v-else>{{ separator }}</span>
        </span>

        <!-- Item -->
        <template v-if="index === items.length - 1">
          <!-- Last item (current page) -->
          <span class="font-medium" :class="activeClasses" aria-current="page">
            <span v-if="item.icon" class="material-icons mr-1" :class="iconSizeClasses">{{
              item.icon
            }}</span>
            {{ item.label }}
          </span>
        </template>
        <template v-else>
          <!-- Link items -->
          <router-link v-if="item.to" :to="item.to" class="transition-colors" :class="linkClasses">
            <span v-if="item.icon" class="material-icons mr-1" :class="iconSizeClasses">{{
              item.icon
            }}</span>
            {{ item.label }}
          </router-link>
          <a v-else-if="item.href" :href="item.href" class="transition-colors" :class="linkClasses">
            <span v-if="item.icon" class="material-icons mr-1" :class="iconSizeClasses">{{
              item.icon
            }}</span>
            {{ item.label }}
          </a>
          <span v-else class="text-gray-500 dark:text-slate-400">
            <span v-if="item.icon" class="material-icons mr-1" :class="iconSizeClasses">{{
              item.icon
            }}</span>
            {{ item.label }}
          </span>
        </template>
      </li>
    </ol>
  </nav>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  items: {
    type: Array,
    required: true
    // Each item: { label, to?, href?, icon? }
  },
  // Separator
  separator: {
    type: String,
    default: 'arrow',
    validator: v => ['slash', 'arrow', 'dot'].includes(v) || typeof v === 'string'
  },
  // Size
  size: {
    type: String,
    default: 'md',
    validator: v => ['sm', 'md', 'lg'].includes(v)
  },
  // Show home icon at start
  showHome: {
    type: Boolean,
    default: false
  },
  // Home route
  homeRoute: {
    type: [String, Object],
    default: '/'
  },
  // Wrap on mobile
  wrap: {
    type: Boolean,
    default: false
  }
})

// Size classes
const sizeClasses = computed(() => {
  const sizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }
  return sizes[props.size]
})

const iconSizeClasses = computed(() => {
  const sizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }
  return sizes[props.size]
})

const separatorSizeClasses = computed(() => {
  const sizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }
  return sizes[props.size]
})

// Link classes
const linkClasses = computed(() => {
  return 'text-gray-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400'
})

// Active (last item) classes
const activeClasses = computed(() => {
  return 'text-gray-900 dark:text-white'
})

// Wrap classes
const wrapClasses = computed(() => {
  return props.wrap ? 'flex-wrap' : 'overflow-x-auto whitespace-nowrap'
})
</script>
