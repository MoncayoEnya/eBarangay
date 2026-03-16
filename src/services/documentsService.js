// src/services/documentsService.js
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
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';

const COLLECTION_NAME = 'documents';

/**
 * Firestore Schema for Documents:
 * {
 *   id: string (auto-generated)
 *   requestId: string (e.g., "DC-2024-001")
 *   documentType: string (Barangay Clearance, Certificate of Residency, etc.)
 *   
 *   requester: {
 *     residentId: string (reference to residents collection)
 *     name: string
 *     address: string
 *     contactNumber: string
 *     email: string
 *   }
 *   
 *   purpose: string
 *   additionalDetails: string
 *   
 *   status: string (Pending, Processing, Approved, Denied, Released)
 *   
 *   payment: {
 *     amount: number
 *     method: string (Cash, GCash, PayMaya, Online Banking)
 *     referenceNumber: string
 *     isPaid: boolean
 *     paidAt: Timestamp
 *   }
 *   
 *   processing: {
 *     assignedTo: string (userId)
 *     processedBy: string (userId)
 *     approvedBy: string (userId)
 *     notes: string
 *     denialReason: string
 *   }
 *   
 *   document: {
 *     generatedPdfUrl: string (Firebase Storage URL)
 *     qrCode: string
 *     controlNumber: string
 *     validUntil: Timestamp
 *   }
 *   
 *   timeline: [{
 *     status: string
 *     timestamp: Timestamp
 *     userId: string
 *     notes: string
 *   }]
 *   
 *   systemInfo: {
 *     requestDate: Timestamp
 *     processedDate: Timestamp
 *     approvedDate: Timestamp
 *     releasedDate: Timestamp
 *     createdAt: Timestamp
 *     updatedAt: Timestamp
 *     createdBy: string
 *     updatedBy: string
 *   }
 * }
 */

// Document Types Configuration
export const DOCUMENT_TYPES = {
  BARANGAY_CLEARANCE: {
    id: 'barangay_clearance',
    name: 'Barangay Clearance',
    description: 'Certificate of good moral character and residency',
    fee: 50,
    processingTime: '1-2 days',
    requirements: ['Valid ID', 'Proof of Residency']
  },
  CERTIFICATE_OF_RESIDENCY: {
    id: 'certificate_of_residency',
    name: 'Certificate of Residency',
    description: 'Proof of residence in the barangay',
    fee: 30,
    processingTime: '1 day',
    requirements: ['Valid ID']
  },
  CERTIFICATE_OF_INDIGENCY: {
    id: 'certificate_of_indigency',
    name: 'Certificate of Indigency',
    description: 'For financially disadvantaged residents',
    fee: 0,
    processingTime: '2-3 days',
    requirements: ['Valid ID', 'Proof of Income', 'Endorsement']
  },
  BUSINESS_CLEARANCE: {
    id: 'business_clearance',
    name: 'Business Clearance',
    description: 'Required for business permit application',
    fee: 100,
    processingTime: '2-3 days',
    requirements: ['Valid ID', 'Business Documents', 'Lease Contract']
  },
  GOOD_MORAL_CHARACTER: {
    id: 'good_moral_character',
    name: 'Certificate of Good Moral Character',
    description: 'Character reference certificate',
    fee: 50,
    processingTime: '1-2 days',
    requirements: ['Valid ID', 'Blotter Check']
  },
  CEDULA: {
    id: 'cedula',
    name: 'Community Tax Certificate (Cedula)',
    description: 'Annual community tax certificate',
    fee: 50,
    processingTime: '1 day',
    requirements: ['Valid ID', 'Proof of Income']
  },
  BUILDING_CLEARANCE: {
    id: 'building_clearance',
    name: 'Barangay Building Clearance',
    description: 'Required for building permit',
    fee: 150,
    processingTime: '3-5 days',
    requirements: ['Valid ID', 'Building Plans', 'Lot Title']
  },
  FIRST_TIME_JOB_SEEKER: {
    id: 'first_time_job_seeker',
    name: 'First Time Job Seeker Certificate',
    description: 'For first-time job applicants',
    fee: 0,
    processingTime: '1 day',
    requirements: ['Valid ID', 'Birth Certificate', 'School Diploma']
  }
};

// Generate Request ID
const generateRequestId = async () => {
  const year = new Date().getFullYear();
  const docsRef = collection(db, COLLECTION_NAME);
  const q = query(docsRef, orderBy('systemInfo.createdAt', 'desc'), limit(1));
  const querySnapshot = await getDocs(q);
  
  let lastNumber = 0;
  if (!querySnapshot.empty) {
    const lastDoc = querySnapshot.docs[0].data();
    const lastRequestId = lastDoc.requestId || 'DC-2024-000';
    lastNumber = parseInt(lastRequestId.split('-')[2]);
  }
  
  const newNumber = (lastNumber + 1).toString().padStart(3, '0');
  return `DC-${year}-${newNumber}`;
};

