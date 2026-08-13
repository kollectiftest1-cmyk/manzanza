"use client"

import { useState, useEffect } from "react"
import { Container, Row, Col, Card, Button, Badge, Tab, Tabs, ListGroup, Form, Spinner, Alert } from "react-bootstrap"
import { useParams, Link } from "react-router-dom"
import { getAuditoireDetail, getAuditoireStudents, getAuditoireCourses } from "../services/auditoireService"
import { motion } from "framer-motion"
import { FiUsers, FiBook, FiUserCheck, FiCalendar, FiMessageCircle, FiArrowLeft, FiEye, FiAward } from "react-icons/fi"

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

const AuditoireDetail = () => {
  const { id } = useParams()
  const [auditoire, setAuditoire] = useState(null)
  const [students, setStudents] = useState([])
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState("cours")

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [auditoireRes, studentsRes, coursesRes] = await Promise.all([
          getAuditoireDetail(id),
          getAuditoireStudents(id),
          getAuditoireCourses(id)
        ])
        setAuditoire(auditoireRes.data)
        setStudents(studentsRes.data)
        setCourses(coursesRes.data)
      } catch (err) {
        setError("Impossible de charger les détails de l'auditoire.")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  if (loading) {
    return (
      <Container fluid style={{ padding: '24px', background: 'var(--color-bodyBg)', minHeight: '100vh' }}>
        <div className="text-center" style={{ paddingTop: '100px' }}>
          <Spinner animation="border" style={{ color: 'var(--color-primary)' }} />
          <p style={{ marginTop: '16px', color: 'var(--color-textSecondary)' }}>Chargement des détails de l'auditoire...</p>
        </div>
      </Container>
    )
  }

  if (error) {
    return (
      <Container fluid style={{ padding: '24px', background: 'var(--color-bodyBg)', minHeight: '100vh' }}>
        <Alert variant="danger" style={{ background: 'var(--color-cardBg)', border: '1px solid #dc3545', color: 'var(--color-text)', borderRadius: '12px' }}>
          {error}
        </Alert>
      </Container>
    )
  }

  if (!auditoire) {
    return (
      <Container fluid style={{ padding: '24px', background: 'var(--color-bodyBg)', minHeight: '100vh' }}>
        <Alert variant="warning" style={{ background: 'var(--color-cardBg)', border: '1px solid #ffc107', color: 'var(--color-text)', borderRadius: '12px' }}>
          Aucun auditoire trouvé.
        </Alert>
      </Container>
    )
  }

  return (
    <Container fluid style={{ padding: '24px', background: 'var(--color-bodyBg)', minHeight: '100vh' }}>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div variants={itemVariants} style={{ marginBottom: '24px' }}>
          <div style={{
            padding: '24px',
            background: 'var(--color-cardBg)',
            borderRadius: '16px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            border: '1px solid var(--color-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div>
              <h2 style={{
                margin: '0 0 12px 0',
                fontSize: '1.8rem',
                fontWeight: '700',
                color: 'var(--color-text)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <FiUsers size={32} style={{ color: 'var(--color-primary)' }} />
                {auditoire.nom}
              </h2>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <Badge bg="info" style={{ padding: '6px 12px', fontSize: '0.9rem' }}>{auditoire.niveau}</Badge>
                <Badge bg="success" style={{ padding: '6px 12px', fontSize: '0.9rem' }}>{auditoire.filiere_name}</Badge>
              </div>
            </div>
            <Link
              to="/auditoires"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                background: 'transparent',
                color: 'var(--color-text)',
                textDecoration: 'none',
                fontWeight: '600',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--color-primary)'
                e.currentTarget.style.color = 'white'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = 'var(--color-text)'
              }}
            >
              <FiArrowLeft />
              Retour
            </Link>
          </div>
        </motion.div>

        {/* Statistics Cards */}
        <Row style={{ marginBottom: '24px' }}>
          <Col md={4}>
            <motion.div variants={itemVariants}>
              <div style={{
                background: 'var(--color-cardBg)',
                borderRadius: '16px',
                padding: '24px',
                textAlign: 'center',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                border: '1px solid var(--color-border)',
                transition: 'transform 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <FiUserCheck size={40} style={{ color: 'var(--color-primary)', marginBottom: '12px' }} />
                <h3 style={{
                  fontSize: '2.5rem',
                  fontWeight: '700',
                  background: 'linear-gradient(135deg, var(--color-primary) 0%, #667eea 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  margin: '0 0 8px 0'
                }}>
                  {students.length}
                </h3>
                <p style={{ color: 'var(--color-textSecondary)', margin: 0, fontWeight: '500' }}>Étudiants Inscrits</p>
              </div>
            </motion.div>
          </Col>
          <Col md={4}>
            <motion.div variants={itemVariants}>
              <div style={{
                background: 'var(--color-cardBg)',
                borderRadius: '16px',
                padding: '24px',
                textAlign: 'center',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                border: '1px solid var(--color-border)',
                transition: 'transform 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <FiBook size={40} style={{ color: '#10b981', marginBottom: '12px' }} />
                <h3 style={{
                  fontSize: '2.5rem',
                  fontWeight: '700',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  margin: '0 0 8px 0'
                }}>
                  {courses.length}
                </h3>
                <p style={{ color: 'var(--color-textSecondary)', margin: 0, fontWeight: '500' }}>Cours Actifs</p>
              </div>
            </motion.div>
          </Col>
          <Col md={4}>
            <motion.div variants={itemVariants}>
              <div style={{
                background: 'var(--color-cardBg)',
                borderRadius: '16px',
                padding: '24px',
                textAlign: 'center',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                border: '1px solid var(--color-border)',
                transition: 'transform 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <FiAward size={40} style={{ color: '#f59e0b', marginBottom: '12px' }} />
                <h3 style={{
                  fontSize: '2.5rem',
                  fontWeight: '700',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  margin: '0 0 8px 0'
                }}>
                  {courses.reduce((total, cours) => total + cours.credits, 0)}
                </h3>
                <p style={{ color: 'var(--color-textSecondary)', margin: 0, fontWeight: '500' }}>Total Crédits</p>
              </div>
            </motion.div>
          </Col>
        </Row>

        {/* Tabs Section */}
        <motion.div variants={itemVariants}>
          <div style={{
            background: 'var(--color-cardBg)',
            borderRadius: '16px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            border: '1px solid var(--color-border)',
            overflow: 'hidden'
          }}>
            <div style={{ padding: '24px' }}>
              <Tabs
                activeKey={activeTab}
                onSelect={setActiveTab}
                style={{ marginBottom: '24px' }}
              >
                <Tab
                  eventKey="cours"
                  title={
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}>
                      <FiBook />
                      Cours
                    </span>
                  }
                >
                  <Row>
                    {courses.map((cours) => (
                      <Col md={6} lg={4} key={cours.id} className="mb-3">
                        <motion.div
                          whileHover={{ y: -5 }}
                          transition={{ duration: 0.2 }}
                          style={{ height: '100%' }}
                        >
                          <div style={{
                            height: '100%',
                            background: 'var(--color-bodyBg)',
                            borderRadius: '12px',
                            border: '1px solid var(--color-border)',
                            padding: '20px',
                            transition: 'all 0.3s ease'
                          }}>
                            <h6 style={{ color: 'var(--color-text)', fontWeight: '700', marginBottom: '12px' }}>
                              {cours.name}
                            </h6>
                            <p style={{
                              color: 'var(--color-textSecondary)',
                              fontSize: '0.9rem',
                              marginBottom: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px'
                            }}>
                              <FiUserCheck size={16} />
                              {cours.teacher_name}
                            </p>
                            <div style={{ marginBottom: '16px' }}>
                              <Badge bg="info" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                                {cours.credits} crédits
                              </Badge>
                            </div>
                            <Link
                              to={`/courses/${cours.id}`}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '8px 16px',
                                borderRadius: '8px',
                                border: '1px solid var(--color-primary)',
                                background: 'transparent',
                                color: 'var(--color-primary)',
                                textDecoration: 'none',
                                fontSize: '0.9rem',
                                fontWeight: '600',
                                transition: 'all 0.2s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'var(--color-primary)'
                                e.currentTarget.style.color = 'white'
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent'
                                e.currentTarget.style.color = 'var(--color-primary)'
                              }}
                            >
                              <FiEye size={16} />
                              Voir Détails
                            </Link>
                          </div>
                        </motion.div>
                      </Col>
                    ))}
                  </Row>
                </Tab>

                <Tab
                  eventKey="etudiants"
                  title={
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}>
                      <FiUserCheck />
                      Étudiants
                    </span>
                  }
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {students.map((etudiant) => (
                      <div
                        key={etudiant.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '16px',
                          background: 'var(--color-bodyBg)',
                          borderRadius: '12px',
                          border: '1px solid var(--color-border)',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(8px)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
                      >
                        <div>
                          <h6 style={{ margin: '0 0 4px 0', color: 'var(--color-text)', fontWeight: '600' }}>
                            {etudiant.name}
                          </h6>
                          <small style={{ color: 'var(--color-textSecondary)' }}>
                            Matricule: {etudiant.matricule || 'N/A'}
                          </small>
                        </div>
                        <Button
                          as={Link}
                          to={`/profile/${etudiant.id}`}
                          variant="outline-primary"
                          size="sm"
                          style={{
                            borderRadius: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontWeight: '600'
                          }}
                        >
                          <FiEye size={16} />
                          Voir le profil
                        </Button>
                      </div>
                    ))}
                  </div>
                </Tab>

                <Tab
                  eventKey="planning"
                  title={
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}>
                      <FiCalendar />
                      Planning
                    </span>
                  }
                >
                  <div style={{
                    textAlign: 'center',
                    padding: '60px 20px',
                    color: 'var(--color-textSecondary)'
                  }}>
                    <FiCalendar size={64} style={{ marginBottom: '16px', opacity: 0.5 }} />
                    <p>Fonctionnalité de planning à venir.</p>
                  </div>
                </Tab>

                <Tab
                  eventKey="chat"
                  title={
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px' }}>
                      <FiMessageCircle />
                      Discussion
                    </span>
                  }
                >
                  <div style={{
                    textAlign: 'center',
                    padding: '60px 20px',
                    color: 'var(--color-textSecondary)'
                  }}>
                    <FiMessageCircle size={64} style={{ marginBottom: '16px', opacity: 0.5 }} />
                    <p>Fonctionnalité de discussion à venir.</p>
                  </div>
                </Tab>
              </Tabs>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </Container>
  )
}

export default AuditoireDetail
