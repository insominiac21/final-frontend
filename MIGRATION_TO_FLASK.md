# Migration to Flask Backend with AI-Powered Complaint Processing

## Overview

The project has been successfully migrated to integrate with a Flask backend that uses AI (LLM) to automatically process and categorize student complaints. This document outlines all the changes made and how to use the new system.

## Key Changes

### 1. **AI-Powered Severity Assessment**
- **Old System**: Students manually selected severity (Low/Medium/High)
- **New System**: AI automatically assesses severity on a 1-5 scale
  - 1: Very minor inconvenience
  - 2: Minor issue, can wait
  - 3: Moderate issue, causes discomfort
  - 4: Serious problem, needs quick attention
  - 5: Critical or safety issue, requires immediate response

### 2. **Simplified Student Complaint Form**
Students now only need to provide:
- **Title**: Brief description of the issue
- **Description**: Detailed explanation
- **Media** (Optional): Photo/video evidence

The AI automatically:
- Assesses severity (1-5)
- Categorizes into departments
- Generates helpful suggestions
- Creates an officer brief for admins

### 3. **Enhanced Admin View**
Admins now see:
- **AI Summary**: Concise summary of the complaint
- **Severity Score**: 1-5 scale (AI-assessed)
- **Department Assignments**: Auto-categorized departments
- **Officer Brief**: Executive summary for quick action
- **Student Suggestions**: AI-generated interim advice for students
- **Status Management**: Update status (Pending → In Progress → Resolved)

## File Changes

### Backend Files

#### `/flask-stuff/complain.py`
- Added `/complaints/<id>/status` PATCH endpoint
- Supports status updates: "Pending", "In Progress", "Resolved"
- Admin notes can be attached to status updates

### Frontend Files

#### `/src/conf/config.js`
```javascript
export const FLASK_API_URL = 'http://localhost:5000';
```

#### `/src/services/api.js`
- New `flaskApiCall()` helper function
- `submitComplaint()`: Sends complaint text to Flask `/process` endpoint
- `getAllComplaints()`: Fetches from Flask `/complaints` endpoint
- `updateComplaintStatus()`: PATCH to update status
- Backward-compatible with legacy methods

#### Student Pages (Updated)
- `/src/pages/student/StudentMess.jsx`
- `/src/pages/student/StudentMaintenance.jsx`
- `/src/pages/student/StudentNetwork.jsx`

**Changes:**
- Removed manual severity selection
- Added AI assessment notice
- Display severity as X/5 format
- Submit complaints via Flask backend

#### Admin Pages (Updated)
- `/src/pages/admin/AdminComplaintManagement.jsx`

**Changes:**
- Display AI-generated data (summary, severity, departments, officer brief)
- Show student suggestions
- Enhanced complaint detail modal
- Status update buttons (Pending/In Progress/Resolved)
- Filters adapted for 1-5 severity scale

## How to Run

### 1. Start Flask Backend

```bash
cd flask-stuff

# Install dependencies (first time only)
pip install -r requirements.txt

# Set up environment variables
# Create a .env file with:
GROQ_API_KEY=your_groq_api_key_here

# Run the Flask server
python complain.py
```

The Flask server will run on `http://localhost:5000`

### 2. Start Frontend

```bash
# In project root
npm install  # First time only
npm run dev
```

The frontend will run on `http://localhost:5173` (or your configured port)

## API Endpoints

### Flask Backend Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| POST | `/process` | Submit new complaint (AI processing) |
| GET | `/complaints` | Get all complaints |
| GET | `/complaints/<id>` | Get specific complaint |
| PATCH | `/complaints/<id>/status` | Update complaint status |

### POST `/process` Example

**Request:**
```json
{
  "complaint": "The WiFi in hostel block A is not working since yesterday. Cannot attend online classes."
}
```

**Response:**
```json
{
  "id": 1699123456789,
  "student_view": {
    "complaint": "...",
    "departments": ["Network & IT"],
    "contacts": {
      "Network & IT": "it@iiit-nagpur.ac.in"
    },
    "suggestions": [
      "Try connecting to a different WiFi network if available",
      "Check if other devices have the same issue",
      "Contact the IT helpdesk via phone for urgent matters"
    ],
    "severity": 4,
    "institute": "IIIT Nagpur",
    "timestamp": "2025-11-09T...",
    "status": "Pending"
  },
  "admin_view": {
    "timestamp": "2025-11-09T...",
    "severity": 4,
    "summary": "WiFi connectivity issue in hostel block A",
    "complaint": "...",
    "departments": ["Network & IT"],
    "institute": "IIIT Nagpur",
    "officer_brief": "A student complaint has been received regarding WiFi connectivity issue in hostel block A. It is rated 4/5 in severity and forwarded to the Network & IT department(s)."
  }
}
```

