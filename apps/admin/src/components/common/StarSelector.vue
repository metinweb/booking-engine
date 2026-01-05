<template>
  <div class="star-selector">
    <label v-if="label" class="form-label"
      >{{ label }} <span v-if="required" class="text-red-500">*</span></label
    >
    <div class="flex items-center gap-1">
      <button
        v-for="n in maxStars"
        :key="n"
        type="button"
        class="star-btn p-1 rounded transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
        :class="[
          n <= (hoverValue || modelValue)
            ? 'text-yellow-400 hover:text-yellow-500'
            : 'text-gray-300 dark:text-slate-600 hover:text-yellow-300',
          { 'scale-110': n === hoverValue }
        ]"
        :disabled="disabled"
        @click="selectStar(n)"
        @mouseenter="hoverValue = n"
        @mouseleave="hoverValue = 0"
      >
        <span class="material-icons text-2xl">
          {{ n <= (hoverValue || modelValue) ? 'star' : 'star_outline' }}
        </span>
      </button>
      <span v-if="showLabel" class="ml-2 text-sm text-gray-600 dark:text-slate-400">
        {{ modelValue }} {{ $t('hotels.stars') }}
      </span>
    </div>
    <p v-if="help" class="mt-1 text-xs text-gray-500 dark:text-slate-400">{{ help }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  modelValue: {
    type: Number,
    default: 3
  },
  maxStars: {
    type: Number,
    default: 5
  },
  label: {
    type: String,
    default: ''
  },
  required: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  showLabel: {
    type: Boolean,
    default: true
  },
  help: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue'])

const hoverValue = ref(0)

const selectStar = n => {
  if (!props.disabled) {
    emit('update:modelValue', n)
  }
}
</script>

<style scoped>
.star-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
</style>
