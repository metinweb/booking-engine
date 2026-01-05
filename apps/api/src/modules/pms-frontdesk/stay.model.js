import mongoose from 'mongoose'

/**
 * Stay Model - Active guest stays in rooms
 * Tracks check-in to check-out lifecycle
 */

// Stay status enum
export const STAY_STATUS = {
  PENDING: 'pending', // Bekleyen rezervasyon (henuz check-in yapilmadi)
  CHECKED_IN: 'checked_in', // Aktif konaklama
  CHECKED_OUT: 'checked_out', // Cikis yapildi
  NO_SHOW: 'no_show', // Gelmedi
  CANCELLED: 'cancelled' // Iptal edildi
}

// Payment status
export const PAYMENT_STATUS = {
  PENDING: 'pending', // Odeme bekliyor
  PARTIAL: 'partial', // Kismi odeme
  PAID: 'paid', // Odendi
  REFUNDED: 'refunded' // Iade edildi
}

// Guest type
export const GUEST_TYPE = {
  ADULT: 'adult',
  CHILD: 'child',
  INFANT: 'infant'
}

const guestSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true
    },
    lastName: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      enum: Object.values(GUEST_TYPE),
      default: GUEST_TYPE.ADULT
    },
    age: {
      type: Number,
      min: 0,
      max: 120
    },
    nationality: {
      type: String,
      trim: true
    },
    idType: {
      type: String,
      enum: ['tc_kimlik', 'passport', 'driving_license', 'other'],
      default: 'tc_kimlik'
    },
    idNumber: {
      type: String,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    // KBS (Kimlik Bildirim Sistemi) fields
    dateOfBirth: { type: Date },
    fatherName: { type: String, trim: true },
    motherName: { type: String, trim: true },
    birthPlace: { type: String, trim: true },
    isMainGuest: {
      type: Boolean,
      default: false
    }
  },
  { _id: true }
)

const staySchema = new mongoose.Schema(
  {
    // Multi-tenant
    partner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Partner',
      required: [true, 'Partner gerekli'],
      index: true
    },

    hotel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotel',
      required: [true, 'Hotel gerekli'],
      index: true
    },

    // Stay identification
    stayNumber: {
      type: String,
      unique: true,
      sparse: true // Allow null/undefined for pre-save hook to generate
    },

    // Room assignment (optional for pending reservations, required at check-in)
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      default: null
    },

    roomType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RoomType',
      required: true
    },

    // Booking reference (optional - null for walk-ins)
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      default: null
    },

    bookingNumber: {
      type: String,
      default: null
    },

    // Stay dates
    checkInDate: {
      type: Date,
      required: [true, 'Giris tarihi gerekli']
    },

    checkOutDate: {
      type: Date,
      required: [true, 'Cikis tarihi gerekli']
    },

    actualCheckIn: {
      type: Date,
      default: null
    },

    actualCheckOut: {
      type: Date,
      default: null
    },

    nights: {
      type: Number,
      required: true,
      min: 1
    },

    // Guests
    guests: [guestSchema],

    adultsCount: {
      type: Number,
      required: true,
      min: 1,
      default: 1
    },

    childrenCount: {
      type: Number,
      default: 0,
      min: 0
    },

    // Meal plan
    mealPlan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MealPlan'
    },

    mealPlanCode: {
      type: String,
      trim: true
    },

    // Status
    status: {
      type: String,
      enum: Object.values(STAY_STATUS),
      default: STAY_STATUS.PENDING
    },

    // Pricing
    roomRate: {
      type: Number,
      required: true,
      min: 0
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },

    paidAmount: {
      type: Number,
      default: 0,
      min: 0
    },

    balance: {
      type: Number,
      default: 0
    },

    currency: {
      type: String,
      default: 'TRY'
    },

    paymentStatus: {
      type: String,
      enum: Object.values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PENDING
    },

    // Extras and charges
    extras: [
      {
        date: { type: Date, default: Date.now },
        description: { type: String, required: true },
        amount: { type: Number, required: true },
        quantity: { type: Number, default: 1 },
        category: {
          type: String,
          enum: [
            'minibar',
            'room_service',
            'laundry',
            'spa',
            'restaurant',
            'phone',
            'damage',
            'other'
          ],
          default: 'other'
        },
        // Multi-currency support
        currency: { type: String, default: 'TRY', uppercase: true },
        exchangeRate: { type: Number }, // Rate at time of charge
        amountInBaseCurrency: { type: Number }, // Amount in TRY for reporting
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
      }
    ],

    // Payments
    payments: [
      {
        date: { type: Date, default: Date.now },
        amount: { type: Number, required: true },
        method: {
          type: String,
          enum: ['cash', 'credit_card', 'debit_card', 'bank_transfer', 'online', 'other'],
          required: true
        },
        // Multi-currency support
        currency: { type: String, default: 'TRY', uppercase: true },
        exchangeRate: { type: Number }, // Rate at time of payment
        amountInBaseCurrency: { type: Number }, // Amount in TRY for reporting
        reference: { type: String },
        notes: { type: String },
        receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
      }
    ],

    // Special requests and notes
    specialRequests: {
      type: String,
      trim: true,
      maxlength: 1000
    },

    internalNotes: {
      type: String,
      trim: true,
      maxlength: 2000
    },

    // Check-in details
    checkedInBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },

    checkedOutBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },

    // Source
    source: {
      type: String,
      enum: ['booking', 'walk_in', 'phone', 'email', 'ota', 'corporate', 'other'],
      default: 'walk_in'
    },

    // Is walk-in?
    isWalkIn: {
      type: Boolean,
      default: false
    },

    // Room change history
    roomHistory: [
      {
        room: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
        fromDate: Date,
        toDate: Date,
        reason: String,
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        changedAt: { type: Date, default: Date.now }
      }
    ],

    // VIP status
    isVip: {
      type: Boolean,
      default: false
    },

    vipLevel: {
      type: Number,
      min: 1,
      max: 5
    }
  },
  {
    timestamps: true
  }
)

