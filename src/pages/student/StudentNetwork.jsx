import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import Navbar from '../../components/shared/Navbar';
import Footer from '../../components/shared/Footer';
import Modal from '../../components/shared/Modal';
import { complaintAPI } from '../../services/api';

const StudentNetwork = () => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadComplaints = async () => {
    try {
      const response = await complaintAPI.getMyComplaints(user?.user_id, 'network');
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
      
      const response = await complaintAPI.submitComplaint(complaintText, 'network');

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
            <i className="fas fa-wifi"></i>
            <div>
              <h1>Network & IT Services</h1>
              <p>Network status, troubleshooting, and complaint management</p>
            </div>
          </div>

          {/* Network Status */}
          <div className="content-card">
            <h2>
              <i className="fas fa-signal"></i> Network Status
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              <div className="alert alert-success">
                <i className="fas fa-check-circle"></i>
                <div>
                  <strong>Campus WiFi</strong>
                  <br />
                  <span style={{ fontSize: '0.9rem' }}>Status: Operational</span>
                </div>
              </div>
              <div className="alert alert-success">
                <i className="fas fa-check-circle"></i>
                <div>
                  <strong>Hostel Network</strong>
                  <br />
                  <span style={{ fontSize: '0.9rem' }}>Status: Operational</span>
                </div>
              </div>
              <div className="alert alert-success">
                <i className="fas fa-check-circle"></i>
                <div>
                  <strong>Library WiFi</strong>
                  <br />
                  <span style={{ fontSize: '0.9rem' }}>Status: Operational</span>
                </div>
              </div>
            </div>
          </div>

          {/* WiFi Information */}
          <div className="content-card">
            <h2>
              <i className="fas fa-network-wired"></i> WiFi Networks
            </h2>
            <table>
              <thead>
                <tr>
                  <th>Network Name (SSID)</th>
                  <th>Location</th>
                  <th>Authentication</th>
                  <th>Speed</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>IIITN-Campus</strong></td>
                  <td>Academic Buildings</td>
                  <td>Institute Credentials</td>
                  <td>100 Mbps</td>
                </tr>
                <tr>
                  <td><strong>IIITN-Hostel</strong></td>
                  <td>Hostel Blocks</td>
                  <td>Institute Credentials</td>
                  <td>50 Mbps</td>
                </tr>
                <tr>
                  <td><strong>IIITN-Library</strong></td>
                  <td>Central Library</td>
                  <td>Institute Credentials</td>
                  <td>100 Mbps</td>
                </tr>
                <tr>
                  <td><strong>IIITN-Guest</strong></td>
                  <td>All Campus</td>
                  <td>Guest Portal</td>
                  <td>10 Mbps</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Network Guidelines & Troubleshooting */}
          <div className="content-card">
            <h2>
              <i className="fas fa-wrench"></i> Troubleshooting Tips
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
              <div className="alert alert-info">
                <i className="fas fa-redo"></i>
                <div>
                  <strong>Connection Issues?</strong>
                  <br />
                  <span style={{ fontSize: '0.9rem' }}>
                    1. Turn WiFi off and on<br />
                    2. Forget network and reconnect<br />
                    3. Restart your device
                  </span>
                </div>
              </div>
              <div className="alert alert-info">
                <i className="fas fa-key"></i>
                <div>
                  <strong>Login Problems?</strong>
                  <br />
                  <span style={{ fontSize: '0.9rem' }}>
                    Use your institute email and password<br />
                    Reset password at: portal.iiitn.ac.in
                  </span>
                </div>
              </div>
              <div className="alert alert-info">
                <i className="fas fa-tachometer-alt"></i>
                <div>
                  <strong>Slow Speed?</strong>
                  <br />
                  <span style={{ fontSize: '0.9rem' }}>
                    Check bandwidth usage<br />
                    Move closer to access point<br />
                    Avoid peak hours (6-10 PM)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* IT Support Contact */}
          <div className="content-card">
            <h2>
              <i className="fas fa-headset"></i> IT Support Contact
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              <div className="alert alert-warning">
                <i className="fas fa-phone"></i>
                <div>
                  <strong>Helpdesk</strong>
                  <br />
                  <span style={{ fontSize: '0.9rem' }}>+91-XXXX-XXXXXX</span>
                  <br />
                  <span style={{ fontSize: '0.85rem', color: '#666' }}>Available 9 AM - 6 PM</span>
                </div>
              </div>
              <div className="alert alert-warning">
                <i className="fas fa-envelope"></i>
                <div>
                  <strong>Email Support</strong>
                  <br />
                  <span style={{ fontSize: '0.9rem' }}>itsupport@iiitn.ac.in</span>
                  <br />
                  <span style={{ fontSize: '0.85rem', color: '#666' }}>Response within 24 hours</span>
                </div>
              </div>
            </div>
          </div>

          {/* Common Issues & Guidelines */}
          <div className="content-card">
            <h2>
              <i className="fas fa-book"></i> Network Usage Guidelines
            </h2>
            <ul style={{ paddingLeft: '1.5rem', lineHeight: '1.8' }}>
              <li>Use institute credentials only for authorized users</li>
              <li>Do not share your network credentials with others</li>
              <li>Bandwidth-intensive activities (streaming, downloads) should be done during off-peak hours</li>
              <li>Report suspicious network activity immediately</li>
              <li>P2P file sharing and torrenting are prohibited on campus network</li>
              <li>Maximum 3 devices per student can be connected simultaneously</li>
            </ul>
          </div>

          {/* Submit Complaint */}
          <div className="content-card">
            <h2>
              <i className="fas fa-exclamation-circle"></i> Submit a Network Complaint
            </h2>
            <p style={{ color: '#666', marginBottom: '1rem' }}>
              If you&apos;re experiencing persistent network issues, please submit a complaint below.
            </p>
            <button className="btn btn-primary" onClick={() => setShowComplaintModal(true)}>
              <i className="fas fa-plus"></i> File New Complaint
            </button>
          </div>

          {/* My Complaints */}
          <div className="content-card">
            <h2>
              <i className="fas fa-list"></i> My Network Complaints
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
        title={<><i className="fas fa-exclamation-circle"></i> Submit Network Complaint</>}
      >
        <form onSubmit={handleSubmitComplaint}>
          <div className="form-group">
            <label htmlFor="title">Title *</label>
            <input
              type="text"
              id="title"
              placeholder="Brief description of the issue (e.g., WiFi not connecting in Hostel Block A)"
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
              placeholder="Detailed description: Location, device type, error messages, troubleshooting steps tried, etc."
              value={complaintForm.description}
              onChange={(e) => setComplaintForm({ ...complaintForm, description: e.target.value })}
              required
            ></textarea>
          </div>

          <div className="alert alert-info" style={{ fontSize: '0.9rem', margin: '1rem 0' }}>
            <i className="fas fa-info-circle"></i>
            <span>
              <strong>Note:</strong> The severity of your complaint will be automatically assessed by our AI system based on your description.
            </span>
          </div>

          <div className="form-group">
            <label htmlFor="media">Attach Screenshot (Optional)</label>
            <input
              type="file"
              id="media"
              accept="image/*"
              onChange={(e) => setComplaintForm({ ...complaintForm, media: e.target.files[0] })}
            />
            <small style={{ color: '#666', display: 'block', marginTop: '0.5rem' }}>
              Screenshots of error messages help us resolve issues faster
            </small>
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

export default StudentNetwork;
