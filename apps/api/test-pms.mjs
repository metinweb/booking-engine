/**
 * PMS Module Test Script
 * Tests all PMS endpoints and adds test data
 */

import mongoose from 'mongoose'

const MONGODB_URI = 'mongodb://localhost:27017/booking-engine'
const API_BASE = 'http://localhost:4000/api'
const HOTEL_ID = '69509e72ad12850a0cc8fc99'
const PARTNER_ID = '6949caf3510a141c5b841313'

let TOKEN = ''

// Helper function for API calls
async function api(method, endpoint, data = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TOKEN}`
    }
  }
  if (data) {
    options.body = JSON.stringify(data)
  }

  const response = await fetch(`${API_BASE}${endpoint}`, options)
  const result = await response.json()
  return result
}

// Login function
async function login() {
  console.log('🔐 Logging in as partner...')
  const result = await api('POST', '/auth/login', {
    email: 'newpartner@test.com',
    password: 'test123',
    accountType: 'partner',
    accountId: PARTNER_ID
  })

  if (result.success) {
    TOKEN = result.data.accessToken
    console.log('✅ Login successful')
    return true
  } else {
    console.log('❌ Login failed:', result.message)
    return false
  }
}

// Test Room Types
async function testRoomTypes() {
  console.log('\n📦 Testing Room Types...')

  // Get existing room types
  const existing = await api('GET', `/pms/hotels/${HOTEL_ID}/room-types`)
  console.log('Existing room types:', existing.success ? existing.data?.length || 0 : 'Error: ' + existing.message)

  if (!existing.success) {
    console.log('❌ Room Types endpoint error:', existing.message)
    return []
  }

  return existing.data || []
}

// Test Rooms
async function testRooms(roomTypes) {
  console.log('\n🚪 Testing Rooms...')

  // Get existing rooms
  const existing = await api('GET', `/pms/hotels/${HOTEL_ID}/rooms`)
  console.log('Existing rooms:', existing.success ? existing.data?.length || 0 : 'Error: ' + existing.message)

  if (!existing.success) {
    console.log('❌ Rooms endpoint error:', existing.message)
    return []
  }

  // Add 10 rooms if not enough
  const existingRooms = existing.data || []
  if (existingRooms.length < 10 && roomTypes.length > 0) {
    console.log('Adding test rooms...')

    const floors = [1, 2, 3]
    const roomNumbers = ['101', '102', '103', '104', '201', '202', '203', '204', '301', '302']

    for (let i = 0; i < 10; i++) {
      const roomType = roomTypes[i % roomTypes.length]
      const floor = floors[Math.floor(i / 4)]
      const roomNumber = roomNumbers[i]

      // Check if room already exists
      if (existingRooms.find(r => r.roomNumber === roomNumber)) {
        continue
      }

      const result = await api('POST', `/pms/hotels/${HOTEL_ID}/rooms`, {
        roomNumber,
        floor,
        roomType: roomType._id,
        status: 'available',
        features: ['wifi', 'tv', 'minibar'],
        maxOccupancy: roomType.maxOccupancy || 2,
        bedType: 'double'
      })

      if (result.success) {
        console.log(`✅ Created room ${roomNumber}`)
      } else {
        console.log(`❌ Failed to create room ${roomNumber}: ${result.message}`)
      }
    }
  }

  // Get updated rooms
  const updated = await api('GET', `/pms/hotels/${HOTEL_ID}/rooms`)
  return updated.data || []
}

// Test Guests
async function testGuests() {
  console.log('\n👥 Testing Guests...')

  // Get existing guests
  const existing = await api('GET', `/pms/hotels/${HOTEL_ID}/guests`)
  console.log('Existing guests:', existing.success ? existing.data?.length || 0 : 'Error: ' + existing.message)

  if (!existing.success) {
    console.log('❌ Guests endpoint error:', existing.message)
    return []
  }

  // Add 10 guests if not enough
  const existingGuests = existing.data || []
  if (existingGuests.length < 10) {
    console.log('Adding test guests...')

    const testGuests = [
      { firstName: 'Ahmet', lastName: 'Yılmaz', email: 'ahmet@example.com', phone: '+905551234567', nationality: 'TR', idType: 'tc_kimlik', idNumber: '12345678901' },
      { firstName: 'Mehmet', lastName: 'Öztürk', email: 'mehmet@example.com', phone: '+905551234568', nationality: 'TR', idType: 'tc_kimlik', idNumber: '12345678902' },
      { firstName: 'John', lastName: 'Smith', email: 'john@example.com', phone: '+14151234567', nationality: 'US', idType: 'passport', idNumber: 'AB1234567' },
      { firstName: 'Maria', lastName: 'Garcia', email: 'maria@example.com', phone: '+34612345678', nationality: 'ES', idType: 'passport', idNumber: 'CD2345678' },
      { firstName: 'Hans', lastName: 'Mueller', email: 'hans@example.com', phone: '+49151234567', nationality: 'DE', idType: 'passport', idNumber: 'EF3456789' },
      { firstName: 'Fatma', lastName: 'Demir', email: 'fatma@example.com', phone: '+905551234569', nationality: 'TR', idType: 'tc_kimlik', idNumber: '12345678903' },
      { firstName: 'Ali', lastName: 'Kaya', email: 'ali@example.com', phone: '+905551234570', nationality: 'TR', idType: 'tc_kimlik', idNumber: '12345678904' },
      { firstName: 'Emma', lastName: 'Johnson', email: 'emma@example.com', phone: '+442071234567', nationality: 'GB', idType: 'passport', idNumber: 'GH4567890' },
      { firstName: 'Pierre', lastName: 'Dupont', email: 'pierre@example.com', phone: '+33612345678', nationality: 'FR', idType: 'passport', idNumber: 'IJ5678901' },
      { firstName: 'Zeynep', lastName: 'Arslan', email: 'zeynep@example.com', phone: '+905551234571', nationality: 'TR', idType: 'tc_kimlik', idNumber: '12345678905' }
    ]

    for (const guest of testGuests) {
      // Check if guest already exists
      if (existingGuests.find(g => g.email === guest.email)) {
        continue
      }

      const result = await api('POST', `/pms/hotels/${HOTEL_ID}/guests`, guest)

      if (result.success) {
        console.log(`✅ Created guest ${guest.firstName} ${guest.lastName}`)
      } else {
        console.log(`❌ Failed to create guest ${guest.firstName}: ${result.message}`)
      }
    }
  }

  // Get updated guests
  const updated = await api('GET', `/pms/hotels/${HOTEL_ID}/guests`)
  return updated.data || []
}

// Test Reservations/Stays
async function testReservations(rooms, guests) {
  console.log('\n📅 Testing Reservations...')

  // Get existing reservations
  const existing = await api('GET', `/pms/hotels/${HOTEL_ID}/stays`)
  console.log('Existing reservations:', existing.success ? existing.data?.length || 0 : 'Error: ' + existing.message)

  if (!existing.success) {
    console.log('❌ Reservations endpoint error:', existing.message)
    return []
  }

  // Add reservations if not enough
  const existingReservations = existing.data || []
  if (existingReservations.length < 10 && rooms.length > 0 && guests.length > 0) {
    console.log('Adding test reservations...')

    const today = new Date()

    for (let i = 0; i < 10; i++) {
      const room = rooms[i % rooms.length]
      const guest = guests[i % guests.length]

      const checkIn = new Date(today)
      checkIn.setDate(checkIn.getDate() + i)

      const checkOut = new Date(checkIn)
      checkOut.setDate(checkOut.getDate() + 2 + (i % 3))

      const result = await api('POST', `/pms/hotels/${HOTEL_ID}/stays`, {
        room: room._id,
        guests: [{
          firstName: guest.firstName,
          lastName: guest.lastName,
          email: guest.email,
          phone: guest.phone,
          nationality: guest.nationality,
          idType: guest.idType,
          idNumber: guest.idNumber,
          isPrimary: true
        }],
        checkInDate: checkIn.toISOString(),
        checkOutDate: checkOut.toISOString(),
        adults: 2,
        children: i % 3,
        status: i < 3 ? 'checked_in' : 'pending',
        source: ['direct', 'booking.com', 'expedia', 'phone'][i % 4],
        rateType: 'standard',
        roomRate: 1500 + (i * 100),
        currency: 'TRY',
        paymentStatus: i % 2 === 0 ? 'paid' : 'pending',
        notes: `Test reservation ${i + 1}`
      })

      if (result.success) {
        console.log(`✅ Created reservation for ${guest.firstName} ${guest.lastName}`)
      } else {
        console.log(`❌ Failed to create reservation: ${result.message}`)
      }
    }
  }

  // Get updated reservations
  const updated = await api('GET', `/pms/hotels/${HOTEL_ID}/stays`)
  return updated.data || []
}

// Test Front Desk
async function testFrontDesk() {
  console.log('\n🏨 Testing Front Desk...')

  // Get today's arrivals
  const arrivals = await api('GET', `/pms/hotels/${HOTEL_ID}/front-desk/arrivals`)
  console.log('Today arrivals:', arrivals.success ? arrivals.data?.length || 0 : 'Error: ' + arrivals.message)

  // Get today's departures
  const departures = await api('GET', `/pms/hotels/${HOTEL_ID}/front-desk/departures`)
  console.log('Today departures:', departures.success ? departures.data?.length || 0 : 'Error: ' + departures.message)

  // Get in-house guests
  const inHouse = await api('GET', `/pms/hotels/${HOTEL_ID}/front-desk/in-house`)
  console.log('In-house guests:', inHouse.success ? inHouse.data?.length || 0 : 'Error: ' + inHouse.message)

  return { arrivals, departures, inHouse }
}

// Test Housekeeping
async function testHousekeeping() {
  console.log('\n🧹 Testing Housekeeping...')

  // Get housekeeping status
  const status = await api('GET', `/pms/hotels/${HOTEL_ID}/housekeeping`)
  console.log('Housekeeping rooms:', status.success ? status.data?.length || 0 : 'Error: ' + status.message)

  return status
}

// Test Cashier
async function testCashier() {
  console.log('\n💰 Testing Cashier...')

  // Get active shift
  const activeShift = await api('GET', `/pms/hotels/${HOTEL_ID}/cashier/shifts/active`)
  console.log('Active shift:', activeShift.success ? (activeShift.data ? 'Yes' : 'No') : 'Error: ' + activeShift.message)

  // Get currencies
  const currencies = await api('GET', `/pms/hotels/${HOTEL_ID}/cashier/currencies`)
  console.log('Currencies:', currencies.success ? currencies.data?.availableCurrencies : 'Error: ' + currencies.message)

  // If no active shift, try to open one
  if (activeShift.success && !activeShift.data) {
    console.log('Opening test shift...')
    const openShift = await api('POST', `/pms/hotels/${HOTEL_ID}/cashier/shifts/open`, {
      openingCash: 5000,
      registerId: 'MAIN',
      activeCurrencies: ['TRY', 'USD', 'EUR'],
      openingBalances: [
        { currency: 'TRY', cash: 5000, card: 0, other: 0 },
        { currency: 'USD', cash: 500, card: 0, other: 0 },
        { currency: 'EUR', cash: 300, card: 0, other: 0 }
      ]
    })
    console.log('Open shift result:', openShift.success ? '✅ Shift opened' : '❌ ' + openShift.message)
  }

  // Get transactions
  const transactions = await api('GET', `/pms/hotels/${HOTEL_ID}/cashier/transactions`)
  console.log('Transactions:', transactions.success ? transactions.data?.length || 0 : 'Error: ' + transactions.message)

  return { activeShift, currencies, transactions }
}

// Test Settings
async function testSettings() {
  console.log('\n⚙️ Testing Settings...')

  // Get settings
  const settings = await api('GET', `/pms/hotels/${HOTEL_ID}/settings`)
  console.log('Settings:', settings.success ? '✅ Loaded' : 'Error: ' + settings.message)

  return settings
}

// Test KBS
async function testKBS() {
  console.log('\n📋 Testing KBS...')

  // Get KBS pending
  const pending = await api('GET', `/pms/hotels/${HOTEL_ID}/kbs/pending`)
  console.log('KBS pending:', pending.success ? pending.data?.length || 0 : 'Error: ' + pending.message)

  return pending
}

// Test Reports
async function testReports() {
  console.log('\n📊 Testing Reports...')

  // Get occupancy report
  const occupancy = await api('GET', `/pms/hotels/${HOTEL_ID}/reports/occupancy`)
  console.log('Occupancy report:', occupancy.success ? '✅ Loaded' : 'Error: ' + occupancy.message)

  // Get revenue report
  const revenue = await api('GET', `/pms/hotels/${HOTEL_ID}/reports/revenue`)
  console.log('Revenue report:', revenue.success ? '✅ Loaded' : 'Error: ' + revenue.message)

  return { occupancy, revenue }
}

// Test Night Audit
async function testNightAudit() {
  console.log('\n🌙 Testing Night Audit...')

  // Get night audit status
  const status = await api('GET', `/pms/hotels/${HOTEL_ID}/night-audit/status`)
  console.log('Night audit status:', status.success ? '✅ Loaded' : 'Error: ' + status.message)

  return status
}

// Main test function
async function runTests() {
  console.log('🚀 Starting PMS Tests...')
  console.log('='.repeat(50))

  // Login
  const loggedIn = await login()
  if (!loggedIn) {
    console.log('Cannot proceed without login')
    process.exit(1)
  }

  const errors = []

  try {
    // Test Room Types
    const roomTypes = await testRoomTypes()
    if (roomTypes.length === 0) {
      errors.push('No room types available')
    }

    // Test Rooms
    const rooms = await testRooms(roomTypes)
    if (rooms.length === 0) {
      errors.push('No rooms available')
    }

    // Test Guests
    const guests = await testGuests()
    if (guests.length === 0) {
      errors.push('No guests available')
    }

    // Test Reservations
    const reservations = await testReservations(rooms, guests)

    // Test Front Desk
    const frontDesk = await testFrontDesk()

    // Test Housekeeping
    const housekeeping = await testHousekeeping()

    // Test Cashier
    const cashier = await testCashier()

    // Test Settings
    const settings = await testSettings()

    // Test KBS
    const kbs = await testKBS()

    // Test Reports
    const reports = await testReports()

    // Test Night Audit
    const nightAudit = await testNightAudit()

  } catch (error) {
    console.error('Test error:', error)
    errors.push(error.message)
  }

  console.log('\n' + '='.repeat(50))
  console.log('🏁 Tests Complete')

  if (errors.length > 0) {
    console.log('\n⚠️ Errors found:')
    errors.forEach(e => console.log('  - ' + e))
  } else {
    console.log('\n✅ All tests passed!')
  }
}

// Run tests
runTests().catch(console.error)
