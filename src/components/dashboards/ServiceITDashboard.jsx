import { Container, Row, Col, Card, Button, Table, Badge, Alert } from "react-bootstrap"
import { useSelector } from "react-redux"

const ServiceITDashboard = () => {
  const { user } = useSelector((state) => state.auth)

  const itStats = {
    systemesActifs: 25,
    ticketsOuverts: 12,
    ticketsResolus: 45,
    maintenanceProgrammee: 3,
  }

  const ticketsRecents = [
    {
      id: 1,
      titre: "Problème connexion WiFi Amphi A",
      demandeur: "Prof. Martin",
      priorite: "Haute",
      statut: "En cours",
      dateCreation: "2024-01-15",
    },
    {
      id: 2,
      titre: "Mise à jour logiciel comptabilité",
      demandeur: "Service SGAD",
      priorite: "Moyenne",
      statut: "Planifié",
      dateCreation: "2024-01-14",
    },
    {
      id: 3,
      titre: "Installation nouveau projecteur",
      demandeur: "Apparitorat",
      priorite: "Basse",
      statut: "Terminé",
      dateCreation: "2024-01-13",
    },
  ]

  const systemesMonitores = [
    { nom: "Serveur Principal", statut: "Actif", uptime: "99.9%", dernierCheck: "Il y a 2 min" },
    { nom: "Base de Données", statut: "Actif", uptime: "99.8%", dernierCheck: "Il y a 1 min" },
    { nom: "Système de Sauvegarde", statut: "Maintenance", uptime: "95.2%", dernierCheck: "Il y a 30 min" },
    { nom: "Réseau WiFi", statut: "Actif", uptime: "98.5%", dernierCheck: "Il y a 5 min" },
  ]

  return (
    <Container fluid className="py-4" style={{ marginLeft: "280px", paddingRight: "20px" }}>
      <Row className="mb-4">
        <Col>
          <h2 className="text-primary fw-bold">Tableau de Bord - Service IT</h2>
          <p className="text-muted">Gestion des Systèmes Informatiques</p>
        </Col>
      </Row>

      {/* IT Statistics */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="card-custom text-center">
            <Card.Body>
              <i className="fas fa-server fa-2x text-primary mb-3"></i>
              <h4 className="fw-bold">{itStats.systemesActifs}</h4>
              <p className="text-muted mb-0">Systèmes Actifs</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="card-custom text-center">
            <Card.Body>
              <i className="fas fa-ticket-alt fa-2x text-warning mb-3"></i>
              <h4 className="fw-bold">{itStats.ticketsOuverts}</h4>
              <p className="text-muted mb-0">Tickets Ouverts</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="card-custom text-center">
            <Card.Body>
              <i className="fas fa-check-circle fa-2x text-success mb-3"></i>
              <h4 className="fw-bold">{itStats.ticketsResolus}</h4>
              <p className="text-muted mb-0">Tickets Résolus</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="card-custom text-center">
            <Card.Body>
              <i className="fas fa-tools fa-2x text-info mb-3"></i>
              <h4 className="fw-bold">{itStats.maintenanceProgrammee}</h4>
              <p className="text-muted mb-0">Maintenance Programmée</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col lg={8}>
          <Card className="card-custom mb-4">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="fw-bold mb-0">Tickets de Support</h5>
              <Button size="sm" className="btn-primary-custom">
                <i className="fas fa-plus me-1"></i>
                Nouveau Ticket
              </Button>
            </Card.Header>
            <Card.Body>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Titre</th>
                    <th>Demandeur</th>
                    <th>Priorité</th>
                    <th>Statut</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {ticketsRecents.map((ticket) => (
                    <tr key={ticket.id}>
                      <td className="fw-semibold">{ticket.titre}</td>
                      <td>{ticket.demandeur}</td>
                      <td>
                        <Badge
                          bg={
                            ticket.priorite === "Haute"
                              ? "danger"
                              : ticket.priorite === "Moyenne"
                                ? "warning"
                                : "secondary"
                          }
                        >
                          {ticket.priorite}
                        </Badge>
                      </td>
                      <td>
                        <Badge
                          bg={
                            ticket.statut === "En cours" ? "warning" : ticket.statut === "Terminé" ? "success" : "info"
                          }
                        >
                          {ticket.statut}
                        </Badge>
                      </td>
                      <td>{ticket.dateCreation}</td>
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

          <Card className="card-custom">
            <Card.Header>
              <h5 className="fw-bold mb-0">Monitoring des Systèmes</h5>
            </Card.Header>
            <Card.Body>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Système</th>
                    <th>Statut</th>
                    <th>Uptime</th>
                    <th>Dernier Check</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {systemesMonitores.map((systeme, index) => (
                    <tr key={index}>
                      <td className="fw-semibold">{systeme.nom}</td>
                      <td>
                        <Badge bg={systeme.statut === "Actif" ? "success" : "warning"}>{systeme.statut}</Badge>
                      </td>
                      <td>{systeme.uptime}</td>
                      <td>{systeme.dernierCheck}</td>
                      <td>
                        <Button size="sm" variant="outline-info">
                          <i className="fas fa-chart-line"></i>
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
                  <i className="fas fa-user-cog me-2"></i>
                  Gestion Utilisateurs
                </Button>
                <Button variant="outline-success">
                  <i className="fas fa-shield-alt me-2"></i>
                  Sécurité Système
                </Button>
                <Button variant="outline-info">
                  <i className="fas fa-database me-2"></i>
                  Sauvegarde
                </Button>
                <Button variant="outline-warning">
                  <i className="fas fa-network-wired me-2"></i>
                  Configuration Réseau
                </Button>
              </div>
            </Card.Body>
          </Card>

          <Alert variant="danger">
            <Alert.Heading>
              <i className="fas fa-exclamation-triangle me-2"></i>
              Alertes Critiques
            </Alert.Heading>
            <p className="mb-2">
              <strong>Serveur de sauvegarde:</strong> Espace disque faible (85% utilisé)
            </p>
            <p className="mb-0">
              <strong>Réseau WiFi:</strong> Connexions intermittentes signalées
            </p>
          </Alert>

          <Card className="card-custom">
            <Card.Header>
              <h6 className="fw-bold mb-0">Statistiques Système</h6>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <div className="d-flex justify-content-between">
                  <small>Utilisation CPU</small>
                  <small className="fw-bold">45%</small>
                </div>
                <div className="progress" style={{ height: "8px" }}>
                  <div className="progress-bar bg-info" style={{ width: "45%" }}></div>
                </div>
              </div>
              <div className="mb-3">
                <div className="d-flex justify-content-between">
                  <small>Utilisation RAM</small>
                  <small className="fw-bold">68%</small>
                </div>
                <div className="progress" style={{ height: "8px" }}>
                  <div className="progress-bar bg-warning" style={{ width: "68%" }}></div>
                </div>
              </div>
              <div>
                <div className="d-flex justify-content-between">
                  <small>Espace Disque</small>
                  <small className="fw-bold">85%</small>
                </div>
                <div className="progress" style={{ height: "8px" }}>
                  <div className="progress-bar bg-danger" style={{ width: "85%" }}></div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default ServiceITDashboard
