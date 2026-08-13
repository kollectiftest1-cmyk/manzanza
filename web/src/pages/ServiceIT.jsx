"use client"

import { useState, useEffect } from "react"
import { Container, Row, Col, Card, Button, Table, Badge, Form, Modal } from "react-bootstrap"
import { useSelector } from "react-redux"
import { motion } from "framer-motion"
import { FiTool, FiPlus, FiEye, FiCheckCircle, FiClock, FiAlertCircle, FiActivity, FiSave } from "react-icons/fi"

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

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
    <Container fluid style={{ padding: '24px', background: 'var(--color-bodyBg)', minHeight: '100vh' }}>
      <motion.div 
        variants={containerVariants} 
        initial="hidden" 
        animate="visible"
      >
        {/* Header Section */}
        <motion.div variants={itemVariants} style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
              }}>
                <FiTool size={28} style={{ color: 'white' }} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '32px', fontWeight: '700', color: 'var(--color-text)' }}>
                  Service IT
                </h2>
                <p style={{ margin: 0, color: 'var(--color-textSecondary)', fontSize: '16px' }}>Support technique et maintenance</p>
              </div>
            </div>
            <Button 
              variant="primary" 
              onClick={() => setShowModal(true)}
              style={{ borderRadius: '8px', padding: '10px 24px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <FiPlus size={18} />
              Nouveau Ticket
            </Button>
          </div>
        </motion.div>

        {/* Statistiques */}
        <Row style={{ marginBottom: '32px' }}>
          <Col md={3} className="mb-3 mb-md-0">
            <motion.div variants={itemVariants}>
              <Card style={{
                textAlign: 'center',
                background: 'var(--color-cardBg)',
                border: '1px solid var(--color-border)',
                borderRadius: '16px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                transition: 'transform 0.2s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <Card.Body style={{ padding: '24px' }}>
                  <FiAlertCircle size={32} style={{ color: 'var(--color-primary)', marginBottom: '12px' }} />
                  <h3 style={{ color: 'var(--color-primary)', fontSize: '32px', fontWeight: '700', margin: '8px 0' }}>12</h3>
                  <p style={{ color: 'var(--color-textSecondary)', margin: 0, fontSize: '14px' }}>Tickets Ouverts</p>
                </Card.Body>
              </Card>
            </motion.div>
          </Col>
          <Col md={3} className="mb-3 mb-md-0">
            <motion.div variants={itemVariants}>
              <Card style={{
                textAlign: 'center',
                background: 'var(--color-cardBg)',
                border: '1px solid var(--color-border)',
                borderRadius: '16px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                transition: 'transform 0.2s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <Card.Body style={{ padding: '24px' }}>
                  <FiClock size={32} style={{ color: '#ffc107', marginBottom: '12px' }} />
                  <h3 style={{ color: '#ffc107', fontSize: '32px', fontWeight: '700', margin: '8px 0' }}>5</h3>
                  <p style={{ color: 'var(--color-textSecondary)', margin: 0, fontSize: '14px' }}>En Cours</p>
                </Card.Body>
              </Card>
            </motion.div>
          </Col>
          <Col md={3} className="mb-3 mb-md-0">
            <motion.div variants={itemVariants}>
              <Card style={{
                textAlign: 'center',
                background: 'var(--color-cardBg)',
                border: '1px solid var(--color-border)',
                borderRadius: '16px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                transition: 'transform 0.2s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <Card.Body style={{ padding: '24px' }}>
                  <FiCheckCircle size={32} style={{ color: '#28a745', marginBottom: '12px' }} />
                  <h3 style={{ color: '#28a745', fontSize: '32px', fontWeight: '700', margin: '8px 0' }}>28</h3>
                  <p style={{ color: 'var(--color-textSecondary)', margin: 0, fontSize: '14px' }}>Résolus</p>
                </Card.Body>
              </Card>
            </motion.div>
          </Col>
          <Col md={3}>
            <motion.div variants={itemVariants}>
              <Card style={{
                textAlign: 'center',
                background: 'var(--color-cardBg)',
                border: '1px solid var(--color-border)',
                borderRadius: '16px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                transition: 'transform 0.2s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <Card.Body style={{ padding: '24px' }}>
                  <FiActivity size={32} style={{ color: '#17a2b8', marginBottom: '12px' }} />
                  <h3 style={{ color: '#17a2b8', fontSize: '32px', fontWeight: '700', margin: '8px 0' }}>2.5h</h3>
                  <p style={{ color: 'var(--color-textSecondary)', margin: 0, fontSize: '14px' }}>Temps Moyen</p>
                </Card.Body>
              </Card>
            </motion.div>
          </Col>
        </Row>

        {/* Liste des tickets */}
        <Row>
          <Col>
            <motion.div variants={itemVariants}>
              <Card style={{
                background: 'var(--color-cardBg)',
                border: '1px solid var(--color-border)',
                borderRadius: '16px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}>
                <Card.Header style={{
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  color: 'white',
                  padding: '20px 24px',
                  borderBottom: 'none',
                  borderTopLeftRadius: '16px',
                  borderTopRightRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <FiTool size={20} />
                  <h5 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Tickets de Support</h5>
                </Card.Header>
                <Card.Body style={{ padding: '24px' }}>
                  <div style={{ overflowX: 'auto', borderRadius: '12px' }}>
                    <Table responsive hover style={{ marginBottom: 0, border: '1px solid var(--color-border)', borderRadius: '12px', overflow: 'hidden' }}>
                      <thead style={{ background: 'var(--color-bodyBg)' }}>
                        <tr>
                          <th style={{ padding: '16px', color: 'var(--color-text)', fontWeight: '600', borderBottom: '2px solid var(--color-border)', fontSize: '14px' }}>ID</th>
                          <th style={{ padding: '16px', color: 'var(--color-text)', fontWeight: '600', borderBottom: '2px solid var(--color-border)', fontSize: '14px' }}>Titre</th>
                          <th style={{ padding: '16px', color: 'var(--color-text)', fontWeight: '600', borderBottom: '2px solid var(--color-border)', fontSize: '14px' }}>Catégorie</th>
                          <th style={{ padding: '16px', color: 'var(--color-text)', fontWeight: '600', borderBottom: '2px solid var(--color-border)', fontSize: '14px' }}>Priorité</th>
                          <th style={{ padding: '16px', color: 'var(--color-text)', fontWeight: '600', borderBottom: '2px solid var(--color-border)', fontSize: '14px' }}>Statut</th>
                          <th style={{ padding: '16px', color: 'var(--color-text)', fontWeight: '600', borderBottom: '2px solid var(--color-border)', fontSize: '14px' }}>Créé par</th>
                          <th style={{ padding: '16px', color: 'var(--color-text)', fontWeight: '600', borderBottom: '2px solid var(--color-border)', fontSize: '14px' }}>Assigné à</th>
                          <th style={{ padding: '16px', color: 'var(--color-text)', fontWeight: '600', borderBottom: '2px solid var(--color-border)', fontSize: '14px' }}>Date</th>
                          <th style={{ padding: '16px', color: 'var(--color-text)', fontWeight: '600', borderBottom: '2px solid var(--color-border)', fontSize: '14px' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tickets.map((ticket, index) => (
                          <tr key={ticket.id} style={{ background: index % 2 === 0 ? 'var(--color-cardBg)' : 'var(--color-bodyBg)' }}>
                            <td style={{ padding: '16px', color: 'var(--color-textSecondary)', borderBottom: '1px solid var(--color-border)', fontSize: '13px' }}>#{ticket.id}</td>
                            <td style={{ padding: '16px', color: 'var(--color-text)', fontWeight: '500', borderBottom: '1px solid var(--color-border)', fontSize: '13px' }}>{ticket.title}</td>
                            <td style={{ padding: '16px', borderBottom: '1px solid var(--color-border)' }}>
                              <Badge bg="info" style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '12px' }}>{ticket.category}</Badge>
                            </td>
                            <td style={{ padding: '16px', borderBottom: '1px solid var(--color-border)' }}>
                              <Badge bg={getPriorityColor(ticket.priority)} style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '12px' }}>{ticket.priority}</Badge>
                            </td>
                            <td style={{ padding: '16px', borderBottom: '1px solid var(--color-border)' }}>
                              <Badge bg={getStatusColor(ticket.status)} style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '12px' }}>{ticket.status}</Badge>
                            </td>
                            <td style={{ padding: '16px', color: 'var(--color-textSecondary)', borderBottom: '1px solid var(--color-border)', fontSize: '13px' }}>{ticket.createdBy}</td>
                            <td style={{ padding: '16px', color: 'var(--color-textSecondary)', borderBottom: '1px solid var(--color-border)', fontSize: '13px' }}>{ticket.assignedTo}</td>
                            <td style={{ padding: '16px', color: 'var(--color-textSecondary)', borderBottom: '1px solid var(--color-border)', fontSize: '13px' }}>{ticket.createdAt}</td>
                            <td style={{ padding: '16px', borderBottom: '1px solid var(--color-border)' }}>
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <Button size="sm" variant="outline-primary" style={{ borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '6px 12px' }}>
                                  <FiEye size={14} />
                                  Voir
                                </Button>
                                {user.role === "admin" && (
                                  <Button size="sm" variant="outline-success" style={{ borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '6px 12px' }}>
                                    <FiCheckCircle size={14} />
                                    Traiter
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </Card.Body>
              </Card>
            </motion.div>
          </Col>
        </Row>

        {/* Modal nouveau ticket */}
        <Modal show={showModal} onHide={() => setShowModal(false)} centered>
          <div style={{
            background: 'var(--color-cardBg)',
            borderRadius: '16px',
            border: '1px solid var(--color-border)',
            overflow: 'hidden'
          }}>
            <Modal.Header closeButton style={{
              background: 'linear-gradient(135deg, var(--color-primary), #667eea)',
              color: 'white',
              borderBottom: 'none',
              padding: '24px'
            }}>
              <Modal.Title style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '22px' }}>
                <FiPlus size={24} />
                Nouveau Ticket de Support
              </Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmitTicket}>
              <Modal.Body style={{ padding: '32px', background: 'var(--color-cardBg)' }}>
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
              <Modal.Footer style={{ background: 'var(--color-cardBg)', borderTop: '1px solid var(--color-border)', padding: '20px' }}>
                <Button variant="secondary" onClick={() => setShowModal(false)} style={{ borderRadius: '8px', padding: '10px 24px' }}>
                  Annuler
                </Button>
                <Button variant="primary" type="submit" style={{ borderRadius: '8px', padding: '10px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FiSave size={18} />
                  Créer le Ticket
                </Button>
              </Modal.Footer>
            </Form>
          </div>
        </Modal>
      </motion.div>
    </Container>
  )
}

export default ServiceIT
