// src/services/wasteService.js
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDoc, getDocs, query, orderBy, where, serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';

const SCHEDULES_COL = 'waste_schedules';
const VEHICLES_COL  = 'waste_vehicles';
const REPORTS_COL   = 'waste_reports';

// ─── SCHEDULES ────────────────────────────────────────────────────────────────

export const createSchedule = async (data, userId) => {
  try {
    const docRef = await addDoc(collection(db, SCHEDULES_COL), {
      type:        data.type,                    // Biodegradable | Non-Biodegradable | Recyclable
      description: data.description || '',
      days:        data.days || [],              // [{ day: 'Monday', time: '6:00 AM' }]
      purok:       data.purok || 'All Puroks',
      color:       data.color || 'primary',
      status:      'Active',
      systemInfo: {
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: userId,
      },
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('createSchedule:', error);
    return { success: false, error: error.message };
  }
};

export const getAllSchedules = async () => {
  try {
    const snapshot = await getDocs(
      query(collection(db, SCHEDULES_COL), orderBy('systemInfo.createdAt', 'asc'))
    );
    const list = [];
    snapshot.forEach(d => list.push({ id: d.id, ...d.data() }));
    return { success: true, data: list };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateSchedule = async (id, data, userId) => {
  try {
    await updateDoc(doc(db, SCHEDULES_COL, id), {
      ...data,
      'systemInfo.updatedAt': serverTimestamp(),
      'systemInfo.updatedBy': userId,
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const deleteSchedule = async (id) => {
  try {
    await deleteDoc(doc(db, SCHEDULES_COL, id));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ─── VEHICLES ─────────────────────────────────────────────────────────────────

export const createVehicle = async (data, userId) => {
  try {
    const docRef = await addDoc(collection(db, VEHICLES_COL), {
      name:        data.name,
      plateNumber: data.plateNumber || '',
      driver:      data.driver || '',
      route:       data.route || '',
      startTime:   data.startTime || '6:00 AM',
      status:      data.status || 'Standby',     // Active | Standby | Maintenance
      systemInfo: {
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: userId,
      },
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('createVehicle:', error);
    return { success: false, error: error.message };
  }
};

export const getAllVehicles = async () => {
  try {
    const snapshot = await getDocs(collection(db, VEHICLES_COL));
    const list = [];
    snapshot.forEach(d => list.push({ id: d.id, ...d.data() }));
    return { success: true, data: list };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateVehicle = async (id, data, userId) => {
  try {
    await updateDoc(doc(db, VEHICLES_COL, id), {
      ...data,
      'systemInfo.updatedAt': serverTimestamp(),
      'systemInfo.updatedBy': userId,
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const deleteVehicle = async (id) => {
  try {
    await deleteDoc(doc(db, VEHICLES_COL, id));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ─── REPORTS (citizen reports / illegal dumping) ──────────────────────────────

export const createReport = async (data, userId) => {
  try {
    const docRef = await addDoc(collection(db, REPORTS_COL), {
      title:       data.title,
      description: data.description || '',
      location:    data.location || '',
      reportType:  data.reportType || 'Uncollected',  // Uncollected | IllegalDumping | OverflowingBin
      reporter:    data.reporter || 'Anonymous',
      status:      'Pending',                         // Pending | In Progress | Resolved
      photoUrl:    data.photoUrl || '',
      color:       data.color || 'error',
      systemInfo: {
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: userId,
      },
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('createReport:', error);
    return { success: false, error: error.message };
  }
};

export const getAllReports = async (filters = {}) => {
  try {
    const ref = collection(db, REPORTS_COL);
    let q = query(ref, orderBy('systemInfo.createdAt', 'desc'));
    if (filters.status) {
      q = query(ref, where('status', '==', filters.status), orderBy('systemInfo.createdAt', 'desc'));
    }
    const snapshot = await getDocs(q);
    const list = [];
    snapshot.forEach(d => list.push({ id: d.id, ...d.data() }));
    return { success: true, data: list };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateReport = async (id, data, userId) => {
  try {
    await updateDoc(doc(db, REPORTS_COL, id), {
      ...data,
      'systemInfo.updatedAt': serverTimestamp(),
      'systemInfo.updatedBy': userId,
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const resolveReport = async (id, userId) => {
  return updateReport(id, { status: 'Resolved' }, userId);
};

export const deleteReport = async (id) => {
  try {
    await deleteDoc(doc(db, REPORTS_COL, id));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ─── STATS ────────────────────────────────────────────────────────────────────

export const getWasteStats = async () => {
  try {
    const [schedSnap, vehicleSnap, reportSnap] = await Promise.all([
      getDocs(collection(db, SCHEDULES_COL)),
      getDocs(query(collection(db, VEHICLES_COL), where('status', '==', 'Active'))),
      getDocs(query(collection(db, REPORTS_COL), where('status', '==', 'Pending'))),
    ]);
    return {
      success: true,
      data: {
        schedules:      schedSnap.size,
        activeVehicles: vehicleSnap.size,
        pendingReports: reportSnap.size,
      },
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export default {
  createSchedule, getAllSchedules, updateSchedule, deleteSchedule,
  createVehicle,  getAllVehicles,  updateVehicle,  deleteVehicle,
  createReport,   getAllReports,   updateReport,   resolveReport, deleteReport,
  getWasteStats,
};