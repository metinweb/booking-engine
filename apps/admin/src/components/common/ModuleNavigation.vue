<template>
  <nav
    class="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-4 md:px-6"
  >
    <div class="flex items-center gap-1 overflow-x-auto scrollbar-hide py-2">
      <!-- Navigation Items -->
      <RouterLink
        v-for="item in items"
        :key="item.name"
        :to="item.to"
        class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors"
        :class="isActive(item) ? activeClass : inactiveClass"
      >
        <span v-if="item.icon" class="material-icons text-lg">{{ item.icon }}</span>
        <span>{{ item.label }}</span>
        <span
          v-if="item.badge"
          class="ml-1 px-1.5 py-0.5 text-xs font-medium rounded-full"
          :class="
            item.badgeClass || 'bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-slate-300'
          "
        >
          {{ item.badge }}
        </span>
      </RouterLink>

      <!-- Inline Actions (next to nav items) -->
      <template v-if="actionsInline && actions.length > 0">
        <template v-for="action in actions" :key="action.name">
          <RouterLink
            v-if="action.to"
            :to="action.to"
            class="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors"
            :class="action.class || 'bg-purple-600 hover:bg-purple-700 text-white'"
          >
            <span v-if="action.icon" class="material-icons text-lg">{{ action.icon }}</span>
            <span class="hidden sm:inline">{{ action.label }}</span>
          </RouterLink>
          <button
            v-else
            class="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors"
            :class="action.class || 'bg-purple-600 hover:bg-purple-700 text-white'"
            @click="$emit('action', action.name)"
          >
            <span v-if="action.icon" class="material-icons text-lg">{{ action.icon }}</span>
            <span class="hidden sm:inline">{{ action.label }}</span>
          </button>
        </template>
      </template>

      <!-- Quick Actions on right (slot for custom actions) -->
      <div
        v-if="!actionsInline && ($slots.actions || actions.length > 0)"
        class="ml-auto flex items-center gap-2"
      >
        <slot name="actions">
          <template v-for="action in actions" :key="action.name">
            <RouterLink
              v-if="action.to"
              :to="action.to"
              class="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors"
              :class="action.class || 'bg-purple-600 hover:bg-purple-700 text-white'"
            >
              <span v-if="action.icon" class="material-icons text-lg">{{ action.icon }}</span>
              <span class="hidden sm:inline">{{ action.label }}</span>
            </RouterLink>
            <button
              v-else
              class="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors"
              :class="action.class || 'bg-purple-600 hover:bg-purple-700 text-white'"
              @click="$emit('action', action.name)"
            >
              <span v-if="action.icon" class="material-icons text-lg">{{ action.icon }}</span>
              <span class="hidden sm:inline">{{ action.label }}</span>
            </button>
          </template>
        </slot>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { RouterLink, useRoute } from 'vue-router'

const route = useRoute()

const props = defineProps({
  items: {
    type: Array,
    required: true
    // { name, to, icon, label, badge?, badgeClass?, exact? }
  },
  actions: {
    type: Array,
    default: () => []
    // { name, to?, icon, label, class? }
  },
  actionsInline: {
    type: Boolean,
    default: false
    // If true, actions appear next to nav items instead of on the right
  },
  color: {
    type: String,
    default: 'purple'
    // purple, indigo, blue, green, etc.
  }
})

defineEmits(['action'])

const colorClasses = {
  purple: {
    active: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    inactive:
      'text-gray-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-gray-100 dark:hover:bg-slate-700'
  },
  indigo: {
    active: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
    inactive:
      'text-gray-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-slate-700'
  },
  blue: {
    active: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    inactive:
      'text-gray-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-slate-700'
  },
  green: {
    active: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    inactive:
      'text-gray-600 dark:text-slate-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-gray-100 dark:hover:bg-slate-700'
  }
}

const activeClass = colorClasses[props.color]?.active || colorClasses.purple.active
const inactiveClass = colorClasses[props.color]?.inactive || colorClasses.purple.inactive

const isActive = item => {
  // Guard against undefined route during initialization
  if (!route?.path) return false

  // Parse the item.to to extract path and query params
  const itemUrl = typeof item.to === 'string' ? item.to : item.to?.path || ''
  const [itemPath, itemQueryString] = itemUrl.split('?')

  // If item has query params, check if they match
  if (itemQueryString) {
    const itemParams = new URLSearchParams(itemQueryString)
    // Check if path matches and all query params match
    if (route.path !== itemPath) return false
    for (const [key, value] of itemParams.entries()) {
      if (route.query[key] !== value) return false
    }
    return true
  }

  if (item.exact) {
    return route.path === itemPath
  }
  // Check if current route matches or starts with the item path
  if (route.path === itemPath) return true
  // For paths like /bookings, also match /bookings/123 but not /bookings/new
  if (item.matchPattern) {
    return new RegExp(item.matchPattern).test(route.path)
  }
  return route.path.startsWith(itemPath + '/')
}
</script>

<style scoped>
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
