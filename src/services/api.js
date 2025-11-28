/**
 * API Service - Configuration centralisée pour les appels API backend
 * Compatible avec le backend Django REST Framework
 */

import axios from 'axios';

// Configuration de base
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Créer une instance axios avec configuration par défaut
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 secondes
});

// Intercepteur pour ajouter le token JWT à chaque requête
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs et rafraîchir le token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Si erreur 401 et pas déjà tenté de rafraîchir
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
            refresh: refreshToken,
          });

          const { access } = response.data;
          localStorage.setItem('access_token', access);

          // Réessayer la requête originale avec le nouveau token
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Si le refresh échoue, déconnecter l'utilisateur
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// ============================================
// AUTHENTICATION
// ============================================

export const authAPI = {
  login: (credentials) => api.post('/auth/login/', credentials),
  logout: () => api.post('/auth/logout/', {
    refresh: localStorage.getItem('refresh_token')
  }),
  register: (userData) => api.post('/auth/users/', userData), // This one is correct as it's for user registration via auth app
  getCurrentUser: () => api.get('/auth/users/me/'), // This one is correct as it's for current user via auth app
  updateProfile: (data) => api.put('/auth/users/update_profile/', data), // This one is correct as it's for current user via auth app
  changePassword: (data) => api.post('/auth/users/change_password/', data), // This one is correct as it's for current user via auth app
  refreshToken: (refreshToken) => api.post('/auth/token/refresh/', { refresh: refreshToken }),
};

// ============================================
// USERS
// ============================================

export const usersAPI = {
  getAll: (params) => api.get('/users/', { params }),
  getById: (id) => api.get(`/users/${id}/`),
  create: (data) => api.post('/users/', data),
  update: (id, data) => api.put(`/users/${id}/`, data),
  delete: (id) => api.delete(`/users/${id}/`),
  getByRole: (role) => api.get('/users/by_role/', { params: { role } }),
};

// ============================================
// COURSES
// ============================================

export const coursesAPI = {
  getAll: (params) => api.get('/courses/', { params }),
  getById: (id) => api.get(`/courses/${id}/`),
  create: (data) => api.post('/courses/', data),
  update: (id, data) => api.put(`/courses/${id}/`, data),
  delete: (id) => api.delete('/courses/', data),
  getMyCourses: () => api.get('/courses/my_courses/'),
  enroll: (id) => api.post(`/courses/${id}/enroll/`),
  unenroll: (id) => api.post(`/courses/${id}/unenroll/`),

  // Materials
  getMaterials: (params) => api.get('/courses/materials/', { params }),
  createMaterial: (data) => api.post('/courses/materials/', data),

  // Enrollments
  getEnrollments: (params) => api.get('/courses/enrollments/', { params }),
};

// ============================================
// AUDITOIRES
// ============================================

export const auditoiresAPI = {
  getAll: (params) => api.get('/auditoires/', { params }),
  getById: (id) => api.get(`/auditoires/${id}/`),
  create: (data) => api.post('/auditoires/', data),
  update: (id, data) => api.put(`/auditoires/${id}/`, data),
  delete: (id) => api.delete(`/auditoires/${id}/`),
  getStudents: (id) => api.get(`/auditoires/${id}/students/`),
  getCourses: (id) => api.get(`/auditoires/${id}/courses/`),
};

// ============================================
// QUIZ
// ============================================

export const quizAPI = {
  getAll: (params) => api.get('/quiz/', { params }),
  getById: (id) => api.get(`/quiz/${id}/`),
  create: (data) => api.post('/quiz/', data),
  update: (id, data) => api.put(`/quiz/${id}/`, data),
  delete: (id) => api.delete(`/quiz/${id}/`),
  getMyQuizzes: () => api.get('/quiz/my_quizzes/'),

  // Attempts
  startAttempt: (quizId) => api.post(`/quiz/${quizId}/start_attempt/`),
  submitAttempt: (quizId, answers) => api.post(`/quiz/${quizId}/submit_attempt/`, { answers }),
  getAttempts: (params) => api.get('/quiz/attempts/', { params }),

  // Questions
  getQuestions: (params) => api.get('/quiz/questions/', { params }),
  createQuestion: (data) => api.post('/quiz/questions/', data),
};

// ============================================
// CHAT
// ============================================

export const chatAPI = {
  // Channels
  getChannels: (params) => api.get('/chat/channels/', { params }),
  getChannelById: (id) => api.get(`/chat/channels/${id}/`),
  createChannel: (data) => api.post('/chat/channels/', data),
  getChannelMessages: (id) => api.get(`/chat/channels/${id}/messages/`),

  // Messages
  getMessages: (params) => api.get('/chat/messages/', { params }),
  sendMessage: (data) => api.post('/chat/messages/', data),
  updateMessage: (id, data) => api.put('/chat/messages/${id}/', data),
  deleteMessage: (id) => api.post('/chat/messages/${id}/delete_message/'),
  reactToMessage: (id, reactionType) => api.post('/chat/messages/${id}/react/', { reaction_type: reactionType }),
  getReplies: (id) => api.get('/chat/messages/${id}/replies/'),
};

