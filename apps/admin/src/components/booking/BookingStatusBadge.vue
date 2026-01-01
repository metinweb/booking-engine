<template>
	<span
		class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
		:class="statusClasses"
	>
		<span v-if="showIcon" class="material-icons text-xs mr-1">{{ statusIcon }}</span>
		{{ statusText }}
	</span>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
	status: {
		type: String,
		required: true
	},
	showIcon: {
		type: Boolean,
		default: true
	}
})

const statusConfig = {
	pending: {
		text: 'booking.statusPending',
		icon: 'schedule',
		classes: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
	},
	confirmed: {
		text: 'booking.statusConfirmed',
		icon: 'check_circle',
		classes: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
	},
	cancelled: {
		text: 'booking.statusCancelled',
		icon: 'cancel',
		classes: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
	},
	completed: {
		text: 'booking.statusCompleted',
		icon: 'done_all',
		classes: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
	},
	no_show: {
		text: 'booking.statusNoShow',
		icon: 'person_off',
		classes: 'bg-gray-100 dark:bg-gray-700/30 text-gray-700 dark:text-gray-400'
	},
	on_request: {
		text: 'booking.statusOnRequest',
		icon: 'hourglass_empty',
		classes: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
	}
}

const statusClasses = computed(() => {
	return statusConfig[props.status]?.classes || 'bg-gray-100 text-gray-700'
})

const statusIcon = computed(() => {
	return statusConfig[props.status]?.icon || 'help'
})

const statusText = computed(() => {
	const key = statusConfig[props.status]?.text
	return key ? t(key) : props.status
})
</script>
