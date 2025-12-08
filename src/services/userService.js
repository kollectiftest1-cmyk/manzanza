import api from './api';

export const getUsers = (params) => {
  return api.get('/users/', { params });
};

export const createUser = (userData) => {
  return api.post('/users/', userData);
};

export const updateUser = (userId, userData) => {
  return api.put(`/users/${userId}/`, userData);
};

export const deleteUser = (userId) => {
  return api.delete(`/users/${userId}/`);
};

export const getTeacherStatistics = (userId) => {
  return api.get(`/users/${userId}/teacher-stats/`);
};
