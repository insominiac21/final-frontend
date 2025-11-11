// Mock JSON Data Store for Carpool System
// This simulates a backend database using localStorage for persistence

// Import initial data
import initialDriverProfiles from '../data/driver_profiles.json';
import initialDriverAvailability from '../data/driver_availability.json';

// Storage keys
const STORAGE_KEYS = {
  RIDE_BOOKINGS: 'carpool_ride_bookings',
  RIDE_BIDS: 'carpool_ride_bids',
  DRIVER_PROFILES: 'carpool_driver_profiles',
  DRIVER_AVAILABILITY: 'carpool_driver_availability',
  BOOKING_PARTICIPANTS: 'carpool_booking_participants',
};

// Helper function to generate unique IDs
const generateId = (prefix) => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Helper function to get data from localStorage
const getFromStorage = (key, defaultValue = []) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (error) {
    console.error(`Error reading from localStorage (${key}):`, error);
    return defaultValue;
  }
};

// Helper function to save data to localStorage
const saveToStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error(`Error saving to localStorage (${key}):`, error);
    return false;
  }
};

// Initialize data if not exists
const initializeData = () => {
  // Initialize driver profiles
  if (!localStorage.getItem(STORAGE_KEYS.DRIVER_PROFILES)) {
    saveToStorage(STORAGE_KEYS.DRIVER_PROFILES, initialDriverProfiles);
  }
  
  // Initialize driver availability
  if (!localStorage.getItem(STORAGE_KEYS.DRIVER_AVAILABILITY)) {
    saveToStorage(STORAGE_KEYS.DRIVER_AVAILABILITY, initialDriverAvailability);
  }
  
  // Initialize empty arrays for bookings and bids
  if (!localStorage.getItem(STORAGE_KEYS.RIDE_BOOKINGS)) {
    saveToStorage(STORAGE_KEYS.RIDE_BOOKINGS, []);
  }
  
  if (!localStorage.getItem(STORAGE_KEYS.RIDE_BIDS)) {
    saveToStorage(STORAGE_KEYS.RIDE_BIDS, []);
  }
  
  if (!localStorage.getItem(STORAGE_KEYS.BOOKING_PARTICIPANTS)) {
    saveToStorage(STORAGE_KEYS.BOOKING_PARTICIPANTS, []);
  }
};

// Initialize on module load
initializeData();

// ==================== RIDE BOOKING SERVICE ====================

