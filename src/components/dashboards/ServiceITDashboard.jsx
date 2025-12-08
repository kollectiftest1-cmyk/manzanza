import { Container, Row, Col } from "react-bootstrap"
import { motion } from "framer-motion"
import { FiAlertCircle, FiCheckCircle, FiClock, FiTool } from "react-icons/fi"
import StatCard from "../StatCard"
import ChartCard from "../ChartCard"
import RecentActivity from "../RecentActivity"

const ServiceITDashboard = ({ user }) => {
  const ticketsData = {
    labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'],
    datasets: [{
      label: 'Tickets résolus',
      data: [12, 19, 15, 25, 22, 30],
      borderColor: 'rgba(28, 200, 138, 1)',
      backgroundColor: 'rgba(28, 200, 138, 0.1)',
      tension: 0.4,
      fill: true,
    }]
  }

  const systemsData = {
    labels: ['Serveur', 'Base de données', 'Réseau', 'Backup', 'Sécurité'],
    datasets: [{
      label: 'Uptime (%)',
      data: [99.9, 99.8, 98.5, 95.2, 100],
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
      title: "Ticket résolu",
      description: "WiFi Amphi A restauré - Prof. Martin",
      time: "Il y a 15min",
    },
    {
      id: 2,
      type: "alert",
      title: "Alerte système",
      description: "Espace disque serveur backup: 85%",
      time: "Il y a 1h",
    },
    {
      id: 3,
      type: "user",
      title: "Nouveau ticket",
      description: "Projecteur salle 101 - Apparitorat",
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
          Service IT 🔧
        </h2>
        <p style={{
          fontSize: '0.95rem',
          color: 'var(--color-textSecondary)',
          margin: 0,
        }}>
          Bienvenue {user?.name} | Support Technique & Infrastructure
        </p>
      </motion.div>

      <Row className="mb-4">
        <Col xl={3} lg={6} md={6} sm={12} className="mb-4">
          <StatCard
            title="Tickets Ouverts"
            value="12"
            icon={FiAlertCircle}
            color="warning"
            subtitle="À traiter"
            delay={0}
          />
        </Col>
        <Col xl={3} lg={6} md={6} sm={12} className="mb-4">
          <StatCard
            title="En Cours"
            value="5"
            icon={FiClock}
            color="info"
            subtitle="En résolution"
            delay={0.1}
          />
        </Col>
        <Col xl={3} lg={6} md={6} sm={12} className="mb-4">
          <StatCard
            title="Résolus"
            value="28"
            icon={FiCheckCircle}
            color="success"
            trend="up"
            trendValue="+15% ce mois"
            delay={0.2}
          />
        </Col>
        <Col xl={3} lg={6} md={6} sm={12} className="mb-4">
          <StatCard
            title="Temps Moyen"
            value="2.5h"
            icon={FiTool}
            color="primary"
            subtitle="Résolution"
            delay={0.3}
          />
        </Col>
      </Row>

      <Row className="mb-4">
        <Col lg={6} className="mb-4">
          <ChartCard
            title="Résolution des Tickets"
            subtitle="6 derniers mois"
            chartType="line"
            data={ticketsData}
            delay={0.4}
            height={300}
          />
        </Col>
        <Col lg={6} className="mb-4">
          <ChartCard
            title="Santé des Systèmes"
            subtitle="Uptime par composant"
            chartType="bar"
            data={systemsData}
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

export default ServiceITDashboard
