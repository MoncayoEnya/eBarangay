// src/services/settingsService.js
import {
  doc, getDoc, setDoc, collection, getDocs,
  addDoc, updateDoc, deleteDoc, serverTimestamp, query, orderBy
} from 'firebase/firestore';
import { db } from './firebase';

const PROFILE_DOC  = 'barangay_profile';
const SETTINGS_COL = 'settings';
const USERS_COL    = 'users';
const FEES_COL     = 'document_fees';
const OFFICIALS_COL = 'barangay_officials';

// ── Barangay Profile ──────────────────────────────────────────────────────────
export const getBarangayProfile = async () => {
  try {
    const snap = await getDoc(doc(db, SETTINGS_COL, PROFILE_DOC));
    if (snap.exists()) return { success: true, data: snap.data() };
    return { success: true, data: null };
  } catch (e) { return { success: false, error: e.message }; }
};

export const saveBarangayProfile = async (data) => {
  try {
    await setDoc(doc(db, SETTINGS_COL, PROFILE_DOC), {
      ...data,
      updatedAt: serverTimestamp(),
    }, { merge: true });
    // Also save to localStorage for PDF generation
    if (data.barangayName) localStorage.setItem('brgy_name', data.barangayName);
    if (data.captainName)  localStorage.setItem('brgy_captain', data.captainName);
    if (data.municipality) localStorage.setItem('brgy_municipality', data.municipality + ', ' + (data.province || ''));
    return { success: true };
  } catch (e) { return { success: false, error: e.message }; }
};

// ── Barangay Officials ─────────────────────────────────────────────────────────
export const getOfficials = async () => {
  try {
    const snap = await getDocs(query(collection(db, OFFICIALS_COL), orderBy('order', 'asc')));
    return { success: true, data: snap.docs.map(d => ({ id: d.id, ...d.data() })) };
  } catch (e) { return { success: false, error: e.message }; }
};

export const saveOfficial = async (data) => {
  try {
    if (data.id) {
      await updateDoc(doc(db, OFFICIALS_COL, data.id), { ...data, updatedAt: serverTimestamp() });
    } else {
      await addDoc(collection(db, OFFICIALS_COL), { ...data, createdAt: serverTimestamp() });
    }
    return { success: true };
  } catch (e) { return { success: false, error: e.message }; }
};

export const deleteOfficial = async (id) => {
  try {
    await deleteDoc(doc(db, OFFICIALS_COL, id));
    return { success: true };
  } catch (e) { return { success: false, error: e.message }; }
};

// ── System Users ───────────────────────────────────────────────────────────────
export const getAllUsers = async () => {
  try {
    const snap = await getDocs(query(collection(db, USERS_COL), orderBy('createdAt', 'desc')));
    return { success: true, data: snap.docs.map(d => ({ id: d.id, ...d.data() })) };
  } catch (e) { return { success: false, error: e.message }; }
};

export const updateUserProfile = async (uid, data) => {
  try {
    await setDoc(doc(db, USERS_COL, uid), { ...data, updatedAt: serverTimestamp() }, { merge: true });
    return { success: true };
  } catch (e) { return { success: false, error: e.message }; }
};

export const deactivateUser = async (uid) => {
  try {
    await updateDoc(doc(db, USERS_COL, uid), { isActive: false, updatedAt: serverTimestamp() });
    return { success: true };
  } catch (e) { return { success: false, error: e.message }; }
};

export const activateUser = async (uid) => {
  try {
    await updateDoc(doc(db, USERS_COL, uid), { isActive: true, updatedAt: serverTimestamp() });
    return { success: true };
  } catch (e) { return { success: false, error: e.message }; }
};

// ── Document Fees ──────────────────────────────────────────────────────────────
export const getDocumentFees = async () => {
  try {
    const snap = await getDocs(collection(db, FEES_COL));
    if (snap.empty) {
      // Return default fees
      return {
        success: true,
        data: [
          { id: 'clearance',    name: 'Barangay Clearance',            fee: 50,  processingDays: 1 },
          { id: 'residency',    name: 'Certificate of Residency',      fee: 50,  processingDays: 1 },
          { id: 'indigency',    name: 'Certificate of Indigency',      fee: 0,   processingDays: 1 },
          { id: 'moral',        name: 'Certificate of Good Moral',     fee: 50,  processingDays: 1 },
          { id: 'business',     name: 'Business Clearance',            fee: 200, processingDays: 3 },
          { id: 'cohabitation', name: 'Certificate of Cohabitation',   fee: 100, processingDays: 2 },
        ]
      };
    }
    return { success: true, data: snap.docs.map(d => ({ id: d.id, ...d.data() })) };
  } catch (e) { return { success: false, error: e.message }; }
};

export const saveDocumentFees = async (fees) => {
  try {
    for (const fee of fees) {
      await setDoc(doc(db, FEES_COL, fee.id), {
        name: fee.name,
        fee: Number(fee.fee),
        processingDays: Number(fee.processingDays),
        updatedAt: serverTimestamp(),
      }, { merge: true });
    }
    return { success: true };
  } catch (e) { return { success: false, error: e.message }; }
};

