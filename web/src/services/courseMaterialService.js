import api from './api';

const courseMaterialService = {
  // ============== COURSE MATERIALS ==============

  // Liste des matériaux
  getCourseMaterials: (params) => api.get('/courses/materials/', { params }),

  // Détail d'un matériel
  getCourseMaterialDetail: (id) => api.get(`/courses/materials/${id}/`),

  // Créer un matériel
  createCourseMaterial: (data) => {
    const formData = new FormData();

    formData.append('course', data.course);
    formData.append('title', data.title);

    if (data.description) {
      formData.append('description', data.description);
    }

    if (data.material_type) {
      formData.append('material_type', data.material_type);
    }

    if (data.file) {
      formData.append('file', data.file);
    }

    if (data.url) {
      formData.append('url', data.url);
    }

    if (data.is_public !== undefined) {
      formData.append('is_public', data.is_public);
    }

    return api.post('/courses/materials/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  // Mettre à jour un matériel
  updateCourseMaterial: (id, data) => {
    const formData = new FormData();

    if (data.title) {
      formData.append('title', data.title);
    }

    if (data.description) {
      formData.append('description', data.description);
    }

    if (data.material_type) {
      formData.append('material_type', data.material_type);
    }

    if (data.file) {
      formData.append('file', data.file);
    }

    if (data.url) {
      formData.append('url', data.url);
    }

    if (data.is_public !== undefined) {
      formData.append('is_public', data.is_public);
    }

    return api.put(`/courses/materials/${id}/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  // Supprimer un matériel
  deleteCourseMaterial: (id) => api.delete(`/courses/materials/${id}/`),

  // Matériaux d'un cours
  getCourseMaterialsByCourse: (courseId) => api.get('/courses/materials/', { params: { course: courseId } }),

  // Mes matériaux (enseignant)
  getMyCourseMaterials: () => api.get('/courses/materials/my_materials/'),

  // Télécharger un matériel
  downloadCourseMaterial: (id) => api.get(`/courses/materials/${id}/download/`, { responseType: 'blob' }),
};

export default courseMaterialService;

// Exports nommés pour la compatibilité
export const getCourseMaterials = courseMaterialService.getCourseMaterials;
export const getCourseMaterialDetail = courseMaterialService.getCourseMaterialDetail;
export const createCourseMaterial = courseMaterialService.createCourseMaterial;
export const updateCourseMaterial = courseMaterialService.updateCourseMaterial;
export const deleteCourseMaterial = courseMaterialService.deleteCourseMaterial;
export const getCourseMaterialsByCourse = courseMaterialService.getCourseMaterialsByCourse;
export const getMyCourseMaterials = courseMaterialService.getMyCourseMaterials;
export const downloadCourseMaterial = courseMaterialService.downloadCourseMaterial;