// ============================================
// CREATE - Submit Document Request
// ============================================
export const createDocumentRequest = async (requestData, currentUserId) => {
  try {
    const docsRef = collection(db, COLLECTION_NAME);
    const requestId = await generateRequestId();
    
    const documentType = DOCUMENT_TYPES[requestData.documentTypeId];
    
    const newRequest = {
      requestId,
      documentType: documentType.name,
      documentTypeId: requestData.documentTypeId,
      
      requester: {
        residentId: requestData.residentId || null,
        name: requestData.requesterName,
        address: requestData.requesterAddress,
        contactNumber: requestData.contactNumber,
        email: requestData.email || '',
      },
      
      purpose: requestData.purpose || '',
      additionalDetails: requestData.additionalDetails || '',
      
      status: 'Pending',
      
      payment: {
        amount: documentType.fee,
        method: requestData.paymentMethod || 'Cash',
        referenceNumber: requestData.paymentReferenceNumber || '',
        isPaid: requestData.paymentMethod === 'Cash' ? false : true,
        paidAt: requestData.paymentMethod !== 'Cash' ? serverTimestamp() : null,
      },
      
      processing: {
        assignedTo: null,
        processedBy: null,
        approvedBy: null,
        notes: '',
        denialReason: '',
      },
      
      document: {
        generatedPdfUrl: '',
        qrCode: '',
        controlNumber: '',
        validUntil: null,
      },
      
      timeline: [{
        status: 'Pending',
        timestamp: Timestamp.now(),
        userId: currentUserId,
        notes: 'Request submitted'
      }],
      
      systemInfo: {
        requestDate: serverTimestamp(),
        processedDate: null,
        approvedDate: null,
        releasedDate: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: currentUserId,
        updatedBy: currentUserId,
      }
    };

    const docRef = await addDoc(docsRef, newRequest);
    
    return {
      success: true,
      id: docRef.id,
      requestId,
      message: 'Document request submitted successfully'
    };
  } catch (error) {
    console.error('Error creating document request:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// ============================================
// READ - Get Document by ID
// ============================================
export const getDocumentById = async (documentId) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, documentId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return {
        success: false,
        error: 'Document not found'
      };
    }

    return {
      success: true,
      data: {
        id: docSnap.id,
        ...docSnap.data()
      }
    };
  } catch (error) {
    console.error('Error getting document:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// ============================================
// READ - Get All Document Requests
// ============================================
export const getAllDocuments = async (filters = {}) => {
  try {
    const docsRef = collection(db, COLLECTION_NAME);
    const pageLimit = filters.limit || 50;
    let q = query(docsRef, orderBy('systemInfo.createdAt', 'desc'), limit(pageLimit));

    // Apply filters
    if (filters.status) {
      q = query(docsRef, where('status', '==', filters.status), orderBy('systemInfo.createdAt', 'desc'), limit(pageLimit));
    }

    if (filters.documentType) {
      q = query(docsRef, where('documentTypeId', '==', filters.documentType), orderBy('systemInfo.createdAt', 'desc'), limit(pageLimit));
    }

    const querySnapshot = await getDocs(q);
    const documents = [];

    querySnapshot.forEach((doc) => {
      documents.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return {
      success: true,
      data: documents,
      count: documents.length
    };
  } catch (error) {
    console.error('Error getting documents:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// ============================================
// READ - Search Documents
// ============================================
export const searchDocuments = async (searchTerm) => {
  try {
    const docsRef = collection(db, COLLECTION_NAME);
    const q = query(docsRef, orderBy('systemInfo.createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    let documents = [];
    querySnapshot.forEach((doc) => {
      documents.push({
        id: doc.id,
        ...doc.data()
      });
    });

    // Client-side search
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      documents = documents.filter(doc => {
        return (
          doc.requestId.toLowerCase().includes(searchLower) ||
          doc.requester.name.toLowerCase().includes(searchLower) ||
          doc.documentType.toLowerCase().includes(searchLower)
        );
      });
    }

    return {
      success: true,
      data: documents,
      count: documents.length
    };
  } catch (error) {
    console.error('Error searching documents:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// ============================================
// UPDATE - Update Document Status
// ============================================
export const updateDocumentStatus = async (documentId, newStatus, userId, notes = '') => {
  try {
    const docRef = doc(db, COLLECTION_NAME, documentId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return { success: false, error: 'Document not found' };
    }

    const currentData = docSnap.data();
    const timeline = currentData.timeline || [];
    
    // Add to timeline
    timeline.push({
      status: newStatus,
      timestamp: Timestamp.now(),
      userId,
      notes
    });

    const updates = {
      status: newStatus,
      timeline,
      'systemInfo.updatedAt': serverTimestamp(),
      'systemInfo.updatedBy': userId
    };

    // Update processing info based on status
    if (newStatus === 'Processing') {
      updates['processing.processedBy'] = userId;
      updates['systemInfo.processedDate'] = serverTimestamp();
    } else if (newStatus === 'Approved') {
      updates['processing.approvedBy'] = userId;
      updates['systemInfo.approvedDate'] = serverTimestamp();
    } else if (newStatus === 'Released') {
      updates['systemInfo.releasedDate'] = serverTimestamp();
    }

    await updateDoc(docRef, updates);

    return {
      success: true,
      message: `Document status updated to ${newStatus}`
    };
  } catch (error) {
    console.error('Error updating document status:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// ============================================
// UPDATE - Approve Document
// ============================================
export const approveDocument = async (documentId, userId, controlNumber, validityMonths = 12) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, documentId);
    
    // Calculate validity date
    const validUntil = new Date();
    validUntil.setMonth(validUntil.getMonth() + validityMonths);

    const updates = {
      status: 'Approved',
      'document.controlNumber': controlNumber,
      'document.validUntil': Timestamp.fromDate(validUntil),
      'processing.approvedBy': userId,
      'systemInfo.approvedDate': serverTimestamp(),
      'systemInfo.updatedAt': serverTimestamp(),
      'systemInfo.updatedBy': userId
    };

    await updateDoc(docRef, updates);
    
    // Add to timeline
    await updateDocumentStatus(documentId, 'Approved', userId, 'Document approved');

    return {
      success: true,
      message: 'Document approved successfully'
    };
  } catch (error) {
    console.error('Error approving document:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// ============================================
// UPDATE - Deny Document
// ============================================
export const denyDocument = async (documentId, userId, reason) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, documentId);

    const updates = {
      status: 'Denied',
      'processing.denialReason': reason,
      'systemInfo.updatedAt': serverTimestamp(),
      'systemInfo.updatedBy': userId
    };

    await updateDoc(docRef, updates);
    
    // Add to timeline
    await updateDocumentStatus(documentId, 'Denied', userId, `Denied: ${reason}`);

    return {
      success: true,
      message: 'Document request denied'
    };
  } catch (error) {
    console.error('Error denying document:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// ============================================
// UPDATE - Confirm Payment
// ============================================
export const confirmPayment = async (documentId, userId, paymentData) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, documentId);

    const updates = {
      'payment.isPaid': true,
      'payment.method': paymentData.method,
      'payment.referenceNumber': paymentData.referenceNumber || '',
      'payment.paidAt': serverTimestamp(),
      'systemInfo.updatedAt': serverTimestamp(),
      'systemInfo.updatedBy': userId
    };

    await updateDoc(docRef, updates);

    return {
      success: true,
      message: 'Payment confirmed'
    };
  } catch (error) {
    console.error('Error confirming payment:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// ============================================
// UPDATE - Release Document
// ============================================
export const releaseDocument = async (documentId, userId, pdfUrl) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, documentId);

    const updates = {
      status: 'Released',
      'document.generatedPdfUrl': pdfUrl,
      'systemInfo.releasedDate': serverTimestamp(),
      'systemInfo.updatedAt': serverTimestamp(),
      'systemInfo.updatedBy': userId
    };

    await updateDoc(docRef, updates);
    
    // Add to timeline
    await updateDocumentStatus(documentId, 'Released', userId, 'Document released to requester');

    return {
      success: true,
      message: 'Document released successfully'
    };
  } catch (error) {
    console.error('Error releasing document:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// ============================================
// DELETE - Delete Document Request
// ============================================
export const deleteDocument = async (documentId) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, documentId);
    await deleteDoc(docRef);

    return {
      success: true,
      message: 'Document request deleted'
    };
  } catch (error) {
    console.error('Error deleting document:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// ============================================
// STATISTICS - Get Document Statistics
// ============================================
export const getDocumentStatistics = async () => {
  try {
    const docsRef = collection(db, COLLECTION_NAME);
    const q = query(docsRef);
    const querySnapshot = await getDocs(q);

    const stats = {
      total: 0,
      pending: 0,
      processing: 0,
      approved: 0,
      denied: 0,
      released: 0,
      byType: {},
      totalRevenue: 0,
      avgProcessingTime: 0
    };

    let totalProcessingDays = 0;
    let processedCount = 0;

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      stats.total++;

      // Count by status
      const status = (data.status || 'pending').toLowerCase();
      if (stats[status] !== undefined) {
        stats[status]++;
      }

      // Count by type
      if (data.documentTypeId) {
        stats.byType[data.documentTypeId] = (stats.byType[data.documentTypeId] || 0) + 1;
      }

      // Revenue
      if (data.payment && data.payment.isPaid) {
        stats.totalRevenue += data.payment.amount || 0;
      }

      // Processing time
      if (data.systemInfo && data.systemInfo.approvedDate && data.systemInfo.requestDate) {
        const requestDate = data.systemInfo.requestDate.toDate();
        const approvedDate = data.systemInfo.approvedDate.toDate();
        const diffTime = Math.abs(approvedDate - requestDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        totalProcessingDays += diffDays;
        processedCount++;
      }
    });

    if (processedCount > 0) {
      stats.avgProcessingTime = (totalProcessingDays / processedCount).toFixed(1);
    }

    return {
      success: true,
      data: stats
    };
  } catch (error) {
    console.error('Error getting document statistics:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export default {
  DOCUMENT_TYPES,
  createDocumentRequest,
  getDocumentById,
  getAllDocuments,
  searchDocuments,
  updateDocumentStatus,
  approveDocument,
  denyDocument,
  confirmPayment,
  releaseDocument,
  deleteDocument,
  getDocumentStatistics
};