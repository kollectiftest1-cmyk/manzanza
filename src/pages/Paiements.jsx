"use client"

import { useState, useEffect } from "react"
import { Container, Row, Col, Card, Button, Table, Badge, Form, Modal, Alert, ProgressBar } from "react-bootstrap"
import { useSelector } from "react-redux"

const Paiements = () => {
  const { user } = useSelector((state) => state.auth)
  const [paiements, setPaiements] = useState([])
  const [frais, setFrais] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [selectedFrais, setSelectedFrais] = useState(null)
  const [montantPaye, setMontantPaye] = useState("")
  const [methodePaiement, setMethodePaiement] = useState("especes")

  useEffect(() => {
    // Simuler le chargement des données
    setFrais([
      {
        id: 1,
        type: "Frais de scolarité",
        montant: 500000,
        montantPaye: 300000,
        dateEcheance: "2024-02-15",
        statut: "partiel",
      },
      {
        id: 2,
        type: "Frais de laboratoire",
        montant: 50000,
        montantPaye: 0,
        dateEcheance: "2024-01-30",
        statut: "impaye",
      },
      {
        id: 3,
        type: "Frais de bibliothèque",
        montant: 25000,
        montantPaye: 25000,
        dateEcheance: "2024-01-15",
        statut: "paye",
      },
    ])

    setPaiements([
      {
        id: 1,
        type: "Frais de scolarité",
        montant: 200000,
        date: "2024-01-10",
        methode: "Virement bancaire",
        reference: "PAY001",
        statut: "confirme",
      },
      {
        id: 2,
        type: "Frais de scolarité",
        montant: 100000,
        date: "2024-01-05",
        methode: "Espèces",
        reference: "PAY002",
        statut: "confirme",
      },
    ])
  }, [])

  const handlePaiement = (e) => {
    e.preventDefault()
    const nouveauPaiement = {
      id: paiements.length + 1,
      type: selectedFrais.type,
      montant: Number.parseInt(montantPaye),
      date: new Date().toISOString().split("T")[0],
      methode: methodePaiement,
      reference: `PAY${String(paiements.length + 1).padStart(3, "0")}`,
      statut: "en-attente",
    }

    setPaiements([...paiements, nouveauPaiement])

    // Mettre à jour les frais
    const fraisUpdated = frais.map((f) => {
      if (f.id === selectedFrais.id) {
        const nouveauMontantPaye = f.montantPaye + Number.parseInt(montantPaye)
        return {
          ...f,
          montantPaye: nouveauMontantPaye,
          statut: nouveauMontantPaye >= f.montant ? "paye" : "partiel",
        }
      }
      return f
    })
    setFrais(fraisUpdated)

    setShowModal(false)
    setMontantPaye("")
    setSelectedFrais(null)
  }

  const getStatutColor = (statut) => {
    switch (statut) {
      case "paye":
        return "success"
      case "partiel":
        return "warning"
      case "impaye":
        return "danger"
      case "confirme":
        return "success"
      case "en-attente":
        return "warning"
      default:
        return "secondary"
    }
  }

  const formatMontant = (montant) => {
    return new Intl.NumberFormat("fr-FR").format(montant) + " FCFA"
  }

  const calculerPourcentage = (paye, total) => {
    return Math.round((paye / total) * 100)
  }

  const totalFrais = frais.reduce((sum, f) => sum + f.montant, 0)
  const totalPaye = frais.reduce((sum, f) => sum + f.montantPaye, 0)
  const totalRestant = totalFrais - totalPaye

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
              {frais.map((frais) => (
                <Card key={frais.id} className="mb-3 border">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <h6 className="text-primary">{frais.type}</h6>
                        <p className="text-muted mb-1">Échéance: {frais.dateEcheance}</p>
                      </div>
                      <Badge bg={getStatutColor(frais.statut)}>{frais.statut}</Badge>
                    </div>

                    <div className="mb-2">
                      <div className="d-flex justify-content-between">
                        <span>Payé: {formatMontant(frais.montantPaye)}</span>
                        <span>Total: {formatMontant(frais.montant)}</span>
                      </div>
                      <ProgressBar
                        now={calculerPourcentage(frais.montantPaye, frais.montant)}
                        variant={frais.statut === "paye" ? "success" : "warning"}
                        className="mt-1"
                      />
                    </div>

                    {frais.statut !== "paye" && (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => {
                          setSelectedFrais(frais)
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
                  {paiements.map((paiement) => (
                    <tr key={paiement.id}>
                      <td>{paiement.reference}</td>
                      <td>{paiement.type}</td>
                      <td>{formatMontant(paiement.montant)}</td>
                      <td>{paiement.date}</td>
                      <td>{paiement.methode}</td>
                      <td>
                        <Badge bg={getStatutColor(paiement.statut)}>{paiement.statut}</Badge>
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
                  <strong>{selectedFrais.type}</strong>
                  <br />
                  Montant total: {formatMontant(selectedFrais.montant)}
                  <br />
                  Déjà payé: {formatMontant(selectedFrais.montantPaye)}
                  <br />
                  Restant: {formatMontant(selectedFrais.montant - selectedFrais.montantPaye)}
                </Alert>

                <Form.Group className="mb-3">
                  <Form.Label>Montant à payer (FCFA)</Form.Label>
                  <Form.Control
                    type="number"
                    value={montantPaye}
                    onChange={(e) => setMontantPaye(e.target.value)}
                    max={selectedFrais.montant - selectedFrais.montantPaye}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Méthode de paiement</Form.Label>
                  <Form.Select value={methodePaiement} onChange={(e) => setMethodePaiement(e.target.value)}>
                    <option value="especes">Espèces</option>
                    <option value="virement">Virement bancaire</option>
                    <option value="cheque">Chèque</option>
                    <option value="mobile">Paiement mobile</option>
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