### PATCH `/complaints/<id>/status` Example

**Request:**
```json
{
  "status": "In Progress",
  "admin_notes": "IT team dispatched to investigate"
}
```

**Response:**
```json
{
  "id": 1699123456789,
  "student_view": {
    "status": "In Progress",
    ...
  },
  "admin_view": {
    "status": "In Progress",
    "admin_notes": "IT team dispatched to investigate",
    "updated_at": "2025-11-09T...",
    ...
  }
}
```

## Data Flow

### Student Submits Complaint:
1. Student fills title + description (+ optional media)
2. Frontend combines into complaint text
3. POST to Flask `/process`
4. Flask LLM analyzes and categorizes
5. Stored in `complaints_store.json`
6. Response shown to student with AI severity

### Admin Views Complaint:
1. Admin opens complaint management
2. Frontend GET from Flask `/complaints`
3. Display with AI summary, severity, departments, officer brief
4. Admin updates status via PATCH
5. Student sees updated status

## Schema Comparison

### Old Schema (Manual)
```javascript
{
  complaint_id: 'C001',
  student_id: 'student_123',
  title: 'WiFi Issue',
  description: 'WiFi not working',
  severity: 'medium',  // Manual selection
  status: 'pending',
  dept_id: 'NETWORK',  // Manual selection
  created_at: '2025-11-09T...'
}
```

### New Schema (AI-Powered)
```javascript
{
  id: 1699123456789,
  category: 'network',  // Set by frontend
  student_view: {
    complaint: 'WiFi Issue\n\nWiFi not working',
    departments: ['Network & IT'],  // AI categorized
    contacts: {...},
    suggestions: [...],  // AI generated
    severity: 4,  // AI assessed (1-5)
    status: 'Pending',
    timestamp: '...',
    institute: 'IIIT Nagpur'
  },
  admin_view: {
    timestamp: '...',
    severity: 4,  // AI assessed
    summary: 'WiFi connectivity issue',  // AI summary
    complaint: '...',
    departments: ['Network & IT'],
    officer_brief: '...',  // AI brief
    institute: 'IIIT Nagpur',
    status: 'Pending',
    admin_notes: '',
    updated_at: '...'
  }
}
```

## Benefits of New System

### For Students:
✅ Faster complaint submission (no manual categorization)  
✅ AI-generated helpful suggestions while waiting  
✅ Automatic severity assessment based on urgency  
✅ Department contact information provided  

### For Admins:
✅ AI summary for quick understanding  
✅ Automatic department routing  
✅ Officer briefs for management reporting  
✅ Severity score helps prioritize critical issues  
✅ Status tracking (Pending → In Progress → Resolved)  

### For System:
✅ More accurate severity assessment  
✅ Better department categorization  
✅ Reduced manual data entry errors  
✅ Scalable AI-powered processing  

## Environment Variables

Create a `.env` file in the `flask-stuff` directory:

```env
GROQ_API_KEY=your_groq_api_key_here
```

Get your Groq API key from: https://console.groq.com/

## Troubleshooting

### Flask Backend Not Responding
- Check if Flask is running: `curl http://localhost:5000/health`
- Verify GROQ_API_KEY is set in `.env`
- Check Flask logs for errors

### Frontend Can't Connect
- Verify FLASK_API_URL in `src/conf/config.js`
- Check CORS is enabled in Flask
- Open browser console for network errors

### Severity Not Displaying Correctly
- Ensure severity is a number (1-5), not string
- Check `getSeverityBadgeClass()` function
- Verify API response structure

## Future Enhancements

- [ ] Media upload integration with Flask
- [ ] Real-time notifications for status updates
- [ ] Admin dashboard with AI analytics
- [ ] Historical trend analysis
- [ ] Multi-language support for complaints
- [ ] Email notifications to students

## Questions?

Contact the development team or refer to:
- `PROJECT_SUMMARY.md` for project overview
- `API_ENDPOINTS.md` for detailed API documentation
- `README.md` for general setup instructions
