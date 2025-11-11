/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import Navbar from '../../components/shared/Navbar';
import Footer from '../../components/shared/Footer';
import Modal from '../../components/shared/Modal';
import { complaintAPI } from '../../services/api';

const StudentTransport = () => {
  const { user } = useSelector((state) => state.auth);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [myComplaints, setMyComplaints] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [loading, setLoading] = useState(false);

  const [complaintForm, setComplaintForm] = useState({
    description: '',
  });

  useEffect(() => {
    loadComplaints();
  }, []);

  const loadComplaints = async () => {
    setLoading(true);
    try {
      const response = await complaintAPI.getAllComplaints();

      if (response.success && Array.isArray(response.data)) {
        // Filter only Transport complaints
        const transportComplaints = response.data.filter(complaint => 
          complaint.admin_view?.departments?.includes("Transport")
        );
        setMyComplaints(transportComplaints);
      } else {
        console.error('Error loading complaints:', response.error);
        setMyComplaints([]);
      }
    } catch (error) {
      console.error('Error loading complaints:', error);
      setMyComplaints([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComplaint = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await complaintAPI.submitComplaint(
        complaintForm.description
      );

      if (response.success) {
        alert('Complaint registered successfully!');
        setComplaintForm({ description: '' });
        setShowComplaintModal(false);
        await loadComplaints();
      } else {
        alert('Error submitting complaint: ' + response.error);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('A critical error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    const statusMap = {
      Pending: 'pending',
      'In Progress': 'in-progress',
      Resolved: 'resolved',
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
              <h1>Transport Services</h1>
              <p>Bus schedules, booking, and complaint management</p>
            </div>
          </div>

          {/* Bus Schedule */}
          <div className="content-card">
            <h2>
              <i className="fas fa-calendar"></i> Bus Schedule
            </h2>
            <table>
              <thead>
                <tr>
                  <th>Route</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Departure Time</th>
                  <th>Arrival Time</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Route 1</strong></td>
                  <td>Campus Gate</td>
                  <td>Railway Station</td>
                  <td>8:00 AM</td>
                  <td>8:30 AM</td>
                </tr>
                <tr>
                  <td><strong>Route 2</strong></td>
                  <td>Campus Gate</td>
                  <td>Airport</td>
                  <td>9:00 AM</td>
                  <td>10:15 AM</td>
                </tr>
                <tr>
                  <td><strong>Route 3</strong></td>
                  <td>Campus Gate</td>
                  <td>City Center</td>
                  <td>10:00 AM</td>
                  <td>10:45 AM</td>
                </tr>
                <tr>
                  <td><strong>Route 4</strong></td>
                  <td>Campus Gate</td>
                  <td>Market Area</td>
                  <td>11:00 AM</td>
                  <td>11:30 AM</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Booking Info */}
          <div className="content-card">
            <h2>
              <i className="fas fa-ticket-alt"></i> Booking Information
            </h2>
            <ul style={{ lineHeight: '1.8', paddingLeft: '1.5rem' }}>
              <li>Monthly bus pass: ₹500</li>
              <li>Single trip fare: ₹50</li>
              <li>Book online through the campus app</li>
              <li>Seats are limited - early booking recommended</li>
              <li>Cancellations allowed up to 30 minutes before departure</li>
            </ul>
          </div>

          {/* Submit Complaint */}
          <div className="content-card">
            <h2>
              <i className="fas fa-exclamation-circle"></i> Submit a Complaint
            </h2>
            <button className="btn btn-primary" onClick={() => setShowComplaintModal(true)}>
              <i className="fas fa-plus"></i> File New Complaint
            </button>
          </div>

          {/* My Complaints */}
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
                  {myComplaints.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>
                        No complaints found
                      </td>
                    </tr>
                  ) : (
                    myComplaints.map((complaint) => (
                      <tr key={complaint.id}>
                        <td>{complaint.id}</td>
                        <td>
                          {complaint.student_view?.complaint?.substring(0, 50) || 'N/A'}...
                        </td>
                        <td>
                          <span className={`status-badge ${getStatusBadgeClass(complaint.student_view?.status)}`}>
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
                          	  setSelectedComplaint(complaint);
                          	  setShowDetailsModal(true);
                        	}}
                      	  >
               	View Such Details
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

  	  {/* Complaint Modal */}
  	  <Modal
  	    isOpen={showComplaintModal}
  	    onClose={() => setShowComplaintModal(false)}
  	    title={<><i className="fas fa-exclamation-circle"></i> Submit Transport Complaint</>}
  	  >
  	    <form onSubmit={handleSubmitComplaint}>
  	      <div className="form-group">
  	        <label htmlFor="description">Describe Your Complaint *</label>
  	        <textarea
  	          id="description"
  	          rows="6"
  	          maxLength="5000"
  	          placeholder="Please describe your complaint in detail..."
  	          value={complaintForm.description}
  	          onChange={(e) => setComplaintForm({ ...complaintForm, description: e.target.value })}
  	          required
  	        ></textarea>
  	        <p style={{ textAlign: 'right', color: '#666', fontSize: '0.85rem', marginTop: '0.5rem' }}>
  	          {complaintForm.description.length}/5000
  	        </p>
  	      </div>

  	      <button type="submit" className="btn btn-primary" disabled={loading}>
  	        <i className="fas fa-check"></i> {loading ? 'Submitting...' : 'Submit Complaint'}
  	      </button>
  	    </form>
  	  </Modal>

  	  {/* Details Modal */}
  	  <Modal
  	    isOpen={showDetailsModal}
  	    onClose={() => {
  	      setShowDetailsModal(false);
  	      setSelectedComplaint(null);
  	    }}
  	    title={<><i className="fas fa-info-circle"></i> Complaint Details</>}
  	  >
  	    {selectedComplaint ? (
  	      <div>
  	        <div style={{ marginBottom: '1rem' }}>
  	          <h4>📋 Complaint Information</h4>
  	          <p><strong>ID:</strong> {selectedComplaint.id || 'N/A'}</p>
  	          <p><strong>Description:</strong> {selectedComplaint.student_view?.complaint || 'N/A'}</p>
  	          <p>
  	            <strong>Status:</strong>{' '}
  	            <span className={`status-badge ${getStatusBadgeClass(selectedComplaint.student_view?.status)}`}>
  	              {selectedComplaint.student_view?.status || 'Unknown'}
  	            </span>
  	          </p>
  	          <p>
  	            <strong>Submitted:</strong>{' '}
  	            {selectedComplaint.student_view?.timestamp
    	              ? new Date(selectedComplaint.student_view.timestamp).toLocaleString()
  	              : 'N/A'}
  	          </p>
  	        </div>

  	        {/* Suggestions ONLY */}
  	        {selectedComplaint.admin_view?.suggestions && selectedComplaint.admin_view.suggestions.length > 0 && (
  	          <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #eee' }}>
  	            <h4 style={{ marginBottom: '1rem' }}>💡 Suggestions While We Review</h4>
  	            <ul style={{ lineHeight: '1.8', paddingLeft: '1.5rem', margin: 0, color: '#555' }}>
  	              {selectedComplaint.admin_view.suggestions.map((suggestion, index) => (
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
  	            setSelectedComplaint(null);
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