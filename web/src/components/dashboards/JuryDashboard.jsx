import { Container, Row, Col } from "react-bootstrap"
import { motion } from "framer-motion"
import { FiFileText, FiCalendar, FiClock, FiCheckCircle } from "react-icons/fi"
import StatCard from "../StatCard"
import ChartCard from "../ChartCard"
import RecentActivity from "../RecentActivity"

const JuryDashboard = ({ user }) => {

  const statusData = {
    labels: ['En Préparation', 'Soumis', 'En Évaluation', 'Soutenus', 'Validés'],
    datasets: [{
      label: 'Mémoires',
      data: [15, 25, 18, 32, 28],
      backgroundColor: [
        'rgba(246, 194, 62, 0.8)',
        'rgba(78, 115, 223, 0.8)',
        'rgba(231, 74, 59, 0.8)',
        'rgba(28, 200, 138, 0.8)',
        'rgba(111, 66, 193, 0.8)',
      ],
    }]
  }

  const notesData = {
    labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'],
    datasets: [{
      label: 'Note moyenne',
      data: [13.5, 14.2, 13.8, 14.8, 14.5, 15.2],
      borderColor: 'rgba(28, 200, 138, 1)',
      backgroundColor: 'rgba(28, 200, 138, 0.1)',
      tension: 0.4,
      fill: true,
    }]
  }

  const activities = [
    {
      id: 1,
      type: "check",
      title: "Défense réussie",
      description: "Marie Bernard - Note: 16/20",
      time: "Il y a 2h",
    },
    {
      id: 2,
      type: "file",
      title: "Nouveau mémoire soumis",
      description: "Jean Dupont - Digitalisation comptable",
      time: "Il y a 3h",
    },
    {
      id: 3,
      type: "alert",
      title: "Évaluation urgente",
      description: "3 mémoires à évaluer avant vendredi",
      time: "Il y a 5h",
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
          Jury de Mémoire 🎓
        </h2>
        <p style={{
          fontSize: '0.95rem',
          color: 'var(--color-textSecondary)',
          margin: 0,
        }}>
          Bienvenue {user?.name} | Évaluation des Mémoires & Soutenances
        </p>
      </motion.div>

      <Row className="mb-4">
        <Col xl={3} lg={6} md={6} sm={12} className="mb-4">
          <StatCard
            title="Mémoires Soumis"
            value="118"
            icon={FiFileText}
            color="primary"
            subtitle="Année en cours"
            delay={0}
          />
        </Col>
        <Col xl={3} lg={6} md={6} sm={12} className="mb-4">
          <StatCard
            title="Soutenances Programmées"
            value="32"
            icon={FiCalendar}
            color="info"
            subtitle="Ce mois"
            delay={0.1}
          />
        </Col>
        <Col xl={3} lg={6} md={6} sm={12} className="mb-4">
          <StatCard
            title="En Évaluation"
            value="18"
            icon={FiClock}
            color="warning"
            subtitle="À traiter"
            delay={0.2}
          />
        </Col>
        <Col xl={3} lg={6} md={6} sm={12} className="mb-4">
          <StatCard
            title="Validés"
            value="28"
            icon={FiCheckCircle}
            color="success"
            trend="up"
            trendValue="92% taux réussite"
            delay={0.3}
          />
        </Col>
      </Row>

      <Row className="mb-4">
        <Col lg={6} className="mb-4">
          <ChartCard
            title="Statut des Mémoires"
            subtitle="Année académique en cours"
            chartType="doughnut"
            data={statusData}
            delay={0.4}
            height={300}
          />
        </Col>
        <Col lg={6} className="mb-4">
          <ChartCard
            title="Évolution des Notes Moyennes"
            subtitle="6 derniers mois"
            chartType="line"
            data={notesData}
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

export default JuryDashboard
