'use client';

import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Spinner, Alert } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { getEmployee, updateEmployee } from '../../services/hrService';
import { toast } from 'react-toastify';

export default function EmployeeForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [formData, setFormData] = useState({
    position: '',
    department: '',
    hire_date: '',
    end_date: '',
    base_salary: '',
    currency: 'USD',
    status: 'actif',
    emergency_contact: '',
    emergency_phone: '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [employeeName, setEmployeeName] = useState('');

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        if (id) {
          const empRes = await getEmployee(id);
          setEmployeeName(empRes.data.user_name);
          setFormData({
            position: empRes.data.position,
            department: empRes.data.department || '',
            hire_date: empRes.data.hire_date,
            end_date: empRes.data.end_date || '',
            base_salary: empRes.data.base_salary,
            currency: empRes.data.currency || 'USD',
            status: empRes.data.status,
            emergency_contact: empRes.data.emergency_contact || '',
            emergency_phone: empRes.data.emergency_phone || '',
            notes: empRes.data.notes || '',
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await updateEmployee(id, formData);
      toast.success('Profil employé mis à jour avec succès.');
      navigate('/rh/employees');
    } catch (err) {
      setError('Une erreur est survenue lors de la soumission.');
      toast.error('Échec de l\'opération.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center p-4"><Spinner animation="border" /></div>;
  }

  return (
    <Container fluid className="p-4">
      <Row>
        <Col md={{ span: 8, offset: 2 }}>
          <Card className="shadow-sm">
            <Card.Header as="h4">Modifier le Profil Employé : {employeeName}</Card.Header>
            <Card.Body>
              {error && <Alert variant="danger">{error}</Alert>}
              <Form onSubmit={handleSubmit}>
                <Row className="mb-3">
                  <Form.Group as={Col} md={6} controlId="position">
                    <Form.Label>Poste</Form.Label>
                    <Form.Select
                      name="position"
                      value={formData.position}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="professeur">Professeur</option>
                      <option value="assistant">Assistant</option>
                      <option value="chef_departement">Chef de Département</option>
                      <option value="chef_section">Chef de Section</option>
                      <option value="bibliothecaire">Bibliothécaire</option>
                      <option value="appariteur">Appariteur</option>
                      <option value="comptable">Comptable</option>
                      <option value="secretaire">Secrétaire</option>
                      <option value="technicien_it">Technicien IT</option>
                      <option value="personnel_admin">Personnel Administratif</option>
                    </Form.Select>
                  </Form.Group>
                  <Form.Group as={Col} md={6} controlId="department">
                    <Form.Label>Département</Form.Label>
                    <Form.Control
                      type="text"
                      name="department"
                      value={formData.department}
                      onChange={handleInputChange}
                    />
                  </Form.Group>
                </Row>
                <Row className="mb-3">
                  <Form.Group as={Col} md={6} controlId="hire_date">
                    <Form.Label>Date d'embauche</Form.Label>
                    <Form.Control
                      type="date"
                      name="hire_date"
                      value={formData.hire_date}
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
                    />
                  </Form.Group>
                  <Form.Group as={Col} md={4} controlId="currency">
                    <Form.Label>Devise</Form.Label>
                    <Form.Select
                      name="currency"
                      value={formData.currency}
                      onChange={handleInputChange}
                    >
                      <option value="USD">USD</option>
                      <option value="CDF">CDF</option>
                      <option value="EUR">EUR</option>
                    </Form.Select>
                  </Form.Group>
                  <Form.Group as={Col} md={4} controlId="status">
                    <Form.Label>Statut</Form.Label>
                    <Form.Select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="actif">Actif</option>
                      <option value="conge">En congé</option>
                      <option value="suspendu">Suspendu</option>
                      <option value="demissionne">Démissionné</option>
                      <option value="retraite">Retraité</option>
                    </Form.Select>
                  </Form.Group>
                </Row>
                <Row className="mb-3">
                  <Form.Group as={Col} md={6} controlId="emergency_contact">
                    <Form.Label>Contact d'urgence</Form.Label>
                    <Form.Control
                      type="text"
                      name="emergency_contact"
                      value={formData.emergency_contact}
                      onChange={handleInputChange}
                    />
                  </Form.Group>
                  <Form.Group as={Col} md={6} controlId="emergency_phone">
                    <Form.Label>Téléphone d'urgence</Form.Label>
                    <Form.Control
                      type="text"
                      name="emergency_phone"
                      value={formData.emergency_phone}
                      onChange={handleInputChange}
                    />
                  </Form.Group>
                </Row>
                <Row className="mb-3">
                  <Form.Group as={Col} controlId="notes">
                    <Form.Label>Notes</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                    />
                  </Form.Group>
                </Row>
                <div className="d-flex justify-content-end gap-2 mt-4">
                  <Button variant="secondary" onClick={() => navigate('/rh/employees')}>
                    Annuler
                  </Button>
                  <Button variant="primary" type="submit" disabled={loading}>
                    {loading ? <Spinner as="span" animation="border" size="sm" /> : 'Mettre à jour'}
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
