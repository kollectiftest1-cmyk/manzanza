'use client';

import React, { useState } from 'react';
import { Table, Button, Pagination, Card, Badge } from 'react-bootstrap';
import { FiEdit, FiTrash2, FiEye } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { deleteEmployee } from '../../services/hrService';
import { toast } from 'react-toastify';
import { notifyError } from "../../utils/notify"

export default function EmployeeList({ employees, onRefresh }) {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet employé ?')) {
      try {
        await deleteEmployee(id);
        toast.success('Employé supprimé avec succès.');
        onRefresh();
      } catch (error) {
        notifyError(error, 'Erreur lors de la suppression de l\'employé.');
        console.error(error);
      }
    }
  };

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = employees.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(employees.length / rowsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <Card className="shadow-sm">
      <Card.Body>
        <h5 className="card-title mb-4">Liste des Employés Actuels ({employees.length})</h5>
        <div className="table-responsive">
          <Table hover>
            <thead className="table-light">
              <tr>
                <th>Nom</th>
                <th>Email</th>
                <th>Poste</th>
                <th>Matricule</th>
                <th>Type</th>
                <th>Profils</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentRows.map((employee) => (
                <tr key={employee.id}>
                  <td className="fw-semibold">{employee.user_name}</td>
                  <td>{employee.user_email}</td>
                  <td>
                    <Badge bg="primary" style={{ fontSize: '0.8rem' }}>
                      {employee.position_display || employee.position}
                    </Badge>
                  </td>
                  <td><code>{employee.employee_id}</code></td>
                  <td>
                    <Badge bg={employee.prestation_type === 'permanent' ? 'success' : 'warning'}
                      text={employee.prestation_type === 'permanent' ? 'white' : 'dark'}
                      style={{ fontSize: '0.75rem' }}>
                      {employee.prestation_type === 'permanent' ? 'Permanent' : 'Charge H.'}
                    </Badge>
                  </td>
                  <td>
                    <Badge bg="light" text="dark" style={{ fontSize: '0.75rem' }}>
                      {employee.user_profiles_count || 1}/3
                    </Badge>
                  </td>
                  <td>
                    <Badge bg={employee.status === 'actif' ? 'success' : 'secondary'}>
                      {employee.status}
                    </Badge>
                  </td>
                  <td>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="me-2"
                      onClick={() => navigate(`/rh/employees/${employee.id}`)}
                      title="Voir Détails"
                    >
                      <FiEye />
                    </Button>
                    <Button
                      variant="outline-warning"
                      size="sm"
                      className="me-2"
                      onClick={() => navigate(`/rh/employees/edit/${employee.id}`)}
                      title="Modifier"
                    >
                      <FiEdit />
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleDelete(employee.id)}
                      title="Supprimer"
                    >
                      <FiTrash2 />
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
      </Card.Body>
    </Card>
  );
}
