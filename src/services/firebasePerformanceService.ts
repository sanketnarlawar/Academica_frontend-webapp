import {
  collection,
  getDocs,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type {
  PerformanceReview,
  TeacherFeedback,
  PerformanceGoal,
} from '../types';

const PERFORMANCE_REVIEWS = 'performanceReviews';
const TEACHER_FEEDBACK = 'teacherFeedback';
const PERFORMANCE_GOALS = 'performanceGoals';

export const firebasePerformanceService = {
  // Performance Reviews
  /**
   * Get all performance reviews
   */
  getPerformanceReviews: async (): Promise<PerformanceReview[]> => {
    try {
      const snapshot = await getDocs(
        query(collection(db, PERFORMANCE_REVIEWS), orderBy('reviewDate', 'desc'))
      );
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as PerformanceReview[];
    } catch (error) {
      console.error('Error fetching performance reviews:', error);
      throw error;
    }
  },

  /**
   * Get reviews by teacher
   */
  getReviewsByTeacher: async (teacherId: string): Promise<PerformanceReview[]> => {
    try {
      const q = query(
        collection(db, PERFORMANCE_REVIEWS),
        where('teacherId', '==', teacherId),
        orderBy('reviewDate', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as PerformanceReview[];
    } catch (error) {
      console.error('Error fetching teacher reviews:', error);
      throw error;
    }
  },

  /**
   * Get pending reviews
   */
  getPendingReviews: async (): Promise<PerformanceReview[]> => {
    try {
      const q = query(
        collection(db, PERFORMANCE_REVIEWS),
        where('status', 'in', ['not-started', 'in-progress']),
        orderBy('reviewDate', 'asc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as PerformanceReview[];
    } catch (error) {
      console.error('Error fetching pending reviews:', error);
      throw error;
    }
  },

  /**
   * Create performance review
   */
  createPerformanceReview: async (
    reviewData: Omit<PerformanceReview, 'id'>
  ): Promise<string> => {
    try {
      const docRef = await addDoc(collection(db, PERFORMANCE_REVIEWS), {
        ...reviewData,
        createdAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating performance review:', error);
      throw error;
    }
  },

  /**
   * Update performance review
   */
  updatePerformanceReview: async (
    id: string,
    updates: Partial<PerformanceReview>
  ): Promise<void> => {
    try {
      await updateDoc(doc(db, PERFORMANCE_REVIEWS, id), {
        ...updates,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating performance review:', error);
      throw error;
    }
  },

  /**
   * Delete performance review
   */
  deletePerformanceReview: async (id: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, PERFORMANCE_REVIEWS, id));
    } catch (error) {
      console.error('Error deleting performance review:', error);
      throw error;
    }
  },

  /**
   * Submit review for acknowledgment
   */
  submitReview: async (reviewId: string): Promise<void> => {
    try {
      await updateDoc(doc(db, PERFORMANCE_REVIEWS, reviewId), {
        status: 'completed',
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error submitting review:', error);
      throw error;
    }
  },

  /**
   * Acknowledge review
   */
  acknowledgeReview: async (
    reviewId: string,
    employeeComments: string
  ): Promise<void> => {
    try {
      await updateDoc(doc(db, PERFORMANCE_REVIEWS, reviewId), {
        status: 'acknowledged',
        employeeComments,
        acknowledgedDate: new Date().toISOString(),
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error acknowledging review:', error);
      throw error;
    }
  },

  // Performance Goals
  /**
   * Get goals by teacher
   */
  getGoalsByTeacher: async (teacherId: string): Promise<PerformanceGoal[]> => {
    try {
      const q = query(
        collection(db, PERFORMANCE_GOALS),
        where('teacherId', '==', teacherId),
        orderBy('targetDate', 'asc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as PerformanceGoal[];
    } catch (error) {
      console.error('Error fetching goals:', error);
      throw error;
    }
  },

  /**
   * Add goal
   */
  addGoal: async (
    goalData: Omit<PerformanceGoal, 'id'> & { teacherId: string }
  ): Promise<string> => {
    try {
      const docRef = await addDoc(collection(db, PERFORMANCE_GOALS), {
        ...goalData,
        createdAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding goal:', error);
      throw error;
    }
  },

  /**
   * Update goal
   */
  updateGoal: async (id: string, updates: Partial<PerformanceGoal>): Promise<void> => {
    try {
      await updateDoc(doc(db, PERFORMANCE_GOALS, id), {
        ...updates,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating goal:', error);
      throw error;
    }
  },

  /**
   * Delete goal
   */
  deleteGoal: async (id: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, PERFORMANCE_GOALS, id));
    } catch (error) {
      console.error('Error deleting goal:', error);
      throw error;
    }
  },

  // Teacher Feedback
  /**
   * Get all feedback
   */
  getAllFeedback: async (): Promise<TeacherFeedback[]> => {
    try {
      const snapshot = await getDocs(
        query(collection(db, TEACHER_FEEDBACK), orderBy('feedbackDate', 'desc'))
      );
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as TeacherFeedback[];
    } catch (error) {
      console.error('Error fetching feedback:', error);
      throw error;
    }
  },

  /**
   * Get feedback by teacher
   */
  getFeedbackByTeacher: async (
    teacherId: string,
    feedbackType?: string
  ): Promise<TeacherFeedback[]> => {
    try {
      let q = query(
        collection(db, TEACHER_FEEDBACK),
        where('teacherId', '==', teacherId),
        orderBy('feedbackDate', 'desc')
      );

      if (feedbackType) {
        q = query(q, where('feedbackType', '==', feedbackType));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as TeacherFeedback[];
    } catch (error) {
      console.error('Error fetching teacher feedback:', error);
      throw error;
    }
  },

  /**
   * Submit feedback
   */
  submitFeedback: async (
    feedbackData: Omit<TeacherFeedback, 'id'>
  ): Promise<string> => {
    try {
      const docRef = await addDoc(collection(db, TEACHER_FEEDBACK), {
        ...feedbackData,
        createdAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw error;
    }
  },

  /**
   * Update feedback
   */
  updateFeedback: async (
    id: string,
    updates: Partial<TeacherFeedback>
  ): Promise<void> => {
    try {
      await updateDoc(doc(db, TEACHER_FEEDBACK, id), {
        ...updates,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating feedback:', error);
      throw error;
    }
  },

  /**
   * Delete feedback
   */
  deleteFeedback: async (id: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, TEACHER_FEEDBACK, id));
    } catch (error) {
      console.error('Error deleting feedback:', error);
      throw error;
    }
  },

  /**
   * Calculate average ratings by teacher
   */
  getTeacherRatingSummary: async (
    teacherId: string
  ): Promise<{
    overallRating: number;
    totalFeedback: number;
    byType: Array<{ type: string; rating: number; count: number }>;
    parameterRatings: Array<{ parameter: string; rating: number }>;
  }> => {
    try {
      const feedback = await firebasePerformanceService.getFeedbackByTeacher(teacherId);

      if (feedback.length === 0) {
        return {
          overallRating: 0,
          totalFeedback: 0,
          byType: [],
          parameterRatings: [],
        };
      }

      const overallRating =
        feedback.reduce((sum, f) => sum + f.averageRating, 0) / feedback.length;

      // Group by feedback type
      const typeMap = new Map<string, { sum: number; count: number }>();
      feedback.forEach((f) => {
        const current = typeMap.get(f.feedbackType) || { sum: 0, count: 0 };
        current.sum += f.averageRating;
        current.count += 1;
        typeMap.set(f.feedbackType, current);
      });

      const byType = Array.from(typeMap.entries()).map(([type, data]) => ({
        type,
        rating: data.sum / data.count,
        count: data.count,
      }));

      // Aggregate parameter ratings
      const paramMap = new Map<string, { sum: number; count: number }>();
      feedback.forEach((f) => {
        f.ratings.forEach((r) => {
          const current = paramMap.get(r.parameter) || { sum: 0, count: 0 };
          current.sum += r.rating;
          current.count += 1;
          paramMap.set(r.parameter, current);
        });
      });

      const parameterRatings = Array.from(paramMap.entries()).map(
        ([parameter, data]) => ({
          parameter,
          rating: Math.round((data.sum / data.count) * 100) / 100,
        })
      );

      return {
        overallRating: Math.round(overallRating * 100) / 100,
        totalFeedback: feedback.length,
        byType,
        parameterRatings,
      };
    } catch (error) {
      console.error('Error calculating teacher rating summary:', error);
      throw error;
    }
  },

  /**
   * Get performance summary for dashboard
   */
  getPerformanceSummary: async (): Promise<{
    totalReviews: number;
    completedReviews: number;
    pendingReviews: number;
    averageRating: number;
    dueThisMonth: number;
  }> => {
    try {
      const reviews = await firebasePerformanceService.getPerformanceReviews();

      const totalReviews = reviews.length;
      const completedReviews = reviews.filter(
        (r) => r.status === 'completed' || r.status === 'acknowledged'
      ).length;
      const pendingReviews = reviews.filter(
        (r) => r.status === 'not-started' || r.status === 'in-progress'
      ).length;

      const averageRating =
        reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.overallRating, 0) / reviews.length
          : 0;

      const currentMonth = new Date().toISOString().slice(0, 7);
      const dueThisMonth = reviews.filter(
        (r) =>
          r.reviewDate.startsWith(currentMonth) &&
          (r.status === 'not-started' || r.status === 'in-progress')
      ).length;

      return {
        totalReviews,
        completedReviews,
        pendingReviews,
        averageRating: Math.round(averageRating * 100) / 100,
        dueThisMonth,
      };
    } catch (error) {
      console.error('Error getting performance summary:', error);
      throw error;
    }
  },
};
