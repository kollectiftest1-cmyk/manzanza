/**
 * GestionEtudiants.jsx — Gestion complète des Étudiants
 * Module 2 : Inscription, validation, auditoire, cours automatiques, crédits
 */
import { useState, useEffect, useCallback } from 'react'
import {
  Container, Row, Col, Card, Table, Button, Modal, Form,
  Spinner, Alert, Badge, Tabs, Tab, InputGroup, OverlayTrigger, Tooltip,
  ProgressBar, ListGroup
} from 'react-bootstrap'
import { motion } from 'framer-motion'
import {
  FiUserPlus, FiUsers, FiBook, FiPlus, FiEdit, FiTrash2,
  FiEye, FiSearch, FiCheck, FiX, FiMail, FiPhone,
  FiAward, FiRefreshCw, FiCheckCircle, FiXCircle, FiClock,
  FiHash, FiTarget, FiTrendingUp, FiClipboard, FiBarChart2,
  FiDollarSign, FiFileText
} from 'react-icons/fi'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { hasAnyRole } from '../utils/permissions'
import { getUsers, createUser, updateUser, deleteUser } from '../services/userService'
import courseService from '../services/courseService'
import gradeService from '../services/gradeService'
import { getAuditoires } from '../services/auditoireService'
import { getSections } from '../services/sectionService'
import { getFilieres } from '../services/filiereService'

const EMPTY_STUDENT = {
  first_name: '',
  last_name: '',
  post_nom: '',
  email: '',
  phone: '',
  sexe: '',
  password: '',
  role: 'etudiant',
  auditoire_id: '',
}

