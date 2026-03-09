import { firebaseStudentService } from './firebaseStudentService';
import { firebaseTeacherService } from './firebaseTeacherService';
import { firebaseFinanceService } from './firebaseFinanceService';
import { firebaseAttendanceService } from './firebaseAttendanceService';
import type { DashboardOverview, DashboardTrends } from '../types';

export const firebaseDashboardService = {
  /**
   * Get dashboard overview with all KPIs
   */
  getOverview: async (): Promise<DashboardOverview> => {
    try {
      const [students, teachers, totalCollected, totalPending, allAttendance] =
        await Promise.all([
          firebaseStudentService.getStudents(),
          firebaseTeacherService.getTeachers(),
          firebaseFinanceService.getTotalCollected(),
          firebaseFinanceService.getTotalPending(),
          firebaseAttendanceService.getAllAttendance(),
        ]);

      // Calculate attendance percentage
      const today = new Date().toISOString().split('T')[0];
      const todayAttendance = allAttendance.filter((a) => a.date === today);
      const todayPresent = todayAttendance.filter(
        (a) => a.status === 'present' || a.status === 'late'
      ).length;
      const attendancePercentage =
        todayAttendance.length > 0
          ? Math.round((todayPresent / todayAttendance.length) * 100)
          : 0;

      return {
        totalStudents: students.length,
        totalTeachers: teachers.length,
        totalClasses: 10, // Hardcoded for now - can be fetched from separate collection
        feesCollected: totalCollected,
        pendingFees: totalPending,
        attendancePercentage,
      };
    } catch (error) {
      console.error('Error fetching dashboard overview:', error);
      throw error;
    }
  },

  /**
   * Get dashboard trends for charts
   */
  getTrends: async (): Promise<DashboardTrends> => {
    try {
      const allAttendance = await firebaseAttendanceService.getAllAttendance();

      // Group attendance by date
      const attendanceByDate: Record<string, number> = {};
      allAttendance.forEach((record) => {
        const date = new Date(record.date);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        if (!attendanceByDate[dayName]) {
          attendanceByDate[dayName] = 0;
        }
        if (record.status === 'present' || record.status === 'late') {
          attendanceByDate[dayName]++;
        }
      });

      // Calculate attendance trend
      const attendanceTrend = Object.entries(attendanceByDate).map(
        ([day, count]) => {
          const total = allAttendance.filter(
            (a) => a.date.includes(day)
          ).length;
          return {
            day,
            percentage: total > 0 ? Math.round((count / total) * 100) : 0,
          };
        }
      );

      // Placeholder for class-wise attendance (can fetch from separate collection)
      const classWiseAttendance = [
        { class: 'Class 6', percentage: 92 },
        { class: 'Class 7', percentage: 88 },
        { class: 'Class 8', percentage: 91 },
        { class: 'Class 9', percentage: 86 },
        { class: 'Class 10', percentage: 93 },
      ];

      // Placeholder for fee collection (can be enhanced with real data)
      const feeCollection = [
        { month: 'Aug', collected: 285000, pending: 45000 },
        { month: 'Sep', collected: 310000, pending: 38000 },
        { month: 'Oct', collected: 295000, pending: 52000 },
        { month: 'Nov', collected: 320000, pending: 28000 },
        { month: 'Dec', collected: 280000, pending: 60000 },
        { month: 'Jan', collected: 340000, pending: 22000 },
        { month: 'Feb', collected: 315000, pending: 35000 },
        { month: 'Mar', collected: 360000, pending: 18000 },
      ];

      return {
        attendanceTrend: attendanceTrend.length > 0 ? attendanceTrend : [
          { day: 'Mon', percentage: 94 },
          { day: 'Tue', percentage: 91 },
          { day: 'Wed', percentage: 96 },
          { day: 'Thu', percentage: 88 },
          { day: 'Fri', percentage: 82 },
        ],
        classWiseAttendance,
        feeCollection,
      };
    } catch (error) {
      console.error('Error fetching dashboard trends:', error);
      throw error;
    }
  },
};
