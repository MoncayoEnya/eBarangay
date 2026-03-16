// src/hooks/useHealth.js
import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import {
  createPatientRecord, addConsultation, getAllPatientRecords, getPatientByResidentId,
  bookAppointment, updateAppointmentStatus, deleteAppointment, getAppointments,
  addImmunization, getImmunizations, deleteImmunization,
  reportDiseaseCase, getAllDiseaseCases, updateDiseaseCase, deleteDiseaseCase,
  addMedicine, getAllMedicines, updateMedicine, dispenseMedicine, deleteMedicine,
  getHealthStatistics,
} from '../services/healthService';

export const useHealth = () => {
  const { currentUser } = useAuth();
  const [patients,      setPatients]      = useState([]);
  const [appointments,  setAppointments]  = useState([]);
  const [immunizations, setImmunizations] = useState([]);
  const [diseases,      setDiseases]      = useState([]);
  const [medicines,     setMedicines]     = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [stats,   setStats]   = useState(null);

  const uid = () => currentUser?.uid || currentUser?.profile?.uid || currentUser?.id || null;

  // ── Patients ──
  const loadPatients = useCallback(async () => {
    setLoading(true);
    try { const r = await getAllPatientRecords(); if (r.success) setPatients(r.data); else setError(r.error); }
    catch (e) { setError(e.message); } finally { setLoading(false); }
  }, []);

  const createPatient = useCallback(async (data) => {
    setLoading(true);
    try { const r = await createPatientRecord(data, uid()); if (r.success) await loadPatients(); return r; }
    catch (e) { return { success: false, error: e.message }; } finally { setLoading(false); }
  }, [loadPatients]);

  const getPatient = useCallback(async (residentId) => {
    try { const r = await getPatientByResidentId(residentId); return r.success ? r.data : null; }
    catch { return null; }
  }, []);

  // ── Appointments ──
  const loadAppointments = useCallback(async (filters = {}) => {
    setLoading(true);
    try { const r = await getAppointments(filters); if (r.success) setAppointments(r.data); else setError(r.error); }
    catch (e) { setError(e.message); } finally { setLoading(false); }
  }, []);

  const createAppointment = useCallback(async (data) => {
    setLoading(true);
    try { const r = await bookAppointment(data, uid()); if (r.success) await loadAppointments(); return r; }
    catch (e) { return { success: false, error: e.message }; } finally { setLoading(false); }
  }, [loadAppointments]);

  const updateAppointment = useCallback(async (id, status) => {
    try { const r = await updateAppointmentStatus(id, status, uid()); if (r.success) await loadAppointments(); return r; }
    catch (e) { return { success: false, error: e.message }; }
  }, [loadAppointments]);

  const removeAppointment = useCallback(async (id) => {
    try { const r = await deleteAppointment(id); if (r.success) setAppointments(p => p.filter(a => a.id !== id)); return r; }
    catch (e) { return { success: false, error: e.message }; }
  }, []);

  // ── Immunizations ──
  const loadImmunizations = useCallback(async (residentId = null) => {
    setLoading(true);
    try { const r = await getImmunizations(residentId); if (r.success) setImmunizations(r.data); else setError(r.error); }
    catch (e) { setError(e.message); } finally { setLoading(false); }
  }, []);

  const createImmunization = useCallback(async (data) => {
    setLoading(true);
    try { const r = await addImmunization(data, uid()); if (r.success) await loadImmunizations(); return r; }
    catch (e) { return { success: false, error: e.message }; } finally { setLoading(false); }
  }, [loadImmunizations]);

  const removeImmunization = useCallback(async (id) => {
    try { const r = await deleteImmunization(id); if (r.success) setImmunizations(p => p.filter(i => i.id !== id)); return r; }
    catch (e) { return { success: false, error: e.message }; }
  }, []);

  // ── Disease Surveillance ──
  const loadDiseases = useCallback(async (filters = {}) => {
    setLoading(true);
    try { const r = await getAllDiseaseCases(filters); if (r.success) setDiseases(r.data); else setError(r.error); }
    catch (e) { setError(e.message); } finally { setLoading(false); }
  }, []);

  const reportDisease = useCallback(async (data) => {
    setLoading(true);
    try { const r = await reportDiseaseCase(data, uid()); if (r.success) await loadDiseases(); return r; }
    catch (e) { return { success: false, error: e.message }; } finally { setLoading(false); }
  }, [loadDiseases]);

  const updateDisease = useCallback(async (id, data) => {
    try { const r = await updateDiseaseCase(id, data, uid()); if (r.success) await loadDiseases(); return r; }
    catch (e) { return { success: false, error: e.message }; }
  }, [loadDiseases]);

  const removeDisease = useCallback(async (id) => {
    try { const r = await deleteDiseaseCase(id); if (r.success) setDiseases(p => p.filter(d => d.id !== id)); return r; }
    catch (e) { return { success: false, error: e.message }; }
  }, []);

  // ── Pharmacy ──
  const loadMedicines = useCallback(async () => {
    setLoading(true);
    try { const r = await getAllMedicines(); if (r.success) setMedicines(r.data); else setError(r.error); }
    catch (e) { setError(e.message); } finally { setLoading(false); }
  }, []);

  const createMedicine = useCallback(async (data) => {
    setLoading(true);
    try { const r = await addMedicine(data, uid()); if (r.success) await loadMedicines(); return r; }
    catch (e) { return { success: false, error: e.message }; } finally { setLoading(false); }
  }, [loadMedicines]);

  const editMedicine = useCallback(async (id, data) => {
    try { const r = await updateMedicine(id, data, uid()); if (r.success) await loadMedicines(); return r; }
    catch (e) { return { success: false, error: e.message }; }
  }, [loadMedicines]);

  const dispense = useCallback(async (id, qty) => {
    try { const r = await dispenseMedicine(id, qty, uid()); if (r.success) await loadMedicines(); return r; }
    catch (e) { return { success: false, error: e.message }; }
  }, [loadMedicines]);

  const removeMedicine = useCallback(async (id) => {
    try { const r = await deleteMedicine(id); if (r.success) setMedicines(p => p.filter(m => m.id !== id)); return r; }
    catch (e) { return { success: false, error: e.message }; }
  }, []);

  // ── Stats ──
  const loadStatistics = useCallback(async () => {
    try { const r = await getHealthStatistics(); if (r.success) setStats(r.data); }
    catch (_) {}
  }, []);

  const loadAll = useCallback(async () => {
    await Promise.all([loadPatients(), loadAppointments(), loadImmunizations(), loadDiseases(), loadMedicines(), loadStatistics()]);
  }, [loadPatients, loadAppointments, loadImmunizations, loadDiseases, loadMedicines, loadStatistics]);

  return {
    // state
    patients, appointments, immunizations, diseases, medicines, loading, error, stats,
    // patients
    loadPatients, createPatient, getPatient,
    // appointments
    loadAppointments, createAppointment, updateAppointment, removeAppointment,
    // immunizations
    loadImmunizations, createImmunization, removeImmunization,
    // disease
    loadDiseases, reportDisease, updateDisease, removeDisease,
    // pharmacy
    loadMedicines, createMedicine, editMedicine, dispense, removeMedicine,
    // misc
    loadStatistics, loadAll, clearError: () => setError(null),
  };
};

export default useHealth;