'use client';

import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Spinner, Alert } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import { getEmployee, updateEmployee } from '../../services/hrService';
import { toast } from 'react-toastify';
import { notifyError } from "../../utils/notify"

export default function EmployeeForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [formData, setFormData] = useState({
    position: '',
    department: '',
    hire_date: '',
    end_date: '',
    prestation_type: 'permanent',
    salaire_journalier: '',
    salaire_horaire: '',
    currency: 'USD',
    base_monthly_salary: '',
    housing_allowance: '',
    transport_allowance: '',
    dependents: 0,
    statutory_teaching_hours: '',
    extra_hour_rate: '',
    payment_account: '',
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
            prestation_type: empRes.data.prestation_type || 'permanent',
            salaire_journalier: empRes.data.salaire_journalier || '',
            salaire_horaire: empRes.data.salaire_horaire || '',
            currency: empRes.data.currency || 'USD',
            base_monthly_salary: empRes.data.base_monthly_salary || '',
            housing_allowance: empRes.data.housing_allowance || '',
            transport_allowance: empRes.data.transport_allowance || '',
            dependents: empRes.data.dependents ?? 0,
            statutory_teaching_hours: empRes.data.statutory_teaching_hours || '',
            extra_hour_rate: empRes.data.extra_hour_rate || '',
            payment_account: empRes.data.payment_account || '',
            status: empRes.data.status,
            emergency_contact: empRes.data.emergency_contact || '',
            emergency_phone: empRes.data.emergency_phone || '',
            notes: empRes.data.notes || '',
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
      const payload = { ...formData };
      // Convert empty strings to null for optional date fields
      if (!payload.end_date) payload.end_date = null;
      if (!payload.salaire_journalier) payload.salaire_journalier = null;
      if (!payload.salaire_horaire) payload.salaire_horaire = null;
      if (!payload.base_monthly_salary) payload.base_monthly_salary = null;
      ;['housing_allowance', 'transport_allowance', 'statutory_teaching_hours', 'extra_hour_rate'].forEach((k) => { if (payload[k] === '') payload[k] = 0 })
      payload.dependents = Number(payload.dependents) || 0
      await updateEmployee(id, payload);
      toast.success('Profil employé mis à jour avec succès.');
      navigate('/rh/employees');
    } catch (err) {
      notifyError(err, 'Une erreur est survenue lors de la soumission.');
      notifyError(err, 'Échec de l\'opération.');
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
                      <option value="direction">Direction</option>
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
                  <Form.Group as={Col} md={6} controlId="currency">
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
                  <Form.Group as={Col} md={6} controlId="status">
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

                {/* ═══ Section Prestation & Rémunération ═══ */}
                <Card className="mb-3 border-primary border-opacity-25">
                  <Card.Header className="bg-primary bg-opacity-10 py-2">
                    <strong>Type de Prestation & Rémunération</strong>
                  </Card.Header>
                  <Card.Body>
                    <Row className="mb-3">
                      <Form.Group as={Col} md={6} controlId="prestation_type">
                        <Form.Label>Type de prestation *</Form.Label>
                        <Form.Select
                          name="prestation_type"
                          value={formData.prestation_type}
                          onChange={handleInputChange}
                          required
                        >
                          <option value="permanent">Permanent</option>
                          <option value="charge_horaire">Par charge horaire</option>
                        </Form.Select>
                      </Form.Group>

                      {formData.prestation_type === 'permanent' ? (
                        <>
                      <Form.Group as={Col} md={6} className="mb-3" controlId="base_monthly_salary">
                        <Form.Label>Salaire mensuel de base ({formData.currency})</Form.Label>
                        <Form.Control type="number" step="0.01" min="0" name="base_monthly_salary" value={formData.base_monthly_salary} onChange={handleInputChange} />
                        <Form.Text className="text-muted">Mois complet. Les absences non justifiées sont retenues au prorata (jours de référence).</Form.Text>
                      </Form.Group>
                      <Form.Group as={Col} md={6} className="mb-3" controlId="salaire_journalier">
                        <Form.Label>Ou salaire journalier ({formData.currency}/jour)</Form.Label>
                        <Form.Control type="number" step="0.01" min="0" name="salaire_journalier" value={formData.salaire_journalier} onChange={handleInputChange} />
                        <Form.Text className="text-muted">Utilisé seulement si le salaire mensuel n'est pas renseigné.</Form.Text>
                      </Form.Group>
                        </>
                      ) : (
                      <Form.Group as={Col} md={6} className="mb-3" controlId="salaire_horaire">
                        <Form.Label>Taux horaire de vacation ({formData.currency}/h)</Form.Label>
                        <Form.Control type="number" step="0.01" min="0" name="salaire_horaire" value={formData.salaire_horaire} onChange={handleInputChange} />
                        <Form.Text className="text-muted">Heures de cours tenues (appels clôturés) ou heures pointées × ce taux.</Form.Text>
                      </Form.Group>
                      )}
                    </Row>
                    <Row>
                      <Form.Group as={Col} md={4} className="mb-3" controlId="housing_allowance">
                        <Form.Label>Indemnité de logement (non imposable)</Form.Label>
                        <Form.Control type="number" step="0.01" min="0" name="housing_allowance" value={formData.housing_allowance} onChange={handleInputChange} />
                        
                      </Form.Group>
                      <Form.Group as={Col} md={4} className="mb-3" controlId="transport_allowance">
                        <Form.Label>Indemnité de transport (non imposable)</Form.Label>
                        <Form.Control type="number" step="0.01" min="0" name="transport_allowance" value={formData.transport_allowance} onChange={handleInputChange} />
                        
                      </Form.Group>
                      <Form.Group as={Col} md={4} className="mb-3" controlId="dependents">
                        <Form.Label>Personnes à charge</Form.Label>
                        <Form.Control type="number" step="0.01" min="0" name="dependents" value={formData.dependents} onChange={handleInputChange} />
                        <Form.Text className="text-muted">Réduit l'IPR (2 % par personne, 9 max).</Form.Text>
                      </Form.Group>
                    </Row>
                    <Row>
                      <Form.Group as={Col} md={4} className="mb-3" controlId="statutory_teaching_hours">
                        <Form.Label>Charge horaire statutaire (h/mois)</Form.Label>
                        <Form.Control type="number" step="0.01" min="0" name="statutory_teaching_hours" value={formData.statutory_teaching_hours} onChange={handleInputChange} />
                        <Form.Text className="text-muted">Enseignant permanent : au-delà, heures complémentaires.</Form.Text>
                      </Form.Group>
                      <Form.Group as={Col} md={4} className="mb-3" controlId="extra_hour_rate">
                        <Form.Label>Taux heure complémentaire</Form.Label>
                        <Form.Control type="number" step="0.01" min="0" name="extra_hour_rate" value={formData.extra_hour_rate} onChange={handleInputChange} />
                        
                      </Form.Group>
                      <Form.Group as={Col} md={4} className="mb-3" controlId="payment_account">
                        <Form.Label>Compte bancaire / Mobile Money</Form.Label>
                        <Form.Control type="text" name="payment_account" value={formData.payment_account} onChange={handleInputChange} />
                        
                      </Form.Group>
                    </Row>
                  </Card.Body>
                </Card>
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
