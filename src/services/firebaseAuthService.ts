import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  getAuth,
  type User,
} from 'firebase/auth';
import { initializeApp, deleteApp } from 'firebase/app';
import { auth, db, firebaseConfig } from '../config/firebase';
import { doc, setDoc, getDoc, query, collection, where, getDocs } from 'firebase/firestore';

interface UserRegistrationData {
  name: string;
  role: string;
}

const DEFAULT_TEMP_PASSWORD = 'Welcome@123';

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
          linkedEntityId: userData?.linkedEntityId || '',
          linkedEntityType: userData?.linkedEntityType || '',
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

  /**
   * Provision a user account from admin flows (teacher/student onboarding)
   * - Creates Firebase Auth user with fixed temporary password
   * - Creates /users profile document for role-based login
   * - Triggers Firebase password reset email so user can set own password
   */
  provisionUserFromAdmin: async (payload: {
    email: string;
    name: string;
    role: 'teacher' | 'student';
    linkedEntityId: string;
    linkedEntityType: 'teacher' | 'student';
  }): Promise<{ success: boolean; message?: string; uid?: string; tempPassword?: string }> => {
    const { email, name, role, linkedEntityId, linkedEntityType } = payload;

    try {
      const duplicate = await getDocs(query(collection(db, 'users'), where('email', '==', email)));
      if (!duplicate.empty) {
        return {
          success: false,
          message: 'This email already has a login account. Please use a different email.',
        };
      }

      // Use a secondary Firebase app to avoid switching current admin session.
      const secondaryApp = initializeApp(firebaseConfig, `provision-${Date.now()}`);
      const secondaryAuth = getAuth(secondaryApp);

      try {
        const credential = await createUserWithEmailAndPassword(secondaryAuth, email, DEFAULT_TEMP_PASSWORD);
        const provisionedUser = credential.user;

        await setDoc(doc(db, 'users', provisionedUser.uid), {
          uid: provisionedUser.uid,
          email,
          role,
          name,
          linkedEntityId,
          linkedEntityType,
          mustResetPassword: true,
          tempPasswordAssignedAt: new Date(),
          createdAt: new Date(),
        });

        // Trigger reset email so user sets private password.
        await sendPasswordResetEmail(secondaryAuth, email);

        await signOut(secondaryAuth);
        await deleteApp(secondaryApp);

        return {
          success: true,
          uid: provisionedUser.uid,
          tempPassword: DEFAULT_TEMP_PASSWORD,
        };
      } catch (provisionError) {
        await deleteApp(secondaryApp);
        throw provisionError;
      }
    } catch (error) {
      console.error('Error provisioning user from admin:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to create login account',
      };
    }
  },
};
