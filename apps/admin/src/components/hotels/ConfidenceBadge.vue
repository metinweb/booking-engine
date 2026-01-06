<template>
  <span v-if="score" :class="['text-xs px-2 py-0.5 rounded-full', colorClass]">
    {{ score }}%
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  score: {
    type: Number,
    default: 0
  }
})

const colorClass = computed(() => {
  if (props.score >= 80) {
    return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
  }
  if (props.score >= 50) {
    return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
  }
  return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
})
</script>