export const carpoolService = {
  // Get all ride bookings
  getAllBookings: () => {
    const bookings = getFromStorage(STORAGE_KEYS.RIDE_BOOKINGS);
    console.log('📋 GET ALL BOOKINGS:', bookings.length, 'bookings found');
    return bookings;
  },

  // Get bookings by student
  getBookingsByStudent: (studentId) => {
    const bookings = getFromStorage(STORAGE_KEYS.RIDE_BOOKINGS);
    const filtered = bookings.filter(b => b.student_id === studentId);
    console.log(`📋 GET BOOKINGS FOR STUDENT ${studentId}:`, filtered.length, 'bookings found');
    return filtered;
  },

  // Get available bookings for drivers (pending status)
  getAvailableBookingsForDrivers: () => {
    const bookings = getFromStorage(STORAGE_KEYS.RIDE_BOOKINGS);
    const available = bookings.filter(b => b.status === 'pending');
    console.log('📋 GET AVAILABLE BOOKINGS FOR DRIVERS:', available.length, 'pending bookings found');
    return available;
  },

  // Get bookings by status
  getBookingsByStatus: (status) => {
    const bookings = getFromStorage(STORAGE_KEYS.RIDE_BOOKINGS);
    return bookings.filter(b => b.status === status);
  },

  // Create a new ride booking
  createBooking: (bookingData) => {
    const bookings = getFromStorage(STORAGE_KEYS.RIDE_BOOKINGS);
    const newBooking = {
      booking_id: generateId('BK'),
      pickup_location: bookingData.pickup_location,
      dropoff_location: bookingData.dropoff_location,
      required_time: bookingData.required_time,
      status: 'pending', // pending, accepted, completed, cancelled
      booking_type: bookingData.booking_type || 'one_time', // one_time, regular
      fixed_fare: bookingData.fixed_fare || null,
      student_id: bookingData.student_id,
      seats_required: bookingData.seats_required || 1,
      created_at: new Date().toISOString(),
      accepted_driver_id: null,
      accepted_bid_id: null,
    };
    
    bookings.push(newBooking);
    const saved = saveToStorage(STORAGE_KEYS.RIDE_BOOKINGS, bookings);
    
    console.log('📝 NEW BOOKING CREATED:', newBooking);
    console.log('💾 Total bookings in storage:', bookings.length);
    console.log('✅ Saved to localStorage:', saved);
    
    return newBooking;
  },

  // Update booking status
  updateBookingStatus: (bookingId, status, driverId = null, bidId = null) => {
    const bookings = getFromStorage(STORAGE_KEYS.RIDE_BOOKINGS);
    const bookingIndex = bookings.findIndex(b => b.booking_id === bookingId);
    
    if (bookingIndex !== -1) {
      const oldStatus = bookings[bookingIndex].status;
      bookings[bookingIndex].status = status;
      if (driverId) {
        bookings[bookingIndex].accepted_driver_id = driverId;
      }
      if (bidId) {
        bookings[bookingIndex].accepted_bid_id = bidId;
      }
      bookings[bookingIndex].updated_at = new Date().toISOString();
      
      const saved = saveToStorage(STORAGE_KEYS.RIDE_BOOKINGS, bookings);
      
      console.log('🔄 BOOKING STATUS UPDATED:');
      console.log('   Booking ID:', bookingId);
      console.log('   Old Status:', oldStatus, '→ New Status:', status);
      console.log('   Driver ID:', driverId);
      console.log('   Bid ID:', bidId);
      console.log('   ✅ Saved to localStorage:', saved);
      
      return bookings[bookingIndex];
    }
    
    console.error('❌ Booking not found:', bookingId);
    return null;
  },

  // Cancel booking
  cancelBooking: (bookingId) => {
    return carpoolService.updateBookingStatus(bookingId, 'cancelled');
  },

  // Complete booking
  completeBooking: (bookingId) => {
    const booking = carpoolService.updateBookingStatus(bookingId, 'completed');
    if (booking) {
      // Update driver stats
      const driverId = booking.accepted_driver_id;
      if (driverId) {
        carpoolService.incrementDriverRides(driverId);
      }
    }
    return booking;
  },

  // Get booking by ID
  getBookingById: (bookingId) => {
    const bookings = getFromStorage(STORAGE_KEYS.RIDE_BOOKINGS);
    return bookings.find(b => b.booking_id === bookingId);
  },

  // Filter bookings
  filterBookings: (filters) => {
    let bookings = getFromStorage(STORAGE_KEYS.RIDE_BOOKINGS);
    
    if (filters.pickup_location) {
      bookings = bookings.filter(b => 
        b.pickup_location.toLowerCase().includes(filters.pickup_location.toLowerCase())
      );
    }
    
    if (filters.dropoff_location) {
      bookings = bookings.filter(b => 
        b.dropoff_location.toLowerCase().includes(filters.dropoff_location.toLowerCase())
      );
    }
    
    if (filters.date) {
      bookings = bookings.filter(b => 
        new Date(b.required_time).toDateString() === new Date(filters.date).toDateString()
      );
    }
    
    if (filters.status) {
      bookings = bookings.filter(b => b.status === filters.status);
    }
    
    return bookings;
  },
};

// ==================== RIDE BID SERVICE ====================

