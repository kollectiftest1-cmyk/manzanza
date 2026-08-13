'use client';

import React, { useState } from 'react';
import { Table, Button, Pagination, Card, Badge } from 'react-bootstrap';
import { FiEdit, FiTrash2, FiEye } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { deleteContract } from '../../services/hrService';
import { toast } from 'react-toastify';

export default function ContractList({ contracts, onRefresh }) {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce contrat ?')) {
      try {
        await deleteContract(id);
        toast.success('Contrat supprimé.');
        onRefresh();
      } catch (error) {
        toast.error('Erreur lors de la suppression.');
        console.error(error);
      }
    }
  };

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = contracts.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(contracts.length / rowsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <Card className="shadow-sm">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h5 className="card-title mb-0">Liste des Contrats ({contracts.length})</h5>
          <Button variant="primary" onClick={() => navigate('/rh/contracts/new')}>
            Créer un Contrat
          </Button>
        </div>
        <div className="table-responsive">
          <Table hover>
            <thead className="table-light">
              <tr>
                <th>Employé</th>
                <th>Type</th>
                <th>Date de Début</th>
                <th>Date de Fin</th>
                <th>Salaire</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentRows.map((contract) => (
                <tr key={contract.id}>
                  <td>{contract.employee_name}</td>
                  <td>{contract.contract_type}</td>
                  <td>{contract.start_date}</td>
                  <td>{contract.end_date || 'Indéterminée'}</td>
                  <td>{contract.salary} {contract.currency || 'USD'}</td>
                  <td>
                    <Badge bg={contract.status === 'actif' ? 'success' : 'secondary'}>
                      {contract.status}
                    </Badge>
                  </td>
                  <td>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="me-2"
                      onClick={() => navigate(`/rh/contracts/${contract.id}`)}
                      title="Voir Détails"
                    >
                      <FiEye />
                    </Button>
                    <Button
                      variant="outline-warning"
                      size="sm"
                      className="me-2"
                      onClick={() => navigate(`/rh/contracts/edit/${contract.id}`)}
                      title="Modifier"
                    >
                      <FiEdit />
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleDelete(contract.id)}
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
