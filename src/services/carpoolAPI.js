/**
 * Carpool API Service
 * 
 * This service can switch between mock data (localStorage) and real backend API.
 * Set USE_MOCK_DATA in carpoolConfig.js to control the data source.
 */

import { USE_MOCK_DATA, BACKEND_API_URL, ENDPOINTS } from './carpoolConfig';
import { carpoolService as mockCarpoolService, bidService as mockBidService, driverService as mockDriverService, participantService as mockParticipantService } from './carpoolService';

// ==================== HELPER FUNCTIONS ====================

/**
 * Make HTTP request to backend
 */
const backendRequest = async (endpoint, options = {}) => {
  try {
    const url = `${BACKEND_API_URL}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Backend API Error (${endpoint}):`, error);
    throw error;
  }
};

/**
 * Wrapper to switch between mock and real backend
 */
const dataSource = (mockFn, backendFn) => {
  return USE_MOCK_DATA ? mockFn : backendFn;
};

// ==================== RIDE BOOKING API ====================

export const carpoolAPI = {
  /**
   * Get all ride bookings
   */
  getAllBookings: async () => {
    return dataSource(
      // Mock implementation
      () => {
        const bookings = mockCarpoolService.getAllBookings();
        return Promise.resolve(bookings);
      },
      // Backend implementation
      async () => {
        return await backendRequest(ENDPOINTS.BOOKINGS, { method: 'GET' });
      }
    )();
  },

  /**
   * Get bookings by student
   */
  getBookingsByStudent: async (studentId) => {
    return dataSource(
      // Mock implementation
      () => {
        const bookings = mockCarpoolService.getBookingsByStudent(studentId);
        return Promise.resolve(bookings);
      },
      // Backend implementation
      async () => {
        return await backendRequest(ENDPOINTS.BOOKINGS_BY_STUDENT(studentId), { method: 'GET' });
      }
    )();
  },

  /**
   * Get available bookings for drivers (pending status)
   */
  getAvailableBookingsForDrivers: async () => {
    return dataSource(
      // Mock implementation
      () => {
        const bookings = mockCarpoolService.getAvailableBookingsForDrivers();
        return Promise.resolve(bookings);
      },
      // Backend implementation
      async () => {
        return await backendRequest(ENDPOINTS.BOOKINGS_AVAILABLE, { method: 'GET' });
      }
    )();
  },

  /**
   * Get booking by ID
   */
  getBookingById: async (bookingId) => {
    return dataSource(
      // Mock implementation
      () => {
        const booking = mockCarpoolService.getBookingById(bookingId);
        return Promise.resolve(booking);
      },
      // Backend implementation
      async () => {
        return await backendRequest(ENDPOINTS.BOOKINGS_BY_ID(bookingId), { method: 'GET' });
      }
    )();
  },

  /**
   * Create a new ride booking
   */
  createBooking: async (bookingData) => {
    return dataSource(
      // Mock implementation
      () => {
        const booking = mockCarpoolService.createBooking(bookingData);
        console.log('✅ Booking created (mock):', booking);
        return Promise.resolve(booking);
      },
      // Backend implementation
      async () => {
        return await backendRequest(ENDPOINTS.BOOKINGS, {
          method: 'POST',
          body: JSON.stringify(bookingData),
        });
      }
    )();
  },

  /**
   * Update booking status
   */
  updateBookingStatus: async (bookingId, status, driverId = null, bidId = null) => {
    return dataSource(
      // Mock implementation
      () => {
        const booking = mockCarpoolService.updateBookingStatus(bookingId, status, driverId, bidId);
        return Promise.resolve(booking);
      },
      // Backend implementation
      async () => {
        return await backendRequest(ENDPOINTS.BOOKINGS_BY_ID(bookingId), {
          method: 'PUT',
          body: JSON.stringify({ status, driver_id: driverId, bid_id: bidId }),
        });
      }
    )();
  },

  /**
   * Accept booking (driver accepts at fixed fare)
   */
  acceptBooking: async (bookingId, driverId) => {
    return dataSource(
      // Mock implementation
      () => {
        const booking = mockCarpoolService.updateBookingStatus(bookingId, 'accepted', driverId);
        return Promise.resolve(booking);
      },
      // Backend implementation
      async () => {
        return await backendRequest(ENDPOINTS.BOOKINGS_ACCEPT(bookingId), {
          method: 'POST',
          body: JSON.stringify({ driver_id: driverId }),
        });
      }
    )();
  },

  /**
   * Cancel booking
   */
  cancelBooking: async (bookingId) => {
    return dataSource(
      // Mock implementation
      () => {
        const booking = mockCarpoolService.cancelBooking(bookingId);
        return Promise.resolve(booking);
      },
      // Backend implementation
      async () => {
        return await backendRequest(ENDPOINTS.BOOKINGS_CANCEL(bookingId), {
          method: 'POST',
        });
      }
    )();
  },

  /**
   * Complete booking
   */
  completeBooking: async (bookingId) => {
    return dataSource(
      // Mock implementation
      () => {
        const booking = mockCarpoolService.completeBooking(bookingId);
        return Promise.resolve(booking);
      },
      // Backend implementation
      async () => {
        return await backendRequest(ENDPOINTS.BOOKINGS_COMPLETE(bookingId), {
          method: 'POST',
        });
      }
    )();
  },

  /**
   * Filter bookings
   */
  filterBookings: async (filters) => {
    return dataSource(
      // Mock implementation
      () => {
        const bookings = mockCarpoolService.filterBookings(filters);
        return Promise.resolve(bookings);
      },
      // Backend implementation
      async () => {
        const queryParams = new URLSearchParams(filters).toString();
        return await backendRequest(`${ENDPOINTS.BOOKINGS_FILTER}?${queryParams}`, {
          method: 'GET',
        });
      }
    )();
  },
};

