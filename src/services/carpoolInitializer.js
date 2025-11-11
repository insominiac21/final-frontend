/**
 * Initialize Carpool System with Sample Data
 * 
 * Import this in main.jsx or App.jsx to populate the system with sample data
 * on first load (for demonstration purposes)
 */

import { carpoolService, bidService, driverService } from './carpoolService';

/**
 * Check if system has been initialized
 */
const isSystemInitialized = () => {
  try {
    const initialized = localStorage.getItem('carpool_initialized');
    return initialized === 'true';
  } catch {
    return false;
  }
};

/**
 * Mark system as initialized
 */
const markSystemInitialized = () => {
  try {
    localStorage.setItem('carpool_initialized', 'true');
  } catch (error) {
    console.error('Failed to mark system as initialized:', error);
  }
};

/**
 * Initialize system with sample data (call this once on app load)
 */
export const initializeCarpoolSystem = () => {
  // Only initialize once
  if (isSystemInitialized()) {
    console.log('ℹ️ Carpool system already initialized');
    return;
  }

  console.log('🚀 Initializing carpool system with sample data...');

  try {
    // Create sample ride requests
    const sampleRides = [
      {
        pickup_location: 'IIIT Nagpur Campus',
        dropoff_location: 'Dr. Babasaheb Ambedkar International Airport',
        required_time: new Date(Date.now() + 172800000).toISOString(), // 2 days from now
        booking_type: 'one_time',
        fixed_fare: 500,
        student_id: 'BT2021001',
        seats_required: 3
      },
      {
        pickup_location: 'Campus Main Gate',
        dropoff_location: 'Nagpur Railway Station',
        required_time: new Date(Date.now() + 259200000).toISOString(), // 3 days from now
        booking_type: 'one_time',
        fixed_fare: 200,
        student_id: 'BT2021002',
        seats_required: 2
      },
      {
        pickup_location: 'Sitabuldi Fort',
        dropoff_location: 'IIIT Nagpur Campus',
        required_time: new Date(Date.now() + 345600000).toISOString(), // 4 days from now
        booking_type: 'regular',
        fixed_fare: 150,
        student_id: 'BT2021003',
        seats_required: 4
      },
      {
        pickup_location: 'Campus',
        dropoff_location: 'Empress City Mall',
        required_time: new Date(Date.now() + 432000000).toISOString(), // 5 days from now
        booking_type: 'one_time',
        fixed_fare: 180,
        student_id: 'BT2021004',
        seats_required: 3
      }
    ];

    // Create bookings
    const createdBookings = sampleRides.map(ride => carpoolService.createBooking(ride));
    console.log(`✅ Created ${createdBookings.length} sample ride requests`);

    // Create sample bids on some rides
    const drivers = ['DRV001', 'DRV002', 'DRV003']; // Match driver IDs from JSON
    let bidCount = 0;

    // Only create bids for first 2 rides
    createdBookings.slice(0, 2).forEach(booking => {
      drivers.forEach(driverId => {
        const driver = driverService.getDriverById(driverId);
        if (driver) {
          // Generate realistic bid (80-95% of fixed fare)
          const proposedFare = Math.round(booking.fixed_fare * (0.80 + Math.random() * 0.15));
          
          bidService.placeBid({
            booking_id: booking.booking_id,
            driver_id: driverId,
            proposed_fare: proposedFare
          });
          
          bidCount++;
        }
      });
    });

    console.log(`✅ Created ${bidCount} sample bids from drivers`);

    // Create one accepted ride (for demonstration)
    const acceptedBooking = carpoolService.createBooking({
      pickup_location: 'Campus',
      dropoff_location: 'City Center',
      required_time: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      booking_type: 'one_time',
      fixed_fare: 120,
      student_id: 'BT2021005',
      seats_required: 2
    });

    const acceptedBid = bidService.placeBid({
      booking_id: acceptedBooking.booking_id,
      driver_id: 'DRV001', // Match driver ID from JSON
      proposed_fare: 110
    });

    bidService.acceptBid(acceptedBid.bid_id);
    console.log('✅ Created 1 accepted ride for demonstration');

    // Mark as initialized
    markSystemInitialized();
    
    console.log('✅ Carpool system initialization complete!');
    console.log('📊 Summary:');
    console.log(`   - Total Bookings: ${carpoolService.getAllBookings().length}`);
    console.log(`   - Total Bids: ${bidService.getAllBids().length}`);
    console.log(`   - Available Drivers: ${driverService.getAllDrivers().length}`);
    
  } catch (error) {
    console.error('❌ Failed to initialize carpool system:', error);
  }
};

/**
 * Force re-initialization (clears and recreates sample data)
 */
export const reinitializeCarpoolSystem = () => {
  localStorage.removeItem('carpool_initialized');
  initializeCarpoolSystem();
};

/**
 * Get system initialization status
 */
export const getCarpoolSystemStatus = () => {
  return {
    initialized: isSystemInitialized(),
    totalBookings: carpoolService.getAllBookings().length,
    totalBids: bidService.getAllBids().length,
    totalDrivers: driverService.getAllDrivers().length,
    pendingBookings: carpoolService.getAvailableBookingsForDrivers().length,
  };
};

export default {
  initializeCarpoolSystem,
  reinitializeCarpoolSystem,
  getCarpoolSystemStatus
};
