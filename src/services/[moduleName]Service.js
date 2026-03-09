// src/services/[moduleName]Service.js
import { 
  collection, doc, addDoc, updateDoc, deleteDoc, 
  getDoc, getDocs, query, where, orderBy, 
  limit, serverTimestamp 
} from 'firebase/firestore';
import { db } from './firebase';

const COLLECTION_NAME = '[collectionName]'; // e.g., 'health_records'

// Auto-generate ID
const generateId = async () => {
  const year = new Date().getFullYear();
  const ref = collection(db, COLLECTION_NAME);
  const q = query(ref, orderBy('systemInfo.createdAt', 'desc'), limit(1));
  const snapshot = await getDocs(q);
  
  let lastNumber = 0;
  if (!snapshot.empty) {
    const lastDoc = snapshot.docs[0].data();
    if (lastDoc.recordId) {
      lastNumber = parseInt(lastDoc.recordId.split('-')[2]);
    }
  }
  
  const newNumber = (lastNumber + 1).toString().padStart(3, '0');
  return `[PREFIX]-${year}-${newNumber}`; // e.g., HEALTH-2024-001
};

// CREATE
export const create[ModuleName] = async (data, userId) => {
  try {
    const ref = collection(db, COLLECTION_NAME);
    const recordId = await generateId();
    
    const newRecord = {
      recordId,
      ...data,
      systemInfo: {
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: userId,
        updatedBy: userId
      }
    };

    const docRef = await addDoc(ref, newRecord);
    return { success: true, id: docRef.id, recordId };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// READ
export const getAll[ModuleName] = async (filters = {}) => {
  try {
    const ref = collection(db, COLLECTION_NAME);
    let q = query(ref, orderBy('systemInfo.createdAt', 'desc'));

    if (filters.status) {
      q = query(ref, where('status', '==', filters.status), 
                orderBy('systemInfo.createdAt', 'desc'));
    }

    const snapshot = await getDocs(q);
    const records = [];
    snapshot.forEach((doc) => {
      records.push({ id: doc.id, ...doc.data() });
    });

    return { success: true, data: records, count: records.length };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// UPDATE
export const update[ModuleName] = async (id, updates, userId) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, {
      ...updates,
      'systemInfo.updatedAt': serverTimestamp(),
      'systemInfo.updatedBy': userId
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// DELETE
export const delete[ModuleName] = async (id) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// STATISTICS
export const get[ModuleName]Statistics = async () => {
  try {
    const ref = collection(db, COLLECTION_NAME);
    const snapshot = await getDocs(query(ref));
    
    const stats = {
      total: snapshot.size,
      // Add your specific stats here
    };

    return { success: true, data: stats };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export default {
  create[ModuleName],
  getAll[ModuleName],
  update[ModuleName],
  delete[ModuleName],
  get[ModuleName]Statistics
};