export const bidService = {
  // Get all bids
  getAllBids: () => {
    return getFromStorage(STORAGE_KEYS.RIDE_BIDS);
  },

  // Get bids for a specific booking
  getBidsForBooking: (bookingId) => {
    const bids = getFromStorage(STORAGE_KEYS.RIDE_BIDS);
    const bookingBids = bids.filter(b => b.booking_id === bookingId);
    
    console.log(`💰 GET BIDS FOR BOOKING ${bookingId}:`, bookingBids.length, 'bids found');
    
    // Enrich with driver info
    const drivers = getFromStorage(STORAGE_KEYS.DRIVER_PROFILES);
    const enrichedBids = bookingBids.map(bid => {
      const driver = drivers.find(d => d.driver_id === bid.driver_id);
      return {
        ...bid,
        driver_info: driver || null
      };
    });
    
    console.log('   Enriched bids:', enrichedBids);
    return enrichedBids;
  },

  // Get bids by driver
  getBidsByDriver: (driverId) => {
    const bids = getFromStorage(STORAGE_KEYS.RIDE_BIDS);
    return bids.filter(b => b.driver_id === driverId);
  },

  // Place a bid
  placeBid: (bidData) => {
    const bids = getFromStorage(STORAGE_KEYS.RIDE_BIDS);
    
    // Check if driver already has a bid for this booking
    const existingBid = bids.find(
      b => b.booking_id === bidData.booking_id && b.driver_id === bidData.driver_id
    );
    
    if (existingBid) {
      // Update existing bid
      existingBid.proposed_fare = bidData.proposed_fare;
      existingBid.updated_at = new Date().toISOString();
      saveToStorage(STORAGE_KEYS.RIDE_BIDS, bids);
      console.log('🔄 BID UPDATED:', existingBid);
      return existingBid;
    }
    
    // Create new bid
    const newBid = {
      bid_id: generateId('BID'),
      booking_id: bidData.booking_id,
      proposed_fare: bidData.proposed_fare,
      bid_status: 'pending', // pending, accepted, rejected
      driver_id: bidData.driver_id,
      created_at: new Date().toISOString(),
    };
    
    bids.push(newBid);
    const saved = saveToStorage(STORAGE_KEYS.RIDE_BIDS, bids);
    
    console.log('💰 NEW BID PLACED:', newBid);
    console.log('💾 Total bids in storage:', bids.length);
    console.log('✅ Saved to localStorage:', saved);
    
    return newBid;
  },

  // Accept a bid (student accepts driver's bid)
  acceptBid: (bidId) => {
    const bids = getFromStorage(STORAGE_KEYS.RIDE_BIDS);
    const bidIndex = bids.findIndex(b => b.bid_id === bidId);
    
    if (bidIndex !== -1) {
      const bid = bids[bidIndex];
      
      console.log('✅ ACCEPTING BID:', bidId);
      console.log('   Booking ID:', bid.booking_id);
      console.log('   Driver ID:', bid.driver_id);
      
      // Update bid status
      bid.bid_status = 'accepted';
      bid.accepted_at = new Date().toISOString();
      
      // Reject all other bids for this booking
      let rejectedCount = 0;
      bids.forEach(b => {
        if (b.booking_id === bid.booking_id && b.bid_id !== bidId && b.bid_status === 'pending') {
          b.bid_status = 'rejected';
          rejectedCount++;
        }
      });
      
      saveToStorage(STORAGE_KEYS.RIDE_BIDS, bids);
      console.log('   Other bids rejected:', rejectedCount);
      
      // Update booking status
      carpoolService.updateBookingStatus(bid.booking_id, 'accepted', bid.driver_id, bidId);
      
      return bid;
    }
    
    console.error('❌ Bid not found:', bidId);
    return null;
  },

  // Reject a bid
  rejectBid: (bidId) => {
    const bids = getFromStorage(STORAGE_KEYS.RIDE_BIDS);
    const bidIndex = bids.findIndex(b => b.bid_id === bidId);
    
    if (bidIndex !== -1) {
      bids[bidIndex].bid_status = 'rejected';
      bids[bidIndex].rejected_at = new Date().toISOString();
      saveToStorage(STORAGE_KEYS.RIDE_BIDS, bids);
      return bids[bidIndex];
    }
    return null;
  },
};

// ==================== DRIVER SERVICE ====================

