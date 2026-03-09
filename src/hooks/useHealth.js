// src/hooks/useHealth.js
import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import {
  createPatientRecord,
  addConsultation,
  getAllPatientRecords,
  getPatientByResidentId,
  bookAppointment,
  updateAppointmentStatus,
  getAppointments,
  addImmunization,
  getImmunizations,
  getHealthStatistics
} from '../services/healthService';

export const useHealth = () => {
  const { currentUser } = useAuth();
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [immunizations, setImmunizations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  // Load all patient records
  const loadPatients = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getAllPatientRecords();
      if (result.success) {
        setPatients(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create patient record
  const createPatient = useCallback(async (patientData) => {
    setLoading(true);
    setError(null);
    try {
      const result = await createPatientRecord(patientData, currentUser.uid);
      if (result.success) {
        await loadPatients();
        return { success: true, recordId: result.recordId };
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
  }, [currentUser, loadPatients]);

  // Add consultation
  const createConsultation = useCallback(async (recordId, consultationData) => {
    setLoading(true);
    setError(null);
    try {
      const result = await addConsultation(recordId, consultationData, currentUser.uid);
      if (result.success) {
        await loadPatients();
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
  }, [currentUser, loadPatients]);

  // Get patient by resident ID
  const getPatient = useCallback(async (residentId) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getPatientByResidentId(residentId);
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

  // Load appointments
  const loadAppointments = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getAppointments(filters);
      if (result.success) {
        setAppointments(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create appointment
  const createAppointment = useCallback(async (appointmentData) => {
    setLoading(true);
    setError(null);
    try {
      const result = await bookAppointment(appointmentData, currentUser.uid);
      if (result.success) {
        await loadAppointments();
        return { success: true, appointmentId: result.appointmentId };
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
  }, [currentUser, loadAppointments]);

  // Update appointment status
  const updateAppointment = useCallback(async (appointmentId, status) => {
    setLoading(true);
    setError(null);
    try {
      const result = await updateAppointmentStatus(appointmentId, status, currentUser.uid);
      if (result.success) {
        await loadAppointments();
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
  }, [currentUser, loadAppointments]);

  // Load immunizations
  const loadImmunizations = useCallback(async (residentId = null) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getImmunizations(residentId);
      if (result.success) {
        setImmunizations(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create immunization
  const createImmunization = useCallback(async (immunizationData) => {
    setLoading(true);
    setError(null);
    try {
      const result = await addImmunization(immunizationData, currentUser.uid);
      if (result.success) {
        await loadImmunizations();
        return { success: true, immunizationId: result.immunizationId };
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
  }, [currentUser, loadImmunizations]);

  // Load statistics
  const loadStatistics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getHealthStatistics();
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

  return {
    // State
    patients,
    appointments,
    immunizations,
    loading,
    error,
    stats,
    
    // Actions
    loadPatients,
    createPatient,
    createConsultation,
    getPatient,
    loadAppointments,
    createAppointment,
    updateAppointment,
    loadImmunizations,
    createImmunization,
    loadStatistics,
    
    // Utilities
    clearError: () => setError(null)
  };
};

export default useHealth;