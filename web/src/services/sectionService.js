import api from './api';

export const getSections = () => {
  return api.get('/sections/');
};

export const getSectionDetail = (sectionId) => {
  return api.get(`/sections/${sectionId}/`);
};

export const createSection = (sectionData) => {
  return api.post('/sections/', sectionData);
};

export const updateSection = (sectionId, sectionData) => {
  return api.put(`/sections/${sectionId}/`, sectionData);
};

export const deleteSection = (sectionId) => {
  return api.delete(`/sections/${sectionId}/`);
};
