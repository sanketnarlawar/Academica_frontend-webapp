import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import { auth, db } from '../config/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

interface UserRegistrationData {
  name: string;
  role: string;
}

export const firebaseAuthService = {
  /**
   * Register a new user
   */
  registerAdmin: async (email: string, password: string, adminData: UserRegistrationData) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create user document in Firestore with specified role
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        role: adminData.role || 'admin',
        name: adminData.name || 'Admin',
        createdAt: new Date(),
      });

      return { success: true, user };
    } catch (error) {
      console.error('Error registering user:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Registration failed',
      };
    }
  },

  /**
   * Login with email and password
   */
  login: async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Get user role from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();

      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          role: userData?.role || 'student',
          name: userData?.name || user.email,
        },
      };
    } catch (error) {
      console.error('Error logging in:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Login failed',
      };
    }
  },

  /**
   * Logout current user
   */
  logout: async () => {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error) {
      console.error('Error logging out:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Logout failed',
      };
    }
  },

  /**
   * Get current authenticated user
   */
  getCurrentUser: (): Promise<User | null> => {
    return new Promise((resolve) => {
      onAuthStateChanged(auth, (user) => {
        resolve(user);
      });
    });
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: (): Promise<boolean> => {
    return new Promise((resolve) => {
      onAuthStateChanged(auth, (user) => {
        resolve(!!user);
      });
    });
  },

  /**
   * Get user role
   */
  getUserRole: async (uid: string): Promise<string | null> => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      return userDoc.data()?.role || null;
    } catch (error) {
      console.error('Error getting user role:', error);
      return null;
    }
  },
};
