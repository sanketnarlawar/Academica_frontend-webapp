import api from './api';

type FeeStructurePayload = Record<string, unknown>;
type FeePaymentPayload = Record<string, unknown>;

export const financeService = {
  // Fee Structure
  getFeeStructures: async (params?: {
    classId?: string;
    academicYear?: string;
    isActive?: boolean;
  }) => {
    const response = await api.get('/fees/structure', { params });
    return response.data;
  },

  createFeeStructure: async (data: FeeStructurePayload) => {
    const response = await api.post('/fees/structure', data);
    return response.data;
  },

  updateFeeStructure: async (id: string, data: FeeStructurePayload) => {
    const response = await api.put(`/fees/structure/${id}`, data);
    return response.data;
  },

  deleteFeeStructure: async (id: string) => {
    const response = await api.delete(`/fees/structure/${id}`);
    return response.data;
  },

  // Fee Payments
  getFeePayments: async (params?: {
    page?: number;
    limit?: number;
    studentId?: string;
    academicYear?: string;
    status?: string;
  }) => {
    const response = await api.get('/fees/payments', { params });
    return response.data;
  },

  getFeePaymentById: async (id: string) => {
    const response = await api.get(`/fees/payments/${id}`);
    return response.data;
  },

  createFeePayment: async (data: FeePaymentPayload) => {
    const response = await api.post('/fees/payments', data);
    return response.data;
  },

  updateFeePayment: async (id: string, data: FeePaymentPayload) => {
    const response = await api.put(`/fees/payments/${id}`, data);
    return response.data;
  },

  // Pending Fees
  getPendingFees: async (params?: { academicYear?: string }) => {
    const response = await api.get('/fees/pending', { params });
    return response.data;
  },
};
