import { Container, Row, Col } from "react-bootstrap"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { getSgaDashboardStats } from "../../services/statsService"
import { getSections } from "../../services/sectionService"
import { getAcademicCalendarEvents } from "../../services/coreService"
import StatCard from "../StatCard"
import ChartCard from "../ChartCard"
import CalendarWidget from "../CalendarWidget"
import ScheduleWidget from "../ScheduleWidget"
import RecentActivity from "../RecentActivity"
import { FiGrid, FiUsers, FiFileText, FiAlertCircle, FiBook, FiUser } from "react-icons/fi"

const SGADashboard = ({ user }) => {
  const [stats, setStats] = useState({
    total_students: 0,
    pending_inscriptions: 0,
    total_sections: 0,
    total_auditoires: 0,
    total_courses: 0,
    total_teachers: 0,
  })
  const [sections, setSections] = useState([])
  const [calendarEvents, setCalendarEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, sectionsRes, calendarRes] = await Promise.all([
          getSgaDashboardStats(),
          getSections(),
          getAcademicCalendarEvents(),
        ])
        setStats(statsRes.data)
        setSections(sectionsRes.data.results)
        setCalendarEvents(calendarRes.data.results)
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const sectionsData = {
    labels: sections.slice(0, 6).map(s => s.nom || s.name),
    datasets: [{
      label: 'Étudiants par section',
      data: sections.slice(0, 6).map(s => s.total_students || Math.floor(Math.random() * 200 + 100)),
      backgroundColor: [
        'rgba(78, 115, 223, 0.8)',
        'rgba(28, 200, 138, 0.8)',
        'rgba(246, 194, 62, 0.8)',
        'rgba(231, 74, 59, 0.8)',
        'rgba(111, 66, 193, 0.8)',
        'rgba(54, 185, 204, 0.8)',
      ],
      borderWidth: 0,
    }]
  }

  // Données pour Performance Académique
  const performanceData = {
    labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin'],
    datasets: [
      {
        label: 'Taux de Réussite (%)',
        data: [75, 78, 82, 85, 88, 90],
        borderColor: 'rgba(28, 200, 138, 1)',
        backgroundColor: 'rgba(28, 200, 138, 0.1)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Moyenne Générale',
        data: [65, 68, 70, 72, 75, 78],
        borderColor: 'rgba(78, 115, 223, 1)',
        backgroundColor: 'rgba(78, 115, 223, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ]
  }

  const sgaActivities = [
    {
      id: 1,
      type: "check",
      title: "Inscriptions validées",
      description: "45 nouvelles inscriptions approuvées pour ce semestre",
      time: "Il y a 1h",
    },
    {
      id: 2,
      type: "user",
      title: "Nouvelle section créée",
      description: "Section Informatique - Licence 1 a été ajoutée",
      time: "Il y a 3h",
    },
    {
      id: 3,
      type: "file",
      title: "Calendrier académique publié",
      description: "Le calendrier du semestre 2024 est disponible",
      time: "Il y a 1 jour",
    },
  ]

  const sgaSchedule = [
    {
      title: "Commission pédagogique",
      description: "Révision des programmes académiques",
      time: "9:00 AM - 11:00 AM",
      location: "Salle des conseils",
      badge: "Réunion",
      color: "var(--color-primary)",
    },
    {
      title: "Validation inscriptions",
      description: "Traitement dossiers étudiants",
      time: "2:00 PM - 4:00 PM",
      location: "Bureau SGA",
      badge: "Administratif",
      badgeColor: "rgba(28, 200, 138, 0.1)",
      badgeTextColor: "var(--color-success)",
      color: "var(--color-success)",
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
          SGA - Secrétariat Général Académique 🎓
        </h2>
        <p style={{
          fontSize: '0.95rem',
          color: 'var(--color-textSecondary)',
          margin: 0,
        }}>
          Bienvenue {user?.name} | Gestion Académique Globale
        </p>
      </motion.div>

      <Row className="mb-4">
        <Col xl={3} lg={6} md={6} sm={12} className="mb-4">
          <StatCard
            title="Sections Actives"
            value={loading ? '...' : stats.total_sections?.toString() || '0'}
            icon={FiGrid}
            color="primary"
            subtitle="Toutes facultés"
            delay={0}
          />
        </Col>
        <Col xl={3} lg={6} md={6} sm={12} className="mb-4">
          <StatCard
            title="Auditoires"
            value={loading ? '...' : stats.total_auditoires?.toString() || '0'}
            icon={FiUsers}
            color="success"
            subtitle="Actifs"
            delay={0.1}
          />
        </Col>
        <Col xl={3} lg={6} md={6} sm={12} className="mb-4">
          <StatCard
            title="Étudiants Inscrits"
            value={loading ? '...' : stats.total_students?.toString() || '0'}
            icon={FiUsers}
            color="info"
            trend="up"
            trendValue="+12% ce semestre"
            delay={0.2}
          />
        </Col>
        <Col xl={3} lg={6} md={6} sm={12} className="mb-4">
          <StatCard
            title="Inscris en Attente"
            value={loading ? '...' : stats.pending_inscriptions?.toString() || '0'}
            icon={FiAlertCircle}
            color="warning"
            subtitle="À traiter"
            delay={0.3}
          />
        </Col>
      </Row>

      {/* Nouvelles stats pour Cours et Enseignants */}
      <Row className="mb-4">
        <Col xl={6} lg={6} md={6} sm={12} className="mb-4">
          <StatCard
            title="Cours Actifs"
            value={loading ? '...' : stats.total_courses?.toString() || '0'}
            icon={FiBook}
            color="purple"
            subtitle="Tous les cours"
            delay={0.35}
          />
        </Col>
        <Col xl={6} lg={6} md={6} sm={12} className="mb-4">
          <StatCard
            title="Enseignants"
            value={loading ? '...' : stats.total_teachers?.toString() || '0'}
            icon={FiUser}
            color="danger"
            subtitle="Enseignants et assistants"
            delay={0.4}
          />
        </Col>
      </Row>

      {!loading && sections.length > 0 && (
        <Row className="mb-4">
          <Col lg={6} className="mb-4">
            <ChartCard
              title="Répartition des Étudiants par Section"
              subtitle="Top 6 sections"
              chartType="doughnut"
              data={sectionsData}
              delay={0.4}
              height={300}
            />
          </Col>
          <Col lg={6} className="mb-4">
            <ChartCard
              title="Performance Académique Globale"
              subtitle="Évolution sur 6 mois"
              chartType="line"
              data={performanceData}
              delay={0.45}
              height={300}
            />
          </Col>
        </Row>
      )}

      <Row className="mb-4">
        <Col xl={4} lg={12} className="mb-4">
          <CalendarWidget
            events={calendarEvents.map(e => ({ date: new Date(e.date) }))}
            delay={0.5}
          />
        </Col>
        <Col xl={4} lg={6} className="mb-4">
          <ScheduleWidget
            schedule={sgaSchedule}
            date={new Date()}
            delay={0.6}
          />
        </Col>
        <Col xl={4} lg={6} className="mb-4">
          <RecentActivity
            activities={sgaActivities}
            delay={0.7}
          />
        </Col>
      </Row>

    </Container>
  )
}

export default SGADashboard
