"use client"

import { useState, useEffect } from "react"
import { Container, Row, Col, Card, Button, Table, Badge, Form, Modal, Alert, ProgressBar } from "react-bootstrap"
import { useSelector, useDispatch } from "react-redux"
import { fetchMyFees, fetchPayments, createPayment } from "../store/slices/paymentsSlice"

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
      <Container fluid className="py-0 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </Container>
    )
  }

  return (
    <Container fluid className="py-0">
      <Row className="dashboard-card">
        <Col>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="text-primary">Gestion des Paiements</h2>
            <Button variant="success">Nouveau Paiement</Button>
          </div>
        </Col>
      </Row>

      {/* Résumé financier */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center border-0 shadow-sm">
            <Card.Body>
              <h5 className="text-primary">{formatMontant(totalFrais)}</h5>
              <p className="text-muted mb-0">Total des Frais</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-0 shadow-sm">
            <Card.Body>
              <h5 className="text-success">{formatMontant(totalPaye)}</h5>
              <p className="text-muted mb-0">Montant Payé</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-0 shadow-sm">
            <Card.Body>
              <h5 className="text-warning">{formatMontant(totalRestant)}</h5>
              <p className="text-muted mb-0">Montant Restant</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-0 shadow-sm">
            <Card.Body>
              <h5 className="text-info">{calculerPourcentage(totalPaye, totalFrais)}%</h5>
              <p className="text-muted mb-0">Progression</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        {/* Frais à payer */}
        <Col md={6}>
          <Card className="border-0 shadow-sm mb-4">
            <Card.Header className="bg-white">
              <h5 className="mb-0">Frais à Payer</h5>
            </Card.Header>
            <Card.Body>
              {(myFees || []).map((fee) => (
                <Card key={fee.id} className="mb-3 border">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <h6 className="text-primary">{fee.fee_type_name || fee.fee_type}</h6>
                        <p className="text-muted mb-1">Échéance: {fee.due_date ? new Date(fee.due_date).toLocaleDateString('fr-FR') : 'N/A'}</p>
                      </div>
                      <Badge bg={getStatutColor(fee.status)}>{fee.status === "paid" ? "Payé" : fee.status === "partial" ? "Partiel" : "Impayé"}</Badge>
                    </div>

                    <div className="mb-2">
                      <div className="d-flex justify-content-between">
                        <span>Payé: {formatMontant(fee.paid_amount)}</span>
                        <span>Total: {formatMontant(fee.amount)}</span>
                      </div>
                      <ProgressBar
                        now={calculerPourcentage(fee.paid_amount, fee.amount)}
                        variant={fee.status === "paid" ? "success" : "warning"}
                        className="mt-1"
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
                      >
                        Effectuer un Paiement
                      </Button>
                    )}
                  </Card.Body>
                </Card>
              ))}
            </Card.Body>
          </Card>
        </Col>

        {/* Historique des paiements */}
        <Col md={6}>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white">
              <h5 className="mb-0">Historique des Paiements</h5>
            </Card.Header>
            <Card.Body className="p-0">
              <Table responsive hover className="mb-0">
                <thead className="bg-light">
                  <tr>
                    <th>Référence</th>
                    <th>Type</th>
                    <th>Montant</th>
                    <th>Date</th>
                    <th>Méthode</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {(payments || []).map((payment) => (
                    <tr key={payment.id}>
                      <td>{payment.reference || `#${payment.id}`}</td>
                      <td>{payment.fee_type_name || 'N/A'}</td>
                      <td>{formatMontant(payment.amount)}</td>
                      <td>{payment.payment_date ? new Date(payment.payment_date).toLocaleDateString('fr-FR') : 'N/A'}</td>
                      <td>{payment.payment_method === 'cash' ? 'Espèces' : payment.payment_method === 'bank_transfer' ? 'Virement' : payment.payment_method}</td>
                      <td>
                        <Badge bg={getStatutColor(payment.status)}>{payment.status === "confirmed" ? "Confirmé" : payment.status === "pending" ? "En attente" : "Rejeté"}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Modal paiement */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Effectuer un Paiement</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handlePaiement}>
          <Modal.Body>
            {selectedFrais && (
              <>
                <Alert variant="info">
                  <strong>{selectedFrais.fee_type_name || selectedFrais.fee_type}</strong>
                  <br />
                  Montant total: {formatMontant(selectedFrais.amount)}
                  <br />
                  Déjà payé: {formatMontant(selectedFrais.paid_amount)}
                  <br />
                  Restant: {formatMontant(selectedFrais.amount - selectedFrais.paid_amount)}
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
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Annuler
            </Button>
            <Button variant="primary" type="submit">
              Confirmer le Paiement
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  )
}

export default Paiements
