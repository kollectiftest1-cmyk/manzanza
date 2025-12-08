/**
 * 🎨 MODERN DASHBOARD - Dashboard principal moderne
 * ==================================================
 * Dashboard professionnel inspiré du design Acadex
 */

import { Container, Row, Col } from "react-bootstrap"
import { motion } from "framer-motion"
import { useSelector } from "react-redux"
import StatCard from "../StatCard"
import ChartCard from "../ChartCard"
import CalendarWidget from "../CalendarWidget"
import ScheduleWidget from "../ScheduleWidget"
import RecentActivity from "../RecentActivity"
import { FiUsers, FiBook, FiFileText, FiDollarSign, FiTrendingUp, FiAward } from "react-icons/fi"

const ModernDashboard = () => {
  const { user } = useSelector((state) => state.auth)

  // Données de démonstration pour les statistiques
  const stats = [
    {
      title: "Total Étudiants",
      value: "5,699",
      icon: FiUsers,
      color: "primary",
      trend: "up",
      trendValue: "+12% ce mois",
      delay: 0,
    },
    {
      title: "Cours Actifs",
      value: "297",
      icon: FiBook,
      color: "success",
      trend: "up",
      trendValue: "+8% ce mois",
      delay: 0.1,
    },
    {
      title: "TP/TD",
      value: "368",
      icon: FiFileText,
      color: "warning",
      trend: "neutral",
      trendValue: "Stable",
      delay: 0.2,
    },
    {
      title: "Revenus",
      value: "$87,395",
      icon: FiDollarSign,
      color: "info",
      trend: "up",
      trendValue: "+23% ce mois",
      delay: 0.3,
    },
  ]

  // Données pour le graphique de performance académique
  const academicPerformanceData = {
    labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'],
    datasets: [
      {
        label: 'Performance 2024',
        data: [65, 68, 72, 75, 78, 82],
        borderColor: 'rgb(78, 115, 223)',
        backgroundColor: 'rgba(78, 115, 223, 0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: 'rgb(78, 115, 223)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
      },
      {
        label: 'Performance 2023',
        data: [60, 64, 66, 68, 70, 73],
        borderColor: 'rgb(28, 200, 138)',
        backgroundColor: 'rgba(28, 200, 138, 0.1)',
        tension: 0.4,
        fill: true,
        pointBackgroundColor: 'rgb(28, 200, 138)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
      },
    ],
  }

  // Données pour le graphique des revenus
  const earningsData = {
    labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'],
    datasets: [
      {
        label: 'Frais Académiques',
        data: [35000, 42000, 38000, 45000, 52000, 48000],
        backgroundColor: 'rgb(78, 115, 223)',
        borderRadius: 8,
      },
      {
        label: 'Inscriptions',
        data: [28000, 32000, 30000, 35000, 40000, 38000],
        backgroundColor: 'rgb(28, 200, 138)',
        borderRadius: 8,
      },
      {
        label: 'Frais Divers',
        data: [12000, 15000, 14000, 16000, 18000, 17000],
        backgroundColor: 'rgb(246, 194, 62)',
        borderRadius: 8,
      },
    ],
  }

  // Données pour le graphique circulaire
  const studentDistributionData = {
    labels: ['1ère Année', '2ème Année', '3ème Année', 'Master'],
    datasets: [
      {
        data: [1200, 1300, 1500, 1699],
        backgroundColor: [
          'rgb(78, 115, 223)',
          'rgb(28, 200, 138)',
          'rgb(246, 194, 62)',
          'rgb(231, 74, 59)',
        ],
        borderWidth: 0,
      },
    ],
  }

  // Données pour le planning
  const scheduleItems = [
    {
      title: "Atelier Développement Web",
      description: "Business et Technology",
      time: "9:00 AM - 12:00 PM",
      location: "Salle A101",
      participants: "Étudiants 3ème & 4ème année",
      badge: "Atelier",
      badgeColor: "var(--color-primaryLight)",
      badgeTextColor: "var(--color-primary)",
      color: "var(--color-primary)",
    },
    {
      title: "Série de Conférences",
      description: "Humanités et Sciences Sociales",
      time: "2:00 PM - 5:00 PM",
      location: "Amphithéâtre",
      participants: "Tous les étudiants",
      badge: "Conférence",
      badgeColor: "rgba(28, 200, 138, 0.1)",
      badgeTextColor: "var(--color-success)",
      color: "var(--color-success)",
    },
    {
      title: "Soirée Cinéma",
      description: "Hosted by Film Society",
      time: "6:00 PM - 10:00 PM",
      location: "Campus Center",
      participants: "Tous les étudiants",
      badge: "Événement",
      badgeColor: "rgba(246, 194, 62, 0.1)",
      badgeTextColor: "var(--color-warning)",
      color: "var(--color-warning)",
    },
  ]

  // Données pour les activités récentes
  const recentActivities = [
    {
      id: 1,
      type: "check",
      title: "Sarah Thompson",
      description: "s'est inscrit avec succès au cours de Calcul Avancé et d'Histoire Moderne pour le prochain semestre.",
      time: "Il y a 1h",
      badge: "Tous les étudiants",
      badgeColor: "var(--color-primaryLight)",
      badgeTextColor: "var(--color-primary)",
    },
    {
      id: 2,
      type: "file",
      title: "Mark Collins",
      description: "a soumis les notes finales pour le cours de Sciences Environnementales 101.",
      time: "Il y a 1h",
    },
    {
      id: 3,
      type: "trending",
      title: "Lisa Ray",
      description: "a créé un nouvel événement intitulé 'Concert de Musique de Printemps' prévu pour le 15 mars.",
      time: "Il y a 2h",
    },
    {
      id: 4,
      type: "user",
      title: "Jason Lee",
      description: "a téléchargé le guide d'étude de Biochimie depuis la bibliothèque en ligne de l'université.",
      time: "Il y a 3h",
    },
    {
      id: 5,
      type: "award",
      title: "Harry Kane",
      description: "s'est inscrit avec succès pour le cours de Histoire Moderne pour le prochain semestre.",
      time: "Il y a 1 jour",
    },
  ]

  return (
    <Container fluid className="modern-dashboard-container" style={{ padding: '24px', background: 'var(--color-bodyBg)' }}>
      {/* Header avec titre */}
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
          Tableau de Bord
        </h2>
        <p style={{
          fontSize: '0.95rem',
          color: 'var(--color-textSecondary)',
          margin: 0,
        }}>
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </motion.div>

      {/* Cartes de statistiques */}
      <Row className="mb-4">
        {stats.map((stat, index) => (
          <Col key={index} xl={3} lg={6} md={6} sm={12} className="mb-4">
            <StatCard {...stat} />
          </Col>
        ))}
      </Row>

      {/* Graphiques principaux */}
      <Row className="mb-4">
        <Col xl={8} lg={7} className="mb-4">
          <ChartCard
            title="Performance Académique"
            subtitle="Derniers 4 ans"
            chartType="line"
            data={academicPerformanceData}
            delay={0.2}
            height={320}
          />
        </Col>
        <Col xl={4} lg={5} className="mb-4">
          <ChartCard
            title="Distribution Étudiants"
            subtitle="Par niveau"
            chartType="doughnut"
            data={studentDistributionData}
            delay={0.3}
            height={320}
          />
        </Col>
      </Row>

      {/* Graphique des revenus */}
      <Row className="mb-4">
        <Col xl={12} className="mb-4">
          <ChartCard
            title="Revenus"
            subtitle="Par catégorie - 6 derniers mois"
            chartType="bar"
            data={earningsData}
            delay={0.4}
            height={300}
          />
        </Col>
      </Row>

      {/* Calendrier, Planning et Activités */}
      <Row className="mb-4">
        <Col xl={4} lg={12} className="mb-4">
          <CalendarWidget
            events={[
              { date: new Date(2027, 9, 15) },
              { date: new Date(2027, 9, 20) },
              { date: new Date(2027, 9, 25) },
            ]}
            delay={0.5}
          />
        </Col>
        <Col xl={4} lg={6} className="mb-4">
          <ScheduleWidget
            schedule={scheduleItems}
            date={new Date()}
            delay={0.6}
          />
        </Col>
        <Col xl={4} lg={6} className="mb-4">
          <RecentActivity
            activities={recentActivities}
            delay={0.7}
          />
        </Col>
      </Row>
    </Container>
  )
}

export default ModernDashboard
