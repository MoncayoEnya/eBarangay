// src/hooks/useWaste.js
import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import {
  createSchedule, getAllSchedules, updateSchedule, deleteSchedule,
  createVehicle,  getAllVehicles,  updateVehicle,  deleteVehicle,
  createReport,   getAllReports,   updateReport,   resolveReport, deleteReport,
  getWasteStats,
} from '../services/wasteService';

export const useWaste = () => {
  const { currentUser } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [vehicles, setVehicles]   = useState([]);
  const [reports, setReports]     = useState([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [stats, setStats]         = useState(null);

  const getUserId = () => currentUser?.uid || currentUser?.profile?.uid || currentUser?.id || null;

  // ── Schedules ──
  const loadSchedules = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAllSchedules();
      if (result.success) setSchedules(result.data);
      else setError(result.error);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  const addSchedule = useCallback(async (data) => {
    const uid = getUserId();
    const result = await createSchedule(data, uid);
    if (result.success) await loadSchedules();
    return result;
  }, [loadSchedules]);

  const editSchedule = useCallback(async (id, data) => {
    const uid = getUserId();
    const result = await updateSchedule(id, data, uid);
    if (result.success) await loadSchedules();
    return result;
  }, [loadSchedules]);

  const removeSchedule = useCallback(async (id) => {
    const result = await deleteSchedule(id);
    if (result.success) setSchedules(prev => prev.filter(s => s.id !== id));
    return result;
  }, []);

  // ── Vehicles ──
  const loadVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAllVehicles();
      if (result.success) setVehicles(result.data);
      else setError(result.error);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  const addVehicle = useCallback(async (data) => {
    const uid = getUserId();
    const result = await createVehicle(data, uid);
    if (result.success) await loadVehicles();
    return result;
  }, [loadVehicles]);

  const editVehicle = useCallback(async (id, data) => {
    const uid = getUserId();
    const result = await updateVehicle(id, data, uid);
    if (result.success) await loadVehicles();
    return result;
  }, [loadVehicles]);

  const removeVehicle = useCallback(async (id) => {
    const result = await deleteVehicle(id);
    if (result.success) setVehicles(prev => prev.filter(v => v.id !== id));
    return result;
  }, []);

  // ── Reports ──
  const loadReports = useCallback(async (filters = {}) => {
    setLoading(true);
    try {
      const result = await getAllReports(filters);
      if (result.success) setReports(result.data);
      else setError(result.error);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  const fileReport = useCallback(async (data) => {
    const uid = getUserId();
    const result = await createReport(data, uid);
    if (result.success) await loadReports();
    return result;
  }, [loadReports]);

  const markResolved = useCallback(async (id) => {
    const uid = getUserId();
    const result = await resolveReport(id, uid);
    if (result.success) setReports(prev => prev.map(r => r.id === id ? { ...r, status: 'Resolved' } : r));
    return result;
  }, []);

  const removeReport = useCallback(async (id) => {
    const result = await deleteReport(id);
    if (result.success) setReports(prev => prev.filter(r => r.id !== id));
    return result;
  }, []);

  // ── Stats ──
  const loadStats = useCallback(async () => {
    try {
      const result = await getWasteStats();
      if (result.success) setStats(result.data);
    } catch (_) {}
  }, []);

  const loadAll = useCallback(async () => {
    await Promise.all([loadSchedules(), loadVehicles(), loadReports(), loadStats()]);
  }, [loadSchedules, loadVehicles, loadReports, loadStats]);

  return {
    schedules, vehicles, reports, loading, error, stats,
    loadSchedules, addSchedule, editSchedule, removeSchedule,
    loadVehicles,  addVehicle,  editVehicle,  removeVehicle,
    loadReports,   fileReport,  markResolved, removeReport,
    loadStats, loadAll,
    clearError: () => setError(null),
  };
};

export default useWaste;