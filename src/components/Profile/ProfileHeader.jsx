"use client"

import { Row, Col, Card, Badge, Button, Dropdown } from "react-bootstrap"

const getRoleBadge = (role) => {
  const roleConfig = {
    etudiant: { variant: "primary", text: "Étudiant" },
    enseignant: { variant: "success", text: "Enseignant" },
    admin: { variant: "danger", text: "Administrateur" },
    chef_departement: { variant: "warning", text: "Chef de Département" },
    sga: { variant: "info", text: "SGA" },
    sgad: { variant: "info", text: "SGAD" },
    iadmin: { variant: "danger", text: "Super Admin" },
    pdg: { variant: "dark", text: "PDG" },
    directeur_general: { variant: "dark", text: "Directeur Général" },
    bibliothecaire: { variant: "secondary", text: "Bibliothécaire" },
    caisse: { variant: "secondary", text: "Caisse" },
    service_it: { variant: "secondary", text: "Service IT" },
    apparitorat: { variant: "secondary", text: "Apparitorat" },
  }
  const config = roleConfig[role] || { variant: "secondary", text: "Utilisateur" }
  return <Badge bg={config.variant}>{config.text}</Badge>
}

const ProfileHeader = ({ user, currentUser, onTabSelect }) => {
  const isOwnProfile = currentUser?.id === user?.id

  return (
    <Card className="shadow-sm mb-4">
      <Card.Body>
        <Row className="align-items-center">
          <Col xs="auto">
            <div
              className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center"
              style={{ width: "80px", height: "80px", fontSize: "2.5rem" }}
            >
              {user?.name?.charAt(0) || "U"}
            </div>
          </Col>
          <Col>
            <h4 className="mb-0">{user?.name || "Nom Utilisateur"}</h4>
            <p className="text-muted mb-1">{user?.email || "email@example.com"}</p>
            <div>
              {getRoleBadge(user?.role)}
              <Badge bg={user?.status === 'actif' ? 'success' : 'secondary'} className="ms-2">{user?.status}</Badge>
            </div>
          </Col>
          <Col xs="auto">
            {isOwnProfile && (
              <Dropdown>
                <Dropdown.Toggle variant="light" id="profile-actions">
                  <i className="fas fa-ellipsis-h"></i>
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item onClick={() => onTabSelect('personal-info')}>
                    <i className="fas fa-user-edit me-2"></i> Modifier Profil
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => onTabSelect('password')}>
                    <i className="fas fa-key me-2"></i> Changer Mot de Passe
                  </Dropdown.Item>
                  <Dropdown.Item onClick={() => onTabSelect('notifications')}>
                    <i className="fas fa-bell me-2"></i> Notifications
                  </Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item href="#" className="text-danger">
                    <i className="fas fa-file-pdf me-2"></i> Télécharger Fiche
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            )}
          </Col>
        </Row>
      </Card.Body>
    </Card>
  )
}

export default ProfileHeader
