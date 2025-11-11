/**
 * Carpool System Test Utilities
 * 
 * This file contains helper functions to test and demonstrate the carpool system.
 * Open browser console and use these functions to test various scenarios.
 */

import { carpoolService, bidService, driverService, participantService, clearCarpoolData } from './carpoolService';

// ==================== DEMO DATA SETUP ====================

/**
 * Populate system with sample ride requests
 */
export const createSampleRides = () => {
  const sampleRides = [
    {
      pickup_location: 'IIIT Nagpur Campus',
      dropoff_location: 'Airport',
      required_time: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      booking_type: 'one_time',
      fixed_fare: 500,
      student_id: 'student_001',
      seats_required: 3
    },
    {
      pickup_location: 'Campus Gate',
      dropoff_location: 'Railway Station',
      required_time: new Date(Date.now() + 172800000).toISOString(), // 2 days
      booking_type: 'one_time',
      fixed_fare: 200,
      student_id: 'student_002',
      seats_required: 2
    },
    {
      pickup_location: 'City Center',
      dropoff_location: 'Campus',
      required_time: new Date(Date.now() + 259200000).toISOString(), // 3 days
      booking_type: 'regular',
      fixed_fare: 150,
      student_id: 'student_003',
      seats_required: 4
    }
  ];

  sampleRides.forEach(ride => {
    carpoolService.createBooking(ride);
  });

  console.log('✅ Created 3 sample ride requests');
  return carpoolService.getAllBookings();
};

/**
 * Create sample bids on existing rides
 */
export const createSampleBids = () => {
  const bookings = carpoolService.getAvailableBookingsForDrivers();
  
  if (bookings.length === 0) {
    console.warn('⚠️ No bookings available. Create rides first using createSampleRides()');
    return [];
  }

  const drivers = ['driver_001', 'driver_002', 'driver_003'];
  let bidCount = 0;

  bookings.forEach(booking => {
    // Each booking gets 2-3 bids
    const numBids = Math.floor(Math.random() * 2) + 2;
    
    for (let i = 0; i < numBids && i < drivers.length; i++) {
      const proposedFare = booking.fixed_fare * (0.8 + Math.random() * 0.3); // 80-110% of fixed fare
      
      bidService.placeBid({
        booking_id: booking.booking_id,
        driver_id: drivers[i],
        proposed_fare: Math.round(proposedFare)
      });
      
      bidCount++;
    }
  });

  console.log(`✅ Created ${bidCount} sample bids`);
  return bidService.getAllBids();
};

// ==================== TEST SCENARIOS ====================

/**
 * Test Scenario 1: Complete ride lifecycle
 */
export const testCompleteRideLifecycle = () => {
  console.log('\n🧪 Testing Complete Ride Lifecycle...\n');

  // Step 1: Student creates ride request
  console.log('1️⃣ Student creates ride request');
  const booking = carpoolService.createBooking({
    pickup_location: 'Test Campus',
    dropoff_location: 'Test Airport',
    required_time: new Date(Date.now() + 86400000).toISOString(),
    booking_type: 'one_time',
    fixed_fare: 300,
    student_id: 'test_student',
    seats_required: 2
  });
  console.log('   ✅ Booking created:', booking.booking_id);

  // Step 2: Drivers place bids
  console.log('\n2️⃣ Drivers place bids');
  const bid1 = bidService.placeBid({
    booking_id: booking.booking_id,
    driver_id: 'driver_001',
    proposed_fare: 280
  });
  console.log('   ✅ Driver 1 bid:', bid1.proposed_fare);

  const bid2 = bidService.placeBid({
    booking_id: booking.booking_id,
    driver_id: 'driver_002',
    proposed_fare: 260
  });
  console.log('   ✅ Driver 2 bid:', bid2.proposed_fare);

  // Step 3: Student views bids
  console.log('\n3️⃣ Student views bids');
  const allBids = bidService.getBidsForBooking(booking.booking_id);
  console.log('   ℹ️ Total bids:', allBids.length);
  allBids.forEach(bid => {
    console.log(`   - ${bid.driver_info?.name || bid.driver_id}: ₹${bid.proposed_fare}`);
  });

  // Step 4: Student accepts best bid
  console.log('\n4️⃣ Student accepts best bid');
  const acceptedBid = bidService.acceptBid(bid2.bid_id);
  console.log('   ✅ Accepted bid from:', acceptedBid.driver_id);

  // Step 5: Check booking status
  console.log('\n5️⃣ Checking booking status');
  const updatedBooking = carpoolService.getBookingById(booking.booking_id);
  console.log('   ✅ Booking status:', updatedBooking.status);
  console.log('   ✅ Assigned driver:', updatedBooking.accepted_driver_id);

  // Step 6: Driver completes ride
  console.log('\n6️⃣ Driver completes ride');
  carpoolService.completeBooking(booking.booking_id);
  const completedBooking = carpoolService.getBookingById(booking.booking_id);
  console.log('   ✅ Final status:', completedBooking.status);

  console.log('\n✅ Complete ride lifecycle test passed!\n');
  
  return {
    booking: completedBooking,
    acceptedBid,
    allBids
  };
};

