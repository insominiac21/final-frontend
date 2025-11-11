/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import Navbar from '../../components/shared/Navbar';
import Footer from '../../components/shared/Footer';
import Modal from '../../components/shared/Modal';
import { rideAPI, bidAPI, driverAPI } from '../../services/api';

const StudentCarpool = () => {
  const { user } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState('available');
  const [showPostRideModal, setShowPostRideModal] = useState(false);
  const [showBidsModal, setShowBidsModal] = useState(false);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [bids, setBids] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [filterSource, setFilterSource] = useState('');
  const [filterDest, setFilterDest] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [loading, setLoading] = useState(false);

  const [rideForm, setRideForm] = useState({
    source: '',
    destination: '',
    date: '',
    time: '',
    seats: '',
    farePerPerson: '',
    recurring: false,
    frequency: 'daily',
  });

  const [availableRides, setAvailableRides] = useState([]);
  const [myPostedRides, setMyPostedRides] = useState([]);
  const [myJoinedRides, setMyJoinedRides] = useState([]);

  useEffect(() => {
    loadAvailableRides();
    loadMyRides();
  }, [user]);

  const loadAvailableRides = async () => {
    try {
      setLoading(true);
      const response = await rideAPI.getAllBookings();
      if (response.success) {
        // Show all pending and accepted rides (no user filtering for now)
        const rides = response.data.filter(
          r => (r.status === 'pending' || r.status === 'accepted')
        );
        setAvailableRides(rides);
      }
    } catch (error) {
      console.error('Error loading available rides:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMyRides = async () => {
    try {
      // For now, without login, just get all bookings
      // Later this will filter by user?.user_id
      const studentId = user?.user_id || 'guest_student';
      
      // Load rides I posted
      const postedResponse = await rideAPI.getMyBookings(studentId);
      if (postedResponse.success) {
        setMyPostedRides(postedResponse.data);
      }

      // Load rides I joined
      const joinedResponse = await rideAPI.getJoinedRides(studentId);
      if (joinedResponse.success) {
        setMyJoinedRides(joinedResponse.data);
      }
    } catch (error) {
      console.error('Error loading my rides:', error);
    }
  };

  const handlePostRide = async (e) => {
    e.preventDefault();
    
    const studentId = user?.user_id || 'guest_student';

    try {
      setLoading(true);
      const bookingData = {
        pickup_location: rideForm.source,
        dropoff_location: rideForm.destination,
        required_time: `${rideForm.date}T${rideForm.time}:00`,
        booking_type: rideForm.recurring ? 'regular' : 'one_time',
        fixed_fare: parseFloat(rideForm.farePerPerson),
        student_id: studentId,
        seats_required: parseInt(rideForm.seats),
      };

      console.log('Creating booking:', bookingData);
      const response = await rideAPI.createBooking(bookingData);
      
      if (response.success) {
        alert('Ride posted successfully! Drivers will place bids on your ride.');
        setShowPostRideModal(false);
        setRideForm({
          source: '',
          destination: '',
          date: '',
          time: '',
          seats: '',
          farePerPerson: '',
          recurring: false,
          frequency: 'daily',
        });
        // Reload both lists
        await loadMyRides();
        await loadAvailableRides();
      } else {
        alert('Failed to post ride: ' + response.error);
      }
    } catch (error) {
      console.error('Error posting ride:', error);
      alert('Failed to post ride');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRide = async (booking) => {
    const studentId = user?.user_id || 'guest_student';

    if (!window.confirm(`Join this ride from ${booking.pickup_location} to ${booking.dropoff_location}?`)) {
      return;
    }

    try {
      setLoading(true);
      const response = await rideAPI.joinRide(booking.booking_id, studentId);
      
      if (response.success) {
        alert('Successfully joined the ride!');
        await loadMyRides();
        await loadAvailableRides();
      } else {
        alert('Failed to join ride: ' + response.error);
      }
    } catch (error) {
      console.error('Error joining ride:', error);
      alert('Failed to join ride');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRide = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this ride?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await rideAPI.cancelBooking(bookingId);
      
      if (response.success) {
        alert('Ride cancelled successfully');
        loadMyRides();
        loadAvailableRides();
      } else {
        alert('Failed to cancel ride: ' + response.error);
      }
    } catch (error) {
      console.error('Error cancelling ride:', error);
      alert('Failed to cancel ride');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveRide = async (bookingId) => {
    if (!window.confirm('Are you sure you want to leave this ride?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await rideAPI.leaveRide(bookingId, user?.user_id);
      
      if (response.success) {
        alert('Left ride successfully');
        loadMyRides();
      } else {
        alert('Failed to leave ride: ' + response.error);
      }
    } catch (error) {
      console.error('Error leaving ride:', error);
      alert('Failed to leave ride');
    } finally {
      setLoading(false);
    }
  };

  const handleViewBids = async (booking) => {
    console.log('👀 Viewing bids for booking:', booking.booking_id);
    
    try {
      setLoading(true);
      setSelectedBooking(booking);
      const response = await bidAPI.getBidsForBooking(booking.booking_id);
      
      console.log('💰 Bids loaded:', response);
      
      if (response.success) {
        setBids(response.data);
        console.log('📊 Number of bids:', response.data.length);
        setShowBidsModal(true);
      } else {
        alert('Failed to load bids: ' + response.error);
      }
    } catch (error) {
      console.error('❌ Error loading bids:', error);
      alert('Failed to load bids: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptBid = async (bid) => {
    console.log('🎯 Student attempting to accept bid:', bid);
    
    if (!window.confirm(`Accept bid of ₹${bid.proposed_fare} from ${bid.driver_info?.name || 'Driver'}?`)) {
      return;
    }

    try {
      setLoading(true);
      console.log('📞 Calling bidAPI.acceptBid with bid_id:', bid.bid_id);
      
      const response = await bidAPI.acceptBid(bid.bid_id);
      
      console.log('📨 Response from acceptBid:', response);
      
      if (response.success) {
        alert('Bid accepted! The driver has been notified.');
        setShowBidsModal(false);
        await loadMyRides();
        await loadAvailableRides();
      } else {
        alert('Failed to accept bid: ' + response.error);
      }
    } catch (error) {
      console.error('❌ Error accepting bid:', error);
      alert('Failed to accept bid: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewParticipants = async (booking) => {
    try {
      setLoading(true);
      setSelectedBooking(booking);
      const response = await rideAPI.getParticipants(booking.booking_id);
      
      if (response.success) {
        setParticipants(response.data);
        setShowParticipantsModal(true);
      } else {
        alert('Failed to load participants: ' + response.error);
      }
    } catch (error) {
      console.error('Error loading participants:', error);
      alert('Failed to load participants');
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = async () => {
    try {
      setLoading(true);
      const filters = {};
      
      if (filterSource) filters.pickup_location = filterSource;
      if (filterDest) filters.dropoff_location = filterDest;
      if (filterDate) filters.date = filterDate;
      
      const response = await rideAPI.filterBookings(filters);
      
      if (response.success) {
        const rides = response.data.filter(
          r => r.student_id !== user?.user_id && 
          (r.status === 'pending' || r.status === 'accepted')
        );
        setAvailableRides(rides);
      }
    } catch (error) {
      console.error('Error filtering rides:', error);
      alert('Failed to filter rides');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'status-badge pending';
      case 'accepted':
        return 'status-badge in-progress';
      case 'completed':
        return 'status-badge resolved';
      case 'cancelled':
        return 'status-badge archived';
      default:
        return 'status-badge';
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
      <div className="page-container">
        <div className="page-content">
          <div className="page-header">
            <i className="fas fa-car-side"></i>
            <div>
              <h1>Carpool - Share Rides, Save Money</h1>
              <p>Eco-friendly and cost-effective travel with fellow students</p>
            </div>
          </div>

          <div className="alert alert-info">
            <i className="fas fa-leaf"></i>
            <span>
              <strong>Go Green!</strong> Carpooling reduces carbon emissions and saves up to 50% on
              travel costs.
            </span>
          </div>

          {/* Tabs */}
          <div className="tabs">
            <button
              className={`tab ${activeTab === 'available' ? 'active' : ''}`}
              onClick={() => setActiveTab('available')}
            >
              <i className="fas fa-list"></i> Available Rides
            </button>
            <button
              className={`tab ${activeTab === 'post' ? 'active' : ''}`}
              onClick={() => setActiveTab('post')}
            >
              <i className="fas fa-plus-circle"></i> Post a Ride
            </button>
            <button
              className={`tab ${activeTab === 'myrides' ? 'active' : ''}`}
              onClick={() => setActiveTab('myrides')}
            >
              <i className="fas fa-user"></i> My Rides
            </button>
          </div>

          {/* Available Rides Tab */}
          {activeTab === 'available' && (
            <div className="tab-content active">
              <div className="content-card">
                <h2>
                  <i className="fas fa-search"></i> Find Available Rides
                </h2>

                <div className="filter-bar">
                  <input
                    type="text"
                    placeholder="Source location"
                    value={filterSource}
                    onChange={(e) => setFilterSource(e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="Destination"
                    value={filterDest}
                    onChange={(e) => setFilterDest(e.target.value)}
                  />
                  <input
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                  />
                  <button 
                    className="btn btn-primary" 
                    onClick={handleFilter}
                    disabled={loading}
                  >
                    <i className="fas fa-filter"></i> Filter
                  </button>
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => {
                      setFilterSource('');
                      setFilterDest('');
                      setFilterDate('');
                      loadAvailableRides();
                    }}
                  >
                    <i className="fas fa-redo"></i> Reset
                  </button>
                </div>

                {loading ? (
                  <p style={{ textAlign: 'center', padding: '2rem' }}>Loading...</p>
                ) : availableRides.length === 0 ? (
                  <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                    No available rides found. Try adjusting your filters.
                  </p>
                ) : (
                  <div className="ride-list">
                    {availableRides.map((ride) => {
                      const { date, time } = formatDateTime(ride.required_time);
                      return (
                        <div key={ride.booking_id} className="ride-card">
                          <div className="ride-header">
                            <div className="ride-route">
                              <span>{ride.pickup_location}</span>
                              <i className="fas fa-arrow-right"></i>
                              <span>{ride.dropoff_location}</span>
                            </div>
                            <span className={getStatusBadgeClass(ride.status)}>
                              {ride.status}
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
                              <i className="fas fa-chair"></i> {ride.seats_required} seats
                            </div>
                            <div className="ride-detail">
                              <i className="fas fa-rupee-sign"></i> ₹{ride.fixed_fare || 'Negotiable'}
                            </div>
                            <div className="ride-detail">
                              <i className="fas fa-redo"></i> {ride.booking_type === 'regular' ? 'Regular' : 'One-time'}
                            </div>
                          </div>
                          <button
                            className="btn btn-success mt-2"
                            onClick={() => handleJoinRide(ride)}
                            disabled={loading || ride.status === 'accepted'}
                          >
                            <i className="fas fa-check-circle"></i> 
                            {ride.status === 'accepted' ? 'Ride Confirmed' : 'Join Ride'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Post a Ride Tab */}
          {activeTab === 'post' && (
            <div className="tab-content active">
              <div className="content-card">
                <h2>
                  <i className="fas fa-plus-circle"></i> Request a Ride
                </h2>
                <button className="btn btn-primary" onClick={() => setShowPostRideModal(true)}>
                  <i className="fas fa-plus"></i> Create New Ride Request
                </button>

                <div className="alert alert-info mt-2">
                  <i className="fas fa-info-circle"></i>
                  Post your travel plans and drivers will bid to provide the ride!
                </div>
              </div>
            </div>
          )}

          {/* My Rides Tab */}
          {activeTab === 'myrides' && (
            <div className="tab-content active">
              <div className="content-card">
                <h2>
                  <i className="fas fa-user"></i> My Rides
                </h2>

                <h3 style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>Rides I&apos;ve Requested</h3>
                {loading ? (
                  <p style={{ textAlign: 'center', padding: '1rem' }}>Loading...</p>
                ) : myPostedRides.length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)' }}>No ride requests yet</p>
                ) : (
                  <div className="ride-list">
                    {myPostedRides.map((ride) => {
                      const { date, time } = formatDateTime(ride.required_time);
                      return (
                        <div key={ride.booking_id} className="ride-card">
                          <div className="ride-header">
                            <div className="ride-route">
                              <span>{ride.pickup_location}</span>
                              <i className="fas fa-arrow-right"></i>
                              <span>{ride.dropoff_location}</span>
                            </div>
                            <span className={getStatusBadgeClass(ride.status)}>
                              {ride.status}
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
                              <i className="fas fa-chair"></i> {ride.seats_required} seats
                            </div>
                            <div className="ride-detail">
                              <i className="fas fa-rupee-sign"></i> ₹{ride.fixed_fare}
                            </div>
                          </div>
                          <div className="flex-between mt-2">
                            {ride.status === 'pending' && (
                              <button 
                                className="btn btn-primary" 
                                onClick={() => handleViewBids(ride)}
                                disabled={loading}
                              >
                                <i className="fas fa-eye"></i> View Bids
                              </button>
                            )}
                            {ride.status === 'accepted' && (
                              <button 
                                className="btn btn-info" 
                                onClick={() => handleViewParticipants(ride)}
                                disabled={loading}
                              >
                                <i className="fas fa-users"></i> View Details
                              </button>
                            )}
                            {(ride.status === 'pending' || ride.status === 'accepted') && (
                              <button 
                                className="btn btn-danger" 
                                onClick={() => handleCancelRide(ride.booking_id)}
                                disabled={loading}
                              >
                                <i className="fas fa-times"></i> Cancel
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <h3 style={{ marginTop: '2rem', marginBottom: '1rem' }}>Rides I&apos;ve Joined</h3>
                {loading ? (
                  <p style={{ textAlign: 'center', padding: '1rem' }}>Loading...</p>
                ) : myJoinedRides.length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)' }}>No joined rides yet</p>
                ) : (
                  <div className="ride-list">
                    {myJoinedRides.map((participation) => {
                      const ride = participation.booking_details;
                      if (!ride) return null;
                      const { date, time } = formatDateTime(ride.required_time);
                      return (
                        <div key={participation.participant_id} className="ride-card">
                          <div className="ride-header">
                            <div className="ride-route">
                              <span>{ride.pickup_location}</span>
                              <i className="fas fa-arrow-right"></i>
                              <span>{ride.dropoff_location}</span>
                            </div>
                            <span className={getStatusBadgeClass(ride.status)}>
                              {ride.status}
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
                              <i className="fas fa-rupee-sign"></i> ₹{ride.fixed_fare}
                            </div>
                          </div>
                          <button 
                            className="btn btn-danger mt-2" 
                            onClick={() => handleLeaveRide(ride.booking_id)}
                            disabled={loading}
                          >
                            <i className="fas fa-sign-out-alt"></i> Leave Ride
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Post Ride Modal */}
      <Modal
        isOpen={showPostRideModal}
        onClose={() => setShowPostRideModal(false)}
        title={<><i className="fas fa-plus-circle"></i> Request a Ride</>}
      >
        <form onSubmit={handlePostRide}>
          <div className="form-group">
            <label htmlFor="source">Pickup Location *</label>
            <input
              type="text"
              id="source"
              placeholder="Enter pickup location"
              value={rideForm.source}
              onChange={(e) => setRideForm({ ...rideForm, source: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="destination">Drop-off Location *</label>
            <input
              type="text"
              id="destination"
              placeholder="Enter destination"
              value={rideForm.destination}
              onChange={(e) => setRideForm({ ...rideForm, destination: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="date">Date *</label>
            <input
              type="date"
              id="date"
              value={rideForm.date}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setRideForm({ ...rideForm, date: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="time">Time *</label>
            <input
              type="time"
              id="time"
              value={rideForm.time}
              onChange={(e) => setRideForm({ ...rideForm, time: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="seats">Seats Required *</label>
            <input
              type="number"
              id="seats"
              min="1"
              max="6"
              placeholder="Number of seats"
              value={rideForm.seats}
              onChange={(e) => setRideForm({ ...rideForm, seats: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="farePerPerson">Maximum Fare You&apos;re Willing to Pay (₹) *</label>
            <input
              type="number"
              id="farePerPerson"
              placeholder="₹"
              min="0"
              value={rideForm.farePerPerson}
              onChange={(e) => setRideForm({ ...rideForm, farePerPerson: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={rideForm.recurring}
                onChange={(e) => setRideForm({ ...rideForm, recurring: e.target.checked })}
              />
              {' '}Regular Ride (Recurring)
            </label>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            <i className="fas fa-check"></i> {loading ? 'Posting...' : 'Post Ride Request'}
          </button>
        </form>
      </Modal>

      {/* Bids Modal */}
      <Modal
        isOpen={showBidsModal}
        onClose={() => {
          setShowBidsModal(false);
          setSelectedBooking(null);
          setBids([]);
        }}
        title={<><i className="fas fa-hand-holding-usd"></i> Driver Bids</>}
      >
        {selectedBooking && (
          <div>
            <div className="alert alert-info" style={{ marginBottom: '1rem' }}>
              <strong>Route:</strong> {selectedBooking.pickup_location} → {selectedBooking.dropoff_location}
              <br />
              <strong>Your Max Fare:</strong> ₹{selectedBooking.fixed_fare}
            </div>

            {loading ? (
              <p style={{ textAlign: 'center', padding: '1rem' }}>Loading bids...</p>
            ) : bids.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
                No bids yet. Drivers will place bids soon!
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {bids.map((bid) => (
                  <div key={bid.bid_id} className="ride-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div>
                        <h4 style={{ margin: '0 0 0.5rem 0' }}>
                          {bid.driver_info?.name || 'Unknown Driver'}
                        </h4>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                          ⭐ {bid.driver_info?.rating || 'N/A'} • {bid.driver_info?.total_rides || 0} rides
                        </div>
                        <div style={{ marginTop: '0.5rem' }}>
                          <strong>Vehicle:</strong> {bid.driver_info?.vehicle_model || 'N/A'}
                        </div>
                        <div style={{ marginTop: '0.25rem' }}>
                          <strong>Number:</strong> {bid.driver_info?.vehicle_number || 'N/A'}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>
                          ₹{bid.proposed_fare}
                        </div>
                        <span className={getStatusBadgeClass(bid.bid_status)}>
                          {bid.bid_status}
                        </span>
                      </div>
                    </div>
                    {bid.bid_status === 'pending' && (
                      <button
                        className="btn btn-success mt-2"
                        onClick={() => handleAcceptBid(bid)}
                        disabled={loading}
                        style={{ width: '100%' }}
                      >
                        <i className="fas fa-check"></i> Accept This Bid
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Participants Modal */}
      <Modal
        isOpen={showParticipantsModal}
        onClose={() => {
          setShowParticipantsModal(false);
          setSelectedBooking(null);
          setParticipants([]);
        }}
        title={<><i className="fas fa-users"></i> Ride Participants</>}
      >
        {selectedBooking && (
          <div>
            <div className="alert alert-success" style={{ marginBottom: '1rem' }}>
              <strong>Route:</strong> {selectedBooking.pickup_location} → {selectedBooking.dropoff_location}
              <br />
              <strong>Fare:</strong> ₹{selectedBooking.fixed_fare}
              <br />
              <strong>Status:</strong> {selectedBooking.status}
            </div>

            {participants.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
                No other participants yet
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <h4>Participants ({participants.length})</h4>
                {participants.map((participant, index) => (
                  <div key={participant.participant_id} style={{ 
                    padding: '0.75rem', 
                    background: 'var(--bg-secondary)', 
                    borderRadius: 'var(--radius)' 
                  }}>
                    <i className="fas fa-user"></i> Student {index + 1}: {participant.student_id}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>

      <Footer />
    </>
  );
};

export default StudentCarpool;