import {
  collection,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Teacher } from '../types';

const COLLECTION = 'teachers';

export const firebaseTeacherService = {
  /**
   * Get all teachers
   */
  getTeachers: async (): Promise<Teacher[]> => {
    try {
      const snapshot = await getDocs(collection(db, COLLECTION));
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Teacher[];
    } catch (error) {
      console.error('Error fetching teachers:', error);
      throw error;
    }
  },

  /**
   * Get a single teacher by ID
   */
  getTeacherById: async (id: string): Promise<Teacher | null> => {
    try {
      const docRef = doc(db, COLLECTION, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as Teacher;
    } catch (error) {
      console.error('Error fetching teacher:', error);
      throw error;
    }
  },

  /**
   * Add a new teacher
   */
  addTeacher: async (teacherData: Omit<Teacher, 'id'>): Promise<string> => {
    try {
      const docRef = await addDoc(collection(db, COLLECTION), {
        ...teacherData,
        createdAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding teacher:', error);
      throw error;
    }
  },

  /**
   * Update an existing teacher
   */
  updateTeacher: async (id: string, updates: Partial<Teacher>): Promise<void> => {
    try {
      const docRef = doc(db, COLLECTION, id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating teacher:', error);
      throw error;
    }
  },

  /**
   * Delete a teacher
   */
  deleteTeacher: async (id: string): Promise<void> => {
    try {
      const docRef = doc(db, COLLECTION, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting teacher:', error);
      throw error;
    }
  },

  /**
   * Get teacher count
   */
  getTeacherCount: async (): Promise<number> => {
    try {
      const snapshot = await getDocs(collection(db, COLLECTION));
      return snapshot.size;
    } catch (error) {
      console.error('Error getting teacher count:', error);
      throw error;
    }
  },

  /**
   * Get average experience
   */
  getAverageExperience: async (): Promise<number> => {
    try {
      const snapshot = await getDocs(collection(db, COLLECTION));
      const teachers = snapshot.docs.map((doc) => doc.data() as Teacher);
      if (teachers.length === 0) return 0;
      const totalExp = teachers.reduce((sum, t) => sum + (t.experience || 0), 0);
      return totalExp / teachers.length;
    } catch (error) {
      console.error('Error calculating average experience:', error);
      throw error;
    }
  },
};
