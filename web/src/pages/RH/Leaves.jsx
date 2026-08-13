'use client';

import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Spinner, Alert, Tabs, Tab } from 'react-bootstrap';
import LeaveList from '../../components/RH/LeaveList';
import { getLeaves } from '../../services/hrService';

export default function HrLeavesPage() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [key, setKey] = useState('leaves');

  const fetchLeaves = async () => {
    try {
      const response = await getLeaves();
      setLeaves(response.data.results || response.data);
    } catch (err) {
      setError('Erreur lors du chargement des congés.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const refreshData = () => {
    fetchLeaves();
  };

  return (
    <Container fluid className="p-4">
      <Row>
        <Col>
          <h2 className="mb-4">Gestion des Congés</h2>
        </Col>
      </Row>

      {error && <Alert variant="danger">{error}</Alert>}

      <Tabs
        id="hr-leave-tabs"
        activeKey={key}
        onSelect={(k) => setKey(k)}
        className="mb-3"
      >
        <Tab eventKey="leaves" title="Tous les Congés">
          {loading ? (
            <div className="text-center">
              <Spinner animation="border" />
            </div>
          ) : (
            <LeaveList leaves={leaves} onRefresh={refreshData} />
          )}
        </Tab>
      </Tabs>
    </Container>
  );
}
