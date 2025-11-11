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

// In-memory complaint store (used as a fallback)
// let complaintsStore = [
//   {
//     id: 1731100001000,
//     category: 'mess',
//     student_view: {
//       complaint: 'Food Quality Issue\n\nThe dal served today at lunch was undercooked and many students complained about stomach issues. This has been happening frequently over the past week.',
//       departments: ['Mess & Dining'],
//       contacts: { 'Mess & Dining': 'mess@iiit-nagpur.ac.in' },
//       suggestions: [
//         'Please avoid consuming undercooked food and report to the medical center if you experience discomfort.',
//         'You may speak with the mess manager during meal times to voice your concerns.',
//         'Consider having packaged food as an alternative until the issue is resolved.'
//       ],
//       severity: 4,
//       institute: 'IIIT Nagpur',
//       timestamp: '2025-11-08T10:30:00Z',
//       status: 'Pending'
//     },
//     admin_view: {
//       timestamp: '2025-11-08T10:30:00Z',
//       severity: 4,
//       summary: 'Undercooked food in mess causing health concerns among students',
//       complaint: 'Food Quality Issue\n\nThe dal served today at lunch was undercooked and many students complained about stomach issues. This has been happening frequently over the past week.',
//       departments: ['Mess & Dining'],
//       institute: 'IIIT Nagpur',
//       officer_brief: 'A student complaint has been received regarding undercooked food in mess causing health concerns among students. It is rated 4/5 in severity and forwarded to the Mess & Dining department(s).'
//     }
//   },
//   {
//     id: 1731100006000,
//     category: 'mess',
//     student_view: {
//       complaint: 'Menu Variety Suggestion\n\nIt would be nice to have more variety in breakfast options. We\'ve been having poha and upma alternating for weeks now.',
//       departments: ['Mess & Dining'],
//       contacts: { 'Mess & Dining': 'mess@iiit-nagpur.ac.in' },
//       suggestions: [
//         'You can share your menu suggestions with the mess committee.',
//         'Participate in mess committee meetings to voice your preferences.',
//         'Consider the nutritional balance when suggesting new items.'
//       ],
//       severity: 2,
//       institute: 'IIIT Nagpur',
//       timestamp: '2025-11-09T08:30:00Z',
//       status: 'Pending'
//     },
//     admin_view: {
//       timestamp: '2025-11-09T08:30:00Z',
//       severity: 2,
//       summary: 'Student request for more variety in breakfast menu options',
//       complaint: 'Menu Variety Suggestion\n\nIt would be nice to have more variety in breakfast options. We\'ve been having poha and upma alternating for weeks now.',
//       departments: ['Mess & Dining'],
//       institute: 'IIIT Nagpur',
//       officer_brief: 'A student complaint has been received regarding student request for more variety in breakfast menu options. It is rated 2/5 in severity and forwarded to the Mess & Dining department(s).'
//     }
//   },
//   // === Network Complaints ===
//   {
//     id: 1731100002000,
//     category: 'network',
//     student_view: {
//       complaint: 'WiFi Not Working in Hostel Block A\n\nThe WiFi has been completely down in Hostel Block A since yesterday evening. Cannot attend online classes or submit assignments. This is very urgent.',
//       departments: ['Network & IT'],
//       contacts: { 'Network & IT': 'it@iiit-nagpur.ac.in' },
//       suggestions: [
//         'Try connecting to the backup network if available in your area.',
//         'Use mobile hotspot as a temporary solution for urgent work.',
//         'Report the exact location and room number to the IT helpdesk for faster resolution.'
//       ],
//       severity: 5,
//       institute: 'IIIT Nagpur',
//       timestamp: '2025-11-08T15:45:00Z',
//       status: 'In Progress'
//     },
//     admin_view: {
//       timestamp: '2025-11-08T15:45:00Z',
//       severity: 5,
//       summary: 'Complete WiFi outage in Hostel Block A affecting online classes',
//       complaint: 'WiFi Not Working in Hostel Block A\n\nThe WiFi has been completely down in Hostel Block A since yesterday evening. Cannot attend online classes or submit assignments. This is very urgent.',
//       departments: ['Network & IT'],
//       institute: 'IIIT Nagpur',
//       officer_brief: 'A student complaint has been received regarding complete WiFi outage in Hostel Block A affecting online classes. It is rated 5/5 in severity and forwarded to the Network & IT department(s).',
//       status: 'In Progress',
//       admin_notes: 'IT team dispatched to investigate',
//       updated_at: '2025-11-08T16:00:00Z'
//     }
//   },
//   {
//     id: 1731100004000,
//     category: 'network',
//     student_view: {
//       complaint: 'Slow Internet Speed in Library\n\nThe internet speed in the library has been very slow for the past 3 days. Pages take forever to load and videos buffer constantly.',
//       departments: ['Network & IT'],
//       contacts: { 'Network & IT': 'it@iiit-nagpur.ac.in' },
//       suggestions: [
//         'Try using the library during off-peak hours (early morning or late evening).',
//         'Download study materials at other locations and read offline in the library.',
//         'Report specific speed test results to help the IT team diagnose the issue.'
//       ],
//       severity: 3,
//       institute: 'IIIT Nagpur',
//       timestamp: '2025-11-09T09:15:00Z',
//       status: 'Pending'
//     },
//     admin_view: {
//       timestamp: '2025-11-09T09:15:00Z',
//       severity: 3,
//       summary: 'Slow internet connectivity in library affecting student research',
//       complaint: 'Slow Internet Speed in Library\n\nThe internet speed in the library has been very slow for the past 3 days. Pages take forever to load and videos buffer constantly.',
//      departments: ['Network & IT'],
//       institute: 'IIIT Nagpur',
//       officer_brief: 'A student complaint has been received regarding slow internet connectivity in library affecting student research. It is rated 3/5 in severity and forwarded to the Network & IT department(s).'
//     }
//   },
//   // === Maintenance Complaints ===
//   {
//     id: 1731100003000,
//     category: 'maintenance',
//     student_view: {
//       complaint: 'Water Leakage in Room 305\n\nThere is water leaking from the ceiling in room 305 of Block B. It started last night during the rain and is still dripping. The floor is wet and books got damaged.',
//       departments: ['Maintenance', 'Drinking Water'],
//       contacts: { 
//         'Maintenance': 'maintenance@iiit-nagpur.ac.in',
//         'Drinking Water': 'water@iiit-nagpur.ac.in'
//       },
//       suggestions: [
//         'Move your belongings away from the leakage area to prevent further damage.',
//         'Place a bucket or container to collect the dripping water.',
//         'Report to the hostel warden immediately for temporary accommodation if needed.'
//       ],
//       severity: 4,
//       institute: 'IIIT Nagpur',
//       timestamp: '2025-11-07T22:30:00Z',
//       status: 'Resolved'
//     },
//     admin_view: {
//       timestamp: '2025-11-07T22:30:00Z',
//       severity: 4,
//       summary: 'Water leakage from ceiling causing property damage in hostel room',
//       complaint: 'Water Leakage in Room 305\n\nThere is water leaking from the ceiling in room 305 of Block B. It started last night during the rain and is still dripping. The floor is wet and books got damaged.',
//       departments: ['Maintenance', 'Drinking Water'],
//       institute: 'IIIT Nagpur',
//       officer_brief: 'A student complaint has been received regarding water leakage from ceiling causing property damage in hostel room. It is rated 4/5 in severity and forwarded to the Maintenance, Drinking Water department(s).',
//       status: 'Resolved',
//       admin_notes: 'Plumber fixed the pipe. Ceiling repair scheduled for next week.',
//       updated_at: '2025-11-08T10:00:00Z'
//     }
//   },
//   {
//     id: 1731100005000,
//     category: 'maintenance',
//     student_view: {
//       complaint: 'Broken Window in Classroom 204\n\nOne of the windows in classroom 204 is broken. The glass is cracked and could fall anytime. It\'s a safety hazard.',
//       departments: ['Maintenance'],
//       contacts: { 'Maintenance': 'maintenance@iiit-nagpur.ac.in' },
//       suggestions: [
//         'Avoid sitting near the broken window until it is repaired.',
//         'Inform your classmates and faculty about the hazard.',
//         'Request immediate attention from the maintenance department.'
//       ],
//       severity: 4,
//       institute: 'IIIT Nagpur',
//       timestamp: '2025-11-09T11:00:00Z',
//       status: 'Pending'
//     },
//     admin_view: {
//       timestamp: '2025-11-09T11:00:00Z',
//       severity: 4,
//       summary: 'Safety hazard: Broken window with cracked glass in classroom',
//       complaint: 'Broken Window in Classroom 204\n\nOne of the windows in classroom 204 is broken. The glass is cracked and could fall anytime. It\'s a safety hazard.',
//       departments: ['Maintenance'],
//       institute: 'IIIT Nagpur',
//       officer_brief: 'A student complaint has been received regarding safety hazard: Broken window with cracked glass in classroom. It is rated 4/5 in severity and forwarded to the Maintenance department(s).'
//    }
//   },
//   // === Transport Complaints ===
//   {
//     id: "TRN001",
//     category: 'transport',
//     student_view: {
//       complaint: "Bus route 3 is frequently late by 20-30 minutes. Students are missing their first period classes regularly.",
//       status: "in_progress",
//       timestamp: "2025-11-10T07:45:00",
//       departments: ["Transport"],
//       contacts: { "Transport": "transport@iiit-nagpur.ac.in" },
//       severity: 4,
//       institute: "IIIT Nagpur"
//     },
//     admin_view: {
//       departments: ["Transport"],
//       severity: 4,
//       timestamp: "2025-11-10T07:45:00",
//       summary: "Bus route 3 frequently late, causing students to miss classes",
//       complaint: "Bus route 3 is frequently late by 20-30 minutes. Students are missing their first period classes regularly.",
//       suggestions: [
//         "Transport department is reviewing route timings",
//         "Additional bus has been assigned during peak hours",
//         "Download the campus bus tracking app for real-time updates",
//         "Consider taking the earlier bus (Route 2) as an alternative"
//       ],
//       officer_brief: "A student complaint has been received regarding Bus route 3 being frequently late. It is rated 4/5 in severity and forwarded to the Transport department(s).",
//       status: "in_progress"
//     }
//   },
//   {
//     id: "TRN002",
//     category: 'transport',
//     student_view: {
//       complaint: "Campus shuttle AC is not working properly. Very uncomfortable during hot weather, especially in afternoon trips.",
//       status: "Pending",
//       timestamp: "2025-11-11T14:30:00",
//       departments: ["Transport"],
//       contacts: { "Transport": "transport@iiit-nagpur.ac.in" },
//       severity: 3,
//       institute: "IIIT Nagpur"
//     },
//     admin_view: {
//       departments: ["Transport"],
//       severity: 3,
//       timestamp: "2025-11-11T14:30:00",
//       summary: "Campus shuttle AC not working, causing discomfort",
//       complaint: "Campus shuttle AC is not working properly. Very uncomfortable during hot weather, especially in afternoon trips.",
//       suggestions: [
//         "AC servicing has been scheduled for this week",
//         "Request has been forwarded to maintenance team",
//         "Temporary shuttle with working AC will be deployed",
//         "Report bus number to transport office for priority service"
//       ],
//       officer_brief: "A student complaint has been received regarding shuttle AC not working. It is rated 3/5 in severity and forwarded to the Transport department(s).",
//       status: "Pending"
//     }
//   },
//   {
//     id: "TRN003",
//     category: 'transport',
//     student_view: {
//       complaint: "Cab sharing feature in transport app is not functioning. Unable to find or join rides for weekend trips.",
//       status: "resolved",
//       timestamp: "2025-11-08T18:20:00",
//       departments: ["Transport"],
//       contacts: { "Transport": "transport@iiit-nagpur.ac.in" },
//       severity: 2,
//       institute: "IIIT Nagpur"
//     },
//     admin_view: {
//       departments: ["Transport"],
//       severity: 2,
//       timestamp: "2025-11-08T18:20:00",
//       summary: "Cab sharing feature in app was not functioning",
//       complaint: "Cab sharing feature in transport app is not functioning. Unable to find or join rides for weekend trips.",
//       suggestions: [
//         "App has been updated with bug fixes",
//         "Clear app cache and reinstall if issues persist",
//         "New carpooling features have been added",
//         "Contact transport helpdesk for assistance with bookings"
//       ],
//       officer_brief: "A student complaint was received regarding the cab sharing app feature. It was rated 2/5 in severity.",
//       status: "resolved",
//       admin_notes: "App patch deployed. Feature is now functional.",
//       updated_at: "2025-11-09T10:00:00Z"
//     }
//   },
//   {
//     id: "TRN004",
//     category: 'transport',
//     student_view: {
//       complaint: "Bus driver on Route 5 drives recklessly and overspeeds. Safety concern for all passengers.",
//       status: "in_progress",
//       timestamp: "2025-11-09T16:10:00",
//       departments: ["Transport"],
//       contacts: { "Transport": "transport@iiit-nagpur.ac.in" },
//       severity: 5,
//       institute: "IIIT Nagpur"
//     },
//     admin_view: {
//       departments: ["Transport"],
//       severity: 5,
//       timestamp: "2025-11-09T16:10:00",
//       summary: "Complaint about reckless driving and overspeeding on Route 5",
//       complaint: "Bus driver on Route 5 drives recklessly and overspeeds. Safety concern for all passengers.",
//       suggestions: [
//         "Complaint has been escalated to transport head",
//         "Driver counseling and retraining in progress",
//         "GPS speed monitoring has been activated on all buses",
//         "Report any unsafe driving immediately via emergency helpline"
//       ],
//       officer_brief: "A student complaint has been received regarding reckless driving on Route 5. It is rated 5/5 in severity and forwarded to the Transport department(s).",
//       status: "in_progress",
//       admin_notes: "Driver has been identified and scheduled for a formal warning and retraining.",
//       updated_at: "2025-11-10T09:00:00Z"
//     }
//   },
//   {
//     id: "TRN005",
//     category: 'transport',
//     student_view: {
//       complaint: "No buses available for late-night library users. Last bus leaves at 9 PM but library is open until 11 PM.",
//       status: "Pending",
//       timestamp: "2025-11-10T22:00:00",
//       departments: ["Transport"],
//       contacts: { "Transport": "transport@iiit-nagpur.ac.in" },
//       severity: 3,
//       institute: "IIIT Nagpur"
//     },
//     admin_view: {
//       departments: ["Transport"],
//       severity: 3,
//       timestamp: "2025-11-10T22:00:00",
//       summary: "Request for late-night bus service for library users",
//       complaint: "No buses available for late-night library users. Last bus leaves at 9 PM but library is open until 11 PM.",
//       suggestions: [
//         "Proposal for extended shuttle service is under review",
//         "Security escort service is available - call ext. 9999",
//         "Consider using the cab booking facility for late returns",
//         "Gather support from other students for regular late-night service"
//       ],
//       officer_brief: "A student complaint has been received regarding late-night bus service from the library. It is rated 3/5 in severity and forwarded to the Transport department(s).",
//       status: "Pending"
//     }
//   },
//   {
//     id: "TRN006",
//     category: 'transport',
//     student_view: {
//       complaint: "Monthly bus pass renewal process is too complicated and time-consuming. Online payment gateway keeps failing.",
//       status: "resolved",
//       timestamp: "2025-11-06T10:30:00",
//       departments: ["Transport", "Accounts / Fee Office"],
//       contacts: { "Transport": "transport@iiit-nagpur.ac.in", "Accounts / Fee Office": "accounts@iiit-nagpur.ac.in" },
//       severity: 2,
//       institute: "IIIT Nagpur"
//     },
//     admin_view: {
//       departments: ["Transport", "Accounts / Fee Office"],
//       severity: 2,
//       timestamp: "2025-11-06T10:30:00",
//       summary: "Complicated bus pass renewal process and failing payment gateway",
//       complaint: "Monthly bus pass renewal process is too complicated and time-consuming. Online payment gateway keeps failing.",
//       suggestions: [
//         "Payment gateway has been upgraded and is now stable",
//         "Auto-renewal option is now available in the app",
//         "Multiple payment methods (UPI, Card, Net Banking) supported",
//         "Contact accounts office for payment-related queries"
//       ],
//       officer_brief: "A student complaint was received regarding the bus pass renewal process. It was rated 2/5 in severity.",
//       status: "resolved",
//       admin_notes: "Payment gateway issue resolved in coordination with Accounts. Auto-renewal feature enabled.",
//       updated_at: "2025-11-07T15:00:00Z"
//     }
//   },
//   {
//     id: "TRN007",
//     category: 'transport',
//     student_view: {
//       complaint: "Bus seats are in poor condition with torn cushions and broken armrests. Very uncomfortable for long routes.",
//       status: "in_progress",
//       timestamp: "2025-11-07T12:15:00",
//       departments: ["Transport"],
//       contacts: { "Transport": "transport@iiit-nagpur.ac.in" },
//       severity: 3,
//       institute: "IIIT Nagpur"
//     },
//     admin_view: {
//       departments: ["Transport"],
//       severity: 3,
//       timestamp: "2025-11-07T12:15:00",
//       summary: "Poor condition of bus seats (torn, broken)",
//       complaint: "Bus seats are in poor condition with torn cushions and broken armrests. Very uncomfortable for long routes.",
//     suggestions: [
//         "Bus refurbishment project has been initiated",
//         "Seats replacement scheduled for all buses this month",
//         "Temporary buses with better seating deployed on long routes",
//         "Report specific bus numbers for priority maintenance"
//       ],
//       officer_brief: "A student complaint has been received regarding poor bus seat conditions. It is rated 3/5 in severity.",
//       status: "in_progress",
//       admin_notes: "Vendor has been engaged for seat refurbishment. Work to be completed in phases over 3 weeks.",
//       updated_at: "2025-11-08T11:00:00Z"
//     }
//   }
// ];
let complaintsStore = [];

