// src/services/healthService.js
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
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';

const COLLECTION_NAME = 'health_records';
const APPOINTMENTS_COLLECTION = 'health_appointments';
const IMMUNIZATIONS_COLLECTION = 'immunizations';

// Generate Health Record ID
const generateHealthRecordId = async () => {
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
  
  const newNumber = (lastNumber + 1).toString().padStart(4, '0');
  return `HEALTH-${year}-${newNumber}`;
};

// ============================================
// PATIENT RECORDS
// ============================================

// CREATE - Add Patient Record
export const createPatientRecord = async (patientData, userId) => {
  try {
    const ref = collection(db, COLLECTION_NAME);
    const recordId = await generateHealthRecordId();
    
    const newRecord = {
      recordId,
      residentId: patientData.residentId,
      patientInfo: {
        name: patientData.name,
        age: patientData.age,
        gender: patientData.gender,
        bloodType: patientData.bloodType || '',
        allergies: patientData.allergies || [],
        preExistingConditions: patientData.preExistingConditions || []
      },
      consultations: [],
      immunizations: [],
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
    console.error('Error creating patient record:', error);
    return { success: false, error: error.message };
  }
};

// CREATE - Add Consultation
export const addConsultation = async (recordId, consultationData, userId) => {
  try {
    const recordsRef = collection(db, COLLECTION_NAME);
    const q = query(recordsRef, where('recordId', '==', recordId));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return { success: false, error: 'Patient record not found' };
    }
    
    const docRef = doc(db, COLLECTION_NAME, snapshot.docs[0].id);
    const currentData = snapshot.docs[0].data();
    
    const newConsultation = {
      consultationId: `CONS-${Date.now()}`,
      date: serverTimestamp(),
      chiefComplaint: consultationData.chiefComplaint,
      findings: consultationData.findings,
      diagnosis: consultationData.diagnosis,
      treatment: consultationData.treatment,
      prescriptions: consultationData.prescriptions || [],
      vitalSigns: consultationData.vitalSigns || {},
      attendedBy: userId,
      followUpDate: consultationData.followUpDate || null
    };
    
    const updatedConsultations = [...(currentData.consultations || []), newConsultation];
    
    await updateDoc(docRef, {
      consultations: updatedConsultations,
      'systemInfo.updatedAt': serverTimestamp(),
      'systemInfo.updatedBy': userId
    });
    
    return { success: true, consultationId: newConsultation.consultationId };
  } catch (error) {
    console.error('Error adding consultation:', error);
    return { success: false, error: error.message };
  }
};

