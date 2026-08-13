'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Alert, Tabs, Tab } from '@mui/material';
import PayrollList from '@/components/RH/PayrollList';
import { getPayrolls } from '@/services/hrService';

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`payroll-tabpanel-${index}`}
      aria-labelledby={`payroll-tab-${index}`}
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

export default function HrPayrollsPage() {
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0); // Only one tab for now, but ready for more

  const fetchPayrolls = async () => {
    try {
      const response = await getPayrolls();
      setPayrolls(response.data.results || response.data);
    } catch (err) {
      setError('Erreur lors du chargement des fiches de paie.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrolls();
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const refreshData = () => {
    fetchPayrolls();
  };

  return (
    <Box sx={{ width: '100%', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Gestion des Fiches de Paie
      </Typography>

      {error && <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>}

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="Onglets de gestion des paies">
          <Tab label="Toutes les Paies" id="payroll-tab-0" />
        </Tabs>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TabPanel value={tabValue} index={0}>
          <PayrollList payrolls={payrolls} onRefresh={refreshData} />
        </TabPanel>
      )}
    </Box>
  );
}
