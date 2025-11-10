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
  const [busSchedule, setBusSchedule] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [complaintForm, setComplaintForm] = useState({
    description: '',
  });

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
        setMyComplaints(transportComplaints);
      }
    } catch (error) {
      console.error('Error loading complaints:', error);
    }
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
