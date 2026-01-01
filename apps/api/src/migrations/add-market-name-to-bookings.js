/**
 * Migration: Add marketName to existing bookings
 *
 * This migration populates the marketName field for existing bookings
 * that have a market reference but no marketName.
 *
 * Run: node src/migrations/add-market-name-to-bookings.js
 */

import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/booking-engine'

// Define schemas inline to avoid circular dependencies
const BookingSchema = new mongoose.Schema({}, { strict: false })
const MarketSchema = new mongoose.Schema({}, { strict: false })

async function migrate() {
	console.log('🔄 Starting migration: Add marketName to bookings')
	console.log('📡 Connecting to:', MONGODB_URI)

	await mongoose.connect(MONGODB_URI)
	console.log('✅ Connected to MongoDB')

	const Booking = mongoose.model('Booking', BookingSchema)
	const Market = mongoose.model('Market', MarketSchema)

	// Find all bookings without marketName but with market reference
	const bookingsWithoutMarketName = await Booking.find({
		market: { $exists: true, $ne: null },
		$or: [
			{ marketName: { $exists: false } },
			{ marketName: null }
		]
	}).lean()

	console.log(`📊 Found ${bookingsWithoutMarketName.length} bookings without marketName`)

	if (bookingsWithoutMarketName.length === 0) {
		console.log('✅ No bookings need fixing')
		await mongoose.disconnect()
		return
	}

	// Group by market to minimize queries
	const marketIds = [...new Set(bookingsWithoutMarketName.map(b => b.market?.toString()))]
	const markets = await Market.find({ _id: { $in: marketIds } }).lean()
	const marketMap = new Map(markets.map(m => [m._id.toString(), m]))

	let fixed = 0
	let skipped = 0

	for (const booking of bookingsWithoutMarketName) {
		const marketId = booking.market?.toString()
		const market = marketMap.get(marketId)

		if (!market) {
			console.log(`⚠️ Market not found for booking ${booking.bookingNumber}`)
			skipped++
			continue
		}

		await Booking.updateOne(
			{ _id: booking._id },
			{
				$set: {
					marketName: market.name
				}
			}
		)

		console.log(`   ✅ Booking ${booking.bookingNumber}: added marketName "${market.name?.tr || market.name?.en || market.code}"`)
		fixed++
	}

	console.log('\n📊 Migration Summary:')
	console.log(`   Fixed: ${fixed} bookings`)
	console.log(`   Skipped: ${skipped} bookings`)

	await mongoose.disconnect()
	console.log('\n✅ Migration completed')
}

migrate().catch(err => {
	console.error('❌ Migration failed:', err)
	process.exit(1)
})
