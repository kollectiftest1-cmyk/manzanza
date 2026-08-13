/**
 * Service API pour la gestion des assistants
 */
import api from './api'

export const assistantService = {
  // CRUD Assignations
  getAssignments: (params) => api.get('/courses/teacher-assistants/', { params }),

  getAssignment: (id) => api.get(`/courses/teacher-assistants/${id}/`),

  createAssignment: (data) => api.post('/courses/teacher-assistants/', data),

  updateAssignment: (id, data) => api.put(`/courses/teacher-assistants/${id}/`, data),

  deleteAssignment: (id) => api.delete(`/courses/teacher-assistants/${id}/`),

  // Actions spécifiques
  assignAssistant: (data) => api.post('/courses/teacher-assistants/assign/', data),

  detachAssistant: (id) => api.post(`/courses/teacher-assistants/${id}/detach/`),

  updatePermissions: (id, data) => api.patch(`/courses/teacher-assistants/${id}/update-permissions/`, data),

  // Mes assignations
  getMyAssignments: () => api.get('/courses/teacher-assistants/my-assignments/'),
}

export default assistantService
