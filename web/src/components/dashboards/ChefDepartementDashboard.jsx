import { Container, Row, Col } from "react-bootstrap"
import { useSelector, useDispatch } from "react-redux"
import { useEffect } from "react"
import { motion } from "framer-motion"
import { Link } from "react-router-dom"
import { fetchAuditoires } from "../../store/slices/auditoiresSlice"
import { fetchCourses } from "../../store/slices/coursesSlice"
import StatCard from "../StatCard"
import ChartCard from "../ChartCard"
import CalendarWidget from "../CalendarWidget"
import ScheduleWidget from "../ScheduleWidget"
import RecentActivity from "../RecentActivity"
import { FiGrid, FiUsers, FiUserCheck, FiBook } from "react-icons/fi"

const ChefDepartementDashboard = () => {
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)
  const { auditoires } = useSelector((state) => state.auditoires)
  const { courses } = useSelector((state) => state.courses)

  const userFiliereId = user?.filiere;
  console.log('e',auditoires);

  useEffect(() => {
    if (userFiliereId) {
      dispatch(fetchAuditoires({ filiere: userFiliereId }))
      dispatch(fetchCourses({ filiere: userFiliereId }))
    } else {
      console.warn("L'ID de la filière de l'utilisateur n'est pas disponible. Impossible de filtrer les auditoires et les cours.")
    }
  }, [dispatch, userFiliereId])

  const departementAuditoires = (auditoires && auditoires.results) ? auditoires.results : auditoires || [];
  const departementCourses = (courses && courses.results) ? courses.results : courses || [];

  // Calculer le nombre total d'enseignants UNIQUES (titulaires + assistants)
  const uniqueTeachers = new Set();
  departementCourses.forEach(course => {
    // Ajouter le titulaire (support ancien et nouveau format)
    const titulaire = course.titulaire_detail || course.titulaire;
    if (titulaire?.id) {
      uniqueTeachers.add(titulaire.id);
    }

    // Ajouter tous les assistants (support ancien et nouveau format)
    const assistants = course.assistants_detail || course.assistants || [];
    if (Array.isArray(assistants)) {
      assistants.forEach(assistant => {
        if (assistant?.id) {
          uniqueTeachers.add(assistant.id);
        }
      });
    }
  });

  const departementStats = {
    totalAuditoires: departementAuditoires.length,
    totalEtudiants: departementAuditoires.reduce((sum, aud) => sum + (aud.etudiants_count || 0), 0),
    totalEnseignants: uniqueTeachers.size,
    coursActifs: departementCourses.filter(c => c.is_active).length,
  }

  const auditoiresData = {
    labels: departementAuditoires.slice(0, 6).map(a => a.nom),
    datasets: [{
      label: 'Étudiants par auditoire',
      data: departementAuditoires.slice(0, 6).map(a => a.etudiants_count || 0),
      backgroundColor: 'rgba(78, 115, 223, 0.8)',
      borderRadius: 8,
    }]
  }

  const deptActivities = [
    {
      id: 1,
      type: "check",
      title: "Nouveau cours validé",
      description: "Le cours de Statistiques Avancées a été approuvé",
      time: "Il y a 2h",
    },
    {
      id: 2,
      type: "user",
      title: "Enseignant assigné",
      description: "Prof. Dubois assigné à 3 nouveaux cours",
      time: "Il y a 1 jour",
    },
  ]

  const deptSchedule = [
    {
      title: "Réunion département",
      description: "Coordination pédagogique",
      time: "10:00 AM - 12:00 PM",
      location: "Salle B201",
      badge: "Réunion",
      color: "var(--color-primary)",
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
          Chef de Filière 🏛️
        </h2>
        <p style={{
          fontSize: '0.95rem',
          color: 'var(--color-textSecondary)',
          margin: 0,
        }}>
          Filière: {user?.departement?.nom || user?.filiere_name || "Sciences Économiques et de Gestion"}
        </p>
      </motion.div>

      <Row className="mb-4">
        <Col xl={3} lg={6} md={6} sm={12} className="mb-4">
          <StatCard
            title="Auditoires"
            value={departementStats.totalAuditoires.toString()}
            icon={FiGrid}
            color="primary"
            subtitle="Du département"
            delay={0}
          />
        </Col>
        <Col xl={3} lg={6} md={6} sm={12} className="mb-4">
          <StatCard
            title="Étudiants"
            value={departementStats.totalEtudiants.toString()}
            icon={FiUsers}
            color="success"
            subtitle="Inscrits"
            delay={0.1}
          />
        </Col>
        <Col xl={3} lg={6} md={6} sm={12} className="mb-4">
          <StatCard
            title="Enseignants"
            value={departementStats.totalEnseignants.toString()}
            icon={FiUserCheck}
            color="warning"
            subtitle="Actifs"
            delay={0.2}
          />
        </Col>
        <Col xl={3} lg={6} md={6} sm={12} className="mb-4">
          <StatCard
            title="Cours Actifs"
            value={departementStats.coursActifs.toString()}
            icon={FiBook}
            color="info"
            subtitle="Ce semestre"
            delay={0.3}
          />
        </Col>
      </Row>

      {departementAuditoires.length > 0 && (
        <Row className="mb-4">
          <Col lg={12}>
            <ChartCard
              title="Étudiants par Auditoire"
              subtitle="Top 6 auditoires"
              chartType="bar"
              data={auditoiresData}
              delay={0.4}
              height={300}
            />
          </Col>
        </Row>
      )}

      <Row className="mb-4">
        <Col xl={4} lg={12} className="mb-4">
          <CalendarWidget
            events={[]}
            delay={0.5}
          />
        </Col>
        <Col xl={4} lg={6} className="mb-4">
          <ScheduleWidget
            schedule={deptSchedule}
            date={new Date()}
            delay={0.6}
          />
        </Col>
        <Col xl={4} lg={6} className="mb-4">
          <RecentActivity
            activities={deptActivities}
            delay={0.7}
          />
        </Col>
      </Row>

      {departementAuditoires.length > 0 && (
        <Row className="mb-4">
          <Col lg={12}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.4 }}
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
                  Auditoires du Département
                </h5>
                <Link to="/auditoires">
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
                    Gérer tous
                  </motion.button>
                </Link>
              </div>

              <Row>
                {departementAuditoires.slice(0, 6).map((auditoire, index) => (
                  <Col key={auditoire.id} xl={4} lg={6} md={6} className="mb-3">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.8 + (index * 0.1) }}
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
                        {auditoire.nom}
                      </h6>
                      <p style={{
                        fontSize: '0.8rem',
                        color: 'var(--color-textMuted)',
                        marginBottom: '12px',
                      }}>
                        {auditoire.niveau} - {auditoire.filiere_name}
                      </p>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '8px',
                      }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--color-textSecondary)' }}>
                          <FiUsers size={14} style={{ marginRight: '4px' }} />
                          {auditoire.etudiants_count || 0} étudiants
                        </span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--color-textSecondary)' }}>
                          <FiBook size={14} style={{ marginRight: '4px' }} />
                          {auditoire.cours_count || 0} cours
                        </span>
                      </div>
                    </motion.div>
                  </Col>
                ))}
              </Row>
            </motion.div>
          </Col>
        </Row>
      )}
    </Container>
  )
}

export default ChefDepartementDashboard
