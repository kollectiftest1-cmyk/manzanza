import api from './api';

export const getSections = () => {
  return api.get('/auditoires/sections/');
};

export const getSectionDetail = (sectionId) => {
  return api.get(`/auditoires/sections/${sectionId}/`);
};

export const createSection = (sectionData) => {
  return api.post('/auditoires/sections/', sectionData);
};

export const updateSection = (sectionId, sectionData) => {
  return api.put(`/auditoires/sections/${sectionId}/`, sectionData);
};

export const deleteSection = (sectionId) => {
  return api.delete(`/auditoires/sections/${sectionId}/`);
};
