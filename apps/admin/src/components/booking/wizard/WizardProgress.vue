<template>
	<div class="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
		<!-- Desktop Progress -->
		<div class="hidden md:flex items-center justify-between px-6 py-4">
			<div
				v-for="(step, index) in steps"
				:key="step.id"
				class="flex items-center"
				:class="{ 'flex-1': index < steps.length - 1 }"
			>
				<!-- Step Circle -->
				<button
					@click="goToStep(step.id)"
					:disabled="!canNavigateToStep(step.id)"
					class="flex items-center group"
					:class="{ 'cursor-pointer': canNavigateToStep(step.id), 'cursor-not-allowed opacity-50': !canNavigateToStep(step.id) }"
				>
					<div
						class="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200"
						:class="getStepCircleClass(step.id)"
					>
						<span v-if="isStepCompleted(step.id)" class="material-icons text-white">check</span>
						<span v-else class="font-semibold">{{ step.id }}</span>
					</div>
					<div class="ml-3">
						<p
							class="text-sm font-medium transition-colors"
							:class="getStepLabelClass(step.id)"
						>
							{{ step.label }}
						</p>
						<p v-if="step.description" class="text-xs text-gray-400 dark:text-slate-500">
							{{ step.description }}
						</p>
					</div>
				</button>

				<!-- Connector Line -->
				<div
					v-if="index < steps.length - 1"
					class="flex-1 h-0.5 mx-4 transition-colors duration-200"
					:class="isStepCompleted(step.id) ? 'bg-purple-500' : 'bg-gray-200 dark:bg-slate-700'"
				/>
			</div>
		</div>

		<!-- Mobile Progress -->
		<div class="md:hidden px-4 py-3">
			<div class="flex items-center justify-between mb-2">
				<span class="text-sm font-medium text-gray-700 dark:text-slate-300">
					{{ currentStepLabel }}
				</span>
				<span class="text-sm text-gray-500 dark:text-slate-400">
					{{ $t('booking.stepOf', { current: currentStep, total: totalSteps }) }}
				</span>
			</div>
			<!-- Progress Bar -->
			<div class="w-full h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
				<div
					class="h-full bg-purple-500 transition-all duration-300 rounded-full"
					:style="{ width: `${progressPercent}%` }"
				/>
			</div>
			<!-- Step Dots -->
			<div class="flex justify-between mt-2">
				<button
					v-for="step in steps"
					:key="step.id"
					@click="goToStep(step.id)"
					:disabled="!canNavigateToStep(step.id)"
					class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-all"
					:class="getMobileStepClass(step.id)"
				>
					<span v-if="isStepCompleted(step.id)" class="material-icons text-xs">check</span>
					<span v-else>{{ step.id }}</span>
				</button>
			</div>
		</div>
	</div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
	currentStep: {
		type: Number,
		required: true
	},
	totalSteps: {
		type: Number,
		default: 5
	},
	stepValidation: {
		type: Object,
		default: () => ({})
	}
})

const emit = defineEmits(['update:currentStep'])

// Steps configuration
const steps = computed(() => [
	{ id: 1, label: t('booking.steps.search'), description: t('booking.steps.searchDesc') },
	{ id: 2, label: t('booking.steps.rooms'), description: t('booking.steps.roomsDesc') },
	{ id: 3, label: t('booking.steps.cart'), description: t('booking.steps.cartDesc') },
	{ id: 4, label: t('booking.steps.guests'), description: t('booking.steps.guestsDesc') },
	{ id: 5, label: t('booking.steps.summary'), description: t('booking.steps.summaryDesc') }
])

// Progress percent for mobile
const progressPercent = computed(() => {
	return ((props.currentStep - 1) / (props.totalSteps - 1)) * 100
})

// Current step label
const currentStepLabel = computed(() => {
	const step = steps.value.find(s => s.id === props.currentStep)
	return step?.label || ''
})

// Check if step is completed
const isStepCompleted = (stepId) => {
	return stepId < props.currentStep
}

// Check if step is current
const isStepCurrent = (stepId) => {
	return stepId === props.currentStep
}

// Check if can navigate to step
const canNavigateToStep = (stepId) => {
	// Can always go back
	if (stepId < props.currentStep) return true
	// Can only go forward if all previous steps are valid
	for (let i = 1; i < stepId; i++) {
		if (!props.stepValidation[i]) return false
	}
	return true
}

// Navigate to step
const goToStep = (stepId) => {
	if (canNavigateToStep(stepId)) {
		emit('update:currentStep', stepId)
	}
}

// Step circle class
const getStepCircleClass = (stepId) => {
	if (isStepCompleted(stepId)) {
		return 'bg-purple-500 text-white'
	}
	if (isStepCurrent(stepId)) {
		return 'bg-purple-500 text-white ring-4 ring-purple-100 dark:ring-purple-900/30'
	}
	return 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400'
}

// Step label class
const getStepLabelClass = (stepId) => {
	if (isStepCurrent(stepId) || isStepCompleted(stepId)) {
		return 'text-gray-900 dark:text-white'
	}
	return 'text-gray-500 dark:text-slate-400'
}

// Mobile step class
const getMobileStepClass = (stepId) => {
	if (isStepCompleted(stepId)) {
		return 'bg-purple-500 text-white'
	}
	if (isStepCurrent(stepId)) {
		return 'bg-purple-500 text-white'
	}
	if (canNavigateToStep(stepId)) {
		return 'bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-slate-400'
	}
	return 'bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500 cursor-not-allowed'
}
</script>
