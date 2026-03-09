// src/hooks/useDocuments.js
import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import {
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
} from '../services/documentsService';

export const useDocuments = () => {
  const { currentUser } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  // Load all documents
  const loadDocuments = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);

    try {
      const result = await getAllDocuments(filters);

      if (result.success) {
        setDocuments(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Search documents
  const search = useCallback(async (searchTerm) => {
    setLoading(true);
    setError(null);

    try {
      const result = await searchDocuments(searchTerm);

      if (result.success) {
        setDocuments(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get single document
  const getDocument = useCallback(async (documentId) => {
    setLoading(true);
    setError(null);

    try {
      const result = await getDocumentById(documentId);

      if (result.success) {
        return result.data;
      } else {
        setError(result.error);
        return null;
      }
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new document request
  const create = useCallback(async (requestData) => {
    setLoading(true);
    setError(null);

    try {
      const result = await createDocumentRequest(requestData, currentUser.uid);

      if (result.success) {
        await loadDocuments();
        return { success: true, requestId: result.requestId };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [currentUser, loadDocuments]);

  // Update status
  const updateStatus = useCallback(async (documentId, newStatus, notes = '') => {
    setLoading(true);
    setError(null);

    try {
      const result = await updateDocumentStatus(documentId, newStatus, currentUser.uid, notes);

      if (result.success) {
        setDocuments(prev =>
          prev.map(d => d.id === documentId ? { ...d, status: newStatus } : d)
        );
        return { success: true };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // Approve document
  const approve = useCallback(async (documentId, controlNumber, validityMonths = 12) => {
    setLoading(true);
    setError(null);

    try {
      const result = await approveDocument(documentId, currentUser.uid, controlNumber, validityMonths);

      if (result.success) {
        await loadDocuments();
        return { success: true };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [currentUser, loadDocuments]);

  // Deny document
  const deny = useCallback(async (documentId, reason) => {
    setLoading(true);
    setError(null);

    try {
      const result = await denyDocument(documentId, currentUser.uid, reason);

      if (result.success) {
        await loadDocuments();
        return { success: true };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [currentUser, loadDocuments]);

  // Confirm payment
  const confirmPaymentAction = useCallback(async (documentId, paymentData) => {
    setLoading(true);
    setError(null);

    try {
      const result = await confirmPayment(documentId, currentUser.uid, paymentData);

      if (result.success) {
        await loadDocuments();
        return { success: true };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [currentUser, loadDocuments]);

  // Release document
  const release = useCallback(async (documentId, pdfUrl) => {
    setLoading(true);
    setError(null);

    try {
      const result = await releaseDocument(documentId, currentUser.uid, pdfUrl);

      if (result.success) {
        await loadDocuments();
        return { success: true };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, [currentUser, loadDocuments]);

  // Delete document
  const remove = useCallback(async (documentId) => {
    setLoading(true);
    setError(null);

    try {
      const result = await deleteDocument(documentId);

      if (result.success) {
        setDocuments(prev => prev.filter(d => d.id !== documentId));
        return { success: true };
      } else {
        setError(result.error);
        return { success: false, error: result.error };
      }
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Load statistics
  const loadStatistics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getDocumentStatistics();

      if (result.success) {
        setStats(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    documents,
    loading,
    error,
    stats,
    loadDocuments,
    search,
    getDocument,
    create,
    updateStatus,
    approve,
    deny,
    confirmPayment: confirmPaymentAction,
    release,
    remove,
    loadStatistics,
    clearError: () => setError(null),
  };
};

export default useDocuments;