import api from './axiosInstance';

export const getAdminProviders = () =>
  api.get('/admin/providers').then((res) => res.data);

export const approveOrRejectProvider = (id, isApproved) =>
  api.put(`/admin/providers/${id}`, { is_approved: isApproved }).then((res) => res.data);

export const getAdminAnalytics = () =>
  api.get('/admin/analytics').then((res) => res.data);
