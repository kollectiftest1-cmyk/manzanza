import { Container, Row, Col, Card, Button, Table, Badge } from "react-bootstrap"
import { useSelector } from "react-redux"

const SGADDashboard = () => {
  const { user } = useSelector((state) => state.auth)

  const financialStats = {
    budgetTotal: 2500000,
    depensesActuelles: 1850000,
    recettesInscriptions: 1200000,
    soldeDisponible: 650000,
  }

  const paiementsRecents = [
    { id: 1, etudiant: "Jean Dupont", montant: 150000, type: "Inscription", statut: "Payé", date: "2024-01-15" },
    { id: 2, etudiant: "Marie Martin", montant: 75000, type: "Minerval", statut: "En attente", date: "2024-01-14" },
    { id: 3, etudiant: "Paul Bernard", montant: 200000, type: "Inscription", statut: "Payé", date: "2024-01-13" },
  ]

  return (
    <Container fluid className="py-0" style={{ }}>
      <Row className="mb-4 dashboard-card">
        <Col>
          <h2 className="text-primary fw-bold">Tableau de Bord - SGAD</h2>
          <p className="text-muted">Secrétariat Général Administration & Finances</p>
        </Col>
      </Row>

      {/* Financial Statistics */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="card-custom text-center">
            <Card.Body>
              <i className="fas fa-wallet fa-2x text-primary mb-3"></i>
              <h4 className="fw-bold">{(financialStats.budgetTotal / 1000000).toFixed(1)}M</h4>
              <p className="text-muted mb-0">Budget Total (FC)</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="card-custom text-center">
            <Card.Body>
              <i className="fas fa-arrow-down fa-2x text-danger mb-3"></i>
              <h4 className="fw-bold">{(financialStats.depensesActuelles / 1000000).toFixed(1)}M</h4>
              <p className="text-muted mb-0">Dépenses (FC)</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="card-custom text-center">
            <Card.Body>
              <i className="fas fa-arrow-up fa-2x text-success mb-3"></i>
              <h4 className="fw-bold">{(financialStats.recettesInscriptions / 1000000).toFixed(1)}M</h4>
              <p className="text-muted mb-0">Recettes (FC)</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="card-custom text-center">
            <Card.Body>
              <i className="fas fa-piggy-bank fa-2x text-info mb-3"></i>
              <h4 className="fw-bold">{(financialStats.soldeDisponible / 1000000).toFixed(1)}M</h4>
              <p className="text-muted mb-0">Solde (FC)</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col lg={8}>
          <Card className="card-custom">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="fw-bold mb-0">Paiements Récents</h5>
              <Button size="sm" className="btn-primary-custom">
                <i className="fas fa-plus me-1"></i>
                Nouveau Paiement
              </Button>
            </Card.Header>
            <Card.Body>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Étudiant</th>
                    <th>Montant (FC)</th>
                    <th>Type</th>
                    <th>Statut</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paiementsRecents.map((paiement) => (
                    <tr key={paiement.id}>
                      <td className="fw-semibold">{paiement.etudiant}</td>
                      <td>{paiement.montant.toLocaleString()}</td>
                      <td>{paiement.type}</td>
                      <td>
                        <Badge bg={paiement.statut === "Payé" ? "success" : "warning"}>{paiement.statut}</Badge>
                      </td>
                      <td>{paiement.date}</td>
                      <td>
                        <Button size="sm" variant="outline-primary" className="me-1">
                          <i className="fas fa-edit"></i>
                        </Button>
                        <Button size="sm" variant="outline-info">
                          <i className="fas fa-receipt"></i>
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
              <h6 className="fw-bold mb-0">Actions Financières</h6>
            </Card.Header>
            <Card.Body>
              <div className="d-grid gap-2">
                <Button variant="outline-primary">
                  <i className="fas fa-calculator me-2"></i>
                  Comptabilité
                </Button>
                <Button variant="outline-success">
                  <i className="fas fa-money-bill-wave me-2"></i>
                  Gestion Caisse
                </Button>
                <Button variant="outline-info">
                  <i className="fas fa-chart-pie me-2"></i>
                  Rapports Financiers
                </Button>
                <Button variant="outline-warning">
                  <i className="fas fa-file-invoice me-2"></i>
                  Facturations
                </Button>
              </div>
            </Card.Body>
          </Card>

          <Card className="card-custom">
            <Card.Header>
              <h6 className="fw-bold mb-0">Alertes Financières</h6>
            </Card.Header>
            <Card.Body>
              <div className="alert alert-warning">
                <i className="fas fa-exclamation-triangle me-2"></i>
                <strong>Attention:</strong> 15 paiements en retard
              </div>
              <div className="alert alert-info">
                <i className="fas fa-info-circle me-2"></i>
                <strong>Info:</strong> Rapport mensuel à générer
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default SGADDashboard
