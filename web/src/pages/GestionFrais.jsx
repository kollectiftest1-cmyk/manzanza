/**
 * GestionFrais.jsx — SGAD / Admin : gestion des frais étudiants
 * - Tableau de bord (collecte, taux, stats)
 * - Créer une campagne de frais + ciblage (tous / section / filière / auditoire / étudiant)
 * - Liste des campagnes avec aperçu des paiements
 * - Gestion des paiements (confirmer / rejeter)
 * - Types de frais (catégories)
 */
import { useState, useEffect, useCallback } from 'react'
import {
  Container, Row, Col, Card, Table, Button, Modal, Form,
  Badge, Alert, Spinner, InputGroup, ProgressBar, Tabs, Tab
} from 'react-bootstrap'
import { motion } from 'framer-motion'
import {
  FiDollarSign, FiPlus, FiEdit, FiTrash2, FiEye, FiCheck,
  FiX, FiRefreshCw, FiUsers, FiTarget, FiCheckCircle,
  FiAlertCircle, FiClock, FiBarChart2, FiSend, FiSearch,
  FiLock, FiUnlock, FiFileText
} from 'react-icons/fi'
import { useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import paymentService from '../services/paymentService'
import { getAuditoires } from '../services/auditoireService'
import { getSections } from '../services/sectionService'
import { getFilieres } from '../services/filiereService'
import api from '../services/api'

const EMPTY_FEE = {
  name: '',
  description: '',
  amount: '',
  currency: 'USD',
  fee_type: '',
  target_type: 'tous',
  target_section: '',
  target_filiere: '',
  target_auditoire: '',
  target_student: '',
  academic_year: '2024-2025',
  due_date: '',
}

const STATUS_BADGE = {
  impaye:  { bg: 'danger',  label: 'Impayé' },
  partiel: { bg: 'warning', label: 'Partiel' },
  paye:    { bg: 'success', label: 'Payé' },
  annule:  { bg: 'secondary', label: 'Annulé' },
}
const PAY_STATUS = {
  en_attente: { bg: 'warning', label: 'En attente' },
  confirme:   { bg: 'success', label: 'Confirmé' },
  rejete:     { bg: 'danger',  label: 'Rejeté' },
  annule:     { bg: 'secondary', label: 'Annulé' },
}

const GestionFrais = () => {
  const { user } = useSelector(s => s.auth)

  const [activeTab, setActiveTab] = useState('dashboard')
  const [fees, setFees] = useState([])
  const [feeTypes, setFeeTypes] = useState([])
  const [payments, setPayments] = useState([])
  const [studentFees, setStudentFees] = useState([])
  const [dashboard, setDashboard] = useState(null)
  const [sections, setSections] = useState([])
  const [filieres, setFilieres] = useState([])
  const [auditoires, setAuditoires] = useState([])
  const [students, setStudents] = useState([])

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Fee form
  const [showFeeModal, setShowFeeModal] = useState(false)
  const [feeForm, setFeeForm] = useState({ ...EMPTY_FEE })
  const [feeFormError, setFeeFormError] = useState(null)
  const [lastCreated, setLastCreated] = useState(null)

  // Fee students modal
  const [showStudentsModal, setShowStudentsModal] = useState(false)
  const [feeStudents, setFeeStudents] = useState([])
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [selectedFee, setSelectedFee] = useState(null)

  // Fee type modal
  const [showFeeTypeModal, setShowFeeTypeModal] = useState(false)
  const [feeTypeForm, setFeeTypeForm] = useState({ name: '', category: 'scolarite', amount: '', is_mandatory: true })
  const [editingFeeType, setEditingFeeType] = useState(null)

  // Payment details
  const [paySearch, setPaySearch] = useState('')

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [feesRes, feeTypesRes, paymentsRes, dashRes] = await Promise.all([
        paymentService.getFees(),
        paymentService.getFeeTypes(),
        paymentService.getPayments({ ordering: '-payment_date' }),
        paymentService.getFeeDashboard().catch(() => ({ data: null })),
      ])
      setFees(feesRes.data?.results || feesRes.data || [])
      setFeeTypes(feeTypesRes.data?.results || feeTypesRes.data || [])
      setPayments(paymentsRes.data?.results || paymentsRes.data || [])
      if (dashRes.data) setDashboard(dashRes.data)
    } catch (err) {
      toast.error('Erreur chargement des données.')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadOptions = useCallback(async () => {
    const [audRes, secRes, filRes, stuRes] = await Promise.allSettled([
      getAuditoires(),
      getSections(),
      getFilieres(),
      api.get('/students/', { params: { page_size: 300 } }),
    ])
    if (audRes.status === 'fulfilled') setAuditoires(audRes.value.data?.results || audRes.value.data || [])
    if (secRes.status === 'fulfilled') setSections(secRes.value.data?.results || secRes.value.data || [])
    if (filRes.status === 'fulfilled') setFilieres(filRes.value.data?.results || filRes.value.data || [])
    if (stuRes.status === 'fulfilled') setStudents(stuRes.value.data?.results || stuRes.value.data || [])
  }, [])

  useEffect(() => {
    loadAll()
    loadOptions()
  }, [loadAll, loadOptions])

  // ── Create Fee Campaign ───────────────────────────────────────────────────
  const handleCreateFee = async (e) => {
    e.preventDefault()
    setFeeFormError(null)
    if (!feeForm.name || !feeForm.amount || !feeForm.due_date) {
      setFeeFormError('Intitulé, montant et date limite sont obligatoires.')
      return
    }
    if (parseFloat(feeForm.amount) <= 0) {
      setFeeFormError('Le montant doit être positif.')
      return
    }
    setSaving(true)
    try {
      const payload = { ...feeForm }
      if (!payload.fee_type) delete payload.fee_type
      if (!payload.target_section) delete payload.target_section
      if (!payload.target_filiere) delete payload.target_filiere
      if (!payload.target_auditoire) delete payload.target_auditoire
      if (!payload.target_student) delete payload.target_student
      const res = await paymentService.createFee(payload)
      setLastCreated(res.data)
      setShowFeeModal(false)
      setFeeForm({ ...EMPTY_FEE })
      toast.success(`✅ ${res.data.message || 'Frais créé avec succès !'}`)
      loadAll()
    } catch (err) {
      const msg = err.response?.data
      setFeeFormError(typeof msg === 'object' ? Object.values(msg).flat()[0] : 'Erreur création.')
    } finally {
      setSaving(false)
    }
  }

  const handleViewStudents = async (fee) => {
    setSelectedFee(fee)
    setShowStudentsModal(true)
    setLoadingStudents(true)
    try {
      const res = await paymentService.getFeeStudents(fee.id)
      setFeeStudents(res.data?.results || res.data || [])
    } catch {
      toast.error('Erreur chargement des étudiants.')
    } finally {
      setLoadingStudents(false)
    }
  }

  const handleReAssign = async (fee) => {
    try {
      const res = await paymentService.assignFee(fee.id)
      toast.success(res.data.message)
      loadAll()
    } catch {
      toast.error('Erreur lors de la réassignation.')
    }
  }

  const handleDeleteFee = async (fee) => {
    if (!window.confirm(`Supprimer le frais "${fee.name}" ?`)) return
    try {
      await paymentService.deleteFee(fee.id)
      toast.success('Frais supprimé.')
      loadAll()
    } catch {
      toast.error('Erreur suppression.')
    }
  }

  // ── Confirm / Reject Payment ──────────────────────────────────────────────
  const handleConfirmPayment = async (paymentId) => {
    try {
      await paymentService.confirmPayment(paymentId)
      toast.success('Paiement confirmé !')
      loadAll()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur confirmation.')
    }
  }

  const handleRejectPayment = async (paymentId) => {
    try {
      await paymentService.rejectPayment(paymentId)
      toast.warning('Paiement rejeté.')
      loadAll()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur rejet.')
    }
  }

  // ── Fee Type CRUD ─────────────────────────────────────────────────────────
  const handleSaveFeeType = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editingFeeType) {
        await paymentService.updateFeeType(editingFeeType.id, feeTypeForm)
        toast.success('Catégorie mise à jour.')
      } else {
        await paymentService.createFeeType(feeTypeForm)
        toast.success('Catégorie créée.')
      }
      setShowFeeTypeModal(false)
      setEditingFeeType(null)
      setFeeTypeForm({ name: '', category: 'scolarite', amount: '', is_mandatory: true })
      loadAll()
    } catch (err) {
      toast.error('Erreur sauvegarde catégorie.')
    } finally {
      setSaving(false)
    }
  }

  const filteredPayments = payments.filter(p => {
    if (!paySearch) return true
    const q = paySearch.toLowerCase()
    return (p.student_name || '').toLowerCase().includes(q) ||
           (p.reference || '').toLowerCase().includes(q) ||
           (p.fee_name || '').toLowerCase().includes(q)
  })

  const targetLabel = (fee) => {
    if (fee.target_type === 'tous') return 'Tous'
    if (fee.target_type === 'auditoire') return fee.target_auditoire_name || `Aud. #${fee.target_auditoire}`
    if (fee.target_type === 'filiere') return fee.target_filiere_name || `Fil. #${fee.target_filiere}`
    if (fee.target_type === 'section') return fee.target_section_name || `Sec. #${fee.target_section}`
    if (fee.target_type === 'etudiant') return fee.target_student_name || `Ét. #${fee.target_student}`
    return '—'
  }

  const canManage = ['iadmin', 'directeur_general'].includes(user?.role)

  return (
    <Container fluid style={{ padding: '16px 20px', background: 'var(--color-bodyBg)', minHeight: '100vh' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #43e97b, #38f9d7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(67,233,123,0.3)'
            }}>
              <FiDollarSign size={20} color="white" />
            </div>
            <div>
              <div style={{ fontWeight: '700', fontSize: '16px', color: 'var(--color-text)' }}>Gestion des Frais</div>
              <small style={{ color: 'var(--color-textSecondary)' }}>Campagnes, paiements, Mobile Money</small>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button size="sm" variant="outline-secondary" onClick={loadAll} style={{ borderRadius: '8px' }}>
              <FiRefreshCw size={13} />
            </Button>
            {canManage && (
              <Button size="sm" onClick={() => setShowFeeModal(true)}
                style={{ borderRadius: '8px', background: 'linear-gradient(135deg, #43e97b, #38f9d7)', border: 'none', fontWeight: '600', padding: '6px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FiPlus size={14} /> Nouveau Frais
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {[
          { id: 'dashboard', label: 'Tableau de bord', icon: FiBarChart2 },
          { id: 'fees', label: `Campagnes (${fees.length})`, icon: FiTarget },
          { id: 'payments', label: `Paiements (${payments.length})`, icon: FiDollarSign },
          { id: 'categories', label: 'Catégories', icon: FiFileText },
        ].map(tab => (
          <Button key={tab.id} size="sm"
            variant={activeTab === tab.id ? 'primary' : 'outline-secondary'}
            onClick={() => setActiveTab(tab.id)}
            style={{
              borderRadius: '8px', padding: '6px 14px', fontWeight: '600', fontSize: '13px',
              display: 'flex', alignItems: 'center', gap: '5px',
              ...(activeTab === tab.id ? { background: 'linear-gradient(135deg, #43e97b, #38f9d7)', border: 'none', color: '#155724' } : {})
            }}>
            <tab.icon size={13} /> {tab.label}
          </Button>
        ))}
      </div>

      {loading && <div style={{ textAlign: 'center', padding: '40px' }}><Spinner style={{ color: 'var(--color-primary)' }} /></div>}

      {/* ══ DASHBOARD ══ */}
      {!loading && activeTab === 'dashboard' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {canManage &&  <Row className="g-3 mb-4">
            {[
              { label: 'Campagnes actives', value: dashboard?.active_campaigns ?? fees.filter(f => f.is_active).length, icon: FiTarget, color: '#4facfe' },
              { label: 'Étudiants ciblés', value: dashboard?.total_student_fees ?? '—', icon: FiUsers, color: '#a78bfa' },
              { label: 'Montant collecté', value: dashboard ? `$${Number(dashboard.total_paid).toFixed(0)}` : '—', icon: FiCheckCircle, color: '#43e97b' },
              { label: 'En attente', value: dashboard ? `$${Number(dashboard.total_pending).toFixed(0)}` : '—', icon: FiClock, color: '#f093fb' },
            ].map((s, i) => (
              <Col md={3} sm={6} key={i}>
                <Card style={{ border: 'none', borderRadius: '12px', background: 'var(--color-cardBg)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                  <Card.Body style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${s.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <s.icon size={20} color={s.color} />
                    </div>
                    <div>
                      <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--color-text)', lineHeight: 1.2 }}>{s.value}</div>
                      <div style={{ fontSize: '12px', color: 'var(--color-textSecondary)' }}>{s.label}</div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>}

          {dashboard && canManage && (
            <Card style={{ border: 'none', borderRadius: '12px', background: 'var(--color-cardBg)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: '16px' }}>
              <Card.Body style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontWeight: '600', color: 'var(--color-text)' }}>Taux de collecte global</span>
                  <span style={{ fontWeight: '700', color: '#43e97b' }}>{dashboard.collection_rate}%</span>
                </div>
                <ProgressBar now={dashboard.collection_rate} variant="success" style={{ height: '10px', borderRadius: '6px' }} />
                <Row className="mt-3 g-2">
                  {[
                    { label: 'Payé', value: dashboard.paid_count, color: '#43e97b' },
                    { label: 'Partiel', value: dashboard.partial_count, color: '#ffc107' },
                    { label: 'Impayé', value: dashboard.unpaid_count, color: '#dc3545' },
                  ].map(s => (
                    <Col xs={4} key={s.label} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '22px', fontWeight: '800', color: s.color }}>{s.value}</div>
                      <div style={{ fontSize: '12px', color: 'var(--color-textSecondary)' }}>{s.label}</div>
                    </Col>
                  ))}
                </Row>
              </Card.Body>
            </Card>
          )}

          {/* Recent fees */}
          <h6 style={{ fontWeight: '700', color: 'var(--color-text)', marginBottom: '10px' }}>Campagnes récentes</h6>
          {fees.length === 0 ? (
            <Card style={{ border: '2px dashed var(--color-border)', borderRadius: '14px', background: 'var(--color-cardBg)', boxShadow: 'none', marginBottom: '16px' }}>
              <Card.Body style={{ padding: '32px', textAlign: 'center' }}>
                <div style={{ fontSize: '36px', marginBottom: '12px' }}>🚀</div>
                <div style={{ fontWeight: '700', fontSize: '16px', color: 'var(--color-text)', marginBottom: '6px' }}>
                  Bienvenue dans la Gestion des Frais
                </div>
                <div style={{ fontSize: '13px', color: 'var(--color-textSecondary)', marginBottom: '20px', maxWidth: '420px', margin: '0 auto 20px' }}>
                  Aucune campagne pour l'instant. Commencez par créer une <strong>catégorie de frais</strong>, puis lancez votre première <strong>campagne</strong> pour l'assigner automatiquement aux étudiants.
                </div>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  {canManage && <>
                  <Button size="sm" variant="outline-primary" onClick={() => { setActiveTab('categories'); setTimeout(() => setShowFeeTypeModal(true), 150) }}
                    style={{ borderRadius: '8px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <FiFileText size={13} /> 1. Créer une catégorie
                  </Button>
                  <Button size="sm" onClick={() => setShowFeeModal(true)}
                    style={{ borderRadius: '8px', fontWeight: '600', background: 'linear-gradient(135deg, #43e97b, #38f9d7)', border: 'none', color: '#155724', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <FiPlus size={13} /> 2. Créer un frais
                  </Button>
                  </>}
                </div>
              </Card.Body>
            </Card>
          ) : fees.slice(0, 5).map(fee => (
            <Card key={fee.id} style={{ border: 'none', borderRadius: '10px', background: 'var(--color-cardBg)', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', marginBottom: '8px' }}>
              <Card.Body style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <div style={{ fontWeight: '600', color: 'var(--color-text)', fontSize: '14px' }}>{fee.name}</div>
                  <small style={{ color: 'var(--color-textSecondary)' }}>
                    {fee.amount} {fee.currency} · {targetLabel(fee)} · Échéance: {fee.due_date}
                  </small>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Badge bg="info" style={{ fontSize: '11px' }}>{fee.students_count} étudiant(s)</Badge>
                  <Badge bg={fee.is_active ? 'success' : 'secondary'} style={{ fontSize: '11px' }}>
                    {fee.is_active ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>
              </Card.Body>
            </Card>
          ))}
        </motion.div>
      )}

      {/* ══ CAMPAIGNS ══ */}
      {!loading && activeTab === 'fees' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card style={{ border: 'none', borderRadius: '12px', background: 'var(--color-cardBg)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <Card.Body style={{ padding: 0 }}>
              <div style={{ overflowX: 'auto' }}>
                <Table hover style={{ marginBottom: 0, fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: 'var(--color-bodyBg)' }}>
                      <th style={thStyle}>Intitulé</th>
                      <th style={thStyle}>Montant</th>
                      <th style={thStyle}>Cible</th>
                      <th style={thStyle}>Étudiants</th>
                      <th style={thStyle}>Échéance</th>
                      <th style={thStyle}>Statut</th>
                      <th style={{ ...thStyle, textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fees.length === 0 ? (
                      <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--color-textSecondary)' }}>Aucune campagne de frais.</td></tr>
                    ) : fees.map((fee, idx) => (
                      <motion.tr key={fee.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.02 }}>
                        <td style={{ ...tdStyle, fontWeight: '600' }}>
                          {fee.name}
                          {fee.fee_type_name && <div style={{ fontSize: '11px', color: 'var(--color-textSecondary)' }}>{fee.fee_type_name}</div>}
                        </td>
                        <td style={tdStyle}>
                          <strong>{fee.amount}</strong> <span style={{ fontSize: '11px', color: 'var(--color-textSecondary)' }}>{fee.currency}</span>
                        </td>
                        <td style={tdStyle}>
                          <Badge bg="secondary" style={{ fontSize: '11px' }}>{targetLabel(fee)}</Badge>
                          <div style={{ fontSize: '11px', color: 'var(--color-textSecondary)', marginTop: '2px' }}>{fee.target_display}</div>
                        </td>
                        <td style={tdStyle}>
                          <Badge bg="info" style={{ fontSize: '11px' }}>{fee.students_count}</Badge>
                        </td>
                        <td style={tdStyle}>
                          <span style={{ fontSize: '12px', fontFamily: 'monospace' }}>{fee.due_date}</span>
                        </td>
                        <td style={tdStyle}>
                          <Badge bg={fee.is_active ? 'success' : 'secondary'} style={{ fontSize: '11px' }}>
                            {fee.is_active ? 'Actif' : 'Inactif'}
                          </Badge>
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                            <Button size="sm" variant="outline-primary" onClick={() => handleViewStudents(fee)}
                              style={{ borderRadius: '6px', padding: '3px 7px' }} title="Voir les étudiants ciblés">
                              <FiEye size={12} />
                            </Button>
                            {canManage && (
                              <Button size="sm" variant="outline-secondary" onClick={() => handleReAssign(fee)}
                                style={{ borderRadius: '6px', padding: '3px 7px' }} title="Réassigner aux nouveaux étudiants">
                                <FiSend size={12} />
                              </Button>
                            )}
                            {canManage && (
                              <Button size="sm" variant="outline-danger" onClick={() => handleDeleteFee(fee)}
                                style={{ borderRadius: '6px', padding: '3px 7px' }}>
                                <FiTrash2 size={12} />
                              </Button>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </motion.div>
      )}

      {/* ══ PAYMENTS ══ */}
      {!loading && activeTab === 'payments' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div style={{ marginBottom: '12px' }}>
            <InputGroup style={{ maxWidth: '320px' }}>
              <InputGroup.Text style={{ background: 'var(--color-bodyBg)', border: '1px solid var(--color-border)', borderRadius: '8px 0 0 8px' }}>
                <FiSearch size={13} />
              </InputGroup.Text>
              <Form.Control placeholder="Rechercher..." value={paySearch} onChange={e => setPaySearch(e.target.value)}
                style={{ ...inputStyle, borderRadius: '0 8px 8px 0', borderLeft: 'none', fontSize: '13px' }} />
            </InputGroup>
          </div>
          <Card style={{ border: 'none', borderRadius: '12px', background: 'var(--color-cardBg)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <Card.Body style={{ padding: 0 }}>
              <div style={{ overflowX: 'auto' }}>
                <Table hover style={{ marginBottom: 0, fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: 'var(--color-bodyBg)' }}>
                      <th style={thStyle}>Référence</th>
                      <th style={thStyle}>Étudiant</th>
                      <th style={thStyle}>Frais</th>
                      <th style={thStyle}>Montant</th>
                      <th style={thStyle}>Méthode</th>
                      <th style={thStyle}>Statut</th>
                      <th style={thStyle}>Date</th>
                      <th style={{ ...thStyle, textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayments.length === 0 ? (
                      <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--color-textSecondary)' }}>Aucun paiement.</td></tr>
                    ) : filteredPayments.map(pay => {
                      const ps = PAY_STATUS[pay.status] || { bg: 'secondary', label: pay.status }
                      return (
                        <tr key={pay.id}>
                          <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: '12px' }}>{pay.reference}</td>
                          <td style={{ ...tdStyle, fontWeight: '500' }}>
                            {pay.student_name}
                            {pay.student_matricule && <div style={{ fontSize: '11px', color: 'var(--color-textSecondary)', fontFamily: 'monospace' }}>{pay.student_matricule}</div>}
                          </td>
                          <td style={tdStyle}>{pay.fee_name}</td>
                          <td style={{ ...tdStyle, fontWeight: '700', color: '#43e97b' }}>{pay.amount}</td>
                          <td style={tdStyle}>
                            {pay.payment_method === 'mobile' ? (
                              <span>📱 {pay.mobile_money_provider_display || 'Mobile Money'}
                                {pay.mobile_money_number && <div style={{ fontSize: '11px', color: 'var(--color-textSecondary)', fontFamily: 'monospace' }}>{pay.mobile_money_number}</div>}
                              </span>
                            ) : pay.payment_method}
                          </td>
                          <td style={tdStyle}>
                            <Badge bg={ps.bg} style={{ fontSize: '11px' }}>{ps.label}</Badge>
                          </td>
                          <td style={tdStyle}>
                            <small style={{ color: 'var(--color-textSecondary)' }}>
                              {pay.payment_date ? new Date(pay.payment_date).toLocaleDateString('fr-FR') : '—'}
                            </small>
                          </td>
                          <td style={{ ...tdStyle, textAlign: 'center' }}>
                            {pay.status === 'en_attente' && canManage && (
                              <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                                <Button size="sm" variant="success" onClick={() => handleConfirmPayment(pay.id)}
                                  style={{ borderRadius: '6px', padding: '3px 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                  <FiCheck size={11} /> OK
                                </Button>
                                <Button size="sm" variant="outline-danger" onClick={() => handleRejectPayment(pay.id)}
                                  style={{ borderRadius: '6px', padding: '3px 7px' }}>
                                  <FiX size={11} />
                                </Button>
                              </div>
                            )}
                            {pay.status !== 'en_attente' && (
                              <Badge bg={ps.bg} style={{ fontSize: '10px' }}>{ps.label}</Badge>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </motion.div>
      )}

      {/* ══ CATEGORIES ══ */}
      {!loading && activeTab === 'categories' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {canManage && (
          <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'flex-end' }}>
            <Button size="sm" onClick={() => setShowFeeTypeModal(true)}
              style={{ borderRadius: '8px', background: 'linear-gradient(135deg, #43e97b, #38f9d7)', border: 'none', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <FiPlus size={13} /> Nouvelle catégorie
            </Button>
          </div>
          )}
          <Card style={{ border: 'none', borderRadius: '12px', background: 'var(--color-cardBg)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <Card.Body style={{ padding: 0 }}>
              <Table hover style={{ marginBottom: 0, fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: 'var(--color-bodyBg)' }}>
                    <th style={thStyle}>Nom</th>
                    <th style={thStyle}>Catégorie</th>
                    <th style={thStyle}>Montant défaut</th>
                    <th style={thStyle}>Obligatoire</th>
                    <th style={{ ...thStyle, textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {feeTypes.length === 0 ? (
                    <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--color-textSecondary)' }}>Aucune catégorie.</td></tr>
                  ) : feeTypes.map(ft => (
                    <tr key={ft.id}>
                      <td style={{ ...tdStyle, fontWeight: '600' }}>{ft.name}</td>
                      <td style={tdStyle}><Badge bg="secondary" style={{ fontSize: '11px' }}>{ft.category}</Badge></td>
                      <td style={tdStyle}>{ft.amount}</td>
                      <td style={tdStyle}><Badge bg={ft.is_mandatory ? 'danger' : 'light'} text={ft.is_mandatory ? 'white' : 'dark'} style={{ fontSize: '11px' }}>{ft.is_mandatory ? 'Oui' : 'Non'}</Badge></td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        {canManage && (
                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                          <Button size="sm" variant="outline-warning" onClick={() => { setEditingFeeType(ft); setFeeTypeForm({ name: ft.name, category: ft.category, amount: ft.amount, is_mandatory: ft.is_mandatory }); setShowFeeTypeModal(true) }}
                            style={{ borderRadius: '6px', padding: '3px 7px' }}><FiEdit size={12} /></Button>
                          <Button size="sm" variant="outline-danger" onClick={() => { if (window.confirm('Supprimer?')) paymentService.deleteFeeType(ft.id).then(loadAll).catch(() => toast.error('Erreur')) }}
                            style={{ borderRadius: '6px', padding: '3px 7px' }}><FiTrash2 size={12} /></Button>
                        </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </motion.div>
      )}

      {/* ══ MODAL: Créer Frais ══ */}
      <Modal show={showFeeModal} onHide={() => setShowFeeModal(false)} size="lg" centered>
        <Modal.Header closeButton style={{ background: 'var(--color-cardBg)', borderBottom: '1px solid var(--color-border)' }}>
          <Modal.Title style={{ fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '16px' }}>
            <FiDollarSign style={{ color: '#43e97b' }} /> Créer une campagne de frais
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: 'var(--color-cardBg)', padding: '20px' }}>
          {feeFormError && <Alert variant="danger" style={{ borderRadius: '8px', fontSize: '13px', padding: '8px 12px' }}>{feeFormError}</Alert>}

          {lastCreated && (
            <Alert variant="success" onClose={() => setLastCreated(null)} dismissible style={{ borderRadius: '8px', fontSize: '13px', padding: '8px 12px' }}>
              ✅ {lastCreated.message}
            </Alert>
          )}

          <Form onSubmit={handleCreateFee}>
            <Row className="g-2">
              <Col xs={12}>
                <Form.Group>
                  <Form.Label style={labelStyle}>Intitulé *</Form.Label>
                  <Form.Control placeholder="ex: Minerval 2024-2025" required value={feeForm.name}
                    onChange={e => setFeeForm({ ...feeForm, name: e.target.value })} style={inputStyle} />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label style={labelStyle}>Montant *</Form.Label>
                  <Form.Control type="number" min="0" step="0.01" required placeholder="0.00"
                    value={feeForm.amount} onChange={e => setFeeForm({ ...feeForm, amount: e.target.value })} style={inputStyle} />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label style={labelStyle}>Devise</Form.Label>
                  <Form.Select value={feeForm.currency} onChange={e => setFeeForm({ ...feeForm, currency: e.target.value })} style={inputStyle}>
                    <option value="USD">USD</option>
                    <option value="CDF">CDF</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={5}>
                <Form.Group>
                  <Form.Label style={labelStyle}>Catégorie</Form.Label>
                  <Form.Select value={feeForm.fee_type} onChange={e => setFeeForm({ ...feeForm, fee_type: e.target.value })} style={inputStyle}>
                    <option value="">— Sans catégorie —</option>
                    {feeTypes.map(ft => <option key={ft.id} value={ft.id}>{ft.name}</option>)}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label style={labelStyle}>Date limite *</Form.Label>
                  <Form.Control type="date" required value={feeForm.due_date}
                    onChange={e => setFeeForm({ ...feeForm, due_date: e.target.value })} style={inputStyle} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label style={labelStyle}>Année académique</Form.Label>
                  <Form.Control value={feeForm.academic_year}
                    onChange={e => setFeeForm({ ...feeForm, academic_year: e.target.value })} style={inputStyle} />
                </Form.Group>
              </Col>

              {/* TARGETING */}
              <Col xs={12}>
                <div style={{ background: 'var(--color-bodyBg)', borderRadius: '10px', padding: '14px 16px', marginTop: '4px' }}>
                  <div style={{ fontWeight: '700', color: 'var(--color-text)', fontSize: '13px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FiTarget size={14} /> Ciblage
                  </div>
                  <Row className="g-2">
                    <Col xs={12}>
                      <Form.Group>
                        <Form.Label style={labelStyle}>Qui doit payer ?</Form.Label>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {[
                            { v: 'tous', l: '👥 Tous les étudiants' },
                            { v: 'section', l: '📚 Section' },
                            { v: 'filiere', l: '🎓 Filière' },
                            { v: 'auditoire', l: '🏫 Auditoire' },
                            { v: 'etudiant', l: '👤 Étudiant' },
                          ].map(opt => (
                            <Button key={opt.v} size="sm"
                              variant={feeForm.target_type === opt.v ? 'primary' : 'outline-secondary'}
                              onClick={() => setFeeForm({ ...feeForm, target_type: opt.v, target_section: '', target_filiere: '', target_auditoire: '', target_student: '' })}
                              style={{ borderRadius: '8px', fontSize: '12px', fontWeight: feeForm.target_type === opt.v ? '700' : '500' }}>
                              {opt.l}
                            </Button>
                          ))}
                        </div>
                      </Form.Group>
                    </Col>

                    {feeForm.target_type === 'section' && (
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label style={labelStyle}>Section *</Form.Label>
                          <Form.Select required value={feeForm.target_section}
                            onChange={e => setFeeForm({ ...feeForm, target_section: e.target.value })} style={inputStyle}>
                            <option value="">— Choisir —</option>
                            {sections.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    )}
                    {feeForm.target_type === 'filiere' && (
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label style={labelStyle}>Filière *</Form.Label>
                          <Form.Select required value={feeForm.target_filiere}
                            onChange={e => setFeeForm({ ...feeForm, target_filiere: e.target.value })} style={inputStyle}>
                            <option value="">— Choisir —</option>
                            {filieres.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    )}
                    {feeForm.target_type === 'auditoire' && (
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label style={labelStyle}>Auditoire *</Form.Label>
                          <Form.Select required value={feeForm.target_auditoire}
                            onChange={e => setFeeForm({ ...feeForm, target_auditoire: e.target.value })} style={inputStyle}>
                            <option value="">— Choisir —</option>
                            {auditoires.map(a => <option key={a.id} value={a.id}>{a.nom}</option>)}
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    )}
                    {feeForm.target_type === 'etudiant' && (
                      <Col md={8}>
                        <Form.Group>
                          <Form.Label style={labelStyle}>Étudiant *</Form.Label>
                          <Form.Select required value={feeForm.target_student}
                            onChange={e => setFeeForm({ ...feeForm, target_student: e.target.value })} style={inputStyle}>
                            <option value="">— Choisir un étudiant —</option>
                            {students.map(s => <option key={s.id} value={s.id}>{s.last_name} {s.first_name} ({s.matricule || s.email})</option>)}
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    )}
                  </Row>
                </div>
              </Col>

              <Col xs={12}>
                <Form.Group>
                  <Form.Label style={labelStyle}>Description (optionnelle)</Form.Label>
                  <Form.Control as="textarea" rows={2} value={feeForm.description}
                    onChange={e => setFeeForm({ ...feeForm, description: e.target.value })}
                    placeholder="Remarques..." style={{ ...inputStyle, resize: 'vertical' }} />
                </Form.Group>
              </Col>
            </Row>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
              <Button variant="outline-secondary" onClick={() => setShowFeeModal(false)} style={{ borderRadius: '8px' }}>Annuler</Button>
              <Button type="submit" disabled={saving}
                style={{ borderRadius: '8px', background: 'linear-gradient(135deg, #43e97b, #38f9d7)', border: 'none', fontWeight: '700', padding: '8px 24px', color: '#155724' }}>
                {saving ? <Spinner size="sm" className="me-2" /> : <FiSend size={14} className="me-2" />}
                Créer & Assigner
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* ══ MODAL: Students of a fee ══ */}
      <Modal show={showStudentsModal} onHide={() => setShowStudentsModal(false)} size="lg" centered>
        <Modal.Header closeButton style={{ background: 'var(--color-cardBg)', borderBottom: '1px solid var(--color-border)' }}>
          <Modal.Title style={{ fontWeight: '700', fontSize: '15px' }}>
            <FiUsers className="me-2" style={{ color: '#4facfe' }} />
            {selectedFee?.name} — Étudiants ciblés ({feeStudents.length})
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: 'var(--color-cardBg)', padding: 0 }}>
          {loadingStudents ? <div style={{ textAlign: 'center', padding: '40px' }}><Spinner /></div> : (
            <div style={{ overflowX: 'auto', maxHeight: '500px', overflowY: 'auto' }}>
              <Table hover style={{ marginBottom: 0, fontSize: '13px' }}>
                <thead style={{ position: 'sticky', top: 0, background: 'var(--color-bodyBg)', zIndex: 1 }}>
                  <tr>
                    <th style={thStyle}>Étudiant</th>
                    <th style={thStyle}>Matricule</th>
                    <th style={thStyle}>Montant dû</th>
                    <th style={thStyle}>Payé</th>
                    <th style={thStyle}>Reste</th>
                    <th style={thStyle}>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {feeStudents.map(sf => {
                    const st = STATUS_BADGE[sf.status] || { bg: 'secondary', label: sf.status }
                    return (
                      <tr key={sf.id}>
                        <td style={{ ...tdStyle, fontWeight: '500' }}>{sf.student_name}</td>
                        <td style={{ ...tdStyle, fontFamily: 'monospace', fontSize: '12px', color: 'var(--color-textSecondary)' }}>{sf.student_matricule}</td>
                        <td style={tdStyle}>${sf.total_amount}</td>
                        <td style={{ ...tdStyle, color: '#43e97b', fontWeight: '600' }}>${sf.amount_paid}</td>
                        <td style={{ ...tdStyle, color: parseFloat(sf.amount_remaining) > 0 ? '#dc3545' : '#43e97b', fontWeight: '600' }}>${sf.amount_remaining}</td>
                        <td style={tdStyle}>
                          <div>
                            <Badge bg={st.bg} style={{ fontSize: '11px' }}>{st.label}</Badge>
                            <ProgressBar now={sf.payment_percentage} style={{ height: '4px', borderRadius: '2px', marginTop: '4px', minWidth: '60px' }}
                              variant={sf.payment_percentage >= 100 ? 'success' : sf.payment_percentage > 0 ? 'warning' : 'danger'} />
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </Table>
            </div>
          )}
        </Modal.Body>
      </Modal>

      {/* ══ MODAL: Fee Type ══ */}
      <Modal show={showFeeTypeModal} onHide={() => setShowFeeTypeModal(false)} centered>
        <Modal.Header closeButton style={{ background: 'var(--color-cardBg)', borderBottom: '1px solid var(--color-border)' }}>
          <Modal.Title style={{ fontWeight: '700', fontSize: '15px' }}>
            {editingFeeType ? 'Modifier la catégorie' : 'Nouvelle catégorie de frais'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: 'var(--color-cardBg)', padding: '20px' }}>
          <Form onSubmit={handleSaveFeeType}>
            <Form.Group className="mb-3">
              <Form.Label style={labelStyle}>Nom *</Form.Label>
              <Form.Control required value={feeTypeForm.name} onChange={e => setFeeTypeForm({ ...feeTypeForm, name: e.target.value })} style={inputStyle} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label style={labelStyle}>Catégorie</Form.Label>
              <Form.Select value={feeTypeForm.category} onChange={e => setFeeTypeForm({ ...feeTypeForm, category: e.target.value })} style={inputStyle}>
                {[['scolarite', 'Frais de scolarité'], ['inscription', "Frais d'inscription"], ['examen', "Frais d'examen"],
                  ['bibliotheque', 'Bibliothèque'], ['laboratoire', 'Laboratoire'], ['autre', 'Autre']]
                  .map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label style={labelStyle}>Montant par défaut</Form.Label>
              <Form.Control type="number" min="0" step="0.01" value={feeTypeForm.amount} onChange={e => setFeeTypeForm({ ...feeTypeForm, amount: e.target.value })} style={inputStyle} />
            </Form.Group>
            <Form.Check label="Obligatoire" checked={feeTypeForm.is_mandatory} onChange={e => setFeeTypeForm({ ...feeTypeForm, is_mandatory: e.target.checked })} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <Button variant="outline-secondary" onClick={() => setShowFeeTypeModal(false)} style={{ borderRadius: '8px' }}>Annuler</Button>
              <Button type="submit" disabled={saving}
                style={{ borderRadius: '8px', background: 'linear-gradient(135deg, #43e97b, #38f9d7)', border: 'none', fontWeight: '700', color: '#155724' }}>
                {saving ? <Spinner size="sm" /> : <FiCheck size={14} className="me-1" />} Sauvegarder
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  )
}

const thStyle = {
  padding: '8px 12px', fontSize: '11px', fontWeight: '600',
  color: 'var(--color-text)', borderBottom: '2px solid var(--color-border)', whiteSpace: 'nowrap'
}
const tdStyle = {
  padding: '8px 12px', fontSize: '13px', color: 'var(--color-text)',
  borderBottom: '1px solid var(--color-border)', verticalAlign: 'middle'
}
const labelStyle = { fontWeight: '600', fontSize: '12px', color: 'var(--color-text)', marginBottom: '4px', display: 'block' }
const inputStyle = {
  borderRadius: '8px', border: '1px solid var(--color-border)',
  background: 'var(--color-bodyBg)', color: 'var(--color-text)', padding: '7px 10px', fontSize: '13px'
}

export default GestionFrais
