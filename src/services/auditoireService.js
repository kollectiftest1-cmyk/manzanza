import api from './api';

export const getAuditoires = () => {
  return api.get('/auditoires/');
};

export const getAuditoireDetail = (id) => {
  return api.get(`/auditoires/${id}/`);
};

export const getAuditoireStudents = (id) => {
  return api.get(`/auditoires/${id}/students/`);
};

export const getAuditoireCourses = (id) => {
  return api.get(`/auditoires/${id}/courses/`);
};

export const createAuditoire = (auditoireData) => {
  return api.post('/auditoires/', auditoireData);
};

export const updateAuditoire = (id, auditoireData) => {
  return api.put(`/auditoires/${id}/`, auditoireData);
};

export const deleteAuditoire = (id) => {
  return api.delete(`/auditoires/${id}/`);
};
