// src/services/financeService.js
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDoc, getDocs, query, orderBy, where, serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';

const TRANSACTIONS_COL = 'finance_transactions';
const BUDGETS_COL      = 'finance_budgets';

// ─── TRANSACTIONS ─────────────────────────────────────────────────────────────

export const createTransaction = async (data, userId) => {
  try {
    const docRef = await addDoc(collection(db, TRANSACTIONS_COL), {
      description: data.description,
      category:    data.category || 'Expense',   // Revenue | Expense | Payroll
      amount:      Number(data.amount),           // positive = income, negative = expense
      type:        data.amount >= 0 ? 'income' : 'expense',
      date:        data.date || new Date().toISOString().split('T')[0],
      status:      data.status || 'Paid',         // Paid | Pending | Cancelled
      reference:   data.reference || '',
      notes:       data.notes || '',
      systemInfo: {
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: userId,
      },
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('createTransaction:', error);
    return { success: false, error: error.message };
  }
};

export const getAllTransactions = async (filters = {}) => {
  try {
    const ref = collection(db, TRANSACTIONS_COL);
    let q = query(ref, orderBy('date', 'desc'));
    if (filters.category) {
      q = query(ref, where('category', '==', filters.category), orderBy('date', 'desc'));
    }
    if (filters.status) {
      q = query(ref, where('status', '==', filters.status), orderBy('date', 'desc'));
    }
    const snapshot = await getDocs(q);
    const list = [];
    snapshot.forEach(d => list.push({ id: d.id, ...d.data() }));
    return { success: true, data: list };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateTransaction = async (id, data, userId) => {
  try {
    await updateDoc(doc(db, TRANSACTIONS_COL, id), {
      ...data,
      'systemInfo.updatedAt': serverTimestamp(),
      'systemInfo.updatedBy': userId,
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const deleteTransaction = async (id) => {
  try {
    await deleteDoc(doc(db, TRANSACTIONS_COL, id));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ─── BUDGET ITEMS ─────────────────────────────────────────────────────────────

export const createBudgetItem = async (data, userId) => {
  try {
    const docRef = await addDoc(collection(db, BUDGETS_COL), {
      label:   data.label,
      total:   Number(data.total),
      spent:   Number(data.spent || 0),
      year:    data.year || new Date().getFullYear(),
      color:   data.color || 'primary',
      systemInfo: {
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: userId,
      },
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('createBudgetItem:', error);
    return { success: false, error: error.message };
  }
};

export const getAllBudgetItems = async (year) => {
  try {
    const ref = collection(db, BUDGETS_COL);
    let q = year
      ? query(ref, where('year', '==', year), orderBy('systemInfo.createdAt', 'asc'))
      : query(ref, orderBy('systemInfo.createdAt', 'asc'));
    const snapshot = await getDocs(q);
    const list = [];
    snapshot.forEach(d => {
      const item = { id: d.id, ...d.data() };
      item.percentage = item.total > 0
        ? Math.min(100, Math.round((item.spent / item.total) * 100))
        : 0;
      list.push(item);
    });
    return { success: true, data: list };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateBudgetItem = async (id, data, userId) => {
  try {
    await updateDoc(doc(db, BUDGETS_COL, id), {
      ...data,
      'systemInfo.updatedAt': serverTimestamp(),
      'systemInfo.updatedBy': userId,
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const deleteBudgetItem = async (id) => {
  try {
    await deleteDoc(doc(db, BUDGETS_COL, id));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ─── STATS ────────────────────────────────────────────────────────────────────

export const getFinanceStats = async () => {
  try {
    const snapshot = await getDocs(collection(db, TRANSACTIONS_COL));
    let totalRevenue = 0, totalExpenses = 0, pending = 0;
    snapshot.forEach(d => {
      const data = d.data();
      if (data.type === 'income') totalRevenue += data.amount || 0;
      else totalExpenses += Math.abs(data.amount || 0);
      if (data.status === 'Pending') pending++;
    });
    return {
      success: true,
      data: {
        totalRevenue,
        totalExpenses,
        balance: totalRevenue - totalExpenses,
        pendingCount: pending,
      },
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export default {
  createTransaction, getAllTransactions, updateTransaction, deleteTransaction,
  createBudgetItem, getAllBudgetItems, updateBudgetItem, deleteBudgetItem,
  getFinanceStats,
};