// ============================================
// ASSIGNMENTS (TP/TD)
// ============================================

export const assignmentsAPI = {
  // Assignments
  getAll: (params) => api.get('/assignments/', { params }),
  getById: (id) => api.get(`/assignments/${id}/`),
  create: (data) => api.post('/assignments/', data),
  update: (id, data) => api.put(`/assignments/${id}/`, data),
  delete: (id) => api.delete(`/assignments/${id}/`),

  // Submissions
  submit: (assignmentId, data) => api.post(`/assignments/${assignmentId}/submit/`, data),
  getSubmissions: (params) => api.get('/assignments/submissions/', { params }),
  getAssignmentSubmissions: (id) => api.get(`/assignments/${id}/submissions/`),
  gradeSubmission: (submissionId, data) => api.post(`/assignments/submissions/${submissionId}/grade/`, data),
  addComment: (submissionId, comment) => api.post(`/assignments/submissions/${submissionId}/add_comment/`, { comment }),
};

// ============================================
// LIBRARY
// ============================================

export const libraryAPI = {
  // Books
  getBooks: (params) => api.get('/library/books/', { params }),
  getBookById: (id) => api.get(`/library/books/${id}/`),
  createBook: (data) => api.post('/library/books/', data, {
    headers: {
      'Content-Type': undefined, // Let Axios set the correct 'multipart/form-data' header
    },
  }),
  updateBook: (id, data) => api.put(`/library/books/${id}/`, data),
  deleteBook: (id) => api.delete(`/library/books/${id}/`),
  borrowBook: (id) => api.post(`/library/books/${id}/borrow/`),
  reserveBook: (id) => api.post(`/library/books/${id}/reserve/`),

  // Loans
  getLoans: (params) => api.get('/library/loans/', { params }),
  getMyLoans: () => api.get('/library/loans/my_loans/'),
  returnBook: (loanId) => api.post(`/library/loans/${loanId}/return_book/`),

  // Reservations
  getReservations: (params) => api.get('/library/reservations/', { params }),
  cancelReservation: (id) => api.post(`/library/reservations/${id}/cancel/`),
};

// ============================================
// PAYMENTS
// ============================================

export const paymentsAPI = {
  // Fee Types
  getFeeTypes: (params) => api.get('/payments/fee-types/', { params }),

  // Student Fees
  getStudentFees: (params) => api.get('/payments/student-fees/', { params }),
  getMyFees: () => api.get('/payments/student-fees/my_fees/'),
  getStatistics: () => api.get('/payments/student-fees/statistics/'),

  // Payments
  getPayments: (params) => api.get('/payments/', { params }),
  createPayment: (data) => api.post('/payments/', data),
  confirmPayment: (id) => api.post(`/payments/${id}/confirm/`),
  rejectPayment: (id) => api.post(`/payments/${id}/reject/`),
};

// ============================================
// HR (Human Resources)
// ============================================

export const hrAPI = {
  // Employees
  getEmployees: (params) => api.get('/hr/employees/', { params }),
  getEmployeeById: (id) => api.get(`/hr/employees/${id}/`),
  createEmployee: (data) => api.post('/hr/employees/', data),
  updateEmployee: (id, data) => api.put(`/hr/employees/${id}/`, data),

  // Contracts
  getContracts: (params) => api.get('/hr/contracts/', { params }),
  createContract: (data) => api.post('/hr/contracts/', data),

  // Payrolls
  getPayrolls: (params) => api.get('/hr/payrolls/', { params }),
  createPayroll: (data) => api.post('/hr/payrolls/', data),
  markPaid: (id) => api.post(`/hr/payrolls/${id}/mark_paid/`),

  // Leaves
  getLeaves: (params) => api.get('/hr/leaves/', { params }),
  createLeave: (data) => api.post('/hr/leaves/', data),
  approveLeave: (id) => api.post(`/hr/leaves/${id}/approve/`),
  rejectLeave: (id) => api.post(`/hr/leaves/${id}/reject/`),
};

// ============================================
// NOTIFICATIONS
// ============================================

export const notificationsAPI = {
  getAll: (params) => api.get('/notifications/', { params }),
  getUnread: () => api.get('/notifications/unread/'),
  getUnreadCount: () => api.get('/notifications/unread_count/'),
  markAsRead: (id) => api.post(`/notifications/${id}/mark_read/`),
  markAllAsRead: () => api.post('/notifications/mark_all_read/'),
  clearAll: () => api.delete('/notifications/clear_all/'),

  // Announcements
  getAnnouncements: (params) => api.get('/notifications/announcements/', { params }),
  getPinnedAnnouncements: () => api.get('/notifications/announcements/pinned/'),
  createAnnouncement: (data) => api.post('/notifications/announcements/', data),
};

// Export de l'instance axios par défaut
export default api;
