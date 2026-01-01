<!--
  PMS Layout

  This layout wraps all PMS pages and provides:
  - Unified PMS context (via PmsProvider)
  - Socket initialization and lifecycle
  - Navigation component

  All child components can access PMS context via:
    import { usePmsContextInjection } from '@/composables/usePmsContext'
    const { hotelId, user, hasPermission } = usePmsContextInjection()
-->
<template>
  <PmsProvider>
    <div class="space-y-4">
      <!-- PMS Sub Navigation -->
      <PMSNavigation
        @quick-checkin="handleQuickCheckin"
        @quick-walkin="handleQuickWalkin"
        @new-reservation="handleNewReservation"
      />

      <!-- Page Content -->
      <router-view v-slot="{ Component }">
        <Transition
          enter-active-class="transition ease-out duration-200"
          enter-from-class="opacity-0 transform translate-y-4"
          enter-to-class="opacity-100 transform translate-y-0"
          leave-active-class="transition ease-in duration-150"
          leave-from-class="opacity-100 transform translate-y-0"
          leave-to-class="opacity-0 transform -translate-y-4"
          mode="out-in"
        >
          <component :is="Component" />
        </Transition>
      </router-view>
    </div>
  </PmsProvider>
</template>

<script setup>
import PmsProvider from '@/components/pms/PmsProvider.vue'
import PMSNavigation from '@/components/pms/common/PMSNavigation.vue'

// Quick action handlers - will be implemented later
const handleQuickCheckin = () => {
  console.log('Quick check-in clicked')
  // TODO: Open quick check-in modal
}

const handleQuickWalkin = () => {
  console.log('Quick walk-in clicked')
  // TODO: Open quick walk-in modal
}

const handleNewReservation = () => {
  console.log('New reservation clicked')
  // TODO: Open new reservation modal
}
</script>
