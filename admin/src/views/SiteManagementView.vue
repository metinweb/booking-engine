<template>
  <div>
    <div class="bg-white dark:bg-slate-800 rounded-lg shadow">
      <div class="p-6 border-b border-gray-200 dark:border-slate-700">
        <h2 class="text-2xl font-bold text-gray-800 dark:text-white">{{ $t('siteManagement.title') }}</h2>
        <p class="text-gray-600 dark:text-slate-400 mt-1">{{ $t('siteManagement.description') }}</p>
      </div>

      <!-- Sub Navigation -->
      <div class="px-6 pt-4 border-b border-gray-200 dark:border-slate-700">
        <div class="flex space-x-2">
          <RouterLink
            v-for="tab in subTabs"
            :key="tab.id"
            :to="tab.to"
            class="px-4 py-2.5 rounded-t-lg text-sm font-medium transition-all border-b-2 -mb-px"
            :class="isActiveTab(tab.to)
              ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-600 text-purple-700 dark:text-purple-300'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50 dark:text-slate-400 dark:hover:text-slate-300 dark:hover:bg-slate-700/50'"
          >
            <span class="flex items-center">
              <span class="material-icons text-lg mr-2">{{ tab.icon }}</span>
              {{ tab.label }}
            </span>
          </RouterLink>
        </div>
      </div>

      <!-- Router View for Sub Pages -->
      <div class="p-6">
        <RouterView />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, RouterLink, RouterView } from 'vue-router'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const route = useRoute()

const subTabs = computed(() => [
  { id: 'settings', to: '/site-management/settings', icon: 'settings', label: t('siteManagement.tabs.settings') },
  { id: 'pages', to: '/site-management/pages', icon: 'description', label: t('siteManagement.tabs.pages') }
])

const isActiveTab = (path) => {
  return route.path === path || route.path.startsWith(path + '/')
}
</script>
