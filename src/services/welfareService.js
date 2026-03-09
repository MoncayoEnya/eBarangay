// src/services/welfareService.js
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from './firebase';

const PROGRAMS_COLLECTION = 'welfare_programs';
const BENEFICIARIES_COLLECTION = 'welfare_beneficiaries';
const DISTRIBUTIONS_COLLECTION = 'aid_distributions';

// Generate Program ID
const generateProgramId = async () => {
  const year = new Date().getFullYear();
  const ref = collection(db, PROGRAMS_COLLECTION);
  const q = query(ref, orderBy('systemInfo.createdAt', 'desc'), limit(1));
  const snapshot = await getDocs(q);
  
  let lastNumber = 0;
  if (!snapshot.empty) {
    const lastDoc = snapshot.docs[0].data();
    if (lastDoc.programId) {
      lastNumber = parseInt(lastDoc.programId.split('-')[2]);
    }
  }
  
  const newNumber = (lastNumber + 1).toString().padStart(3, '0');
  return `PROG-${year}-${newNumber}`;
};

// ============================================
// PROGRAMS
// ============================================

// CREATE - Create Welfare Program
export const createProgram = async (programData, userId) => {
  try {
    const ref = collection(db, PROGRAMS_COLLECTION);
    const programId = await generateProgramId();
    
    const newProgram = {
      programId,
      name: programData.name,
      description: programData.description,
      category: programData.category, // senior_citizen, pwd, emergency, medical, etc.
      aidType: programData.aidType, // cash, food, medicine, etc.
      amountPerBeneficiary: programData.amountPerBeneficiary || 0,
      totalBudget: programData.totalBudget,
      status: 'Active', // Active, Completed, Cancelled
      startDate: programData.startDate ? Timestamp.fromDate(new Date(programData.startDate)) : serverTimestamp(),
      endDate: programData.endDate ? Timestamp.fromDate(new Date(programData.endDate)) : null,
      eligibilityCriteria: programData.eligibilityCriteria || [],
      distributionSchedule: programData.distributionSchedule || [],
      totalBeneficiaries: 0,
      totalDistributed: 0,
      systemInfo: {
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: userId,
        updatedBy: userId
      }
    };
    
    const docRef = await addDoc(ref, newProgram);
    return { success: true, id: docRef.id, programId };
  } catch (error) {
    console.error('Error creating program:', error);
    return { success: false, error: error.message };
  }
};

