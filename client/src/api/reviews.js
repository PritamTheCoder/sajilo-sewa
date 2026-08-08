import api from './axiosInstance';

export const createReview = (data) =>
  api.post('/reviews', data).then((res) => res.data);

export const getProviderReviews = (providerId) =>
  api.get(`/reviews/provider/${providerId}`).then((res) => res.data);

export const updateReview = (reviewId, data) =>
  api.put(`/reviews/${reviewId}`, data).then((res) => res.data);

export const deleteReview = (reviewId) =>
  api.delete(`/reviews/${reviewId}`).then((res) => res.data);

export const replyToReview = (reviewId, reply) =>
  api.post(`/reviews/${reviewId}/reply`, { reply }).then((res) => res.data);
