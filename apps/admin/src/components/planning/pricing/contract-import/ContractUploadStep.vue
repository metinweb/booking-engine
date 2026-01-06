<template>
  <div class="space-y-4">
    <!-- Dropzone -->
    <div
      class="border-2 border-dashed rounded-xl p-8 text-center transition-all"
      :class="
        isDragging
          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
          : 'border-gray-300 dark:border-gray-600 hover:border-purple-400'
      "
      @dragover.prevent="$emit('update:isDragging', true)"
      @dragleave.prevent="$emit('update:isDragging', false)"
      @drop.prevent="$emit('fileDrop', $event)"
    >
      <div class="flex flex-col items-center gap-3">
        <div
          class="w-16 h-16 rounded-2xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center"
        >
          <span class="material-icons text-3xl text-purple-600 dark:text-purple-400"
            >cloud_upload</span
          >
        </div>
        <div>
          <p class="text-gray-700 dark:text-gray-300 font-medium">
            {{ $t('planning.pricing.contractImport.dropzone') }}
          </p>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {{ $t('planning.pricing.contractImport.supportedFormats') }}
          </p>
        </div>
        <label
          class="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg cursor-pointer transition-colors"
        >
          <span class="material-icons text-sm">folder_open</span>
          {{ $t('planning.pricing.contractImport.selectFile') }}
          <input
            type="file"
            class="hidden"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            @change="$emit('fileSelect', $event)"
          />
        </label>
      </div>
    </div>

    <!-- Selected File Preview -->
    <div
      v-if="selectedFile"
      class="flex items-center gap-3 p-4 bg-gray-50 dark:bg-slate-800 rounded-xl"
    >
      <div
        class="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center"
      >
        <span class="material-icons text-purple-600 dark:text-purple-400">
          {{ selectedFile.type.includes('pdf') ? 'picture_as_pdf' : 'image' }}
        </span>
      </div>
      <div class="flex-1 min-w-0">
        <p class="font-medium text-gray-900 dark:text-white truncate">{{ selectedFile.name }}</p>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          {{ formatFileSize(selectedFile.size) }}
        </p>
      </div>
      <button
        class="p-2 text-gray-400 hover:text-red-500 transition-colors"
        @click="$emit('clearFile')"
      >
        <span class="material-icons">close</span>
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  selectedFile: { type: Object, default: null },
  isDragging: { type: Boolean, default: false },
  formatFileSize: { type: Function, required: true }
})

defineEmits(['fileSelect', 'fileDrop', 'clearFile', 'update:isDragging'])
</script>
