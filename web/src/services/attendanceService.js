import api from './api';

const attendanceService = {
  // ============== ATTENDANCE SESSIONS ==============

  // Liste des sessions
  getAttendanceSessions: (params) => api.get('/courses/attendance-sessions/', { params }),

  // Détail d'une session
  getAttendanceSessionDetail: (id) => api.get(`/courses/attendance-sessions/${id}/`),

  // Créer une session
  createAttendanceSession: (data) => {
    // Formater les données selon le modèle backend AttendanceSession
    // Le modèle attend: course, date, start_time, end_time, title, description

    // Extraire date et heure depuis datetime-local (format: "2024-12-04T14:30")
    let dateStr, startTime;

    if (data.session_date) {
      if (data.session_date.includes('T')) {
        // Format datetime-local
        const [datePart, timePart] = data.session_date.split('T');
        dateStr = datePart;
        startTime = timePart ? `${timePart}:00` : '08:00:00'; // Ajouter secondes si manquantes
      } else {
        // Format date simple
        dateStr = data.session_date;
        startTime = data.start_time || '08:00:00';
      }
    } else {
      // Valeurs par défaut
      dateStr = new Date().toISOString().split('T')[0];
      startTime = '08:00:00';
    }

    // Calculer end_time basé sur start_time et duration
    const duration = parseInt(data.duration_minutes) || 120;
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + duration;
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = totalMinutes % 60;
    const endTime = `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}:00`;

    const formattedData = {
      course: data.course,
      date: dateStr,
      start_time: startTime,
      end_time: endTime,
      title: data.session_type ? `Séance de ${data.session_type}` : 'Séance de présence',
      description: data.notes || ''
    };

    return api.post('/courses/attendance-sessions/', formattedData);
  },

  // Mettre à jour une session
  updateAttendanceSession: (id, data) => api.put(`/courses/attendance-sessions/${id}/`, data),

  // Supprimer une session
  deleteAttendanceSession: (id) => api.delete(`/courses/attendance-sessions/${id}/`),

  // Finaliser une session
  finalizeSession: (id) => api.post(`/courses/attendance-sessions/${id}/finalize/`),

  // Mes sessions (enseignant)
  getMySessions: () => api.get('/courses/attendance-sessions/my_sessions/'),

  // Présences pour une session spécifique
  getSessionAttendance: (sessionId, courseId, date) => {
    // Try by session FK first; fallback query uses course + date
    if (sessionId) {
      return api.get('/courses/attendances/', { params: { session: sessionId } }).then(res => {
        // If no results via session FK, fall back to course+date
        if ((res.data.results || res.data || []).length === 0 && courseId && date) {
          return api.get('/courses/attendances/', { params: { course: courseId, date } });
        }
        return res;
      });
    }
    return api.get('/courses/attendances/', { params: { course: courseId, date } });
  },


  // ============== ATTENDANCE RECORDS ==============

  // Liste des présences
  getAttendances: (params) => api.get('/courses/attendances/', { params }),

  // Détail d'une présence
  getAttendanceDetail: (id) => api.get(`/courses/attendances/${id}/`),

  // Marquer une présence
  markAttendance: (data) => api.post('/courses/attendances/', data),

  // Mettre à jour une présence
  updateAttendance: (id, data) => api.put(`/courses/attendances/${id}/`, data),

  // Marquer plusieurs présences en masse
  bulkMarkAttendance: (courseId, date, attendances, sessionId) => {
    return api.post('/courses/attendances/bulk_create/', {
      course: courseId,
      date: date,
      session_id: sessionId || null,
      attendances: attendances
    });
  },

  // Mes présences (étudiant)
  getMyAttendances: () => api.get('/courses/attendances/my_attendances/'),

  // Statistiques de présence
  getAttendanceStats: (params) => api.get('/courses/attendances/statistics/', { params }),

  // Statistiques par cours
  getCourseAttendanceStats: (courseId) => api.get(`/courses/attendances/course_statistics/`, { params: { course_id: courseId } }),

  // Rapport de présence d'un cours (alias pour course-report)
  getCourseAttendanceReport: (courseId) => api.get(`/courses/attendances/course-report/`, { params: { course_id: courseId } }),

  // Exporter les présences
  exportAttendance: (courseId) => api.get(`/courses/attendances/course-report/`, { params: { course_id: courseId } }),

  // Alias pour bulk_create (compatibilité PointagePresences)
  bulkCreateAttendances: (data) => {
    return api.post('/courses/attendances/bulk_create/', {
      course: data.course,
      date: data.date,
      session_id: data.session_id || null,
      attendances: data.attendances
    });
  },
};

export default attendanceService;

// Exports nommés pour la compatibilité
export const getAttendanceSessions = attendanceService.getAttendanceSessions;
export const getAttendanceSessionDetail = attendanceService.getAttendanceSessionDetail;
export const createAttendanceSession = attendanceService.createAttendanceSession;
export const updateAttendanceSession = attendanceService.updateAttendanceSession;
export const deleteAttendanceSession = attendanceService.deleteAttendanceSession;
export const finalizeSession = attendanceService.finalizeSession;
export const getMySessions = attendanceService.getMySessions;
export const getSessionAttendance = attendanceService.getSessionAttendance;
export const getAttendances = attendanceService.getAttendances;
export const getAttendanceDetail = attendanceService.getAttendanceDetail;
export const markAttendance = attendanceService.markAttendance;
export const updateAttendance = attendanceService.updateAttendance;
export const bulkMarkAttendance = attendanceService.bulkMarkAttendance;
export const getMyAttendances = attendanceService.getMyAttendances;
export const getAttendanceStats = attendanceService.getAttendanceStats;
export const getCourseAttendanceStats = attendanceService.getCourseAttendanceStats;
export const getCourseAttendanceReport = attendanceService.getCourseAttendanceReport;
export const exportAttendance = attendanceService.exportAttendance;
export const bulkCreateAttendances = attendanceService.bulkCreateAttendances;
