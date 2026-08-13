'use client';

import React, { useState } from 'react';
import { Table, Button, Pagination, Card, Badge } from 'react-bootstrap';
import { FiDownload, FiCheckCircle, FiEdit, FiTrash2 } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { markPayrollAsPaid, generatePayslip, deletePayroll } from '../../services/hrService';
import { toast } from 'react-toastify';

export default function PayrollList({ payrolls, onRefresh }) {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);

  const handleMarkAsPaid = async (id) => {
    if (window.confirm('Marquer cette fiche de paie comme payée ?')) {
      try {
        await markPayrollAsPaid(id);
        toast.success('Fiche de paie marquée comme payée.');
        onRefresh();
      } catch (error) {
        toast.error('Erreur lors de la mise à jour.');
        console.error(error);
      }
    }
  };

  const handleDownloadPayslip = async (id, employeeName, periodEnd) => {
    try {
      const response = await generatePayslip(id);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `fiche_de_paie_${employeeName.replace(' ', '_')}_${periodEnd}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      toast.error('Erreur lors de la génération du PDF.');
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette fiche de paie ?')) {
      try {
        await deletePayroll(id);
        toast.success('Fiche de paie supprimée.');
        onRefresh();
      } catch (error) {
        toast.error('Erreur lors de la suppression.');
        console.error(error);
      }
    }
  };

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = payrolls.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(payrolls.length / rowsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <Card className="shadow-sm">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h5 className="card-title mb-0">Liste des Fiches de Paie ({payrolls.length})</h5>
          <Button variant="primary" onClick={() => navigate('/rh/payrolls/new')}>
            Créer une Fiche de Paie
          </Button>
        </div>
        <div className="table-responsive">
          <Table hover>
            <thead className="table-light">
              <tr>
                <th>Employé</th>
                <th>Poste</th>
                <th>Type</th>
                <th>Période</th>
                <th>Prestation</th>
                <th>Salaire Net</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentRows.map((payroll) => (
                <tr key={payroll.id}>
                  <td className="fw-semibold">{payroll.employee_name}</td>
                  <td>
                    <Badge bg="primary" style={{ fontSize: '0.8rem' }}>
                      {payroll.position_display || payroll.position}
                    </Badge>
                  </td>
                  <td>
                    <Badge bg={payroll.prestation_type === 'permanent' ? 'success' : 'warning'}
                      text={payroll.prestation_type === 'permanent' ? 'white' : 'dark'}
                      style={{ fontSize: '0.75rem' }}>
                      {payroll.prestation_type === 'permanent' ? 'Permanent' : 'Charge H.'}
                    </Badge>
                  </td>
                  <td>{payroll.period_label || `${payroll.mois}/${payroll.annee}`}</td>
                  <td>
                    {payroll.prestation_type === 'permanent' ? (
                      <span>{payroll.jours_prestes || 0} jours</span>
                    ) : (
                      <span>{payroll.heures_prestees || 0} heures</span>
                    )}
                  </td>
                  <td><strong>{payroll.net_salary}</strong> {payroll.currency || 'USD'}</td>
                  <td>
                    <Badge bg={payroll.status === 'paye' ? 'success' : payroll.status === 'annule' ? 'secondary' : 'warning'}>
                      {payroll.status === 'paye' ? 'Payé' : payroll.status === 'annule' ? 'Annulé' : 'En attente'}
                    </Badge>
                  </td>
                  <td>
                    {payroll.status === 'en_attente' && (
                      <Button
                        variant="outline-success"
                        size="sm"
                        className="me-1"
                        onClick={() => handleMarkAsPaid(payroll.id)}
                        title="Marquer comme Payé"
                      >
                        <FiCheckCircle />
                      </Button>
                    )}
                    <Button
                      variant="outline-primary"
                      size="sm"
                      className="me-1"
                      onClick={() => handleDownloadPayslip(payroll.id, payroll.employee_name, `${payroll.mois}_${payroll.annee}`)}
                      title="Télécharger PDF"
                    >
                      <FiDownload />
                    </Button>
                    {payroll.status !== 'paye' && (
                      <>
                        <Button
                          variant="outline-warning"
                          size="sm"
                          className="me-1"
                          onClick={() => navigate(`/rh/payrolls/edit/${payroll.id}`)}
                          title="Modifier"
                        >
                          <FiEdit />
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(payroll.id)}
                          title="Supprimer"
                        >
                          <FiTrash2 />
                        </Button>
                      </>
                    )}
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
