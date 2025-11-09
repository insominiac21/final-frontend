import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import './App.css';
//ek change
// Landing & Auth Pages
import Landing from './pages/Landing';
import StudentLogin from './pages/auth/StudentLogin';
import StudentRegister from './pages/auth/StudentRegister';
import AdminLogin from './pages/auth/AdminLogin';
import DriverLogin from './pages/auth/DriverLogin';

// Student Pages
import StudentDashboard from './pages/student/StudentDashboard';
import StudentMess from './pages/student/StudentMess';
import StudentTransport from './pages/student/StudentTransport';
import StudentCarpool from './pages/student/StudentCarpool';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';

// Driver Pages
import DriverDashboard from './pages/driver/DriverDashboard';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/student/login" element={<StudentLogin />} />
        <Route path="/student/register" element={<StudentRegister />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/driver/login" element={<DriverLogin />} />

        {/* Student Protected Routes */}
        <Route
          path="/student/dashboard"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/mess"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentMess />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/transport"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentTransport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/carpool"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentCarpool />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/network"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentMess />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/housekeeping"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentMess />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/water"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentMess />
            </ProtectedRoute>
          }
        />

        {/* Admin Protected Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/mess"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/transport"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/network"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/housekeeping"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/water"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Driver Protected Routes */}
        <Route
          path="/driver/dashboard"
          element={
            <ProtectedRoute allowedRoles={['driver']}>
              <DriverDashboard />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

