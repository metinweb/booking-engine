<template>
  <div class="ui-stepper">
    <!-- Steps header -->
    <div
      class="flex"
      :class="[
        orientation === 'horizontal' ? 'items-center' : 'flex-col',
        orientation === 'horizontal' && centered ? 'justify-center' : ''
      ]"
    >
      <template v-for="(step, index) in steps" :key="index">
        <!-- Step -->
        <div
          class="flex items-center"
          :class="[
            orientation === 'vertical' ? 'flex-row' : '',
            clickable && !step.disabled ? 'cursor-pointer' : ''
          ]"
          @click="handleStepClick(index)"
        >
          <!-- Step indicator -->
          <div class="flex flex-col items-center">
            <div
              class="flex items-center justify-center rounded-full font-semibold transition-all"
              :class="[stepSizeClasses, getStepColorClasses(index)]"
            >
              <!-- Completed icon -->
              <span
                v-if="isCompleted(index) && !step.error"
                class="material-icons"
                :class="iconSizeClasses"
              >
                check
              </span>
              <!-- Error icon -->
              <span v-else-if="step.error" class="material-icons" :class="iconSizeClasses">
                priority_high
              </span>
              <!-- Custom icon -->
              <span v-else-if="step.icon" class="material-icons" :class="iconSizeClasses">
                {{ step.icon }}
              </span>
              <!-- Step number -->
              <span v-else>{{ index + 1 }}</span>
            </div>

            <!-- Label (vertical layout) -->
            <div
              v-if="orientation === 'horizontal'"
              class="mt-2 text-center"
              :class="labelWidthClasses"
            >
              <p class="font-medium text-sm" :class="getLabelColorClasses(index)">
                {{ step.label }}
              </p>
              <p v-if="step.description" class="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                {{ step.description }}
              </p>
            </div>
          </div>

          <!-- Label (horizontal layout) -->
          <div v-if="orientation === 'vertical'" class="ml-4">
            <p class="font-medium" :class="getLabelColorClasses(index)">
              {{ step.label }}
            </p>
            <p v-if="step.description" class="text-sm text-gray-500 dark:text-slate-400">
              {{ step.description }}
            </p>
          </div>
        </div>

        <!-- Connector -->
        <div
          v-if="index < steps.length - 1"
          :class="[
            orientation === 'horizontal' ? 'flex-1 mx-4' : 'ml-[18px] my-2',
            orientation === 'horizontal' ? 'h-0.5' : 'w-0.5 h-8'
          ]"
        >
          <div class="h-full w-full transition-colors" :class="getConnectorClasses(index)"></div>
        </div>
      </template>
    </div>

    <!-- Content area -->
    <div v-if="$slots.default" class="mt-6">
      <slot :current-step="modelValue" :step="currentStepData"></slot>
    </div>

    <!-- Navigation buttons -->
    <div v-if="showNavigation" class="flex items-center justify-between mt-6">
      <button
        type="button"
        class="px-4 py-2 text-sm font-medium rounded-lg transition-colors text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="modelValue === 0"
        @click="prev"
      >
        <span class="material-icons text-sm align-middle mr-1">arrow_back</span>
        {{ prevLabel }}
      </button>

      <button
        type="button"
        class="px-4 py-2 text-sm font-medium rounded-lg transition-colors bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="modelValue === steps.length - 1 && !finishable"
        @click="next"
      >
        {{ modelValue === steps.length - 1 ? finishLabel : nextLabel }}
        <span
          v-if="modelValue !== steps.length - 1"
          class="material-icons text-sm align-middle ml-1"
          >arrow_forward</span
        >
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: Number,
    default: 0
  },
  // Steps array
  steps: {
    type: Array,
    required: true
    // Each step: { label, description?, icon?, disabled?, error? }
  },
  // Size
  size: {
    type: String,
    default: 'md',
    validator: v => ['sm', 'md', 'lg'].includes(v)
  },
  // Orientation
  orientation: {
    type: String,
    default: 'horizontal',
    validator: v => ['horizontal', 'vertical'].includes(v)
  },
  // Color
  color: {
    type: String,
    default: 'indigo',
    validator: v => ['indigo', 'blue', 'green', 'purple', 'amber'].includes(v)
  },
  // Clickable steps
  clickable: {
    type: Boolean,
    default: false
  },
  // Linear (must complete in order)
  linear: {
    type: Boolean,
    default: true
  },
  // Show navigation buttons
  showNavigation: {
    type: Boolean,
    default: false
  },
  // Center steps (horizontal only)
  centered: {
    type: Boolean,
    default: false
  },
  // Navigation labels
  prevLabel: {
    type: String,
    default: 'Back'
  },
  nextLabel: {
    type: String,
    default: 'Next'
  },
  finishLabel: {
    type: String,
    default: 'Finish'
  },
  // Allow finishing
  finishable: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:modelValue', 'step-click', 'finish'])

