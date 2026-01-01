<template>
  <div class="ui-accordion" :class="containerClasses">
    <slot></slot>
  </div>
</template>

<script setup>
import { provide, ref, computed } from 'vue'

const props = defineProps({
  // Allow multiple items to be open
  multiple: {
    type: Boolean,
    default: false
  },
  // Default open items (array of keys)
  defaultOpen: {
    type: Array,
    default: () => []
  },
  // Variant
  variant: {
    type: String,
    default: 'default',
    validator: (v) => ['default', 'bordered', 'separated'].includes(v)
  },
  // Icon position
  iconPosition: {
    type: String,
    default: 'right',
    validator: (v) => ['left', 'right'].includes(v)
  }
})

const openItems = ref(new Set(props.defaultOpen))

// Toggle item
const toggleItem = (key) => {
  if (props.multiple) {
    if (openItems.value.has(key)) {
      openItems.value.delete(key)
    } else {
      openItems.value.add(key)
    }
    openItems.value = new Set(openItems.value) // Trigger reactivity
  } else {
    if (openItems.value.has(key)) {
      openItems.value.clear()
    } else {
      openItems.value.clear()
      openItems.value.add(key)
    }
    openItems.value = new Set(openItems.value) // Trigger reactivity
  }
}

// Check if item is open
const isItemOpen = (key) => {
  return openItems.value.has(key)
}

// Container classes
const containerClasses = computed(() => {
  const variants = {
    default: 'divide-y divide-gray-200 dark:divide-slate-700',
    bordered: 'border border-gray-200 dark:border-slate-700 rounded-lg divide-y divide-gray-200 dark:divide-slate-700',
    separated: 'space-y-2'
  }
  return variants[props.variant]
})

// Provide to children
provide('accordion', {
  toggleItem,
  isItemOpen,
  variant: props.variant,
  iconPosition: props.iconPosition
})
</script>
