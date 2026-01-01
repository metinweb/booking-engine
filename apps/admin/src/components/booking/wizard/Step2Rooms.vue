<template>
	<div class="space-y-6">
		<!-- Header with Search Summary -->
		<div class="flex flex-col md:flex-row md:items-center md:justify-between">
			<div>
				<h2 class="text-xl font-semibold text-gray-900 dark:text-white">
					{{ $t('booking.selectRoom') }}
				</h2>
				<p class="text-sm text-gray-500 dark:text-slate-400 mt-1">
					{{ $t('booking.selectRoomDescription') }}
				</p>
			</div>
			<!-- Search Summary Badge -->
			<div v-if="bookingStore.availability.search" class="mt-3 md:mt-0 flex flex-wrap gap-2">
				<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
					<span class="material-icons text-xs mr-1">calendar_today</span>
					{{ formatDateRange }}
				</span>
				<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
					<span class="material-icons text-xs mr-1">person</span>
					{{ bookingStore.search.adults }} {{ $t('booking.adults') }}
					<span v-if="bookingStore.search.children.length > 0">
						+ {{ bookingStore.search.children.length }} {{ $t('booking.children') }}
					</span>
				</span>
				<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
					<span class="material-icons text-xs mr-1">nights_stay</span>
					{{ bookingStore.nights }} {{ $t('booking.nights') }}
				</span>
			</div>
		</div>

		<!-- Loading State -->
		<div v-if="bookingStore.availability.loading" class="flex items-center justify-center py-12">
			<div class="text-center">
				<span class="material-icons text-4xl text-purple-500 animate-spin">refresh</span>
				<p class="mt-3 text-gray-500 dark:text-slate-400">{{ $t('booking.searchingAvailability') }}</p>
			</div>
		</div>

		<!-- No Results -->
		<div v-else-if="bookingStore.availability.results.length === 0" class="text-center py-12">
			<span class="material-icons text-5xl text-gray-300 dark:text-slate-600">search_off</span>
			<h3 class="mt-4 text-lg font-medium text-gray-900 dark:text-white">
				{{ $t('booking.noRoomsFound') }}
			</h3>
			<p class="mt-2 text-gray-500 dark:text-slate-400">
				{{ $t('booking.noRoomsFoundDescription') }}
			</p>
			<button @click="$emit('go-back')" class="mt-4 btn-secondary">
				<span class="material-icons mr-2">arrow_back</span>
				{{ $t('booking.modifySearch') }}
			</button>
		</div>

		<!-- Room Results -->
		<div v-else>
			<!-- Cart Summary (floating on mobile) -->
			<div v-if="bookingStore.cart.length > 0" class="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 p-4 z-30">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm text-gray-500 dark:text-slate-400">{{ bookingStore.cart.length }} {{ $t('booking.roomsSelected') }}</p>
						<p class="text-lg font-bold text-purple-600 dark:text-purple-400">
							{{ formatPrice(bookingStore.grandTotal, bookingStore.currency) }}
						</p>
					</div>
					<button @click="$emit('proceed')" class="btn-primary px-6">
						{{ $t('common.continue') }}
						<span class="material-icons ml-1">arrow_forward</span>
					</button>
				</div>
			</div>

			<!-- Room Grid -->
			<div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-24 md:pb-0">
				<RoomCard
					v-for="result in bookingStore.availability.results"
					:key="result.roomType.code"
					:room-type="result.roomType"
					:options="result.options"
					:capacity-exceeded="result.capacityExceeded"
					:capacity-message="result.capacityMessage"
					@add-to-cart="handleAddToCart"
				/>
			</div>

			<!-- Desktop: Cart Summary Sidebar -->
			<div v-if="bookingStore.cart.length > 0" class="hidden md:block fixed bottom-6 right-6 w-80 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-200 dark:border-slate-700 p-4 z-30">
				<h4 class="font-semibold text-gray-900 dark:text-white mb-3">
					{{ $t('booking.yourSelection') }}
				</h4>
				<div class="space-y-2 max-h-48 overflow-y-auto">
					<div
						v-for="(item, index) in bookingStore.cart"
						:key="index"
						class="flex items-center justify-between text-sm bg-gray-50 dark:bg-slate-700/50 rounded-lg p-2"
					>
						<div class="flex-1 min-w-0">
							<p class="font-medium text-gray-900 dark:text-white truncate">
								{{ getRoomName(item.roomType) }}
							</p>
							<div class="flex items-center gap-1.5">
								<p class="text-xs text-gray-500 dark:text-slate-400 truncate">
									{{ getMealPlanName(item.mealPlan) }}
								</p>
								<!-- Rate Type Badge -->
								<span
									v-if="item.isNonRefundable"
									class="px-1.5 py-0.5 text-[10px] font-medium bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded"
								>
									İade Edilmez
								</span>
							</div>
						</div>
						<div class="flex items-center space-x-2 ml-2">
							<span class="font-semibold text-purple-600 dark:text-purple-400 whitespace-nowrap">
								{{ formatPrice(item.pricing?.finalTotal, item.pricing?.currency) }}
							</span>
							<button
								@click="bookingStore.removeFromCart(index)"
								class="text-red-500 hover:text-red-600"
							>
								<span class="material-icons text-sm">close</span>
							</button>
						</div>
					</div>
				</div>
				<div class="mt-4 pt-3 border-t border-gray-200 dark:border-slate-700">
					<div class="flex items-center justify-between mb-3">
						<span class="text-gray-600 dark:text-slate-400">{{ $t('booking.total') }}</span>
						<span class="text-xl font-bold text-purple-600 dark:text-purple-400">
							{{ formatPrice(bookingStore.grandTotal, bookingStore.currency) }}
						</span>
					</div>
					<div class="flex space-x-2">
						<button @click="handleAddAnotherRoom" class="flex-1 btn-secondary py-2 text-sm">
							<span class="material-icons text-sm mr-1">add</span>
							{{ $t('booking.addRoom') }}
						</button>
						<button @click="$emit('proceed')" class="flex-1 btn-primary py-2 text-sm">
							{{ $t('common.continue') }}
							<span class="material-icons text-sm ml-1">arrow_forward</span>
						</button>
					</div>
				</div>
			</div>
		</div>

		<!-- Error Message -->
		<div v-if="bookingStore.availability.error" class="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg p-4">
			<div class="flex items-start">
				<span class="material-icons mr-2">error</span>
				<p>{{ bookingStore.availability.error }}</p>
			</div>
		</div>
	</div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useBookingStore } from '@/stores/booking'
