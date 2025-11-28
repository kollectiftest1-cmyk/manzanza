"use client"

import { useState, useEffect } from "react"
import { Container, Row, Col, Card, Button, Badge, Tab, Tabs, ListGroup, Form, Spinner, Alert } from "react-bootstrap"
import { useParams, Link } from "react-router-dom"
import { getAuditoireDetail, getAuditoireStudents, getAuditoireCourses } from "../services/auditoireService"

const AuditoireDetail = () => {
  const { id } = useParams()
  const [auditoire, setAuditoire] = useState(null)
  const [students, setStudents] = useState([])
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState("cours")

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [auditoireRes, studentsRes, coursesRes] = await Promise.all([
          getAuditoireDetail(id),
          getAuditoireStudents(id),
          getAuditoireCourses(id)
        ])
        setAuditoire(auditoireRes.data)
        setStudents(studentsRes.data)
        setCourses(coursesRes.data)
      } catch (err) {
        setError("Impossible de charger les détails de l'auditoire.")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  if (loading) {
    return (
      <Container className="py-4 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Chargement des détails de l'auditoire...</p>
      </Container>
    )
  }

  if (error) {
    return <Container className="py-4"><Alert variant="danger">{error}</Alert></Container>
  }

  if (!auditoire) {
    return <Container className="py-4"><Alert variant="warning">Aucun auditoire trouvé.</Alert></Container>
  }

  return (
    <Container fluid className="py-0">
      {/* En-tête */}
      <Row className="mb-4 dashboard-card">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="text-primary mb-1"><i className="fas fa-users me-2"></i>{auditoire.nom}</h2>
              <div>
                <Badge bg="info" className="me-2">{auditoire.niveau}</Badge>
                <Badge bg="success">{auditoire.filiere_name}</Badge>
              </div>
            </div>
            <Link to="/auditoires" className="btn btn-outline-secondary"><i className="fas fa-arrow-left me-2"></i>Retour</Link>
          </div>
        </Col>
      </Row>

      {/* Statistiques */}
      <Row className="mb-4">
        <Col md={4}><Card className="text-center border-0 shadow-sm"><Card.Body><h3 className="text-primary">{students.length}</h3><p className="text-muted mb-0">Étudiants Inscrits</p></Card.Body></Card></Col>
        <Col md={4}><Card className="text-center border-0 shadow-sm"><Card.Body><h3 className="text-success">{courses.length}</h3><p className="text-muted mb-0">Cours Actifs</p></Card.Body></Card></Col>
        <Col md={4}><Card className="text-center border-0 shadow-sm"><Card.Body><h3 className="text-warning">{courses.reduce((total, cours) => total + cours.credits, 0)}</h3><p className="text-muted mb-0">Total Crédits</p></Card.Body></Card></Col>
      </Row>

      {/* Onglets */}
      <Card className="border-0 shadow-sm">
        <Card.Body>
          <Tabs activeKey={activeTab} onSelect={setActiveTab} className="mb-4">
            <Tab eventKey="cours" title={<><i className="fas fa-book me-2"></i>Cours</>}>
              <Row>
                {courses.map((cours) => (
                  <Col md={6} lg={4} key={cours.id} className="mb-3">
                    <Card className="h-100 border-0 shadow-sm">
                      <Card.Body>
                        <h6 className="text-primary">{cours.name}</h6>
                        <p className="text-muted small mb-2"><i className="fas fa-user me-1"></i>{cours.teacher_name}</p>
                        <div className="d-flex justify-content-between align-items-center">
                          <Badge bg="info">{cours.credits} crédits</Badge>
                        </div>
                        <div className="mt-2"><Link to={`/courses/${cours.id}`} className="btn btn-sm btn-outline-primary">Voir Détails</Link></div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Tab>

            <Tab eventKey="etudiants" title={<><i className="fas fa-user-graduate me-2"></i>Étudiants</>}>
              <ListGroup variant="flush">
                {students.map((etudiant) => (
                  <ListGroup.Item key={etudiant.id} className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="mb-1">{etudiant.name}</h6>
                      <small className="text-muted">Matricule: {etudiant.matricule || 'N/A'}</small>
                    </div>
                    <div>
                      <Button as={Link} to={`/profile/${etudiant.id}`} variant="outline-primary" size="sm">
                        <i className="fas fa-eye me-2"></i>Voir le profil
                      </Button>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </Tab>
            
            {/* Les onglets Planning et Discussion restent en données mock pour l'instant */}
            <Tab eventKey="planning" title={<><i className="fas fa-calendar me-2"></i>Planning</>}><p className="text-center text-muted">Fonctionnalité de planning à venir.</p></Tab>
            <Tab eventKey="chat" title={<><i className="fas fa-comments me-2"></i>Discussion</>}><p className="text-center text-muted">Fonctionnalité de discussion à venir.</p></Tab>
          </Tabs>
        </Card.Body>
      </Card>
    </Container>
  )
}

export default AuditoireDetail
