/**
 * Carpool System Debug Utilities
 * 
 * Use these utilities to inspect and debug the carpool system data flow
 */

// Storage keys
const STORAGE_KEYS = {
  RIDE_BOOKINGS: 'carpool_ride_bookings',
  RIDE_BIDS: 'carpool_ride_bids',
  DRIVER_PROFILES: 'carpool_driver_profiles',
  DRIVER_AVAILABILITY: 'carpool_driver_availability',
  BOOKING_PARTICIPANTS: 'carpool_booking_participants',
  INITIALIZED: 'carpool_initialized'
};

/**
 * Display all carpool data in console
 */
export const debugCarpoolData = () => {
  console.log('=== CARPOOL SYSTEM DEBUG ===\n');
  
  Object.entries(STORAGE_KEYS).forEach(([key, storageKey]) => {
    const data = localStorage.getItem(storageKey);
    console.log(`📦 ${key}:`);
    if (data) {
      try {
        const parsed = JSON.parse(data);
        console.log(`   Count: ${Array.isArray(parsed) ? parsed.length : 'N/A'}`);
        console.log(`   Data:`, parsed);
      } catch (e) {
        console.log(`   Raw:`, data);
      }
    } else {
      console.log('   ❌ Not found in localStorage');
    }
    console.log('\n');
  });
  
  console.log('===========================\n');
};

/**
 * Clear all carpool data from localStorage
 */
export const clearCarpoolData = () => {
  console.log('🗑️  Clearing all carpool data from localStorage...');
  
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
  
  console.log('✅ All carpool data cleared!');
  console.log('💡 Reload the page to reinitialize with fresh data.');
};

/**
 * Get current system statistics
 */
export const getCarpoolStats = () => {
  const stats = {
    initialized: localStorage.getItem(STORAGE_KEYS.INITIALIZED) === 'true',
    bookings: {
      total: 0,
      pending: 0,
      accepted: 0,
      completed: 0
    },
    bids: {
      total: 0,
      pending: 0,
      accepted: 0,
      rejected: 0
    },
    drivers: {
      total: 0,
      available: 0,
      offline: 0
    }
  };
  
  // Get bookings
  const bookingsData = localStorage.getItem(STORAGE_KEYS.RIDE_BOOKINGS);
  if (bookingsData) {
    const bookings = JSON.parse(bookingsData);
    stats.bookings.total = bookings.length;
    stats.bookings.pending = bookings.filter(b => b.status === 'pending').length;
    stats.bookings.accepted = bookings.filter(b => b.status === 'accepted').length;
    stats.bookings.completed = bookings.filter(b => b.status === 'completed').length;
  }
  
  // Get bids
  const bidsData = localStorage.getItem(STORAGE_KEYS.RIDE_BIDS);
  if (bidsData) {
    const bids = JSON.parse(bidsData);
    stats.bids.total = bids.length;
    stats.bids.pending = bids.filter(b => b.status === 'pending').length;
    stats.bids.accepted = bids.filter(b => b.status === 'accepted').length;
    stats.bids.rejected = bids.filter(b => b.status === 'rejected').length;
  }
  
  // Get drivers
  const driversData = localStorage.getItem(STORAGE_KEYS.DRIVER_PROFILES);
  if (driversData) {
    const drivers = JSON.parse(driversData);
    stats.drivers.total = drivers.length;
  }
  
  const availData = localStorage.getItem(STORAGE_KEYS.DRIVER_AVAILABILITY);
  if (availData) {
    const availability = JSON.parse(availData);
    stats.drivers.available = availability.filter(a => a.is_available).length;
    stats.drivers.offline = availability.filter(a => !a.is_available).length;
  }
  
  return stats;
};

/**
 * Print system statistics in a nice format
 */
export const printCarpoolStats = () => {
  const stats = getCarpoolStats();
  
  console.log('📊 === CARPOOL SYSTEM STATISTICS ===\n');
  console.log(`🔧 System Initialized: ${stats.initialized ? '✅ Yes' : '❌ No'}\n`);
  
  console.log('🚗 BOOKINGS:');
  console.log(`   Total: ${stats.bookings.total}`);
  console.log(`   Pending: ${stats.bookings.pending}`);
  console.log(`   Accepted: ${stats.bookings.accepted}`);
  console.log(`   Completed: ${stats.bookings.completed}\n`);
  
  console.log('💰 BIDS:');
  console.log(`   Total: ${stats.bids.total}`);
  console.log(`   Pending: ${stats.bids.pending}`);
  console.log(`   Accepted: ${stats.bids.accepted}`);
  console.log(`   Rejected: ${stats.bids.rejected}\n`);
  
  console.log('👨‍✈️ DRIVERS:');
  console.log(`   Total: ${stats.drivers.total}`);
  console.log(`   Available: ${stats.drivers.available}`);
  console.log(`   Offline: ${stats.drivers.offline}\n`);
  
  console.log('===================================\n');
};

/**
 * Export data for backup/inspection
 */
export const exportCarpoolData = () => {
  const data = {};
  
  Object.entries(STORAGE_KEYS).forEach(([key, storageKey]) => {
    const item = localStorage.getItem(storageKey);
    if (item) {
      try {
        data[key] = JSON.parse(item);
      } catch {
        data[key] = item;
      }
    }
  });
  
  console.log('📤 Exported Data:', data);
  return data;
};

/**
 * Make utilities available globally in development
 */
if (import.meta.env.DEV) {
  window.carpoolDebug = {
    debug: debugCarpoolData,
    clear: clearCarpoolData,
    stats: printCarpoolStats,
    getStats: getCarpoolStats,
    export: exportCarpoolData
  };
  
  console.log('🔧 Carpool debug utilities loaded!');
  console.log('📝 Available commands:');
  console.log('   window.carpoolDebug.debug()  - Show all data');
  console.log('   window.carpoolDebug.clear()  - Clear all data');
  console.log('   window.carpoolDebug.stats()  - Show statistics');
  console.log('   window.carpoolDebug.export() - Export data as JSON');
}

export default {
  debugCarpoolData,
  clearCarpoolData,
  getCarpoolStats,
  printCarpoolStats,
  exportCarpoolData
};
