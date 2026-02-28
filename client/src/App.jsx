import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import ClientDashboard from './pages/ClientDashboard';
import CandidateDashboard from './pages/CandidateDashboard';
import AgencyDashboard from './pages/AgencyDashboard';
import HRDashboard from './pages/HRDashboard';


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
  if (user.role === 'CLIENT_SUPPORT') {
    // If they are an internal FIC HR staff (mapped via Client type)
    if (user.clientId?.type === 'FIC_HR') return <Navigate to="/hr" />;
    if (user.clientId?.type === 'IT') return <Navigate to="/it-portal" />;
    if (user.clientId?.type === 'NON_IT') return <Navigate to="/non-it-portal" />;
    return <Navigate to="/banking-portal" />;
  }
  if (user.role === 'AGENCY_ADMIN' || user.role === 'AGENT') return <Navigate to="/agency" />;
  if (user.role === 'HR') return <Navigate to="/hr" />;
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
            <Route path="/register" element={<Navigate to="/login" replace />} />
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
              <PrivateRoute roles={['CLIENT_SUPPORT', 'ADMIN']}>
                <ClientDashboard />
              </PrivateRoute>
            } />
            <Route path="/banking-portal" element={
              <PrivateRoute roles={['CLIENT_SUPPORT', 'ADMIN']}>
                <ClientDashboard />
              </PrivateRoute>
            } />
            <Route path="/it-portal" element={
              <PrivateRoute roles={['CLIENT_SUPPORT', 'ADMIN']}>
                <ClientDashboard />
              </PrivateRoute>
            } />
            <Route path="/non-it-portal" element={
              <PrivateRoute roles={['CLIENT_SUPPORT', 'ADMIN']}>
                <ClientDashboard />
              </PrivateRoute>
            } />
            <Route path="/hr" element={
              <PrivateRoute roles={['HR', 'CLIENT_SUPPORT', 'ADMIN']}>
                <HRDashboard />
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
