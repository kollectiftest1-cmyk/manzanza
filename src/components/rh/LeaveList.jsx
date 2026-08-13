'use client';

import React, { useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Button, Typography, Box, IconButton, Tooltip, TablePagination, Chip
} from '@mui/material';
import { CheckCircle, Cancel, Delete } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { approveLeave, rejectLeave, deleteLeave } from '@/services/hrService';
import { toast } from 'react-toastify';

export default function LeaveList({ leaves, onRefresh }) {
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

  const handleApprove = async (id) => {
    if (window.confirm('Approuver ce congé ?')) {
      try {
        await approveLeave(id);
        toast.success('Congé approuvé.');
        onRefresh();
      } catch (error) {
        toast.error('Erreur lors de l\'approbation.');
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
        toast.error('Erreur lors du rejet.');
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
        toast.error('Erreur lors de la suppression.');
        console.error(error);
      }
    }
  };

  const paginatedLeaves = leaves.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Liste des Congés ({leaves.length})
        </Typography>
        <Button variant="contained" color="primary" onClick={() => navigate('/rh/leaves/new')}>
          Nouvelle Demande
        </Button>
      </Box>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Employé</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Début</TableCell>
              <TableCell>Fin</TableCell>
              <TableCell>Durée (jours)</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedLeaves.map((leave) => (
              <TableRow key={leave.id}>
                <TableCell>{leave.employee_name}</TableCell>
                <TableCell>{leave.leave_type}</TableCell>
                <TableCell>{leave.start_date}</TableCell>
                <TableCell>{leave.end_date}</TableCell>
                <TableCell>{leave.duration_days}</TableCell>
                <TableCell>
                  <Chip
                    label={leave.status}
                    color={
                      leave.status === 'approuve' ? 'success' :
                      leave.status === 'rejete' ? 'error' : 'warning'
                    }
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {leave.status === 'en_attente' && (
                    <>
                      <Tooltip title="Approuver">
                        <IconButton onClick={() => handleApprove(leave.id)} color="success">
                          <CheckCircle />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Rejeter">
                        <IconButton onClick={() => handleReject(leave.id)} color="error">
                          <Cancel />
                        </IconButton>
                      </Tooltip>
                    </>
                  )}
                  <Tooltip title="Supprimer">
                    <IconButton onClick={() => handleDelete(leave.id)} color="default">
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
        count={leaves.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="Lignes par page :"
      />
    </Paper>
  );
}