/**
 * Test Scenario 2: Multiple students joining same ride
 */
export const testMultipleParticipants = () => {
  console.log('\n🧪 Testing Multiple Participants...\n');

  // Create a ride
  console.log('1️⃣ Creating shared ride');
  const booking = carpoolService.createBooking({
    pickup_location: 'Campus',
    dropoff_location: 'Shopping Mall',
    required_time: new Date(Date.now() + 86400000).toISOString(),
    booking_type: 'one_time',
    fixed_fare: 150,
    student_id: 'student_host',
    seats_required: 4
  });
  console.log('   ✅ Ride created by student_host');

  // Student 2 joins
  console.log('\n2️⃣ Student 2 joins');
  participantService.addParticipant(booking.booking_id, 'student_002');
  console.log('   ✅ student_002 joined');

  // Student 3 joins
  console.log('\n3️⃣ Student 3 joins');
  participantService.addParticipant(booking.booking_id, 'student_003');
  console.log('   ✅ student_003 joined');

  // View all participants
  console.log('\n4️⃣ Viewing all participants');
  const participants = participantService.getParticipants(booking.booking_id);
  console.log('   ℹ️ Total participants:', participants.length);
  participants.forEach(p => {
    console.log(`   - ${p.student_id} (joined: ${new Date(p.joined_at).toLocaleString()})`);
  });

  // Student 2 leaves
  console.log('\n5️⃣ Student 2 leaves');
  participantService.removeParticipant(booking.booking_id, 'student_002');
  console.log('   ✅ student_002 left');

  // View updated participants
  console.log('\n6️⃣ Viewing updated participants');
  const updatedParticipants = participantService.getParticipants(booking.booking_id);
  console.log('   ℹ️ Remaining participants:', updatedParticipants.length);
  updatedParticipants.forEach(p => {
    console.log(`   - ${p.student_id}`);
  });

  console.log('\n✅ Multiple participants test passed!\n');
  
  return {
    booking,
    participants: updatedParticipants
  };
};

/**
 * Test Scenario 3: Driver statistics
 */
export const testDriverStats = () => {
  console.log('\n🧪 Testing Driver Statistics...\n');

  const driverId = 'driver_001';

  // Create and complete some rides for driver
  console.log('1️⃣ Creating test rides');
  
  for (let i = 0; i < 3; i++) {
    const booking = carpoolService.createBooking({
      pickup_location: `Location ${i + 1}`,
      dropoff_location: `Destination ${i + 1}`,
      required_time: new Date(Date.now() + 86400000 * (i + 1)).toISOString(),
      booking_type: 'one_time',
      fixed_fare: 200 + i * 50,
      student_id: `student_${i}`,
      seats_required: 2
    });

    // Accept booking
    carpoolService.updateBookingStatus(booking.booking_id, 'accepted', driverId);
    
    // Complete ride
    carpoolService.completeBooking(booking.booking_id);
  }
  console.log('   ✅ Created and completed 3 rides');

  // Get driver stats
  console.log('\n2️⃣ Fetching driver statistics');
  const stats = driverService.getDriverStats(driverId);
  console.log('   📊 Driver Stats:');
  console.log(`   - Total Rides: ${stats.total_rides}`);
  console.log(`   - Pending Requests: ${stats.pending_requests}`);
  console.log(`   - Confirmed Today: ${stats.confirmed_today}`);
  console.log(`   - Rating: ${stats.rating} ⭐`);

  // Get driver bookings
  console.log('\n3️⃣ Fetching driver bookings');
  const completedBookings = driverService.getDriverBookings(driverId, 'completed');
  console.log(`   ℹ️ Completed bookings: ${completedBookings.length}`);

  console.log('\n✅ Driver statistics test passed!\n');
  
  return stats;
};

/**
 * Test Scenario 4: Filtering rides
 */
