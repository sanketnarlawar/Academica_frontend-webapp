import api from './api';

type TeacherPayload = Record<string, unknown>;

export const teacherService = {
  // Get all teachers with filters
  getTeachers: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }) => {
    const response = await api.get('/teachers', { params });
    return response.data;
  },

  // Get teacher by ID
  getTeacherById: async (id: string) => {
    const response = await api.get(`/teachers/${id}`);
    return response.data;
  },

  // Create new teacher
  createTeacher: async (data: TeacherPayload) => {
    const response = await api.post('/teachers', data);
    return response.data;
  },

  // Update teacher
  updateTeacher: async (id: string, data: TeacherPayload) => {
    const response = await api.put(`/teachers/${id}`, data);
    return response.data;
  },

  // Delete teacher
  deleteTeacher: async (id: string) => {
    const response = await api.delete(`/teachers/${id}`);
    return response.data;
  },

  // Get teacher statistics
  getTeacherStats: async () => {
    const response = await api.get('/teachers/stats');
    return response.data;
  },
};
