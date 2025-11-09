import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import Navbar from '../../components/shared/Navbar';
import Footer from '../../components/shared/Footer';
import Modal from '../../components/shared/Modal';
import { complaintAPI } from '../../services/api';

const StudentMaintenance = () => {
  const { user } = useSelector((state) => state.auth);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [myComplaints, setMyComplaints] = useState([]);
  const [loading, setLoading] = useState(false);

  const [complaintForm, setComplaintForm] = useState({
    title: '',
    description: '',
    media: null,
  });

  useEffect(() => {
    loadComplaints();
  }, []);

  const loadComplaints = async () => {
    try {
      const response = await complaintAPI.getMyComplaints(user?.user_id, 'maintenance');
      if (response.success) {
        setMyComplaints(response.data);
      }
    } catch {
      // Handle error
    }
  };

  const handleSubmitComplaint = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Combine title and description for Flask backend
      const complaintText = `${complaintForm.title}\n\n${complaintForm.description}`;
      
      const response = await complaintAPI.submitComplaint(complaintText, 'maintenance');

      if (response.success) {
        const complaintData = response.data;
        const severity = complaintData.student_view?.severity || 3;
        const departments = complaintData.admin_view?.departments || complaintData.student_view?.departments || [];
        
        alert(`Complaint submitted successfully!\n\nComplaint ID: ${complaintData.id}\nAI-Assessed Severity: ${severity}/5\nDepartments: ${departments.join(', ')}\n\nThe system has automatically categorized your complaint and will notify the relevant departments.`);
        
        setShowComplaintModal(false);
        loadComplaints();
        setComplaintForm({
          title: '',
          description: '',
          media: null,
        });
      } else {
        throw new Error(response.error || 'Failed to submit complaint');
      }
    } catch (error) {
      alert(`Failed to submit complaint: ${error.message}\n\nPlease make sure the Flask backend is running on http://localhost:5000`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    const statusMap = {
      pending: 'pending',
      in_progress: 'in-progress',
      resolved: 'resolved',
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
            <i className="fas fa-tools"></i>
            <div>
              <h1>Maintenance Services</h1>
              <p>Housekeeping, water supply, and facility maintenance</p>
            </div>
          </div>

          {/* Housekeeping Services */}
          <div className="content-card">
            <h2>
              <i className="fas fa-broom"></i> Housekeeping Services
            </h2>
            <table>
              <thead>
                <tr>
                  <th>Area</th>
                  <th>Frequency</th>
                  <th>Timings</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Hostel Rooms</strong></td>
                  <td>Daily</td>
                  <td>9:00 AM - 12:00 PM</td>
                </tr>
                <tr>
                  <td><strong>Corridors</strong></td>
                  <td>Twice Daily</td>
                  <td>8:00 AM & 6:00 PM</td>
                </tr>
                <tr>
                  <td><strong>Washrooms</strong></td>
                  <td>Three Times Daily</td>
                  <td>7:00 AM, 1:00 PM, 8:00 PM</td>
                </tr>
                <tr>
                  <td><strong>Common Areas</strong></td>
                  <td>Daily</td>
                  <td>10:00 AM - 4:00 PM</td>
                </tr>
                <tr>
                  <td><strong>Garbage Collection</strong></td>
                  <td>Twice Daily</td>
                  <td>9:00 AM & 7:00 PM</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Water Supply Schedule */}
          <div className="content-card">
            <h2>
              <i className="fas fa-tint"></i> Water Supply Timings
            </h2>
            <table>
              <thead>
                <tr>
                  <th>Area</th>
                  <th>Morning</th>
                  <th>Evening</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Hostel Blocks A-D</strong></td>
                  <td>5:00 AM - 9:00 AM</td>
                  <td>5:00 PM - 10:00 PM</td>
                  <td><span className="status-badge resolved">Active</span></td>
                </tr>
                <tr>
                  <td><strong>Hostel Blocks E-H</strong></td>
                  <td>5:30 AM - 9:30 AM</td>
                  <td>5:30 PM - 10:30 PM</td>
                  <td><span className="status-badge resolved">Active</span></td>
                </tr>
                <tr>
                  <td><strong>Hot Water (Winter)</strong></td>
                  <td>6:00 AM - 8:00 AM</td>
                  <td>6:00 PM - 8:00 PM</td>
                  <td><span className="status-badge resolved">Active</span></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Facility Maintenance */}
          <div className="content-card">
            <h2>
              <i className="fas fa-wrench"></i> Facility Maintenance
            </h2>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div className="alert alert-info">
                <i className="fas fa-check-circle"></i>
                <span><strong>Electrical:</strong> Report any electrical issues immediately for safety</span>
              </div>
              <div className="alert alert-info">
                <i className="fas fa-check-circle"></i>
                <span><strong>Plumbing:</strong> Leaks, clogs, and water pressure issues</span>
              </div>
              <div className="alert alert-info">
                <i className="fas fa-check-circle"></i>
                <span><strong>Furniture:</strong> Broken beds, chairs, tables, and cupboards</span>
              </div>
              <div className="alert alert-info">
                <i className="fas fa-check-circle"></i>
                <span><strong>Doors & Windows:</strong> Locks, hinges, and glass repairs</span>
              </div>
            </div>
          </div>

          {/* Important Guidelines */}
          <div className="content-card">
            <h2>
              <i className="fas fa-exclamation-triangle"></i> Important Guidelines
            </h2>
            <ul style={{ lineHeight: '1.8', color: '#555' }}>
              <li>Keep your room accessible during cleaning hours</li>
              <li>Report all maintenance issues promptly</li>
              <li>Do not attempt DIY repairs on electrical or plumbing issues</li>
              <li>Keep valuable items secured during cleaning</li>
              <li>Cooperate with maintenance staff for efficient service</li>
              <li>Report leaking taps to conserve water</li>
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
              <i className="fas fa-list"></i> My Complaints
            </h2>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Complaint ID</th>
                    <th>Title</th>
                    <th>Severity</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {myComplaints.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>
                        No complaints found
                      </td>
                    </tr>
                  ) : (
                    myComplaints.map((complaint) => {
                      const studentView = complaint.student_view || complaint;
                      const severity = studentView.severity || 3;
                      const status = studentView.status || 'Pending';
                      const timestamp = studentView.timestamp || complaint.timestamp || new Date().toISOString();
                      
                      return (
                        <tr key={complaint.id || complaint.complaint_id}>
                          <td>{complaint.id || complaint.complaint_id}</td>
                          <td>{studentView.complaint?.split('\n')[0] || complaint.title || 'N/A'}</td>
                          <td>
                            <span className={getSeverityBadgeClass(severity)}>
                              {severity}/5
                            </span>
                          </td>
                          <td>
                            <span className={`status-badge ${getStatusBadgeClass(status.toLowerCase().replace(' ', '_'))}`}>
                              {status}
                            </span>
                          </td>
                          <td>{new Date(timestamp).toLocaleDateString()}</td>
                          <td>
                            <button
                              className="btn btn-primary"
                              style={{ padding: '0.3rem 0.8rem', fontSize: '0.85rem' }}
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      );
                    })
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
        title={<><i className="fas fa-exclamation-circle"></i> Submit Maintenance Complaint</>}
      >
        <form onSubmit={handleSubmitComplaint}>
          <div className="form-group">
            <label htmlFor="title">Title *</label>
            <input
              type="text"
              id="title"
              placeholder="Brief description of the issue"
              value={complaintForm.title}
              onChange={(e) => setComplaintForm({ ...complaintForm, title: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              rows="4"
              placeholder="Detailed description (location, room number, specific issue)"
              value={complaintForm.description}
              onChange={(e) => setComplaintForm({ ...complaintForm, description: e.target.value })}
              required
            ></textarea>
          </div>

          <div className="alert alert-info" style={{ fontSize: '0.9rem', margin: '1rem 0' }}>
            <i className="fas fa-info-circle"></i>
            <span>
              <strong>Note:</strong> The severity and category of your complaint will be automatically assessed by our AI system based on your description.
            </span>
          </div>

          <div className="form-group">
            <label htmlFor="media">Attach Media (Optional)</label>
            <input
              type="file"
              id="media"
              accept="image/*,video/*"
              onChange={(e) => setComplaintForm({ ...complaintForm, media: e.target.files[0] })}
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            <i className="fas fa-check"></i> {loading ? 'Submitting...' : 'Submit Complaint'}
          </button>
        </form>
      </Modal>

      <Footer />
    </>
  );
};

export default StudentMaintenance;
