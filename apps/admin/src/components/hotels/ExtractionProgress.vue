<template>
  <div class="py-8">
    <!-- Progress Header -->
    <div class="text-center mb-8">
      <div class="relative inline-block">
        <div
          class="animate-spin rounded-full h-16 w-16 border-4 border-purple-200 border-t-purple-600 mx-auto"
        ></div>
        <!-- Elapsed Time in Center -->
        <div class="absolute inset-0 flex items-center justify-center">
          <span class="text-sm font-mono font-semibold text-purple-600 dark:text-purple-400">
            {{ formatElapsedTime(elapsedTime) }}
          </span>
        </div>
      </div>
      <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-1 mt-4">
        {{ progress.currentStepLabel || $t('hotels.aiImport.analyzing') }}
      </h3>
      <p class="text-sm text-gray-500 dark:text-slate-400">
        {{ progress.currentStepDetail || $t('hotels.aiImport.pleaseWait') }}
      </p>
    </div>

    <!-- Progress Steps -->
    <div v-if="progress.steps.length" class="max-w-md mx-auto space-y-3">
      <div
        v-for="(progressStep, idx) in progress.steps"
        :key="progressStep.id"
        class="flex items-center gap-3 p-3 rounded-lg transition-all"
        :class="stepContainerClass(progressStep.status)"
      >
        <!-- Step Icon -->
        <div
          class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          :class="stepIconClass(progressStep.status)"
        >
          <span v-if="progressStep.status === 'completed'" class="material-icons text-sm">check</span>
          <span
            v-else-if="progressStep.status === 'in_progress'"
            class="material-icons text-sm animate-spin"
          >sync</span>
          <span v-else-if="progressStep.status === 'failed'" class="material-icons text-sm">close</span>
          <span v-else class="text-xs font-medium">{{ idx + 1 }}</span>
        </div>

        <!-- Step Content -->
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium" :class="stepTextClass(progressStep.status)">
            {{ progressStep.label?.tr || progressStep.label?.en || progressStep.id }}
          </p>

          <!-- Step Details -->
          <p
            v-if="progressStep.data && progressStep.status !== 'pending'"
            class="text-xs text-gray-500 dark:text-slate-400 truncate"
          >
            <template v-if="progressStep.id === 'crawl'">
              <span v-if="progressStep.data.pagesScraped">
                {{ progressStep.data.pagesScraped }} sayfa tarandı
              </span>
              <span v-if="progressStep.data.totalChars">
                • {{ formatNumber(progressStep.data.totalChars) }} karakter
              </span>
              <span v-if="progressStep.data.uniqueImages">
                • {{ progressStep.data.uniqueImages }} görsel
              </span>
            </template>
            <template v-else-if="progressStep.id === 'preprocess'">
              <span v-if="progressStep.data.roomsFound">
                {{ progressStep.data.roomsFound }} oda tespit edildi
              </span>
              <span v-if="progressStep.data.imagesFound">
                • {{ progressStep.data.imagesFound }} görsel
              </span>
            </template>
            <template v-else-if="progressStep.id === 'extract'">
              <span v-if="progressStep.data.roomTemplates">
                {{ progressStep.data.roomTemplates }} oda şablonu çıkarıldı
              </span>
            </template>
            <template v-else-if="progressStep.id === 'validate' && progressStep.data.roomCodes">
              Odalar: {{ progressStep.data.roomCodes.slice(0, 5).join(', ')
              }}{{ progressStep.data.roomCodes.length > 5 ? '...' : '' }}
            </template>
          </p>

          <!-- Duration -->
          <p v-if="progressStep.duration" class="text-xs text-gray-400 dark:text-slate-500">
            {{ (progressStep.duration / 1000).toFixed(1) }}s
          </p>
        </div>
      </div>
    </div>

    <!-- Current Page Being Scraped -->
    <div v-if="progress.currentPage" class="mt-4 text-center">
      <p class="text-xs text-gray-400 dark:text-slate-500 truncate max-w-md mx-auto">
        {{ progress.currentPage }}
      </p>
    </div>

    <!-- Elapsed Time Footer -->
    <div class="mt-6 pt-4 border-t border-gray-200 dark:border-slate-700 text-center">
      <div
        class="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-slate-700/50 rounded-full"
      >
        <span class="material-icons text-sm text-gray-500 dark:text-slate-400">schedule</span>
        <span class="text-sm font-medium text-gray-600 dark:text-slate-300">
          Geçen süre:
          <span class="font-mono text-purple-600 dark:text-purple-400">
            {{ formatElapsedTime(elapsedTime) }}
          </span>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  progress: {
    type: Object,
    required: true
  },
  elapsedTime: {
    type: Number,
    default: 0
  }
})

function formatElapsedTime(seconds) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (mins > 0) {
    return `${mins}dk ${secs}sn`
  }
  return `${secs}sn`
}

function formatNumber(num) {
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num
}

function stepContainerClass(status) {
  const classes = {
    completed: 'bg-green-50 dark:bg-green-900/20',
    in_progress: 'bg-purple-50 dark:bg-purple-900/20',
    pending: 'bg-gray-50 dark:bg-slate-700/30',
    failed: 'bg-red-50 dark:bg-red-900/20'
  }
  return classes[status] || classes.pending
}

function stepIconClass(status) {
  const classes = {
    completed: 'bg-green-500 text-white',
    in_progress: 'bg-purple-500 text-white',
    pending: 'bg-gray-300 dark:bg-slate-600 text-gray-500 dark:text-slate-400',
    failed: 'bg-red-500 text-white'
  }
  return classes[status] || classes.pending
}

function stepTextClass(status) {
  const classes = {
    completed: 'text-green-700 dark:text-green-300',
    in_progress: 'text-purple-700 dark:text-purple-300',
    pending: 'text-gray-500 dark:text-slate-400',
    failed: 'text-red-700 dark:text-red-300'
  }
  return classes[status] || classes.pending
}
</script>
