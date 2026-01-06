<template>
  <div class="bg-white dark:bg-slate-800 rounded-lg shadow p-4">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm text-gray-500 dark:text-slate-400">
          {{ label }}
        </p>
        <p class="text-2xl font-bold" :class="valueColorClass">
          {{ formattedValue }}
        </p>
      </div>
      <div class="p-3 rounded-full" :class="iconBgClass">
        <span class="material-icons" :class="iconColorClass">{{ icon }}</span>
      </div>
    </div>
    <div v-if="trend !== null" class="mt-2 flex items-center text-sm">
      <span
        class="material-icons text-sm mr-1"
        :class="trend >= 0 ? 'text-green-500' : 'text-red-500'"
      >
        {{ trend >= 0 ? 'trending_up' : 'trending_down' }}
      </span>
      <span :class="trend >= 0 ? 'text-green-500' : 'text-red-500'">
        {{ Math.abs(trend) }}%
      </span>
      <span class="text-gray-400 dark:text-slate-500 ml-1">{{ trendLabel }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  label: {
    type: String,
    required: true
  },
  value: {
    type: [Number, String],
    required: true
  },
  icon: {
    type: String,
    default: 'analytics'
  },
  color: {
    type: String,
    default: 'purple',
    validator: value =>
      ['purple', 'green', 'red', 'yellow', 'blue', 'orange', 'gray', 'indigo'].includes(value)
  },
  trend: {
    type: Number,
    default: null
  },
  trendLabel: {
    type: String,
    default: ''
  },
  format: {
    type: String,
    default: 'number',
    validator: value => ['number', 'currency', 'percent', 'none'].includes(value)
  },
  currency: {
    type: String,
    default: 'TRY'
  }
})

const colorClasses = {
  purple: {
    value: 'text-gray-800 dark:text-white',
    iconBg: 'bg-purple-100 dark:bg-purple-900/30',
    icon: 'text-purple-600 dark:text-purple-400'
  },
  green: {
    value: 'text-green-600',
    iconBg: 'bg-green-100 dark:bg-green-900/30',
    icon: 'text-green-600 dark:text-green-400'
  },
  red: {
    value: 'text-red-600',
    iconBg: 'bg-red-100 dark:bg-red-900/30',
    icon: 'text-red-600 dark:text-red-400'
  },
  yellow: {
    value: 'text-yellow-600',
    iconBg: 'bg-yellow-100 dark:bg-yellow-900/30',
    icon: 'text-yellow-600 dark:text-yellow-400'
  },
  blue: {
    value: 'text-blue-600',
    iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    icon: 'text-blue-600 dark:text-blue-400'
  },
  orange: {
    value: 'text-orange-600',
    iconBg: 'bg-orange-100 dark:bg-orange-900/30',
    icon: 'text-orange-600 dark:text-orange-400'
  },
  gray: {
    value: 'text-gray-600',
    iconBg: 'bg-gray-100 dark:bg-gray-900/30',
    icon: 'text-gray-600 dark:text-gray-400'
  },
  indigo: {
    value: 'text-indigo-600',
    iconBg: 'bg-indigo-100 dark:bg-indigo-900/30',
    icon: 'text-indigo-600 dark:text-indigo-400'
  }
}

const valueColorClass = computed(() => colorClasses[props.color].value)
const iconBgClass = computed(() => colorClasses[props.color].iconBg)
const iconColorClass = computed(() => colorClasses[props.color].icon)

const formattedValue = computed(() => {
  const num = Number(props.value)

  switch (props.format) {
    case 'currency':
      return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: props.currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(num)
    case 'percent':
      return `${num}%`
    case 'number':
      return new Intl.NumberFormat('tr-TR').format(num)
    default:
      return props.value
  }
})
</script>
