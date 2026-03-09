// src/hooks/useAuth.js
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

/**
 * Custom hook to access authentication context
 * Provides current user, role, and authentication methods
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

/**
 * Hook to check if user has a specific role
 * @param {string|string[]} allowedRoles - Single role or array of allowed roles
 * @returns {boolean} - Whether user has the required role
 */
export const useRole = (allowedRoles) => {
  const { currentUser } = useAuth();
  
  if (!currentUser || !currentUser.profile) {
    return false;
  }
  
  const userRole = currentUser.profile.role;
  
  if (Array.isArray(allowedRoles)) {
    return allowedRoles.includes(userRole);
  }
  
  return userRole === allowedRoles;
};

/**
 * Hook to check if user has permission for a specific module
 * @param {string} module - Module name (e.g., 'residents', 'documents', 'health')
 * @param {string} action - Action type ('read', 'write', 'delete')
 * @returns {boolean} - Whether user has the required permission
 */
export const usePermission = (module, action = 'read') => {
  const { currentUser } = useAuth();
  
  if (!currentUser || !currentUser.profile) {
    return false;
  }
  
  const userRole = currentUser.profile.role;
  
  // Define permissions matrix
  const permissions = {
    // Super Admin - Full access to everything
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
    
    // Barangay Secretary - Core administrative functions
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
    
    // Barangay Treasurer - Financial management
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
    
    // Health Worker/Nurse - Health services only
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
    
    // Kagawad - Committee-based access (can be customized per user)
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
    
    // Resident - Mobile/Web app access only (no dashboard)
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
  if (currentUser.profile.assignedModules && currentUser.profile.assignedModules.includes(module)) {
    return true;
  }
  
  // Get role permissions
  const rolePermissions = permissions[userRole];
  if (!rolePermissions || !rolePermissions[module]) {
    return false;
  }
  
  return rolePermissions[module][action] === true;
};

export default useAuth;