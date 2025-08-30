"use client"

import { useState } from "react"
import { Container, Row, Col, Card, Table, Button, Badge, Form, Modal, Alert } from "react-bootstrap"
import { useSelector } from "react-redux"

const Administration = () => {
  const { user } = useSelector((state) => state.auth)
  const [showUserModal, setShowUserModal] = useState(false)
  const [showCourseModal, setShowCourseModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [users, setUsers] = useState([
    {
      id: 1,
      name: "Marie Kouassi",
      email: "marie.k@NKEBI UNIV.edu",
      role: "etudiant",
      status: "actif",
      promotion: "1ère Licence Finance",
    },
    {
      id: 2,
      name: "Jean Koffi",
      email: "jean.k@NKEBI UNIV.edu",
      role: "etudiant",
      status: "actif",
      promotion: "1ère Licence Finance",
    },
    {
      id: 3,
      name: "Prof. Martin Dubois",
      email: "martin.d@NKEBI UNIV.edu",
      role: "enseignant",
      status: "actif",
      departement: "Finance",
    },
    {
      id: 4,
      name: "Dr. Adjoua Yao",
      email: "adjoua.y@NKEBI UNIV.edu",
      role: "chef_departement",
      status: "actif",
      departement: "Finance",
    },
  ])

  const [courses, setCourses] = useState([
    {
      id: 1,
      name: "Comptabilité Générale",
      code: "COMP101",
      credits: 4,
      enseignant: "Prof. Martin Dubois",
      etudiants: 45,
    },
    { id: 2, name: "Économie", code: "ECO101", credits: 3, enseignant: "Dr. Sarah Bamba", etudiants: 38 },
    {
      id: 3,
      name: "Mathématiques Financières",
      code: "MATH201",
      credits: 5,
      enseignant: "Prof. Koné Amadou",
      etudiants: 32,
    },
  ])

  const handleEditUser = (user) => {
    setSelectedUser(user)
    setShowUserModal(true)
  }

  const handleDeleteUser = (userId) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) {
      setUsers(users.filter((u) => u.id !== userId))
    }
  }

  const getRoleBadge = (role) => {
    const roleConfig = {
      etudiant: { variant: "primary", text: "Étudiant" },
      enseignant: { variant: "success", text: "Enseignant" },
      chef_departement: { variant: "warning", text: "Chef Dép." },
      admin: { variant: "danger", text: "Admin" },
    }
    const config = roleConfig[role] || { variant: "secondary", text: "Utilisateur" }
    return <Badge bg={config.variant}>{config.text}</Badge>
  }

  const getStatusBadge = (status) => {
    return <Badge bg={status === "actif" ? "success" : "danger"}>{status}</Badge>
  }

  if (user?.role !== "admin" && user?.role !== "chef_departement") {
    return (
      <Container className="mt-4">
        <Alert variant="danger">
          <h4>Accès Refusé</h4>
          <p>Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
        </Alert>
      </Container>
    )
  }

  return (
    <Container fluid className="mt-4">
      <Row className="mb-4">
        <Col>
          <h2>Administration</h2>
          <p className="text-muted">Gestion des utilisateurs, cours et paramètres système</p>
        </Col>
      </Row>

      {/* Statistics Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="shadow text-center">
            <Card.Body>
              <h3 className="text-primary">{users.filter((u) => u.role === "etudiant").length}</h3>
              <p className="mb-0">Étudiants</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="shadow text-center">
            <Card.Body>
              <h3 className="text-success">{users.filter((u) => u.role === "enseignant").length}</h3>
              <p className="mb-0">Enseignants</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="shadow text-center">
            <Card.Body>
              <h3 className="text-info">{courses.length}</h3>
              <p className="mb-0">Cours</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="shadow text-center">
            <Card.Body>
              <h3 className="text-warning">5</h3>
              <p className="mb-0">Auditoires</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Users Management */}
      <Row className="mb-4">
        <Col>
          <Card className="shadow">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Gestion des Utilisateurs</h5>
              <Button variant="primary" onClick={() => setShowUserModal(true)}>
                + Nouvel Utilisateur
              </Button>
            </Card.Header>
            <Card.Body>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Nom</th>
                    <th>Email</th>
                    <th>Rôle</th>
                    <th>Statut</th>
                    <th>Promotion/Département</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>{getRoleBadge(user.role)}</td>
                      <td>{getStatusBadge(user.status)}</td>
                      <td>{user.promotion || user.departement}</td>
                      <td>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="me-2"
                          onClick={() => handleEditUser(user)}
                        >
                          Modifier
                        </Button>
                        <Button variant="outline-danger" size="sm" onClick={() => handleDeleteUser(user.id)}>
                          Supprimer
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Courses Management */}
      <Row>
        <Col>
          <Card className="shadow">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Gestion des Cours</h5>
              <Button variant="success" onClick={() => setShowCourseModal(true)}>
                + Nouveau Cours
              </Button>
            </Card.Header>
            <Card.Body>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Nom du Cours</th>
                    <th>Crédits</th>
                    <th>Enseignant</th>
                    <th>Étudiants</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((course) => (
                    <tr key={course.id}>
                      <td>
                        <Badge bg="info">{course.code}</Badge>
                      </td>
                      <td>{course.name}</td>
                      <td>{course.credits}</td>
                      <td>{course.enseignant}</td>
                      <td>
                        <Badge bg="primary">{course.etudiants}</Badge>
                      </td>
                      <td>
                        <Button variant="outline-primary" size="sm" className="me-2">
                          Modifier
                        </Button>
                        <Button variant="outline-danger" size="sm">
                          Supprimer
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* User Modal */}
      <Modal show={showUserModal} onHide={() => setShowUserModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{selectedUser ? "Modifier Utilisateur" : "Nouvel Utilisateur"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nom Complet</Form.Label>
                  <Form.Control type="text" defaultValue={selectedUser?.name} />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control type="email" defaultValue={selectedUser?.email} />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Rôle</Form.Label>
                  <Form.Select defaultValue={selectedUser?.role}>
                    <option value="etudiant">Étudiant</option>
                    <option value="enseignant">Enseignant</option>
                    <option value="chef_departement">Chef de Département</option>
                    <option value="admin">Administrateur</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Statut</Form.Label>
                  <Form.Select defaultValue={selectedUser?.status}>
                    <option value="actif">Actif</option>
                    <option value="inactif">Inactif</option>
                    <option value="suspendu">Suspendu</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowUserModal(false)}>
            Annuler
          </Button>
          <Button variant="primary">{selectedUser ? "Mettre à jour" : "Créer"}</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  )
}

export default Administration
