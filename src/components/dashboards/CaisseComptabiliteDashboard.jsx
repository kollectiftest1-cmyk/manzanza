import { Container, Row, Col } from "react-bootstrap"
import { motion } from "framer-motion"
import { FiDollarSign, FiTrendingUp, FiTrendingDown, FiClock } from "react-icons/fi"
import StatCard from "../StatCard"
import ChartCard from "../ChartCard"
import RecentActivity from "../RecentActivity"

const CaisseComptabiliteDashboard = ({ user }) => {

  const financeData = {
    labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'],
    datasets: [
      {
        label: 'Recettes (K FC)',
        data: [450, 520, 480, 580, 620, 650],
        borderColor: 'rgba(28, 200, 138, 1)',
        backgroundColor: 'rgba(28, 200, 138, 0.1)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Dépenses (K FC)',
        data: [350, 380, 420, 450, 480, 500],
        borderColor: 'rgba(231, 74, 59, 1)',
        backgroundColor: 'rgba(231, 74, 59, 0.1)',
        tension: 0.4,
        fill: true,
      }
    ]
  }

  const methodesData = {
    labels: ['Espèces', 'Virement', 'Chèque', 'Mobile Money'],
    datasets: [{
      label: 'Montant (K FC)',
      data: [1200, 800, 300, 200],
      backgroundColor: [
        'rgba(78, 115, 223, 0.8)',
        'rgba(28, 200, 138, 0.8)',
        'rgba(246, 194, 62, 0.8)',
        'rgba(111, 66, 193, 0.8)',
      ],
    }]
  }

  const activities = [
    {
      id: 1,
      type: "check",
      title: "Paiement reçu",
      description: "Inscription Jean Dupont - 150K FC",
      time: "Il y a 30min",
    },
    {
      id: 2,
      type: "alert",
      title: "Dépense enregistrée",
      description: "Fournitures bureau - 45K FC",
      time: "Il y a 1h",
    },
    {
      id: 3,
      type: "file",
      title: "Rapport généré",
      description: "Rapport journalier de caisse",
      time: "Il y a 2h",
    },
  ]

  return (
    <Container fluid style={{ padding: '24px', background: 'var(--color-bodyBg)', minHeight: '100vh' }}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ marginBottom: '32px' }}
      >
        <h2 style={{
          fontSize: '1.75rem',
          fontWeight: '700',
          color: 'var(--color-textPrimary)',
          marginBottom: '8px',
        }}>
          Caisse & Comptabilité 💰
        </h2>
        <p style={{
          fontSize: '0.95rem',
          color: 'var(--color-textSecondary)',
          margin: 0,
        }}>
          Bienvenue {user?.name} | Gestion Financière
        </p>
      </motion.div>

      <Row className="mb-4">
        <Col xl={3} lg={6} md={6} sm={12} className="mb-4">
          <StatCard
            title="Recettes du Mois"
            value="650K FC"
            icon={FiTrendingUp}
            color="success"
            trend="up"
            trendValue="+8% vs mois dernier"
            delay={0}
          />
        </Col>
        <Col xl={3} lg={6} md={6} sm={12} className="mb-4">
          <StatCard
            title="Dépenses du Mois"
            value="500K FC"
            icon={FiTrendingDown}
            color="danger"
            subtitle="Contrôlées"
            delay={0.1}
          />
        </Col>
        <Col xl={3} lg={6} md={6} sm={12} className="mb-4">
          <StatCard
            title="Solde"
            value="150K FC"
            icon={FiDollarSign}
            color="primary"
            subtitle="Bénéfice net"
            delay={0.2}
          />
        </Col>
        <Col xl={3} lg={6} md={6} sm={12} className="mb-4">
          <StatCard
            title="Paiements en Attente"
            value="12"
            icon={FiClock}
            color="warning"
            subtitle="À valider"
            delay={0.3}
          />
        </Col>
      </Row>

      <Row className="mb-4">
        <Col lg={6} className="mb-4">
          <ChartCard
            title="Évolution Financière"
            subtitle="6 derniers mois"
            chartType="line"
            data={financeData}
            delay={0.4}
            height={300}
          />
        </Col>
        <Col lg={6} className="mb-4">
          <ChartCard
            title="Répartition Méthodes de Paiement"
            subtitle="Ce mois"
            chartType="doughnut"
            data={methodesData}
            delay={0.5}
            height={300}
          />
        </Col>
      </Row>

      <Row className="mb-4">
        <Col lg={12}>
          <RecentActivity
            activities={activities}
            delay={0.6}
          />
        </Col>
      </Row>
    </Container>
  )
}

export default CaisseComptabiliteDashboard
