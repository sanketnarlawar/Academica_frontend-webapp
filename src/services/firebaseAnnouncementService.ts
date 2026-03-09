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
  onSnapshot,
} from 'firebase/firestore';
import type { Unsubscribe } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Announcement } from '../types';

const COLLECTION = 'announcements';

export const firebaseAnnouncementService = {
  /**
   * Get all announcements, ordered by date (newest first)
   */
  getAnnouncements: async (): Promise<Announcement[]> => {
    const normalizeAndSort = (rows: Announcement[]): Announcement[] => {
      const toMillis = (value: unknown): number => {
        if (value && typeof value === 'object' && 'seconds' in value) {
          const ts = value as { seconds: number };
          return ts.seconds * 1000;
        }
        if (typeof value === 'string') {
          const parsed = new Date(value).getTime();
          return Number.isNaN(parsed) ? 0 : parsed;
        }
        return 0;
      };

      return [...rows].sort((a, b) => {
        const aData = a as unknown as { createdAt?: unknown; date?: unknown };
        const bData = b as unknown as { createdAt?: unknown; date?: unknown };
        const aTime = toMillis(aData.createdAt ?? aData.date);
        const bTime = toMillis(bData.createdAt ?? bData.date);
        return bTime - aTime;
      });
    };

    try {
      const q = query(
        collection(db, COLLECTION),
        orderBy('createdAt', 'desc') as QueryConstraint
      );
      const snapshot = await getDocs(q);
      const rows = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Announcement[];
      return normalizeAndSort(rows);
    } catch {
      // Fallback for legacy records that do not have createdAt.
      try {
        const snapshot = await getDocs(collection(db, COLLECTION));
        const rows = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Announcement[];
        return normalizeAndSort(rows);
      } catch (fallbackError) {
        console.error('Error fetching announcements:', fallbackError);
        throw fallbackError;
      }
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

  /**
   * Subscribe to real-time announcement updates
   * @param callback Function to call when announcements change
   * @returns Unsubscribe function to stop listening
   */
  subscribeToAnnouncements: (callback: (announcements: Announcement[]) => void): Unsubscribe => {
    try {
      const q = query(
        collection(db, COLLECTION),
        orderBy('createdAt', 'desc') as QueryConstraint
      );
      
      return onSnapshot(q, (snapshot) => {
        const rows = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Announcement[];
        callback(rows);
      }, (error) => {
        console.error('Error in announcement subscription:', error);
        // Fallback to collection without orderBy if index doesn't exist
        const fallbackUnsubscribe = onSnapshot(
          collection(db, COLLECTION),
          (snapshot) => {
            const rows = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            })) as Announcement[];
            
            // Sort manually if no orderBy
            rows.sort((a, b) => {
              const aData = a as unknown as { createdAt?: { seconds: number } };
              const bData = b as unknown as { createdAt?: { seconds: number } };
              const aTime = aData.createdAt?.seconds || 0;
              const bTime = bData.createdAt?.seconds || 0;
              return bTime - aTime;
            });
            
            callback(rows);
          }
        );
        return fallbackUnsubscribe;
      });
    } catch (err) {
      console.error('Error setting up announcement subscription:', err);
      // Return empty unsubscribe function
      return () => {};
    }
  },
};
