"use client"

import { useState, useEffect } from "react"
import { Container, Row, Col, Card, Button, Badge, Form, Modal, Spinner, Alert, Nav, Table } from "react-bootstrap"
import { useSelector, useDispatch } from "react-redux"
import { Link } from "react-router-dom"
import { fetchAuditoires, createAuditoire } from "../store/slices/auditoiresSlice"
import { getSections, createSection, updateSection, deleteSection } from "../services/sectionService"
import { getFilieres, createFiliere, updateFiliere, deleteFiliere } from "../services/filiereService"
import { getUsers } from "../services/userService"
import { motion, AnimatePresence, invariant } from "framer-motion"
import { FiHome, FiPlus, FiEdit, FiTrash, FiEye, FiUsers, FiGrid, FiLayers, FiX } from "react-icons/fi"

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.3 }
  }
}

const contentVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3 }
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: { duration: 0.2 }
  }
}

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
    <Container fluid style={{ padding: '24px', background: 'var(--color-bodyBg)', minHeight: '100vh' }}>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div variants={invariant} style={{ marginBottom: '24px' }}>
          <div style={{
            padding: '24px',
            background: 'var(--color-cardBg)',
            borderRadius: '16px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            border: '1px solid var(--color-border)'
          }}>
            <h2 style={{
              margin: '0 0 20px 0',
              fontSize: '1.8rem',
              fontWeight: '700',
              background: 'linear-gradient(135deg, var(--color-primary) 0%, #667eea 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <FiGrid size={32} style={{ color: 'var(--color-primary)' }} />
              Gestion Académique
            </h2>

            <Nav
              variant="tabs"
              activeKey={view}
              onSelect={(k) => setView(k)}
              style={{
                borderBottom: '2px solid var(--color-border)',
                gap: '8px'
              }}
            >
              <Nav.Item>
                <Nav.Link
                  eventKey="auditoires"
                  style={{
                    padding: '12px 20px',
                    borderRadius: '8px 8px 0 0',
                    border: 'none',
                    background: view === 'auditoires' ? 'linear-gradient(135deg, var(--color-primary) 0%, #667eea 100%)' : 'transparent',
                    color: view === 'auditoires' ? 'white' : 'var(--color-text)',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <FiHome size={18} />
                  Auditoires
                </Nav.Link>
              </Nav.Item>
              {canManageSection && (
                <Nav.Item>
                  <Nav.Link
                    eventKey="sections"
                    style={{
                      padding: '12px 20px',
                      borderRadius: '8px 8px 0 0',
                      border: 'none',
                      background: view === 'sections' ? 'linear-gradient(135deg, var(--color-primary) 0%, #667eea 100%)' : 'transparent',
                      color: view === 'sections' ? 'white' : 'var(--color-text)',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <FiLayers size={18} />
                    Gérer les Sections
                  </Nav.Link>
                </Nav.Item>
              )}
              {canManageFiliere && (
                <Nav.Item>
                  <Nav.Link
                    eventKey="filieres"
                    style={{
                      padding: '12px 20px',
                      borderRadius: '8px 8px 0 0',
                      border: 'none',
                      background: view === 'filieres' ? 'linear-gradient(135deg, var(--color-primary) 0%, #667eea 100%)' : 'transparent',
                      color: view === 'filieres' ? 'white' : 'var(--color-text)',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <FiGrid size={18} />
                    Gérer les Filières
                  </Nav.Link>
                </Nav.Item>
              )}
            </Nav>
          </div>
        </motion.div>

        {loading && (
          <div className="text-center" style={{ padding: '60px 0' }}>
            <Spinner animation="border" style={{ color: 'var(--color-primary)' }} />
          </div>
        )}

        <AnimatePresence mode="wait">
          {view === 'auditoires' && (
            <motion.div
              key="auditoires"
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
          {canManageAuditoir && (
            <div style={{ marginBottom: '24px' }}>
              <Button
                onClick={() => setShowAuditoireModal(true)}
                style={{
                  background: 'linear-gradient(135deg, var(--color-primary) 0%, #667eea 100%)',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '10px',
                  fontWeight: '600',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}
              >
                <FiPlus size={20} />
                Créer un Auditoire
              </Button>
            </div>
          )}

          <Row>
            {!isDepartementRole && !isSectionRole && (auditoires?.results || auditoires || []).map((auditoire) => (
              <Col md={6} lg={4} key={auditoire.id} className="mb-4">
                <motion.div
                  whileHover={{ y: -5 }}
                  transition={{ duration: 0.2 }}
                  style={{ height: '100%' }}
                >
                  <div style={{
                    height: '100%',
                    background: 'var(--color-cardBg)',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    border: '1px solid var(--color-border)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.3s ease'
                  }}>
                    <div style={{ padding: '20px', flex: 1 }}>
                      <h5 style={{
                        color: 'var(--color-text)',
                        fontWeight: '700',
                        marginBottom: '16px',
                        fontSize: '1.2rem'
                      }}>
                        {auditoire.nom}
                      </h5>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        <Badge bg="info" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                          {auditoire.niveau}
                        </Badge>
                        <Badge bg="warning" style={{ padding: '6px 12px', fontSize: '0.85rem', textTransform: 'capitalize' }}>
                          {auditoire.vacation_display}
                        </Badge>
                        <Badge bg="secondary" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                          {auditoire.section_name}
                        </Badge>
                        <Badge bg="success" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                          {auditoire.filiere_name}
                        </Badge>
                      </div>
                    </div>
                    <div style={{
                      padding: '16px',
                      borderTop: '1px solid var(--color-border)'
                    }}>
                      <Link
                        to={`/auditoires/${auditoire.id}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          padding: '10px',
                          borderRadius: '8px',
                          border: '1px solid var(--color-primary)',
                          background: 'transparent',
                          color: 'var(--color-primary)',
                          textDecoration: 'none',
                          fontWeight: '600',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'var(--color-primary)'
                          e.currentTarget.style.color = 'white'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent'
                          e.currentTarget.style.color = 'var(--color-primary)'
                        }}
                      >
                        <FiEye size={18} />
                        Voir Détails
                      </Link>
                    </div>
                  </div>
                </motion.div>
              </Col>
            ))}

            {(isDepartementRole || isSectionRole) && (
              (auditoires?.results || auditoires || [])
                .filter(aud => {
                  if (isDepartementRole) {
                    return aud.filiere === user.filiere;
                  }
                  if (isSectionRole) {
                    return aud.section_id === user.section_id;
                  }
                  return false;
                })
                .map((auditoire) => (
                  <Col md={6} lg={4} key={auditoire.id} className="mb-4">
                    <motion.div
                      whileHover={{ y: -5 }}
                      transition={{ duration: 0.2 }}
                      style={{ height: '100%' }}
                    >
                      <div style={{
                        height: '100%',
                        background: 'var(--color-cardBg)',
                        borderRadius: '12px',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                        border: '1px solid var(--color-border)',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'all 0.3s ease'
                      }}>
                        <div style={{ padding: '20px', flex: 1 }}>
                          <h5 style={{
                            color: 'var(--color-text)',
                            fontWeight: '700',
                            marginBottom: '16px',
                            fontSize: '1.2rem'
                          }}>
                            {auditoire.nom}
                          </h5>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            <Badge bg="info" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                              {auditoire.niveau}
                            </Badge>
                            <Badge bg="warning" style={{ padding: '6px 12px', fontSize: '0.85rem', textTransform: 'capitalize' }}>
                              {auditoire.vacation_display}
                            </Badge>
                            <Badge bg="secondary" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                              {auditoire.section_name}
                            </Badge>
                            <Badge bg="success" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                              {auditoire.filiere_name}
                            </Badge>
                          </div>
                        </div>
                        <div style={{
                          padding: '16px',
                          borderTop: '1px solid var(--color-border)'
                        }}>
                          <Link
                            to={`/auditoires/${auditoire.id}`}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '8px',
                              padding: '10px',
                              borderRadius: '8px',
                              border: '1px solid var(--color-primary)',
                              background: 'transparent',
                              color: 'var(--color-primary)',
                              textDecoration: 'none',
                              fontWeight: '600',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'var(--color-primary)'
                              e.currentTarget.style.color = 'white'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent'
                              e.currentTarget.style.color = 'var(--color-primary)'
                            }}
                          >
                            <FiEye size={18} />
                            Voir Détails
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  </Col>
                ))
            )}
          </Row>
            </motion.div>
          )}

          {view === 'sections' && canManageSection && (
            <motion.div
              key="sections"
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
          <div style={{
            background: 'var(--color-cardBg)',
            borderRadius: '16px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            border: '1px solid var(--color-border)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--color-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h5 style={{ margin: 0, color: 'var(--color-text)', fontWeight: '600' }}>Sections</h5>
              <Button
                onClick={() => { setCurrentSection(null); setShowSectionModal(true); }}
                style={{
                  background: 'linear-gradient(135deg, var(--color-primary) 0%, #667eea 100%)',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <FiPlus size={18} />
                Nouvelle Section
              </Button>
            </div>
            <div style={{ padding: '24px', overflowX: 'auto' }}>
              <Table responsive hover style={{ color: 'var(--color-text)' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                    <th style={{ padding: '12px' }}>Nom</th>
                    <th style={{ padding: '12px' }}>Chef de Section</th>
                    <th style={{ padding: '12px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sections.map(s => (
                    <tr key={s.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '12px' }}>{s.nom}</td>
                      <td style={{ padding: '12px' }}>{s.chef_section_name || 'N/A'}</td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <Button
                            as={Link}
                            to={`/sections/${s.id}`}
                            variant="outline-info"
                            size="sm"
                            style={{
                              borderRadius: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            <FiEye size={16} />
                            Voir
                          </Button>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => { setCurrentSection(s); setShowSectionModal(true); }}
                            style={{
                              borderRadius: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            <FiEdit size={16} />
                            Modifier
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDelete('section', s.id)}
                            style={{
                              borderRadius: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            <FiTrash size={16} />
                            Supprimer
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </div>
            </motion.div>
          )}

          {view === 'filieres' && canManageFiliere && (
            <motion.div
              key="filieres"
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
          <div style={{
            background: 'var(--color-cardBg)',
            borderRadius: '16px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            border: '1px solid var(--color-border)',
            overflow: 'hidden'
          }}>
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid var(--color-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h5 style={{ margin: 0, color: 'var(--color-text)', fontWeight: '600' }}>Filières</h5>
              <Button
                onClick={handleOpenCreateFiliereModal}
                style={{
                  background: 'linear-gradient(135deg, var(--color-primary) 0%, #667eea 100%)',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <FiPlus size={18} />
                Nouvelle Filière
              </Button>
            </div>
            <div style={{ padding: '24px', overflowX: 'auto' }}>
              <Table responsive hover style={{ color: 'var(--color-text)' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                    <th style={{ padding: '12px' }}>Nom</th>
                    <th style={{ padding: '12px' }}>Section</th>
                    <th style={{ padding: '12px' }}>Chef de Filière</th>
                    <th style={{ padding: '12px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allFilieres.map(f => (
                    <tr key={f.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '12px' }}>{f.nom}</td>
                      <td style={{ padding: '12px' }}>{f.section_nom}</td>
                      <td style={{ padding: '12px' }}>{f.chef_filiere_name || 'N/A'}</td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <Button
                            as={Link}
                            to={`/filieres/${f.id}`}
                            variant="outline-info"
                            size="sm"
                            style={{
                              borderRadius: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            <FiEye size={16} />
                            Voir
                          </Button>
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => { setCurrentFiliere(f); setShowFiliereModal(true); }}
                            style={{
                              borderRadius: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            <FiEdit size={16} />
                            Modifier
                          </Button>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDelete('filiere', f.id)}
                            style={{
                              borderRadius: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            <FiTrash size={16} />
                            Supprimer
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Modals - Modern Design */}
      <Modal show={showAuditoireModal} onHide={handleCloseAuditoireModal} size="lg" centered>
        <div style={{
          background: 'var(--color-cardBg)',
          borderRadius: '16px',
          overflow: 'hidden',
          border: '1px solid var(--color-border)'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--color-primary) 0%, #667eea 100%)',
            padding: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h5 style={{ margin: 0, color: 'white', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <FiPlus size={24} />
              Créer un Auditoire
            </h5>
            <button
              onClick={handleCloseAuditoireModal}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                borderRadius: '8px',
                padding: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                color: 'white'
              }}
            >
              <FiX size={20} />
            </button>
          </div>

          <Form onSubmit={handleAuditoireSubmit}>
            <div style={{ padding: '24px' }}>
              <Row>
                <Col md={6}>
                  <Form.Group style={{ marginBottom: '20px' }}>
                    <Form.Label style={{ color: 'var(--color-text)', fontWeight: '600', marginBottom: '8px' }}>Nom</Form.Label>
                    <Form.Control
                      name="nom"
                      value={newAuditoire.nom}
                      onChange={handleAuditoireChange}
                      required
                      style={{
                        background: 'var(--color-bodyBg)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '8px',
                        color: 'var(--color-text)',
                        padding: '12px'
                      }}
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group style={{ marginBottom: '20px' }}>
                    <Form.Label style={{ color: 'var(--color-text)', fontWeight: '600', marginBottom: '8px' }}>Niveau</Form.Label>
                    <Form.Select
                      name="niveau"
                      value={newAuditoire.niveau}
                      onChange={handleAuditoireChange}
                      required
                      style={{
                        background: 'var(--color-bodyBg)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '8px',
                        color: 'var(--color-text)',
                        padding: '12px'
                      }}
                    >
                      <option value="">Choisir...</option>
                      <option value="L1">L1</option>
                      <option value="L2">L2</option>
                      <option value="L3">L3</option>
                      <option value="M1">M1</option>
                      <option value="M2">M2</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group style={{ marginBottom: '20px' }}>
                    <Form.Label style={{ color: 'var(--color-text)', fontWeight: '600', marginBottom: '8px' }}>Vacation</Form.Label>
                    <Form.Select
                      name="vacation"
                      value={newAuditoire.vacation}
                      onChange={handleAuditoireChange}
                      required
                      style={{
                        background: 'var(--color-bodyBg)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '8px',
                        color: 'var(--color-text)',
                        padding: '12px'
                      }}
                    >
                      <option value="jour">Jour</option>
                      <option value="soir">Soir</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <Form.Group style={{ marginBottom: '20px' }}>
                    <Form.Label style={{ color: 'var(--color-text)', fontWeight: '600', marginBottom: '8px' }}>Section</Form.Label>
                    <Form.Select
                      name="section"
                      value={newAuditoire.section}
                      onChange={handleAuditoireChange}
                      required
                      style={{
                        background: 'var(--color-bodyBg)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '8px',
                        color: 'var(--color-text)',
                        padding: '12px'
                      }}
                    >
                      <option value="">Choisir...</option>
                      {sections.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group style={{ marginBottom: '20px' }}>
                    <Form.Label style={{ color: 'var(--color-text)', fontWeight: '600', marginBottom: '8px' }}>Filière</Form.Label>
                    <Form.Select
                      name="filiere"
                      value={newAuditoire.filiere}
                      onChange={handleAuditoireChange}
                      required
                      disabled={!newAuditoire.section}
                      style={{
                        background: 'var(--color-bodyBg)',
                        border: '1px solid var(--color-border)',
                        borderRadius: '8px',
                        color: 'var(--color-text)',
                        padding: '12px'
                      }}
                    >
                      <option value="">Choisir...</option>
                      {filteredFilieres.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
              <Form.Group style={{ marginBottom: '20px' }}>
                <Form.Label style={{ color: 'var(--color-text)', fontWeight: '600', marginBottom: '8px' }}>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  name="description"
                  value={newAuditoire.description}
                  onChange={handleAuditoireChange}
                  rows={3}
                  style={{
                    background: 'var(--color-bodyBg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    color: 'var(--color-text)',
                    padding: '12px'
                  }}
                />
              </Form.Group>
            </div>

            <div style={{
              padding: '20px 24px',
              borderTop: '1px solid var(--color-border)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px'
            }}>
              <Button
                variant="secondary"
                onClick={handleCloseAuditoireModal}
                style={{ borderRadius: '8px', padding: '10px 20px', fontWeight: '600' }}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={auditoiresLoading}
                style={{
                  background: 'linear-gradient(135deg, var(--color-primary) 0%, #667eea 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 20px',
                  fontWeight: '600'
                }}
              >
                {auditoiresLoading ? <Spinner as="span" animation="border" size="sm" /> : "Sauvegarder"}
              </Button>
            </div>
          </Form>
        </div>
      </Modal>

      <Modal show={showSectionModal} onHide={handleCloseSectionModal} centered>
        <div style={{
          background: 'var(--color-cardBg)',
          borderRadius: '16px',
          overflow: 'hidden',
          border: '1px solid var(--color-border)'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--color-primary) 0%, #667eea 100%)',
            padding: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h5 style={{ margin: 0, color: 'white', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <FiLayers size={24} />
              {currentSection ? 'Modifier' : 'Créer'} une Section
            </h5>
            <button
              onClick={handleCloseSectionModal}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                borderRadius: '8px',
                padding: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                color: 'white'
              }}
            >
              <FiX size={20} />
            </button>
          </div>

          <Form onSubmit={handleSectionSubmit}>
            <div style={{ padding: '24px' }}>
              <Form.Group style={{ marginBottom: '20px' }}>
                <Form.Label style={{ color: 'var(--color-text)', fontWeight: '600', marginBottom: '8px' }}>Nom</Form.Label>
                <Form.Control
                  name="nom"
                  defaultValue={currentSection?.nom}
                  required
                  style={{
                    background: 'var(--color-bodyBg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    color: 'var(--color-text)',
                    padding: '12px'
                  }}
                />
              </Form.Group>
              <Form.Group style={{ marginBottom: '20px' }}>
                <Form.Label style={{ color: 'var(--color-text)', fontWeight: '600', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FiUsers />
                  Chef de Section
                </Form.Label>
                <Form.Select
                  name="chef_section"
                  defaultValue={currentSection?.chef_section}
                  style={{
                    background: 'var(--color-bodyBg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    color: 'var(--color-text)',
                    padding: '12px'
                  }}
                >
                  <option value="">Aucun</option>
                  {chefsDeSection.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </Form.Select>
              </Form.Group>
            </div>

            <div style={{
              padding: '20px 24px',
              borderTop: '1px solid var(--color-border)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px'
            }}>
              <Button
                variant="secondary"
                onClick={handleCloseSectionModal}
                style={{ borderRadius: '8px', padding: '10px 20px', fontWeight: '600' }}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                style={{
                  background: 'linear-gradient(135deg, var(--color-primary) 0%, #667eea 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 20px',
                  fontWeight: '600'
                }}
              >
                Sauvegarder
              </Button>
            </div>
          </Form>
        </div>
      </Modal>

      <Modal show={showFiliereModal} onHide={handleCloseFiliereModal} centered>
        <div style={{
          background: 'var(--color-cardBg)',
          borderRadius: '16px',
          overflow: 'hidden',
          border: '1px solid var(--color-border)'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, var(--color-primary) 0%, #667eea 100%)',
            padding: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h5 style={{ margin: 0, color: 'white', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <FiGrid size={24} />
              {currentFiliere && currentFiliere.id ? 'Modifier' : 'Créer'} une Filière
            </h5>
            <button
              onClick={handleCloseFiliereModal}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                borderRadius: '8px',
                padding: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                color: 'white'
              }}
            >
              <FiX size={20} />
            </button>
          </div>

          <Form onSubmit={handleFiliereSubmit}>
            <div style={{ padding: '24px' }}>
              <Form.Group style={{ marginBottom: '20px' }}>
                <Form.Label style={{ color: 'var(--color-text)', fontWeight: '600', marginBottom: '8px' }}>Nom</Form.Label>
                <Form.Control
                  name="nom"
                  defaultValue={currentFiliere?.nom}
                  required
                  style={{
                    background: 'var(--color-bodyBg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    color: 'var(--color-text)',
                    padding: '12px'
                  }}
                />
              </Form.Group>
              <Form.Group style={{ marginBottom: '20px' }}>
                <Form.Label style={{ color: 'var(--color-text)', fontWeight: '600', marginBottom: '8px' }}>Section</Form.Label>
                <Form.Select
                  name="section"
                  value={currentFiliere?.section || ''}
                  onChange={(e) => setCurrentFiliere({ ...currentFiliere, section: e.target.value })}
                  required
                  disabled={user?.role === "chef_section" && user?.section_id && !currentFiliere?.id}
                  style={{
                    background: 'var(--color-bodyBg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    color: 'var(--color-text)',
                    padding: '12px'
                  }}
                >
                  <option value="">Choisir...</option>
                  {sections.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}
                </Form.Select>
              </Form.Group>
              <Form.Group style={{ marginBottom: '20px' }}>
                <Form.Label style={{ color: 'var(--color-text)', fontWeight: '600', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FiUsers />
                  Chef de Filière
                </Form.Label>
                <Form.Select
                  name="chef_filiere"
                  defaultValue={currentFiliere?.chef_filiere}
                  style={{
                    background: 'var(--color-bodyBg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '8px',
                    color: 'var(--color-text)',
                    padding: '12px'
                  }}
                >
                  <option value="">Aucun</option>
                  {chefsDeDepartement.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </Form.Select>
              </Form.Group>
            </div>

            <div style={{
              padding: '20px 24px',
              borderTop: '1px solid var(--color-border)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px'
            }}>
              <Button
                variant="secondary"
                onClick={handleCloseFiliereModal}
                style={{ borderRadius: '8px', padding: '10px 20px', fontWeight: '600' }}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                style={{
                  background: 'linear-gradient(135deg, var(--color-primary) 0%, #667eea 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 20px',
                  fontWeight: '600'
                }}
              >
                Sauvegarder
              </Button>
            </div>
          </Form>
        </div>
      </Modal>
    </Container>
  )
}

export default Auditoires