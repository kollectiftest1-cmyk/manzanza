/**
 * 📅 CALENDRIER ACADÉMIQUE
 * ========================
 * Gestion complète du calendrier académique:
 * - Années académiques (CRUD)
 * - Trimestres/Semestres (CRUD)
 * - Événements académiques (vacances, fériés, examens…)
 * - Vue calendrier visuelle
 * - Duplication de planning
 */

import { useState, useEffect, useCallback, useMemo } from "react"
import { useSelector } from "react-redux"
import {
  Container, Row, Col, Card, Button, Badge, Modal, Form, Alert, Spinner,
  Tab, Tabs, Table, OverlayTrigger, Tooltip, ProgressBar
} from "react-bootstrap"
import {
  FiCalendar, FiPlus, FiEdit2, FiTrash2, FiCheck, FiCopy,
  FiChevronLeft, FiChevronRight, FiStar, FiClock, FiBookOpen, FiAlertCircle
} from "react-icons/fi"
import scheduleService from "../services/scheduleService"
import { notifyError } from "../utils/notify"

// ─── Helpers ────────────────────────────────────────────────────────────────
const isAdminOrSGA = (role) =>
  ['sga', 'pdg', 'directeur_general', 'sgad'].includes(role)

const formatDate = (d) => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

const inclusiveDayCount = (start, end) => {
  if (!start || !end) return null
  const toUtc = (value) => {
    const [year, month, day] = value.split('-').map(Number)
    return Date.UTC(year, month - 1, day)
  }
  const diff = Math.floor((toUtc(end) - toUtc(start)) / 86400000) + 1
  return diff > 0 ? diff : null
}

const durationLabel = (start, end) => {
  const days = inclusiveDayCount(start, end)
  if (!days) return null
  return `${days} jour${days > 1 ? 's' : ''} inclus`
}

const EVENT_COLORS = {
  vacance: '#28a745',
  ferie: '#dc3545',
  examen: '#fd7e14',
  rattrapage: '#6f42c1',
  rentree: '#007bff',
  ceremonie: '#20c997',
  autre: '#6c757d',
}

