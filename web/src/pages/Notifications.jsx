"use client"

import { useState, useEffect } from "react"
import { Container, Row, Col, Card, Button, Badge, Form, Modal, ListGroup, Spinner } from "react-bootstrap"
import { useSelector, useDispatch } from "react-redux"
import { motion } from "framer-motion"
import { FiBell, FiCheckCircle, FiTrash2, FiEye, FiAlertCircle, FiFilter } from "react-icons/fi"
import { fetchNotifications, markAsRead, markAllAsRead, deleteNotification } from "../store/slices/notificationsSlice"

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

const Notifications = () => {
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)
  const { notifications, loading, error } = useSelector((state) => state.notifications)
  const [filtreType, setFiltreType] = useState("toutes")
  const [filtreStatut, setFiltreStatut] = useState("toutes")
  const [showModal, setShowModal] = useState(false)
  const [selectedNotification, setSelectedNotification] = useState(null)

  useEffect(() => {
    dispatch(fetchNotifications())
  }, [dispatch])

  const marquerCommeLu = async (id) => {
    try {
      await dispatch(markAsRead(id)).unwrap()
    } catch (error) {
      console.error('Erreur lors du marquage comme lu:', error)
    }
  }

  const supprimerNotification = async (id) => {
    try {
      await dispatch(deleteNotification(id)).unwrap()
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
    }
  }

  const marquerToutCommeLu = async () => {
    try {
      await dispatch(markAllAsRead()).unwrap()
    } catch (error) {
      console.error('Erreur lors du marquage:', error)
    }
  }

  const getTypeColor = (type) => {
    const typeMap = {
      'course': 'primary',
      'assignment': 'warning',
      'quiz': 'info',
      'payment': 'success',
      'system': 'danger',
      'announcement': 'info'
    }
    return typeMap[type] || 'secondary'
  }

  const getPrioriteColor = (priority) => {
    const priorityMap = {
      'high': 'danger',
      'medium': 'primary',
      'low': 'secondary'
    }
    return priorityMap[priority] || 'primary'
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const notificationsFiltrees = notifications.filter((notif) => {
    const typeMatch = filtreType === "toutes" || notif.type === filtreType
    const statutMatch =
      filtreStatut === "toutes" || (filtreStatut === "lues" && notif.lu) || (filtreStatut === "non-lues" && !notif.lu)
    return typeMatch && statutMatch
  })

  const nombreNonLues = notifications.filter((notif) => !notif.lu).length

  if (loading && notifications.length === 0) {
    return (
      <Container fluid style={{ padding: '24px', background: 'var(--color-bodyBg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <Spinner animation="border" style={{ color: 'var(--color-primary)', width: '3rem', height: '3rem' }} />
          <p style={{ marginTop: '16px', color: 'var(--color-textSecondary)', fontSize: '16px' }}>Chargement...</p>
        </div>
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
        {/* Header Section */}
        <motion.div variants={itemVariants} style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #4facfe, #00f2fe)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
              }}>
                <FiBell size={28} style={{ color: 'white' }} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '32px', fontWeight: '700', color: 'var(--color-text)' }}>
                  Notifications
                </h2>
                <p style={{ margin: 0, color: 'var(--color-textSecondary)', fontSize: '16px' }}>
                  {nombreNonLues} notification{nombreNonLues !== 1 ? "s" : ""} non lue{nombreNonLues !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <Button 
              variant="primary" 
              onClick={marquerToutCommeLu} 
              disabled={loading}
              style={{
                borderRadius: '8px',
                padding: '10px 24px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <FiCheckCircle size={18} />
              Tout marquer comme lu
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
                  <FiBell size={32} style={{ color: 'var(--color-primary)', marginBottom: '12px' }} />
                  <h3 style={{ color: 'var(--color-primary)', fontSize: '32px', fontWeight: '700', margin: '8px 0' }}>{notifications.length}</h3>
                  <p style={{ color: 'var(--color-textSecondary)', margin: 0, fontSize: '14px' }}>Total</p>
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
                  <FiAlertCircle size={32} style={{ color: '#ffc107', marginBottom: '12px' }} />
                  <h3 style={{ color: '#ffc107', fontSize: '32px', fontWeight: '700', margin: '8px 0' }}>{nombreNonLues}</h3>
                  <p style={{ color: 'var(--color-textSecondary)', margin: 0, fontSize: '14px' }}>Non Lues</p>
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
                  <h3 style={{ color: '#28a745', fontSize: '32px', fontWeight: '700', margin: '8px 0' }}>{notifications.length - nombreNonLues}</h3>
                  <p style={{ color: 'var(--color-textSecondary)', margin: 0, fontSize: '14px' }}>Lues</p>
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
                  <FiAlertCircle size={32} style={{ color: '#dc3545', marginBottom: '12px' }} />
                  <h3 style={{ color: '#dc3545', fontSize: '32px', fontWeight: '700', margin: '8px 0' }}>{notifications.filter((n) => n.priorite === "haute").length}</h3>
                  <p style={{ color: 'var(--color-textSecondary)', margin: 0, fontSize: '14px' }}>Priorité Haute</p>
                </Card.Body>
              </Card>
            </motion.div>
          </Col>
        </Row>

        {/* Filtres */}
        <motion.div variants={itemVariants}>
          <Card style={{
            background: 'var(--color-cardBg)',
            border: '1px solid var(--color-border)',
            borderRadius: '16px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            marginBottom: '24px'
          }}>
            <Card.Body style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <FiFilter size={20} style={{ color: 'var(--color-primary)' }} />
                <h5 style={{ margin: 0, color: 'var(--color-text)', fontSize: '18px', fontWeight: '600' }}>Filtres</h5>
              </div>
              <Row>
                <Col md={6} className="mb-3 mb-md-0">
                  <Form.Group>
                    <Form.Label style={{ color: 'var(--color-text)', fontWeight: '500', marginBottom: '8px' }}>Filtrer par type</Form.Label>
                    <Form.Select value={filtreType} onChange={(e) => setFiltreType(e.target.value)} style={{ borderRadius: '8px' }}>
                      <option value="toutes">Toutes les notifications</option>
                      <option value="course">Cours</option>
                      <option value="assignment">TP/TD</option>
                      <option value="quiz">Quiz</option>
                      <option value="payment">Paiements</option>
                      <option value="system">Système</option>
                      <option value="announcement">Annonces</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label style={{ color: 'var(--color-text)', fontWeight: '500', marginBottom: '8px' }}>Filtrer par statut</Form.Label>
                    <Form.Select value={filtreStatut} onChange={(e) => setFiltreStatut(e.target.value)} style={{ borderRadius: '8px' }}>
                      <option value="toutes">Toutes</option>
                      <option value="non-lues">Non lues</option>
                      <option value="lues">Lues</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </motion.div>

        {/* Liste des notifications */}
        <motion.div variants={itemVariants}>
          <Card style={{
            background: 'var(--color-cardBg)',
            border: '1px solid var(--color-border)',
            borderRadius: '16px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <Card.Header style={{
              background: 'linear-gradient(135deg, #4facfe, #00f2fe)',
              color: 'white',
              padding: '20px 24px',
              borderBottom: 'none',
              borderTopLeftRadius: '16px',
              borderTopRightRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <FiBell size={20} />
              <h5 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Liste des Notifications</h5>
            </Card.Header>
            <Card.Body style={{ padding: 0 }}>
              <ListGroup variant="flush">
                {notificationsFiltrees.length === 0 ? (
                  <ListGroup.Item style={{ textAlign: 'center', padding: '48px', background: 'var(--color-cardBg)', border: 'none' }}>
                    <FiBell size={48} style={{ color: 'var(--color-textSecondary)', opacity: 0.3, marginBottom: '16px' }} />
                    <p style={{ color: 'var(--color-textSecondary)', margin: 0, fontSize: '16px' }}>Aucune notification trouvée</p>
                  </ListGroup.Item>
                ) : (
                  notificationsFiltrees.map((notification, index) => (
                    <ListGroup.Item
                      key={notification.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'start',
                        padding: '20px 24px',
                        background: !notification.lu ? 'var(--color-bodyBg)' : 'var(--color-cardBg)',
                        borderBottom: index < notificationsFiltrees.length - 1 ? '1px solid var(--color-border)' : 'none',
                        transition: 'background 0.2s ease'
                      }}
                    >
                      <div style={{ flexGrow: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                          <h6 style={{ margin: 0, marginRight: '8px', color: 'var(--color-text)', fontWeight: !notification.lu ? '600' : '400', fontSize: '16px' }}>
                            {notification.titre}
                          </h6>
                          <Badge bg={getTypeColor(notification.type)} style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px' }}>
                            {notification.type}
                          </Badge>
                          <Badge bg={getPrioriteColor(notification.priorite)} style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px' }}>
                            {notification.priorite}
                          </Badge>
                          {!notification.lu && (
                            <Badge bg="warning" style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px' }}>
                              Nouveau
                            </Badge>
                          )}
                        </div>
                        <p style={{ color: 'var(--color-textSecondary)', marginBottom: '8px', fontSize: '14px' }}>{notification.message}</p>
                        <small style={{ color: 'var(--color-textSecondary)', fontSize: '12px' }}>
                          De: {notification.expediteur} • {formatDate(notification.date)}
                        </small>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginLeft: '16px' }}>
                        <Button
                          size="sm"
                          variant="outline-primary"
                          onClick={() => {
                            setSelectedNotification(notification)
                            setShowModal(true)
                            if (!notification.lu) {
                              marquerCommeLu(notification.id)
                            }
                          }}
                          style={{ borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '6px 12px', whiteSpace: 'nowrap' }}
                        >
                          <FiEye size={14} />
                          Voir
                        </Button>
                        {!notification.lu && (
                          <Button size="sm" variant="outline-success" onClick={() => marquerCommeLu(notification.id)} style={{ borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '6px 12px', whiteSpace: 'nowrap' }}>
                            <FiCheckCircle size={14} />
                            Marquer lu
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline-danger"
                          onClick={() => supprimerNotification(notification.id)}
                          style={{ borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '6px 12px', whiteSpace: 'nowrap' }}
                        >
                          <FiTrash2 size={14} />
                          Supprimer
                        </Button>
                      </div>
                    </ListGroup.Item>
                  ))
                )}
              </ListGroup>
            </Card.Body>
          </Card>
        </motion.div>

        {/* Modal détail notification */}
        <Modal show={showModal} onHide={() => setShowModal(false)} centered>
          <div style={{
            background: 'var(--color-cardBg)',
            borderRadius: '16px',
            border: '1px solid var(--color-border)',
            overflow: 'hidden'
          }}>
            <Modal.Header closeButton style={{
              background: 'linear-gradient(135deg, #4facfe, #00f2fe)',
              color: 'white',
              borderBottom: 'none',
              padding: '24px'
            }}>
              <Modal.Title style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '22px' }}>
                <FiBell size={24} />
                Détail de la Notification
              </Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ padding: '32px', background: 'var(--color-cardBg)' }}>
              {selectedNotification && (
                <>
                  <div style={{ marginBottom: '24px' }}>
                    <h5 style={{ color: 'var(--color-text)', marginBottom: '12px', fontSize: '20px', fontWeight: '600' }}>
                      {selectedNotification.title}
                    </h5>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                      <Badge bg={getTypeColor(selectedNotification.notification_type)} style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '13px' }}>
                        {selectedNotification.notification_type}
                      </Badge>
                      <Badge bg={getPrioriteColor(selectedNotification.priority)} style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '13px' }}>
                        {selectedNotification.priority}
                      </Badge>
                    </div>
                  </div>
                  <p style={{ color: 'var(--color-textSecondary)', fontSize: '15px', lineHeight: '1.6' }}>{selectedNotification.message}</p>
                  <hr style={{ margin: '24px 0', border: 'none', borderTop: '1px solid var(--color-border)' }} />
                  <small style={{ color: 'var(--color-textSecondary)', fontSize: '13px' }}>
                    <strong style={{ color: 'var(--color-text)' }}>Date:</strong> {formatDate(selectedNotification.created_at)}
                  </small>
                </>
              )}
            </Modal.Body>
            <Modal.Footer style={{ background: 'var(--color-cardBg)', borderTop: '1px solid var(--color-border)', padding: '20px' }}>
              <Button variant="secondary" onClick={() => setShowModal(false)} style={{ borderRadius: '8px', padding: '10px 24px' }}>
                Fermer
              </Button>
            </Modal.Footer>
          </div>
        </Modal>
      </motion.div>
    </Container>
  )
}

export default Notifications
