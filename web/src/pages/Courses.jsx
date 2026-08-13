"use client";

import {
  Container,
  Row,
  Col,
  Button,
  Form,
  Pagination,
  Modal,
  Spinner,
  Badge,
  ProgressBar
} from "react-bootstrap";
import { useState, useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { LinkContainer } from "react-router-bootstrap";
import { motion } from "framer-motion";
import {
  FiPlus,
  FiBook,
  FiUser,
  FiEdit,
  FiEye,
  FiFilter,
  FiRefreshCw,
  FiGrid,
  FiList,
  FiTrendingUp
} from "react-icons/fi";
import FilterBar from "../components/FilterBar";

import {
  fetchMyCourses,
  fetchCourses,
  createCourse,
  updateCourse,
  setPage,
  setFilter,
  clearFilters
} from "../store/slices/coursesSlice";

import { getAuditoires } from "../services/auditoireService";
import { getUsers } from "../services/userService";
import { getSections } from "../services/sectionService";
import { getFilieres } from "../services/filiereService";
import scheduleService from "../services/scheduleService";
import { useNavigate } from "react-router-dom";
const Courses = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { courses, loading, error, pagination, filters } = useSelector(
    (state) => state.courses
  );
  const { user } = useSelector((state) => state.auth);

  // Modal State
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseData, setCourseData] = useState({
    name: "",
    credits: 3,
    description: "",
    titulaire: "",
    auditoire: "",
    semester: ""
  });

  // Dropdown options
  const [auditoireOptions, setAuditoireOptions] = useState([]);
  const [teacherOptions, setTeacherOptions] = useState([]);
  const [sectionOptions, setSectionOptions] = useState([]);
  const [filiereOptions, setFiliereOptions] = useState([]);
  const [termOptions, setTermOptions] = useState([]);

  const vacationOptions = [
    { id: "jour", name: "Jour" },
    { id: "soir", name: "Soir" }
  ];

  const niveauOptions = [
    { id: "G1", name: "G1" },
    { id: "G2", name: "G2" },
    { id: "G3", name: "G3" }
  ];

  const canCreateCourses = () => {
    return ["chef_section", "sga", "iadmin"].includes(user?.role);
  };

  // Load filters options
  useEffect(() => {
    const loadFilters = async () => {
      try {
        // Pour les enseignants et assistants, ne charger que les auditoires
        const isTeacher = ['enseignant', 'assistant'].includes(user?.role);

        const promises = [getAuditoires()];

        // Les autres rôles peuvent voir sections et filières
        if (!isTeacher) {
          promises.unshift(getSections(), getFilieres());
        }

        const results = await Promise.all(promises);

        if (isTeacher) {
          const [audRes] = results;
          setAuditoireOptions(audRes.data.results || audRes.data);
        } else {
          const [sectionsRes, filieresRes, audRes] = results;
          setSectionOptions(sectionsRes.data.results || sectionsRes.data);
          setFiliereOptions(filieresRes.data.results || filieresRes.data);
          setAuditoireOptions(audRes.data.results || audRes.data);
        }
      } catch (err) {
        console.log("Erreur filtres:", err);
      }
    };

    loadFilters();

    // Load terms from academic calendar for semester dropdown
    scheduleService.getTerms().then(raw => {
      const data = Array.isArray(raw) ? raw : raw?.results || [];
      setTermOptions(data);
    }).catch(() => {});
  }, []);

  // Fetch courses
  const loadCourses = useCallback(() => {
    if (user?.role === "etudiant") {
      dispatch(
        fetchMyCourses({
          page: pagination.currentPage,
          page_size: pagination.pageSize,
          ...filters
        })
      );
    } else {
      dispatch(
        fetchCourses({
          page: pagination.currentPage,
          page_size: pagination.pageSize,
          ...filters
        })
      );
    }
  }, [dispatch, user, pagination.currentPage, pagination.pageSize, filters]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  // Modal: load ALL teachers and assistants for course form
  // Pour chef section/département/sga: for_course_form=true permet de voir TOUS les enseignants et assistants
  useEffect(() => {
    if (canCreateCourses()) {
      const params = {};

      // Charger TOUS les enseignants et assistants pour le formulaire de cours
      // On ne filtre pas par rôle spécifique, le backend le fera
      if (user?.role === 'chef_section' || user?.role === 'chef_departement' || user?.role === 'sga' || user?.role === 'iadmin') {
        params.for_course_form = true;
        params.role__in = 'enseignant,assistant'; // Inclure les deux rôles
      }

      getUsers(params).then((res) => {
        // Filtrer pour ne garder que les enseignants et assistants
        const teachers = (res.data.results || res.data).filter(
          u => u.role === 'enseignant' || u.role === 'assistant'
        );
        setTeacherOptions(teachers);
      }).catch(err => {
        console.error("Erreur lors du chargement des enseignants:", err);
      });
    }
  }, [user]);

  // Handle Modal Create
  const openCreateModal = () => {
    setSelectedCourse(null);

    setCourseData({
      name: "",
      credits: 3,
      description: "",
      titulaire: "",
      auditoire: "",
      semester: ""
    });

    setShowCourseModal(true);
  };

  // Handle Modal Edit
  const openEditModal = (course) => {
    setSelectedCourse(course);

    setCourseData({
      name: course.name,
      credits: course.credits,
      description: course.description,
      titulaire: course.titulaire,
      auditoire: course.auditoire_detail ? course.auditoire_detail.id : course.auditoire || "",
      semester: course.semester || ""
    });

    setShowCourseModal(true);
  };

  // Save course
  const saveCourse = async () => {
    try {
      const dataToSave = {
        ...courseData,
        titulaire: parseInt(courseData.titulaire),
        auditoire: courseData.auditoire ? parseInt(courseData.auditoire) : null
      };

      if (selectedCourse) {
        await dispatch(
          updateCourse({ id: selectedCourse.id, data: dataToSave })
        ).unwrap();
      } else {
        await dispatch(createCourse(dataToSave)).unwrap();
      }

      setShowCourseModal(false);
      loadCourses();
    } catch (err) {
      alert("Erreur: " + err.message);
    }
  };

  const [viewMode, setViewMode] = useState("grid");

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <Container fluid style={{ padding: '24px', background: 'var(--color-bodyBg)', minHeight: '100vh' }}>
      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ marginBottom: '32px' }}
      >
        <Row className="align-items-center mb-4">
          <Col>
            <h2 style={{
              fontSize: '2rem',
              fontWeight: '700',
              color: 'var(--color-textPrimary)',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <FiBook style={{ color: 'var(--color-primary)' }} />
              {user?.role === "etudiant" ? "Mes Cours" : "Gestion des Cours"}
            </h2>
            <p style={{ color: 'var(--color-textSecondary)', margin: 0 }}>
              {courses.length} cours disponible{courses.length > 1 ? 's' : ''}
            </p>
          </Col>
          <Col xs="auto" className="d-flex gap-2 align-items-center">
            <div style={{
              background: 'var(--color-cardBg)',
              border: '1px solid var(--color-border)',
              borderRadius: '10px',
              padding: '4px',
              display: 'flex',
              gap: '4px'
            }}>
              <Button
                size="sm"
                variant={viewMode === "grid" ? "primary" : "outline-secondary"}
                onClick={() => setViewMode("grid")}
                style={{ borderRadius: '8px', border: 'none' }}
              >
                <FiGrid />
              </Button>
              <Button
                size="sm"
                variant={viewMode === "list" ? "primary" : "outline-secondary"}
                onClick={() => setViewMode("list")}
                style={{ borderRadius: '8px', border: 'none' }}
              >
                <FiList />
              </Button>
            </div>
            {canCreateCourses() && (
              <Button
                onClick={openCreateModal}
                style={{
                  background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '8px 20px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <FiPlus /> Nouveau Cours
              </Button>
            )}
          </Col>
        </Row>
      </motion.div>

      {/* FILTERS */}
      {user?.role !== "etudiant" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            padding: '24px',
            marginBottom: '24px',
            background: 'var(--color-cardBg)',
            border: '1px solid var(--color-border)',
            borderRadius: '16px'
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px'
          }}>
            <h5 style={{
              margin: 0,
              fontWeight: '600',
              color: 'var(--color-textPrimary)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <FiFilter style={{ color: 'var(--color-primary)' }} /> Filtres
            </h5>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => dispatch(clearFilters())}
              style={{
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <FiRefreshCw size={14} /> Réinitialiser
            </Button>
          </div>

          <Row>
            {user?.role === "sga" && (
              <Col md={2} className="mb-3">
                <Form.Group>
                  <Form.Label style={{ fontWeight: '500', color: 'var(--color-textPrimary)', fontSize: '0.9rem' }}>
                    Section
                  </Form.Label>
                  <Form.Select
                    value={filters.section}
                    onChange={(e) => dispatch(setFilter({ filterName: "section", value: e.target.value }))}
                    style={{
                      borderRadius: '10px',
                      border: '1px solid var(--color-border)',
                      background: 'var(--color-bodyBg)',
                      color: 'var(--color-textPrimary)'
                    }}
                  >
                    <option value="">Toutes</option>
                    {sectionOptions.map((o) => (
                      <option key={o.id} value={o.id}>{o.nom}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            )}

            <Col md={2} className="mb-3">
              <Form.Group>
                <Form.Label style={{ fontWeight: '500', color: 'var(--color-textPrimary)', fontSize: '0.9rem' }}>
                  Filière
                </Form.Label>
                <Form.Select
                  value={filters.filiere}
                  onChange={(e) => dispatch(setFilter({ filterName: "filiere", value: e.target.value }))}
                  style={{
                    borderRadius: '10px',
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-bodyBg)',
                    color: 'var(--color-textPrimary)'
                  }}
                >
                  <option value="">Toutes</option>
                  {filiereOptions.map((o) => (
                    <option key={o.id} value={o.id}>{o.nom}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={2} className="mb-3">
              <Form.Group>
                <Form.Label style={{ fontWeight: '500', color: 'var(--color-textPrimary)', fontSize: '0.9rem' }}>
                  Auditoire
                </Form.Label>
                <Form.Select
                  value={filters.auditoire}
                  onChange={(e) => dispatch(setFilter({ filterName: "auditoire", value: e.target.value }))}
                  style={{
                    borderRadius: '10px',
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-bodyBg)',
                    color: 'var(--color-textPrimary)'
                  }}
                >
                  <option value="">Tous</option>
                  {auditoireOptions.map((o) => (
                    <option key={o.id} value={o.id}>{o.nom}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={2} className="mb-3">
              <Form.Group>
                <Form.Label style={{ fontWeight: '500', color: 'var(--color-textPrimary)', fontSize: '0.9rem' }}>
                  Vacation
                </Form.Label>
                <Form.Select
                  value={filters.vacation}
                  onChange={(e) => dispatch(setFilter({ filterName: "vacation", value: e.target.value }))}
                  style={{
                    borderRadius: '10px',
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-bodyBg)',
                    color: 'var(--color-textPrimary)'
                  }}
                >
                  <option value="">Toutes</option>
                  {vacationOptions.map((o) => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={2} className="mb-3">
              <Form.Group>
                <Form.Label style={{ fontWeight: '500', color: 'var(--color-textPrimary)', fontSize: '0.9rem' }}>
                  Niveau
                </Form.Label>
                <Form.Select
                  value={filters.niveau}
                  onChange={(e) => dispatch(setFilter({ filterName: "niveau", value: e.target.value }))}
                  style={{
                    borderRadius: '10px',
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-bodyBg)',
                    color: 'var(--color-textPrimary)'
                  }}
                >
                  <option value="">Tous</option>
                  {niveauOptions.map((o) => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </motion.div>
      )}

      {/* LOADING & EMPTY STATE */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <Spinner animation="border" style={{ color: 'var(--color-primary)' }} />
          <p style={{ color: 'var(--color-textSecondary)', marginTop: '16px' }}>Chargement des cours...</p>
        </div>
      )}

      {!loading && courses.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            textAlign: 'center',
            padding: '80px 20px',
            background: 'var(--color-cardBg)',
            borderRadius: '16px',
            border: '1px solid var(--color-border)'
          }}
        >
          <FiBook style={{ fontSize: '4rem', color: 'var(--color-textSecondary)', marginBottom: '16px' }} />
          <h4 style={{ color: 'var(--color-textPrimary)', fontWeight: '600', marginBottom: '8px' }}>
            Aucun cours disponible
          </h4>
          <p style={{ color: 'var(--color-textSecondary)' }}>
            {canCreateCourses() ? "Commencez par créer votre premier cours" : "Les cours seront bientôt disponibles"}
          </p>
        </motion.div>
      )}

      {/* COURSES LIST */}
      {!loading && courses.length > 0 && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <Row>
            {courses.map((course) => (
              <Col lg={viewMode === "grid" ? 6 : 12} key={course.id} className="mb-4">
                <motion.div
                  variants={itemVariants}
                  whileHover={{ y: -5, boxShadow: '0 12px 24px rgba(0,0,0,0.12)' }}
                  style={{
                    padding: '24px',
                    background: 'var(--color-cardBg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '16px',
                    height: '100%',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div style={{ flex: 1 }}>
                      <h5 style={{
                        fontWeight: '700',
                        color: 'var(--color-textPrimary)',
                        marginBottom: '8px',
                        fontSize: '1.15rem'
                      }}>
                        {course.name}
                      </h5>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        color: 'var(--color-textSecondary)',
                        fontSize: '0.9rem',
                        marginBottom: '4px'
                      }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <FiUser size={14} />
                          {course.titulaire_name || "N/A"}
                        </span>
                        <Badge bg="primary" style={{ borderRadius: '6px' }}>
                          {course.code}
                        </Badge>
                        <Badge bg="secondary" style={{ borderRadius: '6px' }}>
                          {course.credits} crédits
                        </Badge>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <LinkContainer to={`/courses/${course.id}`}>
                        <Button
                          size="sm"
                          variant="outline-primary"
                          style={{
                            borderRadius: '8px',
                            padding: '6px 12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <FiEye size={14} /> Voir
                        </Button>
                      </LinkContainer>

                      {canCreateCourses() && (
                        <Button
                          size="sm"
                          variant="outline-secondary"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditModal(course);
                          }}
                          style={{
                            borderRadius: '8px',
                            padding: '6px 12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <FiEdit size={14} />
                        </Button>
                      )}
                    </div>
                  </div>

                  <p style={{
                    color: 'var(--color-textSecondary)',
                    fontSize: '0.9rem',
                    marginBottom: '12px',
                    lineHeight: '1.6'
                  }}>
                    {course.description}
                  </p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '0.85rem' }}>
                    {course.auditoire_detail && (
                      <Badge bg="warning" style={{ borderRadius: '6px', padding: '4px 10px' }}>
                        🏫 {course.auditoire_detail.nom}
                      </Badge>
                    )}
                    {course.section && (
                      <Badge bg="info" style={{ borderRadius: '6px', padding: '4px 10px' }}>
                        📚 {course.section.nom}
                      </Badge>
                    )}
                    {course.filiere && (
                      <Badge bg="success" style={{ borderRadius: '6px', padding: '4px 10px' }}>
                        🎓 {course.filiere.nom}
                      </Badge>
                    )}
                  </div>
                </motion.div>
              </Col>
            ))}
          </Row>
        </motion.div>
      )}

      {/* PAGINATION */}
      {pagination.totalPages > 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{ marginTop: '32px' }}
        >
          <Row>
            <Col className="d-flex justify-content-center">
              <Pagination>
                <Pagination.Prev
                  disabled={pagination.currentPage === 1}
                  onClick={() => dispatch(setPage(pagination.currentPage - 1))}
                />
                {[...Array(pagination.totalPages).keys()].map((i) => (
                  <Pagination.Item
                    key={i + 1}
                    active={pagination.currentPage === i + 1}
                    onClick={() => dispatch(setPage(i + 1))}
                  >
                    {i + 1}
                  </Pagination.Item>
                ))}
                <Pagination.Next
                  disabled={pagination.currentPage === pagination.totalPages}
                  onClick={() => dispatch(setPage(pagination.currentPage + 1))}
                />
              </Pagination>
            </Col>
          </Row>
        </motion.div>
      )}

      {/* MODAL */}
      <Modal
        show={showCourseModal}
        onHide={() => setShowCourseModal(false)}
        size="lg"
        centered
        style={{ zIndex: 9999 }}
      >
        <Modal.Header
          closeButton
          style={{
            background: 'var(--color-cardBg)',
            borderBottom: '1px solid var(--color-border)',
            padding: '20px 24px'
          }}
        >
          <Modal.Title style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            color: 'var(--color-textPrimary)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <FiBook style={{ color: 'var(--color-primary)' }} />
            {selectedCourse ? "Modifier le Cours" : "Nouveau Cours"}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body style={{ background: 'var(--color-cardBg)', padding: '24px' }}>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label style={{ fontWeight: '600', color: 'var(--color-textPrimary)', marginBottom: '8px' }}>
                Nom du cours
              </Form.Label>
              <Form.Control
                type="text"
                value={courseData.name}
                onChange={(e) => setCourseData({ ...courseData, name: e.target.value })}
                required
                style={{
                  borderRadius: '10px',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-bodyBg)',
                  color: 'var(--color-textPrimary)',
                  padding: '12px 16px'
                }}
                placeholder="Ex: Introduction à la programmation"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label style={{ fontWeight: '600', color: 'var(--color-textPrimary)', marginBottom: '8px' }}>
                Auditoire
              </Form.Label>
              <Form.Select
                value={courseData.auditoire}
                onChange={(e) => setCourseData({
                  ...courseData,
                  auditoire: e.target.value
                })}
                required
                style={{
                  borderRadius: '10px',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-bodyBg)',
                  color: 'var(--color-textPrimary)',
                  padding: '12px 16px'
                }}
              >
                <option value="">Choisir un auditoire...</option>
                {auditoireOptions.map((a) => (
                  <option key={a.id} value={a.id}>{a.nom}</option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label style={{ fontWeight: '600', color: 'var(--color-textPrimary)', marginBottom: '8px' }}>
                Enseignant titulaire
              </Form.Label>
              <Form.Select
                value={courseData.titulaire}
                onChange={(e) => setCourseData({ ...courseData, titulaire: e.target.value })}
                required
                style={{
                  borderRadius: '10px',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-bodyBg)',
                  color: 'var(--color-textPrimary)',
                  padding: '12px 16px'
                }}
              >
                <option value="">Choisir un enseignant...</option>
                {teacherOptions.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </Form.Select>
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ fontWeight: '600', color: 'var(--color-textPrimary)', marginBottom: '8px' }}>
                    Semestre(s)
                  </Form.Label>
                  <div style={{
                    borderRadius: '10px',
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-bodyBg)',
                    padding: '10px 16px',
                    maxHeight: '150px',
                    overflowY: 'auto'
                  }}>
                    {(termOptions.length > 0 ? termOptions : [
                      { id: 'sem1', name: 'Semestre 1' },
                      { id: 'sem2', name: 'Semestre 2' },
                    ]).map((t) => {
                      const selected = (courseData.semester || '').split(',').map(s => s.trim()).filter(Boolean);
                      const isChecked = selected.includes(t.name);
                      return (
                        <Form.Check
                          key={t.id}
                          type="checkbox"
                          id={`semester-${t.id}`}
                          label={t.name}
                          checked={isChecked}
                          onChange={(e) => {
                            let updated;
                            if (e.target.checked) {
                              updated = [...selected, t.name];
                            } else {
                              updated = selected.filter(s => s !== t.name);
                            }
                            setCourseData({ ...courseData, semester: updated.join(', ') });
                          }}
                          style={{ color: 'var(--color-textPrimary)' }}
                        />
                      );
                    })}
                  </div>
                  {!courseData.semester && (
                    <Form.Text className="text-muted">Sélectionnez au moins un semestre</Form.Text>
                  )}
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label style={{ fontWeight: '600', color: 'var(--color-textPrimary)', marginBottom: '8px' }}>
                    Crédits
                  </Form.Label>
                  <Form.Control
                    type="number"
                    value={courseData.credits}
                    min="1"
                    max="10"
                    onChange={(e) => setCourseData({ ...courseData, credits: parseInt(e.target.value) })}
                    required
                    style={{
                      borderRadius: '10px',
                      border: '1px solid var(--color-border)',
                      background: 'var(--color-bodyBg)',
                      color: 'var(--color-textPrimary)',
                      padding: '12px 16px'
                    }}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group>
              <Form.Label style={{ fontWeight: '600', color: 'var(--color-textPrimary)', marginBottom: '8px' }}>
                Description
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={courseData.description}
                onChange={(e) => setCourseData({ ...courseData, description: e.target.value })}
                style={{
                  borderRadius: '10px',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-bodyBg)',
                  color: 'var(--color-textPrimary)',
                  padding: '12px 16px'
                }}
                placeholder="Décrivez brièvement le contenu du cours..."
              />
            </Form.Group>
          </Form>
        </Modal.Body>

        <Modal.Footer style={{
          background: 'var(--color-cardBg)',
          borderTop: '1px solid var(--color-border)',
          padding: '16px 24px'
        }}>
          <Button
            variant="outline-secondary"
            onClick={() => setShowCourseModal(false)}
            style={{
              borderRadius: '10px',
              padding: '10px 24px',
              fontWeight: '600'
            }}
          >
            Annuler
          </Button>

          <Button
            onClick={saveCourse}
            disabled={loading}
            style={{
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
              border: 'none',
              borderRadius: '10px',
              padding: '10px 24px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {loading ? (
              <>
                <Spinner as="span" size="sm" animation="border" />
                Sauvegarde...
              </>
            ) : (
              <>
                <FiPlus /> Sauvegarder
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Courses;
