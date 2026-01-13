/**
 * Subscription Plans Configuration
 *
 * Paket tipleri, fiyatlar ve ozellikleri.
 * 3 paket: Business, Professional, Enterprise
 */

export const SUBSCRIPTION_PLANS = {
  business: {
    name: 'Business',
    description: 'Orta ölçekli işletmeler için',
    price: {
      yearly: 118.9,
      currency: 'USD'
    },
    features: {
      pms: {
        enabled: false,
        maxHotels: 0
      }
    }
  },
  professional: {
    name: 'Professional',
    description: 'PMS entegrasyonu dahil profesyonel paket',
    price: {
      yearly: 178.8,
      currency: 'USD'
    },
    features: {
      pms: {
        enabled: true,
        maxHotels: 5
      }
    }
  },
  enterprise: {
    name: 'Enterprise',
    description: 'Sınırsız PMS ile kurumsal paket',
    price: {
      yearly: 298.8,
      currency: 'USD'
    },
    features: {
      pms: {
        enabled: true,
        maxHotels: -1 // -1 = sınırsız
      }
    }
  }
}

// Grace period ve hatırlatma konfigürasyonu
export const SUBSCRIPTION_CONFIG = {
  gracePeriodDays: 14,
  reminderDaysBefore: [30, 14, 7, 3, 1] // Yenileme hatırlatma günleri
}

// Abonelik durumları
export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  EXPIRED: 'expired',
  GRACE_PERIOD: 'grace_period',
  CANCELLED: 'cancelled',
  SUSPENDED: 'suspended'
}

export const PLAN_TYPES = Object.keys(SUBSCRIPTION_PLANS)

export default SUBSCRIPTION_PLANS
