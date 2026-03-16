// src/services/healthService.js  (FULL REPLACEMENT — keeps everything existing, adds disease + pharmacy)
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDoc, getDocs, query, orderBy, where, limit, serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';

const COLLECTION_NAME          = 'health_records';
const APPOINTMENTS_COLLECTION  = 'health_appointments';
const IMMUNIZATIONS_COLLECTION = 'immunizations';
const DISEASE_COL              = 'disease_cases';
const PHARMACY_COL             = 'pharmacy_inventory';

// ─── helpers ─────────────────────────────────────────────────────────────────

const generateHealthRecordId = async () => {
  const year = new Date().getFullYear();
  const ref  = collection(db, COLLECTION_NAME);
  const q    = query(ref, orderBy('systemInfo.createdAt', 'desc'), limit(1));
  const snap = await getDocs(q);
  let lastNumber = 0;
  if (!snap.empty) {
    const last = snap.docs[0].data();
    if (last.recordId) lastNumber = parseInt(last.recordId.split('-')[2]);
  }
  return `HR-${year}-${(lastNumber + 1).toString().padStart(4, '0')}`;
};

// ─── PATIENTS ────────────────────────────────────────────────────────────────

export const createPatientRecord = async (patientData, userId) => {
  try {
    const ref      = collection(db, COLLECTION_NAME);
    const recordId = await generateHealthRecordId();
    const docRef   = await addDoc(ref, {
      recordId,
      residentId:    patientData.residentId    || null,
      patientName:   patientData.patientName   || '',
      dateOfBirth:   patientData.dateOfBirth   || '',
      gender:        patientData.gender        || '',
      bloodType:     patientData.bloodType     || '',
      allergies:     patientData.allergies     || '',
      conditions:    patientData.conditions    || '',
      consultations: [],
      systemInfo: { createdAt: serverTimestamp(), updatedAt: serverTimestamp(), createdBy: userId },
    });
    return { success: true, id: docRef.id, recordId };
  } catch (e) { return { success: false, error: e.message }; }
};

export const addConsultation = async (recordId, data, userId) => {
  try {
    const ref  = collection(db, COLLECTION_NAME);
    const q    = query(ref, where('recordId', '==', recordId));
    const snap = await getDocs(q);
    if (snap.empty) return { success: false, error: 'Patient not found' };
    const docRef   = doc(db, COLLECTION_NAME, snap.docs[0].id);
    const current  = snap.docs[0].data();
    const consult  = { ...data, date: serverTimestamp(), createdBy: userId };
    await updateDoc(docRef, {
      consultations: [...(current.consultations || []), consult],
      'systemInfo.updatedAt': serverTimestamp(),
    });
    return { success: true };
  } catch (e) { return { success: false, error: e.message }; }
};

export const getAllPatientRecords = async (filters = {}) => {
  try {
    const snap = await getDocs(collection(db, COLLECTION_NAME));
    const list = [];
    snap.forEach(d => list.push({ id: d.id, ...d.data() }));
    return { success: true, data: list };
  } catch (e) { return { success: false, error: e.message }; }
};

export const getPatientByResidentId = async (residentId) => {
  try {
    const q    = query(collection(db, COLLECTION_NAME), where('residentId', '==', residentId));
    const snap = await getDocs(q);
    if (snap.empty) return { success: false, error: 'Not found' };
    return { success: true, data: { id: snap.docs[0].id, ...snap.docs[0].data() } };
  } catch (e) { return { success: false, error: e.message }; }
};

// ─── APPOINTMENTS ─────────────────────────────────────────────────────────────

export const bookAppointment = async (data, userId) => {
  try {
    const docRef = await addDoc(collection(db, APPOINTMENTS_COLLECTION), {
      patientName:     data.patientName,
      residentId:      data.residentId      || null,
      appointmentDate: data.appointmentDate,
      appointmentTime: data.appointmentTime || '09:00',
      appointmentType: data.appointmentType || 'consultation',
      status:          'Scheduled',
      notes:           data.notes           || '',
      systemInfo: { createdAt: serverTimestamp(), updatedAt: serverTimestamp(), createdBy: userId },
    });
    return { success: true, appointmentId: docRef.id };
  } catch (e) { return { success: false, error: e.message }; }
};

