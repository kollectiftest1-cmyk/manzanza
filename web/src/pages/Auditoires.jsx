"use client"

import { useState, useEffect } from "react"
import { Container, Row, Col, Card, Button, Badge, Form, Modal, Spinner, Alert, Nav, Table } from "react-bootstrap"
import { useSelector, useDispatch } from "react-redux"
import { Link } from "react-router-dom"
import { fetchAuditoires, createAuditoire, updateAuditoire, deleteAuditoire } from "../store/slices/auditoiresSlice"
import { getSections, createSection, updateSection, deleteSection } from "../services/sectionService"
import { getFilieres, createFiliere, updateFiliere, deleteFiliere } from "../services/filiereService"
import { getUsers } from "../services/userService"
import gradeService from "../services/gradeService"
import { motion, AnimatePresence } from "framer-motion"
import { FiHome, FiPlus, FiEdit, FiTrash, FiEye, FiUsers, FiGrid, FiLayers, FiX, FiAward, FiSliders } from "react-icons/fi"

const CATEGORY_TYPE_OPTIONS = [
  { value: 'interro', label: 'Interrogation (en classe)' },
  { value: 'quiz',   label: 'Quiz (en ligne)' },
  { value: 'tp_td',  label: 'TP / TD' },
  { value: 'examen', label: 'Examen' },
  { value: 'bonus',  label: 'Bonus' },
]

