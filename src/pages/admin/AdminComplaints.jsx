import { useState, useEffect } from 'react';
import Navbar from '../../components/shared/Navbar';
import Footer from '../../components/shared/Footer';
import Modal from '../../components/shared/Modal';
import { complaintAPI } from '../../services/api';

const AdminComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  useEffect(() => {
    loadComplaints();
  }, []);

  const loadComplaints = async () => {
    setLoading(true);
    try {
      const response = await complaintAPI.getAllComplaints();
      if (response.success) {
        setComplaints(Array.isArray(response.data) ? response.data : []);
      } else {
        console.error('Error loading complaints:', response.error);
        setComplaints([]);
      }
    } catch (error) {
      console.error('Error loading complaints:', error);
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedComplaint || !newStatus) return;

    try {
      const response = await complaintAPI.updateComplaintStatus(
        selectedComplaint.id,
        newStatus
      );

      if (response.success) {
        setComplaints(
          complaints.map((complaint) =>
            complaint.id === selectedComplaint.id
              ? {
                  ...complaint,
                  student_view: {
                    ...complaint.student_view,
                    status: newStatus,
                  },
                }
              : complaint
          )
        );
        
        setSelectedComplaint({
          ...selectedComplaint,
          student_view: {
            ...selectedComplaint.student_view,
            status: newStatus,
          },
        });

        alert('Status updated successfully!');
        setNewStatus('');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
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

  const getSeverityBadgeClass = (severity) => {
    if (severity >= 4) return 'severity-high';
    if (severity >= 3) return 'severity-medium';
    return 'severity-low';
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="page-container">
          <div className="page-content">
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem' }}></i>
              <p style={{ marginTop: '1rem' }}>Loading complaints...</p>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="page-container">
        <div className="page-content">
          <div className="page-header">
            <i className="fas fa-tasks"></i>
            <div>
              <h1>Complaint Management</h1>
              <p>View and manage all student complaints</p>
            </div>
          </div>

          <div className="content-card">
            <h2>
              <i className="fas fa-list"></i> All Complaints ({complaints.length})
            </h2>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Complaint</th>
                    <th>Severity</th>
                    <th>Departments</th>
                    <th>Status</th>
                    <th>Submitted</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {complaints.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                        No complaints found
                      </td>
                    </tr>
                  ) : (
                    complaints.map((complaint) => {
                      const adminView = complaint.admin_view || {};
                      const studentView = complaint.student_view || {};
                      const severity = adminView.severity || studentView.severity || 3;
                      const status = studentView.status || 'Pending';
                      const timestamp = adminView.timestamp || studentView.timestamp || new Date().toISOString();
                      const complaintText = adminView.complaint || studentView.complaint || 'N/A';
                      const departments = adminView.departments || studentView.departments || [];
                      
                      return (
                        <tr key={complaint.id}>
                          <td>{complaint.id}</td>
                          <td>{complaintText.substring(0, 40)}...</td>
                          <td>
                            <span className={getSeverityBadgeClass(severity)}>
                              {severity}/5
                            </span>
                          </td>
                          <td>
                            {departments.join(', ') || 'N/A'}
                          </td>
                          <td>
                            <span className={`status-badge ${getStatusBadgeClass(status)}`}>
                              {status}
                            </span>
                          </td>
                          <td>
                            {new Date(timestamp).toLocaleDateString()}
                          </td>
                          <td>
                            <button
                              className="btn btn-primary"
                              style={{ padding: '0.3rem 0.8rem', fontSize: '0.85rem' }}
                              onClick={() => {
                                setSelectedComplaint(complaint);
                                setNewStatus(status);
                                setShowDetailsModal(true);
                              }}
                            >
                              Manage
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

      {/* Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedComplaint(null);
          setNewStatus('');
        }}
        title={<><i className="fas fa-info-circle"></i> Manage Complaint</>}
      >
        {selectedComplaint ? (
          <div>
            <div className="detail-section">
              <h4>📋 Complaint Details</h4>
              <p><strong>ID:</strong> {selectedComplaint.id}</p>
              <p>
                <strong>Description:</strong>{' '}
                {selectedComplaint.student_view?.complaint || selectedComplaint.admin_view?.complaint || 'N/A'}
              </p>
              <p><strong>Severity:</strong> {selectedComplaint.admin_view?.severity || 3} / 5</p>
              <p><strong>Summary:</strong> {selectedComplaint.admin_view?.summary || 'N/A'}</p>
              <p>
                <strong>Departments:</strong>{' '}
                {(selectedComplaint.admin_view?.departments || []).join(', ') || 'N/A'}
              </p>
            </div>

            <div className="detail-section" style={{ marginTop: '1.5rem' }}>
              <h4>🔄 Update Status</h4>
              <div className="form-group">
                <label htmlFor="status">Status</label>
                <select
                  id="status"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  style={{
                    padding: '0.5rem',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    width: '100%',
                  }}
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>

              <button
                className="btn btn-primary"
                style={{ width: '100%' }}
                onClick={handleUpdateStatus}
              >
                Update Status
              </button>
            </div>

            {selectedComplaint.admin_view?.suggestions && (
              <div className="detail-section" style={{ marginTop: '1.5rem', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
                <h4>💡 Suggestions</h4>
                <ul style={{ lineHeight: '1.8', paddingLeft: '1.5rem' }}>
                  {selectedComplaint.admin_view.suggestions.map((sugg, idx) => (
                    <li key={idx}>{sugg}</li>
                  ))}
                </ul>
              </div>
            )}

            {selectedComplaint.admin_view?.officer_brief && (
              <div className="detail-section" style={{ marginTop: '1.5rem', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
                <h4>👨‍💼 Officer Brief</h4>
                <p style={{ color: '#666' }}>{selectedComplaint.admin_view.officer_brief}</p>
              </div>
            )}
          </div>
        ) : null}
      </Modal>

      <Footer />
    </>
  );
};

export default AdminComplaints;
