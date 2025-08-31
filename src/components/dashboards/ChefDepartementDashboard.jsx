import { Container, Row, Col, Card, Button, Table, ProgressBar } from "react-bootstrap"
import { useSelector } from "react-redux"

const ChefDepartementDashboard = () => {
  const { user } = useSelector((state) => state.auth)

  const departementStats = {
    totalSections: 4,
    totalEtudiants: 890,
    totalEnseignants: 45,
    coursActifs: 32,
  }

  const sections = [
    { id: 1, nom: "Finance", chef: "Dr. Martin", etudiants: 245, enseignants: 12, performance: 85 },
    { id: 2, nom: "Comptabilité", chef: "Prof. Dubois", etudiants: 220, enseignants: 11, performance: 88 },
    { id: 3, nom: "Économie", chef: "Dr. Bernard", etudiants: 210, enseignants: 10, performance: 82 },
    { id: 4, nom: "Gestion", chef: "Prof. Leroy", etudiants: 215, enseignants: 12, performance: 90 },
  ]

  return (
    <Container fluid className="py-0" style={{ }}>
      <Row className="mb-4 dashboard-card">
        <Col>
          <h2 className="text-primary fw-bold">Tableau de Bord - Chef de Département</h2>
          <p className="text-muted">Département: {user?.departement || "Sciences Économiques et de Gestion"}</p>
        </Col>
      </Row>

      {/* Statistics Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="card-custom text-center">
            <Card.Body>
              <i className="fas fa-sitemap fa-2x text-primary mb-3"></i>
              <h4 className="fw-bold">{departementStats.totalSections}</h4>
              <p className="text-muted mb-0">Sections</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="card-custom text-center">
            <Card.Body>
              <i className="fas fa-users fa-2x text-success mb-3"></i>
              <h4 className="fw-bold">{departementStats.totalEtudiants}</h4>
              <p className="text-muted mb-0">Étudiants</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="card-custom text-center">
            <Card.Body>
              <i className="fas fa-chalkboard-teacher fa-2x text-warning mb-3"></i>
              <h4 className="fw-bold">{departementStats.totalEnseignants}</h4>
              <p className="text-muted mb-0">Enseignants</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="card-custom text-center">
            <Card.Body>
              <i className="fas fa-book fa-2x text-info mb-3"></i>
              <h4 className="fw-bold">{departementStats.coursActifs}</h4>
              <p className="text-muted mb-0">Cours Actifs</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col lg={8}>
          <Card className="card-custom">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="fw-bold mb-0">Gestion des Sections</h5>
              <Button size="sm" className="btn-primary-custom">
                <i className="fas fa-plus me-1"></i>
                Nouvelle Section
              </Button>
            </Card.Header>
            <Card.Body>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Section</th>
                    <th>Chef de Section</th>
                    <th>Étudiants</th>
                    <th>Enseignants</th>
                    <th>Performance</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sections.map((section) => (
                    <tr key={section.id}>
                      <td className="fw-semibold">{section.nom}</td>
                      <td>{section.chef}</td>
                      <td>{section.etudiants}</td>
                      <td>{section.enseignants}</td>
                      <td>
                        <div className="d-flex align-items-center">
                          <ProgressBar
                            now={section.performance}
                            variant={
                              section.performance >= 85 ? "success" : section.performance >= 70 ? "warning" : "danger"
                            }
                            style={{ width: "60px", height: "8px" }}
                            className="me-2"
                          />
                          <small>{section.performance}%</small>
                        </div>
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
                  <i className="fas fa-user-tie me-2"></i>
                  Nommer Chef Section
                </Button>
                <Button variant="outline-success">
                  <i className="fas fa-chart-line me-2"></i>
                  Rapport Département
                </Button>
                <Button variant="outline-info">
                  <i className="fas fa-calendar-alt me-2"></i>
                  Planning Global
                </Button>
                <Button variant="outline-warning">
                  <i className="fas fa-cogs me-2"></i>
                  Paramètres Département
                </Button>
              </div>
            </Card.Body>
          </Card>

          <Card className="card-custom">
            <Card.Header>
              <h6 className="fw-bold mb-0">Alertes Importantes</h6>
            </Card.Header>
            <Card.Body>
              <div className="alert alert-warning">
                <i className="fas fa-exclamation-triangle me-2"></i>
                <strong>Attention:</strong> Section Finance nécessite un nouvel enseignant
              </div>
              <div className="alert alert-info">
                <i className="fas fa-info-circle me-2"></i>
                <strong>Info:</strong> Réunion département prévue demain
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default ChefDepartementDashboard
