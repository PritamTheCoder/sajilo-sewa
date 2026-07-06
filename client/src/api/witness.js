import api from './axiosInstance';

export const inviteWitness = (data) =>
  api.post('/witnesses/invite', data).then((r) => r.data);

export const getMyWitnesses = () =>
  api.get('/witnesses/my').then((r) => r.data);

export const getVouchRequest = (token) =>
  api.get(`/witnesses/vouch/${token}`).then((r) => r.data);

export const submitVouch = (token, data) =>
  api.post(`/witnesses/vouch/${token}`, data).then((r) => r.data);

export const submitDecline = (token, data) =>
  api.post(`/witnesses/decline/${token}`, data).then((r) => r.data);

export const linkWitnessAfterRegister = (token) =>
  api.post(`/witnesses/link/${token}`).then((r) => r.data);
