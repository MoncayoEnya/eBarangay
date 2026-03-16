// src/services/announcementService.js
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDoc, getDocs, query, orderBy, where, serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';

const COLLECTION = 'announcements';

// CREATE
export const createAnnouncement = async (data, userId) => {
  try {
    const ref = collection(db, COLLECTION);
    const docRef = await addDoc(ref, {
      title:       data.title,
      description: data.description,
      type:        data.type || 'GENERAL',       // URGENT | IMPORTANT | GENERAL | INFO
      typeClass:   (data.type || 'GENERAL').toLowerCase(),
      author:      data.author || 'Admin',
      targetGroup: data.targetGroup || 'All Residents',
      status:      'Active',
      views:       0,
      systemInfo: {
        createdAt:  serverTimestamp(),
        updatedAt:  serverTimestamp(),
        createdBy:  userId,
      },
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('createAnnouncement:', error);
    return { success: false, error: error.message };
  }
};

// READ ALL
export const getAllAnnouncements = async (filters = {}) => {
  try {
    const ref = collection(db, COLLECTION);
    let q = query(ref, orderBy('systemInfo.createdAt', 'desc'));

    if (filters.type) {
      q = query(ref,
        where('typeClass', '==', filters.type.toLowerCase()),
        orderBy('systemInfo.createdAt', 'desc')
      );
    }
    if (filters.status) {
      q = query(ref,
        where('status', '==', filters.status),
        orderBy('systemInfo.createdAt', 'desc')
      );
    }

    const snapshot = await getDocs(q);
    const list = [];
    snapshot.forEach(d => list.push({ id: d.id, ...d.data() }));
    return { success: true, data: list };
  } catch (error) {
    console.error('getAllAnnouncements:', error);
    return { success: false, error: error.message };
  }
};

// READ ONE
export const getAnnouncementById = async (id) => {
  try {
    const snap = await getDoc(doc(db, COLLECTION, id));
    if (!snap.exists()) return { success: false, error: 'Not found' };
    return { success: true, data: { id: snap.id, ...snap.data() } };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// UPDATE
export const updateAnnouncement = async (id, data, userId) => {
  try {
    await updateDoc(doc(db, COLLECTION, id), {
      ...data,
      'systemInfo.updatedAt': serverTimestamp(),
      'systemInfo.updatedBy': userId,
    });
    return { success: true };
  } catch (error) {
    console.error('updateAnnouncement:', error);
    return { success: false, error: error.message };
  }
};

// INCREMENT VIEWS
export const incrementViews = async (id) => {
  try {
    const snap = await getDoc(doc(db, COLLECTION, id));
    if (snap.exists()) {
      await updateDoc(doc(db, COLLECTION, id), { views: (snap.data().views || 0) + 1 });
    }
  } catch (_) { /* silent */ }
};

// DELETE
export const deleteAnnouncement = async (id) => {
  try {
    await deleteDoc(doc(db, COLLECTION, id));
    return { success: true };
  } catch (error) {
    console.error('deleteAnnouncement:', error);
    return { success: false, error: error.message };
  }
};

// STATS
export const getAnnouncementStats = async () => {
  try {
    const snapshot = await getDocs(collection(db, COLLECTION));
    let total = 0, active = 0, totalViews = 0;
    snapshot.forEach(d => {
      total++;
      const data = d.data();
      if (data.status === 'Active') active++;
      totalViews += data.views || 0;
    });
    return { success: true, data: { total, active, totalViews } };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export default {
  createAnnouncement, getAllAnnouncements, getAnnouncementById,
  updateAnnouncement, incrementViews, deleteAnnouncement, getAnnouncementStats,
};