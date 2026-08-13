import api from './api';

// Employee endpoints
export const getEmployees = (params) => api.get('/hr/employees/', { params });
export const getEmployee = (id) => api.get(`/hr/employees/${id}/`);
export const createEmployee = (data) => api.post('/hr/employees/', data);
export const updateEmployee = (id, data) => api.patch(`/hr/employees/${id}/`, data);
export const deleteEmployee = (id) => api.delete(`/hr/employees/${id}/`);
export const getPotentialEmployees = () => api.get('/hr/employees/potential-employees/');

// Contract endpoints
export const getContracts = (params) => api.get('/hr/contracts/', { params });
export const getContract = (id) => api.get(`/hr/contracts/${id}/`);
export const createContract = (data) => api.post('/hr/contracts/', data);
export const updateContract = (id, data) => api.patch(`/hr/contracts/${id}/`, data);
export const deleteContract = (id) => api.delete(`/hr/contracts/${id}/`);

// Payroll endpoints
export const getPayrolls = (params) => api.get('/hr/payrolls/', { params });
export const getPayroll = (id) => api.get(`/hr/payrolls/${id}/`);
export const createPayroll = (data) => api.post('/hr/payrolls/', data);
export const updatePayroll = (id, data) => api.patch(`/hr/payrolls/${id}/`, data);
export const deletePayroll = (id) => api.delete(`/hr/payrolls/${id}/`);
export const markPayrollAsPaid = (id) => api.post(`/hr/payrolls/${id}/mark_paid/`);
export const generatePayslip = (id) => api.get(`/hr/payrolls/${id}/generate-payslip/`, { responseType: 'blob' });
export const calculatePrestation = (params) => api.get('/hr/payrolls/calculate-prestation/', { params });

// Leave endpoints
export const getLeaves = (params) => api.get('/hr/leaves/', { params });
export const getLeave = (id) => api.get(`/hr/leaves/${id}/`);
export const createLeave = (data) => api.post('/hr/leaves/', data);
export const updateLeave = (id, data) => api.patch(`/hr/leaves/${id}/`, data);
export const deleteLeave = (id) => api.delete(`/hr/leaves/${id}/`);
export const approveLeave = (id) => api.post(`/hr/leaves/${id}/approve/`);
export const rejectLeave = (id) => api.post(`/hr/leaves/${id}/reject/`);

export default {
  getEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getPotentialEmployees,
  getContracts,
  getContract,
  createContract,
  updateContract,
  deleteContract,
  getPayrolls,
  getPayroll,
  createPayroll,
  updatePayroll,
  deletePayroll,
  markPayrollAsPaid,
  generatePayslip,
  calculatePrestation,
  getLeaves,
  getLeave,
  createLeave,
  updateLeave,
  deleteLeave,
  approveLeave,
  rejectLeave,
};
