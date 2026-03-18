// src/services/payrollService.js
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDoc, getDocs, query, orderBy, where, serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';

const EMPLOYEES_COL = 'payroll_employees';
const PAYROLL_COL   = 'payroll_records';

// ─── EMPLOYEES ────────────────────────────────────────────────────────────────

export const createEmployee = async (data, userId) => {
  try {
    const ref = await addDoc(collection(db, EMPLOYEES_COL), {
      employeeId:    data.employeeId || '',
      fullName:      data.fullName,
      position:      data.position || '',
      department:    data.department || 'Barangay Hall',
      employeeType:  data.employeeType || 'Regular',   // Regular | Casual | Job Order
      status:        data.status || 'Active',           // Active | Inactive
      basicSalary:   Number(data.basicSalary || 0),
      allowances: {
        rice:        Number(data.allowances?.rice || 0),
        clothing:    Number(data.allowances?.clothing || 0),
        medical:     Number(data.allowances?.medical || 0),
        other:       Number(data.allowances?.other || 0),
      },
      deductions: {
        sss:         Number(data.deductions?.sss || 0),
        philhealth:  Number(data.deductions?.philhealth || 0),
        pagibig:     Number(data.deductions?.pagibig || 0),
        tax:         Number(data.deductions?.tax || 0),
        other:       Number(data.deductions?.other || 0),
      },
      bankAccount:   data.bankAccount || '',
      contactNumber: data.contactNumber || '',
      address:       data.address || '',
      dateHired:     data.dateHired || '',
      systemInfo: {
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: userId,
      },
    });
    return { success: true, id: ref.id };
  } catch (error) {
    console.error('createEmployee:', error);
    return { success: false, error: error.message };
  }
};

export const getAllEmployees = async (filters = {}) => {
  try {
    let q = query(collection(db, EMPLOYEES_COL), orderBy('fullName', 'asc'));
    if (filters.status) {
      q = query(collection(db, EMPLOYEES_COL),
        where('status', '==', filters.status),
        orderBy('fullName', 'asc'));
    }
    const snapshot = await getDocs(q);
    const list = [];
    snapshot.forEach(d => list.push({ id: d.id, ...d.data() }));
    return { success: true, data: list };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateEmployee = async (id, data, userId) => {
  try {
    await updateDoc(doc(db, EMPLOYEES_COL, id), {
      ...data,
      'systemInfo.updatedAt': serverTimestamp(),
      'systemInfo.updatedBy': userId,
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const deleteEmployee = async (id) => {
  try {
    await deleteDoc(doc(db, EMPLOYEES_COL, id));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ─── PAYROLL RUNS ─────────────────────────────────────────────────────────────

export const generatePayroll = async (periodFrom, periodTo, employees, userId) => {
  try {
    const records = employees.map(emp => {
      const totalAllowances =
        (emp.allowances?.rice     || 0) +
        (emp.allowances?.clothing || 0) +
        (emp.allowances?.medical  || 0) +
        (emp.allowances?.other    || 0);
      const totalDeductions =
        (emp.deductions?.sss       || 0) +
        (emp.deductions?.philhealth|| 0) +
        (emp.deductions?.pagibig   || 0) +
        (emp.deductions?.tax       || 0) +
        (emp.deductions?.other     || 0);
      const grossPay  = (emp.basicSalary || 0) + totalAllowances;
      const netPay    = grossPay - totalDeductions;
      return {
        employeeId:    emp.id,
        employeeNo:    emp.employeeId,
        fullName:      emp.fullName,
        position:      emp.position,
        department:    emp.department,
        basicSalary:   emp.basicSalary || 0,
        allowances:    { ...emp.allowances, total: totalAllowances },
        deductions:    { ...emp.deductions, total: totalDeductions },
        grossPay,
        netPay,
        status:        'Pending',   // Pending | Released
      };
    });

    const docRef = await addDoc(collection(db, PAYROLL_COL), {
      periodFrom,
      periodTo,
      payrollNumber: `PR-${Date.now()}`,
      status:        'Pending',   // Pending | Released | Cancelled
      totalGross:    records.reduce((s, r) => s + r.grossPay, 0),
      totalNet:      records.reduce((s, r) => s + r.netPay, 0),
      totalDeductions: records.reduce((s, r) => s + r.deductions.total, 0),
      headCount:     records.length,
      records,
      systemInfo: {
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: userId,
      },
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('generatePayroll:', error);
    return { success: false, error: error.message };
  }
};

export const getAllPayrollRuns = async () => {
  try {
    const q = query(collection(db, PAYROLL_COL), orderBy('systemInfo.createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const list = [];
    snapshot.forEach(d => list.push({ id: d.id, ...d.data() }));
    return { success: true, data: list };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getPayrollById = async (id) => {
  try {
    const snap = await getDoc(doc(db, PAYROLL_COL, id));
    if (!snap.exists()) return { success: false, error: 'Not found' };
    return { success: true, data: { id: snap.id, ...snap.data() } };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const releasePayroll = async (id, userId) => {
  try {
    await updateDoc(doc(db, PAYROLL_COL, id), {
      status: 'Released',
      releasedAt: serverTimestamp(),
      releasedBy: userId,
      'systemInfo.updatedAt': serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const deletePayrollRun = async (id) => {
  try {
    await deleteDoc(doc(db, PAYROLL_COL, id));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getPayrollStats = async () => {
  try {
    const [empSnap, prSnap] = await Promise.all([
      getDocs(collection(db, EMPLOYEES_COL)),
      getDocs(query(collection(db, PAYROLL_COL), orderBy('systemInfo.createdAt', 'desc'))),
    ]);
    const employees = [];
    empSnap.forEach(d => employees.push(d.data()));
    const payrolls = [];
    prSnap.forEach(d => payrolls.forEach ? null : null);
    prSnap.forEach(d => payrolls.push(d.data()));

    const active = employees.filter(e => e.status === 'Active').length;
    const released = payrolls.filter(p => p.status === 'Released');
    const totalDisbursed = released.reduce((s, p) => s + (p.totalNet || 0), 0);
    const lastPayroll = payrolls[0] || null;

    return {
      success: true,
      data: {
        totalEmployees: employees.length,
        activeEmployees: active,
        totalDisbursed,
        lastPayrollAmount: lastPayroll?.totalNet || 0,
        lastPayrollDate: lastPayroll?.periodTo || null,
        pendingPayrolls: payrolls.filter(p => p.status === 'Pending').length,
      },
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export default {
  createEmployee, getAllEmployees, updateEmployee, deleteEmployee,
  generatePayroll, getAllPayrollRuns, getPayrollById,
  releasePayroll, deletePayrollRun, getPayrollStats,
};
