// src/services/grievanceService.js
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDocs, query, orderBy, where, serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';

const COLLECTION = 'welfare_grievances';

export const submitGrievance = async (data, userId) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION), {
      fullName:     data.fullName,
      purok:        data.purok        || '',
      contactNumber: data.contactNumber || '',
      category:     data.category     || 'Aid Distribution',   // Aid Distribution | Eligibility | Other
      programName:  data.programName  || '',
      description:  data.description,
      status:       'Pending',                                  // Pending | Under Review | Resolved | Dismissed
      resolution:   '',
      systemInfo: {
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: userId || 'anonymous',
      },
    });
    return { success: true, id: docRef.id };
  } catch (e) { return { success: false, error: e.message }; }
};

export const getAllGrievances = async (filters = {}) => {
  try {
    const snap = await getDocs(collection(db, COLLECTION));
    let list = [];
    snap.forEach(d => list.push({ id: d.id, ...d.data() }));
    if (filters.status) list = list.filter(g => g.status === filters.status);
    list.sort((a, b) => (b.systemInfo?.createdAt?.toMillis?.() || 0) - (a.systemInfo?.createdAt?.toMillis?.() || 0));
    return { success: true, data: list };
  } catch (e) { return { success: false, error: e.message }; }
};

export const updateGrievanceStatus = async (id, status, resolution, userId) => {
  try {
    await updateDoc(doc(db, COLLECTION, id), {
      status, resolution: resolution || '',
      'systemInfo.updatedAt': serverTimestamp(),
      'systemInfo.updatedBy': userId,
    });
    return { success: true };
  } catch (e) { return { success: false, error: e.message }; }
};

export const deleteGrievance = async (id) => {
  try { await deleteDoc(doc(db, COLLECTION, id)); return { success: true }; }
  catch (e) { return { success: false, error: e.message }; }
};

export default { submitGrievance, getAllGrievances, updateGrievanceStatus, deleteGrievance };