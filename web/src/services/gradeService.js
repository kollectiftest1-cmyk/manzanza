/**
 * Grade Service — API calls for grades, transcripts and exam sessions.
 */
import api from './api'

const gradeService = {
  // ── GradeCategory ────────────────────────────────────────────────────────
  getCategories: () => api.get('/grades/categories/'),
  createCategory: (data) => api.post('/grades/categories/', data),
  updateCategory: (id, data) => api.put(`/grades/categories/${id}/`, data),
  deleteCategory: (id) => api.delete(`/grades/categories/${id}/`),

  // ── CourseGradeWeight (per-course weight overrides) ───────────────────
  getCourseWeights: (courseId) =>
    api.get('/grades/weights/', { params: { course: courseId } }),
  setCourseWeight: (data) => api.post('/grades/weights/', data),
  updateCourseWeight: (id, data) => api.put(`/grades/weights/${id}/`, data),
  deleteCourseWeight: (id) => api.delete(`/grades/weights/${id}/`),

  // ── Grades ───────────────────────────────────────────────────────────────
  getGrades: (params = {}) => api.get('/grades/grades/', { params }),

  getGrade: (id) => api.get(`/grades/grades/${id}/`),

  createGrade: (data) => api.post('/grades/grades/', data),

  updateGrade: (id, data) => api.put(`/grades/grades/${id}/`, data),

  patchGrade: (id, data) => api.patch(`/grades/grades/${id}/`, data),

  deleteGrade: (id) => api.delete(`/grades/grades/${id}/`),

  /** Student shortcut — grades grouped by course with weighted average */
  getMyGrades: () => api.get('/grades/grades/my-grades/'),

  /** Admin/teacher — all grades for a specific student */
  getStudentGrades: (studentId) => api.get(`/grades/grades/student/${studentId}/`),

  getCourseAssessments: (courseId) =>
    api.get('/grades/grades/course-assessments/', { params: { course: courseId } }),

  getAssessmentDetail: (params = {}) =>
    api.get('/grades/grades/assessment-detail/', { params }),

  saveBulkAssessment: (data) => api.post('/grades/grades/bulk-assessment/', data),

  // ── Transcripts ──────────────────────────────────────────────────────────
  getTranscripts: (params = {}) => api.get('/grades/transcripts/', { params }),

  getMyTranscript: () => api.get('/grades/transcripts/my-transcript/'),

  // ── Exam Sessions ────────────────────────────────────────────────────────
  getExamSessions: (params = {}) => api.get('/grades/exams/', { params }),

  createExamSession: (data) => api.post('/grades/exams/', data),

  updateExamSession: (id, data) => api.put(`/grades/exams/${id}/`, data),

  deleteExamSession: (id) => api.delete(`/grades/exams/${id}/`),

  // ── Academic Config (singleton) ──────────────────────────────────────────
  getAcademicConfig: () => api.get('/grades/config/'),
  updateAcademicConfig: (data) => api.put('/grades/config/1/', data),
  patchAcademicConfig: (data) => api.patch('/grades/config/1/', data),

  // ── Calculation Endpoints ────────────────────────────────────────────────
  /** Get course hours breakdown (planned vs taught) */
  getCourseHours: (courseId) => api.get('/grades/config/course_hours/', { params: { course_id: courseId } }),

  /** Get teacher hours / prestation breakdown */
  getTeacherHours: (userId, mois, annee) =>
    api.get('/grades/config/teacher_hours/', { params: { user_id: userId, mois, annee } }),

  /** Get weighted averages for all students in a course */
  getCourseAverages: (courseId) => api.get('/grades/config/course_averages/', { params: { course_id: courseId } }),

  /** Get overall averages + ranking for all students in an auditoire */
  getAuditoireAverages: (auditoireId) =>
    api.get('/grades/config/auditoire_averages/', { params: { auditoire_id: auditoireId } }),
}

export default gradeService
