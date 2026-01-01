<template>
	<div class="min-h-screen bg-gray-50 dark:bg-slate-900">
		<!-- Header -->
		<div class="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 sticky top-0 z-20">
			<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div class="flex items-center justify-between h-16">
					<!-- Back Button -->
					<button
						@click="handleExit"
						class="flex items-center text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors"
					>
						<span class="material-icons mr-2">arrow_back</span>
						<span class="hidden sm:inline">{{ $t('booking.exitWizard') }}</span>
					</button>

					<!-- Title -->
					<h1 class="text-lg font-semibold text-gray-900 dark:text-white">
						{{ $t('booking.newBooking') }}
					</h1>

					<!-- Placeholder for balance -->
					<div class="w-24"></div>
				</div>
			</div>
		</div>

		<!-- Progress -->
		<WizardProgress
			:current-step="bookingStore.currentStep"
			:steps="steps"
			@step-click="handleStepClick"
		/>

		<!-- Content -->
		<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
			<!-- Loading State -->
			<div v-if="isLoading" class="flex items-center justify-center py-20">
				<div class="text-center">
					<span class="material-icons text-4xl text-purple-500 animate-spin">refresh</span>
					<p class="mt-4 text-gray-500 dark:text-slate-400">{{ $t('common.loading') }}</p>
				</div>
			</div>

			<!-- Step Content -->
			<template v-else>
				<Transition
					mode="out-in"
					enter-active-class="transition-all duration-200 ease-out"
					enter-from-class="opacity-0 translate-x-4"
					enter-to-class="opacity-100 translate-x-0"
					leave-active-class="transition-all duration-200 ease-in"
					leave-from-class="opacity-100 translate-x-0"
					leave-to-class="opacity-0 -translate-x-4"
				>
					<!-- Step 1: Search -->
					<Step1Search
						v-if="bookingStore.currentStep === 1"
						@search-complete="handleSearchComplete"
					/>

					<!-- Step 2: Rooms -->
					<Step2Rooms
						v-else-if="bookingStore.currentStep === 2"
						@go-back="handleGoBack"
						@proceed="handleProceedFromRooms"
					/>

					<!-- Step 3: Cart -->
					<Step3Cart
						v-else-if="bookingStore.currentStep === 3"
						@go-back="handleGoBack"
						@proceed="handleProceedFromCart"
					/>

					<!-- Step 4: Guests -->
					<Step4Guests
						v-else-if="bookingStore.currentStep === 4"
						@go-back="handleGoBack"
						@proceed="handleProceedFromGuests"
					/>

					<!-- Step 5: Summary -->
					<Step5Summary
						v-else-if="bookingStore.currentStep === 5"
						@go-back="handleGoBack"
						@edit-guests="handleEditGuests"
						@proceed="handleBookingComplete"
					/>
				</Transition>
			</template>
		</div>

		<!-- Exit Confirmation Modal -->
		<Modal v-model="showExitConfirm" :title="$t('booking.exitConfirmTitle')">
			<p class="text-gray-600 dark:text-slate-400">
				{{ $t('booking.exitConfirmMessage') }}
			</p>
			<template #footer>
				<div class="flex space-x-3">
					<button @click="showExitConfirm = false" class="btn-secondary flex-1">
						{{ $t('common.cancel') }}
					</button>
					<button @click="confirmExit" class="btn-primary flex-1">
						{{ $t('booking.exitWizard') }}
					</button>
				</div>
			</template>
		</Modal>
	</div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useBookingStore } from '@/stores/booking'
import WizardProgress from './WizardProgress.vue'
import Step1Search from './Step1Search.vue'
import Step2Rooms from './Step2Rooms.vue'
import Step3Cart from './Step3Cart.vue'
import Step4Guests from './Step4Guests.vue'
import Step5Summary from './Step5Summary.vue'
import Modal from '@/components/common/Modal.vue'

const { t } = useI18n()
const router = useRouter()
const bookingStore = useBookingStore()

// State
const isLoading = ref(false)
const showExitConfirm = ref(false)

// Steps configuration
const steps = computed(() => [
	{
		number: 1,
		title: t('booking.stepSearch'),
		icon: 'search'
	},
	{
		number: 2,
		title: t('booking.stepRooms'),
		icon: 'bed'
	},
	{
		number: 3,
		title: t('booking.stepCart'),
		icon: 'shopping_cart'
	},
	{
		number: 4,
		title: t('booking.stepGuests'),
		icon: 'people'
	},
	{
		number: 5,
		title: t('booking.stepConfirm'),
		icon: 'check_circle'
	}
])

// Handle step click
const handleStepClick = (stepNumber) => {
	// Only allow clicking on completed steps or current step
	if (stepNumber < bookingStore.currentStep) {
		bookingStore.goToStep(stepNumber)
	}
}

// Handle exit
const handleExit = () => {
	// If we have any data, show confirmation
	if (bookingStore.cart.length > 0 || bookingStore.search.hotelId) {
		showExitConfirm.value = true
	} else {
		confirmExit()
	}
}

// Confirm exit
const confirmExit = () => {
	bookingStore.resetWizard()
	showExitConfirm.value = false
	router.push('/bookings')
}

// Handle go back
const handleGoBack = () => {
	bookingStore.previousStep()
}

// Handle search complete (Step 1 -> Step 2)
const handleSearchComplete = () => {
	bookingStore.nextStep()
}

// Handle proceed from rooms (Step 2 -> Step 3)
const handleProceedFromRooms = () => {
	if (bookingStore.cart.length > 0) {
		bookingStore.nextStep()
	}
}

// Handle proceed from cart (Step 3 -> Step 4)
const handleProceedFromCart = () => {
	if (bookingStore.cart.length > 0) {
		bookingStore.nextStep()
	}
}

// Handle proceed from guests (Step 4 -> Step 5)
const handleProceedFromGuests = () => {
	bookingStore.nextStep()
}

// Handle edit guests (from Step 5 back to Step 4)
const handleEditGuests = () => {
	bookingStore.goToStep(4)
}

// Handle booking complete
const handleBookingComplete = () => {
	// Booking is complete, handled in Step5Summary
}

// Prevent accidental navigation
const handleBeforeUnload = (e) => {
	if (bookingStore.cart.length > 0) {
		e.preventDefault()
		e.returnValue = ''
	}
}

onMounted(() => {
	window.addEventListener('beforeunload', handleBeforeUnload)
})

onUnmounted(() => {
	window.removeEventListener('beforeunload', handleBeforeUnload)
})
</script>
