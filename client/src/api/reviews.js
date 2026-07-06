import api from './axiosInstance';

export const createReview = (data) =>
  api.post('/reviews', data).then((res) => res.data);

export const getProviderReviews = (providerId) =>
  api.get(`/reviews/provider/${providerId}`).then((res) => res.data);
