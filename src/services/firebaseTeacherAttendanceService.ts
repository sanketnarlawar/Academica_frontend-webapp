import {
  collection,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { TeacherAttendance, TeacherAttendanceStats } from '../types';
import { sanitizeFirestoreData } from '../utils/sanitizeFirestoreData';

const COLLECTION = 'teacherAttendance';

export const firebaseTeacherAttendanceService = {
  /**
   * Get all teacher attendance records
   */
  getAttendanceRecords: async (): Promise<TeacherAttendance[]> => {
    try {
      const snapshot = await getDocs(
        query(collection(db, COLLECTION), orderBy('date', 'desc'))
      );
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as TeacherAttendance[];
    } catch (error) {
      console.error('Error fetching attendance records:', error);
      throw error;
    }
  },

  /**
   * Get attendance records for a specific teacher
   */
  getAttendanceByTeacher: async (
    teacherId: string,
    startDate?: string,
    endDate?: string
  ): Promise<TeacherAttendance[]> => {
    try {
      let q = query(collection(db, COLLECTION), where('teacherId', '==', teacherId));

      if (startDate && endDate) {
        q = query(q, where('date', '>=', startDate), where('date', '<=', endDate));
      }

      const snapshot = await getDocs(q);
      const records = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as TeacherAttendance[];

      // Sort client-side to reduce Firestore composite index requirements.
      return records.sort((a, b) => b.date.localeCompare(a.date));
    } catch (error) {
      console.error('Error fetching teacher attendance:', error);
      throw error;
    }
  },

  /**
   * Get attendance for a specific date
   */
  getAttendanceByDate: async (date: string): Promise<TeacherAttendance[]> => {
    try {
      const q = query(collection(db, COLLECTION), where('date', '==', date));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as TeacherAttendance[];
    } catch (error) {
      console.error('Error fetching attendance by date:', error);
      throw error;
    }
  },

  /**
   * Mark attendance for a teacher
   */
  markAttendance: async (
    attendanceData: Omit<TeacherAttendance, 'id'>
  ): Promise<string> => {
    try {
      // Use a stable ID so one teacher has only one record per date.
      // This avoids requiring a compound query before save.
      const docId = `${attendanceData.date}_${attendanceData.teacherId}`;
      await setDoc(doc(db, COLLECTION, docId), sanitizeFirestoreData({
        ...attendanceData,
        updatedAt: Timestamp.now(),
      }), { merge: true });
      return docId;
    } catch (error) {
      console.error('Error marking attendance:', error);
      throw error;
    }
  },

  /**
   * Bulk mark attendance
   */
  bulkMarkAttendance: async (
    attendanceRecords: Omit<TeacherAttendance, 'id'>[]
  ): Promise<void> => {
    try {
      const batch = writeBatch(db);
      const timestamp = Timestamp.now();

      for (const record of attendanceRecords) {
        const newDocRef = doc(collection(db, COLLECTION));
        batch.set(newDocRef, sanitizeFirestoreData({
          ...record,
          createdAt: timestamp,
        }));
      }

      await batch.commit();
    } catch (error) {
      console.error('Error bulk marking attendance:', error);
      throw error;
    }
  },

  /**
   * Update attendance record
   */
  updateAttendance: async (
    id: string,
    updates: Partial<TeacherAttendance>
  ): Promise<void> => {
    try {
      const docRef = doc(db, COLLECTION, id);
      await updateDoc(docRef, sanitizeFirestoreData({
        ...updates,
        updatedAt: Timestamp.now(),
      }));
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
      await deleteDoc(doc(db, COLLECTION, id));
    } catch (error) {
      console.error('Error deleting attendance:', error);
      throw error;
    }
  },

  /**
   * Calculate attendance statistics for a teacher
   */
  getAttendanceStats: async (
    teacherId: string,
    teacherName: string,
    department: string,
    startDate?: string,
    endDate?: string
  ): Promise<TeacherAttendanceStats> => {
    try {
      const records = await firebaseTeacherAttendanceService.getAttendanceByTeacher(
        teacherId,
        startDate,
        endDate
      );

      const totalDays = records.length;
      const presentDays = records.filter((r) => r.status === 'present').length;
      const absentDays = records.filter((r) => r.status === 'absent').length;
      const lateDays = records.filter((r) => r.status === 'late').length;
      const halfDays = records.filter((r) => r.status === 'half-day').length;
      const leaveDays = records.filter((r) => r.status === 'on-leave').length;

      const attendancePercentage =
        totalDays > 0 ? ((presentDays + lateDays + halfDays * 0.5) / totalDays) * 100 : 0;
      const punctualityPercentage =
        totalDays > 0 ? (presentDays / (totalDays - absentDays - leaveDays)) * 100 : 0;

      return {
        teacherId,
        teacherName,
        department,
        totalDays,
        presentDays,
        absentDays,
        lateDays,
        halfDays,
        leaveDays,
        attendancePercentage: Math.round(attendancePercentage * 100) / 100,
        punctualityPercentage: Math.round(punctualityPercentage * 100) / 100,
      };
    } catch (error) {
      console.error('Error calculating attendance stats:', error);
      throw error;
    }
  },

  /**
   * Get department-wise attendance summary
   */
  getDepartmentWiseAttendance: async (
    date: string
  ): Promise<{ department: string; present: number; total: number; percentage: number }[]> => {
    try {
      const records = await firebaseTeacherAttendanceService.getAttendanceByDate(date);
      const departmentMap = new Map<string, { present: number; total: number }>();

      records.forEach((record) => {
        const dept = record.location || 'Unknown';
        const current = departmentMap.get(dept) || { present: 0, total: 0 };
        current.total += 1;
        if (record.status === 'present' || record.status === 'late') {
          current.present += 1;
        }
        departmentMap.set(dept, current);
      });

      return Array.from(departmentMap.entries()).map(([department, stats]) => ({
        department,
        present: stats.present,
        total: stats.total,
        percentage: Math.round((stats.present / stats.total) * 100 * 100) / 100,
      }));
    } catch (error) {
      console.error('Error getting department-wise attendance:', error);
      throw error;
    }
  },
};
