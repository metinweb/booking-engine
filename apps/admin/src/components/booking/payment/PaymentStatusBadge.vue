<template>
	<span
		class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
		:class="statusClass"
	>
		<span class="w-1.5 h-1.5 rounded-full mr-1" :class="dotClass"></span>
		{{ statusLabel }}
	</span>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
	status: {
		type: String,
		default: 'pending'
	}
})

const { t } = useI18n()

const statusClass = computed(() => {
	const classes = {
		pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
		partial: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
		paid: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
		completed: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
		refunded: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
		failed: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
		cancelled: 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300'
	}
	return classes[props.status] || classes.pending
})

const dotClass = computed(() => {
	const classes = {
		pending: 'bg-yellow-500',
		partial: 'bg-orange-500',
		paid: 'bg-green-500',
		completed: 'bg-green-500',
		refunded: 'bg-purple-500',
		failed: 'bg-red-500',
		cancelled: 'bg-gray-500'
	}
	return classes[props.status] || classes.pending
})

const statusLabel = computed(() => {
	const labels = {
		pending: t('payment.status.pending'),
		partial: t('payment.status.partial'),
		paid: t('payment.status.paid'),
		completed: t('payment.status.completed'),
		refunded: t('payment.status.refunded'),
		failed: t('payment.status.failed'),
		cancelled: t('payment.status.cancelled')
	}
	return labels[props.status] || props.status
})
</script>
