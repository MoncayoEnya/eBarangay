// src/hooks/useWelfare.js
import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import {
  createProgram,
  getAllPrograms,
  updateProgram,
  addBeneficiary,
  getBeneficiaries,
  recordDistribution,
  getDistributions,
  getWelfareStatistics
} from '../services/welfareService';

export const useWelfare = () => {
  const { currentUser } = useAuth();
  const [programs, setPrograms] = useState([]);
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [distributions, setDistributions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  // Load all programs
  const loadPrograms = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getAllPrograms(filters);
      if (result.success) {
        setPrograms(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create program
  const create = useCallback(async (programData) => {
    setLoading(true);
    setError(null);
    try {
      const result = await createProgram(programData, currentUser.uid);
      if (result.success) {
        await loadPrograms();
        return { success: true, programId: result.programId };
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
  }, [currentUser, loadPrograms]);

  // Update program
  const update = useCallback(async (programId, updates) => {
    setLoading(true);
    setError(null);
    try {
      const result = await updateProgram(programId, updates, currentUser.uid);
      if (result.success) {
        await loadPrograms();
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
  }, [currentUser, loadPrograms]);

  // Load beneficiaries
  const loadBeneficiaries = useCallback(async (programId = null) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getBeneficiaries(programId);
      if (result.success) {
        setBeneficiaries(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Add beneficiary
  const createBeneficiary = useCallback(async (beneficiaryData) => {
    setLoading(true);
    setError(null);
    try {
      const result = await addBeneficiary(beneficiaryData, currentUser.uid);
      if (result.success) {
        await loadBeneficiaries();
        return { success: true, beneficiaryId: result.beneficiaryId };
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
  }, [currentUser, loadBeneficiaries]);

  // Load distributions
  const loadDistributions = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getDistributions(filters);
      if (result.success) {
        setDistributions(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Record distribution
  const createDistribution = useCallback(async (distributionData) => {
    setLoading(true);
    setError(null);
    try {
      const result = await recordDistribution(distributionData, currentUser.uid);
      if (result.success) {
        await loadDistributions();
        await loadPrograms(); // Refresh programs to update totals
        return { success: true, distributionId: result.distributionId };
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
  }, [currentUser, loadDistributions, loadPrograms]);

  // Load statistics
  const loadStatistics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getWelfareStatistics();
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
    programs,
    beneficiaries,
    distributions,
    loading,
    error,
    stats,
    
    // Program actions
    loadPrograms,
    createProgram: create,
    updateProgram: update,
    
    // Beneficiary actions
    loadBeneficiaries,
    addBeneficiary: createBeneficiary,
    
    // Distribution actions
    loadDistributions,
    recordDistribution: createDistribution,
    
    // Statistics
    loadStatistics,
    
    // Utilities
    clearError: () => setError(null)
  };
};

export default useWelfare;