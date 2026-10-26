'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Container, Row, Col, Card, Form, Button, Spinner, Alert,
  Badge, Table
} from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getPayroll, createPayroll, updatePayroll, getEmployees,
  calculatePrestation
} from '../../services/hrService';
import { toast } from 'react-toastify';
import { notifyError } from "../../utils/notify"

const MONTH_OPTIONS = [
  { value: 1, label: 'Janvier' },
  { value: 2, label: 'Février' },
  { value: 3, label: 'Mars' },
  { value: 4, label: 'Avril' },
  { value: 5, label: 'Mai' },
  { value: 6, label: 'Juin' },
  { value: 7, label: 'Juillet' },
  { value: 8, label: 'Août' },
  { value: 9, label: 'Septembre' },
  { value: 10, label: 'Octobre' },
  { value: 11, label: 'Novembre' },
  { value: 12, label: 'Décembre' },
];

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: currentYear - 2020 + 2 }, (_, i) => 2020 + i);

export default function PayrollForm() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [formData, setFormData] = useState({
    employee: '',
    mois: new Date().getMonth() + 1,
    annee: currentYear,
    bonuses: 0,
    deductions: 0,
    payment_method: '',
    notes: '',
  });

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Auto-calculation state
  const [prestation, setPrestation] = useState(null);
  const [loadingPrestation, setLoadingPrestation] = useState(false);
  const [prestationError, setPrestationError] = useState(null);

  // Selected employee info
  const selectedEmployee = useMemo(() => {
    if (!formData.employee) return null;
    return employees.find(emp => emp.id.toString() === formData.employee.toString());
  }, [formData.employee, employees]);

  // Auto-calculate preview based on fetched prestation data
  const salaryPreview = useMemo(() => {
    if (!selectedEmployee || !prestation) return null;
    const { prestation_type, salaire_journalier, salaire_horaire } = selectedEmployee;
    let baseSalary = 0;
    let quantity = 0;
    let rate = 0;
    let unit = '';

    if (prestation_type === 'permanent') {
      quantity = prestation.jours_prestes || 0;
      rate = parseFloat(salaire_journalier) || 0;
      unit = 'jour(s)';
    } else {
      quantity = prestation.heures_prestees || 0;
      rate = parseFloat(salaire_horaire) || 0;
      unit = 'heure(s)';
    }

    baseSalary = quantity * rate;
    const bonuses = parseFloat(formData.bonuses) || 0;
    const deductions = parseFloat(formData.deductions) || 0;
    const net = baseSalary + bonuses - deductions;

    return { baseSalary, bonuses, deductions, net, quantity, rate, unit };
  }, [selectedEmployee, prestation, formData.bonuses, formData.deductions]);

  // Check if payroll creation is blocked
  const isBlocked = prestation?.already_exists && prestation?.existing_status === 'paye';
  const hasDuplicate = prestation?.already_exists;

  // ── Fetch prestation data when employee + period changes ──
  const fetchPrestation = useCallback(async (employeeId, mois, annee) => {
    if (!employeeId || !mois || !annee) {
      setPrestation(null);
      return;
    }
    setLoadingPrestation(true);
    setPrestationError(null);
    try {
      const res = await calculatePrestation({
        employee: employeeId,
        mois,
        annee,
      });
      setPrestation(res.data);
    } catch (err) {
      console.error('Erreur calcul prestation:', err);
      notifyError(err, 'Erreur lors du calcul automatique.');
      setPrestation(null);
    } finally {
      setLoadingPrestation(false);
    }
  }, []);

  // Trigger prestation calculation when selection changes
  useEffect(() => {
    if (formData.employee && formData.mois && formData.annee && !id) {
      const timer = setTimeout(() => {
        fetchPrestation(formData.employee, formData.mois, formData.annee);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [formData.employee, formData.mois, formData.annee, fetchPrestation, id]);

  // ── Initial data load ──
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const empRes = await getEmployees();
        setEmployees(empRes.data.results || empRes.data);

        if (id) {
          const payrollRes = await getPayroll(id);
          const p = payrollRes.data;
          setFormData({
            employee: p.employee,
            mois: p.mois,
            annee: p.annee,
            bonuses: p.bonuses,
            deductions: p.deductions,
            payment_method: p.payment_method || '',
            notes: p.notes || '',
          });
          // Fetch prestation for edit mode too
          fetchPrestation(p.employee, p.mois, p.annee);
        }
      } catch (err) {
        notifyError(err, 'Erreur lors du chargement des données.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [id, fetchPrestation]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleEmployeeChange = (e) => {
    const { value } = e.target;
    setFormData({ ...formData, employee: value });
    setPrestation(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Client-side duplicate check
    if (!id && prestation?.already_exists) {
      const st = prestation.existing_status;
      if (st === 'paye') {
        setError('Cet employé a déjà été payé pour cette période. Impossible de créer un doublon.');
        setLoading(false);
        return;
      }
    }

    try {
      // heures/jours are auto-calculated server-side, not sent from frontend
      const payload = {
        employee: formData.employee,
        mois: formData.mois,
        annee: formData.annee,
        bonuses: formData.bonuses,
        deductions: formData.deductions,
        payment_method: formData.payment_method || null,
        notes: formData.notes || null,
      };

      if (id) {
        await updatePayroll(id, payload);
        toast.success('Fiche de paie mise à jour avec succès.');
      } else {
        await createPayroll(payload);
        toast.success('Fiche de paie créée avec succès.');
      }
      navigate('/rh/payrolls');
    } catch (err) {
      const msg = err.response?.data;
      if (msg && typeof msg === 'object') {
        const values = Object.values(msg).flat();
        const first = values[0];
        notifyError(err, typeof first === 'string' ? first : JSON.stringify(msg));
      } else {
        notifyError(err, 'Une erreur est survenue lors de la soumission.');
      }
      notifyError(err, 'Échec de l\'opération.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getMonthLabel = (m) => {
    const mo = MONTH_OPTIONS.find(o => o.value === parseInt(m));
    return mo ? mo.label : m;
  };

  if (loading && !employees.length) {
    return <div className="text-center p-4"><Spinner animation="border" /></div>;
  }

  return (
    <Container fluid className="p-4">
      <Row>
        <Col md={{ span: 10, offset: 1 }} lg={{ span: 8, offset: 2 }}>
          <Card className="shadow-sm" style={{ borderRadius: '16px', border: 'none' }}>
            <Card.Header style={{
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              color: 'white', borderRadius: '16px 16px 0 0', padding: '20px 24px'
            }}>
              <h4 style={{ margin: 0, fontWeight: '700' }}>
                {id ? '✏️ Modifier la' : '📋 Créer une'} Fiche de Paie
              </h4>
              <small style={{ opacity: 0.85 }}>
                Les heures et jours prestés sont calculés automatiquement
              </small>
            </Card.Header>
            <Card.Body style={{ padding: '24px' }}>
              {error && <Alert variant="danger" style={{ borderRadius: '10px' }}>{error}</Alert>}

              {/* Duplicate / already-paid warning */}
              {hasDuplicate && !id && (
                <Alert
                  variant={isBlocked ? 'danger' : 'warning'}
                  style={{ borderRadius: '10px' }}
                >
                  {isBlocked ? (
                    <>
                      <strong>⛔ Paiement déjà effectué !</strong><br />
                      Cet employé a déjà été payé pour {getMonthLabel(formData.mois)} {formData.annee}.
                      Il est impossible de créer un doublon.
                    </>
                  ) : (
                    <>
                      <strong>⚠️ Fiche existante</strong><br />
                      Une fiche de paie existe déjà pour cette période
                      (statut: <Badge bg="secondary">{prestation.existing_status}</Badge>).
                      {prestation.existing_status === 'annule'
                        ? ' Vous pouvez en créer une nouvelle car l\'ancienne est annulée.'
                        : ' Veuillez modifier la fiche existante au lieu d\'en créer une nouvelle.'}
                    </>
                  )}
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                {/* ── Employee Selection ── */}
                <Row className="mb-3">
                  <Form.Group as={Col} controlId="employee">
                    <Form.Label style={{ fontWeight: '600' }}>Employé *</Form.Label>
                    <Form.Select
                      name="employee"
                      value={formData.employee}
                      onChange={handleEmployeeChange}
                      required
                      disabled={!!id}
                      style={{ borderRadius: '10px' }}
                    >
                      <option value="">Sélectionner un employé...</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>
                          {emp.user_name} — {emp.position_display || emp.position}
                          {' ('}
                          {emp.prestation_type === 'permanent' ? 'Permanent' : 'Charge horaire'}
                          {')'}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Row>

                {/* Employee info */}
                {selectedEmployee && (
                  <Alert variant="info" className="py-2" style={{ fontSize: '0.85rem', borderRadius: '10px' }}>
                    <strong>{selectedEmployee.user_name}</strong> — Poste:{' '}
                    <Badge bg="primary">{selectedEmployee.position_display || selectedEmployee.position}</Badge>{' · '}
                    {selectedEmployee.prestation_type === 'permanent' ? (
                      <>
                        <Badge bg="success">Permanent</Badge>{' '}
                        Salaire journalier: <strong>{selectedEmployee.salaire_journalier || '—'} {selectedEmployee.currency}</strong>/jour
                      </>
                    ) : (
                      <>
                        <Badge bg="warning" text="dark">Charge horaire</Badge>{' '}
                        Salaire horaire: <strong>{selectedEmployee.salaire_horaire || '—'} {selectedEmployee.currency}</strong>/heure
                      </>
                    )}
                  </Alert>
                )}

                {/* ── Period Selection ── */}
                <Card className="mb-3" style={{ borderRadius: '12px', border: '1px solid #dee2e6' }}>
                  <Card.Header className="bg-secondary bg-opacity-10 py-2" style={{ borderRadius: '12px 12px 0 0' }}>
                    <strong>📅 Période de paie</strong>
                  </Card.Header>
                  <Card.Body>
                    <Row>
                      <Form.Group as={Col} md={6} controlId="mois">
                        <Form.Label>Mois *</Form.Label>
                        <Form.Select
                          name="mois"
                          value={formData.mois}
                          onChange={handleInputChange}
                          required
                          disabled={!!id}
                          style={{ borderRadius: '10px' }}
                        >
                          {MONTH_OPTIONS.map(m => (
                            <option key={m.value} value={m.value}>{m.label}</option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                      <Form.Group as={Col} md={6} controlId="annee">
                        <Form.Label>Année *</Form.Label>
                        <Form.Select
                          name="annee"
                          value={formData.annee}
                          onChange={handleInputChange}
                          required
                          disabled={!!id}
                          style={{ borderRadius: '10px' }}
                        >
                          {YEAR_OPTIONS.map(y => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Row>
                    <div className="mt-2 text-center">
                      <Badge bg="light" text="dark" style={{ fontSize: '0.9rem', padding: '6px 16px' }}>
                        {getMonthLabel(formData.mois)} {formData.annee}
                      </Badge>
                    </div>
                  </Card.Body>
                </Card>

                {/* ── Auto-calculated Prestation ── */}
                {selectedEmployee && (
                  <Card className="mb-3" style={{
                    borderRadius: '12px',
                    border: `2px solid ${selectedEmployee.prestation_type === 'permanent' ? '#28a745' : '#ffc107'}`,
                  }}>
                    <Card.Header style={{
                      background: selectedEmployee.prestation_type === 'permanent'
                        ? 'linear-gradient(135deg, #28a74520, #28a74510)'
                        : 'linear-gradient(135deg, #ffc10720, #ffc10710)',
                      borderRadius: '10px 10px 0 0', padding: '12px 16px'
                    }}>
                      <strong>
                        {selectedEmployee.prestation_type === 'permanent'
                          ? '📊 Jours prestés (calcul automatique)'
                          : '⏱️ Heures prestées (calcul automatique)'}
                      </strong>
                    </Card.Header>
                    <Card.Body>
                      {loadingPrestation ? (
                        <div className="text-center py-3">
                          <Spinner animation="border" size="sm" className="me-2" />
                          Calcul en cours...
                        </div>
                      ) : prestationError ? (
                        <Alert variant="warning" className="mb-0" style={{ borderRadius: '8px' }}>
                          {prestationError}
                        </Alert>
                      ) : prestation ? (
                        <>
                          {selectedEmployee.prestation_type === 'permanent' ? (
                            /* ─── Permanent: Business days info ─── */
                            <div>
                              <Row className="text-center mb-3">
                                <Col>
                                  <div style={{ fontSize: '2rem', fontWeight: '800', color: '#28a745' }}>
                                    {prestation.jours_prestes}
                                  </div>
                                  <small className="text-muted">Jours prestés</small>
                                </Col>
                                <Col>
                                  <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#6c757d' }}>
                                    {prestation.jours_ouvrables}
                                  </div>
                                  <small className="text-muted">Jours ouvrables</small>
                                </Col>
                                <Col>
                                  <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#dc3545' }}>
                                    {prestation.jours_conge}
                                  </div>
                                  <small className="text-muted">Jours de congé</small>
                                </Col>
                              </Row>
                              <small className="text-muted">
                                = {prestation.jours_ouvrables} jours ouvrables − {prestation.jours_conge} jours de congé approuvé
                              </small>
                            </div>
                          ) : (
                            /* ─── Charge horaire: Sessions info ─── */
                            <div>
                              <Row className="text-center mb-3">
                                <Col>
                                  <div style={{ fontSize: '2rem', fontWeight: '800', color: '#ffc107' }}>
                                    {prestation.heures_prestees}
                                  </div>
                                  <small className="text-muted">Heures prestées</small>
                                </Col>
                                <Col>
                                  <div style={{ fontSize: '1.5rem', fontWeight: '600', color: '#6c757d' }}>
                                    {prestation.sessions_count}
                                  </div>
                                  <small className="text-muted">Séances finalisées</small>
                                </Col>
                              </Row>

                              {/* Show session details */}
                              {prestation.sessions && prestation.sessions.length > 0 ? (
                                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                  <Table size="sm" hover style={{ fontSize: '0.8rem', marginBottom: 0 }}>
                                    <thead>
                                      <tr>
                                        <th>Cours</th>
                                        <th>Date</th>
                                        <th>Horaire</th>
                                        <th>Heures</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {prestation.sessions.map((s, i) => (
                                        <tr key={i}>
                                          <td>
                                            <Badge bg="light" text="dark">{s.code}</Badge>{' '}
                                            {s.course}
                                          </td>
                                          <td>{new Date(s.date).toLocaleDateString('fr-FR')}</td>
                                          <td>{s.start} — {s.end}</td>
                                          <td><strong>{s.hours}h</strong></td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </Table>
                                </div>
                              ) : (
                                <Alert variant="light" className="mb-0 text-center" style={{ borderRadius: '8px' }}>
                                  Aucune séance finalisée pour ce mois.
                                  Les heures seront 0.
                                </Alert>
                              )}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-center text-muted py-2">
                          Sélectionnez un employé et une période pour calculer automatiquement.
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                )}

                {/* ── Bonuses / Deductions ── */}
                {selectedEmployee && (
                  <Card className="mb-3" style={{ borderRadius: '12px', border: '1px solid #dee2e6' }}>
                    <Card.Header className="bg-light py-2" style={{ borderRadius: '12px 12px 0 0' }}>
                      <strong>💰 Primes & Déductions</strong>
                    </Card.Header>
                    <Card.Body>
                      <Row>
                        <Form.Group as={Col} md={6} controlId="bonuses">
                          <Form.Label>Primes / Bonus</Form.Label>
                          <Form.Control
                            type="number"
                            min="0"
                            step="0.01"
                            name="bonuses"
                            value={formData.bonuses}
                            onChange={handleInputChange}
                            placeholder="0"
                            style={{ borderRadius: '10px' }}
                          />
                        </Form.Group>
                        <Form.Group as={Col} md={6} controlId="deductions">
                          <Form.Label>Déductions</Form.Label>
                          <Form.Control
                            type="number"
                            min="0"
                            step="0.01"
                            name="deductions"
                            value={formData.deductions}
                            onChange={handleInputChange}
                            placeholder="0"
                            style={{ borderRadius: '10px' }}
                          />
                        </Form.Group>
                      </Row>
                    </Card.Body>
                  </Card>
                )}

                {/* ── Payment method & notes ── */}
                <Row className="mb-3">
                  <Form.Group as={Col} md={6} controlId="payment_method">
                    <Form.Label style={{ fontWeight: '600' }}>Méthode de paiement</Form.Label>
                    <Form.Select
                      name="payment_method"
                      value={formData.payment_method}
                      onChange={handleInputChange}
                      style={{ borderRadius: '10px' }}
                    >
                      <option value="">— Aucune —</option>
                      <option value="virement">Virement bancaire</option>
                      <option value="cash">Cash</option>
                      <option value="cheque">Chèque</option>
                      <option value="mobile_money">Mobile Money</option>
                    </Form.Select>
                  </Form.Group>
                  <Form.Group as={Col} md={6} controlId="notes">
                    <Form.Label style={{ fontWeight: '600' }}>Notes</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={1}
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      placeholder="Observations..."
                      style={{ borderRadius: '10px' }}
                    />
                  </Form.Group>
                </Row>

                {/* ── Net salary preview ── */}
                {salaryPreview && (
                  <Card className="mb-3" style={{
                    borderRadius: '12px',
                    border: '2px solid #28a745',
                    background: 'linear-gradient(135deg, #28a74510, #20c99710)'
                  }}>
                    <Card.Body className="py-3">
                      <Row className="align-items-center">
                        <Col>
                          <div style={{ fontSize: '0.85rem', color: '#6c757d' }}>
                            {salaryPreview.quantity} {salaryPreview.unit} × {salaryPreview.rate.toFixed(2)} {selectedEmployee?.currency}
                          </div>
                          <div style={{ fontSize: '0.85rem' }}>
                            <span className="text-muted">Base: {salaryPreview.baseSalary.toFixed(2)}</span>
                            {salaryPreview.bonuses > 0 && <span className="text-success ms-2">+ {salaryPreview.bonuses.toFixed(2)}</span>}
                            {salaryPreview.deductions > 0 && <span className="text-danger ms-2">− {salaryPreview.deductions.toFixed(2)}</span>}
                          </div>
                        </Col>
                        <Col className="text-end">
                          <div style={{ fontSize: '0.75rem', color: '#6c757d' }}>SALAIRE NET</div>
                          <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#28a745' }}>
                            {salaryPreview.net.toFixed(2)} {selectedEmployee?.currency || 'USD'}
                          </div>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                )}

                {/* ── Actions ── */}
                <div className="d-flex justify-content-end gap-2 mt-4">
                  <Button
                    variant="secondary"
                    onClick={() => navigate('/rh/payrolls')}
                    style={{ borderRadius: '10px' }}
                  >
                    Annuler
                  </Button>
                  <Button
                    variant="primary"
                    type="submit"
                    disabled={loading || isBlocked || loadingPrestation || (!id && hasDuplicate && prestation?.existing_status !== 'annule')}
                    style={{
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #667eea, #764ba2)',
                      border: 'none', fontWeight: '600', padding: '10px 24px'
                    }}
                  >
                    {loading ? (
                      <Spinner as="span" animation="border" size="sm" />
                    ) : (
                      id ? 'Mettre à jour' : 'Créer la fiche de paie'
                    )}
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