export const updateAppointmentStatus = async (appointmentId, status, userId) => {
  try {
    const q    = query(collection(db, APPOINTMENTS_COLLECTION), where('appointmentId', '==', appointmentId));
    const snap = await getDocs(q);
    let docRef;
    if (snap.empty) {
      docRef = doc(db, APPOINTMENTS_COLLECTION, appointmentId);
    } else {
      docRef = doc(db, APPOINTMENTS_COLLECTION, snap.docs[0].id);
    }
    await updateDoc(docRef, { status, 'systemInfo.updatedAt': serverTimestamp(), 'systemInfo.updatedBy': userId });
    return { success: true };
  } catch (e) { return { success: false, error: e.message }; }
};

export const deleteAppointment = async (id) => {
  try {
    await deleteDoc(doc(db, APPOINTMENTS_COLLECTION, id));
    return { success: true };
  } catch (e) { return { success: false, error: e.message }; }
};

export const getAppointments = async (filters = {}) => {
  try {
    let q = query(collection(db, APPOINTMENTS_COLLECTION), orderBy('systemInfo.createdAt', 'desc'));
    if (filters.status) {
      q = query(collection(db, APPOINTMENTS_COLLECTION), where('status', '==', filters.status));
    }
    const snap = await getDocs(q);
    const list = [];
    snap.forEach(d => list.push({ id: d.id, ...d.data() }));
    list.sort((a, b) => (b.systemInfo?.createdAt?.toMillis?.() || 0) - (a.systemInfo?.createdAt?.toMillis?.() || 0));
    return { success: true, data: list };
  } catch (e) { return { success: false, error: e.message }; }
};

// ─── IMMUNIZATIONS ────────────────────────────────────────────────────────────

export const addImmunization = async (data, userId) => {
  try {
    const docRef = await addDoc(collection(db, IMMUNIZATIONS_COLLECTION), {
      patientName:  data.patientName,
      residentId:   data.residentId  || null,
      vaccineName:  data.vaccineName,
      doseNumber:   data.doseNumber  || 1,
      nextDoseDate: data.nextDoseDate || '',
      remarks:      data.remarks     || '',
      systemInfo: { createdAt: serverTimestamp(), updatedAt: serverTimestamp(), createdBy: userId },
    });
    return { success: true, id: docRef.id };
  } catch (e) { return { success: false, error: e.message }; }
};

export const getImmunizations = async (residentId = null) => {
  try {
    let q = query(collection(db, IMMUNIZATIONS_COLLECTION), orderBy('systemInfo.createdAt', 'desc'));
    if (residentId) q = query(collection(db, IMMUNIZATIONS_COLLECTION), where('residentId', '==', residentId));
    const snap = await getDocs(q);
    const list = [];
    snap.forEach(d => list.push({ id: d.id, ...d.data() }));
    list.sort((a, b) => (b.systemInfo?.createdAt?.toMillis?.() || 0) - (a.systemInfo?.createdAt?.toMillis?.() || 0));
    return { success: true, data: list };
  } catch (e) { return { success: false, error: e.message }; }
};

export const deleteImmunization = async (id) => {
  try {
    await deleteDoc(doc(db, IMMUNIZATIONS_COLLECTION, id));
    return { success: true };
  } catch (e) { return { success: false, error: e.message }; }
};

// ─── DISEASE SURVEILLANCE ─────────────────────────────────────────────────────

export const reportDiseaseCase = async (data, userId) => {
  try {
    const docRef = await addDoc(collection(db, DISEASE_COL), {
      disease:     data.disease,
      patientName: data.patientName || 'Anonymous',
      residentId:  data.residentId  || null,
      purok:       data.purok       || '',
      age:         data.age         || '',
      gender:      data.gender      || '',
      dateOnset:   data.dateOnset   || '',
      status:      data.status      || 'Active',
      notes:       data.notes       || '',
      systemInfo: { createdAt: serverTimestamp(), updatedAt: serverTimestamp(), createdBy: userId },
    });
    return { success: true, id: docRef.id };
  } catch (e) { return { success: false, error: e.message }; }
};

export const getAllDiseaseCases = async (filters = {}) => {
  try {
    const snap = await getDocs(collection(db, DISEASE_COL));
    const list = [];
    snap.forEach(d => list.push({ id: d.id, ...d.data() }));
    let result = list;
    if (filters.disease) result = result.filter(c => c.disease === filters.disease);
    if (filters.status)  result = result.filter(c => c.status  === filters.status);
    result.sort((a, b) => (b.systemInfo?.createdAt?.toMillis?.() || 0) - (a.systemInfo?.createdAt?.toMillis?.() || 0));
    return { success: true, data: result };
  } catch (e) { return { success: false, error: e.message }; }
};

