import api from './api';

type AnnouncementPayload = Record<string, unknown>;

export const announcementService = {
  // Get all announcements
  getAnnouncements: async (params?: {
    page?: number;
    limit?: number;
    targetGroup?: string;
    isActive?: boolean;
  }) => {
    const response = await api.get('/announcements', { params });
    return response.data;
  },

  // Get announcement by ID
  getAnnouncementById: async (id: string) => {
    const response = await api.get(`/announcements/${id}`);
    return response.data;
  },

  // Get recent announcements
  getRecentAnnouncements: async (limit: number = 5) => {
    const response = await api.get('/announcements/recent', {
      params: { limit },
    });
    return response.data;
  },

  // Create announcement
  createAnnouncement: async (data: AnnouncementPayload) => {
    const response = await api.post('/announcements', data);
    return response.data;
  },

  // Update announcement
  updateAnnouncement: async (id: string, data: AnnouncementPayload) => {
    const response = await api.put(`/announcements/${id}`, data);
    return response.data;
  },

  // Delete announcement
  deleteAnnouncement: async (id: string) => {
    const response = await api.delete(`/announcements/${id}`);
    return response.data;
  },
};
