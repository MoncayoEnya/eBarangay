// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

//Styles
import './styles/Layout.css';
import './styles/Tailwindenhancement.css';
import './styles/Animations.css';
import './styles/Globalstyles.css';
import './styles/Pagestyles.css';
// UI Enhancement layer — must come last to override
import './styles/UIEnhancements.css';
import './styles/MobileEnhancements.css';
import './styles/PageEnhancements.css';

// Auth Pages
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';

// Main Pages
import Dashboard from './pages/Dashboard';
import Residents from './pages/Residents';
import Documents from './pages/Documents';
import Incidents from './pages/Incidents';
import Announcements from './pages/Announcements';
import Events from './pages/Events';
import HealthServices from './pages/HealthServices';
import SocialWelfare from './pages/SocialWelfare';
import WasteManagement from './pages/WasteManagement';
import Finance from './pages/Finance';
import DRRM from './pages/DRRM';
import Settings from './pages/Settings';

// Test Page
import TestFirebase from './pages/TestFirebase';

// Layout Component
import Layout from './components/layout/Layout';

const Protected = ({ children }) => (
  <ProtectedRoute>
    <Layout>{children}</Layout>
  </ProtectedRoute>
);

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login"         element={<Login />} />
          <Route path="/signup"        element={<Signup />} />
          <Route path="/test-firebase" element={<TestFirebase />} />

          {/* Protected Routes */}
          <Route path="/dashboard"     element={<Protected><Dashboard /></Protected>} />
          <Route path="/residents"     element={<Protected><Residents /></Protected>} />
          <Route path="/documents"     element={<Protected><Documents /></Protected>} />
          <Route path="/incidents"     element={<Protected><Incidents /></Protected>} />
          <Route path="/announcements" element={<Protected><Announcements /></Protected>} />
          <Route path="/events"        element={<Protected><Events /></Protected>} />
          <Route path="/drrm"          element={<Protected><DRRM /></Protected>} />
          <Route path="/finance"       element={<Protected><Finance /></Protected>} />
          <Route path="/settings"      element={<Protected><Settings /></Protected>} />

          {/* ✅ FIXED — must match sidebarNav.js exactly */}
          <Route path="/health-services"  element={<Protected><HealthServices /></Protected>} />
          <Route path="/social-welfare"   element={<Protected><SocialWelfare /></Protected>} />
          <Route path="/waste-management" element={<Protected><WasteManagement /></Protected>} />

          {/* Default */}
          <Route path="/"  element={<Navigate to="/login" replace />} />
          <Route path="*"  element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;