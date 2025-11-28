import api from './api';

export const getCourses = () => {
  return api.get('/courses/');
};

export const getMyCourses = () => {
  return api.get('/courses/my_courses/');
};

export const getCourseDetail = (id) => {
  return api.get(`/courses/${id}/`);
};

export const createCourse = (courseData) => {
  return api.post('/courses/', courseData);
};

export const updateCourse = (id, courseData) => {
  return api.put(`/courses/${id}/`, courseData);
};

export const deleteCourse = (id) => {
  return api.delete(`/courses/${id}/`);
};

export const enrollCourse = (courseId) => {
  return api.post(`/courses/${courseId}/enroll/`);
};
