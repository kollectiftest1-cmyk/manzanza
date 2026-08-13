'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Alert, Tabs, Tab } from '@mui/material';
import LeaveList from '@/components/RH/LeaveList';
import { getLeaves } from '@/services/hrService';

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`leave-tabpanel-${index}`}
      aria-labelledby={`leave-tab-${index}`}
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

export default function HrLeavesPage() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);

  const fetchLeaves = async () => {
    try {
      const response = await getLeaves();
      setLeaves(response.data.results || response.data);
    } catch (err) {
      setError('Erreur lors du chargement des congés.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const refreshData = () => {
    fetchLeaves();
  };

  return (
    <Box sx={{ width: '100%', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Gestion des Congés
      </Typography>

      {error && <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>}

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="Onglets de gestion des congés">
          <Tab label="Tous les Congés" id="leave-tab-0" />
        </Tabs>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TabPanel value={tabValue} index={0}>
          <LeaveList leaves={leaves} onRefresh={refreshData} />
        </TabPanel>
      )}
    </Box>
  );
}
