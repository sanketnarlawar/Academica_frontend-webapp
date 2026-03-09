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
import type { Attendance } from '../types';

const COLLECTION = 'attendance';

export const firebaseAttendanceService = {
  /**
   * Mark attendance for students
   */
  markAttendance: async (attendanceRecords: Omit<Attendance, 'id'>[]): Promise<void> => {
    try {
      for (const record of attendanceRecords) {
        await addDoc(collection(db, COLLECTION), {
          ...record,
          createdAt: Timestamp.now(),
        });
      }
    } catch (error) {
      console.error('Error marking attendance:', error);
      throw error;
    }
  },

  /**
   * Get attendance by class and date
   */
  getAttendanceByClass: async (
    classId: string,
    date: string
  ): Promise<Attendance[]> => {
    try {
      const q = query(
        collection(db, COLLECTION),
        where('class', '==', classId),
        where('date', '==', date)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Attendance[];
    } catch (error) {
      console.error('Error fetching attendance:', error);
      throw error;
    }
  },

  /**
   * Get attendance by student
   */
  getAttendanceByStudent: async (studentId: string): Promise<Attendance[]> => {
    try {
      const q = query(
        collection(db, COLLECTION),
        where('studentId', '==', studentId)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Attendance[];
    } catch (error) {
      console.error('Error fetching student attendance:', error);
      throw error;
    }
  },

  /**
   * Get all attendance records
   */
  getAllAttendance: async (): Promise<Attendance[]> => {
    try {
      const snapshot = await getDocs(collection(db, COLLECTION));
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Attendance[];
    } catch (error) {
      console.error('Error fetching all attendance:', error);
      throw error;
    }
  },

  /**
   * Update attendance record
   */
  updateAttendance: async (
    id: string,
    updates: Partial<Attendance>
  ): Promise<void> => {
    try {
      const docRef = doc(db, COLLECTION, id);
      await updateDoc(docRef, updates);
    } catch (error) {
      console.error('Error updating attendance:', error);
      throw error;
    }
  },

  /**
   * Delete attendance record
   */
  deleteAttendance: async (id: string): Promise<void> => {
    try {
      const docRef = doc(db, COLLECTION, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting attendance:', error);
      throw error;
    }
  },
};
