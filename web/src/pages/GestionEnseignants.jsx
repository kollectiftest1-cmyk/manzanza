/**
 * GestionEnseignants.jsx — Gestion complète des Enseignants & Assignation de Cours
 * Module 1 : Création d'enseignant, affectation section/filière, désignation cours
 */
import { useState, useEffect, useCallback } from 'react'
import {
  Container, Row, Col, Card, Table, Button, Modal, Form,
  Spinner, Alert, Badge, Tabs, Tab, InputGroup, OverlayTrigger, Tooltip
} from 'react-bootstrap'
import { motion } from 'framer-motion'
import {
  FiUserPlus, FiUsers, FiBriefcase, FiBook, FiPlus, FiEdit, FiTrash2,
  FiEye, FiSearch, FiCheck, FiX, FiMail, FiPhone, FiMapPin,
  FiAward, FiLink, FiRefreshCw, FiChevronRight
} from 'react-icons/fi'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { getUsers, createUser, updateUser, deleteUser } from '../services/userService'
import courseService from '../services/courseService'
import { getSections } from '../services/sectionService'
import { getFilieres } from '../services/filiereService'
import { notifyError } from "../utils/notify"

const EMPTY_TEACHER = {
  first_name: '',
  last_name: '',
  post_nom: '',
  email: '',
  phone: '',
  sexe: '',
  password: '',
  role: 'enseignant',
  section_id: '',
  filiere_id: '',
}

