<template>
	<div class="relative">
		<!-- Display Field -->
		<div
			@click="openPicker"
			class="form-input w-full cursor-pointer flex items-center justify-between transition-colors"
			:class="[
				inputClass,
				disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-purple-400'
			]"
		>
			<div class="flex items-center gap-2">
				<span class="material-icons text-gray-400 text-lg">cake</span>
				<span v-if="displayValue" class="text-gray-900 dark:text-white">{{ displayValue }}</span>
				<span v-else class="text-gray-400 dark:text-slate-500">{{ placeholder || $t('booking.selectBirthDate') }}</span>
			</div>
			<span class="material-icons text-gray-400 text-lg">calendar_today</span>
		</div>

		<!-- Picker Modal -->
		<Teleport to="body">
			<Transition name="fade">
				<div v-if="showPicker" class="fixed inset-0 z-[9999] flex items-center justify-center p-4">
					<!-- Backdrop -->
					<div class="absolute inset-0 bg-black/50" @click="closePicker"></div>

					<!-- Picker Content -->
					<div class="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
						<!-- Header -->
						<div class="bg-purple-600 dark:bg-purple-700 text-white p-4">
							<div class="text-sm opacity-80 mb-1">{{ $t('booking.birthDate') }}</div>
							<div class="text-2xl font-semibold">{{ headerDisplay }}</div>
						</div>

						<!-- Selectors -->
						<div class="p-4">
							<!-- Day/Month/Year Selectors -->
							<div class="grid grid-cols-3 gap-3 mb-4">
								<!-- Day -->
								<div>
									<label class="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1 text-center">
										{{ $t('booking.day') }}
									</label>
									<div class="relative">
										<select
											v-model="selectedDay"
											class="form-input w-full text-center appearance-none pr-8 font-medium"
											autocomplete="off"
										>
											<option v-for="d in daysInMonth" :key="d" :value="d">{{ d }}</option>
										</select>
										<span class="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
											<span class="material-icons text-gray-400 text-sm">expand_more</span>
										</span>
									</div>
								</div>

								<!-- Month -->
								<div>
									<label class="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1 text-center">
										{{ $t('booking.month') }}
									</label>
									<div class="relative">
										<select
											v-model="selectedMonth"
											class="form-input w-full text-center appearance-none pr-8 font-medium"
											autocomplete="off"
										>
											<option v-for="(month, index) in months" :key="index" :value="index + 1">
												{{ month }}
											</option>
										</select>
										<span class="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
											<span class="material-icons text-gray-400 text-sm">expand_more</span>
										</span>
									</div>
								</div>

								<!-- Year -->
								<div>
									<label class="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-1 text-center">
										{{ $t('booking.year') }}
									</label>
									<div class="relative">
										<select
											v-model="selectedYear"
											class="form-input w-full text-center appearance-none pr-8 font-medium"
											autocomplete="off"
										>
											<option v-for="y in years" :key="y" :value="y">{{ y }}</option>
										</select>
										<span class="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
											<span class="material-icons text-gray-400 text-sm">expand_more</span>
										</span>
									</div>
								</div>
							</div>

							<!-- Quick Age Buttons -->
							<div class="mb-4">
								<label class="block text-xs font-medium text-gray-500 dark:text-slate-400 mb-2">
									{{ $t('booking.quickSelect') }}
								</label>
								<div class="flex flex-wrap gap-2">
									<button
										v-for="age in quickAges"
										:key="age"
										type="button"
										@click="setAge(age)"
										class="px-3 py-1.5 text-sm rounded-full border transition-colors"
										:class="currentAge === age
											? 'bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300'
											: 'border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-400 hover:border-purple-300 dark:hover:border-purple-600'"
									>
										{{ age }} {{ $t('booking.yearsOld') }}
									</button>
								</div>
							</div>

							<!-- Age Display -->
							<div v-if="currentAge !== null" class="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 mb-4">
								<div class="flex items-center justify-center gap-2 text-purple-700 dark:text-purple-300">
									<span class="material-icons">person</span>
									<span class="font-medium">{{ currentAge }} {{ $t('booking.yearsOld') }}</span>
								</div>
							</div>

							<!-- Age Mismatch Warning -->
							<div v-if="hasAgeMismatch" class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3 mb-4">
								<div class="flex items-start gap-2 text-sm text-yellow-800 dark:text-yellow-300">
									<span class="material-icons text-yellow-600 dark:text-yellow-400 flex-shrink-0">warning</span>
									<div>
										<p class="font-medium">{{ $t('booking.ageWarningTitle') }}</p>
										<p class="text-yellow-700 dark:text-yellow-400 text-xs mt-0.5">
											{{ $t('booking.ageWarningMessage', { searchAge: expectedAge, checkInAge: ageAtCheckIn }) }}
										</p>
									</div>
								</div>
							</div>
						</div>

						<!-- Actions -->
						<div class="flex border-t border-gray-200 dark:border-slate-700">
							<button
								type="button"
								@click="clearDate"
								class="flex-1 px-4 py-3 text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
							>
								{{ $t('common.clear') }}
							</button>
							<button
								type="button"
								@click="closePicker"
								class="flex-1 px-4 py-3 text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors border-l border-gray-200 dark:border-slate-700"
							>
								{{ $t('common.cancel') }}
							</button>
							<button
								type="button"
								@click="confirmDate"
								class="flex-1 px-4 py-3 text-purple-600 dark:text-purple-400 font-medium hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors border-l border-gray-200 dark:border-slate-700"
							>
								{{ $t('common.confirm') }}
							</button>
						</div>
					</div>
				</div>
			</Transition>
		</Teleport>
	</div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
	modelValue: {
		type: String,
		default: ''
	},
	placeholder: {
		type: String,
		default: ''
	},
	disabled: {
		type: Boolean,
		default: false
	},
	inputClass: {
		type: String,
		default: ''
	},
	minAge: {
		type: Number,
		default: 0
	},
	maxAge: {
		type: Number,
		default: 100
	},
	expectedAge: {
		type: Number,
		default: null
	},
	checkInDate: {
		type: String,
		default: ''
	}
})

