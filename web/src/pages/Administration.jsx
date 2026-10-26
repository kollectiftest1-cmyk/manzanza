"use client"

import { useState, useEffect, useCallback } from "react"
import { Container, Row, Col, Card, Table, Button, Badge, Form, Modal, Alert, Spinner, Pagination, InputGroup } from "react-bootstrap"
import { useSelector } from "react-redux"
import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import { FiUsers, FiUserPlus, FiSearch, FiEye, FiTrash2, FiShield, FiFilter } from "react-icons/fi"
import { getUsers, createUser, deleteUser } from "../services/userService"
import { getAuditoires } from "../services/auditoireService"
import { getSections } from "../services/sectionService"
import { getFilieres } from "../services/filiereService"
import debounce from "lodash.debounce"
import { notifyError } from "../utils/notify"

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

const ROLE_OPTIONS = [
  { value: 'etudiant', label: 'Etudiant' },
  { value: 'enseignant', label: 'Enseignant' },
  { value: 'assistant', label: 'Assistant' },
  { value: 'chef_departement', label: 'Chef de Departement' },
  { value: 'chef_section', label: 'Chef de Section' },
  { value: 'sga', label: 'SGA' },
  { value: 'sgad', label: 'SGAD' },
  { value: 'bibliothecaire', label: 'Bibliothecaire' },
  { value: 'apparitorat', label: 'Apparitorat' },
  { value: 'caisse', label: 'Caisse' },
  { value: 'service_it', label: 'Service IT' },
  { value: 'jury', label: 'Jury' },
  { value: 'directeur_general', label: 'Directeur General' },
  { value: 'comptable', label: 'Comptable' },
  { value: 'pdg', label: 'PDG (administrateur général)' },
]

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
      notifyError(err, "Erreur lors du chargement des utilisateurs.")
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
        notifyError(err, "Erreur lors du chargement des données annexes.")
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
      notifyError(err, `Erreur: ${err.response?.data?.detail || err.message || 'Impossible de créer l\'utilisateur.'}`)
    }
  }
  
  const handleDeleteUser = async (userId) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) {
      try {
        await deleteUser(userId)
        // Refetch the current page
        fetchUsers(currentPage, filters)
      } catch (err) {
        notifyError(err, `Erreur: ${err.message || 'Impossible de supprimer l\'utilisateur.'}`)
      }
    }
  }

  const renderAssignmentFields = () => {
    switch (newUser.role) {
      case 'etudiant':
        return <Form.Group className="mb-3"><Form.Label>Auditoire</Form.Label><Form.Select name="auditoire_id" onChange={handleFormChange}><option value="">Choisir...</option>{auditoires.map(a => <option key={a.id} value={a.id}>{a.nom}</option>)}</Form.Select></Form.Group>
      case 'chef_section':
        return <Form.Group className="mb-3"><Form.Label>Section</Form.Label><Form.Select name="section_id" onChange={handleFormChange}><option value="">Choisir...</option>{sections.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}</Form.Select></Form.Group>
      case 'chef_departement':
        return <Form.Group className="mb-3"><Form.Label>Filière (Département)</Form.Label><Form.Select name="filiere_id" onChange={handleFormChange} required><option value="">Choisir...</option>{filieres.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}</Form.Select></Form.Group>
      case 'enseignant':
      case 'assistant':
        return (
          <Alert variant="info" style={{ borderRadius: '12px' }}>
            <i className="fas fa-info-circle me-2"></i>
            Les cours seront assignés après la création via le bouton "Assigner un cours"
          </Alert>
        )
      default:
        return null
    }
  }

  const handleFormChange = (e) => {
    setNewUser({ ...newUser, [e.target.name]: e.target.value })
  }

  const totalPages = Math.ceil(users.count / 10)

  if (loading && users.results.length === 0) return (
    <Container fluid style={{ padding: '24px', background: 'var(--color-bodyBg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <Spinner animation="border" style={{ color: 'var(--color-primary)', width: '3rem', height: '3rem' }} />
        <p style={{ marginTop: '16px', color: 'var(--color-textSecondary)', fontSize: '16px' }}>Chargement...</p>
      </div>
    </Container>
  )
  
  if (error && users.results.length === 0) return (
    <Container fluid style={{ padding: '24px', background: 'var(--color-bodyBg)', minHeight: '100vh' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Alert variant="danger" style={{ maxWidth: '800px', margin: '40px auto', borderRadius: '12px' }}>{error}</Alert>
      </motion.div>
    </Container>
  )

  return (
    <Container fluid style={{ padding: '24px', background: 'var(--color-bodyBg)', minHeight: '100vh' }}>
      <motion.div 
        variants={containerVariants} 
        initial="hidden" 
        animate="visible"
      >
        {/* Header Section */}
        <motion.div variants={itemVariants} style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #f093fb, #f5576c)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
            }}>
              <FiShield size={28} style={{ color: 'white' }} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '32px', fontWeight: '700', color: 'var(--color-text)' }}>
                Administration
              </h2>
              <p style={{ margin: 0, color: 'var(--color-textSecondary)', fontSize: '16px' }}>
                Gestion complète des utilisateurs du système
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card style={{ 
            background: 'var(--color-cardBg)', 
            border: '1px solid var(--color-border)', 
            borderRadius: '16px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <Card.Header style={{ 
              background: 'linear-gradient(135deg, #f093fb, #f5576c)',
              color: 'white',
              padding: '24px',
              borderBottom: 'none',
              borderTopLeftRadius: '16px',
              borderTopRightRadius: '16px'
            }}>
              <Row className="align-items-center">
                <Col md={4}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <FiUsers size={24} />
                    <div>
                      <h5 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>Utilisateurs</h5>
                      <Badge bg="light" text="dark" style={{ marginTop: '4px', fontSize: '14px', padding: '4px 12px', borderRadius: '6px' }}>
                        {users.count} au total
                      </Badge>
                    </div>
                  </div>
                </Col>
                <Col md={8} className="d-flex justify-content-end align-items-center gap-2">
                  <InputGroup style={{ maxWidth: '300px' }}>
                    <InputGroup.Text style={{ background: 'white', border: '1px solid #dee2e6' }}>
                      <FiSearch size={18} style={{ color: 'var(--color-textSecondary)' }} />
                    </InputGroup.Text>
                    <Form.Control
                      type="search"
                      name="search"
                      placeholder="Rechercher..."
                      value={filters.search}
                      onChange={handleFilterChange}
                      style={{ borderRadius: '0 8px 8px 0' }}
                    />
                  </InputGroup>
                  <Form.Select 
                    name="role" 
                    value={filters.role} 
                    onChange={handleFilterChange} 
                    style={{ maxWidth: '200px', borderRadius: '8px' }}
                  >
                    <option value="">Tous les rôles</option>
                    <option value="etudiant">Étudiant</option>
                    <option value="enseignant">Enseignant</option>
                    <option value="assistant">Assistant</option>
                    <option value="chef_departement">Chef de Département</option>
                    <option value="chef_section">Chef de Section</option>
                    <option value="sga">SGA</option>
                    <option value="sgad">SGAD</option>
                    <option value="bibliothecaire">Bibliothecaire</option>
                    <option value="apparitorat">Apparitorat</option>
                    <option value="caisse">Caisse</option>
                    <option value="comptable">Comptable</option>
                    <option value="service_it">Service IT</option>
                    <option value="jury">Jury</option>
                    <option value="directeur_general">Directeur General</option>
                    <option value="pdg">PDG</option>
                  </Form.Select>
                  <Button 
                    variant="light" 
                    onClick={() => setShowUserModal(true)}
                    style={{ 
                      borderRadius: '8px', 
                      padding: '10px 20px',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <FiUserPlus size={18} />
                    Nouvel Utilisateur
                  </Button>
                </Col>
              </Row>
            </Card.Header>
            <Card.Body style={{ padding: '24px' }}>
              {loading && <div style={{ textAlign: 'center', padding: '20px' }}><Spinner animation="border" style={{ color: 'var(--color-primary)' }} /></div>}
              {error && !loading && <Alert variant="warning" style={{ borderRadius: '12px' }}>{error}</Alert>}
              <div style={{ overflowX: 'auto', borderRadius: '12px' }}>
                <Table responsive hover style={{
                  marginBottom: 0,
                  border: '1px solid var(--color-border)',
                  borderRadius: '12px',
                  overflow: 'hidden'
                }}>
                  <thead style={{ background: 'var(--color-bodyBg)' }}>
                    <tr>
                      <th style={{ padding: '16px', color: 'var(--color-text)', fontWeight: '600', borderBottom: '2px solid var(--color-border)' }}>Nom</th>
                      <th style={{ padding: '16px', color: 'var(--color-text)', fontWeight: '600', borderBottom: '2px solid var(--color-border)' }}>Email</th>
                      <th style={{ padding: '16px', color: 'var(--color-text)', fontWeight: '600', borderBottom: '2px solid var(--color-border)' }}>Rôle</th>
                      <th style={{ padding: '16px', color: 'var(--color-text)', fontWeight: '600', borderBottom: '2px solid var(--color-border)' }}>Affectation</th>
                      <th style={{ padding: '16px', color: 'var(--color-text)', fontWeight: '600', borderBottom: '2px solid var(--color-border)' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.results.map((user, index) => (
                      <motion.tr 
                        key={user.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        style={{ 
                          background: index % 2 === 0 ? 'var(--color-cardBg)' : 'var(--color-bodyBg)',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <td style={{ padding: '16px', color: 'var(--color-text)', fontWeight: '500', borderBottom: '1px solid var(--color-border)' }}>{user.name}</td>
                        <td style={{ padding: '16px', color: 'var(--color-textSecondary)', borderBottom: '1px solid var(--color-border)' }}>{user.email}</td>
                        <td style={{ padding: '16px', borderBottom: '1px solid var(--color-border)' }}>
                          <Badge bg="info" style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '13px' }}>{user.role_display}</Badge>
                        </td>
                        <td style={{ padding: '16px', color: 'var(--color-textSecondary)', borderBottom: '1px solid var(--color-border)' }}>
                          {user.auditoire_name && (
                            <div>
                              <span style={{ fontWeight: '600', color: 'var(--color-text)' }}>{user.auditoire_name}</span>
                              {user.filiere && user.section && (
                                <div style={{ fontSize: '13px', color: 'var(--color-textSecondary)', marginTop: '4px' }}>
                                  {user.section.nom} / {user.filiere.nom}
                                </div>
                              )}
                            </div>
                          )}
                          {!user.auditoire_name && (user.section?.nom || user.filiere?.nom || 'N/A')}
                        </td>
                        <td style={{ padding: '16px', borderBottom: '1px solid var(--color-border)' }}>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <Button 
                              as={Link} 
                              to={`/profile/${user.id}`} 
                              variant="outline-primary" 
                              size="sm" 
                              style={{ borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}
                            >
                              <FiEye size={14} />Voir
                            </Button>
                            <Button 
                              variant="outline-danger" 
                              size="sm" 
                              onClick={() => handleDeleteUser(user.id)}
                              style={{ borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}
                            >
                              <FiTrash2 size={14} />Supprimer
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
            {totalPages > 1 && (
              <Card.Footer style={{ background: 'var(--color-cardBg)', borderTop: '1px solid var(--color-border)', padding: '20px' }}>
                <div className="d-flex justify-content-center">
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
                </div>
              </Card.Footer>
            )}
          </Card>
        </motion.div>
      </motion.div>

      <Modal show={showUserModal} onHide={() => setShowUserModal(false)} size="lg" centered>
        <div style={{
          background: 'var(--color-cardBg)',
          borderRadius: '16px',
          border: '1px solid var(--color-border)',
          overflow: 'hidden'
        }}>
          <Form onSubmit={handleCreateUser}>
            <Modal.Header closeButton style={{ 
              background: 'linear-gradient(135deg, var(--color-primary), #667eea)',
              color: 'white',
              borderBottom: 'none',
              padding: '24px'
            }}>
              <Modal.Title style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '22px' }}>
                <FiUserPlus size={24} />
                Nouvel Utilisateur
              </Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ padding: '32px', background: 'var(--color-cardBg)' }}>
            <Row>
              <Col md={6}><Form.Group className="mb-3"><Form.Label>Prénom</Form.Label><Form.Control name="first_name" onChange={handleFormChange} required /></Form.Group></Col>
              <Col md={6}><Form.Group className="mb-3"><Form.Label>Nom</Form.Label><Form.Control name="last_name" onChange={handleFormChange} required /></Form.Group></Col>
            </Row>
            <Row>
              <Col md={6}><Form.Group className="mb-3"><Form.Label>Email</Form.Label><Form.Control type="email" name="email" onChange={handleFormChange} required /></Form.Group></Col>
              <Col md={6}><Form.Group className="mb-3"><Form.Label>Mot de passe</Form.Label><Form.Control type="password" name="password" onChange={handleFormChange} required /></Form.Group></Col>
            </Row>
            <Form.Group className="mb-3"><Form.Label>Rôle</Form.Label><Form.Select name="role" onChange={handleFormChange} required><option value="etudiant">Étudiant</option><option value="enseignant">Enseignant</option><option value="assistant">Assistant</option><option value="chef_departement">Chef de Département</option><option value="chef_section">Chef de Section</option><option value="bibliothecaire">Bibliothécaire</option><option value="sga">SGA</option></Form.Select></Form.Group>
            <Form.Group className="mb-3"><Form.Label>Role systeme</Form.Label><Form.Select name="role" value={newUser.role || 'etudiant'} onChange={handleFormChange} required>{ROLE_OPTIONS.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}</Form.Select></Form.Group>
            <hr style={{ margin: '24px 0', border: 'none', borderTop: '1px solid var(--color-border)' }} />
            <h6 style={{ color: 'var(--color-textSecondary)', marginBottom: '16px', fontSize: '16px' }}>Affectation (selon le rôle)</h6>
            {renderAssignmentFields()}
            </Modal.Body>
            <Modal.Footer style={{ background: 'var(--color-cardBg)', borderTop: '1px solid var(--color-border)', padding: '20px' }}>
              <Button variant="secondary" onClick={() => setShowUserModal(false)} style={{ borderRadius: '8px', padding: '10px 24px' }}>Annuler</Button>
              <Button type="submit" variant="primary" style={{ borderRadius: '8px', padding: '10px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FiUserPlus size={18} />
                Créer
              </Button>
            </Modal.Footer>
          </Form>
        </div>
      </Modal>
    </Container>
  )
}

export default Administration
