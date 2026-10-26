'use client';

import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Spinner, Alert, Tabs, Tab } from 'react-bootstrap';
import ContractList from '../../components/rh/ContractList';
import { getContracts } from '../../services/hrService';
import { notifyError } from "../../utils/notify"

export default function HrContractsPage() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [key, setKey] = useState('contracts');

  const fetchContracts = async () => {
    try {
      const response = await getContracts();
      setContracts(response.data.results || response.data);
    } catch (err) {
      notifyError(err, 'Erreur lors du chargement des contrats.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  const refreshData = () => {
    fetchContracts();
  };

  return (
    <Container fluid className="p-4">
      <Row>
        <Col>
          <h2 className="mb-4">Gestion des Contrats</h2>
        </Col>
      </Row>

      {error && <Alert variant="danger">{error}</Alert>}

      <Tabs
        id="hr-contract-tabs"
        activeKey={key}
        onSelect={(k) => setKey(k)}
        className="mb-3"
      >
        <Tab eventKey="contracts" title="Tous les Contrats">
          {loading ? (
            <div className="text-center">
              <Spinner animation="border" />
            </div>
          ) : (
            <ContractList contracts={contracts} onRefresh={refreshData} />
          )}
        </Tab>
      </Tabs>
    </Container>
  );
}
