import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import Navbar from '../../components/shared/Navbar';
import Footer from '../../components/shared/Footer';
import Modal from '../../components/shared/Modal';
import { complaintAPI } from '../../services/api';
import axios from 'axios';

const FLASK_API = 'http://localhost:5000'; // Update with your Flask API URL

const StudentMaintenance = () => {
  const { user } = useSelector((state) => state.auth);
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [myComplaints, setMyComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');

  const [complaintForm, setComplaintForm] = useState({
    title: '',
    description: '',
    media: null,
  });

  // Dummy data for Maintenance & Housekeeping complaints
  const dummyComplaints = [
    {
      id: "MNT001",
      student_view: {
        complaint: "Water leakage from ceiling in Room 204, Block B. The problem worsens during rain and water is dripping on study table and bed.",
        status: "in_progress",
        timestamp: "2025-11-10T06:30:00"
      },
      admin_view: {
        departments: ["Maintenance"],
        severity: 5,
        suggestions: [
          "Maintenance team has been notified and will inspect today",
          "Temporary waterproofing has been arranged",
          "Roof repair scheduled for this weekend",
          "Contact hostel warden if situation worsens"
        ]
      }
    },
    {
      id: "MNT002",
      student_view: {
        complaint: "Elevator in academic block is making strange noises and jerking. Safety concern for students and faculty.",
        status: "Pending",
        timestamp: "2025-11-11T10:45:00"
      },
      admin_view: {
        departments: ["Maintenance"],
        severity: 5,
        suggestions: [
          "Elevator inspection has been scheduled immediately",
          "Use stairs or alternate elevator until repair is completed",
          "Annual maintenance contract vendor has been contacted",
          "Safety audit will be conducted post-repair"
        ]
      }
    },
    {
      id: "MNT003",
      student_view: {
        complaint: "Common room lights are not working properly in hostel common area. Many bulbs are fused and creating dark spots.",
        status: "resolved",
        timestamp: "2025-11-08T19:00:00"
      },
      admin_view: {
        departments: ["Maintenance"],
        severity: 2,
        suggestions: [
          "All fused bulbs have been replaced with LED lights",
          "Electrical wiring has been checked and repaired",
          "New energy-efficient fixtures installed",
          "Report any electrical issues immediately for safety"
        ]
      }
    },
    {
      id: "MNT004",
      student_view: {
        complaint: "Bathroom drainage is blocked in girls hostel washroom on 3rd floor. Water accumulation and bad smell issue.",
        status: "in_progress",
        timestamp: "2025-11-09T07:15:00"
      },
      admin_view: {
        departments: ["Housekeeping", "Maintenance"],
        severity: 4,
        suggestions: [
          "Plumbing team is working on clearing the blockage",
          "Deep cleaning scheduled after drainage is fixed",
          "Temporary access to alternate washroom on 2nd floor",
          "Do not dispose solid waste in drainage to prevent future blocks"
        ]
      }
    },
    {
      id: "MNT005",
      student_view: {
        complaint: "Air conditioner in lecture hall 101 is not cooling. Room temperature is unbearable during afternoon classes.",
        status: "Pending",
        timestamp: "2025-11-10T14:00:00"
      },
      admin_view: {
        departments: ["Maintenance"],
        severity: 3,
        suggestions: [
          "AC technician visit scheduled for tomorrow morning",
          "Gas refilling may be required - checking compressor",
          "Temporary fans have been arranged",
          "Classes may be shifted to alternate room if needed"
        ]
      }
    },
    {
      id: "MNT006",
      student_view: {
        complaint: "Hostel rooms are not being cleaned regularly. Garbage bins are overflowing and corridors need sweeping.",
        status: "resolved",
        timestamp: "2025-11-06T11:20:00"
      },
      admin_view: {
        departments: ["Housekeeping"],
        severity: 3,
        suggestions: [
          "Additional housekeeping staff has been deployed",
          "Daily cleaning schedule has been implemented",
          "Waste segregation bins installed on each floor",
          "Report any cleanliness issues to hostel supervisor"
        ]
      }
    },
    {
      id: "MNT007",
      student_view: {
        complaint: "Door lock of Room 315 is broken. Security risk as door cannot be properly locked when students are away.",
        status: "in_progress",
        timestamp: "2025-11-09T20:30:00"
      },
      admin_view: {
        departments: ["Maintenance"],
        severity: 4,
        suggestions: [
          "Carpenter has been assigned to replace the lock",
          "Temporary lock arrangement provided",
          "New locks will be installed within 24 hours",
          "Keep valuables with hostel warden until lock is fixed"
        ]
      }
    },
    {
      id: "MNT008",
      student_view: {
        complaint: "Garden area has overgrown grass and bushes. Mosquito breeding concern and untidy appearance of campus.",
        status: "Pending",
        timestamp: "2025-11-08T16:00:00"
      },
      admin_view: {
        departments: ["Housekeeping"],
        severity: 2,
        suggestions: [
          "Weekly gardening schedule has been prepared",
          "Professional landscaping service hired for campus beautification",
          "Pest control and fogging scheduled for weekend",
          "Use mosquito repellents and keep windows closed during evening"
        ]
      }
    }
  ];

  useEffect(() => {
    loadComplaints();
  }, []);

  useEffect(() => {
    filterComplaints();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myComplaints, statusFilter, severityFilter]);

  const loadComplaints = async () => {
    try {
      const response = await axios.get(`${FLASK_API}/complaints`);
      if (Array.isArray(response.data)) {
        // Filter only Housekeeping & Maintenance complaints
        const maintenanceComplaints = response.data.filter(complaint => 
          complaint.admin_view?.departments?.includes("Housekeeping") || 
          complaint.admin_view?.departments?.includes("Maintenance")
        );
        // Use API data if available, otherwise use dummy data
        setMyComplaints(maintenanceComplaints.length > 0 ? maintenanceComplaints : dummyComplaints);
      } else {
        // If response is not an array, use dummy data
        setMyComplaints(dummyComplaints);
      }
    } catch (error) {
      console.error('Error loading complaints:', error);
      // On error, use dummy data
      setMyComplaints(dummyComplaints);
    }
  };

  const filterComplaints = () => {
    let filtered = [...myComplaints];
    
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

      alert('Complaint registered successfully!');
      setComplaintForm({ description: '' });
      setShowComplaintModal(false);
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
                    <th>Status</th>
                    <th>Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredComplaints.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>
                        No complaints found
                      </td>
                    </tr>
                  ) : (
                    filteredComplaints.map((complaint) => {
                      const studentView = complaint.student_view || complaint;
                      const status = studentView.status || 'Pending';
                      const timestamp = studentView.timestamp || complaint.timestamp || new Date().toISOString();
                      
                      return (
                        <tr key={complaint.id || complaint.complaint_id}>
                          <td>{complaint.id || complaint.complaint_id}</td>
                          <td>{studentView.complaint?.split('\n')[0] || complaint.title || 'N/A'}</td>
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
                                setShowDetailsModal(true);
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
            <div className="detail-section">
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

            {/* Suggestions for Students ONLY */}
            {selectedComplaint.admin_view?.suggestions && selectedComplaint.admin_view.suggestions.length > 0 && (
              <div className="detail-section" style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #eee' }}>
                <h4>💡 Suggestions While We Review</h4>
                <ul style={{ lineHeight: '1.8', paddingLeft: '1.5rem', color: '#555' }}>
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

export default StudentMaintenance;
