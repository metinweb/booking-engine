/**
 * Migration: Reduce Admin Languages
 *
 * This migration reduces Market and Season name fields from 20 languages to 2 (tr, en).
 * These are admin-only fields, so only Turkish and English are needed.
 *
 * B2C fields (Hotel, RoomType, MealPlan, etc.) keep all 20 languages.
 *
 * Usage: node src/migrations/reduce-admin-languages.js
 */

import mongoose from 'mongoose'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '../../.env') })

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/booking-engine'

async function migrate() {
	console.log('Starting migration: Reduce Admin Languages')
	console.log('MongoDB URI:', MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'))

	try {
		await mongoose.connect(MONGODB_URI)
		console.log('Connected to MongoDB')

		const db = mongoose.connection.db

		// Migrate Markets collection
		console.log('\n--- Migrating Markets ---')
		const marketsCollection = db.collection('markets')
		const marketsCount = await marketsCollection.countDocuments()
		console.log(`Found ${marketsCount} markets`)

		if (marketsCount > 0) {
			// Remove extra language fields, keep only tr and en
			const extraLangs = ['ru', 'el', 'de', 'es', 'it', 'fr', 'ro', 'bg', 'pt', 'da', 'zh', 'ar', 'fa', 'he', 'sq', 'uk', 'pl', 'az']
			const unsetFields = {}
			extraLangs.forEach(lang => { unsetFields[`name.${lang}`] = '' })

			const marketsResult = await marketsCollection.updateMany(
				{},
				{ $unset: unsetFields }
			)
			console.log(`Updated ${marketsResult.modifiedCount} markets`)
		}

		// Migrate Seasons collection
		console.log('\n--- Migrating Seasons ---')
		const seasonsCollection = db.collection('seasons')
		const seasonsCount = await seasonsCollection.countDocuments()
		console.log(`Found ${seasonsCount} seasons`)

		if (seasonsCount > 0) {
			// Remove extra language fields, keep only tr and en
			const extraLangs = ['ru', 'el', 'de', 'es', 'it', 'fr', 'ro', 'bg', 'pt', 'da', 'zh', 'ar', 'fa', 'he', 'sq', 'uk', 'pl', 'az']
			const unsetFields = {}
			extraLangs.forEach(lang => { unsetFields[`name.${lang}`] = '' })

			const seasonsResult = await seasonsCollection.updateMany(
				{},
				{ $unset: unsetFields }
			)
			console.log(`Updated ${seasonsResult.modifiedCount} seasons`)
		}

		console.log('\n✓ Migration completed successfully!')

	} catch (error) {
		console.error('Migration failed:', error)
		process.exit(1)
	} finally {
		await mongoose.disconnect()
		console.log('Disconnected from MongoDB')
	}
}

migrate()
