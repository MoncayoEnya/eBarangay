// src/components/layout/common/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Basic protected route - requires authentication only
 */
export default function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

/**
 * Role-based protected route - requires specific role(s)
 * @param {string|string[]} allowedRoles - Single role or array of allowed roles
 */
export const RoleProtectedRoute = ({ children, allowedRoles }) => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const userRole = currentUser.profile?.role;
  
  // Check if user has required role
  const hasRequiredRole = Array.isArray(allowedRoles)
    ? allowedRoles.includes(userRole)
    : userRole === allowedRoles;

  if (!hasRequiredRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

/**
 * Module-based protected route - checks module permissions
 * @param {string} module - Module name (e.g., 'residents', 'documents')
 * @param {string} action - Required action ('read', 'write', 'delete')
 */
export const ModuleProtectedRoute = ({ children, module, action = 'read' }) => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const userRole = currentUser.profile?.role;

  // Define permissions matrix (same as in useAuth.js)
  const permissions = {
    chairman: {
      residents: { read: true, write: true, delete: true },
      documents: { read: true, write: true, delete: true },
      incidents: { read: true, write: true, delete: true },
      announcements: { read: true, write: true, delete: true },
      events: { read: true, write: true, delete: true },
      health: { read: true, write: false, delete: false },
      welfare: { read: true, write: true, delete: true },
      waste: { read: true, write: true, delete: true },
      finance: { read: true, write: false, delete: false },
      drrm: { read: true, write: true, delete: true },
      settings: { read: true, write: true, delete: true },
      dashboard: { read: true, write: false, delete: false }
    },
    secretary: {
      residents: { read: true, write: true, delete: false },
      documents: { read: true, write: true, delete: false },
      incidents: { read: true, write: true, delete: false },
      announcements: { read: true, write: true, delete: false },
      events: { read: true, write: true, delete: false },
      health: { read: false, write: false, delete: false },
      welfare: { read: true, write: true, delete: false },
      waste: { read: true, write: false, delete: false },
      finance: { read: false, write: false, delete: false },
      drrm: { read: true, write: true, delete: false },
      settings: { read: true, write: false, delete: false },
      dashboard: { read: true, write: false, delete: false }
    },
    treasurer: {
      residents: { read: true, write: false, delete: false },
      documents: { read: true, write: false, delete: false },
      incidents: { read: false, write: false, delete: false },
      announcements: { read: true, write: false, delete: false },
      events: { read: true, write: false, delete: false },
      health: { read: false, write: false, delete: false },
      welfare: { read: true, write: false, delete: false },
      waste: { read: false, write: false, delete: false },
      finance: { read: true, write: true, delete: false },
      drrm: { read: false, write: false, delete: false },
      settings: { read: true, write: false, delete: false },
      dashboard: { read: true, write: false, delete: false }
    },
    health_worker: {
      residents: { read: true, write: false, delete: false },
      documents: { read: false, write: false, delete: false },
      incidents: { read: false, write: false, delete: false },
      announcements: { read: true, write: false, delete: false },
      events: { read: true, write: false, delete: false },
      health: { read: true, write: true, delete: false },
      welfare: { read: false, write: false, delete: false },
      waste: { read: false, write: false, delete: false },
      finance: { read: false, write: false, delete: false },
      drrm: { read: false, write: false, delete: false },
      settings: { read: true, write: false, delete: false },
      dashboard: { read: true, write: false, delete: false }
    },
    kagawad: {
      residents: { read: true, write: false, delete: false },
      documents: { read: true, write: false, delete: false },
      incidents: { read: true, write: true, delete: false },
      announcements: { read: true, write: true, delete: false },
      events: { read: true, write: true, delete: false },
      health: { read: false, write: false, delete: false },
      welfare: { read: true, write: false, delete: false },
      waste: { read: true, write: true, delete: false },
      finance: { read: false, write: false, delete: false },
      drrm: { read: true, write: true, delete: false },
      settings: { read: true, write: false, delete: false },
      dashboard: { read: true, write: false, delete: false }
    },
    resident: {
      residents: { read: false, write: false, delete: false },
      documents: { read: false, write: false, delete: false },
      incidents: { read: false, write: false, delete: false },
      announcements: { read: false, write: false, delete: false },
      events: { read: false, write: false, delete: false },
      health: { read: false, write: false, delete: false },
      welfare: { read: false, write: false, delete: false },
      waste: { read: false, write: false, delete: false },
      finance: { read: false, write: false, delete: false },
      drrm: { read: false, write: false, delete: false },
      settings: { read: false, write: false, delete: false },
      dashboard: { read: false, write: false, delete: false }
    }
  };

  // Check if user has custom module assignments (for Kagawad)
  if (currentUser.profile?.assignedModules?.includes(module)) {
    return children;
  }

  // Get role permissions
  const rolePermissions = permissions[userRole];
  const hasPermission = rolePermissions?.[module]?.[action] === true;

  if (!hasPermission) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};