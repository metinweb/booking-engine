/**
 * Migration: Fix bookings without market field
 *
 * This migration finds all bookings without a market and assigns
 * the default market for their hotel.
 *
 * Run: node src/migrations/fix-bookings-without-market.js
 */

import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/booking-engine'

// Define schemas inline to avoid circular dependencies
const BookingSchema = new mongoose.Schema({}, { strict: false })
const MarketSchema = new mongoose.Schema({}, { strict: false })

async function migrate() {
  console.log('🔄 Starting migration: Fix bookings without market')
  console.log('📡 Connecting to:', MONGODB_URI)

  await mongoose.connect(MONGODB_URI)
  console.log('✅ Connected to MongoDB')

  const Booking = mongoose.model('Booking', BookingSchema)
  const Market = mongoose.model('Market', MarketSchema)

  // Find all bookings without market
  const bookingsWithoutMarket = await Booking.find({
    $or: [{ market: { $exists: false } }, { market: null }]
  }).lean()

  console.log(`📊 Found ${bookingsWithoutMarket.length} bookings without market`)

  if (bookingsWithoutMarket.length === 0) {
    console.log('✅ No bookings need fixing')
    await mongoose.disconnect()
    return
  }

  // Group bookings by hotel
  const bookingsByHotel = {}
  for (const booking of bookingsWithoutMarket) {
    const hotelId = booking.hotel?.toString()
    if (!hotelId) {
      console.log(`⚠️ Booking ${booking.bookingNumber} has no hotel, skipping`)
      continue
    }
    if (!bookingsByHotel[hotelId]) {
      bookingsByHotel[hotelId] = []
    }
    bookingsByHotel[hotelId].push(booking)
  }

  // Process each hotel's bookings
  let fixed = 0
  let skipped = 0

  for (const [hotelId, bookings] of Object.entries(bookingsByHotel)) {
    // Find default market for this hotel
    let market = await Market.findOne({
      hotel: new mongoose.Types.ObjectId(hotelId),
      isDefault: true,
      status: 'active'
    }).lean()

    // If no default, get any active market
    if (!market) {
      market = await Market.findOne({
        hotel: new mongoose.Types.ObjectId(hotelId),
        status: 'active'
      }).lean()
    }

    if (!market) {
      console.log(`⚠️ No market found for hotel ${hotelId}, skipping ${bookings.length} bookings`)
      skipped += bookings.length
      continue
    }

    console.log(`🏨 Hotel ${hotelId}: Using market ${market.code} (${market._id})`)

    // Update all bookings for this hotel
    const result = await Booking.updateMany(
      {
        _id: { $in: bookings.map(b => b._id) }
      },
      {
        $set: {
          market: market._id,
          marketCode: market.code
        }
      }
    )

    console.log(`   ✅ Updated ${result.modifiedCount} bookings`)
    fixed += result.modifiedCount
  }

  console.log('\n📊 Migration Summary:')
  console.log(`   Fixed: ${fixed} bookings`)
  console.log(`   Skipped: ${skipped} bookings (no market available for hotel)`)

  await mongoose.disconnect()
  console.log('\n✅ Migration completed')
}

migrate().catch(err => {
  console.error('❌ Migration failed:', err)
  process.exit(1)
})
