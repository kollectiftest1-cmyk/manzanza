'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Alert, Tabs, Tab } from '@mui/material';
import ContractList from '@/components/RH/ContractList';
import { getContracts } from '@/services/hrService';

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`contract-tabpanel-${index}`}
      aria-labelledby={`contract-tab-${index}`}
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

export default function HrContractsPage() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);

  const fetchContracts = async () => {
    try {
      const response = await getContracts();
      setContracts(response.data.results || response.data);
    } catch (err) {
      setError('Erreur lors du chargement des contrats.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const refreshData = () => {
    fetchContracts();
  };

  return (
    <Box sx={{ width: '100%', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Gestion des Contrats
      </Typography>

      {error && <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>}

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="Onglets de gestion des contrats">
          <Tab label="Tous les Contrats" id="contract-tab-0" />
        </Tabs>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TabPanel value={tabValue} index={0}>
          <ContractList contracts={contracts} onRefresh={refreshData} />
        </TabPanel>
      )}
    </Box>
  );
}
