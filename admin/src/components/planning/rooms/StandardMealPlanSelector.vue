<template>
  <div class="space-y-4">
    <p class="text-sm text-gray-600 dark:text-slate-400">
      {{ $t('planning.mealPlans.selectStandardDescription') }}
    </p>

    <!-- Available Standard Plans -->
    <div class="grid gap-3">
      <label
        v-for="plan in availablePlans"
        :key="plan.code"
        class="flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors"
        :class="[
          selectedCodes.includes(plan.code)
            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
            : 'border-gray-200 dark:border-slate-600 hover:border-indigo-300 dark:hover:border-indigo-500',
          existingCodes.includes(plan.code)
            ? 'opacity-50 cursor-not-allowed'
            : ''
        ]"
      >
        <input
          type="checkbox"
          :value="plan.code"
          v-model="selectedCodes"
          :disabled="existingCodes.includes(plan.code)"
          class="mt-1 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <span class="font-bold text-indigo-600 dark:text-indigo-400">{{ plan.code }}</span>
            <span class="font-medium text-gray-800 dark:text-white">{{ getPlanName(plan) }}</span>
            <span
              v-if="existingCodes.includes(plan.code)"
              class="text-xs px-2 py-0.5 bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400 rounded"
            >
              {{ $t('planning.mealPlans.alreadyAdded') }}
            </span>
          </div>
          <p class="text-sm text-gray-500 dark:text-slate-400 mt-1">
            {{ getPlanDescription(plan) }}
          </p>
          <div class="flex flex-wrap gap-1 mt-2">
            <span v-if="plan.includedMeals?.breakfast" class="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-1.5 py-0.5 rounded">
              {{ $t('planning.mealPlans.meals.breakfast') }}
            </span>
            <span v-if="plan.includedMeals?.lunch" class="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded">
              {{ $t('planning.mealPlans.meals.lunch') }}
            </span>
            <span v-if="plan.includedMeals?.dinner" class="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded">
              {{ $t('planning.mealPlans.meals.dinner') }}
            </span>
            <span v-if="plan.includedMeals?.drinks" class="text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-1.5 py-0.5 rounded">
              {{ $t('planning.mealPlans.meals.drinks') }}
            </span>
            <span v-if="plan.includedMeals?.alcoholicDrinks" class="text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-1.5 py-0.5 rounded">
              {{ $t('planning.mealPlans.meals.alcoholicDrinks') }}
            </span>
            <span v-if="!hasAnyMeal(plan)" class="text-xs bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400 px-1.5 py-0.5 rounded">
              {{ $t('planning.mealPlans.meals.none') }}
            </span>
          </div>
        </div>
      </label>
    </div>

    <!-- Footer -->
    <div class="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-slate-700">
      <button @click="$emit('cancel')" type="button" class="btn-secondary">
        {{ $t('common.cancel') }}
      </button>
      <button
        @click="handleAdd"
        type="button"
        class="btn-primary"
        :disabled="selectedCodes.length === 0 || adding"
      >
        <span v-if="adding" class="flex items-center gap-2">
          <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {{ $t('common.loading') }}
        </span>
        <span v-else>
          {{ $t('planning.mealPlans.addSelected') }} ({{ selectedCodes.length }})
        </span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'vue-toastification'
import planningService from '@/services/planningService'

const props = defineProps({
  hotel: { type: Object, required: true },
  existingMealPlans: { type: Array, default: () => [] }
})

const emit = defineEmits(['saved', 'cancel'])

const { t, locale } = useI18n()
const toast = useToast()

const selectedCodes = ref([])
const adding = ref(false)

// Get all available standard plans
const availablePlans = computed(() => {
  return planningService.getAvailableStandardMealPlans()
})

// Get codes of already existing meal plans in this hotel
const existingCodes = computed(() => {
  return props.existingMealPlans.map(p => p.code)
})

const getPlanName = (plan) => {
  return plan.name?.[locale.value] || plan.name?.tr || plan.name?.en || plan.code
}

const getPlanDescription = (plan) => {
  return plan.description?.[locale.value] || plan.description?.tr || plan.description?.en || ''
}

const hasAnyMeal = (plan) => {
  const meals = plan.includedMeals || {}
  return Object.values(meals).some(v => v === true)
}

const handleAdd = async () => {
  if (selectedCodes.value.length === 0) return

  adding.value = true
  try {
    const response = await planningService.addStandardMealPlansToHotel(props.hotel._id, selectedCodes.value)
    if (response.success) {
      toast.success(t('planning.mealPlans.standardAdded', { count: response.data.created }))
      emit('saved')
    }
  } catch (error) {
    toast.error(error.response?.data?.message || t('common.operationFailed'))
  } finally {
    adding.value = false
  }
}
</script>
