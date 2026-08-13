"use client"

import { useState, useEffect, useCallback } from "react"
import { Container, Row, Col, Card, Table, Button, Badge, Modal, Alert, Spinner } from "react-bootstrap"
import { useSelector } from "react-redux"
import { motion } from "framer-motion"
import { FiDollarSign, FiTrendingUp, FiTrendingDown, FiCreditCard, FiUsers, FiEdit, FiTrash2, FiEye, FiPlus, FiCheckCircle, FiRefreshCw, FiXCircle } from "react-icons/fi"
import paymentService from "../services/paymentService"
import { toast } from "react-toastify"

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

const Comptabilite = () => {
  const { user } = useSelector((state) => state.auth)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [payments, setPayments] = useState([])
  const [dashboard, setDashboard] = useState(null)
  const [processingId, setProcessingId] = useState(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [payRes, dashRes] = await Promise.allSettled([
        paymentService.getPayments({ ordering: '-payment_date', page_size: 50 }),
        paymentService.getFeeDashboard(),
      ])
      if (payRes.status === 'fulfilled') setPayments(payRes.value.data?.results || payRes.value.data || [])
      if (dashRes.status === 'fulfilled') setDashboard(dashRes.value.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const getStatusBadge = (status) => {
    const cfg = {
      confirme: { variant: "success", text: "Confirmé" },
      en_attente: { variant: "warning", text: "En attente" },
      rejete: { variant: "danger", text: "Rejeté" },
      annule: { variant: "secondary", text: "Annulé" },
    }
    const c = cfg[status] || { variant: "secondary", text: status || "Inconnu" }
    return <Badge bg={c.variant}>{c.text}</Badge>
  }

  const fmt = (amount) => amount != null ? `$${Number(amount).toLocaleString('fr-FR')}` : '—'

  const handleViewPayment = (payment) => {
    setSelectedPayment(payment)
    setShowPaymentModal(true)
  }

  const handleConfirm = async (id) => {
    setProcessingId(id)
    try {
      await paymentService.confirmPayment(id)
      toast.success('Paiement confirmé !')
      loadData()
    } catch (err) {
      toast.error('Erreur confirmation')
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (id) => {
    setProcessingId(id)
    try {
      await paymentService.rejectPayment(id)
      toast.info('Paiement rejeté')
      loadData()
    } catch (err) {
      toast.error('Erreur rejet')
    } finally {
      setProcessingId(null)
    }
  }

  const d = dashboard || {}
  const totalPaid = Number(d.total_paid || 0)
  const totalExpected = Number(d.total_expected || 0)
  const totalPending = Number(d.total_pending || 0)

  const allowedRoles = ['caisse', 'sgad', 'iadmin', 'pdg', 'directeur_general']
  const canAction = ['iadmin', 'directeur_general'].includes(user?.role) || user?.is_staff
  if (!allowedRoles.includes(user?.role) && !user?.is_staff) {
    return (
      <Container fluid style={{ padding: '24px', background: 'var(--color-bodyBg)', minHeight: '100vh' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Alert variant="danger" style={{ maxWidth: '600px', margin: '40px auto', borderRadius: '12px', padding: '24px' }}>
            <h4>Accès Refusé</h4>
            <p>Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
          </Alert>
        </motion.div>
      </Container>
    )
  }

  return (
    <Container fluid style={{ padding: '24px', background: 'var(--color-bodyBg)', minHeight: '100vh' }}>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header Section */}
        <motion.div variants={itemVariants} style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '16px',
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
              }}>
                <FiDollarSign size={28} style={{ color: 'white' }} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '28px', fontWeight: '700', color: 'var(--color-text)' }}>
                  Comptabilité & Caisse
                </h2>
                <p style={{ margin: 0, color: 'var(--color-textSecondary)', fontSize: '14px' }}>
                  Suivi des paiements étudiants en temps réel
                </p>
              </div>
            </div>
            <Button size="sm" variant="outline-secondary" onClick={loadData} style={{ borderRadius: '10px' }}>
              <FiRefreshCw size={14} className="me-1" /> Actualiser
            </Button>
          </div>
        </motion.div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px' }}>
            <Spinner animation="border" style={{ color: 'var(--color-primary)' }} />
          </div>
        ) : (
          <>
            {/* Financial Summary */}
            <Row style={{ marginBottom: '24px' }}>
              {[
                { label: 'Montant collecté', value: fmt(totalPaid), icon: FiTrendingUp, color: '#28a745' },
                { label: 'Montant attendu', value: fmt(totalExpected), icon: FiCreditCard, color: 'var(--color-primary)' },
                { label: 'En attente', value: fmt(totalPending), icon: FiTrendingDown, color: '#ffc107' },
                { label: 'Taux collecte', value: `${d.collection_rate || 0}%`, icon: FiCheckCircle, color: '#667eea' },
              ].map((s, i) => (
                <Col md={3} sm={6} className="mb-3" key={i}>
                  <motion.div variants={itemVariants}>
                    <Card style={{
                      textAlign: 'center', background: 'var(--color-cardBg)',
                      border: 'none', borderRadius: '14px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                      transition: 'transform 0.2s', cursor: 'default'
                    }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                      <Card.Body style={{ padding: '22px' }}>
                        <s.icon size={28} style={{ color: s.color, marginBottom: '10px' }} />
                        <h4 style={{ color: s.color, fontSize: '22px', fontWeight: '800', margin: '6px 0' }}>{s.value}</h4>
                        <p style={{ color: 'var(--color-textSecondary)', margin: 0, fontSize: '13px' }}>{s.label}</p>
                      </Card.Body>
                    </Card>
                  </motion.div>
                </Col>
              ))}
            </Row>

            {/* Payments Table */}
            <motion.div variants={itemVariants}>
              <Card style={{ background: 'var(--color-cardBg)', border: 'none', borderRadius: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <Card.Header style={{
                  background: 'linear-gradient(135deg, var(--color-primary), #667eea)',
                  color: 'white', padding: '18px 24px', borderBottom: 'none',
                  borderTopLeftRadius: '14px', borderTopRightRadius: '14px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FiUsers size={18} />
                    <h6 style={{ margin: 0, fontWeight: '600' }}>Tous les paiements ({payments.length})</h6>
                  </div>
                </Card.Header>
                <Card.Body style={{ padding: 0 }}>
                  {payments.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '50px', color: 'var(--color-textSecondary)' }}>
                      <FiDollarSign size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
                      <p>Aucun paiement enregistré pour le moment.</p>
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <Table hover style={{ marginBottom: 0, fontSize: '13px' }}>
                        <thead style={{ background: 'var(--color-bodyBg)' }}>
                          <tr>
                            <th style={thStyle}>Réf.</th>
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
                          {payments.map((p, i) => (
                            <tr key={p.id} style={{ background: i % 2 === 0 ? 'var(--color-cardBg)' : 'var(--color-bodyBg)' }}>
                              <td style={tdStyle}>
                                <code style={{ fontSize: '11px', background: 'var(--color-bodyBg)', padding: '2px 6px', borderRadius: '4px' }}>
                                  {p.reference || `#${p.id}`}
                                </code>
                              </td>
                              <td style={{ ...tdStyle, fontWeight: '500' }}>
                                {p.student_name || p.student_matricule || '—'}
                              </td>
                              <td style={tdStyle}>{p.fee_name || '—'}</td>
                              <td style={tdStyle}><strong>${Number(p.amount).toLocaleString('fr-FR')}</strong></td>
                              <td style={tdStyle}>
                                <Badge bg="light" text="dark" style={{ fontSize: '11px' }}>
                                  {p.mobile_money_provider_display || p.payment_method || '—'}
                                </Badge>
                              </td>
                              <td style={tdStyle}>{getStatusBadge(p.status)}</td>
                              <td style={tdStyle}>{p.payment_date ? new Date(p.payment_date).toLocaleDateString('fr-FR') : '—'}</td>
                              <td style={{ ...tdStyle, textAlign: 'center' }}>
                                <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                  <Button size="sm" variant="outline-primary" onClick={() => handleViewPayment(p)}
                                    style={{ borderRadius: '6px', padding: '4px 8px' }}>
                                    <FiEye size={13} />
                                  </Button>
                                  {p.status === 'en_attente' && canAction && (
                                    <>
                                      <Button size="sm" variant="success" disabled={processingId === p.id}
                                        onClick={() => handleConfirm(p.id)}
                                        style={{ borderRadius: '6px', padding: '4px 8px' }}>
                                        <FiCheckCircle size={13} />
                                      </Button>
                                      <Button size="sm" variant="outline-danger" disabled={processingId === p.id}
                                        onClick={() => handleReject(p.id)}
                                        style={{ borderRadius: '6px', padding: '4px 8px' }}>
                                        <FiXCircle size={13} />
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </motion.div>
          </>
        )}

        {/* Payment Details Modal */}
        <Modal show={showPaymentModal} onHide={() => setShowPaymentModal(false)} centered>
          <Modal.Header closeButton style={{
            background: 'linear-gradient(135deg, var(--color-primary), #667eea)',
            color: 'white', borderBottom: 'none', borderRadius: '14px 14px 0 0'
          }}>
            <Modal.Title style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px' }}>
              <FiCreditCard size={20} /> Détails du Paiement
            </Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ padding: '24px', background: 'var(--color-cardBg)' }}>
            {selectedPayment && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
                {[
                  ['Référence', selectedPayment.reference || `#${selectedPayment.id}`],
                  ['Étudiant', selectedPayment.student_name || '—'],
                  ['Matricule', selectedPayment.student_matricule || '—'],
                  ['Frais', selectedPayment.fee_name || '—'],
                  ['Montant', `$${Number(selectedPayment.amount).toLocaleString('fr-FR')}`],
                  ['Méthode', selectedPayment.mobile_money_provider_display || selectedPayment.payment_method || '—'],
                  ['Statut', null],
                  ['Date', selectedPayment.payment_date ? new Date(selectedPayment.payment_date).toLocaleDateString('fr-FR') : '—'],
                  ['Transaction ID', selectedPayment.transaction_id || '—'],
                ].map(([label, value], i) => (
                  <Row key={i}>
                    <Col xs={5}><strong style={{ color: 'var(--color-text)' }}>{label}:</strong></Col>
                    <Col xs={7} style={{ color: 'var(--color-textSecondary)' }}>
                      {label === 'Statut' ? getStatusBadge(selectedPayment.status) : value}
                    </Col>
                  </Row>
                ))}
              </div>
            )}
          </Modal.Body>
          <Modal.Footer style={{ background: 'var(--color-cardBg)', borderTop: '1px solid var(--color-border)' }}>
            <Button variant="outline-secondary" onClick={() => setShowPaymentModal(false)} style={{ borderRadius: '8px' }}>
              Fermer
            </Button>
            {selectedPayment?.status === 'en_attente' && canAction && (
              <Button variant="success" onClick={() => { handleConfirm(selectedPayment.id); setShowPaymentModal(false) }}
                style={{ borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FiCheckCircle size={16} /> Confirmer
              </Button>
            )}
          </Modal.Footer>
        </Modal>
      </motion.div>
    </Container>
  )
}

const thStyle = { padding: '12px 16px', fontWeight: '600', fontSize: '12px', color: 'var(--color-textSecondary)', borderBottom: '2px solid var(--color-border)' }
const tdStyle = { padding: '12px 16px', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text)', verticalAlign: 'middle' }

export default Comptabilite
