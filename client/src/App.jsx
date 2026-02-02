import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import ClientDashboard from './pages/ClientDashboard';
import CandidateDashboard from './pages/CandidateDashboard';

const PrivateRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
  return children;
};

const DashboardRedirect = () => {
  const { user } = useAuth();
  if (user.role === 'ADMIN' || user.role === 'SUPPORT_FIC') return <Navigate to="/admin" />;
  if (user.role === 'CLIENT_SUPPORT') return <Navigate to="/client" />;
  return <Navigate to="/candidate" />;
};

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={
              <PrivateRoute>
                <DashboardRedirect />
              </PrivateRoute>
            } />
            <Route path="/admin" element={
              <PrivateRoute roles={['ADMIN', 'SUPPORT_FIC']}>
                <AdminDashboard />
              </PrivateRoute>
            } />
            <Route path="/client" element={
              <PrivateRoute roles={['CLIENT_SUPPORT']}>
                <ClientDashboard />
              </PrivateRoute>
            } />
            <Route path="/candidate" element={
              <PrivateRoute roles={['CANDIDATE']}>
                <CandidateDashboard />
              </PrivateRoute>
            } />
          </Routes>
        </Router>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
