import { Container, Row, Col, Card, Button, Table, Badge, ProgressBar } from "react-bootstrap"
import { LinkContainer } from "react-router-bootstrap"

const AdminDashboard = ({ user, courses, notifications }) => {
  const totalStudents = 1250
  const totalTeachers = 85
  const totalRevenue = 125000
  const pendingPayments = 45

  const isDirectorGeneral = user?.role === "directeur_general"
  const isPDG = user?.role === "pdg"

  return (
    <Container className="py-4" style={{ marginTop: "80px" }}>
      <Row className="mb-4">
        <Col>
          <div className="dashboard-card">
            <Row className="align-items-center">
              <Col md={8}>
                <h1 className="h2 fw-bold mb-2">{isPDG ? "PDG - Conseil d'Administration" : "Direction Générale"}</h1>
                <p className="text-muted mb-3">
                  Bienvenue {user?.name} | Supervision {isPDG ? "Stratégique" : "Opérationnelle"}
                </p>
                <div className="d-flex gap-2 flex-wrap">
                  <LinkContainer to="/administration">
                    <Button className="btn-primary-custom">
                      <i className="fas fa-chart-line me-2"></i>Rapports
                    </Button>
                  </LinkContainer>
                  <LinkContainer to="/comptabilite">
                    <Button variant="outline-primary">
                      <i className="fas fa-dollar-sign me-2"></i>Finances
                    </Button>
                  </LinkContainer>
                  {isPDG && (
                    <LinkContainer to="/rh">
                      <Button variant="outline-success">
                        <i className="fas fa-users me-2"></i>Ressources Humaines
                      </Button>
                    </LinkContainer>
                  )}
                </div>
              </Col>
            </Row>
          </div>
        </Col>
      </Row>

      <Row>
        <Col lg={8}>
          {/* Executive Stats */}
          <Row className="mb-4">
            <Col md={3}>
              <div className="stat-card">
                <div className="stat-number">{totalStudents.toLocaleString()}</div>
                <div className="stat-label">Étudiants Totaux</div>
              </div>
            </Col>
            <Col md={3}>
              <div className="stat-card">
                <div className="stat-number">{totalTeachers}</div>
                <div className="stat-label">Enseignants</div>
              </div>
            </Col>
            <Col md={3}>
              <div className="stat-card text-success">
                <div className="stat-number">${totalRevenue.toLocaleString()}</div>
                <div className="stat-label">Revenus Mensuels</div>
              </div>
            </Col>
            <Col md={3}>
              <div className="stat-card text-warning">
                <div className="stat-number">{pendingPayments}</div>
                <div className="stat-label">Paiements Pendants</div>
              </div>
            </Col>
          </Row>

          {/* Financial Overview */}
          <Card className="card-custom mb-4">
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="fw-bold mb-0">Aperçu Financier</h5>
                <Button size="sm" variant="outline-primary">
                  <i className="fas fa-download me-1"></i>Export PDF
                </Button>
              </div>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <div className="mb-3">
                    <div className="d-flex justify-content-between mb-1">
                      <span>Frais d'inscription collectés</span>
                      <span className="fw-bold text-success">85%</span>
                    </div>
                    <ProgressBar now={85} variant="success" style={{ height: "8px" }} />
                  </div>
                  <div className="mb-3">
                    <div className="d-flex justify-content-between mb-1">
                      <span>Salaires versés</span>
                      <span className="fw-bold text-info">92%</span>
                    </div>
                    <ProgressBar now={92} variant="info" style={{ height: "8px" }} />
                  </div>
                </Col>
                <Col md={6}>
                  <div className="mb-3">
                    <div className="d-flex justify-content-between mb-1">
                      <span>Charges opérationnelles</span>
                      <span className="fw-bold text-warning">67%</span>
                    </div>
                    <ProgressBar now={67} variant="warning" style={{ height: "8px" }} />
                  </div>
                  <div className="mb-3">
                    <div className="d-flex justify-content-between mb-1">
                      <span>Investissements</span>
                      <span className="fw-bold text-primary">45%</span>
                    </div>
                    <ProgressBar now={45} variant="primary" style={{ height: "8px" }} />
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Academic Performance */}
          <Card className="card-custom mb-4">
            <Card.Header>
              <h5 className="fw-bold mb-0">Performance Académique</h5>
            </Card.Header>
            <Card.Body>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Section</th>
                    <th>Étudiants</th>
                    <th>Taux de Réussite</th>
                    <th>Présence Moyenne</th>
                    <th>Satisfaction</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>1ère Licence Finance</td>
                    <td>245</td>
                    <td>
                      <Badge bg="success">87%</Badge>
                    </td>
                    <td>
                      <Badge bg="info">92%</Badge>
                    </td>
                    <td>
                      <Badge bg="primary">4.2/5</Badge>
                    </td>
                  </tr>
                  <tr>
                    <td>2ème Licence Finance</td>
                    <td>198</td>
                    <td>
                      <Badge bg="success">89%</Badge>
                    </td>
                    <td>
                      <Badge bg="info">88%</Badge>
                    </td>
                    <td>
                      <Badge bg="primary">4.1/5</Badge>
                    </td>
                  </tr>
                  <tr>
                    <td>3ème Licence Finance</td>
                    <td>156</td>
                    <td>
                      <Badge bg="warning">78%</Badge>
                    </td>
                    <td>
                      <Badge bg="warning">85%</Badge>
                    </td>
                    <td>
                      <Badge bg="primary">3.9/5</Badge>
                    </td>
                  </tr>
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          {/* Key Metrics */}
          <Card className="card-custom mb-4">
            <Card.Header>
              <h6 className="fw-bold mb-0">Indicateurs Clés</h6>
            </Card.Header>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span>Taux de rétention</span>
                <Badge bg="success" className="fs-6">
                  94%
                </Badge>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span>Satisfaction étudiants</span>
                <Badge bg="primary" className="fs-6">
                  4.1/5
                </Badge>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span>Employabilité diplômés</span>
                <Badge bg="info" className="fs-6">
                  91%
                </Badge>
              </div>
              <div className="d-flex justify-content-between align-items-center">
                <span>ROI Formation</span>
                <Badge bg="warning" className="fs-6">
                  156%
                </Badge>
              </div>
            </Card.Body>
          </Card>

          {/* Pending Decisions */}
          {isPDG && (
            <Card className="card-custom mb-4">
              <Card.Header>
                <h6 className="fw-bold mb-0">Décisions Pendantes</h6>
              </Card.Header>
              <Card.Body>
                <div className="mb-3 p-2 border-start border-warning border-3">
                  <div className="fw-semibold">Nouvelle Section IT</div>
                  <small className="text-muted">Validation budget et recrutement</small>
                  <div className="mt-2">
                    <Button size="sm" variant="success" className="me-2">
                      Approuver
                    </Button>
                    <Button size="sm" variant="outline-secondary">
                      Réviser
                    </Button>
                  </div>
                </div>
                <div className="mb-3 p-2 border-start border-info border-3">
                  <div className="fw-semibold">Augmentation Frais</div>
                  <small className="text-muted">Proposition +15% pour 2024</small>
                  <div className="mt-2">
                    <Button size="sm" variant="success" className="me-2">
                      Approuver
                    </Button>
                    <Button size="sm" variant="outline-secondary">
                      Réviser
                    </Button>
                  </div>
                </div>
              </Card.Body>
            </Card>
          )}

          {/* Recent Activities */}
          <Card className="card-custom">
            <Card.Header>
              <h6 className="fw-bold mb-0">Activités Récentes</h6>
            </Card.Header>
            <Card.Body>
              <div className="mb-2">
                <div className="fw-semibold">Rapport mensuel généré</div>
                <small className="text-muted">Il y a 2 heures</small>
              </div>
              <div className="mb-2">
                <div className="fw-semibold">Réunion conseil terminée</div>
                <small className="text-muted">Il y a 1 jour</small>
              </div>
              <div className="mb-2">
                <div className="fw-semibold">Budget 2024 approuvé</div>
                <small className="text-muted">Il y a 3 jours</small>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default AdminDashboard
