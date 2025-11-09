/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Navbar from '../../components/shared/Navbar';
import Footer from '../../components/shared/Footer';
import Modal from '../../components/shared/Modal';
import { complaintAPI, messTimetableAPI } from '../../services/api';

const AdminComplaintManagement = () => {
  const { dept } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [complaints, setComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  
  // Timetable management states
  const [currentTimetable, setCurrentTimetable] = useState(null);
  const [uploadingTimetable, setUploadingTimetable] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  // Department configurations
  const deptConfig = {
    mess: {
      name: 'Mess Management',
      icon: 'fa-utensils',
      dept_id: 'MESS',
      color: '#ff6b6b',
    },
    network: {
      name: 'Network Management',
      icon: 'fa-wifi',
      dept_id: 'NETWORK',
      color: '#95e1d3',
    },
    maintenance: {
      name: 'Maintenance Management',
      icon: 'fa-tools',
      dept_id: 'MAINTENANCE',
      color: '#f38181',
    },
  };

  const currentDept = deptConfig[dept] || deptConfig.mess;

  useEffect(() => {
    loadComplaints();
    // Load timetable if this is mess department
    if (currentDept.dept_id === 'MESS') {
      loadCurrentTimetable();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dept]);

  useEffect(() => {
    filterComplaints();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [complaints, statusFilter, severityFilter]);

  const loadComplaints = async () => {
    try {
      const response = await complaintAPI.getAllComplaints();
      if (response.success) {
        // Filter complaints based on AI-categorized departments
        const filtered = response.data.filter((c) => {
          const departments = c.admin_view?.departments || c.student_view?.departments || [];
          const deptStr = departments.join(' ').toLowerCase();
          
          if (currentDept.dept_id === 'MESS') {
            return deptStr.includes('mess') || deptStr.includes('dining');
          } else if (currentDept.dept_id === 'MAINTENANCE') {
            return deptStr.includes('maintenance') || 
                   deptStr.includes('housekeeping') || 
                   deptStr.includes('water') ||
                   deptStr.includes('plumbing') ||
                   deptStr.includes('electrical');
          } else if (currentDept.dept_id === 'NETWORK') {
            return deptStr.includes('network') || deptStr.includes('it');
          } else if (currentDept.dept_id === 'TRANSPORT') {
            return deptStr.includes('transport');
          }
          return false;
        });
        
        setComplaints(filtered);
      }
    } catch {
      alert('Failed to load complaints');
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
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
    } else {
      alert('Please select a PDF file');
      e.target.value = '';
    }
  };

  const handleUploadTimetable = async () => {
    if (!selectedFile) {
      alert('Please select a file first');
      return;
    }

    setUploadingTimetable(true);
    try {
      const response = await messTimetableAPI.uploadMessTimetable(selectedFile, user?.user_id);
      if (response.success) {
        alert('Timetable uploaded successfully!');
        setCurrentTimetable(response.data);
        setSelectedFile(null);
        // Reset file input
        const fileInput = document.getElementById('timetable-file');
        if (fileInput) fileInput.value = '';
      }
    } catch (error) {
      alert('Failed to upload timetable. Please try again.');
      console.error('Upload error:', error);
    } finally {
      setUploadingTimetable(false);
    }
  };

  const handleDeleteTimetable = async () => {
    if (!currentTimetable) return;
    
    if (window.confirm('Are you sure you want to delete the current timetable?')) {
      try {
        const response = await messTimetableAPI.deleteMessTimetable(currentTimetable.timetable_id);
        if (response.success) {
          alert('Timetable deleted successfully');
          setCurrentTimetable(null);
        }
      } catch (error) {
        alert('Failed to delete timetable');
        console.error('Delete error:', error);
      }
    }
  };

  const filterComplaints = () => {
    let filtered = [...complaints];
    
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

  const handleUpdateStatus = async (complaintId, newStatus) => {
    try {
      const response = await complaintAPI.updateComplaintStatus(complaintId, newStatus);
      if (response.success) {
        alert('Status updated successfully');
        loadComplaints();
        if (selectedComplaint?.id === complaintId) {
          setSelectedComplaint({ 
            ...selectedComplaint, 
            student_view: {
              ...selectedComplaint.student_view,
              status: newStatus
            }
          });
        }
      }
    } catch (error) {
      alert(`Failed to update status: ${error.message}`);
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

  const stats = {
    total: complaints.length,
    pending: complaints.filter((c) => {
      const status = c.student_view?.status || c.status || 'Pending';
      return status.toLowerCase() === 'pending';
    }).length,
    inProgress: complaints.filter((c) => {
      const status = c.student_view?.status || c.status || 'Pending';
      return status.toLowerCase().replace(' ', '_') === 'in_progress';
    }).length,
    resolved: complaints.filter((c) => {
      const status = c.student_view?.status || c.status || 'Pending';
      return status.toLowerCase() === 'resolved';
    }).length,
  };

  return (
    <>
      <Navbar />
      <div className="page-container">
        <div className="page-content">
          <div className="page-header">
            <i className={`fas ${currentDept.icon}`}></i>
            <div>
              <h1>{currentDept.name}</h1>
              <p>Manage and resolve complaints</p>
            </div>
            <button className="btn btn-secondary" onClick={() => navigate('/admin/dashboard')}>
              <i className="fas fa-arrow-left"></i> Back to Dashboard
            </button>
          </div>

          {/* Statistics */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              marginBottom: '2rem',
            }}
          >
            <div className="stat-card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
              <i className="fas fa-clipboard-list" style={{ fontSize: '2rem' }}></i>
              <h3>Total</h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.total}</p>
            </div>
            <div className="stat-card" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
              <i className="fas fa-hourglass-half" style={{ fontSize: '2rem' }}></i>
              <h3>Pending</h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.pending}</p>
            </div>
            <div className="stat-card" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
              <i className="fas fa-spinner" style={{ fontSize: '2rem' }}></i>
              <h3>In Progress</h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.inProgress}</p>
            </div>
            <div className="stat-card" style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
              <i className="fas fa-check-circle" style={{ fontSize: '2rem' }}></i>
              <h3>Resolved</h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.resolved}</p>
            </div>
          </div>

          {/* Mess Timetable Management - Only show for Mess department */}
          {currentDept.dept_id === 'MESS' && (
            <div className="content-card">
              <h2>
                <i className="fas fa-calendar-alt"></i> Mess Timetable Management
              </h2>
              
              {/* Current Timetable Display */}
              {currentTimetable && (
                <div className="alert alert-info" style={{ marginBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <i className="fas fa-file-pdf" style={{ marginRight: '0.5rem' }}></i>
                      <strong>Current Timetable:</strong> {currentTimetable.filename}
                      <br />
                      <small style={{ color: '#666', marginLeft: '1.5rem' }}>
                        Uploaded on {new Date(currentTimetable.uploaded_at).toLocaleString()}
                      </small>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <a
                        href={currentTimetable.file_url}
                        download={currentTimetable.filename}
                        className="btn btn-primary"
                        style={{ padding: '0.5rem 1rem', fontSize: '0.9rem', textDecoration: 'none' }}
                      >
                        <i className="fas fa-download"></i> Download
                      </a>
                      <button
                        className="btn btn-danger"
                        style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                        onClick={handleDeleteTimetable}
                      >
                        <i className="fas fa-trash"></i> Delete
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Upload New Timetable */}
              <div>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>
                  <i className="fas fa-upload"></i> Upload New Timetable
                </h3>
                <p style={{ color: '#666', marginBottom: '1rem' }}>
                  Upload a PDF file containing the mess timetable. Students will be able to download this from their portal.
                </p>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                  <div className="form-group" style={{ flex: 1, minWidth: '250px', marginBottom: 0 }}>
                    <label htmlFor="timetable-file">Select PDF File</label>
                    <input
                      type="file"
                      id="timetable-file"
                      accept="application/pdf"
                      onChange={handleFileSelect}
                      disabled={uploadingTimetable}
                    />
                    {selectedFile && (
                      <small style={{ color: '#28a745', display: 'block', marginTop: '0.5rem' }}>
                        <i className="fas fa-check-circle"></i> {selectedFile.name} selected
                      </small>
                    )}
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={handleUploadTimetable}
                    disabled={!selectedFile || uploadingTimetable}
                  >
                    <i className={uploadingTimetable ? 'fas fa-spinner fa-spin' : 'fas fa-upload'}></i>
                    {uploadingTimetable ? ' Uploading...' : ' Upload Timetable'}
                  </button>
                </div>
              </div>
            </div>
          )}

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

          {/* Complaints Table */}
          <div className="content-card">
            <h2>
              <i className="fas fa-list"></i> All Complaints ({filteredComplaints.length})
            </h2>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Student ID</th>
                    <th>Title</th>
                    <th>Severity</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredComplaints.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                        No complaints found
                      </td>
                    </tr>
                  ) : (
                    filteredComplaints.map((complaint) => {
                      const adminView = complaint.admin_view || {};
                      const studentView = complaint.student_view || {};
                      const severity = adminView.severity || studentView.severity || 3;
                      const status = studentView.status || 'Pending';
                      const timestamp = adminView.timestamp || studentView.timestamp || new Date().toISOString();
                      const complaintText = adminView.complaint || studentView.complaint || 'N/A';
                      const title = complaintText.split('\n')[0] || 'N/A';
                      
                      return (
                        <tr key={complaint.id}>
                          <td>{complaint.id}</td>
                          <td>{complaint.student_id || 'N/A'}</td>
                          <td>{title}</td>
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
                              onClick={() => {
                                setSelectedComplaint(complaint);
                                setShowDetailModal(true);
                              }}
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

      {/* Complaint Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedComplaint(null);
        }}
        title={<><i className="fas fa-info-circle"></i> Complaint Details</>}
      >
        {selectedComplaint && (() => {
          const adminView = selectedComplaint.admin_view || {};
          const studentView = selectedComplaint.student_view || {};
          const severity = adminView.severity || studentView.severity || 3;
          const status = studentView.status || 'Pending';
          const timestamp = adminView.timestamp || studentView.timestamp || new Date().toISOString();
          const complaintText = adminView.complaint || studentView.complaint || 'N/A';
          const summary = adminView.summary || '';
          const departments = adminView.departments || studentView.departments || [];
          const officerBrief = adminView.officer_brief || '';
          const suggestions = studentView.suggestions || [];
          
          return (
            <div>
              <div style={{ marginBottom: '1rem' }}>
                <strong>Complaint ID:</strong> {selectedComplaint.id}
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <strong>Institute:</strong> {adminView.institute || 'IIIT Nagpur'}
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <strong>Complaint:</strong>
                <p style={{ marginTop: '0.5rem', padding: '1rem', background: '#f8f9fa', borderRadius: '8px', whiteSpace: 'pre-wrap' }}>
                  {complaintText}
                </p>
              </div>
              {summary && (
                <div style={{ marginBottom: '1rem' }}>
                  <strong>AI Summary:</strong>
                  <p style={{ marginTop: '0.5rem', color: '#666', fontStyle: 'italic' }}>{summary}</p>
                </div>
              )}
              <div style={{ marginBottom: '1rem' }}>
                <strong>AI-Assessed Severity:</strong>{' '}
                <span className={getSeverityBadgeClass(severity)}>
                  {severity}/5
                </span>
                <small style={{ marginLeft: '0.5rem', color: '#666' }}>
                  (1=Minor, 5=Critical)
                </small>
              </div>
              {departments.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  <strong>Departments Assigned:</strong>
                  <div style={{ marginTop: '0.5rem' }}>
                    {departments.map((dept, idx) => (
                      <span key={idx} style={{ 
                        display: 'inline-block',
                        padding: '0.3rem 0.8rem',
                        margin: '0.2rem',
                        background: '#e3f2fd',
                        borderRadius: '12px',
                        fontSize: '0.9rem'
                      }}>
                        {dept}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {officerBrief && (
                <div style={{ marginBottom: '1rem' }}>
                  <strong>Officer Brief:</strong>
                  <p style={{ marginTop: '0.5rem', padding: '1rem', background: '#fff3cd', borderRadius: '8px' }}>
                    {officerBrief}
                  </p>
                </div>
              )}
              {suggestions.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  <strong>AI Suggestions for Student:</strong>
                  <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                    {suggestions.map((suggestion, idx) => (
                      <li key={idx} style={{ marginBottom: '0.5rem', color: '#666' }}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div style={{ marginBottom: '1rem' }}>
                <strong>Current Status:</strong>{' '}
                <span className={`status-badge ${getStatusBadgeClass(status.toLowerCase().replace(' ', '_'))}`}>
                  {status}
                </span>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <strong>Date:</strong> {new Date(timestamp).toLocaleString()}
              </div>

              <hr style={{ margin: '1.5rem 0' }} />

              <div className="form-group">
                <label><strong>Update Status</strong></label>
                <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
                  Update the complaint status to keep students informed about progress.
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <button
                    className="btn btn-warning"
                    onClick={() => handleUpdateStatus(selectedComplaint.id, 'Pending')}
                    disabled={status === 'Pending'}
                  >
                    <i className="fas fa-clock"></i> Mark Pending
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={() => handleUpdateStatus(selectedComplaint.id, 'In Progress')}
                    disabled={status === 'In Progress'}
                  >
                    <i className="fas fa-spinner"></i> Mark In Progress
                  </button>
                  <button
                    className="btn btn-success"
                    onClick={() => handleUpdateStatus(selectedComplaint.id, 'Resolved')}
                    disabled={status === 'Resolved'}
                  >
                    <i className="fas fa-check-circle"></i> Mark Resolved
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
      </Modal>

      <Footer />
    </>
  );
};

export default AdminComplaintManagement;
