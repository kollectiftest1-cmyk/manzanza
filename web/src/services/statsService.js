import api from './api';

export const getSgaDashboardStats = () => {
  return api.get('/stats/sga/');
};
