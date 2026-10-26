'use client';

import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Spinner, Alert } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { getContract, createContract, updateContract, getEmployees } from '../../services/hrService';
import { toast } from 'react-toastify';
import { notifyError } from "../../utils/notify"

export default function ContractForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [formData, setFormData] = useState({
    employee: '',
    contract_type: 'CDI',
    start_date: '',
    end_date: '',
    salary: '',
    hours_per_week: 40,
    status: 'actif',
  });
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const empRes = await getEmployees();
        setEmployees(empRes.data.results || empRes.data);

        if (id) {
          const contractRes = await getContract(id);
          setFormData({
            employee: contractRes.data.employee,
            contract_type: contractRes.data.contract_type,
            start_date: contractRes.data.start_date,
            end_date: contractRes.data.end_date || '',
            salary: contractRes.data.salary,
            hours_per_week: contractRes.data.hours_per_week,
            status: contractRes.data.status,
          });
        }
      } catch (err) {
        notifyError(err, 'Erreur lors du chargement des données.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [id]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (id) {
        await updateContract(id, formData);
        toast.success('Contrat mis à jour avec succès.');
      } else {
        await createContract(formData);
        toast.success('Contrat créé avec succès.');
      }
      navigate('/rh/contracts');
    } catch (err) {
      notifyError(err, 'Une erreur est survenue lors de la soumission.');
      notifyError(err, 'Échec de l\'opération.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !employees.length) {
    return <div className="text-center p-4"><Spinner animation="border" /></div>;
  }

  return (
    <Container fluid className="p-4">
      <Row>
        <Col md={{ span: 8, offset: 2 }}>
          <Card className="shadow-sm">
            <Card.Header as="h4">{id ? 'Modifier le' : 'Créer un'} Contrat</Card.Header>
            <Card.Body>
              {error && <Alert variant="danger">{error}</Alert>}
              <Form onSubmit={handleSubmit}>
                <Row className="mb-3">
                  <Form.Group as={Col} controlId="employee">
                    <Form.Label>Employé</Form.Label>
                    <Form.Select
                      name="employee"
                      value={formData.employee}
                      onChange={handleInputChange}
                      required
                      disabled={!!id}
                    >
                      <option value="">Sélectionner un employé...</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.user_name}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Row>
                <Row className="mb-3">
                  <Form.Group as={Col} md={6} controlId="contract_type">
                    <Form.Label>Type de Contrat</Form.Label>
                    <Form.Select
                      name="contract_type"
                      value={formData.contract_type}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="CDI">CDI</option>
                      <option value="CDD">CDD</option>
                      <option value="stage">Stage</option>
                      <option value="vacation">Vacation</option>
                    </Form.Select>
                  </Form.Group>
                  <Form.Group as={Col} md={6} controlId="status">
                    <Form.Label>Statut</Form.Label>
                    <Form.Select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="actif">Actif</option>
                      <option value="termine">Terminé</option>
                      <option value="annule">Annulé</option>
                      <option value="en_attente">En attente</option>
                    </Form.Select>
                  </Form.Group>
                </Row>
                <Row className="mb-3">
                  <Form.Group as={Col} md={6} controlId="start_date">
                    <Form.Label>Date de début</Form.Label>
                    <Form.Control
                      type="date"
                      name="start_date"
                      value={formData.start_date}
                      onChange={handleInputChange}
                      required
                    />
                  </Form.Group>
                  <Form.Group as={Col} md={6} controlId="end_date">
                    <Form.Label>Date de fin (optionnel)</Form.Label>
                    <Form.Control
                      type="date"
                      name="end_date"
                      value={formData.end_date}
                      onChange={handleInputChange}
                    />
                  </Form.Group>
                </Row>
                <Row className="mb-3">
                  <Form.Group as={Col} md={6} controlId="salary">
                    <Form.Label>Salaire</Form.Label>
                    <Form.Control
                      type="number"
                      name="salary"
                      value={formData.salary}
                      onChange={handleInputChange}
                      required
                      placeholder="Ex: 2500"
                    />
                  </Form.Group>
                  <Form.Group as={Col} md={6} controlId="hours_per_week">
                    <Form.Label>Heures par semaine</Form.Label>
                    <Form.Control
                      type="number"
                      name="hours_per_week"
                      value={formData.hours_per_week}
                      onChange={handleInputChange}
                      placeholder="Ex: 40"
                    />
                  </Form.Group>
                </Row>
                <div className="d-flex justify-content-end gap-2 mt-4">
                  <Button variant="secondary" onClick={() => navigate('/rh/contracts')}>
                    Annuler
                  </Button>
                  <Button variant="primary" type="submit" disabled={loading}>
                    {loading ? <Spinner as="span" animation="border" size="sm" /> : (id ? 'Mettre à jour' : 'Créer')}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
