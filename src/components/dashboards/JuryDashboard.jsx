import { Container, Row, Col, Card, Button, Table, Badge } from "react-bootstrap"
import { useSelector } from "react-redux"

const JuryDashboard = () => {
  const { user } = useSelector((state) => state.auth)

  const juryStats = {
    memoiresSoumis: 45,
    memoiresEvalues: 32,
    defensesProgrammees: 8,
    defensesTerminees: 24,
  }

  const memoiresEnAttente = [
    {
      id: 1,
      titre: "Impact de la digitalisation sur la comptabilité",
      etudiant: "Jean Dupont",
      directeur: "Prof. Martin",
      dateDepot: "2024-01-10",
      statut: "En évaluation",
      priorite: "Normale",
    },
    {
      id: 2,
      titre: "Analyse financière des PME congolaises",
      etudiant: "Marie Bernard",
      directeur: "Dr. Dubois",
      dateDepot: "2024-01-08",
      statut: "Défense programmée",
      priorite: "Urgente",
    },
    {
      id: 3,
      titre: "Gestion des risques bancaires",
      etudiant: "Paul Leroy",
      directeur: "Prof. Mukendi",
      dateDepot: "2024-01-12",
      statut: "Corrections demandées",
      priorite: "Normale",
    },
  ]

  const defensesProchaines = [
    {
      id: 1,
      etudiant: "Marie Bernard",
      titre: "Analyse financière des PME congolaises",
      date: "2024-01-20",
      heure: "09:00",
      salle: "Amphi A",
      jury: ["Prof. Martin", "Dr. Dubois", "Prof. Mukendi"],
    },
    {
      id: 2,
      etudiant: "Pierre Kasongo",
      titre: "Audit interne et performance",
      date: "2024-01-22",
      heure: "14:00",
      salle: "Salle 201",
      jury: ["Dr. Dubois", "Prof. Bernard", "Prof. Leroy"],
    },
  ]

  return (
    <Container fluid className="py-0" style={{ }}>
      <Row className="mb-4 dashboard-card">
        <Col>
          <h2 className="text-primary fw-bold">Tableau de Bord - Jury Mémoire</h2>
          <p className="text-muted">Gestion des Mémoires et Défenses</p>
        </Col>
      </Row>

      {/* Jury Statistics */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="card-custom text-center">
            <Card.Body>
              <i className="fas fa-file-alt fa-2x text-primary mb-3"></i>
              <h4 className="fw-bold">{juryStats.memoiresSoumis}</h4>
              <p className="text-muted mb-0">Mémoires Soumis</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="card-custom text-center">
            <Card.Body>
              <i className="fas fa-check-circle fa-2x text-success mb-3"></i>
              <h4 className="fw-bold">{juryStats.memoiresEvalues}</h4>
              <p className="text-muted mb-0">Mémoires Évalués</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="card-custom text-center">
            <Card.Body>
              <i className="fas fa-calendar-alt fa-2x text-warning mb-3"></i>
              <h4 className="fw-bold">{juryStats.defensesProgrammees}</h4>
              <p className="text-muted mb-0">Défenses Programmées</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="card-custom text-center">
            <Card.Body>
              <i className="fas fa-graduation-cap fa-2x text-info mb-3"></i>
              <h4 className="fw-bold">{juryStats.defensesTerminees}</h4>
              <p className="text-muted mb-0">Défenses Terminées</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col lg={8}>
          <Card className="card-custom mb-4">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="fw-bold mb-0">Mémoires en Évaluation</h5>
              <Button size="sm" className="btn-primary-custom">
                <i className="fas fa-plus me-1"></i>
                Nouveau Mémoire
              </Button>
            </Card.Header>
            <Card.Body>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Titre</th>
                    <th>Étudiant</th>
                    <th>Directeur</th>
                    <th>Date Dépôt</th>
                    <th>Statut</th>
                    <th>Priorité</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {memoiresEnAttente.map((memoire) => (
                    <tr key={memoire.id}>
                      <td className="fw-semibold">{memoire.titre}</td>
                      <td>{memoire.etudiant}</td>
                      <td>{memoire.directeur}</td>
                      <td>{memoire.dateDepot}</td>
                      <td>
                        <Badge
                          bg={
                            memoire.statut === "En évaluation"
                              ? "warning"
                              : memoire.statut === "Défense programmée"
                                ? "success"
                                : "info"
                          }
                        >
                          {memoire.statut}
                        </Badge>
                      </td>
                      <td>
                        <Badge bg={memoire.priorite === "Urgente" ? "danger" : "secondary"}>{memoire.priorite}</Badge>
                      </td>
                      <td>
                        <Button size="sm" variant="outline-primary" className="me-1">
                          <i className="fas fa-eye"></i>
                        </Button>
                        <Button size="sm" variant="outline-success">
                          <i className="fas fa-edit"></i>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>

          <Card className="card-custom">
            <Card.Header>
              <h5 className="fw-bold mb-0">Défenses Prochaines</h5>
            </Card.Header>
            <Card.Body>
              {defensesProchaines.map((defense) => (
                <div key={defense.id} className="border rounded p-3 mb-3">
                  <Row>
                    <Col md={8}>
                      <h6 className="fw-bold mb-1">{defense.etudiant}</h6>
                      <p className="text-muted mb-2">{defense.titre}</p>
                      <div className="d-flex align-items-center mb-2">
                        <i className="fas fa-calendar me-2 text-primary"></i>
                        <span className="me-3">{defense.date}</span>
                        <i className="fas fa-clock me-2 text-primary"></i>
                        <span className="me-3">{defense.heure}</span>
                        <i className="fas fa-door-open me-2 text-primary"></i>
                        <span>{defense.salle}</span>
                      </div>
                      <div>
                        <small className="text-muted">Jury: </small>
                        <small>{defense.jury.join(", ")}</small>
                      </div>
                    </Col>
                    <Col md={4} className="text-end">
                      <Button size="sm" variant="outline-primary" className="me-1">
                        <i className="fas fa-edit"></i>
                      </Button>
                      <Button size="sm" variant="outline-info">
                        <i className="fas fa-calendar-check"></i>
                      </Button>
                    </Col>
                  </Row>
                </div>
              ))}
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
                  <i className="fas fa-file-upload me-2"></i>
                  Soumettre Mémoire
                </Button>
                <Button variant="outline-success">
                  <i className="fas fa-calendar-plus me-2"></i>
                  Programmer Défense
                </Button>
                <Button variant="outline-info">
                  <i className="fas fa-users me-2"></i>
                  Constituer Jury
                </Button>
                <Button variant="outline-warning">
                  <i className="fas fa-chart-bar me-2"></i>
                  Rapport Jury
                </Button>
              </div>
            </Card.Body>
          </Card>

          <Card className="card-custom mb-4">
            <Card.Header>
              <h6 className="fw-bold mb-0">Statistiques Période</h6>
            </Card.Header>
            <Card.Body>
              <div className="mb-3">
                <div className="d-flex justify-content-between">
                  <small>Taux de réussite</small>
                  <small className="fw-bold">92%</small>
                </div>
                <div className="progress" style={{ height: "8px" }}>
                  <div className="progress-bar bg-success" style={{ width: "92%" }}></div>
                </div>
              </div>
              <div className="mb-3">
                <small className="text-muted">Note moyenne</small>
                <div className="fw-semibold">14.5/20</div>
              </div>
              <div>
                <small className="text-muted">Délai moyen évaluation</small>
                <div className="fw-semibold">12 jours</div>
              </div>
            </Card.Body>
          </Card>

          <Card className="card-custom">
            <Card.Header>
              <h6 className="fw-bold mb-0">Rappels Importants</h6>
            </Card.Header>
            <Card.Body>
              <div className="alert alert-warning">
                <i className="fas fa-clock me-2"></i>
                <strong>Urgent:</strong> 3 mémoires à évaluer avant vendredi
              </div>
              <div className="alert alert-info">
                <i className="fas fa-info-circle me-2"></i>
                <strong>Info:</strong> Réunion jury lundi 9h
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default JuryDashboard