// Compound indexes
staySchema.index({ partner: 1, hotel: 1, stayNumber: 1 })
staySchema.index({ hotel: 1, status: 1 })
staySchema.index({ hotel: 1, checkInDate: 1 })
staySchema.index({ hotel: 1, checkOutDate: 1 })
staySchema.index({ room: 1, status: 1 })
staySchema.index({ booking: 1 })

// Virtual for main guest
staySchema.virtual('mainGuest').get(function () {
  return this.guests.find(g => g.isMainGuest) || this.guests[0]
})

// Virtual for guest display name
staySchema.virtual('guestName').get(function () {
  const main = this.mainGuest
  return main ? `${main.firstName} ${main.lastName}` : ''
})

// Virtual for extras total
staySchema.virtual('extrasTotal').get(function () {
  return this.extras.reduce((sum, e) => sum + e.amount * e.quantity, 0)
})

// Virtual for payments total
staySchema.virtual('paymentsTotal').get(function () {
  return this.payments.reduce((sum, p) => sum + p.amount, 0)
})

// Pre-save: Calculate balance
staySchema.pre('save', function (next) {
  const extrasTotal = this.extras.reduce((sum, e) => sum + e.amount * e.quantity, 0)
  const paymentsTotal = this.payments.reduce((sum, p) => sum + p.amount, 0)

  this.totalAmount = this.roomRate + extrasTotal
  this.paidAmount = paymentsTotal
  this.balance = this.totalAmount - this.paidAmount

  // Update payment status
  if (this.paidAmount >= this.totalAmount) {
    this.paymentStatus = PAYMENT_STATUS.PAID
  } else if (this.paidAmount > 0) {
    this.paymentStatus = PAYMENT_STATUS.PARTIAL
  } else {
    this.paymentStatus = PAYMENT_STATUS.PENDING
  }

  next()
})

// Pre-save: Generate stay number
staySchema.pre('save', async function (next) {
  if (this.isNew && !this.stayNumber) {
    const date = new Date()
    const year = date.getFullYear().toString().slice(-2)
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')

    // Get today's count
    const startOfDay = new Date(date.setHours(0, 0, 0, 0))
    const endOfDay = new Date(date.setHours(23, 59, 59, 999))

    const count = await this.constructor.countDocuments({
      hotel: this.hotel,
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    })

    const sequence = (count + 1).toString().padStart(4, '0')
    this.stayNumber = `STY${year}${month}${day}${sequence}`
  }
  next()
})

// Method: Add extra charge
staySchema.methods.addExtra = async function (extra, userId) {
  this.extras.push({
    ...extra,
    addedBy: userId
  })
  return this.save()
}

// Method: Add payment
staySchema.methods.addPayment = async function (payment, userId) {
  this.payments.push({
    ...payment,
    receivedBy: userId
  })
  return this.save()
}

