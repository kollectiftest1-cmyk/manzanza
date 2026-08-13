'use client';

import React, { useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Button, Typography, Box, IconButton, Tooltip, TablePagination,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem
} from '@mui/material';
import { Add } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { createEmployee } from '@/services/hrService';
import { toast } from 'react-toastify';

export default function PotentialEmployeeList({ potentialEmployees, onRefresh }) {
  const router = useRouter();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    position: '',
    department: '',
    hire_date: new Date().toISOString().split('T')[0],
    base_salary: '',
    currency: 'USD',
    employee_id: '',
  });

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenDialog = (user) => {
    setSelectedUser(user);
    setFormData({
      ...formData,
      employee_id: `EMP-${user.id}-${new Date().getFullYear()}`, // Génération automatique d'un matricule temporaire
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedUser(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async () => {
    if (!selectedUser) return;

    try {
      const payload = {
        user: selectedUser.id,
        ...formData,
      };
      await createEmployee(payload);
      toast.success('Employé créé avec succès.');
      handleCloseDialog();
      onRefresh();
    } catch (error) {
      toast.error('Erreur lors de la création de l\'employé.');
      console.error(error);
    }
  };

  const paginatedEmployees = potentialEmployees.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Employés Potentiels ({potentialEmployees.length})
      </Typography>
      <Typography variant="body2" color="textSecondary" paragraph>
        Ces utilisateurs ont un rôle autre que "étudiant" mais n'ont pas encore de profil employé complet.
      </Typography>

      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nom</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Rôle Actuel</TableCell>
              <TableCell>Téléphone</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedEmployees.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.first_name} {user.last_name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>{user.phone || '-'}</TableCell>
                <TableCell>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<Add />}
                    onClick={() => handleOpenDialog(user)}
                    size="small"
                  >
                    Créer Profil Employé
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[10, 25, 50]}
        component="div"
        count={potentialEmployees.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="Lignes par page :"
      />

      {/* Dialog de création d'employé */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Créer un profil employé pour {selectedUser?.first_name} {selectedUser?.last_name}</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Matricule Employé"
              name="employee_id"
              value={formData.employee_id}
              onChange={handleInputChange}
              fullWidth
              required
            />
            <TextField
              select
              label="Poste"
              name="position"
              value={formData.position}
              onChange={handleInputChange}
              fullWidth
              required
            >
              <MenuItem value="professeur">Professeur</MenuItem>
              <MenuItem value="assistant">Assistant</MenuItem>
              <MenuItem value="chef_departement">Chef de Département</MenuItem>
              <MenuItem value="chef_section">Chef de Section</MenuItem>
              <MenuItem value="bibliothecaire">Bibliothécaire</MenuItem>
              <MenuItem value="appariteur">Appariteur</MenuItem>
              <MenuItem value="comptable">Comptable</MenuItem>
              <MenuItem value="secretaire">Secrétaire</MenuItem>
              <MenuItem value="technicien_it">Technicien IT</MenuItem>
              <MenuItem value="personnel_admin">Personnel Administratif</MenuItem>
            </TextField>
            <TextField
              label="Département"
              name="department"
              value={formData.department}
              onChange={handleInputChange}
              fullWidth
            />
            <TextField
              label="Date d'embauche"
              name="hire_date"
              type="date"
              value={formData.hire_date}
              onChange={handleInputChange}
              fullWidth
              InputLabelProps={{ shrink: true }}
              required
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Salaire de base"
                name="base_salary"
                type="number"
                value={formData.base_salary}
                onChange={handleInputChange}
                fullWidth
                required
              />
              <TextField
                select
                label="Devise"
                name="currency"
                value={formData.currency}
                onChange={handleInputChange}
                sx={{ width: '100px' }}
              >
                <MenuItem value="USD">USD</MenuItem>
                <MenuItem value="CDF">CDF</MenuItem>
                <MenuItem value="EUR">EUR</MenuItem>
              </TextField>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Annuler</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            Créer
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
