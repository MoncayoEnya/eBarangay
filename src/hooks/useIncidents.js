// src/hooks/useIncidents.js
import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import {
  addIncident,
  getIncidentById,
  getAllIncidents,
  getIncidentsByStatus,
  getIncidentsByCategory,
  searchIncidents,
  updateIncident,
  updateIncidentStatus,
  addNote,
  deleteIncident,
  getIncidentStatistics
} from '../services/incidentsService';

/**
 * Custom hook for managing incidents
 * Provides easy-to-use functions for CRUD operations
 */
export const useIncidents = () => {
  const { currentUser } = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  // Get user ID - works with your AuthContext structure
  const getUserId = () => {
    if (!currentUser) return null;
    if (currentUser.uid) return currentUser.uid;
    if (currentUser.profile?.uid) return currentUser.profile.uid;
    if (currentUser.id) return currentUser.id;
    return null;
  };

  // ============================================
  // Load All Incidents with Pagination
  // ============================================
  const loadIncidents = useCallback(async (pageSize = 10, reset = false) => {
    setLoading(true);
    setError(null);

    try {
      const docToUse = reset ? null : lastDoc;
      const result = await getAllIncidents(pageSize, docToUse);

      if (result.success) {
        if (reset) {
          setIncidents(result.data);
        } else {
          setIncidents(prev => [...prev, ...result.data]);
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
      loadIncidents();
    }
  }, [loading, hasMore, loadIncidents]);

  // ============================================
  // Search Incidents
  // ============================================
  const search = useCallback(async (searchTerm, filters = {}) => {
    setLoading(true);
    setError(null);

    try {
      const result = await searchIncidents(searchTerm, filters);

      if (result.success) {
        setIncidents(result.data);
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
  // Get Incidents by Status
  // ============================================
  const loadByStatus = useCallback(async (status) => {
    setLoading(true);
    setError(null);

    try {
      const result = await getIncidentsByStatus(status);

      if (result.success) {
        setIncidents(result.data);
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
  // Get Incidents by Category
  // ============================================
  const loadByCategory = useCallback(async (category) => {
    setLoading(true);
    setError(null);

    try {
      const result = await getIncidentsByCategory(category);

      if (result.success) {
        setIncidents(result.data);
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
  // Get Single Incident
  // ============================================
  const getIncident = useCallback(async (incidentId) => {
    setLoading(true);
    setError(null);

    try {
      const result = await getIncidentById(incidentId);

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
  // Add New Incident
  // ============================================
  const create = useCallback(async (incidentData) => {
    setLoading(true);
    setError(null);

    try {
      const userId = getUserId();
      if (!userId) {
        setError('User not authenticated');
        return { success: false, error: 'User not authenticated' };
      }

      const result = await addIncident(incidentData, userId);

      if (result.success) {
        // Reload incidents list after adding
        await loadIncidents(10, true);
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
  }, [loadIncidents]);

  // ============================================
  // Update Incident
  // ============================================
  const update = useCallback(async (incidentId, updates) => {
    setLoading(true);
    setError(null);

    try {
      const userId = getUserId();
      if (!userId) {
        setError('User not authenticated');
        return { success: false, error: 'User not authenticated' };
      }

      const result = await updateIncident(incidentId, updates, userId);

      if (result.success) {
        // Reload incidents to get fresh data
        await loadIncidents(10, true);
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
  }, [loadIncidents]);

  // ============================================
  // Change Incident Status
  // ============================================
  const changeStatus = useCallback(async (incidentId, status) => {
    setLoading(true);
    setError(null);

    try {
      const userId = getUserId();
      if (!userId) {
        setError('User not authenticated');
        return { success: false, error: 'User not authenticated' };
      }

      const result = await updateIncidentStatus(incidentId, status, userId);

      if (result.success) {
        // Update local state
        setIncidents(prev =>
          prev.map(i => i.id === incidentId ? { 
            ...i, 
            status: status 
          } : i)
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
  }, []);

  // ============================================
  // Add Note to Incident
  // ============================================
  const createNote = useCallback(async (incidentId, noteText, author) => {
    setLoading(true);
    setError(null);

    try {
      const userId = getUserId();
      if (!userId) {
        setError('User not authenticated');
        return { success: false, error: 'User not authenticated' };
      }

      const result = await addNote(incidentId, noteText, author, userId);

      if (result.success) {
        // Update local state
        const note = {
          text: noteText,
          author: author,
          timestamp: new Date().toISOString()
        };
        
        setIncidents(prev =>
          prev.map(i => i.id === incidentId ? { 
            ...i, 
            notes: [...(i.notes || []), note]
          } : i)
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
  }, []);

  // ============================================
  // Delete Incident
  // ============================================
  const remove = useCallback(async (incidentId) => {
    setLoading(true);
    setError(null);

    try {
      const result = await deleteIncident(incidentId);

      if (result.success) {
        // Remove from local state
        setIncidents(prev => prev.filter(i => i.id !== incidentId));
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
  }, []);

  // ============================================
  // Load Statistics
  // ============================================
  const loadStatistics = useCallback(async () => {
    try {
      const result = await getIncidentStatistics();

      if (result.success) {
        setStats(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    }
  }, []);

  return {
    // State
    incidents,
    loading,
    error,
    stats,
    hasMore,
    
    // Actions
    loadIncidents,
    loadMore,
    search,
    loadByStatus,
    loadByCategory,
    getIncident,
    create,
    update,
    changeStatus,
    createNote,
    remove,
    loadStatistics,
    
    // Utilities
    setError,
    clearError: () => setError(null),
  };
};

export default useIncidents;