// Current step data
const currentStepData = computed(() => props.steps[props.modelValue] || null)

// Check if step is completed
const isCompleted = index => {
  return index < props.modelValue
}

// Check if step is active
const isActive = index => {
  return index === props.modelValue
}

// Handle step click
const handleStepClick = index => {
  if (!props.clickable) return
  if (props.steps[index]?.disabled) return

  // In linear mode, can only go to completed steps or next step
  if (props.linear && index > props.modelValue + 1) return

  emit('update:modelValue', index)
  emit('step-click', index)
}

// Navigation
const prev = () => {
  if (props.modelValue > 0) {
    emit('update:modelValue', props.modelValue - 1)
  }
}

const next = () => {
  if (props.modelValue < props.steps.length - 1) {
    emit('update:modelValue', props.modelValue + 1)
  } else if (props.finishable) {
    emit('finish')
  }
}

// Step size classes
const stepSizeClasses = computed(() => {
  const sizes = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
    lg: 'w-11 h-11 text-base'
  }
  return sizes[props.size]
})

// Icon size classes
const iconSizeClasses = computed(() => {
  const sizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }
  return sizes[props.size]
})

// Label width classes
const labelWidthClasses = computed(() => {
  const widths = {
    sm: 'w-20',
    md: 'w-24',
    lg: 'w-32'
  }
  return widths[props.size]
})

// Get step color classes
const getStepColorClasses = index => {
  const step = props.steps[index]

  if (step?.error) {
    return 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-2 border-red-500'
  }

  if (isCompleted(index)) {
    const colors = {
      indigo: 'bg-indigo-600 text-white',
      blue: 'bg-blue-600 text-white',
      green: 'bg-green-600 text-white',
      purple: 'bg-purple-600 text-white',
      amber: 'bg-amber-500 text-white'
    }
    return colors[props.color]
  }

  if (isActive(index)) {
    const colors = {
      indigo:
        'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-2 border-indigo-600 dark:border-indigo-400',
      blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-2 border-blue-600 dark:border-blue-400',
      green:
        'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 border-2 border-green-600 dark:border-green-400',
      purple:
        'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border-2 border-purple-600 dark:border-purple-400',
      amber:
        'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-2 border-amber-600 dark:border-amber-400'
    }
    return colors[props.color]
  }

  return 'bg-gray-200 dark:bg-slate-600 text-gray-500 dark:text-slate-400'
}

// Get label color classes
const getLabelColorClasses = index => {
  const step = props.steps[index]

  if (step?.error) {
    return 'text-red-600 dark:text-red-400'
  }

  if (isCompleted(index) || isActive(index)) {
    return 'text-gray-900 dark:text-white'
  }

  return 'text-gray-500 dark:text-slate-400'
}

// Get connector classes
const getConnectorClasses = index => {
  if (isCompleted(index)) {
    const colors = {
      indigo: 'bg-indigo-600 dark:bg-indigo-500',
      blue: 'bg-blue-600 dark:bg-blue-500',
      green: 'bg-green-600 dark:bg-green-500',
      purple: 'bg-purple-600 dark:bg-purple-500',
      amber: 'bg-amber-500 dark:bg-amber-400'
    }
    return colors[props.color]
  }

  return 'bg-gray-200 dark:bg-slate-600'
}

// Expose methods
defineExpose({ prev, next })
</script>