// READ - Get All Patient Records
export const getAllPatientRecords = async (filters = {}) => {
  try {
    const ref = collection(db, COLLECTION_NAME);
    let q = query(ref, orderBy('systemInfo.createdAt', 'desc'));
    
    const snapshot = await getDocs(q);
    const records = [];
    
    snapshot.forEach((doc) => {
      records.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, data: records, count: records.length };
  } catch (error) {
    console.error('Error getting patient records:', error);
    return { success: false, error: error.message };
  }
};

// READ - Get Patient by Resident ID
export const getPatientByResidentId = async (residentId) => {
  try {
    const ref = collection(db, COLLECTION_NAME);
    const q = query(ref, where('residentId', '==', residentId));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return { success: false, error: 'Patient record not found' };
    }
    
    const data = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    return { success: true, data };
  } catch (error) {
    console.error('Error getting patient record:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// APPOINTMENTS
// ============================================

// CREATE - Book Appointment
export const bookAppointment = async (appointmentData, userId) => {
  try {
    const ref = collection(db, APPOINTMENTS_COLLECTION);
    
    const newAppointment = {
      appointmentId: `APT-${Date.now()}`,
      residentId: appointmentData.residentId,
      patientName: appointmentData.patientName,
      appointmentDate: Timestamp.fromDate(new Date(appointmentData.appointmentDate)),
      appointmentTime: appointmentData.appointmentTime,
      appointmentType: appointmentData.appointmentType, // consultation, pre-natal, immunization, etc.
      status: 'Scheduled', // Scheduled, Confirmed, Completed, Cancelled
      notes: appointmentData.notes || '',
      systemInfo: {
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: userId,
        updatedBy: userId
      }
    };
    
    const docRef = await addDoc(ref, newAppointment);
    return { success: true, id: docRef.id, appointmentId: newAppointment.appointmentId };
  } catch (error) {
    console.error('Error booking appointment:', error);
    return { success: false, error: error.message };
  }
};

// UPDATE - Update Appointment Status
export const updateAppointmentStatus = async (appointmentId, status, userId) => {
  try {
    const ref = collection(db, APPOINTMENTS_COLLECTION);
    const q = query(ref, where('appointmentId', '==', appointmentId));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return { success: false, error: 'Appointment not found' };
    }
    
    const docRef = doc(db, APPOINTMENTS_COLLECTION, snapshot.docs[0].id);
    await updateDoc(docRef, {
      status,
      'systemInfo.updatedAt': serverTimestamp(),
      'systemInfo.updatedBy': userId
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error updating appointment:', error);
    return { success: false, error: error.message };
  }
};

// READ - Get Appointments
export const getAppointments = async (filters = {}) => {
  try {
    const ref = collection(db, APPOINTMENTS_COLLECTION);
    let q = query(ref, orderBy('appointmentDate', 'asc'));
    
    if (filters.status) {
      q = query(ref, where('status', '==', filters.status), orderBy('appointmentDate', 'asc'));
    }
    
    if (filters.date) {
      const startOfDay = new Date(filters.date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(filters.date);
      endOfDay.setHours(23, 59, 59, 999);
      
      q = query(ref, 
        where('appointmentDate', '>=', Timestamp.fromDate(startOfDay)),
        where('appointmentDate', '<=', Timestamp.fromDate(endOfDay)),
        orderBy('appointmentDate', 'asc')
      );
    }
    
    const snapshot = await getDocs(q);
    const appointments = [];
    
    snapshot.forEach((doc) => {
      appointments.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, data: appointments, count: appointments.length };
  } catch (error) {
    console.error('Error getting appointments:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// IMMUNIZATIONS
// ============================================

// CREATE - Add Immunization Record
export const addImmunization = async (immunizationData, userId) => {
  try {
    const ref = collection(db, IMMUNIZATIONS_COLLECTION);
    
    const newImmunization = {
      immunizationId: `IMM-${Date.now()}`,
      residentId: immunizationData.residentId,
      patientName: immunizationData.patientName,
      vaccineName: immunizationData.vaccineName,
      doseNumber: immunizationData.doseNumber,
      dateAdministered: serverTimestamp(),
      nextDoseDate: immunizationData.nextDoseDate ? 
        Timestamp.fromDate(new Date(immunizationData.nextDoseDate)) : null,
      administeredBy: userId,
      remarks: immunizationData.remarks || '',
      systemInfo: {
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: userId,
        updatedBy: userId
      }
    };
    
    const docRef = await addDoc(ref, newImmunization);
    
    // Also update the patient record
    const patientResult = await getPatientByResidentId(immunizationData.residentId);
    if (patientResult.success) {
      const patientDoc = doc(db, COLLECTION_NAME, patientResult.data.id);
      const currentData = patientResult.data;
      const updatedImmunizations = [...(currentData.immunizations || []), {
        immunizationId: newImmunization.immunizationId,
        vaccineName: immunizationData.vaccineName,
        doseNumber: immunizationData.doseNumber,
        dateAdministered: newImmunization.dateAdministered
      }];
      
      await updateDoc(patientDoc, {
        immunizations: updatedImmunizations,
        'systemInfo.updatedAt': serverTimestamp()
      });
    }
    
    return { success: true, id: docRef.id, immunizationId: newImmunization.immunizationId };
  } catch (error) {
    console.error('Error adding immunization:', error);
    return { success: false, error: error.message };
  }
};

// READ - Get Immunizations
export const getImmunizations = async (residentId = null) => {
  try {
    const ref = collection(db, IMMUNIZATIONS_COLLECTION);
    let q = query(ref, orderBy('systemInfo.createdAt', 'desc'));
    
    if (residentId) {
      q = query(ref, where('residentId', '==', residentId), orderBy('systemInfo.createdAt', 'desc'));
    }
    
    const snapshot = await getDocs(q);
    const immunizations = [];
    
    snapshot.forEach((doc) => {
      immunizations.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, data: immunizations, count: immunizations.length };
  } catch (error) {
    console.error('Error getting immunizations:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// STATISTICS
// ============================================

export const getHealthStatistics = async () => {
  try {
    // Get patient records
    const patientsRef = collection(db, COLLECTION_NAME);
    const patientsSnapshot = await getDocs(query(patientsRef));
    
    // Get appointments
    const appointmentsRef = collection(db, APPOINTMENTS_COLLECTION);
    const appointmentsSnapshot = await getDocs(query(appointmentsRef));
    
    // Get today's appointments
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayAppointmentsQuery = query(
      appointmentsRef,
      where('appointmentDate', '>=', Timestamp.fromDate(today)),
      where('appointmentDate', '<', Timestamp.fromDate(tomorrow))
    );
    const todayAppointmentsSnapshot = await getDocs(todayAppointmentsQuery);
    
    // Get immunizations
    const immunizationsRef = collection(db, IMMUNIZATIONS_COLLECTION);
    const immunizationsSnapshot = await getDocs(query(immunizationsRef));
    
    const stats = {
      totalPatients: patientsSnapshot.size,
      totalAppointments: appointmentsSnapshot.size,
      todayAppointments: todayAppointmentsSnapshot.size,
      totalImmunizations: immunizationsSnapshot.size,
      appointmentsByStatus: {},
      consultationsThisMonth: 0
    };
    
    // Count appointments by status
    appointmentsSnapshot.forEach((doc) => {
      const data = doc.data();
      const status = data.status || 'Unknown';
      stats.appointmentsByStatus[status] = (stats.appointmentsByStatus[status] || 0) + 1;
    });
    
    // Count consultations this month
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);
    
    patientsSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.consultations) {
        data.consultations.forEach(consultation => {
          if (consultation.date && consultation.date.toDate) {
            const consultDate = consultation.date.toDate();
            if (consultDate >= firstDayOfMonth) {
              stats.consultationsThisMonth++;
            }
          }
        });
      }
    });
    
    return { success: true, data: stats };
  } catch (error) {
    console.error('Error getting health statistics:', error);
    return { success: false, error: error.message };
  }
};

export default {
  createPatientRecord,
  addConsultation,
  getAllPatientRecords,
  getPatientByResidentId,
  bookAppointment,
  updateAppointmentStatus,
  getAppointments,
  addImmunization,
  getImmunizations,
  getHealthStatistics
};