import {
  collection,
  getDocs,
  addDoc,
  Timestamp,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { ClassSection } from '../types';

const COLLECTION = 'classes';

export const firebaseClassService = {
  getClasses: async (): Promise<ClassSection[]> => {
    try {
      const q = query(collection(db, COLLECTION), orderBy('name', 'asc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as ClassSection[];
    } catch (error) {
      console.error('Error fetching classes:', error);
      throw error;
    }
  },

  addClass: async (classData: Omit<ClassSection, 'id'>): Promise<string> => {
    try {
      const docRef = await addDoc(collection(db, COLLECTION), {
        ...classData,
        createdAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding class:', error);
      throw error;
    }
  },
};
