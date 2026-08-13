'use client';

import React, { useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Button, Typography, Box, IconButton, Tooltip, TablePagination, Chip
} from '@mui/material';
import { Download, CheckCircle, Edit, Delete } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { markPayrollAsPaid, generatePayslip, deletePayroll } from '@/services/hrService';
import { toast } from 'react-toastify';

export default function PayrollList({ payrolls, onRefresh }) {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

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

  const paginatedPayrolls = payrolls.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Liste des Fiches de Paie ({payrolls.length})
        </Typography>
        <Button variant="contained" color="primary" onClick={() => navigate('/rh/payrolls/new')}>
          Créer une Fiche de Paie
        </Button>
      </Box>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Employé</TableCell>
              <TableCell>Période</TableCell>
              <TableCell>Salaire Net</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedPayrolls.map((payroll) => (
              <TableRow key={payroll.id}>
                <TableCell>{payroll.employee_name}</TableCell>
                <TableCell>{payroll.period_start} - {payroll.period_end}</TableCell>
                <TableCell>{payroll.net_salary} {payroll.currency || 'USD'}</TableCell>
                <TableCell>
                  <Chip
                    label={payroll.status}
                    color={payroll.status === 'paye' ? 'success' : 'warning'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {payroll.status !== 'paye' && (
                    <Tooltip title="Marquer comme Payé">
                      <IconButton onClick={() => handleMarkAsPaid(payroll.id)} color="success">
                        <CheckCircle />
                      </IconButton>
                    </Tooltip>
                  )}
                  <Tooltip title="Télécharger la Fiche de Paie (PDF)">
                    <IconButton onClick={() => handleDownloadPayslip(payroll.id, payroll.employee_name, payroll.period_end)}>
                      <Download />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Modifier">
                    <IconButton onClick={() => navigate(`/rh/payrolls/edit/${payroll.id}`)}>
                      <Edit />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Supprimer">
                    <IconButton onClick={() => handleDelete(payroll.id)} color="error">
                      <Delete />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[10, 25, 50]}
        component="div"
        count={payrolls.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="Lignes par page :"
      />
    </Paper>
  );
}
