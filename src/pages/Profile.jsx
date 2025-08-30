"use client"

import { useState } from "react"
import { Container, Row, Col, Card, Form, Button, Alert, Badge, Tab, Tabs } from "react-bootstrap"
import { useSelector } from "react-redux"

const Profile = () => {
  const { user } = useSelector((state) => state.auth)
  const [activeTab, setActiveTab] = useState("profile")
  const [showAlert, setShowAlert] = useState(false)
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: user?.address || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleProfileUpdate = (e) => {
    e.preventDefault()
    // Simulate profile update
    setShowAlert(true)
    setTimeout(() => setShowAlert(false), 3000)
  }

  const handlePasswordChange = (e) => {
    e.preventDefault()
    if (formData.newPassword !== formData.confirmPassword) {
      alert("Les mots de passe ne correspondent pas")
      return
    }
    // Simulate password change
    setShowAlert(true)
    setFormData({
      ...formData,
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    })
    setTimeout(() => setShowAlert(false), 3000)
  }

  const getRoleBadge = (role) => {
    const roleConfig = {
      etudiant: { variant: "primary", text: "Étudiant" },
      enseignant: { variant: "success", text: "Enseignant" },
      admin: { variant: "danger", text: "Administrateur" },
      chef_departement: { variant: "warning", text: "Chef de Département" },
    }
    const config = roleConfig[role] || { variant: "secondary", text: "Utilisateur" }
    return <Badge bg={config.variant}>{config.text}</Badge>
  }

  return (
    <Container className="mt-4">
      <Row>
        <Col md={4}>
          <Card className="shadow">
            <Card.Body className="text-center">
              <div className="mb-3">
                <div
                  className="rounded-circle bg-primary text-white d-inline-flex align-items-center justify-content-center"
                  style={{ width: "80px", height: "80px", fontSize: "2rem" }}
                >
                  {user?.name?.charAt(0) || "U"}
                </div>
              </div>
              <h5>{user?.name || "Nom Utilisateur"}</h5>
              <p className="text-muted">{user?.email || "email@example.com"}</p>
              {getRoleBadge(user?.role)}

              <hr />

              <div className="text-start">
                <p>
                  <strong>Matricule:</strong> {user?.matricule || "ISI2024001"}
                </p>
                <p>
                  <strong>Promotion:</strong> {user?.promotion || "1ère Licence Finance"}
                </p>
                <p>
                  <strong>Année Académique:</strong> 2024-2025
                </p>
                <p>
                  <strong>Statut:</strong> <Badge bg="success">Actif</Badge>
                </p>
              </div>
            </Card.Body>
          </Card>

          {user?.role === "etudiant" && (
            <Card className="shadow mt-3">
              <Card.Header>
                <h6 className="mb-0">Statistiques Académiques</h6>
              </Card.Header>
              <Card.Body>
                <div className="d-flex justify-content-between mb-2">
                  <span>Cours Suivis:</span>
                  <Badge bg="info">8</Badge>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span>Quiz Complétés:</span>
                  <Badge bg="success">15</Badge>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span>TP/TD Rendus:</span>
                  <Badge bg="warning">12</Badge>
                </div>
                <div className="d-flex justify-content-between">
                  <span>Moyenne Générale:</span>
                  <Badge bg="primary">14.5/20</Badge>
                </div>
              </Card.Body>
            </Card>
          )}
        </Col>

        <Col md={8}>
          {showAlert && (
            <Alert variant="success" className="mb-3">
              Profil mis à jour avec succès !
            </Alert>
          )}

          <Card className="shadow">
            <Card.Header>
              <h5 className="mb-0">Mon Profil</h5>
            </Card.Header>
            <Card.Body>
              <Tabs activeKey={activeTab} onSelect={setActiveTab} className="mb-3">
                <Tab eventKey="profile" title="Informations Personnelles">
                  <Form onSubmit={handleProfileUpdate}>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Nom Complet</Form.Label>
                          <Form.Control
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            required
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Email</Form.Label>
                          <Form.Control
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Téléphone</Form.Label>
                          <Form.Control type="tel" name="phone" value={formData.phone} onChange={handleInputChange} />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Adresse</Form.Label>
                          <Form.Control
                            type="text"
                            name="address"
                            value={formData.address}
                            onChange={handleInputChange}
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Button type="submit" variant="primary">
                      Mettre à jour le profil
                    </Button>
                  </Form>
                </Tab>

                <Tab eventKey="password" title="Changer le mot de passe">
                  <Form onSubmit={handlePasswordChange}>
                    <Form.Group className="mb-3">
                      <Form.Label>Mot de passe actuel</Form.Label>
                      <Form.Control
                        type="password"
                        name="currentPassword"
                        value={formData.currentPassword}
                        onChange={handleInputChange}
                        required
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Nouveau mot de passe</Form.Label>
                      <Form.Control
                        type="password"
                        name="newPassword"
                        value={formData.newPassword}
                        onChange={handleInputChange}
                        required
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Confirmer le nouveau mot de passe</Form.Label>
                      <Form.Control
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        required
                      />
                    </Form.Group>

                    <Button type="submit" variant="warning">
                      Changer le mot de passe
                    </Button>
                  </Form>
                </Tab>

                <Tab eventKey="notifications" title="Notifications">
                  <Form>
                    <Form.Check
                      type="switch"
                      id="email-notifications"
                      label="Notifications par email"
                      defaultChecked
                      className="mb-3"
                    />
                    <Form.Check
                      type="switch"
                      id="quiz-reminders"
                      label="Rappels de quiz"
                      defaultChecked
                      className="mb-3"
                    />
                    <Form.Check
                      type="switch"
                      id="course-updates"
                      label="Mises à jour des cours"
                      defaultChecked
                      className="mb-3"
                    />
                    <Form.Check
                      type="switch"
                      id="chat-notifications"
                      label="Notifications de chat"
                      defaultChecked
                      className="mb-3"
                    />

                    <Button variant="primary">Sauvegarder les préférences</Button>
                  </Form>
                </Tab>
              </Tabs>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default Profile
