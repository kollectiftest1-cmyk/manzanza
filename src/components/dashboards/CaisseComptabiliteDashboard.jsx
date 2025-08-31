import { Container, Row, Col, Card, Button, Table, Badge } from "react-bootstrap"
import { useSelector } from "react-redux"

const CaisseComptabiliteDashboard = () => {
  const { user } = useSelector((state) => state.auth)

  const caisseStats = {
    soldeCaisse: 2500000,
    recettesJour: 450000,
    depensesJour: 180000,
    transactionsJour: 25,
  }

  const transactionsRecentes = [
    {
      id: 1,
      type: "Recette",
      description: "Paiement inscription - Jean Dupont",
      montant: 150000,
      methode: "Espèces",
      heure: "09:30",
      statut: "Validé",
    },
    {
      id: 2,
      type: "Dépense",
      description: "Achat fournitures bureau",
      montant: 45000,
      methode: "Chèque",
      heure: "11:15",
      statut: "Validé",
    },
    {
      id: 3,
      type: "Recette",
      description: "Paiement minerval - Marie Martin",
      montant: 75000,
      methode: "Virement",
      heure: "14:20",
      statut: "En attente",
    },
  ]

  const methodesPayement = [
    { methode: "Espèces", montant: 1200000, pourcentage: 48 },
    { methode: "Virement", montant: 800000, pourcentage: 32 },
    { methode: "Chèque", montant: 300000, pourcentage: 12 },
    { methode: "Mobile Money", montant: 200000, pourcentage: 8 },
  ]

  return (
    <Container fluid className="py-0" style={{ }}>
      <Row className="mb-4 dashboard-card">
        <Col>
          <h2 className="text-primary fw-bold">Tableau de Bord - Caisse & Comptabilité</h2>
          <p className="text-muted">Gestion Financière et Comptable</p>
        </Col>
      </Row>

      {/* Financial Statistics */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="card-custom text-center">
            <Card.Body>
              <i className="fas fa-cash-register fa-2x text-primary mb-3"></i>
              <h4 className="fw-bold">{(caisseStats.soldeCaisse / 1000000).toFixed(1)}M</h4>
              <p className="text-muted mb-0">Solde Caisse (FC)</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="card-custom text-center">
            <Card.Body>
              <i className="fas fa-arrow-up fa-2x text-success mb-3"></i>
              <h4 className="fw-bold">{(caisseStats.recettesJour / 1000).toFixed(0)}K</h4>
              <p className="text-muted mb-0">Recettes Jour (FC)</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="card-custom text-center">
            <Card.Body>
              <i className="fas fa-arrow-down fa-2x text-danger mb-3"></i>
              <h4 className="fw-bold">{(caisseStats.depensesJour / 1000).toFixed(0)}K</h4>
              <p className="text-muted mb-0">Dépenses Jour (FC)</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="card-custom text-center">
            <Card.Body>
              <i className="fas fa-exchange-alt fa-2x text-info mb-3"></i>
              <h4 className="fw-bold">{caisseStats.transactionsJour}</h4>
              <p className="text-muted mb-0">Transactions Jour</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col lg={8}>
          <Card className="card-custom mb-4">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="fw-bold mb-0">Transactions Récentes</h5>
              <Button size="sm" className="btn-primary-custom">
                <i className="fas fa-plus me-1"></i>
                Nouvelle Transaction
              </Button>
            </Card.Header>
            <Card.Body>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Description</th>
                    <th>Montant (FC)</th>
                    <th>Méthode</th>
                    <th>Heure</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactionsRecentes.map((transaction) => (
                    <tr key={transaction.id}>
                      <td>
                        <Badge bg={transaction.type === "Recette" ? "success" : "danger"}>{transaction.type}</Badge>
                      </td>
                      <td className="fw-semibold">{transaction.description}</td>
                      <td>{transaction.montant.toLocaleString()}</td>
                      <td>{transaction.methode}</td>
                      <td>{transaction.heure}</td>
                      <td>
                        <Badge bg={transaction.statut === "Validé" ? "success" : "warning"}>{transaction.statut}</Badge>
                      </td>
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

          <Card className="card-custom">
            <Card.Header>
              <h5 className="fw-bold mb-0">Répartition par Méthode de Paiement</h5>
            </Card.Header>
            <Card.Body>
              <Table responsive>
                <thead>
                  <tr>
                    <th>Méthode</th>
                    <th>Montant (FC)</th>
                    <th>Pourcentage</th>
                    <th>Répartition</th>
                  </tr>
                </thead>
                <tbody>
                  {methodesPayement.map((methode, index) => (
                    <tr key={index}>
                      <td className="fw-semibold">{methode.methode}</td>
                      <td>{methode.montant.toLocaleString()}</td>
                      <td>{methode.pourcentage}%</td>
                      <td>
                        <div className="progress" style={{ height: "8px" }}>
                          <div className="progress-bar bg-info" style={{ width: `${methode.pourcentage}%` }}></div>
                        </div>
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
                  <i className="fas fa-money-bill-wave me-2"></i>
                  Encaissement
                </Button>
                <Button variant="outline-danger">
                  <i className="fas fa-hand-holding-usd me-2"></i>
                  Décaissement
                </Button>
                <Button variant="outline-success">
                  <i className="fas fa-file-invoice-dollar me-2"></i>
                  Générer Reçu
                </Button>
                <Button variant="outline-info">
                  <i className="fas fa-chart-pie me-2"></i>
                  Rapport Journalier
                </Button>
              </div>
            </Card.Body>
          </Card>

          <Card className="card-custom mb-4">
            <Card.Header>
              <h6 className="fw-bold mb-0">Résumé Financier</h6>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <div className="d-flex justify-content-between">
                  <small>Bénéfice Net Jour</small>
                  <small className="fw-bold text-success">
                    +{((caisseStats.recettesJour - caisseStats.depensesJour) / 1000).toFixed(0)}K FC
                  </small>
                </div>
              </div>
              <div className="mb-3">
                <small className="text-muted">Objectif Mensuel</small>
                <div className="fw-semibold">8.5M FC</div>
                <div className="progress mt-1" style={{ height: "6px" }}>
                  <div className="progress-bar bg-success" style={{ width: "65%" }}></div>
                </div>
                <small className="text-muted">65% atteint</small>
              </div>
              <div>
                <small className="text-muted">Dernière clôture</small>
                <div className="fw-semibold">Hier 18:00</div>
              </div>
            </Card.Body>
          </Card>

          <Card className="card-custom">
            <Card.Header>
              <h6 className="fw-bold mb-0">Alertes</h6>
            </Card.Header>
            <Card.Body>
              <div className="alert alert-warning">
                <i className="fas fa-exclamation-triangle me-2"></i>
                <strong>Attention:</strong> 3 chèques à encaisser
              </div>
              <div className="alert alert-info">
                <i className="fas fa-info-circle me-2"></i>
                <strong>Rappel:</strong> Clôture de caisse à 18h
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default CaisseComptabiliteDashboard
