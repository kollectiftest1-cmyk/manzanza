'use client';

import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Spinner, Alert, Tabs, Tab } from 'react-bootstrap';
import PayrollList from '../../components/RH/PayrollList';
import { getPayrolls } from '../../services/hrService';

export default function HrPayrollsPage() {
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [key, setKey] = useState('payrolls');

  const fetchPayrolls = async () => {
    try {
      const response = await getPayrolls();
      setPayrolls(response.data.results || response.data);
    } catch (err) {
      setError('Erreur lors du chargement des fiches de paie.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrolls();
  }, []);

  const refreshData = () => {
    fetchPayrolls();
  };

  return (
    <Container fluid className="p-4">
      <Row>
        <Col>
          <h2 className="mb-4">Gestion des Fiches de Paie</h2>
        </Col>
      </Row>

      {error && <Alert variant="danger">{error}</Alert>}

      <Tabs
        id="hr-payroll-tabs"
        activeKey={key}
        onSelect={(k) => setKey(k)}
        className="mb-3"
      >
        <Tab eventKey="payrolls" title="Toutes les Paies">
          {loading ? (
            <div className="text-center">
              <Spinner animation="border" />
            </div>
          ) : (
            <PayrollList payrolls={payrolls} onRefresh={refreshData} />
          )}
        </Tab>
      </Tabs>
    </Container>
  );
}
