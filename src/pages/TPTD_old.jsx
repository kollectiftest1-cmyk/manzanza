"use client"

import { useState, useEffect } from "react"
import { Container, Row, Col, Card, Button, Badge, Tab, Tabs, Form, Modal, Alert } from "react-bootstrap"
import { useSelector } from "react-redux"

const TPTD = () => {
  const { user } = useSelector((state) => state.auth)
  const [activeTab, setActiveTab] = useState("mes-travaux")
  const [travaux, setTravaux] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [selectedTravail, setSelectedTravail] = useState(null)
  const [soumission, setSoumission] = useState("")

  useEffect(() => {
    // Simulation des TP/TD
    setTravaux([
      {
        id: 1,
        titre: "TP Comptabilité - Bilan Comptable",
        cours: "Comptabilité Générale",
        type: "TP",
        dateDebut: "2024-01-15",
        dateFin: "2024-01-22",
        statut: "En cours",
        note: null,
        description: "Réaliser un bilan comptable complet pour une entreprise fictive",
        consignes: "Utilisez les données fournies en annexe pour établir le bilan...",
        soumis: false,
      },
      {
        id: 2,
        titre: "TD Économie - Analyse de Marché",
        cours: "Économie",
        type: "TD",
        dateDebut: "2024-01-10",
        dateFin: "2024-01-20",
        statut: "Terminé",
        note: 16,
        description: "Analyser les tendances du marché financier",
        consignes: "Rédigez un rapport de 5 pages sur l'évolution du marché...",
        soumis: true,
      },
      {
        id: 3,
        titre: "TP Mathématiques - Calcul d'Intérêts",
        cours: "Mathématiques Financières",
        type: "TP",
        dateDebut: "2024-01-20",
        dateFin: "2024-01-27",
        statut: "À venir",
        note: null,
        description: "Exercices pratiques sur le calcul d'intérêts composés",
        consignes: "Résolvez les 10 exercices du chapitre 4...",
        soumis: false,
      },
    ])
  }, [])

  const handleSoumission = () => {
    if (selectedTravail && soumission.trim()) {
      setTravaux(travaux.map((t) => (t.id === selectedTravail.id ? { ...t, soumis: true, statut: "Soumis" } : t)))
      setSoumission("")
      setShowModal(false)
      setSelectedTravail(null)
    }
  }

  const getStatutBadge = (statut) => {
    switch (statut) {
      case "En cours":
        return <Badge bg="warning">En cours</Badge>
      case "Terminé":
        return <Badge bg="success">Terminé</Badge>
      case "Soumis":
        return <Badge bg="info">Soumis</Badge>
      case "À venir":
        return <Badge bg="secondary">À venir</Badge>
      default:
        return <Badge bg="light">Inconnu</Badge>
    }
  }

  const isEnseignant = user?.role === "Enseignant" || user?.role === "Titulaire"

  return (
    <Container fluid className="py-0">
      <Row className="mb-4 dashboard-card">
        <Col>
          <h2 className="text-primary">
            <i className="fas fa-tasks me-2"></i>
            TP / TD / Travaux Pratiques
          </h2>
        </Col>
      </Row>

      <Card className="border-0 shadow-sm">
        <Card.Body>
          <Tabs activeKey={activeTab} onSelect={setActiveTab} className="mb-4">
            <Tab
              eventKey="mes-travaux"
              title={
                <>
                  <i className="fas fa-clipboard-list me-2"></i>Mes Travaux
                </>
              }
            >
              <Row>
                {travaux.map((travail) => (
                  <Col md={6} lg={4} key={travail.id} className="mb-4">
                    <Card className="h-100 border-0 shadow-sm">
                      <Card.Header className="bg-light">
                        <div className="d-flex justify-content-between align-items-center">
                          <Badge bg={travail.type === "TP" ? "primary" : "success"}>{travail.type}</Badge>
                          {getStatutBadge(travail.statut)}
                        </div>
                      </Card.Header>
                      <Card.Body>
                        <h6 className="text-primary">{travail.titre}</h6>
                        <p className="text-muted small mb-2">
                          <i className="fas fa-book me-1"></i>
                          {travail.cours}
                        </p>
                        <p className="small mb-3">{travail.description}</p>
                        <div className="mb-3">
                          <small className="text-muted">
                            <i className="fas fa-calendar me-1"></i>
                            Du {new Date(travail.dateDebut).toLocaleDateString()}
                            au {new Date(travail.dateFin).toLocaleDateString()}
                          </small>
                        </div>
                        {travail.note && (
                          <div className="mb-3">
                            <Badge bg="success">Note: {travail.note}/20</Badge>
                          </div>
                        )}
                      </Card.Body>
                      <Card.Footer className="bg-light">
                        {!travail.soumis && travail.statut === "En cours" ? (
                          <Button
                            variant="primary"
                            size="sm"
                            className="w-100"
                            onClick={() => {
                              setSelectedTravail(travail)
                              setShowModal(true)
                            }}
                          >
                            <i className="fas fa-upload me-2"></i>
                            Soumettre
                          </Button>
                        ) : (
                          <Button variant="outline-primary" size="sm" className="w-100">
                            <i className="fas fa-eye me-2"></i>
                            Voir Détails
                          </Button>
                        )}
                      </Card.Footer>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Tab>

            {isEnseignant && (
              <Tab
                eventKey="gestion"
                title={
                  <>
                    <i className="fas fa-cog me-2"></i>Gestion
                  </>
                }
              >
                <div className="mb-4">
                  <Button variant="primary" className="me-2">
                    <i className="fas fa-plus me-2"></i>
                    Créer un TP/TD
                  </Button>
                  <Button variant="outline-secondary">
                    <i className="fas fa-download me-2"></i>
                    Exporter les Notes
                  </Button>
                </div>

                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead className="table-primary">
                      <tr>
                        <th>Travail</th>
                        <th>Type</th>
                        <th>Cours</th>
                        <th>Soumissions</th>
                        <th>Date Limite</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {travaux.map((travail) => (
                        <tr key={travail.id}>
                          <td>{travail.titre}</td>
                          <td>
                            <Badge bg={travail.type === "TP" ? "primary" : "success"}>{travail.type}</Badge>
                          </td>
                          <td>{travail.cours}</td>
                          <td>
                            <span className="text-success">
                              <i className="fas fa-check me-1"></i>
                              12/45
                            </span>
                          </td>
                          <td>{new Date(travail.dateFin).toLocaleDateString()}</td>
                          <td>
                            <Button variant="outline-primary" size="sm" className="me-1">
                              <i className="fas fa-eye"></i>
                            </Button>
                            <Button variant="outline-success" size="sm">
                              <i className="fas fa-edit"></i>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Tab>
            )}

            <Tab
              eventKey="corrections"
              title={
                <>
                  <i className="fas fa-check-circle me-2"></i>Corrections
                </>
              }
            >
              <Alert variant="info">
                <i className="fas fa-info-circle me-2"></i>
                Les corrections seront disponibles après la date limite de soumission.
              </Alert>

              <Row>
                {travaux
                  .filter((t) => t.note)
                  .map((travail) => (
                    <Col md={6} key={travail.id} className="mb-3">
                      <Card className="border-0 shadow-sm">
                        <Card.Body>
                          <div className="d-flex justify-content-between align-items-start mb-2">
                            <h6 className="text-primary">{travail.titre}</h6>
                            <Badge bg="success">Note: {travail.note}/20</Badge>
                          </div>
                          <p className="text-muted small mb-2">{travail.cours}</p>
                          <div className="bg-light p-3 rounded">
                            <h6 className="small mb-2">Commentaires du professeur:</h6>
                            <p className="small mb-0">
                              Excellent travail ! Bonne maîtrise des concepts. Quelques améliorations possibles sur la
                              présentation.
                            </p>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
              </Row>
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>

      {/* Modal Soumission */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Soumettre le Travail</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedTravail && (
            <>
              <h6 className="text-primary">{selectedTravail.titre}</h6>
              <p className="text-muted">{selectedTravail.cours}</p>

              <div className="mb-3 p-3 bg-light rounded">
                <h6>Consignes:</h6>
                <p className="mb-0">{selectedTravail.consignes}</p>
              </div>

              <Form.Group className="mb-3">
                <Form.Label>Votre Soumission</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={6}
                  value={soumission}
                  onChange={(e) => setSoumission(e.target.value)}
                  placeholder="Tapez votre réponse ici ou décrivez les fichiers joints..."
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Fichiers Joints (optionnel)</Form.Label>
                <Form.Control type="file" multiple />
                <Form.Text className="text-muted">Formats acceptés: PDF, DOC, DOCX, XLS, XLSX</Form.Text>
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Annuler
          </Button>
          <Button variant="primary" onClick={handleSoumission} disabled={!soumission.trim()}>
            <i className="fas fa-upload me-2"></i>
            Soumettre
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  )
}

export default TPTD
