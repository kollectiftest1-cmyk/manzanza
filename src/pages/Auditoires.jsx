"use client"

import { useState, useEffect } from "react"
import { Container, Row, Col, Card, Button, Badge, Form, Modal, Spinner, Alert, Nav, Table } from "react-bootstrap"
import { useSelector, useDispatch } from "react-redux"
import { Link } from "react-router-dom"
import { fetchAuditoires, createAuditoire } from "../store/slices/auditoiresSlice"
import { getSections, createSection, updateSection, deleteSection } from "../services/sectionService"
import { getFilieres, createFiliere, updateFiliere, deleteFiliere } from "../services/filiereService"
import { getUsers } from "../services/userService"

const Auditoires = () => {
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)
  const { auditoires, loading: auditoiresLoading, error: auditoiresError } = useSelector((state) => state.auditoires)

  // General State
  const [view, setView] = useState('auditoires')
  const [loading, setLoading] = useState(true)

  // Data State
  const [sections, setSections] = useState([])
  const [allFilieres, setAllFilieres] = useState([])
  const [filteredFilieres, setFilteredFilieres] = useState([])
  const [chefsDeSection, setChefsDeSection] = useState([])
  const [chefsDeDepartement, setChefsDeDepartement] = useState([])

  // Modal & Form State
  const [showAuditoireModal, setShowAuditoireModal] = useState(false)
  const [newAuditoire, setNewAuditoire] = useState({ nom: "", niveau: "", vacation: "jour", section: "", filiere: "", description: "" })
  
  const [showSectionModal, setShowSectionModal] = useState(false)
  const [currentSection, setCurrentSection] = useState(null)

  const [showFiliereModal, setShowFiliereModal] = useState(false)
  const [currentFiliere, setCurrentFiliere] = useState(null)

  // Permission checks
  const canManageSection = ['sga', 'iadmin'].includes(user?.role)
  const canManageFiliere = ['sga', 'iadmin','chef_section'].includes(user?.role)
  const canManageAuditoir = ['sga', 'iadmin','chef_section',"chef_departement"].includes(user?.role)
  const isSectionRole = ['chef_section'].includes(user?.role)
  const isDepartementRole = ['chef_departement'].includes(user?.role)
  // More granular permission checks for fetching user lists
  const canFetchChefSection = ['sga', 'iadmin','chef_section'].includes(user?.role)
  const canFetchChefDepartement = ['sga', 'iadmin','chef_section'].includes(user?.role)

  // Initial Data Fetch
  useEffect(() => {
    console.log("Auditoires useEffect triggered. User Role:", user?.role);
    console.log("Permissions: canManageSection:", canManageSection, "canManageFiliere:", canManageFiliere, "canManageAuditoir:", canManageAuditoir, "canFetchChefSection:", canFetchChefSection, "canFetchChefDepartement:", canFetchChefDepartement);

    const loadData = async () => {
      setLoading(true)
      const promises = []

      promises.push(dispatch(fetchAuditoires()))

      // Always try to fetch filieres as they are needed for auditoire creation by chef_section
      promises.push(getFilieres().then(res => setAllFilieres(res.data.results || res.data)).catch(err => {
        if (err.response && err.response.status === 403 && user?.role === 'chef_section') {
          console.warn("Chef de section is forbidden from fetching filieres. This might impact functionality.", err);
          setAllFilieres([]); // Clear filieres if forbidden
          return Promise.resolve([]); // Resolve the promise to prevent Promise.all from rejecting
        } else {
          throw err; // Re-throw other errors
        }
      }));

      if (canManageFiliere || canManageAuditoir) {
        promises.push(getSections().then(res => setSections(res.data.results || res.data)).catch(err => {
          if (err.response && err.response.status === 403 && user?.role === 'chef_section') {
            console.warn("Chef de section is forbidden from fetching sections. This might impact functionality.", err);
            setSections([]); // Clear sections if forbidden
            return Promise.resolve([]); // Resolve the promise to prevent Promise.all from rejecting
          } else {
            throw err; // Re-throw other errors
          }
        }));
      }

      // Fetch chef_section users only if the current user can assign chef_section (sga, iadmin)
      if (canFetchChefSection) {
        promises.push(getUsers({ role: 'chef_section' }).then(res => setChefsDeSection(res.data.results || res.data)).catch(err => {
          if (err.response && err.response.status === 403) {
            console.warn("Forbidden to fetch chef_section users.", err);
            setChefsDeSection([]);
            return Promise.resolve([]); // Resolve the promise to prevent Promise.all from rejecting
          } else {
            throw err;
          }
        }));
      }
      // Fetch chef_departement users only if the current user can assign chef_filiere (sga, iadmin)
      if (canFetchChefDepartement) {
        promises.push(getUsers({ role: 'chef_departement' }).then(res => setChefsDeDepartement(res.data.results || res.data)).catch(err => {
          if (err.response && err.response.status === 403) {
            console.warn("Forbidden to fetch chef_departement users.", err);
            setChefsDeDepartement([]);
            return Promise.resolve([]); // Resolve the promise to prevent Promise.all from rejecting
          } else {
            throw err;
          }
        }));
      }
      
      try {
        await Promise.all(promises)
      } catch (error) {
        console.error("Error loading academic data:", error);
        // Optionally, set an error state to display to the user
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [dispatch, user?.role, canManageSection, canManageFiliere, canManageAuditoir, canFetchChefSection, canFetchChefDepartement])

  // Filter filieres when a section is selected in the auditoire modal
  useEffect(() => {
    if (newAuditoire.section) {
      setFilteredFilieres(allFilieres.filter(f => f.section == newAuditoire.section))
    } else {
      setFilteredFilieres([])
    }
  }, [newAuditoire.section, allFilieres])

  // Input Handlers
  const handleAuditoireChange = (e) => {
    const { name, value } = e.target
    setNewAuditoire(prev => {
      const updated = { ...prev, [name]: value }
      if (name === 'section') {
        updated.filiere = ''
      }
      return updated
    })
  }

  // Modal Close Handlers
  const handleCloseAuditoireModal = () => {
    setShowAuditoireModal(false)
    setNewAuditoire({ nom: "", niveau: "", vacation: "jour", section: "", filiere: "", description: "" })
  }
  const handleCloseSectionModal = () => { setShowSectionModal(false); setCurrentSection(null) }
  const handleCloseFiliereModal = () => { setShowFiliereModal(false); setCurrentFiliere(null) }

  // CRUD Submit Handlers
  const handleAuditoireSubmit = async (e) => {
    e.preventDefault()
    if (!newAuditoire.nom || !newAuditoire.niveau || !newAuditoire.vacation || !newAuditoire.filiere) {
      alert("Veuillez remplir tous les champs obligatoires (Nom, Niveau, Vacation, Filière).")
      return
    }
    
    const auditoireData = {
      nom: newAuditoire.nom,
      niveau: newAuditoire.niveau,
      vacation: newAuditoire.vacation,
      filiere: parseInt(newAuditoire.filiere, 10),
      description: newAuditoire.description,
    };

    try {
      await dispatch(createAuditoire(auditoireData)).unwrap()
      handleCloseAuditoireModal()
    } catch (err) {
      if (err.status === 201)
      {
        handleCloseAuditoireModal()
        return
      }
      const errorDetail = err.detail || (err.response && err.response.data);
      let errorMessage = 'Une erreur est survenue. Vérifiez les champs.';
      if (typeof errorDetail === 'object' && errorDetail !== null) {
        const firstErrorKey = Object.keys(errorDetail)[0];
        errorMessage = `${firstErrorKey}: ${errorDetail[firstErrorKey]}`;
      } else if (typeof errorDetail === 'string') {
        errorMessage = errorDetail;
      }
      alert(`Erreur: ${errorMessage}`)
    }
  }

  const handleSectionSubmit = async (e) => {
    e.preventDefault()
    const data = { nom: e.target.nom.value, chef_section: e.target.chef_section.value || null }
    try {
      if (currentSection) {
        const res = await updateSection(currentSection.id, data)
        setSections(sections.map(s => s.id === res.data.id ? res.data : s))
      } else {
        const res = await createSection({ nom: data.nom })
        setSections([...sections, res.data])
      }
      handleCloseSectionModal()
    } catch (err) {
      console.error("Erreur lors de la sauvegarde de la section :", err.response?.data || err.message);
      alert(`Erreur: ${err.response?.data?.detail || err.message || 'Impossible de sauvegarder la section.'}`)
    }
  }

  const handleFiliereSubmit = async (e) => {
    e.preventDefault()
    const data = { nom: e.target.nom.value, section: e.target.section.value, chef_filiere: e.target.chef_filiere.value || null }
    try {
      if (currentFiliere && currentFiliere.id) { // Check if currentFiliere has an ID to determine if it's an update
        const res = await updateFiliere(currentFiliere.id, data)
        setAllFilieres(allFilieres.map(f => f.id === res.data.id ? res.data : f))
      } else {
        const res = await createFiliere(data)
        setAllFilieres([...allFilieres, res.data])
      }
      handleCloseFiliereModal()
    } catch (err) {
      alert(`Erreur: ${err.message || 'Impossible de sauvegarder la filière.'}`)
    }
  }

  const handleDelete = async (type, id) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet élément ?")) return
    try {
      if (type === 'section') {
        await deleteSection(id); setSections(sections.filter(s => s.id !== id))
      } else if (type === 'filiere') {
        await deleteFiliere(id); setAllFilieres(allFilieres.filter(f => f.id !== id))
      }
    } catch (err) {
      alert(`Erreur de suppression: ${err.message}`)
    }
  }

  // Function to open Filiere modal, pre-selecting section for chef_section
  const handleOpenCreateFiliereModal = () => {
    let initialFiliereState = null;
    if (user?.role === "chef_section" && user?.section_id) {
      initialFiliereState = { section: user.section_id };
    }
    setCurrentFiliere(initialFiliereState);
    setShowFiliereModal(true);
  };

  console.log(auditoires);
  

  return (
    <Container fluid className="py-0">
      <Row className="mb-4 dashboard-card">
        <Col>
          <h2 className="text-primary"><i className="fas fa-sitemap me-2"></i>Gestion Académique</h2>
          <Nav variant="tabs" activeKey={view} onSelect={(k) => setView(k)}>
            <Nav.Item><Nav.Link eventKey="auditoires">Auditoires</Nav.Link></Nav.Item>
            {canManageSection && <Nav.Item><Nav.Link eventKey="sections">Gérer les Sections</Nav.Link></Nav.Item>}
            {canManageFiliere && <Nav.Item><Nav.Link eventKey="filieres">Gérer les Filières</Nav.Link></Nav.Item>}
          </Nav>
        </Col>
      </Row>

      {loading && <div className="text-center"><Spinner animation="border" variant="primary" /></div>}

      {view === 'auditoires' && (
        <>
          {canManageAuditoir && <Button variant="primary" onClick={() => setShowAuditoireModal(true)} className="mb-3 shadow-sm"><i className="fas fa-plus me-2"></i>Créer un Auditoire</Button>}
          <Row>
            {!isDepartementRole && !isSectionRole && (auditoires?.results || auditoires || []).map((auditoire) => (
              <Col md={6} lg={4} key={auditoire.id} className="mb-4">
                <Card className="h-100 shadow-sm border-0 hover-card">
                  <Card.Body>
                    <h5 className="text-primary">{auditoire.nom}</h5>
                    <div>
                      <Badge bg="info" className="me-2">{auditoire.niveau}</Badge>
                      <Badge bg="warning" className="me-2 text-capitalize">{auditoire.vacation_display}</Badge>
                      <Badge bg="secondary" className="me-2">{auditoire.section_name}</Badge>
                      <Badge bg="success">{auditoire.filiere_name}</Badge>
                    </div>
                  </Card.Body>
                  <Card.Footer className="bg-light"><Link to={`/auditoires/${auditoire.id}`} className="btn btn-outline-primary w-100">Voir Détails</Link></Card.Footer>
                </Card>
              </Col>
            ))}
{(isDepartementRole || isSectionRole) && (
  (auditoires?.results || auditoires || [])
    .filter(aud => {

      // Si user = rôle département → filtrer par departement
      if (isDepartementRole) {
        return aud.filiere === user.filiere;
      }

      // Si user = rôle section → filtrer par section
      if (isSectionRole) {
        return aud.section_id === user.section_id;
      }

      return false;
    })
    .map((auditoire) => (
      <Col md={6} lg={4} key={auditoire.id} className="mb-4">
        <Card className="h-100 shadow-sm border-0 hover-card">
          <Card.Body>
            <h5 className="text-primary">{auditoire.nom}</h5>
            <div>
              <Badge bg="info" className="me-2">{auditoire.niveau}</Badge>
              <Badge bg="warning" className="me-2 text-capitalize">{auditoire.vacation_display}</Badge>
              <Badge bg="secondary" className="me-2">{auditoire.section_name}</Badge>
              <Badge bg="success">{auditoire.filiere_name}</Badge>
            </div>
          </Card.Body>

          <Card.Footer className="bg-light">
            <Link
              to={`/auditoires/${auditoire.id}`}
              className="btn btn-outline-primary w-100"
            >
              Voir Détails
            </Link>
          </Card.Footer>
        </Card>
      </Col>
    ))
)}

          </Row>
        </>
      )}

      {view === 'sections' && canManageSection && (
        <Card><Card.Header><Button onClick={() => setCurrentSection(null) & setShowSectionModal(true)}><i className="fas fa-plus me-2"></i>Nouvelle Section</Button></Card.Header>
          <Card.Body><Table striped bordered hover responsive>
              <thead><tr><th>Nom</th><th>Chef de Section</th><th>Actions</th></tr></thead>
              <tbody>{sections.map(s => (<tr key={s.id}><td>{s.nom}</td><td>{s.chef_section_name || 'N/A'}</td><td><Button as={Link} to={`/sections/${s.id}`} variant="outline-info" size="sm">Voir Détails</Button>{' '}<Button variant="outline-primary" size="sm" onClick={() => setCurrentSection(s) & setShowSectionModal(true)}>Modifier</Button>{' '}<Button variant="outline-danger" size="sm" onClick={() => handleDelete('section', s.id)}>Supprimer</Button></td></tr>))}</tbody>
          </Table></Card.Body>
        </Card>
      )}

      {view === 'filieres' && canManageFiliere && (
        <Card><Card.Header><Button onClick={handleOpenCreateFiliereModal}><i className="fas fa-plus me-2"></i>Nouvelle Filière</Button></Card.Header>
          <Card.Body><Table striped bordered hover responsive>
              <thead><tr><th>Nom</th><th>Section</th><th>Chef de Filière</th><th>Actions</th></tr></thead>
              <tbody>{allFilieres.map(f => (<tr key={f.id}><td>{f.nom}</td><td>{f.section_nom}</td><td>{f.chef_filiere_name || 'N/A'}</td><td><Button as={Link} to={`/filieres/${f.id}`} variant="outline-info" size="sm">Voir Détails</Button>{' '}<Button variant="outline-primary" size="sm" onClick={() => setCurrentFiliere(f) & setShowFiliereModal(true)}>Modifier</Button>{' '}<Button variant="outline-danger" size="sm" onClick={() => handleDelete('filiere', f.id)}>Supprimer</Button></td></tr>))}</tbody>
          </Table></Card.Body>
        </Card>
      )}

      {/* Modals */}
      <Modal show={showAuditoireModal} onHide={handleCloseAuditoireModal} size="lg">
        <Form onSubmit={handleAuditoireSubmit}>
          <Modal.Header closeButton><Modal.Title>Créer un Auditoire</Modal.Title></Modal.Header>
          <Modal.Body>
            <Row>
              <Col md={6}><Form.Group className="mb-3"><Form.Label>Nom</Form.Label><Form.Control name="nom" value={newAuditoire.nom} onChange={handleAuditoireChange} required /></Form.Group></Col>
              <Col md={3}><Form.Group className="mb-3"><Form.Label>Niveau</Form.Label><Form.Select name="niveau" value={newAuditoire.niveau} onChange={handleAuditoireChange} required><option value="">Choisir...</option><option value="L1">L1</option><option value="L2">L2</option><option value="L3">L3</option><option value="M1">M1</option><option value="M2">M2</option></Form.Select></Form.Group></Col>
              <Col md={3}><Form.Group className="mb-3"><Form.Label>Vacation</Form.Label><Form.Select name="vacation" value={newAuditoire.vacation} onChange={handleAuditoireChange} required><option value="jour">Jour</option><option value="soir">Soir</option></Form.Select></Form.Group></Col>
            </Row>
            <Row>
              <Col md={6}><Form.Group className="mb-3"><Form.Label>Section</Form.Label><Form.Select name="section" value={newAuditoire.section} onChange={handleAuditoireChange} required><option value="">Choisir...</option>{sections.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}</Form.Select></Form.Group></Col>
              <Col md={6}><Form.Group className="mb-3"><Form.Label>Filière</Form.Label><Form.Select name="filiere" value={newAuditoire.filiere} onChange={handleAuditoireChange} required disabled={!newAuditoire.section}><option value="">Choisir...</option>{filteredFilieres.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}</Form.Select></Form.Group></Col>
            </Row>
            <Form.Group><Form.Label>Description</Form.Label><Form.Control as="textarea" name="description" value={newAuditoire.description} onChange={handleAuditoireChange} rows={3} /></Form.Group>
          </Modal.Body>
          <Modal.Footer><Button variant="secondary" onClick={handleCloseAuditoireModal}>Annuler</Button><Button type="submit" variant="primary" disabled={auditoiresLoading}>
            {auditoiresLoading ? <Spinner as="span" animation="border" size="sm" /> : "Sauvegarder"}
          </Button></Modal.Footer>
        </Form>
      </Modal>

      <Modal show={showSectionModal} onHide={handleCloseSectionModal}>
        <Form onSubmit={handleSectionSubmit}>
          <Modal.Header closeButton><Modal.Title>{currentSection ? 'Modifier' : 'Créer'} une Section</Modal.Title></Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3"><Form.Label>Nom</Form.Label><Form.Control name="nom" defaultValue={currentSection?.nom} required /></Form.Group>
            <Form.Group className="mb-3"><Form.Label>Chef de Section</Form.Label><Form.Select name="chef_section" defaultValue={currentSection?.chef_section}><option value="">Aucun</option>{chefsDeSection.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</Form.Select></Form.Group>
          </Modal.Body>
          <Modal.Footer><Button variant="secondary" onClick={handleCloseSectionModal}>Annuler</Button><Button type="submit" variant="primary">Sauvegarder</Button></Modal.Footer>
        </Form>
      </Modal>

      <Modal show={showFiliereModal} onHide={handleCloseFiliereModal}>
        <Form onSubmit={handleFiliereSubmit}>
          <Modal.Header closeButton><Modal.Title>{currentFiliere && currentFiliere.id ? 'Modifier' : 'Créer'} une Filière</Modal.Title></Modal.Header>
          <Modal.Body>
            <Form.Group className="mb-3"><Form.Label>Nom</Form.Label><Form.Control name="nom" defaultValue={currentFiliere?.nom} required /></Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Section</Form.Label>
              <Form.Select
                name="section"
                value={currentFiliere?.section || ''} // Use value for controlled component
                onChange={(e) => setCurrentFiliere({ ...currentFiliere, section: e.target.value })} // Update state on change
                required
                disabled={user?.role === "chef_section" && user?.section_id && !currentFiliere?.id} // Disable if chef_section and creating new
              >
                <option value="">Choisir...</option>
                {sections.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3"><Form.Label>Chef de Filière</Form.Label><Form.Select name="chef_filiere" defaultValue={currentFiliere?.chef_filiere}><option value="">Aucun</option>{chefsDeDepartement.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}</Form.Select></Form.Group>
          </Modal.Body>
          <Modal.Footer><Button variant="secondary" onClick={handleCloseFiliereModal}>Annuler</Button><Button type="submit" variant="primary">Sauvegarder</Button></Modal.Footer>
        </Form>
      </Modal>
    </Container>
  )
}

export default Auditoires