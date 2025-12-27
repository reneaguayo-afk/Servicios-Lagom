
import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import Landing from './pages/Landing';
import Dashboard from './pages/admin/Dashboard';
import Cases from './pages/admin/Cases';
import CaseDetail from './pages/admin/CaseDetail';
import Clients from './pages/admin/Clients';
import Services from './pages/admin/Services';
import Finances from './pages/admin/Finances';
import RiskCenter from './pages/admin/RiskCenter';
import AdminProfile from './pages/admin/Profile';
import Library from './pages/admin/Library'; 
import ClientLogin from './pages/client/ClientLogin';
import ClientDashboard from './pages/client/ClientDashboard';
import Onboarding from './pages/public/Onboarding';
import AdminLogin from './pages/admin/AdminLogin';
import { StorageService } from './services/storage';

// HOC para proteger rutas administrativas
// Fix: Use React.PropsWithChildren to ensure children are correctly typed and avoid "missing in type {}" error
const AdminGuard = ({ children }: React.PropsWithChildren<{}>) => {
  const isAuthenticated = StorageService.isAdminAuthenticated();
  return isAuthenticated ? <>{children}</> : <Navigate to="/admin/login" />;
};

const App = () => {
  useEffect(() => {
    StorageService.init();
  }, []);

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/onboarding" element={<Onboarding />} />
        
        {/* Admin Login */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Admin Routes (Protected) */}
        <Route path="/admin/*" element={
          <AdminGuard>
            <Layout role="admin">
              <Routes>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="risk-center" element={<RiskCenter />} />
                <Route path="cases" element={<Cases />} />
                <Route path="cases/:id" element={<CaseDetail />} />
                <Route path="clients" element={<Clients />} />
                <Route path="services" element={<Services />} />
                <Route path="library" element={<Library />} />
                <Route path="finances" element={<Finances />} />
                <Route path="profile" element={<AdminProfile />} />
                <Route path="*" element={<Navigate to="dashboard" />} />
              </Routes>
            </Layout>
          </AdminGuard>
        } />

        {/* Client Routes */}
        <Route path="/client/login" element={<ClientLogin />} />
        <Route path="/client/*" element={
          <Layout role="client">
             <Routes>
              <Route path="dashboard" element={<ClientDashboard />} />
              <Route path="services" element={<ClientDashboard />} /> 
              <Route path="*" element={<Navigate to="dashboard" />} />
             </Routes>
          </Layout>
        } />
      </Routes>
    </HashRouter>
  );
};

export default App;
