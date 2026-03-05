import api from './api';

type StudentPayload = Record<string, unknown>;

export const studentService = {
  // Get all students with filters
  getStudents: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    classId?: string;
    sectionId?: string;
    status?: string;
  }) => {
    const response = await api.get('/students', { params });
    return response.data;
  },

  // Get student by ID
  getStudentById: async (id: string) => {
    const response = await api.get(`/students/${id}`);
    return response.data;
  },

  // Create new student
  createStudent: async (data: StudentPayload) => {
    const response = await api.post('/students', data);
    return response.data;
  },

  // Update student
  updateStudent: async (id: string, data: StudentPayload) => {
    const response = await api.put(`/students/${id}`, data);
    return response.data;
  },

  // Delete student
  deleteStudent: async (id: string) => {
    const response = await api.delete(`/students/${id}`);
    return response.data;
  },

  // Get student statistics
  getStudentStats: async () => {
    const response = await api.get('/students/stats');
    return response.data;
  },
};
