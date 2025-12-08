import { Container, Row, Col, Card, Button, Table, Badge } from "react-bootstrap"
import { useSelector } from "react-redux"
import { motion } from "framer-motion"
import StatCard from "../StatCard"
import ChartCard from "../ChartCard"
import CalendarWidget from "../CalendarWidget"
import ScheduleWidget from "../ScheduleWidget"
import RecentActivity from "../RecentActivity"
import { FiDollarSign, FiTrendingDown, FiTrendingUp, FiCreditCard } from "react-icons/fi"

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

  const financeData = { labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'], datasets: [{ label: 'Recettes', data: [800000, 950000, 1100000, 1000000, 1200000, 1200000], borderColor: 'rgb(28, 200, 138)', backgroundColor: 'rgba(28, 200, 138, 0.1)', fill: true }] }

  return (
    <Container fluid style={{ padding: '24px', background: 'var(--color-bodyBg)', minHeight: '100vh' }}>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--color-textPrimary)', marginBottom: '8px' }}>SGAD - Administration & Finances 💰</h2>
        <p style={{ fontSize: '0.95rem', color: 'var(--color-textSecondary)', margin: 0 }}>Bienvenue {user?.name}</p>
      </motion.div>
      <Row className="mb-4">
        <Col xl={3} lg={6} className="mb-4"><StatCard title="Budget Total" value={`${(financialStats.budgetTotal / 1000000).toFixed(1)}M FC`} icon={FiDollarSign} color="primary" delay={0} /></Col>
        <Col xl={3} lg={6} className="mb-4"><StatCard title="Dépenses" value={`${(financialStats.depensesActuelles / 1000000).toFixed(1)}M FC`} icon={FiTrendingDown} color="danger" delay={0.1} /></Col>
        <Col xl={3} lg={6} className="mb-4"><StatCard title="Recettes" value={`${(financialStats.recettesInscriptions / 1000000).toFixed(1)}M FC`} icon={FiTrendingUp} color="success" delay={0.2} /></Col>
        <Col xl={3} lg={6} className="mb-4"><StatCard title="Solde" value={`${(financialStats.soldeDisponible / 1000000).toFixed(1)}M FC`} icon={FiCreditCard} color="info" delay={0.3} /></Col>
      </Row>
      <Row className="mb-4">
        <Col lg={12}><ChartCard title="Évolution des Recettes" subtitle="6 derniers mois" chartType="line" data={financeData} delay={0.4} height={300} /></Col>
      </Row>
      <Row className="mb-4">
        <Col xl={4} lg={12} className="mb-4"><CalendarWidget events={[{ date: new Date() }]} delay={0.5} /></Col>
        <Col xl={4} lg={6} className="mb-4"><ScheduleWidget schedule={[{ title: "Audit financier", description: "Révision comptable", time: "9:00 AM - 11:00 AM", badge: "Finance", color: "var(--color-success)" }]} delay={0.6} /></Col>
        <Col xl={4} lg={6} className="mb-4"><RecentActivity activities={paiementsRecents.slice(0, 3).map(p => ({ id: p.id, type: 'check', title: `Paiement ${p.type}`, description: `${p.etudiant} - ${p.montant} FC`, time: p.date }))} delay={0.7} /></Col>
      </Row>
      <Row className="mb-4">
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
