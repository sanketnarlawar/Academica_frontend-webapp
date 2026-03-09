import { firebaseStudentService } from './firebaseStudentService';
import { firebaseTeacherService } from './firebaseTeacherService';
import { firebaseFinanceService } from './firebaseFinanceService';
import { firebaseAttendanceService } from './firebaseAttendanceService';
import { firebaseAnnouncementService } from './firebaseAnnouncementService';
import { firebaseClassService } from './firebaseClassService';
import type { DashboardOverview, DashboardTrends } from '../types';

const formatAlertTime = (dateValue: unknown): string => {
  if (typeof dateValue === 'string') return dateValue;
  if (dateValue && typeof dateValue === 'object' && 'seconds' in dateValue) {
    const ts = dateValue as { seconds: number };
    return new Date(ts.seconds * 1000).toLocaleString('en-IN');
  }
  return new Date().toLocaleString('en-IN');
};

const getAlertTypeFromPriority = (priority: 'low' | 'medium' | 'high') => {
  if (priority === 'high') return 'warning' as const;
  if (priority === 'medium') return 'info' as const;
  return 'success' as const;
};

const normalizeClassKey = (value: unknown): string => {
  if (value === null || value === undefined) return '';
  const raw = String(value).trim().toLowerCase();
  if (!raw) return '';

  const digitMatch = raw.match(/\d+/);
  if (digitMatch) {
    return String(parseInt(digitMatch[0], 10));
  }

  return raw.replace(/[^a-z]/g, '');
};

export const firebaseDashboardService = {
  /**
   * Get dashboard overview with all KPIs
   */
  getOverview: async (): Promise<DashboardOverview> => {
    try {
      const [students, teachers, allAttendance, announcements, classSections, feeStructures, feePayments] =
        await Promise.all([
          firebaseStudentService.getStudents(),
          firebaseTeacherService.getTeachers(),
          firebaseAttendanceService.getAllAttendance(),
          firebaseAnnouncementService.getAnnouncements(),
          firebaseClassService.getClasses(),
          firebaseFinanceService.getFeeStructures(),
          firebaseFinanceService.getFeePayments(),
        ]);

      const totalCollected = feePayments
        .filter((payment) => payment.status === 'paid' || payment.status === 'partial')
        .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

      const feeStructureByClassKey = new Map<string, number>();
      feeStructures.forEach((structure) => {
        const key = normalizeClassKey(structure.class);
        if (key && !feeStructureByClassKey.has(key)) {
          feeStructureByClassKey.set(key, Number(structure.totalAmount || 0));
        }
      });

      const totalPending = students.reduce((sum, student) => {
        const classKey = normalizeClassKey(student.class);
        const structureAmount = feeStructureByClassKey.get(classKey) || 0;
        if (!structureAmount) return sum;

        const studentPaid = feePayments
          .filter((payment) => payment.studentId === student.id && (payment.status === 'paid' || payment.status === 'partial'))
          .reduce((paidSum, payment) => paidSum + Number(payment.amount || 0), 0);

        return sum + Math.max(0, structureAmount - studentPaid);
      }, 0);

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

      const alerts = announcements.slice(0, 6).map((announcement) => ({
        id: announcement.id,
        type: getAlertTypeFromPriority(announcement.priority),
        title: announcement.title,
        message: announcement.content,
        time: formatAlertTime(announcement.date),
      }));

      return {
        totalStudents: students.length,
        totalTeachers: teachers.length,
        totalClasses: Array.from(new Set(classSections.map((item) => normalizeClassKey(item.name)).filter(Boolean))).length,
        feesCollected: totalCollected,
        pendingFees: totalPending,
        attendancePercentage,
        alerts,
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
