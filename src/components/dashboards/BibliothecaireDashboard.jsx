import { Container, Row, Col, Card, Button, Table, Badge, Form } from "react-bootstrap"
import { useSelector } from "react-redux"

const BibliothecaireDashboard = () => {
  const { user } = useSelector((state) => state.auth)

  const bibliothequeStats = {
    totalLivres: 15420,
    livresEmpruntes: 1250,
    livresDisponibles: 14170,
    utilisateursActifs: 890,
  }

  const empruntsRecents = [
    {
      id: 1,
      livre: "Comptabilité Générale",
      auteur: "Jean Martin",
      emprunteur: "Marie Dupont",
      dateEmprunt: "2024-01-15",
      dateRetour: "2024-02-15",
      statut: "En cours",
    },
    {
      id: 2,
      livre: "Économie Politique",
      auteur: "Paul Bernard",
      emprunteur: "Jean Leroy",
      dateEmprunt: "2024-01-14",
      dateRetour: "2024-02-14",
      statut: "En retard",
    },
    {
      id: 3,
      livre: "Mathématiques Financières",
      auteur: "Sophie Dubois",
      emprunteur: "Pierre Martin",
      dateEmprunt: "2024-01-13",
      dateRetour: "2024-02-13",
      statut: "En cours",
    },
  ]

  return (
    <Container fluid className="py-0" style={{ }}>
      <Row className="mb-4 dashboard-card">
        <Col>
          <h2 className="text-primary fw-bold">Tableau de Bord - Bibliothécaire</h2>
          <p className="text-muted">Gestion de la Bibliothèque Universitaire</p>
        </Col>
      </Row>

      {/* Library Statistics */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="card-custom text-center">
            <Card.Body>
              <i className="fas fa-book fa-2x text-primary mb-3"></i>
              <h4 className="fw-bold">{bibliothequeStats.totalLivres.toLocaleString()}</h4>
              <p className="text-muted mb-0">Total Livres</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="card-custom text-center">
            <Card.Body>
              <i className="fas fa-book-open fa-2x text-warning mb-3"></i>
              <h4 className="fw-bold">{bibliothequeStats.livresEmpruntes.toLocaleString()}</h4>
              <p className="text-muted mb-0">Empruntés</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="card-custom text-center">
            <Card.Body>
              <i className="fas fa-check-circle fa-2x text-success mb-3"></i>
              <h4 className="fw-bold">{bibliothequeStats.livresDisponibles.toLocaleString()}</h4>
              <p className="text-muted mb-0">Disponibles</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="card-custom text-center">
            <Card.Body>
              <i className="fas fa-users fa-2x text-info mb-3"></i>
              <h4 className="fw-bold">{bibliothequeStats.utilisateursActifs}</h4>
              <p className="text-muted mb-0">Utilisateurs Actifs</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col lg={8}>
          <Card className="card-custom">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="fw-bold mb-0">Emprunts Récents</h5>
              <Button size="sm" className="btn-primary-custom">
                <i className="fas fa-plus me-1"></i>
                Nouvel Emprunt
              </Button>
            </Card.Header>
            <Card.Body>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Livre</th>
                    <th>Auteur</th>
                    <th>Emprunteur</th>
                    <th>Date Emprunt</th>
                    <th>Date Retour</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {empruntsRecents.map((emprunt) => (
                    <tr key={emprunt.id}>
                      <td className="fw-semibold">{emprunt.livre}</td>
                      <td>{emprunt.auteur}</td>
                      <td>{emprunt.emprunteur}</td>
                      <td>{emprunt.dateEmprunt}</td>
                      <td>{emprunt.dateRetour}</td>
                      <td>
                        <Badge bg={emprunt.statut === "En cours" ? "success" : "danger"}>{emprunt.statut}</Badge>
                      </td>
                      <td>
                        <Button size="sm" variant="outline-primary" className="me-1">
                          <i className="fas fa-edit"></i>
                        </Button>
                        <Button size="sm" variant="outline-success">
                          <i className="fas fa-undo"></i>
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
              <h6 className="fw-bold mb-0">Recherche Rapide</h6>
            </Card.Header>
            <Card.Body>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Control type="text" placeholder="Rechercher un livre..." />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Select>
                    <option>Tous les auteurs</option>
                    <option>Jean Martin</option>
                    <option>Paul Bernard</option>
                    <option>Sophie Dubois</option>
                  </Form.Select>
                </Form.Group>
                <Button className="btn-primary-custom w-100">
                  <i className="fas fa-search me-2"></i>
                  Rechercher
                </Button>
              </Form>
            </Card.Body>
          </Card>

          <Card className="card-custom mb-4">
            <Card.Header>
              <h6 className="fw-bold mb-0">Actions Rapides</h6>
            </Card.Header>
            <Card.Body>
              <div className="d-grid gap-2">
                <Button variant="outline-primary">
                  <i className="fas fa-plus me-2"></i>
                  Ajouter Livre
                </Button>
                <Button variant="outline-success">
                  <i className="fas fa-user-plus me-2"></i>
                  Nouvel Utilisateur
                </Button>
                <Button variant="outline-info">
                  <i className="fas fa-chart-bar me-2"></i>
                  Statistiques
                </Button>
                <Button variant="outline-warning">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  Retards
                </Button>
              </div>
            </Card.Body>
          </Card>

          <Card className="card-custom">
            <Card.Header>
              <h6 className="fw-bold mb-0">Alertes</h6>
            </Card.Header>
            <Card.Body>
              <div className="alert alert-warning">
                <i className="fas fa-clock me-2"></i>
                <strong>5 livres</strong> en retard de retour
              </div>
              <div className="alert alert-info">
                <i className="fas fa-info-circle me-2"></i>
                <strong>Nouveau:</strong> 15 livres ajoutés cette semaine
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default BibliothecaireDashboard
