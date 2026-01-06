<template>
  <div class="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg space-y-4">
    <label class="form-label">{{ $t('planning.markets.cancellationPolicy') }}</label>

    <label class="flex items-center gap-2 cursor-pointer">
      <input
        :checked="modelValue.useHotelPolicy"
        type="checkbox"
        class="rounded border-gray-300 text-indigo-600"
        @change="updatePolicy('useHotelPolicy', $event.target.checked)"
      />
      <span class="text-sm">{{ $t('planning.markets.useHotelPolicy') }}</span>
    </label>

    <div
      v-if="!modelValue.useHotelPolicy"
      class="space-y-4 pt-3 border-t border-gray-200 dark:border-slate-600"
    >
      <!-- Free Cancellation Days -->
      <div class="flex items-center gap-3">
        <label class="text-sm text-gray-600 dark:text-slate-400">{{
          $t('planning.markets.freeCancellationDays')
        }}</label>
        <div class="flex items-center gap-2">
          <input
            :value="modelValue.freeCancellationDays"
            type="number"
            min="0"
            class="form-input w-20 text-center"
            @input="updatePolicy('freeCancellationDays', parseInt($event.target.value) || 0)"
          />
          <span class="text-sm text-gray-500">{{ $t('planning.markets.daysBeforeCheckin') }}</span>
        </div>
      </div>

      <!-- Penalty Rules -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <label class="text-sm font-medium text-gray-700 dark:text-slate-300">{{
            $t('planning.markets.penaltyRules')
          }}</label>
          <button
            type="button"
            class="text-sm text-purple-600 hover:text-purple-800"
            @click="$emit('addPenalty')"
          >
            + {{ $t('common.add') }}
          </button>
        </div>
        <div
          v-for="(rule, index) in modelValue.penaltyRules"
          :key="index"
          class="flex items-center gap-3 mb-2"
        >
          <div class="flex items-center gap-2 flex-1">
            <input
              :value="rule.daysBeforeCheckIn"
              type="number"
              min="0"
              class="form-input w-16 text-center text-sm"
              @input="updatePenaltyRule(index, 'daysBeforeCheckIn', parseInt($event.target.value) || 0)"
            />
            <span class="text-xs text-gray-500">{{ $t('planning.markets.daysBeforeCheckin') }}</span>
          </div>
          <select
            :value="rule.penaltyType"
            class="form-select w-32 text-sm"
            @change="updatePenaltyRule(index, 'penaltyType', $event.target.value)"
          >
            <option value="percentage">{{ $t('planning.markets.percentage') }}</option>
            <option value="nights">{{ $t('planning.markets.nights') }}</option>
          </select>
          <div class="flex items-center gap-1">
            <input
              :value="rule.penaltyValue"
              type="number"
              min="0"
              class="form-input w-16 text-center text-sm"
              @input="updatePenaltyRule(index, 'penaltyValue', parseInt($event.target.value) || 0)"
            />
            <span class="text-xs text-gray-500">{{
              rule.penaltyType === 'percentage' ? '%' : $t('planning.markets.nights')
            }}</span>
          </div>
          <button
            type="button"
            class="text-red-500 hover:text-red-700"
            @click="$emit('removePenalty', index)"
          >
            <span class="material-icons text-sm">close</span>
          </button>
        </div>
      </div>

      <!-- No Show Penalty -->
      <div class="flex items-center gap-3">
        <label class="text-sm text-gray-600 dark:text-slate-400">{{
          $t('planning.markets.noShowPenalty')
        }}</label>
        <select
          :value="modelValue.noShowPenalty.type"
          class="form-select w-32 text-sm"
          @change="updateNoShowPenalty('type', $event.target.value)"
        >
          <option value="full">{{ $t('planning.markets.fullAmount') }}</option>
          <option value="percentage">{{ $t('planning.markets.percentage') }}</option>
          <option value="nights">{{ $t('planning.markets.nights') }}</option>
        </select>
        <input
          v-if="modelValue.noShowPenalty.type !== 'full'"
          :value="modelValue.noShowPenalty.value"
          type="number"
          min="0"
          class="form-input w-16 text-center text-sm"
          @input="updateNoShowPenalty('value', parseInt($event.target.value) || 0)"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: { type: Object, required: true }
})

const emit = defineEmits(['update:modelValue', 'addPenalty', 'removePenalty'])

const updatePolicy = (field, value) => {
  emit('update:modelValue', { ...props.modelValue, [field]: value })
}

const updatePenaltyRule = (index, field, value) => {
  const newRules = [...props.modelValue.penaltyRules]
  newRules[index] = { ...newRules[index], [field]: value }
  emit('update:modelValue', { ...props.modelValue, penaltyRules: newRules })
}

const updateNoShowPenalty = (field, value) => {
  emit('update:modelValue', {
    ...props.modelValue,
    noShowPenalty: { ...props.modelValue.noShowPenalty, [field]: value }
  })
}
</script>