// ==================== RIDE BID API ====================

export const bidAPI = {
  /**
   * Get all bids
   */
  getAllBids: async () => {
    return dataSource(
      // Mock implementation
      () => {
        const bids = mockBidService.getAllBids();
        return Promise.resolve(bids);
      },
      // Backend implementation
      async () => {
        return await backendRequest(ENDPOINTS.BIDS, { method: 'GET' });
      }
    )();
  },

  /**
   * Get bids for a specific booking
   */
  getBidsForBooking: async (bookingId) => {
    return dataSource(
      // Mock implementation
      () => {
        const bids = mockBidService.getBidsForBooking(bookingId);
        return Promise.resolve(bids);
      },
      // Backend implementation
      async () => {
        return await backendRequest(ENDPOINTS.BIDS_BY_BOOKING(bookingId), { method: 'GET' });
      }
    )();
  },

  /**
   * Get bids by driver
   */
  getBidsByDriver: async (driverId) => {
    return dataSource(
      // Mock implementation
      () => {
        const bids = mockBidService.getBidsByDriver(driverId);
        return Promise.resolve(bids);
      },
      // Backend implementation
      async () => {
        return await backendRequest(ENDPOINTS.BIDS_BY_DRIVER(driverId), { method: 'GET' });
      }
    )();
  },

  /**
   * Place a bid
   */
  placeBid: async (bidData) => {
    return dataSource(
      // Mock implementation
      () => {
        const bid = mockBidService.placeBid(bidData);
        console.log('✅ Bid placed (mock):', bid);
        return Promise.resolve(bid);
      },
      // Backend implementation
      async () => {
        return await backendRequest(ENDPOINTS.BIDS, {
          method: 'POST',
          body: JSON.stringify(bidData),
        });
      }
    )();
  },

  /**
   * Accept a bid (student accepts driver's bid)
   */
  acceptBid: async (bidId) => {
    return dataSource(
      // Mock implementation
      () => {
        const bid = mockBidService.acceptBid(bidId);
        return Promise.resolve(bid);
      },
      // Backend implementation
      async () => {
        return await backendRequest(ENDPOINTS.BIDS_ACCEPT(bidId), {
          method: 'POST',
        });
      }
    )();
  },

  /**
   * Reject a bid
   */
  rejectBid: async (bidId) => {
    return dataSource(
      // Mock implementation
      () => {
        const bid = mockBidService.rejectBid(bidId);
        return Promise.resolve(bid);
      },
      // Backend implementation
      async () => {
        return await backendRequest(ENDPOINTS.BIDS_REJECT(bidId), {
          method: 'POST',
        });
      }
    )();
  },
};

// ==================== DRIVER API ====================

