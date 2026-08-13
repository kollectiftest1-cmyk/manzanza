'use client';

import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Tabs, Tab, Spinner, Alert, Badge, Table, Button } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { getEmployee, getContracts, getPayrolls, getLeaves } from '../../services/hrService';
import { FiEdit, FiArrowLeft } from 'react-icons/fi';

export default function EmployeeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState(null);
  const [contracts, setContracts] = useState([]);
  const [payrolls, setPayrolls] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [empRes, contractsRes, payrollsRes, leavesRes] = await Promise.all([
          getEmployee(id),
          getContracts({ employee: id }),
          getPayrolls({ employee: id }),
          getLeaves({ employee: id }),
        ]);

        setEmployee(empRes.data);
        setContracts(contractsRes.data.results || contractsRes.data);
        setPayrolls(payrollsRes.data.results || payrollsRes.data);
        setLeaves(leavesRes.data.results || leavesRes.data);
      } catch (err) {
        setError('Erreur lors du chargement des détails de l\'employé.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return <div className="text-center p-5"><Spinner animation="border" /></div>;
  }

  if (error) {
    return <Container className="p-4"><Alert variant="danger">{error}</Alert></Container>;
  }

  if (!employee) {
    return <Container className="p-4"><Alert variant="warning">Employé non trouvé.</Alert></Container>;
  }

  return (
    <Container fluid className="p-4">
      <Button variant="outline-secondary" className="mb-3" onClick={() => navigate('/rh/employees')}>
        <FiArrowLeft className="me-2" /> Retour à la liste
      </Button>

      <Row className="mb-4">
        <Col md={4}>
          <Card className="shadow-sm h-100">
            <Card.Body>
              <div className="text-center mb-3">
                <div className="bg-primary text-white rounded-circle d-inline-flex align-items-center justify-content-center" style={{ width: '80px', height: '80px', fontSize: '2rem' }}>
                  {employee.user_name.charAt(0)}
                </div>
                <h4 className="mt-2">{employee.user_name}</h4>
                <p className="text-muted">{employee.position}</p>
                <Badge bg={employee.status === 'actif' ? 'success' : 'secondary'}>{employee.status}</Badge>
              </div>
              <hr />
              <p><strong>Email:</strong> {employee.user_email}</p>
              <p><strong>Matricule:</strong> {employee.employee_id}</p>
              <p><strong>Département:</strong> {employee.department || '-'}</p>
              <p><strong>Date d'embauche:</strong> {employee.hire_date}</p>
              <p><strong>Salaire de base:</strong> {employee.base_salary} {employee.currency}</p>
              <div className="d-grid gap-2 mt-3">
                <Button variant="outline-primary" onClick={() => navigate(`/rh/employees/edit/${employee.id}`)}>
                  <FiEdit className="me-2" /> Modifier Profil
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={8}>
          <Card className="shadow-sm h-100">
            <Card.Body>
              <Tabs defaultActiveKey="contracts" id="employee-details-tabs" className="mb-3">
                <Tab eventKey="contracts" title={`Contrats (${contracts.length})`}>
                  <div className="table-responsive">
                    <Table hover size="sm">
                      <thead>
                        <tr>
                          <th>Type</th>
                          <th>Début</th>
                          <th>Fin</th>
                          <th>Statut</th>
                        </tr>
                      </thead>
                      <tbody>
                        {contracts.length > 0 ? (
                          contracts.map(contract => (
                            <tr key={contract.id}>
                              <td>{contract.contract_type}</td>
                              <td>{contract.start_date}</td>
                              <td>{contract.end_date || '-'}</td>
                              <td><Badge bg="info">{contract.status}</Badge></td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan="4" className="text-center">Aucun contrat trouvé.</td></tr>
                        )}
                      </tbody>
                    </Table>
                  </div>
                </Tab>
                <Tab eventKey="payrolls" title={`Paies (${payrolls.length})`}>
                  <div className="table-responsive">
                    <Table hover size="sm">
                      <thead>
                        <tr>
                          <th>Période</th>
                          <th>Net</th>
                          <th>Statut</th>
                          <th>Date Paiement</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payrolls.length > 0 ? (
                          payrolls.map(payroll => (
                            <tr key={payroll.id}>
                              <td>{payroll.period_start} - {payroll.period_end}</td>
                              <td>{payroll.net_salary} {payroll.currency}</td>
                              <td><Badge bg={payroll.status === 'paye' ? 'success' : 'warning'}>{payroll.status}</Badge></td>
                              <td>{payroll.payment_date || '-'}</td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan="4" className="text-center">Aucune fiche de paie trouvée.</td></tr>
                        )}
                      </tbody>
                    </Table>
                  </div>
                </Tab>
                <Tab eventKey="leaves" title={`Congés (${leaves.length})`}>
                  <div className="table-responsive">
                    <Table hover size="sm">
                      <thead>
                        <tr>
                          <th>Type</th>
                          <th>Début</th>
                          <th>Fin</th>
                          <th>Statut</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leaves.length > 0 ? (
                          leaves.map(leave => (
                            <tr key={leave.id}>
                              <td>{leave.leave_type}</td>
                              <td>{leave.start_date}</td>
                              <td>{leave.end_date}</td>
                              <td>
                                <Badge bg={leave.status === 'approuve' ? 'success' : leave.status === 'rejete' ? 'danger' : 'warning'}>
                                  {leave.status}
                                </Badge>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr><td colSpan="4" className="text-center">Aucun congé trouvé.</td></tr>
                        )}
                      </tbody>
                    </Table>
                  </div>
                </Tab>
                <Tab eventKey="emergency" title="Urgence">
                  <p><strong>Contact d'urgence:</strong> {employee.emergency_contact || 'Non renseigné'}</p>
                  <p><strong>Téléphone d'urgence:</strong> {employee.emergency_phone || 'Non renseigné'}</p>
                  <hr />
                  <p><strong>Notes:</strong></p>
                  <p className="text-muted">{employee.notes || 'Aucune note.'}</p>
                </Tab>
              </Tabs>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
