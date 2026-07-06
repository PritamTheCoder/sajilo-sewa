import api from './axiosInstance';

export const createBooking = (data) =>
  api.post('/bookings', data).then((res) => res.data);

export const getMyBookings = () =>
  api.get('/bookings/my').then((res) => res.data);

export const getIncomingBookings = () =>
  api.get('/bookings/incoming').then((res) => res.data);

export const updateBookingStatus = (bookingId, status) =>
  api.put(`/bookings/${bookingId}/status`, { status }).then((res) => res.data);

export const cancelBooking = (bookingId, reason) =>
  api.delete(`/bookings/${bookingId}`, { data: { cancellation_reason: reason } }).then((res) => res.data);
