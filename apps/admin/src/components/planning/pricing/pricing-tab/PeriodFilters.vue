<template>
  <div class="mb-6">
    <div
      class="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-800/50 dark:to-slate-700/50 rounded-2xl p-5 border border-gray-200/50 dark:border-slate-600/50"
    >
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Room Type Filter (Required) -->
        <div>
          <div class="flex items-center gap-2 mb-3">
            <div
              class="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center"
            >
              <span class="material-icons text-purple-600 dark:text-purple-400 text-lg">hotel</span>
            </div>
            <span class="font-semibold text-gray-700 dark:text-slate-300">{{
              $t('planning.pricing.selectRoomType')
            }}</span>
          </div>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="rt in filteredRoomTypes"
              :key="rt._id"
              class="px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2"
              :class="
                filters.roomType === rt._id
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 scale-105'
                  : 'bg-white dark:bg-slate-700 text-gray-600 dark:text-slate-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 border border-gray-200 dark:border-slate-600'
              "
              @click="$emit('update:roomType', rt._id)"
            >
              <span class="font-bold">{{ rt.code }}</span>
              <span class="text-xs opacity-75">{{ getRoomTypeName(rt) }}</span>
            </button>
          </div>
        </div>

        <!-- Meal Plan Filter (Required) -->
        <div>
          <div class="flex items-center gap-2 mb-3">
            <div
              class="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center"
            >
              <span class="material-icons text-amber-600 dark:text-amber-400 text-lg"
                >restaurant</span
              >
            </div>
            <span class="font-semibold text-gray-700 dark:text-slate-300">{{
              $t('planning.pricing.selectMealPlan')
            }}</span>
          </div>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="mp in filteredMealPlans"
              :key="mp._id"
              class="px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
              :class="
                filters.mealPlan === mp._id
                  ? getMealPlanActiveColor(mp.code) + ' text-white shadow-lg scale-105'
                  : 'bg-white dark:bg-slate-700 text-gray-600 dark:text-slate-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 border border-gray-200 dark:border-slate-600'
              "
              @click="$emit('update:mealPlan', mp._id)"
            >
              {{ mp.code }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  filters: { type: Object, required: true },
  filteredRoomTypes: { type: Array, default: () => [] },
  filteredMealPlans: { type: Array, default: () => [] },
  getRoomTypeName: { type: Function, required: true },
  getMealPlanActiveColor: { type: Function, required: true }
})

defineEmits(['update:roomType', 'update:mealPlan'])
</script>
