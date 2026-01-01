<template>
  <div
    v-show="isActive"
    :id="`tabpanel-${value}`"
    role="tabpanel"
    :aria-labelledby="`tab-${value}`"
    class="ui-tab-panel"
  >
    <slot></slot>
  </div>
</template>

<script setup>
import { computed, inject } from 'vue'

const props = defineProps({
  value: {
    type: [String, Number],
    required: true
  }
})

// Get current tab value from parent (if using provide/inject)
// Otherwise, pass activeTab as prop
const activeTab = inject('activeTab', null)

const isActive = computed(() => {
  if (activeTab) {
    return activeTab.value === props.value
  }
  return false
})
</script>
