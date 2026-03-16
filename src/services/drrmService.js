// src/services/drrmService.js
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDoc, getDocs, query, orderBy, where, serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';

const ALERTS_COL     = 'drrm_alerts';
const CENTERS_COL    = 'evacuation_centers';
const EVACUEES_COL   = 'evacuees';

// ─── ALERTS ──────────────────────────────────────────────────────────────────

export const createAlert = async (data, userId) => {
  try {
    const ref = collection(db, ALERTS_COL);
    const docRef = await addDoc(ref, {
      title:      data.title,
      message:    data.message,
      level:      data.level || 'warning',   // advisory | warning | critical
      audience:   data.audience || 'All Residents',
      location:   data.location || '',
      smsSent:    0,
      status:     'Active',                  // Active | Resolved
      systemInfo: {
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: userId,
      },
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('createAlert:', error);
    return { success: false, error: error.message };
  }
};

export const getAllAlerts = async (filters = {}) => {
  try {
    const ref = collection(db, ALERTS_COL);
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

export const updateAlert = async (id, data, userId) => {
  try {
    await updateDoc(doc(db, ALERTS_COL, id), {
      ...data,
      'systemInfo.updatedAt': serverTimestamp(),
      'systemInfo.updatedBy': userId,
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const resolveAlert = async (id, userId) => {
  return updateAlert(id, { status: 'Resolved' }, userId);
};

export const deleteAlert = async (id) => {
  try {
    await deleteDoc(doc(db, ALERTS_COL, id));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ─── EVACUATION CENTERS ───────────────────────────────────────────────────────

export const createCenter = async (data, userId) => {
  try {
    const ref = collection(db, CENTERS_COL);
    const docRef = await addDoc(ref, {
      name:      data.name,
      location:  data.location || '',
      capacity:  Number(data.capacity) || 0,
      occupancy: 0,
      status:    data.status || 'Standby',   // Active | Standby | Full | Closed
      amenities: data.amenities || '',
      systemInfo: {
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: userId,
      },
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('createCenter:', error);
    return { success: false, error: error.message };
  }
};

export const getAllCenters = async () => {
  try {
    const snapshot = await getDocs(collection(db, CENTERS_COL));
    const list = [];
    snapshot.forEach(d => list.push({ id: d.id, ...d.data() }));
    return { success: true, data: list };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateCenter = async (id, data, userId) => {
  try {
    await updateDoc(doc(db, CENTERS_COL, id), {
      ...data,
      'systemInfo.updatedAt': serverTimestamp(),
      'systemInfo.updatedBy': userId,
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const updateCenterOccupancy = async (id, occupancy, userId) => {
  try {
    const snap = await getDoc(doc(db, CENTERS_COL, id));
    if (!snap.exists()) return { success: false, error: 'Center not found' };
    const capacity = snap.data().capacity || 0;
    const pct = capacity > 0 ? Math.round((occupancy / capacity) * 100) : 0;
    await updateDoc(doc(db, CENTERS_COL, id), {
      occupancy,
      percentage: pct,
      status: pct >= 100 ? 'Full' : 'Active',
      'systemInfo.updatedAt': serverTimestamp(),
      'systemInfo.updatedBy': userId,
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const deleteCenter = async (id) => {
  try {
    await deleteDoc(doc(db, CENTERS_COL, id));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ─── VULNERABLE RESIDENTS ─────────────────────────────────────────────────────

const VULN_COL = 'drrm_vulnerable';

export const createVulnerable = async (data, userId) => {
  try {
    const ref = await addDoc(collection(db, VULN_COL), {
      name:     data.name,
      purok:    data.purok     || '',
      category: data.category  || '',
      contact:  data.contact   || '',
      notes:    data.notes     || '',
      systemInfo: { createdAt: serverTimestamp(), createdBy: userId },
    });
    return { success: true, id: ref.id };
  } catch (e) { return { success: false, error: e.message }; }
};

export const getAllVulnerable = async () => {
  try {
    const snap = await getDocs(query(collection(db, VULN_COL), orderBy('systemInfo.createdAt', 'desc')));
    return { success: true, data: snap.docs.map(d => ({ id: d.id, ...d.data() })) };
  } catch (e) { return { success: false, error: e.message }; }
};

export const deleteVulnerable = async (id) => {
  try { await deleteDoc(doc(db, VULN_COL, id)); return { success: true }; }
  catch (e) { return { success: false, error: e.message }; }
};

// ─── DAMAGE REPORTS ───────────────────────────────────────────────────────────

const DAMAGE_COL = 'drrm_damage';

export const createDamageReport = async (data, userId) => {
  try {
    const ref = await addDoc(collection(db, DAMAGE_COL), {
      type:             data.type             || '',
      severity:         data.severity         || 'Minor',
      location:         data.location         || '',
      description:      data.description      || '',
      affectedFamilies: Number(data.affectedFamilies) || 0,
      estimatedCost:    Number(data.estimatedCost)    || 0,
      systemInfo: { createdAt: serverTimestamp(), createdBy: userId },
    });
    return { success: true, id: ref.id };
  } catch (e) { return { success: false, error: e.message }; }
};

export const getAllDamageReports = async () => {
  try {
    const snap = await getDocs(query(collection(db, DAMAGE_COL), orderBy('systemInfo.createdAt', 'desc')));
    return { success: true, data: snap.docs.map(d => ({ id: d.id, ...d.data() })) };
  } catch (e) { return { success: false, error: e.message }; }
};

export const deleteDamageReport = async (id) => {
  try { await deleteDoc(doc(db, DAMAGE_COL, id)); return { success: true }; }
  catch (e) { return { success: false, error: e.message }; }
};

// ─── INCIDENT TASKS ───────────────────────────────────────────────────────────

const TASKS_COL = 'drrm_tasks';

export const createTask = async (data, userId) => {
  try {
    const ref = await addDoc(collection(db, TASKS_COL), {
      title:      data.title      || '',
      assignedTo: data.assignedTo || '',
      priority:   data.priority   || 'Medium',
      status:     data.status     || 'Pending',
      notes:      data.notes      || '',
      systemInfo: { createdAt: serverTimestamp(), createdBy: userId },
    });
    return { success: true, id: ref.id };
  } catch (e) { return { success: false, error: e.message }; }
};

export const getAllTasks = async () => {
  try {
    const snap = await getDocs(query(collection(db, TASKS_COL), orderBy('systemInfo.createdAt', 'desc')));
    return { success: true, data: snap.docs.map(d => ({ id: d.id, ...d.data() })) };
  } catch (e) { return { success: false, error: e.message }; }
};

export const updateTaskStatus = async (id, status) => {
  try {
    await updateDoc(doc(db, TASKS_COL, id), { status, 'systemInfo.updatedAt': serverTimestamp() });
    return { success: true };
  } catch (e) { return { success: false, error: e.message }; }
};

export const deleteTask = async (id) => {
  try { await deleteDoc(doc(db, TASKS_COL, id)); return { success: true }; }
  catch (e) { return { success: false, error: e.message }; }
};

// ─── UPDATED STATS ────────────────────────────────────────────────────────────

export const getDrrmStats = async () => {
  try {
    const [alertSnap, centerSnap, vulnSnap, damageSnap, taskSnap] = await Promise.all([
      getDocs(query(collection(db, ALERTS_COL), where('status', '==', 'Active'))),
      getDocs(collection(db, CENTERS_COL)),
      getDocs(collection(db, VULN_COL)),
      getDocs(collection(db, DAMAGE_COL)),
      getDocs(collection(db, TASKS_COL)),
    ]);
    let totalEvacuees = 0;
    centerSnap.forEach(d => { totalEvacuees += d.data().occupancy || 0; });
    return {
      success: true,
      data: {
        activeAlerts:  alertSnap.size,
        evacuees:      totalEvacuees,
        centers:       centerSnap.size,
        vulnerable:    vulnSnap.size,
        damageReports: damageSnap.size,
        pendingTasks:  taskSnap.docs.filter(d => d.data().status !== 'Done').length,
      },
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export default {
  createAlert, getAllAlerts, updateAlert, resolveAlert, deleteAlert,
  createCenter, getAllCenters, updateCenter, updateCenterOccupancy, deleteCenter,
  createVulnerable, getAllVulnerable, deleteVulnerable,
  createDamageReport, getAllDamageReports, deleteDamageReport,
  createTask, getAllTasks, updateTaskStatus, deleteTask,
  getDrrmStats,
};