// READ - Get All Programs
export const getAllPrograms = async (filters = {}) => {
  try {
    const ref = collection(db, PROGRAMS_COLLECTION);
    let q = query(ref, orderBy('systemInfo.createdAt', 'desc'));
    
    if (filters.status) {
      q = query(ref, where('status', '==', filters.status), orderBy('systemInfo.createdAt', 'desc'));
    }
    
    if (filters.category) {
      q = query(ref, where('category', '==', filters.category), orderBy('systemInfo.createdAt', 'desc'));
    }
    
    const snapshot = await getDocs(q);
    const programs = [];
    
    snapshot.forEach((doc) => {
      programs.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, data: programs, count: programs.length };
  } catch (error) {
    console.error('Error getting programs:', error);
    return { success: false, error: error.message };
  }
};

// UPDATE - Update Program
export const updateProgram = async (programId, updates, userId) => {
  try {
    const ref = collection(db, PROGRAMS_COLLECTION);
    const q = query(ref, where('programId', '==', programId));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return { success: false, error: 'Program not found' };
    }
    
    const docRef = doc(db, PROGRAMS_COLLECTION, snapshot.docs[0].id);
    await updateDoc(docRef, {
      ...updates,
      'systemInfo.updatedAt': serverTimestamp(),
      'systemInfo.updatedBy': userId
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error updating program:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// BENEFICIARIES
// ============================================

// CREATE - Add Beneficiary to Program
export const addBeneficiary = async (beneficiaryData, userId) => {
  try {
    const ref = collection(db, BENEFICIARIES_COLLECTION);
    
    const newBeneficiary = {
      beneficiaryId: `BEN-${Date.now()}`,
      programId: beneficiaryData.programId,
      residentId: beneficiaryData.residentId,
      name: beneficiaryData.name,
      category: beneficiaryData.category,
      purok: beneficiaryData.purok,
      eligibilityStatus: 'Approved', // Pending, Approved, Denied
      enrollmentDate: serverTimestamp(),
      totalReceived: 0,
      distributionHistory: [],
      systemInfo: {
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: userId,
        updatedBy: userId
      }
    };
    
    const docRef = await addDoc(ref, newBeneficiary);
    
    // Update program beneficiary count
    const programRef = collection(db, PROGRAMS_COLLECTION);
    const programQuery = query(programRef, where('programId', '==', beneficiaryData.programId));
    const programSnapshot = await getDocs(programQuery);
    
    if (!programSnapshot.empty) {
      const programDoc = doc(db, PROGRAMS_COLLECTION, programSnapshot.docs[0].id);
      const currentData = programSnapshot.docs[0].data();
      await updateDoc(programDoc, {
        totalBeneficiaries: (currentData.totalBeneficiaries || 0) + 1,
        'systemInfo.updatedAt': serverTimestamp()
      });
    }
    
    return { success: true, id: docRef.id, beneficiaryId: newBeneficiary.beneficiaryId };
  } catch (error) {
    console.error('Error adding beneficiary:', error);
    return { success: false, error: error.message };
  }
};

// READ - Get Beneficiaries
export const getBeneficiaries = async (programId = null) => {
  try {
    const ref = collection(db, BENEFICIARIES_COLLECTION);
    let q = query(ref, orderBy('systemInfo.createdAt', 'desc'));
    
    if (programId) {
      q = query(ref, where('programId', '==', programId), orderBy('systemInfo.createdAt', 'desc'));
    }
    
    const snapshot = await getDocs(q);
    const beneficiaries = [];
    
    snapshot.forEach((doc) => {
      beneficiaries.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, data: beneficiaries, count: beneficiaries.length };
  } catch (error) {
    console.error('Error getting beneficiaries:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// DISTRIBUTIONS
// ============================================

// CREATE - Record Distribution
export const recordDistribution = async (distributionData, userId) => {
  try {
    const ref = collection(db, DISTRIBUTIONS_COLLECTION);
    
    const newDistribution = {
      distributionId: `DIST-${Date.now()}`,
      programId: distributionData.programId,
      beneficiaryId: distributionData.beneficiaryId,
      residentId: distributionData.residentId,
      residentName: distributionData.residentName,
      amount: distributionData.amount,
      aidType: distributionData.aidType,
      distributionDate: serverTimestamp(),
      distributedBy: userId,
      status: 'Completed', // Completed, Pending, Cancelled
      verificationMethod: distributionData.verificationMethod || 'Manual', // Manual, Biometric, OTP
      proofOfReceipt: distributionData.proofOfReceipt || '', // URL to signature/photo
      remarks: distributionData.remarks || '',
      systemInfo: {
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: userId,
        updatedBy: userId
      }
    };
    
    const docRef = await addDoc(ref, newDistribution);
    
    // Update beneficiary record
    const beneficiaryRef = collection(db, BENEFICIARIES_COLLECTION);
    const beneficiaryQuery = query(beneficiaryRef, where('beneficiaryId', '==', distributionData.beneficiaryId));
    const beneficiarySnapshot = await getDocs(beneficiaryQuery);
    
    if (!beneficiarySnapshot.empty) {
      const beneficiaryDoc = doc(db, BENEFICIARIES_COLLECTION, beneficiarySnapshot.docs[0].id);
      const currentData = beneficiarySnapshot.docs[0].data();
      
      const updatedHistory = [...(currentData.distributionHistory || []), {
        distributionId: newDistribution.distributionId,
        amount: distributionData.amount,
        date: newDistribution.distributionDate
      }];
      
      await updateDoc(beneficiaryDoc, {
        totalReceived: (currentData.totalReceived || 0) + distributionData.amount,
        distributionHistory: updatedHistory,
        'systemInfo.updatedAt': serverTimestamp()
      });
    }
    
    // Update program total distributed
    const programRef = collection(db, PROGRAMS_COLLECTION);
    const programQuery = query(programRef, where('programId', '==', distributionData.programId));
    const programSnapshot = await getDocs(programQuery);
    
    if (!programSnapshot.empty) {
      const programDoc = doc(db, PROGRAMS_COLLECTION, programSnapshot.docs[0].id);
      const currentData = programSnapshot.docs[0].data();
      await updateDoc(programDoc, {
        totalDistributed: (currentData.totalDistributed || 0) + distributionData.amount,
        'systemInfo.updatedAt': serverTimestamp()
      });
    }
    
    return { success: true, id: docRef.id, distributionId: newDistribution.distributionId };
  } catch (error) {
    console.error('Error recording distribution:', error);
    return { success: false, error: error.message };
  }
};

// READ - Get Distributions
export const getDistributions = async (filters = {}) => {
  try {
    const ref = collection(db, DISTRIBUTIONS_COLLECTION);
    let q = query(ref, orderBy('distributionDate', 'desc'));
    
    if (filters.programId) {
      q = query(ref, where('programId', '==', filters.programId), orderBy('distributionDate', 'desc'));
    }
    
    if (filters.beneficiaryId) {
      q = query(ref, where('beneficiaryId', '==', filters.beneficiaryId), orderBy('distributionDate', 'desc'));
    }
    
    const snapshot = await getDocs(q);
    const distributions = [];
    
    snapshot.forEach((doc) => {
      distributions.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, data: distributions, count: distributions.length };
  } catch (error) {
    console.error('Error getting distributions:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// STATISTICS
// ============================================

export const getWelfareStatistics = async () => {
  try {
    const programsRef = collection(db, PROGRAMS_COLLECTION);
    const programsSnapshot = await getDocs(query(programsRef));
    
    const beneficiariesRef = collection(db, BENEFICIARIES_COLLECTION);
    const beneficiariesSnapshot = await getDocs(query(beneficiariesRef));
    
    const distributionsRef = collection(db, DISTRIBUTIONS_COLLECTION);
    const distributionsSnapshot = await getDocs(query(distributionsRef));
    
    const stats = {
      totalPrograms: programsSnapshot.size,
      activePrograms: 0,
      totalBeneficiaries: beneficiariesSnapshot.size,
      totalDistributed: 0,
      byCategory: {},
      thisMonth: 0
    };
    
    // Count active programs and total distributed
    programsSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.status === 'Active') {
        stats.activePrograms++;
      }
      stats.totalDistributed += data.totalDistributed || 0;
      
      const category = data.category || 'Other';
      stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
    });
    
    // Count distributions this month
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);
    
    distributionsSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.distributionDate && data.distributionDate.toDate) {
        const distDate = data.distributionDate.toDate();
        if (distDate >= firstDayOfMonth) {
          stats.thisMonth += data.amount || 0;
        }
      }
    });
    
    return { success: true, data: stats };
  } catch (error) {
    console.error('Error getting welfare statistics:', error);
    return { success: false, error: error.message };
  }
};

export default {
  createProgram,
  getAllPrograms,
  updateProgram,
  addBeneficiary,
  getBeneficiaries,
  recordDistribution,
  getDistributions,
  getWelfareStatistics
};