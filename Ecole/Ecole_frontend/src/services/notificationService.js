import api from '../api';

export const notificationService = {
  getNotifications: async (userId) => {
    const response = await api.get('/notifications', { params: { user_id: userId } });
    return response.data;
  },

  createNotification: async (notificationData) => {
    const response = await api.post('/notifications', notificationData);
    return response.data;
  },

  markAsRead: async (notificationId) => {
    const response = await api.put(`/notifications/${notificationId}/read`);
    return response.data;
  },

  markAllAsRead: async (userId) => {
    const response = await api.put('/notifications/mark-all-read', { user_id: userId });
    return response.data;
  },

  getUnreadCount: async (userId) => {
    const response = await api.get('/notifications/unread-count', { params: { user_id: userId } });
    return response.data;
  },

  deleteNotification: async (notificationId) => {
    const response = await api.delete(`/notifications/${notificationId}`);
    return response.data;
  }
};
