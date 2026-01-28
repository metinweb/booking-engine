/**
 * Amenity Mapping Utility
 *
 * Maps granular profile features to hotel amenities for filtering.
 * This allows a single source of truth in the Profile tab while
 * auto-generating the amenities array for search/filtering.
 */

/**
 * Maps profile feature keys to their corresponding amenity.
 * Format: { profileFeature: amenity }
 *
 * When a profile feature is selected, the corresponding amenity
 * will be added to hotel.amenities[]
 */
export const PROFILE_FEATURE_TO_AMENITY = {
  // === Facilities Section ===
  wifi: 'wifi',
  freeWifi: 'wifi',
  parking: 'parking',
  freeParking: 'freeParking',
  valetParking: 'valetParking',
  reception24h: 'reception24h',
  concierge: 'concierge',
  luggageStorage: 'luggageStorage',
  elevator: 'elevator',
  airConditioning: 'airConditioning',
  heating: 'heating',
  laundry: 'laundry',
  dryCleaning: 'dryCleaning',
  currencyExchange: 'currencyExchange',
  atm: 'atm',
  carRental: 'carRental',
  airportShuttle: 'airportShuttle',
  wheelchairAccessible: 'wheelchairAccessible',
  smokingArea: 'smokingArea',
  nonSmoking: 'nonSmoking',
  garden: 'garden',
  terrace: 'terrace',
  // New facilities features that map to amenities
  petFriendly: 'petFriendly',
  tourDesk: 'tourDesk',
  businessCenter: 'businessCenter',
  meetingRooms: 'meetingRooms',
  conferenceHall: 'conferenceHall',

  // === Dining Section ===
  mainRestaurant: 'restaurant',
  alacarteRestaurant: 'restaurant',
  buffetRestaurant: 'restaurant',
  poolBar: 'bar',
  beachBar: 'bar',
  lobbyBar: 'bar',
  snackBar: 'bar',
  nightclub: 'nightclub',
  roomService: 'roomService',
  roomService24h: 'roomService',
  minibar: 'minibar',
  // New dining features
  breakfast: 'breakfast',

  // === Sports & Entertainment Section ===
  fitness: 'gym',
  tennis: 'tennis',
  golf: 'golf',
  waterSports: 'waterSports',
  diving: 'diving',
  surfing: 'surfing',
  cinema: 'cinema',
  gameRoom: 'gameRoom',
  casino: 'casino',
  // New sports features
  skiing: 'skiing',

  // === Spa & Wellness Section ===
  spa: 'spa',
  hammam: 'hammam',
  sauna: 'sauna',

  // === Family & Kids Section ===
  kidsClub: 'kidsClub',
  miniClub: 'kidsClub',
  teenClub: 'kidsClub',
  playground: 'playground',
  babysitting: 'babysitting',

  // === Beach & Pool Section ===
  privateBeach: 'privateBeach',
  publicBeach: 'beachAccess',
  sandyBeach: 'beachAccess',
  pebbleBeach: 'beachAccess',
  beachPlatform: 'beachAccess',
  outdoorPool: 'outdoorPool',
  indoorPool: 'indoorPool',
  heatedPool: 'pool',
  infinityPool: 'pool',
  kidsPool: 'pool',
  wavePool: 'pool',
  aquapark: 'pool'
}

/**
 * List of all valid hotel amenities.
 * This should match the enum in hotel.model.js
 */
export const VALID_AMENITIES = [
  // General
  'wifi',
  'parking',
  'freeParking',
  'valetParking',
  'airConditioning',
  'heating',
  // Facilities
  'pool',
  'indoorPool',
  'outdoorPool',
  'spa',
  'gym',
  'sauna',
  'hammam',
  // Dining
  'restaurant',
  'bar',
  'roomService',
  'breakfast',
  'minibar',
  // Services
  'reception24h',
  'concierge',
  'laundry',
  'dryCleaning',
  'airportShuttle',
  'carRental',
  'tourDesk',
  'currencyExchange',
  'atm',
  'luggageStorage',
  // Business
  'businessCenter',
  'meetingRooms',
  'conferenceHall',
  // Family
  'kidsClub',
  'playground',
  'babysitting',
  // Beach & Nature
  'beachAccess',
  'privateBeach',
  'garden',
  'terrace',
  // Accessibility
  'wheelchairAccessible',
  'elevator',
  // Policies
  'petFriendly',
  'smokingArea',
  'nonSmoking',
  // Entertainment
  'casino',
  'nightclub',
  'cinema',
  'gameRoom',
  // Sports
  'tennis',
  'golf',
  'diving',
  'waterSports',
  'surfing',
  'skiing'
]

/**
 * Generates amenities array from hotel profile features.
 *
 * @param {Object} profile - The hotel.profile object
 * @returns {string[]} - Array of unique amenity strings
 */
export function generateAmenitiesFromProfile(profile) {
  if (!profile) return []

  const amenitiesSet = new Set()

  // Collect all features from all profile sections
  const allFeatures = [
    ...(profile.facilities?.features || []),
    ...(profile.dining?.features || []),
    ...(profile.sportsEntertainment?.features || []),
    ...(profile.spaWellness?.features || []),
    ...(profile.familyKids?.features || []),
    ...(profile.beachPool?.features || []),
    ...(profile.honeymoon?.features || [])
  ]

  // Map each feature to its corresponding amenity
  for (const feature of allFeatures) {
    const amenity = PROFILE_FEATURE_TO_AMENITY[feature]
    if (amenity && VALID_AMENITIES.includes(amenity)) {
      amenitiesSet.add(amenity)
    }
  }

  // Handle pool amenity: if any pool-related feature exists, add 'pool'
  const poolFeatures = ['outdoorPool', 'indoorPool', 'heatedPool', 'infinityPool', 'kidsPool', 'wavePool', 'aquapark']
  if (allFeatures.some(f => poolFeatures.includes(f))) {
    amenitiesSet.add('pool')
  }

  return Array.from(amenitiesSet).sort()
}

/**
 * Merges generated amenities with existing ones.
 * Useful during migration to preserve manually added amenities.
 *
 * @param {string[]} existingAmenities - Current hotel.amenities array
 * @param {Object} profile - The hotel.profile object
 * @returns {string[]} - Merged array of unique amenities
 */
export function mergeAmenitiesWithProfile(existingAmenities, profile) {
  const generatedAmenities = generateAmenitiesFromProfile(profile)
  const merged = new Set([...generatedAmenities])

  // Add existing amenities that are still valid
  if (existingAmenities && Array.isArray(existingAmenities)) {
    for (const amenity of existingAmenities) {
      if (VALID_AMENITIES.includes(amenity)) {
        merged.add(amenity)
      }
    }
  }

  return Array.from(merged).sort()
}
