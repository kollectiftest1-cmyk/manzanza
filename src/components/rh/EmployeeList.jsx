'use client';

import React, { useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Button, Typography, Box, IconButton, Tooltip, TablePagination
} from '@mui/material';
import { Edit, Delete, Visibility } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { deleteEmployee } from '@/services/hrService';
import { toast } from 'react-toastify';

export default function EmployeeList({ employees, onRefresh }) {
  const router = useRouter();
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
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet employé ?')) {
      try {
        await deleteEmployee(id);
        toast.success('Employé supprimé avec succès.');
        onRefresh();
      } catch (error) {
        toast.error('Erreur lors de la suppression de l\'employé.');
        console.error(error);
      }
    }
  };

  const paginatedEmployees = employees.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Liste des Employés Actuels ({employees.length})
      </Typography>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nom</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Poste</TableCell>
              <TableCell>Matricule</TableCell>
              <TableCell>Statut</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedEmployees.map((employee) => (
              <TableRow key={employee.id}>
                <TableCell>{employee.user_name}</TableCell>
                <TableCell>{employee.user_email}</TableCell>
                <TableCell>{employee.position}</TableCell>
                <TableCell>{employee.employee_id}</TableCell>
                <TableCell>{employee.status}</TableCell>
                <TableCell>
                  <Tooltip title="Voir Détails">
                    <IconButton onClick={() => router.push(`/rh/employees/${employee.id}`)}>
                      <Visibility />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Modifier">
                    <IconButton onClick={() => router.push(`/rh/employees/edit/${employee.id}`)}>
                      <Edit />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Supprimer">
                    <IconButton onClick={() => handleDelete(employee.id)}>
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
        count={employees.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="Lignes par page :"
      />
    </Paper>
  );
}
