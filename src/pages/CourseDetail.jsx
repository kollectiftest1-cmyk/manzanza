"use client"
import { useState, useEffect } from "react"
import { Container, Row, Col, Card, Button, Badge, Tabs, Tab, ListGroup, Spinner, Alert } from "react-bootstrap"
import { useParams, Link } from "react-router-dom"
import { getCourseDetail } from "../services/courseService"

const CourseDetail = () => {
  const { id } = useParams()
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true)
        const res = await getCourseDetail(id)
        setCourse(res.data)
      } catch (err) {
        setError("Impossible de charger les détails du cours.")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchCourse()
  }, [id])

  if (loading) {
    return <Container className="py-4 text-center"><Spinner animation="border" variant="primary" /></Container>
  }

  if (error) {
    return <Container className="py-4"><Alert variant="danger">{error}</Alert></Container>
  }

  if (!course) {
    return <Container className="py-4"><Alert variant="warning">Cours non trouvé.</Alert></Container>
  }

  return (
    <Container fluid className="py-0">
      {/* Course Header */}
      <div className="course-card mb-4 p-4 rounded shadow-sm">
        <h2 className="fw-bold text-primary">{course.name} ({course.code})</h2>
        <div className="text-muted">
          <span className="me-3"><i className="fas fa-user-tie me-2"></i>{course.titulaire_name}</span>
          <span className="me-3"><i className="fas fa-university me-2"></i>{course.auditoire_name}</span>
          <span className="me-3"><i className="fas fa-credit-card me-2"></i>{course.credits} crédits</span>
          <span className="me-3"><i className="fas fa-users me-2"></i>{course.students_count} étudiants</span>
        </div>
      </div>

      <Row>
        <Col lg={8}>
          <Tabs defaultActiveKey="overview" className="mb-4">
            <Tab eventKey="overview" title="Aperçu">
              <Card className="card-custom">
                <Card.Body>
                  <h5 className="fw-bold mb-3">Description du cours</h5>
                  <p className="text-muted">{course.description || "Aucune description disponible."}</p>
                </Card.Body>
              </Card>
            </Tab>

            <Tab eventKey="materials" title="Matériel Pédagogique">
              <Card className="card-custom">
                <Card.Body>
                  <h5 className="fw-bold mb-3">Documents et Ressources</h5>
                  <ListGroup variant="flush">
                    {(course.materials || []).map((material) => (
                      <ListGroup.Item key={material.id} className="d-flex justify-content-between align-items-center">
                        <div>
                          <div className="fw-semibold">{material.title}</div>
                          <small className="text-muted text-capitalize">
                            <i className="fas fa-file me-2"></i>{material.material_type}
                          </small>
                        </div>
                        <Button size="sm" variant="outline-primary" href={material.file || material.link} target="_blank">
                          <i className="fas fa-download me-1"></i>Ouvrir
                        </Button>
                      </ListGroup.Item>
                    ))}
                    {course.materials?.length === 0 && <p className="text-muted text-center">Aucun matériel disponible.</p>}
                  </ListGroup>
                </Card.Body>
              </Card>
            </Tab>

            {/* Placeholder for future features */}
            <Tab eventKey="assignments" title="Devoirs"><p className="text-muted text-center">La section des devoirs sera bientôt disponible.</p></Tab>
            <Tab eventKey="grades" title="Notes"><p className="text-muted text-center">La section des notes sera bientôt disponible.</p></Tab>
          </Tabs>
        </Col>

        <Col lg={4}>
          <Card className="card-custom mb-4">
            <Card.Body>
              <h6 className="fw-bold mb-3">Actions Rapides</h6>
              <div className="d-grid gap-2">
                <Button as={Link} to={`/chat?course=${course.id}`} variant="outline-primary">
                  <i className="fas fa-comments me-2"></i>Rejoindre la discussion
                </Button>
                <Button variant="outline-info" disabled><i className="fas fa-chart-bar me-2"></i>Mes notes</Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default CourseDetail