const emit = defineEmits(['update:modelValue'])

const { t, locale } = useI18n()

const showPicker = ref(false)
const selectedDay = ref(1)
const selectedMonth = ref(1)
const selectedYear = ref(2000)

// Months
const months = computed(() => {
	const formatter = new Intl.DateTimeFormat(locale.value, { month: 'long' })
	return Array.from({ length: 12 }, (_, i) => {
		const date = new Date(2000, i, 1)
		return formatter.format(date)
	})
})

// Years (from minAge to maxAge years ago)
const years = computed(() => {
	const currentYear = new Date().getFullYear()
	const startYear = currentYear - props.maxAge
	const endYear = currentYear - props.minAge
	return Array.from({ length: endYear - startYear + 1 }, (_, i) => endYear - i)
})

// Days in selected month
const daysInMonth = computed(() => {
	const days = new Date(selectedYear.value, selectedMonth.value, 0).getDate()
	return Array.from({ length: days }, (_, i) => i + 1)
})

// Quick age buttons
const quickAges = computed(() => {
	if (props.maxAge <= 17) {
		// Child mode
		return [2, 4, 6, 8, 10, 12, 14, 16]
	}
	// Adult mode
	return [18, 25, 30, 35, 40, 50, 60]
})

// Current age based on selected date
const currentAge = computed(() => {
	const today = new Date()
	const birthDate = new Date(selectedYear.value, selectedMonth.value - 1, selectedDay.value)
	let age = today.getFullYear() - birthDate.getFullYear()
	const monthDiff = today.getMonth() - birthDate.getMonth()
	if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
		age--
	}
	return age >= 0 ? age : null
})

// Age at check-in date
const ageAtCheckIn = computed(() => {
	if (!props.checkInDate) return null
	const birthDate = new Date(selectedYear.value, selectedMonth.value - 1, selectedDay.value)
	const checkIn = new Date(props.checkInDate)
	let age = checkIn.getFullYear() - birthDate.getFullYear()
	const monthDiff = checkIn.getMonth() - birthDate.getMonth()
	if (monthDiff < 0 || (monthDiff === 0 && checkIn.getDate() < birthDate.getDate())) {
		age--
	}
	return age >= 0 ? age : null
})

// Check if age at check-in differs from expected age
const hasAgeMismatch = computed(() => {
	if (props.expectedAge === null || ageAtCheckIn.value === null) return false
	return ageAtCheckIn.value !== props.expectedAge
})

// Display value
const displayValue = computed(() => {
	if (!props.modelValue) return ''
	const date = new Date(props.modelValue)
	if (isNaN(date.getTime())) return ''
	return new Intl.DateTimeFormat(locale.value, {
		day: 'numeric',
		month: 'long',
		year: 'numeric'
	}).format(date)
})

// Header display
const headerDisplay = computed(() => {
	const date = new Date(selectedYear.value, selectedMonth.value - 1, selectedDay.value)
	return new Intl.DateTimeFormat(locale.value, {
		weekday: 'short',
		day: 'numeric',
		month: 'long',
		year: 'numeric'
	}).format(date)
})

// Set age (calculate birth date)
const setAge = (age) => {
	const today = new Date()
	selectedYear.value = today.getFullYear() - age
	selectedMonth.value = today.getMonth() + 1
	selectedDay.value = today.getDate()
}

// Open picker
const openPicker = () => {
	if (props.disabled) return

	if (props.modelValue) {
		const date = new Date(props.modelValue)
		if (!isNaN(date.getTime())) {
			selectedDay.value = date.getDate()
			selectedMonth.value = date.getMonth() + 1
			selectedYear.value = date.getFullYear()
		}
	} else {
		// Default to 30 years ago
		const defaultDate = new Date()
		defaultDate.setFullYear(defaultDate.getFullYear() - 30)
		selectedDay.value = defaultDate.getDate()
		selectedMonth.value = defaultDate.getMonth() + 1
		selectedYear.value = defaultDate.getFullYear()
	}

	showPicker.value = true
}

// Close picker
const closePicker = () => {
	showPicker.value = false
}

// Clear date
const clearDate = () => {
	emit('update:modelValue', '')
	showPicker.value = false
}

// Confirm date
const confirmDate = () => {
	const date = new Date(selectedYear.value, selectedMonth.value - 1, selectedDay.value)
	const formatted = date.toISOString().split('T')[0]
	emit('update:modelValue', formatted)
	showPicker.value = false
}

// Watch for day overflow when month/year changes
watch([selectedMonth, selectedYear], () => {
	const maxDay = new Date(selectedYear.value, selectedMonth.value, 0).getDate()
	if (selectedDay.value > maxDay) {
		selectedDay.value = maxDay
	}
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
	transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
	opacity: 0;
}
</style>
