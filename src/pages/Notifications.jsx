"use client"

import { useState, useEffect } from "react"
import { Container, Row, Col, Card, Button, Badge, Form, Modal, ListGroup } from "react-bootstrap"
import { useSelector } from "react-redux"

const Notifications = () => {
  const { user } = useSelector((state) => state.auth)
  const [notifications, setNotifications] = useState([])
  const [filtreType, setFiltreType] = useState("toutes")
  const [filtreStatut, setFiltreStatut] = useState("toutes")
  const [showModal, setShowModal] = useState(false)
  const [selectedNotification, setSelectedNotification] = useState(null)

  useEffect(() => {
    // Simuler le chargement des notifications
    setNotifications([
      {
        id: 1,
        titre: "Nouveau cours disponible",
        message: "Le cours de Comptabilité Générale est maintenant disponible dans votre auditoire.",
        type: "cours",
        priorite: "normale",
        date: "2024-01-15T10:30:00",
        lu: false,
        expediteur: "Système",
      },
      {
        id: 2,
        titre: "Rappel: TP à rendre",
        message: "N'oubliez pas de rendre votre TP d'Économie avant le 20 janvier 2024.",
        type: "tp",
        priorite: "haute",
        date: "2024-01-14T14:20:00",
        lu: false,
        expediteur: "Prof. Martin",
      },
      {
        id: 3,
        titre: "Quiz programmé",
        message: "Un quiz de révision est programmé pour demain à 9h00.",
        type: "quiz",
        priorite: "normale",
        date: "2024-01-13T16:45:00",
        lu: true,
        expediteur: "Prof. Dubois",
      },
      {
        id: 4,
        titre: "Paiement confirmé",
        message: "Votre paiement de 200,000 FCFA a été confirmé.",
        type: "paiement",
        priorite: "normale",
        date: "2024-01-12T11:15:00",
        lu: true,
        expediteur: "Service Comptabilité",
      },
      {
        id: 5,
        titre: "Maintenance système",
        message: "Une maintenance est prévue ce weekend. Les services seront indisponibles.",
        type: "systeme",
        priorite: "haute",
        date: "2024-01-11T09:00:00",
        lu: false,
        expediteur: "Service IT",
      },
    ])
  }, [])

  const marquerCommeLu = (id) => {
    setNotifications(notifications.map((notif) => (notif.id === id ? { ...notif, lu: true } : notif)))
  }

  const supprimerNotification = (id) => {
    setNotifications(notifications.filter((notif) => notif.id !== id))
  }

  const marquerToutCommeLu = () => {
    setNotifications(notifications.map((notif) => ({ ...notif, lu: true })))
  }

  const getTypeColor = (type) => {
    switch (type) {
      case "cours":
        return "primary"
      case "tp":
        return "warning"
      case "quiz":
        return "info"
      case "paiement":
        return "success"
      case "systeme":
        return "danger"
      default:
        return "secondary"
    }
  }

  const getPrioriteColor = (priorite) => {
    switch (priorite) {
      case "haute":
        return "danger"
      case "normale":
        return "primary"
      case "basse":
        return "secondary"
      default:
        return "secondary"
    }
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

  return (
    <Container fluid className="py-0">
      <Row className="dashboard-card">
        <Col>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="text-primary">Notifications</h2>
              <p className="text-muted mb-0">
                {nombreNonLues} notification{nombreNonLues !== 1 ? "s" : ""} non lue{nombreNonLues !== 1 ? "s" : ""}
              </p>
            </div>
            <Button variant="outline-primary" onClick={marquerToutCommeLu}>
              Tout marquer comme lu
            </Button>
          </div>
        </Col>
      </Row>

      {/* Statistiques */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center border-0 shadow-sm">
            <Card.Body>
              <h3 className="text-primary">{notifications.length}</h3>
              <p className="text-muted mb-0">Total</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-0 shadow-sm">
            <Card.Body>
              <h3 className="text-warning">{nombreNonLues}</h3>
              <p className="text-muted mb-0">Non Lues</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-0 shadow-sm">
            <Card.Body>
              <h3 className="text-success">{notifications.length - nombreNonLues}</h3>
              <p className="text-muted mb-0">Lues</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-0 shadow-sm">
            <Card.Body>
              <h3 className="text-danger">{notifications.filter((n) => n.priorite === "haute").length}</h3>
              <p className="text-muted mb-0">Priorité Haute</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Filtres */}
      <Row className="mb-4">
        <Col md={6}>
          <Form.Group>
            <Form.Label>Filtrer par type</Form.Label>
            <Form.Select value={filtreType} onChange={(e) => setFiltreType(e.target.value)}>
              <option value="toutes">Toutes les notifications</option>
              <option value="cours">Cours</option>
              <option value="tp">TP/TD</option>
              <option value="quiz">Quiz</option>
              <option value="paiement">Paiements</option>
              <option value="systeme">Système</option>
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group>
            <Form.Label>Filtrer par statut</Form.Label>
            <Form.Select value={filtreStatut} onChange={(e) => setFiltreStatut(e.target.value)}>
              <option value="toutes">Toutes</option>
              <option value="non-lues">Non lues</option>
              <option value="lues">Lues</option>
            </Form.Select>
          </Form.Group>
        </Col>
      </Row>

      {/* Liste des notifications */}
      <Card>
      <Card.Body>
      <Row>
        <Col>
          <Card className="border-0 shadow-sm">
            <Card.Body className="p-0">
              <ListGroup variant="flush">
                {notificationsFiltrees.length === 0 ? (
                  <ListGroup.Item className="text-center py-4">
                    <p className="text-muted mb-0">Aucune notification trouvée</p>
                  </ListGroup.Item>
                ) : (
                  notificationsFiltrees.map((notification) => (
                    <ListGroup.Item
                    key={notification.id}
                    className={`d-flex justify-content-between align-items-start ${!notification.lu ? "bg-light" : ""}`}
                    >
                      <div className="flex-grow-1">
                        <div className="d-flex align-items-center mb-2">
                          <h6 className={`mb-0 me-2 ${!notification.lu ? "fw-bold" : ""}`}>{notification.titre}</h6>
                          <Badge bg={getTypeColor(notification.type)} className="me-2">
                            {notification.type}
                          </Badge>
                          <Badge bg={getPrioriteColor(notification.priorite)}>{notification.priorite}</Badge>
                          {!notification.lu && (
                            <Badge bg="warning" className="ms-2">
                              Nouveau
                            </Badge>
                          )}
                        </div>
                        <p className="text-muted mb-1">{notification.message}</p>
                        <small className="text-muted">
                          De: {notification.expediteur} • {formatDate(notification.date)}
                        </small>
                      </div>
                      <div className="d-flex flex-column gap-1">
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
                        >
                          Voir
                        </Button>
                        {!notification.lu && (
                          <Button size="sm" variant="outline-success" onClick={() => marquerCommeLu(notification.id)}>
                            Marquer lu
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline-danger"
                          onClick={() => supprimerNotification(notification.id)}
                        >
                          Supprimer
                        </Button>
                      </div>
                    </ListGroup.Item>
                  ))
                )}
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      </Card.Body>
    </Card>

      {/* Modal détail notification */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Détail de la Notification</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedNotification && (
            <>
              <div className="mb-3">
                <h5>{selectedNotification.titre}</h5>
                <div className="mb-2">
                  <Badge bg={getTypeColor(selectedNotification.type)} className="me-2">
                    {selectedNotification.type}
                  </Badge>
                  <Badge bg={getPrioriteColor(selectedNotification.priorite)}>{selectedNotification.priorite}</Badge>
                </div>
              </div>
              <p>{selectedNotification.message}</p>
              <hr />
              <small className="text-muted">
                <strong>Expéditeur:</strong> {selectedNotification.expediteur}
                <br />
                <strong>Date:</strong> {formatDate(selectedNotification.date)}
              </small>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Fermer
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  )
}

export default Notifications
