import api from './api';

export const getAcademicCalendarEvents = () => {
  return api.get('/core/academic-calendar/');
};