// Method: Change room
staySchema.methods.changeRoom = async function (newRoomId, reason, userId) {
  const Room = mongoose.model('Room')

  // Add to history
  this.roomHistory.push({
    room: this.room,
    fromDate: this.actualCheckIn || this.checkInDate,
    toDate: new Date(),
    reason,
    changedBy: userId
  })

  // Update old room
  await Room.findByIdAndUpdate(this.room, {
    status: 'checkout',
    housekeepingStatus: 'dirty',
    currentBooking: null,
    currentGuests: []
  })

  // Update new room
  const newRoom = await Room.findByIdAndUpdate(
    newRoomId,
    {
      status: 'occupied',
      currentBooking: this.booking,
      currentGuests: this.guests.map(g => ({
        firstName: g.firstName,
        lastName: g.lastName,
        isMainGuest: g.isMainGuest
      })),
      checkInDate: new Date(),
      expectedCheckoutDate: this.checkOutDate
    },
    { new: true }
  )

  this.room = newRoomId
  this.roomType = newRoom.roomType

  return this.save()
}

// Method: Extend stay
staySchema.methods.extendStay = async function (newCheckOutDate, additionalAmount = 0) {
  const Room = mongoose.model('Room')

  const oldNights = this.nights
  const newNights = Math.ceil(
    (new Date(newCheckOutDate) - new Date(this.checkInDate)) / (1000 * 60 * 60 * 24)
  )

  this.checkOutDate = newCheckOutDate
  this.nights = newNights

  if (additionalAmount > 0) {
    this.roomRate += additionalAmount
  }

  // Update room expected checkout
  await Room.findByIdAndUpdate(this.room, {
    expectedCheckoutDate: newCheckOutDate
  })

  return this.save()
}

// Method: Check out
staySchema.methods.checkOut = async function (userId) {
  const Room = mongoose.model('Room')

  this.status = STAY_STATUS.CHECKED_OUT
  this.actualCheckOut = new Date()
  this.checkedOutBy = userId

  // Update room
  await Room.findByIdAndUpdate(this.room, {
    status: 'checkout',
    housekeepingStatus: 'dirty',
    housekeepingPriority: 'high',
    currentBooking: null,
    currentGuests: [],
    checkInDate: null,
    expectedCheckoutDate: null
  })

  return this.save()
}

// Static: Get active stays
staySchema.statics.getActiveStays = function (hotelId) {
  return this.find({
    hotel: hotelId,
    status: STAY_STATUS.CHECKED_IN
  })
    .populate('room', 'roomNumber floor')
    .populate('roomType', 'name code')
    .sort({ checkOutDate: 1 })
}

// Static: Get today's check-ins
staySchema.statics.getTodayCheckIns = function (hotelId) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  return this.find({
    hotel: hotelId,
    checkInDate: { $gte: today, $lt: tomorrow },
    status: { $in: [STAY_STATUS.CHECKED_IN] }
  })
    .populate('room', 'roomNumber floor')
    .populate('roomType', 'name code')
}

// Static: Get today's check-outs
staySchema.statics.getTodayCheckOuts = function (hotelId) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  return this.find({
    hotel: hotelId,
    checkOutDate: { $gte: today, $lt: tomorrow },
    status: STAY_STATUS.CHECKED_IN
  })
    .populate('room', 'roomNumber floor')
    .populate('roomType', 'name code')
}

// Static: Get expected arrivals (from bookings - not yet checked in)
staySchema.statics.getExpectedArrivals = async function (hotelId) {
  const Booking = mongoose.model('Booking')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  // Get bookings that haven't been checked in yet
  const checkedInBookings = await this.find({
    hotel: hotelId,
    booking: { $ne: null }
  }).distinct('booking')

  return Booking.find({
    hotel: hotelId,
    checkIn: { $gte: today, $lt: tomorrow },
    status: { $in: ['confirmed', 'pending'] },
    _id: { $nin: checkedInBookings }
  })
}

// Static: Get front desk statistics
staySchema.statics.getFrontDeskStats = async function (hotelId) {
  const Room = mongoose.model('Room')
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const [activeStays, todayCheckIns, todayCheckOuts, roomStats] = await Promise.all([
    this.countDocuments({ hotel: hotelId, status: STAY_STATUS.CHECKED_IN }),
    this.countDocuments({
      hotel: hotelId,
      actualCheckIn: { $gte: today, $lt: tomorrow }
    }),
    this.countDocuments({
      hotel: hotelId,
      checkOutDate: { $gte: today, $lt: tomorrow },
      status: STAY_STATUS.CHECKED_IN
    }),
    Room.getStatistics(hotelId)
  ])

  return {
    activeStays,
    todayCheckIns,
    pendingCheckOuts: todayCheckOuts,
    ...roomStats
  }
}

const Stay = mongoose.model('Stay', staySchema)

export default Stay
