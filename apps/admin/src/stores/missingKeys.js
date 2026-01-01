import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useMissingKeysStore = defineStore('missingKeys', () => {
  // Only active in development
  const isDev = import.meta.env.DEV

  // Missing keys storage: { key: { locales: ['en', 'tr'], count: 5, lastSeen: Date } }
  const missingKeys = ref(new Map())

  // UI state
  const isOpen = ref(false)
  const isMinimized = ref(true)

  // Computed
  const count = computed(() => missingKeys.value.size)
  const keys = computed(() => Array.from(missingKeys.value.entries()).map(([key, data]) => ({
    key,
    ...data
  })).sort((a, b) => b.count - a.count))

  // Add missing key
  const addMissingKey = (locale, key) => {
    if (!isDev) return

    const existing = missingKeys.value.get(key)
    if (existing) {
      existing.count++
      existing.lastSeen = new Date()
      if (!existing.locales.includes(locale)) {
        existing.locales.push(locale)
      }
    } else {
      missingKeys.value.set(key, {
        locales: [locale],
        count: 1,
        firstSeen: new Date(),
        lastSeen: new Date()
      })
    }

    // Trigger reactivity
    missingKeys.value = new Map(missingKeys.value)
  }

  // Clear all keys
  const clear = () => {
    missingKeys.value = new Map()
  }

  // Copy keys as JSON
  const copyAsJson = () => {
    const obj = {}
    for (const [key] of missingKeys.value) {
      // Create nested structure from dot notation
      const parts = key.split('.')
      let current = obj
      for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) current[parts[i]] = {}
        current = current[parts[i]]
      }
      current[parts[parts.length - 1]] = `[TODO: ${key}]`
    }
    return JSON.stringify(obj, null, 2)
  }

  // Copy keys as flat list
  const copyAsList = () => {
    return Array.from(missingKeys.value.keys()).join('\n')
  }

  // Toggle panel
  const toggle = () => {
    isOpen.value = !isOpen.value
  }

  const toggleMinimize = () => {
    isMinimized.value = !isMinimized.value
  }

  return {
    isDev,
    missingKeys,
    isOpen,
    isMinimized,
    count,
    keys,
    addMissingKey,
    clear,
    copyAsJson,
    copyAsList,
    toggle,
    toggleMinimize
  }
})
