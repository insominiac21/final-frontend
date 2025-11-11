/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import Navbar from '../../components/shared/Navbar';
import Footer from '../../components/shared/Footer';
import Modal from '../../components/shared/Modal';
import { rideAPI, bidAPI, driverAPI } from '../../services/api';

const DriverDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState('requests');
  const [pendingBookings, setPendingBookings] = useState([]);
  const [confirmedBookings, setConfirmedBookings] = useState([]);
  const [completedBookings, setCompletedBookings] = useState([]);
  const [stats, setStats] = useState({
    totalRides: 0,
    pendingRequests: 0,
    confirmedToday: 0,
    acceptedRides: 0,
    rating: 0,
  });
  const [showBidModal, setShowBidModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [bidAmount, setBidAmount] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadBookings();
    loadStats();
  }, [user]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      // Get all available bookings for drivers
      const availableResponse = await rideAPI.getAvailableBookings();
      if (availableResponse.success) {
        setPendingBookings(availableResponse.data);
      }

      // Get confirmed bookings for this driver
      const currentDriverId = user?.user_id || 'DRV001'; // Default to first driver if not logged in
      
      const confirmedResponse = await driverAPI.getDriverBookings(currentDriverId, 'accepted');
      if (confirmedResponse.success) {
        setConfirmedBookings(confirmedResponse.data);
      }

      const completedResponse = await driverAPI.getDriverBookings(currentDriverId, 'completed');
      if (completedResponse.success) {
        setCompletedBookings(completedResponse.data);
      }
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const currentDriverId = user?.user_id || 'DRV001'; // Default to first driver if not logged in
      
      const response = await driverAPI.getDriverStats(currentDriverId);
      if (response.success) {
        setStats(response.data);
      } else {
        // If no stats, set defaults
        setStats({
          totalRides: 0,
          pendingRequests: 0,
          confirmedToday: 0,
          acceptedRides: 0,
          rating: 4.5, // Default rating
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
      // Set default stats on error
      setStats({
        totalRides: 0,
        pendingRequests: 0,
        confirmedToday: 0,
        acceptedRides: 0,
        rating: 4.5,
      });
    }
  };

  const handleAcceptBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to accept this booking at the fixed fare?')) return;

    // Get the current driver ID - use logged in user or a guest driver ID
    const currentDriverId = user?.user_id || 'DRV001'; // Default to first driver if not logged in

    try {
      setLoading(true);
      console.log('Driver accepting booking:', { bookingId, driverId: currentDriverId });
      
      const response = await rideAPI.acceptBooking(bookingId, currentDriverId);
      
      if (response.success) {
        alert('Booking accepted successfully!');
        await loadBookings();
        await loadStats();
      } else {
        alert('Failed to accept booking: ' + response.error);
      }
    } catch (error) {
      console.error('Error accepting booking:', error);
      alert('Failed to accept booking: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceBid = async (e) => {
    e.preventDefault();

    // Get the current driver ID - use logged in user or a guest driver ID
    const currentDriverId = user?.user_id || 'DRV001'; // Default to first driver if not logged in

    try {
      setLoading(true);
      console.log('Driver placing bid:', { bookingId: selectedBooking, driverId: currentDriverId, amount: bidAmount });
      
      const response = await bidAPI.placeBid(selectedBooking, currentDriverId, parseFloat(bidAmount));
      
      if (response.success) {
        alert('Bid placed successfully! The student will review all bids.');
        setShowBidModal(false);
        setBidAmount('');
        setSelectedBooking(null);
        await loadBookings();
      } else {
        alert('Failed to place bid: ' + response.error);
      }
    } catch (error) {
      console.error('Error placing bid:', error);
      alert('Failed to place bid: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const openBidModal = (booking) => {
    setSelectedBooking(booking.booking_id);
    setBidAmount(booking.fixed_fare || '');
    setShowBidModal(true);
  };

  const handleCompleteRide = async (bookingId) => {
    if (!window.confirm('Mark this ride as completed?')) return;

    try {
      setLoading(true);
      const response = await rideAPI.completeBooking(bookingId);
      if (response.success) {
        alert('Ride completed successfully!');
        loadBookings();
        loadStats();
      } else {
        alert('Failed to complete ride: ' + response.error);
      }
    } catch (error) {
      console.error('Error completing ride:', error);
      alert('Failed to complete ride');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateTimeString) => {
    const date = new Date(dateTimeString);
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };
  };

  return (
    <>
      <Navbar />
      <div className="dashboard-container">
        <div className="dashboard-content">
          <div className="dashboard-header">
            <h1>Driver Dashboard</h1>
            <p>Manage booking requests and confirmed rides</p>
          </div>

          {/* Statistics */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1.5rem',
              marginBottom: '2rem',
            }}
          >
            <div
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                padding: '1.5rem',
                borderRadius: 'var(--radius)',
                color: 'white',
                textAlign: 'center',
              }}
            >
              <i className="fas fa-clipboard-list" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}></i>
              <h3 style={{ margin: '0.5rem 0' }}>Pending Requests</h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>{stats.pendingRequests}</p>
            </div>
            <div
              style={{
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                padding: '1.5rem',
                borderRadius: 'var(--radius)',
                color: 'white',
                textAlign: 'center',
              }}
            >
              <i className="fas fa-check-circle" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}></i>
              <h3 style={{ margin: '0.5rem 0' }}>Confirmed Today</h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>{stats.confirmedToday}</p>
            </div>
            <div
              style={{
                background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                padding: '1.5rem',
                borderRadius: 'var(--radius)',
                color: 'white',
                textAlign: 'center',
              }}
            >
              <i className="fas fa-history" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}></i>
              <h3 style={{ margin: '0.5rem 0' }}>Total Completed</h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>{stats.totalRides}</p>
            </div>
            <div
              style={{
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                padding: '1.5rem',
                borderRadius: 'var(--radius)',
                color: 'white',
                textAlign: 'center',
              }}
            >
              <i className="fas fa-star" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}></i>
              <h3 style={{ margin: '0.5rem 0' }}>Your Rating</h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>{stats.rating} ⭐</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="tabs">
            <button
              className={`tab ${activeTab === 'requests' ? 'active' : ''}`}
              onClick={() => setActiveTab('requests')}
            >
              <i className="fas fa-inbox"></i> New Requests
            </button>
            <button
              className={`tab ${activeTab === 'confirmed' ? 'active' : ''}`}
              onClick={() => setActiveTab('confirmed')}
            >
              <i className="fas fa-check-double"></i> Confirmed Bookings
            </button>
            <button
              className={`tab ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              <i className="fas fa-history"></i> History
            </button>
          </div>

          {/* New Requests Tab */}
          {activeTab === 'requests' && (
            <div className="tab-content active">
              <div className="content-card">
                <h2>
                  <i className="fas fa-bell"></i> Pending Booking Requests
                </h2>
                
                {loading ? (
                  <p style={{ textAlign: 'center', padding: '2rem' }}>Loading...</p>
                ) : pendingBookings.length === 0 ? (
                  <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                    No pending requests
                  </p>
                ) : (
                  <div className="ride-list">
                    {pendingBookings.map((booking) => {
                      const { date, time } = formatDateTime(booking.required_time);
                      return (
                        <div key={booking.booking_id} className="ride-card">
                          <div className="ride-header">
                            <div>
                              <strong>Booking {booking.booking_id}</strong>
                              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                Student: {booking.student_id}
                              </p>
                            </div>
                            <span className="status-badge pending">New</span>
                          </div>
                          <div className="ride-route">
                            <span>
                              <i className="fas fa-map-marker-alt"></i> {booking.pickup_location}
                            </span>
                            <i className="fas fa-arrow-right"></i>
                            <span>
                              <i className="fas fa-map-marker-alt"></i> {booking.dropoff_location}
                            </span>
                          </div>
                          <div className="ride-details">
                            <div className="ride-detail">
                              <i className="fas fa-calendar"></i> {date}
                            </div>
                            <div className="ride-detail">
                              <i className="fas fa-clock"></i> {time}
                            </div>
                            <div className="ride-detail">
                              <i className="fas fa-chair"></i> {booking.seats_required} seats
                            </div>
                            <div className="ride-detail">
                              <i className="fas fa-rupee-sign"></i> Max Fare: ₹{booking.fixed_fare || 'N/A'}
                            </div>
                            <div className="ride-detail">
                              <i className="fas fa-redo"></i> {booking.booking_type === 'regular' ? 'Regular' : 'One-time'}
                            </div>
                          </div>
                          <div className="flex-between mt-2">
                            <button
                              className="btn btn-success"
                              onClick={() => handleAcceptBooking(booking.booking_id)}
                              disabled={loading}
                            >
                              <i className="fas fa-check"></i> Accept at Fixed Fare
                            </button>
                            <button
                              className="btn btn-warning"
                              onClick={() => openBidModal(booking)}
                              disabled={loading}
                            >
                              <i className="fas fa-hand-holding-usd"></i> Place Bid
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Confirmed Bookings Tab */}
          {activeTab === 'confirmed' && (
            <div className="tab-content active">
              <div className="content-card">
                <h2>
                  <i className="fas fa-check-circle"></i> Your Confirmed Bookings
                </h2>
                
                {loading ? (
                  <p style={{ textAlign: 'center', padding: '2rem' }}>Loading...</p>
                ) : confirmedBookings.length === 0 ? (
                  <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                    No confirmed bookings
                  </p>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>Booking ID</th>
                        <th>Student</th>
                        <th>Route</th>
                        <th>Date & Time</th>
                        <th>Fare</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {confirmedBookings.map((booking) => {
                        const { date, time } = formatDateTime(booking.required_time);
                        return (
                          <tr key={booking.booking_id}>
                            <td>{booking.booking_id}</td>
                            <td>{booking.student_id}</td>
                            <td>
                              {booking.pickup_location} → {booking.dropoff_location}
                            </td>
                            <td>{date} {time}</td>
                            <td>₹{booking.fixed_fare}</td>
                            <td>
                              <button
                                className="btn btn-success"
                                style={{ padding: '0.3rem 0.8rem', fontSize: '0.85rem' }}
                                onClick={() => handleCompleteRide(booking.booking_id)}
                                disabled={loading}
                              >
                                Complete
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="tab-content active">
              <div className="content-card">
                <h2>
                  <i className="fas fa-history"></i> Ride History
                </h2>
                
                {loading ? (
                  <p style={{ textAlign: 'center', padding: '2rem' }}>Loading...</p>
                ) : completedBookings.length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)' }}>No completed rides yet</p>
                ) : (
                  <table>
                    <thead>
                      <tr>
                        <th>Booking ID</th>
                        <th>Student</th>
                        <th>Route</th>
                        <th>Date & Time</th>
                        <th>Fare</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {completedBookings.map((booking) => {
                        const { date, time } = formatDateTime(booking.required_time);
                        return (
                          <tr key={booking.booking_id}>
                            <td>{booking.booking_id}</td>
                            <td>{booking.student_id}</td>
                            <td>
                              {booking.pickup_location} → {booking.dropoff_location}
                            </td>
                            <td>{date} {time}</td>
                            <td>₹{booking.fixed_fare}</td>
                            <td>
                              <span className="status-badge resolved">Completed</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bid Modal */}
      <Modal
        isOpen={showBidModal}
        onClose={() => {
          setShowBidModal(false);
          setSelectedBooking(null);
          setBidAmount('');
        }}
        title={<><i className="fas fa-hand-holding-usd"></i> Place Your Bid</>}
      >
        <form onSubmit={handlePlaceBid}>
          {selectedBooking && (
            <div className="alert alert-info" style={{ marginBottom: '1rem' }}>
              <strong>Student&apos;s Maximum Fare:</strong> ₹{
                pendingBookings.find(b => b.booking_id === selectedBooking)?.fixed_fare || 'N/A'
              }
            </div>
          )}

          <div className="form-group">
            <label htmlFor="bidAmount">Your Proposed Fare (₹) *</label>
            <input
              type="number"
              id="bidAmount"
              placeholder="Enter your fare"
              min="0"
              step="0.01"
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              required
            />
          </div>

          <div className="alert alert-info">
            <i className="fas fa-info-circle"></i>
            <span>The student will review all bids and choose the best option.</span>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            <i className="fas fa-check"></i> {loading ? 'Submitting...' : 'Submit Bid'}
          </button>
        </form>
      </Modal>

      <Footer />
    </>
  );
};

export default DriverDashboard;
