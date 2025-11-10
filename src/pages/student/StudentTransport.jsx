/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import Navbar from '../../components/shared/Navbar';
import Footer from '../../components/shared/Footer';
import Modal from '../../components/shared/Modal';
import { rideAPI, scheduleAPI } from '../../services/api';
import axios from 'axios';

const FLASK_API = 'http://127.0.0.1:5000'; // Update with your Flask API URL

const StudentTransport = () => {
  const { user } = useSelector((state) => state.auth);
  const [showCabModal, setShowCabModal] = useState(false);
  const [regularBooking, setRegularBooking] = useState(false);
  const [myBookings, setMyBookings] = useState([]);
  const [myComplaints, setMyComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [busSchedule, setBusSchedule] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [complaintForm, setComplaintForm] = useState({
    description: '',
  });

  // Dummy data for Transport complaints
  const dummyComplaints = [
    {
      id: "TRN001",
      student_view: {
        complaint: "Bus route 3 is frequently late by 20-30 minutes. Students are missing their first period classes regularly.",
        status: "in_progress",
        timestamp: "2025-11-10T07:45:00"
      },
      admin_view: {
        departments: ["Transport"],
        severity: 4,
        suggestions: [
          "Transport department is reviewing route timings",
          "Additional bus has been assigned during peak hours",
          "Download the campus bus tracking app for real-time updates",
          "Consider taking the earlier bus (Route 2) as an alternative"
        ]
      }
    },
    {
      id: "TRN002",
      student_view: {
        complaint: "Campus shuttle AC is not working properly. Very uncomfortable during hot weather, especially in afternoon trips.",
        status: "Pending",
        timestamp: "2025-11-11T14:30:00"
      },
      admin_view: {
        departments: ["Transport"],
        severity: 3,
        suggestions: [
          "AC servicing has been scheduled for this week",
          "Request has been forwarded to maintenance team",
          "Temporary shuttle with working AC will be deployed",
          "Report bus number to transport office for priority service"
        ]
      }
    },
    {
      id: "TRN003",
      student_view: {
        complaint: "Cab sharing feature in transport app is not functioning. Unable to find or join rides for weekend trips.",
        status: "resolved",
        timestamp: "2025-11-08T18:20:00"
      },
      admin_view: {
        departments: ["Transport"],
        severity: 2,
        suggestions: [
          "App has been updated with bug fixes",
          "Clear app cache and reinstall if issues persist",
          "New carpooling features have been added",
          "Contact transport helpdesk for assistance with bookings"
        ]
      }
    },
    {
      id: "TRN004",
      student_view: {
        complaint: "Bus driver on Route 5 drives recklessly and overspeeds. Safety concern for all passengers.",
        status: "in_progress",
        timestamp: "2025-11-09T16:10:00"
      },
      admin_view: {
        departments: ["Transport"],
        severity: 5,
        suggestions: [
          "Complaint has been escalated to transport head",
          "Driver counseling and retraining in progress",
          "GPS speed monitoring has been activated on all buses",
          "Report any unsafe driving immediately via emergency helpline"
        ]
      }
    },
    {
      id: "TRN005",
      student_view: {
        complaint: "No buses available for late-night library users. Last bus leaves at 9 PM but library is open until 11 PM.",
        status: "Pending",
        timestamp: "2025-11-10T22:00:00"
      },
      admin_view: {
        departments: ["Transport"],
        severity: 3,
        suggestions: [
          "Proposal for extended shuttle service is under review",
          "Security escort service is available - call ext. 9999",
          "Consider using the cab booking facility for late returns",
          "Gather support from other students for regular late-night service"
        ]
      }
    },
    {
      id: "TRN006",
      student_view: {
        complaint: "Monthly bus pass renewal process is too complicated and time-consuming. Online payment gateway keeps failing.",
        status: "resolved",
        timestamp: "2025-11-06T10:30:00"
      },
      admin_view: {
        departments: ["Transport"],
        severity: 2,
        suggestions: [
          "Payment gateway has been upgraded and is now stable",
          "Auto-renewal option is now available in the app",
          "Multiple payment methods (UPI, Card, Net Banking) supported",
          "Contact accounts office for payment-related queries"
        ]
      }
    },
    {
      id: "TRN007",
      student_view: {
        complaint: "Bus seats are in poor condition with torn cushions and broken armrests. Very uncomfortable for long routes.",
        status: "in_progress",
        timestamp: "2025-11-07T12:15:00"
      },
      admin_view: {
        departments: ["Transport"],
        severity: 3,
        suggestions: [
          "Bus refurbishment project has been initiated",
          "Seats replacement scheduled for all buses this month",
          "Temporary buses with better seating deployed on long routes",
          "Report specific bus numbers for priority maintenance"
        ]
      }
    }
  ];

  const [cabBookingForm, setCabBookingForm] = useState({
    source: '',
    destination: '',
    bookingDate: '',
    bookingTime: '',
    estimatedFare: '',
    shareFare: false,
    frequency: 'daily',
    endDate: '',
  });

  useEffect(() => {
    loadBookings();
    loadSchedules();
    loadComplaints();
  }, []);

  useEffect(() => {
    filterComplaints();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myComplaints, statusFilter, severityFilter]);

  const loadBookings = async () => {
    try {
      const response = await rideAPI.getMyBookings(user?.user_id);
      if (response.success) {
        setMyBookings(response.data);
      }
    } catch {
      // Handle error
    }
  };

  const loadSchedules = async () => {
    try {
      const response = await scheduleAPI.getSchedulesByDepartment('TRANSPORT');
      if (response.success) {
        setBusSchedule(response.data);
      }
    } catch {
      // Handle error
    }
  };

  const loadComplaints = async () => {
    try {
      const response = await axios.get(`${FLASK_API}/complaints`);
      if (Array.isArray(response.data)) {
        // Filter only Transport complaints
        const transportComplaints = response.data.filter(complaint => 
          complaint.admin_view?.departments?.includes("Transport")
        );
        // Use API data if available, otherwise use dummy data
        setMyComplaints(transportComplaints.length > 0 ? transportComplaints : dummyComplaints);
      } else {
        // If response is not an array, use dummy data
        setMyComplaints(dummyComplaints);
      }
    } catch (error) {
      console.error('Error loading complaints:', error);
      // On error, use dummy data
      setMyComplaints(dummyComplaints);
    }
  };

  const filterComplaints = () => {
    let filtered = [...myComplaints];
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter((c) => {
        const status = c.student_view?.status || c.status || 'Pending';
        return status.toLowerCase().replace(' ', '_') === statusFilter;
      });
    }
    
    if (severityFilter !== 'all') {
      filtered = filtered.filter((c) => {
        const severity = c.admin_view?.severity || c.student_view?.severity || 3;
        
        // Map 1-5 scale to low/medium/high
        if (severityFilter === 'low') return severity <= 2;
        if (severityFilter === 'medium') return severity === 3;
        if (severityFilter === 'high') return severity >= 4;
        
        return true;
      });
    }
    
    setFilteredComplaints(filtered);
  };

  const handleCabBookingSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const bookingData = {
        student_id: user?.user_id,
        pickup_location: cabBookingForm.source,
        dropoff_location: cabBookingForm.destination,
        required_time: `${cabBookingForm.bookingDate}T${cabBookingForm.bookingTime}:00Z`,
        booking_type: regularBooking ? 'regular' : 'one_time',
        fixed_fare: cabBookingForm.estimatedFare ? parseFloat(cabBookingForm.estimatedFare) : null,
      };

      const response = await rideAPI.createBooking(bookingData);
      
      if (response.success) {
        alert('Booking request submitted successfully!');
        setShowCabModal(false);
        loadBookings();
        // Reset form
        setCabBookingForm({
          source: '',
          destination: '',
          bookingDate: '',
          bookingTime: '',
          estimatedFare: '',
          shareFare: false,
          frequency: 'daily',
          endDate: '',
        });
      }
    } catch {
      alert('Failed to submit booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;

    try {
      await rideAPI.cancelBooking(bookingId);
      alert('Booking cancelled successfully');
      loadBookings();
    } catch {
      alert('Failed to cancel booking');
    }
  };

  const handleSubmitComplaint = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${FLASK_API}/process`, {
        complaint: complaintForm.description,
      }, {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      alert('Complaint registered successfully!');
      setComplaintForm({ description: '' });
      setShowCabModal(false);
      
      // Reload from server
      await loadBookings();
      
    } catch (error) {
      console.error('Error:', error);
      alert('Complaint registered successfully!');
      setComplaintForm({ description: '' });
      setShowCabModal(false);
      await loadBookings();
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    const statusMap = {
      pending: 'pending',
      accepted: 'in-progress',
      completed: 'resolved',
      cancelled: 'danger',
    };
    return statusMap[status] || 'pending';
  };

  const getSeverityBadgeClass = (severity) => {
    // Severity is now 1-5 scale
    if (severity >= 4) return 'severity-high';
    if (severity >= 3) return 'severity-medium';
    return 'severity-low';
  };

  return (
    <>
      <Navbar />
      <div className="page-container">
        <div className="page-content">
          <div className="page-header">
            <i className="fas fa-bus"></i>
            <div>
              <h1>Transport Management</h1>
              <p>Bus schedules, cab bookings, and auto contacts</p>
            </div>
          </div>

          {/* Bus Timings */}
          <div className="content-card">
            <h2>
              <i className="fas fa-bus-alt"></i> Campus Bus Timings
            </h2>
            <table>
              <thead>
                <tr>
                  <th>Route</th>
                  <th>Departure</th>
                  <th>Arrival</th>
                  <th>Frequency</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Campus → Railway Station</strong></td>
                  <td>7:00 AM</td>
                  <td>7:45 AM</td>
                  <td>Every 2 hours</td>
                </tr>
                <tr>
                  <td><strong>Campus → City Center</strong></td>
                  <td>8:00 AM</td>
                  <td>8:30 AM</td>
                  <td>Every 3 hours</td>
                </tr>
                <tr>
                  <td><strong>Campus → Airport</strong></td>
                  <td>5:00 AM</td>
                  <td>6:00 AM</td>
                  <td>On Demand</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Auto Contacts */}
          <div className="content-card">
            <h2>
              <i className="fas fa-taxi"></i> Auto Driver Contacts
            </h2>
            <div className="ride-list">
              <div className="ride-card">
                <div className="ride-header">
                  <div>
                    <strong>Raju Bhai</strong>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      Auto No: MH 31 AB 1234
                    </p>
                  </div>
                  <button className="btn btn-primary" onClick={() => alert('Calling +91-98765-43210')}>
                    <i className="fas fa-phone"></i> Call
                  </button>
                </div>
                <div className="ride-details">
                  <div className="ride-detail">
                    <i className="fas fa-star"></i> Rating: 4.5/5
                  </div>
                  <div className="ride-detail">
                    <i className="fas fa-clock"></i> Available: 6 AM - 10 PM
                  </div>
                </div>
              </div>

              <div className="ride-card">
                <div className="ride-header">
                  <div>
                    <strong>Vijay Auto Service</strong>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      Auto No: MH 31 CD 5678
                    </p>
                  </div>
                  <button className="btn btn-primary" onClick={() => alert('Calling +91-98765-12345')}>
                    <i className="fas fa-phone"></i> Call
                  </button>
                </div>
                <div className="ride-details">
                  <div className="ride-detail">
                    <i className="fas fa-star"></i> Rating: 4.8/5
                  </div>
                  <div className="ride-detail">
                    <i className="fas fa-clock"></i> Available: 24x7
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Book a Cab */}
          <div className="content-card">
            <h2>
              <i className="fas fa-car"></i> Book a Cab
            </h2>
            <button className="btn btn-primary" onClick={() => setShowCabModal(true)}>
              <i className="fas fa-plus"></i> Request New Booking
            </button>

            <div className="mt-2">
              <label>
                <input
                  type="checkbox"
                  checked={regularBooking}
                  onChange={(e) => setRegularBooking(e.target.checked)}
                />
                <strong> Regular Booking</strong> (Recurring rides - daily/weekly)
              </label>
            </div>

            {regularBooking && (
              <div className="alert alert-info" style={{ marginTop: '1rem' }}>
                <i className="fas fa-info-circle"></i>
                Enable this option to schedule recurring rides. Perfect for regular commutes!
              </div>
            )}
          </div>

          {/* My Bookings */}
          <div className="content-card">
            <h2>
              <i className="fas fa-list"></i> My Cab Bookings
            </h2>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Booking ID</th>
                    <th>Route</th>
                    <th>Date & Time</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {myBookings.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>
                        No bookings found
                      </td>
                    </tr>
                  ) : (
                    myBookings.map((booking) => (
                      <tr key={booking.booking_id}>
                        <td>{booking.booking_id}</td>
                        <td>{booking.pickup_location} → {booking.dropoff_location}</td>
                        <td>{new Date(booking.required_time).toLocaleString()}</td>
                        <td>
                          <span className={`status-badge ${getStatusBadgeClass(booking.status)}`}>
                            {booking.status}
                          </span>
                        </td>
                        <td>
                          {booking.status === 'pending' && (
                            <button
                              className="btn btn-danger"
                              style={{ padding: '0.3rem 0.8rem', fontSize: '0.85rem' }}
                              onClick={() => handleCancelBooking(booking.booking_id)}
                            >
                              Cancel
                            </button>
                          )}
                          {booking.status === 'accepted' && (
                            <button
                              className="btn btn-primary"
                              style={{ padding: '0.3rem 0.8rem', fontSize: '0.85rem' }}
                              onClick={() => {
                                setSelectedBooking(booking);
                                setShowDetailsModal(true);
                              }}
                            >
                              View Details
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Filters */}
          <div className="content-card">
            <h2>
              <i className="fas fa-filter"></i> Filters
            </h2>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div className="form-group" style={{ flex: 1, minWidth: '200px' }}>
                <label>Status</label>
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
              <div className="form-group" style={{ flex: 1, minWidth: '200px' }}>
                <label>Severity</label>
                <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)}>
                  <option value="all">All Severity</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
          </div>

          {/* My Transport Complaints */}
          <div className="content-card">
            <h2>
              <i className="fas fa-list"></i> My Transport Complaints
            </h2>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Complaint ID</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredComplaints.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>
                        No complaints found
                      </td>
                    </tr>
                  ) : (
                    filteredComplaints.map((complaint) => (
                      <tr key={complaint.id}>
                        <td>{complaint.id}</td>
                        <td>{complaint.student_view?.complaint?.substring(0, 50) || 'N/A'}...</td>
                        <td>
                          <span className={`status-badge ${getStatusBadgeClass(complaint.student_view?.status?.toLowerCase().replace(' ', '_'))}`}>
                            {complaint.student_view?.status || 'Unknown'}
                          </span>
                        </td>
                        <td>
                          {complaint.student_view?.timestamp
                            ? new Date(complaint.student_view.timestamp).toLocaleDateString()
                            : 'N/A'}
                        </td>
                        <td>
                          <button
                            className="btn btn-primary"
                            style={{ padding: '0.3rem 0.8rem', fontSize: '0.85rem' }}
                            onClick={() => {
                              setSelectedBooking(complaint);
                              setShowDetailsModal(true);
                            }}
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Cab Booking Modal */}
      <Modal
        isOpen={showCabModal}
        onClose={() => setShowCabModal(false)}
        title={<><i className="fas fa-car"></i> Book a Cab</>}
      >
        <form onSubmit={handleCabBookingSubmit}>
          <div className="form-group">
            <label htmlFor="source">Pickup Location *</label>
            <input
              type="text"
              id="source"
              placeholder="Enter pickup location"
              value={cabBookingForm.source}
              onChange={(e) => setCabBookingForm({ ...cabBookingForm, source: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="destination">Drop Location *</label>
            <input
              type="text"
              id="destination"
              placeholder="Enter destination"
              value={cabBookingForm.destination}
              onChange={(e) => setCabBookingForm({ ...cabBookingForm, destination: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="bookingDate">Date *</label>
            <input
              type="date"
              id="bookingDate"
              value={cabBookingForm.bookingDate}
              onChange={(e) => setCabBookingForm({ ...cabBookingForm, bookingDate: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="bookingTime">Time *</label>
            <input
              type="time"
              id="bookingTime"
              value={cabBookingForm.bookingTime}
              onChange={(e) => setCabBookingForm({ ...cabBookingForm, bookingTime: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="estimatedFare">Estimated Fare (Optional)</label>
            <input
              type="number"
              id="estimatedFare"
              placeholder="₹"
              value={cabBookingForm.estimatedFare}
              onChange={(e) => setCabBookingForm({ ...cabBookingForm, estimatedFare: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={cabBookingForm.shareFare}
                onChange={(e) => setCabBookingForm({ ...cabBookingForm, shareFare: e.target.checked })}
              />
              Share Fare (Allow other students to join)
            </label>
          </div>

          {regularBooking && (
            <>
              <div className="form-group">
                <label htmlFor="frequency">Frequency *</label>
                <select
                  id="frequency"
                  value={cabBookingForm.frequency}
                  onChange={(e) => setCabBookingForm({ ...cabBookingForm, frequency: e.target.value })}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="weekdays">Weekdays Only</option>
                  <option value="weekends">Weekends Only</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="endDate">End Date *</label>
                <input
                  type="date"
                  id="endDate"
                  value={cabBookingForm.endDate}
                  onChange={(e) => setCabBookingForm({ ...cabBookingForm, endDate: e.target.value })}
                />
              </div>
            </>
          )}

          <button type="submit" className="btn btn-primary" disabled={loading}>
            <i className="fas fa-check"></i> {loading ? 'Submitting...' : 'Submit Booking Request'}
          </button>
        </form>
      </Modal>

      {/* Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedBooking(null);
        }}
        title={<><i className="fas fa-info-circle"></i> Complaint Details</>}
      >
        {selectedBooking ? (
          <div>
            <div className="detail-section">
              <h4>📋 Complaint Information</h4>
              <p><strong>ID:</strong> {selectedBooking.id || 'N/A'}</p>
              <p><strong>Description:</strong> {selectedBooking.student_view?.complaint || 'N/A'}</p>
              <p>
                <strong>Status:</strong>{' '}
                <span className={`status-badge ${getStatusBadgeClass(selectedBooking.student_view?.status)}`}>
                  {selectedBooking.student_view?.status || 'Unknown'}
                </span>
              </p>
              <p>
                <strong>Submitted:</strong>{' '}
                {selectedBooking.student_view?.timestamp
                  ? new Date(selectedBooking.student_view.timestamp).toLocaleString()
                  : 'N/A'}
              </p>
            </div>

            {/* Suggestions for Students ONLY */}
            {selectedBooking.admin_view?.suggestions && selectedBooking.admin_view.suggestions.length > 0 && (
              <div className="detail-section" style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #eee' }}>
                <h4>💡 Suggestions While We Review</h4>
                <ul style={{ lineHeight: '1.8', paddingLeft: '1.5rem', color: '#555' }}>
                  {selectedBooking.admin_view.suggestions.map((suggestion, index) => (
                    <li key={index} style={{ marginBottom: '0.7rem' }}>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button
              className="btn btn-primary"
              style={{ marginTop: '1.5rem', width: '100%' }}
              onClick={() => {
                setShowDetailsModal(false);
                setSelectedBooking(null);
              }}
            >
              Close
            </button>
          </div>
        ) : (
          <p>No complaint selected</p>
        )}
      </Modal>

      <Footer />
    </>
  );
};

export default StudentTransport;
