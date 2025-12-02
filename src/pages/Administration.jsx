"use client"

import { useState, useEffect, useCallback } from "react"
import { Container, Row, Col, Card, Table, Button, Badge, Form, Modal, Alert, Spinner, Pagination, InputGroup } from "react-bootstrap"
import { useSelector } from "react-redux"
import { Link } from "react-router-dom"
import { getUsers, createUser, deleteUser } from "../services/userService"
import { getAuditoires } from "../services/auditoireService"
import { getSections } from "../services/sectionService"
import { getFilieres } from "../services/filiereService"
import debounce from "lodash.debounce"

const Administration = () => {
  const { user: currentUser } = useSelector((state) => state.auth)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Data and Filters
  const [users, setUsers] = useState({ results: [], count: 0, next: null, previous: null })
  const [auditoires, setAuditoires] = useState([])
  const [sections, setSections] = useState([])
  const [filieres, setFilieres] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState({ search: '', role: '' })

  // Modal and Form State
  const [showUserModal, setShowUserModal] = useState(false)
  const [newUser, setNewUser] = useState({ role: 'etudiant' })

  const fetchUsers = useCallback(debounce(async (page, currentFilters) => {
    setLoading(true)
    try {
      const params = { page, ...currentFilters }
      const usersRes = await getUsers(params)
      setUsers(usersRes.data)
    } catch (err) {
      setError("Erreur lors du chargement des utilisateurs.")
    } finally {
      setLoading(false)
    }
  }, 300), [])

  useEffect(() => {
    fetchUsers(currentPage, filters)
  }, [currentPage, filters, fetchUsers])

  useEffect(() => {
    // Fetch non-user data only once
    const fetchRelatedData = async () => {
      try {
        const [auditoiresRes, sectionsRes, filieresRes] = await Promise.all([
          getAuditoires(),
          getSections(),
          getFilieres(),
        ])
        setAuditoires(auditoiresRes.data.results || auditoiresRes.data)
        setSections(sectionsRes.data.results || sectionsRes.data)
        setFilieres(filieresRes.data.results || filieresRes.data)
      } catch (err) {
        setError("Erreur lors du chargement des données annexes.")
      }
    }
    fetchRelatedData()
  }, [])

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters(prev => ({ ...prev, [name]: value }))
    setCurrentPage(1) // Reset to first page on filter change
  }

  const handleCreateUser = async (e) => {
    e.preventDefault()
    try {
      await createUser(newUser)
      setShowUserModal(false)
      setNewUser({ role: 'etudiant' })
      fetchUsers(1, filters) // Refetch the first page
    } catch (err) {
      alert(`Erreur: ${err.response?.data?.detail || err.message || 'Impossible de créer l\'utilisateur.'}`)
    }
  }
  
  const handleDeleteUser = async (userId) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) {
      try {
        await deleteUser(userId)
        // Refetch the current page
        fetchUsers(currentPage, filters)
      } catch (err) {
        alert(`Erreur: ${err.message || 'Impossible de supprimer l\'utilisateur.'}`)
      }
    }
  }

  const renderAssignmentFields = () => {
    switch (newUser.role) {
      case 'etudiant':
        return <Form.Group className="mb-3"><Form.Label>Auditoire</Form.Label><Form.Select name="auditoire" onChange={handleFormChange}><option value="">Choisir...</option>{auditoires.map(a => <option key={a.id} value={a.id}>{a.nom}</option>)}</Form.Select></Form.Group>
      case 'chef_section':
        return <Form.Group className="mb-3"><Form.Label>Section</Form.Label><Form.Select name="section" onChange={handleFormChange}><option value="">Choisir...</option>{sections.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}</Form.Select></Form.Group>
      case 'chef_departement':
        return <Form.Group className="mb-3"><Form.Label>Filière (Département)</Form.Label><Form.Select name="filiere" onChange={handleFormChange}><option value="">Choisir...</option>{filieres.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}</Form.Select></Form.Group>
      default:
        return null
    }
  }

  const handleFormChange = (e) => {
    setNewUser({ ...newUser, [e.target.name]: e.target.value })
  }

  const totalPages = Math.ceil(users.count / 10)

  if (loading && users.results.length === 0) return <div className="text-center"><Spinner animation="border" /></div>
  if (error && users.results.length === 0) return <Alert variant="danger">{error}</Alert>

  return (
    <Container fluid className="mt-4">
      <Row className="mb-4">
        <Col>
          <Card>
            <Card.Header>
              <Row className="align-items-center">
                <Col md={4}>
                  <h5 className="mb-0">Gestion des Utilisateurs ({users.count})</h5>
                </Col>
                <Col md={8} className="d-flex justify-content-end align-items-center gap-2">
                  <InputGroup style={{ maxWidth: '300px' }}>
                    <InputGroup.Text><i className="fas fa-search"></i></InputGroup.Text>
                    <Form.Control
                      type="search"
                      name="search"
                      placeholder="Rechercher par nom, email..."
                      value={filters.search}
                      onChange={handleFilterChange}
                    />
                  </InputGroup>
                  <Form.Select name="role" value={filters.role} onChange={handleFilterChange} style={{ maxWidth: '200px' }}>
                    <option value="">Tous les rôles</option>
                    <option value="etudiant">Étudiant</option>
                    <option value="enseignant">Enseignant</option>
                    <option value="assistant">Assistant</option>
                    <option value="chef_departement">Chef de Département</option>
                    <option value="chef_section">Chef de Section</option>
                    <option value="sga">SGA</option>
                    <option value="iadmin">IAdmin</option>
                  </Form.Select>
                  <Button variant="primary" onClick={() => setShowUserModal(true)}>+ Nouvel Utilisateur</Button>
                </Col>
              </Row>
            </Card.Header>
            <Card.Body>
              {loading && <div className="text-center my-2"><Spinner animation="border" size="sm" /></div>}
              {error && !loading && <Alert variant="warning">{error}</Alert>}
              <Table responsive hover>
                <thead><tr><th>Nom</th><th>Email</th><th>Rôle</th><th>Affectation</th><th>Actions</th></tr></thead>
                <tbody>
                  {users.results.map((user) => (
                    <tr key={user.id}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td><Badge bg="info">{user.role_display}</Badge></td>
                      <td>
                        {user.auditoire_name && (
                          <div>
                            <span className="fw-bold">{user.auditoire_name}</span>
                            {user.filiere && user.section && (
                              <div className="text-muted small">
                                {user.section.nom} / {user.filiere.nom}
                              </div>
                            )}
                          </div>
                        )}
                        {!user.auditoire_name && (user.section?.nom || user.filiere?.nom || 'N/A')}
                      </td>
                      <td>
                        <Button as={Link} to={`/profile/${user.id}`} variant="outline-primary" size="sm" className="me-2">
                          <i className="fas fa-eye me-1"></i>Voir
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
            {totalPages > 1 && (
              <Card.Footer className="d-flex justify-content-center">
                <Pagination>
                  <Pagination.First onClick={() => setCurrentPage(1)} disabled={currentPage === 1} />
                  <Pagination.Prev onClick={() => setCurrentPage(p => p - 1)} disabled={!users.previous} />
                  {[...Array(totalPages).keys()].map(page => (
                    <Pagination.Item key={page + 1} active={page + 1 === currentPage} onClick={() => setCurrentPage(page + 1)}>
                      {page + 1}
                    </Pagination.Item>
                  ))}
                  <Pagination.Next onClick={() => setCurrentPage(p => p + 1)} disabled={!users.next} />
                  <Pagination.Last onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} />
                </Pagination>
              </Card.Footer>
            )}
          </Card>
        </Col>
      </Row>

      <Modal show={showUserModal} onHide={() => setShowUserModal(false)} size="lg">
        <Form onSubmit={handleCreateUser}>
          <Modal.Header closeButton><Modal.Title>Nouvel Utilisateur</Modal.Title></Modal.Header>
          <Modal.Body>
            <Row>
              <Col md={6}><Form.Group className="mb-3"><Form.Label>Prénom</Form.Label><Form.Control name="first_name" onChange={handleFormChange} required /></Form.Group></Col>
              <Col md={6}><Form.Group className="mb-3"><Form.Label>Nom</Form.Label><Form.Control name="last_name" onChange={handleFormChange} required /></Form.Group></Col>
            </Row>
            <Row>
              <Col md={6}><Form.Group className="mb-3"><Form.Label>Email</Form.Label><Form.Control type="email" name="email" onChange={handleFormChange} required /></Form.Group></Col>
              <Col md={6}><Form.Group className="mb-3"><Form.Label>Mot de passe</Form.Label><Form.Control type="password" name="password" onChange={handleFormChange} required /></Form.Group></Col>
            </Row>
            <Form.Group className="mb-3"><Form.Label>Rôle</Form.Label><Form.Select name="role" onChange={handleFormChange} required><option value="etudiant">Étudiant</option><option value="enseignant">Enseignant</option><option value="assistant">Assistant</option><option value="chef_departement">Chef de Département</option><option value="chef_section">Chef de Section</option><option value="bibliothecaire">Bibliothécaire</option><option value="sga">SGA</option></Form.Select></Form.Group>
            <hr />
            <h6 className="text-muted">Affectation (selon le rôle)</h6>
            {renderAssignmentFields()}
          </Modal.Body>
          <Modal.Footer><Button variant="secondary" onClick={() => setShowUserModal(false)}>Annuler</Button><Button type="submit" variant="primary">Créer</Button></Modal.Footer>
        </Form>
      </Modal>
    </Container>
  )
}

export default Administration
