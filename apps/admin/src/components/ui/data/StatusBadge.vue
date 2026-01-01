<template>
  <span
    class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
    :class="[badgeClasses, sizeClasses]"
  >
    <span v-if="icon" class="material-icons" :class="iconSizeClass">{{ icon }}</span>
    <span v-if="dot" class="w-1.5 h-1.5 rounded-full" :class="dotClass"></span>
    <slot>{{ label }}</slot>
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  // Status value
  status: {
    type: String,
    default: ''
  },
  // Direct label text
  label: {
    type: String,
    default: ''
  },
  // Variant color
  variant: {
    type: String,
    default: 'gray',
    validator: (v) => ['gray', 'green', 'red', 'yellow', 'blue', 'indigo', 'purple', 'pink', 'amber', 'orange', 'teal', 'cyan'].includes(v)
  },
  // Size
  size: {
    type: String,
    default: 'sm',
    validator: (v) => ['xs', 'sm', 'md', 'lg'].includes(v)
  },
  // Icon (material icon name)
  icon: {
    type: String,
    default: ''
  },
  // Show dot indicator
  dot: {
    type: Boolean,
    default: false
  },
  // Status mapping for automatic variant
  statusMap: {
    type: Object,
    default: () => ({
      // Common statuses
      active: { variant: 'green', label: 'Aktif' },
      inactive: { variant: 'gray', label: 'Pasif' },
      pending: { variant: 'yellow', label: 'Bekliyor' },
      approved: { variant: 'green', label: 'Onaylandi' },
      rejected: { variant: 'red', label: 'Reddedildi' },
      cancelled: { variant: 'red', label: 'Iptal' },
      completed: { variant: 'green', label: 'Tamamlandi' },
      processing: { variant: 'blue', label: 'Isleniyor' },

      // PMS specific
      confirmed: { variant: 'green', label: 'Onaylandi' },
      checked_in: { variant: 'indigo', label: 'Giris Yapildi' },
      checked_out: { variant: 'gray', label: 'Cikis Yapildi' },
      no_show: { variant: 'red', label: 'Gelmedi' },

      // Room status
      vacant_clean: { variant: 'green', label: 'Bos-Temiz' },
      vacant_dirty: { variant: 'amber', label: 'Bos-Kirli' },
      occupied: { variant: 'blue', label: 'Dolu' },
      checkout: { variant: 'purple', label: 'Cikis' },
      maintenance: { variant: 'red', label: 'Bakim' },

      // Housekeeping
      clean: { variant: 'green', label: 'Temiz' },
      dirty: { variant: 'amber', label: 'Kirli' },
      inspecting: { variant: 'blue', label: 'Kontrol' },
      out_of_order: { variant: 'red', label: 'Ariza' },

      // Payment
      paid: { variant: 'green', label: 'Odendi' },
      unpaid: { variant: 'red', label: 'Odenmedi' },
      partial: { variant: 'yellow', label: 'Kismi' },
      refunded: { variant: 'purple', label: 'Iade' }
    })
  }
})

// Get status info from map
const statusInfo = computed(() => {
  if (props.status && props.statusMap[props.status]) {
    return props.statusMap[props.status]
  }
  return null
})

// Final variant
const finalVariant = computed(() => {
  return statusInfo.value?.variant || props.variant
})

// Final label
const finalLabel = computed(() => {
  return props.label || statusInfo.value?.label || props.status
})

// Badge color classes
const badgeClasses = computed(() => {
  const variants = {
    gray: 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-gray-300',
    green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    yellow: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    indigo: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
    purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    pink: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    teal: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
    cyan: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400'
  }
  return variants[finalVariant.value] || variants.gray
})

// Size classes
const sizeClasses = computed(() => {
  const sizes = {
    xs: 'text-[10px] px-1.5 py-0.5',
    sm: 'text-xs px-2.5 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2'
  }
  return sizes[props.size] || sizes.sm
})

// Icon size class
const iconSizeClass = computed(() => {
  const sizes = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  }
  return sizes[props.size] || sizes.sm
})

// Dot class
const dotClass = computed(() => {
  const dots = {
    gray: 'bg-gray-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    blue: 'bg-blue-500',
    indigo: 'bg-indigo-500',
    purple: 'bg-purple-500',
    pink: 'bg-pink-500',
    amber: 'bg-amber-500',
    orange: 'bg-orange-500',
    teal: 'bg-teal-500',
    cyan: 'bg-cyan-500'
  }
  return dots[finalVariant.value] || dots.gray
})
</script>
