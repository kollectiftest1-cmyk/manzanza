import api from './api';

const courseService = {
  getCourses: () => api.get('/courses/'),
  getMyCourses: () => api.get('/courses/my_courses/'),
  getCourseDetail: (id) => api.get(`/courses/${id}/`),
  createCourse: (courseData) => api.post('/courses/', courseData),
  updateCourse: (id, courseData) => api.put(`/courses/${id}/`, courseData),
  deleteCourse: (id) => api.delete(`/courses/${id}/`),
  enrollCourse: (courseId) => api.post(`/courses/${courseId}/enroll/`),
};

export default courseService;

// Exports nommés pour la compatibilité avec le code existant
export const getCourses = courseService.getCourses;
export const getMyCourses = courseService.getMyCourses;
export const getCourseDetail = courseService.getCourseDetail;
export const createCourse = courseService.createCourse;
export const updateCourse = courseService.updateCourse;
export const deleteCourse = courseService.deleteCourse;
export const enrollCourse = courseService.enrollCourse;
