<template>
  <Modal
    v-model="isOpen"
    :title="title"
    :size="size"
    :close-on-overlay="false"
    :close-on-esc="!hasUnsavedChanges"
    :auto-focus="true"
    :trap-focus="true"
    :restore-focus="true"
    :content-class="contentClass"
    @close="handleClose"
  >
    <slot />

    <template #footer>
      <slot name="footer">
        <div class="flex items-center justify-between w-full">
          <!-- Shortcut hint -->
          <span v-if="showSaveShortcut" class="text-xs text-gray-400 flex items-center gap-1">
            <kbd class="px-1.5 py-0.5 bg-gray-100 dark:bg-slate-700 rounded text-xs">Ctrl</kbd>
            <span>+</span>
            <kbd class="px-1.5 py-0.5 bg-gray-100 dark:bg-slate-700 rounded text-xs">S</kbd>
            <span class="ml-1">kaydet</span>
          </span>
          <span v-else></span>

          <!-- Actions -->
          <div class="flex items-center gap-2">
            <button
              type="button"
              @click="handleCancel"
              class="px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              {{ cancelText }}
            </button>
            <button
              type="button"
              @click="handleSave"
              :disabled="saving || saveDisabled"
              class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <span v-if="saving" class="material-icons animate-spin text-lg">refresh</span>
              {{ saving ? savingText : saveText }}
            </button>
          </div>
        </div>
      </slot>
    </template>
  </Modal>

  <!-- Unsaved Changes Confirmation -->
  <Modal
    v-model="showUnsavedWarning"
    title="Kaydedilmemis Degisiklikler"
    size="sm"
  >
    <p class="text-gray-600 dark:text-gray-400">
      Kaydedilmemis degisiklikleriniz var. Cikmak istediginize emin misiniz?
    </p>
    <template #footer>
      <div class="flex justify-end gap-2">
        <button
          @click="showUnsavedWarning = false"
          class="px-4 py-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg"
        >
          Devam Et
        </button>
        <button
          @click="forceClose"
          class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
        >
          Degisiklikleri At
        </button>
      </div>
    </template>
  </Modal>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import Modal from '@/components/common/Modal.vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    required: true
  },
  size: {
    type: String,
    default: 'md'
  },
  contentClass: {
    type: String,
    default: ''
  },
  saving: {
    type: Boolean,
    default: false
  },
  saveDisabled: {
    type: Boolean,
    default: false
  },
  hasUnsavedChanges: {
    type: Boolean,
    default: false
  },
  showSaveShortcut: {
    type: Boolean,
    default: true
  },
  saveText: {
    type: String,
    default: 'Kaydet'
  },
  savingText: {
    type: String,
    default: 'Kaydediliyor...'
  },
  cancelText: {
    type: String,
    default: 'Iptal'
  }
})

const emit = defineEmits(['update:modelValue', 'save', 'cancel', 'close'])

const isOpen = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})

const showUnsavedWarning = ref(false)

// Handle Ctrl+S shortcut
const handleKeydown = (event) => {
  if (!props.modelValue) return

  if (event.ctrlKey && event.key === 's') {
    event.preventDefault()
    if (!props.saving && !props.saveDisabled) {
      handleSave()
    }
  }
}

// Save handler
const handleSave = () => {
  emit('save')
}

// Cancel handler
const handleCancel = () => {
  if (props.hasUnsavedChanges) {
    showUnsavedWarning.value = true
  } else {
    isOpen.value = false
    emit('cancel')
  }
}

// Close handler (from Modal component)
const handleClose = () => {
  if (props.hasUnsavedChanges) {
    showUnsavedWarning.value = true
    // Reopen the modal since it tried to close
    isOpen.value = true
  } else {
    emit('close')
  }
}

// Force close without saving
const forceClose = () => {
  showUnsavedWarning.value = false
  isOpen.value = false
  emit('cancel')
}

// Register keyboard shortcut
onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})

// Expose methods
defineExpose({
  forceClose
})
</script>