const GestionEnseignants = () => {
  const navigate = useNavigate()
  const { user: currentUser } = useSelector((s) => s.auth)

  // State
  const [teachers, setTeachers] = useState([])
  const [courses, setCourses] = useState([])
  const [sections, setSections] = useState([])
  const [filieres, setFilieres] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('list')

  // Create/Edit modal
  const [showModal, setShowModal] = useState(false)
  const [editingTeacher, setEditingTeacher] = useState(null)
  const [form, setForm] = useState({ ...EMPTY_TEACHER })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState(null)

  // Assign course modal
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedTeacher, setSelectedTeacher] = useState(null)
  const [availableCourses, setAvailableCourses] = useState([])
  const [selectedCourseId, setSelectedCourseId] = useState('')
  const [assignRole, setAssignRole] = useState('titulaire') // titulaire or assistant
  const [assigning, setAssigning] = useState(false)

  // Teacher detail modal
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [detailTeacher, setDetailTeacher] = useState(null)
  const [teacherCourses, setTeacherCourses] = useState([])
  const [loadingDetail, setLoadingDetail] = useState(false)

  // ── Load data ──────────────────────────────────────────────────────────
  const loadTeachers = useCallback(async () => {
    try {
      setLoading(true)
      const baseParams = { page_size: 100 }
      if (searchTerm) baseParams.search = searchTerm
      const [teachersRes, assistantsRes] = await Promise.all([
        getUsers({ ...baseParams, role: 'enseignant' }),
        getUsers({ ...baseParams, role: 'assistant' }),
      ])
      const teacherList = teachersRes.data?.results || teachersRes.data || []
      const assistantList = assistantsRes.data?.results || assistantsRes.data || []
      const safeTeacherList = Array.isArray(teacherList) ? teacherList : []
      const safeAssistantList = Array.isArray(assistantList) ? assistantList : []
      const merged = [...safeTeacherList, ...safeAssistantList]
      const unique = Array.from(new Map(merged.map(item => [item.id, item])).values())
      setTeachers(unique)
    } catch (err) {
      notifyError(err, 'Erreur lors du chargement des enseignants.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [searchTerm])

  const loadOptions = useCallback(async () => {
    try {
      const [sectRes, filRes, courseRes] = await Promise.all([
        getSections(),
        getFilieres(),
        courseService.getCourses(),
      ])
      setSections(sectRes.data?.results || sectRes.data || [])
      setFilieres(filRes.data?.results || filRes.data || [])
      setCourses(courseRes.data?.results || courseRes.data || [])
    } catch (err) {
      console.error('Erreur chargement options:', err)
    }
  }, [])

  useEffect(() => {
    loadTeachers()
    loadOptions()
  }, [loadTeachers, loadOptions])

  // Auto-dismiss success
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [success])

  // ── Create / Edit Teacher ─────────────────────────────────────────────
  const openCreateModal = () => {
    setEditingTeacher(null)
    setForm({ ...EMPTY_TEACHER })
    setFormError(null)
    setShowModal(true)
  }

  const openEditModal = (teacher) => {
    setEditingTeacher(teacher)
    setForm({
      first_name: teacher.first_name || '',
      last_name: teacher.last_name || '',
      post_nom: teacher.post_nom || '',
      email: teacher.email || '',
      phone: teacher.phone || '',
      sexe: teacher.sexe || '',
      password: '', // Don't show password
      role: teacher.role || 'enseignant',
      section_id: teacher.section?.id || '',
      filiere_id: teacher.filiere?.id || '',
    })
    setFormError(null)
    setShowModal(true)
  }

  const handleSaveTeacher = async () => {
    setFormError(null)
    if (!form.first_name || !form.last_name || !form.email) {
      setFormError('Nom, prénom et email sont obligatoires.')
      return
    }
    if (!editingTeacher && !form.password) {
      setFormError('Le mot de passe est obligatoire pour un nouveau compte.')
      return
    }

    setSaving(true)
    try {
      const data = { ...form }
      // Clean empty strings
      if (!data.section_id) delete data.section_id
      if (!data.filiere_id) delete data.filiere_id
      if (!data.post_nom) delete data.post_nom
      if (!data.phone) delete data.phone
      if (!data.sexe) delete data.sexe

      if (editingTeacher) {
        delete data.password
        delete data.email // Email is read-only on update
        await updateUser(editingTeacher.id, data)
        setSuccess(`Enseignant ${data.first_name} ${data.last_name} modifié avec succès.`)
      } else {
        await createUser(data)
        setSuccess(`Enseignant ${data.first_name} ${data.last_name} créé avec succès.`)
      }

      setShowModal(false)
      loadTeachers()
    } catch (err) {
      const msg = err.response?.data
      if (msg && typeof msg === 'object') {
        const first = Object.values(msg).flat()[0]
        notifyError(err, typeof first === 'string' ? first : JSON.stringify(msg))
      } else {
        notifyError(err, 'Erreur lors de la sauvegarde.')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteTeacher = async (teacher) => {
    if (!window.confirm(`Supprimer l'enseignant ${teacher.first_name} ${teacher.last_name} ? Il ira dans la corbeille (restaurable pendant la durée de conservation).`)) return
    try {
      await deleteUser(teacher.id)
      setSuccess(`Enseignant supprimé.`)
      loadTeachers()
    } catch (err) {
      notifyError(err, 'Erreur lors de la suppression.')
    }
  }

  // ── Assign Course ─────────────────────────────────────────────────────
  const openAssignModal = async (teacher) => {
    setSelectedTeacher(teacher)
    setSelectedCourseId('')
    setAssignRole(teacher.role === 'assistant' ? 'assistant' : 'titulaire')
    setShowAssignModal(true)

    try {
      const res = await courseService.getCourses()
      const allCourses = res.data?.results || res.data || []
      setAvailableCourses(allCourses)
    } catch (err) {
      console.error('Erreur chargement cours:', err)
    }
  }

  const handleAssignCourse = async () => {
    if (!selectedCourseId || !selectedTeacher) return
    setAssigning(true)
    try {
      if (assignRole === 'assistant') {
        // Get current course to append assistant
        const courseRes = await courseService.getCourseDetail(selectedCourseId)
        const currentAssistants = courseRes.data.assistants_detail?.map(a => a.id) || []
        if (!currentAssistants.includes(selectedTeacher.id)) {
          currentAssistants.push(selectedTeacher.id)
        }
        await api.patch(`/courses/${selectedCourseId}/`, { assistants: currentAssistants })
      } else {
        await api.patch(`/courses/${selectedCourseId}/`, { titulaire: selectedTeacher.id })
      }

      setSuccess(`Cours assigné à ${selectedTeacher.first_name} ${selectedTeacher.last_name} en tant que ${assignRole}.`)
      setShowAssignModal(false)
      loadTeachers()
    } catch (err) {
      console.error('Erreur assignation:', err)
      notifyError(err, 'Erreur lors de l\'assignation du cours.')
    } finally {
      setAssigning(false)
    }
  }

  // ── Teacher Detail ────────────────────────────────────────────────────
  const openDetailModal = async (teacher) => {
    setDetailTeacher(teacher)
    setShowDetailModal(true)
    setLoadingDetail(true)

    try {
      // Fetch all courses and filter for this teacher
      const res = await courseService.getCourses()
      const allCourses = res.data?.results || res.data || []
      const tCourses = allCourses.filter(c =>
        c.titulaire === teacher.id ||
        c.titulaire_detail?.id === teacher.id ||
        c.assistants_detail?.some(a => a.id === teacher.id)
      )
      setTeacherCourses(tCourses)
    } catch (err) {
      console.error('Erreur chargement détails:', err)
    } finally {
      setLoadingDetail(false)
    }
  }

  // ── Unassign course from teacher ──────────────────────────────────────
  const handleUnassignCourse = async (courseId, teacherId, isAssistant) => {
    if (!window.confirm('Retirer cet enseignant de ce cours ?')) return
    try {
      if (isAssistant) {
        const courseRes = await courseService.getCourseDetail(courseId)
        const newAssistants = (courseRes.data.assistants_detail || [])
          .filter(a => a.id !== teacherId)
          .map(a => a.id)
        await api.patch(`/courses/${courseId}/`, { assistants: newAssistants })
      } else {
        await api.patch(`/courses/${courseId}/`, { titulaire: null })
      }
      setSuccess('Cours retiré avec succès.')
      // Refresh detail
      openDetailModal(detailTeacher)
    } catch (err) {
      notifyError(err, 'Erreur lors du retrait du cours.')
    }
  }

  // ── Filtered list ─────────────────────────────────────────────────────
  const filteredTeachers = teachers.filter(t => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      t.first_name?.toLowerCase().includes(term) ||
      t.last_name?.toLowerCase().includes(term) ||
      t.email?.toLowerCase().includes(term) ||
      t.role?.toLowerCase().includes(term)
    )
  })

  // ── Permission check ──────────────────────────────────────────────────
  const canManage = ['sga', 'pdg', 'directeur_general', 'chef_section', 'chef_departement'].includes(currentUser?.role)

  return (
    <Container fluid style={{ padding: '24px', background: 'var(--color-bodyBg)', minHeight: '100vh' }}>
      {/* Alerts */}
      {success && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <Alert variant="success" dismissible onClose={() => setSuccess(null)}
            style={{ borderRadius: '12px', marginBottom: '16px' }}>
            <FiCheck className="me-2" />{success}
          </Alert>
        </motion.div>
      )}
      {error && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <Alert variant="danger" dismissible onClose={() => setError(null)}
            style={{ borderRadius: '12px', marginBottom: '16px' }}>
            {error}
          </Alert>
        </motion.div>
      )}

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '16px',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 16px rgba(102,126,234,0.3)'
            }}>
              <FiBriefcase size={28} color="white" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '28px', fontWeight: '700', color: 'var(--color-text)' }}>
                Gestion des Enseignants
              </h2>
              <p style={{ margin: 0, color: 'var(--color-textSecondary)' }}>
                Créer, modifier et assigner des cours aux enseignants et assistants
              </p>
            </div>
          </div>
          {canManage && (
            <Button onClick={openCreateModal} style={{
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              border: 'none', borderRadius: '12px', padding: '12px 24px',
              fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px',
              boxShadow: '0 4px 12px rgba(102,126,234,0.3)'
            }}>
              <FiUserPlus size={18} /> Nouvel Enseignant
            </Button>
          )}
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Row className="mb-4 g-3">
          {[
            { label: 'Total Enseignants', value: teachers.filter(t => t.role === 'enseignant').length, icon: FiBriefcase, color: '#667eea' },
            { label: 'Total Assistants', value: teachers.filter(t => t.role === 'assistant').length, icon: FiUsers, color: '#f093fb' },
            { label: 'Cours Disponibles', value: courses.length, icon: FiBook, color: '#4facfe' },
            { label: 'Sections', value: sections.length, icon: FiMapPin, color: '#43e97b' },
          ].map((stat, i) => (
            <Col md={3} sm={6} key={i}>
              <Card style={{
                border: 'none', borderRadius: '16px',
                background: 'var(--color-cardBg)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
              }}>
                <Card.Body style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '12px',
                    background: `${stat.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <stat.icon size={24} color={stat.color} />
                  </div>
                  <div>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--color-text)' }}>{stat.value}</div>
                    <div style={{ fontSize: '13px', color: 'var(--color-textSecondary)' }}>{stat.label}</div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </motion.div>

      {/* Search + Filter + Tabs */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card style={{ border: 'none', borderRadius: '16px', background: 'var(--color-cardBg)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <Card.Body>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <InputGroup style={{ maxWidth: '400px' }}>
                <InputGroup.Text style={{ background: 'var(--color-bodyBg)', border: '1px solid var(--color-border)', borderRadius: '10px 0 0 10px' }}>
                  <FiSearch />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Rechercher un enseignant..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ background: 'var(--color-bodyBg)', border: '1px solid var(--color-border)', borderRadius: '0 10px 10px 0', color: 'var(--color-text)' }}
                />
              </InputGroup>
              <Button variant="outline-secondary" size="sm" onClick={() => { setSearchTerm(''); loadTeachers(); }}
                style={{ borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FiRefreshCw size={14} /> Actualiser
              </Button>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px' }}>
                <Spinner animation="border" style={{ color: 'var(--color-primary)' }} />
                <p style={{ color: 'var(--color-textSecondary)', marginTop: '16px' }}>Chargement...</p>
              </div>
            ) : filteredTeachers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px' }}>
                <FiUsers size={48} style={{ color: 'var(--color-textSecondary)', opacity: 0.5 }} />
                <p style={{ color: 'var(--color-textSecondary)', marginTop: '16px' }}>Aucun enseignant trouvé.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <Table hover responsive style={{ marginBottom: 0 }}>
                  <thead>
                    <tr style={{ background: 'var(--color-bodyBg)' }}>
                      <th style={thStyle}>#</th>
                      <th style={thStyle}>Nom complet</th>
                      <th style={thStyle}>Email</th>
                      <th style={thStyle}>Téléphone</th>
                      <th style={thStyle}>Rôle</th>
                      <th style={thStyle}>Section / Filière</th>
                      <th style={thStyle}>Statut</th>
                      <th style={{ ...thStyle, textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTeachers.map((t, idx) => (
                      <motion.tr key={t.id}
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.03 }}
                        style={{ cursor: 'pointer' }}
                        onClick={() => openDetailModal(t)}
                      >
                        <td style={tdStyle}>{idx + 1}</td>
                        <td style={{ ...tdStyle, fontWeight: '600' }}>
                          {t.last_name} {t.first_name} {t.post_nom || ''}
                        </td>
                        <td style={tdStyle}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <FiMail size={14} style={{ color: 'var(--color-textSecondary)' }} />
                            {t.email}
                          </span>
                        </td>
                        <td style={tdStyle}>
                          {t.phone ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <FiPhone size={14} style={{ color: 'var(--color-textSecondary)' }} />
                              {t.phone}
                            </span>
                          ) : <span style={{ color: 'var(--color-textSecondary)' }}>—</span>}
                        </td>
                        <td style={tdStyle}>
                          <Badge bg={t.role === 'enseignant' ? 'primary' : 'info'}
                            style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '12px' }}>
                            {t.role === 'enseignant' ? 'Enseignant' : 'Assistant'}
                          </Badge>
                        </td>
                        <td style={tdStyle}>
                          <div style={{ fontSize: '13px' }}>
                            {t.section?.nom && <Badge bg="light" text="dark" className="me-1">{t.section.nom}</Badge>}
                            {t.filiere?.nom && <Badge bg="light" text="dark">{t.filiere.nom}</Badge>}
                            {!t.section?.nom && !t.filiere?.nom && <span style={{ color: 'var(--color-textSecondary)' }}>Non affecté</span>}
                          </div>
                        </td>
                        <td style={tdStyle}>
                          <Badge bg={t.status === 'actif' ? 'success' : t.status === 'suspendu' ? 'warning' : 'secondary'}
                            style={{ padding: '5px 10px', borderRadius: '6px' }}>
                            {t.status || 'actif'}
                          </Badge>
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                            <OverlayTrigger overlay={<Tooltip>Voir détails</Tooltip>}>
                              <Button size="sm" variant="outline-primary" onClick={() => openDetailModal(t)}
                                style={{ borderRadius: '8px', padding: '4px 8px' }}>
                                <FiEye size={14} />
                              </Button>
                            </OverlayTrigger>
                            {canManage && (
                              <>
                                <OverlayTrigger overlay={<Tooltip>Assigner un cours</Tooltip>}>
                                  <Button size="sm" variant="outline-success" onClick={() => openAssignModal(t)}
                                    style={{ borderRadius: '8px', padding: '4px 8px' }}>
                                    <FiLink size={14} />
                                  </Button>
                                </OverlayTrigger>
                                <OverlayTrigger overlay={<Tooltip>Modifier</Tooltip>}>
                                  <Button size="sm" variant="outline-warning" onClick={() => openEditModal(t)}
                                    style={{ borderRadius: '8px', padding: '4px 8px' }}>
                                    <FiEdit size={14} />
                                  </Button>
                                </OverlayTrigger>
                                <OverlayTrigger overlay={<Tooltip>Supprimer</Tooltip>}>
                                  <Button size="sm" variant="outline-danger" onClick={() => handleDeleteTeacher(t)}
                                    style={{ borderRadius: '8px', padding: '4px 8px' }}>
                                    <FiTrash2 size={14} />
                                  </Button>
                                </OverlayTrigger>
                              </>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </Card.Body>
        </Card>
      </motion.div>

      {/* ═══════════ MODAL: Créer / Modifier Enseignant ═══════════ */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
        <Modal.Header closeButton style={{ background: 'var(--color-cardBg)', borderBottom: '1px solid var(--color-border)' }}>
          <Modal.Title style={{ fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FiUserPlus style={{ color: 'var(--color-primary)' }} />
            {editingTeacher ? 'Modifier l\'enseignant' : 'Créer un nouvel enseignant'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: 'var(--color-cardBg)', padding: '24px' }}>
          {formError && <Alert variant="danger" style={{ borderRadius: '10px' }}>{formError}</Alert>}

          <Row>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label style={labelStyle}>Nom *</Form.Label>
                <Form.Control value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                  placeholder="Ex: KABONGO" style={inputStyle} />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label style={labelStyle}>Prénom *</Form.Label>
                <Form.Control value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                  placeholder="Ex: Jean" style={inputStyle} />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label style={labelStyle}>Post-nom</Form.Label>
                <Form.Control value={form.post_nom || ''} onChange={(e) => setForm({ ...form, post_nom: e.target.value })}
                  placeholder="Ex: Kalala" style={inputStyle} />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label style={labelStyle}>Email *</Form.Label>
                <Form.Control type="email" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  disabled={!!editingTeacher}
                  placeholder="enseignant@univ.cd" style={inputStyle} />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label style={labelStyle}>Téléphone</Form.Label>
                <Form.Control value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="+243..." style={inputStyle} />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group className="mb-3">
                <Form.Label style={labelStyle}>Sexe</Form.Label>
                <Form.Select value={form.sexe || ''} onChange={(e) => setForm({ ...form, sexe: e.target.value })} style={inputStyle}>
                  <option value="">—</option>
                  <option value="M">Masculin</option>
                  <option value="F">Féminin</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label style={labelStyle}>Rôle *</Form.Label>
                <Form.Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} style={inputStyle}>
                  <option value="enseignant">Enseignant</option>
                  <option value="assistant">Assistant</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label style={labelStyle}>Section (Faculté)</Form.Label>
                <Form.Select value={form.section_id || ''} onChange={(e) => setForm({ ...form, section_id: e.target.value })} style={inputStyle}>
                  <option value="">— Aucune —</option>
                  {sections.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label style={labelStyle}>Filière (Département)</Form.Label>
                <Form.Select value={form.filiere_id || ''} onChange={(e) => setForm({ ...form, filiere_id: e.target.value })} style={inputStyle}>
                  <option value="">— Aucune —</option>
                  {filieres.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          {!editingTeacher && (
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label style={labelStyle}>Mot de passe *</Form.Label>
                  <Form.Control type="password" value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Minimum 8 caractères" style={inputStyle} />
                </Form.Group>
              </Col>
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer style={{ background: 'var(--color-cardBg)', borderTop: '1px solid var(--color-border)' }}>
          <Button variant="outline-secondary" onClick={() => setShowModal(false)} style={{ borderRadius: '10px' }}>
            Annuler
          </Button>
          <Button onClick={handleSaveTeacher} disabled={saving}
            style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', border: 'none', borderRadius: '10px', fontWeight: '600' }}>
            {saving ? <><Spinner size="sm" className="me-2" />Sauvegarde...</> : <><FiCheck className="me-2" />Sauvegarder</>}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ═══════════ MODAL: Assigner un cours ═══════════ */}
      <Modal show={showAssignModal} onHide={() => setShowAssignModal(false)} centered>
        <Modal.Header closeButton style={{ background: 'var(--color-cardBg)', borderBottom: '1px solid var(--color-border)' }}>
          <Modal.Title style={{ fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FiLink style={{ color: 'var(--color-primary)' }} />
            Assigner un cours
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: 'var(--color-cardBg)', padding: '24px' }}>
          {selectedTeacher && (
            <Alert variant="info" style={{ borderRadius: '10px' }}>
              <div style={{ fontWeight: '600' }}>
                {selectedTeacher.first_name} {selectedTeacher.last_name}
              </div>
              <small>{selectedTeacher.role === 'enseignant' ? 'Enseignant' : 'Assistant'} — {selectedTeacher.email}</small>
            </Alert>
          )}

          <Form.Group className="mb-3">
            <Form.Label style={labelStyle}>Sélectionner un cours *</Form.Label>
            <Form.Select value={selectedCourseId} onChange={(e) => setSelectedCourseId(e.target.value)} style={inputStyle}>
              <option value="">— Choisir un cours —</option>
              {availableCourses.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code}) — {c.auditoire_detail?.nom || 'N/A'}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label style={labelStyle}>Rôle dans le cours</Form.Label>
            <Form.Select value={assignRole} onChange={(e) => setAssignRole(e.target.value)} style={inputStyle}>
              <option value="titulaire">Titulaire du cours</option>
              <option value="assistant">Assistant du cours</option>
            </Form.Select>
          </Form.Group>

          <Alert variant="light" style={{ borderRadius: '10px', border: '1px solid var(--color-border)' }}>
            {assignRole === 'titulaire'
              ? '⚠️ L\'enseignant deviendra le titulaire officiel de ce cours. L\'ancien titulaire sera remplacé.'
              : 'L\'enseignant sera ajouté à la liste des assistants de ce cours.'}
          </Alert>
        </Modal.Body>
        <Modal.Footer style={{ background: 'var(--color-cardBg)', borderTop: '1px solid var(--color-border)' }}>
          <Button variant="outline-secondary" onClick={() => setShowAssignModal(false)} style={{ borderRadius: '10px' }}>
            Annuler
          </Button>
          <Button onClick={handleAssignCourse} disabled={!selectedCourseId || assigning}
            style={{ background: 'linear-gradient(135deg, #43e97b, #38f9d7)', border: 'none', borderRadius: '10px', fontWeight: '600', color: '#155724' }}>
            {assigning ? <><Spinner size="sm" className="me-2" />Assignation...</> : <><FiCheck className="me-2" />Confirmer</>}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ═══════════ MODAL: Détails Enseignant ═══════════ */}
      <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} size="lg" centered>
        <Modal.Header closeButton style={{
          background: 'linear-gradient(135deg, #667eea, #764ba2)',
          color: 'white', borderBottom: 'none'
        }}>
          <Modal.Title style={{ fontWeight: '700' }}>
            <FiBriefcase className="me-2" />
            Profil Enseignant
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: 'var(--color-cardBg)', padding: '24px' }}>
          {detailTeacher && (
            <>
              {/* Teacher Info */}
              <div style={{
                padding: '20px', background: 'var(--color-bodyBg)',
                borderRadius: '12px', marginBottom: '20px'
              }}>
                <Row>
                  <Col md={6}>
                    <h5 style={{ fontWeight: '700', color: 'var(--color-text)', marginBottom: '16px' }}>
                      {detailTeacher.last_name} {detailTeacher.first_name} {detailTeacher.post_nom || ''}
                    </h5>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
                      <span><FiMail className="me-2" style={{ color: 'var(--color-textSecondary)' }} />{detailTeacher.email}</span>
                      {detailTeacher.phone && <span><FiPhone className="me-2" style={{ color: 'var(--color-textSecondary)' }} />{detailTeacher.phone}</span>}
                    </div>
                  </Col>
                  <Col md={6}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div>
                        <small style={{ color: 'var(--color-textSecondary)' }}>Rôle</small>
                        <div>
                          <Badge bg={detailTeacher.role === 'enseignant' ? 'primary' : 'info'} style={{ padding: '6px 14px', borderRadius: '8px' }}>
                            {detailTeacher.role === 'enseignant' ? 'Enseignant' : 'Assistant'}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <small style={{ color: 'var(--color-textSecondary)' }}>Section / Filière</small>
                        <div style={{ color: 'var(--color-text)' }}>
                          {detailTeacher.section?.nom || '—'} / {detailTeacher.filiere?.nom || '—'}
                        </div>
                      </div>
                    </div>
                  </Col>
                </Row>
              </div>

              {/* Courses assigned */}
              <h6 style={{ fontWeight: '700', color: 'var(--color-text)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FiBook style={{ color: 'var(--color-primary)' }} />
                Cours assignés ({teacherCourses.length})
              </h6>

              {loadingDetail ? (
                <div style={{ textAlign: 'center', padding: '30px' }}>
                  <Spinner size="sm" style={{ color: 'var(--color-primary)' }} />
                </div>
              ) : teacherCourses.length === 0 ? (
                <Alert variant="light" style={{ borderRadius: '10px', textAlign: 'center' }}>
                  Aucun cours assigné.
                  {canManage && (
                    <Button size="sm" variant="link" onClick={() => { setShowDetailModal(false); openAssignModal(detailTeacher); }}>
                      Assigner un cours
                    </Button>
                  )}
                </Alert>
              ) : (
                <Table hover responsive size="sm" style={{ marginBottom: 0 }}>
                  <thead>
                    <tr style={{ background: 'var(--color-bodyBg)' }}>
                      <th style={thStyle}>Code</th>
                      <th style={thStyle}>Nom du cours</th>
                      <th style={thStyle}>Auditoire</th>
                      <th style={thStyle}>Crédits</th>
                      <th style={thStyle}>Rôle</th>
                      {canManage && <th style={{ ...thStyle, textAlign: 'center' }}>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {teacherCourses.map(c => {
                      const isAssistant = c.assistants_detail?.some(a => a.id === detailTeacher.id)
                      return (
                        <tr key={c.id}>
                          <td style={tdStyle}><Badge bg="light" text="dark">{c.code}</Badge></td>
                          <td style={{ ...tdStyle, fontWeight: '500' }}>{c.name}</td>
                          <td style={tdStyle}>{c.auditoire_detail?.nom || '—'}</td>
                          <td style={tdStyle}>{c.credits}</td>
                          <td style={tdStyle}>
                            <Badge bg={isAssistant ? 'info' : 'primary'} style={{ borderRadius: '6px' }}>
                              {isAssistant ? 'Assistant' : 'Titulaire'}
                            </Badge>
                          </td>
                          {canManage && (
                            <td style={{ ...tdStyle, textAlign: 'center' }}>
                              <Button size="sm" variant="outline-danger"
                                onClick={() => handleUnassignCourse(c.id, detailTeacher.id, isAssistant)}
                                style={{ borderRadius: '6px', padding: '2px 8px' }}>
                                <FiX size={14} />
                              </Button>
                            </td>
                          )}
                        </tr>
                      )
                    })}
                  </tbody>
                </Table>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer style={{ background: 'var(--color-cardBg)', borderTop: '1px solid var(--color-border)' }}>
          {canManage && detailTeacher && (
            <Button variant="success" size="sm"
              onClick={() => { setShowDetailModal(false); openAssignModal(detailTeacher); }}
              style={{ borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FiPlus /> Assigner un cours
            </Button>
          )}
          <Button variant="outline-primary" size="sm"
            onClick={() => { setShowDetailModal(false); navigate(`/profile/${detailTeacher?.id}`); }}
            style={{ borderRadius: '10px' }}>
            Voir profil complet
          </Button>
          <Button variant="outline-secondary" onClick={() => setShowDetailModal(false)} style={{ borderRadius: '10px' }}>
            Fermer
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  )
}

// ── Table styles ──────────────────────────────────────────────────────────
const thStyle = {
  padding: '12px 16px',
  color: 'var(--color-text)',
  fontWeight: '600',
  fontSize: '13px',
  borderBottom: '2px solid var(--color-border)',
  whiteSpace: 'nowrap'
}

const tdStyle = {
  padding: '12px 16px',
  color: 'var(--color-text)',
  borderBottom: '1px solid var(--color-border)',
  fontSize: '14px',
  verticalAlign: 'middle'
}

const labelStyle = {
  fontWeight: '600',
  color: 'var(--color-text)',
  fontSize: '13px',
  marginBottom: '6px'
}

const inputStyle = {
  borderRadius: '10px',
  border: '1px solid var(--color-border)',
  background: 'var(--color-bodyBg)',
  color: 'var(--color-text)',
  padding: '10px 14px'
}

export default GestionEnseignants
