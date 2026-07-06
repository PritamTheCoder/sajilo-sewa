import api from './axiosInstance';

export const getOpenJobs = (params) =>
  api.get('/jobs', { params }).then((r) => r.data);

export const getMyListings = () =>
  api.get('/jobs/my').then((r) => r.data);

export const getMyApplications = () =>
  api.get('/jobs/applied').then((r) => r.data);

export const getJobById = (id) =>
  api.get(`/jobs/${id}`).then((r) => r.data);

export const createJobListing = (data) =>
  api.post('/jobs', data).then((r) => r.data);

export const updateJobListing = (id, data) =>
  api.put(`/jobs/${id}`, data).then((r) => r.data);

export const closeJobListing = (id) =>
  api.delete(`/jobs/${id}`).then((r) => r.data);

export const applyToJob = (listingId, data) =>
  api.post(`/jobs/${listingId}/apply`, data).then((r) => r.data);

export const awardJob = (listingId, applicationId) =>
  api.post(`/jobs/${listingId}/award/${applicationId}`).then((r) => r.data);
