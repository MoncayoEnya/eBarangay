// src/services/residentsService.js
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
  startAfter,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';

const COLLECTION_NAME = 'residents';

// Generate Resident Number
const generateResidentNumber = async () => {
  const year = new Date().getFullYear();
  const residentsRef = collection(db, COLLECTION_NAME);
  const q = query(residentsRef, orderBy('systemInfo.createdAt', 'desc'), limit(1));
  const querySnapshot = await getDocs(q);
  
  let lastNumber = 0;
  if (!querySnapshot.empty) {
    const lastResident = querySnapshot.docs[0].data();
    if (lastResident.residentNumber) {
      const lastResNumber = lastResident.residentNumber;
      lastNumber = parseInt(lastResNumber.split('-')[2]);
    }
  }
  
  const newNumber = (lastNumber + 1).toString().padStart(4, '0');
  return `RES-${year}-${newNumber}`;
};

/**
 * Firestore Schema for Residents:
 * {
 *   id: string (auto-generated)
 *   personalInfo: {
 *     firstName: string
 *     middleName: string
 *     lastName: string
 *     suffix: string (Jr., Sr., III, etc.)
 *     nickname: string
 *     birthDate: Timestamp
 *     age: number
 *     gender: string (Male/Female)
 *     civilStatus: string (Single/Married/Widowed/Separated)
 *     nationality: string
 *     religion: string
 *     bloodType: string
 *   }
 *   contactInfo: {
 *     email: string
 *     mobileNumber: string
 *     landlineNumber: string
 *   }
 *   address: {
 *     purok: string
 *     block: string
 *     lot: string
 *     street: string
 *     fullAddress: string
 *     coordinates: {
 *       latitude: number
 *       longitude: number
 *     }
 *   }
 *   household: {
 *     householdId: string (reference to households collection)
 *     relationToHead: string (Head/Spouse/Child/Parent/Sibling/Other)
 *     isHouseholdHead: boolean
 *   }
 *   statusFlags: {
 *     isVoter: boolean
 *     voterIdNumber: string
 *     isPWD: boolean
 *     pwdIdNumber: string
 *     isSeniorCitizen: boolean
 *     seniorCitizenIdNumber: string
 *     is4Ps: boolean
 *     isIndigent: boolean
 *     isOFW: boolean
 *   }
 *   employment: {
 *     status: string (Employed/Unemployed/Self-employed/Student/Retired)
 *     occupation: string
 *     employer: string
 *     monthlyIncome: number
 *   }
 *   emergencyContact: {
 *     name: string
 *     relationship: string
 *     contactNumber: string
 *   }
 *   documents: {
 *     profilePhoto: string (Firebase Storage URL)
 *     validIdType: string
 *     validIdNumber: string
 *     validIdPhoto: string (Firebase Storage URL)
 *   }
 *   systemInfo: {
 *     status: string (Active/Inactive/Deceased/Moved Out)
 *     createdAt: Timestamp
 *     updatedAt: Timestamp
 *     createdBy: string (userId)
 *     updatedBy: string (userId)
 *   }
 * }
 */

