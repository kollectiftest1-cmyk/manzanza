import { Container, Row, Col, Alert } from "react-bootstrap"
import { useSelector } from "react-redux"
import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Link } from "react-router-dom"
import { usersAPI, coursesAPI, auditoiresAPI } from "../../services/api"
import StatCard from "../StatCard"
import ChartCard from "../ChartCard"
import CalendarWidget from "../CalendarWidget"
import ScheduleWidget from "../ScheduleWidget"
import RecentActivity from "../RecentActivity"
import { FiUsers, FiBook, FiUserCheck, FiGrid } from "react-icons/fi"

const ChefSectionDashboard = () => {
  const { user } = useSelector((state) => state.auth)
  const [sectionStats, setSectionStats] = useState({
    totalEtudiants: 0,
    totalEnseignants: 0,
    coursActifs: 0,
    auditoires: 0,
  })
  const [coursSection, setCoursSection] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  console.log("ddd",coursSection);
  

  useEffect(() => {
    // Use user?.section for the ID, as per the provided user object structure
    if (!user || !user.section) { 
      setLoading(false)
      setError("User or section ID not available.")
      return
    }

    const sectionId = user.section; // Get the section ID from the user object

    const fetchDashboardData = async () => {
      setLoading(true)
      setError(null)

      try {
        // Fetch Auditoires count for the section
        const auditoiresRes = await auditoiresAPI.getAll({ filiere__section: sectionId, is_active: true, page_size: 1 })
        const auditoiresCount = auditoiresRes.data.count || 0
        console.log('auditoiresRes',auditoiresRes);
        
        // Fetch Courses for the section
        const coursesRes = await coursesAPI.getAll({ auditoire__filiere__section: sectionId, is_active: true, page_size: 100 }) // Fetch more if needed
        const activeCoursesCount = coursesRes.data.count || 0
        const coursesData = coursesRes.data.results || []

        // Extract unique student and teacher IDs from these courses
        const teacherIds = new Set();
        coursesData.forEach(course => {
            if (course.titulaire) teacherIds.add(course.titulaire);
        });
        
        // Fetch students in the section's auditoires
        let totalStudentsCount = 0;
        // We need to fetch all auditoires for the section to get their student counts
        // const allAuditoiresRes = await auditoiresAPI.getAll({ filiere__section: sectionId, is_active: true, page_size: 100 }); // Fetch all auditoires
        // console.log('student ll',allAuditoiresRes);
        if (auditoiresCount > 0) {
          const allAuditoiresRes = await auditoiresAPI.getAll({ filiere__section: sectionId, is_active: true, page_size: auditoiresCount });
          for (const auditoire of allAuditoiresRes.data.results) {
              const studentsInAuditoireRes = await auditoiresAPI.getStudents(auditoire.id);
              console.log('student ll',studentsInAuditoireRes);
              
              totalStudentsCount += studentsInAuditoireRes.data.count || studentsInAuditoireRes.data.length || 0;
          }
        }
        // if (auditoiresRes.data.results || allAuditoiresRes.data.length) {
        //     for (const auditoire of allAuditoiresRes.data.results) {
        //         const studentsInAuditoireRes = await auditoiresAPI.getStudents(auditoire.id);
        //         console.log('student ll',studentsInAuditoireRes);
                
        //         totalStudentsCount += studentsInAuditoireRes.data.count || studentsInAuditoireRes.data.length || 0;
        //     }
        // }
        
        const teachersCount = teacherIds.size;


        setSectionStats({
          totalEtudiants: totalStudentsCount,
          totalEnseignants: teachersCount,
          coursActifs: activeCoursesCount,
          auditoires: auditoiresCount,
        })

        setCoursSection(coursesData.map(course => ({
          id: course.id,
          nom: course.name,
          enseignant: course.titulaire_name || 'N/A',
          etudiants: course.students_count || 0,
          statut: course.is_active ? "Actif" : "Inactif",
          code: course.code,
        })))

      } catch (err) {
        console.error("Error fetching chef section dashboard data:", err)
        setError("Failed to load dashboard data.")
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [user]) // Re-run when user changes (especially section)

  // Données pour graphiques
  const coursesChartData = {
    labels: coursSection.slice(0, 6).map(c => c.nom?.substring(0, 15) || 'Cours'),
    datasets: [{
      label: 'Étudiants par cours',
      data: coursSection.slice(0, 6).map(c => c.etudiants || 0),
      backgroundColor: 'rgba(78, 115, 223, 0.8)',
      borderColor: 'rgb(78, 115, 223)',
      borderWidth: 2,
      borderRadius: 8,
    }]
  }

  const sectionActivities = [
    {
      id: 1,
      type: "user",
      title: "Nouveau enseignant assigné",
      description: "Prof. Martin a été assigné au cours de Mathématiques",
      time: "Il y a 2h",
    },
    {
      id: 2,
      type: "file",
      title: "Rapport mensuel disponible",
      description: "Consultez les statistiques de performance de la section",
      time: "Il y a 1 jour",
    },
    {
      id: 3,
      type: "check",
      title: "Planning validé",
      description: "Le planning du semestre a été approuvé",
      time: "Il y a 2 jours",
    },
  ]

  const sectionSchedule = [
    {
      title: "Réunion pédagogique",
      description: "Coordination des enseignants",
      time: "10:00 AM - 12:00 PM",
      location: "Salle de réunion",
      badge: "Réunion",
      color: "var(--color-primary)",
    },
    {
      title: "Évaluation des cours",
      description: "Bilan mi-semestre",
      time: "2:00 PM - 4:00 PM",
      location: "Bureau Chef Section",
      badge: "Académique",
      badgeColor: "rgba(28, 200, 138, 0.1)",
      badgeTextColor: "var(--color-success)",
      color: "var(--color-success)",
    }
  ]

  return (
    <Container fluid style={{ padding: '24px', background: 'var(--color-bodyBg)', minHeight: '100vh' }}>
      {/* Header */}
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
          Chef de Faculté 📚
        </h2>
        <p style={{
          fontSize: '0.95rem',
          color: 'var(--color-textSecondary)',
          margin: 0,
        }}>
          Faculté: {user?.section_name || "Chargement..."}
        </p>
      </motion.div>

      {loading && <Alert variant="info">Chargement des données du tableau de bord...</Alert>}
      {error && <Alert variant="danger">{error}</Alert>}

      {!loading && !error && (
        <>
          {/* Statistics Cards */}
          <Row className="mb-4">
            <Col xl={3} lg={6} md={6} sm={12} className="mb-4">
              <StatCard
                title="Étudiants"
                value={sectionStats.totalEtudiants.toString()}
                icon={FiUsers}
                color="primary"
                subtitle="De ma section"
                delay={0}
              />
            </Col>
            <Col xl={3} lg={6} md={6} sm={12} className="mb-4">
              <StatCard
                title="Enseignants"
                value={sectionStats.totalEnseignants.toString()}
                icon={FiUserCheck}
                color="success"
                subtitle="Assignés"
                delay={0.1}
              />
            </Col>
            <Col xl={3} lg={6} md={6} sm={12} className="mb-4">
              <StatCard
                title="Cours Actifs"
                value={sectionStats.coursActifs.toString()}
                icon={FiBook}
                color="warning"
                subtitle="Ce semestre"
                delay={0.2}
              />
            </Col>
            <Col xl={3} lg={6} md={6} sm={12} className="mb-4">
              <StatCard
                title="Auditoires"
                value={sectionStats.auditoires.toString()}
                icon={FiGrid}
                color="info"
                subtitle="Gérés"
                delay={0.3}
              />
            </Col>
          </Row>

          {/* Graphique */}
          {coursSection.length > 0 && (
            <Row className="mb-4">
              <Col lg={12}>
                <ChartCard
                  title="Répartition des Étudiants par Cours"
                  subtitle="Top 6 cours de la section"
                  chartType="bar"
                  data={coursesChartData}
                  delay={0.4}
                  height={300}
                />
              </Col>
            </Row>
          )}

          {/* Calendrier, Planning et Activités */}
          <Row className="mb-4">
            <Col xl={4} lg={12} className="mb-4">
              <CalendarWidget
                events={[
                  { date: new Date() },
                  { date: new Date(Date.now() + 86400000 * 2) },
                ]}
                delay={0.5}
              />
            </Col>
            <Col xl={4} lg={6} className="mb-4">
              <ScheduleWidget
                schedule={sectionSchedule}
                date={new Date()}
                delay={0.6}
              />
            </Col>
            <Col xl={4} lg={6} className="mb-4">
              <RecentActivity
                activities={sectionActivities}
                delay={0.7}
              />
            </Col>
          </Row>

          {/* Liste des cours */}
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
                    Gestion des Cours
                  </h5>
                  <Link to="/courses">
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
                      Gérer tous les cours
                    </motion.button>
                  </Link>
                </div>

                {coursSection.length > 0 ? (
                  <Row>
                    {coursSection.map((cours, index) => (
                      <Col key={cours.id} xl={4} lg={6} md={6} className="mb-3">
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
                                {cours.nom}
                              </h6>
                              <p style={{
                                fontSize: '0.75rem',
                                color: 'var(--color-textMuted)',
                                margin: 0,
                              }}>
                                {cours.code}
                              </p>
                            </div>
                            <span style={{
                              padding: '4px 10px',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              background: cours.statut === "Actif" ? 'rgba(28, 200, 138, 0.1)' : 'rgba(231, 74, 59, 0.1)',
                              color: cours.statut === "Actif" ? 'var(--color-success)' : 'var(--color-danger)',
                            }}>
                              {cours.statut}
                            </span>
                          </div>

                          <p style={{
                            fontSize: '0.85rem',
                            color: 'var(--color-textSecondary)',
                            marginBottom: '8px',
                          }}>
                            Enseignant: {cours.enseignant}
                          </p>

                          <p style={{
                            fontSize: '0.85rem',
                            color: 'var(--color-textSecondary)',
                            marginBottom: '12px',
                          }}>
                            <FiUsers size={14} style={{ marginRight: '4px' }} />
                            {cours.etudiants} étudiants
                          </p>

                          <div style={{ display: 'flex', gap: '8px' }}>
                            <Link to={`/courses/${cours.id}`} style={{ flex: 1 }}>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                style={{
                                  width: '100%',
                                  background: 'var(--color-primary)',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '6px',
                                  padding: '8px',
                                  cursor: 'pointer',
                                  fontSize: '0.85rem',
                                  fontWeight: '600',
                                }}
                              >
                                Voir détails
                              </motion.button>
                            </Link>
                          </div>
                        </motion.div>
                      </Col>
                    ))}
                  </Row>
                ) : (
                  <div style={{
                    padding: '32px',
                    textAlign: 'center',
                    color: 'var(--color-textMuted)',
                  }}>
                    Aucun cours trouvé pour cette section.
                  </div>
                )}
              </motion.div>
            </Col>
          </Row>
        </>
      )}
    </Container>
  )
}

export default ChefSectionDashboard
