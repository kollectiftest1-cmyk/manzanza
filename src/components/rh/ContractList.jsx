'use client';

import React, { useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Button, Typography, Box, IconButton, Tooltip, TablePagination, Chip
} from '@mui/material';
import { Edit, Delete, Visibility } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { deleteContract } from '@/services/hrService';
import { toast } from 'react-toastify';

export default function ContractList({ contracts, onRefresh }) {
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

  const paginatedContracts = contracts.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Paper sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Liste des Contrats ({contracts.length})
        </Typography>
        <Button variant="contained" color="primary" onClick={() => navigate('/rh/contracts/new')}>
          Créer un Contrat
        </Button>
      </Box>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Employé</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Date de Début</TableCell>
              <TableCell>Date de Fin</TableCell>
              <TableCell>Salaire</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedContracts.map((contract) => (
              <TableRow key={contract.id}>
                <TableCell>{contract.employee_name}</TableCell>
                <TableCell>{contract.contract_type}</TableCell>
                <TableCell>{contract.start_date}</TableCell>
                <TableCell>{contract.end_date || 'Indéterminée'}</TableCell>
                <TableCell>{contract.salary} {contract.currency || 'USD'}</TableCell>
                <TableCell>
                  <Chip
                    label={contract.status}
                    color={contract.status === 'actif' ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Tooltip title="Voir Détails">
                    <IconButton onClick={() => navigate(`/rh/contracts/${contract.id}`)}>
                      <Visibility />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Modifier">
                    <IconButton onClick={() => navigate(`/rh/contracts/edit/${contract.id}`)}>
                      <Edit />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Supprimer">
                    <IconButton onClick={() => handleDelete(contract.id)} color="error">
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
        count={contracts.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="Lignes par page :"
      />
    </Paper>
  );
}
