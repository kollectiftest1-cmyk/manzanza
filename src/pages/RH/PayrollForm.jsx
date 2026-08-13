'use client';

import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Spinner, Alert } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { getPayroll, createPayroll, updatePayroll, getEmployees } from '../../services/hrService';
import { toast } from 'react-toastify';

export default function PayrollForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [formData, setFormData] = useState({
    employee: '',
    period_start: '',
    period_end: '',
    base_salary: '',
    bonuses: 0,
    deductions: 0,
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
          const payrollRes = await getPayroll(id);
          setFormData({
            employee: payrollRes.data.employee,
            period_start: payrollRes.data.period_start,
            period_end: payrollRes.data.period_end,
            base_salary: payrollRes.data.base_salary,
            bonuses: payrollRes.data.bonuses,
            deductions: payrollRes.data.deductions,
          });
        }
      } catch (err) {
        setError('Erreur lors du chargement des données.');
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

  const handleEmployeeChange = (e) => {
    const { value } = e.target;
    const selectedEmployee = employees.find(emp => emp.id.toString() === value);
    if (selectedEmployee) {
      setFormData({
        ...formData,
        employee: selectedEmployee.id,
        base_salary: selectedEmployee.base_salary,
      });
    } else {
        setFormData({ ...formData, employee: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (id) {
        await updatePayroll(id, formData);
        toast.success('Fiche de paie mise à jour avec succès.');
      } else {
        await createPayroll(formData);
        toast.success('Fiche de paie créée avec succès.');
      }
      navigate('/rh/payrolls');
    } catch (err) {
      setError('Une erreur est survenue lors de la soumission.');
      toast.error('Échec de l\'opération.');
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
            <Card.Header as="h4">{id ? 'Modifier la' : 'Créer une'} Fiche de Paie</Card.Header>
            <Card.Body>
              {error && <Alert variant="danger">{error}</Alert>}
              <Form onSubmit={handleSubmit}>
                <Row className="mb-3">
                  <Form.Group as={Col} controlId="employee">
                    <Form.Label>Employé</Form.Label>
                    <Form.Select
                      name="employee"
                      value={formData.employee}
                      onChange={handleEmployeeChange}
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
                  <Form.Group as={Col} md={6} controlId="period_start">
                    <Form.Label>Début de la période</Form.Label>
                    <Form.Control
                      type="date"
                      name="period_start"
                      value={formData.period_start}
                      onChange={handleInputChange}
                      required
                    />
                  </Form.Group>
                  <Form.Group as={Col} md={6} controlId="period_end">
                    <Form.Label>Fin de la période</Form.Label>
                    <Form.Control
                      type="date"
                      name="period_end"
                      value={formData.period_end}
                      onChange={handleInputChange}
                      required
                    />
                  </Form.Group>
                </Row>
                <Row className="mb-3">
                  <Form.Group as={Col} md={4} controlId="base_salary">
                    <Form.Label>Salaire de base</Form.Label>
                    <Form.Control
                      type="number"
                      name="base_salary"
                      value={formData.base_salary}
                      onChange={handleInputChange}
                      required
                      placeholder="Ex: 2500"
                    />
                  </Form.Group>
                  <Form.Group as={Col} md={4} controlId="bonuses">
                    <Form.Label>Primes / Bonus</Form.Label>
                    <Form.Control
                      type="number"
                      name="bonuses"
                      value={formData.bonuses}
                      onChange={handleInputChange}
                      placeholder="Ex: 200"
                    />
                  </Form.Group>
                  <Form.Group as={Col} md={4} controlId="deductions">
                    <Form.Label>Déductions</Form.Label>
                    <Form.Control
                      type="number"
                      name="deductions"
                      value={formData.deductions}
                      onChange={handleInputChange}
                      placeholder="Ex: 150"
                    />
                  </Form.Group>
                </Row>
                <div className="d-flex justify-content-end gap-2 mt-4">
                  <Button variant="secondary" onClick={() => navigate('/rh/payrolls')}>
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
