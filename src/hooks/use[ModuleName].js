// src/hooks/use[ModuleName].js
import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import {
  create[ModuleName],
  getAll[ModuleName],
  update[ModuleName],
  delete[ModuleName],
  get[ModuleName]Statistics
} from '../services/[moduleName]Service';

export const use[ModuleName] = () => {
  const { currentUser } = useAuth();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  const loadRecords = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getAll[ModuleName](filters);
      if (result.success) {
        setRecords(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const create = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    try {
      const result = await create[ModuleName](data, currentUser.uid);
      if (result.success) {
        await loadRecords();
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
  }, [currentUser, loadRecords]);

  // Add other methods (update, delete, etc.)

  return {
    records,
    loading,
    error,
    stats,
    loadRecords,
    create,
    // ... other methods
    clearError: () => setError(null),
  };
};