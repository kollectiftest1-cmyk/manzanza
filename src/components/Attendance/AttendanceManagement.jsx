import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  Plus,
  Download,
  Filter,
  Search,
  UserCheck,
  AlertCircle,
  TrendingUp,
  BarChart2,
  Eye,
  Edit
} from 'lucide-react';
import attendanceService from '../../services/attendanceService';
import courseService from '../../services/courseService';

const AttendanceManagement = () => {
  const [view, setView] = useState('sessions'); // 'sessions', 'create', 'take', 'reports'
  const [sessions, setSessions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedSession, setSelectedSession] = useState(null);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'present', 'absent', 'late'
  const [isViewMode, setIsViewMode] = useState(false); // true = voir/modifier, false = prendre nouvelle présence

  const [formData, setFormData] = useState({
    course: '',
    session_date: '',
    session_type: 'cours',
    duration_minutes: 120,
    notes: ''
  });

  useEffect(() => {
    loadCourses();
    loadSessions();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      loadSessionStats(selectedCourse);
    }
  }, [selectedCourse]);

  const loadCourses = async () => {
    try {
      const response = await courseService.getMyCourses();
      setCourses(Array.isArray(response.data.results) ? response.data.results : []);
    } catch (error) {
      console.error('Erreur chargement cours:', error);
      setCourses([]);
    }
  };

  const loadSessions = async () => {
    try {
      setLoading(true);
      const response = await attendanceService.getAttendanceSessions();
      console.log('session',response.data.results);
      
      setSessions(response.data.results);
    } catch (error) {
      console.error('Erreur chargement sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSessionStats = async (courseId) => {
    try {
      const response = await attendanceService.getCourseAttendanceReport(courseId);
      setStats(response.data);
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    }
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await attendanceService.createAttendanceSession(formData);
      await loadSessions();
      setView('sessions');
      setFormData({
        course: '',
        session_date: '',
        session_type: 'cours',
        duration_minutes: 120,
        notes: ''
      });
    } catch (error) {
      console.error('Erreur création session:', error);
      alert('Erreur lors de la création de la session');
    } finally {
      setLoading(false);
    }
  };

  const handleTakeAttendance = async (session, viewMode = false) => {
    try {
      setLoading(true);
      setSelectedSession(session);
      setIsViewMode(viewMode);

      // session.course est l'ID, pas un objet
      const courseId = session.course;

      // Charger les étudiants du cours
      const courseResponse = await courseService.getCourseDetail(courseId);
      setStudents(courseResponse.data.students || []);

      // Charger les présences existantes pour cette session
      const attendanceResponse = await attendanceService.getSessionAttendance(session.id);
      console.log('session',attendanceResponse);

      const existingAttendance = {};
      attendanceResponse.data.results.forEach(att => {
        // att.student peut être un ID ou un objet, on vérifie
        const studentId = typeof att.student === 'object' ? att.student.id : att.student;
        existingAttendance[studentId] = att.status;
      });

      setAttendance(existingAttendance);

      setView('take');
    } catch (error) {
      console.error('Erreur chargement données:', error);
      alert('Erreur lors du chargement des données de présence');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (studentId, status) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleSaveAttendance = async () => {
    try {
      setLoading(true);

      // Filter out entries without status
      const attendanceData = Object.entries(attendance)
        .filter(([studentId, status]) => status && status !== '')
        .map(([studentId, status]) => ({
          student_id: parseInt(studentId),
          status: status,
          comments: ''
        }));

      if (attendanceData.length === 0) {
        alert('Veuillez marquer au moins une présence');
        setLoading(false);
        return;
      }

      // bulkMarkAttendance expects (courseId, date, attendances)
      const courseId = selectedSession.course;
      const sessionDate = selectedSession.date;

      await attendanceService.bulkMarkAttendance(courseId, sessionDate, attendanceData);
      alert('Présences enregistrées avec succès !');
      setView('sessions');
    } catch (error) {
      console.error('Erreur enregistrement présences:', error);
      alert('Erreur lors de l\'enregistrement');
    } finally {
      setLoading(false);
    }
  };

  const exportAttendance = async () => {
    try {
      const response = await attendanceService.exportAttendance(selectedCourse);
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance_${selectedCourse}_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    } catch (error) {
      console.error('Erreur export:', error);
    }
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email?.toLowerCase().includes(searchTerm.toLowerCase());

    if (filterStatus === 'all') return matchesSearch;
    return matchesSearch && attendance[student.id] === filterStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return 'var(--color-success)';
      case 'absent': return 'var(--color-danger)';
      case 'late': return 'var(--color-warning)';
      case 'excused': return 'var(--color-info)';
      default: return 'var(--color-textSecondary)';
    }
  };

  const getStatusBadgeStyle = (status) => {
    const baseStyle = {
      padding: '6px 12px',
      borderRadius: '8px',
      fontSize: '0.85rem',
      fontWeight: '600',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px'
    };

    switch (status) {
      case 'present':
        return { ...baseStyle, background: 'rgba(28, 200, 138, 0.1)', color: 'var(--color-success)' };
      case 'absent':
        return { ...baseStyle, background: 'rgba(231, 74, 59, 0.1)', color: 'var(--color-danger)' };
      case 'late':
        return { ...baseStyle, background: 'rgba(246, 194, 62, 0.1)', color: 'var(--color-warning)' };
      case 'excused':
        return { ...baseStyle, background: 'rgba(54, 185, 204, 0.1)', color: 'var(--color-info)' };
      default:
        return { ...baseStyle, background: 'var(--color-bodyBg)', color: 'var(--color-textSecondary)' };
    }
  };

  return (
    <div style={{ background: 'var(--color-bodyBg)', minHeight: '100vh', padding: '24px' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            marginBottom: '32px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px'
          }}
        >
          <div>
            <h2 style={{
              fontSize: '2rem',
              fontWeight: '700',
              color: 'var(--color-textPrimary)',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <UserCheck size={32} style={{ color: 'var(--color-primary)' }} />
              Gestion des Présences
            </h2>
            <p style={{ color: 'var(--color-textSecondary)', margin: 0 }}>
              Enregistrez et suivez les présences de vos étudiants
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setView('sessions')}
              style={{
                padding: '12px 24px',
                borderRadius: '12px',
                border: view === 'sessions' ? 'none' : '2px solid var(--color-border)',
                background: view === 'sessions' ? 'var(--color-primary)' : 'var(--color-cardBg)',
                color: view === 'sessions' ? 'white' : 'var(--color-textPrimary)',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.3s ease'
              }}
            >
              <Calendar size={18} />
              Sessions
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setView('create')}
              style={{
                padding: '12px 24px',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                color: 'white',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(78, 115, 223, 0.3)'
              }}
            >
              <Plus size={18} />
              Nouvelle Session
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setView('reports')}
              style={{
                padding: '12px 24px',
                borderRadius: '12px',
                border: view === 'reports' ? 'none' : '2px solid var(--color-border)',
                background: view === 'reports' ? 'var(--color-primary)' : 'var(--color-cardBg)',
                color: view === 'reports' ? 'white' : 'var(--color-textPrimary)',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.3s ease'
              }}
            >
              <BarChart2 size={18} />
              Rapports
            </motion.button>
          </div>
        </motion.div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {view === 'sessions' && (
            <motion.div
              key="sessions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div style={{
                background: 'var(--color-cardBg)',
                borderRadius: '16px',
                border: '1px solid var(--color-border)',
                padding: '24px',
                boxShadow: 'var(--color-cardShadow)'
              }}>
                <h3 style={{
                  fontSize: '1.3rem',
                  fontWeight: '700',
                  color: 'var(--color-textPrimary)',
                  marginBottom: '24px'
                }}>
                  Sessions de Présence
                </h3>

                {loading ? (
                  <div style={{ textAlign: 'center', padding: '60px' }}>
                    <div className="spinner-border" style={{ color: 'var(--color-primary)' }}></div>
                  </div>
                ) : sessions.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '60px 20px',
                    color: 'var(--color-textSecondary)'
                  }}>
                    <Calendar size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                    <p>Aucune session de présence. Créez-en une pour commencer !</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: '16px' }}>
                    {sessions.map((session, index) => (
                      <motion.div
                        key={session.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ x: 4 }}
                        style={{
                          background: 'var(--color-bodyBg)',
                          borderRadius: '12px',
                          padding: '20px',
                          border: '1px solid var(--color-border)',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease'
                        }}
                        onClick={() => handleTakeAttendance(session)}
                      >
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          gap: '16px',
                          flexWrap: 'wrap'
                        }}>
                          <div style={{ flex: 1, minWidth: '200px' }}>
                            <h4 style={{
                              fontSize: '1.1rem',
                              fontWeight: '600',
                              color: 'var(--color-textPrimary)',
                              marginBottom: '8px'
                            }}>
                              {session.course_name || 'Cours'}
                            </h4>
                            <div style={{
                              display: 'flex',
                              gap: '16px',
                              flexWrap: 'wrap',
                              fontSize: '0.9rem',
                              color: 'var(--color-textSecondary)'
                            }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Calendar size={16} />
                                {session.date ? new Date(session.date).toLocaleDateString('fr-FR', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                }) : 'Date non définie'}
                              </span>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Clock size={16} />
                                {session.start_time || '00:00'} - {session.end_time || '00:00'}
                              </span>
                            </div>
                          </div>

                          <div style={{
                            display: 'flex',
                            gap: '12px',
                            alignItems: 'center',
                            flexWrap: 'wrap'
                          }}>
                            <span style={{
                              padding: '4px 12px',
                              borderRadius: '20px',
                              fontSize: '0.85rem',
                              fontWeight: '600',
                              background: 'var(--color-primary)',
                              color: 'white'
                            }}>
                              {session.title || 'Séance de présence'}
                            </span>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTakeAttendance(session, true);
                              }}
                              style={{
                                padding: '10px 20px',
                                borderRadius: '10px',
                                border: '2px solid var(--color-info)',
                                background: 'transparent',
                                color: 'var(--color-info)',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}
                            >
                              <Eye size={16} />
                              Voir
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTakeAttendance(session, false);
                              }}
                              style={{
                                padding: '10px 20px',
                                borderRadius: '10px',
                                border: 'none',
                                background: 'var(--color-primary)',
                                color: 'white',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}
                            >
                              <UserCheck size={16} />
                              Prendre Présence
                            </motion.button>
                          </div>
                        </div>

                        {session.notes && (
                          <p style={{
                            marginTop: '12px',
                            fontSize: '0.9rem',
                            color: 'var(--color-textSecondary)',
                            fontStyle: 'italic'
                          }}>
                            📝 {session.notes}
                          </p>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {view === 'create' && (
            <motion.div
              key="create"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div style={{
                background: 'var(--color-cardBg)',
                borderRadius: '16px',
                border: '1px solid var(--color-border)',
                padding: '32px',
                boxShadow: 'var(--color-cardShadow)',
                maxWidth: '800px',
                margin: '0 auto'
              }}>
                <h3 style={{
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  color: 'var(--color-textPrimary)',
                  marginBottom: '24px'
                }}>
                  Créer une Session de Présence
                </h3>

                <form onSubmit={handleCreateSession}>
                  <div style={{ display: 'grid', gap: '20px' }}>
                    <div>
                      <label style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontWeight: '600',
                        color: 'var(--color-textPrimary)'
                      }}>
                        Cours *
                      </label>
                      <select
                        required
                        value={formData.course}
                        onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          borderRadius: '10px',
                          border: '2px solid var(--color-border)',
                          background: 'var(--color-bodyBg)',
                          color: 'var(--color-textPrimary)',
                          fontSize: '1rem'
                        }}
                      >
                        <option value="">Sélectionnez un cours</option>
                        {courses.map(course => (
                          <option key={course.id} value={course.id}>
                            {course.name} ({course.code})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      <div>
                        <label style={{
                          display: 'block',
                          marginBottom: '8px',
                          fontWeight: '600',
                          color: 'var(--color-textPrimary)'
                        }}>
                          Date et Heure *
                        </label>
                        <input
                          type="datetime-local"
                          required
                          value={formData.session_date}
                          onChange={(e) => setFormData({ ...formData, session_date: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            borderRadius: '10px',
                            border: '2px solid var(--color-border)',
                            background: 'var(--color-bodyBg)',
                            color: 'var(--color-textPrimary)',
                            fontSize: '1rem'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{
                          display: 'block',
                          marginBottom: '8px',
                          fontWeight: '600',
                          color: 'var(--color-textPrimary)'
                        }}>
                          Type de Session *
                        </label>
                        <select
                          value={formData.session_type}
                          onChange={(e) => setFormData({ ...formData, session_type: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            borderRadius: '10px',
                            border: '2px solid var(--color-border)',
                            background: 'var(--color-bodyBg)',
                            color: 'var(--color-textPrimary)',
                            fontSize: '1rem'
                          }}
                        >
                          <option value="cours">Cours</option>
                          <option value="tp">TP</option>
                          <option value="td">TD</option>
                          <option value="examen">Examen</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontWeight: '600',
                        color: 'var(--color-textPrimary)'
                      }}>
                        Durée (minutes) *
                      </label>
                      <input
                        type="number"
                        required
                        min="15"
                        max="240"
                        value={formData.duration_minutes}
                        onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          borderRadius: '10px',
                          border: '2px solid var(--color-border)',
                          background: 'var(--color-bodyBg)',
                          color: 'var(--color-textPrimary)',
                          fontSize: '1rem'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontWeight: '600',
                        color: 'var(--color-textPrimary)'
                      }}>
                        Notes (optionnel)
                      </label>
                      <textarea
                        rows="3"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Ajoutez des notes sur cette session..."
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          borderRadius: '10px',
                          border: '2px solid var(--color-border)',
                          background: 'var(--color-bodyBg)',
                          color: 'var(--color-textPrimary)',
                          fontSize: '1rem',
                          resize: 'vertical',
                          fontFamily: 'inherit'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    gap: '12px',
                    marginTop: '32px',
                    justifyContent: 'flex-end'
                  }}>
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setView('sessions')}
                      style={{
                        padding: '12px 24px',
                        borderRadius: '10px',
                        border: '2px solid var(--color-border)',
                        background: 'transparent',
                        color: 'var(--color-textPrimary)',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      Annuler
                    </motion.button>
                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={loading}
                      style={{
                        padding: '12px 32px',
                        borderRadius: '10px',
                        border: 'none',
                        background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                        color: 'white',
                        fontWeight: '600',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.6 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <Plus size={18} />
                      {loading ? 'Création...' : 'Créer la Session'}
                    </motion.button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}

          {view === 'take' && selectedSession && (
            <motion.div
              key="take"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div style={{
                background: 'var(--color-cardBg)',
                borderRadius: '16px',
                border: '1px solid var(--color-border)',
                padding: '24px',
                boxShadow: 'var(--color-cardShadow)'
              }}>
                {/* Header de la session */}
                <div style={{
                  background: isViewMode
                    ? 'linear-gradient(135deg, var(--color-info), #36b9cc)'
                    : 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                  borderRadius: '12px',
                  padding: '24px',
                  marginBottom: '24px',
                  color: 'white'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                        {isViewMode ? <Eye size={28} /> : <UserCheck size={28} />}
                        <h3 style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0 }}>
                          {selectedSession.course_name || 'Cours'}
                        </h3>
                      </div>
                      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', fontSize: '0.95rem' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Calendar size={18} />
                          {selectedSession.date ? new Date(selectedSession.date).toLocaleDateString('fr-FR') : 'Date non définie'}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Clock size={18} />
                          {selectedSession.start_time || '00:00'} - {selectedSession.end_time || '00:00'}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Users size={18} />
                          {students.length} étudiants
                        </span>
                      </div>
                    </div>
                    {isViewMode && (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsViewMode(false)}
                        style={{
                          padding: '12px 24px',
                          borderRadius: '10px',
                          border: '2px solid white',
                          background: 'rgba(255, 255, 255, 0.2)',
                          color: 'white',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          backdropFilter: 'blur(10px)'
                        }}
                      >
                        <Edit size={18} />
                        Modifier
                      </motion.button>
                    )}
                  </div>
                </div>

                {/* Barre de recherche et filtres */}
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  marginBottom: '24px',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
                    <Search
                      size={20}
                      style={{
                        position: 'absolute',
                        left: '16px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--color-textSecondary)'
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Rechercher un étudiant..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 16px 12px 48px',
                        borderRadius: '10px',
                        border: '2px solid var(--color-border)',
                        background: 'var(--color-bodyBg)',
                        color: 'var(--color-textPrimary)',
                        fontSize: '1rem'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    {['all', 'present', 'absent', 'late'].map(status => (
                      <motion.button
                        key={status}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setFilterStatus(status)}
                        style={{
                          padding: '12px 20px',
                          borderRadius: '10px',
                          border: filterStatus === status ? 'none' : '2px solid var(--color-border)',
                          background: filterStatus === status ? 'var(--color-primary)' : 'transparent',
                          color: filterStatus === status ? 'white' : 'var(--color-textPrimary)',
                          fontWeight: '600',
                          cursor: 'pointer',
                          textTransform: 'capitalize'
                        }}
                      >
                        {status === 'all' ? 'Tous' : status === 'present' ? 'Présents' : status === 'absent' ? 'Absents' : 'Retards'}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Liste des étudiants */}
                <div style={{ display: 'grid', gap: '12px', marginBottom: '24px' }}>
                  {filteredStudents.map((student, index) => (
                    <motion.div
                      key={student.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.02 }}
                      style={{
                        background: 'var(--color-bodyBg)',
                        borderRadius: '10px',
                        padding: '16px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '16px',
                        border: '1px solid var(--color-border)'
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontWeight: '600',
                          color: 'var(--color-textPrimary)',
                          marginBottom: '4px'
                        }}>
                          {student.name || student.email}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--color-textSecondary)' }}>
                          {student.email}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        {isViewMode ? (
                          // Mode Voir - Afficher seulement le statut actuel
                          attendance[student.id] ? (
                            <div style={{
                              ...getStatusBadgeStyle(attendance[student.id]),
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}>
                              {attendance[student.id] === 'present' && <CheckCircle size={18} />}
                              {attendance[student.id] === 'absent' && <XCircle size={18} />}
                              {attendance[student.id] === 'late' && <Clock size={18} />}
                              {attendance[student.id] === 'excused' && <AlertCircle size={18} />}
                              <span style={{ textTransform: 'capitalize' }}>
                                {attendance[student.id] === 'present' ? 'Présent' :
                                 attendance[student.id] === 'absent' ? 'Absent' :
                                 attendance[student.id] === 'late' ? 'Retard' : 'Excusé'}
                              </span>
                            </div>
                          ) : (
                            <div style={{
                              padding: '6px 12px',
                              borderRadius: '8px',
                              fontSize: '0.85rem',
                              color: 'var(--color-textSecondary)',
                              background: 'var(--color-bodyBg)',
                              border: '1px solid var(--color-border)'
                            }}>
                              Non marqué
                            </div>
                          )
                        ) : (
                          // Mode Modifier - Boutons interactifs
                          ['present', 'late', 'absent', 'excused'].map(status => (
                            <motion.button
                              key={status}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleStatusChange(student.id, status)}
                              style={{
                                width: '44px',
                                height: '44px',
                                borderRadius: '10px',
                                border: attendance[student.id] === status ? 'none' : '2px solid var(--color-border)',
                                background: attendance[student.id] === status
                                  ? getStatusColor(status)
                                  : 'transparent',
                                color: attendance[student.id] === status ? 'white' : getStatusColor(status),
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s ease'
                              }}
                              title={status}
                            >
                              {status === 'present' && <CheckCircle size={20} />}
                              {status === 'absent' && <XCircle size={20} />}
                              {status === 'late' && <Clock size={20} />}
                              {status === 'excused' && <AlertCircle size={20} />}
                            </motion.button>
                          ))
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Actions */}
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  justifyContent: 'flex-end',
                  paddingTop: '24px',
                  borderTop: '1px solid var(--color-border)'
                }}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setView('sessions')}
                    style={{
                      padding: '12px 24px',
                      borderRadius: '10px',
                      border: '2px solid var(--color-border)',
                      background: 'transparent',
                      color: 'var(--color-textPrimary)',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    {isViewMode ? 'Retour' : 'Annuler'}
                  </motion.button>
                  {!isViewMode && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSaveAttendance}
                      disabled={loading}
                      style={{
                        padding: '12px 32px',
                        borderRadius: '10px',
                        border: 'none',
                        background: 'linear-gradient(135deg, var(--color-success), #1abc9c)',
                        color: 'white',
                        fontWeight: '600',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.6 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <CheckCircle size={18} />
                      {loading ? 'Enregistrement...' : 'Enregistrer les Présences'}
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {view === 'reports' && (
            <motion.div
              key="reports"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div style={{
                background: 'var(--color-cardBg)',
                borderRadius: '16px',
                border: '1px solid var(--color-border)',
                padding: '32px',
                boxShadow: 'var(--color-cardShadow)'
              }}>
                <h3 style={{
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  color: 'var(--color-textPrimary)',
                  marginBottom: '24px'
                }}>
                  Rapports de Présence
                </h3>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '8px',
                    fontWeight: '600',
                    color: 'var(--color-textPrimary)'
                  }}>
                    Sélectionner un cours
                  </label>
                  <select
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    style={{
                      width: '100%',
                      maxWidth: '500px',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      border: '2px solid var(--color-border)',
                      background: 'var(--color-bodyBg)',
                      color: 'var(--color-textPrimary)',
                      fontSize: '1rem'
                    }}
                  >
                    <option value="">Choisissez un cours...</option>
                    {courses.map(course => (
                      <option key={course.id} value={course.id}>
                        {course.name} ({course.code})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedCourse && stats && (
                  <div>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '16px',
                      marginBottom: '24px'
                    }}>
                      <div style={{
                        background: 'linear-gradient(135deg, rgba(28, 200, 138, 0.1), rgba(28, 200, 138, 0.05))',
                        borderRadius: '12px',
                        padding: '20px',
                        border: '1px solid rgba(28, 200, 138, 0.2)'
                      }}>
                        <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--color-success)' }}>
                          {stats.average_attendance_rate || 0}%
                        </div>
                        <div style={{ color: 'var(--color-textSecondary)', marginTop: '4px' }}>
                          Taux de présence moyen
                        </div>
                      </div>

                      <div style={{
                        background: 'linear-gradient(135deg, rgba(78, 115, 223, 0.1), rgba(78, 115, 223, 0.05))',
                        borderRadius: '12px',
                        padding: '20px',
                        border: '1px solid rgba(78, 115, 223, 0.2)'
                      }}>
                        <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--color-primary)' }}>
                          {stats.total_sessions || 0}
                        </div>
                        <div style={{ color: 'var(--color-textSecondary)', marginTop: '4px' }}>
                          Sessions totales
                        </div>
                      </div>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={exportAttendance}
                      style={{
                        padding: '12px 24px',
                        borderRadius: '10px',
                        border: 'none',
                        background: 'var(--color-primary)',
                        color: 'white',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <Download size={18} />
                      Exporter en CSV
                    </motion.button>
                  </div>
                )}

                {selectedCourse && !stats && (
                  <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-textSecondary)' }}>
                    Chargement des statistiques...
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AttendanceManagement;
