import {
  collection,
  getDocs,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { FeePayment } from '../types';

const COLLECTION = 'feePayments';

export const firebaseFinanceService = {
  /**
   * Get all fee payments
   */
  getFeePayments: async (): Promise<FeePayment[]> => {
    try {
      const snapshot = await getDocs(collection(db, COLLECTION));
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as FeePayment[];
    } catch (error) {
      console.error('Error fetching fee payments:', error);
      throw error;
    }
  },

  /**
   * Get payments by student
   */
  getPaymentsByStudent: async (studentId: string): Promise<FeePayment[]> => {
    try {
      const q = query(
        collection(db, COLLECTION),
        where('studentId', '==', studentId)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as FeePayment[];
    } catch (error) {
      console.error('Error fetching student payments:', error);
      throw error;
    }
  },

  /**
   * Get pending payments
   */
  getPendingPayments: async (): Promise<FeePayment[]> => {
    try {
      const q = query(
        collection(db, COLLECTION),
        where('status', 'in', ['pending', 'overdue', 'partial'])
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as FeePayment[];
    } catch (error) {
      console.error('Error fetching pending payments:', error);
      throw error;
    }
  },

  /**
   * Add new fee payment
   */
  addFeePayment: async (
    paymentData: Omit<FeePayment, 'id'>
  ): Promise<string> => {
    try {
      const docRef = await addDoc(collection(db, COLLECTION), {
        ...paymentData,
        createdAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding fee payment:', error);
      throw error;
    }
  },

  /**
   * Update fee payment
   */
  updateFeePayment: async (
    id: string,
    updates: Partial<FeePayment>
  ): Promise<void> => {
    try {
      const docRef = doc(db, COLLECTION, id);
      await updateDoc(docRef, updates);
    } catch (error) {
      console.error('Error updating fee payment:', error);
      throw error;
    }
  },

  /**
   * Delete fee payment
   */
  deleteFeePayment: async (id: string): Promise<void> => {
    try {
      const docRef = doc(db, COLLECTION, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting fee payment:', error);
      throw error;
    }
  },

  /**
   * Get total collected fees
   */
  getTotalCollected: async (): Promise<number> => {
    try {
      const q = query(collection(db, COLLECTION));
      const snapshot = await getDocs(q);
      const payments = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as FeePayment[];

      return payments
        .filter((p: FeePayment) => p.status === 'paid' || p.status === 'partial')
        .reduce((sum: number, p: FeePayment) => sum + p.amount, 0);
    } catch (error) {
      console.error('Error calculating total collected:', error);
      throw error;
    }
  },

  /**
   * Get total pending fees
   */
  getTotalPending: async (): Promise<number> => {
    try {
      const q = query(
        collection(db, COLLECTION),
        where('status', 'in', ['pending', 'overdue', 'partial'])
      );
      const snapshot = await getDocs(q);
      const payments = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as FeePayment[];

      return payments.reduce((sum: number, p: FeePayment) => sum + p.amount, 0);
    } catch (error) {
      console.error('Error calculating total pending:', error);
      throw error;
    }
  },
};
