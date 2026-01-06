<template>
  <div class="relative" :class="wrapperClass">
    <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
      <span class="material-icons text-lg">search</span>
    </span>
    <input
      :value="modelValue"
      type="text"
      :placeholder="placeholder"
      class="form-input w-full pl-10 pr-8"
      @input="handleInput"
      @keyup.enter="$emit('search')"
    />
    <button
      v-if="modelValue"
      class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
      type="button"
      @click="handleClear"
    >
      <span class="material-icons text-lg">close</span>
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  placeholder: {
    type: String,
    default: ''
  },
  debounce: {
    type: Number,
    default: 300
  },
  wrapperClass: {
    type: String,
    default: 'flex-1 min-w-[250px]'
  }
})

const emit = defineEmits(['update:modelValue', 'search', 'clear'])

let debounceTimer = ref(null)

const handleInput = event => {
  const value = event.target.value
  emit('update:modelValue', value)

  if (props.debounce > 0) {
    clearTimeout(debounceTimer.value)
    debounceTimer.value = setTimeout(() => {
      emit('search')
    }, props.debounce)
  }
}

const handleClear = () => {
  emit('update:modelValue', '')
  emit('clear')
}
</script>
