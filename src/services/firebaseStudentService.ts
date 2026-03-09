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
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Student } from '../types';

const COLLECTION = 'students';

export const firebaseStudentService = {
  /**
   * Get all students with optional filtering
   */
  getStudents: async (filters?: {
    status?: string;
    class?: string;
  }): Promise<Student[]> => {
    try {
      let q = collection(db, COLLECTION);
      let constraints = [];

      if (filters?.status && filters.status !== 'active') {
        constraints.push(where('status', '==', filters.status.toLowerCase()));
      }

      if (filters?.class) {
        constraints.push(where('class', '==', filters.class));
      }

      const queryRef = constraints.length > 0 ? query(q, ...constraints) : q;
      const snapshot = await getDocs(queryRef);

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Student[];
    } catch (error) {
      console.error('Error fetching students:', error);
      throw error;
    }
  },

  /**
   * Get a single student by ID
   */
  getStudentById: async (id: string): Promise<Student | null> => {
    try {
      const docRef = doc(db, COLLECTION, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as Student;
    } catch (error) {
      console.error('Error fetching student:', error);
      throw error;
    }
  },

  /**
   * Add a new student
   */
  addStudent: async (studentData: Omit<Student, 'id'>): Promise<string> => {
    try {
      const docRef = await addDoc(collection(db, COLLECTION), {
        ...studentData,
        createdAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding student:', error);
      throw error;
    }
  },

  /**
   * Update an existing student
   */
  updateStudent: async (id: string, updates: Partial<Student>): Promise<void> => {
    try {
      const docRef = doc(db, COLLECTION, id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating student:', error);
      throw error;
    }
  },

  /**
   * Delete a student
   */
  deleteStudent: async (id: string): Promise<void> => {
    try {
      const docRef = doc(db, COLLECTION, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting student:', error);
      throw error;
    }
  },

  /**
   * Get student count
   */
  getStudentCount: async (): Promise<number> => {
    try {
      const snapshot = await getDocs(collection(db, COLLECTION));
      return snapshot.size;
    } catch (error) {
      console.error('Error getting student count:', error);
      throw error;
    }
  },
};
