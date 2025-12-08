import { Container, Row, Col } from "react-bootstrap"
import { LinkContainer } from "react-router-bootstrap"
import { motion } from "framer-motion"
import StatCard from "../StatCard"
import ChartCard from "../ChartCard"
import CalendarWidget from "../CalendarWidget"
import ScheduleWidget from "../ScheduleWidget"
import RecentActivity from "../RecentActivity"
import { FiBook, FiUsers, FiStar, FiFileText, FiCheckCircle, FiAward } from "react-icons/fi"

const EnseignantDashboard = ({ user, notifications }) => {
  // All data now comes directly from the user object
  const myCourses = user?.courses || []
  const teacherStats = user?.teacher_stats || {}
  const myAssignments = user?.assignments || [] // Assuming assignments might be added to user object

  const pendingGrades = myAssignments.filter(a => a.status === 'published').length
  const totalStudents = teacherStats.total_students_managed || 0
  const coursesTaughtCount = teacherStats.courses_taught_count || myCourses.length

  // Extract sections and filieres from the user object
  const sections = user?.sections?.map(s => s.nom).join(', ') || "N/A"
  const filieres = user?.filieres?.map(f => f.nom).join(', ') || "N/A"

  // Données pour graphique des étudiants par cours
  const studentsPerCourseData = {
    labels: myCourses.slice(0, 6).map(c => c.name?.substring(0, 15) || 'Cours'),
    datasets: [{
      label: 'Étudiants',
      data: myCourses.slice(0, 6).map(c => c.students_count || Math.floor(Math.random() * 50 + 20)),
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

  // Données pour graphique de performance
  const performanceData = {
    labels: ['Semaine 1', 'Semaine 2', 'Semaine 3', 'Semaine 4'],
    datasets: [{
      label: 'Moyenne de classe',
      data: [72, 75, 78, 80],
      borderColor: 'rgb(78, 115, 223)',
      backgroundColor: 'rgba(78, 115, 223, 0.1)',
      tension: 0.4,
      fill: true,
    }, {
      label: 'Taux de participation',
      data: [85, 88, 90, 92],
      borderColor: 'rgb(28, 200, 138)',
      backgroundColor: 'rgba(28, 200, 138, 0.1)',
      tension: 0.4,
      fill: true,
    }]
  }

  // Planning enseignant
  const teacherSchedule = [
    {
      title: "Cours de Mathématiques",
      description: "Licence 2 - Algèbre Linéaire",
      time: "8:00 AM - 10:00 AM",
      location: "Amphithéâtre A",
      participants: "120 étudiants",
      badge: "Cours",
      color: "var(--color-primary)",
    },
    {
      title: "Séance de TP",
      description: "Licence 3 - Analyse Numérique",
      time: "10:30 AM - 12:30 PM",
      location: "Salle B201",
      participants: "Groupe A - 30 étudiants",
      badge: "TP",
      badgeColor: "rgba(28, 200, 138, 0.1)",
      badgeTextColor: "var(--color-success)",
      color: "var(--color-success)",
    },
    {
      title: "Permanence",
      description: "Consultation étudiants",
      time: "2:00 PM - 4:00 PM",
      location: "Bureau 305",
      participants: "Sur rendez-vous",
      badge: "Permanence",
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
      title: "Notes saisies",
      description: `Examen de ${myCourses[0]?.name || 'Mathématiques'} - 45 copies corrigées`,
      time: "Il y a 1h",
      badge: "Notation",
      badgeColor: "var(--color-primaryLight)",
      badgeTextColor: "var(--color-primary)",
    },
    {
      id: 2,
      type: "file",
      title: "TP créé",
      description: "Nouveau TP sur les Structures de Données publié pour la Licence 2",
      time: "Il y a 3h",
    },
    {
      id: 3,
      type: "user",
      title: "Message étudiant",
      description: "Question sur le chapitre 4 - Répondu",
      time: "Il y a 5h",
    },
    {
      id: 4,
      type: "award",
      title: "Excellent résultat",
      description: "Votre classe a obtenu une moyenne de 85% au dernier examen",
      time: "Il y a 1 jour",
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
          Espace Enseignant - {user?.name} 👨‍🏫
        </h2>
        <p style={{
          fontSize: '0.95rem',
          color: 'var(--color-textSecondary)',
          margin: 0,
        }}>
          Sections: {sections} | Filières: {filieres}
        </p>
      </motion.div>

      {/* Teacher Stats */}
      <Row className="mb-4">
        <Col xl={3} lg={6} md={6} sm={12} className="mb-4">
          <StatCard
            title="Cours Enseignés"
            value={coursesTaughtCount.toString()}
            icon={FiBook}
            color="primary"
            subtitle="Ce semestre"
            delay={0}
          />
        </Col>
        <Col xl={3} lg={6} md={6} sm={12} className="mb-4">
          <StatCard
            title="Total Étudiants"
            value={totalStudents.toString()}
            icon={FiUsers}
            color="success"
            trend="up"
            trendValue="+5 ce mois"
            delay={0.1}
          />
        </Col>
        <Col xl={3} lg={6} md={6} sm={12} className="mb-4">
          <StatCard
            title="Notes à Saisir"
            value={pendingGrades.toString()}
            icon={FiStar}
            color="warning"
            trend={pendingGrades > 5 ? "neutral" : "up"}
            trendValue={pendingGrades > 5 ? "À corriger" : "Presque fini!"}
            delay={0.2}
          />
        </Col>
        <Col xl={3} lg={6} md={6} sm={12} className="mb-4">
          <StatCard
            title="TP/TD Créés"
            value={myAssignments.length.toString()}
            icon={FiFileText}
            color="info"
            subtitle="Total"
            delay={0.3}
          />
        </Col>
      </Row>

      {/* Graphiques */}
      <Row className="mb-4">
        <Col xl={8} lg={7} className="mb-4">
          <ChartCard
            title="Performance des Classes"
            subtitle="Dernières 4 semaines"
            chartType="line"
            data={performanceData}
            delay={0.4}
            height={300}
          />
        </Col>
        <Col xl={4} lg={5} className="mb-4">
          <ChartCard
            title="Étudiants par Cours"
            subtitle="Répartition actuelle"
            chartType="doughnut"
            data={studentsPerCourseData}
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
              { date: new Date(Date.now() + 86400000 * 2) },
              { date: new Date(Date.now() + 86400000 * 5) },
            ]}
            delay={0.6}
          />
        </Col>
        <Col xl={4} lg={6} className="mb-4">
          <ScheduleWidget
            schedule={teacherSchedule}
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
              {myCourses.slice(0, 6).map((course, index) => (
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
                      position: 'relative',
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '12px',
                    }}>
                      <div style={{ flex: 1 }}>
                        <h6 style={{
                          fontSize: '0.95rem',
                          fontWeight: '700',
                          color: 'var(--color-textPrimary)',
                          marginBottom: '4px',
                        }}>
                          {course.name}
                        </h6>
                        <p style={{
                          fontSize: '0.75rem',
                          color: 'var(--color-textMuted)',
                          margin: 0,
                        }}>
                          {course.code}
                        </p>
                      </div>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        background: 'var(--color-primaryLight)',
                        color: 'var(--color-primary)',
                      }}>
                        {course.credits} crédits
                      </span>
                    </div>

                    <div style={{
                      display: 'flex',
                      gap: '12px',
                      marginBottom: '12px',
                      fontSize: '0.85rem',
                      color: 'var(--color-textSecondary)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <FiUsers size={14} />
                        <span>{course.students_count || 0} étudiants</span>
                      </div>
                    </div>

                    <p style={{
                      fontSize: '0.8rem',
                      color: 'var(--color-textMuted)',
                      marginBottom: '12px',
                    }}>
                      Auditoire: {course.auditoire_detail?.nom || 'N/A'}
                    </p>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '8px'
                    }}>
                      <LinkContainer to={`/courses/${course.id}`}>
                        <motion.button
                          whileHover={{ scale: 1.05, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          style={{
                            background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '10px 12px',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            boxShadow: '0 2px 8px rgba(78, 115, 223, 0.3)',
                            transition: 'all 0.3s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px'
                          }}
                        >
                          <FiBook size={14} />
                          Détails
                        </motion.button>
                      </LinkContainer>

                      <LinkContainer to="/teacher/assignments">
                        <motion.button
                          whileHover={{ scale: 1.05, y: -2 }}
                          whileTap={{ scale: 0.95 }}
                          style={{
                            background: 'var(--color-bodyBg)',
                            color: 'var(--color-primary)',
                            border: '2px solid var(--color-primary)',
                            borderRadius: '8px',
                            padding: '10px 12px',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            transition: 'all 0.3s ease',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px'
                          }}
                        >
                          <FiFileText size={14} />
                          TP/TD
                        </motion.button>
                      </LinkContainer>
                    </div>
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

export default EnseignantDashboard
