import { Container, Row, Col } from "react-bootstrap"
import { motion } from "framer-motion"
import { FiBook, FiBookOpen, FiClock, FiPlusCircle } from "react-icons/fi"
import StatCard from "../StatCard"
import ChartCard from "../ChartCard"
import RecentActivity from "../RecentActivity"

const BibliothecaireDashboard = ({ user }) => {

  const categoriesData = {
    labels: ['Informatique', 'Économie', 'Comptabilité', 'Droit', 'Finance', 'Mathématiques'],
    datasets: [{
      label: 'Livres par catégorie',
      data: [120, 85, 95, 70, 60, 55],
      backgroundColor: [
        'rgba(78, 115, 223, 0.8)',
        'rgba(28, 200, 138, 0.8)',
        'rgba(246, 194, 62, 0.8)',
        'rgba(231, 74, 59, 0.8)',
        'rgba(111, 66, 193, 0.8)',
        'rgba(54, 185, 204, 0.8)',
      ],
    }]
  }

  const empruntsData = {
    labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'],
    datasets: [{
      label: 'Emprunts mensuels',
      data: [145, 162, 138, 175, 158, 190],
      borderColor: 'rgba(78, 115, 223, 1)',
      backgroundColor: 'rgba(78, 115, 223, 0.1)',
      tension: 0.4,
      fill: true,
    }]
  }

  const activities = [
    {
      id: 1,
      type: "check",
      title: "Livre retourné",
      description: "Comptabilité Générale - Marie Dupont",
      time: "Il y a 15min",
    },
    {
      id: 2,
      type: "alert",
      title: "Retard signalé",
      description: "Économie Politique - Jean Leroy (5 jours)",
      time: "Il y a 1h",
    },
    {
      id: 3,
      type: "file",
      title: "Nouveaux livres",
      description: "15 ouvrages ajoutés au catalogue",
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
          Bibliothèque 📚
        </h2>
        <p style={{
          fontSize: '0.95rem',
          color: 'var(--color-textSecondary)',
          margin: 0,
        }}>
          Bienvenue {user?.name} | Gestion de la Bibliothèque Universitaire
        </p>
      </motion.div>

      <Row className="mb-4">
        <Col xl={3} lg={6} md={6} sm={12} className="mb-4">
          <StatCard
            title="Livres au Catalogue"
            value="485"
            icon={FiBook}
            color="primary"
            subtitle="Total disponible"
            delay={0}
          />
        </Col>
        <Col xl={3} lg={6} md={6} sm={12} className="mb-4">
          <StatCard
            title="Emprunts Actifs"
            value="156"
            icon={FiBookOpen}
            color="info"
            subtitle="En circulation"
            delay={0.1}
          />
        </Col>
        <Col xl={3} lg={6} md={6} sm={12} className="mb-4">
          <StatCard
            title="Retours Attendus"
            value="23"
            icon={FiClock}
            color="warning"
            subtitle="Cette semaine"
            delay={0.2}
          />
        </Col>
        <Col xl={3} lg={6} md={6} sm={12} className="mb-4">
          <StatCard
            title="Nouveautés du Mois"
            value="12"
            icon={FiPlusCircle}
            color="success"
            trend="up"
            trendValue="+8 vs mois dernier"
            delay={0.3}
          />
        </Col>
      </Row>

      <Row className="mb-4">
        <Col lg={6} className="mb-4">
          <ChartCard
            title="Répartition par Catégorie"
            subtitle="Catalogue complet"
            chartType="doughnut"
            data={categoriesData}
            delay={0.4}
            height={300}
          />
        </Col>
        <Col lg={6} className="mb-4">
          <ChartCard
            title="Évolution des Emprunts"
            subtitle="6 derniers mois"
            chartType="line"
            data={empruntsData}
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

export default BibliothecaireDashboard
