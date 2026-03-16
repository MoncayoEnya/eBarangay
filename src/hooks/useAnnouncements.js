// src/hooks/useAnnouncements.js
import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import {
  createAnnouncement, getAllAnnouncements,
  updateAnnouncement, deleteAnnouncement, getAnnouncementStats,
} from '../services/announcementService';

export const useAnnouncements = () => {
  const { currentUser } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState(null);
  const [stats, setStats]                 = useState(null);

  const getUserId = () => currentUser?.uid || currentUser?.profile?.uid || currentUser?.id || null;

  const loadAnnouncements = useCallback(async (filters = {}) => {
    setLoading(true); setError(null);
    try {
      const result = await getAllAnnouncements(filters);
      if (result.success) setAnnouncements(result.data);
      else setError(result.error);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  const create = useCallback(async (data) => {
    setLoading(true); setError(null);
    try {
      const uid = getUserId();
      if (!uid) return { success: false, error: 'Not authenticated' };
      const result = await createAnnouncement(data, uid);
      if (result.success) await loadAnnouncements();
      else setError(result.error);
      return result;
    } catch (e) { setError(e.message); return { success: false, error: e.message }; }
    finally { setLoading(false); }
  }, [loadAnnouncements]);

  const update = useCallback(async (id, data) => {
    setLoading(true); setError(null);
    try {
      const uid = getUserId();
      const result = await updateAnnouncement(id, data, uid);
      if (result.success) await loadAnnouncements();
      else setError(result.error);
      return result;
    } catch (e) { setError(e.message); return { success: false, error: e.message }; }
    finally { setLoading(false); }
  }, [loadAnnouncements]);

  const remove = useCallback(async (id) => {
    setLoading(true); setError(null);
    try {
      const result = await deleteAnnouncement(id);
      if (result.success) setAnnouncements(prev => prev.filter(a => a.id !== id));
      else setError(result.error);
      return result;
    } catch (e) { setError(e.message); return { success: false, error: e.message }; }
    finally { setLoading(false); }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const result = await getAnnouncementStats();
      if (result.success) setStats(result.data);
    } catch (_) {}
  }, []);

  return {
    announcements, loading, error, stats,
    loadAnnouncements, create, update, remove, loadStats,
    clearError: () => setError(null),
  };
};

export default useAnnouncements;