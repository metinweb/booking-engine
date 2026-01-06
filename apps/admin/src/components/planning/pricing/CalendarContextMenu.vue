<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="visible && cell"
        ref="menuRef"
        class="fixed z-[9999] bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-gray-200 dark:border-slate-700 p-3 min-w-[200px]"
        :style="{ top: `${position.y}px`, left: `${position.x}px` }"
      >
        <div class="flex flex-col gap-2">
          <!-- Header -->
          <div
            class="text-xs text-gray-500 dark:text-slate-400 border-b border-gray-100 dark:border-slate-700 pb-2"
          >
            {{ $t('planning.pricing.copyValue') }}:
            <span class="font-bold text-green-600">{{ cell?.value }}</span>
          </div>

          <!-- Input and Button -->
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-600 dark:text-slate-400 whitespace-nowrap">{{
              $t('planning.pricing.copyToNextDays')
            }}</span>
            <input
              v-model.number="localCopyDays"
              type="number"
              min="1"
              max="31"
              class="w-14 text-center text-sm font-bold border-2 border-purple-300 dark:border-purple-700 rounded-lg py-1 bg-white dark:bg-slate-800"
              @keyup.enter="handleCopy"
            />
            <button
              class="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-1"
              @click="handleCopy"
            >
              <span class="material-icons text-sm">content_copy</span>
              {{ $t('common.copy') }}
            </button>
          </div>

          <!-- Cancel -->
          <button
            class="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 mt-1"
            @click="$emit('close')"
          >
            {{ $t('common.cancel') }}
          </button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  position: { type: Object, default: () => ({ x: 0, y: 0 }) },
  cell: { type: Object, default: null }, // { roomTypeId, mealPlanId, date, value }
  copyDaysCount: { type: Number, default: 7 }
})

const emit = defineEmits(['close', 'copy-to-days'])

const menuRef = ref(null)
const localCopyDays = ref(7)

// Sync with prop
watch(
  () => props.copyDaysCount,
  newVal => {
    localCopyDays.value = newVal
  },
  { immediate: true }
)

const handleCopy = () => {
  emit('copy-to-days', localCopyDays.value)
}

defineExpose({
  menuRef
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: all 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
