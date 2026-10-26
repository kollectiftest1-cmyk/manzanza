import { Container, Row, Col } from "react-bootstrap"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { getSgaDashboardStats } from "../../services/statsService"
import { getAcademicCalendarEvents } from "../../services/coreService"
import api from "../../services/api"
import gradeService from "../../services/gradeService"
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
  const [academicPerformance, setAcademicPerformance] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, calendarRes, auditoiresRes] = await Promise.all([
          getSgaDashboardStats(),
          getAcademicCalendarEvents(),
          api.get('/auditoires/'),
        ])
        setStats(statsRes.data)
        setCalendarEvents(calendarRes.data?.results || calendarRes.data || [])
        const allAuds = auditoiresRes.data?.results || auditoiresRes.data || []
        // Année en cours uniquement (les groupes des années passées gardent le même nom)
        const years = [...new Set(allAuds.map(a => a.annee_academique).filter(Boolean))].sort()
        const current = years[years.length - 1]
        const auditoires = allAuds.filter(a => !current || a.annee_academique === current)
        const bySection = {}
        auditoires.forEach(a => { const k = a.section_name || 'Sans section'; bySection[k] = (bySection[k] || 0) + Number(a.etudiants_count || 0) })
        setSections(Object.entries(bySection).map(([nom, total_students]) => ({ nom, total_students })))
        const performance = await Promise.all(
          auditoires.slice(0, 6).map(auditoire =>
            gradeService.getAuditoireAverages(auditoire.id)
              .then(res => ({
                label: auditoire.nom || `Auditoire ${auditoire.id}`,
                // pourcentage → note sur 20
                average: Math.round(Number(res.data?.auditoire_average || 0) * 20) / 100,
              }))
              .catch(() => ({ label: auditoire.nom || `Auditoire ${auditoire.id}`, average: 0 }))
          )
        )
        setAcademicPerformance(performance)
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
      data: sections.slice(0, 6).map(s => Number(s.total_students || s.etudiants_count || s.students_count || 0)),
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
    labels: academicPerformance.length ? academicPerformance.map(item => item.label) : ['Aucune donnée'],
    datasets: [
      {
        label: 'Moyenne des notes validées (/20)',
        data: academicPerformance.length ? academicPerformance.map(item => item.average) : [0],
        borderColor: '#0e7c86',
        backgroundColor: academicPerformance.map(item => item.average >= 10 ? 'rgba(14, 124, 134, 0.75)' : 'rgba(220, 53, 69, 0.7)'),
        borderRadius: 6,
      },
    ]
  }
  /*
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

  */

  const sgaSchedule = calendarEvents.slice(0, 4).map((event, index) => ({
    title: event.title || event.name || 'Événement académique',
    description: event.description || event.event_type || '',
    time: event.start_date || event.date || '',
    location: event.location || '',
    badge: event.event_type || 'Calendrier',
    color: ['var(--color-primary)', 'var(--color-success)', 'var(--color-warning)', 'var(--color-danger)'][index % 4],
  }))
  /*
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
  */

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
              title="Étudiants inscrits par section"
              subtitle="Année en cours"
              chartType="doughnut"
              data={sectionsData}
              delay={0.4}
              height={300}
            />
          </Col>
          <Col lg={6} className="mb-4">
            <ChartCard
              title="Moyenne par groupe"
              subtitle="Notes validées de l'année en cours, sur 20"
              chartType="bar"
              data={performanceData}
              options={{ scales: { y: { min: 0, max: 20, ticks: { stepSize: 5 } } } }}
              delay={0.45}
              height={300}
            />
          </Col>
        </Row>
      )}

      <Row className="mb-4">
        <Col xl={4} lg={12} className="mb-4">
          <CalendarWidget
            events={calendarEvents.map(e => ({ date: new Date(e.start_date || e.date) }))}
            delay={0.5}
          />
        </Col>
        <Col xl={4} lg={6} className="mb-4">
          <ScheduleWidget
            source="agenda"
            date={new Date()}
            delay={0.6}
          />
        </Col>
        <Col xl={4} lg={6} className="mb-4">
          <RecentActivity
            delay={0.7}
          />
        </Col>
      </Row>

    </Container>
  )
}

export default SGADashboard
