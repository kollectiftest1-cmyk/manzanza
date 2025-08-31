import { Container, Row, Col, Card, Button, Table, Badge, ProgressBar } from "react-bootstrap"
import { LinkContainer } from "react-router-bootstrap"

const SGADashboard = ({ user, courses, notifications }) => {
  const totalSections = 5
  const totalAuditoires = 12
  const totalInscriptions = 1250
  const pendingInscriptions = 45

  return (
    <Container className="py-0" style={{  }}>
      <Row className="mb-4">
        <Col>
          <div className="dashboard-card">
            <Row className="align-items-center">
              <Col md={8}>
                <h1 className="h2 fw-bold mb-2">SGA - Secrétariat Général Académique</h1>
                <p className="text-muted mb-3">Bienvenue {user?.name} | Gestion Académique Globale</p>
                <div className="d-flex gap-2 flex-wrap">
                  <LinkContainer to="/auditoires">
                    <Button className="btn-primary-custom">
                      <i className="fas fa-users me-2"></i>Auditoires
                    </Button>
                  </LinkContainer>
                  <LinkContainer to="/administration">
                    <Button variant="outline-primary">
                      <i className="fas fa-cog me-2"></i>Inscriptions
                    </Button>
                  </LinkContainer>
                  <LinkContainer to="/courses">
                    <Button variant="outline-success">
                      <i className="fas fa-book me-2"></i>Cours
                    </Button>
                  </LinkContainer>
                </div>
              </Col>
            </Row>
          </div>
        </Col>
      </Row>

      <Row>
        <Col lg={8}>
          {/* SGA Stats */}
          <Row className="mb-4">
            <Col md={3}>
              <div className="stat-card">
                <div className="stat-number">{totalSections}</div>
                <div className="stat-label">Sections Actives</div>
              </div>
            </Col>
            <Col md={3}>
              <div className="stat-card">
                <div className="stat-number">{totalAuditoires}</div>
                <div className="stat-label">Auditoires</div>
              </div>
            </Col>
            <Col md={3}>
              <div className="stat-card">
                <div className="stat-number">{totalInscriptions}</div>
                <div className="stat-label">Étudiants Inscrits</div>
              </div>
            </Col>
            <Col md={3}>
              <div className="stat-card text-warning">
                <div className="stat-number">{pendingInscriptions}</div>
                <div className="stat-label">Inscriptions Pendantes</div>
              </div>
            </Col>
          </Row>

          {/* Sections Management */}
          <Card className="card-custom mb-4">
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="fw-bold mb-0">Gestion des Sections</h5>
                <Button size="sm" variant="success">
                  <i className="fas fa-plus me-1"></i>Nouvelle Section
                </Button>
              </div>
            </Card.Header>
            <Card.Body>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Section</th>
                    <th>Chef de Section</th>
                    <th>Départements</th>
                    <th>Étudiants</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>
                      <div className="fw-semibold">1ère Licence Finance</div>
                      <small className="text-muted">L1-FIN</small>
                    </td>
                    <td>Prof. Mukendi</td>
                    <td>
                      <Badge bg="info" className="me-1">
                        Comptabilité
                      </Badge>
                      <Badge bg="info">Économie</Badge>
                    </td>
                    <td>245</td>
                    <td>
                      <Badge bg="success">Active</Badge>
                    </td>
                    <td>
                      <Button size="sm" variant="outline-primary">
                        Gérer
                      </Button>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <div className="fw-semibold">2ème Licence Finance</div>
                      <small className="text-muted">L2-FIN</small>
                    </td>
                    <td>Prof. Kabongo</td>
                    <td>
                      <Badge bg="info" className="me-1">
                        Finance
                      </Badge>
                      <Badge bg="info">Audit</Badge>
                    </td>
                    <td>198</td>
                    <td>
                      <Badge bg="success">Active</Badge>
                    </td>
                    <td>
                      <Button size="sm" variant="outline-primary">
                        Gérer
                      </Button>
                    </td>
                  </tr>
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          {/* Pending Inscriptions */}
          <Card className="card-custom mb-4">
            <Card.Header>
              <h6 className="fw-bold mb-0">Inscriptions Pendantes</h6>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <small>Nouvelles inscriptions</small>
                  <small>32/45</small>
                </div>
                <ProgressBar now={71} variant="warning" style={{ height: "6px" }} />
              </div>
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <small>Réinscriptions</small>
                  <small>13/45</small>
                </div>
                <ProgressBar now={29} variant="info" style={{ height: "6px" }} />
              </div>
              <LinkContainer to="/administration">
                <Button variant="outline-primary" size="sm" className="w-100">
                  Traiter les Inscriptions
                </Button>
              </LinkContainer>
            </Card.Body>
          </Card>

          {/* Academic Calendar */}
          <Card className="card-custom mb-4">
            <Card.Header>
              <h6 className="fw-bold mb-0">Calendrier Académique</h6>
            </Card.Header>
            <Card.Body>
              <div className="mb-2">
                <div className="fw-semibold">Examens Session 1</div>
                <small className="text-muted">15 - 30 Janvier 2024</small>
              </div>
              <div className="mb-2">
                <div className="fw-semibold">Publication Résultats</div>
                <small className="text-muted">5 Février 2024</small>
              </div>
              <div className="mb-2">
                <div className="fw-semibold">Session de Rattrapage</div>
                <small className="text-muted">12 - 20 Février 2024</small>
              </div>
            </Card.Body>
          </Card>

          {/* Quick Stats */}
          <Card className="card-custom">
            <Card.Header>
              <h6 className="fw-bold mb-0">Statistiques Rapides</h6>
            </Card.Header>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span>Taux de réussite</span>
                <Badge bg="success">87%</Badge>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span>Présence moyenne</span>
                <Badge bg="info">92%</Badge>
              </div>
              <div className="d-flex justify-content-between align-items-center">
                <span>Cours programmés</span>
                <Badge bg="primary">156</Badge>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default SGADashboard
