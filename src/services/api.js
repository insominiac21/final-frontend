const FLASK_API = 'http://localhost:5000';
const NODE_API_URL = 'http://localhost:5001';

// Helper function for Flask API calls
const flaskApiCall = async (endpoint, options = {}) => {
  try {
    const url = `${FLASK_API}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`Flask API Error (${endpoint}):`, error);
    throw error;
  }
};

let complaintsStore = [];

const mapDepartmentsToCategory = (departments) => {
  if (!departments || departments.length === 0) return 'other';
  const deptStr = departments.join(' ').toLowerCase();
  if (deptStr.includes('mess') || deptStr.includes('dining')) return 'mess';
  if (deptStr.includes('network') || deptStr.includes('it')) return 'network';
  if (deptStr.includes('maintenance') || deptStr.includes('housekeeping') || deptStr.includes('water')) return 'maintenance';
  if (deptStr.includes('transport')) return 'transport';
  return 'other';
};

// ==================== AUTH APIs ====================

export const authAPI = {
  loginStudent: async (rollNumber, password) => {
    return {
      success: true,
      data: {
        user_id: 'student_123',
        role: 'student',
        name: rollNumber,
        email: `${rollNumber}@student.iiitn.ac.in`,
        token: 'mock_student_token'
      }
    };
  },

  loginAdmin: async (email, password) => {
    return {
      success: true,
      data: {
        user_id: 'admin_123',
        role: 'admin',
        name: 'Admin User',
        email: email,
        token: 'mock_admin_token'
      }
    };
  },

  loginDriver: async (email, password) => {
    return {
      success: true,
      data: {
        user_id: 'driver_123',
        role: 'driver',
        name: 'Driver User',
        email: email,
        token: 'mock_driver_token'
      }
    };
  },

  registerStudent: async (userData) => {
    return {
      success: true,
      data: {
        user_id: 'student_new',
        message: 'Registration successful'
      }
    };
  }
};

// ==================== COMPLAINT APIs ====================

export const complaintAPI = {
  // Submit complaint to Flask backend (processes with LLM)
  submitComplaint: async (complaintText, categoryHint = null) => {
    try {
      const response = await flaskApiCall('/process', {
        method: 'POST',
        body: JSON.stringify({ complaint: complaintText }),
      });

      const aiDepartments = response.admin_view?.departments || response.student_view?.departments || [];
      const aiCategory = mapDepartmentsToCategory(aiDepartments);
      
      const complaintRecord = {
        ...response,
        category: aiCategory,
        student_view: {
          ...response.student_view,
          category: aiCategory,
        }
      };
      
      complaintsStore.push(complaintRecord);

      return {
        success: true,
        data: complaintRecord,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  },

  // Fetch from BOTH Flask (JSON) AND PostgreSQL (Node.js)
  getAllComplaints: async () => {
    let allComplaints = [];
    let flaskCount = 0;
    let postgresCount = 0;

    // 1. Fetch from Flask backend (reads complaints.json from Flask backend)
    try {
      console.log('🔍 Fetching complaints from Flask (JSON)...');
      const flaskResponse = await flaskApiCall('/complaints', {
        method: 'GET',
      });
      
      if (Array.isArray(flaskResponse) && flaskResponse.length > 0) {
        flaskCount = flaskResponse.length;
        console.log(`✓ Fetched ${flaskCount} complaints from Flask JSON`);
        allComplaints.push(...flaskResponse);
      }
    } catch (error) {
      console.warn('⚠️ Flask backend (JSON) not available:', error.message);
    }

    // 2. Fetch from Node.js/PostgreSQL backend (port 5001)
    try {
      console.log('🔍 Fetching complaints from PostgreSQL (port 5001)...');
      const nodeResponse = await fetch(`${NODE_API_URL}/api/complaints`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(5000),
      });

      if (nodeResponse.ok) {
        const postgresComplaints = await nodeResponse.json();
        if (Array.isArray(postgresComplaints) && postgresComplaints.length > 0) {
          postgresCount = postgresComplaints.length;
          console.log(`✓ Fetched ${postgresCount} complaints from PostgreSQL`);
          allComplaints.push(...postgresComplaints);
        }
      } else {
        console.warn(`PostgreSQL returned ${nodeResponse.status}`);
      }
    } catch (error) {
      console.warn('⚠️ PostgreSQL backend (port 5001) not available:', error.message);
    }

    // 3. Deduplicate by ID (keep first occurrence)
    const uniqueComplaints = Array.from(
      new Map(allComplaints.map(c => [c.id, c])).values()
    );

    console.log(`📊 Total unique complaints: ${uniqueComplaints.length} (Flask JSON: ${flaskCount}, PostgreSQL: ${postgresCount})`);
    
    complaintsStore = uniqueComplaints;

    return {
      success: true,
      data: uniqueComplaints,
    };
  },

  getComplaintById: async (complaintId) => {
    try {
      const response = await flaskApiCall(`/complaints/${complaintId}`, {
        method: 'GET',
      });

      return {
        success: true,
        data: response,
      };
    } catch (error) {
      const complaint = complaintsStore.find((c) => c.id === complaintId);
      if (complaint) {
        return { success: true, data: complaint };
      }
      return { success: false, error: 'Complaint not found' };
    }
  },

  updateComplaintStatus: async (complaintId, status, adminNotes = '') => {
    try {
      const response = await flaskApiCall(`/complaints/${complaintId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ 
          status,
          admin_notes: adminNotes,
          updated_at: new Date().toISOString()
        }),
      });

      return { success: true, data: response };
    } catch (error) {
      const complaint = complaintsStore.find((c) => c.id === complaintId);
      if (complaint) {
        complaint.student_view.status = status;
        complaint.admin_view.status = status;
        complaint.admin_view.admin_notes = adminNotes;
        complaint.admin_view.updated_at = new Date().toISOString();
        return { success: true, data: complaint };
      }
      return { success: false, error: error.message };
    }
  },

  getMyComplaints: async (studentId, categoryFilter = null) => {
    try {
      const response = await complaintAPI.getAllComplaints();
      
      if (response.success) {
        let filtered = response.data;

        if (studentId) {
          filtered = filtered.filter(c => c.student_id === studentId);
        }
        
        if (categoryFilter) {
          filtered = filtered.filter((c) => {
            const aiCategory = c.category || mapDepartmentsToCategory(
              c.admin_view?.departments || c.student_view?.departments || []
            );
            return aiCategory === categoryFilter;
          });
        }
        
        return { success: true, data: filtered };
      }
      
      return response;
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  createComplaint: async (complaintData) => {
    const complaintText = `${complaintData.title}\n\n${complaintData.description}`;
    return await complaintAPI.submitComplaint(complaintText, complaintData.category);
  },

  uploadComplaintMedia: async (complaintId, files) => {
    return {
      success: true,
      data: {
        media_ids: files.map((_, i) => `media_${i}`),
        file_urls: files.map(f => URL.createObjectURL(f))
      }
    };
  }
};

// ==================== RIDE BOOKING APIs ====================

import { carpoolAPI, bidAPI as carpoolBidAPI, driverAPI as carpoolDriverAPI, participantAPI } from './carpoolAPI';

export const rideAPI = {
  getMyBookings: async (studentId) => {
    try {
      const bookings = await carpoolAPI.getBookingsByStudent(studentId);
      return {
        success: true,
        data: bookings
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  getAvailableBookings: async () => {
    try {
      const bookings = await carpoolAPI.getAvailableBookingsForDrivers();
      return {
        success: true,
        data: bookings
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  getAllBookings: async () => {
    try {
      const bookings = await carpoolAPI.getAllBookings();
      return {
        success: true,
        data: bookings
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  filterBookings: async (filters) => {
    try {
      const bookings = await carpoolAPI.filterBookings(filters);
      return {
        success: true,
        data: bookings
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  createBooking: async (bookingData) => {
    try {
      const newBooking = await carpoolAPI.createBooking(bookingData);
      return {
        success: true,
        data: newBooking
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  acceptBooking: async (bookingId, driverId) => {
    try {
      const booking = await carpoolAPI.acceptBooking(bookingId, driverId);
      return {
        success: true,
        data: booking
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  cancelBooking: async (bookingId) => {
    try {
      const booking = await carpoolAPI.cancelBooking(bookingId);
      return {
        success: true,
        data: booking
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  completeBooking: async (bookingId) => {
    try {
      const booking = await carpoolAPI.completeBooking(bookingId);
      return {
        success: true,
        data: booking
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  getBookingById: async (bookingId) => {
    try {
      const booking = await carpoolAPI.getBookingById(bookingId);
      return {
        success: true,
        data: booking
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  joinRide: async (bookingId, studentId) => {
    try {
      const participant = await participantAPI.addParticipant(bookingId, studentId);
      return {
        success: true,
        data: participant
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  leaveRide: async (bookingId, studentId) => {
    try {
      await participantAPI.removeParticipant(bookingId, studentId);
      return {
        success: true,
        message: 'Left ride successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  getParticipants: async (bookingId) => {
    try {
      const participants = await participantAPI.getParticipants(bookingId);
      return {
        success: true,
        data: participants
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  getJoinedRides: async (studentId) => {
    try {
      const participations = await participantAPI.getStudentParticipations(studentId);
      return {
        success: true,
        data: participations
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
};

// ==================== RIDE BID APIs ====================

export const bidAPI = {
  getBidsForBooking: async (bookingId) => {
    try {
      const bids = await carpoolBidAPI.getBidsForBooking(bookingId);
      return {
        success: true,
        data: bids
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  placeBid: async (bookingId, driverId, proposedFare) => {
    try {
      const bid = await carpoolBidAPI.placeBid({
        booking_id: bookingId,
        driver_id: driverId,
        proposed_fare: proposedFare
      });
      return {
        success: true,
        data: bid
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  acceptBid: async (bidId) => {
    try {
      const bid = await carpoolBidAPI.acceptBid(bidId);
      return {
        success: true,
        data: bid
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  rejectBid: async (bidId) => {
    try {
      const bid = await carpoolBidAPI.rejectBid(bidId);
      return {
        success: true,
        data: bid
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
};

// ==================== DEPARTMENT APIs ====================

export const departmentAPI = {
  getAllDepartments: async () => {
    return {
      success: true,
      data: [
        { dep_id: 'MESS', dept_name: 'Mess' },
        { dep_id: 'TRANSPORT', dept_name: 'Transport' },
        { dep_id: 'NETWORK', dept_name: 'Network & IT' },
        { dep_id: 'HOUSEKEEPING', dept_name: 'Housekeeping' },
        { dep_id: 'WATER', dept_name: 'Water Supply' }
      ]
    };
  }
};

// ==================== SCHEDULE APIs ====================

export const scheduleAPI = {
  getSchedulesByDepartment: async (deptId) => {
    const mockSchedules = {
      MESS: [
        {
          schedule_id: 'SCH_MESS_1',
          dep_id: 'MESS',
          title: 'Breakfast Timing',
          content_url: '/schedules/mess_breakfast.pdf',
          last_updated_by: 'admin',
          last_updated_at: '2025-11-01T10:00:00Z',
          is_current: true
        },
        {
          schedule_id: 'SCH_MESS_2',
          dep_id: 'MESS',
          title: 'Weekly Menu',
          content_url: '/schedules/mess_menu.pdf',
          last_updated_by: 'admin',
          last_updated_at: '2025-11-01T10:00:00Z',
          is_current: true
        }
      ],
      TRANSPORT: [
        {
          schedule_id: 'SCH_TRANS_1',
          dep_id: 'TRANSPORT',
          title: 'Bus Schedule',
          content_url: '/schedules/bus_schedule.pdf',
          last_updated_by: 'admin',
          last_updated_at: '2025-11-01T10:00:00Z',
          is_current: true
        }
      ]
    };

    return {
      success: true,
      data: mockSchedules[deptId] || []
    };
  },

  updateSchedule: async (scheduleId, scheduleData) => {
    return {
      success: true,
      data: {
        schedule_id: scheduleId,
        ...scheduleData,
        last_updated_at: new Date().toISOString()
      }
    };
  }
};

// ==================== MESS TIMETABLE APIs ====================

export const messTimetableAPI = {
  uploadMessTimetable: async (file, uploadedBy) => {
    console.log('Uploading timetable:', file.name, 'by:', uploadedBy);
    
    return {
      success: true,
      data: {
        timetable_id: 'TT_' + Date.now(),
        filename: file.name,
        file_url: URL.createObjectURL(file),
        uploaded_by: uploadedBy,
        uploaded_at: new Date().toISOString(),
        is_current: true
      }
    };
  },

  getCurrentMessTimetable: async () => {
    return {
      success: true,
      data: {
        timetable_id: 'TT_001',
        filename: 'Mess_Timetable_November_2025.pdf',
        file_url: '/mess-menu.pdf',
        uploaded_by: 'admin_123',
        uploaded_at: '2025-11-01T10:00:00Z',
        is_current: true
      }
    };
  },

  deleteMessTimetable: async (timetableId) => {
    console.log('Deleting timetable:', timetableId);
    
    return {
      success: true,
      message: 'Timetable deleted successfully'
    };
  }
};

// ==================== DRIVER APIs ====================

export const driverAPI = {
  getDriverProfile: async (driverId) => {
    try {
      const driver = await carpoolDriverAPI.getDriverById(driverId);
      return {
        success: true,
        data: driver
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  getAllDrivers: async () => {
    try {
      const drivers = await carpoolDriverAPI.getAllDrivers();
      return {
        success: true,
        data: drivers
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  getOnlineDrivers: async () => {
    try {
      const drivers = await carpoolDriverAPI.getOnlineDrivers();
      return {
        success: true,
        data: drivers
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  updateAvailability: async (driverId, isOnline, latitude = null, longitude = null) => {
    try {
      const availability = await carpoolDriverAPI.updateDriverAvailability(driverId, isOnline, latitude, longitude);
      return {
        success: true,
        data: availability
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  getDriverStats: async (driverId) => {
    try {
      const stats = await carpoolDriverAPI.getDriverStats(driverId);
      return {
        success: true,
        data: stats
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },

  getDriverBookings: async (driverId, status = null) => {
    try {
      const bookings = await carpoolDriverAPI.getDriverBookings(driverId, status);
      return {
        success: true,
        data: bookings
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
};

// ==================== USER APIs ====================

export const userAPI = {
  getUserById: async (userId) => {
    return {
      success: true,
      data: {
        user_id: userId,
        role: 'student',
        name: 'John Doe',
        email: 'john@student.iiitn.ac.in',
        phone_number: '+91-9876543210',
        is_active: true
      }
    };
  },

  updateUserProfile: async (userId, userData) => {
    return {
      success: true,
      data: {
        user_id: userId,
        ...userData
      }
    };
  }
};