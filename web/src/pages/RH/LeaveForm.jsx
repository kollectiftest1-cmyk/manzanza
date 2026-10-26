'use client';

import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Spinner, Alert } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { getLeave, createLeave, updateLeave, getEmployees } from '../../services/hrService';
import { toast } from 'react-toastify';
import { notifyError } from "../../utils/notify"

export default function LeaveForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [formData, setFormData] = useState({
    employee: '',
    leave_type: 'conge_annuel',
    start_date: '',
    end_date: '',
    reason: '',
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
          const leaveRes = await getLeave(id);
          setFormData({
            employee: leaveRes.data.employee,
            leave_type: leaveRes.data.leave_type,
            start_date: leaveRes.data.start_date,
            end_date: leaveRes.data.end_date,
            reason: leaveRes.data.reason,
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
        await updateLeave(id, formData);
        toast.success('Demande de congé mise à jour avec succès.');
      } else {
        await createLeave(formData);
        toast.success('Demande de congé créée avec succès.');
      }
      navigate('/rh/leaves');
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
            <Card.Header as="h4">{id ? 'Modifier la' : 'Créer une'} Demande de Congé</Card.Header>
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
                  <Form.Group as={Col} md={6} controlId="leave_type">
                    <Form.Label>Type de Congé</Form.Label>
                    <Form.Select
                      name="leave_type"
                      value={formData.leave_type}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="conge_annuel">Congé annuel</option>
                      <option value="conge_maladie">Congé maladie</option>
                      <option value="conge_maternite">Congé maternité</option>
                      <option value="conge_paternite">Congé paternité</option>
                      <option value="conge_sans_solde">Congé sans solde</option>
                      <option value="absence">Absence</option>
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
                    <Form.Label>Date de fin</Form.Label>
                    <Form.Control
                      type="date"
                      name="end_date"
                      value={formData.end_date}
                      onChange={handleInputChange}
                      required
                    />
                  </Form.Group>
                </Row>
                <Row className="mb-3">
                  <Form.Group as={Col} controlId="reason">
                    <Form.Label>Raison</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      name="reason"
                      value={formData.reason}
                      onChange={handleInputChange}
                      required
                    />
                  </Form.Group>
                </Row>
                <div className="d-flex justify-content-end gap-2 mt-4">
                  <Button variant="secondary" onClick={() => navigate('/rh/leaves')}>
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
