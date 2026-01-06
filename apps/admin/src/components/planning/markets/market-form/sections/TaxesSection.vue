<template>
  <div class="p-4 bg-gray-50 dark:bg-slate-700/50 rounded-lg space-y-4 mb-4">
    <label class="form-label">{{ $t('planning.markets.taxes') }}</label>

    <!-- VAT -->
    <div
      class="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-600"
    >
      <div class="flex items-center gap-3">
        <label class="flex items-center gap-2 cursor-pointer">
          <input
            :checked="modelValue.vat.enabled"
            type="checkbox"
            class="rounded border-gray-300 text-indigo-600"
            @change="updateTax('vat', 'enabled', $event.target.checked)"
          />
          <span class="font-medium text-sm">{{ $t('planning.markets.vat') }}</span>
        </label>
      </div>
      <div v-if="modelValue.vat.enabled" class="flex items-center gap-3">
        <div class="flex items-center gap-2">
          <input
            :value="modelValue.vat.rate"
            type="number"
            min="0"
            max="100"
            class="form-input w-16 text-center text-sm"
            @input="updateTax('vat', 'rate', parseInt($event.target.value) || 0)"
          />
          <span class="text-sm text-gray-500">%</span>
        </div>
        <label class="flex items-center gap-1 text-sm cursor-pointer">
          <input
            :checked="modelValue.vat.included"
            type="checkbox"
            class="rounded border-gray-300 text-indigo-600"
            @change="updateTax('vat', 'included', $event.target.checked)"
          />
          <span class="text-gray-600 dark:text-slate-400">{{
            $t('planning.markets.includedInPrice')
          }}</span>
        </label>
      </div>
    </div>

    <!-- City Tax -->
    <div
      class="p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-600 space-y-3"
    >
      <div class="flex items-center gap-3">
        <label class="flex items-center gap-2 cursor-pointer">
          <input
            :checked="modelValue.cityTax.enabled"
            type="checkbox"
            class="rounded border-gray-300 text-indigo-600"
            @change="updateTax('cityTax', 'enabled', $event.target.checked)"
          />
          <span class="font-medium text-sm">{{ $t('planning.markets.cityTax') }}</span>
        </label>
      </div>
      <div v-if="modelValue.cityTax.enabled" class="grid grid-cols-2 gap-3">
        <div>
          <label class="text-xs text-gray-500 dark:text-slate-400">{{
            $t('planning.markets.taxType')
          }}</label>
          <select
            :value="modelValue.cityTax.type"
            class="form-select text-sm"
            @change="updateTax('cityTax', 'type', $event.target.value)"
          >
            <option value="percentage">{{ $t('planning.markets.percentage') }}</option>
            <option value="fixed_per_night">{{ $t('planning.markets.fixedPerNight') }}</option>
            <option value="fixed_per_person">{{ $t('planning.markets.fixedPerPerson') }}</option>
            <option value="fixed_per_person_night">{{
              $t('planning.markets.fixedPerPersonNight')
            }}</option>
          </select>
        </div>
        <div>
          <label class="text-xs text-gray-500 dark:text-slate-400">{{
            $t('planning.markets.amount')
          }}</label>
          <div class="flex items-center gap-2">
            <input
              :value="modelValue.cityTax.amount"
              type="number"
              min="0"
              class="form-input text-sm"
              @input="updateTax('cityTax', 'amount', parseInt($event.target.value) || 0)"
            />
            <span class="text-sm text-gray-500">{{
              modelValue.cityTax.type === 'percentage' ? '%' : currency
            }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Service Charge -->
    <div
      class="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-600"
    >
      <div class="flex items-center gap-3">
        <label class="flex items-center gap-2 cursor-pointer">
          <input
            :checked="modelValue.serviceCharge.enabled"
            type="checkbox"
            class="rounded border-gray-300 text-indigo-600"
            @change="updateTax('serviceCharge', 'enabled', $event.target.checked)"
          />
          <span class="font-medium text-sm">{{ $t('planning.markets.serviceCharge') }}</span>
        </label>
      </div>
      <div v-if="modelValue.serviceCharge.enabled" class="flex items-center gap-3">
        <div class="flex items-center gap-2">
          <input
            :value="modelValue.serviceCharge.rate"
            type="number"
            min="0"
            max="100"
            class="form-input w-16 text-center text-sm"
            @input="updateTax('serviceCharge', 'rate', parseInt($event.target.value) || 0)"
          />
          <span class="text-sm text-gray-500">%</span>
        </div>
        <label class="flex items-center gap-1 text-sm cursor-pointer">
          <input
            :checked="modelValue.serviceCharge.included"
            type="checkbox"
            class="rounded border-gray-300 text-indigo-600"
            @change="updateTax('serviceCharge', 'included', $event.target.checked)"
          />
          <span class="text-gray-600 dark:text-slate-400">{{
            $t('planning.markets.includedInPrice')
          }}</span>
        </label>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: { type: Object, required: true },
  currency: { type: String, default: 'EUR' }
})

const emit = defineEmits(['update:modelValue'])

const updateTax = (taxType, field, value) => {
  const newTaxes = { ...props.modelValue }
  newTaxes[taxType] = { ...newTaxes[taxType], [field]: value }
  emit('update:modelValue', newTaxes)
}
</script>
