import { Container, Row, Col } from "react-bootstrap"
import { motion } from "framer-motion"
import { FiHome, FiCheckCircle, FiClock, FiPercent } from "react-icons/fi"
import StatCard from "../StatCard"
import ChartCard from "../ChartCard"
import RecentActivity from "../RecentActivity"

const ApparitoratDashboard = ({ user }) => {

  const reservationsData = {
    labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'],
    datasets: [{
      label: 'Réservations',
      data: [15, 22, 18, 25, 20, 12],
      backgroundColor: 'rgba(78, 115, 223, 0.8)',
    }]
  }

  const occupationData = {
    labels: ['Amphi A', 'Amphi B', 'Lab Info', 'Salle 101', 'Salle 102'],
    datasets: [{
      label: 'Taux occupation (%)',
      data: [85, 72, 90, 65, 78],
      backgroundColor: [
        'rgba(78, 115, 223, 0.8)',
        'rgba(28, 200, 138, 0.8)',
        'rgba(246, 194, 62, 0.8)',
        'rgba(231, 74, 59, 0.8)',
        'rgba(111, 66, 193, 0.8)',
      ],
    }]
  }

  const activities = [
    {
      id: 1,
      type: "check",
      title: "Réservation confirmée",
      description: "Amphi A - Prof. Martin (14h-16h)",
      time: "Il y a 30min",
    },
    {
      id: 2,
      type: "alert",
      title: "Maintenance planifiée",
      description: "Lab Info - Mise à jour système",
      time: "Il y a 1h",
    },
    {
      id: 3,
      type: "user",
      title: "Nouvelle demande",
      description: "Salle 205 - Dr. Dubois (9h-11h)",
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
          Apparitorat 🏫
        </h2>
        <p style={{
          fontSize: '0.95rem',
          color: 'var(--color-textSecondary)',
          margin: 0,
        }}>
          Bienvenue {user?.name} | Gestion des Salles & Réservations
        </p>
      </motion.div>

      <Row className="mb-4">
        <Col xl={3} lg={6} md={6} sm={12} className="mb-4">
          <StatCard
            title="Salles Totales"
            value="45"
            icon={FiHome}
            color="primary"
            subtitle="Infrastructure"
            delay={0}
          />
        </Col>
        <Col xl={3} lg={6} md={6} sm={12} className="mb-4">
          <StatCard
            title="Réservations Confirmées"
            value="32"
            icon={FiCheckCircle}
            color="success"
            subtitle="Actives"
            delay={0.1}
          />
        </Col>
        <Col xl={3} lg={6} md={6} sm={12} className="mb-4">
          <StatCard
            title="En Attente"
            value="8"
            icon={FiClock}
            color="warning"
            subtitle="À valider"
            delay={0.2}
          />
        </Col>
        <Col xl={3} lg={6} md={6} sm={12} className="mb-4">
          <StatCard
            title="Taux d'Occupation"
            value="71%"
            icon={FiPercent}
            color="info"
            trend="up"
            trendValue="+5% cette semaine"
            delay={0.3}
          />
        </Col>
      </Row>

      <Row className="mb-4">
        <Col lg={6} className="mb-4">
          <ChartCard
            title="Réservations par Jour"
            subtitle="Cette semaine"
            chartType="bar"
            data={reservationsData}
            delay={0.4}
            height={300}
          />
        </Col>
        <Col lg={6} className="mb-4">
          <ChartCard
            title="Taux d'Occupation des Salles"
            subtitle="Top 5 salles"
            chartType="doughnut"
            data={occupationData}
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

export default ApparitoratDashboard
