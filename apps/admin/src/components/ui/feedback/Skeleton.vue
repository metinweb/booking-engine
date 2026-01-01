<template>
  <div
    class="ui-skeleton animate-pulse"
    :class="[shapeClasses, colorClasses]"
    :style="customStyles"
  ></div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  // Type presets
  type: {
    type: String,
    default: 'text',
    validator: (v) => ['text', 'circle', 'rect', 'avatar', 'button', 'card', 'image'].includes(v)
  },
  // Custom dimensions
  width: {
    type: [String, Number],
    default: null
  },
  height: {
    type: [String, Number],
    default: null
  },
  // Size for presets
  size: {
    type: String,
    default: 'md',
    validator: (v) => ['xs', 'sm', 'md', 'lg', 'xl'].includes(v)
  },
  // Animation
  animation: {
    type: String,
    default: 'pulse',
    validator: (v) => ['pulse', 'wave', 'none'].includes(v)
  }
})

// Shape classes based on type
const shapeClasses = computed(() => {
  const presets = {
    text: getTextClasses(),
    circle: 'rounded-full aspect-square',
    rect: 'rounded-lg',
    avatar: 'rounded-full aspect-square',
    button: 'rounded-lg',
    card: 'rounded-xl',
    image: 'rounded-lg aspect-video'
  }
  return presets[props.type]
})

// Color classes
const colorClasses = computed(() => {
  return 'bg-gray-200 dark:bg-slate-700'
})

// Text line classes based on size
function getTextClasses() {
  const sizes = {
    xs: 'h-3 rounded',
    sm: 'h-4 rounded',
    md: 'h-5 rounded',
    lg: 'h-6 rounded',
    xl: 'h-8 rounded-lg'
  }
  return sizes[props.size]
}

// Custom styles for dimensions
const customStyles = computed(() => {
  const styles = {}

  // Width
  if (props.width) {
    styles.width = typeof props.width === 'number' ? `${props.width}px` : props.width
  } else {
    // Default widths based on type
    const defaultWidths = {
      text: '100%',
      circle: getCircleSize(),
      rect: '100%',
      avatar: getAvatarSize(),
      button: '80px',
      card: '100%',
      image: '100%'
    }
    styles.width = defaultWidths[props.type]
  }

  // Height
  if (props.height) {
    styles.height = typeof props.height === 'number' ? `${props.height}px` : props.height
  } else {
    // Default heights based on type
    const defaultHeights = {
      circle: getCircleSize(),
      rect: '100px',
      avatar: getAvatarSize(),
      button: getButtonHeight(),
      card: '200px'
      // text and image use aspect ratios
    }
    if (defaultHeights[props.type]) {
      styles.height = defaultHeights[props.type]
    }
  }

  return styles
})

function getCircleSize() {
  const sizes = { xs: '24px', sm: '32px', md: '40px', lg: '48px', xl: '64px' }
  return sizes[props.size]
}

function getAvatarSize() {
  const sizes = { xs: '24px', sm: '32px', md: '40px', lg: '48px', xl: '64px' }
  return sizes[props.size]
}

function getButtonHeight() {
  const sizes = { xs: '28px', sm: '32px', md: '38px', lg: '42px', xl: '50px' }
  return sizes[props.size]
}
</script>

<style scoped>
@keyframes skeleton-wave {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

.animation-wave {
  background: linear-gradient(
    90deg,
    theme('colors.gray.200') 25%,
    theme('colors.gray.300') 50%,
    theme('colors.gray.200') 75%
  );
  background-size: 200% 100%;
  animation: skeleton-wave 1.5s ease-in-out infinite;
}

.dark .animation-wave {
  background: linear-gradient(
    90deg,
    theme('colors.slate.700') 25%,
    theme('colors.slate.600') 50%,
    theme('colors.slate.700') 75%
  );
}
</style>