export const driverService = {
  // Get all drivers
  getAllDrivers: () => {
    return getFromStorage(STORAGE_KEYS.DRIVER_PROFILES);
  },

  // Get driver by ID
  getDriverById: (driverId) => {
    const drivers = getFromStorage(STORAGE_KEYS.DRIVER_PROFILES);
    return drivers.find(d => d.driver_id === driverId);
  },

  // Get online drivers
  getOnlineDrivers: () => {
    const availability = getFromStorage(STORAGE_KEYS.DRIVER_AVAILABILITY);
    const drivers = getFromStorage(STORAGE_KEYS.DRIVER_PROFILES);
    
    const onlineDriverIds = availability
      .filter(a => a.is_online)
      .map(a => a.driver_id);
    
    return drivers.filter(d => onlineDriverIds.includes(d.driver_id));
  },

  // Update driver availability
  updateDriverAvailability: (driverId, isOnline, latitude = null, longitude = null) => {
    const availability = getFromStorage(STORAGE_KEYS.DRIVER_AVAILABILITY);
    const availIndex = availability.findIndex(a => a.driver_id === driverId);
    
    if (availIndex !== -1) {
      availability[availIndex].is_online = isOnline;
      if (latitude !== null) availability[availIndex].current_latitude = latitude;
      if (longitude !== null) availability[availIndex].current_longitude = longitude;
      availability[availIndex].updated_at = new Date().toISOString();
    } else {
      // Create new availability record
      availability.push({
        avail_id: generateId('AVAIL'),
        driver_id: driverId,
        is_online: isOnline,
        current_latitude: latitude,
        current_longitude: longitude,
        updated_at: new Date().toISOString(),
      });
    }
    
    saveToStorage(STORAGE_KEYS.DRIVER_AVAILABILITY, availability);
    return availability[availIndex];
  },

  // Get driver stats
  getDriverStats: (driverId) => {
    const bookings = getFromStorage(STORAGE_KEYS.RIDE_BOOKINGS);
    const driverBookings = bookings.filter(b => b.accepted_driver_id === driverId);
    
    const completed = driverBookings.filter(b => b.status === 'completed').length;
    const accepted = driverBookings.filter(b => b.status === 'accepted').length;
    const today = new Date().toDateString();
    const confirmedToday = driverBookings.filter(
      b => b.status === 'accepted' && new Date(b.required_time).toDateString() === today
    ).length;
    
    // Get driver rating
    const driver = driverService.getDriverById(driverId);
    const rating = driver ? driver.rating : 0;
    
    return {
      total_rides: completed,
      pending_requests: carpoolService.getAvailableBookingsForDrivers().length,
      confirmed_today: confirmedToday,
      accepted_rides: accepted,
      rating: rating,
    };
  },

  // Increment driver ride count (called when ride is completed)
  incrementDriverRides: (driverId) => {
    const drivers = getFromStorage(STORAGE_KEYS.DRIVER_PROFILES);
    const driverIndex = drivers.findIndex(d => d.driver_id === driverId);
    
    if (driverIndex !== -1) {
      drivers[driverIndex].total_rides = (drivers[driverIndex].total_rides || 0) + 1;
      saveToStorage(STORAGE_KEYS.DRIVER_PROFILES, drivers);
      return drivers[driverIndex];
    }
    return null;
  },

  // Get bookings for a specific driver
  getDriverBookings: (driverId, status = null) => {
    const bookings = getFromStorage(STORAGE_KEYS.RIDE_BOOKINGS);
    let driverBookings = bookings.filter(b => b.accepted_driver_id === driverId);
    
    if (status) {
      driverBookings = driverBookings.filter(b => b.status === status);
    }
    
    return driverBookings;
  },
};

// ==================== BOOKING PARTICIPANTS SERVICE ====================

export const participantService = {
  // Add participant to a booking
  addParticipant: (bookingId, studentId) => {
    const participants = getFromStorage(STORAGE_KEYS.BOOKING_PARTICIPANTS);
    
    // Check if already participating
    const existing = participants.find(
      p => p.booking_id === bookingId && p.student_id === studentId
    );
    
    if (existing) {
      return existing;
    }
    
    const newParticipant = {
      participant_id: generateId('PART'),
      booking_id: bookingId,
      student_id: studentId,
      joined_at: new Date().toISOString(),
      status: 'joined', // joined, cancelled
    };
    
    participants.push(newParticipant);
    saveToStorage(STORAGE_KEYS.BOOKING_PARTICIPANTS, participants);
    return newParticipant;
  },

  // Remove participant from booking
  removeParticipant: (bookingId, studentId) => {
    let participants = getFromStorage(STORAGE_KEYS.BOOKING_PARTICIPANTS);
    participants = participants.filter(
      p => !(p.booking_id === bookingId && p.student_id === studentId)
    );
    saveToStorage(STORAGE_KEYS.BOOKING_PARTICIPANTS, participants);
    return true;
  },

  // Get participants for a booking
  getParticipants: (bookingId) => {
    const participants = getFromStorage(STORAGE_KEYS.BOOKING_PARTICIPANTS);
    return participants.filter(p => p.booking_id === bookingId && p.status === 'joined');
  },

  // Get bookings a student has joined
  getStudentParticipations: (studentId) => {
    const participants = getFromStorage(STORAGE_KEYS.BOOKING_PARTICIPANTS);
    const bookings = getFromStorage(STORAGE_KEYS.RIDE_BOOKINGS);
    
    const studentParticipations = participants.filter(
      p => p.student_id === studentId && p.status === 'joined'
    );
    
    // Get full booking details
    return studentParticipations.map(p => {
      const booking = bookings.find(b => b.booking_id === p.booking_id);
      return {
        ...p,
        booking_details: booking
      };
    });
  },
};

// ==================== UTILITY FUNCTIONS ====================

// Clear all carpool data (for testing)
export const clearCarpoolData = () => {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
  initializeData();
};

// Export storage keys for direct access if needed
export { STORAGE_KEYS };

// Default export
export default {
  carpoolService,
  bidService,
  driverService,
  participantService,
  clearCarpoolData,
};
