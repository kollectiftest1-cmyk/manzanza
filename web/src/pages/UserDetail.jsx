"use client"

import { useState } from "react"
import { Container, Row, Col, Card, Form, Button, Modal, Badge } from "react-bootstrap"
import { motion } from "framer-motion"
import { FiShield, FiUser, FiLock, FiBell, FiSave, FiMail, FiPhone, FiMapPin, FiCalendar, FiHash, FiBook, FiUsers, FiGrid } from "react-icons/fi"
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

// Dashboard for admin/SGA/other roles — shows user detailed info
const AdminDashboard = ({ user }) => {
  const roleLabels = {
    iadmin: 'Super Administrateur',
    sga: 'Secrétaire Général Académique',
    sgad: 'Secrétaire Général Administratif',
    pdg: 'Président Directeur',
    directeur_general: 'Directeur Général',
    chef_section: 'Chef de Section / Faculté',
    chef_departement: 'Chef de Département / Filière',
    bibliothecaire: 'Bibliothécaire',
    caisse: 'Caissier(ère)',
    service_it: 'Service Informatique',
    apparitorat: 'Apparitorat',
  }

  const infoItems = [
    { icon: FiMail, label: 'Email', value: user?.email },
    { icon: FiPhone, label: 'Téléphone', value: user?.phone || 'Non renseigné' },
    { icon: FiHash, label: 'Matricule', value: user?.matricule || 'N/A' },
    { icon: FiCalendar, label: 'Date d\'inscription', value: user?.date_joined ? new Date(user.date_joined).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'N/A' },
  ]

  // Add auditoire info for students/staff with auditoire
  if (user?.auditoire_details) {
    infoItems.push({ icon: FiGrid, label: 'Auditoire', value: user.auditoire_details.nom })
  }

  return (
    <motion.div variants={itemVariants}>
      <Row className="g-4" style={{ marginTop: '8px' }}>
        {/* Info Card */}
        <Col lg={6}>
          <Card style={{ 
            background: 'var(--color-cardBg)', 
            border: '1px solid var(--color-border)', 
            borderRadius: '16px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          }}>
            <Card.Header style={{
              background: 'linear-gradient(135deg, var(--color-primary) 0%, #667eea 100%)',
              borderRadius: '16px 16px 0 0',
              padding: '20px 24px',
              border: 'none'
            }}>
              <h6 style={{ margin: 0, fontWeight: '700', fontSize: '18px', color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FiUser size={20} /> Informations Personnelles
              </h6>
            </Card.Header>
            <Card.Body style={{ padding: '24px' }}>
              {infoItems.map((item, idx) => (
                <div key={idx} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '12px 0',
                  borderBottom: idx < infoItems.length - 1 ? '1px solid var(--color-border)' : 'none'
                }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '10px',
                    background: 'var(--color-bodyBg)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <item.icon size={18} style={{ color: 'var(--color-primary)' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--color-textSecondary)', fontWeight: '500' }}>{item.label}</div>
                    <div style={{ fontSize: '15px', color: 'var(--color-text)', fontWeight: '600' }}>{item.value}</div>
                  </div>
                </div>
              ))}
            </Card.Body>
          </Card>
        </Col>

        {/* Role & Access Card */}
        <Col lg={6}>
          <Card style={{ 
            background: 'var(--color-cardBg)', 
            border: '1px solid var(--color-border)', 
            borderRadius: '16px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          }}>
            <Card.Header style={{
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              borderRadius: '16px 16px 0 0',
              padding: '20px 24px',
              border: 'none'
            }}>
              <h6 style={{ margin: 0, fontWeight: '700', fontSize: '18px', color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FiShield size={20} /> Rôle & Accès
              </h6>
            </Card.Header>
            <Card.Body style={{ padding: '24px' }}>
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{
                  width: '80px', height: '80px', borderRadius: '20px',
                  background: 'linear-gradient(135deg, var(--color-primary), #667eea)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.15)'
                }}>
                  <FiShield size={36} color="white" />
                </div>
                <h5 style={{ color: 'var(--color-text)', fontWeight: '700', marginBottom: '8px' }}>
                  {roleLabels[user?.role] || user?.role || 'Utilisateur'}
                </h5>
                <p style={{ color: 'var(--color-textSecondary)', fontSize: '14px', marginBottom: '16px' }}>
                  Statut : <strong style={{ color: user?.status === 'actif' ? '#1cc88a' : '#e74a3b' }}>{user?.status || 'inactif'}</strong>
                </p>
              </div>

              {/* Sections & Filières info */}
              {user?.sections?.length > 0 && (
                <div style={{ marginTop: '16px', padding: '12px', background: 'var(--color-bodyBg)', borderRadius: '10px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--color-textSecondary)', fontWeight: '600', marginBottom: '8px' }}>SECTIONS / FACULTÉS</div>
                  {user.sections.map((s, i) => (
                    <Badge key={i} style={{ background: '#4e73df', padding: '6px 12px', borderRadius: '6px', margin: '2px 4px', fontSize: '12px' }}>
                      {s.nom || s.name}
                    </Badge>
                  ))}
                </div>
              )}
              {user?.filieres?.length > 0 && (
                <div style={{ marginTop: '12px', padding: '12px', background: 'var(--color-bodyBg)', borderRadius: '10px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--color-textSecondary)', fontWeight: '600', marginBottom: '8px' }}>FILIÈRES / DÉPARTEMENTS</div>
                  {user.filieres.map((f, i) => (
                    <Badge key={i} style={{ background: '#1cc88a', padding: '6px 12px', borderRadius: '6px', margin: '2px 4px', fontSize: '12px' }}>
                      {f.nom || f.name}
                    </Badge>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </motion.div>
  )
}

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
