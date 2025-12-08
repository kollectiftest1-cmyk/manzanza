"use client"

import { useState } from "react"
import { Container, Row, Col, Card, Table, Button, Badge, Modal, Alert } from "react-bootstrap"
import { useSelector } from "react-redux"
import { motion } from "framer-motion"
import { FiDollarSign, FiTrendingUp, FiTrendingDown, FiCreditCard, FiUsers, FiEdit, FiTrash2, FiEye, FiPlus, FiCheckCircle } from "react-icons/fi"

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

  const [studentPayments] = useState([
    {
      id: 1,
      student: "Marie Kouassi",
      matricule: "ISI2024001",
      type: "Frais de scolarité",
      amount: 500000,
      dueDate: "2024-02-15",
      status: "paye",
      paymentDate: "2024-02-10",
    },
    {
      id: 2,
      student: "Jean Koffi",
      matricule: "ISI2024002",
      type: "Frais de scolarité",
      amount: 500000,
      dueDate: "2024-02-15",
      status: "en_attente",
      paymentDate: null,
    },
    {
      id: 3,
      student: "Fatou Traoré",
      matricule: "ISI2024003",
      type: "Frais d'inscription",
      amount: 75000,
      dueDate: "2024-01-30",
      status: "retard",
      paymentDate: null,
    },
  ])

  const [expenses] = useState([
    {
      id: 1,
      category: "Salaires Enseignants",
      amount: 2500000,
      date: "2024-01-31",
      description: "Salaires du mois de janvier",
      status: "paye",
    },
    {
      id: 2,
      category: "Équipements IT",
      amount: 850000,
      date: "2024-02-05",
      description: "Achat ordinateurs et projecteurs",
      status: "paye",
    },
    {
      id: 3,
      category: "Maintenance",
      amount: 150000,
      date: "2024-02-10",
      description: "Réparation climatisation",
      status: "en_attente",
    },
  ])

  const getStatusBadge = (status) => {
    const statusConfig = {
      paye: { variant: "success", text: "Payé" },
      en_attente: { variant: "warning", text: "En attente" },
      retard: { variant: "danger", text: "En retard" },
    }
    const config = statusConfig[status] || { variant: "secondary", text: "Inconnu" }
    return <Badge bg={config.variant}>{config.text}</Badge>
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XOF",
    }).format(amount)
  }

  const handleViewPayment = (payment) => {
    setSelectedPayment(payment)
    setShowPaymentModal(true)
  }

  // Calculate totals
  const totalRevenue = studentPayments.filter((p) => p.status === "paye").reduce((sum, p) => sum + p.amount, 0)

  const totalExpenses = expenses.filter((e) => e.status === "paye").reduce((sum, e) => sum + e.amount, 0)

  const pendingPayments = studentPayments.filter((p) => p.status !== "paye").reduce((sum, p) => sum + p.amount, 0)

  if (user?.role !== "admin" && user?.role !== "comptable") {
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
        <motion.div variants={itemVariants} style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
            }}>
              <FiDollarSign size={28} style={{ color: 'white' }} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '32px', fontWeight: '700', color: 'var(--color-text)' }}>
                Comptabilité & Caisse
              </h2>
              <p style={{ margin: 0, color: 'var(--color-textSecondary)', fontSize: '16px' }}>
                Gestion financière et suivi des paiements
              </p>
            </div>
          </div>
        </motion.div>

        {/* Financial Summary */}
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
                  <FiTrendingUp size={32} style={{ color: '#28a745', marginBottom: '12px' }} />
                  <h4 style={{ color: '#28a745', fontSize: '24px', fontWeight: '700', margin: '8px 0' }}>{formatCurrency(totalRevenue)}</h4>
                  <p style={{ color: 'var(--color-textSecondary)', margin: 0, fontSize: '14px' }}>Revenus Encaissés</p>
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
                  <FiTrendingDown size={32} style={{ color: '#dc3545', marginBottom: '12px' }} />
                  <h4 style={{ color: '#dc3545', fontSize: '24px', fontWeight: '700', margin: '8px 0' }}>{formatCurrency(totalExpenses)}</h4>
                  <p style={{ color: 'var(--color-textSecondary)', margin: 0, fontSize: '14px' }}>Dépenses</p>
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
                  <FiDollarSign size={32} style={{ color: 'var(--color-primary)', marginBottom: '12px' }} />
                  <h4 style={{ color: 'var(--color-primary)', fontSize: '24px', fontWeight: '700', margin: '8px 0' }}>{formatCurrency(totalRevenue - totalExpenses)}</h4>
                  <p style={{ color: 'var(--color-textSecondary)', margin: 0, fontSize: '14px' }}>Solde Net</p>
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
                  <FiCreditCard size={32} style={{ color: '#ffc107', marginBottom: '12px' }} />
                  <h4 style={{ color: '#ffc107', fontSize: '24px', fontWeight: '700', margin: '8px 0' }}>{formatCurrency(pendingPayments)}</h4>
                  <p style={{ color: 'var(--color-textSecondary)', margin: 0, fontSize: '14px' }}>Paiements Attendus</p>
                </Card.Body>
              </Card>
            </motion.div>
          </Col>
        </Row>

        {/* Student Payments */}
        <Row style={{ marginBottom: '32px' }}>
          <Col>
            <motion.div variants={itemVariants}>
              <Card style={{
                background: 'var(--color-cardBg)',
                border: '1px solid var(--color-border)',
                borderRadius: '16px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}>
                <Card.Header style={{
                  background: 'linear-gradient(135deg, var(--color-primary), #667eea)',
                  color: 'white',
                  padding: '20px 24px',
                  borderBottom: 'none',
                  borderTopLeftRadius: '16px',
                  borderTopRightRadius: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <FiUsers size={20} />
                    <h5 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Paiements Étudiants</h5>
                  </div>
                  <Button variant="light" style={{ borderRadius: '8px', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
                    <FiPlus size={16} />
                    Nouveau Paiement
                  </Button>
                </Card.Header>
                <Card.Body style={{ padding: '24px' }}>
                  <div style={{ overflowX: 'auto', borderRadius: '12px' }}>
                    <Table responsive hover style={{ marginBottom: 0, border: '1px solid var(--color-border)', borderRadius: '12px', overflow: 'hidden' }}>
                      <thead style={{ background: 'var(--color-bodyBg)' }}>
                        <tr>
                          <th style={{ padding: '16px', color: 'var(--color-text)', fontWeight: '600', borderBottom: '2px solid var(--color-border)', fontSize: '14px' }}>Étudiant</th>
                          <th style={{ padding: '16px', color: 'var(--color-text)', fontWeight: '600', borderBottom: '2px solid var(--color-border)', fontSize: '14px' }}>Matricule</th>
                          <th style={{ padding: '16px', color: 'var(--color-text)', fontWeight: '600', borderBottom: '2px solid var(--color-border)', fontSize: '14px' }}>Type</th>
                          <th style={{ padding: '16px', color: 'var(--color-text)', fontWeight: '600', borderBottom: '2px solid var(--color-border)', fontSize: '14px' }}>Montant</th>
                          <th style={{ padding: '16px', color: 'var(--color-text)', fontWeight: '600', borderBottom: '2px solid var(--color-border)', fontSize: '14px' }}>Échéance</th>
                          <th style={{ padding: '16px', color: 'var(--color-text)', fontWeight: '600', borderBottom: '2px solid var(--color-border)', fontSize: '14px' }}>Statut</th>
                          <th style={{ padding: '16px', color: 'var(--color-text)', fontWeight: '600', borderBottom: '2px solid var(--color-border)', fontSize: '14px' }}>Date Paiement</th>
                          <th style={{ padding: '16px', color: 'var(--color-text)', fontWeight: '600', borderBottom: '2px solid var(--color-border)', fontSize: '14px' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {studentPayments.map((payment, index) => (
                          <tr key={payment.id} style={{ background: index % 2 === 0 ? 'var(--color-cardBg)' : 'var(--color-bodyBg)' }}>
                            <td style={{ padding: '16px', color: 'var(--color-text)', fontWeight: '500', borderBottom: '1px solid var(--color-border)', fontSize: '13px' }}>{payment.student}</td>
                            <td style={{ padding: '16px', borderBottom: '1px solid var(--color-border)' }}>
                              <code style={{ background: 'var(--color-bodyBg)', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>{payment.matricule}</code>
                            </td>
                            <td style={{ padding: '16px', color: 'var(--color-textSecondary)', borderBottom: '1px solid var(--color-border)', fontSize: '13px' }}>{payment.type}</td>
                            <td style={{ padding: '16px', borderBottom: '1px solid var(--color-border)' }}>
                              <strong style={{ color: 'var(--color-text)', fontSize: '13px' }}>{formatCurrency(payment.amount)}</strong>
                            </td>
                            <td style={{ padding: '16px', color: 'var(--color-textSecondary)', borderBottom: '1px solid var(--color-border)', fontSize: '13px' }}>{new Date(payment.dueDate).toLocaleDateString("fr-FR")}</td>
                            <td style={{ padding: '16px', borderBottom: '1px solid var(--color-border)' }}>{getStatusBadge(payment.status)}</td>
                            <td style={{ padding: '16px', color: 'var(--color-textSecondary)', borderBottom: '1px solid var(--color-border)', fontSize: '13px' }}>{payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString("fr-FR") : "-"}</td>
                            <td style={{ padding: '16px', borderBottom: '1px solid var(--color-border)' }}>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  onClick={() => handleViewPayment(payment)}
                                  style={{ borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '6px 12px' }}
                                >
                                  <FiEye size={14} />
                                  Détails
                                </Button>
                                {payment.status !== "paye" && (
                                  <Button variant="success" size="sm" style={{ borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '6px 12px' }}>
                                    <FiCheckCircle size={14} />
                                    Marquer Payé
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </Card.Body>
              </Card>
            </motion.div>
          </Col>
        </Row>

        {/* Expenses */}
        <Row>
          <Col>
            <motion.div variants={itemVariants}>
              <Card style={{
                background: 'var(--color-cardBg)',
                border: '1px solid var(--color-border)',
                borderRadius: '16px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}>
                <Card.Header style={{
                  background: 'linear-gradient(135deg, #f093fb, #f5576c)',
                  color: 'white',
                  padding: '20px 24px',
                  borderBottom: 'none',
                  borderTopLeftRadius: '16px',
                  borderTopRightRadius: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <FiTrendingDown size={20} />
                    <h5 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Dépenses</h5>
                  </div>
                  <Button variant="light" style={{ borderRadius: '8px', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' }}>
                    <FiPlus size={16} />
                    Nouvelle Dépense
                  </Button>
                </Card.Header>
                <Card.Body style={{ padding: '24px' }}>
                  <div style={{ overflowX: 'auto', borderRadius: '12px' }}>
                    <Table responsive hover style={{ marginBottom: 0, border: '1px solid var(--color-border)', borderRadius: '12px', overflow: 'hidden' }}>
                      <thead style={{ background: 'var(--color-bodyBg)' }}>
                        <tr>
                          <th style={{ padding: '16px', color: 'var(--color-text)', fontWeight: '600', borderBottom: '2px solid var(--color-border)', fontSize: '14px' }}>Catégorie</th>
                          <th style={{ padding: '16px', color: 'var(--color-text)', fontWeight: '600', borderBottom: '2px solid var(--color-border)', fontSize: '14px' }}>Montant</th>
                          <th style={{ padding: '16px', color: 'var(--color-text)', fontWeight: '600', borderBottom: '2px solid var(--color-border)', fontSize: '14px' }}>Date</th>
                          <th style={{ padding: '16px', color: 'var(--color-text)', fontWeight: '600', borderBottom: '2px solid var(--color-border)', fontSize: '14px' }}>Description</th>
                          <th style={{ padding: '16px', color: 'var(--color-text)', fontWeight: '600', borderBottom: '2px solid var(--color-border)', fontSize: '14px' }}>Statut</th>
                          <th style={{ padding: '16px', color: 'var(--color-text)', fontWeight: '600', borderBottom: '2px solid var(--color-border)', fontSize: '14px' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {expenses.map((expense, index) => (
                          <tr key={expense.id} style={{ background: index % 2 === 0 ? 'var(--color-cardBg)' : 'var(--color-bodyBg)' }}>
                            <td style={{ padding: '16px', color: 'var(--color-text)', fontWeight: '500', borderBottom: '1px solid var(--color-border)', fontSize: '13px' }}>{expense.category}</td>
                            <td style={{ padding: '16px', borderBottom: '1px solid var(--color-border)' }}>
                              <strong style={{ color: '#dc3545', fontSize: '13px' }}>{formatCurrency(expense.amount)}</strong>
                            </td>
                            <td style={{ padding: '16px', color: 'var(--color-textSecondary)', borderBottom: '1px solid var(--color-border)', fontSize: '13px' }}>{new Date(expense.date).toLocaleDateString("fr-FR")}</td>
                            <td style={{ padding: '16px', color: 'var(--color-textSecondary)', borderBottom: '1px solid var(--color-border)', fontSize: '13px' }}>{expense.description}</td>
                            <td style={{ padding: '16px', borderBottom: '1px solid var(--color-border)' }}>{getStatusBadge(expense.status)}</td>
                            <td style={{ padding: '16px', borderBottom: '1px solid var(--color-border)' }}>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <Button variant="outline-primary" size="sm" style={{ borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '6px 12px' }}>
                                  <FiEdit size={14} />
                                  Modifier
                                </Button>
                                <Button variant="outline-danger" size="sm" style={{ borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '6px 12px' }}>
                                  <FiTrash2 size={14} />
                                  Supprimer
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </Card.Body>
              </Card>
            </motion.div>
          </Col>
        </Row>

        {/* Payment Details Modal */}
        <Modal show={showPaymentModal} onHide={() => setShowPaymentModal(false)} centered>
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
                Détails du Paiement
              </Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ padding: '32px', background: 'var(--color-cardBg)' }}>
              {selectedPayment && (
                <div>
                  <Row style={{ marginBottom: '16px' }}>
                    <Col><strong style={{ color: 'var(--color-text)' }}>Étudiant:</strong></Col>
                    <Col style={{ color: 'var(--color-textSecondary)' }}>{selectedPayment.student}</Col>
                  </Row>
                  <Row style={{ marginBottom: '16px' }}>
                    <Col><strong style={{ color: 'var(--color-text)' }}>Matricule:</strong></Col>
                    <Col><code style={{ background: 'var(--color-bodyBg)', padding: '4px 8px', borderRadius: '4px', fontSize: '13px' }}>{selectedPayment.matricule}</code></Col>
                  </Row>
                  <Row style={{ marginBottom: '16px' }}>
                    <Col><strong style={{ color: 'var(--color-text)' }}>Type:</strong></Col>
                    <Col style={{ color: 'var(--color-textSecondary)' }}>{selectedPayment.type}</Col>
                  </Row>
                  <Row style={{ marginBottom: '16px' }}>
                    <Col><strong style={{ color: 'var(--color-text)' }}>Montant:</strong></Col>
                    <Col><strong style={{ color: 'var(--color-primary)', fontSize: '16px' }}>{formatCurrency(selectedPayment.amount)}</strong></Col>
                  </Row>
                  <Row style={{ marginBottom: '16px' }}>
                    <Col><strong style={{ color: 'var(--color-text)' }}>Échéance:</strong></Col>
                    <Col style={{ color: 'var(--color-textSecondary)' }}>{new Date(selectedPayment.dueDate).toLocaleDateString("fr-FR")}</Col>
                  </Row>
                  <Row style={{ marginBottom: '16px' }}>
                    <Col><strong style={{ color: 'var(--color-text)' }}>Statut:</strong></Col>
                    <Col>{getStatusBadge(selectedPayment.status)}</Col>
                  </Row>
                  {selectedPayment.paymentDate && (
                    <Row style={{ marginBottom: '16px' }}>
                      <Col><strong style={{ color: 'var(--color-text)' }}>Date de Paiement:</strong></Col>
                      <Col style={{ color: 'var(--color-textSecondary)' }}>{new Date(selectedPayment.paymentDate).toLocaleDateString("fr-FR")}</Col>
                    </Row>
                  )}
                </div>
              )}
            </Modal.Body>
            <Modal.Footer style={{ background: 'var(--color-cardBg)', borderTop: '1px solid var(--color-border)', padding: '20px' }}>
              <Button variant="secondary" onClick={() => setShowPaymentModal(false)} style={{ borderRadius: '8px', padding: '10px 24px' }}>
                Fermer
              </Button>
              {selectedPayment?.status !== "paye" && (
                <Button variant="success" style={{ borderRadius: '8px', padding: '10px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FiCheckCircle size={18} />
                  Marquer comme Payé
                </Button>
              )}
            </Modal.Footer>
          </div>
        </Modal>
      </motion.div>
    </Container>
  )
}

export default Comptabilite
