"use client"

import { Row, Col, Card, Badge, Button, Dropdown } from "react-bootstrap"
import { FiUser, FiKey, FiBell, FiFileText, FiMoreVertical } from "react-icons/fi"
import { motion } from "framer-motion"

const getRoleBadge = (role) => {
  const roleConfig = {
    etudiant: { color: "#4e73df", text: "Étudiant" },
    enseignant: { color: "#1cc88a", text: "Enseignant" },
    admin: { color: "#e74a3b", text: "Administrateur" },
    chef_departement: { color: "#f6c23e", text: "Chef de Département" },
    sga: { color: "#36b9cc", text: "SGA" },
    sgad: { color: "#36b9cc", text: "SGAD" },
    iadmin: { color: "#e74a3b", text: "Super Admin" },
    pdg: { color: "#5a5c69", text: "PDG" },
    directeur_general: { color: "#5a5c69", text: "Directeur Général" },
    bibliothecaire: { color: "#858796", text: "Bibliothécaire" },
    caisse: { color: "#858796", text: "Caisse" },
    service_it: { color: "#858796", text: "Service IT" },
    apparitorat: { color: "#858796", text: "Apparitorat" },
  }
  const config = roleConfig[role] || { color: "#858796", text: "Utilisateur" }
  return (
    <Badge style={{
      background: config.color,
      padding: '6px 12px',
      borderRadius: '6px',
      fontWeight: '600',
      fontSize: '12px'
    }}>
      {config.text}
    </Badge>
  )
}

const ProfileHeader = ({ user, currentUser, onTabSelect }) => {
  const isOwnProfile = currentUser?.id === user?.id

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card style={{
        background: 'var(--color-cardBg)',
        border: '1px solid var(--color-border)',
        borderRadius: '16px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        marginBottom: '24px',
        overflow: 'hidden'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, var(--color-primary) 0%, #667eea 100%)',
          height: '120px'
        }} />
        <Card.Body style={{ padding: '0 32px 32px', marginTop: '-60px' }}>
          <Row className="align-items-end" style={{ marginBottom: '20px' }}>
            <Col xs="auto">
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
                style={{
                  width: "120px",
                  height: "120px",
                  borderRadius: "50%",
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: "3rem",
                  fontWeight: '700',
                  color: 'white',
                  border: '5px solid var(--color-cardBg)',
                  boxShadow: '0 8px 16px rgba(0,0,0,0.2)'
                }}
              >
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </motion.div>
            </Col>
            <Col>
              <h3 style={{
                margin: '0 0 8px 0',
                fontSize: '28px',
                fontWeight: '700',
                color: 'var(--color-text)'
              }}>
                {user?.name || "Nom Utilisateur"}
              </h3>
              <p style={{
                margin: '0 0 12px 0',
                fontSize: '16px',
                color: 'var(--color-textSecondary)'
              }}>
                {user?.email || "email@example.com"}
              </p>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                {getRoleBadge(user?.role)}
                <Badge style={{
                  background: user?.status === 'actif' ? '#1cc88a' : '#858796',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontWeight: '600',
                  fontSize: '12px'
                }}>
                  {user?.status || 'inactif'}
                </Badge>
              </div>
            </Col>
            <Col xs="auto">
              {isOwnProfile && (
                <Dropdown>
                  <Dropdown.Toggle
                    variant="light"
                    id="profile-actions"
                    style={{
                      background: 'var(--color-cardBg)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '8px',
                      padding: '10px 16px',
                      color: 'var(--color-text)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <FiMoreVertical size={20} />
                  </Dropdown.Toggle>
                  <Dropdown.Menu style={{
                    background: 'var(--color-cardBg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '12px',
                    padding: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    minWidth: '220px'
                  }}>
                    <Dropdown.Item
                      onClick={() => onTabSelect('personal-info')}
                      style={{
                        borderRadius: '8px',
                        padding: '10px 16px',
                        color: 'var(--color-text)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                      }}
                    >
                      <FiUser size={18} /> Modifier Profil
                    </Dropdown.Item>
                    <Dropdown.Item
                      onClick={() => onTabSelect('password')}
                      style={{
                        borderRadius: '8px',
                        padding: '10px 16px',
                        color: 'var(--color-text)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                      }}
                    >
                      <FiKey size={18} /> Changer Mot de Passe
                    </Dropdown.Item>
                    <Dropdown.Item
                      onClick={() => onTabSelect('notifications')}
                      style={{
                        borderRadius: '8px',
                        padding: '10px 16px',
                        color: 'var(--color-text)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                      }}
                    >
                      <FiBell size={18} /> Notifications
                    </Dropdown.Item>
                    <Dropdown.Divider style={{ borderColor: 'var(--color-border)', margin: '8px 0' }} />
                    <Dropdown.Item
                      href="#"
                      style={{
                        borderRadius: '8px',
                        padding: '10px 16px',
                        color: '#e74a3b',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                      }}
                    >
                      <FiFileText size={18} /> Télécharger Fiche
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              )}
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </motion.div>
  )
}

export default ProfileHeader
