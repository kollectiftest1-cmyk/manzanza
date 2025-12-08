"use client"

import { useState } from "react"
import { Row, Col, Card, Badge, Button, Dropdown } from "react-bootstrap"
import { FiUser, FiKey, FiBell, FiFileText, FiMoreVertical, FiCamera } from "react-icons/fi"
import { motion } from "framer-motion"
import UserAvatar from "../UserAvatar"
import AvatarUpload from "./AvatarUpload"

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
  const [showAvatarUpload, setShowAvatarUpload] = useState(false)

  const handleAvatarSave = (newAvatarUrl) => {
    // TODO: Mettre à jour l'avatar dans le backend
    console.log('Nouvel avatar:', newAvatarUrl)
  }

  return (
    <>
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
            background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)',
            height: '120px'
          }} />
          <Card.Body style={{ padding: '0 32px 32px', marginTop: '-60px' }}>
            <Row className="align-items-end" style={{ marginBottom: '20px' }}>
              <Col xs="auto">
                <div style={{ position: 'relative' }}>
                  <UserAvatar
                    user={user}
                    size="xxl"
                    editable={isOwnProfile}
                    onClick={isOwnProfile ? () => setShowAvatarUpload(true) : null}
                  />
                  {isOwnProfile && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setShowAvatarUpload(true)}
                      style={{
                        position: 'absolute',
                        bottom: '5px',
                        right: '5px',
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: 'var(--color-primary)',
                        color: 'white',
                        border: '3px solid var(--color-cardBg)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
                      }}
                    >
                      <FiCamera size={16} />
                    </motion.button>
                  )}
                </div>
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

    {/* Avatar Upload Modal */}
    {showAvatarUpload && (
      <AvatarUpload
        user={user}
        onSave={handleAvatarSave}
        onClose={() => setShowAvatarUpload(false)}
      />
    )}
  </>
  )
}

export default ProfileHeader
