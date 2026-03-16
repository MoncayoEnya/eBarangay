// src/services/eventsService.js
import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDoc, getDocs, query, orderBy, where, serverTimestamp, Timestamp
} from 'firebase/firestore';
import { db } from './firebase';

const COLLECTION = 'events';

// CREATE
export const createEvent = async (data, userId) => {
  try {
    const ref = collection(db, COLLECTION);
    const docRef = await addDoc(ref, {
      title:        data.title,
      description:  data.description,
      category:     data.category || 'GENERAL',        // MEETING | COMMUNITY | FESTIVAL | TRAINING | GENERAL
      categoryType: (data.category || 'GENERAL').toLowerCase(),
      date:         data.date,                          // Store as "YYYY-MM-DD" string
      time:         data.time || '',
      location:     data.location || '',
      organizer:    data.organizer || 'Admin',
      rsvps:        0,
      status:       'Upcoming',                        // Upcoming | Ongoing | Completed | Cancelled
      systemInfo: {
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: userId,
      },
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('createEvent:', error);
    return { success: false, error: error.message };
  }
};

// READ ALL
export const getAllEvents = async (filters = {}) => {
  try {
    const ref = collection(db, COLLECTION);
    let q = query(ref, orderBy('date', 'asc'));

    if (filters.category) {
      q = query(ref,
        where('categoryType', '==', filters.category.toLowerCase()),
        orderBy('date', 'asc')
      );
    }
    if (filters.status) {
      q = query(ref,
        where('status', '==', filters.status),
        orderBy('date', 'asc')
      );
    }

    const snapshot = await getDocs(q);
    const list = [];
    snapshot.forEach(d => list.push({ id: d.id, ...d.data() }));
    return { success: true, data: list };
  } catch (error) {
    console.error('getAllEvents:', error);
    return { success: false, error: error.message };
  }
};

// READ ONE
export const getEventById = async (id) => {
  try {
    const snap = await getDoc(doc(db, COLLECTION, id));
    if (!snap.exists()) return { success: false, error: 'Not found' };
    return { success: true, data: { id: snap.id, ...snap.data() } };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// UPDATE
export const updateEvent = async (id, data, userId) => {
  try {
    await updateDoc(doc(db, COLLECTION, id), {
      ...data,
      'systemInfo.updatedAt': serverTimestamp(),
      'systemInfo.updatedBy': userId,
    });
    return { success: true };
  } catch (error) {
    console.error('updateEvent:', error);
    return { success: false, error: error.message };
  }
};

// RSVP — increment counter
export const rsvpEvent = async (id) => {
  try {
    const snap = await getDoc(doc(db, COLLECTION, id));
    if (snap.exists()) {
      await updateDoc(doc(db, COLLECTION, id), { rsvps: (snap.data().rsvps || 0) + 1 });
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// DELETE
export const deleteEvent = async (id) => {
  try {
    await deleteDoc(doc(db, COLLECTION, id));
    return { success: true };
  } catch (error) {
    console.error('deleteEvent:', error);
    return { success: false, error: error.message };
  }
};

// STATS
export const getEventStats = async () => {
  try {
    const snapshot = await getDocs(collection(db, COLLECTION));
    let total = 0, upcoming = 0, totalRsvps = 0;
    snapshot.forEach(d => {
      total++;
      const data = d.data();
      if (data.status === 'Upcoming') upcoming++;
      totalRsvps += data.rsvps || 0;
    });
    return { success: true, data: { total, upcoming, totalRsvps } };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export default {
  createEvent, getAllEvents, getEventById, updateEvent,
  rsvpEvent, deleteEvent, getEventStats,
};