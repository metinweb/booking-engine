<template>
  <div>
    <div class="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
      <h2 class="text-2xl font-bold text-gray-800 dark:text-white mb-4">Profile</h2>
      <p class="text-gray-600 dark:text-slate-400 mb-6">Manage your account settings</p>
      
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Name</label>
          <p class="text-gray-900 dark:text-white">{{ authStore.user?.name || 'N/A' }}</p>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Email</label>
          <p class="text-gray-900 dark:text-white">{{ authStore.user?.email || 'N/A' }}</p>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Role</label>
          <p class="text-gray-900 dark:text-white">{{ authStore.user?.role || 'N/A' }}</p>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Account Type</label>
          <p class="text-gray-900 dark:text-white">{{ authStore.user?.accountType || 'N/A' }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
</script>
