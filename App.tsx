import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
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
import Onboarding from './pages/public/Onboarding'; // New Import
import { StorageService } from './services/storage';

const App = () => {
  useEffect(() => {
    StorageService.init();
  }, []);

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/onboarding" element={<Onboarding />} /> {/* New Route */}
        
        {/* Admin Routes */}
        <Route path="/admin/*" element={
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
        } />

        {/* Client Routes */}
        <Route path="/client/login" element={<ClientLogin />} />
        <Route path="/client/*" element={
          <Layout role="client">
             <Routes>
              <Route path="dashboard" element={<ClientDashboard />} />
              <Route path="services" element={<ClientDashboard />} /> 
              <Route path="finances" element={<div className="p-10 text-center text-gray-500">Historial de Pagos (Demo)</div>} />
              <Route path="*" element={<Navigate to="dashboard" />} />
             </Routes>
          </Layout>
        } />
      </Routes>
    </HashRouter>
  );
};

export default App;