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
import { motion } from "framer-motion"
import { FiClipboard, FiPlus, FiUpload, FiEye, FiTrash, FiUsers, FiCalendar, FiBook, FiFileText, FiAlertCircle, FiCheckCircle, FiClock, FiX, FiFile } from "react-icons/fi"
import AssignmentCorrection from "../components/Assignments/AssignmentCorrection"

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

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
    setAssignmentToCorrect(assignment)
    setShowCorrection(true)
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

  // Show correction view
  if (showCorrection && assignmentToCorrect) {
    return (
      <Container fluid style={{ padding: '24px', background: 'var(--color-bodyBg)', minHeight: '100vh' }}>
        <AssignmentCorrection
          assignment={assignmentToCorrect}
          onBack={() => {
            setShowCorrection(false)
            setAssignmentToCorrect(null)
          }}
        />
      </Container>
    )
  }

  return (
    <Container fluid style={{ padding: '24px', background: 'var(--color-bodyBg)', minHeight: '100vh' }}>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div variants={itemVariants} style={{ marginBottom: '24px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
            padding: '24px',
            background: 'var(--color-cardBg)',
            borderRadius: '16px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            border: '1px solid var(--color-border)'
          }}>
            <div>
              <h2 style={{
                margin: 0,
                fontSize: '1.8rem',
                fontWeight: '700',
                background: 'linear-gradient(135deg, var(--color-primary) 0%, #667eea 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <FiClipboard size={32} style={{ color: 'var(--color-primary)' }} />
                TP / TD / Travaux Pratiques
              </h2>
            </div>
            {isEnseignant && (
              <Button
                onClick={() => setShowCreateModal(true)}
                style={{
                  background: 'linear-gradient(135deg, var(--color-primary) 0%, #667eea 100%)',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '10px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <FiPlus size={20} />
                Créer un TP/TD
              </Button>
            )}
          </div>
        </motion.div>

        {/* Error Alert */}
        {error && (
          <motion.div variants={itemVariants} style={{ marginBottom: '24px' }}>
            <Alert
              variant="danger"
              dismissible
              style={{
                background: 'var(--color-cardBg)',
                border: '1px solid #dc3545',
                borderRadius: '12px',
                color: 'var(--color-text)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <FiAlertCircle size={20} />
                {error}
              </div>
            </Alert>
          </motion.div>
        )}

        {/* Main Content Card */}
        <motion.div variants={itemVariants}>
          <div style={{
            background: 'var(--color-cardBg)',
            borderRadius: '16px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            border: '1px solid var(--color-border)',
            overflow: 'hidden'
          }}>
            <Tabs
              activeKey={activeTab}
              onSelect={setActiveTab}
              style={{ padding: '20px 20px 0 20px' }}
            >
              <Tab
                eventKey="mes-travaux"
                title={
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}>
                    <FiClipboard />
                    {user?.role === "etudiant" ? "Mes Travaux" : "Tous les Travaux"}
                  </span>
                }
              >
                <div style={{ padding: '24px' }}>
                  {loading ? (
                    <div className="text-center" style={{ padding: '60px 0' }}>
                      <div className="spinner-border" style={{ color: 'var(--color-primary)' }} role="status">
                        <span className="visually-hidden">Chargement...</span>
                      </div>
                    </div>
                  ) : (
                    <Row>
                      {travaux && travaux.length > 0 ? (
                        travaux.map((travail) => (
                          <Col md={6} lg={4} key={travail.id} className="mb-4">
                            <motion.div
                              whileHover={{ y: -5 }}
                              transition={{ duration: 0.2 }}
                              style={{ height: '100%' }}
                            >
                              <div style={{
                                height: '100%',
                                background: 'var(--color-bodyBg)',
                                borderRadius: '12px',
                                border: '1px solid var(--color-border)',
                                overflow: 'hidden',
                                display: 'flex',
                                flexDirection: 'column',
                                transition: 'all 0.3s ease'
                              }}>
                                {/* Card Header */}
                                <div style={{
                                  padding: '16px',
                                  borderBottom: '1px solid var(--color-border)',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center'
                                }}>
                                  <Badge bg={travail.assignment_type === "tp" ? "primary" : "success"}>
                                    {travail.assignment_type?.toUpperCase() || "TP"}
                                  </Badge>
                                  {getStatutBadge(travail)}
                                </div>

                                {/* Card Body */}
                                <div style={{ padding: '20px', flex: 1 }}>
                                  <h6 style={{
                                    color: 'var(--color-text)',
                                    fontWeight: '700',
                                    marginBottom: '12px',
                                    fontSize: '1.1rem'
                                  }}>
                                    {travail.title}
                                  </h6>

                                  <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    color: 'var(--color-textSecondary)',
                                    fontSize: '0.9rem',
                                    marginBottom: '12px'
                                  }}>
                                    <FiBook size={16} />
                                    {travail.course?.name || "Cours"}
                                  </div>

                                  <p style={{
                                    color: 'var(--color-textSecondary)',
                                    fontSize: '0.9rem',
                                    marginBottom: '16px',
                                    lineHeight: '1.5'
                                  }}>
                                    {travail.description}
                                  </p>

                                  <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    color: 'var(--color-textSecondary)',
                                    fontSize: '0.85rem',
                                    marginBottom: '12px'
                                  }}>
                                    <FiCalendar size={16} />
                                    <span>Échéance: {new Date(travail.due_date).toLocaleDateString()}</span>
                                  </div>

                                  {travail.grade && (
                                    <Badge bg="success" style={{ fontSize: '0.9rem', padding: '6px 12px' }}>
                                      Note: {travail.grade}/20
                                    </Badge>
                                  )}
                                </div>

                                {/* Card Footer */}
                                <div style={{
                                  padding: '16px',
                                  borderTop: '1px solid var(--color-border)'
                                }}>
                                  {user?.role === "etudiant" ? (
                                    !travail.submitted ? (
                                      <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={() => {
                                          setSelectedAssignment(travail)
                                          setShowModal(true)
                                        }}
                                        style={{
                                          width: '100%',
                                          background: 'linear-gradient(135deg, var(--color-primary) 0%, #667eea 100%)',
                                          border: 'none',
                                          padding: '10px',
                                          borderRadius: '8px',
                                          fontWeight: '600',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          gap: '8px'
                                        }}
                                      >
                                        <FiUpload />
                                        Soumettre
                                      </Button>
                                    ) : (
                                      <Button
                                        variant="outline-primary"
                                        size="sm"
                                        style={{
                                          width: '100%',
                                          padding: '10px',
                                          borderRadius: '8px',
                                          fontWeight: '600',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          gap: '8px'
                                        }}
                                      >
                                        <FiEye />
                                        Voir Détails
                                      </Button>
                                    )
                                  ) : (
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                      <Button
                                        variant="outline-primary"
                                        size="sm"
                                        onClick={() => handleViewSubmissions(travail)}
                                        style={{
                                          flex: 1,
                                          padding: '10px',
                                          borderRadius: '8px',
                                          fontWeight: '600',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          gap: '8px'
                                        }}
                                      >
                                        <FiUsers />
                                        Soumissions
                                      </Button>
                                      <Button
                                        variant="outline-danger"
                                        size="sm"
                                        onClick={() => handleDeleteAssignment(travail.id)}
                                        style={{
                                          padding: '10px 16px',
                                          borderRadius: '8px'
                                        }}
                                      >
                                        <FiTrash />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </motion.div>
                          </Col>
                        ))
                      ) : (
                        <Col className="text-center" style={{ padding: '80px 0' }}>
                          <FiClipboard size={64} style={{ color: 'var(--color-textSecondary)', marginBottom: '16px' }} />
                          <h5 style={{ color: 'var(--color-textSecondary)' }}>Aucun devoir disponible</h5>
                        </Col>
                      )}
                    </Row>
                  )}
                </div>
              </Tab>


            </Tabs>
          </div>
        </motion.div>
      </motion.div>

      {/* Modal Soumission - Modern Design */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
        <div style={{
          background: 'var(--color-cardBg)',
          borderRadius: '16px',
          overflow: 'hidden',
          border: '1px solid var(--color-border)'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--color-primary) 0%, #667eea 100%)',
            padding: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h5 style={{ margin: 0, color: 'white', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <FiUpload size={24} />
              Soumettre le Travail
            </h5>
            <button
              onClick={() => setShowModal(false)}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                borderRadius: '8px',
                padding: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                color: 'white'
              }}
            >
              <FiX size={20} />
            </button>
          </div>

          <div style={{ padding: '24px' }}>
            {selectedAssignment && (
              <>
                <h6 style={{
                  color: 'var(--color-text)',
                  fontWeight: '700',
                  fontSize: '1.2rem',
                  marginBottom: '8px'
                }}>
                  {selectedAssignment.title}
                </h6>
                <p style={{ color: 'var(--color-textSecondary)', marginBottom: '20px' }}>
                  {selectedAssignment.course?.name}
                </p>

                <div style={{
                  marginBottom: '24px',
                  padding: '16px',
                  background: 'var(--color-bodyBg)',
                  borderRadius: '12px',
                  border: '1px solid var(--color-border)'
                }}>
                  <h6 style={{ color: 'var(--color-text)', fontWeight: '600', marginBottom: '8px' }}>Description:</h6>
                  <p style={{ margin: 0, color: 'var(--color-textSecondary)', lineHeight: '1.6' }}>
                    {selectedAssignment.description}
                  </p>
                </div>

                <Form.Group style={{ marginBottom: '20px' }}>
                  <Form.Label style={{ color: 'var(--color-text)', fontWeight: '600', marginBottom: '8px' }}>
                    Votre Soumission
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={6}
                    value={soumission}
                    onChange={(e) => setSoumission(e.target.value)}
                    placeholder="Tapez votre réponse ici..."
                    style={{
                      background: 'var(--color-bodyBg)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                      color: 'var(--color-text)',
                      padding: '12px'
                    }}
                  />
                </Form.Group>

                <Form.Group style={{ marginBottom: '20px' }}>
                  <Form.Label style={{ color: 'var(--color-text)', fontWeight: '600', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FiFile />
                    Fichier Joint (optionnel)
                  </Form.Label>
                  <Form.Control
                    type="file"
                    onChange={(e) => setFile(e.target.files[0])}
                    style={{
                      background: 'var(--color-bodyBg)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                      color: 'var(--color-text)',
                      padding: '12px'
                    }}
                  />
                  <Form.Text style={{ color: 'var(--color-textSecondary)', fontSize: '0.85rem', marginTop: '8px', display: 'block' }}>
                    Formats acceptés: PDF, DOC, DOCX, XLS, XLSX
                  </Form.Text>
                </Form.Group>
              </>
            )}
          </div>

          <div style={{
            padding: '20px 24px',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px'
          }}>
            <Button
              variant="secondary"
              onClick={() => setShowModal(false)}
              style={{
                borderRadius: '8px',
                padding: '10px 20px',
                fontWeight: '600'
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={handleSoumission}
              disabled={!soumission.trim() || loading}
              style={{
                background: 'linear-gradient(135deg, var(--color-primary) 0%, #667eea 100%)',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 20px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <FiUpload />
              Soumettre
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Création - Modern Design */}
      <Modal show={showCreateModal} onHide={() => setShowCreateModal(false)} size="lg" centered>
        <div style={{
          background: 'var(--color-cardBg)',
          borderRadius: '16px',
          overflow: 'hidden',
          border: '1px solid var(--color-border)'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--color-primary) 0%, #667eea 100%)',
            padding: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h5 style={{ margin: 0, color: 'white', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <FiPlus size={24} />
              Créer un TP/TD
            </h5>
            <button
              onClick={() => setShowCreateModal(false)}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                borderRadius: '8px',
                padding: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                color: 'white'
              }}
            >
              <FiX size={20} />
            </button>
          </div>

          <div style={{ padding: '24px' }}>
            <Form>
              <Form.Group style={{ marginBottom: '20px' }}>
                <Form.Label style={{ color: 'var(--color-text)', fontWeight: '600', marginBottom: '8px' }}>
                  Titre
                </Form.Label>
                <Form.Control
                  type="text"
                  value={newAssignment.title}
                  onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                  placeholder="Ex: TP1 - Comptabilité"
                  style={{
                    background: 'var(--color-bodyBg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    color: 'var(--color-text)',
                    padding: '12px'
                  }}
                />
              </Form.Group>

              <Form.Group style={{ marginBottom: '20px' }}>
                <Form.Label style={{ color: 'var(--color-text)', fontWeight: '600', marginBottom: '8px' }}>
                  Type
                </Form.Label>
                <Form.Select
                  value={newAssignment.assignment_type}
                  onChange={(e) => setNewAssignment({ ...newAssignment, assignment_type: e.target.value })}
                  style={{
                    background: 'var(--color-bodyBg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    color: 'var(--color-text)',
                    padding: '12px'
                  }}
                >
                  <option value="tp">TP (Travaux Pratiques)</option>
                  <option value="td">TD (Travaux Dirigés)</option>
                </Form.Select>
              </Form.Group>

              <Form.Group style={{ marginBottom: '20px' }}>
                <Form.Label style={{ color: 'var(--color-text)', fontWeight: '600', marginBottom: '8px' }}>
                  Description
                </Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  value={newAssignment.description}
                  onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
                  placeholder="Description du devoir..."
                  style={{
                    background: 'var(--color-bodyBg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    color: 'var(--color-text)',
                    padding: '12px'
                  }}
                />
              </Form.Group>

              <Form.Group style={{ marginBottom: '20px' }}>
                <Form.Label style={{ color: 'var(--color-text)', fontWeight: '600', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FiCalendar />
                  Date d'échéance
                </Form.Label>
                <Form.Control
                  type="datetime-local"
                  value={newAssignment.due_date}
                  onChange={(e) => setNewAssignment({ ...newAssignment, due_date: e.target.value })}
                  style={{
                    background: 'var(--color-bodyBg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    color: 'var(--color-text)',
                    padding: '12px'
                  }}
                />
              </Form.Group>
            </Form>
          </div>

          <div style={{
            padding: '20px 24px',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px'
          }}>
            <Button
              variant="secondary"
              onClick={() => setShowCreateModal(false)}
              style={{
                borderRadius: '8px',
                padding: '10px 20px',
                fontWeight: '600'
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={handleCreateAssignment}
              disabled={!newAssignment.title || !newAssignment.due_date || loading}
              style={{
                background: 'linear-gradient(135deg, var(--color-primary) 0%, #667eea 100%)',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 20px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <FiPlus />
              Créer
            </Button>
          </div>
        </div>
      </Modal>
    </Container>
  )
}

export default TPTD
