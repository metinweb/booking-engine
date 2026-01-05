/**
 * Debug script to check commission settings
 * Run: node apps/api/src/scripts/debug-commission.js
 */

import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.join(__dirname, '../../.env') })

// Import models
import '../modules/hotel/hotel.model.js'
import '../modules/planning/roomType.model.js'
import '../modules/planning/mealPlan.model.js'
import Market from '../modules/planning/market.model.js'
import Season from '../modules/planning/season.model.js'
import { getEffectiveSalesSettings } from '../services/pricingService.js'

async function debug() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/booking-engine')
    console.log('Connected to MongoDB\n')

    // Get all markets
    const markets = await Market.find({ status: 'active' }).lean()

    console.log('='.repeat(60))
    console.log('MARKET SETTINGS')
    console.log('='.repeat(60))

    for (const market of markets) {
      console.log(`\nMarket: ${market.code} (${market.name?.tr || market.name?.en})`)
      console.log(`  workingMode: ${market.workingMode}`)
      console.log(`  commissionRate: ${market.commissionRate}`)
      console.log(`  agencyCommission: ${market.agencyCommission}`)
      console.log(`  markup.b2c: ${market.markup?.b2c}`)
      console.log(`  markup.b2b: ${market.markup?.b2b}`)
    }

    // Get all seasons
    const seasons = await Season.find({ status: 'active' }).lean()

    console.log('\n' + '='.repeat(60))
    console.log('SEASON SETTINGS')
    console.log('='.repeat(60))

    for (const season of seasons) {
      console.log(`\nSeason: ${season.code} (${season.name?.tr || season.name?.en})`)
      console.log(`  Market: ${season.market}`)
      console.log(`  salesSettingsOverride:`)
      console.log(`    inheritFromMarket: ${season.salesSettingsOverride?.inheritFromMarket}`)
      console.log(`    workingMode: ${season.salesSettingsOverride?.workingMode}`)
      console.log(`    commissionRate: ${season.salesSettingsOverride?.commissionRate}`)
      console.log(`    agencyCommission: ${season.salesSettingsOverride?.agencyCommission}`)
      console.log(`    markup.b2c: ${season.salesSettingsOverride?.markup?.b2c}`)
      console.log(`    markup.b2b: ${season.salesSettingsOverride?.markup?.b2b}`)
    }

    // Test effective settings
    console.log('\n' + '='.repeat(60))
    console.log('EFFECTIVE SETTINGS (getEffectiveSalesSettings)')
    console.log('='.repeat(60))

    for (const market of markets) {
      // Find season for this market
      const marketSeasons = seasons.filter(s => s.market?.toString() === market._id.toString())

      console.log(`\n--- Market: ${market.code} ---`)

      // Without season
      const settingsNoSeason = getEffectiveSalesSettings(market, null)
      console.log('\n  Without Season:')
      console.log(`    workingMode: ${settingsNoSeason.workingMode}`)
      console.log(`    commissionRate: ${settingsNoSeason.commissionRate}`)
      console.log(`    agencyCommission: ${settingsNoSeason.agencyCommission}`)
      console.log(`    markup: b2c=${settingsNoSeason.markup?.b2c}, b2b=${settingsNoSeason.markup?.b2b}`)

      // With each season
      for (const season of marketSeasons) {
        const settingsWithSeason = getEffectiveSalesSettings(market, season)
        console.log(`\n  With Season ${season.code}:`)
        console.log(`    inheritFromMarket: ${season.salesSettingsOverride?.inheritFromMarket}`)
        console.log(`    workingMode: ${settingsWithSeason.workingMode}`)
        console.log(`    commissionRate: ${settingsWithSeason.commissionRate}`)
        console.log(`    agencyCommission: ${settingsWithSeason.agencyCommission}`)
        console.log(`    markup: b2c=${settingsWithSeason.markup?.b2c}, b2b=${settingsWithSeason.markup?.b2b}`)
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log('DEBUG COMPLETE')
    console.log('='.repeat(60))

  } catch (error) {
    console.error('Error:', error)
  } finally {
    await mongoose.disconnect()
    console.log('\nDisconnected from MongoDB')
  }
}

debug()
