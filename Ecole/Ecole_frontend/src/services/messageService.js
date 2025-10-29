import api from '../api';

export const messageService = {
  getReceivedMessages: async (userId) => {
    const response = await api.get('/messages/received', { params: { user_id: userId } });
    return response.data;
  },

  getSentMessages: async (userId) => {
    const response = await api.get('/messages/sent', { params: { user_id: userId } });
    return response.data;
  },

  getConversations: async (userId) => {
    const response = await api.get('/messages/conversations', { params: { user_id: userId } });
    return response.data;
  },

  getConversation: async (userId, contactId) => {
    const response = await api.get(`/messages/conversation/${contactId}`, { params: { user_id: userId } });
    return response.data;
  },

  sendMessage: async (messageData) => {
    const payload = {
      expediteur: String(messageData.expediteur_id || messageData.expediteur),
      destinataire: String(messageData.destinataire_id || messageData.destinataire),
      sujet: messageData.sujet,
      contenu: messageData.contenu
    };
    const response = await api.post('/messages', payload);
    return response.data;
  },

  markAsRead: async (messageId) => {
    const response = await api.put(`/messages/${messageId}/read`);
    return response.data;
  },

  getUnreadCount: async (userId) => {
    const response = await api.get('/messages/unread-count', { params: { user_id: userId } });
    return response.data;
  },

  getUsers: async (userId, role) => {
    const response = await api.get('/messages/users', { params: { user_id: userId, role } });
    return response.data;
  },

  // Notifications
  getNotifications: async (userId) => {
    const response = await api.get('/notifications', { params: { user_id: userId } });
    return response.data;
  },

  markNotificationAsRead: async (notificationId) => {
    const response = await api.put(`/notifications/${notificationId}/read`);
    return response.data;
  },

  getUnreadNotificationCount: async (userId) => {
    const response = await api.get('/notifications/unread-count', { params: { user_id: userId } });
    return response.data;
  }
};
