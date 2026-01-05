<template>
  <div :class="['rounded-xl p-6 transition-all hover:shadow-lg', colorClasses.bg]">
    <div class="flex items-center justify-between">
      <div>
        <p :class="['text-sm font-medium', colorClasses.text]">{{ title }}</p>
        <p class="text-3xl font-bold text-gray-800 dark:text-white mt-2">
          {{ formattedValue }}
        </p>
        <p v-if="subValue !== undefined" class="text-sm text-gray-500 dark:text-slate-400 mt-1">
          {{ subLabel }}: <span class="font-semibold">{{ subValue }}</span>
        </p>
      </div>
      <div :class="['w-14 h-14 rounded-xl flex items-center justify-center', colorClasses.iconBg]">
        <span :class="['material-icons text-2xl', colorClasses.icon]">{{ icon }}</span>
      </div>
    </div>
    <div v-if="trend !== undefined" class="mt-4 flex items-center">
      <span
        :class="[
          'inline-flex items-center text-sm font-medium',
          trend >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
        ]"
      >
        <span class="material-icons text-sm mr-1">{{
          trend >= 0 ? 'trending_up' : 'trending_down'
        }}</span>
        {{ Math.abs(trend) }}%
      </span>
      <span class="text-sm text-gray-500 dark:text-slate-400 ml-2">{{ trendLabel }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: { type: String, required: true },
  value: { type: [Number, String], required: true },
  icon: { type: String, default: 'analytics' },
  color: { type: String, default: 'purple' },
  format: { type: String, default: 'number' }, // number, currency, percent
  currency: { type: String, default: '₺' },
  subLabel: { type: String, default: '' },
  subValue: { type: [Number, String], default: undefined },
  trend: { type: Number, default: undefined },
  trendLabel: { type: String, default: 'vs last month' }
})

const colorClasses = computed(() => {
  const colors = {
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      text: 'text-purple-600 dark:text-purple-400',
      iconBg: 'bg-purple-100 dark:bg-purple-900/40',
      icon: 'text-purple-600 dark:text-purple-400'
    },
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      text: 'text-blue-600 dark:text-blue-400',
      iconBg: 'bg-blue-100 dark:bg-blue-900/40',
      icon: 'text-blue-600 dark:text-blue-400'
    },
    green: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      text: 'text-green-600 dark:text-green-400',
      iconBg: 'bg-green-100 dark:bg-green-900/40',
      icon: 'text-green-600 dark:text-green-400'
    },
    orange: {
      bg: 'bg-orange-50 dark:bg-orange-900/20',
      text: 'text-orange-600 dark:text-orange-400',
      iconBg: 'bg-orange-100 dark:bg-orange-900/40',
      icon: 'text-orange-600 dark:text-orange-400'
    },
    red: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      text: 'text-red-600 dark:text-red-400',
      iconBg: 'bg-red-100 dark:bg-red-900/40',
      icon: 'text-red-600 dark:text-red-400'
    },
    cyan: {
      bg: 'bg-cyan-50 dark:bg-cyan-900/20',
      text: 'text-cyan-600 dark:text-cyan-400',
      iconBg: 'bg-cyan-100 dark:bg-cyan-900/40',
      icon: 'text-cyan-600 dark:text-cyan-400'
    }
  }
  return colors[props.color] || colors.purple
})

const formattedValue = computed(() => {
  if (props.format === 'currency') {
    return `${props.currency}${Number(props.value).toLocaleString('tr-TR')}`
  }
  if (props.format === 'percent') {
    return `${props.value}%`
  }
  return Number(props.value).toLocaleString('tr-TR')
})
</script>
