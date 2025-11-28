import api from './api';

// Fetch all filieres, optionally filtered by section
export const getFilieres = (sectionId = null) => {
  const params = sectionId ? { section: sectionId } : {};
  return api.get('/auditoires/filieres/', { params });
};

// Fetch a single filiere's details
export const getFiliereDetail = (id) => {
  return api.get(`/auditoires/filieres/${id}/`);
};

// Create a new filiere
export const createFiliere = (filiereData) => {
  return api.post('/auditoires/filieres/', filiereData);
};

// Update a filiere
export const updateFiliere = (id, filiereData) => {
  return api.put(`/auditoires/filieres/${id}/`, filiereData);
};

// Delete a filiere
export const deleteFiliere = (id) => {
  return api.delete(`/auditoires/filieres/${id}/`);
};
