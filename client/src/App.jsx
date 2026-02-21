import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import ClientDashboard from './pages/ClientDashboard';
import CandidateDashboard from './pages/CandidateDashboard';
import AgencyDashboard from './pages/AgencyDashboard';

const PrivateRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
  return children;
};

const DashboardRedirect = () => {
  const { user } = useAuth();
  if (user.role === 'ADMIN' || user.role === 'SUPPORT_FIC' || user.role === 'SUB_ADMIN') return <Navigate to="/admin" />;
  if (user.role === 'CLIENT_SUPPORT') return <Navigate to="/client" />;
  if (user.role === 'AGENCY_ADMIN' || user.role === 'AGENT') return <Navigate to="/agency" />;
  return <Navigate to="/candidate" />;
};

import ClientRequestPortal from './pages/ClientRequestPortal';

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/request-services" element={<ClientRequestPortal />} />
            <Route path="/" element={
              <PrivateRoute>
                <DashboardRedirect />
              </PrivateRoute>
            } />
            <Route path="/admin" element={
              <PrivateRoute roles={['ADMIN', 'SUPPORT_FIC', 'SUB_ADMIN']}>
                <AdminDashboard />
              </PrivateRoute>
            } />
            <Route path="/agency" element={
              <PrivateRoute roles={['AGENCY_ADMIN', 'AGENT']}>
                <AgencyDashboard />
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
