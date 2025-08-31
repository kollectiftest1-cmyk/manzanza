"use client"

import { useState } from "react"
import { Container, Row, Col, Card, Table, Button, Badge, Modal, Alert } from "react-bootstrap"
import { useSelector } from "react-redux"

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
      <Container className="mt-4">
        <Alert variant="danger">
          <h4>Accès Refusé</h4>
          <p>Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
        </Alert>
      </Container>
    )
  }

  return (
    <Container fluid className="mt-4">
      <Row className="mb-4 dashboard-card">
        <Col>
          <h2>Comptabilité & Caisse</h2>
          <p className="text-muted">Gestion financière et suivi des paiements</p>
        </Col>
      </Row>

      {/* Financial Summary */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="shadow text-center">
            <Card.Body>
              <h4 className="text-success">{formatCurrency(totalRevenue)}</h4>
              <p className="mb-0">Revenus Encaissés</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="shadow text-center">
            <Card.Body>
              <h4 className="text-danger">{formatCurrency(totalExpenses)}</h4>
              <p className="mb-0">Dépenses</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="shadow text-center">
            <Card.Body>
              <h4 className="text-primary">{formatCurrency(totalRevenue - totalExpenses)}</h4>
              <p className="mb-0">Solde Net</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="shadow text-center">
            <Card.Body>
              <h4 className="text-warning">{formatCurrency(pendingPayments)}</h4>
              <p className="mb-0">Paiements Attendus</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Student Payments */}
      <Row className="mb-4">
        <Col>
          <Card className="shadow">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Paiements Étudiants</h5>
              <Button variant="primary">+ Nouveau Paiement</Button>
            </Card.Header>
            <Card.Body>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Étudiant</th>
                    <th>Matricule</th>
                    <th>Type</th>
                    <th>Montant</th>
                    <th>Échéance</th>
                    <th>Statut</th>
                    <th>Date Paiement</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {studentPayments.map((payment) => (
                    <tr key={payment.id}>
                      <td>{payment.student}</td>
                      <td>
                        <code>{payment.matricule}</code>
                      </td>
                      <td>{payment.type}</td>
                      <td>
                        <strong>{formatCurrency(payment.amount)}</strong>
                      </td>
                      <td>{new Date(payment.dueDate).toLocaleDateString("fr-FR")}</td>
                      <td>{getStatusBadge(payment.status)}</td>
                      <td>{payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString("fr-FR") : "-"}</td>
                      <td>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="me-2"
                          onClick={() => handleViewPayment(payment)}
                        >
                          Détails
                        </Button>
                        {payment.status !== "paye" && (
                          <Button variant="success" size="sm">
                            Marquer Payé
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Expenses */}
      <Row>
        <Col>
          <Card className="shadow">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Dépenses</h5>
              <Button variant="danger">+ Nouvelle Dépense</Button>
            </Card.Header>
            <Card.Body>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Catégorie</th>
                    <th>Montant</th>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((expense) => (
                    <tr key={expense.id}>
                      <td>{expense.category}</td>
                      <td>
                        <strong className="text-danger">{formatCurrency(expense.amount)}</strong>
                      </td>
                      <td>{new Date(expense.date).toLocaleDateString("fr-FR")}</td>
                      <td>{expense.description}</td>
                      <td>{getStatusBadge(expense.status)}</td>
                      <td>
                        <Button variant="outline-primary" size="sm" className="me-2">
                          Modifier
                        </Button>
                        <Button variant="outline-danger" size="sm">
                          Supprimer
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Payment Details Modal */}
      <Modal show={showPaymentModal} onHide={() => setShowPaymentModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Détails du Paiement</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedPayment && (
            <div>
              <Row className="mb-3">
                <Col>
                  <strong>Étudiant:</strong>
                </Col>
                <Col>{selectedPayment.student}</Col>
              </Row>
              <Row className="mb-3">
                <Col>
                  <strong>Matricule:</strong>
                </Col>
                <Col>{selectedPayment.matricule}</Col>
              </Row>
              <Row className="mb-3">
                <Col>
                  <strong>Type:</strong>
                </Col>
                <Col>{selectedPayment.type}</Col>
              </Row>
              <Row className="mb-3">
                <Col>
                  <strong>Montant:</strong>
                </Col>
                <Col>
                  <strong>{formatCurrency(selectedPayment.amount)}</strong>
                </Col>
              </Row>
              <Row className="mb-3">
                <Col>
                  <strong>Échéance:</strong>
                </Col>
                <Col>{new Date(selectedPayment.dueDate).toLocaleDateString("fr-FR")}</Col>
              </Row>
              <Row className="mb-3">
                <Col>
                  <strong>Statut:</strong>
                </Col>
                <Col>{getStatusBadge(selectedPayment.status)}</Col>
              </Row>
              {selectedPayment.paymentDate && (
                <Row className="mb-3">
                  <Col>
                    <strong>Date de Paiement:</strong>
                  </Col>
                  <Col>{new Date(selectedPayment.paymentDate).toLocaleDateString("fr-FR")}</Col>
                </Row>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPaymentModal(false)}>
            Fermer
          </Button>
          {selectedPayment?.status !== "paye" && <Button variant="success">Marquer comme Payé</Button>}
        </Modal.Footer>
      </Modal>
    </Container>
  )
}

export default Comptabilite
