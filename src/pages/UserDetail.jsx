"use client"

import { useState } from "react"
import { Container, Row, Col, Card, Form, Button, Modal } from "react-bootstrap"
import { motion } from "framer-motion"
import { FiShield, FiUser, FiLock, FiBell, FiSave } from "react-icons/fi"
import ProfileHeader from "../components/Profile/ProfileHeader"
import StudentDashboard from "../components/Profile/StudentDashboard"
import TeacherDashboard from "../components/Profile/TeacherDashboard"

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.3,
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 }
  }
}

// Placeholder for other roles
const AdminDashboard = ({ user }) => (
  <motion.div variants={itemVariants}>
    <Card style={{ 
      background: 'var(--color-cardBg)', 
      border: '1px solid var(--color-border)', 
      borderRadius: '16px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      marginTop: '24px'
    }}>
      <Card.Body style={{ padding: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <FiShield size={28} style={{ color: 'var(--color-primary)' }} />
          <Card.Title style={{ margin: 0, fontSize: '24px', color: 'var(--color-text)' }}>Tableau de Bord Administratif</Card.Title>
        </div>
        <Card.Text style={{ color: 'var(--color-textSecondary)', fontSize: '16px' }}>
          Les statistiques et outils pour le rôle de <strong style={{ color: 'var(--color-primary)' }}>{user.role}</strong> seront affichés ici.
        </Card.Text>
      </Card.Body>
    </Card>
  </motion.div>
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
      case 'assistant':
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
            <Modal.Header closeButton style={{ 
              background: 'linear-gradient(135deg, var(--color-primary), #667eea)',
              color: 'white',
              borderBottom: 'none',
              padding: '24px'
            }}>
              <Modal.Title style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '22px' }}>
                <FiUser size={24} />
                Modifier les Informations Personnelles
              </Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ padding: '32px', background: 'var(--color-cardBg)' }}>
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
            <Modal.Footer style={{ background: 'var(--color-cardBg)', borderTop: '1px solid var(--color-border)', padding: '20px' }}>
              <Button variant="secondary" onClick={handleCloseModal} style={{ borderRadius: '8px', padding: '10px 24px' }}>Annuler</Button>
              <Button type="submit" variant="primary" style={{ borderRadius: '8px', padding: '10px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FiSave size={18} />
                Sauvegarder
              </Button>
            </Modal.Footer>
          </Form>
        )
      case 'password':
        return (
          <Form onSubmit={handlePasswordSubmit}>
            <Modal.Header closeButton style={{ 
              background: 'linear-gradient(135deg, #f093fb, #f5576c)',
              color: 'white',
              borderBottom: 'none',
              padding: '24px'
            }}>
              <Modal.Title style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '22px' }}>
                <FiLock size={24} />
                Changer le Mot de Passe
              </Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ padding: '32px', background: 'var(--color-cardBg)' }}>
              <Form.Group className="mb-3"><Form.Label>Mot de passe actuel</Form.Label><Form.Control type="password" name="currentPassword" value={formData.currentPassword} onChange={handleInputChange} required /></Form.Group>
              <Form.Group className="mb-3"><Form.Label>Nouveau mot de passe</Form.Label><Form.Control type="password" name="newPassword" value={formData.newPassword} onChange={handleInputChange} required /></Form.Group>
              <Form.Group className="mb-3"><Form.Label>Confirmer le nouveau mot de passe</Form.Label><Form.Control type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} required /></Form.Group>
            </Modal.Body>
            <Modal.Footer style={{ background: 'var(--color-cardBg)', borderTop: '1px solid var(--color-border)', padding: '20px' }}>
              <Button variant="secondary" onClick={handleCloseModal} style={{ borderRadius: '8px', padding: '10px 24px' }}>Annuler</Button>
              <Button type="submit" variant="warning" style={{ borderRadius: '8px', padding: '10px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FiLock size={18} />
                Changer
              </Button>
            </Modal.Footer>
          </Form>
        )
      case 'notifications':
        return (
          <>
            <Modal.Header closeButton style={{ 
              background: 'linear-gradient(135deg, #4facfe, #00f2fe)',
              color: 'white',
              borderBottom: 'none',
              padding: '24px'
            }}>
              <Modal.Title style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '22px' }}>
                <FiBell size={24} />
                Préférences de Notification
              </Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ padding: '32px', background: 'var(--color-cardBg)' }}>
              <Form>
                <Form.Check type="switch" id="email-notifications" label="Notifications par email" defaultChecked className="mb-3" />
                <Form.Check type="switch" id="quiz-reminders" label="Rappels de quiz" defaultChecked className="mb-3" />
                <Form.Check type="switch" id="course-updates" label="Mises à jour des cours" defaultChecked className="mb-3" />
              </Form>
            </Modal.Body>
            <Modal.Footer style={{ background: 'var(--color-cardBg)', borderTop: '1px solid var(--color-border)', padding: '20px' }}>
              <Button variant="secondary" onClick={handleCloseModal} style={{ borderRadius: '8px', padding: '10px 24px' }}>Fermer</Button>
              <Button variant="primary" style={{ borderRadius: '8px', padding: '10px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FiSave size={18} />
                Sauvegarder
              </Button>
            </Modal.Footer>
          </>
        )
      default:
        return null
    }
  }

  return (
    <Container fluid style={{ padding: '24px', background: 'var(--color-bodyBg)', minHeight: '100vh' }}>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{ maxWidth: '1400px', margin: '0 auto' }}
      >
        <ProfileHeader user={user} currentUser={currentUser} onTabSelect={handleTabSelect} />
        {renderDashboard()}
      </motion.div>

      <Modal
        show={showModal}
        onHide={handleCloseModal}
        size="lg"
        centered
        style={{ zIndex: 1050 }}
      >
        <div style={{
          background: 'var(--color-cardBg)',
          borderRadius: '16px',
          border: '1px solid var(--color-border)',
          overflow: 'hidden',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)'
        }}>
          {renderModalContent()}
        </div>
      </Modal>
    </Container>
  )
}

export default UserDetail