export const driverAPI = {
  /**
   * Get all drivers
   */
  getAllDrivers: async () => {
    return dataSource(
      // Mock implementation
      () => {
        const drivers = mockDriverService.getAllDrivers();
        return Promise.resolve(drivers);
      },
      // Backend implementation
      async () => {
        return await backendRequest(ENDPOINTS.DRIVERS, { method: 'GET' });
      }
    )();
  },

  /**
   * Get driver by ID
   */
  getDriverById: async (driverId) => {
    return dataSource(
      // Mock implementation
      () => {
        const driver = mockDriverService.getDriverById(driverId);
        return Promise.resolve(driver);
      },
      // Backend implementation
      async () => {
        return await backendRequest(ENDPOINTS.DRIVER_BY_ID(driverId), { method: 'GET' });
      }
    )();
  },

  /**
   * Get online drivers
   */
  getOnlineDrivers: async () => {
    return dataSource(
      // Mock implementation
      () => {
        const drivers = mockDriverService.getOnlineDrivers();
        return Promise.resolve(drivers);
      },
      // Backend implementation
      async () => {
        return await backendRequest(ENDPOINTS.DRIVERS_ONLINE, { method: 'GET' });
      }
    )();
  },

  /**
   * Update driver availability
   */
  updateDriverAvailability: async (driverId, isOnline, latitude = null, longitude = null) => {
    return dataSource(
      // Mock implementation
      () => {
        const availability = mockDriverService.updateDriverAvailability(driverId, isOnline, latitude, longitude);
        return Promise.resolve(availability);
      },
      // Backend implementation
      async () => {
        return await backendRequest(ENDPOINTS.DRIVER_AVAILABILITY(driverId), {
          method: 'PUT',
          body: JSON.stringify({ is_online: isOnline, latitude, longitude }),
        });
      }
    )();
  },

  /**
   * Get driver statistics
   */
  getDriverStats: async (driverId) => {
    return dataSource(
      // Mock implementation
      () => {
        const stats = mockDriverService.getDriverStats(driverId);
        return Promise.resolve(stats);
      },
      // Backend implementation
      async () => {
        return await backendRequest(ENDPOINTS.DRIVER_STATS(driverId), { method: 'GET' });
      }
    )();
  },

  /**
   * Get driver bookings
   */
  getDriverBookings: async (driverId, status = null) => {
    return dataSource(
      // Mock implementation
      () => {
        const bookings = mockDriverService.getDriverBookings(driverId, status);
        return Promise.resolve(bookings);
      },
      // Backend implementation
      async () => {
        const queryParams = status ? `?status=${status}` : '';
        return await backendRequest(`${ENDPOINTS.DRIVER_BOOKINGS(driverId)}${queryParams}`, {
          method: 'GET',
        });
      }
    )();
  },
};

// ==================== PARTICIPANT API ====================

export const participantAPI = {
  /**
   * Get participants for a booking
   */
  getParticipants: async (bookingId) => {
    return dataSource(
      // Mock implementation
      () => {
        const participants = mockParticipantService.getParticipants(bookingId);
        return Promise.resolve(participants);
      },
      // Backend implementation
      async () => {
        return await backendRequest(ENDPOINTS.PARTICIPANTS_BY_BOOKING(bookingId), {
          method: 'GET',
        });
      }
    )();
  },

  /**
   * Get bookings a student has joined
   */
  getStudentParticipations: async (studentId) => {
    return dataSource(
      // Mock implementation
      () => {
        const participations = mockParticipantService.getStudentParticipations(studentId);
        return Promise.resolve(participations);
      },
      // Backend implementation
      async () => {
        return await backendRequest(ENDPOINTS.PARTICIPANTS_BY_STUDENT(studentId), {
          method: 'GET',
        });
      }
    )();
  },

  /**
   * Add participant to a booking (join ride)
   */
  addParticipant: async (bookingId, studentId) => {
    return dataSource(
      // Mock implementation
      () => {
        const participant = mockParticipantService.addParticipant(bookingId, studentId);
        return Promise.resolve(participant);
      },
      // Backend implementation
      async () => {
        return await backendRequest(ENDPOINTS.PARTICIPANTS_JOIN, {
          method: 'POST',
          body: JSON.stringify({ booking_id: bookingId, student_id: studentId }),
        });
      }
    )();
  },

  /**
   * Remove participant from booking (leave ride)
   */
  removeParticipant: async (bookingId, studentId) => {
    return dataSource(
      // Mock implementation
      () => {
        const result = mockParticipantService.removeParticipant(bookingId, studentId);
        return Promise.resolve(result);
      },
      // Backend implementation
      async () => {
        return await backendRequest(ENDPOINTS.PARTICIPANTS_LEAVE, {
          method: 'POST',
          body: JSON.stringify({ booking_id: bookingId, student_id: studentId }),
        });
      }
    )();
  },
};

// Export all APIs
export default {
  carpoolAPI,
  bidAPI,
  driverAPI,
  participantAPI,
};
