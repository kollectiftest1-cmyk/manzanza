"use client"

import { useState, useEffect } from "react"
import { Container, Row, Col, Card, Button, Table, Badge, Form, Modal } from "react-bootstrap"
import { useSelector } from "react-redux"

const ServiceIT = () => {
  const { user } = useSelector((state) => state.auth)
  const [tickets, setTickets] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [newTicket, setNewTicket] = useState({
    title: "",
    description: "",
    priority: "medium",
    category: "hardware",
  })

  useEffect(() => {
    // Simuler le chargement des tickets
    setTickets([
      {
        id: 1,
        title: "Problème de connexion WiFi",
        description: "Impossible de se connecter au réseau universitaire",
        status: "open",
        priority: "high",
        category: "network",
        createdBy: "Jean Dupont",
        createdAt: "2024-01-15",
        assignedTo: "Admin IT",
      },
      {
        id: 2,
        title: "Ordinateur en panne",
        description: "L'ordinateur de la salle 101 ne démarre plus",
        status: "in-progress",
        priority: "medium",
        category: "hardware",
        createdBy: "Marie Martin",
        createdAt: "2024-01-14",
        assignedTo: "Technicien A",
      },
    ])
  }, [])

  const handleSubmitTicket = (e) => {
    e.preventDefault()
    const ticket = {
      id: tickets.length + 1,
      ...newTicket,
      status: "open",
      createdBy: user.name,
      createdAt: new Date().toISOString().split("T")[0],
      assignedTo: "En attente",
    }
    setTickets([...tickets, ticket])
    setNewTicket({ title: "", description: "", priority: "medium", category: "hardware" })
    setShowModal(false)
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "danger"
      case "medium":
        return "warning"
      case "low":
        return "success"
      default:
        return "secondary"
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "open":
        return "primary"
      case "in-progress":
        return "warning"
      case "resolved":
        return "success"
      case "closed":
        return "secondary"
      default:
        return "secondary"
    }
  }

  return (
    <Container fluid className="py-4">
      <Row>
        <Col>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="text-primary">Service IT</h2>
            <Button variant="primary" onClick={() => setShowModal(true)}>
              Nouveau Ticket
            </Button>
          </div>
        </Col>
      </Row>

      {/* Statistiques */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center border-0 shadow-sm">
            <Card.Body>
              <h3 className="text-primary">12</h3>
              <p className="text-muted mb-0">Tickets Ouverts</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-0 shadow-sm">
            <Card.Body>
              <h3 className="text-warning">5</h3>
              <p className="text-muted mb-0">En Cours</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-0 shadow-sm">
            <Card.Body>
              <h3 className="text-success">28</h3>
              <p className="text-muted mb-0">Résolus</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-0 shadow-sm">
            <Card.Body>
              <h3 className="text-info">2.5h</h3>
              <p className="text-muted mb-0">Temps Moyen</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Liste des tickets */}
      <Row>
        <Col>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white">
              <h5 className="mb-0">Tickets de Support</h5>
            </Card.Header>
            <Card.Body className="p-0">
              <Table responsive hover className="mb-0">
                <thead className="bg-light">
                  <tr>
                    <th>ID</th>
                    <th>Titre</th>
                    <th>Catégorie</th>
                    <th>Priorité</th>
                    <th>Statut</th>
                    <th>Créé par</th>
                    <th>Assigné à</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((ticket) => (
                    <tr key={ticket.id}>
                      <td>#{ticket.id}</td>
                      <td>{ticket.title}</td>
                      <td>
                        <Badge bg="info">{ticket.category}</Badge>
                      </td>
                      <td>
                        <Badge bg={getPriorityColor(ticket.priority)}>{ticket.priority}</Badge>
                      </td>
                      <td>
                        <Badge bg={getStatusColor(ticket.status)}>{ticket.status}</Badge>
                      </td>
                      <td>{ticket.createdBy}</td>
                      <td>{ticket.assignedTo}</td>
                      <td>{ticket.createdAt}</td>
                      <td>
                        <Button size="sm" variant="outline-primary" className="me-1">
                          Voir
                        </Button>
                        {user.role === "admin" && (
                          <Button size="sm" variant="outline-success">
                            Traiter
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Modal nouveau ticket */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Nouveau Ticket de Support</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmitTicket}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Titre</Form.Label>
              <Form.Control
                type="text"
                value={newTicket.title}
                onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={newTicket.description}
                onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                required
              />
            </Form.Group>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Catégorie</Form.Label>
                  <Form.Select
                    value={newTicket.category}
                    onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                  >
                    <option value="hardware">Matériel</option>
                    <option value="software">Logiciel</option>
                    <option value="network">Réseau</option>
                    <option value="account">Compte</option>
                    <option value="other">Autre</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Priorité</Form.Label>
                  <Form.Select
                    value={newTicket.priority}
                    onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                  >
                    <option value="low">Basse</option>
                    <option value="medium">Moyenne</option>
                    <option value="high">Haute</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Annuler
            </Button>
            <Button variant="primary" type="submit">
              Créer le Ticket
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  )
}

export default ServiceIT
