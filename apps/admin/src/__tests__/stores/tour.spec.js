/**
 * Tour Store Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// Use vi.hoisted to create mock functions that can be used in vi.mock
const {
  mockGetTours,
  mockGetTour,
  mockCreateTour,
  mockUpdateTour,
  mockDeleteTour,
  mockGetDepartures,
  mockCreateDeparture,
  mockUpdateDeparture,
  mockDeleteDeparture,
  mockGetExtras,
  mockCreateExtra,
  mockUpdateExtra,
  mockDeleteExtra,
  mockGetBookings,
  mockGetBooking,
  mockCreateBooking,
  mockUpdateBooking,
  mockCancelBooking,
  mockAddBookingPayment
} = vi.hoisted(() => ({
  mockGetTours: vi.fn(),
  mockGetTour: vi.fn(),
  mockCreateTour: vi.fn(),
  mockUpdateTour: vi.fn(),
  mockDeleteTour: vi.fn(),
  mockGetDepartures: vi.fn(),
  mockCreateDeparture: vi.fn(),
  mockUpdateDeparture: vi.fn(),
  mockDeleteDeparture: vi.fn(),
  mockGetExtras: vi.fn(),
  mockCreateExtra: vi.fn(),
  mockUpdateExtra: vi.fn(),
  mockDeleteExtra: vi.fn(),
  mockGetBookings: vi.fn(),
  mockGetBooking: vi.fn(),
  mockCreateBooking: vi.fn(),
  mockUpdateBooking: vi.fn(),
  mockCancelBooking: vi.fn(),
  mockAddBookingPayment: vi.fn()
}))

vi.mock('@/services/tourService', () => ({
  getTours: mockGetTours,
  getTour: mockGetTour,
  createTour: mockCreateTour,
  updateTour: mockUpdateTour,
  deleteTour: mockDeleteTour,
  getDepartures: mockGetDepartures,
  createDeparture: mockCreateDeparture,
  updateDeparture: mockUpdateDeparture,
  deleteDeparture: mockDeleteDeparture,
  getExtras: mockGetExtras,
  createExtra: mockCreateExtra,
  updateExtra: mockUpdateExtra,
  deleteExtra: mockDeleteExtra,
  getBookings: mockGetBookings,
  getBooking: mockGetBooking,
  createBooking: mockCreateBooking,
  updateBooking: mockUpdateBooking,
  cancelBooking: mockCancelBooking,
  addBookingPayment: mockAddBookingPayment
}))

// Mock toast
vi.mock('vue-toastification', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn()
  })
}))

// Import after mocks
import { useTourStore } from '@/stores/tour'

describe('Tour Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  describe('Initial State', () => {
    it('has correct initial state', () => {
      const store = useTourStore()

      expect(store.tours).toEqual([])
      expect(store.departures).toEqual([])
      expect(store.extras).toEqual([])
      expect(store.bookings).toEqual([])
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
    })
  })

  describe('Tours', () => {
    it('fetches tours', async () => {
      const mockTours = [
        { _id: '1', name: { tr: 'Test Tur 1' }, code: 'TUR001', status: 'active' },
        { _id: '2', name: { tr: 'Test Tur 2' }, code: 'TUR002', status: 'draft' }
      ]

      mockGetTours.mockResolvedValue({ data: mockTours })

      const store = useTourStore()
      await store.fetchTours()

      expect(mockGetTours).toHaveBeenCalled()
      expect(store.tours).toEqual(mockTours)
    })

    it('creates a tour', async () => {
      const newTour = {
        name: { tr: 'Yeni Tur' },
        code: 'TUR003',
        tourType: 'package'
      }

      const createdTour = { _id: '3', ...newTour }
      mockCreateTour.mockResolvedValue({ data: createdTour })

      const store = useTourStore()
      const result = await store.createTour(newTour)

      expect(mockCreateTour).toHaveBeenCalledWith(newTour)
      expect(result).toEqual(createdTour)
      expect(store.tours).toContainEqual(createdTour)
    })

    it('updates a tour', async () => {
      const store = useTourStore()
      store.tours = [{ _id: '1', name: { tr: 'Eski İsim' }, status: 'draft' }]

      const updatedTour = { _id: '1', name: { tr: 'Yeni İsim' }, status: 'active' }
      mockUpdateTour.mockResolvedValue({ data: updatedTour })

      await store.updateTour('1', { name: { tr: 'Yeni İsim' }, status: 'active' })

      expect(mockUpdateTour).toHaveBeenCalledWith('1', { name: { tr: 'Yeni İsim' }, status: 'active' })
      expect(store.tours[0].name.tr).toBe('Yeni İsim')
    })

    it('deletes a tour', async () => {
      const store = useTourStore()
      store.tours = [
        { _id: '1', name: { tr: 'Tur 1' } },
        { _id: '2', name: { tr: 'Tur 2' } }
      ]

      mockDeleteTour.mockResolvedValue({})

      await store.deleteTour('1')

      expect(mockDeleteTour).toHaveBeenCalledWith('1')
      expect(store.tours).toHaveLength(1)
      expect(store.tours[0]._id).toBe('2')
    })
  })

  describe('Computed Getters', () => {
    it('filters active tours', () => {
      const store = useTourStore()
      store.tours = [
        { _id: '1', status: 'active' },
        { _id: '2', status: 'draft' },
        { _id: '3', status: 'active' },
        { _id: '4', status: 'inactive' }
      ]

      expect(store.activeTours).toHaveLength(2)
      expect(store.activeTours.every(t => t.status === 'active')).toBe(true)
    })

    it('filters featured tours', () => {
      const store = useTourStore()
      // Store uses 'isFeatured' not 'featured'
      store.tours = [
        { _id: '1', isFeatured: true },
        { _id: '2', isFeatured: false },
        { _id: '3', isFeatured: true }
      ]

      expect(store.featuredTours).toHaveLength(2)
      expect(store.featuredTours.every(t => t.isFeatured)).toBe(true)
    })

    it('filters active extras', () => {
      const store = useTourStore()
      store.extras = [
        { _id: '1', status: 'active' },
        { _id: '2', status: 'inactive' },
        { _id: '3', status: 'active' }
      ]

      expect(store.activeExtras).toHaveLength(2)
    })

    it('filters pending bookings', () => {
      const store = useTourStore()
      store.bookings = [
        { _id: '1', status: 'pending' },
        { _id: '2', status: 'confirmed' },
        { _id: '3', status: 'pending' },
        { _id: '4', status: 'cancelled' }
      ]

      expect(store.pendingBookings).toHaveLength(2)
      expect(store.pendingBookings.every(b => b.status === 'pending')).toBe(true)
    })
  })

  describe('Departures', () => {
    it('fetches departures', async () => {
      const mockDepartures = [
        { _id: '1', departureDate: '2024-06-01', capacity: { total: 30, available: 25 } },
        { _id: '2', departureDate: '2024-06-15', capacity: { total: 30, available: 10 } }
      ]

      mockGetDepartures.mockResolvedValue({ data: mockDepartures })

      const store = useTourStore()
      // fetchDepartures requires tourId as first argument
      await store.fetchDepartures('tour-1')

      expect(mockGetDepartures).toHaveBeenCalled()
      expect(store.departures).toEqual(mockDepartures)
    })

    it('creates a departure', async () => {
      const newDeparture = {
        departureDate: '2024-07-01',
        capacity: { total: 30 }
      }

      const createdDeparture = { _id: '3', ...newDeparture }
      mockCreateDeparture.mockResolvedValue({ data: createdDeparture })

      const store = useTourStore()
      // createDeparture requires tourId as first argument
      await store.createDeparture('tour-1', newDeparture)

      expect(mockCreateDeparture).toHaveBeenCalledWith('tour-1', newDeparture)
      expect(store.departures).toContainEqual(createdDeparture)
    })
  })

  describe('Extras', () => {
    it('fetches extras', async () => {
      const mockExtras = [
        { _id: '1', code: 'EXT001', category: 'activity' },
        { _id: '2', code: 'EXT002', category: 'meal' }
      ]

      mockGetExtras.mockResolvedValue({ data: mockExtras })

      const store = useTourStore()
      await store.fetchExtras()

      expect(mockGetExtras).toHaveBeenCalled()
      expect(store.extras).toEqual(mockExtras)
    })

    it('groups extras by category', () => {
      const store = useTourStore()
      store.extras = [
        { _id: '1', category: 'activity' },
        { _id: '2', category: 'meal' },
        { _id: '3', category: 'activity' },
        { _id: '4', category: 'transfer' }
      ]

      const byCategory = store.extrasByCategory
      expect(byCategory.activity).toHaveLength(2)
      expect(byCategory.meal).toHaveLength(1)
      expect(byCategory.transfer).toHaveLength(1)
    })
  })

  describe('Bookings', () => {
    it('fetches bookings', async () => {
      const mockBookings = [
        { _id: '1', bookingNumber: 'TUR-2024-000001', status: 'pending' },
        { _id: '2', bookingNumber: 'TUR-2024-000002', status: 'confirmed' }
      ]

      mockGetBookings.mockResolvedValue({ data: mockBookings })

      const store = useTourStore()
      await store.fetchBookings()

      expect(mockGetBookings).toHaveBeenCalled()
      expect(store.bookings).toEqual(mockBookings)
    })

    it('creates a booking', async () => {
      const newBooking = {
        tour: '1',
        departure: '1',
        passengers: [{ firstName: 'Test', lastName: 'User', type: 'adult' }]
      }

      const createdBooking = { _id: '3', bookingNumber: 'TUR-2024-000003', ...newBooking }
      mockCreateBooking.mockResolvedValue({ data: createdBooking })

      const store = useTourStore()
      const result = await store.createBooking(newBooking)

      expect(mockCreateBooking).toHaveBeenCalledWith(newBooking)
      expect(result).toEqual(createdBooking)
    })

    it('cancels a booking', async () => {
      const store = useTourStore()
      store.bookings = [{ _id: '1', status: 'confirmed' }]

      const cancelledBooking = { _id: '1', status: 'cancelled' }
      mockCancelBooking.mockResolvedValue({ data: cancelledBooking })

      // cancelBooking expects an object as second param
      await store.cancelBooking('1', { reason: 'Customer request' })

      expect(mockCancelBooking).toHaveBeenCalledWith('1', { reason: 'Customer request' })
      expect(store.bookings[0].status).toBe('cancelled')
    })

    it('adds payment to booking', async () => {
      const payment = {
        amount: 1000,
        method: 'credit_card',
        currency: 'TRY'
      }

      mockAddBookingPayment.mockResolvedValue({ data: { success: true } })

      const store = useTourStore()
      // Store uses addPayment not addBookingPayment
      await store.addPayment('1', payment)

      expect(mockAddBookingPayment).toHaveBeenCalledWith('1', payment)
    })
  })

  describe('Error Handling', () => {
    it('handles fetch error', async () => {
      mockGetTours.mockRejectedValue(new Error('Network error'))

      const store = useTourStore()

      await expect(store.fetchTours()).rejects.toThrow('Network error')
    })

    it('handles create error', async () => {
      mockCreateTour.mockRejectedValue(new Error('Validation error'))

      const store = useTourStore()

      await expect(store.createTour({})).rejects.toThrow('Validation error')
    })
  })
})
