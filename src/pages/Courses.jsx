"use client"

import { Container, Row, Col, Button, Badge, ProgressBar, Modal, Form, Table } from "react-bootstrap"
import { useState } from "react"
import { useSelector } from "react-redux"
import { LinkContainer } from "react-router-bootstrap"
import { useNavigate } from "react-router-dom"

const Courses = () => {
  const { courses } = useSelector((state) => state.courses)
  const { user } = useSelector((state) => state.auth)
  const [showCourseModal, setShowCourseModal] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [showStudentsModal, setShowStudentsModal] = useState(false)
  const navigate = useNavigate()

  const canManageCourses = () => {
    return ["enseignant", "chef_departement", "chef_section", "sga", "iadmin", "pdg", "directeur_general"].includes(
      user?.role,
    )
  }

  const canCreateCourses = () => {
    return ["chef_section", "sga", "iadmin", "pdg", "directeur_general"].includes(user?.role)
  }

  const handleEditCourse = (course) => {
    setSelectedCourse(course)
    setShowCourseModal(true)
  }

  const handleDeleteCourse = (courseId) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce cours ?")) {
      // Dispatch delete action
      console.log("Deleting course:", courseId)
    }
  }

  const handleViewStudents = (course) => {
    setSelectedCourse(course)
    setShowStudentsModal(true)
  }

  const handleChatNavigation = (courseId) => {
    navigate(`/chat?course=${courseId}`)
  }

  return (
    <Container fluid className="py-0">
      <Row className="mb-4 dashboard-card">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="fw-bold mb-2">{user?.role === "etudiant" ? "Mes Cours" : "Gestion des Cours"}</h1>
              <p className="text-muted">{user?.auditoire && `Auditoire: ${user.auditoire}`}</p>
            </div>
            {canCreateCourses() && (
              <Button variant="primary" onClick={() => setShowCourseModal(true)}>
                <i className="fas fa-plus me-2"></i>
                Nouveau Cours
              </Button>
            )}
          </div>
        </Col>
      </Row>

      <Row>
        {courses.map((course) => (
          <Col lg={6} key={course.id} className="mb-4">
            <div className="course-card shadow-sm border rounded p-4">
              <div className="course-header mb-3">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h5 className="fw-bold mb-1">{course.name}</h5>
                    <div className="text-muted small">
                      <i className="fas fa-user me-2"></i>
                      {course.teacher}
                      <span className="ms-3">
                        <i className="fas fa-credit-card me-2"></i>
                        {course.credits} crédits
                      </span>
                    </div>
                  </div>
                  {canManageCourses() && (
                    <div className="dropdown">
                      <Button variant="outline-secondary" size="sm" data-bs-toggle="dropdown">
                        <i className="fas fa-ellipsis-v"></i>
                      </Button>
                      <ul className="dropdown-menu">
                        <li>
                          <button className="dropdown-item" onClick={() => handleEditCourse(course)}>
                            <i className="fas fa-edit me-2"></i>Modifier
                          </button>
                        </li>
                        <li>
                          <button className="dropdown-item" onClick={() => handleViewStudents(course)}>
                            <i className="fas fa-users me-2"></i>Voir Étudiants
                          </button>
                        </li>
                        {canCreateCourses() && (
                          <li>
                            <button className="dropdown-item text-danger" onClick={() => handleDeleteCourse(course.id)}>
                              <i className="fas fa-trash me-2"></i>Supprimer
                            </button>
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
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
                  {course.assignments?.slice(0, 2).map((assignment) => (
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
                    <Button size="sm" variant="outline-primary" onClick={() => handleChatNavigation(course.id)}>
                      <i className="fas fa-comments me-1"></i>
                      Discussion
                    </Button>
                    <LinkContainer to={`/courses/${course.id}`}>
                      <Button size="sm" variant="primary">
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

      <Modal show={showCourseModal} onHide={() => setShowCourseModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{selectedCourse ? "Modifier le Cours" : "Nouveau Cours"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nom du Cours</Form.Label>
                  <Form.Control type="text" defaultValue={selectedCourse?.name} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Code du Cours</Form.Label>
                  <Form.Control type="text" defaultValue={selectedCourse?.code} />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Crédits</Form.Label>
                  <Form.Control type="number" defaultValue={selectedCourse?.credits} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Enseignant</Form.Label>
                  <Form.Select defaultValue={selectedCourse?.teacher}>
                    <option value="">Sélectionner un enseignant</option>
                    <option value="Prof. Martin Dubois">Prof. Martin Dubois</option>
                    <option value="Dr. Sarah Bamba">Dr. Sarah Bamba</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control as="textarea" rows={3} defaultValue={selectedCourse?.description} />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCourseModal(false)}>
            Annuler
          </Button>
          <Button variant="primary">{selectedCourse ? "Mettre à jour" : "Créer"}</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showStudentsModal} onHide={() => setShowStudentsModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Étudiants - {selectedCourse?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Table responsive hover>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Email</th>
                <th>Progression</th>
                <th>Note</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Marie Kouassi</td>
                <td>marie.k@DASH.edu</td>
                <td>
                  <ProgressBar now={75} variant="success" style={{ height: "6px" }} />
                </td>
                <td>
                  <Badge bg="success">15/20</Badge>
                </td>
                <td>
                  <Button size="sm" variant="outline-primary">
                    Voir Détails
                  </Button>
                </td>
              </tr>
              <tr>
                <td>Jean Koffi</td>
                <td>jean.k@DASH.edu</td>
                <td>
                  <ProgressBar now={60} variant="warning" style={{ height: "6px" }} />
                </td>
                <td>
                  <Badge bg="warning">12/20</Badge>
                </td>
                <td>
                  <Button size="sm" variant="outline-primary">
                    Voir Détails
                  </Button>
                </td>
              </tr>
            </tbody>
          </Table>
        </Modal.Body>
      </Modal>
    </Container>
  )
}

export default Courses
