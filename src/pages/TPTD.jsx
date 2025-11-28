"use client"

import { useState, useEffect } from "react"
import { Container, Row, Col, Card, Button, Badge, Tab, Tabs, Form, Modal, Alert, Table } from "react-bootstrap"
import { useSelector, useDispatch } from "react-redux"
import {
  fetchMyAssignments,
  fetchAssignments,
  submitAssignment,
  createAssignment,
  fetchSubmissionsByAssignment,
  gradeSubmission,
  deleteAssignment,
} from "../store/slices/assignmentsSlice"

const TPTD = () => {
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)
  const { myAssignments, assignments, submissions, loading, error } = useSelector((state) => state.assignments)

  const [activeTab, setActiveTab] = useState("mes-travaux")
  const [showModal, setShowModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState(null)
  const [soumission, setSoumission] = useState("")
  const [file, setFile] = useState(null)
  const [newAssignment, setNewAssignment] = useState({
    title: "",
    description: "",
    due_date: "",
    course: "",
    assignment_type: "tp",
  })

  const isEnseignant = ["enseignant", "assistant", "chef_departement", "chef_section", "sga", "iadmin"].includes(
    user?.role
  )

  // Charger les devoirs au montage
  useEffect(() => {
    if (user?.role === "etudiant") {
      dispatch(fetchMyAssignments())
    } else if (isEnseignant) {
      dispatch(fetchAssignments())
    }
  }, [dispatch, user, isEnseignant])

  const handleSoumission = async () => {
    if (selectedAssignment && soumission.trim()) {
      try {
        const formData = new FormData()
        formData.append("content", soumission)
        if (file) {
          formData.append("file", file)
        }

        await dispatch(
          submitAssignment({ assignmentId: selectedAssignment.id, submissionData: formData })
        ).unwrap()

        setSoumission("")
        setFile(null)
        setShowModal(false)
        setSelectedAssignment(null)

        // Recharger les devoirs
        dispatch(fetchMyAssignments())
      } catch (error) {
        console.error("Erreur lors de la soumission:", error)
      }
    }
  }

  const handleCreateAssignment = async () => {
    try {
      await dispatch(createAssignment(newAssignment)).unwrap()
      setShowCreateModal(false)
      setNewAssignment({
        title: "",
        description: "",
        due_date: "",
        course: "",
        assignment_type: "tp",
      })
      // Recharger les devoirs
      dispatch(fetchAssignments())
    } catch (error) {
      console.error("Erreur lors de la création:", error)
    }
  }

  const handleViewSubmissions = (assignment) => {
    setSelectedAssignment(assignment)
    dispatch(fetchSubmissionsByAssignment(assignment.id))
  }

  const handleDeleteAssignment = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce devoir ?")) {
      try {
        await dispatch(deleteAssignment(id)).unwrap()
        dispatch(fetchAssignments())
      } catch (error) {
        console.error("Erreur lors de la suppression:", error)
      }
    }
  }

  const getStatutBadge = (assignment) => {
    if (assignment.submitted) {
      return <Badge bg="info">Soumis</Badge>
    }
    const now = new Date()
    const dueDate = new Date(assignment.due_date)
    if (now > dueDate) {
      return <Badge bg="danger">En retard</Badge>
    }
    return <Badge bg="warning">En cours</Badge>
  }

  const travaux = user?.role === "etudiant" ? myAssignments : assignments

  return (
    <Container fluid className="py-0">
      <Row className="mb-4 dashboard-card">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <h2 className="text-primary">
              <i className="fas fa-tasks me-2"></i>
              TP / TD / Travaux Pratiques
            </h2>
            {isEnseignant && (
              <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                <i className="fas fa-plus me-2"></i>
                Créer un TP/TD
              </Button>
            )}
          </div>
        </Col>
      </Row>

      {error && (
        <Alert variant="danger" dismissible>
          {error}
        </Alert>
      )}

      <Card className="border-0 shadow-sm">
        <Card.Body>
          <Tabs activeKey={activeTab} onSelect={setActiveTab} className="mb-4">
            <Tab
              eventKey="mes-travaux"
              title={
                <>
                  <i className="fas fa-clipboard-list me-2"></i>
                  {user?.role === "etudiant" ? "Mes Travaux" : "Tous les Travaux"}
                </>
              }
            >
              {loading ? (
                <div className="text-center p-4">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Chargement...</span>
                  </div>
                </div>
              ) : (
                <Row>
                  {travaux && travaux.length > 0 ? (
                    travaux.map((travail) => (
                      <Col md={6} lg={4} key={travail.id} className="mb-4">
                        <Card className="h-100 border-0 shadow-sm">
                          <Card.Header className="bg-light">
                            <div className="d-flex justify-content-between align-items-center">
                              <Badge bg={travail.assignment_type === "tp" ? "primary" : "success"}>
                                {travail.assignment_type?.toUpperCase() || "TP"}
                              </Badge>
                              {getStatutBadge(travail)}
                            </div>
                          </Card.Header>
                          <Card.Body>
                            <h6 className="text-primary">{travail.title}</h6>
                            <p className="text-muted small mb-2">
                              <i className="fas fa-book me-1"></i>
                              {travail.course?.name || "Cours"}
                            </p>
                            <p className="small mb-3">{travail.description}</p>
                            <div className="mb-3">
                              <small className="text-muted">
                                <i className="fas fa-calendar me-1"></i>
                                Échéance: {new Date(travail.due_date).toLocaleDateString()}
                              </small>
                            </div>
                            {travail.grade && (
                              <div className="mb-3">
                                <Badge bg="success">Note: {travail.grade}/20</Badge>
                              </div>
                            )}
                          </Card.Body>
                          <Card.Footer className="bg-light">
                            {user?.role === "etudiant" ? (
                              !travail.submitted ? (
                                <Button
                                  variant="primary"
                                  size="sm"
                                  className="w-100"
                                  onClick={() => {
                                    setSelectedAssignment(travail)
                                    setShowModal(true)
                                  }}
                                >
                                  <i className="fas fa-upload me-2"></i>
                                  Soumettre
                                </Button>
                              ) : (
                                <Button variant="outline-primary" size="sm" className="w-100">
                                  <i className="fas fa-eye me-2"></i>
                                  Voir Détails
                                </Button>
                              )
                            ) : (
                              <div className="d-flex gap-2">
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  onClick={() => handleViewSubmissions(travail)}
                                >
                                  <i className="fas fa-users me-1"></i>
                                  Soumissions
                                </Button>
                                <Button
                                  variant="outline-danger"
                                  size="sm"
                                  onClick={() => handleDeleteAssignment(travail.id)}
                                >
                                  <i className="fas fa-trash"></i>
                                </Button>
                              </div>
                            )}
                          </Card.Footer>
                        </Card>
                      </Col>
                    ))
                  ) : (
                    <Col className="text-center py-5">
                      <i className="fas fa-clipboard-list fa-3x text-muted mb-3"></i>
                      <h5 className="text-muted">Aucun devoir disponible</h5>
                    </Col>
                  )}
                </Row>
              )}
            </Tab>

            {isEnseignant && (
              <Tab
                eventKey="soumissions"
                title={
                  <>
                    <i className="fas fa-file-alt me-2"></i>
                    Soumissions
                  </>
                }
              >
                {selectedAssignment ? (
                  <>
                    <h5 className="mb-3">{selectedAssignment.title}</h5>
                    <Table responsive hover>
                      <thead>
                        <tr>
                          <th>Étudiant</th>
                          <th>Date de soumission</th>
                          <th>Note</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {submissions && submissions.length > 0 ? (
                          submissions.map((sub) => (
                            <tr key={sub.id}>
                              <td>
                                {sub.student?.first_name} {sub.student?.last_name}
                              </td>
                              <td>{new Date(sub.submitted_at).toLocaleString()}</td>
                              <td>
                                {sub.grade ? (
                                  <Badge bg="success">{sub.grade}/20</Badge>
                                ) : (
                                  <Badge bg="secondary">Non noté</Badge>
                                )}
                              </td>
                              <td>
                                <Button variant="outline-primary" size="sm">
                                  <i className="fas fa-eye me-1"></i>
                                  Voir
                                </Button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="4" className="text-center text-muted">
                              Aucune soumission
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </Table>
                  </>
                ) : (
                  <Alert variant="info">Sélectionnez un devoir pour voir les soumissions</Alert>
                )}
              </Tab>
            )}
          </Tabs>
        </Card.Body>
      </Card>

      {/* Modal Soumission */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Soumettre le Travail</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedAssignment && (
            <>
              <h6 className="text-primary">{selectedAssignment.title}</h6>
              <p className="text-muted">{selectedAssignment.course?.name}</p>

              <div className="mb-3 p-3 bg-light rounded">
                <h6>Description:</h6>
                <p className="mb-0">{selectedAssignment.description}</p>
              </div>

              <Form.Group className="mb-3">
                <Form.Label>Votre Soumission</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={6}
                  value={soumission}
                  onChange={(e) => setSoumission(e.target.value)}
                  placeholder="Tapez votre réponse ici..."
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Fichier Joint (optionnel)</Form.Label>
                <Form.Control type="file" onChange={(e) => setFile(e.target.files[0])} />
                <Form.Text className="text-muted">Formats acceptés: PDF, DOC, DOCX, XLS, XLSX</Form.Text>
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Annuler
          </Button>
          <Button variant="primary" onClick={handleSoumission} disabled={!soumission.trim() || loading}>
            <i className="fas fa-upload me-2"></i>
            Soumettre
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal Création */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Créer un TP/TD</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Titre</Form.Label>
              <Form.Control
                type="text"
                value={newAssignment.title}
                onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                placeholder="Ex: TP1 - Comptabilité"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Type</Form.Label>
              <Form.Select
                value={newAssignment.assignment_type}
                onChange={(e) => setNewAssignment({ ...newAssignment, assignment_type: e.target.value })}
              >
                <option value="tp">TP (Travaux Pratiques)</option>
                <option value="td">TD (Travaux Dirigés)</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={newAssignment.description}
                onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
                placeholder="Description du devoir..."
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Date d'échéance</Form.Label>
              <Form.Control
                type="datetime-local"
                value={newAssignment.due_date}
                onChange={(e) => setNewAssignment({ ...newAssignment, due_date: e.target.value })}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
            Annuler
          </Button>
          <Button
            variant="primary"
            onClick={handleCreateAssignment}
            disabled={!newAssignment.title || !newAssignment.due_date || loading}
          >
            <i className="fas fa-plus me-2"></i>
            Créer
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  )
}

export default TPTD
