import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { fetchTeachers } from '../store/slices/usersSlice';
import { Container, Row, Col, Card, Table, Spinner, Alert, Badge, Button, Modal, Form } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { FiUsers, FiUser, FiMail, FiHash, FiBookOpen, FiBriefcase, FiPlus, FiEye } from 'react-icons/fi';
import FilterBar from '../components/FilterBar';
import courseService from '../services/courseService';
import api from '../services/api';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

const TeacherListPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { teachers } = useSelector((state) => state.users);
  const { user } = useSelector((state) => state.auth);
  const { loading, list: teacherList, error } = teachers;
  const [currentFilters, setCurrentFilters] = useState({});

  // Modal pour assigner un cours
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [assignAsAssistant, setAssignAsAssistant] = useState(false);

  const params = useParams();
  const location = useLocation();

  // Configuration des filtres pour les enseignants
  const filterConfig = [
    { name: 'annee_academique', label: 'Année Académique', type: 'text', placeholder: '2024-2025', width: 3 },
    { name: 'section', label: 'Section (Faculté)', type: 'select', width: 3 },
    { name: 'filiere', label: 'Filière (Département)', type: 'select', width: 3 },
    { name: 'course_section', label: 'Enseigne en Section', type: 'select', width: 3 },
    { name: 'course_filiere', label: 'Enseigne en Filière', type: 'select', width: 3 },
    { name: 'niveau', label: 'Enseigne en Niveau', type: 'select', width: 3 },
    { name: 'vacation', label: 'Vacation', type: 'select', width: 3 },
    { name: 'search', label: 'Recherche', type: 'text', placeholder: 'Nom, prénom, email...', width: 3 },
  ];

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const filters = {};

    // Extract filters from route params
    if (params.filiereId) filters.course_filiere = params.filiereId;
    if (params.sectionId) filters.course_section = params.sectionId;

    // Extract filters from query params
    queryParams.forEach((value, key) => {
      filters[key] = value;
    });

    setCurrentFilters(filters);
    dispatch(fetchTeachers(filters));
  }, [dispatch, params, location.search]);

  const handleFilterChange = (newFilters) => {
    const queryParams = new URLSearchParams();
    Object.keys(newFilters).forEach(key => {
      if (newFilters[key]) {
        queryParams.set(key, newFilters[key]);
      }
    });
    navigate(`?${queryParams.toString()}`);
  };

  const handleAssignCourse = async (teacher) => {
    setSelectedTeacher(teacher);
    setAssignAsAssistant(teacher.role === 'assistant');
    setShowAssignModal(true);

    // Charger les cours disponibles
    try {
      const response = await courseService.getCourses();
      setAvailableCourses(response.data.results || response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des cours:', error);
    }
  };

  const handleConfirmAssign = async () => {
    if (!selectedCourseId || !selectedTeacher) return;

    try {
      const courseData = assignAsAssistant
        ? { assistants: [selectedTeacher.id] }
        : { titulaire: selectedTeacher.id };

      await api.patch(`/courses/${selectedCourseId}/`, courseData);

      alert(`✅ Cours assigné avec succès à ${selectedTeacher.first_name} ${selectedTeacher.last_name}`);
      setShowAssignModal(false);
      setSelectedCourseId('');
      setSelectedTeacher(null);
    } catch (error) {
      console.error('Erreur lors de l\'assignation:', error);
      alert('❌ Erreur lors de l\'assignation du cours');
    }
  };

  const handleViewDetails = (teacher) => {
    navigate(`/profile/${teacher.id}`);
  };

  if (loading) {
    return (
      <Container fluid style={{ padding: '24px', background: 'var(--color-bodyBg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <Spinner animation="border" style={{ color: 'var(--color-primary)', width: '3rem', height: '3rem' }} />
          <p style={{ marginTop: '16px', color: 'var(--color-textSecondary)', fontSize: '16px' }}>Chargement des enseignants...</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container fluid style={{ padding: '24px', background: 'var(--color-bodyBg)', minHeight: '100vh' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Alert variant="danger" style={{ maxWidth: '800px', margin: '40px auto', borderRadius: '12px', padding: '20px' }}>
            <strong>Erreur :</strong> {error}
          </Alert>
        </motion.div>
      </Container>
    );
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
            }}>
              <FiBriefcase size={28} style={{ color: 'white' }} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '32px', fontWeight: '700', color: 'var(--color-text)' }}>
                Liste des Enseignants et Assistants
              </h2>
              <p style={{ margin: 0, color: 'var(--color-textSecondary)', fontSize: '16px' }}>
                Gérez les informations détaillées des enseignants et assistants.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Barre de filtres */}
        <motion.div variants={itemVariants}>
          <FilterBar
            filters={filterConfig}
            onFilterChange={handleFilterChange}
            initialValues={currentFilters}
          />
        </motion.div>

        {/* Teachers Table Card */}
        <motion.div variants={itemVariants}>
          <Card style={{ 
            background: 'var(--color-cardBg)', 
            border: '1px solid var(--color-border)', 
            borderRadius: '16px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <Card.Header style={{ 
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              color: 'white',
              padding: '20px 24px',
              borderBottom: 'none',
              borderTopLeftRadius: '16px',
              borderTopRightRadius: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <FiBriefcase size={24} />
                  <h5 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>Enseignants et Assistants</h5>
                </div>
                <Badge bg="light" text="dark" style={{ fontSize: '16px', padding: '8px 16px', borderRadius: '8px' }}>
                  {teacherList.length}
                </Badge>
              </div>
            </Card.Header>
            <Card.Body style={{ padding: '24px' }}>
              {teacherList.length === 0 ? (
                <Alert variant="info" style={{ borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
                  <FiBriefcase size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                  <p style={{ margin: 0, fontSize: '16px' }}>Aucun enseignant ou assistant trouvé avec les filtres appliqués.</p>
                </Alert>
              ) : (
                <div style={{ overflowX: 'auto', borderRadius: '12px' }}>
                  <Table responsive hover style={{
                    marginBottom: 0,
                    border: '1px solid var(--color-border)',
                    borderRadius: '12px',
                    overflow: 'hidden'
                  }}>
                    <thead style={{ background: 'var(--color-bodyBg)' }}>
                      <tr>
                        <th style={{ padding: '16px', color: 'var(--color-text)', fontWeight: '600', borderBottom: '2px solid var(--color-border)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FiHash size={16} />
                            ID
                          </div>
                        </th>
                        <th style={{ padding: '16px', color: 'var(--color-text)', fontWeight: '600', borderBottom: '2px solid var(--color-border)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FiUser size={16} />
                            Nom
                          </div>
                        </th>
                        <th style={{ padding: '16px', color: 'var(--color-text)', fontWeight: '600', borderBottom: '2px solid var(--color-border)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FiUser size={16} />
                            Prénom
                          </div>
                        </th>
                        <th style={{ padding: '16px', color: 'var(--color-text)', fontWeight: '600', borderBottom: '2px solid var(--color-border)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FiMail size={16} />
                            Email
                          </div>
                        </th>
                        <th style={{ padding: '16px', color: 'var(--color-text)', fontWeight: '600', borderBottom: '2px solid var(--color-border)' }}>Rôle</th>
                        <th style={{ padding: '16px', color: 'var(--color-text)', fontWeight: '600', borderBottom: '2px solid var(--color-border)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FiBookOpen size={16} />
                            Filières
                          </div>
                        </th>
                        <th style={{ padding: '16px', color: 'var(--color-text)', fontWeight: '600', borderBottom: '2px solid var(--color-border)' }}>Sections</th>
                        <th style={{ padding: '16px', color: 'var(--color-text)', fontWeight: '600', borderBottom: '2px solid var(--color-border)', textAlign: 'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teacherList.map((teacher, index) => (
                        <motion.tr 
                          key={teacher.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          style={{ 
                            background: index % 2 === 0 ? 'var(--color-cardBg)' : 'var(--color-bodyBg)',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <td style={{ padding: '16px', color: 'var(--color-textSecondary)', borderBottom: '1px solid var(--color-border)' }}>{teacher.id}</td>
                          <td style={{ padding: '16px', color: 'var(--color-text)', fontWeight: '500', borderBottom: '1px solid var(--color-border)' }}>{teacher.last_name}</td>
                          <td style={{ padding: '16px', color: 'var(--color-text)', fontWeight: '500', borderBottom: '1px solid var(--color-border)' }}>{teacher.first_name}</td>
                          <td style={{ padding: '16px', color: 'var(--color-textSecondary)', borderBottom: '1px solid var(--color-border)' }}>{teacher.email}</td>
                          <td style={{ padding: '16px', borderBottom: '1px solid var(--color-border)' }}>
                            <Badge 
                              bg={teacher.role === 'enseignant' ? 'primary' : 'info'} 
                              style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '13px' }}
                            >
                              {teacher.role}
                            </Badge>
                          </td>
                          <td style={{ padding: '16px', color: 'var(--color-textSecondary)', borderBottom: '1px solid var(--color-border)' }}>
                            {teacher.filieres && teacher.filieres.length > 0
                              ? teacher.filieres.map((f) => f.nom).join(", ")
                              : "N/A"}
                          </td>
                          <td style={{ padding: '16px', color: 'var(--color-textSecondary)', borderBottom: '1px solid var(--color-border)' }}>
                            {teacher.sections && teacher.sections.length > 0
                              ? teacher.sections.map((s) => s.nom).join(", ")
                              : "N/A"}
                          </td>
                          <td style={{ padding: '16px', borderBottom: '1px solid var(--color-border)', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                              <Button
                                size="sm"
                                variant="outline-primary"
                                onClick={() => handleViewDetails(teacher)}
                                style={{ borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                              >
                                <FiEye size={14} /> Voir
                              </Button>
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => handleAssignCourse(teacher)}
                                style={{ borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                              >
                                <FiPlus size={14} /> Assigner cours
                              </Button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        </motion.div>
      </motion.div>

      {/* Modal pour assigner un cours */}
      <Modal show={showAssignModal} onHide={() => setShowAssignModal(false)} centered>
        <Modal.Header closeButton style={{ borderBottom: '1px solid var(--color-border)' }}>
          <Modal.Title style={{ fontSize: '20px', fontWeight: '600' }}>
            Assigner un cours à {selectedTeacher?.first_name} {selectedTeacher?.last_name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: '24px' }}>
          <Form.Group className="mb-3">
            <Form.Label style={{ fontWeight: '600' }}>Sélectionner un cours</Form.Label>
            <Form.Select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              style={{ borderRadius: '8px' }}
            >
              <option value="">Choisir un cours...</option>
              {availableCourses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name} ({course.code})
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          {selectedTeacher?.role === 'enseignant' && (
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Assigner en tant qu'assistant (au lieu de titulaire)"
                checked={assignAsAssistant}
                onChange={(e) => setAssignAsAssistant(e.target.checked)}
              />
            </Form.Group>
          )}

          <Alert variant="info" style={{ borderRadius: '8px', fontSize: '14px' }}>
            <i className="fas fa-info-circle me-2"></i>
            {assignAsAssistant ?
              "L'enseignant sera ajouté comme assistant de ce cours." :
              "L'enseignant sera défini comme titulaire de ce cours."
            }
          </Alert>
        </Modal.Body>
        <Modal.Footer style={{ borderTop: '1px solid var(--color-border)' }}>
          <Button
            variant="outline-secondary"
            onClick={() => setShowAssignModal(false)}
            style={{ borderRadius: '8px' }}
          >
            Annuler
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirmAssign}
            disabled={!selectedCourseId}
            style={{ borderRadius: '8px' }}
          >
            Confirmer l'assignation
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default TeacherListPage;
