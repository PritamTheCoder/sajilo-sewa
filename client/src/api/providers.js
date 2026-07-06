import api from './axiosInstance';

export const getProviders = (params) =>
  api.get('/providers', { params }).then((res) => res.data);

export const getProviderById = (id) =>
  api.get(`/providers/${id}`).then((res) => res.data);

export const getMyProviderProfile = () =>
  api.get('/providers/me').then((res) => res.data);

export const applyAsProvider = (data) =>
  api.post('/providers/apply', data).then((res) => res.data);

export const updateProviderProfile = (data) =>
  api.put('/providers/profile', data).then((res) => res.data);

export const uploadProviderPhoto = (formData) =>
  api.post('/providers/photo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((res) => res.data);
