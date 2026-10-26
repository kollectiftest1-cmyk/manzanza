"use client"

import { useState, useEffect } from "react"
import { Container, Row, Col, Card, Button, Table, Badge, Form, Modal, Spinner, Alert, Tab, Tabs, InputGroup, Nav } from "react-bootstrap"
import { useSelector, useDispatch } from "react-redux"
import { motion } from "framer-motion"
import { FiHome, FiPlus, FiCalendar, FiCheck, FiX, FiArchive, FiUsers, FiClock, FiTrendingUp, FiList, FiSave } from "react-icons/fi"
import {
  fetchRooms,
  createRoom,
  fetchReservations,
  fetchArchivedReservations, // Import new thunk
  createReservation,
  updateReservationStatus,
} from "../store/slices/apparitoratSlice"
import { notify, notifyError } from "../utils/notify"

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

const formatError = (err) => {
  if (!err) return "Une erreur est survenue."
  if (typeof err === "string") return err
  if (err.detail) return err.detail
  if (err.message) return err.message
  return Object.values(err).flat().join(" ") || "Une erreur est survenue."
}

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

  const submitReservation = async (statusOverride = 'pending') => {
    try {
      await dispatch(createReservation({ ...newReservation, requested_by: user.id, status: statusOverride })).unwrap()
      notify.info("Demande de réservation envoyée avec succès!")
      handleCloseReservationModal()
      dispatch(fetchReservations()); // Refresh active reservations
    } catch (err) {
      notifyError(err, "Erreur lors de la création de la réservation: " + formatError(err))
    }
  }

  const handleSubmitReservation = async (e) => {
    e.preventDefault()
    await submitReservation('pending')
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
      notify.info("Salle créée avec succès!")
      handleCloseRoomModal()
      dispatch(fetchRooms()); // Refresh rooms
    } catch (err) {
      notifyError(err, "Erreur lors de la création de la salle: " + formatError(err))
    }
  }

  // Handler for updating reservation status (for authorized users)
  const handleUpdateReservationStatus = async (reservationId, status) => {
    try {
      await dispatch(updateReservationStatus({ id: reservationId, status })).unwrap()
      notify.info(`Réservation ${status} avec succès!`)
      dispatch(fetchReservations()); // Refresh active reservations
      dispatch(fetchArchivedReservations()); // Refresh archived reservations
    } catch (err) {
      notifyError(err, "Erreur lors de la mise à jour du statut: " + formatError(err))
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
  const canManageRooms = ['pdg', 'apparitorat', 'sga', 'sgad', 'directeur_general'].includes(user?.role);
  const canManageReservations = ['pdg', 'apparitorat', 'sga', 'sgad', 'directeur_general'].includes(user?.role);

  // Calculate stats
  const totalRooms = rooms.length;
  const confirmedReservationsCount = Array.isArray(reservations) ? reservations.filter(res => res.status === 'confirmed').length : 0;
  const pendingReservationsCount = Array.isArray(reservations) ? reservations.filter(res => res.status === 'pending').length : 0;
  const totalReservations = (Array.isArray(reservations) ? reservations.length : 0) + (Array.isArray(archivedReservations) ? archivedReservations.length : 0);
  // Placeholder for occupancy rate, would need more complex logic based on actual schedules
  const occupancyRate = totalRooms > 0 ? ((confirmedReservationsCount / totalRooms) * 100).toFixed(0) : 0;


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
                background: 'linear-gradient(135deg, #fa709a, #fee140)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
              }}>
                <FiHome size={28} style={{ color: 'white' }} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '32px', fontWeight: '700', color: 'var(--color-text)' }}>
                  Apparitorat
                </h2>
                <p style={{ margin: 0, color: 'var(--color-textSecondary)', fontSize: '16px' }}>Gestion des salles et réservations</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {canManageRooms && (
                <Button 
                  variant="info" 
                  onClick={handleShowRoomModal}
                  style={{ borderRadius: '8px', padding: '10px 20px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <FiPlus size={18} />
                  Ajouter Salle
                </Button>
              )}
              <Button 
                variant="primary" 
                onClick={handleShowReservationModal}
                style={{ borderRadius: '8px', padding: '10px 20px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <FiCalendar size={18} />
                Nouvelle Réservation
              </Button>
            </div>
          </div>
        </motion.div>

        {loading && (
          <motion.div variants={itemVariants} style={{ textAlign: 'center', padding: '20px' }}>
            <Spinner animation="border" style={{ color: 'var(--color-primary)', width: '3rem', height: '3rem' }} />
          </motion.div>
        )}
        {error && (
          <motion.div variants={itemVariants}>
            <Alert variant="danger" style={{ borderRadius: '12px', padding: '16px' }}>{formatError(error)}</Alert>
          </motion.div>
        )}

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
                  <FiHome size={32} style={{ color: 'var(--color-primary)', marginBottom: '12px' }} />
                  <h3 style={{ color: 'var(--color-primary)', fontSize: '32px', fontWeight: '700', margin: '8px 0' }}>{totalRooms}</h3>
                  <p style={{ color: 'var(--color-textSecondary)', margin: 0, fontSize: '14px' }}>Salles</p>
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
                  <FiCheck size={32} style={{ color: '#28a745', marginBottom: '12px' }} />
                  <h3 style={{ color: '#28a745', fontSize: '32px', fontWeight: '700', margin: '8px 0' }}>{confirmedReservationsCount}</h3>
                  <p style={{ color: 'var(--color-textSecondary)', margin: 0, fontSize: '14px' }}>Réservations Confirmées</p>
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
                  <h3 style={{ color: '#ffc107', fontSize: '32px', fontWeight: '700', margin: '8px 0' }}>{pendingReservationsCount}</h3>
                  <p style={{ color: 'var(--color-textSecondary)', margin: 0, fontSize: '14px' }}>En Attente</p>
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
                  <FiTrendingUp size={32} style={{ color: '#17a2b8', marginBottom: '12px' }} />
                  <h3 style={{ color: '#17a2b8', fontSize: '32px', fontWeight: '700', margin: '8px 0' }}>{occupancyRate}%</h3>
                  <p style={{ color: 'var(--color-textSecondary)', margin: 0, fontSize: '14px' }}>Taux d'Occupation</p>
                </Card.Body>
              </Card>
            </motion.div>
          </Col>
        </Row>

        <Row>
          {/* Liste des salles */}
          <Col md={6}>
            <motion.div variants={itemVariants}>
              <Card style={{
                background: 'var(--color-cardBg)',
                border: '1px solid var(--color-border)',
                borderRadius: '16px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                marginBottom: '24px'
              }}>
                <Card.Header style={{
                  background: 'linear-gradient(135deg, var(--color-primary), #667eea)',
                  color: 'white',
                  padding: '20px 24px',
                  borderBottom: 'none',
                  borderTopLeftRadius: '16px',
                  borderTopRightRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <FiHome size={20} />
                  <h5 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Salles Disponibles</h5>
                </Card.Header>
                <Card.Body style={{ padding: '24px' }}>
                  {Array.isArray(rooms) && rooms.length === 0 && !loading && (
                    <p style={{ textAlign: 'center', color: 'var(--color-textSecondary)', fontSize: '16px', padding: '20px' }}>
                      <FiHome size={48} style={{ opacity: 0.3, marginBottom: '12px', display: 'block', margin: '0 auto 12px' }} />
                      Aucune salle disponible.
                    </p>
                  )}
                  {Array.isArray(rooms) && rooms.map((room) => (
                    <Card key={room.id} style={{
                      marginBottom: '16px',
                      background: 'var(--color-bodyBg)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '12px'
                    }}>
                      <Card.Body style={{ padding: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                          <div style={{ flexGrow: 1 }}>
                            <h6 style={{ color: 'var(--color-primary)', margin: 0, marginBottom: '8px', fontSize: '16px', fontWeight: '600' }}>
                              {room.name}
                            </h6>
                            <p style={{ color: 'var(--color-textSecondary)', margin: 0, marginBottom: '4px', fontSize: '14px' }}>
                              <FiUsers size={14} style={{ marginRight: '6px' }} />
                              Capacité: {room.capacity} places
                            </p>
                            <p style={{ color: 'var(--color-textSecondary)', margin: 0, marginBottom: '8px', fontSize: '14px' }}>
                              Type: <Badge bg="secondary" style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '12px', marginLeft: '4px' }}>{room.room_type}</Badge>
                            </p>
                            <div>
                              {room.equipment && room.equipment.map((eq, index) => (
                                <Badge key={index} bg="info" style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px', marginRight: '6px', marginBottom: '4px' }}>
                                  {eq}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <Badge bg="success" style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '12px' }}>Disponible</Badge>
                        </div>
                      </Card.Body>
                    </Card>
                  ))}
                </Card.Body>
              </Card>
            </motion.div>
          </Col>

          {/* Réservations */}
          <Col md={6}>
            <motion.div variants={itemVariants}>
              <Card style={{
                background: 'var(--color-cardBg)',
                border: '1px solid var(--color-border)',
                borderRadius: '16px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}>
                <Card.Header style={{
                  background: 'linear-gradient(135deg, #11998e, #38ef7d)',
                  color: 'white',
                  padding: '20px 24px',
                  borderBottom: 'none',
                  borderTopLeftRadius: '16px',
                  borderTopRightRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <FiCalendar size={20} />
                  <h5 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Gestion des Réservations</h5>
                </Card.Header>
                <Card.Body style={{ padding: 0 }}>
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
            </motion.div>
          </Col>
        </Row>

        {/* Modal nouvelle réservation */}
        <Modal show={showReservationModal} onHide={handleCloseReservationModal} size="lg" centered>
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
                <FiCalendar size={24} />
                Nouvelle Réservation de Salle
              </Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmitReservation}>
              <Modal.Body style={{ padding: '32px', background: 'var(--color-cardBg)' }}>
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
              <Modal.Footer style={{ background: 'var(--color-cardBg)', borderTop: '1px solid var(--color-border)', padding: '20px' }}>
                <Button variant="secondary" onClick={handleCloseReservationModal} style={{ borderRadius: '8px', padding: '10px 24px' }}>
                  Annuler
                </Button>
                {canManageReservations && (
                  <Button variant="success" type="button" disabled={loading}
                    onClick={() => submitReservation('confirmed')}
                    style={{ borderRadius: '8px', padding: '10px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {loading ? <Spinner as="span" size="sm" animation="border" /> : <><FiCheck size={18} />Définitif</>}
                  </Button>
                )}
                <Button variant="primary" type="submit" disabled={loading} style={{ borderRadius: '8px', padding: '10px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {loading ? <Spinner as="span" size="sm" animation="border" /> : <><FiSave size={18} />Réserver</>}
                </Button>
              </Modal.Footer>
            </Form>
          </div>
        </Modal>

        {/* Modal for creating a new room */}
        <Modal show={showRoomModal} onHide={handleCloseRoomModal} size="lg" centered>
          <div style={{
            background: 'var(--color-cardBg)',
            borderRadius: '16px',
            border: '1px solid var(--color-border)',
            overflow: 'hidden'
          }}>
            <Modal.Header closeButton style={{
              background: 'linear-gradient(135deg, #11998e, #38ef7d)',
              color: 'white',
              borderBottom: 'none',
              padding: '24px'
            }}>
              <Modal.Title style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '22px' }}>
                <FiPlus size={24} />
                Ajouter une Nouvelle Salle
              </Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleSubmitRoom}>
              <Modal.Body style={{ padding: '32px', background: 'var(--color-cardBg)' }}>
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
              <Modal.Footer style={{ background: 'var(--color-cardBg)', borderTop: '1px solid var(--color-border)', padding: '20px' }}>
                <Button variant="secondary" onClick={handleCloseRoomModal} style={{ borderRadius: '8px', padding: '10px 24px' }}>
                  Annuler
                </Button>
                <Button variant="primary" type="submit" disabled={loading} style={{ borderRadius: '8px', padding: '10px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {loading ? <Spinner as="span" size="sm" animation="border" /> : <><FiPlus size={18} />Créer Salle</>}
                </Button>
              </Modal.Footer>
            </Form>
          </div>
        </Modal>
      </motion.div>
    </Container>
  )
}

export default Apparitorat
