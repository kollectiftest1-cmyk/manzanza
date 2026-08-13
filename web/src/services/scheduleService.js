/**
 * Service for Academic Schedule & Calendar API
 * Endpoints: /api/schedules/
 */
import api from './api'

const scheduleService = {
  // ─── Academic Years ───────────────────────────────────────────────────────
  getAcademicYears: (params = {}) => api.get('/schedules/academic-years/', { params }).then(r => r.data),
  getAcademicYear: (id) => api.get(`/schedules/academic-years/${id}/`).then(r => r.data),
  createAcademicYear: (data) => api.post('/schedules/academic-years/', data).then(r => r.data),
  updateAcademicYear: (id, data) => api.put(`/schedules/academic-years/${id}/`, data).then(r => r.data),
  deleteAcademicYear: (id) => api.delete(`/schedules/academic-years/${id}/`),
  setCurrentYear: (id) => api.post(`/schedules/academic-years/${id}/set-current/`).then(r => r.data),

  // ─── Terms (Trimestres/Semestres) ─────────────────────────────────────────
  getTerms: (params = {}) => api.get('/schedules/terms/', { params }).then(r => r.data),
  getTerm: (id) => api.get(`/schedules/terms/${id}/`).then(r => r.data),
  createTerm: (data) => api.post('/schedules/terms/', data).then(r => r.data),
  updateTerm: (id, data) => api.put(`/schedules/terms/${id}/`, data).then(r => r.data),
  deleteTerm: (id) => api.delete(`/schedules/terms/${id}/`),

  // ─── Academic Events ──────────────────────────────────────────────────────
  getAcademicEvents: (params = {}) => api.get('/schedules/academic-events/', { params }).then(r => r.data),
  createAcademicEvent: (data) => api.post('/schedules/academic-events/', data).then(r => r.data),
  updateAcademicEvent: (id, data) => api.put(`/schedules/academic-events/${id}/`, data).then(r => r.data),
  deleteAcademicEvent: (id) => api.delete(`/schedules/academic-events/${id}/`),

  // ─── Rooms ────────────────────────────────────────────────────────────────
  getRooms: () => api.get('/schedules/rooms/').then(r => r.data),
  createRoom: (data) => api.post('/schedules/rooms/', data).then(r => r.data),
  updateRoom: (id, data) => api.put(`/schedules/rooms/${id}/`, data).then(r => r.data),
  deleteRoom: (id) => api.delete(`/schedules/rooms/${id}/`),

  // ─── Time Slots ───────────────────────────────────────────────────────────
  getTimeslots: () => api.get('/schedules/timeslots/').then(r => r.data),
  createTimeslot: (data) => api.post('/schedules/timeslots/', data).then(r => r.data),
  updateTimeslot: (id, data) => api.put(`/schedules/timeslots/${id}/`, data).then(r => r.data),
  deleteTimeslot: (id) => api.delete(`/schedules/timeslots/${id}/`),

  // ─── Schedules ────────────────────────────────────────────────────────────
  getSchedules: (params = {}) => api.get('/schedules/schedules/', { params }).then(r => r.data),

  /** Schedules for the authenticated user (student → their auditoire, teacher → their courses) */
  getMySchedule: (params = {}) => api.get('/schedules/schedules/my-schedule/', { params }).then(r => r.data),

  /** Schedules for a specific auditoire */
  getAuditoireSchedule: (auditoireId, params = {}) =>
    api.get(`/schedules/schedules/auditoire_schedule/`, { params: { auditoire_id: auditoireId, ...params } }).then(r => r.data),

  /** Schedules for a specific teacher */
  getTeacherSchedule: (teacherId, params = {}) =>
    api.get(`/schedules/schedules/teacher_schedule/`, { params: { teacher_id: teacherId, ...params } }).then(r => r.data),

  createSchedule: (data) => api.post('/schedules/schedules/', data).then(r => r.data),
  updateSchedule: (id, data) => api.put(`/schedules/schedules/${id}/`, data).then(r => r.data),
  patchSchedule: (id, data) => api.patch(`/schedules/schedules/${id}/`, data).then(r => r.data),
  deleteSchedule: (id) => api.delete(`/schedules/schedules/${id}/`),
  checkConflicts: (data) => api.post('/schedules/schedules/check-conflicts/', data).then(r => r.data),

  /** Duplicate planning from one term to another */
  duplicatePlanning: (data) => api.post('/schedules/schedules/duplicate-planning/', data).then(r => r.data),

  /** Publish calendar (notify all users) */
  publishCalendar: (yearId) => api.post(`/schedules/academic-years/${yearId}/publish/`).then(r => r.data),

  /** Publish schedule for an auditoire (notify stakeholders) */
  publishSchedule: (data) => api.post('/schedules/schedules/publish-schedule/', data).then(r => r.data),

  /** Get calendar context (current year, terms, events, active term) for Horaire validation */
  getCalendarContext: () => api.get('/schedules/schedules/calendar-context/').then(r => r.data),

  // ─── Schedule Exceptions ──────────────────────────────────────────────────
  getExceptions: (params = {}) => api.get('/schedules/exceptions/', { params }).then(r => r.data),
  createException: (data) => api.post('/schedules/exceptions/', data).then(r => r.data),
  updateException: (id, data) => api.put(`/schedules/exceptions/${id}/`, data).then(r => r.data),
  deleteException: (id) => api.delete(`/schedules/exceptions/${id}/`),

  // ─── Teacher Availability ─────────────────────────────────────────────────
  getAvailability: (params = {}) => api.get('/schedules/availability/', { params }).then(r => r.data),
  getMyAvailability: () => api.get('/schedules/availability/my-availability/').then(r => r.data),
  createAvailability: (data) => api.post('/schedules/availability/', data).then(r => r.data),
  updateAvailability: (id, data) => api.put(`/schedules/availability/${id}/`, data).then(r => r.data),
  deleteAvailability: (id) => api.delete(`/schedules/availability/${id}/`),
}

export default scheduleService
