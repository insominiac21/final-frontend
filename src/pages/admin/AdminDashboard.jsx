import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/shared/Navbar';
import Footer from '../../components/shared/Footer';
import { complaintAPI } from '../../services/api';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    resolved: 0,
  });

  useEffect(() => {
    loadComplaints();
  }, []);

  const loadComplaints = async () => {
    try {
      const response = await complaintAPI.getAllComplaints();
      if (response.success) {
        setComplaints(response.data);
        
        // Calculate stats
        const total = response.data.length;
        const pending = response.data.filter((c) => c.status === 'pending').length;
        const inProgress = response.data.filter((c) => c.status === 'in_progress').length;
        const resolved = response.data.filter((c) => c.status === 'resolved').length;
        
        setStats({ total, pending, inProgress, resolved });
      }
    } catch {
      // Handle error
    }
  };

  const amenities = [
    {
      name: 'Mess Management',
      icon: 'fa-utensils',
      description: 'Manage complaints, update timings, view reports',
      route: '/admin/mess',
      className: 'mess',
      pending: complaints.filter((c) => c.dept_id === 'MESS' && c.status === 'pending').length,
    },
    {
      name: 'Network Management',
      icon: 'fa-wifi',
      description: 'Monitor connectivity issues and IT complaints',
      route: '/admin/network',
      className: 'network',
      pending: complaints.filter((c) => c.dept_id === 'NETWORK' && c.status === 'pending').length,
    },
    {
      name: 'Maintenance',
      icon: 'fa-tools',
      description: 'Manage cleaning, water, and facility maintenance',
      route: '/admin/maintenance',
      className: 'maintenance',
      pending: complaints.filter((c) => ['MAINTENANCE', 'HOUSEKEEPING', 'WATER'].includes(c.dept_id) && c.status === 'pending').length,
    },
  ];

  const getStatusBadgeClass = (status) => {
    const statusMap = {
      pending: 'pending',
      in_progress: 'in-progress',
      resolved: 'resolved',
    };
    return statusMap[status] || 'pending';
  };

  const getSeverityBadgeClass = (severity) => {
    const severityMap = {
      low: 'severity-low',
      medium: 'severity-medium',
      high: 'severity-high',
    };
    return severityMap[severity] || 'severity-medium';
  };

  const highPriorityComplaints = complaints
    .filter((c) => c.severity === 'high')
    .slice(0, 5);

  return (
    <>
      <Navbar />
      <div className="dashboard-container">
        <div className="dashboard-content">
          <div className="dashboard-header">
            <h1>Admin Dashboard</h1>
            <p>Manage all campus amenities and resolve complaints</p>
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
              <h3 style={{ margin: '0.5rem 0' }}>Total Complaints</h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>{stats.total}</p>
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
              <i className="fas fa-hourglass-half" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}></i>
              <h3 style={{ margin: '0.5rem 0' }}>Pending</h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>{stats.pending}</p>
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
              <i className="fas fa-spinner" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}></i>
              <h3 style={{ margin: '0.5rem 0' }}>In Progress</h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>{stats.inProgress}</p>
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
              <i className="fas fa-check-circle" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}></i>
              <h3 style={{ margin: '0.5rem 0' }}>Resolved</h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold', margin: 0 }}>{stats.resolved}</p>
            </div>
          </div>

          {/* Amenity Management */}
          <div className="amenity-grid">
            {amenities.map((amenity) => (
              <div
                key={amenity.name}
                className={`amenity-card ${amenity.className}`}
                onClick={() => navigate(amenity.route)}
              >
                <i className={`fas ${amenity.icon} amenity-icon`}></i>
                <h3>{amenity.name}</h3>
                <p>{amenity.description}</p>
                <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  <strong>Pending: {amenity.pending}</strong>
                </div>
              </div>
            ))}
          </div>

          {/* Recent Complaints */}
          <div className="content-card">
            <h2>
              <i className="fas fa-bell"></i> Recent High-Priority Complaints
            </h2>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Amenity</th>
                  <th>Title</th>
                  <th>Student</th>
                  <th>Date</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {highPriorityComplaints.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>
                      No high-priority complaints
                    </td>
                  </tr>
                ) : (
                  highPriorityComplaints.map((complaint) => (
                    <tr key={complaint.complaint_id}>
                      <td>{complaint.complaint_id}</td>
                      <td>{complaint.dept_id}</td>
                      <td>{complaint.title}</td>
                      <td>{complaint.student_id}</td>
                      <td>{new Date(complaint.created_at).toLocaleDateString()}</td>
                      <td>
                        <span className={getSeverityBadgeClass(complaint.severity)}>
                          {complaint.severity}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${getStatusBadgeClass(complaint.status)}`}>
                          {complaint.status}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-success"
                          style={{ padding: '0.3rem 0.8rem', fontSize: '0.85rem' }}
                        >
                          View
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
      <Footer />
    </>
  );
};

export default AdminDashboard;
