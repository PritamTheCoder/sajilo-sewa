import api from './axiosInstance';

export const getNotifications = () =>
  api.get('/notifications').then((res) => res.data);

export const getUnreadCount = () =>
  api.get('/notifications/unread-count').then((res) => res.data);

export const markNotificationRead = (notificationId) =>
  api.put(`/notifications/${notificationId}/read`).then((res) => res.data);

export const markAllNotificationsRead = () =>
  api.put('/notifications/read-all').then((res) => res.data);
