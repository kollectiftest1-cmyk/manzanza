import axios from 'axios';
import { getAuthToken } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const hrApi = axios.create({
  baseURL: `${API_URL}/hr`,
});

hrApi.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Employee endpoints
export const getEmployees = (params) => hrApi.get('/employees/', { params });
export const getEmployee = (id) => hrApi.get(`/employees/${id}/`);
export const createEmployee = (data) => hrApi.post('/employees/', data);
export const updateEmployee = (id, data) => hrApi.put(`/employees/${id}/`, data);
export const deleteEmployee = (id) => hrApi.delete(`/employees/${id}/`);
export const getPotentialEmployees = () => hrApi.get('/employees/potential-employees/');

// Contract endpoints
export const getContracts = (params) => hrApi.get('/contracts/', { params });
export const getContract = (id) => hrApi.get(`/contracts/${id}/`);
export const createContract = (data) => hrApi.post('/contracts/', data);
export const updateContract = (id, data) => hrApi.put(`/contracts/${id}/`, data);
export const deleteContract = (id) => hrApi.delete(`/contracts/${id}/`);

// Payroll endpoints
export const getPayrolls = (params) => hrApi.get('/payrolls/', { params });
export const getPayroll = (id) => hrApi.get(`/payrolls/${id}/`);
export const createPayroll = (data) => hrApi.post('/payrolls/', data);
export const updatePayroll = (id, data) => hrApi.put(`/payrolls/${id}/`, data);
export const deletePayroll = (id) => hrApi.delete(`/payrolls/${id}/`);
export const markPayrollAsPaid = (id) => hrApi.post(`/payrolls/${id}/mark_paid/`);
export const generatePayslip = (id) => hrApi.get(`/payrolls/${id}/generate-payslip/`, { responseType: 'blob' });

// Leave endpoints
export const getLeaves = (params) => hrApi.get('/leaves/', { params });
export const getLeave = (id) => hrApi.get(`/leaves/${id}/`);
export const createLeave = (data) => hrApi.post('/leaves/', data);
export const updateLeave = (id, data) => hrApi.put(`/leaves/${id}/`, data);
export const deleteLeave = (id) => hrApi.delete(`/leaves/${id}/`);
export const approveLeave = (id) => hrApi.post(`/leaves/${id}/approve/`);
export const rejectLeave = (id) => hrApi.post(`/leaves/${id}/reject/`);

export default hrApi;
