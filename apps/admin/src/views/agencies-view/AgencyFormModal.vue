<template>
  <Modal
    :model-value="modelValue"
    :title="isEditing ? $t('agencies.editAgency') : $t('agencies.addAgency')"
    size="xl"
    :close-on-overlay="false"
    content-class="!p-0"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <!-- Tabs Header -->
    <div class="border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50 px-4">
      <nav class="flex gap-1 -mb-px">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          type="button"
          class="flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap border-b-2"
          :class="
            activeTab === tab.id
              ? 'text-purple-600 dark:text-purple-400 border-purple-600 dark:border-purple-400'
              : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-white border-transparent'
          "
          @click="$emit('update:activeTab', tab.id)"
        >
          <span class="material-icons text-lg">{{ tab.icon }}</span>
          <span class="hidden sm:inline">{{ tab.label }}</span>
          <span
            v-if="tab.id === 'basic' && hasBasicErrors"
            class="w-2 h-2 bg-red-500 rounded-full"
          ></span>
        </button>
      </nav>
    </div>

    <!-- Tab Content -->
    <div class="p-6 h-[500px] overflow-y-auto">
      <AgencyBasicTab v-show="activeTab === 'basic'" :form="form" :errors="errors" />
      <AgencyFinanceTab v-show="activeTab === 'finance'" :form="form" />
      <AgencySalesTab
        v-show="activeTab === 'sales'"
        :form="form"
        :hotels="hotels"
        :selected-country-to-add="selectedCountryToAdd"
        :get-country-label="getCountryLabel"
        @add-country="$emit('add-country', $event)"
        @remove-country="$emit('remove-country', $event)"
      />
      <AgencyPaymentTab
        v-show="activeTab === 'payment'"
        :form="form"
        @toggle-payment="$emit('toggle-payment', $event)"
      />
      <AgencyDocumentsTab
        v-show="activeTab === 'documents'"
        :is-editing="isEditing"
        :selected-agency="selectedAgency"
        :uploading="uploading"
        @upload="$emit('upload', $event)"
        @delete="$emit('delete', $event)"
      />
    </div>

    <template #footer>
      <div class="flex items-center justify-between w-full">
        <button type="button" class="btn-secondary" @click="$emit('update:modelValue', false)">
          {{ $t('common.cancel') }}
        </button>
        <button
          type="button"
          :disabled="submitting"
          class="btn-primary min-w-[120px]"
          @click="$emit('submit')"
        >
          <span v-if="submitting" class="material-icons animate-spin mr-2 text-lg">sync</span>
          {{ submitting ? $t('common.saving') : isEditing ? $t('common.save') : $t('common.create') }}
        </button>
      </div>
    </template>
  </Modal>
</template>

<script setup>
import Modal from '@/components/common/Modal.vue'
import AgencyBasicTab from './tabs/AgencyBasicTab.vue'
import AgencyFinanceTab from './tabs/AgencyFinanceTab.vue'
import AgencySalesTab from './tabs/AgencySalesTab.vue'
import AgencyPaymentTab from './tabs/AgencyPaymentTab.vue'
import AgencyDocumentsTab from './tabs/AgencyDocumentsTab.vue'

defineProps({
  modelValue: { type: Boolean, default: false },
  isEditing: { type: Boolean, default: false },
  activeTab: { type: String, default: 'basic' },
  tabs: { type: Array, required: true },
  hasBasicErrors: { type: Boolean, default: false },
  form: { type: Object, required: true },
  errors: { type: Object, required: true },
  hotels: { type: Array, default: () => [] },
  selectedAgency: { type: Object, default: null },
  selectedCountryToAdd: { type: String, default: '' },
  submitting: { type: Boolean, default: false },
  uploading: { type: Boolean, default: false },
  getCountryLabel: { type: Function, required: true }
})

defineEmits([
  'update:modelValue',
  'update:activeTab',
  'submit',
  'add-country',
  'remove-country',
  'toggle-payment',
  'upload',
  'delete'
])
</script>
