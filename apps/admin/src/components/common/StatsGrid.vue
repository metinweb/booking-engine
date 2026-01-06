<template>
  <div class="grid gap-4 mb-6" :class="gridColsClass">
    <StatsCard
      v-for="stat in stats"
      :key="stat.key || stat.label"
      :label="stat.label"
      :value="stat.value"
      :icon="stat.icon"
      :color="stat.color"
      :trend="stat.trend"
      :trend-label="stat.trendLabel"
      :format="stat.format"
      :currency="stat.currency"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import StatsCard from './StatsCard.vue'

const props = defineProps({
  stats: {
    type: Array,
    required: true,
    validator: stats =>
      stats.every(s => s.label !== undefined && s.value !== undefined)
  },
  cols: {
    type: [Number, Object],
    default: () => ({ default: 2, md: 4, lg: 5 })
  }
})

const gridColsClass = computed(() => {
  if (typeof props.cols === 'number') {
    return `grid-cols-${props.cols}`
  }

  const classes = []
  if (props.cols.default) classes.push(`grid-cols-${props.cols.default}`)
  if (props.cols.sm) classes.push(`sm:grid-cols-${props.cols.sm}`)
  if (props.cols.md) classes.push(`md:grid-cols-${props.cols.md}`)
  if (props.cols.lg) classes.push(`lg:grid-cols-${props.cols.lg}`)
  if (props.cols.xl) classes.push(`xl:grid-cols-${props.cols.xl}`)

  return classes.join(' ')
})
</script>
