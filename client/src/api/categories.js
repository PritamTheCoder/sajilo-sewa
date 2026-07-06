import api from './axiosInstance';

export const getCategories = () =>
  api.get('/categories').then((res) => res.data);

export const createCategory = (data) =>
  api.post('/categories', data).then((res) => res.data);

export const updateCategory = (id, data) =>
  api.put(`/categories/${id}`, data).then((res) => res.data);
