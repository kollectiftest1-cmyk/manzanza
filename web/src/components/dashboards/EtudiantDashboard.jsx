import { Container, Row, Col } from "react-bootstrap"
import { LinkContainer } from "react-router-bootstrap"
import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { motion } from "framer-motion"
import { fetchAssignments } from "../../store/slices/assignmentsSlice"
import StatCard from "../StatCard"
import ChartCard from "../ChartCard"
import CalendarWidget from "../CalendarWidget"
import ScheduleWidget from "../ScheduleWidget"
import RecentActivity from "../RecentActivity"
import { FiBook, FiFileText, FiTrendingUp, FiAward, FiCalendar, FiCheckCircle } from "react-icons/fi"
import scheduleService from "../../services/scheduleService"
import gradeService from "../../services/gradeService"

const SCHEDULE_COLORS = ['var(--color-primary)', 'var(--color-success)', 'var(--color-warning)', 'var(--color-danger)', '#6f42c1', '#fd7e14']

function transformScheduleItems(items) {
  return (items || []).map((s, i) => ({
    title: s.course_name || s.course?.name || 'Cours',
    description: s.type ? (s.type === 'tp' ? 'TP' : s.type === 'td' ? 'TD' : 'Cours magistral') : 'Cours',
    time: s.timeslot ? `${s.timeslot.start_time?.slice(0, 5)} - ${s.timeslot.end_time?.slice(0, 5)}` : '',
    location: s.room?.name || s.room_name || '',
    participants: s.auditoire_name || s.auditoire?.nom || '',
    badge: s.timeslot?.day ? ['Lun','Mar','Mer','Jeu','Ven','Sam'][['monday','tuesday','wednesday','thursday','friday','saturday'].indexOf(s.timeslot.day)] || s.timeslot.day : '',
    color: SCHEDULE_COLORS[i % SCHEDULE_COLORS.length],
  }))
}

const EtudiantDashboard = ({ user, courses, notifications }) => {
  const dispatch = useDispatch()
  const { assignments } = useSelector((state) => state.assignments)
  const [weekSchedule, setWeekSchedule] = useState([])
  const [calendarEvents, setCalendarEvents] = useState([])
  const [studentGradeCourses, setStudentGradeCourses] = useState([])

  useEffect(() => {
    dispatch(fetchAssignments({ status: 'pending' }))
    scheduleService.getMySchedule()
      .then(data => {
        const items = Array.isArray(data) ? data : data?.results || []
        setWeekSchedule(transformScheduleItems(items))
        setCalendarEvents(items
          .filter(item => item.date || item.start_date || item.module_start_date)
          .map(item => ({ date: new Date(item.date || item.start_date || item.module_start_date) })))
      })
      .catch(() => {
        setWeekSchedule([])
        setCalendarEvents([])
      })
    gradeService.getMyGrades()
      .then(res => setStudentGradeCourses(Array.isArray(res.data) ? res.data : []))
      .catch(() => setStudentGradeCourses([]))
  }, [dispatch])

  const upcomingAssignments = (assignments || [])
    .filter(a => a.status === 'published' && new Date(a.due_date) > new Date())
    .slice(0, 3)

  // Get student stats from user object
  const stats = user?.student_stats || {}

  // Calculate average grade from stats or courses (fallback)
  const averageGradeFromCourses = studentGradeCourses.filter(course => course.average !== null && course.average !== undefined)
  const averageGrade = stats.average_grade || (averageGradeFromCourses.length > 0
    ? Math.round(averageGradeFromCourses.reduce((sum, course) => sum + Number(course.average || 0), 0) / averageGradeFromCourses.length)
    : courses.length > 0
      ? Math.round(courses.reduce((sum, c) => sum + (c.average_grade || 0), 0) / courses.length) || 0
      : 0)

  // Get pending quizzes count from stats
  const pendingQuizzes = stats.pending_quizzes || 0

  // Calculate attendance rate (should come from backend)
  const attendanceRate = user?.attendance_rate || stats.attendance_rate || 0

  // Données pour le graphique de progression
  const progressData = {
    labels: courses.slice(0, 6).map(c => c.name?.substring(0, 15) || 'Cours'),
    datasets: [{
      label: 'Progression (%)',
      data: courses.slice(0, 6).map(c => Number(c.progress || c.progress_percentage || 0)),
      backgroundColor: 'rgba(78, 115, 223, 0.8)',
      borderColor: 'rgb(78, 115, 223)',
      borderWidth: 2,
      borderRadius: 8,
    }]
  }

  // Données pour le graphique des notes
  const gradesData = {
    labels: studentGradeCourses.length ? studentGradeCourses.slice(0, 6).map(course => course.course_name?.substring(0, 15) || 'Cours') : ['Aucune donnée'],
    datasets: [{
      label: 'Moyenne',
      data: studentGradeCourses.length ? studentGradeCourses.slice(0, 6).map(course => Number(course.average || 0)) : [0],
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

  // weekSchedule populated from API (see useEffect)

  // Activités récentes
  const assignmentActivities = upcomingAssignments.map((assignment, index) => ({
    id: `assignment-${assignment.id || index}`,
    type: 'file',
    title: assignment.title || 'TP/TD à rendre',
    description: assignment.course_name || assignment.description || '',
    time: assignment.due_date ? new Date(assignment.due_date).toLocaleDateString('fr-FR') : '',
  }))
  const notificationActivities = (Array.isArray(notifications) ? notifications : []).slice(0, 4).map((notification, index) => ({
    id: `notification-${notification.id || index}`,
    type: notification.notification_type === 'quiz' ? 'award' : notification.notification_type === 'assignment' ? 'file' : 'check',
    title: notification.title || 'Notification',
    description: notification.message || notification.description || '',
    time: notification.created_at ? new Date(notification.created_at).toLocaleDateString('fr-FR') : '',
  }))
  const recentActivities = [...assignmentActivities, ...notificationActivities].slice(0, 4)
  /*
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
  */

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
            events={calendarEvents}
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
