import { Container, Row, Col, Card, Button, Table, Badge, Alert } from "react-bootstrap"
import { useSelector } from "react-redux"
import { useState, useEffect } from "react"
import { usersAPI, coursesAPI, auditoiresAPI } from "../../services/api"
import { Link } from "react-router-dom" // Assuming you want to link to course details

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

  return (
    <Container fluid className="py-0">
      <Row className="mb-4 dashboard-card">
        <Col>
          <h2 className="text-primary fw-bold">Tableau de Bord - Chef de Section</h2>
          {/* Use user?.section_name which is now provided by the serializer */}
          <p className="text-muted">Section: {user?.section_name || "Chargement..."}</p>
        </Col>
      </Row>

      {loading && <Alert variant="info">Chargement des données du tableau de bord...</Alert>}
      {error && <Alert variant="danger">{error}</Alert>}

      {!loading && !error && (
        <>
          {/* Statistics Cards */}
          <Row className="mb-4">
            <Col md={3}>
              <Card className="card-custom text-center">
                <Card.Body>
                  <i className="fas fa-users fa-2x text-primary mb-3"></i>
                  <h4 className="fw-bold">{sectionStats.totalEtudiants}</h4>
                  <p className="text-muted mb-0">Étudiants</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="card-custom text-center">
                <Card.Body>
                  <i className="fas fa-chalkboard-teacher fa-2x text-success mb-3"></i>
                  <h4 className="fw-bold">{sectionStats.totalEnseignants}</h4>
                  <p className="text-muted mb-0">Enseignants</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="card-custom text-center">
                <Card.Body>
                  <i className="fas fa-book fa-2x text-warning mb-3"></i>
                  <h4 className="fw-bold">{sectionStats.coursActifs}</h4>
                  <p className="text-muted mb-0">Cours Actifs</p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="card-custom text-center">
                <Card.Body>
                  <i className="fas fa-door-open fa-2x text-info mb-3"></i>
                  <h4 className="fw-bold">{sectionStats.auditoires}</h4>
                  <p className="text-muted mb-0">Auditoires</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row>
            <Col lg={8}>
              <Card className="card-custom">
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <h5 className="fw-bold mb-0">Gestion des Cours</h5>
                  <Button size="sm" className="btn-primary-custom" as={Link} to="/courses">
                    <i className="fas fa-plus me-1"></i>
                    Gérer les Cours
                  </Button>
                </Card.Header>
                <Card.Body>
                  <Table responsive hover>
                    <thead>
                      <tr>
                        <th>Cours</th>
                        <th>Enseignant</th>
                        <th>Étudiants</th>
                        <th>Statut</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {coursSection.length > 0 ? (
                        coursSection.map((cours) => (
                          <tr key={cours.id}>
                            <td className="fw-semibold">{cours.nom} ({cours.code})</td>
                            <td>{cours.enseignant}</td>
                            <td>{cours.etudiants}</td>
                            <td>
                              <Badge bg={cours.statut === "Actif" ? "success" : "danger"}>{cours.statut}</Badge>
                            </td>
                            <td>
                              <Button size="sm" variant="outline-primary" className="me-1" as={Link} to={`/courses/${cours.id}/edit`}>
                                <i className="fas fa-edit"></i>
                              </Button>
                              <Button size="sm" variant="outline-info" as={Link} to={`/courses/${cours.id}`}>
                                <i className="fas fa-eye"></i>
                              </Button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="text-center">Aucun cours trouvé pour cette section.</td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>

            <Col lg={4}>
              <Card className="card-custom mb-4">
                <Card.Header>
                  <h6 className="fw-bold mb-0">Actions Rapides</h6>
                </Card.Header>
                <Card.Body>
                  <div className="d-grid gap-2">
                    <Button variant="outline-primary" as={Link} to="/users?role=enseignant&section=my">
                      <i className="fas fa-user-plus me-2"></i>
                      Gérer les Enseignants
                    </Button>
                    <Button variant="outline-success">
                      <i className="fas fa-calendar me-2"></i>
                      Planning Section
                    </Button>
                    <Button variant="outline-info">
                      <i className="fas fa-chart-bar me-2"></i>
                      Rapports Section
                    </Button>
                    <Button variant="outline-warning">
                      <i className="fas fa-cog me-2"></i>
                      Paramètres Section
                    </Button>
                  </div>
                </Card.Body>
              </Card>

              <Card className="card-custom">
                <Card.Header>
                  <h6 className="fw-bold mb-0">Notifications</h6>
                </Card.Header>
                <Card.Body>
                  <div className="notification-item">
                    <div className="fw-semibold">Nouveau enseignant assigné</div>
                    <small className="text-muted">Il y a 2 heures</small>
                  </div>
                  <div className="notification-item">
                    <div className="fw-semibold">Rapport mensuel disponible</div>
                    <small className="text-muted">Il y a 1 jour</small>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </Container>
  )
}

export default ChefSectionDashboard
