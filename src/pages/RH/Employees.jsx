'use client';

import React, { useState, useEffect } from 'react';
import { Tabs, Tab, Box, Typography, CircularProgress, Alert } from '@mui/material';
import EmployeeList from '@/components/RH/EmployeeList';
import PotentialEmployeeList from '@/components/RH/PotentialEmployeeList';
import { getEmployees, getPotentialEmployees } from '@/services/hrService';

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`hr-tabpanel-${index}`}
      aria-labelledby={`hr-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function HrEmployeePage() {
  const [tabValue, setTabValue] = useState(0);
  const [employees, setEmployees] = useState([]);
  const [potentialEmployees, setPotentialEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEmployees = async () => {
    try {
      const response = await getEmployees();
      setEmployees(response.data.results || response.data);
    } catch (err) {
      setError('Erreur lors du chargement des employés.');
      console.error(err);
    }
  };

  const fetchPotentialEmployees = async () => {
    try {
      const response = await getPotentialEmployees();
      setPotentialEmployees(response.data);
    } catch (err) {
      setError('Erreur lors du chargement des employés potentiels.');
      console.error(err);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    await Promise.all([fetchEmployees(), fetchPotentialEmployees()]);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const refreshData = () => {
    fetchData();
  };

  return (
    <Box sx={{ width: '100%', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Gestion des Employés
      </Typography>

      {error && <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>}

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="Onglets de gestion RH">
          <Tab label="Employés Actuels" id="hr-tab-0" />
          <Tab label="Employés Potentiels" id="hr-tab-1" />
        </Tabs>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <TabPanel value={tabValue} index={0}>
            <EmployeeList employees={employees} onRefresh={refreshData} />
          </TabPanel>
          <TabPanel value={tabValue} index={1}>
            <PotentialEmployeeList potentialEmployees={potentialEmployees} onRefresh={refreshData} />
          </TabPanel>
        </>
      )}
    </Box>
  );
}
