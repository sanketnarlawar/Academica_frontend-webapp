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
import { sanitizeFirestoreData } from '../utils/sanitizeFirestoreData';
import type {
  LeaveApplication,
  LeaveBalance,
  LeavePolicy,
  LeaveAllocation,
} from '../types';

const LEAVE_APPLICATIONS = 'leaveApplications';
const LEAVE_BALANCES = 'leaveBalances';
const LEAVE_POLICIES = 'leavePolicies';

export const firebaseLeaveService = {
  // Leave Applications
  /**
   * Get all leave applications
   */
  getLeaveApplications: async (): Promise<LeaveApplication[]> => {
    try {
      const snapshot = await getDocs(
        query(collection(db, LEAVE_APPLICATIONS), orderBy('appliedDate', 'desc'))
      );
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as LeaveApplication[];
    } catch (error) {
      console.error('Error fetching leave applications:', error);
      throw error;
    }
  },

  /**
   * Get leave applications by teacher
   */
  getLeavesByTeacher: async (teacherId: string): Promise<LeaveApplication[]> => {
    try {
      const q = query(
        collection(db, LEAVE_APPLICATIONS),
        where('teacherId', '==', teacherId),
        orderBy('appliedDate', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as LeaveApplication[];
    } catch (error) {
      console.error('Error fetching teacher leaves:', error);
      throw error;
    }
  },

  /**
   * Get pending leave applications
   */
  getPendingLeaves: async (): Promise<LeaveApplication[]> => {
    try {
      const q = query(
        collection(db, LEAVE_APPLICATIONS),
        where('status', '==', 'pending'),
        orderBy('appliedDate', 'asc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as LeaveApplication[];
    } catch (error) {
      console.error('Error fetching pending leaves:', error);
      throw error;
    }
  },

  /**
   * Apply for leave
   */
  applyLeave: async (
    leaveData: Omit<LeaveApplication, 'id'>
  ): Promise<string> => {
    try {
      const docRef = await addDoc(collection(db, LEAVE_APPLICATIONS), {
        ...sanitizeFirestoreData(leaveData),
        createdAt: Timestamp.now(),
      });

      // Update leave balance
      await firebaseLeaveService.updateLeaveBalanceOnApplication(
        leaveData.teacherId,
        leaveData.leaveType,
        leaveData.totalDays
      );

      return docRef.id;
    } catch (error) {
      console.error('Error applying for leave:', error);
      throw error;
    }
  },

  /**
   * Update leave application
   */
  updateLeave: async (
    id: string,
    updates: Partial<LeaveApplication>
  ): Promise<void> => {
    try {
      const docRef = doc(db, LEAVE_APPLICATIONS, id);
      await updateDoc(docRef, sanitizeFirestoreData({
        ...updates,
        updatedAt: Timestamp.now(),
      }));
    } catch (error) {
      console.error('Error updating leave:', error);
      throw error;
    }
  },

  /**
   * Approve/Reject leave
   */
  processLeaveApproval: async (
    leaveId: string,
    approverId: string,
    approverName: string,
    _approverRole: string,
    status: 'approved' | 'rejected',
    remarks?: string
  ): Promise<void> => {
    try {
      const leaveRef = doc(db, LEAVE_APPLICATIONS, leaveId);
      const leaveDoc = await getDoc(leaveRef);

      if (!leaveDoc.exists()) {
        throw new Error('Leave application not found');
      }

      const leaveData = leaveDoc.data() as LeaveApplication;
      const approvalChain = leaveData.approvalChain || [];

      // Find pending approval step
      const pendingStepIndex = approvalChain.findIndex(
        (step) => step.status === 'pending'
      );

      if (pendingStepIndex !== -1) {
        approvalChain[pendingStepIndex] = {
          ...approvalChain[pendingStepIndex],
          status,
          remarks,
          actionDate: new Date().toISOString(),
          approverId,
          approverName,
        };
      }

      // Check if all approvals are done
      const allApproved = approvalChain.every((step) => step.status === 'approved');
      const anyRejected = approvalChain.some((step) => step.status === 'rejected');

      const finalStatus = anyRejected
        ? 'rejected'
        : allApproved
        ? 'approved'
        : 'pending';

      await updateDoc(leaveRef, sanitizeFirestoreData({
        approvalChain,
        status: finalStatus,
        currentApprover:
          finalStatus === 'pending'
            ? approvalChain[pendingStepIndex + 1]?.approverRole
            : undefined,
        updatedAt: Timestamp.now(),
      }));

      // If rejected, restore leave balance
      if (finalStatus === 'rejected') {
        await firebaseLeaveService.restoreLeaveBalance(
          leaveData.teacherId,
          leaveData.leaveType,
          leaveData.totalDays
        );
      }
    } catch (error) {
      console.error('Error processing leave approval:', error);
      throw error;
    }
  },

  /**
   * Cancel leave application
   */
  cancelLeave: async (leaveId: string, teacherId: string): Promise<void> => {
    try {
      const leaveRef = doc(db, LEAVE_APPLICATIONS, leaveId);
      const leaveDoc = await getDoc(leaveRef);

      if (!leaveDoc.exists()) {
        throw new Error('Leave application not found');
      }

      const leaveData = leaveDoc.data() as LeaveApplication;

      await updateDoc(leaveRef, sanitizeFirestoreData({
        status: 'cancelled',
        updatedAt: Timestamp.now(),
      }));

      // Restore leave balance
      await firebaseLeaveService.restoreLeaveBalance(
        teacherId,
        leaveData.leaveType,
        leaveData.totalDays
      );
    } catch (error) {
      console.error('Error cancelling leave:', error);
      throw error;
    }
  },

  // Leave Balance Management
  /**
   * Get leave balance for a teacher
   */
  getLeaveBalance: async (teacherId: string, year: number): Promise<LeaveBalance | null> => {
    try {
      const q = query(
        collection(db, LEAVE_BALANCES),
        where('teacherId', '==', teacherId),
        where('year', '==', year)
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return null;
      }

      return snapshot.docs[0].data() as LeaveBalance;
    } catch (error) {
      console.error('Error fetching leave balance:', error);
      throw error;
    }
  },

  /**
   * Initialize leave balance for a teacher
   */
  initializeLeaveBalance: async (
    teacherId: string,
    teacherName: string,
    year: number,
    role: string
  ): Promise<string> => {
    try {
      // Get leave policies for the role
      const policies = await firebaseLeaveService.getPoliciesByRole(role);

      const allocations: LeaveAllocation[] = policies.map((policy) => ({
        leaveType: policy.leaveType,
        allocated: policy.annualQuota,
        used: 0,
        balance: policy.annualQuota,
        carriedForward: 0,
      }));

      const docRef = await addDoc(collection(db, LEAVE_BALANCES), {
        teacherId,
        teacherName,
        year,
        leaveAllocations: allocations,
        updatedAt: new Date().toISOString(),
      });

      return docRef.id;
    } catch (error) {
      console.error('Error initializing leave balance:', error);
      throw error;
    }
  },

  /**
   * Update leave balance on application
   */
  updateLeaveBalanceOnApplication: async (
    teacherId: string,
    leaveType: string,
    days: number
  ): Promise<void> => {
    try {
      const year = new Date().getFullYear();
      const balance = await firebaseLeaveService.getLeaveBalance(teacherId, year);

      if (!balance) {
        throw new Error('Leave balance not found');
      }

      const updatedAllocations = balance.leaveAllocations.map((allocation) => {
        if (allocation.leaveType === leaveType) {
          return {
            ...allocation,
            used: allocation.used + days,
            balance: allocation.balance - days,
          };
        }
        return allocation;
      });

      const q = query(
        collection(db, LEAVE_BALANCES),
        where('teacherId', '==', teacherId),
        where('year', '==', year)
      );
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        await updateDoc(doc(db, LEAVE_BALANCES, snapshot.docs[0].id), sanitizeFirestoreData({
          leaveAllocations: updatedAllocations,
          updatedAt: new Date().toISOString(),
        }));
      }
    } catch (error) {
      console.error('Error updating leave balance:', error);
      throw error;
    }
  },

  /**
   * Restore leave balance on rejection/cancellation
   */
  restoreLeaveBalance: async (
    teacherId: string,
    leaveType: string,
    days: number
  ): Promise<void> => {
    try {
      const year = new Date().getFullYear();
      const balance = await firebaseLeaveService.getLeaveBalance(teacherId, year);

      if (!balance) {
        return;
      }

      const updatedAllocations = balance.leaveAllocations.map((allocation) => {
        if (allocation.leaveType === leaveType) {
          return {
            ...allocation,
            used: Math.max(0, allocation.used - days),
            balance: allocation.balance + days,
          };
        }
        return allocation;
      });

      const q = query(
        collection(db, LEAVE_BALANCES),
        where('teacherId', '==', teacherId),
        where('year', '==', year)
      );
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        await updateDoc(doc(db, LEAVE_BALANCES, snapshot.docs[0].id), sanitizeFirestoreData({
          leaveAllocations: updatedAllocations,
          updatedAt: new Date().toISOString(),
        }));
      }
    } catch (error) {
      console.error('Error restoring leave balance:', error);
      throw error;
    }
  },

  // Leave Policies
  /**
   * Get all leave policies
   */
  getLeavePolicies: async (): Promise<LeavePolicy[]> => {
    try {
      const snapshot = await getDocs(collection(db, LEAVE_POLICIES));
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as LeavePolicy[];
    } catch (error) {
      console.error('Error fetching leave policies:', error);
      throw error;
    }
  },

  /**
   * Get leave policies by role
   */
  getPoliciesByRole: async (role: string): Promise<LeavePolicy[]> => {
    try {
      const q = query(collection(db, LEAVE_POLICIES), where('role', '==', role));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as LeavePolicy[];
    } catch (error) {
      console.error('Error fetching policies by role:', error);
      throw error;
    }
  },

  /**
   * Add leave policy
   */
  addLeavePolicy: async (policyData: Omit<LeavePolicy, 'id'>): Promise<string> => {
    try {
      const docRef = await addDoc(collection(db, LEAVE_POLICIES), sanitizeFirestoreData(policyData));
      return docRef.id;
    } catch (error) {
      console.error('Error adding leave policy:', error);
      throw error;
    }
  },

  /**
   * Update leave policy
   */
  updateLeavePolicy: async (
    id: string,
    updates: Partial<LeavePolicy>
  ): Promise<void> => {
    try {
      await updateDoc(doc(db, LEAVE_POLICIES, id), sanitizeFirestoreData(updates));
    } catch (error) {
      console.error('Error updating leave policy:', error);
      throw error;
    }
  },

  /**
   * Delete leave policy
   */
  deleteLeavePolicy: async (id: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, LEAVE_POLICIES, id));
    } catch (error) {
      console.error('Error deleting leave policy:', error);
      throw error;
    }
  },
};
