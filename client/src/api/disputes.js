import api from './axiosInstance';

export const createDispute = (data) =>
  api.post('/disputes', data).then((res) => res.data);

export const getMyDisputes = () =>
  api.get('/disputes/my').then((res) => res.data);

export const getDisputes = (params) =>
  api.get('/disputes', { params }).then((res) => res.data);

export const resolveDispute = (id, data) =>
  api.put(`/disputes/${id}`, data).then((res) => res.data);
