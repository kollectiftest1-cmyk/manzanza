import { Container, Row, Col, Card, Button, Table, Badge, ProgressBar } from "react-bootstrap"
import { LinkContainer } from "react-router-bootstrap"

const IAdminDashboard = ({ user, courses, notifications }) => {
  const stats = {
    totalUsers: 1247,
    totalCourses: 89,
    totalStudents: 1089,
    totalTeachers: 67,
    totalStaff: 91,
    systemUptime: "99.8%",
    activeConnections: 234,
    storageUsed: 67,
    backupStatus: "Completed",
    lastBackup: "2024-01-15 03:00",
  }

  const recentActivities = [
    { id: 1, action: "Nouvel utilisateur créé", user: "Jean Dupont", time: "Il y a 5 min", type: "success" },
    { id: 2, action: "Cours modifié", user: "Prof. Martin", time: "Il y a 15 min", type: "info" },
    { id: 3, action: "Paiement traité", user: "Marie Claire", time: "Il y a 30 min", type: "warning" },
    { id: 4, action: "Sauvegarde système", user: "Système", time: "Il y a 1h", type: "primary" },
  ]

  const systemAlerts = [
    { id: 1, message: "Mise à jour système disponible", level: "info" },
    { id: 2, message: "Espace disque à 75%", level: "warning" },
    { id: 3, message: "Tous les services fonctionnent normalement", level: "success" },
  ]

  return (
    <Container fluid className="p-4">
      {/* Header */}
      <Row className="mb-4 dashboard-card">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="text-primary fw-bold">Tableau de Bord iAdmin</h2>
              <p className="text-muted mb-0">Contrôle total du système DASH</p>
            </div>
            <div className="d-flex gap-2">
              <Button variant="outline-primary" size="sm">
                <i className="fas fa-download me-2"></i>Rapport Système
              </Button>
              <Button variant="primary" size="sm">
                <i className="fas fa-cog me-2"></i>Configuration
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      {/* System Stats */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="card-custom h-100">
            <Card.Body className="text-center">
              <div className="stat-icon bg-primary bg-opacity-10 text-primary mb-3">
                <i className="fas fa-users fa-2x"></i>
              </div>
              <h3 className="fw-bold text-primary">{stats.totalUsers}</h3>
              <p className="text-muted mb-0">Utilisateurs Total</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="card-custom h-100">
            <Card.Body className="text-center">
              <div className="stat-icon bg-success bg-opacity-10 text-success mb-3">
                <i className="fas fa-server fa-2x"></i>
              </div>
              <h3 className="fw-bold text-success">{stats.systemUptime}</h3>
              <p className="text-muted mb-0">Disponibilité Système</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="card-custom h-100">
            <Card.Body className="text-center">
              <div className="stat-icon bg-warning bg-opacity-10 text-warning mb-3">
                <i className="fas fa-wifi fa-2x"></i>
              </div>
              <h3 className="fw-bold text-warning">{stats.activeConnections}</h3>
              <p className="text-muted mb-0">Connexions Actives</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="card-custom h-100">
            <Card.Body className="text-center">
              <div className="stat-icon bg-info bg-opacity-10 text-info mb-3">
                <i className="fas fa-database fa-2x"></i>
              </div>
              <h3 className="fw-bold text-info">{stats.storageUsed}%</h3>
              <p className="text-muted mb-0">Stockage Utilisé</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Management Sections */}
      <Row className="mb-4">
        <Col md={4}>
          <Card className="card-custom h-100">
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">
                <i className="fas fa-users-cog me-2"></i>Gestion Utilisateurs
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="d-grid gap-2">
                <LinkContainer to="/administration">
                  <Button variant="outline-primary" size="sm">
                    <i className="fas fa-user-plus me-2"></i>Ajouter Utilisateur
                  </Button>
                </LinkContainer>
                <LinkContainer to="/rh">
                  <Button variant="outline-primary" size="sm">
                    <i className="fas fa-users me-2"></i>Gérer Personnel
                  </Button>
                </LinkContainer>
                <Button variant="outline-primary" size="sm">
                  <i className="fas fa-key me-2"></i>Permissions
                </Button>
              </div>
              <hr />
              <small className="text-muted">
                <strong>Étudiants:</strong> {stats.totalStudents}
                <br />
                <strong>Enseignants:</strong> {stats.totalTeachers}
                <br />
                <strong>Personnel:</strong> {stats.totalStaff}
              </small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="card-custom h-100">
            <Card.Header className="bg-success text-white">
              <h5 className="mb-0">
                <i className="fas fa-graduation-cap me-2"></i>Gestion Académique
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="d-grid gap-2">
                <LinkContainer to="/courses">
                  <Button variant="outline-success" size="sm">
                    <i className="fas fa-book me-2"></i>Gérer Cours
                  </Button>
                </LinkContainer>
                <LinkContainer to="/auditoires">
                  <Button variant="outline-success" size="sm">
                    <i className="fas fa-door-open me-2"></i>Auditoires
                  </Button>
                </LinkContainer>
                <LinkContainer to="/tptd">
                  <Button variant="outline-success" size="sm">
                    <i className="fas fa-tasks me-2"></i>TP/TD
                  </Button>
                </LinkContainer>
              </div>
              <hr />
              <small className="text-muted">
                <strong>Cours actifs:</strong> {stats.totalCourses}
                <br />
                <strong>Auditoires:</strong> 12
                <br />
                <strong>Sessions:</strong> 156
              </small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="card-custom h-100">
            <Card.Header className="bg-warning text-white">
              <h5 className="mb-0">
                <i className="fas fa-cog me-2"></i>Administration Système
              </h5>
            </Card.Header>
            <Card.Body>
              <div className="d-grid gap-2">
                <LinkContainer to="/service-it">
                  <Button variant="outline-warning" size="sm">
                    <i className="fas fa-laptop-code me-2"></i>Service IT
                  </Button>
                </LinkContainer>
                <Button variant="outline-warning" size="sm">
                  <i className="fas fa-shield-alt me-2"></i>Sécurité
                </Button>
                <Button variant="outline-warning" size="sm">
                  <i className="fas fa-chart-bar me-2"></i>Rapports
                </Button>
              </div>
              <hr />
              <small className="text-muted">
                <strong>Dernière sauvegarde:</strong>
                <br />
                {stats.lastBackup}
                <br />
                <Badge bg="success">Complétée</Badge>
              </small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Recent Activities & System Alerts */}
      <Row>
        <Col md={8}>
          <Card className="card-custom">
            <Card.Header>
              <h5 className="mb-0">
                <i className="fas fa-history me-2"></i>Activités Récentes
              </h5>
            </Card.Header>
            <Card.Body>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Action</th>
                    <th>Utilisateur</th>
                    <th>Heure</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {recentActivities.map((activity) => (
                    <tr key={activity.id}>
                      <td>{activity.action}</td>
                      <td>{activity.user}</td>
                      <td>{activity.time}</td>
                      <td>
                        <Badge bg={activity.type}>
                          {activity.type === "success"
                            ? "Succès"
                            : activity.type === "info"
                              ? "Info"
                              : activity.type === "warning"
                                ? "Attention"
                                : "Primaire"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="card-custom">
            <Card.Header>
              <h5 className="mb-0">
                <i className="fas fa-exclamation-triangle me-2"></i>Alertes Système
              </h5>
            </Card.Header>
            <Card.Body>
              {systemAlerts.map((alert) => (
                <div key={alert.id} className={`alert alert-${alert.level} py-2`}>
                  <small>{alert.message}</small>
                </div>
              ))}

              <hr />
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <small>Utilisation Stockage</small>
                  <small>{stats.storageUsed}%</small>
                </div>
                <ProgressBar
                  now={stats.storageUsed}
                  variant={stats.storageUsed > 80 ? "danger" : stats.storageUsed > 60 ? "warning" : "success"}
                />
              </div>

              <div className="text-center">
                <Button variant="outline-primary" size="sm">
                  <i className="fas fa-tools me-2"></i>Maintenance
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default IAdminDashboard
