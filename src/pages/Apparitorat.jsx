"use client"

import { useState, useEffect } from "react"
import { Container, Row, Col, Card, Button, Table, Badge, Form, Modal } from "react-bootstrap"
import { useSelector } from "react-redux"

const Apparitorat = () => {
  const { user } = useSelector((state) => state.auth)
  const [reservations, setReservations] = useState([])
  const [salles, setSalles] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [newReservation, setNewReservation] = useState({
    salle: "",
    date: "",
    heureDebut: "",
    heureFin: "",
    motif: "",
    equipements: [],
  })

  useEffect(() => {
    // Simuler le chargement des données
    setSalles([
      { id: 1, nom: "Amphithéâtre A", capacite: 200, equipements: ["Projecteur", "Micro", "Tableau"] },
      { id: 2, nom: "Salle 101", capacite: 50, equipements: ["Projecteur", "Tableau"] },
      { id: 3, nom: "Salle 102", capacite: 30, equipements: ["Tableau"] },
      { id: 4, nom: "Laboratoire Info", capacite: 25, equipements: ["Ordinateurs", "Projecteur"] },
    ])

    setReservations([
      {
        id: 1,
        salle: "Amphithéâtre A",
        date: "2024-01-20",
        heureDebut: "08:00",
        heureFin: "10:00",
        motif: "Cours de Comptabilité Générale",
        demandeur: "Prof. Martin",
        statut: "confirmee",
      },
      {
        id: 2,
        salle: "Salle 101",
        date: "2024-01-20",
        heureDebut: "14:00",
        heureFin: "16:00",
        motif: "TD Économie",
        demandeur: "Prof. Dubois",
        statut: "en-attente",
      },
    ])
  }, [])

  const handleSubmitReservation = (e) => {
    e.preventDefault()
    const reservation = {
      id: reservations.length + 1,
      ...newReservation,
      demandeur: user.name,
      statut: "en-attente",
    }
    setReservations([...reservations, reservation])
    setNewReservation({
      salle: "",
      date: "",
      heureDebut: "",
      heureFin: "",
      motif: "",
      equipements: [],
    })
    setShowModal(false)
  }

  const getStatutColor = (statut) => {
    switch (statut) {
      case "confirmee":
        return "success"
      case "en-attente":
        return "warning"
      case "refusee":
        return "danger"
      default:
        return "secondary"
    }
  }

  return (
    <Container fluid className="py-4">
      <Row>
        <Col>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="text-primary">Apparitorat - Gestion des Salles</h2>
            <Button variant="primary" onClick={() => setShowModal(true)}>
              Nouvelle Réservation
            </Button>
          </div>
        </Col>
      </Row>

      {/* Statistiques */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center border-0 shadow-sm">
            <Card.Body>
              <h3 className="text-primary">{salles.length}</h3>
              <p className="text-muted mb-0">Salles Disponibles</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-0 shadow-sm">
            <Card.Body>
              <h3 className="text-success">15</h3>
              <p className="text-muted mb-0">Réservations Confirmées</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-0 shadow-sm">
            <Card.Body>
              <h3 className="text-warning">3</h3>
              <p className="text-muted mb-0">En Attente</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-0 shadow-sm">
            <Card.Body>
              <h3 className="text-info">85%</h3>
              <p className="text-muted mb-0">Taux d'Occupation</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        {/* Liste des salles */}
        <Col md={6}>
          <Card className="border-0 shadow-sm mb-4">
            <Card.Header className="bg-white">
              <h5 className="mb-0">Salles Disponibles</h5>
            </Card.Header>
            <Card.Body>
              {salles.map((salle) => (
                <Card key={salle.id} className="mb-3 border">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <h6 className="text-primary">{salle.nom}</h6>
                        <p className="text-muted mb-1">Capacité: {salle.capacite} places</p>
                        <div>
                          {salle.equipements.map((eq, index) => (
                            <Badge key={index} bg="info" className="me-1">
                              {eq}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Badge bg="success">Disponible</Badge>
                    </div>
                  </Card.Body>
                </Card>
              ))}
            </Card.Body>
          </Card>
        </Col>

        {/* Réservations */}
        <Col md={6}>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white">
              <h5 className="mb-0">Réservations</h5>
            </Card.Header>
            <Card.Body className="p-0">
              <Table responsive hover className="mb-0">
                <thead className="bg-light">
                  <tr>
                    <th>Salle</th>
                    <th>Date</th>
                    <th>Heure</th>
                    <th>Motif</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.map((reservation) => (
                    <tr key={reservation.id}>
                      <td>{reservation.salle}</td>
                      <td>{reservation.date}</td>
                      <td>
                        {reservation.heureDebut} - {reservation.heureFin}
                      </td>
                      <td>{reservation.motif}</td>
                      <td>
                        <Badge bg={getStatutColor(reservation.statut)}>{reservation.statut}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Modal nouvelle réservation */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Nouvelle Réservation de Salle</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmitReservation}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Salle</Form.Label>
                  <Form.Select
                    value={newReservation.salle}
                    onChange={(e) => setNewReservation({ ...newReservation, salle: e.target.value })}
                    required
                  >
                    <option value="">Sélectionner une salle</option>
                    {salles.map((salle) => (
                      <option key={salle.id} value={salle.nom}>
                        {salle.nom} (Capacité: {salle.capacite})
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={newReservation.date}
                    onChange={(e) => setNewReservation({ ...newReservation, date: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Heure de début</Form.Label>
                  <Form.Control
                    type="time"
                    value={newReservation.heureDebut}
                    onChange={(e) => setNewReservation({ ...newReservation, heureDebut: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Heure de fin</Form.Label>
                  <Form.Control
                    type="time"
                    value={newReservation.heureFin}
                    onChange={(e) => setNewReservation({ ...newReservation, heureFin: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Motif de la réservation</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={newReservation.motif}
                onChange={(e) => setNewReservation({ ...newReservation, motif: e.target.value })}
                required
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Annuler
            </Button>
            <Button variant="primary" type="submit">
              Réserver
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  )
}

export default Apparitorat
