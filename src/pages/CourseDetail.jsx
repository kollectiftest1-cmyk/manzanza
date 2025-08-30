"use client"
import { Container, Row, Col, Card, Button, Badge, Tabs, Tab, ListGroup } from "react-bootstrap"
import { useParams } from "react-router-dom"
import { useSelector } from "react-redux"
import { LinkContainer } from "react-router-bootstrap"

const CourseDetail = () => {
  const { id } = useParams()
  const { courses } = useSelector((state) => state.courses)
  const course = courses.find((c) => c.id === Number.parseInt(id))

  if (!course) {
    return (
      <Container className="py-4" style={{ marginTop: "80px" }}>
        <div className="text-center">
          <h4>Cours non trouvé</h4>
        </div>
      </Container>
    )
  }

  const materials = [
    { id: 1, title: "Introduction à la Comptabilité", type: "PDF", size: "2.5 MB" },
    { id: 2, title: "Cours Magistral - Semaine 1", type: "Vidéo", size: "45 min" },
    { id: 3, title: "Exercices Pratiques", type: "PDF", size: "1.2 MB" },
  ]

  return (
    <Container className="py-4" style={{ marginTop: "80px" }}>
      {/* Course Header */}
      <div className="course-card mb-4">
        <div className="course-header">
          <div className="course-title">{course.name}</div>
          <div className="course-info">
            <i className="fas fa-user me-2"></i>
            {course.teacher}
            <span className="ms-3">
              <i className="fas fa-credit-card me-2"></i>
              {course.credits} crédits
            </span>
            <span className="ms-3">
              <i className="fas fa-users me-2"></i>
              {course.students} étudiants
            </span>
          </div>
        </div>
      </div>

      <Row>
        <Col lg={8}>
          <Tabs defaultActiveKey="overview" className="mb-4">
            <Tab eventKey="overview" title="Aperçu">
              <Card className="card-custom">
                <Card.Body>
                  <h5 className="fw-bold mb-3">Description du cours</h5>
                  <p className="text-muted mb-4">{course.description}</p>

                  <h6 className="fw-bold mb-3">Objectifs d'apprentissage</h6>
                  <ul className="text-muted">
                    <li>Comprendre les principes fondamentaux de la comptabilité</li>
                    <li>Maîtriser les techniques d'enregistrement comptable</li>
                    <li>Savoir établir un bilan et un compte de résultat</li>
                    <li>Analyser les documents comptables</li>
                  </ul>
                </Card.Body>
              </Card>
            </Tab>

            <Tab eventKey="materials" title="Matériel pédagogique">
              <Card className="card-custom">
                <Card.Body>
                  <h5 className="fw-bold mb-3">Documents et ressources</h5>
                  <ListGroup variant="flush">
                    {materials.map((material) => (
                      <ListGroup.Item key={material.id} className="d-flex justify-content-between align-items-center">
                        <div>
                          <div className="fw-semibold">{material.title}</div>
                          <small className="text-muted">
                            <i className={`fas ${material.type === "PDF" ? "fa-file-pdf" : "fa-video"} me-1`}></i>
                            {material.type} - {material.size}
                          </small>
                        </div>
                        <Button size="sm" variant="outline-primary">
                          <i className="fas fa-download me-1"></i>
                          Télécharger
                        </Button>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                </Card.Body>
              </Card>
            </Tab>

            <Tab eventKey="assignments" title="Devoirs">
              <Card className="card-custom">
                <Card.Body>
                  <h5 className="fw-bold mb-3">Travaux pratiques et Quiz</h5>
                  {course.assignments.map((assignment) => (
                    <div key={assignment.id} className="quiz-card">
                      <Row className="align-items-center">
                        <Col md={8}>
                          <h6 className="fw-bold mb-1">{assignment.title}</h6>
                          <small className="text-muted">Échéance: {assignment.dueDate}</small>
                        </Col>
                        <Col md={4} className="text-end">
                          <Badge bg={assignment.type === "Quiz" ? "warning" : "info"} className="me-2">
                            {assignment.type}
                          </Badge>
                          {assignment.type === "Quiz" ? (
                            <LinkContainer to={`/quiz/${assignment.id}`}>
                              <Button size="sm" className="btn-primary-custom">
                                Commencer
                              </Button>
                            </LinkContainer>
                          ) : (
                            <Button size="sm" variant="outline-primary">
                              Soumettre
                            </Button>
                          )}
                        </Col>
                      </Row>
                    </div>
                  ))}
                </Card.Body>
              </Card>
            </Tab>
          </Tabs>
        </Col>

        <Col lg={4}>
          {/* Course Stats */}
          <Card className="card-custom mb-4">
            <Card.Body>
              <h6 className="fw-bold mb-3">Statistiques du cours</h6>
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <small>Progression</small>
                  <small className="fw-bold">{course.progress}%</small>
                </div>
                <div className="progress" style={{ height: "8px" }}>
                  <div className="progress-bar bg-info" style={{ width: `${course.progress}%` }}></div>
                </div>
              </div>
              <div className="mb-3">
                <small className="text-muted">Dernière activité</small>
                <div className="fw-semibold">Il y a 2 jours</div>
              </div>
              <div className="mb-3">
                <small className="text-muted">Prochaine échéance</small>
                <div className="fw-semibold">15 Février 2024</div>
              </div>
            </Card.Body>
          </Card>

          {/* Quick Actions */}
          <Card className="card-custom">
            <Card.Body>
              <h6 className="fw-bold mb-3">Actions rapides</h6>
              <div className="d-grid gap-2">
                <LinkContainer to={`/chat?course=${course.id}`}>
                  <Button variant="outline-primary">
                    <i className="fas fa-comments me-2"></i>
                    Rejoindre la discussion
                  </Button>
                </LinkContainer>
                <Button variant="outline-success">
                  <i className="fas fa-calendar me-2"></i>
                  Voir le planning
                </Button>
                <Button variant="outline-info">
                  <i className="fas fa-chart-bar me-2"></i>
                  Mes notes
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default CourseDetail
