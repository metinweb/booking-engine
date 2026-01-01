<template>
  <Teleport to="body">
    <div v-if="store.isDev" class="fixed bottom-4 right-4 z-[9999]">
      <!-- Minimized Badge -->
      <button
        v-if="store.isMinimized"
        @click="store.toggleMinimize"
        class="flex items-center gap-2 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg shadow-lg transition-all"
        :class="{ 'animate-pulse': store.count > 0 }"
      >
        <span class="material-icons text-sm">translate</span>
        <span class="font-medium">{{ store.count }}</span>
      </button>

      <!-- Expanded Panel -->
      <div
        v-else
        class="bg-white dark:bg-slate-800 rounded-lg shadow-2xl border border-gray-200 dark:border-slate-700 w-96 max-h-[500px] flex flex-col"
      >
        <!-- Header -->
        <div class="flex items-center justify-between p-3 border-b border-gray-200 dark:border-slate-700 bg-amber-50 dark:bg-amber-900/20 rounded-t-lg">
          <div class="flex items-center gap-2">
            <span class="material-icons text-amber-600 dark:text-amber-400">translate</span>
            <span class="font-semibold text-gray-900 dark:text-white">Missing Keys</span>
            <span class="px-2 py-0.5 bg-amber-500 text-white text-xs rounded-full">{{ store.count }}</span>
          </div>
          <div class="flex items-center gap-1">
            <button
              @click="copyJson"
              class="p-1 text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-white"
              title="Copy as JSON"
            >
              <span class="material-icons text-sm">data_object</span>
            </button>
            <button
              @click="copyList"
              class="p-1 text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-white"
              title="Copy as list"
            >
              <span class="material-icons text-sm">content_copy</span>
            </button>
            <button
              @click="store.clear"
              class="p-1 text-gray-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400"
              title="Clear all"
            >
              <span class="material-icons text-sm">delete</span>
            </button>
            <button
              @click="store.toggleMinimize"
              class="p-1 text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-white"
              title="Minimize"
            >
              <span class="material-icons text-sm">remove</span>
            </button>
          </div>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto p-2 max-h-80">
          <div v-if="store.count === 0" class="text-center py-8 text-gray-500 dark:text-slate-400">
            <span class="material-icons text-3xl mb-2">check_circle</span>
            <p class="text-sm">No missing keys</p>
          </div>

          <div v-else class="space-y-1">
            <div
              v-for="item in store.keys"
              :key="item.key"
              class="group flex items-start gap-2 p-2 rounded hover:bg-gray-100 dark:hover:bg-slate-700/50 text-sm"
            >
              <div class="flex-1 min-w-0">
                <code class="block text-xs text-amber-700 dark:text-amber-400 break-all font-mono">
                  {{ item.key }}
                </code>
                <div class="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-slate-400">
                  <span
                    v-for="locale in item.locales"
                    :key="locale"
                    class="px-1.5 py-0.5 bg-gray-200 dark:bg-slate-600 rounded"
                  >
                    {{ locale }}
                  </span>
                  <span class="ml-auto">x{{ item.count }}</span>
                </div>
              </div>
              <button
                @click="copyKey(item.key)"
                class="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-opacity"
                title="Copy key"
              >
                <span class="material-icons text-sm">content_copy</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="p-2 border-t border-gray-200 dark:border-slate-700 text-xs text-gray-500 dark:text-slate-400 text-center">
          Development Mode Only
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { useMissingKeysStore } from '@/stores/missingKeys'
import { useToast } from 'vue-toastification'

const store = useMissingKeysStore()
const toast = useToast()

const copyKey = async (key) => {
  try {
    await navigator.clipboard.writeText(key)
    toast.info('Key copied!')
  } catch {
    console.error('Failed to copy')
  }
}

const copyJson = async () => {
  try {
    const json = store.copyAsJson()
    await navigator.clipboard.writeText(json)
    toast.success('JSON copied to clipboard!')
  } catch {
    console.error('Failed to copy')
  }
}

const copyList = async () => {
  try {
    const list = store.copyAsList()
    await navigator.clipboard.writeText(list)
    toast.success('List copied to clipboard!')
  } catch {
    console.error('Failed to copy')
  }
}
</script>