import { useToast } from 'vue-toastification'
import RoomCard from '@/components/booking/RoomCard.vue'

const { t, locale } = useI18n()
const bookingStore = useBookingStore()
const toast = useToast()

const emit = defineEmits(['go-back', 'proceed'])

// Format date range
const formatDateRange = computed(() => {
	const search = bookingStore.availability.search
	if (!search) return ''

	const formatDate = (dateStr) => {
		const date = new Date(dateStr)
		return date.toLocaleDateString(locale.value === 'tr' ? 'tr-TR' : 'en-US', {
			day: 'numeric',
			month: 'short'
		})
	}

	return `${formatDate(search.checkIn)} - ${formatDate(search.checkOut)}`
})

// Format price
const formatPrice = (amount, currency) => {
	if (!amount) return ''
	const formatter = new Intl.NumberFormat(locale.value === 'tr' ? 'tr-TR' : 'en-US', {
		style: 'currency',
		currency: currency || 'TRY',
		minimumFractionDigits: 0,
		maximumFractionDigits: 2
	})
	return formatter.format(amount)
}

// Get room name
const getRoomName = (roomType) => {
	const name = roomType.name
	if (typeof name === 'object') {
		return name[locale.value] || name.en || name.tr || Object.values(name)[0] || ''
	}
	return name || ''
}

// Get meal plan name
const getMealPlanName = (mealPlan) => {
	const name = mealPlan.name
	if (typeof name === 'object') {
		return name[locale.value] || name.en || name.tr || Object.values(name)[0] || mealPlan.code
	}
	return name || mealPlan.code
}

// Handle add to cart
const handleAddToCart = (roomType, mealPlan, option) => {
	bookingStore.addToCart(roomType, mealPlan, option)
	toast.success(t('booking.roomAddedToCart'))
}

// Handle add another room
const handleAddAnotherRoom = () => {
	// Just scroll to top to select another room
	window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>
