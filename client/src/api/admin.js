import api from './axiosInstance';

export const getAdminProviders = () =>
  api.get('/admin/providers').then((res) => res.data);

export const approveOrRejectProvider = (id, isApproved, rejectionReason) =>
  api.put(`/admin/providers/${id}`, {
    is_approved: isApproved,
    rejection_reason: rejectionReason,
  }).then((res) => res.data);

export const getAdminAnalytics = () =>
  api.get('/admin/analytics').then((res) => res.data);

export const getAdminUsers = (params) =>
  api.get('/admin/users', { params }).then((res) => res.data);

export const updateUserStatus = (id, status, reason) =>
  api.put(`/admin/users/${id}/status`, { status, reason }).then((res) => res.data);

export const getAuditLog = (params) =>
  api.get('/admin/audit', { params }).then((res) => res.data);
