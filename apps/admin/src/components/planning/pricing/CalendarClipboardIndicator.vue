<template>
  <Transition name="fade">
    <div
      v-if="copiedWeek"
      class="fixed bottom-6 right-6 z-40 flex items-center gap-3 px-4 py-3 bg-blue-600 text-white rounded-xl shadow-lg"
    >
      <span class="material-icons text-lg">content_paste</span>
      <div>
        <div class="font-medium text-sm">{{ $t('planning.pricing.weekCopied') }}</div>
        <div class="text-xs opacity-80">
          {{ copiedWeek.duration }} {{ locale === 'tr' ? 'gun' : 'days' }}
        </div>
      </div>
      <button
        class="ml-2 p-1 hover:bg-blue-500 rounded transition-colors"
        @click="$emit('clear')"
      >
        <span class="material-icons text-sm">close</span>
      </button>
    </div>
  </Transition>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

defineProps({
  copiedWeek: { type: Object, default: null }
})

defineEmits(['clear'])

const { locale } = useI18n()
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
