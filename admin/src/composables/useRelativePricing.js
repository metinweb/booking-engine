import { computed } from 'vue'

/**
 * Composable for relative pricing calculations
 * Used in RateForm.vue for automatic price calculation based on base room/meal plan
 */
export function useRelativePricing(roomTypes, mealPlans) {
	// Find the base room (only if explicitly set)
	const baseRoom = computed(() => {
		if (!roomTypes.value?.length) return null
		return roomTypes.value.find(r => r.isBaseRoom) || null
	})

	// Find the base meal plan (only if explicitly set, or fallback to first if base room is set)
	const baseMealPlan = computed(() => {
		if (!mealPlans.value?.length) return null
		// Only use fallback if base room is explicitly set
		const found = mealPlans.value.find(m => m.isBaseMealPlan)
		if (found) return found
		// Fallback to first meal plan only if base room exists
		return baseRoom.value ? mealPlans.value[0] : null
	})

	// Check if base room is explicitly set
	const hasExplicitBaseRoom = computed(() => {
		return roomTypes.value?.some(r => r.isBaseRoom === true) || false
	})

	// Check if a specific room/meal combination is the base cell
	const isBaseCell = (roomId, mealPlanId) => {
		return baseRoom.value?._id === roomId && baseMealPlan.value?._id === mealPlanId
	}

	// Check if a room is the base room
	const isBaseRoom = (roomId) => {
		return baseRoom.value?._id === roomId
	}

	// Check if a meal plan is the base meal plan
	const isBaseMealPlan = (mealPlanId) => {
		return baseMealPlan.value?._id === mealPlanId
	}

	// Get room adjustment percentage
	const getRoomAdjustment = (roomId) => {
		const room = roomTypes.value?.find(r => r._id === roomId)
		return room?.priceAdjustment || 0
	}

	// Get meal plan adjustment percentage
	const getMealPlanAdjustment = (mealPlanId) => {
		const meal = mealPlans.value?.find(m => m._id === mealPlanId)
		return meal?.priceAdjustment || 0
	}

	/**
	 * Calculate relative price based on base price and adjustments
	 * Formula: basePrice * (1 + roomAdjustment/100) * (1 + mealAdjustment/100)
	 */
	const calculatePrice = (basePrice, roomId, mealPlanId) => {
		if (!basePrice || basePrice <= 0) return 0

		const room = roomTypes.value?.find(r => r._id === roomId)
		const meal = mealPlans.value?.find(m => m._id === mealPlanId)

		if (!room || !meal) return 0

		const roomAdj = room.priceAdjustment || 0
		const mealAdj = meal.priceAdjustment || 0

		// Apply room adjustment first, then meal adjustment
		const afterRoom = basePrice * (1 + roomAdj / 100)
		const afterMeal = afterRoom * (1 + mealAdj / 100)

		// Round to 2 decimal places
		return Math.round(afterMeal * 100) / 100
	}

	/**
	 * Calculate all prices from base price
	 * Returns an object with roomId -> mealPlanId -> price structure
	 */
	const calculateAllPrices = (basePrice, priceField = 'adultPrice') => {
		const result = {}

		if (!basePrice || !roomTypes.value?.length || !mealPlans.value?.length) {
			return result
		}

		for (const room of roomTypes.value) {
			result[room._id] = {}
			for (const meal of mealPlans.value) {
				// Base cell keeps the original price
				if (isBaseCell(room._id, meal._id)) {
					result[room._id][meal._id] = { [priceField]: basePrice }
				} else {
					result[room._id][meal._id] = {
						[priceField]: calculatePrice(basePrice, room._id, meal._id)
					}
				}
			}
		}

		return result
	}

	/**
	 * Check if any room has price adjustment configured
	 */
	const hasRoomAdjustments = computed(() => {
		return roomTypes.value?.some(r => !r.isBaseRoom && r.priceAdjustment !== 0)
	})

	/**
	 * Check if any meal plan has price adjustment configured
	 */
	const hasMealPlanAdjustments = computed(() => {
		return mealPlans.value?.some(m => !m.isBaseMealPlan && m.priceAdjustment !== 0)
	})

	/**
	 * Check if relative pricing is configured (at least one adjustment exists)
	 */
	const isRelativePricingEnabled = computed(() => {
		return hasRoomAdjustments.value || hasMealPlanAdjustments.value
	})

	return {
		baseRoom,
		baseMealPlan,
		hasExplicitBaseRoom,
		isBaseCell,
		isBaseRoom,
		isBaseMealPlan,
		getRoomAdjustment,
		getMealPlanAdjustment,
		calculatePrice,
		calculateAllPrices,
		hasRoomAdjustments,
		hasMealPlanAdjustments,
		isRelativePricingEnabled
	}
}
