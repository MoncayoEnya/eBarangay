// src/hooks/useFinance.js
import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import {
  createTransaction, getAllTransactions, updateTransaction, deleteTransaction,
  createBudgetItem, getAllBudgetItems, updateBudgetItem, deleteBudgetItem,
  getFinanceStats,
} from '../services/financeService';

export const useFinance = () => {
  const { currentUser } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [budgetItems, setBudgetItems]   = useState([]);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState(null);
  const [stats, setStats]               = useState(null);

  const getUserId = () => currentUser?.uid || currentUser?.profile?.uid || currentUser?.id || null;

  // ── Transactions ──
  const loadTransactions = useCallback(async (filters = {}) => {
    setLoading(true); setError(null);
    try {
      const result = await getAllTransactions(filters);
      if (result.success) setTransactions(result.data);
      else setError(result.error);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  const addTransaction = useCallback(async (data) => {
    setLoading(true); setError(null);
    try {
      const uid = getUserId();
      if (!uid) return { success: false, error: 'Not authenticated' };
      const result = await createTransaction(data, uid);
      if (result.success) await loadTransactions();
      else setError(result.error);
      return result;
    } catch (e) { setError(e.message); return { success: false, error: e.message }; }
    finally { setLoading(false); }
  }, [loadTransactions]);

  const editTransaction = useCallback(async (id, data) => {
    const uid = getUserId();
    const result = await updateTransaction(id, data, uid);
    if (result.success) await loadTransactions();
    return result;
  }, [loadTransactions]);

  const removeTransaction = useCallback(async (id) => {
    const result = await deleteTransaction(id);
    if (result.success) setTransactions(prev => prev.filter(t => t.id !== id));
    return result;
  }, []);

  // ── Budget ──
  const loadBudget = useCallback(async (year) => {
    setLoading(true); setError(null);
    try {
      const result = await getAllBudgetItems(year);
      if (result.success) setBudgetItems(result.data);
      else setError(result.error);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  const addBudgetItem = useCallback(async (data) => {
    const uid = getUserId();
    const result = await createBudgetItem(data, uid);
    if (result.success) await loadBudget();
    return result;
  }, [loadBudget]);

  const editBudgetItem = useCallback(async (id, data) => {
    const uid = getUserId();
    const result = await updateBudgetItem(id, data, uid);
    if (result.success) await loadBudget();
    return result;
  }, [loadBudget]);

  const removeBudgetItem = useCallback(async (id) => {
    const result = await deleteBudgetItem(id);
    if (result.success) setBudgetItems(prev => prev.filter(b => b.id !== id));
    return result;
  }, []);

  // ── Stats ──
  const loadStats = useCallback(async () => {
    try {
      const result = await getFinanceStats();
      if (result.success) setStats(result.data);
    } catch (_) {}
  }, []);

  const loadAll = useCallback(async () => {
    await Promise.all([loadTransactions(), loadBudget(), loadStats()]);
  }, [loadTransactions, loadBudget, loadStats]);

  return {
    transactions, budgetItems, loading, error, stats,
    loadTransactions, addTransaction, editTransaction, removeTransaction,
    loadBudget, addBudgetItem, editBudgetItem, removeBudgetItem,
    loadStats, loadAll,
    clearError: () => setError(null),
  };
};

export default useFinance;