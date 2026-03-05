import api from './api';

type AttendanceRecordPayload = {
  studentId: string;
  classId: string;
  sectionId: string;
  date: string;
  status: 'Present' | 'Absent' | 'Late' | 'Excused';
  remarks?: string;
};

type AttendanceUpdatePayload = Partial<Pick<AttendanceRecordPayload, 'status' | 'remarks'>>;

export const attendanceService = {
  // Mark attendance
  markAttendance: async (attendanceRecords: AttendanceRecordPayload[]) => {
    const response = await api.post('/attendance/mark', { attendanceRecords });
    return response.data;
  },

  // Get attendance by class
  getAttendanceByClass: async (
    classId: string,
    params?: {
      date?: string;
      startDate?: string;
      endDate?: string;
    }
  ) => {
    const response = await api.get(`/attendance/class/${classId}`, { params });
    return response.data;
  },

  // Get attendance by student
  getAttendanceByStudent: async (
    studentId: string,
    params?: {
      startDate?: string;
      endDate?: string;
      month?: string;
    }
  ) => {
    const response = await api.get(`/attendance/student/${studentId}`, { params });
    return response.data;
  },

  // Get attendance summary
  getAttendanceSummary: async (date?: string) => {
    const response = await api.get('/attendance/summary', {
      params: { date },
    });
    return response.data;
  },

  // Update attendance
  updateAttendance: async (id: string, data: AttendanceUpdatePayload) => {
    const response = await api.put(`/attendance/${id}`, data);
    return response.data;
  },
};