// Helper function to map departments to frontend categories
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
  // Student login
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

  // Admin login
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

  // Driver login
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

  // Student registration
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

      // Flask AI determines the actual category from departments
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

  // 2. UPDATED getAllComplaints
  getAllComplaints: async () => {
    try {
      // Try to fetch from Node.js server first
      const response = await fetch(`${NODE_API_URL}/api/report`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const realComplaints = await response.json();
        complaintsStore.length = 0;
        complaintsStore.push(...realComplaints);
        return { success: true, data: complaintsStore };
      }
    } catch (error) {
      console.log('Node.js backend not available, falling back to dummy data');
    }

    // Fallback to local store
    return { success: true, data: complaintsStore };
  },

  // Get complaint by ID from Flask backend
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

  // Update complaint status (admin only)
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
      // Fallback to local update
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

  // Get complaints for a student (filter from all complaints)
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

  // Legacy method for compatibility
  createComplaint: async (complaintData) => {
    const complaintText = `${complaintData.title}\n\n${complaintData.description}`;
    return await complaintAPI.submitComplaint(complaintText, complaintData.category);
  },

  // Upload complaint media (placeholder for future implementation)
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

export const rideAPI = {
  // Get all bookings for a student
  getMyBookings: async (studentId) => {
    return {
      success: true,
      data: [
        {
          booking_id: 'B001',
          pickup_location: 'Campus',
          dropoff_location: 'Railway Station',
          required_time: '2025-11-07T08:00:00Z',
          status: 'pending',
          booking_type: 'one_time',
          fixed_fare: 200,
          student_id: studentId
        }
      ]
    };
  },

  // Get all bookings for driver
  getAvailableBookings: async () => {
    return {
      success: true,
      data: [
        {
          booking_id: 'B001',
          pickup_location: 'Campus',
          dropoff_location: 'Railway Station',
          required_time: '2025-11-07T08:00:00Z',
          status: 'pending',
          booking_type: 'one_time',
          fixed_fare: 200,
          student_id: 'student_123'
        },
        {
          booking_id: 'B002',
          pickup_location: 'Airport',
          dropoff_location: 'Campus',
          required_time: '2025-11-10T15:00:00Z',
          status: 'pending',
          booking_type: 'one_time',
          fixed_fare: 500,
          student_id: 'student_456'
        }
      ]
    };
  },

  // Create new booking
  createBooking: async (bookingData) => {
    return {
      success: true,
      data: {
        booking_id: 'B_' + Date.now(),
        ...bookingData,
        status: 'pending'
      }
    };
  },

  // Accept booking (driver)
  acceptBooking: async (bookingId, driverId) => {
    return {
      success: true,
      data: {
        booking_id: bookingId,
        status: 'accepted',
        driver_id: driverId
      }
    };
  },

  // Cancel booking
  cancelBooking: async (bookingId) => {
    return {
      success: true,
      data: {
        booking_id: bookingId,
        status: 'cancelled'
      }
    };
  }
};

