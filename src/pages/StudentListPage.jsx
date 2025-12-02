import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useLocation } from 'react-router-dom';
import { fetchStudents } from '../store/slices/usersSlice';
import { Container, Row, Col, Card, Table, Spinner, Alert } from 'react-bootstrap';

const StudentListPage = () => {
  const dispatch = useDispatch();
  const { students } = useSelector((state) => state.users);
  const { loading, list: studentList, error } = students;
  console.log('students',studentList);
  

  const params = useParams(); // Get parameters from the route path (e.g., /students/filiere/:filiereId)
  const location = useLocation(); // Get query parameters (e.g., /students?auditoire=1)
  const studentForFiliere= studentList.filter(stu=>stu?.filiere?.id==params.filiereId);
  const studentForSection= studentList.filter(stu=>stu?.section?.id==params.sectionId);
  // console.log('studentForFiliere',studentForFiliere);
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const filters = {};

    // Extract filters from route params
    if (params.auditoireId) filters.auditoire = params.auditoireId;
    if (params.filiereId) filters.filiere = params.filiereId;
    if (params.sectionId) filters.section = params.sectionId;

    // Extract filters from query params (can override route params or add more)
    if (queryParams.get('auditoire')) filters.auditoire = queryParams.get('auditoire');
    if (queryParams.get('filiere')) filters.filiere = queryParams.get('filiere');
    if (queryParams.get('section')) filters.section = queryParams.get('section');
    if (queryParams.get('page')) filters.page = queryParams.get('page');
    if (queryParams.get('page_size')) filters.page_size = queryParams.get('page_size');
    if (queryParams.get('search')) filters.search = queryParams.get('search');
    if (queryParams.get('ordering')) filters.ordering = queryParams.get('ordering');


    dispatch(fetchStudents(filters));
  }, [dispatch, params, location.search]);

  if (loading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Chargement des étudiants...</span>
        </Spinner>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          Erreur lors du chargement des étudiants : {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="py-3">
      <Row className="mb-4">
        <Col>
          <h2 className="text-primary fw-bold">Liste des Étudiants</h2>
          <p className="text-muted">Gérez les informations détaillées des étudiants.</p>
        </Col>
      </Row>

      <Row>
        <Col>
          <Card className="card-custom">
            <Card.Header>
              <h5 className="fw-bold mb-0">Étudiants ({studentList.length})</h5>
            </Card.Header>
            <Card.Body>
              {studentList.length === 0 ? (
                <Alert variant="info">Aucun étudiant trouvé avec les filtres appliqués.</Alert>
              ) : (
                <Table responsive hover striped bordered>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Nom</th>
                      <th>Prénom</th>
                      <th>Email</th>
                      <th>Matricule</th>
                      <th>Auditoire</th>
                      <th>Filière</th>
                      <th>Section</th>
                      <th>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentList.map((student) => (
                      <tr key={student.id}>
                        <td>{student.id}</td>
                        <td>{student.last_name}</td>
                        <td>{student.first_name}</td>
                        <td>{student.email}</td>
                        <td>{student.matricule || 'N/A'}</td>
                        <td>{student.auditoire_name || 'N/A'}</td>
                        <td>{student?.filiere?.nom || 'N/A'}</td>
                        <td>{student?.section?.nom || 'N/A'}</td>
                        <td>{student.status}</td>
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

export default StudentListPage;
