// src/hooks/useDRRM.js
import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import {
  createAlert, getAllAlerts, updateAlert, resolveAlert, deleteAlert,
  createCenter, getAllCenters, updateCenter, updateCenterOccupancy, deleteCenter,
  createVulnerable, getAllVulnerable, deleteVulnerable,
  createDamageReport, getAllDamageReports, deleteDamageReport,
  createTask, getAllTasks, updateTaskStatus, deleteTask,
  getDrrmStats,
} from '../services/drrmService';

export const useDRRM = () => {
  const { currentUser } = useAuth();
  const [alerts, setAlerts]       = useState([]);
  const [centers, setCenters]     = useState([]);
  const [vulnerables, setVulnerables] = useState([]);
  const [damages, setDamages]     = useState([]);
  const [tasks, setTasks]         = useState([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [stats, setStats]         = useState(null);

  const getUserId = () => currentUser?.uid || currentUser?.profile?.uid || currentUser?.id || null;

  // ── Alerts ──
  const loadAlerts = useCallback(async (filters = {}) => {
    setLoading(true); setError(null);
    try {
      const result = await getAllAlerts(filters);
      if (result.success) setAlerts(result.data);
      else setError(result.error);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  const sendAlert = useCallback(async (data) => {
    setLoading(true); setError(null);
    try {
      const uid = getUserId();
      if (!uid) return { success: false, error: 'Not authenticated' };
      const result = await createAlert(data, uid);
      if (result.success) await loadAlerts();
      else setError(result.error);
      return result;
    } catch (e) { setError(e.message); return { success: false, error: e.message }; }
    finally { setLoading(false); }
  }, [loadAlerts]);

  const resolve = useCallback(async (id) => {
    const uid = getUserId();
    const result = await resolveAlert(id, uid);
    if (result.success) setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'Resolved' } : a));
    return result;
  }, []);

  const removeAlert = useCallback(async (id) => {
    const result = await deleteAlert(id);
    if (result.success) setAlerts(prev => prev.filter(a => a.id !== id));
    return result;
  }, []);

  // ── Centers ──
  const loadCenters = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const result = await getAllCenters();
      if (result.success) setCenters(result.data);
      else setError(result.error);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  const addCenter = useCallback(async (data) => {
    setLoading(true); setError(null);
    try {
      const uid = getUserId();
      if (!uid) return { success: false, error: 'Not authenticated' };
      const result = await createCenter(data, uid);
      if (result.success) await loadCenters();
      else setError(result.error);
      return result;
    } catch (e) { setError(e.message); return { success: false, error: e.message }; }
    finally { setLoading(false); }
  }, [loadCenters]);

  const editCenter = useCallback(async (id, data) => {
    const uid = getUserId();
    const result = await updateCenter(id, data, uid);
    if (result.success) await loadCenters();
    return result;
  }, [loadCenters]);

  const setOccupancy = useCallback(async (id, occupancy) => {
    const uid = getUserId();
    const result = await updateCenterOccupancy(id, occupancy, uid);
    if (result.success) await loadCenters();
    return result;
  }, [loadCenters]);

  const removeCenter = useCallback(async (id) => {
    const result = await deleteCenter(id);
    if (result.success) setCenters(prev => prev.filter(c => c.id !== id));
    return result;
  }, []);

  // ── Stats ──
  const loadStats = useCallback(async () => {
    try {
      const result = await getDrrmStats();
      if (result.success) setStats(result.data);
    } catch (_) {}
  }, []);

  // ── Vulnerable Residents ──
  const loadVulnerables = useCallback(async () => {
    try {
      const result = await getAllVulnerable();
      if (result.success) setVulnerables(result.data);
    } catch (_) {}
  }, []);

  const addVulnerable = useCallback(async (data) => {
    const uid = getUserId();
    const result = await createVulnerable(data, uid);
    if (result.success) await loadVulnerables();
    return result;
  }, []);

  const removeVulnerable = useCallback(async (id) => {
    const result = await deleteVulnerable(id);
    if (result.success) setVulnerables(prev => prev.filter(v => v.id !== id));
    return result;
  }, []);

  // ── Damage Reports ──
  const loadDamages = useCallback(async () => {
    try {
      const result = await getAllDamageReports();
      if (result.success) setDamages(result.data);
    } catch (_) {}
  }, []);

  const addDamage = useCallback(async (data) => {
    const uid = getUserId();
    const result = await createDamageReport(data, uid);
    if (result.success) await loadDamages();
    return result;
  }, []);

  const removeDamage = useCallback(async (id) => {
    const result = await deleteDamageReport(id);
    if (result.success) setDamages(prev => prev.filter(d => d.id !== id));
    return result;
  }, []);

  // ── Incident Tasks ──
  const loadTasks = useCallback(async () => {
    try {
      const result = await getAllTasks();
      if (result.success) setTasks(result.data);
    } catch (_) {}
  }, []);

  const addTask = useCallback(async (data) => {
    const uid = getUserId();
    const result = await createTask(data, uid);
    if (result.success) await loadTasks();
    return result;
  }, []);

  const toggleTask = useCallback(async (id, currentStatus) => {
    const newStatus = currentStatus === 'Done' ? 'Pending' : 'Done';
    const result = await updateTaskStatus(id, newStatus);
    if (result.success) setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
    return result;
  }, []);

  const removeTask = useCallback(async (id) => {
    const result = await deleteTask(id);
    if (result.success) setTasks(prev => prev.filter(t => t.id !== id));
    return result;
  }, []);

  const loadAll = useCallback(async () => {
    await Promise.all([loadAlerts(), loadCenters(), loadStats(), loadVulnerables(), loadDamages(), loadTasks()]);
  }, [loadAlerts, loadCenters, loadStats, loadVulnerables, loadDamages, loadTasks]);

  return {
    alerts, centers, vulnerables, damages, tasks, loading, error, stats,
    loadAlerts, sendAlert, resolve, removeAlert,
    loadCenters, addCenter, editCenter, setOccupancy, removeCenter,
    loadVulnerables, addVulnerable, removeVulnerable,
    loadDamages, addDamage, removeDamage,
    loadTasks, addTask, toggleTask, removeTask,
    loadStats, loadAll,
    clearError: () => setError(null),
  };
};

export default useDRRM;