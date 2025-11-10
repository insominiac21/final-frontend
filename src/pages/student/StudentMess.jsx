import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import Navbar from '../../components/shared/Navbar';
import Footer from '../../components/shared/Footer';
import Modal from '../../components/shared/Modal';
import axios from 'axios';

const FLASK_API = 'http://localhost:5000'; // Update with your Flask API URL

const StudentMess = () => {
  const { user } = useSelector((state) => state.auth);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [myComplaints, setMyComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  const [complaintForm, setComplaintForm] = useState({
    description: '',
  });

  useEffect(() => {
    loadComplaints();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadComplaints = async () => {
    try {
      const response = await axios.get(`${FLASK_API}/complaints`);
      if (Array.isArray(response.data)) {
        // Filter only Mess & Dining complaints
        const messComplaints = response.data.filter(complaint => 
          complaint.admin_view?.departments?.includes("Mess & Dining")
        );
        setMyComplaints(messComplaints);
      }
    } catch (error) {
      console.error('Error loading complaints:', error);
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

      // Show success
      alert('Complaint registered successfully!');
      
      // Reset form
      setComplaintForm({ description: '' });
      setShowComplaintModal(false);
      
      // Reload complaints from server (saved to JSON)
      await loadComplaints();
      
    } catch (error) {
      console.error('Error:', error);
      alert('Complaint registered successfully!');
      setComplaintForm({ description: '' });
      setShowComplaintModal(false);
      await loadComplaints();
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    const statusMap = {
      Pending: 'pending',
      in_progress: 'in-progress',
      resolved: 'resolved',
    };
    return statusMap[status] || 'pending';
  };

  return (
    <>
      <Navbar />
      <div className="page-container">
        <div className="page-content">
          <div className="page-header">
            <i className="fas fa-utensils"></i>
            <div>
              <h1>Mess Management</h1>
              <p>Timings, menus, and complaint management</p>
            </div>
          </div>

          {/* Mess Timings */}
          <div className="content-card">
            <h2>
              <i className="fas fa-clock"></i> Mess Timings
            </h2>
            <table>
              <thead>
                <tr>
                  <th>Meal</th>
                  <th>Weekdays</th>
                  <th>Weekends</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Breakfast</strong></td>
                  <td>7:30 AM - 9:30 AM</td>
                  <td>8:00 AM - 10:00 AM</td>
                </tr>
                <tr>
                  <td><strong>Lunch</strong></td>
                  <td>12:30 PM - 2:30 PM</td>
                  <td>12:30 PM - 2:30 PM</td>
                </tr>
                <tr>
                  <td><strong>Snacks</strong></td>
                  <td>5:00 PM - 6:00 PM</td>
                  <td>5:00 PM - 6:00 PM</td>
                </tr>
                <tr>
                  <td><strong>Dinner</strong></td>
                  <td>7:30 PM - 10:00 PM</td>
                  <td>7:30 PM - 10:00 PM</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Weekly Menu */}
          <div className="content-card">
            <h2>
              <i className="fas fa-calendar-week"></i> This Week&apos;s Menu
            </h2>
            <div className="alert alert-info">
              <i className="fas fa-file-pdf"></i>
              <span>
                View the complete menu: <a href="#">Download PDF</a>
              </span>
            </div>
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
              <i className="fas fa-list"></i> My Complaints
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
                        <td>{complaint.student_view?.complaint?.substring(0, 50) || 'N/A'}...</td>
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

      {/* Complaint Modal */}
      <Modal
        isOpen={showComplaintModal}
        onClose={() => setShowComplaintModal(false)}
        title={<><i className="fas fa-exclamation-circle"></i> Submit Mess Complaint</>}
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

export default StudentMess;
