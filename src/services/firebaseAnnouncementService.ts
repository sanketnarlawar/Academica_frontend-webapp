import {
  collection,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  Timestamp,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Announcement } from '../types';

const COLLECTION = 'announcements';

export const firebaseAnnouncementService = {
  /**
   * Get all announcements, ordered by date (newest first)
   */
  getAnnouncements: async (): Promise<Announcement[]> => {
    try {
      const q = query(
        collection(db, COLLECTION),
        orderBy('createdAt', 'desc') as QueryConstraint
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Announcement[];
    } catch (error) {
      console.error('Error fetching announcements:', error);
      throw error;
    }
  },

  /**
   * Get a single announcement by ID
   */
  getAnnouncementById: async (id: string): Promise<Announcement | null> => {
    try {
      const docRef = doc(db, COLLECTION, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as Announcement;
    } catch (error) {
      console.error('Error fetching announcement:', error);
      throw error;
    }
  },

  /**
   * Add a new announcement
   */
  addAnnouncement: async (
    announcementData: Omit<Announcement, 'id'>
  ): Promise<string> => {
    try {
      const docRef = await addDoc(collection(db, COLLECTION), {
        ...announcementData,
        createdAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding announcement:', error);
      throw error;
    }
  },

  /**
   * Update an existing announcement
   */
  updateAnnouncement: async (
    id: string,
    updates: Partial<Announcement>
  ): Promise<void> => {
    try {
      const docRef = doc(db, COLLECTION, id);
      await updateDoc(docRef, {
        ...updates,
      });
    } catch (error) {
      console.error('Error updating announcement:', error);
      throw error;
    }
  },

  /**
   * Delete an announcement
   */
  deleteAnnouncement: async (id: string): Promise<void> => {
    try {
      const docRef = doc(db, COLLECTION, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting announcement:', error);
      throw error;
    }
  },
};
