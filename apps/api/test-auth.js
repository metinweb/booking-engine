/**
 * Test script for PMS dual-auth middleware
 * Run with: node test-auth.js
 */

import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'
import config from './src/config/index.js'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/booking-engine'

async function main() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Connected to MongoDB')

    // Get collections
    const User = mongoose.connection.collection('users')
    const Hotel = mongoose.connection.collection('hotels')
    const PmsUser = mongoose.connection.collection('pmsusers')

    // Find a platform admin
    const admin = await User.findOne({ role: 'admin', accountType: 'platform' })
    console.log('\n📌 Platform Admin:', admin?.email)

    // Find a hotel
    const hotel = await Hotel.findOne({ status: 'active' })
    console.log('📌 Hotel:', hotel?.name, '| ID:', hotel?._id)

    if (admin && hotel) {
      // Generate regular token for admin
      const adminToken = jwt.sign(
        {
          userId: admin._id,
          email: admin.email,
          role: admin.role,
          accountType: admin.accountType
        },
        config.jwt.secret,
        { expiresIn: '1h' }
      )
      console.log('\n🔑 Admin Token (for dual-auth test):')
      console.log(adminToken)

      // Test the token
      console.log('\n\n=== TESTING PMS ENDPOINTS WITH ADMIN TOKEN ===\n')

      const testUrl = `http://localhost:4000/api/pms/hotels/${hotel._id}/rooms`
      console.log(`Testing: GET ${testUrl}`)
      console.log(`\nRun this curl command:`)
      console.log(`curl -s -H "Authorization: Bearer ${adminToken}" "${testUrl}"`)
    }

    // Check for PMS users
    const pmsUser = await PmsUser.findOne({ isActive: true })
    if (pmsUser) {
      console.log('\n📌 PMS User found:', pmsUser.email)

      // Find hotel assignment
      if (pmsUser.assignedHotels?.length > 0) {
        const assignment = pmsUser.assignedHotels[0]
        const pmsToken = jwt.sign(
          {
            type: 'pms',
            pmsUserId: pmsUser._id,
            hotelId: assignment.hotel,
            partnerId: pmsUser.partner,
            role: assignment.role
          },
          config.jwt.secret,
          { expiresIn: '8h' }
        )
        console.log('\n🔑 PMS Token:')
        console.log(pmsToken)
      }
    } else {
      console.log('\n⚠️  No PMS users found in database')
    }

    await mongoose.disconnect()
    console.log('\n✅ Test complete')

  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

main()
