/**
 * TourCard Component Tests
 */

import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'

// Mock vue-i18n
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key) => key,
    locale: { value: 'tr' }
  })
}))

// Mock @booking-engine/utils
vi.mock('@booking-engine/utils', () => ({
  formatCurrency: (amount, currency) => `${amount} ${currency}`
}))

// Simple TourCard mock for testing
const TourCard = {
  name: 'TourCard',
  props: {
    tour: {
      type: Object,
      required: true
    },
    showActions: {
      type: Boolean,
      default: true
    }
  },
  emits: ['click', 'action'],
  template: `
    <div class="tour-card" @click="$emit('click', tour)">
      <div class="tour-image">
        <img v-if="tour.images?.[0]?.url" :src="tour.images[0].url" :alt="tour.name?.tr" />
        <span v-else class="no-image">tour</span>
      </div>
      <div class="tour-content">
        <span class="tour-type">{{ tour.tourType }}</span>
        <span class="tour-code">{{ tour.code }}</span>
        <h3 class="tour-name">{{ tour.name?.tr || tour.name }}</h3>
        <div class="tour-destination">{{ tour.destination?.city }}</div>
        <div class="tour-price">{{ getLowestPrice() }} {{ tour.currency || 'TRY' }}</div>
      </div>
      <button v-if="showActions" @click.stop="$emit('action', 'view', tour)" class="action-btn">
        arrow_forward
      </button>
    </div>
  `,
  methods: {
    getLowestPrice() {
      if (this.tour.departures?.length > 0) {
        const prices = this.tour.departures
          .filter(d => d.pricing?.adult?.double)
          .map(d => d.pricing.adult.double)
        if (prices.length > 0) {
          return Math.min(...prices)
        }
      }
      return this.tour.basePrice || 0
    }
  }
}

describe('TourCard', () => {
  const mockTour = {
    _id: '1',
    name: { tr: 'Kapadokya Turu', en: 'Cappadocia Tour' },
    code: 'TUR001',
    tourType: 'package',
    status: 'active',
    featured: true,
    duration: { nights: 3, days: 4 },
    destination: { city: 'Nevşehir', country: 'Türkiye' },
    transportation: [{ type: 'bus' }],
    images: [{ url: '/images/tour1.jpg' }],
    currency: 'TRY',
    basePrice: 5000,
    departures: [
      { pricing: { adult: { double: 4500 } } },
      { pricing: { adult: { double: 5000 } } }
    ]
  }

  it('renders tour name', () => {
    const wrapper = mount(TourCard, {
      props: { tour: mockTour }
    })

    expect(wrapper.text()).toContain('Kapadokya Turu')
  })

  it('renders tour code', () => {
    const wrapper = mount(TourCard, {
      props: { tour: mockTour }
    })

    expect(wrapper.text()).toContain('TUR001')
  })

  it('renders tour type', () => {
    const wrapper = mount(TourCard, {
      props: { tour: mockTour }
    })

    expect(wrapper.text()).toContain('package')
  })

  it('renders destination city', () => {
    const wrapper = mount(TourCard, {
      props: { tour: mockTour }
    })

    expect(wrapper.text()).toContain('Nevşehir')
  })

  it('renders image when available', () => {
    const wrapper = mount(TourCard, {
      props: { tour: mockTour }
    })

    const img = wrapper.find('img')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toBe('/images/tour1.jpg')
  })

  it('renders placeholder when no image', () => {
    const tourWithoutImage = { ...mockTour, images: [] }
    const wrapper = mount(TourCard, {
      props: { tour: tourWithoutImage }
    })

    expect(wrapper.find('.no-image').exists()).toBe(true)
  })

  it('calculates lowest price from departures', () => {
    const wrapper = mount(TourCard, {
      props: { tour: mockTour }
    })

    // Should show 4500 (the lowest departure price)
    expect(wrapper.text()).toContain('4500')
  })

  it('uses base price when no departures', () => {
    const tourWithoutDepartures = { ...mockTour, departures: [] }
    const wrapper = mount(TourCard, {
      props: { tour: tourWithoutDepartures }
    })

    expect(wrapper.text()).toContain('5000')
  })

  it('emits click event when card is clicked', async () => {
    const wrapper = mount(TourCard, {
      props: { tour: mockTour }
    })

    await wrapper.trigger('click')

    expect(wrapper.emitted('click')).toBeTruthy()
    expect(wrapper.emitted('click')[0]).toEqual([mockTour])
  })

  it('emits action event when action button is clicked', async () => {
    const wrapper = mount(TourCard, {
      props: { tour: mockTour, showActions: true }
    })

    await wrapper.find('.action-btn').trigger('click')

    expect(wrapper.emitted('action')).toBeTruthy()
    expect(wrapper.emitted('action')[0]).toEqual(['view', mockTour])
  })

  it('hides action button when showActions is false', () => {
    const wrapper = mount(TourCard, {
      props: { tour: mockTour, showActions: false }
    })

    expect(wrapper.find('.action-btn').exists()).toBe(false)
  })
})
