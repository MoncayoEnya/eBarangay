// src/hooks/useEvents.js
import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import {
  createEvent, getAllEvents, getEventById,
  updateEvent, rsvpEvent, deleteEvent, getEventStats,
} from '../services/eventsService';

export const useEvents = () => {
  const { currentUser } = useAuth();
  const [events, setEvents]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [stats, setStats]     = useState(null);

  const getUserId = () =>
    currentUser?.uid || currentUser?.profile?.uid || currentUser?.id || null;

  const loadEvents = useCallback(async (filters = {}) => {
    setLoading(true); setError(null);
    try {
      const result = await getAllEvents(filters);
      if (result.success) setEvents(result.data);
      else setError(result.error);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const result = await getEventStats();
      if (result.success) setStats(result.data);
    } catch (_) {}
  }, []);

  const create = useCallback(async (data) => {
    setLoading(true);
    try {
      const result = await createEvent(data, getUserId());
      if (result.success) {
        await loadEvents();
        await loadStats();
      }
      return result;
    } catch (e) {
      return { success: false, error: e.message };
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const update = useCallback(async (id, data) => {
    setLoading(true);
    try {
      const result = await updateEvent(id, data, getUserId());
      if (result.success) await loadEvents();
      return result;
    } catch (e) {
      return { success: false, error: e.message };
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const rsvp = useCallback(async (id) => {
    try {
      const result = await rsvpEvent(id);
      if (result.success) await loadEvents();
      return result;
    } catch (e) {
      return { success: false, error: e.message };
    }
  }, []);

  const remove = useCallback(async (id) => {
    setLoading(true);
    try {
      const result = await deleteEvent(id);
      if (result.success) {
        setEvents(prev => prev.filter(e => e.id !== id));
        await loadStats();
      }
      return result;
    } catch (e) {
      return { success: false, error: e.message };
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = () => setError(null);

  return {
    events, loading, error, stats,
    loadEvents, loadStats, create, update, rsvp, remove, clearError,
  };
};