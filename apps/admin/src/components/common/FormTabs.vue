<template>
  <div class="border-b border-gray-200 dark:border-slate-700">
    <nav class="flex -mb-px overflow-x-auto" role="tablist">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        role="tab"
        :aria-selected="modelValue === tab.id"
        @click="handleTabClick(tab)"
        :disabled="tab.disabled"
        class="relative px-6 py-4 text-sm font-medium transition-colors border-b-2 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 dark:focus:ring-offset-slate-800"
        :class="[
          modelValue === tab.id
            ? 'border-purple-600 text-purple-600 dark:text-purple-400'
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-slate-400 dark:hover:text-slate-300',
          tab.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        ]"
      >
        <span class="flex items-center gap-2">
          <!-- Icon -->
          <span v-if="tab.icon" class="material-icons text-lg">{{ tab.icon }}</span>

          <!-- Label -->
          <span>{{ tab.label }}</span>

          <!-- Error Badge -->
          <span
            v-if="getErrorCount(tab.id) > 0"
            class="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-red-500 rounded-full animate-pulse"
          >
            {{ getErrorCount(tab.id) }}
          </span>

          <!-- Warning Badge (for optional validation warnings) -->
          <span
            v-else-if="getWarningCount(tab.id) > 0"
            class="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-amber-500 rounded-full"
          >
            {{ getWarningCount(tab.id) }}
          </span>

          <!-- Success Badge (all fields filled) -->
          <span
            v-else-if="isTabComplete(tab.id)"
            class="material-icons text-green-500 text-sm"
          >
            check_circle
          </span>
        </span>
      </button>
    </nav>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    required: true
  },
  tabs: {
    type: Array,
    required: true,
    validator: (tabs) => tabs.every(tab => tab.id && tab.label)
  },
  errors: {
    type: Object,
    default: () => ({})
  },
  warnings: {
    type: Object,
    default: () => ({})
  },
  completedTabs: {
    type: Array,
    default: () => []
  },
  // Map of tab.id -> array of field names for that tab
  tabFields: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:modelValue', 'tab-change'])

/**
 * Get error count for a specific tab
 */
const getErrorCount = (tabId) => {
  const fields = props.tabFields[tabId] || []
  return fields.filter(field => props.errors[field]).length
}

/**
 * Get warning count for a specific tab
 */
const getWarningCount = (tabId) => {
  const fields = props.tabFields[tabId] || []
  return fields.filter(field => props.warnings[field]).length
}

/**
 * Check if tab is complete (in completedTabs array)
 */
const isTabComplete = (tabId) => {
  return props.completedTabs.includes(tabId)
}

/**
 * Handle tab click
 */
const handleTabClick = (tab) => {
  if (tab.disabled) return

  emit('update:modelValue', tab.id)
  emit('tab-change', tab)
}
</script>

<style scoped>
/* Smooth animation for error badge */
@keyframes pulse-error {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.animate-pulse {
  animation: pulse-error 2s ease-in-out infinite;
}
</style>