export const testRideFiltering = () => {
  console.log('\n🧪 Testing Ride Filtering...\n');

  // Create diverse rides
  console.log('1️⃣ Creating diverse rides');
  carpoolService.createBooking({
    pickup_location: 'Campus',
    dropoff_location: 'Airport',
    required_time: '2025-11-15T08:00:00',
    booking_type: 'one_time',
    fixed_fare: 500,
    student_id: 'student_a',
    seats_required: 3
  });

  carpoolService.createBooking({
    pickup_location: 'Campus',
    dropoff_location: 'Railway Station',
    required_time: '2025-11-16T10:00:00',
    booking_type: 'one_time',
    fixed_fare: 200,
    student_id: 'student_b',
    seats_required: 2
  });

  carpoolService.createBooking({
    pickup_location: 'City Center',
    dropoff_location: 'Campus',
    required_time: '2025-11-15T18:00:00',
    booking_type: 'regular',
    fixed_fare: 150,
    student_id: 'student_c',
    seats_required: 4
  });
  console.log('   ✅ Created 3 diverse rides');

  // Test filter by pickup location
  console.log('\n2️⃣ Filter by pickup location (Campus)');
  const campusRides = carpoolService.filterBookings({ pickup_location: 'Campus' });
  console.log(`   ℹ️ Found ${campusRides.length} rides from Campus`);

  // Test filter by destination
  console.log('\n3️⃣ Filter by destination (Campus)');
  const toCampus = carpoolService.filterBookings({ dropoff_location: 'Campus' });
  console.log(`   ℹ️ Found ${toCampus.length} rides to Campus`);

  // Test filter by date
  console.log('\n4️⃣ Filter by date (Nov 15)');
  const nov15Rides = carpoolService.filterBookings({ date: '2025-11-15' });
  console.log(`   ℹ️ Found ${nov15Rides.length} rides on Nov 15`);

  console.log('\n✅ Ride filtering test passed!\n');
  
  return {
    campusRides,
    toCampus,
    nov15Rides
  };
};

// ==================== UTILITY FUNCTIONS ====================

/**
 * Display all system data
 */
export const showAllData = () => {
  console.log('\n📊 Current System State\n');
  
  const bookings = carpoolService.getAllBookings();
  const bids = bidService.getAllBids();
  const drivers = driverService.getAllDrivers();
  
  console.log(`📝 Total Bookings: ${bookings.length}`);
  console.log(`💰 Total Bids: ${bids.length}`);
  console.log(`🚗 Total Drivers: ${drivers.length}`);
  
  console.log('\n--- Bookings ---');
  bookings.forEach(b => {
    console.log(`${b.booking_id}: ${b.pickup_location} → ${b.dropoff_location} [${b.status}]`);
  });
  
  console.log('\n--- Bids ---');
  bids.forEach(b => {
    console.log(`${b.bid_id}: ${b.driver_id} bid ₹${b.proposed_fare} [${b.bid_status}]`);
  });
  
  console.log('\n');
};

/**
 * Reset entire system
 */
export const resetSystem = () => {
  if (confirm('⚠️ This will delete ALL carpool data. Continue?')) {
    clearCarpoolData();
    console.log('✅ System reset complete');
  }
};

/**
 * Run all tests
 */
export const runAllTests = () => {
  console.clear();
  console.log('🚀 Running All Carpool System Tests\n');
  console.log('='.repeat(50));
  
  resetSystem();
  
  testCompleteRideLifecycle();
  testMultipleParticipants();
  testDriverStats();
  testRideFiltering();
  
  console.log('='.repeat(50));
  console.log('\n✅ All tests completed successfully!\n');
  
  showAllData();
};

// ==================== EXPORT FOR CONSOLE ====================

// Make functions available in window for console testing
if (typeof window !== 'undefined') {
  window.carpoolTest = {
    createSampleRides,
    createSampleBids,
    testCompleteRideLifecycle,
    testMultipleParticipants,
    testDriverStats,
    testRideFiltering,
    showAllData,
    resetSystem,
    runAllTests
  };
  
  console.log('🎯 Carpool test utilities loaded!');
  console.log('📝 Use window.carpoolTest to access functions');
  console.log('💡 Example: carpoolTest.runAllTests()');
}

export default {
  createSampleRides,
  createSampleBids,
  testCompleteRideLifecycle,
  testMultipleParticipants,
  testDriverStats,
  testRideFiltering,
  showAllData,
  resetSystem,
  runAllTests
};
