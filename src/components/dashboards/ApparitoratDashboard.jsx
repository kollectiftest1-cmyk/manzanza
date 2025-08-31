import { Container, Row, Col, Card, Button, Table, Badge } from "react-bootstrap"
import { useSelector } from "react-redux"

const ApparitoratDashboard = () => {
  const { user } = useSelector((state) => state.auth)

  const apparitoratStats = {
    sallesTotal: 45,
    sallesOccupees: 28,
    sallesLibres: 17,
    maintenanceEnCours: 3,
  }

  const planningJour = [
    {
      id: 1,
      salle: "Amphi A",
      cours: "Comptabilité Générale",
      enseignant: "Prof. Martin",
      horaire: "08:00-10:00",
      statut: "Occupé",
    },
    {
      id: 2,
      salle: "Salle 101",
      cours: "Économie",
      enseignant: "Dr. Dubois",
      horaire: "10:00-12:00",
      statut: "Occupé",
    },
    {
      id: 3,
      salle: "Salle 102",
      cours: "Mathématiques",
      enseignant: "Prof. Bernard",
      horaire: "14:00-16:00",
      statut: "Programmé",
    },
    {
      id: 4,
      salle: "Lab Info",
      cours: "Maintenance",
      enseignant: "Service IT",
      horaire: "09:00-17:00",
      statut: "Maintenance",
    },
  ]

  return (
    <Container fluid className="py-0" style={{ }}>
      <Row className="mb-4 dashboard-card">
        <Col>
          <h2 className="text-primary fw-bold">Tableau de Bord - Apparitorat</h2>
          <p className="text-muted">Gestion des Salles et Équipements</p>
        </Col>
      </Row>

      {/* Room Statistics */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="card-custom text-center">
            <Card.Body>
              <i className="fas fa-door-open fa-2x text-primary mb-3"></i>
              <h4 className="fw-bold">{apparitoratStats.sallesTotal}</h4>
              <p className="text-muted mb-0">Total Salles</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="card-custom text-center">
            <Card.Body>
              <i className="fas fa-users fa-2x text-danger mb-3"></i>
              <h4 className="fw-bold">{apparitoratStats.sallesOccupees}</h4>
              <p className="text-muted mb-0">Occupées</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="card-custom text-center">
            <Card.Body>
              <i className="fas fa-check-circle fa-2x text-success mb-3"></i>
              <h4 className="fw-bold">{apparitoratStats.sallesLibres}</h4>
              <p className="text-muted mb-0">Libres</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="card-custom text-center">
            <Card.Body>
              <i className="fas fa-tools fa-2x text-warning mb-3"></i>
              <h4 className="fw-bold">{apparitoratStats.maintenanceEnCours}</h4>
              <p className="text-muted mb-0">En Maintenance</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col lg={8}>
          <Card className="card-custom">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="fw-bold mb-0">Planning du Jour</h5>
              <Button size="sm" className="btn-primary-custom">
                <i className="fas fa-calendar-plus me-1"></i>
                Nouvelle Réservation
              </Button>
            </Card.Header>
            <Card.Body>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Salle</th>
                    <th>Cours</th>
                    <th>Enseignant</th>
                    <th>Horaire</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {planningJour.map((planning) => (
                    <tr key={planning.id}>
                      <td className="fw-semibold">{planning.salle}</td>
                      <td>{planning.cours}</td>
                      <td>{planning.enseignant}</td>
                      <td>{planning.horaire}</td>
                      <td>
                        <Badge
                          bg={
                            planning.statut === "Occupé"
                              ? "danger"
                              : planning.statut === "Programmé"
                                ? "warning"
                                : planning.statut === "Maintenance"
                                  ? "secondary"
                                  : "success"
                          }
                        >
                          {planning.statut}
                        </Badge>
                      </td>
                      <td>
                        <Button size="sm" variant="outline-primary" className="me-1">
                          <i className="fas fa-edit"></i>
                        </Button>
                        <Button size="sm" variant="outline-info">
                          <i className="fas fa-eye"></i>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="card-custom mb-4">
            <Card.Header>
              <h6 className="fw-bold mb-0">Actions Rapides</h6>
            </Card.Header>
            <Card.Body>
              <div className="d-grid gap-2">
                <Button variant="outline-primary">
                  <i className="fas fa-key me-2"></i>
                  Gestion Clés
                </Button>
                <Button variant="outline-success">
                  <i className="fas fa-calendar-alt me-2"></i>
                  Planning Complet
                </Button>
                <Button variant="outline-info">
                  <i className="fas fa-tools me-2"></i>
                  Demande Maintenance
                </Button>
                <Button variant="outline-warning">
                  <i className="fas fa-clipboard-list me-2"></i>
                  Inventaire
                </Button>
              </div>
            </Card.Body>
          </Card>

          <Card className="card-custom mb-4">
            <Card.Header>
              <h6 className="fw-bold mb-0">Demandes Urgentes</h6>
            </Card.Header>
            <Card.Body>
              <div className="alert alert-danger">
                <i className="fas fa-exclamation-triangle me-2"></i>
                <strong>Urgent:</strong> Projecteur Amphi B en panne
              </div>
              <div className="alert alert-warning">
                <i className="fas fa-wrench me-2"></i>
                <strong>Maintenance:</strong> Climatisation Salle 205
              </div>
            </Card.Body>
          </Card>

          <Card className="card-custom">
            <Card.Header>
              <h6 className="fw-bold mb-0">Statistiques Hebdomadaires</h6>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <div className="d-flex justify-content-between">
                  <small>Taux d'occupation</small>
                  <small className="fw-bold">78%</small>
                </div>
                <div className="progress" style={{ height: "8px" }}>
                  <div className="progress-bar bg-info" style={{ width: "78%" }}></div>
                </div>
              </div>
              <div className="mb-3">
                <small className="text-muted">Demandes traitées</small>
                <div className="fw-semibold">45/50</div>
              </div>
              <div>
                <small className="text-muted">Temps moyen réponse</small>
                <div className="fw-semibold">15 minutes</div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default ApparitoratDashboard
