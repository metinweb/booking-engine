<template>
	<div class="fixed inset-0 z-[60] overflow-y-auto">
		<!-- Backdrop -->
		<div class="fixed inset-0 bg-black/50" @click="$emit('close')"></div>

		<!-- Modal -->
		<div class="flex min-h-full items-center justify-center p-4">
			<div class="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md transform transition-all">
				<!-- Header -->
				<div class="flex items-center justify-between px-6 py-4 border-b dark:border-gray-700">
					<h3 class="text-lg font-semibold text-gray-900 dark:text-white">
						{{ $t('booking.amendment.adjustPriceTitle') }}
					</h3>
					<button @click="$emit('close')" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
						<span class="material-icons">close</span>
					</button>
				</div>

				<!-- Content -->
				<div class="p-6 space-y-6">
					<!-- Current Difference -->
					<div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
						<div class="text-sm text-gray-500 dark:text-gray-400 mb-1">
							{{ $t('booking.amendment.currentDifference') }}
						</div>
						<div class="text-xl font-bold" :class="priceDifference?.isIncrease ? 'text-amber-600' : 'text-green-600'">
							{{ priceDifference?.isIncrease ? '+' : '' }}{{ formatCurrency(priceDifference?.difference, priceDifference?.currency) }}
						</div>
					</div>

					<!-- Adjustment Options -->
					<div class="space-y-4">
						<!-- Waive Difference -->
						<label class="flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors"
							:class="localAdjustment.waived ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'"
						>
							<input
								type="radio"
								v-model="adjustmentType"
								value="waive"
								class="mt-1 w-4 h-4 text-green-600 focus:ring-green-500"
							/>
							<div class="flex-1">
								<p class="font-medium text-gray-900 dark:text-white">
									{{ $t('booking.amendment.waivePrice') }}
								</p>
								<p class="text-sm text-gray-500 dark:text-gray-400">
									{{ $t('booking.amendment.waivePriceDesc') }}
								</p>
							</div>
						</label>

						<!-- Custom Amount -->
						<label class="flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors"
							:class="adjustmentType === 'custom' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'"
						>
							<input
								type="radio"
								v-model="adjustmentType"
								value="custom"
								class="mt-1 w-4 h-4 text-indigo-600 focus:ring-indigo-500"
							/>
							<div class="flex-1">
								<p class="font-medium text-gray-900 dark:text-white">
									{{ $t('booking.amendment.customAmount') }}
								</p>
								<p class="text-sm text-gray-500 dark:text-gray-400 mb-2">
									{{ $t('booking.amendment.customAmountDesc') }}
								</p>
								<input
									v-if="adjustmentType === 'custom'"
									type="number"
									v-model.number="localAdjustment.adjustedAmount"
									class="w-full px-3 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white focus:ring-2 focus:ring-indigo-500"
									:placeholder="$t('booking.amendment.enterAmount')"
								/>
							</div>
						</label>

						<!-- Keep Original -->
						<label class="flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors"
							:class="adjustmentType === 'keep' ? 'border-gray-500 bg-gray-50 dark:bg-gray-700' : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'"
						>
							<input
								type="radio"
								v-model="adjustmentType"
								value="keep"
								class="mt-1 w-4 h-4 text-gray-600 focus:ring-gray-500"
							/>
							<div class="flex-1">
								<p class="font-medium text-gray-900 dark:text-white">
									{{ $t('booking.amendment.keepOriginal') }}
								</p>
								<p class="text-sm text-gray-500 dark:text-gray-400">
									{{ $t('booking.amendment.keepOriginalDesc') }}
								</p>
							</div>
						</label>
					</div>

					<!-- Reason (required for adjustments) -->
					<div v-if="adjustmentType !== 'keep'">
						<label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
							{{ $t('booking.amendment.adjustmentReason') }} <span class="text-red-500">*</span>
						</label>
						<textarea
							v-model="localAdjustment.reason"
							rows="2"
							class="w-full px-3 py-2 border rounded-lg dark:bg-gray-600 dark:border-gray-500 dark:text-white focus:ring-2 focus:ring-indigo-500"
							:placeholder="$t('booking.amendment.adjustmentReasonPlaceholder')"
						></textarea>
					</div>
				</div>

				<!-- Footer -->
				<div class="flex items-center justify-end gap-3 px-6 py-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
					<button
						@click="$emit('close')"
						class="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
					>
						{{ $t('common.cancel') }}
					</button>
					<button
						@click="applyAdjustment"
						:disabled="!canApply"
						class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
					>
						{{ $t('common.apply') }}
					</button>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
	priceDifference: { type: Object, default: null },
	adjustment: { type: Object, default: null }
})

const emit = defineEmits(['close', 'apply'])

const { locale } = useI18n()

// Local state
const adjustmentType = ref(props.adjustment?.waived ? 'waive' : (props.adjustment?.adjustedAmount ? 'custom' : 'keep'))
const localAdjustment = ref({
	waived: props.adjustment?.waived || false,
	adjustedAmount: props.adjustment?.adjustedAmount || null,
	reason: props.adjustment?.reason || ''
})

// Watch adjustment type
watch(adjustmentType, (newType) => {
	if (newType === 'waive') {
		localAdjustment.value.waived = true
		localAdjustment.value.adjustedAmount = 0
	} else if (newType === 'custom') {
		localAdjustment.value.waived = false
	} else {
		localAdjustment.value.waived = false
		localAdjustment.value.adjustedAmount = null
		localAdjustment.value.reason = ''
	}
})

// Computed
const canApply = computed(() => {
	if (adjustmentType.value === 'keep') return true
	return localAdjustment.value.reason?.trim().length >= 5
})

// Methods
const formatCurrency = (amount, currency = 'TRY') => {
	if (amount === undefined || amount === null) return '-'
	return new Intl.NumberFormat(locale.value === 'tr' ? 'tr-TR' : 'en-US', {
		style: 'currency',
		currency: currency || 'TRY',
		minimumFractionDigits: 0,
		maximumFractionDigits: 2
	}).format(amount)
}

const applyAdjustment = () => {
	emit('apply', { ...localAdjustment.value })
}
</script>
