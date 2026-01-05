/**
 * Migration Script: Create Pending Stays from Confirmed Bookings
 *
 * This script creates pending Stay records for confirmed bookings that don't have a Stay yet.
 * This is needed to integrate the Booking module with the PMS module.
 *
 * What it does:
 * 1. Find all confirmed bookings with checkIn date today or in the future
 * 2. Check if a Stay already exists for each booking
 * 3. If not, create a pending Stay
 *
 * Run with: node src/scripts/migrateBookingsToStays.js
 */

import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Booking from '../modules/booking/booking.model.js'
import Stay, { STAY_STATUS, PAYMENT_STATUS } from '../modules/pms/stay.model.js'
// Import RoomType to register the model for populate
import '../modules/planning/roomType.model.js'

dotenv.config()

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/booking-engine'

async function migrate() {
  console.log('🔄 Starting Booking to Stay migration...')
  console.log('📦 Connecting to MongoDB:', MONGODB_URI)

  try {
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Connected to MongoDB')

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Find all confirmed bookings with checkIn today or in the future that don't have a Stay
    const existingStayBookingIds = await Stay.find({
      booking: { $ne: null }
    }).distinct('booking')

    console.log(`📊 Found ${existingStayBookingIds.length} bookings that already have Stays`)

    const bookingsToMigrate = await Booking.find({
      status: { $in: ['confirmed', 'pending'] },
      checkIn: { $gte: today },
      _id: { $nin: existingStayBookingIds }
    }).populate('rooms.roomType')

    console.log(`📊 Found ${bookingsToMigrate.length} bookings to migrate`)

    if (bookingsToMigrate.length === 0) {
      console.log('✅ No bookings to migrate. Migration complete!')
      await mongoose.disconnect()
      return
    }

    let migrated = 0
    let skipped = 0
    let errors = 0

    for (const booking of bookingsToMigrate) {
      try {
        // Get room info from booking
        const roomInfo = booking.rooms?.[0]
        if (!roomInfo || !roomInfo.roomType) {
          console.log(`⏭️ Skipping booking ${booking.bookingNumber} - no room type`)
          skipped++
          continue
        }

        // Calculate nights
        const checkIn = new Date(booking.checkIn)
        const checkOut = new Date(booking.checkOut)
        const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24))

        // Build guests array from booking
        const guests = []
        if (booking.leadGuest) {
          guests.push({
            firstName: booking.leadGuest.firstName,
            lastName: booking.leadGuest.lastName,
            email: booking.contact?.email,
            phone: booking.contact?.phone,
            isMainGuest: true
          })
        } else if (booking.customerName) {
          const nameParts = booking.customerName.split(' ')
          guests.push({
            firstName: nameParts[0] || 'Misafir',
            lastName: nameParts.slice(1).join(' ') || '',
            email: booking.customerEmail,
            phone: booking.customerPhone,
            isMainGuest: true
          })
        }

        // Add additional guests
        if (booking.guests && booking.guests.length > 0) {
          booking.guests.forEach((g, index) => {
            if (index > 0) {
              guests.push({
                firstName: g.firstName,
                lastName: g.lastName,
                type: g.type || 'adult',
                isMainGuest: false
              })
            }
          })
        }

        // Create pending Stay
        const stay = await Stay.create({
          partner: booking.partner,
          hotel: booking.hotel,
          booking: booking._id,
          bookingNumber: booking.bookingNumber,
          roomType: roomInfo.roomType._id || roomInfo.roomType,
          room: null, // Will be assigned at check-in
          checkInDate: checkIn,
          checkOutDate: checkOut,
          nights,
          guests:
            guests.length > 0
              ? guests
              : [
                  {
                    firstName: 'Misafir',
                    lastName: '',
                    isMainGuest: true
                  }
                ],
          adultsCount: booking.adults || 1,
          childrenCount: booking.children || 0,
          mealPlan: booking.mealPlan,
          mealPlanCode: booking.mealPlanCode,
          roomRate: booking.totalAmount || 0,
          totalAmount: booking.totalAmount || 0,
          paidAmount: booking.paidAmount || 0,
          currency: booking.currency || 'TRY',
          specialRequests: booking.specialRequests,
          source: 'booking',
          isWalkIn: false,
          status: STAY_STATUS.PENDING,
          paymentStatus:
            booking.paidAmount >= booking.totalAmount
              ? PAYMENT_STATUS.PAID
              : booking.paidAmount > 0
                ? PAYMENT_STATUS.PARTIAL
                : PAYMENT_STATUS.PENDING
        })

        console.log(`✅ Created Stay ${stay.stayNumber} for booking ${booking.bookingNumber}`)
        migrated++
      } catch (error) {
        console.error(`❌ Error migrating booking ${booking.bookingNumber}:`, error.message)
        errors++
      }
    }

    console.log('\n📊 Migration Summary:')
    console.log(`   ✅ Migrated: ${migrated}`)
    console.log(`   ⏭️ Skipped: ${skipped}`)
    console.log(`   ❌ Errors: ${errors}`)
    console.log('\n✅ Migration complete!')

    await mongoose.disconnect()
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

migrate()
