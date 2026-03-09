// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

//Styles
import './styles/Layout.css';
import './styles/TailwindEnhancement.css';
import './styles/Animations.css';
import './styles/GlobalStyles.css';
import './styles/PageStyles.css';

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

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes - No login required */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/test-firebase" element={<TestFirebase />} />

          {/* Protected Routes - Login required */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/residents"
            element={
              <ProtectedRoute>
                <Layout>
                  <Residents />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/documents"
            element={
              <ProtectedRoute>
                <Layout>
                  <Documents />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/incidents"
            element={
              <ProtectedRoute>
                <Layout>
                  <Incidents />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/announcements"
            element={
              <ProtectedRoute>
                <Layout>
                  <Announcements />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/events"
            element={
              <ProtectedRoute>
                <Layout>
                  <Events />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/health"
            element={
              <ProtectedRoute>
                <Layout>
                  <HealthServices />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/welfare"
            element={
              <ProtectedRoute>
                <Layout>
                  <SocialWelfare />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/waste"
            element={
              <ProtectedRoute>
                <Layout>
                  <WasteManagement />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/finance"
            element={
              <ProtectedRoute>
                <Layout>
                  <Finance />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/drrm"
            element={
              <ProtectedRoute>
                <Layout>
                  <DRRM />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Layout>
                  <Settings />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Default Route - Redirect to login */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* 404 Not Found */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;