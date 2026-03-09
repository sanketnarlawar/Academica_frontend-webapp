import {
  collection,
  getDocs,
  addDoc,
  Timestamp,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Subject } from '../types';

const COLLECTION = 'subjects';

export const firebaseSubjectService = {
  getSubjects: async (): Promise<Subject[]> => {
    try {
      const q = query(collection(db, COLLECTION), orderBy('name', 'asc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => ({ id: d.id, ...d.data() })) as Subject[];
    } catch (error) {
      console.error('Error fetching subjects:', error);
      throw error;
    }
  },

  addSubject: async (subjectData: Omit<Subject, 'id'>): Promise<string> => {
    try {
      const docRef = await addDoc(collection(db, COLLECTION), {
        ...subjectData,
        createdAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding subject:', error);
      throw error;
    }
  },
};
