import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import Navbar from '../../components/shared/Navbar';
import Footer from '../../components/shared/Footer';
import Modal from '../../components/shared/Modal';
import { complaintAPI, messTimetableAPI } from '../../services/api';

const StudentMess = () => {
  const { user } = useSelector((state) => state.auth);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [myComplaints, setMyComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentTimetable, setCurrentTimetable] = useState(null);

  const [complaintForm, setComplaintForm] = useState({
    title: '',
    description: '',
    media: null,
  });

  useEffect(() => {
    loadComplaints();
    loadCurrentTimetable();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadComplaints = async () => {
    try {
      const response = await complaintAPI.getMyComplaints(user?.user_id, 'mess');
      if (response.success) {
        setMyComplaints(response.data);
      }
    } catch {
      // Handle error
    }
  };

  const loadCurrentTimetable = async () => {
    try {
      const response = await messTimetableAPI.getCurrentMessTimetable();
      if (response.success && response.data) {
        setCurrentTimetable(response.data);
      }
    } catch (error) {
      console.error('Failed to load timetable:', error);
      // Set to null if error, will show fallback message
      setCurrentTimetable(null);
    }
  };

  const handleSubmitComplaint = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Combine title and description for Flask backend
      const complaintText = `${complaintForm.title}\n\n${complaintForm.description}`;
      
      const response = await complaintAPI.submitComplaint(complaintText, 'mess');

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
            {currentTimetable ? (
              <div className="alert alert-info">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <i className="fas fa-file-pdf" style={{ marginRight: '0.5rem' }}></i>
                    <span>
                      <strong>Latest Timetable:</strong> {currentTimetable.filename}
                    </span>
                    <br />
                    <small style={{ color: '#666', marginLeft: '1.5rem' }}>
                      Updated on {new Date(currentTimetable.uploaded_at).toLocaleDateString()}
                    </small>
                  </div>
                  <a
                    href={currentTimetable.file_url}
                    download={currentTimetable.filename}
                    className="btn btn-primary"
                    style={{ padding: '0.6rem 1.2rem', textDecoration: 'none', whiteSpace: 'nowrap' }}
                  >
                    <i className="fas fa-download"></i> Download PDF
                  </a>
                </div>
              </div>
            ) : (
              <div className="alert alert-info">
                <i className="fas fa-info-circle"></i>
                <span>
                  No timetable available at the moment. Please check back later or contact the mess administration.
                </span>
              </div>
            )}
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
        title={<><i className="fas fa-exclamation-circle"></i> Submit Mess Complaint</>}
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
              placeholder="Detailed description of the issue"
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

export default StudentMess;
