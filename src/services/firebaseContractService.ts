import {
  collection,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { EmploymentContract, TeacherDocument, DocumentCategory } from '../types';

const EMPLOYMENT_CONTRACTS = 'employmentContracts';
const TEACHER_DOCUMENTS = 'teacherDocuments';

export const firebaseContractService = {
  // Employment Contracts
  /**
   * Get all employment contracts
   */
  getContracts: async (): Promise<EmploymentContract[]> => {
    try {
      const snapshot = await getDocs(
        query(collection(db, EMPLOYMENT_CONTRACTS), orderBy('startDate', 'desc'))
      );
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as EmploymentContract[];
    } catch (error) {
      console.error('Error fetching contracts:', error);
      throw error;
    }
  },

  /**
   * Get contract by teacher
   */
  getContractByTeacher: async (
    teacherId: string
  ): Promise<EmploymentContract | null> => {
    try {
      const q = query(
        collection(db, EMPLOYMENT_CONTRACTS),
        where('teacherId', '==', teacherId),
        orderBy('startDate', 'desc')
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return null;
      }

      // Return the most recent contract
      return {
        id: snapshot.docs[0].id,
        ...snapshot.docs[0].data(),
      } as EmploymentContract;
    } catch (error) {
      console.error('Error fetching teacher contract:', error);
      throw error;
    }
  },

  /**
   * Get active contracts
   */
  getActiveContracts: async (): Promise<EmploymentContract[]> => {
    try {
      const q = query(
        collection(db, EMPLOYMENT_CONTRACTS),
        where('status', '==', 'active')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as EmploymentContract[];
    } catch (error) {
      console.error('Error fetching active contracts:', error);
      throw error;
    }
  },

  /**
   * Get contracts expiring soon
   */
  getExpiringContracts: async (days: number = 90): Promise<EmploymentContract[]> => {
    try {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);
      const futureDateStr = futureDate.toISOString().split('T')[0];

      const contracts = await firebaseContractService.getActiveContracts();

      return contracts.filter(
        (contract) =>
          contract.endDate &&
          contract.endDate <= futureDateStr &&
          contract.endDate >= new Date().toISOString().split('T')[0]
      );
    } catch (error) {
      console.error('Error fetching expiring contracts:', error);
      throw error;
    }
  },

  /**
   * Add new contract
   */
  addContract: async (
    contractData: Omit<EmploymentContract, 'id'>
  ): Promise<string> => {
    try {
      const docRef = await addDoc(collection(db, EMPLOYMENT_CONTRACTS), {
        ...contractData,
        createdAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding contract:', error);
      throw error;
    }
  },

  /**
   * Update contract
   */
  updateContract: async (
    id: string,
    updates: Partial<EmploymentContract>
  ): Promise<void> => {
    try {
      await updateDoc(doc(db, EMPLOYMENT_CONTRACTS, id), {
        ...updates,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating contract:', error);
      throw error;
    }
  },

  /**
   * Renew contract
   */
  renewContract: async (
    contractId: string,
    newEndDate: string,
    salaryChange?: number,
    termsChanged: boolean = false,
    remarks: string = ''
  ): Promise<void> => {
    try {
      const contractRef = doc(db, EMPLOYMENT_CONTRACTS, contractId);
      const contractDoc = await getDoc(contractRef);

      if (!contractDoc.exists()) {
        throw new Error('Contract not found');
      }

      const contract = contractDoc.data() as EmploymentContract;

      const renewal = {
        renewalDate: new Date().toISOString(),
        previousEndDate: contract.endDate || '',
        newEndDate,
        salaryChange,
        termsChanged,
        remarks,
      };

      const renewalHistory = contract.renewalHistory || [];
      renewalHistory.push(renewal);

      await updateDoc(contractRef, {
        endDate: newEndDate,
        renewalDate: new Date().toISOString(),
        renewalHistory,
        salary: salaryChange ? contract.salary + salaryChange : contract.salary,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error renewing contract:', error);
      throw error;
    }
  },

  /**
   * Terminate contract
   */
  terminateContract: async (
    contractId: string,
    terminationDate: string,
    reason: string
  ): Promise<void> => {
    try {
      await updateDoc(doc(db, EMPLOYMENT_CONTRACTS, contractId), {
        status: 'terminated',
        terminationDate,
        terminationReason: reason,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error terminating contract:', error);
      throw error;
    }
  },

  /**
   * Delete contract
   */
  deleteContract: async (id: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, EMPLOYMENT_CONTRACTS, id));
    } catch (error) {
      console.error('Error deleting contract:', error);
      throw error;
    }
  },

  // Teacher Documents
  /**
   * Get all documents
   */
  getDocuments: async (): Promise<TeacherDocument[]> => {
    try {
      const snapshot = await getDocs(
        query(collection(db, TEACHER_DOCUMENTS), orderBy('uploadedDate', 'desc'))
      );
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as TeacherDocument[];
    } catch (error) {
      console.error('Error fetching documents:', error);
      throw error;
    }
  },

  /**
   * Get documents by teacher
   */
  getDocumentsByTeacher: async (teacherId: string): Promise<TeacherDocument[]> => {
    try {
      const q = query(
        collection(db, TEACHER_DOCUMENTS),
        where('teacherId', '==', teacherId),
        orderBy('uploadedDate', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as TeacherDocument[];
    } catch (error) {
      console.error('Error fetching teacher documents:', error);
      throw error;
    }
  },

  /**
   * Get pending verification documents
   */
  getPendingVerificationDocuments: async (): Promise<TeacherDocument[]> => {
    try {
      const q = query(
        collection(db, TEACHER_DOCUMENTS),
        where('status', '==', 'pending'),
        orderBy('uploadedDate', 'asc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as TeacherDocument[];
    } catch (error) {
      console.error('Error fetching pending documents:', error);
      throw error;
    }
  },

  /**
   * Get expiring documents
   */
  getExpiringDocuments: async (days: number = 90): Promise<TeacherDocument[]> => {
    try {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + days);
      const futureDateStr = futureDate.toISOString().split('T')[0];

      const documents = await firebaseContractService.getDocuments();

      return documents.filter(
        (doc) =>
          doc.expiryDate &&
          doc.expiryDate <= futureDateStr &&
          doc.expiryDate >= new Date().toISOString().split('T')[0] &&
          doc.status === 'verified'
      );
    } catch (error) {
      console.error('Error fetching expiring documents:', error);
      throw error;
    }
  },

  /**
   * Upload document
   */
  uploadDocument: async (
    documentData: Omit<TeacherDocument, 'id'>
  ): Promise<string> => {
    try {
      const docRef = await addDoc(collection(db, TEACHER_DOCUMENTS), {
        ...documentData,
        createdAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  },

  /**
   * Update document
   */
  updateDocument: async (
    id: string,
    updates: Partial<TeacherDocument>
  ): Promise<void> => {
    try {
      await updateDoc(doc(db, TEACHER_DOCUMENTS, id), {
        ...updates,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating document:', error);
      throw error;
    }
  },

  /**
   * Verify document
   */
  verifyDocument: async (
    documentId: string,
    verifiedBy: string,
    remarks?: string
  ): Promise<void> => {
    try {
      await updateDoc(doc(db, TEACHER_DOCUMENTS, documentId), {
        status: 'verified',
        verifiedBy,
        verifiedDate: new Date().toISOString(),
        remarks,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error verifying document:', error);
      throw error;
    }
  },

  /**
   * Reject document
   */
  rejectDocument: async (
    documentId: string,
    verifiedBy: string,
    remarks: string
  ): Promise<void> => {
    try {
      await updateDoc(doc(db, TEACHER_DOCUMENTS, documentId), {
        status: 'rejected',
        verifiedBy,
        verifiedDate: new Date().toISOString(),
        remarks,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error rejecting document:', error);
      throw error;
    }
  },

  /**
   * Delete document
   */
  deleteDocument: async (id: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, TEACHER_DOCUMENTS, id));
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  },

  /**
   * Get document categories with requirements
   */
  getDocumentCategories: (): DocumentCategory[] => {
    return [
      {
        category: 'resume',
        displayName: 'Resume/CV',
        required: true,
        requiresVerification: false,
        expiryTracking: false,
      },
      {
        category: 'certificate',
        displayName: 'Educational Certificates',
        required: true,
        requiresVerification: true,
        expiryTracking: false,
      },
      {
        category: 'id-proof',
        displayName: 'Government ID Proof',
        required: true,
        requiresVerification: true,
        expiryTracking: true,
      },
      {
        category: 'address-proof',
        displayName: 'Address Proof',
        required: true,
        requiresVerification: true,
        expiryTracking: false,
      },
      {
        category: 'photo',
        displayName: 'Passport Photo',
        required: true,
        requiresVerification: false,
        expiryTracking: false,
      },
      {
        category: 'bank-document',
        displayName: 'Bank Account Details',
        required: true,
        requiresVerification: true,
        expiryTracking: false,
      },
      {
        category: 'medical',
        displayName: 'Medical Certificate',
        required: false,
        requiresVerification: true,
        expiryTracking: true,
      },
      {
        category: 'background-verification',
        displayName: 'Background Verification',
        required: true,
        requiresVerification: true,
        expiryTracking: false,
      },
      {
        category: 'training',
        displayName: 'Training Certificates',
        required: false,
        requiresVerification: false,
        expiryTracking: true,
      },
      {
        category: 'other',
        displayName: 'Other Documents',
        required: false,
        requiresVerification: false,
        expiryTracking: false,
      },
    ];
  },

  /**
   * Check document compliance for a teacher
   */
  checkDocumentCompliance: async (
    teacherId: string
  ): Promise<{
    compliant: boolean;
    missingRequired: string[];
    pendingVerification: string[];
    expiringSoon: string[];
  }> => {
    try {
      const documents = await firebaseContractService.getDocumentsByTeacher(teacherId);
      const categories = firebaseContractService.getDocumentCategories();

      const uploadedTypes = new Set(documents.map((d) => d.documentType));
      const missingRequired = categories
        .filter((c) => c.required && !uploadedTypes.has(c.category))
        .map((c) => c.displayName);

      const pendingVerification = documents
        .filter((d) => d.status === 'pending')
        .map((d) => d.documentName);

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      const futureDateStr = futureDate.toISOString().split('T')[0];

      const expiringSoon = documents
        .filter(
          (d) =>
            d.expiryDate &&
            d.expiryDate <= futureDateStr &&
            d.expiryDate >= new Date().toISOString().split('T')[0]
        )
        .map((d) => d.documentName);

      const compliant =
        missingRequired.length === 0 &&
        pendingVerification.length === 0 &&
        expiringSoon.length === 0;

      return {
        compliant,
        missingRequired,
        pendingVerification,
        expiringSoon,
      };
    } catch (error) {
      console.error('Error checking document compliance:', error);
      throw error;
    }
  },
};
