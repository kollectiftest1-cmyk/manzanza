import { Container, Row, Col, Card, Button, ProgressBar, Badge, ListGroup } from "react-bootstrap"
import { LinkContainer } from "react-router-bootstrap"
import { useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { fetchAssignments } from "../../store/slices/assignmentsSlice"

const EtudiantDashboard = ({ user, courses, notifications }) => {
  const dispatch = useDispatch()
  const { assignments } = useSelector((state) => state.assignments)

  useEffect(() => {
    dispatch(fetchAssignments({ status: 'pending' }))
  }, [dispatch])

  const upcomingAssignments = (assignments || [])
    .filter(a => a.status === 'published' && new Date(a.due_date) > new Date())
    .slice(0, 3)

  // Calculate average grade from courses (simplified - should come from backend)
  const averageGrade = courses.length > 0
    ? Math.round(courses.reduce((sum, c) => sum + (c.average_grade || 0), 0) / courses.length) || 0
    : 0

  // Calculate attendance rate (should come from backend)
  const attendanceRate = user?.attendance_rate || 0

  return (
    <Container className="py-0" style={{  }}>
      {/* Welcome Section */}
      <Row className="mb-4">
        <Col>
          <div className="dashboard-card">
            <Row className="align-items-center">
              <Col md={8}>
                <h1 className="h2 fw-bold mb-2">Bonjour, {user?.name} !</h1>
                <p className="text-muted mb-3">
                  Auditoire: {user?.auditoire} | Section: {user?.section}
                </p>
                <div className="d-flex gap-2 flex-wrap">
                  <LinkContainer to="/courses">
                    <Button className="btn-primary-custom">
                      <i className="fas fa-book me-2"></i>Mes Cours
                    </Button>
                  </LinkContainer>
                  <LinkContainer to="/auditoires">
                    <Button variant="outline-primary">
                      <i className="fas fa-users me-2"></i>Auditoires
                    </Button>
                  </LinkContainer>
                  <LinkContainer to="/library">
                    <Button variant="outline-success">
                      <i className="fas fa-book-open me-2"></i>Bibliothèque
                    </Button>
                  </LinkContainer>
                </div>
              </Col>
            </Row>
          </div>
        </Col>
      </Row>

      <Row>
        <Col lg={12}>
          {/* Student Stats */}
          <Row className="mb-4">
            <Col md={3}>
              <div className="stat-card">
                <div className="stat-number">{courses.length}</div>
                <div className="stat-label">Cours Inscrits</div>
              </div>
            </Col>
            <Col md={3}>
              <div className="stat-card">
                <div className="stat-number">{upcomingAssignments.length}</div>
                <div className="stat-label">TP/TD à Rendre</div>
              </div>
            </Col>
            <Col md={3}>
              <div className="stat-card">
                <div className="stat-number">{averageGrade}%</div>
                <div className="stat-label">Moyenne Générale</div>
              </div>
            </Col>
            <Col md={3}>
              <div className="stat-card">
                <div className="stat-number">{attendanceRate}%</div>
                <div className="stat-label">Présence</div>
              </div>
            </Col>
          </Row>

          {/* Courses Progress */}
          <Card className="card-custom mb-4">
            <Card.Header>
              <h5 className="fw-bold mb-0">Progression des Cours</h5>
            </Card.Header>
            <Card.Body>
              {courses.slice(0, 4).map((course) => (
                <div key={course.id} className="border-bottom pb-3 mb-3">
                  <Row className="align-items-center">
                    <Col md={6}>
                      <h6 className="fw-bold mb-1">{course.name}</h6>
                      <small className="text-muted">Prof. {course.teacher}</small>
                    </Col>
                    <Col md={3}>
                      <ProgressBar now={course.progress} variant="info" style={{ height: "8px" }} />
                      <small className="text-muted">{course.progress}% complété</small>
                    </Col>
                    <Col md={3} className="text-end">
                      <LinkContainer to={`/courses/${course.id}`}>
                        <Button size="sm" variant="outline-primary">
                          Accéder
                        </Button>
                      </LinkContainer>
                    </Col>
                  </Row>
                </div>
              ))}
            </Card.Body>
          </Card>
        </Col>

      </Row>
        <Row lg={12}>
          {/* Upcoming Assignments */}
          <Col lg={6}>
          <Card className="card-custom mb-4">
            <Card.Header>
              <h6 className="fw-bold mb-0">Prochains TP/TD</h6>
            </Card.Header>
            <Card.Body>
              {upcomingAssignments.map((assignment) => (
                <div key={assignment.id} className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <div className="fw-semibold">{assignment.title}</div>
                    <small className="text-muted">{assignment.courseName}</small>
                  </div>
                  <div className="text-end">
                    <Badge bg={assignment.type === "Quiz" ? "warning" : "info"}>{assignment.type}</Badge>
                    <div>
                      <small className="text-muted">{assignment.dueDate}</small>
                    </div>
                  </div>
                </div>
              ))}
            </Card.Body>
          </Card>
          </Col>

          {/* Quick Actions */}
          <Col lg={6}>
          <Card className="card-custom mb-4">
            <Card.Header>
              <h6 className="fw-bold mb-0">Actions Rapides</h6>
            </Card.Header>
            <Card.Body>
              <ListGroup variant="flush">
                <ListGroup.Item className="px-0 py-2">
                  <LinkContainer to="/paiements">
                    <Button variant="link" className="p-0 text-decoration-none">
                      <i className="fas fa-credit-card me-2 text-success"></i>Effectuer un Paiement
                    </Button>
                  </LinkContainer>
                </ListGroup.Item>
                <ListGroup.Item className="px-0 py-2">
                  <LinkContainer to="/chat">
                    <Button variant="link" className="p-0 text-decoration-none">
                      <i className="fas fa-comments me-2 text-primary"></i>Discussion de Cours
                    </Button>
                  </LinkContainer>
                </ListGroup.Item>
                <ListGroup.Item className="px-0 py-2">
                  <LinkContainer to="/profile">
                    <Button variant="link" className="p-0 text-decoration-none">
                      <i className="fas fa-user me-2 text-info"></i>Mon Profil
                    </Button>
                  </LinkContainer>
                </ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>
          </Col>
          </Row>
    </Container>
  )
}

export default EtudiantDashboard