// ============================================
// CREATE - Add New Resident
// ============================================
export const addResident = async (residentData, currentUserId) => {
  try {
    const residentRef = collection(db, COLLECTION_NAME);
    
    // Generate resident number
    const residentNumber = await generateResidentNumber();
    
    // Prepare the data with proper structure
    const newResident = {
      residentNumber, // AUTO-GENERATED
      personalInfo: {
        firstName: residentData.firstName || '',
        middleName: residentData.middleName || '',
        lastName: residentData.lastName || '',
        suffix: residentData.suffix || '',
        nickname: residentData.nickname || '',
        birthDate: residentData.birthDate ? Timestamp.fromDate(new Date(residentData.birthDate)) : null,
        age: residentData.age || 0,
        gender: residentData.gender || '',
        civilStatus: residentData.civilStatus || '',
        nationality: residentData.nationality || 'Filipino',
        religion: residentData.religion || '',
        bloodType: residentData.bloodType || '',
      },
      contactInfo: {
        email: residentData.email || '',
        mobileNumber: residentData.mobileNumber || '',
        landlineNumber: residentData.landlineNumber || '',
      },
      address: {
        purok: residentData.purok || '',
        block: residentData.block || '',
        lot: residentData.lot || '',
        street: residentData.street || '',
        fullAddress: residentData.fullAddress || '',
        coordinates: {
          latitude: residentData.latitude || null,
          longitude: residentData.longitude || null,
        }
      },
      household: {
        householdId: residentData.householdId || null,
        relationToHead: residentData.relationToHead || '',
        isHouseholdHead: residentData.isHouseholdHead || false,
      },
      statusFlags: {
        isVoter: residentData.isVoter || false,
        voterIdNumber: residentData.voterIdNumber || '',
        isPWD: residentData.isPWD || false,
        pwdIdNumber: residentData.pwdIdNumber || '',
        isSeniorCitizen: residentData.isSeniorCitizen || false,
        seniorCitizenIdNumber: residentData.seniorCitizenIdNumber || '',
        is4Ps: residentData.is4Ps || false,
        isIndigent: residentData.isIndigent || false,
        isOFW: residentData.isOFW || false,
      },
      employment: {
        status: residentData.employmentStatus || 'Unemployed',
        occupation: residentData.occupation || '',
        employer: residentData.employer || '',
        monthlyIncome: residentData.monthlyIncome || 0,
      },
      emergencyContact: {
        name: residentData.emergencyContactName || '',
        relationship: residentData.emergencyContactRelationship || '',
        contactNumber: residentData.emergencyContactNumber || '',
      },
      documents: {
        profilePhoto: residentData.profilePhoto || '',
        validIdType: residentData.validIdType || '',
        validIdNumber: residentData.validIdNumber || '',
        validIdPhoto: residentData.validIdPhoto || '',
      },
      systemInfo: {
        status: 'Active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: currentUserId,
        updatedBy: currentUserId,
      }
    };

    const docRef = await addDoc(residentRef, newResident);
    
    return {
      success: true,
      id: docRef.id,
      residentNumber,
      message: 'Resident added successfully'
    };
  } catch (error) {
    console.error('Error adding resident:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// ============================================
// READ - Get Single Resident by ID
// ============================================
export const getResidentById = async (residentId) => {
  try {
    const residentRef = doc(db, COLLECTION_NAME, residentId);
    const residentDoc = await getDoc(residentRef);

    if (!residentDoc.exists()) {
      return {
        success: false,
        error: 'Resident not found'
      };
    }

    return {
      success: true,
      data: {
        id: residentDoc.id,
        ...residentDoc.data()
      }
    };
  } catch (error) {
    console.error('Error getting resident:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// ============================================
// READ - Get All Residents with Pagination
// ============================================
export const getAllResidents = async (pageSize = 10, lastDoc = null) => {
  try {
    const residentsRef = collection(db, COLLECTION_NAME);
    let q;

    if (lastDoc) {
      q = query(
        residentsRef,
        orderBy('personalInfo.lastName'),
        orderBy('personalInfo.firstName'),
        startAfter(lastDoc),
        limit(pageSize)
      );
    } else {
      q = query(
        residentsRef,
        orderBy('personalInfo.lastName'),
        orderBy('personalInfo.firstName'),
        limit(pageSize)
      );
    }

    const querySnapshot = await getDocs(q);
    const residents = [];
    let lastVisible = null;

    querySnapshot.forEach((doc) => {
      residents.push({
        id: doc.id,
        ...doc.data()
      });
      lastVisible = doc;
    });

    return {
      success: true,
      data: residents,
      lastDoc: lastVisible,
      hasMore: residents.length === pageSize
    };
  } catch (error) {
    console.error('Error getting residents:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// ============================================
// READ - Search Residents
// ============================================
export const searchResidents = async (searchTerm, filters = {}) => {
  try {
    const residentsRef = collection(db, COLLECTION_NAME);
    let q = query(residentsRef);

    // Apply filters
    if (filters.status) {
      q = query(q, where('systemInfo.status', '==', filters.status));
    }

    if (filters.isPWD) {
      q = query(q, where('statusFlags.isPWD', '==', true));
    }

    if (filters.isSeniorCitizen) {
      q = query(q, where('statusFlags.isSeniorCitizen', '==', true));
    }

    if (filters.isVoter) {
      q = query(q, where('statusFlags.isVoter', '==', true));
    }

    if (filters.purok) {
      q = query(q, where('address.purok', '==', filters.purok));
    }

    const querySnapshot = await getDocs(q);
    let residents = [];

    querySnapshot.forEach((doc) => {
      residents.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Client-side search filtering (Firestore has limited text search)
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      residents = residents.filter(resident => {
        const fullName = `${resident.personalInfo.firstName} ${resident.personalInfo.middleName} ${resident.personalInfo.lastName}`.toLowerCase();
        const address = resident.address.fullAddress.toLowerCase();
        const mobile = resident.contactInfo.mobileNumber.toLowerCase();
        
        return fullName.includes(searchLower) || 
               address.includes(searchLower) || 
               mobile.includes(searchLower);
      });
    }

    return {
      success: true,
      data: residents,
      count: residents.length
    };
  } catch (error) {
    console.error('Error searching residents:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// ============================================
// READ - Get Residents by Category
// ============================================
export const getResidentsByCategory = async (category) => {
  try {
    const residentsRef = collection(db, COLLECTION_NAME);
    let q;

    switch (category) {
      case 'senior':
        q = query(residentsRef, where('statusFlags.isSeniorCitizen', '==', true));
        break;
      case 'pwd':
        q = query(residentsRef, where('statusFlags.isPWD', '==', true));
        break;
      case 'voters':
        q = query(residentsRef, where('statusFlags.isVoter', '==', true));
        break;
      case '4ps':
        q = query(residentsRef, where('statusFlags.is4Ps', '==', true));
        break;
      case 'indigent':
        q = query(residentsRef, where('statusFlags.isIndigent', '==', true));
        break;
      default:
        q = query(residentsRef, where('systemInfo.status', '==', 'Active'));
    }

    const querySnapshot = await getDocs(q);
    const residents = [];

    querySnapshot.forEach((doc) => {
      residents.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return {
      success: true,
      data: residents,
      count: residents.length
    };
  } catch (error) {
    console.error('Error getting residents by category:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// ============================================
// UPDATE - Update Resident
// ============================================
export const updateResident = async (residentId, updates, currentUserId) => {
  try {
    const residentRef = doc(db, COLLECTION_NAME, residentId);

    // Update the updatedAt and updatedBy fields
    const updateData = {
      ...updates,
      'systemInfo.updatedAt': serverTimestamp(),
      'systemInfo.updatedBy': currentUserId
    };

    await updateDoc(residentRef, updateData);

    return {
      success: true,
      message: 'Resident updated successfully'
    };
  } catch (error) {
    console.error('Error updating resident:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// ============================================
// UPDATE - Change Resident Status
// ============================================
export const updateResidentStatus = async (residentId, status, currentUserId) => {
  try {
    const residentRef = doc(db, COLLECTION_NAME, residentId);

    await updateDoc(residentRef, {
      'systemInfo.status': status,
      'systemInfo.updatedAt': serverTimestamp(),
      'systemInfo.updatedBy': currentUserId
    });

    return {
      success: true,
      message: `Resident status changed to ${status}`
    };
  } catch (error) {
    console.error('Error updating resident status:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// ============================================
// DELETE - Delete Resident (Soft Delete)
// ============================================
export const deleteResident = async (residentId, currentUserId) => {
  try {
    // We use soft delete by changing status to 'Inactive'
    return await updateResidentStatus(residentId, 'Inactive', currentUserId);
  } catch (error) {
    console.error('Error deleting resident:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// ============================================
// DELETE - Permanently Delete Resident
// ============================================
export const permanentlyDeleteResident = async (residentId) => {
  try {
    const residentRef = doc(db, COLLECTION_NAME, residentId);
    await deleteDoc(residentRef);

    return {
      success: true,
      message: 'Resident permanently deleted'
    };
  } catch (error) {
    console.error('Error permanently deleting resident:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// ============================================
// STATISTICS - Get Resident Statistics
// ============================================
export const getResidentStatistics = async () => {
  try {
    const residentsRef = collection(db, COLLECTION_NAME);
    const q = query(residentsRef, where('systemInfo.status', '==', 'Active'));
    const querySnapshot = await getDocs(q);

    const stats = {
      total: 0,
      male: 0,
      female: 0,
      voters: 0,
      seniorCitizens: 0,
      pwd: 0,
      fourPs: 0,
      indigent: 0,
      byPurok: {},
      byCivilStatus: {},
      byEmploymentStatus: {}
    };

    querySnapshot.forEach((doc) => {
      const resident = doc.data();
      stats.total++;

      // Gender
      if (resident.personalInfo.gender === 'Male') stats.male++;
      if (resident.personalInfo.gender === 'Female') stats.female++;

      // Status flags
      if (resident.statusFlags.isVoter) stats.voters++;
      if (resident.statusFlags.isSeniorCitizen) stats.seniorCitizens++;
      if (resident.statusFlags.isPWD) stats.pwd++;
      if (resident.statusFlags.is4Ps) stats.fourPs++;
      if (resident.statusFlags.isIndigent) stats.indigent++;

      // By Purok
      const purok = resident.address.purok || 'Unassigned';
      stats.byPurok[purok] = (stats.byPurok[purok] || 0) + 1;

      // By Civil Status
      const civilStatus = resident.personalInfo.civilStatus || 'Unknown';
      stats.byCivilStatus[civilStatus] = (stats.byCivilStatus[civilStatus] || 0) + 1;

      // By Employment Status
      const employmentStatus = resident.employment.status || 'Unknown';
      stats.byEmploymentStatus[employmentStatus] = (stats.byEmploymentStatus[employmentStatus] || 0) + 1;
    });

    return {
      success: true,
      data: stats
    };
  } catch (error) {
    console.error('Error getting resident statistics:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export default {
  addResident,
  getResidentById,
  getAllResidents,
  searchResidents,
  getResidentsByCategory,
  updateResident,
  updateResidentStatus,
  deleteResident,
  permanentlyDeleteResident,
  getResidentStatistics
};