import { Container, Row, Col, Card, Button, Table, ProgressBar } from "react-bootstrap"
import { useSelector, useDispatch } from "react-redux"
import { useEffect } from "react"
import { fetchAuditoires } from "../../store/slices/auditoiresSlice"
import { fetchCourses } from "../../store/slices/coursesSlice"

const ChefDepartementDashboard = () => {
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)
  const { auditoires } = useSelector((state) => state.auditoires)
  const { courses } = useSelector((state) => state.courses)

  const userFiliereId = user?.filiere; // Supposons que l'objet user a une propriété filiere avec un id
 console.log('e',auditoires);
 
  useEffect(() => {
    if (userFiliereId) {
      dispatch(fetchAuditoires({ filiere: userFiliereId }))
      dispatch(fetchCourses({ filiere: userFiliereId }))
    } else {
      // Gérer le cas où l'ID de la filière n'est pas disponible (par exemple, charger tous les auditoires/cours ou afficher un message)
      // Pour l'instant, nous ne faisons rien si l'ID n'est pas là, ce qui signifie que les listes resteront vides.
      // Vous pourriez vouloir charger tous les auditoires/cours ou afficher un message d'erreur/chargement.
      console.warn("L'ID de la filière de l'utilisateur n'est pas disponible. Impossible de filtrer les auditoires et les cours.")
    }
  }, [dispatch, userFiliereId])

  // Calculate real statistics from backend data
  // Ensure departementAuditoires is always an array
  const departementAuditoires = (auditoires && auditoires.results) ? auditoires.results : auditoires || [];
  const departementCourses = (courses && courses.results) ? courses.results : courses || []; // Assurez-vous que courses est aussi un tableau

  const departementStats = {
    totalAuditoires: departementAuditoires.length,
    totalEtudiants: departementAuditoires.reduce((sum, aud) => sum + (aud.etudiants_count || 0), 0), // Utiliser etudiants_count
    totalEnseignants: new Set(departementCourses.map(c => c.titulaire?.id)).size, // Utiliser c.titulaire.id
    coursActifs: departementCourses.filter(c => c.is_active).length,
  }

  const auditoiresList = departementAuditoires.map(aud => ({
    id: aud.id,
    nom: aud.nom, // Utiliser aud.nom au lieu de aud.name
    level: aud.niveau, // Utiliser aud.niveau au lieu de aud.level
    program: aud.filiere_name, // Utiliser aud.filiere_name au lieu de aud.program
    etudiants: aud.etudiants_count || 0,
    cours: aud.cours_count || 0,
    performance: Math.round(Math.random() * 20 + 75) // Mock performance - should come from grades API
  }))

  return (
    <Container fluid className="py-0" style={{ }}>
      <Row className="mb-4 dashboard-card">
        <Col>
          <h2 className="text-primary fw-bold">Tableau de Bord - Chef de Département</h2>
          <p className="text-muted">Département: {user?.departement?.nom || "Sciences Économiques et de Gestion"}</p> {/* Afficher le nom du département si disponible */}
        </Col>
      </Row>

      {/* Statistics Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="card-custom text-center">
            <Card.Body>
              <i className="fas fa-sitemap fa-2x text-primary mb-3"></i>
              <h4 className="fw-bold">{departementStats.totalAuditoires}</h4>
              <p className="text-muted mb-0">Auditoires</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="card-custom text-center">
            <Card.Body>
              <i className="fas fa-users fa-2x text-success mb-3"></i>
              <h4 className="fw-bold">{departementStats.totalEtudiants}</h4>
              <p className="text-muted mb-0">Étudiants</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="card-custom text-center">
            <Card.Body>
              <i className="fas fa-chalkboard-teacher fa-2x text-warning mb-3"></i>
              <h4 className="fw-bold">{departementStats.totalEnseignants}</h4>
              <p className="text-muted mb-0">Enseignants</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="card-custom text-center">
            <Card.Body>
              <i className="fas fa-book fa-2x text-info mb-3"></i>
              <h4 className="fw-bold">{departementStats.coursActifs}</h4>
              <p className="text-muted mb-0">Cours Actifs</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col lg={8}>
          <Card className="card-custom">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="fw-bold mb-0">Gestion des Auditoires</h5>
              <Button size="sm" className="btn-primary-custom">
                <i className="fas fa-plus me-1"></i>
                Nouvel Auditoire
              </Button>
            </Card.Header>
            <Card.Body>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Auditoire</th>
                    <th>Étudiants</th>
                    <th>Cours</th>
                    <th>Performance</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {auditoiresList.map((auditoire) => (
                    <tr key={auditoire.id}>
                      <td className="fw-semibold">{auditoire.nom}</td>
                      <td>{auditoire.etudiants}</td>
                      <td>{auditoire.cours}</td>
                      <td>
                        <div className="d-flex align-items-center">
                          <ProgressBar
                            now={auditoire.performance}
                            variant={
                              auditoire.performance >= 85 ? "success" : auditoire.performance >= 70 ? "warning" : "danger"
                            }
                            style={{ width: "60px", height: "8px" }}
                            className="me-2"
                          />
                          <small>{auditoire.performance}%</small>
                        </div>
                      </td>
                      <td>
                        <Button size="sm" variant="outline-primary" className="me-1">
                          <i className="fas fa-edit"></i>
                        </Button>
                        <Button size="sm" variant="outline-info">
                          <i className="fas fa-eye"></i>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={4}>
          <Card className="card-custom mb-4">
            <Card.Header>
              <h6 className="fw-bold mb-0">Actions Rapides</h6>
            </Card.Header>
            <Card.Body>
              <div className="d-grid gap-2">
                <Button variant="outline-primary">
                  <i className="fas fa-user-tie me-2"></i>
                  Nommer Chef Auditoire
                </Button>
                <Button variant="outline-success">
                  <i className="fas fa-chart-line me-2"></i>
                  Rapport Département
                </Button>
                <Button variant="outline-info">
                  <i className="fas fa-calendar-alt me-2"></i>
                  Planning Global
                </Button>
                <Button variant="outline-warning">
                  <i className="fas fa-cogs me-2"></i>
                  Paramètres Département
                </Button>
              </div>
            </Card.Body>
          </Card>

          <Card className="card-custom">
            <Card.Header>
              <h6 className="fw-bold mb-0">Alertes Importantes</h6>
            </Card.Header>
            <Card.Body>
              <div className="alert alert-warning">
                <i className="fas fa-exclamation-triangle me-2"></i>
                <strong>Attention:</strong> Auditoire Finance nécessite un nouvel enseignant
              </div>
              <div className="alert alert-info">
                <i className="fas fa-info-circle me-2"></i>
                <strong>Info:</strong> Réunion département prévue demain
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default ChefDepartementDashboard
