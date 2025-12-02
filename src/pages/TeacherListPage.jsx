import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useLocation } from 'react-router-dom';
import { fetchTeachers } from '../store/slices/usersSlice';
import { Container, Row, Col, Card, Table, Spinner, Alert } from 'react-bootstrap';

const TeacherListPage = () => {
  const dispatch = useDispatch();
  const { teachers } = useSelector((state) => state.users);
  const { loading, list: teacherList, error } = teachers;

  const params = useParams(); // Get parameters from the route path (e.g., /teachers/filiere/:filiereId)
  const location = useLocation(); // Get query parameters (e.g., /teachers?section=1)
console.log('teachr ',teachers);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const filters = {};

    // Extract filters from route params
    // For teachers, filter by filiere/section of courses taught
    if (params.filiereId) filters.courses_held__auditoire__filiere = params.filiereId;
    if (params.sectionId) filters.courses_held__auditoire__filiere__section = params.sectionId;

    // Extract filters from query params (can override route params or add more)
    if (queryParams.get('filiere')) filters.courses_held__auditoire__filiere = queryParams.get('filiere');
    if (queryParams.get('section')) filters.courses_held__auditoire__filiere__section = queryParams.get('section');
    if (queryParams.get('page')) filters.page = queryParams.get('page');
    if (queryParams.get('page_size')) filters.page_size = queryParams.get('page_size');
    if (queryParams.get('search')) filters.search = queryParams.get('search');
    if (queryParams.get('ordering')) filters.ordering = queryParams.get('ordering');

    dispatch(fetchTeachers(filters));
  }, [dispatch, params, location.search]);

  if (loading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Chargement des enseignants...</span>
        </Spinner>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          Erreur lors du chargement des enseignants : {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="py-3">
      <Row className="mb-4">
        <Col>
          <h2 className="text-primary fw-bold">Liste des Enseignants et Assistants</h2>
          <p className="text-muted">Gérez les informations détaillées des enseignants et assistants.</p>
        </Col>
      </Row>

      <Row>
        <Col>
          <Card className="card-custom">
            <Card.Header>
              <h5 className="fw-bold mb-0">Enseignants et Assistants ({teacherList.length})</h5>
            </Card.Header>
            <Card.Body>
              {teacherList.length === 0 ? (
                <Alert variant="info">Aucun enseignant ou assistant trouvé avec les filtres appliqués.</Alert>
              ) : (
                <Table responsive hover striped bordered>
                  <tbody>
                      {teacherList.map((teacher) => (
                        <tr key={teacher.id}>
                          <td>{teacher.id}</td>
                          <td>{teacher.last_name}</td>
                          <td>{teacher.first_name}</td>
                          <td>{teacher.email}</td>
                          <td>{teacher.role}</td>

                          {/* FILIERES */}
                          <td>
                            {teacher.filieres && teacher.filieres.length > 0
                              ? teacher.filieres.map((f) => f.nom).join(", ")
                              : "N/A"}
                          </td>

                          {/* SECTIONS */}
                          <td>
                            {teacher.sections && teacher.sections.length > 0
                              ? teacher.sections.map((s) => s.nom).join(", ")
                              : "N/A"}
                          </td>
                        </tr>
                      ))}
                    </tbody>

                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default TeacherListPage;
