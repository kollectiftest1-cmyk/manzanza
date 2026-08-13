"use client"

import { useState, useEffect } from "react"
import { Container, Row, Col, Card, Button, Badge, Tab, Tabs, Form, Modal, Table, Nav } from "react-bootstrap"
import { useSelector } from "react-redux"
import { motion } from "framer-motion"
import { FiUsers, FiUserPlus, FiEye, FiEdit, FiTrash2, FiFileText, FiDollarSign, FiDownload, FiSave, FiLock, FiBriefcase } from "react-icons/fi"

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

const RH = () => {
  const { user } = useSelector((state) => state.auth)
  const [activeTab, setActiveTab] = useState("personnel")
  const [personnel, setPersonnel] = useState([])
  const [contrats, setContrats] = useState([])
  const [paies, setPaies] = useState([])
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    // Simulation des données RH
    setPersonnel([
      {
        id: 1,
        nom: "Dubois",
        prenom: "Jean",
        poste: "Professeur",
        departement: "Finance",
        statut: "Actif",
        dateEmbauche: "2020-09-01",
        salaire: 2500,
        email: "j.dubois@DASH.cd",
      },
      {
        id: 2,
        nom: "Martin",
        prenom: "Marie",
        poste: "Chef de Département",
        departement: "Comptabilité",
        statut: "Actif",
        dateEmbauche: "2018-01-15",
        salaire: 3200,
        email: "m.martin@DASH.cd",
      },
      {
        id: 3,
        nom: "Leroy",
        prenom: "Paul",
        poste: "Assistant",
        departement: "Économie",
        statut: "Actif",
        dateEmbauche: "2022-03-10",
        salaire: 1800,
        email: "p.leroy@DASH.cd",
      },
    ])

    setContrats([
      {
        id: 1,
        employe: "Jean Dubois",
        type: "CDI",
        dateDebut: "2020-09-01",
        dateFin: null,
        salaire: 2500,
        statut: "Actif",
      },
      {
        id: 2,
        employe: "Marie Martin",
        type: "CDI",
        dateDebut: "2018-01-15",
        dateFin: null,
        salaire: 3200,
        statut: "Actif",
      },
    ])

    setPaies([
      {
        id: 1,
        employe: "Jean Dubois",
        mois: "Janvier 2024",
        salaireBase: 2500,
        primes: 200,
        deductions: 150,
        salaireNet: 2550,
        statut: "Payé",
      },
      {
        id: 2,
        employe: "Marie Martin",
        mois: "Janvier 2024",
        salaireBase: 3200,
        primes: 300,
        deductions: 200,
        salaireNet: 3300,
        statut: "Payé",
      },
    ])
  }, [])

  const canAccessRH = user?.role === "RH" || user?.role === "Directeur" || user?.role === "PDG"

  if (!canAccessRH) {
    return (
      <Container fluid style={{ padding: '24px', background: 'var(--color-bodyBg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center' }}>
          <FiLock size={64} style={{ color: 'var(--color-textSecondary)', opacity: 0.3, marginBottom: '24px' }} />
          <h4 style={{ color: 'var(--color-text)', marginBottom: '12px' }}>Accès Restreint</h4>
          <p style={{ color: 'var(--color-textSecondary)', fontSize: '16px' }}>Vous n'avez pas les permissions pour accéder à cette section.</p>
        </motion.div>
      </Container>
    )
  }

  return (
    <Container fluid style={{ padding: '24px', background: 'var(--color-bodyBg)', minHeight: '100vh' }}>
      <motion.div 
        variants={containerVariants} 
        initial="hidden" 
        animate="visible"
      >
        {/* Header Section */}
        <motion.div variants={itemVariants} style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
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
                <FiUsers size={28} style={{ color: 'white' }} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '32px', fontWeight: '700', color: 'var(--color-text)' }}>
                  Ressources Humaines
                </h2>
                <p style={{ margin: 0, color: 'var(--color-textSecondary)', fontSize: '16px' }}>Gestion du personnel et des contrats</p>
              </div>
            </div>
            <Button 
              variant="primary" 
              onClick={() => setShowModal(true)}
              style={{ borderRadius: '8px', padding: '10px 24px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <FiUserPlus size={18} />
              Nouveau Personnel
            </Button>
          </div>
        </motion.div>

        {/* Statistiques RH */}
        <Row style={{ marginBottom: '32px' }}>
          <Col md={3} className="mb-3 mb-md-0">
            <motion.div variants={itemVariants}>
              <Card style={{
                textAlign: 'center',
                background: 'var(--color-cardBg)',
                border: '1px solid var(--color-border)',
                borderRadius: '16px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                transition: 'transform 0.2s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <Card.Body style={{ padding: '24px' }}>
                  <FiUsers size={32} style={{ color: 'var(--color-primary)', marginBottom: '12px' }} />
                  <h3 style={{ color: 'var(--color-primary)', fontSize: '32px', fontWeight: '700', margin: '8px 0' }}>{personnel.length}</h3>
                  <p style={{ color: 'var(--color-textSecondary)', margin: 0, fontSize: '14px' }}>Total Personnel</p>
                </Card.Body>
              </Card>
            </motion.div>
          </Col>
          <Col md={3} className="mb-3 mb-md-0">
            <motion.div variants={itemVariants}>
              <Card style={{
                textAlign: 'center',
                background: 'var(--color-cardBg)',
                border: '1px solid var(--color-border)',
                borderRadius: '16px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                transition: 'transform 0.2s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <Card.Body style={{ padding: '24px' }}>
                  <FiUsers size={32} style={{ color: '#28a745', marginBottom: '12px' }} />
                  <h3 style={{ color: '#28a745', fontSize: '32px', fontWeight: '700', margin: '8px 0' }}>{personnel.filter((p) => p.statut === "Actif").length}</h3>
                  <p style={{ color: 'var(--color-textSecondary)', margin: 0, fontSize: '14px' }}>Personnel Actif</p>
                </Card.Body>
              </Card>
            </motion.div>
          </Col>
          <Col md={3} className="mb-3 mb-md-0">
            <motion.div variants={itemVariants}>
              <Card style={{
                textAlign: 'center',
                background: 'var(--color-cardBg)',
                border: '1px solid var(--color-border)',
                borderRadius: '16px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                transition: 'transform 0.2s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <Card.Body style={{ padding: '24px' }}>
                  <FiFileText size={32} style={{ color: '#ffc107', marginBottom: '12px' }} />
                  <h3 style={{ color: '#ffc107', fontSize: '32px', fontWeight: '700', margin: '8px 0' }}>{contrats.filter((c) => c.type === "CDI").length}</h3>
                  <p style={{ color: 'var(--color-textSecondary)', margin: 0, fontSize: '14px' }}>Contrats CDI</p>
                </Card.Body>
              </Card>
            </motion.div>
          </Col>
          <Col md={3}>
            <motion.div variants={itemVariants}>
              <Card style={{
                textAlign: 'center',
                background: 'var(--color-cardBg)',
                border: '1px solid var(--color-border)',
                borderRadius: '16px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                transition: 'transform 0.2s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <Card.Body style={{ padding: '24px' }}>
                  <FiDollarSign size={32} style={{ color: '#17a2b8', marginBottom: '12px' }} />
                  <h3 style={{ color: '#17a2b8', fontSize: '32px', fontWeight: '700', margin: '8px 0' }}>${paies.reduce((total, p) => total + p.salaireNet, 0).toLocaleString()}</h3>
                  <p style={{ color: 'var(--color-textSecondary)', margin: 0, fontSize: '14px' }}>Masse Salariale</p>
                </Card.Body>
              </Card>
            </motion.div>
          </Col>
        </Row>

        <motion.div variants={itemVariants}>
          <Card style={{
            background: 'var(--color-cardBg)',
            border: '1px solid var(--color-border)',
            borderRadius: '16px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <Card.Body style={{ padding: '24px' }}>
          <Tabs activeKey={activeTab} onSelect={setActiveTab} className="mb-4">
            <Tab
              eventKey="personnel"
              title={
                <>
                  <i className="fas fa-users me-2"></i>Personnel
                </>
              }
            >
              <div className="table-responsive">
                <Table hover>
                  <thead className="table-primary">
                    <tr>
                      <th>Nom Complet</th>
                      <th>Poste</th>
                      <th>Département</th>
                      <th>Date d'Embauche</th>
                      <th>Salaire</th>
                      <th>Statut</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {personnel.map((emp) => (
                      <tr key={emp.id}>
                        <td>
                          <div>
                            <strong>
                              {emp.prenom} {emp.nom}
                            </strong>
                            <br />
                            <small className="text-muted">{emp.email}</small>
                          </div>
                        </td>
                        <td>{emp.poste}</td>
                        <td>{emp.departement}</td>
                        <td>{new Date(emp.dateEmbauche).toLocaleDateString()}</td>
                        <td>${emp.salaire.toLocaleString()}</td>
                        <td>
                          <Badge bg={emp.statut === "Actif" ? "success" : "secondary"}>{emp.statut}</Badge>
                        </td>
                        <td>
                          <Button variant="outline-primary" size="sm" className="me-1">
                            <i className="fas fa-eye"></i>
                          </Button>
                          <Button variant="outline-success" size="sm" className="me-1">
                            <i className="fas fa-edit"></i>
                          </Button>
                          <Button variant="outline-danger" size="sm">
                            <i className="fas fa-trash"></i>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Tab>

            <Tab
              eventKey="contrats"
              title={
                <>
                  <i className="fas fa-file-contract me-2"></i>Contrats
                </>
              }
            >
              <div className="table-responsive">
                <Table hover>
                  <thead className="table-primary">
                    <tr>
                      <th>Employé</th>
                      <th>Type de Contrat</th>
                      <th>Date de Début</th>
                      <th>Date de Fin</th>
                      <th>Salaire</th>
                      <th>Statut</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contrats.map((contrat) => (
                      <tr key={contrat.id}>
                        <td>{contrat.employe}</td>
                        <td>
                          <Badge bg={contrat.type === "CDI" ? "success" : "warning"}>{contrat.type}</Badge>
                        </td>
                        <td>{new Date(contrat.dateDebut).toLocaleDateString()}</td>
                        <td>{contrat.dateFin ? new Date(contrat.dateFin).toLocaleDateString() : "Indéterminée"}</td>
                        <td>${contrat.salaire.toLocaleString()}</td>
                        <td>
                          <Badge bg={contrat.statut === "Actif" ? "success" : "secondary"}>{contrat.statut}</Badge>
                        </td>
                        <td>
                          <Button variant="outline-primary" size="sm" className="me-1">
                            <i className="fas fa-download"></i>
                          </Button>
                          <Button variant="outline-success" size="sm">
                            <i className="fas fa-edit"></i>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Tab>

            <Tab
              eventKey="paies"
              title={
                <>
                  <i className="fas fa-money-check-alt me-2"></i>Paies
                </>
              }
            >
              <div className="mb-3">
                <Button variant="success" className="me-2">
                  <i className="fas fa-plus me-2"></i>
                  Générer Paie
                </Button>
                <Button variant="outline-primary">
                  <i className="fas fa-download me-2"></i>
                  Exporter
                </Button>
              </div>

              <div className="table-responsive">
                <Table hover>
                  <thead className="table-primary">
                    <tr>
                      <th>Employé</th>
                      <th>Période</th>
                      <th>Salaire de Base</th>
                      <th>Primes</th>
                      <th>Déductions</th>
                      <th>Salaire Net</th>
                      <th>Statut</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paies.map((paie) => (
                      <tr key={paie.id}>
                        <td>{paie.employe}</td>
                        <td>{paie.mois}</td>
                        <td>${paie.salaireBase.toLocaleString()}</td>
                        <td className="text-success">+${paie.primes}</td>
                        <td className="text-danger">-${paie.deductions}</td>
                        <td>
                          <strong>${paie.salaireNet.toLocaleString()}</strong>
                        </td>
                        <td>
                          <Badge bg={paie.statut === "Payé" ? "success" : "warning"}>{paie.statut}</Badge>
                        </td>
                        <td>
                          <Button variant="outline-primary" size="sm" className="me-1">
                            <i className="fas fa-eye"></i>
                          </Button>
                          <Button variant="outline-success" size="sm">
                            <i className="fas fa-download"></i>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </Tab>

            <Tab
              eventKey="conventions"
              title={
                <>
                  <i className="fas fa-handshake me-2"></i>Conventions
                </>
              }
            >
              <Row>
                <Col md={6}>
                  <Card className="border-0 shadow-sm mb-3">
                    <Card.Header className="bg-primary text-white">
                      <h6 className="mb-0">Convention Collective</h6>
                    </Card.Header>
                    <Card.Body>
                      <p>Convention collective de l'enseignement supérieur privé</p>
                      <div className="d-flex justify-content-between align-items-center">
                        <small className="text-muted">Dernière mise à jour: 01/01/2024</small>
                        <Button variant="outline-primary" size="sm">
                          <i className="fas fa-download me-1"></i>
                          Télécharger
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card className="border-0 shadow-sm mb-3">
                    <Card.Header className="bg-success text-white">
                      <h6 className="mb-0">Grille Salariale</h6>
                    </Card.Header>
                    <Card.Body>
                      <p>Grille des salaires par poste et ancienneté</p>
                      <div className="d-flex justify-content-between align-items-center">
                        <small className="text-muted">Version 2024</small>
                        <Button variant="outline-success" size="sm">
                          <i className="fas fa-eye me-1"></i>
                          Consulter
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Tab>
          </Tabs>
            </Card.Body>
          </Card>
        </motion.div>

        {/* Modal Nouveau Personnel */}
        <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
          <div style={{
            background: 'var(--color-cardBg)',
            borderRadius: '16px',
            border: '1px solid var(--color-border)',
            overflow: 'hidden'
          }}>
            <Modal.Header closeButton style={{
              background: 'linear-gradient(135deg, var(--color-primary), #667eea)',
              color: 'white',
              borderBottom: 'none',
              padding: '24px'
            }}>
              <Modal.Title style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '22px' }}>
                <FiUserPlus size={24} />
                Ajouter un Nouveau Personnel
              </Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ padding: '32px', background: 'var(--color-cardBg)' }}>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Prénom</Form.Label>
                  <Form.Control type="text" placeholder="Prénom" />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nom</Form.Label>
                  <Form.Control type="text" placeholder="Nom" />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Poste</Form.Label>
                  <Form.Select>
                    <option>Choisir un poste...</option>
                    <option>Professeur</option>
                    <option>Assistant</option>
                    <option>Chef de Département</option>
                    <option>Personnel Administratif</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Département</Form.Label>
                  <Form.Select>
                    <option>Choisir un département...</option>
                    <option>Finance</option>
                    <option>Comptabilité</option>
                    <option>Économie</option>
                    <option>Gestion</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control type="email" placeholder="email@DASH.cd" />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Salaire</Form.Label>
                  <Form.Control type="number" placeholder="Salaire en USD" />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Date d'Embauche</Form.Label>
              <Form.Control type="date" />
            </Form.Group>
          </Form>
            </Modal.Body>
            <Modal.Footer style={{ background: 'var(--color-cardBg)', borderTop: '1px solid var(--color-border)', padding: '20px' }}>
              <Button variant="secondary" onClick={() => setShowModal(false)} style={{ borderRadius: '8px', padding: '10px 24px' }}>
                Annuler
              </Button>
              <Button variant="primary" style={{ borderRadius: '8px', padding: '10px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FiSave size={18} />
                Enregistrer
              </Button>
            </Modal.Footer>
          </div>
        </Modal>
      </motion.div>
    </Container>
  )
}

export default RH
