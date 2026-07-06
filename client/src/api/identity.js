import api from './axiosInstance';

export const getMyIdentity = () =>
  api.get('/identity/me').then((r) => r.data);

export const submitIdentity = (data) =>
  api.post('/identity/submit', data).then((r) => r.data);

export const uploadIdentityDocument = (docType, formData) =>
  api.post(`/identity/upload/${docType}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((r) => r.data);

export const getPendingIdentities = () =>
  api.get('/identity/pending').then((r) => r.data);

export const reviewIdentity = (userId, data) =>
  api.put(`/identity/review/${userId}`, data).then((r) => r.data);
