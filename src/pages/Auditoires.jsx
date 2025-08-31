"use client"

import { useState, useEffect } from "react"
import { Container, Row, Col, Card, Button, Badge, Form, Modal } from "react-bootstrap"
import { useSelector, useDispatch } from "react-redux"
import { Link } from "react-router-dom"

const Auditoires = () => {
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)
  const [auditoires, setAuditoires] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [newAuditoire, setNewAuditoire] = useState({
    nom: "",
    niveau: "",
    filiere: "",
    description: "",
  })

  useEffect(() => {
    // Simulation des auditoires
    setAuditoires([
      {
        id: 1,
        nom: "1ère Licence Finance",
        niveau: "L1",
        filiere: "Finance",
        etudiants: 45,
        cours: 8,
        description: "Première année de licence en Finance",
      },
      {
        id: 2,
        nom: "2ème Licence Comptabilité",
        niveau: "L2",
        filiere: "Comptabilité",
        etudiants: 38,
        cours: 10,
        description: "Deuxième année de licence en Comptabilité",
      },
      {
        id: 3,
        nom: "3ème Licence Gestion",
        niveau: "L3",
        filiere: "Gestion",
        etudiants: 42,
        cours: 12,
        description: "Troisième année de licence en Gestion",
      },
    ])
  }, [])

  const handleCreateAuditoire = () => {
    const nouvelAuditoire = {
      id: auditoires.length + 1,
      ...newAuditoire,
      etudiants: 0,
      cours: 0,
    }
    setAuditoires([...auditoires, nouvelAuditoire])
    setNewAuditoire({ nom: "", niveau: "", filiere: "", description: "" })
    setShowModal(false)
  }

  const canCreateAuditoire = user?.role === "SGA" || user?.role === "Directeur" || user?.role === "Chef_Departement"

  return (
    <Container fluid className="py-0">
      <Row className="mb-4 dashboard-card">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <h2 className="text-primary">
              <i className="fas fa-users me-2"></i>
              Auditoires Virtuels
            </h2>
            {canCreateAuditoire && (
              <Button variant="primary" onClick={() => setShowModal(true)} className="shadow-sm">
                <i className="fas fa-plus me-2"></i>
                Créer un Auditoire
              </Button>
            )}
          </div>
        </Col>
      </Row>

      <Row>
        {auditoires.map((auditoire) => (
          <Col md={6} lg={4} key={auditoire.id} className="mb-4">
            <Card className="h-100 shadow-sm border-0 hover-card">
              <Card.Header className="bg-primary text-white">
                <h5 className="mb-0">
                  <i className="fas fa-graduation-cap me-2"></i>
                  {auditoire.nom}
                </h5>
              </Card.Header>
              <Card.Body>
                <div className="mb-3">
                  <Badge bg="info" className="me-2">
                    {auditoire.niveau}
                  </Badge>
                  <Badge bg="success">{auditoire.filiere}</Badge>
                </div>
                <p className="text-muted mb-3">{auditoire.description}</p>
                <Row className="text-center">
                  <Col>
                    <div className="stat-item">
                      <h4 className="text-primary mb-0">{auditoire.etudiants}</h4>
                      <small className="text-muted">Étudiants</small>
                    </div>
                  </Col>
                  <Col>
                    <div className="stat-item">
                      <h4 className="text-success mb-0">{auditoire.cours}</h4>
                      <small className="text-muted">Cours</small>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
              <Card.Footer className="bg-light">
                <Link to={`/auditoires/${auditoire.id}`} className="btn btn-outline-primary w-100">
                  <i className="fas fa-eye me-2"></i>
                  Voir Détails
                </Link>
              </Card.Footer>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Modal Création Auditoire */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Créer un Nouvel Auditoire</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nom de l'Auditoire</Form.Label>
                  <Form.Control
                    type="text"
                    value={newAuditoire.nom}
                    onChange={(e) => setNewAuditoire({ ...newAuditoire, nom: e.target.value })}
                    placeholder="Ex: 1ère Licence Finance"
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Niveau</Form.Label>
                  <Form.Select
                    value={newAuditoire.niveau}
                    onChange={(e) => setNewAuditoire({ ...newAuditoire, niveau: e.target.value })}
                  >
                    <option value="">Choisir...</option>
                    <option value="L1">L1</option>
                    <option value="L2">L2</option>
                    <option value="L3">L3</option>
                    <option value="M1">M1</option>
                    <option value="M2">M2</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group className="mb-3">
                  <Form.Label>Filière</Form.Label>
                  <Form.Select
                    value={newAuditoire.filiere}
                    onChange={(e) => setNewAuditoire({ ...newAuditoire, filiere: e.target.value })}
                  >
                    <option value="">Choisir...</option>
                    <option value="Finance">Finance</option>
                    <option value="Comptabilité">Comptabilité</option>
                    <option value="Gestion">Gestion</option>
                    <option value="Économie">Économie</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={newAuditoire.description}
                onChange={(e) => setNewAuditoire({ ...newAuditoire, description: e.target.value })}
                placeholder="Description de l'auditoire..."
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Annuler
          </Button>
          <Button variant="primary" onClick={handleCreateAuditoire}>
            Créer l'Auditoire
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  )
}

export default Auditoires
