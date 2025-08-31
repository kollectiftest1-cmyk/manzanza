"use client"

import { useState, useEffect } from "react"
import { Container, Row, Col, Card, Button, Badge, Tab, Tabs, ListGroup, Form } from "react-bootstrap"
import { useParams, Link } from "react-router-dom"
import { useSelector } from "react-redux"

const AuditoireDetail = () => {
  const { id } = useParams()
  const { user } = useSelector((state) => state.auth)
  const [auditoire, setAuditoire] = useState(null)
  const [activeTab, setActiveTab] = useState("cours")

  useEffect(() => {
    // Simulation des données d'auditoire
    setAuditoire({
      id: Number.parseInt(id),
      nom: "1ère Licence Finance",
      niveau: "L1",
      filiere: "Finance",
      description: "Première année de licence en Finance",
      etudiants: [
        { id: 1, nom: "Dupont", prenom: "Jean", matricule: "F2024001" },
        { id: 2, nom: "Martin", prenom: "Marie", matricule: "F2024002" },
        { id: 3, nom: "Bernard", prenom: "Paul", matricule: "F2024003" },
      ],
      cours: [
        {
          id: 1,
          nom: "Comptabilité Générale",
          titulaire: "Prof. Dubois",
          credits: 5,
          horaire: "Lundi 8h-10h",
          salle: "A101",
        },
        {
          id: 2,
          nom: "Économie",
          titulaire: "Prof. Moreau",
          credits: 4,
          horaire: "Mercredi 10h-12h",
          salle: "B205",
        },
        {
          id: 3,
          nom: "Mathématiques Financières",
          titulaire: "Prof. Leroy",
          credits: 6,
          horaire: "Vendredi 14h-16h",
          salle: "C301",
        },
      ],
      planning: [
        { jour: "Lundi", heure: "8h-10h", cours: "Comptabilité Générale", salle: "A101" },
        { jour: "Mercredi", heure: "10h-12h", cours: "Économie", salle: "B205" },
        { jour: "Vendredi", heure: "14h-16h", cours: "Mathématiques Financières", salle: "C301" },
      ],
    })
  }, [id])

  if (!auditoire) {
    return (
      <Container className="py-4">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
        </div>
      </Container>
    )
  }

  return (
    <Container fluid className="py-0">
      {/* En-tête */}
      <Row className="mb-4 dashboard-card">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="text-primary mb-1">
                <i className="fas fa-users me-2"></i>
                {auditoire.nom}
              </h2>
              <div>
                <Badge bg="info" className="me-2">
                  {auditoire.niveau}
                </Badge>
                <Badge bg="success">{auditoire.filiere}</Badge>
              </div>
            </div>
            <Link to="/auditoires" className="btn btn-outline-secondary">
              <i className="fas fa-arrow-left me-2"></i>
              Retour aux Auditoires
            </Link>
          </div>
        </Col>
      </Row>

      {/* Statistiques */}
      <Row className="mb-4">
        <Col md={4}>
          <Card className="text-center border-0 shadow-sm">
            <Card.Body>
              <h3 className="text-primary">{auditoire.etudiants.length}</h3>
              <p className="text-muted mb-0">Étudiants Inscrits</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center border-0 shadow-sm">
            <Card.Body>
              <h3 className="text-success">{auditoire.cours.length}</h3>
              <p className="text-muted mb-0">Cours Actifs</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center border-0 shadow-sm">
            <Card.Body>
              <h3 className="text-warning">{auditoire.cours.reduce((total, cours) => total + cours.credits, 0)}</h3>
              <p className="text-muted mb-0">Total Crédits</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Onglets */}
      <Card className="border-0 shadow-sm">
        <Card.Body>
          <Tabs activeKey={activeTab} onSelect={setActiveTab} className="mb-4">
            <Tab
              eventKey="cours"
              title={
                <>
                  <i className="fas fa-book me-2"></i>Cours
                </>
              }
            >
              <Row>
                {auditoire.cours.map((cours) => (
                  <Col md={6} lg={4} key={cours.id} className="mb-3">
                    <Card className="h-100 border-0 shadow-sm">
                      <Card.Body>
                        <h6 className="text-primary">{cours.nom}</h6>
                        <p className="text-muted small mb-2">
                          <i className="fas fa-user me-1"></i>
                          {cours.titulaire}
                        </p>
                        <div className="d-flex justify-content-between align-items-center">
                          <Badge bg="info">{cours.credits} crédits</Badge>
                          <small className="text-muted">{cours.horaire}</small>
                        </div>
                        <div className="mt-2">
                          <Link to={`/courses/${cours.id}`} className="btn btn-sm btn-outline-primary">
                            Voir Détails
                          </Link>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Tab>

            <Tab
              eventKey="etudiants"
              title={
                <>
                  <i className="fas fa-user-graduate me-2"></i>Étudiants
                </>
              }
            >
              <ListGroup variant="flush">
                {auditoire.etudiants.map((etudiant) => (
                  <ListGroup.Item key={etudiant.id} className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="mb-1">
                        {etudiant.prenom} {etudiant.nom}
                      </h6>
                      <small className="text-muted">Matricule: {etudiant.matricule}</small>
                    </div>
                    <div>
                      <Button variant="outline-primary" size="sm" className="me-2">
                        <i className="fas fa-eye"></i>
                      </Button>
                      <Button variant="outline-success" size="sm">
                        <i className="fas fa-envelope"></i>
                      </Button>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </Tab>

            <Tab
              eventKey="planning"
              title={
                <>
                  <i className="fas fa-calendar me-2"></i>Planning
                </>
              }
            >
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead className="table-primary">
                    <tr>
                      <th>Jour</th>
                      <th>Heure</th>
                      <th>Cours</th>
                      <th>Salle</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditoire.planning.map((seance, index) => (
                      <tr key={index}>
                        <td>
                          <strong>{seance.jour}</strong>
                        </td>
                        <td>{seance.heure}</td>
                        <td>{seance.cours}</td>
                        <td>
                          <Badge bg="secondary">{seance.salle}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Tab>

            <Tab
              eventKey="chat"
              title={
                <>
                  <i className="fas fa-comments me-2"></i>Discussion
                </>
              }
            >
              <div className="chat-container" style={{ height: "400px", overflowY: "auto" }}>
                <div className="mb-3 p-3 bg-light rounded">
                  <strong>Prof. Dubois</strong>
                  <small className="text-muted ms-2">Il y a 2h</small>
                  <p className="mb-0 mt-1">N'oubliez pas le devoir de comptabilité pour vendredi prochain.</p>
                </div>
                <div className="mb-3 p-3 bg-primary text-white rounded">
                  <strong>Jean Dupont</strong>
                  <small className="text-light ms-2">Il y a 1h</small>
                  <p className="mb-0 mt-1">Professeur, pouvez-vous préciser l'exercice 3 du chapitre 2 ?</p>
                </div>
                <div className="mb-3 p-3 bg-light rounded">
                  <strong>IA Assistant</strong>
                  <small className="text-muted ms-2">Il y a 30min</small>
                  <p className="mb-0 mt-1">
                    <i className="fas fa-robot me-2"></i>
                    L'exercice 3 du chapitre 2 porte sur les écritures comptables. Consultez la page 45 de votre manuel.
                  </p>
                </div>
              </div>
              <Form className="mt-3">
                <div className="input-group">
                  <Form.Control type="text" placeholder="Tapez votre message..." />
                  <Button variant="primary">
                    <i className="fas fa-paper-plane"></i>
                  </Button>
                </div>
              </Form>
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>
    </Container>
  )
}

export default AuditoireDetail
