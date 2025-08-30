import { Container, Row, Col, Button, Badge, ProgressBar } from "react-bootstrap"
import { useSelector } from "react-redux"
import { LinkContainer } from "react-router-bootstrap"

const Courses = () => {
  const { courses } = useSelector((state) => state.courses)
  const { user } = useSelector((state) => state.auth)

  return (
    <Container className="py-4" style={{ marginTop: "80px" }}>
      <Row className="mb-4">
        <Col>
          <h1 className="fw-bold mb-2">Mes Cours</h1>
          <p className="text-muted">{user?.auditoire && `Auditoire: ${user.auditoire}`}</p>
        </Col>
      </Row>

      <Row>
        {courses.map((course) => (
          <Col lg={6} key={course.id} className="mb-4">
            <div className="course-card">
              <div className="course-header">
                <div className="course-title">{course.name}</div>
                <div className="course-info">
                  <i className="fas fa-user me-2"></i>
                  {course.teacher}
                  <span className="ms-3">
                    <i className="fas fa-credit-card me-2"></i>
                    {course.credits} crédits
                  </span>
                </div>
              </div>

              <div className="course-body">
                <p className="text-muted mb-3">{course.description}</p>

                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <small className="text-muted">Progression du cours</small>
                    <small className="fw-bold">{course.progress}%</small>
                  </div>
                  <ProgressBar now={course.progress} variant="info" style={{ height: "8px" }} />
                </div>

                <div className="mb-3">
                  <h6 className="fw-bold mb-2">Devoirs à venir</h6>
                  {course.assignments.slice(0, 2).map((assignment) => (
                    <div key={assignment.id} className="d-flex justify-content-between align-items-center mb-2">
                      <div>
                        <div className="fw-semibold">{assignment.title}</div>
                        <small className="text-muted">Échéance: {assignment.dueDate}</small>
                      </div>
                      <Badge bg={assignment.type === "Quiz" ? "warning" : "info"}>{assignment.type}</Badge>
                    </div>
                  ))}
                </div>

                <div className="d-flex justify-content-between align-items-center">
                  <div className="text-muted">
                    <i className="fas fa-users me-1"></i>
                    {course.students} étudiants
                  </div>
                  <div className="d-flex gap-2">
                    <LinkContainer to={{ pathname: "/chat", search: `?course=${course.id}` }}>
                      <Button size="sm" variant="outline-primary">
                        <i className="fas fa-comments me-1"></i>
                        Discussion
                      </Button>
                    </LinkContainer>
                    <LinkContainer to={`/courses/${course.id}`}>
                      <Button size="sm" className="btn-primary-custom">
                        Voir le cours
                      </Button>
                    </LinkContainer>
                  </div>
                </div>
              </div>
            </div>
          </Col>
        ))}
      </Row>

      {courses.length === 0 && (
        <Row>
          <Col className="text-center py-5">
            <i className="fas fa-book fa-3x text-muted mb-3"></i>
            <h4 className="text-muted">Aucun cours disponible</h4>
            <p className="text-muted">Les cours seront affichés ici une fois qu'ils seront assignés.</p>
          </Col>
        </Row>
      )}
    </Container>
  )
}

export default Courses
