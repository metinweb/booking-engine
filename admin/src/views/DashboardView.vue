<template>
  <div>
    <div class="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
      <h2 class="text-2xl font-bold text-gray-800 dark:text-white mb-4">Dashboard</h2>
      <p class="text-gray-600 dark:text-slate-400">Welcome to the Booking Engine admin panel.</p>
      
      <!-- Stats Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div class="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-purple-600 dark:text-purple-400 font-medium">Total Partners</p>
              <p class="text-3xl font-bold text-gray-800 dark:text-white mt-2">0</p>
            </div>
            <svg class="w-12 h-12 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
        </div>
        
        <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-blue-600 dark:text-blue-400 font-medium">Active Bookings</p>
              <p class="text-3xl font-bold text-gray-800 dark:text-white mt-2">0</p>
            </div>
            <svg class="w-12 h-12 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
        
        <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-green-600 dark:text-green-400 font-medium">Revenue (MTD)</p>
              <p class="text-3xl font-bold text-gray-800 dark:text-white mt-2">$0</p>
            </div>
            <svg class="w-12 h-12 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// Dashboard view - will add functionality later
</script>
