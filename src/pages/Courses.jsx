"use client";

import {
  Container,
  Row,
  Col,
  Button,
  Form,
  Alert,
  Pagination,
  Modal,
  Spinner
} from "react-bootstrap";
import { useState, useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { LinkContainer } from "react-router-bootstrap";
import { useNavigate } from "react-router-dom";

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
    auditoire: ""
  });

  // Dropdown options
  const [auditoireOptions, setAuditoireOptions] = useState([]);
  const [filteredAuditoires, setFilteredAuditoires] = useState([]);
  const [teacherOptions, setTeacherOptions] = useState([]);
  const [sectionOptions, setSectionOptions] = useState([]);
  const [filiereOptions, setFiliereOptions] = useState([]);

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
        const [sectionsRes, filieresRes, audRes, usersRes] = await Promise.all([
          getSections(),
          getFilieres(),
          getAuditoires(),
          getUsers({ role: "enseignant" })
        ]);

        setSectionOptions(sectionsRes.data.results || sectionsRes.data);
        setFiliereOptions(filieresRes.data.results || filieresRes.data);
        setAuditoireOptions(audRes.data.results || audRes.data);
        setTeacherOptions(usersRes.data.results || usersRes.data);
      } catch (err) {
        console.log("Erreur filtres:", err);
      }
    };

    loadFilters();
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

  // Modal: load auditoires & teachers
  useEffect(() => {
    if (canCreateCourses()) {
      getAuditoires().then((res) => {
        const all = res.data.results || res.data;
        setAuditoireOptions(all);

        if (user?.role === "chef_section") {
          const filtered = all.filter(
            (a) => a.section === user.section_id
          );
          setFilteredAuditoires(filtered);

          if (filtered.length === 1) {
            setCourseData((prev) => ({
              ...prev,
              auditoire: filtered[0].id
            }));
          }
        } else {
          setFilteredAuditoires(all);
        }
      });

      getUsers({ role: "enseignant" }).then((res) => {
        setTeacherOptions(res.data.results || res.data);
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
      auditoire:
        user?.role === "chef_section" && filteredAuditoires.length > 0
          ? filteredAuditoires[0].id
          : ""
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
      auditoire: course.auditoire
    });

    setShowCourseModal(true);
  };

  // Save course
  const saveCourse = async () => {
    try {
      const dataToSave = {
        ...courseData,
        titulaire: parseInt(courseData.titulaire)
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

  return (
    <Container fluid className="px-4 py-3">

      {/* HEADER */}
      <Row className="mb-4">
        <Col className="d-flex justify-content-between align-items-center">
          <h2 className="fw-bold">
            {user?.role === "etudiant" ? "Mes Cours" : "Gestion des Cours"}
          </h2>

          {canCreateCourses() && (
            <Button className="px-3" onClick={openCreateModal}>
              <i className="fas fa-plus me-2"></i>Nouveau Cours
            </Button>
          )}
        </Col>
      </Row>

      {/* FILTERS */}
      {user?.role !== "etudiant" && (
        <Row className="p-3 mb-4 bg-white border rounded shadow-sm">
          <Col md={12}>
            <h5 className="fw-bold mb-3">Filtres</h5>
          </Col>

          {user?.role === "sga" && <Col md={3}>
            <Form.Group className="mb-3">
              <Form.Label>Section</Form.Label>
              <Form.Select
                name="section"
                value={filters.section}
                onChange={(e) =>
                  dispatch(setFilter({ filterName: "section", value: e.target.value }))
                }
              >
                <option value="">Toutes</option>
                {sectionOptions.map((o) => {
                  console.log('dd',o);
                  
                  return( 
                  <option key={o.id} value={o.id}>
                    {o.nom}
                  </option>
                )})}
              </Form.Select>
            </Form.Group>
          </Col>}

          <Col md={3}>
            <Form.Group className="mb-3">
              <Form.Label>Filière</Form.Label>
              <Form.Select
                name="filiere"
                value={filters.filiere}
                onChange={(e) =>
                  dispatch(setFilter({ filterName: "filiere", value: e.target.value }))
                }
              >
                <option value="">Toutes</option>
                {filiereOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.nom}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>

          <Col md={3}>
            <Form.Group className="mb-3">
              <Form.Label>Auditoire</Form.Label>
              <Form.Select
                name="auditoire"
                value={filters.auditoire}
                onChange={(e) =>
                  dispatch(
                    setFilter({ filterName: "auditoire", value: e.target.value })
                  )
                }
              >
                <option value="">Tous</option>
                {auditoireOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.nom}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>

          <Col md={3}>
            <Form.Group className="mb-3">
              <Form.Label>Vacation</Form.Label>
              <Form.Select
                name="vacation"
                value={filters.vacation}
                onChange={(e) =>
                  dispatch(
                    setFilter({ filterName: "vacation", value: e.target.value })
                  )
                }
              >
                <option value="">Toutes</option>
                {vacationOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>

          <Col md={3}>
            <Form.Group className="mb-3">
              <Form.Label>Niveau</Form.Label>
              <Form.Select
                name="niveau"
                value={filters.niveau}
                onChange={(e) =>
                  dispatch(
                    setFilter({ filterName: "niveau", value: e.target.value })
                  )
                }
              >
                <option value="">Tous</option>
                {niveauOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>

          <Col md={12} className="text-end">
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => dispatch(clearFilters())}
            >
              Réinitialiser les filtres
            </Button>
          </Col>
        </Row>
      )}

      {/* COURSES LIST */}
      {loading && <Spinner animation="border" />}

      {!loading && courses.length === 0 && (
        <div className="text-center py-5 text-muted">
          <i className="fas fa-book fa-3x mb-3"></i>
          <h4>Aucun cours disponible</h4>
        </div>
      )}

      <Row>
        {courses.map((course) => (
          <Col lg={6} key={course.id} className="mb-4">
            <div className="p-4 bg-white border rounded shadow-sm h-100">
              <div className="d-flex justify-content-between">
                <div>
                  <h5 className="fw-bold mb-1">
                    {course.name} ({course.code})
                  </h5>
                  <div className="small text-muted">
                    <i className="fas fa-user-tie me-2"></i>
                    {course.titulaire_name || "N/A"} • {course.credits} crédits
                  </div>
                </div>

                <div>
                  <LinkContainer to={`/courses/${course.id}`}>
                    <Button size="sm" className="me-2">
                      Voir
                    </Button>
                  </LinkContainer>

                  {canCreateCourses() && (
                    <Button
                      size="sm"
                      variant="outline-secondary"
                      onClick={() => openEditModal(course)}
                    >
                      Modifier
                    </Button>
                  )}
                </div>
              </div>

              <p className="mt-3 text-muted small">{course.description}</p>

              <div className="text-muted small">
                <i className="fas fa-university me-2"></i>
                {course.auditoire_name}
              </div>
            </div>
          </Col>
        ))}
      </Row>

      {/* PAGINATION */}
      {pagination.totalPages > 1 && (
        <Row className="mt-3">
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
      )}

      {/* MODAL */}
      <Modal show={showCourseModal} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedCourse ? "Modifier le Cours" : "Nouveau Cours"}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Nom du cours</Form.Label>
              <Form.Control
                type="text"
                value={courseData.name}
                onChange={(e) =>
                  setCourseData({ ...courseData, name: e.target.value })
                }
                required
              />
            </Form.Group>

            <Row>
              <Col md={8}>
                <Form.Group className="mb-3">
                  <Form.Label>Auditoire</Form.Label>
                  <Form.Select
                    value={courseData.auditoire}
                    onChange={(e) =>
                      setCourseData({
                        ...courseData,
                        auditoire: e.target.value
                      })
                    }
                    disabled={
                      user?.role === "chef_section" &&
                      filteredAuditoires.length === 1
                    }
                    required
                  >
                    <option value="">Choisir...</option>
                    {filteredAuditoires.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.nom}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label>Crédits</Form.Label>
                  <Form.Control
                    type="number"
                    value={courseData.credits}
                    min="1"
                    onChange={(e) =>
                      setCourseData({
                        ...courseData,
                        credits: parseInt(e.target.value)
                      })
                    }
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Enseignant titulaire</Form.Label>
              <Form.Select
                value={courseData.titulaire}
                onChange={(e) =>
                  setCourseData({
                    ...courseData,
                    titulaire: e.target.value
                  })
                }
                required
              >
                <option value="">Choisir...</option>
                {teacherOptions.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>

            <Form.Group>
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={courseData.description}
                onChange={(e) =>
                  setCourseData({
                    ...courseData,
                    description: e.target.value
                  })
                }
              />
            </Form.Group>
          </Form>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowCourseModal(false)}>
            Annuler
          </Button>

          <Button
            variant="primary"
            onClick={saveCourse}
            disabled={loading}
          >
            Sauvegarder
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default Courses;
