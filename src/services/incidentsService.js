// src/services/incidentsService.js
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';

const COLLECTION_NAME = 'incidents';

// Generate Case Number
const generateCaseNumber = async () => {
  const year = new Date().getFullYear();
  const incidentsRef = collection(db, COLLECTION_NAME);
  const q = query(incidentsRef, orderBy('systemInfo.createdAt', 'desc'), limit(1));
  const querySnapshot = await getDocs(q);
  
  let lastNumber = 0;
  if (!querySnapshot.empty) {
    const lastIncident = querySnapshot.docs[0].data();
    if (lastIncident.caseNumber) {
      lastNumber = parseInt(lastIncident.caseNumber.split('-')[2]);
    }
  }
  
  const newNumber = (lastNumber + 1).toString().padStart(3, '0');
  return `INC-${year}-${newNumber}`;
};

// CREATE - Add Incident
export const createIncident = async (incidentData, currentUserId) => {
  try {
    const incidentsRef = collection(db, COLLECTION_NAME);
    const caseNumber = await generateCaseNumber();
    
    const newIncident = {
      caseNumber,
      category: incidentData.category,
      categoryType: incidentData.category.toLowerCase().replace(' ', '_'),
      
      complainant: {
        name: incidentData.complainantName,
        purok: incidentData.complainantPurok,
        residentId: incidentData.complainantResidentId || null,
        initial: incidentData.complainantName.charAt(0).toUpperCase(),
        color: incidentData.complainantColor || 'primary'
      },
      
      respondent: {
        name: incidentData.respondentName,
        purok: incidentData.respondentPurok || '',
        residentId: incidentData.respondentResidentId || null
      },
      
      location: incidentData.location,
      description: incidentData.description,
      
      status: 'Open',
      
      mediation: {
        scheduled: false,
        scheduledDate: null,
        lupongMembers: [],
        notes: ''
      },
      
      resolution: {
        resolved: false,
        resolvedDate: null,
        resolution: '',
        referredTo: null
      },
      
      evidence: [],
      notes: [],
      
      systemInfo: {
        dateFiled: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: currentUserId,
        updatedBy: currentUserId
      }
    };

    const docRef = await addDoc(incidentsRef, newIncident);
    
    return {
      success: true,
      id: docRef.id,
      caseNumber,
      message: 'Incident reported successfully'
    };
  } catch (error) {
    console.error('Error creating incident:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// ALIAS - addIncident (used by useIncidents.js)
export const addIncident = createIncident;

// READ - Get All Incidents
export const getAllIncidents = async (filters = {}) => {
  try {
    const incidentsRef = collection(db, COLLECTION_NAME);
    let q = query(incidentsRef, orderBy('systemInfo.createdAt', 'desc'));

    if (filters.status) {
      q = query(incidentsRef, where('status', '==', filters.status), orderBy('systemInfo.createdAt', 'desc'));
    }

    if (filters.category) {
      q = query(incidentsRef, where('category', '==', filters.category), orderBy('systemInfo.createdAt', 'desc'));
    }

    const querySnapshot = await getDocs(q);
    const incidents = [];

    querySnapshot.forEach((doc) => {
      incidents.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return {
      success: true,
      data: incidents,
      count: incidents.length
    };
  } catch (error) {
    console.error('Error getting incidents:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// READ - Get Single Incident by ID
export const getIncidentById = async (incidentId) => {
  try {
    const incidentRef = doc(db, COLLECTION_NAME, incidentId);
    const docSnap = await getDoc(incidentRef);

    if (docSnap.exists()) {
      return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
    } else {
      return { success: false, error: 'Incident not found' };
    }
  } catch (error) {
    console.error('Error getting incident:', error);
    return { success: false, error: error.message };
  }
};

// READ - Get Incidents by Status
export const getIncidentsByStatus = async (status) => {
  return getAllIncidents({ status });
};

// READ - Get Incidents by Category
export const getIncidentsByCategory = async (category) => {
  return getAllIncidents({ category });
};

// READ - Search Incidents
export const searchIncidents = async (searchTerm, filters = {}) => {
  try {
    const incidentsRef = collection(db, COLLECTION_NAME);
    let q = query(incidentsRef, orderBy('systemInfo.createdAt', 'desc'));

    if (filters.status) {
      q = query(incidentsRef, where('status', '==', filters.status), orderBy('systemInfo.createdAt', 'desc'));
    }

    const querySnapshot = await getDocs(q);
    let incidents = [];

    querySnapshot.forEach((doc) => {
      incidents.push({
        id: doc.id,
        ...doc.data()
      });
    });

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      incidents = incidents.filter(incident => {
        return (
          incident.caseNumber?.toLowerCase().includes(searchLower) ||
          incident.complainant?.name.toLowerCase().includes(searchLower) ||
          incident.category?.toLowerCase().includes(searchLower) ||
          incident.location?.toLowerCase().includes(searchLower)
        );
      });
    }

    return {
      success: true,
      data: incidents,
      count: incidents.length
    };
  } catch (error) {
    console.error('Error searching incidents:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// UPDATE - Update Incident
export const updateIncident = async (incidentId, updates, userId) => {
  try {
    const incidentRef = doc(db, COLLECTION_NAME, incidentId);
    
    await updateDoc(incidentRef, {
      ...updates,
      'systemInfo.updatedAt': serverTimestamp(),
      'systemInfo.updatedBy': userId
    });

    return {
      success: true,
      message: 'Incident updated successfully'
    };
  } catch (error) {
    console.error('Error updating incident:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// UPDATE - Update Status
export const updateIncidentStatus = async (incidentId, newStatus, userId) => {
  try {
    const incidentRef = doc(db, COLLECTION_NAME, incidentId);
    
    const updates = {
      status: newStatus,
      'systemInfo.updatedAt': serverTimestamp(),
      'systemInfo.updatedBy': userId
    };

    if (newStatus === 'Resolved') {
      updates['resolution.resolved'] = true;
      updates['resolution.resolvedDate'] = serverTimestamp();
    }

    await updateDoc(incidentRef, updates);

    return {
      success: true,
      message: `Incident status updated to ${newStatus}`
    };
  } catch (error) {
    console.error('Error updating incident status:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// UPDATE - Add Note to Incident
export const addNote = async (incidentId, noteText, author, userId) => {
  try {
    const incidentRef = doc(db, COLLECTION_NAME, incidentId);
    const docSnap = await getDoc(incidentRef);

    if (!docSnap.exists()) {
      return { success: false, error: 'Incident not found' };
    }

    const currentNotes = docSnap.data().notes || [];
    const newNote = {
      text: noteText,
      author: author,
      createdBy: userId,
      timestamp: new Date().toISOString()
    };

    await updateDoc(incidentRef, {
      notes: [...currentNotes, newNote],
      'systemInfo.updatedAt': serverTimestamp(),
      'systemInfo.updatedBy': userId
    });

    return { success: true, message: 'Note added successfully' };
  } catch (error) {
    console.error('Error adding note:', error);
    return { success: false, error: error.message };
  }
};

// UPDATE - Schedule Mediation
export const scheduleMediation = async (incidentId, mediationData, userId) => {
  try {
    const incidentRef = doc(db, COLLECTION_NAME, incidentId);
    
    await updateDoc(incidentRef, {
      status: 'Under Mediation',
      'mediation.scheduled': true,
      'mediation.scheduledDate': mediationData.scheduledDate,
      'mediation.lupongMembers': mediationData.lupongMembers || [],
      'mediation.notes': mediationData.notes || '',
      'systemInfo.updatedAt': serverTimestamp(),
      'systemInfo.updatedBy': userId
    });

    return {
      success: true,
      message: 'Mediation scheduled successfully'
    };
  } catch (error) {
    console.error('Error scheduling mediation:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// UPDATE - Resolve Incident
export const resolveIncident = async (incidentId, resolutionData, userId) => {
  try {
    const incidentRef = doc(db, COLLECTION_NAME, incidentId);
    
    await updateDoc(incidentRef, {
      status: 'Resolved',
      'resolution.resolved': true,
      'resolution.resolvedDate': serverTimestamp(),
      'resolution.resolution': resolutionData.resolution,
      'systemInfo.updatedAt': serverTimestamp(),
      'systemInfo.updatedBy': userId
    });

    return {
      success: true,
      message: 'Incident resolved successfully'
    };
  } catch (error) {
    console.error('Error resolving incident:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// DELETE
export const deleteIncident = async (incidentId) => {
  try {
    const incidentRef = doc(db, COLLECTION_NAME, incidentId);
    await deleteDoc(incidentRef);

    return {
      success: true,
      message: 'Incident deleted successfully'
    };
  } catch (error) {
    console.error('Error deleting incident:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// STATISTICS
export const getIncidentStatistics = async () => {
  try {
    const incidentsRef = collection(db, COLLECTION_NAME);
    const q = query(incidentsRef);
    const querySnapshot = await getDocs(q);

    const stats = {
      total: 0,
      open: 0,
      underMediation: 0,
      resolved: 0,
      byCategory: {},
      byMonth: {},
      avgResolutionTime: 0
    };

    let totalResolutionDays = 0;
    let resolvedCount = 0;

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      stats.total++;

      const status = (data.status || 'open').toLowerCase().replace(' ', '_');
      if (status === 'open') stats.open++;
      else if (status === 'under_mediation') stats.underMediation++;
      else if (status === 'resolved') stats.resolved++;

      stats.byCategory[data.category] = (stats.byCategory[data.category] || 0) + 1;

      if (data.resolution?.resolved && data.systemInfo?.dateFiled && data.resolution?.resolvedDate) {
        const filedDate = data.systemInfo.dateFiled.toDate();
        const resolvedDate = data.resolution.resolvedDate.toDate();
        const diffDays = Math.ceil((resolvedDate - filedDate) / (1000 * 60 * 60 * 24));
        totalResolutionDays += diffDays;
        resolvedCount++;
      }
    });

    if (resolvedCount > 0) {
      stats.avgResolutionTime = (totalResolutionDays / resolvedCount).toFixed(1);
    }

    return {
      success: true,
      data: stats
    };
  } catch (error) {
    console.error('Error getting incident statistics:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export default {
  createIncident,
  addIncident,
  getAllIncidents,
  getIncidentById,
  getIncidentsByStatus,
  getIncidentsByCategory,
  searchIncidents,
  updateIncident,
  updateIncidentStatus,
  addNote,
  scheduleMediation,
  resolveIncident,
  deleteIncident,
  getIncidentStatistics
};