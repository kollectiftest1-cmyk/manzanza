import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import { fetchStudents } from '../store/slices/usersSlice';
import { Container, Row, Col, Card, Table, Spinner, Alert, Badge } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { FiUsers, FiUser, FiMail, FiHash, FiLayers, FiBookOpen, FiEdit, FiEye, FiDollarSign, FiFileText } from 'react-icons/fi';
import FilterBar from '../components/FilterBar';
import { ButtonGroup } from 'react-bootstrap';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

const StudentListPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { students } = useSelector((state) => state.users);
  const { user } = useSelector((state) => state.auth);
  const { loading, list: studentList, error } = students;
  const [currentFilters, setCurrentFilters] = useState({});

  const params = useParams();
  const location = useLocation();
  const studentForFiliere= studentList.filter(stu=>stu?.filiere?.id==params.filiereId);
  const studentForSection= studentList.filter(stu=>stu?.section?.id==params.sectionId);

  // Configuration des filtres pour les étudiants
  const filterConfig = [
    { name: 'annee_academique', label: 'Année Académique', type: 'text', placeholder: '2024-2025', width: 3 },
    { name: 'section', label: 'Section (Faculté)', type: 'select', width: 3 },
    { name: 'filiere', label: 'Filière (Département)', type: 'select', width: 3 },
    { name: 'auditoire', label: 'Auditoire', type: 'select', width: 3 },
    { name: 'niveau', label: 'Niveau d\'étude', type: 'select', width: 3 },
    { name: 'vacation', label: 'Vacation', type: 'select', width: 3 },
    { name: 'sexe', label: 'Sexe', type: 'select', width: 3 },
    { name: 'search', label: 'Recherche', type: 'text', placeholder: 'Nom, prénom, email...', width: 3 },
  ];

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const filters = {};

    // Extract filters from route params
    if (params.auditoireId) filters.auditoire = params.auditoireId;
    if (params.filiereId) filters.filiere = params.filiereId;
    if (params.sectionId) filters.section = params.sectionId;

    // Extract filters from query params
    queryParams.forEach((value, key) => {
      filters[key] = value;
    });

    setCurrentFilters(filters);
    dispatch(fetchStudents(filters));
  }, [dispatch, params, location.search]);

  const handleFilterChange = (newFilters) => {
    // Construire les query params
    const queryParams = new URLSearchParams();
    Object.keys(newFilters).forEach(key => {
      if (newFilters[key]) {
        queryParams.set(key, newFilters[key]);
      }
    });

    // Naviguer avec les nouveaux filtres
    navigate(`?${queryParams.toString()}`);
  };

  if (loading) {
    return (
      <Container fluid style={{ padding: '24px', background: 'var(--color-bodyBg)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <Spinner animation="border" style={{ color: 'var(--color-primary)', width: '3rem', height: '3rem' }} />
          <p style={{ marginTop: '16px', color: 'var(--color-textSecondary)', fontSize: '16px' }}>Chargement des étudiants...</p>
        </div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container fluid style={{ padding: '24px', background: 'var(--color-bodyBg)', minHeight: '100vh' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Alert variant="danger" style={{ maxWidth: '800px', margin: '40px auto', borderRadius: '12px', padding: '20px' }}>
            <strong>Erreur :</strong> {error}
          </Alert>
        </motion.div>
      </Container>
    );
  }

  return (
    <Container fluid style={{ padding: '24px', background: 'var(--color-bodyBg)', minHeight: '100vh' }}>
      <motion.div 
        variants={containerVariants} 
        initial="hidden" 
        animate="visible"
      >
        {/* Header Section */}
        <motion.div variants={itemVariants} style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, var(--color-primary), #667eea)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
            }}>
              <FiUsers size={28} style={{ color: 'white' }} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '32px', fontWeight: '700', color: 'var(--color-text)' }}>
                Liste des Étudiants
              </h2>
              <p style={{ margin: 0, color: 'var(--color-textSecondary)', fontSize: '16px' }}>
                Gérez les informations détaillées des étudiants.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Barre de filtres */}
        <motion.div variants={itemVariants}>
          <FilterBar
            filters={filterConfig}
            onFilterChange={handleFilterChange}
            initialValues={currentFilters}
          />
        </motion.div>

        {/* Students Table Card */}
        <motion.div variants={itemVariants}>
          <Card style={{ 
            background: 'var(--color-cardBg)', 
            border: '1px solid var(--color-border)', 
            borderRadius: '16px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <Card.Header style={{ 
              background: 'linear-gradient(135deg, var(--color-primary), #667eea)',
              color: 'white',
              padding: '20px 24px',
              borderBottom: 'none',
              borderTopLeftRadius: '16px',
              borderTopRightRadius: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <FiUsers size={24} />
                  <h5 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>Étudiants</h5>
                </div>
                <Badge bg="light" text="dark" style={{ fontSize: '16px', padding: '8px 16px', borderRadius: '8px' }}>
                  {studentList.length}
                </Badge>
              </div>
            </Card.Header>
            <Card.Body style={{ padding: '24px' }}>
              {studentList.length === 0 ? (
                <Alert variant="info" style={{ borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
                  <FiUsers size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                  <p style={{ margin: 0, fontSize: '16px' }}>Aucun étudiant trouvé avec les filtres appliqués.</p>
                </Alert>
              ) : (
                <div style={{ overflowX: 'auto', borderRadius: '12px' }}>
                  <Table responsive hover style={{
                    marginBottom: 0,
                    border: '1px solid var(--color-border)',
                    borderRadius: '12px',
                    overflow: 'hidden'
                  }}>
                    <thead style={{ background: 'var(--color-bodyBg)' }}>
                      <tr>
                        <th style={{ padding: '16px', color: 'var(--color-text)', fontWeight: '600', borderBottom: '2px solid var(--color-border)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FiHash size={16} />
                            ID
                          </div>
                        </th>
                        <th style={{ padding: '16px', color: 'var(--color-text)', fontWeight: '600', borderBottom: '2px solid var(--color-border)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FiUser size={16} />
                            Nom
                          </div>
                        </th>
                        <th style={{ padding: '16px', color: 'var(--color-text)', fontWeight: '600', borderBottom: '2px solid var(--color-border)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FiUser size={16} />
                            Prénom
                          </div>
                        </th>
                        <th style={{ padding: '16px', color: 'var(--color-text)', fontWeight: '600', borderBottom: '2px solid var(--color-border)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FiMail size={16} />
                            Email
                          </div>
                        </th>
                        <th style={{ padding: '16px', color: 'var(--color-text)', fontWeight: '600', borderBottom: '2px solid var(--color-border)', textAlign: 'center' }}>
                          Actions
                        </th>
                        <th style={{ padding: '16px', color: 'var(--color-text)', fontWeight: '600', borderBottom: '2px solid var(--color-border)' }}>Matricule</th>
                        <th style={{ padding: '16px', color: 'var(--color-text)', fontWeight: '600', borderBottom: '2px solid var(--color-border)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FiLayers size={16} />
                            Auditoire
                          </div>
                        </th>
                        <th style={{ padding: '16px', color: 'var(--color-text)', fontWeight: '600', borderBottom: '2px solid var(--color-border)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FiBookOpen size={16} />
                            Filière
                          </div>
                        </th>
                        <th style={{ padding: '16px', color: 'var(--color-text)', fontWeight: '600', borderBottom: '2px solid var(--color-border)' }}>Section</th>
                        <th style={{ padding: '16px', color: 'var(--color-text)', fontWeight: '600', borderBottom: '2px solid var(--color-border)' }}>Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentList.map((student, index) => (
                        <motion.tr 
                          key={student.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          style={{ 
                            background: index % 2 === 0 ? 'var(--color-cardBg)' : 'var(--color-bodyBg)',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <td style={{ padding: '16px', color: 'var(--color-textSecondary)', borderBottom: '1px solid var(--color-border)' }}>{student.id}</td>
                          <td style={{ padding: '16px', color: 'var(--color-text)', fontWeight: '500', borderBottom: '1px solid var(--color-border)' }}>{student.last_name}</td>
                          <td style={{ padding: '16px', color: 'var(--color-text)', fontWeight: '500', borderBottom: '1px solid var(--color-border)' }}>{student.first_name}</td>
                          <td style={{ padding: '16px', color: 'var(--color-textSecondary)', borderBottom: '1px solid var(--color-border)' }}>{student.email}</td>
                          <td style={{ padding: '16px', borderBottom: '1px solid var(--color-border)', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                              <button
                                onClick={() => navigate(`/profile/${student.id}`)}
                                title="Voir profil"
                                style={{ background: 'none', border: '1px solid var(--color-primary)', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', color: 'var(--color-primary)' }}
                              >
                                <FiEye size={14} />
                              </button>
                              <button
                                onClick={() => navigate(`/paiements?student=${student.id}`)}
                                title="Paiements"
                                style={{ background: 'none', border: '1px solid #28a745', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', color: '#28a745' }}
                              >
                                <FiDollarSign size={14} />
                              </button>
                              <button
                                onClick={() => navigate(`/releves-cotes?student=${student.id}`)}
                                title="Relevé de notes"
                                style={{ background: 'none', border: '1px solid #6c757d', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', color: '#6c757d' }}
                              >
                                <FiFileText size={14} />
                              </button>
                            </div>
                          </td>
                          <td style={{ padding: '16px', color: 'var(--color-textSecondary)', borderBottom: '1px solid var(--color-border)' }}>{student.matricule || 'N/A'}</td>
                          <td style={{ padding: '16px', color: 'var(--color-textSecondary)', borderBottom: '1px solid var(--color-border)' }}>{student.auditoire_name || 'N/A'}</td>
                          <td style={{ padding: '16px', color: 'var(--color-textSecondary)', borderBottom: '1px solid var(--color-border)' }}>{student?.filiere?.nom || 'N/A'}</td>
                          <td style={{ padding: '16px', color: 'var(--color-textSecondary)', borderBottom: '1px solid var(--color-border)' }}>{student?.section?.nom || 'N/A'}</td>
                          <td style={{ padding: '16px', borderBottom: '1px solid var(--color-border)' }}>
                            <Badge 
                              bg={student.status === 'active' ? 'success' : 'secondary'} 
                              style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '13px' }}
                            >
                              {student.status}
                            </Badge>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        </motion.div>
      </motion.div>
    </Container>
  );
};

export default StudentListPage;
