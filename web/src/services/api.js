/**
 * API Service - Configuration centralisée pour les appels API backend
 * Compatible avec le backend Django REST Framework
 */

import axios from 'axios';
import { notifyIfUnhandled } from '../utils/notify';

// Configuration de base
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Créer une instance axios avec configuration par défaut
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 secondes
  // Le refresh token est un cookie httpOnly (jamais lisible par le JavaScript) :
  withCredentials: true,
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

let refreshPromise = null;

// Intercepteur pour gérer les erreurs et rafraîchir le token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Si erreur 401 et pas déjà tenté de rafraîchir
    if (error.response?.status === 401 && !originalRequest._retry && !String(originalRequest.url).includes('/auth/login')) {
      originalRequest._retry = true;

      try {
        // Un seul rafraîchissement à la fois, partagé par les requêtes en échec.
        if (!refreshPromise) {
          refreshPromise = axios.post(`${API_BASE_URL}/auth/token/refresh/`, {}, {
            withCredentials: true, headers: { 'X-Auth-Mode': 'cookie' },
          }).finally(() => { refreshPromise = null; });
        }
        const response = await refreshPromise;
        const { access } = response.data;
        localStorage.setItem('access_token', access);
        originalRequest.headers.Authorization = `Bearer ${access}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Si le refresh échoue, déconnecter l'utilisateur
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        if (!window.location.pathname.startsWith('/login')) window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Toute modification (POST/PUT/PATCH/DELETE) refusée est signalée à l'utilisateur,
    // même si l'écran ne traite pas l'erreur (connexion exclue : l'écran affiche son message).
    const method = String(originalRequest?.method || '').toLowerCase();
    if (['post', 'put', 'patch', 'delete'].includes(method) && !String(originalRequest?.url).includes('/auth/')) {
      notifyIfUnhandled(error);
    }
    return Promise.reject(error);
  }
);

// ============================================
// AUTHENTICATION
// ============================================

export const authAPI = {
  login: (credentials) => api.post('/auth/login/', credentials, { headers: { 'X-Auth-Mode': 'cookie' } }),
  logout: () => api.post('/auth/logout/', {}),
  register: (userData) => api.post('/auth/users/', userData), // This one is correct as it's for user registration via auth app
  getCurrentUser: () => api.get('/auth/users/me/'), // This one is correct as it's for current user via auth app
  updateProfile: (data) => api.put('/auth/users/update_profile/', data), // This one is correct as it's for current user via auth app
  changePassword: (data) => api.post('/auth/users/change_password/', data), // This one is correct as it's for current user via auth app
  refreshToken: () => api.post('/auth/token/refresh/', {}, { headers: { 'X-Auth-Mode': 'cookie' } }),
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
  getStudents: (params) => api.get('/students/', { params }), // New endpoint for students
  getTeachers: (params) => api.get('/teachers/', { params }), // New endpoint for teachers
};

// ============================================
// COURSES
// ============================================

export const coursesAPI = {
  getAll: (params) => api.get('/courses/', { params }),
  getById: (id) => api.get(`/courses/${id}/`),
  create: (data) => api.post('/courses/', data),
  update: (id, data) => api.put(`/courses/${id}/`, data),
  delete: (id) => api.delete(`/courses/${id}/`),
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
  submitAttempt: (quizId, data) => api.post(`/quiz/${quizId}/submit_attempt/`, data),
  getAttempts: (params) => api.get('/quiz/attempts/', { params }),
  getMyAttempts: () => api.get('/quiz/attempts/'),

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
  updateMessage: (id, data) => api.put(`/chat/messages/${id}/`, data),
  deleteMessage: (id) => api.post(`/chat/messages/${id}/delete_message/`),
  reactToMessage: (id, reactionType) => api.post(`/chat/messages/${id}/react/`, { reaction_type: reactionType }),
  getReplies: (id) => api.get(`/chat/messages/${id}/replies/`),
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
  // Le motif est obligatoire (traçabilité) : demandé à la caisse si absent.
  rejectPayment: (id, reason) => api.post(`/payments/${id}/reject/`, { reason: reason ?? window.prompt("Motif du rejet du paiement :") ?? "" }),
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
// Corbeille, journal d'audit et paramètres système (apps.core)
export const trashAPI = {
  list: (params) => api.get('/core/trash/', { params }),
  contents: (id) => api.get(`/core/trash/${id}/contents/`),
  restore: (id) => api.post(`/core/trash/${id}/restore/`),
  getSettings: () => api.get('/core/settings/'),
  updateSettings: (data) => api.patch('/core/settings/', data),
  auditLogs: (params) => api.get('/core/audit-logs/', { params }),
};

// ============================================
// SCOLARITÉ (inscriptions annuelles, UE, délibérations, documents) — refonte v2
// ============================================
export const scolariteAPI = {
  ues: (params) => api.get('/scolarite/ues/', { params }),
  memoires: (params) => api.get('/scolarite/memoires/', { params }),
  memoireOptions: () => api.get('/scolarite/memoires/options/'),
  createMemoire: (data) => api.post('/scolarite/memoires/', data),
  updateMemoire: (id, data) => api.patch(`/scolarite/memoires/${id}/`, data),
  decideMemoire: (id, accept, motif) => api.post(`/scolarite/memoires/${id}/decide/`, { accept, motif }),
  depositMemoire: (id, file) => { const fd = new FormData(); fd.append('fichier', file); return api.post(`/scolarite/memoires/${id}/deposit/`, fd, { headers: { 'Content-Type': undefined } }) },
  scheduleMemoire: (id, data) => api.post(`/scolarite/memoires/${id}/schedule/`, data),
  gradeMemoire: (id, data) => api.post(`/scolarite/memoires/${id}/grade/`, data),
  createUE: (data) => api.post('/scolarite/ues/', data),
  updateUE: (id, data) => api.patch(`/scolarite/ues/${id}/`, data),
  deleteUE: (id) => api.delete(`/scolarite/ues/${id}/`),
  ueCandidates: (id) => api.get(`/scolarite/ues/${id}/candidates/`),
  setUECourses: (id, courses) => api.post(`/scolarite/ues/${id}/set-courses/`, { courses }),

  inscriptions: (params) => api.get('/scolarite/inscriptions/', { params }),
  inscription: (id) => api.get(`/scolarite/inscriptions/${id}/`),
  myInscriptions: () => api.get('/scolarite/inscriptions/me/'),
  createInscription: (data) => api.post('/scolarite/inscriptions/', data),
  validateAdmin: (id, force = false) => api.post(`/scolarite/inscriptions/${id}/validate-admin/`, { force }),
  validatePeda: (id) => api.post(`/scolarite/inscriptions/${id}/validate-peda/`),
  changeStatus: (id, statut, reason) => api.post(`/scolarite/inscriptions/${id}/change-status/`, { statut, reason }),

  affectations: (params) => api.get('/scolarite/affectations/', { params }),
  createAffectation: (data) => api.post('/scolarite/affectations/', data),
  updateAffectation: (id, data) => api.patch(`/scolarite/affectations/${id}/`, data),
  deleteAffectation: (id) => api.delete(`/scolarite/affectations/${id}/`),

  deliberations: (params) => api.get('/scolarite/deliberations/', { params }),
  createDeliberation: (data) => api.post('/scolarite/deliberations/', data),
  deliberationResults: (id) => api.get(`/scolarite/deliberations/${id}/resultats/`),
  openDeliberation: (id, force = false) => api.post(`/scolarite/deliberations/${id}/open/`, { force }),
  computeDeliberation: (id) => api.post(`/scolarite/deliberations/${id}/compute/`),
  closeDeliberation: (id) => api.post(`/scolarite/deliberations/${id}/close/`),
  publishDeliberation: (id, publication_date) => api.post(`/scolarite/deliberations/${id}/publish/`, { publication_date }),
  downloadPV: (id) => api.get(`/scolarite/deliberations/${id}/pv/`, { responseType: 'blob' }),
  prepareReinscriptions: (id, academic_year) => api.post(`/scolarite/deliberations/${id}/prepare-reinscriptions/`, { academic_year }),
  overrideResult: (id, data) => api.post(`/scolarite/resultats/${id}/override/`, data),
  myResults: () => api.get('/scolarite/resultats/me/'),
  myClearance: () => api.get('/scolarite/clearance/me/'),

  documents: (params) => api.get('/scolarite/documents/', { params }),
  issueDocument: (data) => api.post('/scolarite/documents/issue/', data),
  downloadDocument: (id) => api.get(`/scolarite/documents/${id}/download/`, { responseType: 'blob' }),
  revokeDocument: (id, reason) => api.post(`/scolarite/documents/${id}/revoke/`, { reason }),
  verify: (code) => api.get(`/scolarite/verify/${code}/`),
};

export const gradeWorkflowAPI = {
  sheets: (params) => api.get('/grades/sheets/', { params }),
  mySheets: (session = 1) => api.get('/grades/sheets/mine/', { params: { session } }),
  submit: (id) => api.post(`/grades/sheets/${id}/submit/`),
  approve: (id) => api.post(`/grades/sheets/${id}/approve/`),
  sendBack: (id, reason) => api.post(`/grades/sheets/${id}/send-back/`, { reason }),
  corrections: (params) => api.get('/grades/corrections/', { params }),
  requestCorrection: (data) => api.post('/grades/corrections/', data),
  decideCorrection: (id, accept, note) => api.post(`/grades/corrections/${id}/decide/`, { accept, note }),
};

export const financeAPI = {
  baremes: (params) => api.get('/payments/baremes/', { params }),
  createBareme: (data) => api.post('/payments/baremes/', data),
  updateBareme: (id, data) => api.patch(`/payments/baremes/${id}/`, data),
  deleteBareme: (id) => api.delete(`/payments/baremes/${id}/`),
  applyBareme: (id) => api.post(`/payments/baremes/${id}/apply/`),
  feeTypes: () => api.get('/payments/fee-types/'),
  cashSessions: (params) => api.get('/payments/cash-sessions/', { params }),
  currentCashSession: () => api.get('/payments/cash-sessions/current/'),
  openCashSession: (opening_float) => api.post('/payments/cash-sessions/open/', { opening_float }),
  closeCashSession: (id, counted, justification) => api.post(`/payments/cash-sessions/${id}/close/`, { counted, justification }),
  contrepassations: (params) => api.get('/payments/contrepassations/', { params }),
  requestContrepassation: (payment, reason) => api.post('/payments/contrepassations/', { payment, reason }),
  decideContrepassation: (id, approve, note) => api.post(`/payments/contrepassations/${id}/decide/`, { approve, note }),
  payments: (params) => api.get('/payments/', { params }),
};

export const pilotageAPI = {
  kpis: (params) => api.get('/stats/kpis/', { params }),
  exportCSV: (kind, params) => api.get(`/stats/export/${kind}/`, { params, responseType: 'blob' }),
};

export const academicYearsAPI = {
  list: () => api.get('/schedules/academic-years/', { params: { page_size: 100 } }),
};

export const filieresAPI = {
  getAll: (params) => api.get('/filieres/', { params }),
};

export const sectionsAPI = {
  getAll: (params) => api.get('/sections/', { params }),
};

export const admissionAPI = {
  verifyDossier: (id, dossier_status, comment) => api.post(`/inscriptions/${id}/verify-dossier/`, { dossier_status, comment }),
  markFeePaid: (id, reference) => api.post(`/inscriptions/${id}/mark-fee-paid/`, { reference }),
  waitlist: (id, comment) => api.post(`/inscriptions/${id}/waitlist/`, { comment }),
};

/** Enregistre une réponse blob (PDF, CSV) sous le nom indiqué. */
export const saveBlob = (response, fallbackName) => {
  const disposition = response.headers?.['content-disposition'] || ''
  const match = disposition.match(/filename="?([^";]+)"?/)
  const url = URL.createObjectURL(response.data)
  const a = document.createElement('a')
  a.href = url
  a.download = match ? match[1] : fallbackName
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export default api;
