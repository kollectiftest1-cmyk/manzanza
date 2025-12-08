import { Container, Row, Col } from "react-bootstrap"
import { LinkContainer } from "react-router-bootstrap"
import { useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { motion } from "framer-motion"
import { fetchAssignments } from "../../store/slices/assignmentsSlice"
import StatCard from "../StatCard"
import ChartCard from "../ChartCard"
import CalendarWidget from "../CalendarWidget"
import ScheduleWidget from "../ScheduleWidget"
import RecentActivity from "../RecentActivity"
import { FiBook, FiFileText, FiTrendingUp, FiAward, FiCalendar, FiCheckCircle } from "react-icons/fi"

const EtudiantDashboard = ({ user, courses, notifications }) => {
  const dispatch = useDispatch()
  const { assignments } = useSelector((state) => state.assignments)

  useEffect(() => {
    dispatch(fetchAssignments({ status: 'pending' }))
  }, [dispatch])

  const upcomingAssignments = (assignments || [])
    .filter(a => a.status === 'published' && new Date(a.due_date) > new Date())
    .slice(0, 3)

  // Get student stats from user object
  const stats = user?.student_stats || {}

  // Calculate average grade from stats or courses (fallback)
  const averageGrade = stats.average_grade || (courses.length > 0
    ? Math.round(courses.reduce((sum, c) => sum + (c.average_grade || 0), 0) / courses.length) || 0
    : 0)

  // Get pending quizzes count from stats
  const pendingQuizzes = stats.pending_quizzes || 0

  // Calculate attendance rate (should come from backend)
  const attendanceRate = user?.attendance_rate || 85

  // Données pour le graphique de progression
  const progressData = {
    labels: courses.slice(0, 6).map(c => c.name?.substring(0, 15) || 'Cours'),
    datasets: [{
      label: 'Progression (%)',
      data: courses.slice(0, 6).map(c => c.progress || Math.floor(Math.random() * 40 + 60)),
      backgroundColor: 'rgba(78, 115, 223, 0.8)',
      borderColor: 'rgb(78, 115, 223)',
      borderWidth: 2,
      borderRadius: 8,
    }]
  }

  // Données pour le graphique des notes
  const gradesData = {
    labels: ['Sep', 'Oct', 'Nov', 'Déc', 'Jan', 'Fév'],
    datasets: [{
      label: 'Moyenne',
      data: [65, 68, 72, 75, 78, averageGrade],
      borderColor: 'rgb(28, 200, 138)',
      backgroundColor: 'rgba(28, 200, 138, 0.1)',
      tension: 0.4,
      fill: true,
      pointBackgroundColor: 'rgb(28, 200, 138)',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 5,
    }]
  }

  // Planning de la semaine
  const weekSchedule = [
    {
      title: "Mathématiques Avancées",
      description: "Cours magistral",
      time: "8:00 AM - 10:00 AM",
      location: "Amphithéâtre A",
      participants: user?.auditoire || "Auditoire 1",
      badge: "Cours",
      color: "var(--color-primary)",
    },
    {
      title: "TP Programmation Web",
      description: "Travaux Pratiques",
      time: "10:30 AM - 12:30 PM",
      location: "Labo Informatique",
      participants: "Groupe B",
      badge: "TP",
      badgeColor: "rgba(28, 200, 138, 0.1)",
      badgeTextColor: "var(--color-success)",
      color: "var(--color-success)",
    },
    {
      title: "Séminaire Innovation",
      description: "Conférence invitée",
      time: "2:00 PM - 4:00 PM",
      location: "Salle C201",
      participants: "Tous les étudiants",
      badge: "Événement",
      badgeColor: "rgba(246, 194, 62, 0.1)",
      badgeTextColor: "var(--color-warning)",
      color: "var(--color-warning)",
    }
  ]

  // Activités récentes
  const recentActivities = [
    {
      id: 1,
      type: "check",
      title: "TP rendu avec succès",
      description: `Votre TP de ${courses[0]?.name || 'Programmation'} a été soumis et est en cours de correction.`,
      time: "Il y a 2h",
      badge: "TP",
      badgeColor: "var(--color-primaryLight)",
      badgeTextColor: "var(--color-primary)",
    },
    {
      id: 2,
      type: "award",
      title: "Nouvelle note disponible",
      description: `Quiz de ${courses[1]?.name || 'Base de données'}: 85/100 - Très bien!`,
      time: "Il y a 1 jour",
      badge: "Note",
      badgeColor: "rgba(28, 200, 138, 0.1)",
      badgeTextColor: "var(--color-success)",
    },
    {
      id: 3,
      type: "file",
      title: "Nouveau document partagé",
      description: "Support de cours - Chapitre 5: Structures de données avancées",
      time: "Il y a 2 jours",
    },
    {
      id: 4,
      type: "trending",
      title: "Amélioration de la moyenne",
      description: "Votre moyenne a augmenté de 3 points ce mois. Continuez!",
      time: "Il y a 3 jours",
    }
  ]

  return (
    <Container fluid style={{ padding: '24px', background: 'var(--color-bodyBg)', minHeight: '100vh' }}>
      {/* Welcome Section */}
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
          Bonjour, {user?.name}! 👋
        </h2>
        <p style={{
          fontSize: '0.95rem',
          color: 'var(--color-textSecondary)',
          margin: 0,
        }}>
          Auditoire: {user?.auditoire || 'N/A'} | Section: {user?.section || 'N/A'}
        </p>
      </motion.div>

      {/* Student Stats */}
      <Row className="mb-4">
        <Col xl={3} lg={6} md={6} sm={12} className="mb-4">
          <StatCard
            title="Cours Inscrits"
            value={courses.length.toString()}
            icon={FiBook}
            color="primary"
            subtitle="Ce semestre"
            delay={0}
          />
        </Col>
        <Col xl={3} lg={6} md={6} sm={12} className="mb-4">
          <StatCard
            title="Quiz à Faire"
            value={pendingQuizzes.toString()}
            icon={FiCheckCircle}
            color="danger"
            trend={pendingQuizzes > 0 ? "neutral" : "up"}
            trendValue={pendingQuizzes > 0 ? "En attente" : "Rien pour l'instant"}
            delay={0.1}
          />
        </Col>
        <Col xl={3} lg={6} md={6} sm={12} className="mb-4">
          <StatCard
            title="TP/TD à Rendre"
            value={upcomingAssignments.length.toString()}
            icon={FiFileText}
            color="warning"
            trend={upcomingAssignments.length > 3 ? "neutral" : "up"}
            trendValue={upcomingAssignments.length > 3 ? "À faire bientôt" : "Bon travail!"}
            delay={0.2}
          />
        </Col>
        <Col xl={3} lg={6} md={6} sm={12} className="mb-4">
          <StatCard
            title="Moyenne Générale"
            value={`${averageGrade}%`}
            icon={FiTrendingUp}
            color="success"
            trend="up"
            trendValue="+3% ce mois"
            delay={0.3}
          />
        </Col>
      </Row>

      {/* Graphiques */}
      <Row className="mb-4">
        <Col xl={8} lg={7} className="mb-4">
          <ChartCard
            title="Évolution de la Moyenne"
            subtitle="6 derniers mois"
            chartType="line"
            data={gradesData}
            delay={0.4}
            height={300}
          />
        </Col>
        <Col xl={4} lg={5} className="mb-4">
          <ChartCard
            title="Progression des Cours"
            subtitle="Top 6 cours"
            chartType="bar"
            data={progressData}
            delay={0.5}
            height={300}
          />
        </Col>
      </Row>

      {/* Calendrier, Planning et Activités */}
      <Row className="mb-4">
        <Col xl={4} lg={12} className="mb-4">
          <CalendarWidget
            events={[
              { date: new Date() },
              { date: new Date(Date.now() + 86400000 * 3) },
              { date: new Date(Date.now() + 86400000 * 7) },
            ]}
            delay={0.6}
          />
        </Col>
        <Col xl={4} lg={6} className="mb-4">
          <ScheduleWidget
            schedule={weekSchedule}
            date={new Date()}
            delay={0.7}
          />
        </Col>
        <Col xl={4} lg={6} className="mb-4">
          <RecentActivity
            activities={recentActivities}
            delay={0.8}
          />
        </Col>
      </Row>

      {/* Mes Cours - Liste détaillée */}
      <Row className="mb-4">
        <Col lg={12}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.4 }}
            style={{
              background: 'var(--color-cardBg)',
              border: '1px solid var(--color-cardBorder)',
              borderRadius: '12px',
              padding: '20px',
              boxShadow: 'var(--color-cardShadow)',
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
            }}>
              <h5 style={{
                margin: 0,
                fontSize: '1.1rem',
                fontWeight: '700',
                color: 'var(--color-textPrimary)',
              }}>
                Mes Cours
              </h5>
              <LinkContainer to="/courses">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    background: 'var(--color-primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    fontWeight: '600',
                  }}
                >
                  Voir tous
                </motion.button>
              </LinkContainer>
            </div>

            <Row>
              {courses.slice(0, 6).map((course, index) => (
                <Col key={course.id} xl={4} lg={6} md={6} className="mb-3">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.9 + (index * 0.1) }}
                    whileHover={{ y: -5 }}
                    style={{
                      background: 'var(--color-bodyBg)',
                      borderRadius: '10px',
                      padding: '16px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    <h6 style={{
                      fontSize: '0.95rem',
                      fontWeight: '700',
                      color: 'var(--color-textPrimary)',
                      marginBottom: '8px',
                    }}>
                      {course.name}
                    </h6>
                    <p style={{
                      fontSize: '0.85rem',
                      color: 'var(--color-textSecondary)',
                      marginBottom: '12px',
                    }}>
                      Prof. {course.teacher || 'N/A'}
                    </p>
                    <div style={{
                      marginBottom: '8px',
                    }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '4px',
                      }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-textMuted)' }}>
                          Progression
                        </span>
                        <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--color-primary)' }}>
                          {course.progress || 70}%
                        </span>
                      </div>
                      <div style={{
                        width: '100%',
                        height: '6px',
                        background: 'var(--color-border)',
                        borderRadius: '3px',
                        overflow: 'hidden',
                      }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${course.progress || 70}%` }}
                          transition={{ delay: 1 + (index * 0.1), duration: 0.5 }}
                          style={{
                            height: '100%',
                            background: 'var(--color-primary)',
                            borderRadius: '3px',
                          }}
                        />
                      </div>
                    </div>
                    <LinkContainer to={`/courses/${course.id}`}>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        style={{
                          width: '100%',
                          background: 'transparent',
                          border: '1px solid var(--color-border)',
                          borderRadius: '6px',
                          padding: '8px',
                          cursor: 'pointer',
                          color: 'var(--color-primary)',
                          fontSize: '0.85rem',
                          fontWeight: '600',
                          marginTop: '8px',
                        }}
                      >
                        Accéder au cours
                      </motion.button>
                    </LinkContainer>
                  </motion.div>
                </Col>
              ))}
            </Row>
          </motion.div>
        </Col>
      </Row>
    </Container>
  )
}

export default EtudiantDashboard
