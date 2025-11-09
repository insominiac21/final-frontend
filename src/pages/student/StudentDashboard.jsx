import { useState} from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/shared/Navbar';
import Footer from '../../components/shared/Footer';
import Chatbot from '../../components/shared/Chatbot';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [showFAQ, setShowFAQ] = useState(false);
  const [openFAQIndex, setOpenFAQIndex] = useState(null);
  const [showChatbot, setShowChatbot] = useState(false);

  const amenities = [
    {
      name: 'Mess',
      icon: 'fa-utensils',
      description: 'View timings, menus, and submit complaints about mess services',
      route: '/student/mess',
      className: 'mess',
    },
    {
      name: 'Transport',
      icon: 'fa-bus',
      description: 'Check bus schedules, book cabs, and view auto contacts',
      route: '/student/transport',
      className: 'transport',
    },
    {
      name: 'Network',
      icon: 'fa-wifi',
      description: 'Report connectivity issues and track network complaints',
      route: '/student/network',
      className: 'network',
    },
    {
      name: 'Maintenance',
      icon: 'fa-tools',
      description: 'Request cleaning, water, and facility maintenance services',
      route: '/student/maintenance',
      className: 'maintenance',
    },
    {
      name: 'Carpool',
      icon: 'fa-car-side',
      description: 'Share rides with fellow students, save costs and environment',
      route: '/student/carpool',
      className: 'carpool',
    },
  ];

  const faqs = [
    {
      question: 'How do I submit a complaint?',
      answer: 'Navigate to the specific amenity page (Mess, Transport, etc.) and fill out the complaint form with all required details. You\'ll receive a complaint ID for tracking.',
    },
    {
      question: 'How do I track my complaints?',
      answer: 'Each amenity page has a "Status Tracker" section where you can view all your submitted complaints and their current status.',
    },
    {
      question: 'How do I book a cab?',
      answer: 'Go to the Transport page and click "Book a Cab". Fill in your journey details and submit. You\'ll get confirmation once a driver accepts.',
    },
    {
      question: 'What is Carpool and how does it work?',
      answer: 'Carpool allows students to share rides. You can either post your ride or join available rides. It\'s a great way to save money and reduce carbon footprint!',
    },
    {
      question: 'Who do I contact for urgent issues?',
      answer: 'For urgent issues, contact: amenities@iiitn.ac.in or call +91-XXX-XXX-XXXX. For medical emergencies, dial campus security immediately.',
    },
  ];

  const toggleFAQ = (index) => {
    setOpenFAQIndex(openFAQIndex === index ? null : index);
  };

  return (
    <>
      <Navbar />
      <div className="dashboard-container">
        <div className="dashboard-content">
          <div className="dashboard-header">
            <h1>Welcome to IIIT Nagpur Amenities Dashboard</h1>
            <p>Select an amenity to manage complaints, book services, or view information</p>
          </div>

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
              </div>
            ))}
          </div>

          <div className="content-card">
            <h2>
              <i className="fas fa-bell"></i> Recent Announcements
            </h2>
            <div className="alert alert-info">
              <i className="fas fa-info-circle"></i>
              <span>Mess timings updated for weekend. Check Mess page for details.</span>
            </div>
            <div className="alert alert-warning">
              <i className="fas fa-exclamation-triangle"></i>
              <span>Network maintenance scheduled for tomorrow 2:00 AM - 4:00 AM</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chatbot Float */}
      <button 
        className="chatbot-float-btn" 
        onClick={() => setShowChatbot(true)}
        aria-label="Open help desk chatbot"
      >
        <i className="fas fa-robot"></i>
      </button>

      {/* Chatbot */}
      <Chatbot isOpen={showChatbot} onClose={() => setShowChatbot(false)} />

      {/* FAQ Modal */}
      {showFAQ && (
        <div className="modal" onClick={() => setShowFAQ(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <i className="fas fa-question-circle"></i> Frequently Asked Questions
              </h2>
              <button className="close-modal" onClick={() => setShowFAQ(false)}>
                &times;
              </button>
            </div>
            <ul className="faq-list">
              {faqs.map((faq, index) => (
                <li key={index} className="faq-item">
                  <div className="faq-question" onClick={() => toggleFAQ(index)}>
                    {faq.question} <i className="fas fa-chevron-down"></i>
                  </div>
                  {openFAQIndex === index && (
                    <div className="faq-answer">{faq.answer}</div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
};

export default StudentDashboard;
