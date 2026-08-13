'use client';

import React, { useState } from 'react';
import { Table, Button, Pagination, Card, Modal, Form, Row, Col, Badge, Alert } from 'react-bootstrap';
import { FiPlus, FiBriefcase } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { createEmployee } from '../../services/hrService';
import { toast } from 'react-toastify';

const POSITION_CHOICES = [
  { value: 'professeur', label: 'Professeur' },
  { value: 'assistant', label: 'Assistant' },
  { value: 'chef_departement', label: 'Chef de Département' },
  { value: 'chef_section', label: 'Chef de Section' },
  { value: 'bibliothecaire', label: 'Bibliothécaire' },
  { value: 'appariteur', label: 'Appariteur' },
  { value: 'comptable', label: 'Comptable' },
  { value: 'secretaire', label: 'Secrétaire' },
  { value: 'technicien_it', label: 'Technicien IT' },
  { value: 'personnel_admin', label: 'Personnel Administratif' },
];

const MAX_PROFILES = 3;

export default function PotentialEmployeeList({ potentialEmployees, onRefresh }) {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    position: '',
    department: '',
    hire_date: new Date().toISOString().split('T')[0],
    prestation_type: 'permanent',
    salaire_journalier: '',
    salaire_horaire: '',
    currency: 'USD',
    employee_id: '',
  });

  const handleOpenModal = (user) => {
    setSelectedUser(user);
    const profileNum = (user.employee_count || 0) + 1;
    setFormData({
      position: '',
      department: '',
      hire_date: new Date().toISOString().split('T')[0],
      prestation_type: 'permanent',
      salaire_journalier: '',
      salaire_horaire: '',
      currency: 'USD',
      employee_id: `EMP-${user.id}-P${profileNum}-${new Date().getFullYear()}`,
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedUser(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      const payload = {
        user: selectedUser.id,
        ...formData,
      };
      await createEmployee(payload);
      const profileNum = (selectedUser.employee_count || 0) + 1;
      toast.success(`Profil employé #${profileNum} créé avec succès. L'utilisateur sera notifié.`);
      handleCloseModal();
      onRefresh();
    } catch (error) {
      const msg = error.response?.data;
      if (msg && typeof msg === 'object') {
        const first = Object.values(msg).flat()[0];
        toast.error(typeof first === 'string' ? first : JSON.stringify(msg));
      } else {
        toast.error('Erreur lors de la création de l\'employé.');
      }
      console.error(error);
    }
  };

  // Available positions = all minus already taken
  const getAvailablePositions = () => {
    if (!selectedUser) return POSITION_CHOICES;
    const taken = selectedUser.existing_positions || [];
    return POSITION_CHOICES.filter(p => !taken.includes(p.value));
  };

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = potentialEmployees.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(potentialEmployees.length / rowsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const getPositionLabel = (val) => {
    const p = POSITION_CHOICES.find(c => c.value === val);
    return p ? p.label : val;
  };

  return (
    <Card className="shadow-sm">
      <Card.Body>
        <h5 className="card-title mb-2">Employés Potentiels ({potentialEmployees.length})</h5>
        <p className="text-muted mb-4" style={{ fontSize: '0.85rem' }}>
          Utilisateurs éligibles (non-étudiants avec moins de {MAX_PROFILES} profils employé).
          Chaque personne peut occuper jusqu'à <strong>{MAX_PROFILES} postes</strong> différents.
        </p>
        <div className="table-responsive">
          <Table hover>
            <thead className="table-light">
              <tr>
                <th>Nom</th>
                <th>Email</th>
                <th>Rôle</th>
                <th>Postes actuels</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentRows.map((user) => (
                <tr key={user.id}>
                  <td className="fw-semibold">{user.first_name} {user.last_name}</td>
                  <td>{user.email}</td>
                  <td><Badge bg="secondary">{user.role}</Badge></td>
                  <td>
                    {user.employee_count > 0 ? (
                      <div className="d-flex gap-1 flex-wrap">
                        {(user.existing_positions || []).map((pos, i) => (
                          <Badge key={i} bg="info" style={{ fontSize: '0.75rem' }}>
                            {getPositionLabel(pos)}
                          </Badge>
                        ))}
                        <Badge bg="light" text="dark" style={{ fontSize: '0.7rem' }}>
                          {user.employee_count}/{MAX_PROFILES}
                        </Badge>
                      </div>
                    ) : (
                      <span className="text-muted" style={{ fontSize: '0.85rem' }}>Aucun</span>
                    )}
                  </td>
                  <td>
                    <Button
                      variant={user.employee_count > 0 ? 'outline-success' : 'primary'}
                      size="sm"
                      onClick={() => handleOpenModal(user)}
                      title={user.employee_count > 0 ? 'Ajouter un poste' : 'Créer Profil Employé'}
                    >
                      <FiPlus className="me-1" />
                      {user.employee_count > 0 ? `Ajouter poste #${user.employee_count + 1}` : 'Créer Profil'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
        {totalPages > 1 && (
          <Pagination className="justify-content-center mt-3">
            {[...Array(totalPages).keys()].map((number) => (
              <Pagination.Item
                key={number + 1}
                active={number + 1 === currentPage}
                onClick={() => paginate(number + 1)}
              >
                {number + 1}
              </Pagination.Item>
            ))}
          </Pagination>
        )}

        {/* Modal de création d'employé */}
        <Modal show={showModal} onHide={handleCloseModal} size="lg" centered>
          <Modal.Header closeButton>
            <Modal.Title>
              <FiBriefcase className="me-2" />
              {selectedUser?.employee_count > 0
                ? `Ajouter poste #${(selectedUser?.employee_count || 0) + 1} pour ${selectedUser?.first_name} ${selectedUser?.last_name}`
                : `Créer un profil employé pour ${selectedUser?.first_name} ${selectedUser?.last_name}`
              }
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedUser?.employee_count > 0 && (
              <Alert variant="info" className="py-2" style={{ fontSize: '0.85rem' }}>
                <strong>Postes existants :</strong>{' '}
                {(selectedUser?.existing_positions || []).map(p => getPositionLabel(p)).join(', ')}
                <br />
                <small className="text-muted">
                  L'employé recevra une notification et une fiche de paie séparée pour chaque poste.
                </small>
              </Alert>
            )}

            <Form onSubmit={handleSubmit}>
              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group controlId="employee_id">
                    <Form.Label>Matricule Employé</Form.Label>
                    <Form.Control
                      type="text"
                      name="employee_id"
                      value={formData.employee_id}
                      onChange={handleInputChange}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group controlId="position">
                    <Form.Label>Poste *</Form.Label>
                    <Form.Select
                      name="position"
                      value={formData.position}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Choisir un poste...</option>
                      {getAvailablePositions().map(p => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </Form.Select>
                    {selectedUser?.employee_count > 0 && (
                      <Form.Text className="text-muted">
                        Les postes déjà occupés ne sont pas disponibles.
                      </Form.Text>
                    )}
                  </Form.Group>
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={6}>
                  <Form.Group controlId="department">
                    <Form.Label>Département</Form.Label>
                    <Form.Control
                      type="text"
                      name="department"
                      value={formData.department}
                      onChange={handleInputChange}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group controlId="hire_date">
                    <Form.Label>Date d'embauche</Form.Label>
                    <Form.Control
                      type="date"
                      name="hire_date"
                      value={formData.hire_date}
                      onChange={handleInputChange}
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row className="mb-3">
                <Col md={4}>
                  <Form.Group controlId="prestation_type">
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
                </Col>
                <Col md={4}>
                  {formData.prestation_type === 'permanent' ? (
                    <Form.Group controlId="salaire_journalier">
                      <Form.Label>Salaire journalier ({formData.currency}/jour)</Form.Label>
                      <Form.Control
                        type="number"
                        step="0.01"
                        name="salaire_journalier"
                        value={formData.salaire_journalier}
                        onChange={handleInputChange}
                        placeholder="Ex: 50.00"
                        required
                      />
                    </Form.Group>
                  ) : (
                    <Form.Group controlId="salaire_horaire">
                      <Form.Label>Salaire horaire ({formData.currency}/heure)</Form.Label>
                      <Form.Control
                        type="number"
                        step="0.01"
                        name="salaire_horaire"
                        value={formData.salaire_horaire}
                        onChange={handleInputChange}
                        placeholder="Ex: 15.00"
                        required
                      />
                    </Form.Group>
                  )}
                </Col>
                <Col md={4}>
                  <Form.Group controlId="currency">
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
                </Col>
              </Row>
              <div className="d-flex justify-content-end gap-2">
                <Button variant="secondary" onClick={handleCloseModal}>
                  Annuler
                </Button>
                <Button variant="primary" type="submit">
                  {selectedUser?.employee_count > 0 ? 'Ajouter ce poste' : 'Créer'}
                </Button>
              </div>
            </Form>
          </Modal.Body>
        </Modal>
      </Card.Body>
    </Card>
  );
}
