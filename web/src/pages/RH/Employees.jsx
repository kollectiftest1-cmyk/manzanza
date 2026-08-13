'use client';

import React, { useState, useEffect } from 'react';
import { Container, Tabs, Tab, Row, Col, Spinner, Alert } from 'react-bootstrap';
import EmployeeList from '../../components/RH/EmployeeList';
import PotentialEmployeeList from '../../components/RH/PotentialEmployeeList';
import { getEmployees, getPotentialEmployees } from '../../services/hrService';

export default function HrEmployeePage() {
  const [key, setKey] = useState('employees');
  const [employees, setEmployees] = useState([]);
  const [potentialEmployees, setPotentialEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEmployees = async () => {
    try {
      const response = await getEmployees();
      setEmployees(response.data.results || response.data);
    } catch (err) {
      setError('Erreur lors du chargement des employés.');
      console.error(err);
    }
  };

  const fetchPotentialEmployees = async () => {
    try {
      const response = await getPotentialEmployees();
      setPotentialEmployees(response.data);
    } catch (err) {
      setError('Erreur lors du chargement des employés potentiels.');
      console.error(err);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    await Promise.all([fetchEmployees(), fetchPotentialEmployees()]);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const refreshData = () => {
    fetchData();
  };

  return (
    <Container fluid className="p-4">
      <Row>
        <Col>
          <h2 className="mb-4">Gestion des Employés</h2>
        </Col>
      </Row>

      {error && <Alert variant="danger">{error}</Alert>}

      <Tabs
        id="hr-employee-tabs"
        activeKey={key}
        onSelect={(k) => setKey(k)}
        className="mb-3"
      >
        <Tab eventKey="employees" title="Employés Actuels">
          {loading ? (
            <div className="text-center">
              <Spinner animation="border" />
            </div>
          ) : (
            <EmployeeList employees={employees} onRefresh={refreshData} />
          )}
        </Tab>
        <Tab eventKey="potential" title="Employés Potentiels">
          {loading ? (
            <div className="text-center">
              <Spinner animation="border" />
            </div>
          ) : (
            <PotentialEmployeeList potentialEmployees={potentialEmployees} onRefresh={refreshData} />
          )}
        </Tab>
      </Tabs>
    </Container>
  );
}
