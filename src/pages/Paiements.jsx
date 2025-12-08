"use client"

import { useState, useEffect } from "react"
import { Container, Row, Col, Card, Button, Table, Badge, Form, Modal, Alert, ProgressBar, Spinner } from "react-bootstrap"
import { useSelector, useDispatch } from "react-redux"
import { motion } from "framer-motion"
import { FiDollarSign, FiCreditCard, FiCheckCircle, FiClock, FiTrendingUp, FiFileText, FiSave } from "react-icons/fi"
import { fetchMyFees, fetchPayments, createPayment } from "../store/slices/paymentsSlice"

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

const Paiements = () => {
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)
  const { myFees, payments, loading, error } = useSelector((state) => state.payments)
  const [showModal, setShowModal] = useState(false)
  const [selectedFrais, setSelectedFrais] = useState(null)
  const [montantPaye, setMontantPaye] = useState("")
  const [methodePaiement, setMethodePaiement] = useState("cash")

  useEffect(() => {
    if (user?.role === "etudiant") {
      dispatch(fetchMyFees())
    }
    dispatch(fetchPayments())
  }, [dispatch, user])

  const handlePaiement = async (e) => {
    e.preventDefault()
    try {
      const paymentData = {
        student_fee: selectedFrais.id,
        amount: parseFloat(montantPaye),
        payment_method: methodePaiement,
      }
      await dispatch(createPayment(paymentData)).unwrap()
      setShowModal(false)
      setMontantPaye("")
      setSelectedFrais(null)
      // Recharger les données
      if (user?.role === "etudiant") {
        dispatch(fetchMyFees())
      }
      dispatch(fetchPayments())
    } catch (error) {
      console.error("Erreur lors du paiement:", error)
    }
  }

  const getStatutColor = (statut) => {
    const statusMap = {
      'paid': 'success',
      'partial': 'warning',
      'unpaid': 'danger',
      'pending': 'warning',
      'confirmed': 'success',
      'rejected': 'danger'
    }
    return statusMap[statut] || 'secondary'
  }

  const formatMontant = (montant) => {
    return new Intl.NumberFormat("fr-FR").format(montant) + " FCFA"
  }

  const calculerPourcentage = (paye, total) => {
    return total > 0 ? Math.round((paye / total) * 100) : 0
  }

  const totalFrais = (myFees || []).reduce((sum, f) => sum + (f.amount || 0), 0)
  const totalPaye = (myFees || []).reduce((sum, f) => sum + (f.paid_amount || 0), 0)
  const totalRestant = totalFrais - totalPaye

  if (loading && myFees.length === 0) {
    return (
      <Container fluid style={{ padding: '24px', background: 'var(--color-bodyBg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <Spinner animation="border" style={{ color: 'var(--color-primary)', width: '3rem', height: '3rem' }} />
          <p style={{ marginTop: '16px', color: 'var(--color-textSecondary)', fontSize: '16px' }}>Chargement...</p>
        </div>
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
        <motion.div variants={itemVariants} style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #11998e, #38ef7d)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
              }}>
                <FiDollarSign size={28} style={{ color: 'white' }} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '32px', fontWeight: '700', color: 'var(--color-text)' }}>
                  Gestion des Paiements
                </h2>
                <p style={{ margin: 0, color: 'var(--color-textSecondary)', fontSize: '16px' }}>Suivez vos frais et paiements</p>
              </div>
            </div>
            <Button 
              variant="success" 
              style={{ 
                borderRadius: '8px', 
                padding: '10px 24px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <FiCreditCard size={18} />
              Nouveau Paiement
            </Button>
          </div>
        </motion.div>

        {/* Résumé financier */}
        <Row style={{ marginBottom: '32px' }}>
          <Col md={3} className="mb-3 mb-md-0">
            <motion.div variants={itemVariants}>
              <Card style={{ 
                textAlign: 'center',
                background: 'var(--color-cardBg)',
                border: '1px solid var(--color-border)',
                borderRadius: '16px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                transition: 'transform 0.2s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <Card.Body style={{ padding: '24px' }}>
                  <FiFileText size={32} style={{ color: 'var(--color-primary)', marginBottom: '12px' }} />
                  <h5 style={{ color: 'var(--color-primary)', fontSize: '24px', fontWeight: '700', margin: '8px 0' }}>{formatMontant(totalFrais)}</h5>
                  <p style={{ color: 'var(--color-textSecondary)', margin: 0, fontSize: '14px' }}>Total des Frais</p>
                </Card.Body>
              </Card>
            </motion.div>
          </Col>
          <Col md={3} className="mb-3 mb-md-0">
            <motion.div variants={itemVariants}>
              <Card style={{ 
                textAlign: 'center',
                background: 'var(--color-cardBg)',
                border: '1px solid var(--color-border)',
                borderRadius: '16px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                transition: 'transform 0.2s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <Card.Body style={{ padding: '24px' }}>
                  <FiCheckCircle size={32} style={{ color: '#28a745', marginBottom: '12px' }} />
                  <h5 style={{ color: '#28a745', fontSize: '24px', fontWeight: '700', margin: '8px 0' }}>{formatMontant(totalPaye)}</h5>
                  <p style={{ color: 'var(--color-textSecondary)', margin: 0, fontSize: '14px' }}>Montant Payé</p>
                </Card.Body>
              </Card>
            </motion.div>
          </Col>
          <Col md={3} className="mb-3 mb-md-0">
            <motion.div variants={itemVariants}>
              <Card style={{ 
                textAlign: 'center',
                background: 'var(--color-cardBg)',
                border: '1px solid var(--color-border)',
                borderRadius: '16px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                transition: 'transform 0.2s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <Card.Body style={{ padding: '24px' }}>
                  <FiClock size={32} style={{ color: '#ffc107', marginBottom: '12px' }} />
                  <h5 style={{ color: '#ffc107', fontSize: '24px', fontWeight: '700', margin: '8px 0' }}>{formatMontant(totalRestant)}</h5>
                  <p style={{ color: 'var(--color-textSecondary)', margin: 0, fontSize: '14px' }}>Montant Restant</p>
                </Card.Body>
              </Card>
            </motion.div>
          </Col>
          <Col md={3}>
            <motion.div variants={itemVariants}>
              <Card style={{ 
                textAlign: 'center',
                background: 'var(--color-cardBg)',
                border: '1px solid var(--color-border)',
                borderRadius: '16px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                transition: 'transform 0.2s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <Card.Body style={{ padding: '24px' }}>
                  <FiTrendingUp size={32} style={{ color: '#17a2b8', marginBottom: '12px' }} />
                  <h5 style={{ color: '#17a2b8', fontSize: '24px', fontWeight: '700', margin: '8px 0' }}>{calculerPourcentage(totalPaye, totalFrais)}%</h5>
                  <p style={{ color: 'var(--color-textSecondary)', margin: 0, fontSize: '14px' }}>Progression</p>
                </Card.Body>
              </Card>
            </motion.div>
          </Col>
        </Row>

        <Row>
          {/* Frais à payer */}
          <Col md={6}>
            <motion.div variants={itemVariants}>
              <Card style={{ 
                background: 'var(--color-cardBg)',
                border: '1px solid var(--color-border)',
                borderRadius: '16px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                marginBottom: '24px'
              }}>
                <Card.Header style={{ 
                  background: 'linear-gradient(135deg, var(--color-primary), #667eea)',
                  color: 'white',
                  padding: '20px 24px',
                  borderBottom: 'none',
                  borderTopLeftRadius: '16px',
                  borderTopRightRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <FiFileText size={20} />
                  <h5 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Frais à Payer</h5>
                </Card.Header>
                <Card.Body style={{ padding: '24px' }}>
                  {(myFees || []).map((fee) => (
                    <Card key={fee.id} style={{ 
                      marginBottom: '16px',
                      background: 'var(--color-bodyBg)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '12px',
                      overflow: 'hidden'
                    }}>
                      <Card.Body style={{ padding: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                          <div>
                            <h6 style={{ color: 'var(--color-primary)', margin: 0, marginBottom: '4px', fontSize: '16px', fontWeight: '600' }}>
                              {fee.fee_type_name || fee.fee_type}
                            </h6>
                            <p style={{ color: 'var(--color-textSecondary)', margin: 0, fontSize: '13px' }}>
                              Échéance: {fee.due_date ? new Date(fee.due_date).toLocaleDateString('fr-FR') : 'N/A'}
                            </p>
                          </div>
                          <Badge bg={getStatutColor(fee.status)} style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '12px' }}>
                            {fee.status === "paid" ? "Payé" : fee.status === "partial" ? "Partiel" : "Impayé"}
                          </Badge>
                        </div>

                        <div style={{ marginBottom: '12px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ fontSize: '14px', color: 'var(--color-textSecondary)' }}>Payé: {formatMontant(fee.paid_amount)}</span>
                            <span style={{ fontSize: '14px', color: 'var(--color-text)', fontWeight: '600' }}>Total: {formatMontant(fee.amount)}</span>
                          </div>
                          <ProgressBar
                            now={calculerPourcentage(fee.paid_amount, fee.amount)}
                            variant={fee.status === "paid" ? "success" : "warning"}
                            style={{ height: '8px', borderRadius: '4px' }}
                          />
                        </div>

                        {fee.status !== "paid" && (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => {
                              setSelectedFrais(fee)
                              setShowModal(true)
                            }}
                            style={{ 
                              borderRadius: '6px',
                              padding: '8px 16px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              fontSize: '13px'
                            }}
                          >
                            <FiCreditCard size={14} />
                            Effectuer un Paiement
                          </Button>
                        )}
                      </Card.Body>
                    </Card>
                  ))}
                </Card.Body>
              </Card>
            </motion.div>
          </Col>

          {/* Historique des paiements */}
          <Col md={6}>
            <motion.div variants={itemVariants}>
              <Card style={{ 
                background: 'var(--color-cardBg)',
                border: '1px solid var(--color-border)',
                borderRadius: '16px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}>
                <Card.Header style={{ 
                  background: 'linear-gradient(135deg, #11998e, #38ef7d)',
                  color: 'white',
                  padding: '20px 24px',
                  borderBottom: 'none',
                  borderTopLeftRadius: '16px',
                  borderTopRightRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <FiFileText size={20} />
                  <h5 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Historique des Paiements</h5>
                </Card.Header>
                <Card.Body style={{ padding: 0 }}>
                  <Table responsive hover style={{ marginBottom: 0 }}>
                    <thead style={{ background: 'var(--color-bodyBg)' }}>
                      <tr>
                        <th style={{ padding: '16px', color: 'var(--color-text)', fontWeight: '600', borderBottom: '2px solid var(--color-border)', fontSize: '14px' }}>Référence</th>
                        <th style={{ padding: '16px', color: 'var(--color-text)', fontWeight: '600', borderBottom: '2px solid var(--color-border)', fontSize: '14px' }}>Type</th>
                        <th style={{ padding: '16px', color: 'var(--color-text)', fontWeight: '600', borderBottom: '2px solid var(--color-border)', fontSize: '14px' }}>Montant</th>
                        <th style={{ padding: '16px', color: 'var(--color-text)', fontWeight: '600', borderBottom: '2px solid var(--color-border)', fontSize: '14px' }}>Date</th>
                        <th style={{ padding: '16px', color: 'var(--color-text)', fontWeight: '600', borderBottom: '2px solid var(--color-border)', fontSize: '14px' }}>Méthode</th>
                        <th style={{ padding: '16px', color: 'var(--color-text)', fontWeight: '600', borderBottom: '2px solid var(--color-border)', fontSize: '14px' }}>Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(payments.results || []).map((payment, index) => (
                        <tr key={payment.id} style={{ background: index % 2 === 0 ? 'var(--color-cardBg)' : 'var(--color-bodyBg)' }}>
                          <td style={{ padding: '16px', color: 'var(--color-textSecondary)', borderBottom: '1px solid var(--color-border)', fontSize: '13px' }}>
                            {payment.reference || `#${payment.id}`}
                          </td>
                          <td style={{ padding: '16px', color: 'var(--color-text)', borderBottom: '1px solid var(--color-border)', fontSize: '13px' }}>
                            {payment.fee_type_name || 'N/A'}
                          </td>
                          <td style={{ padding: '16px', color: 'var(--color-text)', fontWeight: '600', borderBottom: '1px solid var(--color-border)', fontSize: '13px' }}>
                            {formatMontant(payment.amount)}
                          </td>
                          <td style={{ padding: '16px', color: 'var(--color-textSecondary)', borderBottom: '1px solid var(--color-border)', fontSize: '13px' }}>
                            {payment.payment_date ? new Date(payment.payment_date).toLocaleDateString('fr-FR') : 'N/A'}
                          </td>
                          <td style={{ padding: '16px', color: 'var(--color-textSecondary)', borderBottom: '1px solid var(--color-border)', fontSize: '13px' }}>
                            {payment.payment_method === 'cash' ? 'Espèces' : payment.payment_method === 'bank_transfer' ? 'Virement' : payment.payment_method}
                          </td>
                          <td style={{ padding: '16px', borderBottom: '1px solid var(--color-border)' }}>
                            <Badge bg={getStatutColor(payment.status)} style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '12px' }}>
                              {payment.status === "confirmed" ? "Confirmé" : payment.status === "pending" ? "En attente" : "Rejeté"}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </motion.div>
          </Col>
        </Row>

        {/* Modal paiement */}
        <Modal show={showModal} onHide={() => setShowModal(false)} centered>
          <div style={{
            background: 'var(--color-cardBg)',
            borderRadius: '16px',
            border: '1px solid var(--color-border)',
            overflow: 'hidden'
          }}>
            <Modal.Header closeButton style={{ 
              background: 'linear-gradient(135deg, var(--color-primary), #667eea)',
              color: 'white',
              borderBottom: 'none',
              padding: '24px'
            }}>
              <Modal.Title style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '22px' }}>
                <FiCreditCard size={24} />
                Effectuer un Paiement
              </Modal.Title>
            </Modal.Header>
            <Form onSubmit={handlePaiement}>
              <Modal.Body style={{ padding: '32px', background: 'var(--color-cardBg)' }}>
                {selectedFrais && (
                  <>
                    <Alert variant="info" style={{ borderRadius: '12px', padding: '16px', background: '#e7f3ff', border: '1px solid #b3d9ff' }}>
                      <strong style={{ fontSize: '16px' }}>{selectedFrais.fee_type_name || selectedFrais.fee_type}</strong>
                      <div style={{ marginTop: '12px', fontSize: '14px', lineHeight: '1.6' }}>
                        <div>Montant total: <strong>{formatMontant(selectedFrais.amount)}</strong></div>
                        <div>Déjà payé: <strong>{formatMontant(selectedFrais.paid_amount)}</strong></div>
                        <div style={{ color: '#ffc107', fontWeight: '600' }}>Restant: {formatMontant(selectedFrais.amount - selectedFrais.paid_amount)}</div>
                      </div>
                    </Alert>

                <Form.Group className="mb-3">
                  <Form.Label>Montant à payer (FCFA)</Form.Label>
                  <Form.Control
                    type="number"
                    value={montantPaye}
                    onChange={(e) => setMontantPaye(e.target.value)}
                    max={selectedFrais.amount - selectedFrais.paid_amount}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Méthode de paiement</Form.Label>
                  <Form.Select value={methodePaiement} onChange={(e) => setMethodePaiement(e.target.value)}>
                    <option value="cash">Espèces</option>
                    <option value="bank_transfer">Virement bancaire</option>
                    <option value="card">Carte bancaire</option>
                    <option value="mobile_money">Mobile Money</option>
                  </Form.Select>
                </Form.Group>
                  </>
                )}
              </Modal.Body>
              <Modal.Footer style={{ background: 'var(--color-cardBg)', borderTop: '1px solid var(--color-border)', padding: '20px' }}>
                <Button variant="secondary" onClick={() => setShowModal(false)} style={{ borderRadius: '8px', padding: '10px 24px' }}>
                  Annuler
                </Button>
                <Button variant="primary" type="submit" style={{ borderRadius: '8px', padding: '10px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FiSave size={18} />
                  Confirmer le Paiement
                </Button>
              </Modal.Footer>
            </Form>
          </div>
        </Modal>
      </motion.div>
    </Container>
  )
}

export default Paiements