const EVENT_LABELS = {
  vacance: 'Vacances',
  ferie: 'Jour férié',
  examen: 'Examen',
  rattrapage: 'Rattrapage',
  rentree: 'Rentrée',
  ceremonie: 'Cérémonie',
  autre: 'Autre',
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

const CalendrierAcademique = () => {
  const { user } = useSelector((state) => state.auth)
  const canEdit = isAdminOrSGA(user?.role)

  const [activeTab, setActiveTab] = useState("calendrier")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  // Data
  const [academicYears, setAcademicYears] = useState([])
  const [selectedYear, setSelectedYear] = useState(null)
  const [terms, setTerms] = useState([])
  const [events, setEvents] = useState([])

  // Calendar view
  const [calendarMonth, setCalendarMonth] = useState(new Date())

  // Modals
  const [showYearModal, setShowYearModal] = useState(false)
  const [showTermModal, setShowTermModal] = useState(false)
  const [showEventModal, setShowEventModal] = useState(false)
  const [showDuplicateModal, setShowDuplicateModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)

  // ─── Load Data ──────────────────────────────────────────────────────────
  const loadYears = useCallback(async () => {
    try {
      const raw = await scheduleService.getAcademicYears()
      const data = Array.isArray(raw) ? raw : raw?.results || []
      setAcademicYears(data)
      // Auto-select current year
      const current = data.find(y => y.is_current)
      if (current && !selectedYear) setSelectedYear(current)
      else if (data.length > 0 && !selectedYear) setSelectedYear(data[0])
    } catch (e) {
      notifyError(e, "Impossible de charger les années académiques.")
    }
  }, [selectedYear])

  const loadTermsAndEvents = useCallback(async () => {
    if (!selectedYear) return
    try {
      const [termsRaw, eventsRaw] = await Promise.all([
        scheduleService.getTerms({ academic_year: selectedYear.id }),
        scheduleService.getAcademicEvents({ academic_year: selectedYear.id }),
      ])
      setTerms(Array.isArray(termsRaw) ? termsRaw : termsRaw?.results || [])
      setEvents(Array.isArray(eventsRaw) ? eventsRaw : eventsRaw?.results || [])
    } catch (e) {
      notifyError(e, "Impossible de charger les trimestres/événements.")
    }
  }, [selectedYear])

  useEffect(() => {
    setLoading(true)
    loadYears().finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (selectedYear) loadTermsAndEvents()
  }, [selectedYear, loadTermsAndEvents])

  // ─── Auto-dismiss success ───────────────────────────────────────────────
  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(null), 4000)
      return () => clearTimeout(t)
    }
  }, [success])

  // ─── CRUD Handlers ─────────────────────────────────────────────────────

  // Academic Year
  const handleSaveYear = async (formData) => {
    try {
      if (editingItem) {
        await scheduleService.updateAcademicYear(editingItem.id, formData)
        setSuccess("Année académique mise à jour.")
      } else {
        await scheduleService.createAcademicYear(formData)
        setSuccess("Année académique créée.")
      }
      setShowYearModal(false)
      setEditingItem(null)
      await loadYears()
    } catch (e) {
      notifyError(e, e.response?.data?.detail || "Erreur lors de la sauvegarde.")
    }
  }

  const handleDeleteYear = async (id) => {
    if (!window.confirm("Supprimer cette année académique ? Tous les trimestres et événements associés seront aussi supprimés.")) return
    try {
      await scheduleService.deleteAcademicYear(id)
      setSuccess("Année académique supprimée.")
      if (selectedYear?.id === id) setSelectedYear(null)
      await loadYears()
    } catch (e) {
      notifyError(e, "Impossible de supprimer cette année.")
    }
  }

  const handleSetCurrent = async (id) => {
    try {
      const updated = await scheduleService.setCurrentYear(id)
      setSuccess(`${updated.name} définie comme année en cours.`)
      await loadYears()
      setSelectedYear(updated)
    } catch (e) {
      notifyError(e, "Impossible de définir l'année en cours.")
    }
  }

  // Term
  const handleSaveTerm = async (formData) => {
    try {
      const payload = { ...formData, academic_year: selectedYear.id }
      if (editingItem) {
        await scheduleService.updateTerm(editingItem.id, payload)
        setSuccess("Trimestre/semestre mis à jour.")
      } else {
        await scheduleService.createTerm(payload)
        setSuccess("Trimestre/semestre créé.")
      }
      setShowTermModal(false)
      setEditingItem(null)
      await loadTermsAndEvents()
    } catch (e) {
      notifyError(e, e.response?.data?.detail || JSON.stringify(e.response?.data) || "Erreur lors de la sauvegarde.")
    }
  }

  const handleDeleteTerm = async (id) => {
    if (!window.confirm("Supprimer ce trimestre/semestre ?")) return
    try {
      await scheduleService.deleteTerm(id)
      setSuccess("Trimestre/semestre supprimé.")
      await loadTermsAndEvents()
    } catch (e) {
      notifyError(e, "Impossible de supprimer ce trimestre.")
    }
  }

  // Event
  const handleSaveEvent = async (formData) => {
    try {
      const payload = { ...formData, academic_year: selectedYear.id }
      if (editingItem) {
        await scheduleService.updateAcademicEvent(editingItem.id, payload)
        setSuccess("Événement mis à jour.")
      } else {
        await scheduleService.createAcademicEvent(payload)
        setSuccess("Événement créé.")
      }
      setShowEventModal(false)
      setEditingItem(null)
      await loadTermsAndEvents()
    } catch (e) {
      notifyError(e, e.response?.data?.detail || JSON.stringify(e.response?.data) || "Erreur lors de la sauvegarde.")
    }
  }

  const handleDeleteEvent = async (id) => {
    if (!window.confirm("Supprimer cet événement ?")) return
    try {
      await scheduleService.deleteAcademicEvent(id)
      setSuccess("Événement supprimé.")
      await loadTermsAndEvents()
    } catch (e) {
      notifyError(e, "Impossible de supprimer cet événement.")
    }
  }

  // Duplication
  const handleDuplicate = async (data) => {
    try {
      const result = await scheduleService.duplicatePlanning(data)
      setSuccess(result.message)
      setShowDuplicateModal(false)
    } catch (e) {
      notifyError(e, e.response?.data?.error || "Erreur lors de la duplication.")
    }
  }

  // Publish calendar
  const [publishing, setPublishing] = useState(false)

  const handlePublishCalendar = async () => {
    if (!selectedYear) return
    const already = selectedYear.is_published ? " (déjà publié, sera re-publié)" : ""
    if (!window.confirm(
      `Publier le calendrier académique ${selectedYear.name}${already} ?\n\n` +
      `Tous les utilisateurs actifs recevront une notification.`
    )) return
    try {
      setPublishing(true)
      const result = await scheduleService.publishCalendar(selectedYear.id)
      setSuccess(`${result.message} (${result.notifications_sent} notification(s) envoyée(s))`)
      // Update local state
      setSelectedYear(result.year)
      setAcademicYears(prev => prev.map(y => y.id === result.year.id ? result.year : y))
    } catch (e) {
      notifyError(e, e.response?.data?.error || "Erreur lors de la publication.")
    } finally {
      setPublishing(false)
    }
  }

  // ─── Calendar View Logic ─────────────────────────────────────────────────
  const getDaysInMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startPad = (firstDay.getDay() + 6) % 7 // Monday = 0
    const days = []

    for (let i = startPad - 1; i >= 0; i--) {
      const d = new Date(year, month, -i)
      days.push({ date: d, isCurrentMonth: false })
    }
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true })
    }
    while (days.length % 7 !== 0) {
      const d = new Date(year, month + 1, days.length - lastDay.getDate() - startPad + 1)
      days.push({ date: d, isCurrentMonth: false })
    }
    return days
  }

  const getEventsForDate = (date) => {
    const d = date.toISOString().slice(0, 10)
    return events.filter(e => e.start_date <= d && e.end_date >= d)
  }

  const getTermForDate = (date) => {
    const d = date.toISOString().slice(0, 10)
    return terms.find(t => t.start_date <= d && t.end_date >= d)
  }

  const isExamPeriod = (date) => {
    const d = date.toISOString().slice(0, 10)
    return terms.some(t =>
      t.exam_start_date && t.exam_end_date && t.exam_start_date <= d && t.exam_end_date >= d
    )
  }

  const prevMonth = () => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))
  const nextMonth = () => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))

  const calendarDays = getDaysInMonth(calendarMonth)
  const monthLabel = calendarMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

  // ─── Render ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Container className="py-4 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2 text-muted">Chargement du calendrier académique…</p>
      </Container>
    )
  }

  return (
    <Container fluid className="py-4 px-3 px-md-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="fw-bold mb-1">
            <FiCalendar className="me-2" />
            Calendrier Académique
          </h2>
          <p className="text-muted mb-0">
            Gestion des années académiques, trimestres et événements
          </p>
        </div>
        {canEdit && (
          <div className="d-flex gap-2 flex-wrap">
            <Button variant="primary" size="sm" onClick={() => { setEditingItem(null); setShowYearModal(true) }}>
              <FiPlus className="me-1" /> Année
            </Button>
            {selectedYear && (
              <>
                <Button variant="outline-primary" size="sm" onClick={() => { setEditingItem(null); setShowTermModal(true) }}>
                  <FiPlus className="me-1" /> Trimestre
                </Button>
                <Button variant="outline-success" size="sm" onClick={() => { setEditingItem(null); setShowEventModal(true) }}>
                  <FiPlus className="me-1" /> Événement
                </Button>
                {terms.length >= 2 && (
                  <Button variant="outline-secondary" size="sm" onClick={() => setShowDuplicateModal(true)}>
                    <FiCopy className="me-1" /> Dupliquer planning
                  </Button>
                )}
                <Button
                  variant={selectedYear?.is_published ? "outline-success" : "success"}
                  size="sm"
                  onClick={handlePublishCalendar}
                  disabled={publishing}
                >
                  {publishing ? (
                    <><Spinner size="sm" animation="border" className="me-1" /> Publication…</>
                  ) : (
                    <><FiCheck className="me-1" /> {selectedYear?.is_published ? 'Re-publier' : 'Publier'}</>
                  )}
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Alerts */}
      {error && <Alert variant="danger" dismissible onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert variant="success" dismissible onClose={() => setSuccess(null)}>{success}</Alert>}

      {/* Year selector */}
      {academicYears.length > 0 && (
        <Card className="mb-4 border-0 shadow-sm">
          <Card.Body className="py-2">
            <div className="d-flex align-items-center gap-2 flex-wrap">
              <strong className="me-2">Année académique :</strong>
              {academicYears.map(y => (
                <Button
                  key={y.id}
                  variant={selectedYear?.id === y.id ? "primary" : "outline-secondary"}
                  size="sm"
                  onClick={() => setSelectedYear(y)}
                  className="rounded-pill"
                >
                  {y.name}
                  {y.is_current && <FiStar className="ms-1" size={12} />}
                  {y.is_published && <Badge bg="success" pill className="ms-1" style={{ fontSize: '0.6rem' }}>Publié</Badge>}
                </Button>
              ))}
            </div>
          </Card.Body>
        </Card>
      )}

      {!selectedYear && academicYears.length === 0 && (
        <Alert variant="info">
          Aucune année académique configurée.
          {canEdit && " Commencez par créer une année académique."}
        </Alert>
      )}

      {selectedYear && (
        <Tabs activeKey={activeTab} onSelect={setActiveTab} className="mb-4">
          {/* ─── Tab: Calendrier ──────────────────────────────────────── */}
          <Tab eventKey="calendrier" title={<><FiCalendar className="me-1" /> Calendrier</>}>
            <Card className="border-0 shadow-sm">
              <Card.Body>
                {/* Month navigation */}
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <Button variant="outline-secondary" size="sm" onClick={prevMonth}>
                    <FiChevronLeft />
                  </Button>
                  <h5 className="mb-0 text-capitalize fw-bold">{monthLabel}</h5>
                  <Button variant="outline-secondary" size="sm" onClick={nextMonth}>
                    <FiChevronRight />
                  </Button>
                </div>

                {/* Calendar grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
                  {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => (
                    <div key={d} className="text-center fw-bold text-muted py-2" style={{ fontSize: '0.8rem' }}>
                      {d}
                    </div>
                  ))}
                  {calendarDays.map((dayObj, idx) => {
                    const dayEvents = getEventsForDate(dayObj.date)
                    const term = getTermForDate(dayObj.date)
                    const isExam = isExamPeriod(dayObj.date)
                    const isToday = dayObj.date.toDateString() === new Date().toDateString()

                    return (
                      <OverlayTrigger
                        key={idx}
                        placement="top"
                        overlay={
                          <Tooltip>
                            {dayObj.date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                            {term && <div><strong>{term.name}</strong></div>}
                            {isExam && <div className="text-warning">📝 Période d'examen</div>}
                            {dayEvents.map(e => <div key={e.id}>• {e.name}</div>)}
                          </Tooltip>
                        }
                      >
                        <div
                          style={{
                            padding: '4px',
                            minHeight: '70px',
                            backgroundColor: !dayObj.isCurrentMonth ? '#f8f9fa'
                              : isToday ? '#e7f0ff'
                                : isExam ? '#fff3cd'
                                  : term ? '#f0fff0'
                                    : '#fff',
                            border: isToday ? '2px solid #007bff' : '1px solid #dee2e6',
                            borderRadius: '4px',
                            cursor: 'default',
                          }}
                        >
                          <div style={{
                            fontSize: '0.75rem',
                            fontWeight: isToday ? '700' : '500',
                            color: dayObj.isCurrentMonth ? '#333' : '#aaa',
                            marginBottom: '2px',
                          }}>
                            {dayObj.date.getDate()}
                          </div>
                          {dayEvents.slice(0, 2).map(e => (
                            <div key={e.id} style={{
                              fontSize: '0.65rem',
                              padding: '1px 4px',
                              marginBottom: '1px',
                              borderRadius: '3px',
                              backgroundColor: e.color || EVENT_COLORS[e.event_type] || '#6c757d',
                              color: '#fff',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}>
                              {e.name}
                            </div>
                          ))}
                          {dayEvents.length > 2 && (
                            <div style={{ fontSize: '0.6rem', color: '#6c757d' }}>+{dayEvents.length - 2} autres</div>
                          )}
                        </div>
                      </OverlayTrigger>
                    )
                  })}
                </div>

                {/* Legend */}
                <div className="mt-3 d-flex gap-3 flex-wrap" style={{ fontSize: '0.8rem' }}>
                  <span><span style={{ display: 'inline-block', width: 12, height: 12, backgroundColor: '#f0fff0', border: '1px solid #ccc', borderRadius: 2 }} /> Cours</span>
                  <span><span style={{ display: 'inline-block', width: 12, height: 12, backgroundColor: '#fff3cd', border: '1px solid #ccc', borderRadius: 2 }} /> Examens</span>
                  {Object.entries(EVENT_COLORS).map(([type, color]) => (
                    <span key={type}><span style={{ display: 'inline-block', width: 12, height: 12, backgroundColor: color, borderRadius: 2 }} /> {EVENT_LABELS[type]}</span>
                  ))}
                </div>
              </Card.Body>
            </Card>
          </Tab>

          {/* ─── Tab: Trimestres ─────────────────────────────────────── */}
          <Tab eventKey="trimestres" title={<><FiClock className="me-1" /> Trimestres</>}>
            <Card className="border-0 shadow-sm">
              <Card.Body>
                {terms.length === 0 ? (
                  <p className="text-muted text-center py-3">
                    Aucun trimestre/semestre configuré pour {selectedYear.name}.
                  </p>
                ) : (
                  <Table responsive hover>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Nom</th>
                        <th>Type</th>
                        <th>Cours</th>
                        <th>Examens</th>
                        <th>Rattrapage</th>
                        <th>Statut</th>
                        {canEdit && <th>Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {terms.map(t => (
                        <tr key={t.id}>
                          <td>{t.order}</td>
                          <td className="fw-semibold">{t.name}</td>
                          <td><Badge bg="info">{t.term_type_display}</Badge></td>
                          <td>
                            <small>{formatDate(t.start_date)} → {formatDate(t.end_courses_date || t.end_date)}</small>
                            {t.end_courses_date && (
                              <div className="text-muted" style={{ fontSize: '0.7rem' }}>Fin période: {formatDate(t.end_date)}</div>
                            )}
                          </td>
                          <td>
                            {t.exam_start_date ? (
                              <small>{formatDate(t.exam_start_date)} → {formatDate(t.exam_end_date)}</small>
                            ) : <span className="text-muted">—</span>}
                          </td>
                          <td>
                            {t.rattrapage_start_date ? (
                              <small>{formatDate(t.rattrapage_start_date)} → {formatDate(t.rattrapage_end_date)}</small>
                            ) : <span className="text-muted">—</span>}
                          </td>
                          <td>
                            <Badge bg={t.is_active ? 'success' : 'secondary'}>
                              {t.is_active ? 'Actif' : 'Inactif'}
                            </Badge>
                          </td>
                          {canEdit && (
                            <td>
                              <Button variant="outline-primary" size="sm" className="me-1"
                                onClick={() => { setEditingItem(t); setShowTermModal(true) }}>
                                <FiEdit2 size={14} />
                              </Button>
                              <Button variant="outline-danger" size="sm"
                                onClick={() => handleDeleteTerm(t.id)}>
                                <FiTrash2 size={14} />
                              </Button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}

                {/* Term timeline */}
                {terms.length > 0 && selectedYear && (
                  <div className="mt-4">
                    <h6 className="fw-bold mb-3">Timeline de l'année</h6>
                    <TimelineBar terms={terms} year={selectedYear} events={events} />
                  </div>
                )}
              </Card.Body>
            </Card>
          </Tab>

          {/* ─── Tab: Événements ─────────────────────────────────────── */}
          <Tab eventKey="evenements" title={<><FiBookOpen className="me-1" /> Événements</>}>
            <Card className="border-0 shadow-sm">
              <Card.Body>
                {events.length === 0 ? (
                  <p className="text-muted text-center py-3">
                    Aucun événement pour {selectedYear.name}.
                  </p>
                ) : (
                  <Table responsive hover>
                    <thead>
                      <tr>
                        <th>Événement</th>
                        <th>Type</th>
                        <th>Période</th>
                        <th>Trimestre</th>
                        {canEdit && <th>Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {events.map(e => (
                        <tr key={e.id}>
                          <td>
                            <span style={{
                              display: 'inline-block', width: 10, height: 10, borderRadius: '50%',
                              backgroundColor: e.color || EVENT_COLORS[e.event_type], marginRight: 8
                            }} />
                            <span className="fw-semibold">{e.name}</span>
                            {e.is_auto_generated && (
                              <Badge bg="light" text="dark" className="ms-2" style={{ fontSize: '0.65rem', fontWeight: 400 }}>auto</Badge>
                            )}
                            {e.description && <div className="text-muted" style={{ fontSize: '0.8rem' }}>{e.description}</div>}
                          </td>
                          <td>
                            <Badge style={{ backgroundColor: EVENT_COLORS[e.event_type] }}>
                              {EVENT_LABELS[e.event_type]}
                            </Badge>
                          </td>
                          <td><small>{formatDate(e.start_date)} → {formatDate(e.end_date)}</small></td>
                          <td>{e.term_name || '—'}</td>
                          {canEdit && (
                            <td>
                              <Button variant="outline-primary" size="sm" className="me-1"
                                onClick={() => { setEditingItem(e); setShowEventModal(true) }}>
                                <FiEdit2 size={14} />
                              </Button>
                              <Button variant="outline-danger" size="sm"
                                onClick={() => handleDeleteEvent(e.id)}>
                                <FiTrash2 size={14} />
                              </Button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </Card.Body>
            </Card>
          </Tab>

          {/* ─── Tab: Années ──────────────────────────────────────────── */}
          <Tab eventKey="annees" title={<><FiStar className="me-1" /> Années</>}>
            <Card className="border-0 shadow-sm">
              <Card.Body>
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Année</th>
                      <th>Période</th>
                      <th>Statut</th>
                      {canEdit && <th>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {academicYears.map(y => (
                      <tr key={y.id} className={y.is_current ? 'table-primary' : ''}>
                        <td className="fw-semibold">{y.name}</td>
                        <td>{formatDate(y.start_date)} → {formatDate(y.end_date)}</td>
                        <td>
                          {y.is_current ? (
                            <Badge bg="success"><FiCheck className="me-1" /> En cours</Badge>
                          ) : (
                            <Badge bg="secondary">Archivée</Badge>
                          )}
                        </td>
                        {canEdit && (
                          <td>
                            {!y.is_current && (
                              <Button variant="outline-success" size="sm" className="me-1"
                                onClick={() => handleSetCurrent(y.id)} title="Définir comme année en cours">
                                <FiStar size={14} />
                              </Button>
                            )}
                            <Button variant="outline-primary" size="sm" className="me-1"
                              onClick={() => { setEditingItem(y); setShowYearModal(true) }}>
                              <FiEdit2 size={14} />
                            </Button>
                            <Button variant="outline-danger" size="sm"
                              onClick={() => handleDeleteYear(y.id)}>
                              <FiTrash2 size={14} />
                            </Button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          </Tab>
        </Tabs>
      )}

      {/* ─── MODALS ────────────────────────────────────────────────────────── */}

      {/* Year Modal */}
      <YearFormModal
        show={showYearModal}
        onHide={() => { setShowYearModal(false); setEditingItem(null) }}
        onSave={handleSaveYear}
        editing={editingItem}
      />

      {/* Term Modal */}
      <TermFormModal
        show={showTermModal}
        onHide={() => { setShowTermModal(false); setEditingItem(null) }}
        onSave={handleSaveTerm}
        editing={editingItem}
      />

      {/* Event Modal */}
      <EventFormModal
        show={showEventModal}
        onHide={() => { setShowEventModal(false); setEditingItem(null) }}
        onSave={handleSaveEvent}
        editing={editingItem}
        terms={terms}
      />

      {/* Duplicate Modal */}
      <DuplicateModal
        show={showDuplicateModal}
        onHide={() => setShowDuplicateModal(false)}
        onDuplicate={handleDuplicate}
        terms={terms}
      />
    </Container>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// SUB COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

// Timeline bar showing terms within academic year
const TimelineBar = ({ terms, year, events }) => {
  if (!year || !terms.length) return null
  const yearStart = new Date(year.start_date).getTime()
  const yearEnd = new Date(year.end_date).getTime()
  const totalMs = yearEnd - yearStart || 1

  return (
    <div style={{ position: 'relative', height: '60px', backgroundColor: '#f1f3f5', borderRadius: 8, overflow: 'hidden' }}>
      {terms.map(t => {
        const start = Math.max(0, (new Date(t.start_date).getTime() - yearStart) / totalMs * 100)
        const end = Math.min(100, (new Date(t.end_date).getTime() - yearStart) / totalMs * 100)
        return (
          <OverlayTrigger key={t.id} placement="top" overlay={<Tooltip>{t.name}: {formatDate(t.start_date)} → {formatDate(t.end_date)}</Tooltip>}>
            <div style={{
              position: 'absolute', left: `${start}%`, width: `${end - start}%`,
              top: '8px', height: '24px', backgroundColor: '#4e73df', borderRadius: 4,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: '0.7rem', fontWeight: 600,
              cursor: 'default', whiteSpace: 'nowrap', overflow: 'hidden',
            }}>
              {t.name}
            </div>
          </OverlayTrigger>
        )
      })}
      {events.filter(e => e.event_type === 'vacance').map(e => {
        const start = Math.max(0, (new Date(e.start_date).getTime() - yearStart) / totalMs * 100)
        const end = Math.min(100, (new Date(e.end_date).getTime() - yearStart) / totalMs * 100)
        return (
          <OverlayTrigger key={e.id} placement="bottom" overlay={<Tooltip>{e.name}</Tooltip>}>
            <div style={{
              position: 'absolute', left: `${start}%`, width: `${end - start}%`,
              top: '38px', height: '14px', backgroundColor: EVENT_COLORS.vacance, borderRadius: 3,
              fontSize: '0.6rem', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden', whiteSpace: 'nowrap',
            }}>
              {e.name}
            </div>
          </OverlayTrigger>
        )
      })}
    </div>
  )
}

// ─── Year Form Modal ────────────────────────────────────────────────────────
const YearFormModal = ({ show, onHide, onSave, editing }) => {
  const [form, setForm] = useState({ name: '', start_date: '', end_date: '', is_current: false, description: '' })

  useEffect(() => {
    if (editing) {
      setForm({
        name: editing.name || '',
        start_date: editing.start_date || '',
        end_date: editing.end_date || '',
        is_current: editing.is_current || false,
        description: editing.description || '',
      })
    } else {
      setForm({ name: '', start_date: '', end_date: '', is_current: false, description: '' })
    }
  }, [editing, show])

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>{editing ? 'Modifier' : 'Nouvelle'} Année Académique</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Group className="mb-3">
          <Form.Label className="fw-semibold">Nom *</Form.Label>
          <Form.Control
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="Ex: 2025-2026"
          />
        </Form.Group>
        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Date de début *</Form.Label>
              <Form.Control type="date" value={form.start_date}
                onChange={e => setForm({ ...form, start_date: e.target.value })} />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Date de fin *</Form.Label>
              <Form.Control type="date" value={form.end_date}
                onChange={e => setForm({ ...form, end_date: e.target.value })} />
            </Form.Group>
          </Col>
        </Row>
        {durationLabel(form.start_date, form.end_date) && (
          <div className="text-muted small mb-3">
            Duree inclusive: {durationLabel(form.start_date, form.end_date)}
          </div>
        )}
        <Form.Group className="mb-3">
          <Form.Check type="switch" label="Année en cours" checked={form.is_current}
            onChange={e => setForm({ ...form, is_current: e.target.checked })} />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Description</Form.Label>
          <Form.Control as="textarea" rows={2} value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            placeholder="Notes sur cette année académique…" />
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Annuler</Button>
        <Button variant="primary" onClick={() => onSave(form)}
          disabled={!form.name || !form.start_date || !form.end_date}>
          {editing ? 'Enregistrer' : 'Créer'}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

// ─── Term Form Modal ────────────────────────────────────────────────────────
const TermFormModal = ({ show, onHide, onSave, editing }) => {
  const [form, setForm] = useState({
    name: '', term_type: 'trimestre', order: 1,
    start_date: '', end_date: '', end_courses_date: '',
    exam_start_date: '', exam_end_date: '',
    rattrapage_start_date: '', rattrapage_end_date: '',
    auto_generate_events: true,
    is_active: true,
  })

  useEffect(() => {
    if (editing) {
      setForm({
        name: editing.name || '',
        term_type: editing.term_type || 'trimestre',
        order: editing.order || 1,
        start_date: editing.start_date || '',
        end_date: editing.end_date || '',
        end_courses_date: editing.end_courses_date || '',
        exam_start_date: editing.exam_start_date || '',
        exam_end_date: editing.exam_end_date || '',
        rattrapage_start_date: editing.rattrapage_start_date || '',
        rattrapage_end_date: editing.rattrapage_end_date || '',
        auto_generate_events: editing.auto_generate_events !== undefined ? editing.auto_generate_events : true,
        is_active: editing.is_active !== undefined ? editing.is_active : true,
      })
    } else {
      setForm({
        name: '', term_type: 'trimestre', order: 1,
        start_date: '', end_date: '', end_courses_date: '',
        exam_start_date: '', exam_end_date: '',
        rattrapage_start_date: '', rattrapage_end_date: '',
        auto_generate_events: true,
        is_active: true,
      })
    }
  }, [editing, show])

  // Compute preview of auto-generated events
  const eventPreview = useMemo(() => {
    if (!form.auto_generate_events || !form.start_date) return []
    const preview = []
    const label = form.name || (form.term_type === 'semestre' ? 'Semestre' : 'Trimestre')

    // Rentrée
    preview.push({ type: 'rentree', name: `Rentrée — ${label}`, date: form.start_date, color: '#007bff' })

    // Fin des cours
    const finCours = form.end_courses_date || (form.exam_start_date
      ? (() => { const d = new Date(form.exam_start_date); d.setDate(d.getDate() - 1); return d.toISOString().split('T')[0] })()
      : form.end_date)
    if (finCours) {
      preview.push({ type: 'autre', name: `Fin des cours — ${label}`, date: finCours, color: '#6c757d' })
    }

    // Blocus
    if (form.exam_start_date && finCours) {
      const bloStart = new Date(finCours); bloStart.setDate(bloStart.getDate() + 1)
      const bloEnd = new Date(form.exam_start_date); bloEnd.setDate(bloEnd.getDate() - 1)
      if (bloEnd >= bloStart) {
        preview.push({
          type: 'autre', name: `Blocus — ${label}`,
          date: `${bloStart.toISOString().split('T')[0]} → ${bloEnd.toISOString().split('T')[0]}`,
          color: '#17a2b8'
        })
      }
    }

    // Examens
    if (form.exam_start_date && form.exam_end_date) {
      preview.push({
        type: 'examen', name: `Examens — ${label}`,
        date: `${form.exam_start_date} → ${form.exam_end_date}`, color: '#fd7e14'
      })
    }

    // Rattrapage
    if (form.rattrapage_start_date && form.rattrapage_end_date) {
      preview.push({
        type: 'rattrapage', name: `Rattrapage — ${label}`,
        date: `${form.rattrapage_start_date} → ${form.rattrapage_end_date}`, color: '#6f42c1'
      })
    }

    return preview
  }, [form])

  const termDuration = durationLabel(form.start_date, form.end_date)
  const coursesDuration = durationLabel(form.start_date, form.end_courses_date || form.end_date)
  const examDuration = durationLabel(form.exam_start_date, form.exam_end_date)
  const rattrapageDuration = durationLabel(form.rattrapage_start_date, form.rattrapage_end_date)

  return (
    <Modal show={show} onHide={onHide} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>{editing ? 'Modifier' : 'Nouveau'} Trimestre/Semestre</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Row>
          <Col md={5}>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Nom *</Form.Label>
              <Form.Control value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Trimestre 1" />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Type *</Form.Label>
              <Form.Select value={form.term_type}
                onChange={e => setForm({ ...form, term_type: e.target.value })}>
                <option value="trimestre">Trimestre</option>
                <option value="semestre">Semestre</option>
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={3}>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Ordre *</Form.Label>
              <Form.Control type="number" min={1} value={form.order}
                onChange={e => setForm({ ...form, order: parseInt(e.target.value) || 1 })} />
            </Form.Group>
          </Col>
        </Row>

        <h6 className="fw-bold mt-2 mb-2 text-primary">📚 Période de cours</h6>
        <Row>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Début des cours *</Form.Label>
              <Form.Control type="date" value={form.start_date}
                onChange={e => setForm({ ...form, start_date: e.target.value })} />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Fin des cours</Form.Label>
              <Form.Control type="date" value={form.end_courses_date}
                onChange={e => setForm({ ...form, end_courses_date: e.target.value })} />
              <Form.Text className="text-muted">Si vide, calculé depuis début examens</Form.Text>
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Fin de la période *</Form.Label>
              <Form.Control type="date" value={form.end_date}
                onChange={e => setForm({ ...form, end_date: e.target.value })} />
              <Form.Text className="text-muted">Fin globale (après rattrapage)</Form.Text>
            </Form.Group>
          </Col>
        </Row>
        {(coursesDuration || termDuration) && (
          <div className="text-muted small mb-3">
            {coursesDuration && <span className="me-3">Cours: {coursesDuration}</span>}
            {termDuration && <span>Periode globale: {termDuration}</span>}
          </div>
        )}

        <h6 className="fw-bold mt-2 mb-2 text-warning">📝 Période d'examen</h6>
        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Début examens</Form.Label>
              <Form.Control type="date" value={form.exam_start_date}
                onChange={e => setForm({ ...form, exam_start_date: e.target.value })} />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Fin examens</Form.Label>
              <Form.Control type="date" value={form.exam_end_date}
                onChange={e => setForm({ ...form, exam_end_date: e.target.value })} />
            </Form.Group>
          </Col>
        </Row>
        {examDuration && (
          <div className="text-muted small mb-3">Examens: {examDuration}</div>
        )}

        <h6 className="fw-bold mt-2 mb-2" style={{ color: '#6f42c1' }}>🔄 Période de rattrapage</h6>
        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Début rattrapage</Form.Label>
              <Form.Control type="date" value={form.rattrapage_start_date}
                onChange={e => setForm({ ...form, rattrapage_start_date: e.target.value })} />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Fin rattrapage</Form.Label>
              <Form.Control type="date" value={form.rattrapage_end_date}
                onChange={e => setForm({ ...form, rattrapage_end_date: e.target.value })} />
            </Form.Group>
          </Col>
        </Row>
        {rattrapageDuration && (
          <div className="text-muted small mb-3">Rattrapage: {rattrapageDuration}</div>
        )}

        <hr />
        <Row>
          <Col md={6}>
            <Form.Group className="mb-2">
              <Form.Check type="switch" label="Générer les événements automatiquement"
                checked={form.auto_generate_events}
                onChange={e => setForm({ ...form, auto_generate_events: e.target.checked })} />
              <Form.Text className="text-muted">
                Crée automatiquement : rentrée, fin de cours, blocus, examens, rattrapage
              </Form.Text>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-2">
              <Form.Check type="switch" label="Actif" checked={form.is_active}
                onChange={e => setForm({ ...form, is_active: e.target.checked })} />
            </Form.Group>
          </Col>
        </Row>

        {/* Preview auto-generated events */}
        {form.auto_generate_events && eventPreview.length > 0 && (
          <div className="mt-3 p-3 rounded" style={{ backgroundColor: '#f8f9fa', border: '1px dashed #dee2e6' }}>
            <h6 className="fw-bold mb-2" style={{ fontSize: '0.85rem' }}>
              <FiCalendar className="me-1" /> Événements qui seront créés automatiquement :
            </h6>
            {eventPreview.map((ev, i) => (
              <div key={i} className="d-flex align-items-center mb-1" style={{ fontSize: '0.82rem' }}>
                <span style={{
                  display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
                  backgroundColor: ev.color, marginRight: 8, flexShrink: 0,
                }} />
                <span className="fw-semibold me-2">{ev.name}</span>
                <span className="text-muted">{ev.date}</span>
              </div>
            ))}
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Annuler</Button>
        <Button variant="primary" onClick={() => onSave(form)}
          disabled={!form.name || !form.start_date || !form.end_date}>
          {editing ? 'Enregistrer' : 'Créer'}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

// ─── Event Form Modal ────────────────────────────────────────────────────────
const EventFormModal = ({ show, onHide, onSave, editing, terms }) => {
  const [form, setForm] = useState({
    name: '', event_type: 'vacance', term: '',
    start_date: '', end_date: '', description: '', color: '',
  })

  useEffect(() => {
    if (editing) {
      setForm({
        name: editing.name || '',
        event_type: editing.event_type || 'vacance',
        term: editing.term || '',
        start_date: editing.start_date || '',
        end_date: editing.end_date || '',
        description: editing.description || '',
        color: editing.color || '',
      })
    } else {
      setForm({ name: '', event_type: 'vacance', term: '', start_date: '', end_date: '', description: '', color: '' })
    }
  }, [editing, show])

  const eventDuration = durationLabel(form.start_date, form.end_date)

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>{editing ? 'Modifier' : 'Nouvel'} Événement</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Group className="mb-3">
          <Form.Label className="fw-semibold">Nom *</Form.Label>
          <Form.Control value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="Ex: Vacances de Noël" />
        </Form.Group>

        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Type *</Form.Label>
              <Form.Select value={form.event_type}
                onChange={e => setForm({ ...form, event_type: e.target.value })}>
                {Object.entries(EVENT_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Trimestre</Form.Label>
              <Form.Select value={form.term}
                onChange={e => setForm({ ...form, term: e.target.value || '' })}>
                <option value="">— Année entière —</option>
                {terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>
        {eventDuration && (
          <div className="text-muted small mb-3">Duree inclusive: {eventDuration}</div>
        )}

        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Date de début *</Form.Label>
              <Form.Control type="date" value={form.start_date}
                onChange={e => setForm({ ...form, start_date: e.target.value })} />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Date de fin *</Form.Label>
              <Form.Control type="date" value={form.end_date}
                onChange={e => setForm({ ...form, end_date: e.target.value })} />
            </Form.Group>
          </Col>
        </Row>

        <Row>
          <Col md={8}>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control as="textarea" rows={2} value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })} />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Couleur</Form.Label>
              <Form.Control type="color"
                value={form.color || EVENT_COLORS[form.event_type] || '#6c757d'}
                onChange={e => setForm({ ...form, color: e.target.value })} />
            </Form.Group>
          </Col>
        </Row>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Annuler</Button>
        <Button variant="primary" onClick={() => {
          const payload = { ...form }
          if (!payload.term) delete payload.term
          if (!payload.color) delete payload.color
          onSave(payload)
        }}
          disabled={!form.name || !form.start_date || !form.end_date}>
          {editing ? 'Enregistrer' : 'Créer'}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

// ─── Duplicate Planning Modal ────────────────────────────────────────────────
const DuplicateModal = ({ show, onHide, onDuplicate, terms }) => {
  const [source, setSource] = useState('')
  const [target, setTarget] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (show) { setSource(''); setTarget('') }
  }, [show])

  const handleSubmit = async () => {
    if (!source || !target || source === target) return
    setSubmitting(true)
    await onDuplicate({ source_term_id: source, target_term_id: target })
    setSubmitting(false)
  }

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title><FiCopy className="me-2" />Dupliquer un planning</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Alert variant="info" className="mb-3">
          <FiAlertCircle className="me-2" />
          Cette action copiera tous les horaires d'un trimestre vers un autre.
          Les dates des modules seront automatiquement décalées.
        </Alert>

        <Form.Group className="mb-3">
          <Form.Label className="fw-semibold">Trimestre source *</Form.Label>
          <Form.Select value={source} onChange={e => setSource(e.target.value)}>
            <option value="">— Sélectionner —</option>
            {terms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </Form.Select>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label className="fw-semibold">Trimestre destination *</Form.Label>
          <Form.Select value={target} onChange={e => setTarget(e.target.value)}>
            <option value="">— Sélectionner —</option>
            {terms.filter(t => String(t.id) !== source).map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </Form.Select>
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Annuler</Button>
        <Button variant="primary" onClick={handleSubmit}
          disabled={!source || !target || source === target || submitting}>
          {submitting ? <Spinner animation="border" size="sm" className="me-1" /> : <FiCopy className="me-1" />}
          Dupliquer
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default CalendrierAcademique