export const updateDiseaseCase = async (id, data, userId) => {
  try {
    await updateDoc(doc(db, DISEASE_COL, id), { ...data, 'systemInfo.updatedAt': serverTimestamp(), 'systemInfo.updatedBy': userId });
    return { success: true };
  } catch (e) { return { success: false, error: e.message }; }
};

export const deleteDiseaseCase = async (id) => {
  try { await deleteDoc(doc(db, DISEASE_COL, id)); return { success: true }; }
  catch (e) { return { success: false, error: e.message }; }
};

// ─── PHARMACY / MEDICINE INVENTORY ───────────────────────────────────────────

export const addMedicine = async (data, userId) => {
  try {
    const docRef = await addDoc(collection(db, PHARMACY_COL), {
      name:       data.name,
      category:   data.category   || 'General',
      unit:       data.unit       || 'pcs',
      quantity:   Number(data.quantity)    || 0,
      lowStockAt: Number(data.lowStockAt)  || 10,
      expiryDate: data.expiryDate || '',
      supplier:   data.supplier   || '',
      notes:      data.notes      || '',
      systemInfo: { createdAt: serverTimestamp(), updatedAt: serverTimestamp(), createdBy: userId },
    });
    return { success: true, id: docRef.id };
  } catch (e) { return { success: false, error: e.message }; }
};

export const getAllMedicines = async () => {
  try {
    const snap = await getDocs(collection(db, PHARMACY_COL));
    const list = [];
    snap.forEach(d => list.push({ id: d.id, ...d.data() }));
    return { success: true, data: list };
  } catch (e) { return { success: false, error: e.message }; }
};

export const updateMedicine = async (id, data, userId) => {
  try {
    await updateDoc(doc(db, PHARMACY_COL, id), { ...data, 'systemInfo.updatedAt': serverTimestamp(), 'systemInfo.updatedBy': userId });
    return { success: true };
  } catch (e) { return { success: false, error: e.message }; }
};

export const dispenseMedicine = async (id, qty, userId) => {
  try {
    const snap = await getDoc(doc(db, PHARMACY_COL, id));
    if (!snap.exists()) return { success: false, error: 'Not found' };
    const newQty = Math.max(0, (snap.data().quantity || 0) - Number(qty));
    await updateDoc(doc(db, PHARMACY_COL, id), { quantity: newQty, 'systemInfo.updatedAt': serverTimestamp(), 'systemInfo.updatedBy': userId });
    return { success: true, newQuantity: newQty };
  } catch (e) { return { success: false, error: e.message }; }
};

export const deleteMedicine = async (id) => {
  try { await deleteDoc(doc(db, PHARMACY_COL, id)); return { success: true }; }
  catch (e) { return { success: false, error: e.message }; }
};

// ─── STATISTICS ───────────────────────────────────────────────────────────────

export const getHealthStatistics = async () => {
  try {
    const [pSnap, aSnap, iSnap, dSnap, mSnap] = await Promise.all([
      getDocs(collection(db, COLLECTION_NAME)),
      getDocs(query(collection(db, APPOINTMENTS_COLLECTION), where('status', '==', 'Scheduled'))),
      getDocs(collection(db, IMMUNIZATIONS_COLLECTION)),
      getDocs(query(collection(db, DISEASE_COL), where('status', '==', 'Active'))),
      getDocs(collection(db, PHARMACY_COL)),
    ]);
    let lowStock = 0;
    mSnap.forEach(d => { const m = d.data(); if ((m.quantity || 0) <= (m.lowStockAt || 10)) lowStock++; });
    return { success: true, data: { totalPatients: pSnap.size, scheduledAppointments: aSnap.size, totalImmunizations: iSnap.size, activeDiseases: dSnap.size, lowStockMedicines: lowStock } };
  } catch (e) { return { success: false, error: e.message }; }
};

export default {
  createPatientRecord, addConsultation, getAllPatientRecords, getPatientByResidentId,
  bookAppointment, updateAppointmentStatus, deleteAppointment, getAppointments,
  addImmunization, getImmunizations, deleteImmunization,
  reportDiseaseCase, getAllDiseaseCases, updateDiseaseCase, deleteDiseaseCase,
  addMedicine, getAllMedicines, updateMedicine, dispenseMedicine, deleteMedicine,
  getHealthStatistics,
};