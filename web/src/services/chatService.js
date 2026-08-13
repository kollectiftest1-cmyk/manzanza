import api from './api';

const chatService = {
  // Chat channels
  getMyChannels: () => api.get('/chat/channels/my_channels/'),
  getChannel: (id) => api.get(`/chat/channels/${id}/`),
  getChannelMessages: (id) => api.get(`/chat/channels/${id}/messages/`),
  createChannel: (data) => api.post('/chat/channels/', data),
  updateChannel: (id, data) => api.put(`/chat/channels/${id}/`, data),
  deleteChannel: (id) => api.delete(`/chat/channels/${id}/`),

  // Messages
  getMessages: (channelId) => api.get('/chat/messages/', { params: { channel: channelId } }),
  sendMessage: (data) => api.post('/chat/messages/', data),
  updateMessage: (id, data) => api.put(`/chat/messages/${id}/`, data),
  deleteMessage: (id) => api.post(`/chat/messages/${id}/delete_message/`),

  // Reactions
  reactToMessage: (messageId, reactionType) =>
    api.post(`/chat/messages/${messageId}/react/`, { reaction_type: reactionType }),

  // Replies
  getMessageReplies: (messageId) => api.get(`/chat/messages/${messageId}/replies/`),
};

export default chatService;
