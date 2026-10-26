"use client"

import { useState, useEffect } from "react"
import { Container, Row, Col, Card, Table, Button, Badge, Alert, Spinner, Tab, Tabs, Nav } from "react-bootstrap"
import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import { FiClipboard, FiEye, FiCheck, FiX, FiClock, FiCheckCircle, FiXCircle, FiMail, FiCalendar } from "react-icons/fi"
import api from "../services/api"

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

const GestionInscriptions = () => {
  const [inscriptions, setInscriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('en_attente')

  const fetchInscriptions = async () => {
    try {
      setLoading(true)
      const res = await api.get("/inscriptions/", { params: { page_size: 500 } })
      setInscriptions(res.data.results || res.data)
    } catch (err) {
      setError("Impossible de charger les demandes d'inscription.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInscriptions()
  }, [])

  const filteredInscriptions = inscriptions.filter(i => i.status === activeTab)

  const renderTable = () => (
    <div style={{ overflowX: 'auto', borderRadius: '12px' }}>
      <Table responsive hover style={{
        marginBottom: 0,
        border: '1px solid var(--color-border)',
        borderRadius: '12px',
        overflow: 'hidden'
      }}>
        <thead style={{ background: 'var(--color-bodyBg)' }}>
          <tr>
            <th style={{ padding: '16px', color: 'var(--color-text)', fontWeight: '600', borderBottom: '2px solid var(--color-border)' }}>Nom Complet</th>
            <th style={{ padding: '16px', color: 'var(--color-text)', fontWeight: '600', borderBottom: '2px solid var(--color-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FiMail size={16} />
                Email
              </div>
            </th>
            <th style={{ padding: '16px', color: 'var(--color-text)', fontWeight: '600', borderBottom: '2px solid var(--color-border)' }}>Filière</th>
            <th style={{ padding: '16px', color: 'var(--color-text)', fontWeight: '600', borderBottom: '2px solid var(--color-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FiCalendar size={16} />
                Date de la demande
              </div>
            </th>
            <th style={{ padding: '16px', color: 'var(--color-text)', fontWeight: '600', borderBottom: '2px solid var(--color-border)' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredInscriptions.length > 0 ? (
            filteredInscriptions.map((item, index) => (
              <motion.tr 
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                style={{ 
                  background: index % 2 === 0 ? 'var(--color-cardBg)' : 'var(--color-bodyBg)',
                  transition: 'all 0.2s ease'
                }}
              >
                <td style={{ padding: '16px', color: 'var(--color-text)', fontWeight: '500', borderBottom: '1px solid var(--color-border)' }}>
                  {item.first_name} {item.last_name}
                </td>
                <td style={{ padding: '16px', color: 'var(--color-textSecondary)', borderBottom: '1px solid var(--color-border)' }}>{item.email}</td>
                <td style={{ padding: '16px', borderBottom: '1px solid var(--color-border)' }}>
                  <Badge bg="primary" style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '13px' }}>
                    {item.filiere_name}
                  </Badge>
                </td>
                <td style={{ padding: '16px', color: 'var(--color-textSecondary)', borderBottom: '1px solid var(--color-border)' }}>
                  {new Date(item.created_at).toLocaleDateString()}
                </td>
                <td style={{ padding: '16px', borderBottom: '1px solid var(--color-border)' }}>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <Button 
                      as={Link} 
                      to={`/gestion-inscriptions/${item.id}`} 
                      variant="info" 
                      size="sm"
                      style={{ borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <FiEye size={14} /> Voir
                    </Button>
                    {activeTab === 'en_attente' && (
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <span className={`mz-pill ${item.dossier_status === 'conforme' ? 'mz-pill--success' : 'mz-pill--warning'}`}>
                          Pièces : {{ a_verifier: 'à vérifier', conforme: 'conformes', a_completer: 'à compléter' }[item.dossier_status] || '—'}
                        </span>
                        <span className={`mz-pill ${item.frais_dossier_paye ? 'mz-pill--success' : 'mz-pill--warning'}`}>
                          Frais : {item.frais_dossier_paye ? 'payés' : 'non payés'}
                        </span>
                        {item.commission_decision === 'liste_attente' && <span className="mz-pill mz-pill--info">Liste d'attente</span>}
                      </div>
                    )}
                  </div>
                </td>
              </motion.tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--color-textSecondary)', borderBottom: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <FiClipboard size={48} style={{ opacity: 0.3 }} />
                  <span>Aucune inscription dans cette catégorie.</span>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    </div>
  )

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
              background: 'linear-gradient(135deg, #fa709a, #fee140)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
            }}>
              <FiClipboard size={28} style={{ color: 'white' }} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '32px', fontWeight: '700', color: 'var(--color-text)' }}>
                Gestion des Inscriptions
              </h2>
              <p style={{ margin: 0, color: 'var(--color-textSecondary)', fontSize: '16px' }}>
                Consultez, validez ou rejetez les nouvelles demandes d'inscription.
              </p>
            </div>
          </div>
        </motion.div>

        {error && (
          <motion.div variants={itemVariants} style={{ marginBottom: '24px' }}>
            <Alert variant="danger" style={{ borderRadius: '12px', padding: '16px' }}>{error}</Alert>
          </motion.div>
        )}

        <motion.div variants={itemVariants}>
          <Card style={{ 
            background: 'var(--color-cardBg)', 
            border: '1px solid var(--color-border)', 
            borderRadius: '16px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <Card.Body style={{ padding: '24px' }}>
              <Nav variant="tabs" style={{ borderBottom: '2px solid var(--color-border)', marginBottom: '24px' }}>
                <Nav.Item>
                  <Nav.Link 
                    active={activeTab === 'en_attente'}
                    onClick={() => setActiveTab('en_attente')}
                    style={{
                      cursor: 'pointer',
                      padding: '12px 24px',
                      border: 'none',
                      borderBottom: activeTab === 'en_attente' ? '3px solid #ffc107' : '3px solid transparent',
                      background: 'transparent',
                      color: activeTab === 'en_attente' ? 'var(--color-text)' : 'var(--color-textSecondary)',
                      fontWeight: activeTab === 'en_attente' ? '600' : '400',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <FiClock size={18} />
                    <span>En attente</span>
                    <Badge bg="warning" text="dark" style={{ marginLeft: '8px', padding: '4px 8px', borderRadius: '6px' }}>
                      {inscriptions.filter(i => i.status === 'en_attente').length}
                    </Badge>
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link 
                    active={activeTab === 'validee'}
                    onClick={() => setActiveTab('validee')}
                    style={{
                      cursor: 'pointer',
                      padding: '12px 24px',
                      border: 'none',
                      borderBottom: activeTab === 'validee' ? '3px solid #28a745' : '3px solid transparent',
                      background: 'transparent',
                      color: activeTab === 'validee' ? 'var(--color-text)' : 'var(--color-textSecondary)',
                      fontWeight: activeTab === 'validee' ? '600' : '400',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <FiCheckCircle size={18} />
                    <span>Validées</span>
                    <Badge bg="success" style={{ marginLeft: '8px', padding: '4px 8px', borderRadius: '6px' }}>
                      {inscriptions.filter(i => i.status === 'validee').length}
                    </Badge>
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link 
                    active={activeTab === 'rejetee'}
                    onClick={() => setActiveTab('rejetee')}
                    style={{
                      cursor: 'pointer',
                      padding: '12px 24px',
                      border: 'none',
                      borderBottom: activeTab === 'rejetee' ? '3px solid #dc3545' : '3px solid transparent',
                      background: 'transparent',
                      color: activeTab === 'rejetee' ? 'var(--color-text)' : 'var(--color-textSecondary)',
                      fontWeight: activeTab === 'rejetee' ? '600' : '400',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <FiXCircle size={18} />
                    <span>Rejetées</span>
                    <Badge bg="danger" style={{ marginLeft: '8px', padding: '4px 8px', borderRadius: '6px' }}>
                      {inscriptions.filter(i => i.status === 'rejetee').length}
                    </Badge>
                  </Nav.Link>
                </Nav.Item>
              </Nav>

              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <Spinner animation="border" style={{ color: 'var(--color-primary)', width: '3rem', height: '3rem' }} />
                  <p style={{ marginTop: '16px', color: 'var(--color-textSecondary)' }}>Chargement des inscriptions...</p>
                </div>
              ) : (
                renderTable()
              )}
            </Card.Body>
          </Card>
        </motion.div>
      </motion.div>
    </Container>
  )
}

export default GestionInscriptions