// ── Notification Settings ──────────────────────────────────────────────────────
export const getNotificationSettings = async () => {
  try {
    const snap = await getDoc(doc(db, SETTINGS_COL, 'notifications'));
    if (snap.exists()) return { success: true, data: snap.data() };
    return {
      success: true,
      data: {
        emailOnNewDocument: true,
        emailOnNewIncident: true,
        emailOnAlert: true,
        smsOnAlert: false,
        smsOnDocument: false,
        reminderDays: 3,
      }
    };
  } catch (e) { return { success: false, error: e.message }; }
};

export const saveNotificationSettings = async (data) => {
  try {
    await setDoc(doc(db, SETTINGS_COL, 'notifications'), { ...data, updatedAt: serverTimestamp() }, { merge: true });
    return { success: true };
  } catch (e) { return { success: false, error: e.message }; }
};

export default {
  getBarangayProfile, saveBarangayProfile,
  getOfficials, saveOfficial, deleteOfficial,
  getAllUsers, updateUserProfile, deactivateUser, activateUser,
  getDocumentFees, saveDocumentFees,
  getNotificationSettings, saveNotificationSettings,
};

// ── Audit Logs ────────────────────────────────────────────────────────────────
const AUDIT_COL = 'audit_logs';

export const logAuditEvent = async (userId, userName, action, module, details = '') => {
  try {
    await addDoc(collection(db, AUDIT_COL), {
      userId, userName, action, module, details,
      timestamp: serverTimestamp(),
      ip: '',
    });
  } catch (_) {}
};

export const getAuditLogs = async (limitCount = 100) => {
  try {
    const { limit } = await import('firebase/firestore');
    const snap = await getDocs(query(
      collection(db, AUDIT_COL),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    ));
    return { success: true, data: snap.docs.map(d => ({ id: d.id, ...d.data() })) };
  } catch (e) { return { success: false, error: e.message, data: [] }; }
};

// ── RBAC Permissions ──────────────────────────────────────────────────────────
const RBAC_DOC = 'rbac_permissions';

export const getRBACPermissions = async () => {
  try {
    const snap = await getDoc(doc(db, SETTINGS_COL, RBAC_DOC));
    if (snap.exists()) return { success: true, data: snap.data() };
    // Return defaults
    return {
      success: true,
      data: {
        admin:         { residents:true,  documents:true,  incidents:true,  announcements:true,  events:true,  health:true,  welfare:true,  waste:true,  finance:true,  drrm:true,  settings:true  },
        staff:         { residents:true,  documents:true,  incidents:true,  announcements:true,  events:true,  health:false, welfare:false, waste:false, finance:false, drrm:false, settings:false },
        treasurer:     { residents:false, documents:true,  incidents:false, announcements:false, events:false, health:false, welfare:false, waste:false, finance:true,  drrm:false, settings:false },
        kagawad:       { residents:true,  documents:true,  incidents:true,  announcements:true,  events:true,  health:false, welfare:true,  waste:true,  finance:false, drrm:true,  settings:false },
        health_worker: { residents:true,  documents:false, incidents:false, announcements:false, events:false, health:true,  welfare:false, waste:false, finance:false, drrm:false, settings:false },
      }
    };
  } catch (e) { return { success: false, error: e.message }; }
};

export const saveRBACPermissions = async (data) => {
  try {
    await setDoc(doc(db, SETTINGS_COL, RBAC_DOC), { ...data, updatedAt: serverTimestamp() }, { merge: true });
    return { success: true };
  } catch (e) { return { success: false, error: e.message }; }
};

// ── Payment Gateway Config ────────────────────────────────────────────────────
const PAYMENT_DOC = 'payment_gateway';

export const getPaymentConfig = async () => {
  try {
    const snap = await getDoc(doc(db, SETTINGS_COL, PAYMENT_DOC));
    if (snap.exists()) return { success: true, data: snap.data() };
    return { success: true, data: { provider: 'paymongo', publicKey: '', secretKey: '', gcashEnabled: false, cardEnabled: false, testMode: true } };
  } catch (e) { return { success: false, error: e.message }; }
};

export const savePaymentConfig = async (data) => {
  try {
    await setDoc(doc(db, SETTINGS_COL, PAYMENT_DOC), { ...data, updatedAt: serverTimestamp() }, { merge: true });
    return { success: true };
  } catch (e) { return { success: false, error: e.message }; }
};

// ── SMS Gateway Config ────────────────────────────────────────────────────────
const SMS_DOC = 'sms_gateway';

export const getSMSConfig = async () => {
  try {
    const snap = await getDoc(doc(db, SETTINGS_COL, SMS_DOC));
    if (snap.exists()) return { success: true, data: snap.data() };
    return { success: true, data: { provider: 'semaphore', apiKey: '', senderName: 'EBARANGAY', enabled: false, templates: { alert: 'EMERGENCY ALERT: {message}', document: 'Your {docType} is ready for pickup. Ref: {refNo}', event: 'Reminder: {eventName} on {date} at {location}' } } };
  } catch (e) { return { success: false, error: e.message }; }
};

export const saveSMSConfig = async (data) => {
  try {
    await setDoc(doc(db, SETTINGS_COL, SMS_DOC), { ...data, updatedAt: serverTimestamp() }, { merge: true });
    return { success: true };
  } catch (e) { return { success: false, error: e.message }; }
};