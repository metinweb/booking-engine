<template>
  <div class="flex gap-1 mb-6 bg-gray-100 dark:bg-slate-700 rounded-xl p-1">
    <button
      v-for="tab in tabs"
      :key="tab.key"
      class="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all"
      :class="
        modelValue === tab.key
          ? 'bg-white dark:bg-slate-600 text-purple-600 dark:text-purple-400 shadow-sm'
          : 'text-gray-600 dark:text-slate-400 hover:text-gray-800'
      "
      @click="$emit('update:modelValue', tab.key)"
    >
      <span class="material-icons text-lg">{{ tab.icon }}</span>
      <span class="hidden sm:inline">{{ tab.label }}</span>
    </button>
  </div>
</template>

<script setup>
defineProps({
  modelValue: {
    type: String,
    required: true
  },
  tabs: {
    type: Array,
    required: true
  }
})

defineEmits(['update:modelValue'])
</script>
