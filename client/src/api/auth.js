import api from './axiosInstance';

// FastAPI returns { access_token, token_type } — store access_token, not the full object
export const register = (data) =>
  api.post('/auth/register', data).then((res) => res.data);

export const login = (data) =>
  api.post('/auth/login', data).then((res) => res.data);

export const getMe = () =>
  api.get('/auth/me').then((res) => res.data);

export const uploadUserPhoto = (formData) =>
  api.post('/auth/me/photo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((res) => res.data);

export const changePassword = (data) =>
  api.post('/auth/me/password', data).then((res) => res.data);

export const deactivateAccount = () =>
  api.post('/auth/me/deactivate').then((res) => res.data);
