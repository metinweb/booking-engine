<template>
  <div>
    <RouterView />
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

onMounted(async () => {
  // Check if user is already authenticated on app load
  await authStore.checkAuth()
})
</script>

<style>
/* Remove default margins and ensure full height */
html, body, #app {
  height: 100%;
  margin: 0;
  padding: 0;
}

/* Ensure smooth scrolling */
html {
  scroll-behavior: smooth;
}

/* Focus styles */
:focus {
  outline: 2px solid theme('colors.purple.500');
  outline-offset: 2px;
}

/* Custom selection color */
::selection {
  background-color: theme('colors.purple.200');
  color: theme('colors.purple.900');
}
</style>