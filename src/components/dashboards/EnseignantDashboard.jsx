import { Container, Row, Col, Card, Button, Badge, ListGroup, Table } from "react-bootstrap"
import { LinkContainer } from "react-router-bootstrap"
import { useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { fetchAssignments } from "../../store/slices/assignmentsSlice"
import { fetchAuditoires } from "../../store/slices/auditoiresSlice"

const EnseignantDashboard = ({ user, courses, notifications }) => {
  const dispatch = useDispatch()
  const { assignments } = useSelector((state) => state.assignments)
  const { auditoires } = useSelector((state) => state.auditoires)

  useEffect(() => {
    dispatch(fetchAssignments())
    dispatch(fetchAuditoires())
  }, [dispatch])

  const myCourses = courses.filter((course) => course.created_by === user?.id || course.teacher === user?.id)
  const myAssignments = (assignments || []).filter(a => a.created_by === user?.id)
  const pendingGrades = myAssignments.filter(a => a.status === 'published').length
  const totalStudents = myCourses.reduce((acc, course) => acc + (course.enrolled_students || 0), 0)

  // Get auditoires where this teacher teaches
  const myAuditoires = (auditoires || []).filter(aud =>
    myCourses.some(course => course.auditoire === aud.id)
  )

  return (
    <Container className="py-0" style={{  }}>
      <Row className="mb-4">
        <Col>
          <div className="dashboard-card">
            <Row className="align-items-center">
              <Col md={8}>
                <h1 className="h2 fw-bold mb-2">Espace Enseignant - {user?.name}</h1>
                <p className="text-muted mb-3">
                  Département: {user?.department} | Spécialité: {user?.specialty}
                </p>
                <div className="d-flex gap-2 flex-wrap">
                  <LinkContainer to="/courses">
                    <Button className="btn-primary-custom">
                      <i className="fas fa-chalkboard-teacher me-2"></i>Mes Cours
                    </Button>
                  </LinkContainer>
                  <LinkContainer to="/tptd">
                    <Button variant="outline-primary">
                      <i className="fas fa-tasks me-2"></i>TP/TD
                    </Button>
                  </LinkContainer>
                  <LinkContainer to="/quiz">
                    <Button variant="outline-warning">
                      <i className="fas fa-question-circle me-2"></i>Quiz
                    </Button>
                  </LinkContainer>
                </div>
              </Col>
            </Row>
          </div>
        </Col>
      </Row>

      {/* <Row> */}
        {/* <Col lg={12}> */}
          {/* Teacher Stats */}
          <Row className="mb-4">
            <Col md={3}>
              <div className="stat-card">
                <div className="stat-number">{myCourses.length}</div>
                <div className="stat-label">Cours Enseignés</div>
              </div>
            </Col>
            <Col md={3}>
              <div className="stat-card">
                <div className="stat-number">{totalStudents}</div>
                <div className="stat-label">Étudiants</div>
              </div>
            </Col>
            <Col md={3}>
              <div className="stat-card">
                <div className="stat-number">{pendingGrades}</div>
                <div className="stat-label">Notes à Saisir</div>
              </div>
            </Col>
            <Col md={3}>
              <div className="stat-card">
                <div className="stat-number">{myAssignments.length}</div>
                <div className="stat-label">TP/TD Créés</div>
              </div>
            </Col>
          </Row>

          {/* </Col> */}
          {/* </Row> */}
          {/* My Courses */}
          <Row>
            <Col lg={12}>
          <Card className="card-custom mb-4">
            <Card.Header>
              <h5 className="fw-bold mb-0">Mes Cours</h5>
            </Card.Header>
            <Card.Body>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Cours</th>
                    <th>Auditoire</th>
                    <th>Étudiants</th>
                    <th>Prochaine Séance</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {myCourses.map((course) => (
                    <tr key={course.id}>
                      <td>
                        <div className="fw-semibold">{course.name}</div>
                        <small className="text-muted">{course.code}</small>
                      </td>
                      <td>{course.auditoire}</td>
                      <td>
                        <Badge bg="info">{course.enrolledStudents || 0}</Badge>
                      </td>
                      <td>
                        <small>{course.nextSession || "À programmer"}</small>
                      </td>
                      <td>
                        <LinkContainer to={`/courses/${course.id}`}>
                          <Button size="sm" variant="outline-primary">
                            Gérer
                          </Button>
                        </LinkContainer>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
        </Row>

        <Row>
        <Col lg={6}>
          {/* Quick Actions */}
          <Card className="card-custom mb-4">
            <Card.Header>
              <h6 className="fw-bold mb-0">Actions Rapides</h6>
            </Card.Header>
            <Card.Body>
              <ListGroup variant="flush">
                <ListGroup.Item className="px-0 py-2">
                  <LinkContainer to="/tptd/create">
                    <Button variant="link" className="p-0 text-decoration-none">
                      <i className="fas fa-plus me-2 text-success"></i>Créer un TP/TD
                    </Button>
                  </LinkContainer>
                </ListGroup.Item>
                <ListGroup.Item className="px-0 py-2">
                  <LinkContainer to="/quiz/create">
                    <Button variant="link" className="p-0 text-decoration-none">
                      <i className="fas fa-question-circle me-2 text-warning"></i>Créer un Quiz
                    </Button>
                  </LinkContainer>
                </ListGroup.Item>
                <ListGroup.Item className="px-0 py-2">
                  <LinkContainer to="/grades">
                    <Button variant="link" className="p-0 text-decoration-none">
                      <i className="fas fa-star me-2 text-primary"></i>Saisir des Notes
                    </Button>
                  </LinkContainer>
                </ListGroup.Item>
                <ListGroup.Item className="px-0 py-2">
                  <LinkContainer to="/chat">
                    <Button variant="link" className="p-0 text-decoration-none">
                      <i className="fas fa-comments me-2 text-info"></i>Forums de Cours
                    </Button>
                  </LinkContainer>
                </ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>
          </Col>
          <Col>
          {/* Pending Tasks */}
          <Card className="card-custom">
            <Card.Header>
              <h6 className="fw-bold mb-0">Tâches Pendantes</h6>
            </Card.Header>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span>Notes à saisir</span>
                <Badge bg="warning">{pendingGrades}</Badge>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span>TP/TD à corriger</span>
                <Badge bg="info">8</Badge>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span>Messages non lus</span>
                <Badge bg="primary">5</Badge>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default EnseignantDashboard
