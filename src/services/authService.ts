import api from './api';

type AdminRegistrationPayload = Record<string, unknown>;

export const authService = {
  // Login
  login: async (credentials: { email: string; password: string }) => {
    const response = await api.post('/auth/login', credentials);
    if (response.data.success && response.data.data.token) {
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('admin', JSON.stringify(response.data.data.admin));
    }
    return response.data;
  },

  // Register Admin
  registerAdmin: async (data: AdminRegistrationPayload) => {
    const response = await api.post('/auth/register-admin', data);
    if (response.data.success && response.data.data.token) {
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('admin', JSON.stringify(response.data.data.admin));
    }
    return response.data;
  },

  // Logout
  logout: async () => {
    const response = await api.post('/auth/logout');
    localStorage.removeItem('token');
    localStorage.removeItem('admin');
    return response.data;
  },

  // Get current admin
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // Get stored admin
  getStoredAdmin: () => {
    const admin = localStorage.getItem('admin');
    return admin ? JSON.parse(admin) : null;
  },

  // Check if authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },
};
