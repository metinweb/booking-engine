<template>
  <div class="mention-input-wrapper relative">
    <textarea
      ref="textareaRef"
      v-model="localContent"
      :class="textareaClass"
      :placeholder="placeholder"
      :rows="rows"
      @input="handleInput"
      @keydown="handleKeydown"
      @blur="handleBlur"
    />

    <!-- Autocomplete dropdown -->
    <Transition name="fade">
      <div
        v-if="showSuggestions && filteredUsers.length > 0"
        class="absolute z-50 w-64 max-h-48 overflow-y-auto bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg shadow-lg mt-1"
        :style="dropdownStyle"
      >
        <div
          v-for="(user, index) in filteredUsers"
          :key="user._id"
          class="flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors"
          :class="{
            'bg-purple-100 dark:bg-purple-900/30': index === selectedIndex,
            'hover:bg-gray-100 dark:hover:bg-slate-700': index !== selectedIndex
          }"
          @mousedown.prevent="selectUser(user)"
          @mouseenter="selectedIndex = index"
        >
          <div
            v-if="user.avatar"
            class="w-6 h-6 rounded-full overflow-hidden flex-shrink-0"
          >
            <img :src="getAvatarUrl(user)" :alt="user.name" class="w-full h-full object-cover" />
          </div>
          <div
            v-else
            class="w-6 h-6 rounded-full bg-purple-200 dark:bg-purple-900/50 flex items-center justify-center text-xs font-medium text-purple-700 dark:text-purple-300 flex-shrink-0"
          >
            {{ user.name?.charAt(0)?.toUpperCase() }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ user.name }}</p>
            <p class="text-xs text-gray-500 dark:text-slate-400 truncate">{{ user.email }}</p>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { getAvatarUrl } from '@/utils/imageUrl'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  users: {
    type: Array,
    default: () => []
  },
  placeholder: {
    type: String,
    default: ''
  },
  rows: {
    type: Number,
    default: 3
  },
  textareaClass: {
    type: String,
    default: 'form-input w-full'
  }
})

const emit = defineEmits(['update:modelValue', 'mentions-change', 'submit'])

// Refs
const textareaRef = ref(null)
const localContent = ref(props.modelValue)
const showSuggestions = ref(false)
const selectedIndex = ref(0)
const mentionStartIndex = ref(-1)
const searchQuery = ref('')
const mentionedUsers = ref([]) // Track mentioned user IDs

// Sync with v-model
watch(() => props.modelValue, (val) => {
  localContent.value = val
})

watch(localContent, (val) => {
  emit('update:modelValue', val)
  // Extract mentions from content
  extractMentions(val)
})

// Dropdown position
const dropdownStyle = computed(() => {
  return { left: '0px' }
})

// Filtered users based on search query
const filteredUsers = computed(() => {
  if (!searchQuery.value) return props.users.slice(0, 5)

  const query = searchQuery.value.toLowerCase()
  return props.users
    .filter(user =>
      user.name?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query)
    )
    .slice(0, 5)
})

// Extract @mentions from content and emit
const extractMentions = (content) => {
  const mentionPattern = /@(\w+)/g
  const matches = [...content.matchAll(mentionPattern)]
  const mentionedNames = matches.map(m => m[1].toLowerCase())

  // Find user IDs for mentioned names
  const userIds = props.users
    .filter(user => {
      const username = user.name?.toLowerCase().replace(/\s+/g, '')
      return mentionedNames.includes(username)
    })
    .map(user => user._id)

  if (JSON.stringify(userIds) !== JSON.stringify(mentionedUsers.value)) {
    mentionedUsers.value = userIds
    emit('mentions-change', userIds)
  }
}

// Handle input - detect @ character
const handleInput = (e) => {
  const textarea = e.target
  const cursorPos = textarea.selectionStart
  const textBeforeCursor = localContent.value.slice(0, cursorPos)

  // Find the last @ before cursor
  const lastAtIndex = textBeforeCursor.lastIndexOf('@')

  if (lastAtIndex !== -1) {
    // Check if @ is at start or after whitespace
    const charBefore = lastAtIndex > 0 ? textBeforeCursor[lastAtIndex - 1] : ' '
    if (charBefore === ' ' || charBefore === '\n' || lastAtIndex === 0) {
      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1)

      // Check if there's no space after @
      if (!textAfterAt.includes(' ') && !textAfterAt.includes('\n')) {
        mentionStartIndex.value = lastAtIndex
        searchQuery.value = textAfterAt
        showSuggestions.value = true
        selectedIndex.value = 0
        return
      }
    }
  }

  showSuggestions.value = false
}

// Handle keyboard navigation
const handleKeydown = (e) => {
  if (!showSuggestions.value) {
    // Ctrl+Enter to submit
    if (e.ctrlKey && e.key === 'Enter') {
      emit('submit')
    }
    return
  }

  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault()
      selectedIndex.value = Math.min(selectedIndex.value + 1, filteredUsers.value.length - 1)
      break
    case 'ArrowUp':
      e.preventDefault()
      selectedIndex.value = Math.max(selectedIndex.value - 1, 0)
      break
    case 'Enter':
    case 'Tab':
      if (filteredUsers.value.length > 0) {
        e.preventDefault()
        selectUser(filteredUsers.value[selectedIndex.value])
      }
      break
    case 'Escape':
      e.preventDefault()
      showSuggestions.value = false
      break
  }
}

// Handle blur - close dropdown with delay
const handleBlur = () => {
  setTimeout(() => {
    showSuggestions.value = false
  }, 150)
}

// Select a user from dropdown
const selectUser = (user) => {
  if (mentionStartIndex.value === -1) return

  const username = user.name.replace(/\s+/g, '')
  const beforeMention = localContent.value.slice(0, mentionStartIndex.value)
  const afterCursor = localContent.value.slice(
    mentionStartIndex.value + 1 + searchQuery.value.length
  )

  localContent.value = `${beforeMention}@${username} ${afterCursor}`
  showSuggestions.value = false

  // Set cursor position after mention
  nextTick(() => {
    const newCursorPos = mentionStartIndex.value + username.length + 2
    textareaRef.value?.setSelectionRange(newCursorPos, newCursorPos)
    textareaRef.value?.focus()
  })
}

// Expose for parent components
defineExpose({
  focus: () => textareaRef.value?.focus(),
  clear: () => {
    localContent.value = ''
    mentionedUsers.value = []
  }
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
