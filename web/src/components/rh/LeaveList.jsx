'use client';

import React, { useState } from 'react';
import { Table, Button, Pagination, Card, Badge } from 'react-bootstrap';
import { FiCheckCircle, FiXCircle, FiTrash2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { approveLeave, rejectLeave, deleteLeave } from '../../services/hrService';
import { toast } from 'react-toastify';
import { notifyError } from "../../utils/notify"

export default function LeaveList({ leaves, onRefresh }) {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);

  const handleApprove = async (id) => {
    if (window.confirm('Approuver ce congé ?')) {
      try {
        await approveLeave(id);
        toast.success('Congé approuvé.');
        onRefresh();
      } catch (error) {
        notifyError(error, 'Erreur lors de l\'approbation.');
        console.error(error);
      }
    }
  };

  const handleReject = async (id) => {
    if (window.confirm('Rejeter ce congé ?')) {
      try {
        await rejectLeave(id);
        toast.success('Congé rejeté.');
        onRefresh();
      } catch (error) {
        notifyError(error, 'Erreur lors du rejet.');
        console.error(error);
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette demande de congé ?')) {
      try {
        await deleteLeave(id);
        toast.success('Demande supprimée.');
        onRefresh();
      } catch (error) {
        notifyError(error, 'Erreur lors de la suppression.');
        console.error(error);
      }
    }
  };

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = leaves.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(leaves.length / rowsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <Card className="shadow-sm">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h5 className="card-title mb-0">Liste des Congés ({leaves.length})</h5>
          <Button variant="primary" onClick={() => navigate('/rh/leaves/new')}>
            Nouvelle Demande
          </Button>
        </div>
        <div className="table-responsive">
          <Table hover>
            <thead className="table-light">
              <tr>
                <th>Employé</th>
                <th>Type</th>
                <th>Début</th>
                <th>Fin</th>
                <th>Durée (jours)</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentRows.map((leave) => (
                <tr key={leave.id}>
                  <td>{leave.employee_name}</td>
                  <td>{leave.leave_type}</td>
                  <td>{leave.start_date}</td>
                  <td>{leave.end_date}</td>
                  <td>{leave.duration_days}</td>
                  <td>
                    <Badge
                      bg={
                        leave.status === 'approuve' ? 'success' :
                        leave.status === 'rejete' ? 'danger' : 'warning'
                      }
                    >
                      {leave.status}
                    </Badge>
                  </td>
                  <td>
                    {leave.status === 'en_attente' && (
                      <>
                        <Button
                          variant="outline-success"
                          size="sm"
                          className="me-2"
                          onClick={() => handleApprove(leave.id)}
                          title="Approuver"
                        >
                          <FiCheckCircle />
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          className="me-2"
                          onClick={() => handleReject(leave.id)}
                          title="Rejeter"
                        >
                          <FiXCircle />
                        </Button>
                      </>
                    )}
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={() => handleDelete(leave.id)}
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