const GestionEtudiants = () => {
  const navigate = useNavigate()
  const { user: currentUser } = useSelector((s) => s.auth)
  // Les admissions (pré-inscriptions) relèvent du SGA, de l'apparitorat et de la commission.
  const canReviewAdmissions = hasAnyRole(currentUser, 'sga', 'pdg', 'apparitorat', 'commission_admission', 'caisse')

  // ── State ──────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('students')
  const [students, setStudents] = useState([])
  const [inscriptions, setInscriptions] = useState([])
  const [auditoires, setAuditoires] = useState([])
  const [sections, setSections] = useState([])
  const [filieres, setFilieres] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingInscriptions, setLoadingInscriptions] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterAuditoire, setFilterAuditoire] = useState('')
  const [filterSection, setFilterSection] = useState('')
  const [filterFiliere, setFilterFiliere] = useState('')

  // Create/Edit student modal
  const [showModal, setShowModal] = useState(false)
  const [editingStudent, setEditingStudent] = useState(null)
  const [form, setForm] = useState({ ...EMPTY_STUDENT })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState(null)

  // Student detail modal
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [detailStudent, setDetailStudent] = useState(null)
  const [studentCourses, setStudentCourses] = useState([])
  const [studentGrades, setStudentGrades] = useState([])
  const [loadingDetail, setLoadingDetail] = useState(false)

  // Inscription validation modal
  const [showValidateModal, setShowValidateModal] = useState(false)
  const [selectedInscription, setSelectedInscription] = useState(null)
  const [validating, setValidating] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  // ── Load data ──────────────────────────────────────────────────────────
  const loadStudents = useCallback(async () => {
    try {
      setLoading(true)
      const params = { role: 'etudiant', page_size: 100 }
      if (searchTerm) params.search = searchTerm
      if (filterAuditoire) params.auditoire = filterAuditoire
      if (filterSection) params.section = filterSection
      if (filterFiliere) params.filiere = filterFiliere
      const res = await api.get('/students/', { params })
      const list = res.data?.results || res.data || []
      setStudents(Array.isArray(list) ? list : [])
    } catch (err) {
      setError('Erreur lors du chargement des étudiants.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [searchTerm, filterAuditoire, filterSection, filterFiliere])

  const loadInscriptions = useCallback(async () => {
    if (!canReviewAdmissions) return
    try {
      setLoadingInscriptions(true)
      const res = await api.get('/inscriptions/')
      const list = res.data?.results || res.data || []
      setInscriptions(Array.isArray(list) ? list : [])
    } catch (err) {
      console.error('Erreur chargement inscriptions:', err)
    } finally {
      setLoadingInscriptions(false)
    }
  }, [canReviewAdmissions])

  const loadOptions = useCallback(async () => {
    try {
      const [audRes, sectRes, filRes] = await Promise.all([
        getAuditoires(),
        getSections(),
        getFilieres(),
      ])
      setAuditoires(audRes.data?.results || audRes.data || [])
      setSections(sectRes.data?.results || sectRes.data || [])
      setFilieres(filRes.data?.results || filRes.data || [])
    } catch (err) {
      console.error('Erreur chargement options:', err)
    }
  }, [])

  useEffect(() => {
    loadStudents()
    loadInscriptions()
    loadOptions()
  }, [loadStudents, loadInscriptions, loadOptions])

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [success])

  // ── Create / Edit Student ─────────────────────────────────────────────
  const openCreateModal = () => {
    setEditingStudent(null)
    setForm({ ...EMPTY_STUDENT })
    setFormError(null)
    setShowModal(true)
  }

  const openEditModal = (student) => {
    setEditingStudent(student)
    setForm({
      first_name: student.first_name || '',
      last_name: student.last_name || '',
      post_nom: student.post_nom || '',
      email: student.email || '',
      phone: student.phone || '',
      sexe: student.sexe || '',
      password: '',
      role: 'etudiant',
      auditoire_id: student.auditoire || '',
    })
    setFormError(null)
    setShowModal(true)
  }

  const handleSaveStudent = async () => {
    setFormError(null)
    if (!form.first_name || !form.last_name || !form.email) {
      setFormError('Nom, prénom et email sont obligatoires.')
      return
    }
    if (!editingStudent && !form.password) {
      setFormError('Le mot de passe est obligatoire pour un nouveau compte.')
      return
    }
    if (!form.auditoire_id) {
      setFormError('L\'auditoire est obligatoire pour un étudiant.')
      return
    }

    setSaving(true)
    try {
      const data = { ...form }
      if (!data.post_nom) delete data.post_nom
      if (!data.phone) delete data.phone
      if (!data.sexe) delete data.sexe

      if (editingStudent) {
        delete data.password
        delete data.email
        await updateUser(editingStudent.id, data)
        setSuccess(`Étudiant ${data.first_name} ${data.last_name} modifié. Les cours de l'auditoire seront assignés automatiquement.`)
      } else {
        await createUser(data)
        setSuccess(`Étudiant ${data.first_name} ${data.last_name} créé et auto-inscrit aux cours de l'auditoire.`)
      }

      setShowModal(false)
      loadStudents()
    } catch (err) {
      const msg = err.response?.data
      if (msg && typeof msg === 'object') {
        const first = Object.values(msg).flat()[0]
        setFormError(typeof first === 'string' ? first : JSON.stringify(msg))
      } else {
        setFormError('Erreur lors de la sauvegarde.')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteStudent = async (student) => {
    if (!window.confirm(`Supprimer l'étudiant ${student.first_name} ${student.last_name} ? Il ira dans la corbeille (restaurable pendant la durée de conservation).`)) return
    try {
      await deleteUser(student.id)
      setSuccess('Étudiant supprimé.')
      loadStudents()
    } catch (err) {
      setError('Erreur lors de la suppression.')
    }
  }

  // ── Student Detail ────────────────────────────────────────────────────
  const openDetailModal = async (student) => {
    setDetailStudent(student)
    setShowDetailModal(true)
    setLoadingDetail(true)
    setStudentCourses([])
    setStudentGrades([])

    try {
      // Get student profile with courses
      const profileRes = await api.get(`/users/${student.id}/`)
      const profile = profileRes.data

      // Get courses from profile
      setStudentCourses(profile.courses || [])

      // Get student grades
      try {
        const gradesRes = await gradeService.getStudentGrades(student.id)
        setStudentGrades(gradesRes.data?.results || gradesRes.data || [])
      } catch {
        // Student may not have grades yet
        setStudentGrades([])
      }

      // Update detail student with full profile data
      setDetailStudent(profile)
    } catch (err) {
      console.error('Erreur chargement détails étudiant:', err)
    } finally {
      setLoadingDetail(false)
    }
  }

  // ── Inscription Validation ────────────────────────────────────────────
  const openValidateModal = (inscription) => {
    setSelectedInscription(inscription)
    setRejectReason('')
    setShowValidateModal(true)
  }

  const handleValidateInscription = async () => {
    if (!selectedInscription) return
    setValidating(true)
    try {
      await api.post(`/inscriptions/${selectedInscription.id}/validate/`)
      setSuccess(`Inscription de ${selectedInscription.first_name} ${selectedInscription.last_name} validée ! Compte créé et affecté automatiquement.`)
      setShowValidateModal(false)
      loadInscriptions()
      loadStudents()
    } catch (err) {
      const msg = err.response?.data?.error || 'Erreur lors de la validation.'
      setError(msg)
    } finally {
      setValidating(false)
    }
  }

  const handleRejectInscription = async () => {
    if (!selectedInscription) return
    setValidating(true)
    try {
      await api.post(`/inscriptions/${selectedInscription.id}/reject/`, { reason: rejectReason })
      setSuccess(`Inscription de ${selectedInscription.first_name} ${selectedInscription.last_name} rejetée.`)
      setShowValidateModal(false)
      loadInscriptions()
    } catch (err) {
      setError('Erreur lors du rejet.')
    } finally {
      setValidating(false)
    }
  }

  // ── Computed values ───────────────────────────────────────────────────
  const pendingInscriptions = inscriptions.filter(i => i.status === 'en_attente')
  const validatedInscriptions = inscriptions.filter(i => i.status === 'validee')
  const rejectedInscriptions = inscriptions.filter(i => i.status === 'rejetee')

  const canManage = ['sga', 'pdg', 'directeur_general', 'chef_section', 'chef_departement'].includes(currentUser?.role)

  // Calculate total credits for student
  const calculateTotalCredits = (courses) => {
    return courses.reduce((sum, c) => sum + (c.credits || 0), 0)
  }

  return (
    <Container fluid style={{ padding: '24px', background: 'var(--color-bodyBg)', minHeight: '100vh' }}>
      {/* Alerts */}
      {success && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <Alert variant="success" dismissible onClose={() => setSuccess(null)} style={{ borderRadius: '12px', marginBottom: '16px' }}>
            <FiCheck className="me-2" />{success}
          </Alert>
        </motion.div>
      )}
      {error && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <Alert variant="danger" dismissible onClose={() => setError(null)} style={{ borderRadius: '12px', marginBottom: '16px' }}>
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
              background: 'linear-gradient(135deg, #4facfe, #00f2fe)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 16px rgba(79,172,254,0.3)'
            }}>
              <FiUsers size={28} color="white" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '28px', fontWeight: '700', color: 'var(--color-text)' }}>
                Gestion des Étudiants
              </h2>
              <p style={{ margin: 0, color: 'var(--color-textSecondary)' }}>
                Inscriptions, affectation auditoire, cours automatiques et crédits
              </p>
            </div>
          </div>
          {canManage && (
            <Button onClick={openCreateModal} style={{
              background: 'linear-gradient(135deg, #4facfe, #00f2fe)',
              border: 'none', borderRadius: '12px', padding: '12px 24px',
              fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px',
              boxShadow: '0 4px 12px rgba(79,172,254,0.3)'
            }}>
              <FiUserPlus size={18} /> Nouvel Étudiant
            </Button>
          )}
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Row className="mb-4 g-3">
          {[
            { label: 'Total Étudiants', value: students.length, icon: FiUsers, color: '#4facfe' },
            ...(canReviewAdmissions ? [
              { label: 'Inscriptions en attente', value: pendingInscriptions.length, icon: FiClock, color: '#f093fb' },
              { label: 'Inscriptions validées', value: validatedInscriptions.length, icon: FiCheckCircle, color: '#43e97b' },
            ] : []),
            { label: 'Auditoires', value: auditoires.length, icon: FiTarget, color: '#ffecd2' },
          ].map((stat, i) => (
            <Col md={3} sm={6} key={i}>
              <Card style={{
                border: 'none', borderRadius: '16px',
                background: 'var(--color-cardBg)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                cursor: stat.label.includes('attente') ? 'pointer' : 'default'
              }}
                onClick={() => stat.label.includes('attente') && setActiveTab('inscriptions')}
              >
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

      {/* Tabs */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          {[
            { id: 'students', label: 'Étudiants', icon: FiUsers, count: students.length },
            ...(canReviewAdmissions ? [{ id: 'inscriptions', label: 'Inscriptions', icon: FiClipboard, count: pendingInscriptions.length, badge: 'warning' }] : []),
          ].map(tab => (
            <Button key={tab.id}
              variant={activeTab === tab.id ? 'primary' : 'outline-secondary'}
              onClick={() => setActiveTab(tab.id)}
              style={{
                borderRadius: '10px', padding: '10px 20px', fontWeight: '600',
                display: 'flex', alignItems: 'center', gap: '8px',
                ...(activeTab === tab.id ? { background: 'linear-gradient(135deg, #4facfe, #00f2fe)', border: 'none' } : {})
              }}>
              <tab.icon size={16} />
              {tab.label}
              {tab.count > 0 && (
                <Badge bg={tab.badge || 'light'} text={tab.badge ? 'white' : 'dark'}
                  style={{ borderRadius: '20px', fontSize: '11px', padding: '3px 8px' }}>
                  {tab.count}
                </Badge>
              )}
            </Button>
          ))}
        </div>
      </motion.div>

      {/* ═══════════ TAB: Students List ═══════════ */}
      {activeTab === 'students' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card style={{ border: 'none', borderRadius: '16px', background: 'var(--color-cardBg)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <Card.Body>
              {/* Filters */}
              <Row className="mb-3 g-2">
                <Col md={3}>
                  <InputGroup>
                    <InputGroup.Text style={{ background: 'var(--color-bodyBg)', border: '1px solid var(--color-border)', borderRadius: '10px 0 0 10px' }}>
                      <FiSearch />
                    </InputGroup.Text>
                    <Form.Control
                      placeholder="Rechercher..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={inputStyle}
                    />
                  </InputGroup>
                </Col>
                <Col md={2}>
                  <Form.Select value={filterSection} onChange={(e) => { setFilterSection(e.target.value); setFilterFiliere(''); setFilterAuditoire(''); }} style={inputStyle}>
                    <option value="">Section</option>
                    {sections.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}
                  </Form.Select>
                </Col>
                <Col md={2}>
                  <Form.Select value={filterFiliere} onChange={(e) => { setFilterFiliere(e.target.value); setFilterAuditoire(''); }} style={inputStyle}>
                    <option value="">Filière</option>
                    {filieres
                      .filter(f => !filterSection || f.section === parseInt(filterSection))
                      .map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
                  </Form.Select>
                </Col>
                <Col md={3}>
                  <Form.Select value={filterAuditoire} onChange={(e) => setFilterAuditoire(e.target.value)} style={inputStyle}>
                    <option value="">Auditoire</option>
                    {auditoires
                      .filter(a => !filterFiliere || a.filiere === parseInt(filterFiliere))
                      .map(a => <option key={a.id} value={a.id}>{a.nom}</option>)}
                  </Form.Select>
                </Col>
                <Col md={2}>
                  <Button variant="outline-secondary" onClick={() => { setSearchTerm(''); setFilterSection(''); setFilterFiliere(''); setFilterAuditoire(''); }}
                    style={{ borderRadius: '10px', width: '100%' }}>
                    <FiRefreshCw size={14} className="me-1" /> Réinitialiser
                  </Button>
                </Col>
              </Row>

              {loading ? (
                <div style={{ textAlign: 'center', padding: '60px' }}>
                  <Spinner animation="border" style={{ color: 'var(--color-primary)' }} />
                  <p style={{ color: 'var(--color-textSecondary)', marginTop: '16px' }}>Chargement...</p>
                </div>
              ) : students.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px' }}>
                  <FiUsers size={48} style={{ color: 'var(--color-textSecondary)', opacity: 0.5 }} />
                  <p style={{ color: 'var(--color-textSecondary)', marginTop: '16px' }}>Aucun étudiant trouvé.</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <Table hover responsive style={{ marginBottom: 0 }}>
                    <thead>
                      <tr style={{ background: 'var(--color-bodyBg)' }}>
                        {/* <th style={thStyle}>#</th> */}
                        <th style={thStyle}>Matricule</th>
                        <th style={thStyle}>Nom complet</th>
                        {/* <th style={thStyle}>Email</th> */}
                        <th style={thStyle}>Auditoire</th>
                        {/* <th style={thStyle}>Section / Filière</th> */}
                        <th style={thStyle}>Statut</th>
                        <th style={{ ...thStyle, textAlign: 'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((s, idx) => (
                        <motion.tr key={s.id}
                          initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.02 }}
                          style={{ cursor: 'pointer' }}
                          onClick={() => openDetailModal(s)}
                        >
                          {/* <td style={tdStyle}>{idx + 1}</td> */}
                          <td style={tdStyle}>
                            <Badge bg="light" text="dark" style={{ fontFamily: 'monospace' }}>
                              {s.matricule || '—'}
                            </Badge>
                          </td>
                          <td style={{ ...tdStyle, fontWeight: '600' }}>
                            {s.last_name} {s.first_name} {s.post_nom || ''}
                          </td>
                          {/* <td style={tdStyle}>{s.email}</td> */}
                          <td style={tdStyle}>
                            {s.auditoire_name || <span style={{ color: 'var(--color-textSecondary)' }}>Non affecté</span>}
                          </td>
                          {/* <td style={tdStyle}>
                            <div style={{ fontSize: '13px' }}>
                              {s.section?.nom && <Badge bg="info" className="me-1" style={{ fontSize: '11px' }}>{s.section.nom}</Badge>}
                              {s.filiere?.nom && <Badge bg="success" style={{ fontSize: '11px' }}>{s.filiere.nom}</Badge>}
                            </div>
                          </td> */}
                          <td style={tdStyle}>
                            <Badge bg={s.status === 'actif' ? 'success' : s.status === 'suspendu' ? 'warning' : 'secondary'}
                              style={{ padding: '5px 10px', borderRadius: '6px' }}>
                              {s.status || 'actif'}
                            </Badge>
                          </td>
                          <td style={{ ...tdStyle, textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                              <OverlayTrigger overlay={<Tooltip>Voir détails & cours</Tooltip>}>
                                <Button size="sm" variant="outline-primary" onClick={() => openDetailModal(s)}
                                  style={{ borderRadius: '8px', padding: '4px 8px' }}>
                                  <FiEye size={14} />
                                </Button>
                              </OverlayTrigger>
                              <OverlayTrigger overlay={<Tooltip>Voir profil</Tooltip>}>
                                <Button size="sm" variant="outline-info" onClick={() => navigate(`/profile/${s.id}`)}
                                  style={{ borderRadius: '8px', padding: '4px 8px' }}>
                                  <FiUsers size={14} />
                                </Button>
                              </OverlayTrigger>
                              <OverlayTrigger overlay={<Tooltip>Paiements</Tooltip>}>
                                <Button size="sm" variant="outline-success" onClick={() => navigate(`/paiements?student=${s.id}`)}
                                  style={{ borderRadius: '8px', padding: '4px 8px' }}>
                                  <FiDollarSign size={14} />
                                </Button>
                              </OverlayTrigger>
                              <OverlayTrigger overlay={<Tooltip>Relevé de notes</Tooltip>}>
                                <Button size="sm" variant="outline-secondary" onClick={() => navigate(`/releves-cotes?student=${s.id}`)}
                                  style={{ borderRadius: '8px', padding: '4px 8px' }}>
                                  <FiFileText size={14} />
                                </Button>
                              </OverlayTrigger>
                              {canManage && (
                                <>
                                  <OverlayTrigger overlay={<Tooltip>Modifier</Tooltip>}>
                                    <Button size="sm" variant="outline-warning" onClick={() => openEditModal(s)}
                                      style={{ borderRadius: '8px', padding: '4px 8px' }}>
                                      <FiEdit size={14} />
                                    </Button>
                                  </OverlayTrigger>
                                  <OverlayTrigger overlay={<Tooltip>Supprimer</Tooltip>}>
                                    <Button size="sm" variant="outline-danger" onClick={() => handleDeleteStudent(s)}
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
      )}

      {/* ═══════════ TAB: Inscriptions ═══════════ */}
      {activeTab === 'inscriptions' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {/* Sub-tabs for inscription status */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            {[
              { status: 'en_attente', label: 'En attente', count: pendingInscriptions.length, color: '#f0ad4e' },
              { status: 'validee', label: 'Validées', count: validatedInscriptions.length, color: '#43e97b' },
              { status: 'rejetee', label: 'Rejetées', count: rejectedInscriptions.length, color: '#dc3545' },
            ].map(tab => (
              <Badge key={tab.status} bg="light" text="dark"
                style={{
                  padding: '10px 16px', borderRadius: '10px', cursor: 'default',
                  border: `2px solid ${tab.color}`, fontSize: '13px', fontWeight: '600'
                }}>
                {tab.label}: {tab.count}
              </Badge>
            ))}
          </div>

          {/* Pending inscriptions */}
          {pendingInscriptions.length > 0 && (
            <Card style={{ border: 'none', borderRadius: '16px', background: 'var(--color-cardBg)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: '20px' }}>
              <Card.Header style={{ background: 'linear-gradient(135deg, #f0ad4e22, #f0ad4e11)', borderBottom: '1px solid var(--color-border)', borderRadius: '16px 16px 0 0', padding: '16px 20px' }}>
                <h6 style={{ margin: 0, fontWeight: '700', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FiClock style={{ color: '#f0ad4e' }} />
                  Inscriptions en attente de validation ({pendingInscriptions.length})
                </h6>
              </Card.Header>
              <Card.Body style={{ padding: '0' }}>
                <Table hover responsive style={{ marginBottom: 0 }}>
                  <thead>
                    <tr style={{ background: 'var(--color-bodyBg)' }}>
                      <th style={thStyle}>Nom complet</th>
                      <th style={thStyle}>Email</th>
                      <th style={thStyle}>Téléphone</th>
                      <th style={thStyle}>Filière souhaitée</th>
                      <th style={thStyle}>Niveau</th>
                      <th style={thStyle}>Vacation</th>
                      <th style={thStyle}>Date</th>
                      <th style={{ ...thStyle, textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingInscriptions.map((insc, idx) => (
                      <tr key={insc.id}>
                        <td style={{ ...tdStyle, fontWeight: '600' }}>
                          {insc.last_name} {insc.first_name} {insc.post_nom || ''}
                        </td>
                        <td style={tdStyle}>{insc.email}</td>
                        <td style={tdStyle}>{insc.phone || '—'}</td>
                        <td style={tdStyle}>
                          <Badge bg="primary" style={{ borderRadius: '6px' }}>{insc.filiere_name || `Filière #${insc.filiere}`}</Badge>
                        </td>
                        <td style={tdStyle}><Badge bg="light" text="dark">{insc.niveau}</Badge></td>
                        <td style={tdStyle}>{insc.vacation === 'jour' ? '☀️ Jour' : '🌙 Soir'}</td>
                        <td style={tdStyle}>
                          <small style={{ color: 'var(--color-textSecondary)' }}>
                            {new Date(insc.created_at).toLocaleDateString('fr-FR')}
                          </small>
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                            <Button size="sm" variant="outline-primary" onClick={() => navigate(`/gestion-inscriptions/${insc.id}`)}
                              style={{ borderRadius: '8px' }}>
                              <FiEye size={14} />
                            </Button>
                            <Button size="sm" variant="success" onClick={() => openValidateModal(insc)}
                              style={{ borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <FiCheck size={14} /> Valider
                            </Button>
                            <Button size="sm" variant="outline-danger" onClick={() => { setSelectedInscription(insc); handleRejectInscription(); }}
                              style={{ borderRadius: '8px' }}>
                              <FiX size={14} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          )}

          {/* Validated inscriptions */}
          {validatedInscriptions.length > 0 && (
            <Card style={{ border: 'none', borderRadius: '16px', background: 'var(--color-cardBg)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: '20px' }}>
              <Card.Header style={{ background: 'linear-gradient(135deg, #43e97b22, #43e97b11)', borderBottom: '1px solid var(--color-border)', borderRadius: '16px 16px 0 0' }}>
                <h6 style={{ margin: 0, fontWeight: '700', color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FiCheckCircle style={{ color: '#43e97b' }} />
                  Inscriptions validées ({validatedInscriptions.length})
                </h6>
              </Card.Header>
              <Card.Body style={{ padding: '0' }}>
                <Table hover responsive size="sm" style={{ marginBottom: 0 }}>
                  <thead>
                    <tr style={{ background: 'var(--color-bodyBg)' }}>
                      <th style={thStyle}>Nom</th>
                      <th style={thStyle}>Email</th>
                      <th style={thStyle}>Filière</th>
                      <th style={thStyle}>Niveau</th>
                      <th style={thStyle}>Date validation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validatedInscriptions.slice(0, 20).map(insc => (
                      <tr key={insc.id}>
                        <td style={tdStyle}>{insc.last_name} {insc.first_name}</td>
                        <td style={tdStyle}>{insc.email}</td>
                        <td style={tdStyle}>{insc.filiere_name || '—'}</td>
                        <td style={tdStyle}>{insc.niveau}</td>
                        <td style={tdStyle}><small>{new Date(insc.created_at).toLocaleDateString('fr-FR')}</small></td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </Card.Body>
            </Card>
          )}

          {pendingInscriptions.length === 0 && validatedInscriptions.length === 0 && rejectedInscriptions.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px' }}>
              <FiClipboard size={48} style={{ color: 'var(--color-textSecondary)', opacity: 0.5 }} />
              <p style={{ color: 'var(--color-textSecondary)', marginTop: '16px' }}>Aucune inscription trouvée.</p>
            </div>
          )}
        </motion.div>
      )}

      {/* ═══════════ MODAL: Créer / Modifier Étudiant ═══════════ */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
        <Modal.Header closeButton style={{ background: 'var(--color-cardBg)', borderBottom: '1px solid var(--color-border)' }}>
          <Modal.Title style={{ fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FiUserPlus style={{ color: '#4facfe' }} />
            {editingStudent ? "Modifier l'étudiant" : 'Inscrire un nouvel étudiant'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: 'var(--color-cardBg)', padding: '24px' }}>
          {formError && <Alert variant="danger" style={{ borderRadius: '10px' }}>{formError}</Alert>}

          <Alert variant="info" style={{ borderRadius: '10px', fontSize: '13px' }}>
            <FiCheck className="me-2" />
            <strong>Auto-inscription :</strong> L'étudiant sera automatiquement inscrit à tous les cours de l'auditoire sélectionné.
            Les crédits des cours seront additionnés automatiquement.
          </Alert>

          <Row>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label style={labelStyle}>Nom *</Form.Label>
                <Form.Control value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                  placeholder="Ex: MUBINGA" style={inputStyle} />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label style={labelStyle}>Prénom *</Form.Label>
                <Form.Control value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                  placeholder="Ex: Marie" style={inputStyle} />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label style={labelStyle}>Post-nom</Form.Label>
                <Form.Control value={form.post_nom || ''} onChange={(e) => setForm({ ...form, post_nom: e.target.value })}
                  placeholder="Ex: Kabeya" style={inputStyle} />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label style={labelStyle}>Email *</Form.Label>
                <Form.Control type="email" value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  disabled={!!editingStudent}
                  placeholder="etudiant@univ.cd" style={inputStyle} />
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
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label style={labelStyle}>
                  Auditoire * <small style={{ color: 'var(--color-textSecondary)' }}>(détermine les cours)</small>
                </Form.Label>
                <Form.Select value={form.auditoire_id || ''} onChange={(e) => setForm({ ...form, auditoire_id: e.target.value })} style={inputStyle}>
                  <option value="">— Choisir un auditoire —</option>
                  {auditoires.map(a => (
                    <option key={a.id} value={a.id}>{a.nom} ({a.vacation === 'jour' ? 'Jour' : 'Soir'})</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            {!editingStudent && (
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label style={labelStyle}>Mot de passe *</Form.Label>
                  <Form.Control type="password" value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Minimum 8 caractères" style={inputStyle} />
                </Form.Group>
              </Col>
            )}
          </Row>
        </Modal.Body>
        <Modal.Footer style={{ background: 'var(--color-cardBg)', borderTop: '1px solid var(--color-border)' }}>
          <Button variant="outline-secondary" onClick={() => setShowModal(false)} style={{ borderRadius: '10px' }}>
            Annuler
          </Button>
          <Button onClick={handleSaveStudent} disabled={saving}
            style={{ background: 'linear-gradient(135deg, #4facfe, #00f2fe)', border: 'none', borderRadius: '10px', fontWeight: '600' }}>
            {saving ? <><Spinner size="sm" className="me-2" />Sauvegarde...</> : <><FiCheck className="me-2" />Sauvegarder</>}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ═══════════ MODAL: Détails Étudiant (Cours + Crédits) ═══════════ */}
      <Modal show={showDetailModal} onHide={() => setShowDetailModal(false)} size="xl" centered>
        <Modal.Header closeButton style={{
          background: 'linear-gradient(135deg, #4facfe, #00f2fe)',
          color: 'white', borderBottom: 'none'
        }}>
          <Modal.Title style={{ fontWeight: '700' }}>
            <FiUsers className="me-2" />
            Fiche Étudiant
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: 'var(--color-cardBg)', padding: '24px' }}>
          {loadingDetail ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Spinner animation="border" style={{ color: 'var(--color-primary)' }} />
            </div>
          ) : detailStudent && (
            <>
              {/* Student Info Card */}
              <Row className="mb-4">
                <Col md={8}>
                  <div style={{ padding: '20px', background: 'var(--color-bodyBg)', borderRadius: '12px' }}>
                    <h5 style={{ fontWeight: '700', color: 'var(--color-text)', marginBottom: '16px' }}>
                      {detailStudent.last_name} {detailStudent.first_name} {detailStudent.post_nom || ''}
                    </h5>
                    <Row>
                      <Col md={6}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
                          <span><FiMail className="me-2" style={{ color: 'var(--color-textSecondary)' }} />{detailStudent.email}</span>
                          {detailStudent.phone && <span><FiPhone className="me-2" />{detailStudent.phone}</span>}
                          <span><FiHash className="me-2" />Matricule: <strong>{detailStudent.matricule || 'Non attribué'}</strong></span>
                        </div>
                      </Col>
                      <Col md={6}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
                          <span>Auditoire: <strong>{detailStudent.auditoire_details?.nom || 'Non affecté'}</strong></span>
                          <span>Statut: <Badge bg={detailStudent.status === 'actif' ? 'success' : 'warning'}>{detailStudent.status}</Badge></span>
                        </div>
                      </Col>
                    </Row>
                  </div>
                </Col>
                <Col md={4}>
                  {/* Credits Summary Card */}
                  <div style={{
                    padding: '20px', borderRadius: '12px',
                    background: 'linear-gradient(135deg, #667eea22, #764ba222)',
                    border: '1px solid var(--color-border)', textAlign: 'center'
                  }}>
                    <FiAward size={32} style={{ color: '#667eea', marginBottom: '8px' }} />
                    <h3 style={{ fontWeight: '800', color: 'var(--color-text)', margin: '0 0 4px 0' }}>
                      {calculateTotalCredits(studentCourses)}
                    </h3>
                    <div style={{ color: 'var(--color-textSecondary)', fontSize: '13px' }}>Total Crédits</div>
                    <div style={{ marginTop: '8px', fontSize: '13px', color: 'var(--color-text)' }}>
                      <strong>{studentCourses.length}</strong> cours inscrits
                    </div>
                    {detailStudent.student_stats && (
                      <>
                        <hr style={{ margin: '12px 0', borderColor: 'var(--color-border)' }} />
                        <div style={{ fontSize: '12px', color: 'var(--color-textSecondary)' }}>
                          Cours validés: <strong style={{ color: '#43e97b' }}>{detailStudent.student_stats.validated_courses_count || 0}</strong>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--color-textSecondary)' }}>
                          Crédits obtenus: <strong style={{ color: '#667eea' }}>{detailStudent.student_stats.total_credits_obtained || 0}</strong>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--color-textSecondary)' }}>
                          Moyenne: <strong>{detailStudent.student_stats.average_grade || 0}%</strong>
                        </div>
                      </>
                    )}
                  </div>
                </Col>
              </Row>

              {/* Courses Table */}
              <h6 style={{ fontWeight: '700', color: 'var(--color-text)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FiBook style={{ color: '#4facfe' }} />
                Cours de l'auditoire ({studentCourses.length})
              </h6>

              {studentCourses.length === 0 ? (
                <Alert variant="light" style={{ borderRadius: '10px', textAlign: 'center' }}>
                  Aucun cours inscrit. Vérifiez l'affectation auditoire de l'étudiant.
                </Alert>
              ) : (
                <Table hover responsive style={{ marginBottom: 0 }}>
                  <thead>
                    <tr style={{ background: 'var(--color-bodyBg)' }}>
                      <th style={thStyle}>Code</th>
                      <th style={thStyle}>Nom du cours</th>
                      <th style={thStyle}>Enseignant</th>
                      <th style={thStyle}>Crédits</th>
                      <th style={thStyle}>Semestre</th>
                      <th style={thStyle}>Auditoire</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentCourses.map(c => (
                      <tr key={c.id}>
                        <td style={tdStyle}><Badge bg="light" text="dark" style={{ fontFamily: 'monospace' }}>{c.code}</Badge></td>
                        <td style={{ ...tdStyle, fontWeight: '500' }}>{c.name}</td>
                        <td style={tdStyle}>{c.titulaire_name || '—'}</td>
                        <td style={tdStyle}>
                          <Badge bg="primary" style={{ borderRadius: '6px', fontWeight: '700' }}>{c.credits}</Badge>
                        </td>
                        <td style={tdStyle}>{c.semester || '—'}</td>
                        <td style={tdStyle}>{c.auditoire_detail?.nom || '—'}</td>
                      </tr>
                    ))}
                    {/* Total row */}
                    <tr style={{ background: 'var(--color-bodyBg)', fontWeight: '700' }}>
                      <td colSpan={3} style={{ ...tdStyle, textAlign: 'right' }}>TOTAL CRÉDITS :</td>
                      <td style={tdStyle}>
                        <Badge bg="success" style={{ fontSize: '14px', padding: '6px 14px', borderRadius: '8px' }}>
                          {calculateTotalCredits(studentCourses)}
                        </Badge>
                      </td>
                      <td colSpan={2} style={tdStyle}></td>
                    </tr>
                  </tbody>
                </Table>
              )}

              {/* Grades Summary */}
              {studentGrades.length > 0 && (
                <>
                  <h6 style={{ fontWeight: '700', color: 'var(--color-text)', marginTop: '20px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FiBarChart2 style={{ color: '#f093fb' }} />
                    Notes récentes ({studentGrades.length})
                  </h6>
                  <Table hover responsive size="sm" style={{ marginBottom: 0 }}>
                    <thead>
                      <tr style={{ background: 'var(--color-bodyBg)' }}>
                        <th style={thStyle}>Cours</th>
                        <th style={thStyle}>Catégorie</th>
                        <th style={thStyle}>Note</th>
                        <th style={thStyle}>%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentGrades.slice(0, 20).map(g => (
                        <tr key={g.id}>
                          <td style={tdStyle}>{g.course_name}</td>
                          <td style={tdStyle}><Badge bg="light" text="dark">{g.category_name}</Badge></td>
                          <td style={tdStyle}>{g.value}/{g.max_value}</td>
                          <td style={tdStyle}>
                            <Badge bg={g.percentage >= 50 ? 'success' : 'danger'}>{g.percentage}%</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer style={{ background: 'var(--color-cardBg)', borderTop: '1px solid var(--color-border)' }}>
          <Button variant="outline-primary" size="sm"
            onClick={() => { setShowDetailModal(false); navigate(`/profile/${detailStudent?.id}`); }}
            style={{ borderRadius: '10px' }}>
            Voir profil complet
          </Button>
          <Button variant="outline-secondary" onClick={() => setShowDetailModal(false)} style={{ borderRadius: '10px' }}>
            Fermer
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ═══════════ MODAL: Validation Inscription ═══════════ */}
      <Modal show={showValidateModal} onHide={() => setShowValidateModal(false)} centered>
        <Modal.Header closeButton style={{ background: 'var(--color-cardBg)', borderBottom: '1px solid var(--color-border)' }}>
          <Modal.Title style={{ fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FiCheckCircle style={{ color: '#43e97b' }} />
            Valider l'inscription
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: 'var(--color-cardBg)', padding: '24px' }}>
          {selectedInscription && (
            <>
              <Alert variant="info" style={{ borderRadius: '10px' }}>
                <strong>{selectedInscription.first_name} {selectedInscription.last_name}</strong>
                <br />
                <small>
                  Filière: {selectedInscription.filiere_name || `#${selectedInscription.filiere}`} —
                  Niveau: {selectedInscription.niveau} —
                  Vacation: {selectedInscription.vacation}
                </small>
              </Alert>

              <Alert variant="warning" style={{ borderRadius: '10px', fontSize: '13px' }}>
                <strong>Ce qui va se passer :</strong>
                <ul style={{ marginBottom: 0, marginTop: '8px' }}>
                  <li>Un compte étudiant sera créé automatiquement</li>
                  <li>L'étudiant sera affecté à l'auditoire correspondant (créé si nécessaire)</li>
                  <li>Il sera inscrit à tous les cours de cet auditoire</li>
                  <li>Un email avec les identifiants sera envoyé</li>
                </ul>
              </Alert>

              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <Button onClick={handleValidateInscription} disabled={validating}
                  style={{ flex: 1, background: 'linear-gradient(135deg, #43e97b, #38f9d7)', border: 'none', borderRadius: '10px', fontWeight: '600', color: '#155724' }}>
                  {validating ? <Spinner size="sm" /> : <><FiCheck className="me-2" />Valider & Créer le compte</>}
                </Button>
              </div>

              <hr />

              <Form.Group className="mb-3">
                <Form.Label style={labelStyle}>Motif de rejet (optionnel)</Form.Label>
                <Form.Control as="textarea" rows={2} value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Raison du rejet..." style={inputStyle} />
              </Form.Group>
              <Button variant="outline-danger" onClick={handleRejectInscription} disabled={validating}
                style={{ borderRadius: '10px', width: '100%' }}>
                <FiX className="me-2" /> Rejeter l'inscription
              </Button>
            </>
          )}
        </Modal.Body>
      </Modal>
    </Container>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────
const thStyle = {
  padding: '12px 16px', color: 'var(--color-text)', fontWeight: '600',
  fontSize: '13px', borderBottom: '2px solid var(--color-border)', whiteSpace: 'nowrap'
}
const tdStyle = {
  padding: '12px 16px', color: 'var(--color-text)',
  borderBottom: '1px solid var(--color-border)', fontSize: '14px', verticalAlign: 'middle'
}
const labelStyle = { fontWeight: '600', color: 'var(--color-text)', fontSize: '13px', marginBottom: '6px' }
const inputStyle = {
  borderRadius: '10px', border: '1px solid var(--color-border)',
  background: 'var(--color-bodyBg)', color: 'var(--color-text)', padding: '10px 14px'
}

export default GestionEtudiants
