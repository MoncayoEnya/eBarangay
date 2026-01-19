import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Residents from './pages/Residents';
import Documents from './pages/Documents';
import Incidents from './pages/Incidents';
import Announcements from './pages/Announcements';
import Events from './pages/Events';
import DRRM from './pages/DRRM';
import WasteManagement from './pages/WasteManagement';
import SocialWelfare from './pages/SocialWelfare';
import HealthServices from './pages/HealthServices';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="residents" element={<Residents />} />
          <Route path="documents" element={<Documents />} />
          <Route path="incidents" element={<Incidents />} />
          <Route path="announcements" element={<Announcements />} />
          <Route path="events" element={<Events />} />
          <Route path="drrm" element={<DRRM />} />
          <Route path="waste-management" element={<WasteManagement />} />
          <Route path="social-welfare" element={<SocialWelfare />} />
          <Route path="health-services" element={<HealthServices />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;