const CATEGORY_TYPE_COLORS = {
  interro: { bg: '#fff3cd', text: '#856404' },
  quiz:    { bg: '#d1ecf1', text: '#0c5460' },
  tp_td:   { bg: '#d4edda', text: '#155724' },
  examen:  { bg: '#f8d7da', text: '#721c24' },
  bonus:   { bg: '#e2e3e5', text: '#383d41' },
}

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
  // Edit auditoire state
  const [showEditAuditoireModal, setShowEditAuditoireModal] = useState(false)
  const [editAudData, setEditAudData] = useState({ id: null, nom: "", niveau: "", vacation: "jour", filiere: "", description: "", capacite_max: "" })
  
  const [showSectionModal, setShowSectionModal] = useState(false)
  const [currentSection, setCurrentSection] = useState(null)

  const [showFiliereModal, setShowFiliereModal] = useState(false)
  const [currentFiliere, setCurrentFiliere] = useState(null)

  // ── Grade category config state ──────────────────────────────────────────
  const [gradeCategories, setGradeCategories] = useState([])
  const [loadingCats, setLoadingCats] = useState(false)
  const [showCatModal, setShowCatModal] = useState(false)
  const [editingCat, setEditingCat] = useState(null)
  const [catForm, setCatForm] = useState({ name: '', category_type: 'examen', weight: '', description: '' })
  const [catFormError, setCatFormError] = useState(null)
  const [savingCat, setSavingCat] = useState(false)

  // Permission checks
  const canManageSection = ['sga', 'pdg'].includes(user?.role)
  const canManageFiliere = ['sga', 'pdg','chef_section'].includes(user?.role)
  const canManageAuditoir = ['sga', 'pdg','chef_section',"chef_departement"].includes(user?.role)
  const isSectionRole = ['chef_section'].includes(user?.role)
  const isDepartementRole = ['chef_departement'].includes(user?.role)
  // More granular permission checks for fetching user lists
  const canFetchChefSection = ['sga', 'pdg','chef_section'].includes(user?.role)
  const canFetchChefDepartement = ['sga', 'pdg','chef_section'].includes(user?.role)

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

      // Fetch chef_section users only if the current user can assign chef_section (sga, pdg)
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
      // Fetch chef_departement users only if the current user can assign chef_filiere (sga, pdg)
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

  // Edit Auditoire handlers
  const handleOpenEditAuditoire = (auditoire) => {
    setEditAudData({
      id: auditoire.id,
      nom: auditoire.nom || '',
      niveau: auditoire.niveau || '',
      vacation: auditoire.vacation || 'jour',
      filiere: auditoire.filiere || '',
      description: auditoire.description || '',
      capacite_max: auditoire.capacite_max || '',
    })
    setShowEditAuditoireModal(true)
  }

  const handleEditAuditoireSubmit = async (e) => {
    e.preventDefault()
    try {
      await dispatch(updateAuditoire({ id: editAudData.id, data: {
        nom: editAudData.nom,
        niveau: editAudData.niveau,
        vacation: editAudData.vacation,
        filiere: parseInt(editAudData.filiere, 10),
        description: editAudData.description,
        capacite_max: editAudData.capacite_max || null,
      }})).unwrap()
      setShowEditAuditoireModal(false)
    } catch (err) {
      alert(`Erreur: ${err.detail || err.message || 'Impossible de modifier l\'auditoire.'}`)
    }
  }

  const handleDeleteAuditoire = async (auditoireId, auditoireNom) => {
    if (!window.confirm(`Supprimer l'auditoire "${auditoireNom}" ? Il ira dans la corbeille (restaurable pendant la durée de conservation).`)) return
    try {
      await dispatch(deleteAuditoire(auditoireId)).unwrap()
    } catch (err) {
      alert(`Erreur lors de la suppression : ${err.detail || err.message || 'Erreur inconnue.'}`)
    }
  }

  // ── Grade Category Config handlers (SGA/PDG) ───────────────────────────
  const loadGradeCategories = async () => {
    setLoadingCats(true)
    try {
      const res = await gradeService.getCategories()
      setGradeCategories(res.data?.results || res.data || [])
    } catch { /* non-critical */ }
    finally { setLoadingCats(false) }
  }

  useEffect(() => {
    if (view === 'config-notes') loadGradeCategories()
  }, [view]) // eslint-disable-line

  const openCreateCat = () => {
    setEditingCat(null)
    setCatForm({ name: '', category_type: 'examen', weight: '', description: '' })
    setCatFormError(null)
    setShowCatModal(true)
  }

  const openEditCat = (cat) => {
    setEditingCat(cat)
    setCatForm({ name: cat.name, category_type: cat.category_type, weight: cat.weight, description: cat.description || '' })
    setCatFormError(null)
    setShowCatModal(true)
  }

  const handleSaveCat = async () => {
    setCatFormError(null)
    if (!catForm.name || catForm.weight === '') {
      setCatFormError("Le nom et le poids sont obligatoires.")
      return
    }
    const w = parseFloat(catForm.weight)
    if (isNaN(w) || w < 0 || w > 100) {
      setCatFormError("Le poids doit être entre 0 et 100.")
      return
    }
    setSavingCat(true)
    try {
      if (editingCat) {
        await gradeService.updateCategory(editingCat.id, catForm)
      } else {
        await gradeService.createCategory(catForm)
      }
      setShowCatModal(false)
      loadGradeCategories()
    } catch (e) {
      const msg = e.response?.data
      setCatFormError(msg ? JSON.stringify(msg) : "Erreur lors de la sauvegarde.")
    } finally { setSavingCat(false) }
  }

  const handleDeleteCat = async (id, name) => {
    if (!window.confirm(`Supprimer la catégorie "${name}" ?`)) return
    await gradeService.deleteCategory(id)
    loadGradeCategories()
  }

  const handleSectionSubmit = async (e) => {
    e.preventDefault()
    const data = Object.fromEntries(new FormData(e.currentTarget))
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
        <motion.div variants={contentVariants} style={{ marginBottom: '24px' }}>
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
                    Gérer les Facultés
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
              {canManageSection && (
                <Nav.Item>
                  <Nav.Link
                    eventKey="config-notes"
                    style={{
                      padding: '12px 20px',
                      borderRadius: '8px 8px 0 0',
                      border: 'none',
                      background: view === 'config-notes' ? 'linear-gradient(135deg, var(--color-primary) 0%, #667eea 100%)' : 'transparent',
                      color: view === 'config-notes' ? 'white' : 'var(--color-text)',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <FiSliders size={18} />
                    Configuration Notes
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
                      borderTop: '1px solid var(--color-border)',
                      display: 'flex',
                      gap: '8px'
                    }}>
                      <Link
                        to={`/auditoires/${auditoire.id}`}
                        style={{
                          flex: 1,
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
                        Voir
                      </Link>
                      {canManageAuditoir && (
                        <>
                          <button
                            onClick={() => handleOpenEditAuditoire(auditoire)}
                            title="Modifier"
                            style={{
                              padding: '10px 14px',
                              borderRadius: '8px',
                              border: '1px solid #ffc107',
                              background: 'transparent',
                              color: '#ffc107',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              fontWeight: '600'
                            }}
                          >
                            <FiEdit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteAuditoire(auditoire.id, auditoire.nom)}
                            title="Supprimer"
                            style={{
                              padding: '10px 14px',
                              borderRadius: '8px',
                              border: '1px solid #dc3545',
                              background: 'transparent',
                              color: '#dc3545',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              fontWeight: '600'
                            }}
                          >
                            <FiTrash size={16} />
                          </button>
                        </>
                      )}
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
              <h5 style={{ margin: 0, color: 'var(--color-text)', fontWeight: '600' }}>Facultés</h5>
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
                Nouvelle Faculté
              </Button>
            </div>
            <div style={{ padding: '24px', overflowX: 'auto' }}>
              <Table responsive hover style={{ color: 'var(--color-text)' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
                    <th style={{ padding: '12px' }}>Nom</th>
                    <th style={{ padding: '12px' }}>Chef de Faculté</th>
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
                    <th style={{ padding: '12px' }}>Faculté</th>
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

          {/* ── Configuration des Notes ─────────────────────────────── */}
          {view === 'config-notes' && canManageSection && (
            <motion.div key="config-notes" variants={contentVariants} initial="hidden" animate="visible" exit="exit">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                  <h4 style={{ margin: 0, fontWeight: '700', color: 'var(--color-textPrimary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FiSliders size={22} style={{ color: 'var(--color-primary)' }} />
                    Configuration des catégories de notes
                  </h4>
                  <small style={{ color: 'var(--color-textSecondary)' }}>
                    Définissez les types d'évaluation et leurs poids globaux (%). Les poids peuvent être affinés par cours.
                  </small>
                </div>
                <Button variant="primary" onClick={openCreateCat} style={{ display: 'flex', alignItems: 'center', gap: '6px', borderRadius: '10px' }}>
                  <FiPlus /> Nouvelle catégorie
                </Button>
              </div>

              {/* Weight summary bar */}
              {gradeCategories.length > 0 && (() => {
                const total = gradeCategories.reduce((s, c) => s + parseFloat(c.weight || 0), 0)
                return (
                  <Alert variant={Math.abs(total - 100) < 0.01 ? 'success' : 'warning'} style={{ borderRadius: '10px', marginBottom: '20px' }}>
                    <strong>Total des poids :</strong> {total.toFixed(0)}%
                    {Math.abs(total - 100) >= 0.01 && (
                      <span> — Le total doit être égal à 100% pour un calcul de moyenne correct.</span>
                    )}
                  </Alert>
                )
              })()}

              {loadingCats ? (
                <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
              ) : gradeCategories.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <FiAward size={48} style={{ opacity: 0.3 }} />
                  <p className="mt-3">Aucune catégorie. Cliquez sur "Nouvelle catégorie" pour commencer.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                  {gradeCategories.map(cat => {
                    const ct = CATEGORY_TYPE_COLORS[cat.category_type] || CATEGORY_TYPE_COLORS.examen
                    const typeOpt = CATEGORY_TYPE_OPTIONS.find(o => o.value === cat.category_type)
                    const pct = parseFloat(cat.weight || 0)
                    return (
                      <Card key={cat.id} style={{ border: `2px solid ${ct.text}33`, borderRadius: '14px', overflow: 'hidden' }}>
                        <Card.Body>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <span style={{
                                background: ct.bg, color: ct.text,
                                borderRadius: '6px', padding: '3px 10px',
                                fontSize: '0.75rem', fontWeight: '700', marginBottom: '8px', display: 'inline-block'
                              }}>{typeOpt?.label || cat.category_type}</span>
                              <h6 style={{ fontWeight: '700', margin: '4px 0', color: 'var(--color-textPrimary)' }}>{cat.name}</h6>
                              {cat.description && (
                                <small style={{ color: 'var(--color-textSecondary)' }}>{cat.description}</small>
                              )}
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '1.8rem', fontWeight: '800', color: ct.text }}>{pct}%</div>
                              <small style={{ color: 'var(--color-textSecondary)' }}>poids</small>
                            </div>
                          </div>
                          {/* Visual weight bar */}
                          <div style={{ height: '6px', background: '#eee', borderRadius: '3px', marginTop: '12px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: ct.text, borderRadius: '3px', transition: 'width 0.4s' }} />
                          </div>
                          <div style={{ display: 'flex', gap: '8px', marginTop: '12px', justifyContent: 'flex-end' }}>
                            <Button size="sm" variant="outline-warning" onClick={() => openEditCat(cat)}
                              style={{ borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <FiEdit size={13} /> Modifier
                            </Button>
                            <Button size="sm" variant="outline-danger" onClick={() => handleDeleteCat(cat.id, cat.name)}
                              style={{ borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <FiTrash size={13} /> Supprimer
                            </Button>
                          </div>
                        </Card.Body>
                      </Card>
                    )
                  })}
                </div>
              )}

              {/* Important note about category differences */}
              <Alert variant="info" style={{ borderRadius: '10px', marginTop: '24px', fontSize: '0.875rem' }}>
                <strong>Rappel des différences :</strong>
                <ul className="mb-0 mt-2">
                  <li><strong>Interrogation</strong> — évaluation écrite ou orale en salle, saisie manuellement par l'enseignant</li>
                  <li><strong>Quiz (en ligne)</strong> — passé via le module Quiz, note automatiquement importée</li>
                  <li><strong>TP / TD</strong> — note de travail pratique / dirigé, saisie manuellement</li>
                  <li><strong>Examen</strong> — épreuve finale, saisie manuellement lors de la session d'examen</li>
                </ul>
              </Alert>
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
                    <Form.Label style={{ color: 'var(--color-text)', fontWeight: '600', marginBottom: '8px' }}>Faculté</Form.Label>
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

      {/* ===== Edit Auditoire Modal ===== */}
      <Modal show={showEditAuditoireModal} onHide={() => setShowEditAuditoireModal(false)} centered>
        <div style={{ background: 'var(--color-cardBg)', borderRadius: '16px', overflow: 'hidden' }}>
          <div style={{ padding: '24px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h5 style={{ margin: 0, fontWeight: '700', color: 'var(--color-text)' }}>
              <FiEdit style={{ marginRight: '8px', color: 'var(--color-primary)' }} />
              Modifier l'Auditoire
            </h5>
            <button onClick={() => setShowEditAuditoireModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-textSecondary)', fontSize: '1.2rem' }}>
              <FiX />
            </button>
          </div>
          <Form onSubmit={handleEditAuditoireSubmit} style={{ padding: '24px' }}>
            <Form.Group className="mb-3">
              <Form.Label style={{ color: 'var(--color-text)', fontWeight: '600' }}>Nom de l'Auditoire *</Form.Label>
              <Form.Control
                type="text"
                value={editAudData.nom}
                onChange={(e) => setEditAudData({ ...editAudData, nom: e.target.value })}
                required
                style={{ background: 'var(--color-bodyBg)', border: '1px solid var(--color-border)', color: 'var(--color-text)', borderRadius: '8px' }}
              />
            </Form.Group>
            <Row>
              <Col>
                <Form.Group className="mb-3">
                  <Form.Label style={{ color: 'var(--color-text)', fontWeight: '600' }}>Niveau *</Form.Label>
                  <Form.Select
                    value={editAudData.niveau}
                    onChange={(e) => setEditAudData({ ...editAudData, niveau: e.target.value })}
                    required
                    style={{ background: 'var(--color-bodyBg)', border: '1px solid var(--color-border)', color: 'var(--color-text)', borderRadius: '8px' }}
                  >
                    <option value="">-- Choisir --</option>
                    {['L1', 'L2', 'L3', 'M1', 'M2'].map(n => <option key={n} value={n}>{n}</option>)}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col>
                <Form.Group className="mb-3">
                  <Form.Label style={{ color: 'var(--color-text)', fontWeight: '600' }}>Vacation *</Form.Label>
                  <Form.Select
                    value={editAudData.vacation}
                    onChange={(e) => setEditAudData({ ...editAudData, vacation: e.target.value })}
                    required
                    style={{ background: 'var(--color-bodyBg)', border: '1px solid var(--color-border)', color: 'var(--color-text)', borderRadius: '8px' }}
                  >
                    <option value="jour">Jour</option>
                    <option value="soir">Soir</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label style={{ color: 'var(--color-text)', fontWeight: '600' }}>Capacité maximale</Form.Label>
              <Form.Control
                type="number"
                min="1"
                value={editAudData.capacite_max}
                onChange={(e) => setEditAudData({ ...editAudData, capacite_max: e.target.value })}
                style={{ background: 'var(--color-bodyBg)', border: '1px solid var(--color-border)', color: 'var(--color-text)', borderRadius: '8px' }}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label style={{ color: 'var(--color-text)', fontWeight: '600' }}>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={editAudData.description}
                onChange={(e) => setEditAudData({ ...editAudData, description: e.target.value })}
                style={{ background: 'var(--color-bodyBg)', border: '1px solid var(--color-border)', color: 'var(--color-text)', borderRadius: '8px' }}
              />
            </Form.Group>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <Button variant="outline-secondary" onClick={() => setShowEditAuditoireModal(false)} style={{ borderRadius: '8px', padding: '10px 20px' }}>
                Annuler
              </Button>
              <Button type="submit" style={{ background: 'linear-gradient(135deg, var(--color-primary) 0%, #667eea 100%)', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: '600' }}>
                Enregistrer
              </Button>
            </div>
          </Form>
        </div>
      </Modal>

      {/* ── Grade Category Modal ───────────────────────────────────── */}
      <Modal show={showCatModal} onHide={() => setShowCatModal(false)} centered size="md">
        <Modal.Header style={{ background: 'linear-gradient(135deg, var(--color-primary) 0%, #667eea 100%)', color: '#fff', border: 'none', borderRadius: '16px 16px 0 0', padding: '20px 24px' }}>
          <Modal.Title style={{ fontWeight: '700' }}>
            <FiSliders style={{ marginRight: '10px' }} />
            {editingCat ? 'Modifier la catégorie' : 'Nouvelle catégorie de notes'}
          </Modal.Title>
          <button onClick={() => setShowCatModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', fontSize: '1.2rem', marginLeft: 'auto' }}>✕</button>
        </Modal.Header>
        <Modal.Body style={{ padding: '24px' }}>
          {catFormError && <Alert variant="danger" style={{ borderRadius: '10px' }}>{catFormError}</Alert>}
          <Form>
            <Form.Group className="mb-3">
              <Form.Label style={{ fontWeight: '600' }}>Nom de la catégorie <span style={{ color: 'red' }}>*</span></Form.Label>
              <Form.Control
                type="text"
                placeholder="ex: Interrogation 1, Quiz en ligne, TP Labo..."
                value={catForm.name}
                onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))}
                style={{ borderRadius: '10px', padding: '10px 14px' }}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label style={{ fontWeight: '600' }}>Type d'évaluation <span style={{ color: 'red' }}>*</span></Form.Label>
              <Form.Select
                value={catForm.category_type}
                onChange={e => setCatForm(f => ({ ...f, category_type: e.target.value }))}
                style={{ borderRadius: '10px', padding: '10px 14px' }}
              >
                <option value="">-- Choisir un type --</option>
                {CATEGORY_TYPE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </Form.Select>
              {catForm.category_type && (() => {
                const descriptions = {
                  interro: 'Évaluation écrite en salle, note saisie manuellement.',
                  quiz: 'Quiz en ligne, la note est importée automatiquement du module Quiz.',
                  tp_td: 'Travail pratique ou dirigé, note saisie par l\'enseignant.',
                  examen: 'Examen final de session, note saisie lors de la session d\'examen.',
                  bonus: 'Points de bonus supplémentaires, ne compte pas dans la session.',
                }
                return <Form.Text className="text-muted mt-1 d-block">{descriptions[catForm.category_type]}</Form.Text>
              })()}
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label style={{ fontWeight: '600' }}>Poids dans la moyenne (%) <span style={{ color: 'red' }}>*</span></Form.Label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Form.Control
                  type="number" min="0" max="100" step="5"
                  value={catForm.weight}
                  onChange={e => setCatForm(f => ({ ...f, weight: e.target.value }))}
                  style={{ borderRadius: '10px', padding: '10px 14px', width: '120px' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ height: '8px', background: '#eee', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${Math.min(parseFloat(catForm.weight) || 0, 100)}%`, background: 'var(--color-primary)', borderRadius: '4px', transition: 'width 0.3s' }} />
                  </div>
                  <small className="text-muted">{catForm.weight || 0}% du total</small>
                </div>
              </div>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label style={{ fontWeight: '600' }}>Description (optionnel)</Form.Label>
              <Form.Control
                as="textarea" rows={2}
                placeholder="Informations supplémentaires sur cette catégorie..."
                value={catForm.description}
                onChange={e => setCatForm(f => ({ ...f, description: e.target.value }))}
                style={{ borderRadius: '10px', padding: '10px 14px', resize: 'none' }}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer style={{ border: 'none', padding: '16px 24px', gap: '12px' }}>
          <Button variant="outline-secondary" onClick={() => setShowCatModal(false)} style={{ borderRadius: '10px', padding: '10px 20px' }}>
            Annuler
          </Button>
          <Button
            variant="primary"
            onClick={handleSaveCat}
            disabled={savingCat}
            style={{ borderRadius: '10px', padding: '10px 24px', fontWeight: '600', background: 'linear-gradient(135deg, var(--color-primary) 0%, #667eea 100%)', border: 'none' }}
          >
            {savingCat ? <><Spinner size="sm" animation="border" className="me-2" />Enregistrement...</> : (editingCat ? 'Mettre à jour' : 'Créer la catégorie')}
          </Button>
        </Modal.Footer>
      </Modal>

    </Container>
  )
}

export default Auditoires
