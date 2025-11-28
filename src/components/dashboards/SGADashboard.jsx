import { Container, Row, Col, Card, Button, Table, Badge, ProgressBar } from "react-bootstrap"
import { LinkContainer } from "react-router-bootstrap"
import { useState, useEffect } from "react"
import { getSgaDashboardStats } from "../../services/statsService"
import { getSections } from "../../services/sectionService"
import { getAcademicCalendarEvents } from "../../services/coreService"

const SGADashboard = ({ user }) => {
  const [stats, setStats] = useState({
    total_students: 0,
    pending_inscriptions: 0,
    total_sections: 0,
    total_auditoires: 0,
  })
  const [sections, setSections] = useState([])
  const [calendarEvents, setCalendarEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, sectionsRes, calendarRes] = await Promise.all([
          getSgaDashboardStats(),
          getSections(),
          getAcademicCalendarEvents(),
        ])
        setStats(statsRes.data)
        setSections(sectionsRes.data.results)
        setCalendarEvents(calendarRes.data.results)
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  return (
    <Container className="py-0" style={{  }}>
      <Row className="mb-4">
        <Col>
          <div className="dashboard-card">
            <Row className="align-items-center">
              <Col md={8}>
                <h1 className="h2 fw-bold mb-2">SGA - Secrétariat Général Académique</h1>
                <p className="text-muted mb-3">Bienvenue {user?.name} | Gestion Académique Globale</p>
                <div className="d-flex gap-2 flex-wrap">
                  <LinkContainer to="/auditoires">
                    <Button className="btn-primary-custom">
                      <i className="fas fa-users me-2"></i>Gestion Academ
                    </Button>
                  </LinkContainer>
                  <LinkContainer to="/gestion-inscriptions">
                    <Button variant="outline-primary">
                      <i className="fas fa-cog me-2"></i>Inscriptions
                    </Button>
                  </LinkContainer>
                  <LinkContainer to="/courses">
                    <Button variant="outline-success">
                      <i className="fas fa-book me-2"></i>Cours
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
          {/* SGA Stats */}
          <Row className="mb-4">
            <Col md={3}>
              <div className="stat-card">
                <div className="stat-number">{loading ? '...' : stats.total_sections}</div>
                <div className="stat-label">Sections Actives</div>
              </div>
            </Col>
            <Col md={3}>
              <div className="stat-card">
                <div className="stat-number">{loading ? '...' : stats.total_auditoires}</div>
                <div className="stat-label">Auditoires</div>
              </div>
            </Col>
            <Col md={3}>
              <div className="stat-card">
                <div className="stat-number">{loading ? '...' : stats.total_students}</div>
                <div className="stat-label">Étudiants Inscrits</div>
              </div>
            </Col>
            <Col md={3}>
              <div className="stat-card text-warning">
                <div className="stat-number">{loading ? '...' : stats.pending_inscriptions}</div>
                <div className="stat-label">Inscriptions Pendantes</div>
              </div>
            </Col>
          </Row>

          {/* Sections Management */}
          <Card className="card-custom mb-4">
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="fw-bold mb-0">Gestion des Sections</h5>
                 <LinkContainer to="/auditoires">
                    <Button className="btn-primary-custom">
                      <i className="fas fa-users me-2"></i>Section
                    </Button>
                  </LinkContainer>
              </div>
            </Card.Header>
            <Card.Body>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Section</th>
                    <th>Chef de Section</th>
                    <th>Auditoires</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="5">Chargement...</td>
                    </tr>
                  ) : (
                    sections.map((section) => (
                      <tr key={section.id}>
                        <td>
                          <div className="fw-semibold">{section.nom}</div>
                        </td>
                        <td>{section.chef_section_name}</td>
                        <td>
                          <Badge bg="info">{section.auditoires_count}</Badge>
                        </td>
                        <td>
                          <Badge bg="success">Active</Badge>
                        </td>
                        <td>
                          <Button size="sm" variant="outline-primary">
                            Gérer
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
        </Row>
        <Row>
        <Col lg={12}>

          {/* Academic Calendar */}
          <Card className="card-custom mb-4">
            <Card.Header>
              <h6 className="fw-bold mb-0">Calendrier Académique</h6>
            </Card.Header>
            <Card.Body>
              {loading ? (
                <p>Chargement...</p>
              ) : (
                calendarEvents.map((event) => (
                  <div className="mb-2" key={event.id}>
                    <div className="fw-semibold">{event.title}</div>
                    <small className="text-muted">
                      {new Date(event.start_date).toLocaleDateString()} - {event.end_date ? new Date(event.end_date).toLocaleDateString() : ''}
                    </small>
                  </div>
                ))
              )}
            </Card.Body>
          </Card>

          {/* Quick Stats */}
          <Card className="card-custom">
            <Card.Header>
              <h6 className="fw-bold mb-0">Statistiques Rapides</h6>
            </Card.Header>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span>Taux de réussite</span>
                <Badge bg="success">87%</Badge>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span>Présence moyenne</span>
                <Badge bg="info">92%</Badge>
              </div>
              <div className="d-flex justify-content-between align-items-center">
                <span>Cours programmés</span>
                <Badge bg="primary">156</Badge>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default SGADashboard
