/**
 * AttendanceManagement.jsx — Gestion des présences (design compact)
 * - Création de séance (date, heure début/fin, cours, type)
 * - Pointage étudiant via tableau compact
 * - Clôture de séance (is_finalized = true → comptabilisé en paie)
 * - Visualisation des séances finalisées (lecture seule)
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Row, Col, Card, Table, Button, Form, Badge,
  Alert, Spinner, InputGroup, Modal, ProgressBar
} from 'react-bootstrap';
import {
  FiCalendar, FiUsers, FiCheckCircle, FiXCircle, FiClock,
  FiPlus, FiLock, FiUnlock, FiEye, FiEdit2, FiBarChart2,
  FiSearch, FiAlertCircle, FiCheck, FiX, FiRefreshCw,
  FiArrowLeft, FiDownload
} from 'react-icons/fi';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import attendanceService from '../../services/attendanceService';
import courseService from '../../services/courseService';

// ── Status config ──────────────────────────────────────────────────────
const STATUS_CONFIG = {
  present: { label: 'Présent', icon: FiCheck, color: '#28a745', bg: '#28a74520' },
  absent:  { label: 'Absent',  icon: FiX,     color: '#dc3545', bg: '#dc354520' },
  retard:  { label: 'Retard',  icon: FiClock, color: '#ffc107', bg: '#ffc10720' },
  excuse:  { label: 'Excusé',  icon: FiAlertCircle, color: '#17a2b8', bg: '#17a2b820' },
};

const AttendanceManagement = () => {
  const [view, setView] = useState('sessions'); // 'sessions' | 'create' | 'take' | 'reports'
  const [sessions, setSessions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Take attendance state
  const [selectedSession, setSelectedSession] = useState(null);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [savingAtt, setSavingAtt] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Create session form
  const [form, setForm] = useState({
    course: '',
    date: new Date().toISOString().split('T')[0],
    start_time: '08:00',
    end_time: '10:00',
    session_type: 'cours',
    notes: '',
  });
  const [creating, setCreating] = useState(false);

  // Reports state
  const [reportCourse, setReportCourse] = useState('');
  const [reportData, setReportData] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);

  // Finalize prompt (shown after saving attendance)
  const [showFinalizePrompt, setShowFinalizePrompt] = useState(false);

  // ── Load data ──────────────────────────────────────────────────────
  const loadSessions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await attendanceService.getAttendanceSessions();
      setSessions(res.data.results || res.data || []);
    } catch (err) {
      console.error('Erreur sessions:', err);
      setError('Erreur chargement des séances.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCourses = useCallback(async () => {
    try {
      const res = await courseService.getMyCourses();
      setCourses(res.data.results || res.data || []);
    } catch (err) {
      console.error('Erreur cours:', err);
    }
  }, []);

  useEffect(() => {
    loadSessions();
    loadCourses();
  }, [loadSessions, loadCourses]);

  // ── Create session ─────────────────────────────────────────────────
  const handleCreateSession = async (e) => {
    e.preventDefault();
    if (!form.course) { toast.error('Sélectionnez un cours.'); return; }
    if (form.start_time >= form.end_time) { toast.error('L\'heure de fin doit être après l\'heure de début.'); return; }

    setCreating(true);
    try {
      await attendanceService.createAttendanceSession({
        course: form.course,
        session_date: `${form.date}T${form.start_time}`,
        duration_minutes: (() => {
          const [sh, sm] = form.start_time.split(':').map(Number);
          const [eh, em] = form.end_time.split(':').map(Number);
          return (eh * 60 + em) - (sh * 60 + sm);
        })(),
        session_type: form.session_type,
        notes: form.notes,
      });
      toast.success('Séance créée avec succès !');
      await loadSessions();
      setView('sessions');
    } catch (err) {
      const msg = err.response?.data;
      toast.error(
        typeof msg === 'object' ? Object.values(msg).flat()[0] : 'Erreur création séance.'
      );
    } finally {
      setCreating(false);
    }
  };

  // ── Open take attendance ───────────────────────────────────────────
  const handleOpenTake = async (session, readOnly = false) => {
    setLoading(true);
    setError(null);
    setShowFinalizePrompt(false);
    try {
      setSelectedSession(session);
      // Finalized sessions are always read-only
      setIsReadOnly(session.is_finalized || readOnly);

      // Load students from course
      const courseRes = await courseService.getCourseDetail(session.course);
      setStudents(courseRes.data.students || []);

      // Load existing attendance (by session FK then course+date fallback)
      const attRes = await attendanceService.getSessionAttendance(
        session.id, session.course, session.date
      );
      const records = attRes.data.results || attRes.data || [];
      const map = {};
      records.forEach(att => {
        const sid = typeof att.student === 'object' ? att.student.id : att.student;
        map[sid] = att.status;
      });
      setAttendance(map);
      setSearchTerm('');
      setView('take');
    } catch (err) {
      console.error('Erreur chargement présences:', err);
      toast.error('Erreur lors du chargement des données.');
    } finally {
      setLoading(false);
    }
  };

  // ── Save attendance ────────────────────────────────────────────────
  const handleSaveAttendance = async () => {
    const data = Object.entries(attendance).map(([studentId, status]) => ({
      student_id: parseInt(studentId),
      status,
      comments: '',
    }));

    if (data.length === 0) {
      toast.warning('Marquez au moins une présence.');
      return;
    }

    setSavingAtt(true);
    try {
      await attendanceService.bulkMarkAttendance(
        selectedSession.course,
        selectedSession.date,
        data,
        selectedSession.id
      );
      toast.success('Présences enregistrées !');
      // Reload session stats
      await loadSessions();
      setIsReadOnly(true);
      // Prompt to finalize if not already done
      if (selectedSession && !selectedSession.is_finalized) {
        setShowFinalizePrompt(true);
      }
    } catch (err) {
      console.error('Erreur enregistrement:', err);
      toast.error('Erreur lors de l\'enregistrement.');
    } finally {
      setSavingAtt(false);
    }
  };

  // ── Finalize session ───────────────────────────────────────────────
  const handleFinalize = async (sessionId, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Clôturer cette séance ? Les présences ne pourront plus être modifiées et les heures seront comptabilisées en paie.')) return;

    try {
      const res = await attendanceService.finalizeSession(sessionId);
      toast.success('Séance clôturée et heures comptabilisées !');
      await loadSessions();
      // If we're in take view for this session, update selectedSession
      if (selectedSession?.id === sessionId) {
        setSelectedSession(res.data.session || { ...selectedSession, is_finalized: true });
        setIsReadOnly(true);
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Erreur lors de la clôture.';
      toast.error(msg);
    }
  };

  // ── Load report ────────────────────────────────────────────────────
  const handleLoadReport = async (courseId) => {
    if (!courseId) { setReportData(null); return; }
    setLoadingReport(true);
    try {
      const res = await attendanceService.getCourseAttendanceReport(courseId);
      setReportData(res.data);
    } catch (err) {
      console.error('Erreur rapport:', err);
      toast.error('Erreur chargement rapport.');
    } finally {
      setLoadingReport(false);
    }
  };

  // ── Computed ───────────────────────────────────────────────────────
  const filteredStudents = students.filter(s => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (s.name || '').toLowerCase().includes(q) ||
           (s.email || '').toLowerCase().includes(q) ||
           (s.matricule || '').toLowerCase().includes(q);
  });

  const attendanceSummary = {
    present: Object.values(attendance).filter(s => s === 'present').length,
    absent:  Object.values(attendance).filter(s => s === 'absent').length,
    retard:  Object.values(attendance).filter(s => s === 'retard').length,
    excuse:  Object.values(attendance).filter(s => s === 'excuse').length,
    total:   students.length,
  };

  const presentPct = attendanceSummary.total
    ? Math.round((attendanceSummary.present / attendanceSummary.total) * 100)
    : 0;

  // ══════════════════════════════════════════════════════════════════
  //  RENDER
  // ══════════════════════════════════════════════════════════════════
  return (
    <Container fluid style={{ padding: '12px 16px', background: 'var(--color-bodyBg)', minHeight: '100vh' }}>

      {/* ── Page Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {(view === 'take' || view === 'create') && (
            <Button variant="outline-secondary" size="sm" onClick={() => setView('sessions')} style={{ borderRadius: '6px', padding: '3px 8px' }}>
              <FiArrowLeft size={13} />
            </Button>
          )}
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px',
            background: 'linear-gradient(135deg, #4facfe, #00f2fe)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
          }}>
            <FiUsers size={16} color="white" />
          </div>
          <div>
            <div style={{ margin: 0, fontWeight: '700', color: 'var(--color-text)', fontSize: '15px', lineHeight: 1.2 }}>
              {view === 'sessions' ? 'Gestion des Présences'
                : view === 'create' ? 'Nouvelle Séance'
                : view === 'take' ? `Présences — ${selectedSession?.course_name || ''}`
                : 'Rapports de Présence'}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '1px' }}>
              <span style={{ color: 'var(--color-textSecondary)', fontSize: '12px' }}>
                {view === 'sessions' && `${sessions.length} séance(s)`}
                {view === 'take' && selectedSession && `${selectedSession.date} · ${selectedSession.start_time?.slice(0,5)}–${selectedSession.end_time?.slice(0,5)}`}
              </span>
              {view === 'sessions' && sessions.filter(s => !s.is_finalized).length > 0 && (
                <Badge bg="warning" text="dark" style={{ fontSize: '10px', padding: '2px 6px' }}>
                  {sessions.filter(s => !s.is_finalized).length} à clôturer
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Nav tabs */}
        {view === 'sessions' && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { id: 'sessions', label: 'Séances', icon: FiCalendar },
              { id: 'create',   label: 'Nouvelle',  icon: FiPlus },
              { id: 'reports',  label: 'Rapports',  icon: FiBarChart2 },
            ].map(tab => (
              <Button
                key={tab.id}
                size="sm"
                variant={view === tab.id ? 'primary' : 'outline-secondary'}
                onClick={() => setView(tab.id)}
                style={{ borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '5px', padding: '6px 14px' }}
              >
                <tab.icon size={14} />
                {tab.label}
              </Button>
            ))}
            <Button size="sm" variant="outline-secondary" onClick={loadSessions} style={{ borderRadius: '8px' }}>
              <FiRefreshCw size={14} />
            </Button>
          </div>
        )}

        {/* Take view: finalize and save buttons */}
        {view === 'take' && selectedSession && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {!selectedSession.is_finalized && isReadOnly && (
              <Button
                size="sm"
                variant="outline-warning"
                onClick={() => setIsReadOnly(false)}
                style={{ borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                <FiEdit2 size={14} /> Modifier
              </Button>
            )}
            {!isReadOnly && (
              <Button
                size="sm"
                variant="success"
                onClick={handleSaveAttendance}
                disabled={savingAtt}
                style={{ borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                {savingAtt ? <Spinner size="sm" /> : <><FiCheck size={14} /> Enregistrer</>}
              </Button>
            )}
            {!selectedSession.is_finalized && (
              <Button
                size="sm"
                variant="danger"
                onClick={() => handleFinalize(selectedSession.id)}
                style={{ borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                <FiLock size={14} /> Clôturer
              </Button>
            )}
          </div>
        )}

        {view === 'create' && (
          <Button
            size="sm"
            variant="outline-secondary"
            onClick={() => setView('sessions')}
            style={{ borderRadius: '8px' }}
          >
            Annuler
          </Button>
        )}
      </div>

      {error && <Alert variant="danger" onClose={() => setError(null)} dismissible style={{ borderRadius: '10px', marginBottom: '16px' }}>{error}</Alert>}

      {/* ══════════════ VIEW: SESSIONS ══════════════ */}
      {view === 'sessions' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px' }}>
              <Spinner animation="border" style={{ color: 'var(--color-primary)' }} />
            </div>
          ) : sessions.length === 0 ? (
            <Card style={{ border: 'none', borderRadius: '14px', background: 'var(--color-cardBg)' }}>
              <Card.Body style={{ textAlign: 'center', padding: '60px' }}>
                <FiCalendar size={40} style={{ color: 'var(--color-textSecondary)', opacity: 0.4, marginBottom: '12px' }} />
                <p style={{ color: 'var(--color-textSecondary)', marginBottom: '16px' }}>Aucune séance de présence.</p>
                <Button onClick={() => setView('create')} style={{ background: 'linear-gradient(135deg, #4facfe, #00f2fe)', border: 'none', borderRadius: '10px' }}>
                  <FiPlus size={14} className="me-2" /> Créer une séance
                </Button>
              </Card.Body>
            </Card>
          ) : (
            <Card style={{ border: 'none', borderRadius: '14px', background: 'var(--color-cardBg)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <Card.Body style={{ padding: 0 }}>
                <div style={{ overflowX: 'auto' }}>
                  <Table hover style={{ marginBottom: 0, fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: 'var(--color-bodyBg)' }}>
                        <th style={thStyle}>Cours</th>
                        <th style={thStyle}>Date</th>
                        <th style={thStyle}>Horaire</th>
                        <th style={thStyle}>Type</th>
                        <th style={thStyle}>Statut</th>
                        <th style={thStyle}>Présence</th>
                        <th style={{ ...thStyle, textAlign: 'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessions.map((session, idx) => {
                        const pct = session.total_students > 0
                          ? Math.round((session.present_count / session.total_students) * 100)
                          : 0;
                        return (
                          <motion.tr
                            key={session.id}
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            transition={{ delay: idx * 0.02 }}
                            style={{ cursor: 'pointer', opacity: session.is_finalized ? 0.9 : 1 }}
                          >
                            <td style={{ ...tdStyle, fontWeight: '600' }}>
                              {session.course_name || '—'}
                              {session.course_code && (
                                <Badge bg="light" text="dark" style={{ marginLeft: '6px', fontSize: '11px', fontFamily: 'monospace' }}>
                                  {session.course_code}
                                </Badge>
                              )}
                            </td>
                            <td style={tdStyle}>
                              {session.date ? new Date(session.date).toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' }) : '—'}
                            </td>
                            <td style={tdStyle}>
                              <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                                {session.start_time?.slice(0, 5)}–{session.end_time?.slice(0, 5)}
                              </span>
                            </td>
                            <td style={tdStyle}>
                              <Badge bg="secondary" style={{ fontSize: '11px' }}>
                                {session.title?.replace('Séance de ', '') || '—'}
                              </Badge>
                            </td>
                            <td style={tdStyle}>
                              {session.is_finalized ? (
                                <Badge bg="success" style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', width: 'fit-content' }}>
                                  <FiLock size={10} /> Clôturée
                                </Badge>
                              ) : (
                                <Badge bg="warning" text="dark" style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', width: 'fit-content' }}>
                                  <FiUnlock size={10} /> En cours
                                </Badge>
                              )}
                            </td>
                            <td style={tdStyle}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '100px' }}>
                                <ProgressBar
                                  now={pct}
                                  style={{ flex: 1, height: '6px', borderRadius: '3px' }}
                                  variant={pct >= 75 ? 'success' : pct >= 50 ? 'warning' : 'danger'}
                                />
                                <span style={{ fontSize: '11px', color: 'var(--color-textSecondary)', minWidth: '28px' }}>
                                  {pct}%
                                </span>
                              </div>
                              {session.total_students > 0 && (
                                <small style={{ color: 'var(--color-textSecondary)', fontSize: '11px' }}>
                                  {session.present_count}/{session.total_students}
                                </small>
                              )}
                            </td>
                            <td style={{ ...tdStyle, textAlign: 'center' }}>
                              <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                                <Button
                                  size="sm" variant="outline-primary"
                                  onClick={() => handleOpenTake(session, true)}
                                  style={{ borderRadius: '6px', padding: '3px 8px' }}
                                  title="Voir"
                                >
                                  <FiEye size={13} />
                                </Button>
                                {!session.is_finalized && (
                                  <>
                                    <Button
                                      size="sm" variant="outline-secondary"
                                      onClick={() => handleOpenTake(session, false)}
                                      style={{ borderRadius: '6px', padding: '3px 8px' }}
                                      title="Pointer les présences"
                                    >
                                      <FiEdit2 size={13} />
                                    </Button>
                                    <Button
                                      size="sm" variant="warning"
                                      onClick={(e) => handleFinalize(session.id, e)}
                                      style={{ borderRadius: '6px', padding: '3px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: '600', color: '#856404' }}
                                      title="Clôturer la séance (comptabiliser les heures en paie)"
                                    >
                                      <FiLock size={11} /> Clôturer
                                    </Button>
                                  </>
                                )}
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>
          )}
        </motion.div>
      )}

      {/* ══════════════ VIEW: CREATE ══════════════ */}
      {view === 'create' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card style={{ border: 'none', borderRadius: '12px', background: 'var(--color-cardBg)', maxWidth: '640px', margin: '0 auto', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <Card.Body style={{ padding: '18px' }}>
              <Form onSubmit={handleCreateSession}>
                <Row className="g-3">
                  <Col xs={12}>
                    <Form.Group>
                      <Form.Label style={labelStyle}>Cours *</Form.Label>
                      <Form.Select
                        required value={form.course}
                        onChange={e => setForm({ ...form, course: e.target.value })}
                        style={inputStyle}
                      >
                        <option value="">— Sélectionnez un cours —</option>
                        {courses.map(c => (
                          <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label style={labelStyle}>Date *</Form.Label>
                      <Form.Control
                        type="date" required value={form.date}
                        onChange={e => setForm({ ...form, date: e.target.value })}
                        style={inputStyle}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label style={labelStyle}>Heure début *</Form.Label>
                      <Form.Control
                        type="time" required value={form.start_time}
                        onChange={e => setForm({ ...form, start_time: e.target.value })}
                        style={inputStyle}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label style={labelStyle}>Heure fin *</Form.Label>
                      <Form.Control
                        type="time" required value={form.end_time}
                        onChange={e => setForm({ ...form, end_time: e.target.value })}
                        style={inputStyle}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label style={labelStyle}>Type</Form.Label>
                      <Form.Select
                        value={form.session_type}
                        onChange={e => setForm({ ...form, session_type: e.target.value })}
                        style={inputStyle}
                      >
                        <option value="cours">Cours</option>
                        <option value="tp">TP</option>
                        <option value="td">TD</option>
                        <option value="examen">Examen</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label style={labelStyle}>Notes</Form.Label>
                      <Form.Control
                        type="text" value={form.notes}
                        onChange={e => setForm({ ...form, notes: e.target.value })}
                        placeholder="Remarques optionnelles"
                        style={inputStyle}
                      />
                    </Form.Group>
                  </Col>

                  {/* Duration preview */}
                  {form.start_time && form.end_time && form.start_time < form.end_time && (
                    <Col xs={12}>
                      <Alert variant="info" style={{ padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: 0 }}>
                        Durée : <strong>
                          {(() => {
                            const [sh, sm] = form.start_time.split(':').map(Number);
                            const [eh, em] = form.end_time.split(':').map(Number);
                            const mins = (eh * 60 + em) - (sh * 60 + sm);
                            return `${Math.floor(mins / 60)}h${mins % 60 > 0 ? String(mins % 60).padStart(2, '0') : ''}`;
                          })()}
                        </strong>
                        {' '}(sera comptabilisé en paie après clôture)
                      </Alert>
                    </Col>
                  )}

                  <Col xs={12} style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                    <Button variant="outline-secondary" onClick={() => setView('sessions')} style={{ borderRadius: '10px' }}>
                      Annuler
                    </Button>
                    <Button
                      type="submit" disabled={creating}
                      style={{ background: 'linear-gradient(135deg, #4facfe, #00f2fe)', border: 'none', borderRadius: '10px', fontWeight: '600', padding: '8px 24px' }}
                    >
                      {creating ? <Spinner size="sm" className="me-2" /> : <FiPlus size={14} className="me-2" />}
                      Créer la séance
                    </Button>
                  </Col>
                </Row>
              </Form>
            </Card.Body>
          </Card>
        </motion.div>
      )}

      {/* ══════════════ VIEW: TAKE ATTENDANCE ══════════════ */}
      {view === 'take' && selectedSession && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          {/* Status banner */}
          {selectedSession.is_finalized && (
            <Alert variant="success" style={{ borderRadius: '10px', marginBottom: '12px', padding: '8px 16px', fontSize: '13px' }}>
              <FiLock size={13} className="me-2" />
              <strong>Séance clôturée</strong> — Les présences sont en lecture seule. Les heures ont été comptabilisées en paie.
            </Alert>
          )}

          {/* Finalize prompt after saving */}
          {showFinalizePrompt && !selectedSession.is_finalized && (
            <Alert
              variant="warning"
              style={{ borderRadius: '10px', marginBottom: '12px', padding: '10px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}
            >
              <div>
                <FiAlertCircle size={14} className="me-2" />
                <strong>Présences enregistrées.</strong> Clôturez la séance pour que les heures soient comptabilisées en paie.
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <Button size="sm" variant="outline-secondary" onClick={() => setShowFinalizePrompt(false)} style={{ borderRadius: '6px', padding: '3px 10px', fontSize: '12px' }}>
                  Plus tard
                </Button>
                <Button
                  size="sm" variant="warning"
                  onClick={() => { setShowFinalizePrompt(false); handleFinalize(selectedSession.id); }}
                  style={{ borderRadius: '6px', padding: '3px 10px', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <FiLock size={12} /> Clôturer maintenant
                </Button>
              </div>
            </Alert>
          )}

          {/* Summary bar */}
          <Card style={{ border: 'none', borderRadius: '10px', background: 'var(--color-cardBg)', marginBottom: '12px', boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }}>
            <Card.Body style={{ padding: '10px 16px' }}>
              <Row className="g-2 align-items-center">
                {[
                  { key: 'present', label: 'Présents', count: attendanceSummary.present },
                  { key: 'absent',  label: 'Absents',  count: attendanceSummary.absent },
                  { key: 'retard',  label: 'Retards',  count: attendanceSummary.retard },
                  { key: 'excuse',  label: 'Excusés',  count: attendanceSummary.excuse },
                ].map(s => (
                  <Col xs={3} key={s.key} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '18px', fontWeight: '700', color: STATUS_CONFIG[s.key].color }}>
                      {s.count}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--color-textSecondary)' }}>{s.label}</div>
                  </Col>
                ))}
                <Col xs={12} style={{ marginTop: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <ProgressBar
                      now={presentPct}
                      style={{ flex: 1, height: '8px', borderRadius: '4px' }}
                      variant={presentPct >= 75 ? 'success' : presentPct >= 50 ? 'warning' : 'danger'}
                    />
                    <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--color-text)' }}>
                      {presentPct}% présence
                    </span>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Search + filter */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
            <InputGroup style={{ flex: 1, minWidth: '200px' }}>
              <InputGroup.Text style={{ background: 'var(--color-bodyBg)', border: '1px solid var(--color-border)', borderRadius: '10px 0 0 10px' }}>
                <FiSearch size={14} />
              </InputGroup.Text>
              <Form.Control
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ ...inputStyle, borderRadius: '0 10px 10px 0', borderLeft: 'none' }}
              />
            </InputGroup>

            {/* Quick mark all (only in edit mode) */}
            {!isReadOnly && students.length > 0 && (
              <Button
                size="sm" variant="outline-success"
                onClick={() => {
                  const all = {};
                  students.forEach(s => { all[s.id] = 'present'; });
                  setAttendance(all);
                }}
                style={{ borderRadius: '8px', fontSize: '12px', whiteSpace: 'nowrap' }}
              >
                <FiCheck size={12} className="me-1" /> Tous présents
              </Button>
            )}
          </div>

          {/* Student table */}
          <Card style={{ border: 'none', borderRadius: '12px', background: 'var(--color-cardBg)', boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }}>
            <Card.Body style={{ padding: 0 }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <Spinner animation="border" style={{ color: 'var(--color-primary)' }} />
                </div>
              ) : filteredStudents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-textSecondary)', fontSize: '14px' }}>
                  <FiUsers size={32} style={{ marginBottom: '12px', opacity: 0.4 }} />
                  <p>Aucun étudiant trouvé.</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <Table hover style={{ marginBottom: 0, fontSize: '13px' }}>
                    <thead>
                      <tr style={{ background: 'var(--color-bodyBg)' }}>
                        <th style={{ ...thStyle, width: '36px' }}>#</th>
                        <th style={thStyle}>Nom</th>
                        <th style={thStyle}>Matricule</th>
                        {isReadOnly ? (
                          <th style={thStyle}>Statut</th>
                        ) : (
                          <>
                            <th style={{ ...thStyle, textAlign: 'center', color: STATUS_CONFIG.present.color }}>✓ Présent</th>
                            <th style={{ ...thStyle, textAlign: 'center', color: STATUS_CONFIG.retard.color }}>⏰ Retard</th>
                            <th style={{ ...thStyle, textAlign: 'center', color: STATUS_CONFIG.absent.color }}>✗ Absent</th>
                            <th style={{ ...thStyle, textAlign: 'center', color: STATUS_CONFIG.excuse.color }}>E Excusé</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map((student, idx) => {
                        const currentStatus = attendance[student.id];
                        return (
                          <tr key={student.id}>
                            <td style={{ ...tdStyle, color: 'var(--color-textSecondary)', fontSize: '11px' }}>{idx + 1}</td>
                            <td style={{ ...tdStyle, fontWeight: '500' }}>
                              {student.name || `${student.last_name} ${student.first_name}`}
                            </td>
                            <td style={tdStyle}>
                              <span style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--color-textSecondary)' }}>
                                {student.matricule || '—'}
                              </span>
                            </td>
                            {isReadOnly ? (
                              <td style={tdStyle}>
                                {currentStatus ? (
                                  <Badge
                                    style={{
                                      background: STATUS_CONFIG[currentStatus].bg,
                                      color: STATUS_CONFIG[currentStatus].color,
                                      border: `1px solid ${STATUS_CONFIG[currentStatus].color}40`,
                                      fontWeight: '600', padding: '4px 10px', fontSize: '11px'
                                    }}
                                  >
                                    {STATUS_CONFIG[currentStatus].label}
                                  </Badge>
                                ) : (
                                  <span style={{ fontSize: '12px', color: 'var(--color-textSecondary)' }}>—</span>
                                )}
                              </td>
                            ) : (
                              ['present', 'retard', 'absent', 'excuse'].map(st => (
                                <td key={st} style={{ ...tdStyle, textAlign: 'center' }}>
                                  <button
                                    onClick={() => setAttendance(prev => ({ ...prev, [student.id]: prev[student.id] === st ? undefined : st }))}
                                    style={{
                                      width: '30px', height: '30px', borderRadius: '8px',
                                      border: currentStatus === st ? 'none' : `1.5px solid ${STATUS_CONFIG[st].color}60`,
                                      background: currentStatus === st ? STATUS_CONFIG[st].color : 'transparent',
                                      color: currentStatus === st ? 'white' : STATUS_CONFIG[st].color,
                                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      fontSize: '14px', fontWeight: '700',
                                      transition: 'all 0.15s ease',
                                    }}
                                    title={STATUS_CONFIG[st].label}
                                  >
                                    {st === 'present' && '✓'}
                                    {st === 'absent'  && '✗'}
                                    {st === 'retard'  && '⏰'}
                                    {st === 'excuse'  && 'E'}
                                  </button>
                                </td>
                              ))
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Bottom actions */}
          {!isReadOnly && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <span style={{ fontSize: '13px', color: 'var(--color-textSecondary)' }}>
                {Object.keys(attendance).filter(k => attendance[k]).length}/{students.length} étudiants marqués
              </span>
              <div style={{ display: 'flex', gap: '10px' }}>
                <Button
                  variant="success"
                  onClick={handleSaveAttendance}
                  disabled={savingAtt}
                  style={{ borderRadius: '10px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {savingAtt ? <Spinner size="sm" /> : <FiCheck size={14} />}
                  Enregistrer
                </Button>
                {!selectedSession.is_finalized && (
                  <Button
                    variant="outline-danger"
                    onClick={() => handleFinalize(selectedSession.id)}
                    style={{ borderRadius: '10px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <FiLock size={14} /> Enregistrer & Clôturer
                  </Button>
                )}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* ══════════════ VIEW: REPORTS ══════════════ */}
      {view === 'reports' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card style={{ border: 'none', borderRadius: '14px', background: 'var(--color-cardBg)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: '20px' }}>
            <Card.Body style={{ padding: '20px' }}>
              <Row className="g-2 align-items-end">
                <Col md={8}>
                  <Form.Label style={labelStyle}>Sélectionner un cours</Form.Label>
                  <Form.Select
                    value={reportCourse}
                    onChange={e => { setReportCourse(e.target.value); handleLoadReport(e.target.value); }}
                    style={inputStyle}
                  >
                    <option value="">— Choisissez un cours —</option>
                    {courses.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.code})</option>
                    ))}
                  </Form.Select>
                </Col>
                <Col md={4}>
                  <Button
                    variant="outline-secondary"
                    disabled={!reportCourse}
                    onClick={() => handleLoadReport(reportCourse)}
                    style={{ borderRadius: '10px', width: '100%' }}
                  >
                    <FiRefreshCw size={14} className="me-1" /> Actualiser
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {loadingReport && (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Spinner animation="border" style={{ color: 'var(--color-primary)' }} />
            </div>
          )}

          {reportData && !loadingReport && (
            <>
              <Row className="g-3 mb-3">
                {[
                  { label: 'Taux de présence', value: `${reportData.average_attendance_rate || 0}%`, color: '#28a745' },
                  { label: 'Sessions',          value: reportData.total_sessions || 0,               color: '#4facfe' },
                  { label: 'Étudiants',         value: reportData.total_students || 0,               color: '#a78bfa' },
                ].map((s, i) => (
                  <Col md={4} key={i}>
                    <Card style={{ border: 'none', borderRadius: '12px', background: 'var(--color-cardBg)', boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }}>
                      <Card.Body style={{ padding: '16px', textAlign: 'center' }}>
                        <div style={{ fontSize: '28px', fontWeight: '800', color: s.color }}>{s.value}</div>
                        <div style={{ fontSize: '12px', color: 'var(--color-textSecondary)' }}>{s.label}</div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>

              {reportData.students?.length > 0 && (
                <Card style={{ border: 'none', borderRadius: '14px', background: 'var(--color-cardBg)', boxShadow: '0 2px 6px rgba(0,0,0,0.05)' }}>
                  <Card.Body style={{ padding: 0 }}>
                    <div style={{ overflowX: 'auto' }}>
                      <Table hover style={{ marginBottom: 0, fontSize: '13px' }}>
                        <thead>
                          <tr style={{ background: 'var(--color-bodyBg)' }}>
                            <th style={thStyle}>Étudiant</th>
                            <th style={thStyle}>Matricule</th>
                            <th style={thStyle}>Présent</th>
                            <th style={thStyle}>Absent</th>
                            <th style={thStyle}>Retard</th>
                            <th style={thStyle}>Excusé</th>
                            <th style={thStyle}>Taux</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportData.students.map(s => (
                            <tr key={s.student_id}>
                              <td style={{ ...tdStyle, fontWeight: '500' }}>{s.student_name}</td>
                              <td style={tdStyle}><span style={{ fontFamily: 'monospace', fontSize: '12px' }}>{s.student_matricule}</span></td>
                              <td style={{ ...tdStyle, color: '#28a745', fontWeight: '600' }}>{s.present_count}</td>
                              <td style={{ ...tdStyle, color: '#dc3545' }}>{s.absent_count}</td>
                              <td style={{ ...tdStyle, color: '#ffc107' }}>{s.late_count}</td>
                              <td style={{ ...tdStyle, color: '#17a2b8' }}>{s.excused_count}</td>
                              <td style={tdStyle}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <ProgressBar
                                    now={s.attendance_rate}
                                    style={{ flex: 1, height: '6px', borderRadius: '3px', minWidth: '60px' }}
                                    variant={s.attendance_rate >= 75 ? 'success' : s.attendance_rate >= 50 ? 'warning' : 'danger'}
                                  />
                                  <span style={{ fontSize: '12px', color: 'var(--color-textSecondary)', minWidth: '34px' }}>
                                    {s.attendance_rate}%
                                  </span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  </Card.Body>
                </Card>
              )}
            </>
          )}
        </motion.div>
      )}
    </Container>
  );
};

// ── Styles ─────────────────────────────────────────────────────────────────
const thStyle = {
  padding: '8px 12px', fontSize: '11px', fontWeight: '600',
  color: 'var(--color-text)', borderBottom: '2px solid var(--color-border)',
  whiteSpace: 'nowrap'
};
const tdStyle = {
  padding: '8px 12px', fontSize: '13px', color: 'var(--color-text)',
  borderBottom: '1px solid var(--color-border)', verticalAlign: 'middle'
};
const labelStyle = {
  fontWeight: '600', fontSize: '12px', color: 'var(--color-text)', marginBottom: '4px', display: 'block'
};
const inputStyle = {
  borderRadius: '8px', border: '1px solid var(--color-border)',
  background: 'var(--color-bodyBg)', color: 'var(--color-text)', padding: '7px 10px', fontSize: '13px'
};

export default AttendanceManagement;
