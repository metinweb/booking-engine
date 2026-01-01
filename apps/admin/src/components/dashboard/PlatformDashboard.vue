<template>
  <div class="space-y-6">
    <!-- Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        :title="$t('dashboard.platform.totalPartners')"
        :value="stats.partners?.total || 0"
        icon="business"
        color="purple"
        :sub-label="$t('dashboard.platform.active')"
        :sub-value="stats.partners?.active || 0"
      />
      <StatCard
        :title="$t('dashboard.platform.totalAgencies')"
        :value="stats.agencies?.total || 0"
        icon="storefront"
        color="blue"
      />
      <StatCard
        :title="$t('dashboard.platform.monthlyBookings')"
        :value="stats.bookings?.monthly || 0"
        icon="calendar_month"
        color="green"
        :sub-label="$t('dashboard.platform.total')"
        :sub-value="stats.bookings?.total || 0"
      />
      <StatCard
        :title="$t('dashboard.platform.monthlyRevenue')"
        :value="stats.revenue?.monthly || 0"
        icon="payments"
        color="orange"
        format="currency"
      />
    </div>

    <!-- Second Row -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatCard
        :title="$t('dashboard.platform.totalHotels')"
        :value="stats.hotels?.total || 0"
        icon="hotel"
        color="cyan"
      />
      <StatCard
        :title="$t('dashboard.platform.totalUsers')"
        :value="stats.users?.total || 0"
        icon="people"
        color="purple"
      />
      <StatCard
        :title="$t('dashboard.platform.pendingPartners')"
        :value="stats.partners?.pending || 0"
        icon="pending_actions"
        color="red"
      />
    </div>

    <!-- Charts and Tables Row -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Recent Bookings -->
      <div class="bg-white dark:bg-slate-800 rounded-xl shadow p-6">
        <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
          <span class="material-icons text-purple-600 mr-2">schedule</span>
          {{ $t('dashboard.recentBookings') }}
        </h3>
        <div class="space-y-3">
          <div
            v-for="booking in recentBookings"
            :key="booking._id"
            class="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg"
          >
            <div>
              <p class="font-medium text-gray-800 dark:text-white">{{ booking.bookingNumber }}</p>
              <p class="text-sm text-gray-500 dark:text-slate-400">{{ booking.hotel?.name }}</p>
            </div>
            <div class="text-right">
              <p class="font-semibold text-gray-800 dark:text-white">{{ formatPrice(booking.pricing?.grandTotal, booking.pricing?.currency) }}</p>
              <span
                :class="[
                  'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                  getStatusClass(booking.status)
                ]"
              >
                {{ $t('booking.statuses.' + booking.status) }}
              </span>
            </div>
          </div>
          <p v-if="!recentBookings?.length" class="text-center text-gray-500 dark:text-slate-400 py-4">
            {{ $t('dashboard.noRecentBookings') }}
          </p>
        </div>
      </div>

      <!-- Top Partners -->
      <div class="bg-white dark:bg-slate-800 rounded-xl shadow p-6">
        <h3 class="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
          <span class="material-icons text-green-600 mr-2">leaderboard</span>
          {{ $t('dashboard.platform.topPartners') }}
        </h3>
        <div class="space-y-3">
          <div
            v-for="(partner, index) in topPartners"
            :key="partner._id"
            class="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg"
          >
            <div class="flex items-center">
              <span
                :class="[
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mr-3',
                  index === 0 ? 'bg-yellow-100 text-yellow-700' :
                  index === 1 ? 'bg-gray-200 text-gray-700' :
                  index === 2 ? 'bg-orange-100 text-orange-700' :
                  'bg-gray-100 text-gray-600'
                ]"
              >
                {{ index + 1 }}
              </span>
              <div>
                <p class="font-medium text-gray-800 dark:text-white">{{ partner.name }}</p>
                <p class="text-sm text-gray-500 dark:text-slate-400">{{ partner.count }} {{ $t('dashboard.bookings') }}</p>
              </div>
            </div>
            <p class="font-semibold text-green-600 dark:text-green-400">₺{{ partner.revenue?.toLocaleString('tr-TR') }}</p>
          </div>
          <p v-if="!topPartners?.length" class="text-center text-gray-500 dark:text-slate-400 py-4">
            {{ $t('dashboard.noData') }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import StatCard from './StatCard.vue'

defineProps({
  stats: { type: Object, default: () => ({}) },
  recentBookings: { type: Array, default: () => [] },
  topPartners: { type: Array, default: () => [] },
  monthlyTrend: { type: Array, default: () => [] }
})

const getStatusClass = (status) => {
  const classes = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    confirmed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
  }
  return classes[status] || classes.pending
}

const formatPrice = (amount, currency = 'TRY') => {
  if (!amount && amount !== 0) return '-'
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}
</script>
