import { Container, Row, Col, Card, Button, Table, Badge } from "react-bootstrap"
import { useSelector } from "react-redux"

const ChefSectionDashboard = () => {
  const { user } = useSelector((state) => state.auth)

  const sectionStats = {
    totalEtudiants: 245,
    totalEnseignants: 12,
    coursActifs: 8,
    auditoires: 3,
  }

  const coursSection = [
    { id: 1, nom: "Comptabilité Générale", enseignant: "Prof. Martin", etudiants: 85, statut: "Actif" },
    { id: 2, nom: "Économie", enseignant: "Dr. Dubois", etudiants: 78, statut: "Actif" },
    { id: 3, nom: "Mathématiques Financières", enseignant: "Prof. Bernard", etudiants: 82, statut: "Actif" },
  ]

  return (
    <Container fluid className="py-0" style={{ }}>
      <Row className="mb-4 dashboard-card">
        <Col>
          <h2 className="text-primary fw-bold">Tableau de Bord - Chef de Section</h2>
          <p className="text-muted">Section: {user?.section || "Finance"}</p>
        </Col>
      </Row>

      {/* Statistics Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="card-custom text-center">
            <Card.Body>
              <i className="fas fa-users fa-2x text-primary mb-3"></i>
              <h4 className="fw-bold">{sectionStats.totalEtudiants}</h4>
              <p className="text-muted mb-0">Étudiants</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="card-custom text-center">
            <Card.Body>
              <i className="fas fa-chalkboard-teacher fa-2x text-success mb-3"></i>
              <h4 className="fw-bold">{sectionStats.totalEnseignants}</h4>
              <p className="text-muted mb-0">Enseignants</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="card-custom text-center">
            <Card.Body>
              <i className="fas fa-book fa-2x text-warning mb-3"></i>
              <h4 className="fw-bold">{sectionStats.coursActifs}</h4>
              <p className="text-muted mb-0">Cours Actifs</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="card-custom text-center">
            <Card.Body>
              <i className="fas fa-door-open fa-2x text-info mb-3"></i>
              <h4 className="fw-bold">{sectionStats.auditoires}</h4>
              <p className="text-muted mb-0">Auditoires</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col lg={8}>
          <Card className="card-custom">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="fw-bold mb-0">Gestion des Cours</h5>
              <Button size="sm" className="btn-primary-custom">
                <i className="fas fa-plus me-1"></i>
                Nouveau Cours
              </Button>
            </Card.Header>
            <Card.Body>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Cours</th>
                    <th>Enseignant</th>
                    <th>Étudiants</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {coursSection.map((cours) => (
                    <tr key={cours.id}>
                      <td className="fw-semibold">{cours.nom}</td>
                      <td>{cours.enseignant}</td>
                      <td>{cours.etudiants}</td>
                      <td>
                        <Badge bg="success">{cours.statut}</Badge>
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
                  <i className="fas fa-user-plus me-2"></i>
                  Ajouter Enseignant
                </Button>
                <Button variant="outline-success">
                  <i className="fas fa-calendar me-2"></i>
                  Planning Section
                </Button>
                <Button variant="outline-info">
                  <i className="fas fa-chart-bar me-2"></i>
                  Rapports Section
                </Button>
                <Button variant="outline-warning">
                  <i className="fas fa-cog me-2"></i>
                  Paramètres Section
                </Button>
              </div>
            </Card.Body>
          </Card>

          <Card className="card-custom">
            <Card.Header>
              <h6 className="fw-bold mb-0">Notifications</h6>
            </Card.Header>
            <Card.Body>
              <div className="notification-item">
                <div className="fw-semibold">Nouveau enseignant assigné</div>
                <small className="text-muted">Il y a 2 heures</small>
              </div>
              <div className="notification-item">
                <div className="fw-semibold">Rapport mensuel disponible</div>
                <small className="text-muted">Il y a 1 jour</small>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default ChefSectionDashboard
