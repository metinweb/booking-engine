/**
 * Migration: Add season info to existing bookings
 *
 * This migration finds all bookings without a season and assigns
 * the primary season based on their check-in date and market.
 *
 * Run: node src/migrations/add-season-to-bookings.js
 */

import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/booking-engine'

// Define schemas inline to avoid circular dependencies
const BookingSchema = new mongoose.Schema({}, { strict: false })
const SeasonSchema = new mongoose.Schema({}, { strict: false })

async function migrate() {
	console.log('🔄 Starting migration: Add season to bookings')
	console.log('📡 Connecting to:', MONGODB_URI)

	await mongoose.connect(MONGODB_URI)
	console.log('✅ Connected to MongoDB')

	const Booking = mongoose.model('Booking', BookingSchema)
	const Season = mongoose.model('Season', SeasonSchema)

	// Find all bookings without season
	const bookingsWithoutSeason = await Booking.find({
		$or: [
			{ season: { $exists: false } },
			{ season: null }
		],
		checkIn: { $exists: true, $ne: null }
	}).lean()

	console.log(`📊 Found ${bookingsWithoutSeason.length} bookings without season`)

	if (bookingsWithoutSeason.length === 0) {
		console.log('✅ No bookings need fixing')
		await mongoose.disconnect()
		return
	}

	let fixed = 0
	let skipped = 0

	for (const booking of bookingsWithoutSeason) {
		const hotelId = booking.hotel?.toString()
		const marketId = booking.market?.toString()
		const checkInDate = booking.checkIn

		if (!hotelId || !marketId || !checkInDate) {
			console.log(`⚠️ Booking ${booking.bookingNumber} missing hotel/market/checkIn, skipping`)
			skipped++
			continue
		}

		// Find season for check-in date
		const checkIn = new Date(checkInDate)
		checkIn.setHours(0, 0, 0, 0)

		// First try to find market-specific season with dateRanges
		let season = await Season.findOne({
			hotel: new mongoose.Types.ObjectId(hotelId),
			market: new mongoose.Types.ObjectId(marketId),
			status: 'active',
			dateRanges: {
				$elemMatch: {
					startDate: { $lte: checkIn },
					endDate: { $gte: checkIn }
				}
			}
		}).lean()

		// If not found, try hotel-wide season with dateRanges (no market)
		if (!season) {
			season = await Season.findOne({
				hotel: new mongoose.Types.ObjectId(hotelId),
				$or: [
					{ market: { $exists: false } },
					{ market: null }
				],
				status: 'active',
				dateRanges: {
					$elemMatch: {
						startDate: { $lte: checkIn },
						endDate: { $gte: checkIn }
					}
				}
			}).lean()
		}

		// If still not found, try with direct startDate/endDate fields (legacy format)
		if (!season) {
			season = await Season.findOne({
				hotel: new mongoose.Types.ObjectId(hotelId),
				$or: [
					{ market: { $exists: false } },
					{ market: null }
				],
				startDate: { $lte: checkIn },
				endDate: { $gte: checkIn },
				status: 'active'
			}).lean()
		}

		if (!season) {
			console.log(`⚠️ No season found for booking ${booking.bookingNumber} (hotel: ${hotelId}, market: ${marketId}, date: ${checkIn.toISOString().split('T')[0]})`)
			skipped++
			continue
		}

		// Update booking with season info
		await Booking.updateOne(
			{ _id: booking._id },
			{
				$set: {
					season: season._id,
					seasonCode: season.code,
					seasonName: season.name
				}
			}
		)

		console.log(`   ✅ Booking ${booking.bookingNumber}: assigned season ${season.code}`)
		fixed++
	}

	console.log('\n📊 Migration Summary:')
	console.log(`   Fixed: ${fixed} bookings`)
	console.log(`   Skipped: ${skipped} bookings (no season available)`)

	await mongoose.disconnect()
	console.log('\n✅ Migration completed')
}

migrate().catch(err => {
	console.error('❌ Migration failed:', err)
	process.exit(1)
})
