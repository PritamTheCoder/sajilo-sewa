import api from './axiosInstance';

export const getPlatformStats = () =>
  api.get('/statistics').then((r) => r.data);
