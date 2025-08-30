"use client"

import { useState, useEffect } from "react"
import { Container, Row, Col, Card, Button, Badge, Tab, Tabs, Form, Modal, Table } from "react-bootstrap"
import { useSelector } from "react-redux"

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
        email: "j.dubois@NKEBI UNIV.cd",
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
        email: "m.martin@NKEBI UNIV.cd",
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
        email: "p.leroy@NKEBI UNIV.cd",
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
      <Container className="py-4">
        <div className="text-center">
          <i className="fas fa-lock fa-3x text-muted mb-3"></i>
          <h4>Accès Restreint</h4>
          <p className="text-muted">Vous n'avez pas les permissions pour accéder à cette section.</p>
        </div>
      </Container>
    )
  }

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <h2 className="text-primary">
              <i className="fas fa-users-cog me-2"></i>
              Ressources Humaines
            </h2>
            <Button variant="primary" onClick={() => setShowModal(true)}>
              <i className="fas fa-user-plus me-2"></i>
              Nouveau Personnel
            </Button>
          </div>
        </Col>
      </Row>

      {/* Statistiques RH */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center border-0 shadow-sm">
            <Card.Body>
              <h3 className="text-primary">{personnel.length}</h3>
              <p className="text-muted mb-0">Total Personnel</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-0 shadow-sm">
            <Card.Body>
              <h3 className="text-success">{personnel.filter((p) => p.statut === "Actif").length}</h3>
              <p className="text-muted mb-0">Personnel Actif</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-0 shadow-sm">
            <Card.Body>
              <h3 className="text-warning">{contrats.filter((c) => c.type === "CDI").length}</h3>
              <p className="text-muted mb-0">Contrats CDI</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="text-center border-0 shadow-sm">
            <Card.Body>
              <h3 className="text-info">${paies.reduce((total, p) => total + p.salaireNet, 0).toLocaleString()}</h3>
              <p className="text-muted mb-0">Masse Salariale</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Card className="border-0 shadow-sm">
        <Card.Body>
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

      {/* Modal Nouveau Personnel */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Ajouter un Nouveau Personnel</Modal.Title>
        </Modal.Header>
        <Modal.Body>
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
                  <Form.Control type="email" placeholder="email@NKEBI UNIV.cd" />
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
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Annuler
          </Button>
          <Button variant="primary">
            <i className="fas fa-save me-2"></i>
            Enregistrer
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  )
}

export default RH
