import api from './api';

export const dashboardService = {
  // Get dashboard overview
  getOverview: async () => {
    const response = await api.get('/dashboard/overview');
    return response.data;
  },

  // Get attendance trends
  getAttendanceTrends: async (days: number = 7) => {
    const response = await api.get(`/dashboard/attendance-trends?days=${days}`);
    return response.data;
  },

  // Get fee trends
  getFeeTrends: async (months: number = 6) => {
    const response = await api.get(`/dashboard/fee-trends?months=${months}`);
    return response.data;
  },

  // Combined trends for charts
  getTrends: async () => {
    try {
      const [attendanceRes, feeRes] = await Promise.all([
        api.get('/dashboard/attendance-trends'),
        api.get('/dashboard/fee-trends')
      ]);
      
      return {
        success: true,
        data: {
          attendanceTrend: attendanceRes.data.data?.dailyTrend || [],
          classWiseAttendance: attendanceRes.data.data?.classWiseAttendance || [],
          feeCollection: feeRes.data.data?.monthlyTrend || []
        }
      };
    } catch (error) {
      console.error('Error fetching dashboard trends:', error);
      return { success: false, data: { attendanceTrend: [], classWiseAttendance: [], feeCollection: [] } };
    }
  }
};
