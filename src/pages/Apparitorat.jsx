"use client"

import { useState, useEffect } from "react"
import { Container, Row, Col, Card, Button, Table, Badge, Form, Modal, Spinner, Alert, Tab, Tabs, InputGroup } from "react-bootstrap"
import { useSelector, useDispatch } from "react-redux"
import {
  fetchRooms,
  createRoom,
  fetchReservations,
  fetchArchivedReservations, // Import new thunk
  createReservation,
  updateReservationStatus,
} from "../store/slices/apparitoratSlice"

const Apparitorat = () => {
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)
  const { rooms, reservations, archivedReservations, loading, error } = useSelector((state) => state.apparitorat)

  // State for reservation modal
  const [showReservationModal, setShowReservationModal] = useState(false)
  const [newReservation, setNewReservation] = useState({
    room: "",
    date: "",
    startTime: "",
    endTime: "",
    purpose: "",
    equipment_needs: [],
  })

  // State for room creation modal
  const [showRoomModal, setShowRoomModal] = useState(false)
  const [newRoom, setNewRoom] = useState({
    name: "",
    capacity: "",
    equipment: [],
    room_type: "salle",
  })
  const [equipmentInput, setEquipmentInput] = useState("") // For adding equipment to new room

  // State for tabs
  const [key, setKey] = useState('activeReservations');

  // Fetch data on component mount
  useEffect(() => {
    dispatch(fetchRooms())
    dispatch(fetchReservations())
    dispatch(fetchArchivedReservations()) // Fetch archived reservations
  }, [dispatch])

  // Handlers for New Reservation Modal
  const handleShowReservationModal = () => setShowReservationModal(true)
  const handleCloseReservationModal = () => {
    setShowReservationModal(false)
    setNewReservation({
      room: "",
      date: "",
      startTime: "",
      endTime: "",
      purpose: "",
      equipment_needs: [],
    })
  }

  const handleNewReservationChange = (e) => {
    const { name, value } = e.target
    setNewReservation((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmitReservation = async (e) => {
    e.preventDefault()
    try {
      await dispatch(createReservation({ ...newReservation, requested_by: user.id })).unwrap()
      alert("Demande de réservation envoyée avec succès!")
      handleCloseReservationModal()
      dispatch(fetchReservations()); // Refresh active reservations
    } catch (err) {
      alert("Erreur lors de la création de la réservation: " + (err.detail || err.message || "Une erreur est survenue."))
    }
  }

  // Handlers for New Room Modal
  const handleShowRoomModal = () => setShowRoomModal(true)
  const handleCloseRoomModal = () => {
    setShowRoomModal(false)
    setNewRoom({
      name: "",
      capacity: "",
      equipment: [],
      room_type: "salle",
    })
    setEquipmentInput("")
  }

  const handleNewRoomChange = (e) => {
    const { name, value } = e.target
    setNewRoom((prev) => ({ ...prev, [name]: value }))
  }

  const handleAddEquipment = () => {
    if (equipmentInput.trim() !== "" && !newRoom.equipment.includes(equipmentInput.trim())) {
      setNewRoom((prev) => ({
        ...prev,
        equipment: [...prev.equipment, equipmentInput.trim()],
      }))
      setEquipmentInput("")
    }
  }

  const handleRemoveEquipment = (eqToRemove) => {
    setNewRoom((prev) => ({
      ...prev,
      equipment: prev.equipment.filter((eq) => eq !== eqToRemove),
    }))
  }

  const handleSubmitRoom = async (e) => {
    e.preventDefault()
    try {
      await dispatch(createRoom(newRoom)).unwrap()
      alert("Salle créée avec succès!")
      handleCloseRoomModal()
      dispatch(fetchRooms()); // Refresh rooms
    } catch (err) {
      alert("Erreur lors de la création de la salle: " + (err.detail || err.message || "Une erreur est survenue."))
    }
  }

  // Handler for updating reservation status (for authorized users)
  const handleUpdateReservationStatus = async (reservationId, status) => {
    try {
      await dispatch(updateReservationStatus({ id: reservationId, status })).unwrap()
      alert(`Réservation ${status} avec succès!`)
      dispatch(fetchReservations()); // Refresh active reservations
      dispatch(fetchArchivedReservations()); // Refresh archived reservations
    } catch (err) {
      alert("Erreur lors de la mise à jour du statut: " + (err.detail || err.message || "Une erreur est survenue."))
    }
  }

  const getStatutColor = (statut) => {
    switch (statut) {
      case "confirmed":
        return "success"
      case "pending":
        return "warning"
      case "rejected":
        return "danger"
      case "archived":
        return "secondary"
      default:
        return "secondary"
    }
  }

  // Role-based access control
  const canManageRooms = user?.role === 'admin' || user?.role === 'apparitorat';
  const canManageReservations = user?.role === 'admin' || user?.role === 'apparitorat';

  // Calculate stats
  const totalRooms = rooms.length;
  const confirmedReservationsCount = Array.isArray(reservations) ? reservations.filter(res => res.status === 'confirmed').length : 0;
  const pendingReservationsCount = Array.isArray(reservations) ? reservations.filter(res => res.status === 'pending').length : 0;
  const totalReservations = (Array.isArray(reservations) ? reservations.length : 0) + (Array.isArray(archivedReservations) ? archivedReservations.length : 0);
  // Placeholder for occupancy rate, would need more complex logic based on actual schedules
  const occupancyRate = totalRooms > 0 ? ((confirmedReservationsCount / totalRooms) * 100).toFixed(0) : 0;


  return (
    <Container fluid className="py-0">
      <Row className="dashboard-card">
        <Col>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="text-primary">Apparitorat - Gestion des Salles</h2>
            <div>
              {canManageRooms && (
                <Button variant="info" onClick={handleShowRoomModal} className="me-2">
                  <i className="fas fa-plus me-2"></i>Ajouter Salle
                </Button>
              )}
              <Button variant="primary" onClick={handleShowReservationModal}>
                <i className="fas fa-calendar-plus me-2"></i>Nouvelle Réservation
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      {loading && <div className="text-center"><Spinner animation="border" /></div>}
      {error && <Alert variant="danger">{error}</Alert>}

      {/* Statistiques */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center border-0 shadow-sm">
            <Card.Body>
              <h3 className="text-primary">{totalRooms}</h3>
              <p className="text-muted mb-0">Salles</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-0 shadow-sm">
            <Card.Body>
              <h3 className="text-success">{confirmedReservationsCount}</h3>
              <p className="text-muted mb-0">Réservations Confirmées</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-0 shadow-sm">
            <Card.Body>
              <h3 className="text-warning">{pendingReservationsCount}</h3>
              <p className="text-muted mb-0">En Attente</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-0 shadow-sm">
            <Card.Body>
              <h3 className="text-info">{occupancyRate}%</h3>
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
              {Array.isArray(rooms) && rooms.length === 0 && !loading && <p className="text-muted text-center">Aucune salle disponible.</p>}
              {Array.isArray(rooms) && rooms.map((room) => (
                <Card key={room.id} className="mb-3 border">
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <h6 className="text-primary">{room.name}</h6>
                        <p className="text-muted mb-1">Capacité: {room.capacity} places</p>
                        <p className="text-muted mb-1">Type: <Badge bg="secondary">{room.room_type}</Badge></p>
                        <div>
                          {room.equipment && room.equipment.map((eq, index) => (
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
              <h5 className="mb-0">Gestion des Réservations</h5>
            </Card.Header>
            <Card.Body className="p-0">
              <Tabs
                id="reservation-tabs"
                activeKey={key}
                onSelect={(k) => setKey(k)}
                className="mb-3"
                fill
              >
                <Tab eventKey="activeReservations" title={`Actives (${Array.isArray(reservations) ? reservations.length : 0})`}>
                  <Table responsive hover className="mb-0">
                    <thead className="bg-light">
                      <tr>
                        <th>Salle</th>
                        <th>Date</th>
                        <th>Heure</th>
                        <th>Motif</th>
                        <th>Demandeur</th>
                        <th>Statut</th>
                        {canManageReservations && <th>Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {Array.isArray(reservations) && reservations.length === 0 && !loading ? (
                        <tr>
                          <td colSpan={canManageReservations ? 7 : 6} className="text-center text-muted">Aucune réservation active.</td>
                        </tr>
                      ) : (
                        Array.isArray(reservations) && reservations.map((reservation) => (
                          <tr key={reservation.id}>
                            <td>{Array.isArray(rooms) ? (rooms.find(r => r.id === reservation.room)?.name || 'N/A') : 'N/A'}</td>
                            <td>{reservation.date}</td>
                            <td>
                              {reservation.startTime} - {reservation.endTime}
                            </td>
                            <td>{reservation.purpose}</td>
                            <td>{reservation.requested_by_name || 'N/A'}</td>
                            <td>
                              <Badge bg={getStatutColor(reservation.status)}>{reservation.status}</Badge>
                            </td>
                            {canManageReservations && (
                              <td>
                                {reservation.status === 'pending' && (
                                  <>
                                    <Button
                                      variant="success"
                                      size="sm"
                                      className="me-2"
                                      onClick={() => handleUpdateReservationStatus(reservation.id, 'confirmed')}
                                      disabled={loading}
                                    >
                                      Confirmer
                                    </Button>
                                    <Button
                                      variant="danger"
                                      size="sm"
                                      onClick={() => handleUpdateReservationStatus(reservation.id, 'rejected')}
                                      disabled={loading}
                                    >
                                      Refuser
                                    </Button>
                                  </>
                                )}
                                {['confirmed', 'rejected'].includes(reservation.status) && (
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => handleUpdateReservationStatus(reservation.id, 'archived')}
                                    disabled={loading}
                                  >
                                    Archiver
                                  </Button>
                                )}
                              </td>
                            )}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </Table>
                </Tab>
                <Tab eventKey="archivedReservations" title={`Archives (${Array.isArray(archivedReservations) ? archivedReservations.length : 0})`}>
                  <Table responsive hover className="mb-0">
                    <thead className="bg-light">
                      <tr>
                        <th>Salle</th>
                        <th>Date</th>
                        <th>Heure</th>
                        <th>Motif</th>
                        <th>Demandeur</th>
                        <th>Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.isArray(archivedReservations) && archivedReservations.length === 0 && !loading ? (
                        <tr>
                          <td colSpan={6} className="text-center text-muted">Aucune réservation archivée.</td>
                        </tr>
                      ) : (
                        Array.isArray(archivedReservations) && archivedReservations.map((reservation) => (
                          <tr key={reservation.id}>
                            <td>{Array.isArray(rooms) ? (rooms.find(r => r.id === reservation.room)?.name || 'N/A') : 'N/A'}</td>
                            <td>{reservation.date}</td>
                            <td>
                              {reservation.startTime} - {reservation.endTime}
                            </td>
                            <td>{reservation.purpose}</td>
                            <td>{reservation.requested_by_name || 'N/A'}</td>
                            <td>
                              <Badge bg={getStatutColor(reservation.status)}>{reservation.status}</Badge>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </Table>
                </Tab>
              </Tabs>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Modal nouvelle réservation */}
      <Modal show={showReservationModal} onHide={handleCloseReservationModal} size="lg">
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
                    name="room"
                    value={newReservation.room}
                    onChange={handleNewReservationChange}
                    required
                  >
                    <option value="">Sélectionner une salle</option>
                    {Array.isArray(rooms) && rooms.map((room) => (
                      <option key={room.id} value={room.id}>
                        {room.name} (Capacité: {room.capacity})
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
                    name="date"
                    value={newReservation.date}
                    onChange={handleNewReservationChange}
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
                    name="startTime"
                    value={newReservation.startTime}
                    onChange={handleNewReservationChange}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Heure de fin</Form.Label>
                  <Form.Control
                    type="time"
                    name="endTime"
                    value={newReservation.endTime}
                    onChange={handleNewReservationChange}
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
                name="purpose"
                value={newReservation.purpose}
                onChange={handleNewReservationChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Équipements nécessaires (séparés par des virgules)</Form.Label>
              <Form.Control
                type="text"
                placeholder="Ex: Projecteur, Micro, Tableau"
                value={newReservation.equipment_needs.join(', ')}
                onChange={(e) => setNewReservation({ ...newReservation, equipment_needs: e.target.value.split(',').map(item => item.trim()).filter(item => item !== '') })}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseReservationModal}>
              Annuler
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? <Spinner as="span" size="sm" animation="border" /> : "Réserver"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Modal for creating a new room */}
      <Modal show={showRoomModal} onHide={handleCloseRoomModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Ajouter une Nouvelle Salle</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmitRoom}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Nom de la Salle</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={newRoom.name}
                onChange={handleNewRoomChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Capacité</Form.Label>
              <Form.Control
                type="number"
                name="capacity"
                value={newRoom.capacity}
                onChange={handleNewRoomChange}
                required
                min="1"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Type de Salle</Form.Label>
              <Form.Select
                name="room_type"
                value={newRoom.room_type}
                onChange={handleNewRoomChange}
                required
              >
                <option value="salle">Salle de cours</option>
                <option value="amphitheatre">Amphithéâtre</option>
                <option value="laboratoire">Laboratoire</option>
                <option value="bureau">Bureau</option>
                <option value="autre">Autre</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Équipements</Form.Label>
              <InputGroup className="mb-2">
                <Form.Control
                  type="text"
                  placeholder="Ajouter un équipement (ex: Projecteur)"
                  value={equipmentInput}
                  onChange={(e) => setEquipmentInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddEquipment();
                    }
                  }}
                />
                <Button variant="outline-secondary" onClick={handleAddEquipment}>Ajouter</Button>
              </InputGroup>
              <div>
                {newRoom.equipment.map((eq, index) => (
                  <Badge key={index} bg="secondary" className="me-2 mb-2">
                    {eq}
                    <i className="fas fa-times-circle ms-1" style={{ cursor: 'pointer' }} onClick={() => handleRemoveEquipment(eq)}></i>
                  </Badge>
                ))}
              </div>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseRoomModal}>
              Annuler
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? <Spinner as="span" size="sm" animation="border" /> : "Créer Salle"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  )
}

export default Apparitorat
