"use client"

import { useState } from "react"
import { Container, Row, Col, Card, Form, Button, Modal } from "react-bootstrap"
import ProfileHeader from "../components/Profile/ProfileHeader"
import StudentDashboard from "../components/Profile/StudentDashboard"
import TeacherDashboard from "../components/Profile/TeacherDashboard"

// Placeholder for other roles
const AdminDashboard = ({ user }) => (
  <Card>
    <Card.Body>
      <Card.Title>Tableau de Bord Administratif</Card.Title>
      <Card.Text>
        Les statistiques et outils pour le rôle de <strong>{user.role}</strong> seront affichés ici.
      </Card.Text>
    </Card.Body>
  </Card>
)

const UserDetail = ({ user, currentUser, onProfileUpdate, onPasswordChange }) => {
  const [showModal, setShowModal] = useState(false)
  const [modalContent, setModalContent] = useState(null)

  const [formData, setFormData] = useState({
    first_name: user.first_name || "",
    last_name: user.last_name || "",
    email: user.email || "",
    phone: user.phone || "",
    address: user.address || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const handleTabSelect = (tabKey) => {
    setModalContent(tabKey)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setModalContent(null)
  }

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleProfileSubmit = (e) => {
    e.preventDefault()
    onProfileUpdate(formData)
    handleCloseModal()
  }

  const handlePasswordSubmit = (e) => {
    e.preventDefault()
    if (formData.newPassword !== formData.confirmPassword) {
      alert("Les mots de passe ne correspondent pas")
      return
    }
    onPasswordChange(formData)
    handleCloseModal()
  }

  const renderDashboard = () => {
    switch (user.role) {
      case 'etudiant':
        return <StudentDashboard user={user} />
      case 'enseignant':
        return <TeacherDashboard user={user} />
      default:
        return <AdminDashboard user={user} />
    }
  }

  const renderModalContent = () => {
    switch (modalContent) {
      case 'personal-info':
        return (
          <Form onSubmit={handleProfileSubmit}>
            <Modal.Header closeButton><Modal.Title>Modifier les Informations Personnelles</Modal.Title></Modal.Header>
            <Modal.Body>
              <Row>
                <Col md={6}><Form.Group className="mb-3"><Form.Label>Prénom</Form.Label><Form.Control type="text" name="first_name" value={formData.first_name} onChange={handleInputChange} required /></Form.Group></Col>
                <Col md={6}><Form.Group className="mb-3"><Form.Label>Nom</Form.Label><Form.Control type="text" name="last_name" value={formData.last_name} onChange={handleInputChange} required /></Form.Group></Col>
              </Row>
              <Row>
                <Col md={6}><Form.Group className="mb-3"><Form.Label>Email</Form.Label><Form.Control type="email" name="email" value={formData.email} onChange={handleInputChange} required /></Form.Group></Col>
                <Col md={6}><Form.Group className="mb-3"><Form.Label>Téléphone</Form.Label><Form.Control type="tel" name="phone" value={formData.phone} onChange={handleInputChange} /></Form.Group></Col>
              </Row>
              <Form.Group className="mb-3"><Form.Label>Adresse</Form.Label><Form.Control type="text" name="address" value={formData.address} onChange={handleInputChange} /></Form.Group>
            </Modal.Body>
            <Modal.Footer><Button variant="secondary" onClick={handleCloseModal}>Annuler</Button><Button type="submit" variant="primary">Sauvegarder</Button></Modal.Footer>
          </Form>
        )
      case 'password':
        return (
          <Form onSubmit={handlePasswordSubmit}>
            <Modal.Header closeButton><Modal.Title>Changer le Mot de Passe</Modal.Title></Modal.Header>
            <Modal.Body>
              <Form.Group className="mb-3"><Form.Label>Mot de passe actuel</Form.Label><Form.Control type="password" name="currentPassword" value={formData.currentPassword} onChange={handleInputChange} required /></Form.Group>
              <Form.Group className="mb-3"><Form.Label>Nouveau mot de passe</Form.Label><Form.Control type="password" name="newPassword" value={formData.newPassword} onChange={handleInputChange} required /></Form.Group>
              <Form.Group className="mb-3"><Form.Label>Confirmer le nouveau mot de passe</Form.Label><Form.Control type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} required /></Form.Group>
            </Modal.Body>
            <Modal.Footer><Button variant="secondary" onClick={handleCloseModal}>Annuler</Button><Button type="submit" variant="warning">Changer</Button></Modal.Footer>
          </Form>
        )
      case 'notifications':
        return (
          <>
            <Modal.Header closeButton><Modal.Title>Préférences de Notification</Modal.Title></Modal.Header>
            <Modal.Body>
              <Form>
                <Form.Check type="switch" id="email-notifications" label="Notifications par email" defaultChecked className="mb-3" />
                <Form.Check type="switch" id="quiz-reminders" label="Rappels de quiz" defaultChecked className="mb-3" />
                <Form.Check type="switch" id="course-updates" label="Mises à jour des cours" defaultChecked className="mb-3" />
              </Form>
            </Modal.Body>
            <Modal.Footer><Button variant="secondary" onClick={handleCloseModal}>Fermer</Button><Button variant="primary">Sauvegarder</Button></Modal.Footer>
          </>
        )
      default:
        return null
    }
  }

  return (
    <Container fluid className="mt-4">
      <ProfileHeader user={user} currentUser={currentUser} onTabSelect={handleTabSelect} />
      {renderDashboard()}
      <Modal show={showModal} onHide={handleCloseModal} size="lg">
        {renderModalContent()}
      </Modal>
    </Container>
  )
}

export default UserDetail
