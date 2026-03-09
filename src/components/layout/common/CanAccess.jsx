// src/components/layout/common/CanAccess.jsx
import React from 'react';
import { usePermission } from '../../../hooks/useAuth';

/**
 * Conditional rendering component based on user permissions
 * @param {string} module - Module name (e.g., 'residents', 'documents')
 * @param {string} action - Required action ('read', 'write', 'delete')
 * @param {React.ReactNode} children - Content to render if user has permission
 * @param {React.ReactNode} fallback - Optional content to render if user doesn't have permission
 */
const CanAccess = ({ module, action = 'read', children, fallback = null }) => {
  const hasPermission = usePermission(module, action);
  
  if (!hasPermission) {
    return fallback;
  }
  
  return <>{children}</>;
};

export default CanAccess;