// ==================== RIDE BID APIs ====================

export const bidAPI = {
  // Get bids for a booking
  getBidsForBooking: async (bookingId) => {
    return {
      success: true,
      data: [
        {
          bid_id: 'BID001',
          booking_id: bookingId,
          driver_id: 'driver_123',
          proposed_fare: 180,
          bid_status: 'proposed'
        }
      ]
    };
  },

  // Place a bid (driver)
  placeBid: async (bookingId, driverId, proposedFare) => {
    return {
      success: true,
      data: {
        bid_id: 'BID_' + Date.now(),
        booking_id: bookingId,
        driver_id: driverId,
        proposed_fare: proposedFare,
        bid_status: 'proposed'
      }
    };
  },

  // Accept bid (student)
  acceptBid: async (bidId) => {
    return {
      success: true,
      data: {
        bid_id: bidId,
        bid_status: 'accepted'
      }
    };
  }
};

// ==================== DEPARTMENT APIs ====================

export const departmentAPI = {
  // Get all departments
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
  // Get schedules by department
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

  // Update schedule
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
  // Upload mess timetable (admin only)
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

  // Get current mess timetable
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

  // Delete mess timetable (admin only)
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
  // Get driver profile
  getDriverProfile: async (driverId) => {
    return {
      success: true,
      data: {
        driver_id: driverId,
        vehicle_model: 'Toyota Innova',
        vehicle_number: 'MH 12 AB 1234',
        license_details: 'DL1234567890'
      }
    };
  },

  // Update driver availability
  updateAvailability: async (driverId, isOnline, latitude = null, longitude = null) => {
    return {
      success: true,
      data: {
        avail_id: 'AVAIL_' + Date.now(),
        driver_id: driverId,
        is_online: isOnline,
        current_latitude: latitude,
        current_longitude: longitude
      }
    };
  },

  // Get driver statistics
  getDriverStats: async (driverId) => {
    return {
      success: true,
      data: {
        total_rides: 142,
        pending_requests: 5,
        confirmed_today: 3,
        rating: 4.7
      }
    };
  }
};

// ==================== USER APIs ====================

export const userAPI = {
  // Get user by ID
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

  // Update user profile
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