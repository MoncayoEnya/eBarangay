// src/hooks/useResidents.js
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import {
  addResident,
  getResidentById,
  getAllResidents,
  searchResidents,
  getResidentsByCategory,
  updateResident,
  updateResidentStatus,
  deleteResident,
  getResidentStatistics
} from '../services/residentsService';

/**
 * Custom hook for managing residents
 * Provides easy-to-use functions for CRUD operations
 */
export const useResidents = () => {
  const { currentUser } = useAuth();
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  // ============================================
  // Load All Residents with Pagination
  // ============================================
  const loadResidents = useCallback(async (pageSize = 10, reset = false) => {
    setLoading(true);
    setError(null);

    try {
      const docToUse = reset ? null : lastDoc;
      const result = await getAllResidents(pageSize, docToUse);

      if (result.success) {
        if (reset) {
          setResidents(result.data);
        } else {
          setResidents(prev => [...prev, ...result.data]);
        }
        setLastDoc(result.lastDoc);
        setHasMore(result.hasMore);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [lastDoc]);

  // ============================================
  // Load More (for pagination)
  // ============================================
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      loadResidents();
    }
  }, [loading, hasMore, loadResidents]);

  // ============================================
  // Search Residents
  // ============================================
  const search = useCallback(async (searchTerm, filters = {}) => {
    setLoading(true);
    setError(null);

    try {
      const result = await searchResidents(searchTerm, filters);

      if (result.success) {
        setResidents(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // ============================================
  // Get Residents by Category
  // ============================================
  const loadByCategory = useCallback(async (category) => {
    setLoading(true);
    setError(null);

    try {
      const result = await getResidentsByCategory(category);

      if (result.success) {
        setResidents(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // ============================================
  // Get Single Resident
  // ============================================
  const getResident = useCallback(async (residentId) => {
    setLoading(true);
    setError(null);

    try {
      const result = await getResidentById(residentId);

      if (result.success) {
        return result.data;
      } else {
        setError(result.error);
        return null;
      }
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // ============================================
  // Add New Resident
  // ============================================
  const create = useCallback(async (residentData) => {
    setLoading(true);
    setError(null);

    try {
      const result = await addResident(residentData, currentUser.uid);

      if (result.success) {
        // Reload residents list after adding
        await loadResidents(10, true);
        return { success: true, id: result.id };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [currentUser, loadResidents]);

  // ============================================
  // Update Resident
  // ============================================
  const update = useCallback(async (residentId, updates) => {
    setLoading(true);
    setError(null);

    try {
      const result = await updateResident(residentId, updates, currentUser.uid);

      if (result.success) {
        // Update local state
        setResidents(prev =>
          prev.map(r => r.id === residentId ? { ...r, ...updates } : r)
        );
        return { success: true };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // ============================================
  // Change Resident Status
  // ============================================
  const changeStatus = useCallback(async (residentId, status) => {
    setLoading(true);
    setError(null);

    try {
      const result = await updateResidentStatus(residentId, status, currentUser.uid);

      if (result.success) {
        // Update local state
        setResidents(prev =>
          prev.map(r => r.id === residentId ? { 
            ...r, 
            systemInfo: { ...r.systemInfo, status } 
          } : r)
        );
        return { success: true };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // ============================================
  // Delete Resident (Soft Delete)
  // ============================================
  const remove = useCallback(async (residentId) => {
    setLoading(true);
    setError(null);

    try {
      const result = await deleteResident(residentId, currentUser.uid);

      if (result.success) {
        // Remove from local state
        setResidents(prev => prev.filter(r => r.id !== residentId));
        return { success: true };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // ============================================
  // Load Statistics
  // ============================================
  const loadStatistics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getResidentStatistics();

      if (result.success) {
        setStats(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // ============================================
  // Auto-load on mount (optional)
  // ============================================
  useEffect(() => {
    // Uncomment if you want to auto-load residents on mount
    // loadResidents(10, true);
  }, []);

  return {
    // State
    residents,
    loading,
    error,
    stats,
    hasMore,
    
    // Actions
    loadResidents,
    loadMore,
    search,
    loadByCategory,
    getResident,
    create,
    update,
    changeStatus,
    remove,
    loadStatistics,
    
    // Utilities
    setError,
    clearError: () => setError(null),
  };
};

export default useResidents;