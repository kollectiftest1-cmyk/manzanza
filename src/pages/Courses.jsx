"use client"

import { Container, Row, Col, Button, Badge, ProgressBar, Modal, Form, Table, Alert } from "react-bootstrap"
import { useState, useEffect } from "react"
import { useSelector, useDispatch } from "react-redux"
import { LinkContainer } from "react-router-bootstrap"
import { useNavigate } from "react-router-dom"
import { fetchMyCourses, fetchCourses, createCourse, updateCourse } from "../store/slices/coursesSlice"
import { getAuditoires } from "../services/auditoireService"
import { getUsers } from "../services/userService"

const Courses = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { courses, loading, error } = useSelector((state) => state.courses)
  const { user } = useSelector((state) => state.auth)

  // Modal and Form State
  const [showCourseModal, setShowCourseModal] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [courseData, setCourseData] = useState({ name: "", credits: 3, description: "", titulaire: "", auditoire: "" })

  // Data for dropdowns
  const [auditoires, setAuditoires] = useState([])
  const [filteredAuditoires, setFilteredAuditoires] = useState([]); // New state for filtered auditoires
  const [teachers, setTeachers] = useState([])

  // Fetch initial data
  useEffect(() => {
    if (user?.role === "etudiant") {
      dispatch(fetchMyCourses())
    } else {
      dispatch(fetchCourses())
    }
  }, [dispatch, user])

  const canCreateCourses = () => {
    return ["chef_section", "sga", "iadmin"].includes(user?.role)
  }

  // Fetch data for modals
  useEffect(() => {
    if (canCreateCourses()) {
      getAuditoires().then(res => {
        const allAuditoires = res.data.results || res.data;
        setAuditoires(allAuditoires);
        if (user?.role === "chef_section" && user?.section_id) {
          const filtered = allAuditoires.filter(a => a.section === user.section_id);
          setFilteredAuditoires(filtered);
          // If there's only one auditoire for the chef's section, pre-select it
          if (filtered.length === 1) {
            setCourseData(prev => ({ ...prev, auditoire: filtered[0].id }));
          }
        } else {
          setFilteredAuditoires(allAuditoires);
        }
      });
      getUsers({ role: 'enseignant' }).then(res => {
        setTeachers(res.data.results || res.data);
      });
    }
  }, [user, user?.section_id]); // Added user?.section_id to dependency array

  const handleOpenCreateModal = () => {
    setSelectedCourse(null)
    let initialAuditoire = "";
    if (user?.role === "chef_section" && filteredAuditoires.length > 0) {
        initialAuditoire = filteredAuditoires[0].id; // Pre-select the first auditoire in their section
    }
    setCourseData({ name: "", credits: 3, description: "", titulaire: "", auditoire: initialAuditoire })
    setShowCourseModal(true)
  }
  
  const handleOpenEditModal = (course) => {
    setSelectedCourse(course)
    setCourseData({ 
      name: course.name, 
      credits: course.credits, 
      description: course.description, 
      titulaire: course.titulaire, 
      auditoire: course.auditoire 
    })
    setShowCourseModal(true)
  }

  const handleSaveCourse = async () => {
    try {
      const dataToSave = { ...courseData, titulaire: parseInt(courseData.titulaire) };
      if (selectedCourse) {
        await dispatch(updateCourse({ id: selectedCourse.id, data: dataToSave })).unwrap()
      } else {
        await dispatch(createCourse(dataToSave)).unwrap()
      }
      setShowCourseModal(false)
    } catch (err) {
      console.error("Erreur lors de la sauvegarde:", err)
      alert(`Erreur: ${err.message || 'Vérifiez les champs.'}`)
    }
  }

  return (
    <Container fluid className="py-0">
      <Row className="mb-4 dashboard-card">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <h1 className="fw-bold mb-2">{user?.role === "etudiant" ? "Mes Cours" : "Gestion des Cours"}</h1>
            {canCreateCourses() && (
              <Button variant="primary" onClick={handleOpenCreateModal}><i className="fas fa-plus me-2"></i>Nouveau Cours</Button>
            )}
          </div>
        </Col>
      </Row>

      {loading && <p>Chargement des cours...</p>}
      {error && <Alert variant="danger">Erreur: {error}</Alert>}

      <Row>
        {(courses || []).map((course) => (
          <Col lg={6} key={course.id} className="mb-4">
            <div className="course-card shadow-sm border rounded p-4 h-100">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <h5 className="fw-bold mb-1">{course.name} ({course.code})</h5>
                  <div className="text-muted small">
                    <i className="fas fa-user-tie me-2"></i>Titulaire: {course.titulaire_name || 'N/A'}
                    <span className="ms-3"><i className="fas fa-credit-card me-2"></i>{course.credits} crédits</span>
                  </div>
                </div>
                <div>
                  <LinkContainer to={`/courses/${course.id}`}>
                    <Button size="sm" variant="primary" className="me-2">Voir</Button>
                  </LinkContainer>
                  {canCreateCourses() && <Button size="sm" variant="outline-secondary" onClick={() => handleOpenEditModal(course)}>Modifier</Button>}
                </div>
              </div>
              <p className="text-muted mb-3">{course.description}</p>
              <div className="text-muted small">
                <i className="fas fa-university me-2"></i>Auditoire: {course.auditoire_name || 'N/A'}
              </div>
            </div>
          </Col>
        ))}
      </Row>

      {courses.length === 0 && !loading && (
        <Row><Col className="text-center py-5"><i className="fas fa-book fa-3x text-muted mb-3"></i><h4 className="text-muted">Aucun cours disponible</h4></Col></Row>
      )}

      <Modal show={showCourseModal} onHide={() => setShowCourseModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{selectedCourse ? "Modifier le Cours" : "Nouveau Cours"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3"><Form.Label>Nom du Cours</Form.Label><Form.Control type="text" value={courseData.name} onChange={(e) => setCourseData({ ...courseData, name: e.target.value })} required /></Form.Group>
            <Row>
              <Col md={8}><Form.Group className="mb-3"><Form.Label>Auditoire</Form.Label>
                <Form.Select
                    value={courseData.auditoire}
                    onChange={(e) => setCourseData({ ...courseData, auditoire: e.target.value })}
                    required
                    disabled={user?.role === "chef_section" && filteredAuditoires.length === 1} // Disable if only one option
                >
                    <option value="">Choisir un auditoire...</option>
                    {(user?.role === "chef_section" ? filteredAuditoires : auditoires).map(a => (
                        <option key={a.id} value={a.id}>{a.nom}</option>
                    ))}
                </Form.Select>
              </Form.Group></Col>
              <Col md={4}><Form.Group className="mb-3"><Form.Label>Crédits</Form.Label><Form.Control type="number" value={courseData.credits} onChange={(e) => setCourseData({ ...courseData, credits: parseInt(e.target.value) })} min="1" required /></Form.Group></Col>
            </Row>
            <Form.Group className="mb-3"><Form.Label>Enseignant Titulaire</Form.Label><Form.Select value={courseData.titulaire} onChange={(e) => setCourseData({ ...courseData, titulaire: e.target.value })} required><option value="">Choisir un enseignant...</option>{teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</Form.Select></Form.Group>
            <Form.Group className="mb-3"><Form.Label>Description</Form.Label><Form.Control as="textarea" rows={3} value={courseData.description} onChange={(e) => setCourseData({ ...courseData, description: e.target.value })} /></Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCourseModal(false)}>Annuler</Button>
          <Button variant="primary" onClick={handleSaveCourse} disabled={loading}>Sauvegarder</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  )
}

export default Courses
